// Phase 22 verification, part 2. Run in Scripts - Background with scope =
// x_695068_bcfa, after part 1.
//
// End to end with the reduced AI identity: raises an AP exception (missing
// vendor) and an AR short-pay exception, which start the BCFA AP Invoice
// Review and Cash Application Review agentic workflows as bcfa.ai.reviewer
// (now x_695068_bcfa.ai_agent only). The workflows run asynchronously; their
// results (skill calls, saved note) are checked afterwards in the AI
// Interaction Log.
var out = [];
var tag = 'T22-' + gs.generateGUID().substring(0, 6).toUpperCase();
try {
    var ap = new ApDomainService();
    var inv = ap.intakeInvoice({ invoiceNumber: tag + '-AP', companyCode: '1000', currency: 'INR', grossAmount: 1180, netAmount: 1000, taxAmount: 180, source: 'manual' });
    ap.runExtraction(inv.apInvoiceSysId, {});
    var v = ap.validateInvoice(inv.apInvoiceSysId);
    out.push('AP exception ' + v.exceptionSysId + ' (' + v.reasonCode + ') raised for ' + tag + '-AP');

    var ar = new ArDomainService();
    var customer = new GlideRecord('x_695068_bcfa_customer');
    customer.initialize();
    customer.setValue('customer_code', tag);
    customer.setValue('name', 'TEST22 Customer ' + tag);
    customer.setValue('currency', 'INR');
    customer.setValue('active', true);
    var cust = customer.insert();
    var item = new GlideRecord('x_695068_bcfa_ar_open_item');
    item.initialize();
    item.setValue('item_number', tag + '-A');
    item.setValue('customer', cust);
    item.setValue('currency', 'INR');
    item.setValue('invoice_amount', 20000);
    item.setValue('open_amount', 20000);
    item.setValue('status', 'open');
    item.insert();
    var pay = ar.intakePayment({ bankReference: 'BANK-' + tag, customer: cust, currency: 'INR', amount: 19900, bankAccount: 'IN-COLL-TEST22', idempotencyKey: tag + '-PAY' });
    ar.normalizePayment(pay.paymentSysId);
    ar.resolveCustomer(pay.paymentSysId, '');
    ar.matchPayment(pay.paymentSysId);
    var alloc = ar.allocatePayment(pay.paymentSysId);
    out.push('AR exception ' + alloc.exceptionSysId + ' (' + alloc.reasonCode + ') raised for BANK-' + tag);
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_P22B ' + out.join('\n'));
