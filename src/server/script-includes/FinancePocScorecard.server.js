// POC success scorecard (Phase 30). Measures, from the live records, whether
// the POC does what it set out to do, in five pillars:
//   automation  how much of AP and AR runs without a person
//   speed       how long a document takes, and whether exceptions meet SLA
//   control     audit, segregation of duties, lifecycle, idempotency,
//               unknown-outcome reconciliation
//   ai_safety   AI never acts on money; how often guardrails intervene
//   ai_value    AI coverage, acceptance and responsiveness
// Each metric has a PROPOSED target (to be agreed with Birla Carbon; none is a
// contractual figure) and a status: met / not_met / no_data / info.
// compute() only reads; refresh() also saves one x_695068_bcfa_poc_metric row
// per metric. See docs/POC_SUCCESS_METRICS.md.
var FinancePocScorecard = Class.create();

FinancePocScorecard.TABLE = 'x_695068_bcfa_poc_metric';
FinancePocScorecard.AP_PAST_INTAKE = 'stateNOT INRECEIVED,EXTRACTING,EXTRACTED,VALIDATING';

FinancePocScorecard.prototype = {
    initialize: function() {},

    refresh: function() {
        var metrics = this.compute();
        var now = new GlideDateTime().getValue();
        for (var i = 0; i < metrics.length; i++) this._save(metrics[i], now);
        return metrics;
    },

    compute: function() {
        var m = [];

        // --- Automation --------------------------------------------------------
        var processed = 0, firstPass = 0;
        var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
        inv.addEncodedQuery(FinancePocScorecard.AP_PAST_INTAKE);
        inv.query();
        while (inv.next()) {
            processed++;
            if (!this._count('x_695068_bcfa_ap_exception', 'ap_invoice=' + inv.getUniqueValue())) firstPass++;
        }
        m.push(this._metric('ap_first_pass_rate', 'automation', 'AP first-pass rate', this._pct(firstPass, processed), 'percent', 'gte', 70,
            firstPass + ' of ' + processed + ' AP invoices past intake reached matching and beyond without any exception.', processed));

        var posted = 0, stp = 0, touches = 0;
        var p = new GlideRecord('x_695068_bcfa_ap_invoice');
        p.addQuery('posting_state', 'posted');
        p.query();
        while (p.next()) {
            posted++;
            if (!this._count('x_695068_bcfa_ap_exception', 'ap_invoice=' + p.getUniqueValue())) stp++;
            if (p.getValue('correlation_id')) touches += this._count('x_695068_bcfa_audit_event', 'correlation_id=' + p.getValue('correlation_id') + '^actor_type=user');
        }
        m.push(this._metric('ap_stp_rate', 'automation', 'AP straight-through rate', this._pct(stp, posted), 'percent', 'gte', 60,
            stp + ' of ' + posted + ' posted AP invoices were posted without any exception.', posted));
        m.push(this._metric('ap_human_touches', 'automation', 'Human actions per posted invoice', posted ? touches / posted : 0, 'ratio', 'lte', 1.5,
            touches + ' audit events by a person across the correlation chains of ' + posted + ' posted invoices (an approval decision is one).', posted));

        var attempted = 0, auto = 0;
        var pay = new GlideRecord('x_695068_bcfa_payment');
        pay.addQuery('state', 'NOT IN', 'RECEIVED,NORMALIZED,CUSTOMER_RESOLUTION,MATCHING');
        pay.query();
        while (pay.next()) {
            attempted++;
            if (!this._count('x_695068_bcfa_ar_exception', 'payment=' + pay.getUniqueValue())) auto++;
        }
        m.push(this._metric('ar_auto_match_rate', 'automation', 'AR auto-match rate', this._pct(auto, attempted), 'percent', 'gte', 70,
            auto + ' of ' + attempted + ' payments that went through matching were matched and allocated without any exception.', attempted));

        // --- Speed -----------------------------------------------------------------
        var apHours = this._hoursToState('x_695068_bcfa_ap_invoice', 'posting_state=posted', 'POSTED');
        m.push(this._metric('ap_cycle_time_p50', 'speed', 'AP cycle time, median (hours)', this._median(apHours), 'hours', 'lte', 24,
            'Median hours from invoice created to POSTED over ' + apHours.length + ' posted invoice(s).', apHours.length));
        var arHours = this._hoursToState('x_695068_bcfa_payment', 'stateINCLEARED,RECONCILED,CLOSED', 'CLEARED');
        m.push(this._metric('ar_cycle_time_p50', 'speed', 'AR cycle time, median (hours)', this._median(arHours), 'hours', 'lte', 24,
            'Median hours from payment received to CLEARED over ' + arHours.length + ' cleared payment(s).', arHours.length));
        var slaTotal = 0, slaOk = 0;
        ['x_695068_bcfa_ap_exception', 'x_695068_bcfa_ar_exception'].forEach(function(t) {
            var ex = new GlideRecord(t);
            ex.addNotNullQuery('sla_status');
            ex.query();
            while (ex.next()) {
                slaTotal++;
                if (['breached', 'missed'].indexOf(ex.getValue('sla_status')) < 0) slaOk++;
            }
        });
        m.push(this._metric('exception_sla_attainment', 'speed', 'Exception SLA attainment', this._pct(slaOk, slaTotal), 'percent', 'gte', 90,
            slaOk + ' of ' + slaTotal + ' AP/AR exceptions are on track, at risk or met (not breached or missed).', slaTotal));

        // --- Control -----------------------------------------------------------------
        var moved = 0, audited = 0;
        [['x_695068_bcfa_ap_invoice', 'state!=RECEIVED'], ['x_695068_bcfa_payment', 'state!=RECEIVED']].forEach(function(tq) {
            var r = new GlideRecord(tq[0]);
            r.addEncodedQuery(tq[1]);
            r.query();
            while (r.next()) {
                moved++;
                if (this._count('x_695068_bcfa_audit_event', 'source_record=' + r.getUniqueValue() + '^after_valueLIKE"state"')) audited++;
            }
        }, this);
        m.push(this._metric('audit_coverage', 'control', 'Audit coverage of state changes', this._pct(audited, moved), 'percent', 'gte', 100,
            audited + ' of ' + moved + ' invoices/payments that left RECEIVED have their state changes in the audit trail.', moved));

        var sod = this._sodViolations();
        m.push(this._metric('sod_violations', 'control', 'Segregation-of-duties violations', sod.violations, 'count', 'lte', 0,
            sod.violations + ' decided approvals where the approver was the requester or an AI identity, of ' + sod.decided + ' decided.', sod.decided));

        var monitored = this._count('x_695068_bcfa_audit_event', 'after_valueLIKE"result":"MONITORED"');
        var refused = this._count('x_695068_bcfa_audit_event', 'after_valueLIKE"result":"REFUSED"');
        m.push(this._metric('lifecycle_bypasses', 'control', 'State changes outside the lifecycle that got through', monitored, 'count', 'lte', 0,
            monitored + ' let through in monitor mode; ' + refused + ' refused by enforcement (Phase 26).', 1));

        var dup = this._duplicatePostings();
        m.push(this._metric('duplicate_postings', 'control', 'Duplicate financial writes', dup.duplicates, 'count', 'lte', 0,
            dup.duplicates + ' idempotency keys with more than one successful write, of ' + dup.keys + ' keys.', dup.keys));

        var unknownTotal = this._count('x_695068_bcfa_integration_txn', 'reconciliation_state!=not_required');
        var unknownPending = this._count('x_695068_bcfa_integration_txn', 'reconciliation_state=pending');
        m.push(this._metric('unknown_outcome_resolved', 'control', 'Unknown outcomes reconciled', this._pct(unknownTotal - unknownPending, unknownTotal), 'percent', 'gte', 100,
            (unknownTotal - unknownPending) + ' of ' + unknownTotal + ' unknown-outcome writes resolved by a status query (confirmed, or escalated to a person).', unknownTotal));

        // --- AI safety -----------------------------------------------------------
        var aiActions = this._aiFinancialActions();
        m.push(this._metric('ai_financial_actions', 'ai_safety', 'Financial decisions made by AI', aiActions, 'count', 'lte', 0,
            aiActions + ' approval or exception decisions recorded with an AI identity as the decider.', 1));
        var interventions = this._count('x_695068_bcfa_ai_interaction', 'guardrail_actionINsanitized,blocked,guardian_blocked');
        var aiTotal = this._count('x_695068_bcfa_ai_interaction', 'status!=started');
        m.push(this._metric('ai_guardrail_interventions', 'ai_safety', 'Guardrail interventions', interventions, 'count', null, null,
            interventions + ' of ' + aiTotal + ' AI executions were sanitized or blocked (BCFA guardrail or Now Assist Guardian). Information: no target.', aiTotal));
        // Now Assist only: the legacy Claude path (removed in Phase 34) fails
        // with credential_error by design and says nothing about the native AI.
        var naTotal = this._count('x_695068_bcfa_ai_interaction', 'provider=now_assist^status!=started');
        var naFailed = this._count('x_695068_bcfa_ai_interaction', 'provider=now_assist^statusINhttp_error,timeout,invalid_response,credential_error,failed');
        m.push(this._metric('ai_failure_rate', 'ai_safety', 'Now Assist execution failure rate', this._pct(naFailed, naTotal), 'percent', 'lte', 5,
            naFailed + ' of ' + naTotal + ' Now Assist executions failed (errors or timeouts; guardrail refusals are not failures).', naTotal));

        // --- AI value ------------------------------------------------------------
        var exTotal = this._count('x_695068_bcfa_ap_exception', '') + this._count('x_695068_bcfa_ar_exception', '');
        var exAdvised = this._count('x_695068_bcfa_ap_exception', 'ai_recommendationISNOTEMPTY') + this._count('x_695068_bcfa_ar_exception', 'ai_recommendationISNOTEMPTY');
        m.push(this._metric('ai_exception_coverage', 'ai_value', 'Exceptions with AI advice', this._pct(exAdvised, exTotal), 'percent', 'gte', 80,
            exAdvised + ' of ' + exTotal + ' AP/AR exceptions carry an AI recommendation (advisory).', exTotal));
        var accepted = this._count('x_695068_bcfa_ai_interaction', 'human_accepted=true');
        var overridden = this._count('x_695068_bcfa_ai_interaction', 'human_overridden=true');
        m.push(this._metric('ai_acceptance_rate', 'ai_value', 'AI recommendation acceptance', this._pct(accepted, accepted + overridden), 'percent', 'gte', 60,
            accepted + ' accepted of ' + (accepted + overridden) + ' AI outputs a person decided on.', accepted + overridden));
        var lat = [];
        var li = new GlideRecord('x_695068_bcfa_ai_interaction');
        li.addQuery('status', 'success');
        li.addQuery('provider', 'now_assist');
        li.addNotNullQuery('latency_ms');
        li.query();
        while (li.next()) lat.push(parseInt(li.getValue('latency_ms'), 10) || 0);
        m.push(this._metric('ai_latency_p50', 'ai_value', 'Now Assist skill latency, median (ms)', this._median(lat), 'ms', 'lte', 5000,
            'Median over ' + lat.length + ' successful Now Assist skill calls.', lat.length));

        return m;
    },

    // --- helpers -----------------------------------------------------------------

    _metric: function(code, pillar, label, value, unit, comparator, target, detail, sampleSize) {
        var v = Math.round((value || 0) * 100) / 100;
        var status = 'info';
        if (comparator) {
            if (!sampleSize) status = 'no_data';
            else status = (comparator === 'gte' ? v >= target : v <= target) ? 'met' : 'not_met';
        }
        return { code: code, pillar: pillar, label: label, value: v, unit: unit, comparator: comparator || '', target: target, status: status, detail: detail, sample: sampleSize || 0 };
    },

    _save: function(metric, now) {
        var gr = new GlideRecord(FinancePocScorecard.TABLE);
        if (!gr.get('code', metric.code)) {
            gr.initialize();
            gr.setValue('code', metric.code);
        }
        gr.setValue('label', metric.label);
        gr.setValue('pillar', metric.pillar);
        gr.setValue('value', metric.value);
        gr.setValue('unit', metric.unit);
        gr.setValue('comparator', metric.comparator);
        gr.setValue('target_value', metric.target === null || metric.target === undefined ? '' : metric.target);
        gr.setValue('status', metric.status);
        gr.setValue('sample_size', metric.sample);
        gr.setValue('detail', metric.detail);
        gr.setValue('computed_at', now);
        if (gr.isNewRecord()) gr.insert(); else gr.update();
    },

    // Hours from each record's creation to the first audit event that moved it
    // into the given state.
    _hoursToState: function(table, query, state) {
        var hours = [];
        var r = new GlideRecord(table);
        r.addEncodedQuery(query);
        r.query();
        while (r.next()) {
            var ev = new GlideRecord('x_695068_bcfa_audit_event');
            ev.addQuery('source_record', r.getUniqueValue());
            ev.addQuery('after_value', 'CONTAINS', '"state":"' + state + '"');
            ev.orderBy('sys_created_on');
            ev.setLimit(1);
            ev.query();
            if (!ev.next()) continue;
            var start = new GlideDateTime(r.getValue('sys_created_on')).getNumericValue();
            var end = new GlideDateTime(ev.getValue('sys_created_on')).getNumericValue();
            hours.push(Math.max(0, (end - start) / 3600000));
        }
        return hours;
    },

    _sodViolations: function() {
        var decided = 0, violations = 0;
        var self = this;
        ['x_695068_bcfa_ap_approval', 'x_695068_bcfa_ar_approval'].forEach(function(t) {
            var a = new GlideRecord(t);
            a.addQuery('decision', 'IN', 'approved,rejected');
            a.addNotNullQuery('approver');
            a.query();
            while (a.next()) {
                decided++;
                if (a.getValue('approver') === a.getValue('requested_by') || self._isAi(a.getValue('approver'))) violations++;
            }
        });
        return { decided: decided, violations: violations };
    },

    _aiFinancialActions: function() {
        var n = 0, self = this;
        ['x_695068_bcfa_ap_approval', 'x_695068_bcfa_ar_approval'].forEach(function(t) {
            var a = new GlideRecord(t);
            a.addQuery('decision', 'IN', 'approved,rejected');
            a.addNotNullQuery('approver');
            a.query();
            while (a.next()) if (self._isAi(a.getValue('approver'))) n++;
        });
        ['x_695068_bcfa_ap_exception', 'x_695068_bcfa_ar_exception'].forEach(function(t) {
            var e = new GlideRecord(t);
            e.addNotNullQuery('decided_by');
            e.query();
            while (e.next()) if (self._isAi(e.getValue('decided_by'))) n++;
        });
        return n;
    },

    _isAi: function(userSysId) {
        if (!userSysId) return false;
        this._aiCache = this._aiCache || {};
        if (!(userSysId in this._aiCache)) {
            var u = new GlideRecord('sys_user');
            this._aiCache[userSysId] = u.get(userSysId) && u.getValue('identity_type') === 'ai_agent';
        }
        return this._aiCache[userSysId];
    },

    _duplicatePostings: function() {
        var ga = new GlideAggregate('x_695068_bcfa_integration_txn');
        ga.addQuery('status', 'success');
        ga.addNotNullQuery('idempotency_key');
        ga.addAggregate('COUNT');
        ga.groupBy('idempotency_key');
        ga.query();
        var keys = 0, duplicates = 0;
        while (ga.next()) {
            keys++;
            if (parseInt(ga.getAggregate('COUNT'), 10) > 1) duplicates++;
        }
        return { keys: keys, duplicates: duplicates };
    },

    _count: function(table, query) {
        var ga = new GlideAggregate(table);
        if (query) ga.addEncodedQuery(query);
        ga.addAggregate('COUNT');
        ga.query();
        return ga.next() ? parseInt(ga.getAggregate('COUNT'), 10) : 0;
    },

    _pct: function(part, whole) {
        return whole ? (part / whole) * 100 : 0;
    },

    _median: function(values) {
        if (!values.length) return 0;
        var s = values.slice().sort(function(a, b) { return a - b; });
        var mid = Math.floor(s.length / 2);
        return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    },

    type: 'FinancePocScorecard'
};
