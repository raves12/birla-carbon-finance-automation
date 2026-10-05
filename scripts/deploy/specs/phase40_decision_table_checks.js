try {
    if (gs.getCurrentScopeName() !== 'x_695068_bcfa') throw 'Run this in scope x_695068_bcfa (current: ' + gs.getCurrentScopeName() + ')';
    for (var t = 0; t < TABLES.length; t++) build(TABLES[t]);

    var policy = new FinancePolicy();
    var inGoods = policy.apTaxExpectation({ country: 'India', company: 'BC01', vendorTaxCategory: 'goods' });
    check('Tax India goods: regime', inGoods.regime, 'GST');
    check('Tax India goods: rate', inGoods.ratePct, 18);
    check('Tax India goods: withholding', inGoods.whtApplicable, false);
    check('Tax source is the decision table', inGoods.source.indexOf('decision table') === 0, true);
    var inServices = policy.apTaxExpectation({ country: 'India', company: 'BC01', vendorTaxCategory: 'services' });
    check('Tax India services: withholding', inServices.whtApplicable, true);
    check('Tax India services: withholding rate', inServices.whtRatePct, 2);
    var de = policy.apTaxExpectation({ country: 'Germany', company: 'BC01', vendorTaxCategory: 'goods' });
    check('Tax Germany: regime', de.regime, 'VAT');
    check('Tax Germany: rate', de.ratePct, 19);
    var us = policy.apTaxExpectation({ country: 'United States', company: 'BC01', vendorTaxCategory: 'goods' });
    check('Tax United States: rate', us.ratePct, 0);
    var br = policy.apTaxExpectation({ country: 'Brazil', company: 'BC01', vendorTaxCategory: 'goods' });
    check('Tax Brazil (not configured): regime', br.regime, 'UNKNOWN');

    var tol = policy.apTolerances({ company: 'BC01', country: 'India', vendorType: 'standard', invoiceType: 'po' });
    check('AP tolerance default: quantity', tol.quantityPct, 0.02);
    check('AP tolerance default: total', tol.totalAbsolute, 1);
    check('AP tolerance default: rounding', tol.roundingAbsolute, 0.05);
    check('AP tolerance source', tol.source.indexOf('decision table') === 0, true);
    var strategic = policy.apTolerances({ company: 'BC01', country: 'Germany', vendorType: 'strategic', invoiceType: 'po' });
    check('AP tolerance strategic vendor: quantity', strategic.quantityPct, 0.05);

    var bank = policy.arDeductionDecision({ deductionType: 'bank_charge', amount: 500, company: 'BC01' });
    check('AR bank charge 500: allowed, no approver', bank.allowed + '/' + bank.approvalRequired, 'true/false');
    var wht = policy.arDeductionDecision({ deductionType: 'withholding_tax', amount: 900, company: 'BC01' });
    check('AR withholding 900: allowed, no approver', wht.allowed + '/' + wht.approvalRequired, 'true/false');
    var whtBig = policy.arDeductionDecision({ deductionType: 'withholding_tax', amount: 9000, company: 'BC01' });
    check('AR withholding 9,000: approver needed', whtBig.approvalRequired, true);
    var commercial = policy.arDeductionDecision({ deductionType: 'commercial_deduction', amount: 100, company: 'BC01' });
    check('AR commercial 100: allowed, approver needed', commercial.allowed + '/' + commercial.approvalRequired, 'true/true');
    var dispute = policy.arDeductionDecision({ deductionType: 'dispute', amount: 100, company: 'BC01' });
    check('AR dispute: not allowed', dispute.allowed, false);
    var other = policy.arDeductionDecision({ deductionType: 'other', amount: 10, company: 'BC01' });
    check('AR other: not allowed', other.allowed, false);
    check('AR deduction source', bank.source.indexOf('decision table') === 0, true);
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_DT40 ' + out.join(' || '));
