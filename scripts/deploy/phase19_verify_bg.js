// Phase 19 verification. Run in Scripts - Background with scope =
// x_695068_bcfa, after phase19_audit_bg.js (global).
//
//   0 backfill: process on existing Audit Events (from the source table),
//     written with setWorkflow(false) because the table is append-only
//   1 AP journey TEST19: intake, extraction, validation, match, approval
//     rule, approval request, approval, SAP post, reconciliation, closure
//   2 AP exception: validation failure (missing vendor) -> exception, AI
//     invocation, human hold decision; then a vendor and date correction
//     (field_corrected)
//   3 AR journey TEST19: 2 open items paid by one payment -> combination
//     match, allocation, AI explanation, approval, clearing, settlement
//   4 AR short pay: bank-charge deduction approved by a person
//   5 integration: timeout -> reconciliation
//   6 document intake: upload -> extraction without fixture -> review ->
//     document type corrected -> human review
//   7 append-only: an update and a delete of an Audit Event are refused
//   8 coverage: every Phase 19 event type was written in this run, and
//     every row has process, event, record, user and timestamp
var out = [];
var start = new GlideDateTime();
var tag = 'T19-' + gs.generateGUID().substring(0, 6).toUpperCase();
var U = { apProcessor: 'bcfa.ap.processor', arProcessor: 'bcfa.ar.processor', approver: 'bcfa.finance.approver', controller: 'bcfa.finance.controller' };
var id = {};

function chain(correlationId, label) {
    var e = new GlideRecord('x_695068_bcfa_audit_event');
    e.addQuery('correlation_id', correlationId);
    e.orderBy('occurred_at');
    e.orderBy('sys_created_on');
    e.query();
    var rows = [];
    while (e.next()) {
        rows.push('    ' + e.getValue('event_type') + ' [' + e.getValue('process') + '/' + e.getValue('actor_type') + ' ' + e.getDisplayValue('actor') +
            (e.getValue('ai_agent') ? ' ai=' + e.getValue('ai_agent') : '') + '] ' + String(e.getValue('description')).substring(0, 110) +
            (e.getValue('reason') ? ' | reason: ' + String(e.getValue('reason')).substring(0, 80) : ''));
    }
    out.push(label + ' audit chain (' + rows.length + ' events):\n' + rows.join('\n'));
}
function insert(table, fields) {
    var gr = new GlideRecord(table);
    gr.initialize();
    for (var f in fields) gr.setValue(f, fields[f]);
    return gr.insert();
}
function corr(table, sysId) {
    var gr = new GlideRecord(table);
    return gr.get(sysId) ? gr.getValue('correlation_id') : '';
}

try {
    for (var key in U) {
        var user = new GlideRecord('sys_user');
        if (!user.get('user_name', U[key])) throw 'Missing demo user ' + U[key];
        id[key] = user.getUniqueValue();
    }

    // 0 backfill
    for (var table in AuditEngine.PROCESS_BY_TABLE) {
        var b = new GlideRecord('x_695068_bcfa_audit_event');
        b.addQuery('source_table', table);
        b.addNullQuery('process');
        b.setWorkflow(false);
        b.setValue('process', AuditEngine.PROCESS_BY_TABLE[table]);
        b.updateMultiple();
    }
    var rest = new GlideRecord('x_695068_bcfa_audit_event');
    rest.addNullQuery('process');
    rest.setWorkflow(false);
    rest.setValue('process', 'platform');
    rest.updateMultiple();
    var noProcess = new GlideAggregate('x_695068_bcfa_audit_event');
    noProcess.addNullQuery('process');
    noProcess.addAggregate('COUNT');
    noProcess.query();
    var byProcess = new GlideAggregate('x_695068_bcfa_audit_event');
    byProcess.addAggregate('COUNT');
    byProcess.groupBy('process');
    byProcess.query();
    var counts = [];
    while (byProcess.next()) counts.push(byProcess.getValue('process') + '=' + byProcess.getAggregate('COUNT'));
    out.push('0 backfill: rows without process now ' + (noProcess.next() ? noProcess.getAggregate('COUNT') : '?') + '; by process ' + counts.join(', '));

    // 1 AP journey
    var ap = new ApDomainService();
    var vendor = new GlideRecord('x_695068_bcfa_vendor');
    vendor.get('vendor_code', 'V002');
    var inv = ap.intakeInvoice({ invoiceNumber: tag + '-AP1', vendor: vendor.getUniqueValue(), companyCode: '1000', currency: 'INR',
        grossAmount: 1180, netAmount: 1000, taxAmount: 180, source: 'manual' });
    ap.runExtraction(inv.apInvoiceSysId, {});
    var v = ap.validateInvoice(inv.apInvoiceSysId);
    var m = v.validated ? ap.matchInvoice(inv.apInvoiceSysId) : { matched: false };
    if (!m.matched) throw 'AP1 did not reach MATCHED: ' + JSON.stringify(v.validated ? m : v);
    var route = ap.routeForApproval(inv.apInvoiceSysId, id.apProcessor);
    var decision = route.approvalRequired ? ap.decideApproval(inv.apInvoiceSysId, route.approvalSysId, 'approved', id.controller, tag + ': approved.') : route.decision;
    out.push('1 AP1 decision: ' + JSON.stringify(decision && (decision.error || decision.decision)));
    chain(inv.correlationId, '1 AP1');

    // 2 AP exception + human review + field correction
    var inv2 = ap.intakeInvoice({ invoiceNumber: tag + '-AP2', companyCode: '1000', currency: 'INR',
        grossAmount: 1180, netAmount: 1000, taxAmount: 180, source: 'manual' });
    ap.runExtraction(inv2.apInvoiceSysId, {});
    var v2 = ap.validateInvoice(inv2.apInvoiceSysId);
    var hold = v2.exceptionSysId ? new ApExceptionDecisionService().decide(v2.exceptionSysId, 'hold', tag + ': waiting for the vendor to confirm the amount.') : { error: 'no exception' };
    out.push('2 AP2 validation ' + (v2.validated ? 'passed (unexpected)' : 'failed: ' + v2.reasonCode) + '; hold: ' + (hold.error || 'ok'));
    var fix = new GlideRecord('x_695068_bcfa_ap_invoice');
    fix.get(inv2.apInvoiceSysId);
    fix.setValue('vendor', vendor.getUniqueValue());
    fix.setValue('invoice_date', '2026-09-27');
    fix.update();
    chain(inv2.correlationId, '2 AP2');

    // 3 AR journey
    var ar = new ArDomainService();
    var customer = insert('x_695068_bcfa_customer', { customer_code: tag, name: 'TEST19 Customer ' + tag, company_code: '1000', country: 'India', currency: 'INR', active: true });
    insert('x_695068_bcfa_ar_open_item', { item_number: tag + '-A', customer: customer, company_code: '1000', currency: 'INR', invoice_amount: 10000, open_amount: 10000, status: 'open' });
    insert('x_695068_bcfa_ar_open_item', { item_number: tag + '-B', customer: customer, company_code: '1000', currency: 'INR', invoice_amount: 5000, open_amount: 5000, status: 'open' });
    var pay = ar.intakePayment({ bankReference: 'BANK-' + tag + '-1', customer: customer, currency: 'INR', amount: 15000,
        bankAccount: 'IN-COLL-TEST19', idempotencyKey: tag + '-PAY1' });
    ar.normalizePayment(pay.paymentSysId);
    ar.resolveCustomer(pay.paymentSysId, '');
    var match = ar.matchPayment(pay.paymentSysId);
    var alloc = match.matched ? ar.allocatePayment(pay.paymentSysId) : { balanced: false };
    if (!alloc.balanced) throw 'AR1 did not balance: ' + JSON.stringify(match) + ' ' + JSON.stringify(alloc);
    var arRoute = ar.routeForApproval(pay.paymentSysId, id.arProcessor);
    var arDecision = arRoute.approvalRequired ? ar.decideApproval(pay.paymentSysId, arRoute.approvalSysId, 'approved', id.approver, tag + ': clearing approved.') : arRoute.decision;
    out.push('3 AR1 match ' + match.mode + '; decision: ' + JSON.stringify(arDecision && (arDecision.error || arDecision.decision)));
    chain(pay.correlationId, '3 AR1');

    // 4 AR short pay -> bank charge deduction
    insert('x_695068_bcfa_ar_open_item', { item_number: tag + '-C', customer: customer, company_code: '1000', currency: 'INR', invoice_amount: 20000, open_amount: 20000, status: 'open' });
    var pay2 = ar.intakePayment({ bankReference: 'BANK-' + tag + '-2', customer: customer, currency: 'INR', amount: 19900,
        bankAccount: 'IN-COLL-TEST19', idempotencyKey: tag + '-PAY2' });
    ar.normalizePayment(pay2.paymentSysId);
    ar.resolveCustomer(pay2.paymentSysId, '');
    var match2 = ar.matchPayment(pay2.paymentSysId);
    var alloc2 = ar.allocatePayment(pay2.paymentSysId);
    var ded = alloc2.exceptionSysId ? new ArExceptionDecisionService().decide(alloc2.exceptionSysId, 'approve_deduction', tag + ': bank charge confirmed by the bank advice.') : { error: 'no exception: ' + JSON.stringify(alloc2) };
    out.push('4 AR2 match ' + (match2.mode || match2.reasonCode || match2.matched) + '; allocation ' + (alloc2.reasonCode || 'balanced') + '; deduction: ' + (ded.error || 'ok'));
    var p2 = new GlideRecord('x_695068_bcfa_payment');
    p2.get(pay2.paymentSysId);
    p2.setValue('bank_account', 'IN-COLL-TEST19-CORRECTED');
    p2.update();
    chain(pay2.correlationId, '4 AR2');

    // 5 integration reconciliation
    var svc = new IntegrationService();
    var t1 = svc.execute({ operation: 'postVendorInvoice', adapter: 'mock_sap', correlationId: tag + '-INT', idempotencyKey: tag + '-INT-1',
        externalReference: tag + '|INT', sourceTable: 'x_695068_bcfa_ap_invoice', sourceRecord: tag + '-INT', payload: { amount: 1 }, simulateOutcome: 'timeout' });
    var rec = svc.reconcileUnknownOutcome(t1.transactionSysId);
    out.push('5 integration timeout -> reconcile ' + rec.resolution);
    chain(tag + '-INT', '5 INT');

    // 6 document intake
    var intakeSysId = insert('x_695068_bcfa_finance_intake', { source: 'workspace_upload', document_type: 'ap_invoice', processing_status: 'new', source_reference: tag });
    var intake = new GlideRecord('x_695068_bcfa_finance_intake');
    intake.get(intakeSysId);
    new GlideSysAttachment().write(intake, tag + '_UNKNOWN_INVOICE.pdf', 'application/pdf', '%PDF-1.4 TEST19 ' + tag);
    var fdi = new FinanceDocumentIntakeService();
    var r1 = fdi.processDocument(intakeSysId);
    intake.get(intakeSysId);
    intake.setValue('document_type', 'ar_remittance');
    intake.update();
    var r2 = fdi.processDocument(intakeSysId);
    out.push('6 intake ' + intake.getValue('number') + ': first ' + JSON.stringify(r1).substring(0, 120) + '; after review ' + JSON.stringify(r2).substring(0, 120));
    var ie = new GlideRecord('x_695068_bcfa_audit_event');
    ie.addQuery('source_record', intakeSysId);
    ie.orderBy('sys_created_on');
    ie.query();
    var irows = [];
    while (ie.next()) irows.push('    ' + ie.getValue('event_type') + ' [' + ie.getValue('actor_type') + ' ' + ie.getDisplayValue('actor') + '] ' +
        String(ie.getValue('description')).substring(0, 120));
    out.push('6 intake audit (' + irows.length + ' events):\n' + irows.join('\n'));

    // 7 append-only
    var ev = new GlideRecord('x_695068_bcfa_audit_event');
    ev.addQuery('correlation_id', inv.correlationId);
    ev.setLimit(1);
    ev.query();
    ev.next();
    var evId = ev.getUniqueValue();
    var original = ev.getValue('description');
    ev.setValue('description', 'TAMPERED');
    ev.update();
    var check = new GlideRecord('x_695068_bcfa_audit_event');
    check.get(evId);
    out.push('7 update refused: ' + (check.getValue('description') === original ? 'PASS' : 'FAIL (description now ' + check.getValue('description') + ')'));
    check.deleteRecord();
    var still = new GlideRecord('x_695068_bcfa_audit_event');
    out.push('7 delete refused: ' + (still.get(evId) ? 'PASS' : 'FAIL (row deleted)'));

    // 8 coverage
    var seen = {};
    var bad = 0;
    var total = 0;
    var all = new GlideRecord('x_695068_bcfa_audit_event');
    all.addQuery('sys_created_on', '>=', start.getValue());
    all.query();
    while (all.next()) {
        total++;
        seen[all.getValue('event_type')] = (seen[all.getValue('event_type')] || 0) + 1;
        if (!all.getValue('process') || !all.getValue('source_record') || !all.getValue('actor') || !all.getValue('occurred_at')) bad++;
    }
    var missing = [];
    for (var type in AuditEngine.EVENTS) {
        if (type === 'human_decision' || type === 'state_transition') continue;
        if (!seen[type]) missing.push(type);
    }
    var seenList = [];
    for (var s in seen) seenList.push(s + '=' + seen[s]);
    out.push('8 coverage: ' + total + ' events this run; ' + seenList.join(', '));
    out.push('8 event types not written: ' + (missing.length ? missing.join(', ') : 'none -> PASS'));
    out.push('8 rows missing process/record/user/timestamp: ' + bad + (bad ? ' FAIL' : ' PASS'));
} catch (err) {
    out.push('ERROR ' + err + (err && err.stack ? ' ' + err.stack : ''));
}
gs.info('BCFA_P19 ' + out.join('\n'));
