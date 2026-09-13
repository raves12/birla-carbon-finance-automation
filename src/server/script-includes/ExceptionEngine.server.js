var ExceptionEngine = Class.create();
ExceptionEngine.prototype = {
    initialize: function() {},

    createApException: function(apInvoiceSysId, reasonCode, description) {
        var gr = new GlideRecord('x_695068_bcfa_ap_exception');
        gr.initialize();
        gr.setValue('ap_invoice', apInvoiceSysId);
        gr.setValue('reason_code', reasonCode);
        gr.setValue('description', description || '');
        gr.setValue('status', 'open');
        return gr.insert();
    },

    resolveApException: function(exceptionSysId, resolutionNotes, resolvedBy) {
        var gr = new GlideRecord('x_695068_bcfa_ap_exception');
        if (!gr.get(exceptionSysId)) return false;
        gr.setValue('status', 'resolved');
        gr.setValue('resolution_notes', resolutionNotes || '');
        if (resolvedBy) gr.setValue('assigned_to', resolvedBy);
        return gr.update() ? true : false;
    },

    createArException: function(paymentSysId, reasonCode, description) {
        var gr = new GlideRecord('x_695068_bcfa_ar_exception');
        gr.initialize();
        gr.setValue('payment', paymentSysId);
        gr.setValue('reason_code', reasonCode);
        gr.setValue('description', description || '');
        gr.setValue('status', 'open');
        return gr.insert();
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
