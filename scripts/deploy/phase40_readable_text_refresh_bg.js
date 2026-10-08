// Scope x_695068_bcfa. Run once after phase40_readable_text_bg.js.
// Re-lays out what is already stored with the new readable formats:
//  - advisory AI notes (ai_recommendation / ai_explanation) on AP and AR
//    exceptions, payments and deductions (FinanceTextFormat.aiNote; same
//    wording, presentation only);
//  - the review summary of every AP invoice and payment (FinanceReviewSummary).
// Display fields only, written with setWorkflow(false) and without touching
// the updated-on stamps. Idempotent.
(function() {
    var fmt = new FinanceTextFormat(), out = [];
    [['x_695068_bcfa_ap_exception', ['ai_recommendation', 'ai_explanation']],
     ['x_695068_bcfa_ar_exception', ['ai_recommendation', 'ai_explanation']],
     ['x_695068_bcfa_payment', ['ai_recommendation']],
     ['x_695068_bcfa_deduction', ['ai_recommendation']]].forEach(function(t) {
        var gr = new GlideRecord(t[0]), n = 0;
        gr.addNotNullQuery(t[1][0]);
        gr.query();
        while (gr.next()) {
            var changed = false;
            t[1].forEach(function(field) {
                var v = gr.getValue(field);
                if (!v) return;
                var max = gr[field].getED().getLength() || 4000;
                var text = fmt.aiNote(v);
                if (text.length > max) text = text.substring(0, max - 1) + '…';
                if (text !== v) { gr.setValue(field, text); changed = true; }
            });
            if (changed) { gr.setWorkflow(false); gr.autoSysFields(false); gr.update(); n++; }
        }
        out.push(t[0].replace('x_695068_bcfa_', '') + ' notes ' + n);
    });
    var summary = new FinanceReviewSummary(), inv = 0, pay = 0;
    var i = new GlideRecord('x_695068_bcfa_ap_invoice');
    i.query();
    while (i.next()) { summary.refreshInvoice(i.getUniqueValue()); inv++; }
    var p = new GlideRecord('x_695068_bcfa_payment');
    p.query();
    while (p.next()) { summary.refreshPayment(p.getUniqueValue()); pay++; }
    out.push('summaries: invoices ' + inv + ', payments ' + pay);
    gs.info('BCFA_READABLE ' + out.join(' | '));
})();
