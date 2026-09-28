// Phase 14 live test of the new matching paths through ArDomainService (the
// engine rules themselves are covered by the ATF suite). Run in Scripts -
// Background with scope = x_695068_bcfa. Test data is labelled TEST14.
//
// RUN 1 (MODE = 'create'):
//   CN  customer C1401, ARINV1401 40,000, open credit note CN1401 1,500;
//       payment 38,500 with a remittance -> short pay 1,500 -> the engine
//       suggests CREDIT_NOTE netting with CN1401 on the exception.
//   AMB customer C1402, ARINV1402A 25,000 + ARINV1402B 15,000 + ARINV1402C
//       15,000; payment 40,000 without remittance -> two exact options
//       (A+B, A+C) -> ambiguous_match exception; the AI review ranks them.
// RUN 2 (MODE = 'close'), a few minutes later:
//   prints both AI notes; CN: Approve Deduction (credit note netting) ->
//   approval by the demo approver -> clearing -> credit note applied;
//   AMB: Request Clarification -> the customer's remittance (A+B) arrives
//   -> Resolve & Retry -> remittance match -> approval -> clearing; C stays open.
var MODE = 'create'; // change to 'close' for the second run
var DEMO_APPROVER = 'd33f6290d7533660937e25a599602b2c';
var out = [];

function lookup(table, field, value) {
    var gr = new GlideRecord(table);
    return gr.get(field, value) ? gr.getUniqueValue() : null;
}
function ins(table, fields) {
    var g = new GlideRecord(table);
    g.initialize();
    for (var k in fields) g.setValue(k, fields[k]);
    return g.insert();
}
function latestException(paymentSysId) {
    var e = new GlideRecord('x_695068_bcfa_ar_exception');
    e.addQuery('payment', paymentSysId);
    e.orderByDesc('sys_created_on');
    e.setLimit(1);
    e.query();
    return e.next() ? e : null;
}
function state(table, sysId, fields) {
    var g = new GlideRecord(table);
    if (!g.get(sysId)) return 'not found';
    return fields.map(function(f) { return f + '=' + g.getValue(f); }).join(' ');
}
function exceptionLine(e) {
    return 'exception ' + e.getUniqueValue() + ' reason=' + e.getValue('reason_code') + ' residual=' + e.getValue('residual_amount') +
        ' suggested type=' + e.getValue('deduction_type') + ' credit note=' + e.getDisplayValue('credit_note') + ' | rule=' + e.getValue('rule_result') +
        ' | evidence=' + (e.getValue('evidence') || '').replace(/\n/g, ' / ');
}

try {
    var ar = new ArDomainService();
    var cnPayment = lookup('x_695068_bcfa_payment', 'bank_reference', 'BANK-T14-CN');
    var ambPayment = lookup('x_695068_bcfa_payment', 'bank_reference', 'BANK-T14-AMB');

    if (MODE === 'create') {
        if (cnPayment || ambPayment) throw 'TEST14 data already exists; run with MODE = close.';
        var c1 = ins('x_695068_bcfa_customer', { customer_code: 'C1401', name: 'Godavari Tyres Ltd (TEST14)', country: 'India', currency: 'INR', active: true });
        var c2 = ins('x_695068_bcfa_customer', { customer_code: 'C1402', name: 'Tapti Rubber Works (TEST14)', country: 'India', currency: 'INR', active: true });
        ins('x_695068_bcfa_ar_open_item', { item_number: 'ARINV1401', customer: c1, currency: 'INR', invoice_amount: 40000, open_amount: 40000, status: 'open' });
        ins('x_695068_bcfa_credit_note', { credit_note_number: 'CN1401', customer: c1, amount: 1500, open_amount: 1500, status: 'open' });
        ins('x_695068_bcfa_ar_open_item', { item_number: 'ARINV1402A', customer: c2, currency: 'INR', invoice_amount: 25000, open_amount: 25000, status: 'open' });
        ins('x_695068_bcfa_ar_open_item', { item_number: 'ARINV1402B', customer: c2, currency: 'INR', invoice_amount: 15000, open_amount: 15000, status: 'open' });
        ins('x_695068_bcfa_ar_open_item', { item_number: 'ARINV1402C', customer: c2, currency: 'INR', invoice_amount: 15000, open_amount: 15000, status: 'open' });

        cnPayment = ar.intakePayment({ bankReference: 'BANK-T14-CN', currency: 'INR', amount: 38500, bankAccount: 'IN-COLL-TEST14', valueDate: '2026-09-28', idempotencyKey: 'T14-CN' }).paymentSysId;
        ar.intakeRemittance(cnPayment, { remittanceReference: 'BANK-T14-CN', source: 'document', confidence: 0.96, extractedFields: {
            customer_name: 'Godavari Tyres Ltd (TEST14)', payment_reference: 'BANK-T14-CN', payment_amount: 38500, currency: 'INR',
            invoice_references: ['ARINV1401'], invoice_lines: [{ invoice_reference: 'ARINV1401', amount_applied: 38500 }],
            deduction_amount: 1500, deduction_reason: 'Less credit note CN1401 (INR 1,500.00).', extraction_method: 'TEST14 (values set by the test script)' } });
        ar.normalizePayment(cnPayment);
        ar.resolveCustomer(cnPayment, 'Godavari Tyres Ltd (TEST14)');
        out.push('CN match=' + ar.matchPayment(cnPayment).mode);
        var cnAlloc = ar.allocatePayment(cnPayment);
        out.push('CN allocation balanced=' + cnAlloc.balanced + ' reason=' + cnAlloc.reasonCode);
        if (cnAlloc.exceptionSysId) out.push('CN ' + exceptionLine(latestException(cnPayment)));

        ambPayment = ar.intakePayment({ bankReference: 'BANK-T14-AMB', customer: c2, currency: 'INR', amount: 40000, bankAccount: 'IN-COLL-TEST14', valueDate: '2026-09-28', idempotencyKey: 'T14-AMB' }).paymentSysId;
        ar.normalizePayment(ambPayment);
        ar.resolveCustomer(ambPayment, '');
        var ambMatch = ar.matchPayment(ambPayment);
        out.push('AMB matched=' + ambMatch.matched + ' reason=' + ambMatch.reasonCode);
        if (ambMatch.exceptionSysId) out.push('AMB ' + exceptionLine(latestException(ambPayment)));
        out.push('Now wait a few minutes, set MODE = close and run again.');
    } else {
        if (!cnPayment || !ambPayment) throw 'No TEST14 data: run with MODE = create first.';
        var decisions = new ArExceptionDecisionService();

        var cnException = latestException(cnPayment);
        out.push('CN AI note:\n' + (cnException.getValue('ai_recommendation') || 'NOT YET RECORDED'));
        if (cnException.getValue('status') === 'open') {
            var cn = decisions.decide(cnException.getUniqueValue(), 'approve_deduction', 'TEST14: remittance nets credit note CN1401 (1,500) against ARINV1401.');
            out.push('CN approve deduction: ' + JSON.stringify(cn));
            if (cn.ok && cn.approvalRequired) {
                var cnApproval = ar.decideApproval(cnPayment, cn.approvalSysId, 'approved', DEMO_APPROVER, 'TEST14: approved.');
                out.push('CN approval ' + (cnApproval.error ? 'ERROR ' + cnApproval.error : 'ok'));
            }
        }
        out.push('CN payment ' + state('x_695068_bcfa_payment', cnPayment, ['state']) +
            ' | ARINV1401 ' + state('x_695068_bcfa_ar_open_item', lookup('x_695068_bcfa_ar_open_item', 'item_number', 'ARINV1401'), ['open_amount', 'status']) +
            ' | CN1401 ' + state('x_695068_bcfa_credit_note', lookup('x_695068_bcfa_credit_note', 'credit_note_number', 'CN1401'), ['open_amount', 'status']));

        var ambException = latestException(ambPayment);
        out.push('AMB AI note:\n' + (ambException.getValue('ai_recommendation') || 'NOT YET RECORDED'));
        if (ambException.getValue('status') === 'open') {
            out.push('AMB request clarification: ' + JSON.stringify(decisions.decide(ambException.getUniqueValue(), 'request_clarification',
                'TEST14: two exact options; asked the customer which invoices this payment covers.')));
            // The customer's remittance arrives: ARINV1402A + ARINV1402B.
            ar.intakeRemittance(ambPayment, { remittanceReference: 'BANK-T14-AMB', source: 'email', confidence: 1, extractedFields: {
                customer_name: 'Tapti Rubber Works (TEST14)', payment_reference: 'BANK-T14-AMB', payment_amount: 40000, currency: 'INR',
                invoice_references: ['ARINV1402A', 'ARINV1402B'],
                invoice_lines: [{ invoice_reference: 'ARINV1402A', amount_applied: 25000 }, { invoice_reference: 'ARINV1402B', amount_applied: 15000 }] } });
            var retry = ar.resolveExceptionAndRetry(ambPayment, ambException.getUniqueValue(), 'TEST14: customer remittance names ARINV1402A and ARINV1402B.', gs.getUserID());
            out.push('AMB retry mode=' + retry.mode + ' balanced=' + (retry.allocation && retry.allocation.balanced) + ' approvalRequired=' + (retry.approval && retry.approval.approvalRequired));
            if (retry.approval && retry.approval.approvalRequired) {
                var ambApproval = ar.decideApproval(ambPayment, retry.approval.approvalSysId, 'approved', DEMO_APPROVER, 'TEST14: approved after remittance.');
                out.push('AMB approval ' + (ambApproval.error ? 'ERROR ' + ambApproval.error : 'ok'));
            }
        }
        out.push('AMB payment ' + state('x_695068_bcfa_payment', ambPayment, ['state']) + ' | ' + ['ARINV1402A', 'ARINV1402B', 'ARINV1402C'].map(function(n) {
            return n + ' ' + state('x_695068_bcfa_ar_open_item', lookup('x_695068_bcfa_ar_open_item', 'item_number', n), ['open_amount', 'status']);
        }).join(' | '));
    }
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_T14 ' + out.join('\n'));
