// Phase 35 (Playbook), step 2 of 2. Run in Scripts - Background with scope =
// x_695068_bcfa AFTER phase35_playbook_deploy_bg.js (scope global) and AFTER
// both Playbooks are activated in Workflow Studio (so the new demo
// transactions start a Playbook on creation).
//  1. Backfills the journey fields of every existing AP invoice and payment
//     (display fields only; setWorkflow(false), no state change).
//  2. Seeds the eleven Playbook demo transactions (AP-PLAY-01..04,
//     AR-PLAY-01..07); skipped if INV-PLAY-01 already exists.
(function() {
    var svc = new FinanceJourneyService();
    var count = function(table, refresh) {
        var gr = new GlideRecord(table);
        gr.query();
        var n = 0, byStage = {};
        while (gr.next()) {
            var j = refresh.call(svc, gr.getUniqueValue());
            n++;
            if (j) byStage[j.stage + '/' + j.status] = (byStage[j.stage + '/' + j.status] || 0) + 1;
        }
        return n + ' ' + JSON.stringify(byStage);
    };
    var out = [];
    out.push('invoices ' + count('x_695068_bcfa_ap_invoice', svc.refreshInvoice));
    out.push('payments ' + count('x_695068_bcfa_payment', svc.refreshPayment));
    var seed = new DemoDataSeeder().seedPlaybookScenarios();
    out.push('playbook scenarios ' + JSON.stringify(seed));
    // Playbook executions started for BCFA invoices and payments.
    var ctx = new GlideAggregate('sys_pd_context');
    ctx.addQuery('input_table', 'IN', 'x_695068_bcfa_ap_invoice,x_695068_bcfa_payment');
    ctx.addAggregate('COUNT');
    ctx.groupBy('input_table');
    ctx.query();
    var runs = [];
    while (ctx.next()) runs.push(ctx.getValue('input_table') + '=' + ctx.getAggregate('COUNT'));
    out.push('playbook runs ' + (runs.join(', ') || 'none (are both Playbooks active?)'));
    gs.info('BCFA_P35 ' + out.join(' | '));
})();
