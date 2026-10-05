// Phase 40: runs native extraction (Document Intelligence, generative, Now LLM) on every evaluation
// intake (source_reference PH40-EVAL-*): one DocIntel task per intake with the BCFA AP or AR native
// use case. Creates DocIntel tasks only; no AP / AR transaction is created. Results are read by
// phase40_native_eval_read_bg.js. Scope global.
(function() {
    var AP = '4f1b9b4aca304a7182f72f68a3c168c9', AR = '394844f2a38542d9bb14f79668777523';
    var ONLY = ''; // optional: a source_reference to run just one document
    var api = new sn_docintel.DocIntelAPI(), out = [];
    var intake = new GlideRecord('x_695068_bcfa_finance_intake');
    intake.addQuery('source_reference', 'STARTSWITH', 'PH40-EVAL-');
    if (ONLY) intake.addQuery('source_reference', ONLY);
    intake.orderBy('source_reference');
    intake.query();
    while (intake.next()) {
        var att = new GlideRecord('sys_attachment');
        att.addQuery('table_name', 'x_695068_bcfa_finance_intake');
        att.addQuery('table_sys_id', intake.getUniqueValue());
        att.query();
        if (!att.next()) { out.push(intake.getValue('source_reference') + ' no attachment'); continue; }
        var useCase = intake.getValue('document_type') === 'ap_invoice' ? AP : AR;
        try {
            var taskId = api.createTask('BCFA PH40 eval ' + att.getValue('file_name'), useCase,
                'x_695068_bcfa_finance_intake', intake.getUniqueValue(), [att.getUniqueValue()]);
            api.processTask(taskId);
            out.push(att.getValue('file_name') + '=' + taskId);
        } catch (e) {
            out.push(att.getValue('file_name') + ' ERROR ' + e);
        }
    }
    gs.info('BCFA_EVALRUN ' + out.join(' | '));
})();
