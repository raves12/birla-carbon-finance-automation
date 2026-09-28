var ExceptionEngine = Class.create();
ExceptionEngine.prototype = {
    initialize: function() {},

    // details (optional): { ruleResult, evidence, varianceAmount, variancePct }.
    // Severity, SLA due date, assignment group and owner come from
    // FinancePolicy. Everything is set in the one insert, because the BCFA
    // AP Invoice Review agentic workflow triggers on creation and must see
    // the full deterministic evidence.
    createApException: function(apInvoiceSysId, reasonCode, description, details) {
        details = details || {};
        var policy = new FinancePolicy();
        var severity = policy.apExceptionSeverity(reasonCode, details.varianceAmount);

        var gr = new GlideRecord('x_695068_bcfa_ap_exception');
        gr.initialize();
        gr.setValue('ap_invoice', apInvoiceSysId);
        gr.setValue('reason_code', reasonCode);
        gr.setValue('description', description || '');
        gr.setValue('severity', severity);
        gr.setValue('sla_due', policy.apExceptionDueDate(severity).getValue());
        if (policy.apExceptionAssignmentGroup()) gr.setValue('assignment_group', policy.apExceptionAssignmentGroup());
        if (policy.apExceptionDefaultOwner()) gr.setValue('assigned_to', policy.apExceptionDefaultOwner());
        gr.setValue('rule_result', details.ruleResult || description || '');
        if (details.evidence) gr.setValue('evidence', details.evidence);
        if (details.varianceAmount !== undefined && details.varianceAmount !== null) gr.setValue('variance_amount', details.varianceAmount);
        if (details.variancePct !== undefined && details.variancePct !== null) gr.setValue('variance_pct', Math.round(details.variancePct * 10000) / 100);
        gr.setValue('status', 'open');
        var sysId = gr.insert();

        new AuditEngine().logEvent({
            sourceTable: 'x_695068_bcfa_ap_exception',
            sourceRecord: sysId,
            eventType: 'exception_created',
            actorType: 'system',
            description: 'AP exception raised: ' + reasonCode + ', severity ' + severity + '. ' + (details.ruleResult || description || ''),
            afterValue: { ap_invoice: apInvoiceSysId, reason_code: reasonCode, severity: severity, variance_amount: details.varianceAmount }
        });
        return sysId;
    },

    resolveApException: function(exceptionSysId, resolutionNotes, resolvedBy) {
        var gr = new GlideRecord('x_695068_bcfa_ap_exception');
        if (!gr.get(exceptionSysId)) return false;
        gr.setValue('status', 'resolved');
        gr.setValue('resolution_notes', resolutionNotes || '');
        if (resolvedBy) gr.setValue('assigned_to', resolvedBy);
        return gr.update() ? true : false;
    },

    // details (optional): { ruleResult, evidence, residual,
    // suggestedDeductionType, creditNote }. Same approach
    // as createApException: everything is set in the one insert, because
    // the BCFA Cash Application Review workflow triggers on creation.
    createArException: function(paymentSysId, reasonCode, description, details) {
        details = details || {};
        var policy = new FinancePolicy();
        var severity = policy.arExceptionSeverity(reasonCode, details.residual);

        var gr = new GlideRecord('x_695068_bcfa_ar_exception');
        gr.initialize();
        gr.setValue('payment', paymentSysId);
        gr.setValue('reason_code', reasonCode);
        gr.setValue('description', description || '');
        gr.setValue('severity', severity);
        gr.setValue('sla_due', policy.arExceptionDueDate(severity).getValue());
        if (policy.arExceptionAssignmentGroup()) gr.setValue('assignment_group', policy.arExceptionAssignmentGroup());
        if (policy.arExceptionDefaultOwner()) gr.setValue('assigned_to', policy.arExceptionDefaultOwner());
        gr.setValue('rule_result', details.ruleResult || description || '');
        if (details.evidence) gr.setValue('evidence', details.evidence);
        if (details.residual !== undefined && details.residual !== null) gr.setValue('residual_amount', details.residual);
        // Deterministic rule suggestion (Phase 14); the reviewer may change it.
        if (details.suggestedDeductionType) gr.setValue('deduction_type', details.suggestedDeductionType);
        if (details.creditNote) gr.setValue('credit_note', details.creditNote);
        gr.setValue('status', 'open');
        var sysId = gr.insert();

        new AuditEngine().logEvent({
            sourceTable: 'x_695068_bcfa_ar_exception',
            sourceRecord: sysId,
            eventType: 'exception_created',
            actorType: 'system',
            description: 'AR exception raised: ' + reasonCode + ', severity ' + severity + '. ' + (details.ruleResult || description || ''),
            afterValue: { payment: paymentSysId, reason_code: reasonCode, severity: severity, residual_amount: details.residual }
        });
        return sysId;
    },

    resolveArException: function(exceptionSysId, resolutionNotes, resolvedBy) {
        var gr = new GlideRecord('x_695068_bcfa_ar_exception');
        if (!gr.get(exceptionSysId)) return false;
        gr.setValue('status', 'resolved');
        gr.setValue('resolution_notes', resolutionNotes || '');
        if (resolvedBy) gr.setValue('assigned_to', resolvedBy);
        return gr.update() ? true : false;
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
