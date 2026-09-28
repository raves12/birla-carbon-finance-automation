// Unified exception framework (Phase 16) for the AP and AR exception
// tables. Both tables carry the same framework fields (number, process,
// type/subtype, severity, priority, owner, group, status, SLA due/status,
// opened, aging, escalation, evidence, rule result, AI explanation /
// recommendation / confidence, resolution code/notes/by/date, correlation
// id), and every lifecycle step goes through this one engine:
//   create     number, severity, priority, SLA, assignment, correlation id,
//              audit, "assigned" notification event
//   resolve    status, resolution code/notes, resolved by/at, SLA met/missed
//   sweep      (hourly job) aging bucket, SLA at risk/breached, escalation
//              level 1 at breach and level 2 at twice the SLA, with priority
//              raised, audit and "escalated" notification events
//   AI advice  explanation and confidence split out of the advisory note
// The per-process tables stay the system of record (the AP and AR agentic
// workflows trigger on them); the framework is shared code and fields.
var ExceptionEngine = Class.create();

ExceptionEngine.PROCESS = {
    ap: { table: 'x_695068_bcfa_ap_exception', parentField: 'ap_invoice', parentTable: 'x_695068_bcfa_ap_invoice', label: 'AP' },
    ar: { table: 'x_695068_bcfa_ar_exception', parentField: 'payment', parentTable: 'x_695068_bcfa_payment', label: 'AR' }
};
ExceptionEngine.PRIORITY_BY_SEVERITY = { critical: '1', high: '2', medium: '3', low: '4' };
ExceptionEngine.OPEN_STATUSES = 'open,in_review';
ExceptionEngine.AT_RISK_RATIO = 0.75;
// Escalation group for level 2 (twice the SLA): BCFA Finance Controllers.
ExceptionEngine.LEVEL2_GROUP = 'f1c12aaee7e9ac7e31fc871b0eca266b';

ExceptionEngine.prototype = {
    initialize: function() {
        this.audit = new AuditEngine();
    },

    // ---- Create ------------------------------------------------------------

    // details (optional): { ruleResult, evidence, varianceAmount, variancePct,
    // subtype }. Everything is set in the one insert, because the BCFA AP
    // Invoice Review agentic workflow triggers on creation and must see the
    // full deterministic evidence.
    createApException: function(apInvoiceSysId, reasonCode, description, details) {
        details = details || {};
        var policy = new FinancePolicy();
        var severity = policy.apExceptionSeverity(reasonCode, details.varianceAmount);
        var gr = new GlideRecord('x_695068_bcfa_ap_exception');
        gr.initialize();
        gr.setValue('ap_invoice', apInvoiceSysId);
        this._common(gr, 'ap', reasonCode, description, details, severity, policy.apExceptionDueDate(severity),
            policy.apExceptionAssignmentGroup(), policy.apExceptionDefaultOwner());
        if (details.varianceAmount !== undefined && details.varianceAmount !== null) gr.setValue('variance_amount', details.varianceAmount);
        if (details.variancePct !== undefined && details.variancePct !== null) gr.setValue('variance_pct', Math.round(details.variancePct * 10000) / 100);
        return this._insert(gr, 'ap', { ap_invoice: apInvoiceSysId, variance_amount: details.varianceAmount });
    },

    // details (optional): { ruleResult, evidence, residual, subtype,
    // suggestedDeductionType, creditNote }. Same approach as AP: the BCFA
    // Cash Application Review workflow triggers on creation.
    createArException: function(paymentSysId, reasonCode, description, details) {
        details = details || {};
        var policy = new FinancePolicy();
        var severity = policy.arExceptionSeverity(reasonCode, details.residual);
        var gr = new GlideRecord('x_695068_bcfa_ar_exception');
        gr.initialize();
        gr.setValue('payment', paymentSysId);
        this._common(gr, 'ar', reasonCode, description, details, severity, policy.arExceptionDueDate(severity),
            policy.arExceptionAssignmentGroup(), policy.arExceptionDefaultOwner());
        if (details.residual !== undefined && details.residual !== null) gr.setValue('residual_amount', details.residual);
        // Deterministic rule suggestion (Phase 14); the reviewer may change it.
        if (details.suggestedDeductionType) gr.setValue('deduction_type', details.suggestedDeductionType);
        if (details.creditNote) gr.setValue('credit_note', details.creditNote);
        return this._insert(gr, 'ar', { payment: paymentSysId, residual_amount: details.residual });
    },

    _common: function(gr, process, reasonCode, description, details, severity, due, group, owner) {
        var now = new GlideDateTime();
        gr.setValue('number', this.nextNumber(process));
        gr.setValue('process', process);
        gr.setValue('reason_code', reasonCode);
        if (details.subtype) gr.setValue('subtype', details.subtype);
        gr.setValue('description', description || '');
        gr.setValue('severity', severity);
        gr.setValue('priority', ExceptionEngine.PRIORITY_BY_SEVERITY[severity] || '3');
        gr.setValue('opened_at', now.getValue());
        gr.setValue('sla_due', due.getValue());
        gr.setValue('sla_status', 'on_track');
        gr.setValue('aging_bucket', 'lt_1d');
        gr.setValue('escalation_level', 0);
        if (group) gr.setValue('assignment_group', group);
        if (owner) gr.setValue('assigned_to', owner);
        gr.setValue('rule_result', details.ruleResult || description || '');
        if (details.evidence) gr.setValue('evidence', details.evidence);
        gr.setValue('correlation_id', this._parentCorrelation(process, gr.getValue(ExceptionEngine.PROCESS[process].parentField)));
        gr.setValue('status', 'open');
    },

    _insert: function(gr, process, extra) {
        var sysId = gr.insert();
        var after = { number: gr.getValue('number'), reason_code: gr.getValue('reason_code'), severity: gr.getValue('severity'),
            priority: gr.getValue('priority'), sla_due: gr.getValue('sla_due'), assignment_group: gr.getValue('assignment_group'), assigned_to: gr.getValue('assigned_to') };
        for (var k in extra) after[k] = extra[k];
        this.audit.logEvent({
            correlationId: gr.getValue('correlation_id'),
            sourceTable: ExceptionEngine.PROCESS[process].table,
            sourceRecord: sysId,
            eventType: 'exception_created',
            actorType: 'system',
            description: ExceptionEngine.PROCESS[process].label + ' exception ' + gr.getValue('number') + ' raised: ' + gr.getValue('reason_code') +
                ', severity ' + gr.getValue('severity') + ', priority ' + gr.getValue('priority') + ', SLA due ' + gr.getValue('sla_due') +
                '. ' + (gr.getValue('rule_result') || ''),
            afterValue: after
        });
        this._notify(process, gr, 'assigned', gr.getValue('assigned_to'), '');
        return sysId;
    },

    // Next number from the sys_number counter of the table (APEX / AREX).
    // Without a counter the number is still unique and traceable.
    nextNumber: function(process) {
        var table = ExceptionEngine.PROCESS[process].table;
        var counter = new GlideRecord('sys_number');
        counter.addQuery('category', table);
        counter.query();
        if (!counter.next()) return (process === 'ap' ? 'APEX-' : 'AREX-') + gs.generateGUID().substring(0, 8).toUpperCase();
        var next = parseInt(counter.getValue('number'), 10) + 1;
        var digits = parseInt(counter.getValue('maximum_digits') || '7', 10);
        var padded = String(next);
        while (padded.length < digits) padded = '0' + padded;
        counter.setValue('number', String(next));
        counter.update();
        return (counter.getValue('prefix') || '') + padded;
    },

    _parentCorrelation: function(process, parentSysId) {
        if (!parentSysId) return '';
        var parent = new GlideRecord(ExceptionEngine.PROCESS[process].parentTable);
        return parent.get(parentSysId) ? (parent.getValue('correlation_id') || '') : '';
    },

    // ---- Resolve -----------------------------------------------------------

    resolveApException: function(exceptionSysId, resolutionNotes, resolvedBy, resolutionCode) {
        return this.resolve('ap', exceptionSysId, { status: 'resolved', code: resolutionCode || 'corrected_and_retried', notes: resolutionNotes, resolvedBy: resolvedBy });
    },

    resolveArException: function(exceptionSysId, resolutionNotes, resolvedBy, resolutionCode) {
        return this.resolve('ar', exceptionSysId, { status: 'resolved', code: resolutionCode || 'corrected_and_retried', notes: resolutionNotes, resolvedBy: resolvedBy });
    },

    // options: { status ('resolved'|'closed'), code, notes, resolvedBy }.
    resolve: function(process, exceptionSysId, options) {
        var gr = new GlideRecord(ExceptionEngine.PROCESS[process].table);
        if (!gr.get(exceptionSysId)) return false;
        gr.setValue('status', options.status || 'resolved');
        if (options.notes !== undefined && options.notes !== null) gr.setValue('resolution_notes', options.notes);
        this.stampResolution(gr, options.code, options.resolvedBy);
        return gr.update() ? true : false;
    },

    // Sets the resolution fields on a GlideRecord the caller will update:
    // resolution code, resolved by/at, and the final SLA status. The owner
    // (assigned_to) is never overwritten.
    stampResolution: function(gr, code, resolvedBy) {
        var now = new GlideDateTime();
        if (code) gr.setValue('resolution_code', code);
        gr.setValue('resolved_by', resolvedBy || gs.getUserID());
        gr.setValue('resolved_at', now.getValue());
        if (gr.getValue('sla_due')) {
            gr.setValue('sla_status', now.compareTo(new GlideDateTime(gr.getValue('sla_due'))) <= 0 ? 'met' : 'missed');
        }
    },

    // ---- Sweep: aging, SLA, escalation --------------------------------------

    // Run hourly by the "BCFA - Exception SLA and Escalation Sweep" job.
    // Returns counts per process.
    sweep: function() {
        var result = {};
        for (var process in ExceptionEngine.PROCESS) result[process] = this._sweepTable(process);
        return result;
    },

    _sweepTable: function(process) {
        var counts = { checked: 0, atRisk: 0, breached: 0, escalated1: 0, escalated2: 0 };
        var now = new GlideDateTime();
        var gr = new GlideRecord(ExceptionEngine.PROCESS[process].table);
        gr.addQuery('status', 'IN', ExceptionEngine.OPEN_STATUSES);
        gr.query();
        while (gr.next()) {
            counts.checked++;
            var opened = new GlideDateTime(gr.getValue('opened_at') || gr.getValue('sys_created_on'));
            var ageHours = (now.getNumericValue() - opened.getNumericValue()) / 3600000;
            var changed = false;
            changed = this._set(gr, 'aging_bucket', ageHours < 24 ? 'lt_1d' : ageHours < 72 ? '1_3d' : ageHours < 168 ? '3_7d' : 'gt_7d') || changed;

            var slaStatus = 'on_track';
            var slaHours = null;
            if (gr.getValue('sla_due')) {
                var due = new GlideDateTime(gr.getValue('sla_due'));
                slaHours = (due.getNumericValue() - opened.getNumericValue()) / 3600000;
                if (now.compareTo(due) > 0) slaStatus = 'breached';
                else if (slaHours > 0 && ageHours / slaHours >= ExceptionEngine.AT_RISK_RATIO) slaStatus = 'at_risk';
            }
            changed = this._set(gr, 'sla_status', slaStatus) || changed;
            if (slaStatus === 'at_risk') counts.atRisk++;
            if (slaStatus === 'breached') counts.breached++;

            var level = parseInt(gr.getValue('escalation_level') || '0', 10);
            var targetLevel = level;
            if (slaStatus === 'breached') targetLevel = Math.max(level, 1);
            if (slaStatus === 'breached' && slaHours !== null && ageHours >= 2 * slaHours) targetLevel = 2;
            if (targetLevel > level) {
                this._escalate(process, gr, level, targetLevel, ageHours);
                changed = true;
                if (targetLevel === 1) counts.escalated1++; else counts.escalated2++;
            }
            if (changed) gr.update();
        }
        return counts;
    },

    _set: function(gr, field, value) {
        if (gr.getValue(field) === value) return false;
        gr.setValue(field, value);
        return true;
    },

    // Raises the priority one step per level and notifies: level 1 the
    // owner and assignment group, level 2 also the Finance Controllers.
    _escalate: function(process, gr, fromLevel, toLevel, ageHours) {
        var before = { escalation_level: fromLevel, priority: gr.getValue('priority') };
        var priority = Math.max(1, parseInt(gr.getValue('priority') || '3', 10) - (toLevel - fromLevel));
        gr.setValue('escalation_level', toLevel);
        gr.setValue('priority', String(priority));
        var recipients = this._groupMembers(gr.getValue('assignment_group'));
        if (gr.getValue('assigned_to')) recipients.push(gr.getValue('assigned_to'));
        if (toLevel >= 2) recipients = recipients.concat(this._groupMembers(ExceptionEngine.LEVEL2_GROUP));
        this.audit.logEvent({
            correlationId: gr.getValue('correlation_id'),
            sourceTable: ExceptionEngine.PROCESS[process].table,
            sourceRecord: gr.getUniqueValue(),
            eventType: 'state_transition',
            actorType: 'system',
            description: ExceptionEngine.PROCESS[process].label + ' exception ' + gr.getValue('number') + ' escalated to level ' + toLevel +
                ' (SLA ' + gr.getValue('sla_status') + ', open ' + Math.round(ageHours) + 'h, priority ' + before.priority + ' -> ' + priority + ').',
            beforeValue: before,
            afterValue: { escalation_level: toLevel, priority: String(priority) }
        });
        this._notify(process, gr, 'escalated', this._unique(recipients).join(','), String(toLevel));
    },

    _groupMembers: function(groupSysId) {
        var users = [];
        if (!groupSysId) return users;
        var member = new GlideRecord('sys_user_grmember');
        member.addQuery('group', groupSysId);
        member.query();
        while (member.next()) users.push(member.getValue('user'));
        return users;
    },

    _unique: function(list) {
        var out = [];
        for (var i = 0; i < list.length; i++) if (list[i] && out.indexOf(list[i]) < 0) out.push(list[i]);
        return out;
    },

    // Fires x_695068_bcfa.<ap|ar>_exception.<assigned|escalated>. The email
    // notifications on those events send to parm1 (users).
    _notify: function(process, gr, what, parm1, parm2) {
        try {
            gs.eventQueue('x_695068_bcfa.' + process + '_exception.' + what, gr, parm1 || '', parm2 || '');
        } catch (e) {
            gs.warn('BCFA ExceptionEngine: notification event failed: ' + e);
        }
    },

    // ---- AI advice ------------------------------------------------------------

    // Splits an advisory AI note into the framework's AI explanation and
    // confidence (best effort; the full note stays in ai_recommendation).
    splitAdvice: function(text) {
        text = String(text || '');
        var confidence = '';
        var c = /Confidence:\s*(High|Medium|Low)/i.exec(text);
        if (c) confidence = c[1].toLowerCase();
        var explanation = '';
        var e = /(?:^|\n)[\s\-*]*(?:Explanation|Analysis)[^\n:]*:\s*([\s\S]*?)(?=\n\s*\n|\n[\s\-*]*(?:Recommend|Recommended|Residual|Human|Draft|Customer)|$)/i.exec(text);
        if (e) explanation = e[1].trim();
        return { explanation: explanation.substring(0, 4000), confidence: confidence };
    },

    // ---- Backfill -------------------------------------------------------------

    // One-time: gives exceptions created before Phase 16 the framework
    // fields (number, process, opened, priority, correlation id, SLA due and
    // status, aging). Idempotent: only empty fields are filled.
    backfill: function() {
        var counts = {};
        var policy = new FinancePolicy();
        for (var process in ExceptionEngine.PROCESS) {
            var n = 0;
            var gr = new GlideRecord(ExceptionEngine.PROCESS[process].table);
            gr.orderBy('sys_created_on');
            gr.query();
            while (gr.next()) {
                var changed = false;
                if (!gr.getValue('number')) { gr.setValue('number', this.nextNumber(process)); changed = true; }
                if (!gr.getValue('process')) { gr.setValue('process', process); changed = true; }
                if (!gr.getValue('opened_at')) { gr.setValue('opened_at', gr.getValue('sys_created_on')); changed = true; }
                if (!gr.getValue('severity')) { gr.setValue('severity', 'medium'); changed = true; }
                if (!gr.getValue('priority')) { gr.setValue('priority', ExceptionEngine.PRIORITY_BY_SEVERITY[gr.getValue('severity')] || '3'); changed = true; }
                if (!gr.getValue('correlation_id')) {
                    var correlation = this._parentCorrelation(process, gr.getValue(ExceptionEngine.PROCESS[process].parentField));
                    if (correlation) { gr.setValue('correlation_id', correlation); changed = true; }
                }
                if (!gr.getValue('sla_due')) {
                    var hours = 24;
                    try { hours = JSON.parse(gs.getProperty('x_695068_bcfa.' + process + '.exception.sla_hours') || '{}')[gr.getValue('severity')] || 24; } catch (x) { hours = 24; }
                    var due = new GlideDateTime(gr.getValue('sys_created_on'));
                    due.addSeconds(Math.round(hours * 3600));
                    gr.setValue('sla_due', due.getValue());
                    changed = true;
                }
                if (!gr.getValue('escalation_level')) { gr.setValue('escalation_level', 0); changed = true; }
                // Open exceptions from before Phase 12 have no group or owner,
                // so escalations would notify nobody: apply the policy defaults.
                if (gr.getValue('status') === 'open' || gr.getValue('status') === 'in_review') {
                    var group = process === 'ap' ? policy.apExceptionAssignmentGroup() : policy.arExceptionAssignmentGroup();
                    var owner = process === 'ap' ? policy.apExceptionDefaultOwner() : policy.arExceptionDefaultOwner();
                    if (!gr.getValue('assignment_group') && group) { gr.setValue('assignment_group', group); changed = true; }
                    if (!gr.getValue('assigned_to') && owner) { gr.setValue('assigned_to', owner); changed = true; }
                }
                if (gr.getValue('ai_recommendation') && !gr.getValue('ai_confidence') && !gr.getValue('ai_explanation')) {
                    var split = this.splitAdvice(gr.getValue('ai_recommendation'));
                    if (split.explanation || split.confidence) {
                        gr.setValue('ai_explanation', split.explanation);
                        gr.setValue('ai_confidence', split.confidence);
                        changed = true;
                    }
                }
                var status = gr.getValue('status');
                if ((status === 'resolved' || status === 'closed') && !gr.getValue('sla_status')) {
                    gr.setValue('sla_status', new GlideDateTime(gr.getValue('sys_updated_on')).compareTo(new GlideDateTime(gr.getValue('sla_due'))) <= 0 ? 'met' : 'missed');
                    changed = true;
                }
                if (changed) { gr.setWorkflow(false); gr.update(); n++; }
            }
            counts[process] = n;
        }
        return counts;
    },

    createFinanceException: function(domain, sourceTable, sourceRecord, reasonCode, description, severity) {
        var gr = new GlideRecord('x_695068_bcfa_finance_exception');
        gr.initialize();
        gr.setValue('domain', domain || 'general');
        gr.setValue('source_table', sourceTable || '');
        gr.setValue('source_record', sourceRecord || '');
        gr.setValue('reason_code', reasonCode);
        gr.setValue('description', description || '');
        gr.setValue('severity', severity || 'medium');
        gr.setValue('status', 'open');
        return gr.insert();
    },

    type: 'ExceptionEngine'
};
