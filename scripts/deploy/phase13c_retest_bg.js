// Phase 13 retest of the Cash Application Review workflow after the agent
// instruction fix (phase13b_ar_agent_fix_bg.js). Run in Scripts - Background
// with scope = x_695068_bcfa.
//
// RUN 1 (MODE = 'create'): creates a small, clearly labelled test case
// (customer C1004 / ARINV4001 30,000 / payment BANK-POC2-RT1 29,975 with a
// remittance noting a 25 bank charge) and runs it through the same
// deterministic pipeline the intake uses: normalize, customer, remittance
// match, allocation -> short_pay exception -> the workflow starts.
// RUN 2 (MODE = 'close'), a few minutes later: prints the saved AI note,
// then closes the test case the way a reviewer would (Bank Charge
// deduction, approval by the demo approver, clearing).
var MODE = 'create'; // change to 'close' for the second run
var DEMO_APPROVER = 'd33f6290d7533660937e25a599602b2c';
var out = [];

function lookup(table, field, value) {
    var gr = new GlideRecord(table);
    return gr.get(field, value) ? gr.getUniqueValue() : null;
}

function latestException(paymentSysId) {
    var e = new GlideRecord('x_695068_bcfa_ar_exception');
    e.addQuery('payment', paymentSysId);
    e.orderByDesc('sys_created_on');
    e.setLimit(1);
    e.query();
    return e.next() ? e : null;
}

try {
    var ar = new ArDomainService();
    var paymentSysId = lookup('x_695068_bcfa_payment', 'bank_reference', 'BANK-POC2-RT1');

    if (MODE === 'create') {
        if (paymentSysId) throw 'Test case already exists (BANK-POC2-RT1); run with MODE = close.';
        var customer = lookup('x_695068_bcfa_customer', 'customer_code', 'C1004');
        if (!customer) {
            var c = new GlideRecord('x_695068_bcfa_customer');
            c.initialize();
            c.setValue('customer_code', 'C1004');
            c.setValue('name', 'Kaveri Polymers Ltd (RETEST)');
            c.setValue('country', 'India');
            c.setValue('currency', 'INR');
            c.setValue('active', true);
            customer = c.insert();
        }
        if (!lookup('x_695068_bcfa_ar_open_item', 'item_number', 'ARINV4001')) {
            var i = new GlideRecord('x_695068_bcfa_ar_open_item');
            i.initialize();
            i.setValue('item_number', 'ARINV4001');
            i.setValue('customer', customer);
            i.setValue('currency', 'INR');
            i.setValue('invoice_amount', 30000);
            i.setValue('open_amount', 30000);
            i.setValue('status', 'open');
            i.insert();
        }
        paymentSysId = ar.intakePayment({ bankReference: 'BANK-POC2-RT1', currency: 'INR', amount: 29975, bankAccount: 'IN-COLL-RETEST', valueDate: '2026-09-28', idempotencyKey: 'POC2-RT1' }).paymentSysId;
        ar.intakeRemittance(paymentSysId, {
            remittanceReference: 'BANK-POC2-RT1', source: 'document', receivedDate: '2026-09-28', confidence: 0.96,
            extractedFields: {
                customer_name: 'Kaveri Polymers Ltd (RETEST)', payment_reference: 'BANK-POC2-RT1', payment_amount: 29975, currency: 'INR',
                invoice_references: ['ARINV4001'], invoice_lines: [{ invoice_reference: 'ARINV4001', amount_applied: 29975 }],
                deduction_amount: 25, deduction_reason: 'Amount remitted less INR 25.00 bank charges.', confidence: 0.96,
                extraction_method: 'RETEST (values set by the test script)'
            }
        });
        out.push('normalize ' + JSON.stringify(ar.normalizePayment(paymentSysId)));
        out.push('customer ' + JSON.stringify(ar.resolveCustomer(paymentSysId, 'Kaveri Polymers Ltd (RETEST)')));
        out.push('match ' + ar.matchPayment(paymentSysId).mode);
        var allocation = ar.allocatePayment(paymentSysId);
        out.push('allocation balanced=' + allocation.balanced + ' reason=' + allocation.reasonCode + ' exception=' + allocation.exceptionSysId);
        out.push('Now wait a few minutes, set MODE = close and run again.');
    } else {
        if (!paymentSysId) throw 'No test case: run with MODE = create first.';
        var e = latestException(paymentSysId);
        var note = e.getValue('ai_recommendation') || '';
        out.push('exception ' + e.getUniqueValue() + ' ' + e.getValue('reason_code') + ' residual=' + e.getValue('residual_amount'));
        out.push('AI note (' + note.length + ' chars): header=' + (note.indexOf('AI REVIEW') === 0) + ' BANK_CHARGE=' + /BANK_CHARGE/.test(note) +
            '\n' + (note || 'NOT YET RECORDED - wait and run again'));
        if (note && e.getValue('status') === 'open') {
            e.setValue('deduction_type', 'bank_charge');
            e.update();
            var result = new ArExceptionDecisionService().decide(e.getUniqueValue(), 'approve_deduction', 'Phase 13 retest: 25 correspondent bank charge per remittance; closing the test case.');
            out.push('approve deduction: ' + JSON.stringify(result));
            if (result.ok && result.approvalRequired) {
                var approved = ar.decideApproval(paymentSysId, result.approvalSysId, 'approved', DEMO_APPROVER, 'Phase 13 retest: closing the test case.');
                var p = new GlideRecord('x_695068_bcfa_payment');
                p.get(paymentSysId);
                out.push('approval ' + (approved.error ? 'ERROR ' + approved.error : 'ok') + ' -> payment state ' + p.getValue('state'));
            }
        }
    }
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_RETEST13 ' + out.join('\n'));
