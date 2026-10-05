// Phase 24 verification. Run in Scripts - Background with scope =
// x_695068_bcfa, after phase24_workspace_bg.js (global).
//   1 computes the 19 Finance Operations KPIs (the scheduled job does this
//     every 15 minutes) and prints them with how each was computed
//   2 fills the Review Summary of every AP invoice and payment once (after
//     this, every state change and AI note keeps it current) and prints a
//     posted invoice, an exception invoice and a payment with a deduction
var out = [];
try {
    var kpis = new FinanceKpiService().refresh();
    var rows = [];
    for (var code in kpis) {
        var k = kpis[code];
        rows.push('    [' + k.category + '] ' + k.label + ': ' + k.value + (k.unit === 'percent' ? '%' : k.unit === 'hours' ? ' h' : '') + '  (' + k.detail + ')');
    }
    out.push('1 KPIs (' + rows.length + '):\n' + rows.join('\n'));

    var summary = new FinanceReviewSummary();
    var n = { inv: 0, pay: 0 };
    var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
    inv.query();
    while (inv.next()) { summary.refreshInvoice(inv.getUniqueValue()); n.inv++; }
    var pay = new GlideRecord('x_695068_bcfa_payment');
    pay.query();
    while (pay.next()) { summary.refreshPayment(pay.getUniqueValue()); n.pay++; }
    out.push('2 review summaries filled: ' + n.inv + ' invoices, ' + n.pay + ' payments');

    function show(table, query, label) {
        var gr = new GlideRecord(table);
        gr.addEncodedQuery(query);
        gr.orderByDesc('sys_created_on');
        gr.setLimit(1);
        gr.query();
        if (!gr.next()) { out.push(label + ': none found'); return; }
        out.push(label + ' ' + gr.getDisplayValue() + ':\n' + gr.getValue('review_summary').split('\n').map(function(l) { return '    ' + l; }).join('\n'));
    }
    show('x_695068_bcfa_ap_invoice', 'posting_state=posted^invoice_numberSTARTSWITHT19', '2 posted invoice');
    show('x_695068_bcfa_ap_invoice', 'state=ON_HOLD^invoice_numberSTARTSWITHT2', '2 exception invoice');
    var ded = new GlideRecord('x_695068_bcfa_deduction');
    ded.orderByDesc('sys_created_on');
    ded.setLimit(1);
    ded.query();
    if (ded.next()) show('x_695068_bcfa_payment', 'sys_id=' + ded.payment_allocation.payment, '2 payment with deduction');
} catch (err) {
    out.push('ERROR ' + err + (err && err.stack ? ' ' + err.stack : ''));
}
gs.info('BCFA_P24 ' + out.join('\n'));
