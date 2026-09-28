// Approvals and segregation of duties (Phase 17). Every AP posting
// approval and AR clearing approval is requested and decided here, and every
// decision passes one SoD gate (checkSegregation), which callers can also run
// as a pre-check before they change any state.
//
// Rules (the configurable ones are x_695068_bcfa.sod.* properties, POC
// ASSUMPTION, default on):
//   always       an AI identity (sys_user.identity_type = ai_agent) never
//                approves or rejects
//   always       the approver holds the process approver role
//                (ap_approver / ar_approver; finance_approver contains both)
//   configurable requester != approver       (sod.requester_cannot_approve)
//   configurable the processor of the transaction cannot approve it: its
//                creator, or anyone who made a processor-level decision on
//                one of its exceptions         (sod.processor_cannot_approve)
//   configurable the approver is a member of the approval group the
//                approval decision table routed to (sod.approver_in_group)
// Rule-based approvals (approval_type 'rule', no approver) skip the person
// checks by definition; the rule that allowed them is recorded.
//
// Each approval records: requested by, approval group, type, approver,
// decision, comments, decision time, override reason, SoD check result, and
// the transaction state before and after the decision (set by the domain
// service once the posting/clearing cascade has run).
var ApprovalEngine = Class.create();

ApprovalEngine.PROCESS = {
    ap: { table: 'x_695068_bcfa_ap_approval', parentField: 'ap_invoice', parentTable: 'x_695068_bcfa_ap_invoice',
        exceptionTable: 'x_695068_bcfa_ap_exception', approverRole: 'x_695068_bcfa.ap_approver',
        processorDecisions: ['hold', 'request_correction', 'reject'] },
    ar: { table: 'x_695068_bcfa_ar_approval', parentField: 'payment', parentTable: 'x_695068_bcfa_payment',
        exceptionTable: 'x_695068_bcfa_ar_exception', approverRole: 'x_695068_bcfa.ar_approver',
        processorDecisions: ['approve_deduction', 'hold', 'request_clarification'] }
};

ApprovalEngine.prototype = {
    initialize: function() {
        this.audit = new AuditEngine();
    },

    // ---- Request --------------------------------------------------------------

    // options (optional): { group, type ('standard'|'override'|'rule'),
    // overrideReason }.
    requestApInvoiceApproval: function(apInvoiceSysId, requestedBy, options) {
        var sysId = this._request('ap', apInvoiceSysId, requestedBy, this._options(options));
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (invoice.get(apInvoiceSysId)) {
            invoice.setValue('approval_state', 'pending');
            invoice.update();
        }
        return sysId;
    },

    requestPaymentApproval: function(paymentSysId, requestedBy, options) {
        return this._request('ar', paymentSysId, requestedBy, this._options(options));
    },

    // Accepts the Phase 15 call shape (a bare group sys_id) too.
    _options: function(options) {
        if (!options) return {};
        if (typeof options === 'string') return { group: options };
        return options;
    },

    _request: function(process, parentSysId, requestedBy, options) {
        var p = ApprovalEngine.PROCESS[process];
        var approval = new GlideRecord(p.table);
        approval.initialize();
        approval.setValue(p.parentField, parentSysId);
        if (requestedBy) approval.setValue('requested_by', requestedBy);
        if (options.group) approval.setValue('approval_group', options.group);
        approval.setValue('approval_type', options.type || 'standard');
        if (options.overrideReason) approval.setValue('override_reason', options.overrideReason);
        approval.setValue('decision', 'pending');
        var parent = new GlideRecord(p.parentTable);
        if (parent.get(parentSysId)) approval.setValue('state_before', parent.getValue('state'));
        var approvalSysId = approval.insert();
        this.audit.logEvent({
            correlationId: parent.isValidRecord() ? parent.getValue('correlation_id') : '',
            sourceTable: p.table,
            sourceRecord: approvalSysId,
            eventType: 'approval_requested',
            actor: requestedBy || '',
            actorType: requestedBy ? 'user' : 'system',
            reason: options.overrideReason || '',
            description: (options.type || 'standard') + ' approval requested for ' + (parent.isValidRecord() ? parent.getDisplayValue() : parentSysId) +
                (options.group ? ' (group ' + approval.getDisplayValue('approval_group') + ')' : ''),
            afterValue: { approval_type: options.type || 'standard', approval_group: options.group || '', requested_by: requestedBy || '',
                state_before: approval.getValue('state_before') }
        });
        return approvalSysId;
    },

    _parentCorrelation: function(p, approval) {
        var parent = new GlideRecord(p.parentTable);
        return parent.get(approval.getValue(p.parentField)) ? parent.getValue('correlation_id') : '';
    },

    // ---- Segregation of duties --------------------------------------------------

    // context: { process, approvalSysId } for an existing approval, or
    // { process, parentSysId, requestedBy, group, type } for a pre-check
    // before the approval exists. Returns { ok, reason, checks[] }.
    checkSegregation: function(context, approverSysId) {
        var p = ApprovalEngine.PROCESS[context.process];
        var requestedBy = context.requestedBy || '';
        var group = context.group || '';
        var type = context.type || 'standard';
        var parentSysId = context.parentSysId || '';
        if (context.approvalSysId) {
            var approval = new GlideRecord(p.table);
            if (!approval.get(context.approvalSysId)) return { ok: false, reason: 'Approval not found.', checks: [] };
            requestedBy = approval.getValue('requested_by');
            group = approval.getValue('approval_group');
            type = approval.getValue('approval_type') || 'standard';
            parentSysId = approval.getValue(p.parentField);
        }
        var checks = [];
        var fail = function(reason) { checks.push('FAIL ' + reason); return { ok: false, reason: 'Segregation of duties: ' + reason, checks: checks }; };

        if (!approverSysId) {
            if (type === 'rule') { checks.push('rule-based approval (no approver)'); return { ok: true, checks: checks }; }
            return fail('an approver is required.');
        }
        var approver = new GlideRecord('sys_user');
        if (!approver.get(approverSysId)) return fail('approver not found.');
        if (approver.getValue('identity_type') === 'ai_agent') return fail('AI identities never approve or reject (' + approver.getValue('user_name') + ').');
        checks.push('not an AI identity');

        // Direct and inherited grants. finance_approver contains both approver
        // roles and is accepted directly too (inherited grant rows are not
        // created when containment is loaded through update XML); the BCFA
        // admin role also qualifies.
        var grant = new GlideRecord('sys_user_has_role');
        grant.addQuery('user', approverSysId);
        grant.addQuery('role.name', 'IN', p.approverRole + ',x_695068_bcfa.finance_approver,x_695068_bcfa.admin');
        grant.setLimit(1);
        grant.query();
        if (!grant.hasNext()) {
            return fail(approver.getDisplayValue() + ' does not hold ' + p.approverRole + '.');
        }
        checks.push('holds ' + p.approverRole);

        if (this._flag('sod.requester_cannot_approve') && requestedBy && requestedBy === approverSysId) {
            return fail('the requester cannot approve their own request.');
        }
        checks.push('not the requester');

        if (this._flag('sod.processor_cannot_approve')) {
            var processor = this._processorOf(context.process, parentSysId, approver);
            if (processor) return fail(approver.getDisplayValue() + ' ' + processor + ' of this transaction and cannot approve it.');
            checks.push('not the processor');
        }

        if (this._flag('sod.approver_in_group') && group) {
            var member = new GlideRecord('sys_user_grmember');
            member.addQuery('group', group);
            member.addQuery('user', approverSysId);
            member.query();
            if (!member.hasNext()) {
                var groupRecord = new GlideRecord('sys_user_group');
                groupRecord.get(group);
                return fail(approver.getDisplayValue() + ' is not a member of the approval group ' + groupRecord.getDisplayValue() + '.');
            }
            checks.push('member of the approval group');
        }
        return { ok: true, checks: checks };
    },

    // Returns a description if the user processed the transaction (created
    // it, or made a processor-level decision on one of its exceptions).
    _processorOf: function(process, parentSysId, approver) {
        var p = ApprovalEngine.PROCESS[process];
        var parent = new GlideRecord(p.parentTable);
        if (parent.get(parentSysId) && parent.getValue('sys_created_by') === approver.getValue('user_name')) return 'created';
        var decided = new GlideRecord(p.exceptionTable);
        decided.addQuery(p.parentField, parentSysId);
        decided.addQuery('decided_by', approver.getUniqueValue());
        decided.addQuery('decision', 'IN', p.processorDecisions.join(','));
        decided.setLimit(1);
        decided.query();
        if (decided.next()) return 'made the processor decision "' + decided.getValue('decision') + '" on exception ' + decided.getValue('number');
        return null;
    },

    _flag: function(key) {
        var value = gs.getProperty('x_695068_bcfa.' + key);
        return !(value === 'false' || value === false);
    },

    // ---- Decide -----------------------------------------------------------------

    decideApInvoiceApproval: function(approvalSysId, decision, approver, notes) {
        var result = this._decide('ap', approvalSysId, decision, approver, notes);
        if (result.error) return result;
        var approval = new GlideRecord('x_695068_bcfa_ap_approval');
        approval.get(approvalSysId);
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (invoice.get(approval.getValue('ap_invoice'))) {
            invoice.setValue('approval_state', decision === 'approved' ? 'approved' : 'rejected');
            invoice.update();
        }
        return result;
    },

    decidePaymentApproval: function(approvalSysId, decision, approver, notes) {
        return this._decide('ar', approvalSysId, decision, approver, notes);
    },

    _decide: function(process, approvalSysId, decision, approver, notes) {
        var p = ApprovalEngine.PROCESS[process];
        var approval = new GlideRecord(p.table);
        if (!approval.get(approvalSysId)) return { error: 'Approval not found' };
        if (approval.getValue('decision') !== 'pending') return { error: 'This approval is already ' + approval.getValue('decision') + '.' };

        var sod = this.checkSegregation({ process: process, approvalSysId: approvalSysId }, approver);
        if (!sod.ok) {
            this.audit.logEvent({
                correlationId: this._parentCorrelation(p, approval),
                sourceTable: p.table,
                sourceRecord: approvalSysId,
                eventType: 'approval_decision',
                actor: approver || '',
                actorType: 'user',
                reason: sod.reason,
                description: 'Approval decision "' + decision + '" refused. ' + sod.reason,
                afterValue: { decision: decision, approver: approver, checks: sod.checks }
            });
            return { error: sod.reason, checks: sod.checks };
        }

        approval.setValue('decision', decision);
        approval.setValue('decision_notes', notes || '');
        if (approver) approval.setValue('approver', approver);
        approval.setValue('decided_at', new GlideDateTime().getValue());
        approval.setValue('sod_check', 'passed: ' + sod.checks.join('; '));
        approval.update();

        this.audit.logEvent({
            correlationId: this._parentCorrelation(p, approval),
            sourceTable: p.table,
            sourceRecord: approvalSysId,
            eventType: 'approval_decision',
            actor: approver || '',
            actorType: approver ? 'user' : 'system',
            reason: notes || approval.getValue('override_reason') || '',
            description: 'Approval ' + decision + (approver ? ' by ' + approval.getDisplayValue('approver') : ' by configured rule') +
                (notes ? ': ' + notes : '') + ' [SoD passed: ' + sod.checks.join('; ') + ']',
            afterValue: { decision: decision, approver: approver, approval_type: approval.getValue('approval_type'),
                override_reason: approval.getValue('override_reason'), group: approval.getValue('approval_group') }
        });
        return { success: true, decision: decision, checks: sod.checks };
    },

    // Called by the domain service after the decision (and any posting or
    // clearing cascade) so the approval shows the resulting state.
    recordStateAfter: function(process, approvalSysId) {
        var p = ApprovalEngine.PROCESS[process];
        var approval = new GlideRecord(p.table);
        if (!approval.get(approvalSysId)) return;
        var parent = new GlideRecord(p.parentTable);
        if (!parent.get(approval.getValue(p.parentField))) return;
        approval.setValue('state_after', parent.getValue('state'));
        approval.update();
    },

    type: 'ApprovalEngine'
};
