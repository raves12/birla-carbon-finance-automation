try {
    if (gs.getCurrentScopeName() !== 'x_695068_bcfa') throw 'Run this in scope x_695068_bcfa (current: ' + gs.getCurrentScopeName() + ')';
    for (var t = 0; t < TABLES.length; t++) build(TABLES[t]);

    var policy = new FinancePolicy();
    var cn = policy.documentEvidenceRequirement({ country: 'China', documentType: 'ap_invoice', company: 'BC01', vendorType: 'standard', invoiceType: 'po' });
    check('China AP invoice: stamp required', cn.stampRequired, true);
    check('China AP invoice: signature required', cn.signatureRequired, false);
    check('China AP invoice: manual review required', cn.manualReviewRequired, false);
    check('Evidence source is the decision table', cn.source.indexOf('decision table') === 0, true);
    var cnAr = policy.documentEvidenceRequirement({ country: 'China', documentType: 'ar_payment_advice', company: 'BC01' });
    check('China AR advice: no stamp required', cnAr.stampRequired, false);
    var inAp = policy.documentEvidenceRequirement({ country: 'India', documentType: 'ap_invoice', company: 'BC01', vendorType: 'standard', invoiceType: 'po' });
    check('India AP invoice: no stamp required', inAp.stampRequired, false);
    var blank = policy.documentEvidenceRequirement({ country: '', documentType: 'ap_invoice' });
    check('Unknown country: no stamp required', blank.stampRequired, false);
    check('Stamp detection capability (measured)', policy.stampDetectionCapability(), 'ocr_text');
} catch (e) {
    out.push('ERROR ' + e);
}
gs.info('BCFA_DT42 ' + out.join(' | '));
