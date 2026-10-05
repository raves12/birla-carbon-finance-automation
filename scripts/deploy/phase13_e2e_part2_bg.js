// Phase 13 end-to-end test, part 2 of 2. Run in Scripts - Background with
// scope = x_695068_bcfa, after part 1 and after the Cash Application Review
// workflow has recorded its advisory note (a few minutes).
//
// Case C (79,500 paid against 80,000 open; remittance says 500 bank charge),
// decided through ArExceptionDecisionService, the service the exception
// buttons call, as the signed-in user:
//   no reason (refused), Hold -> ON_HOLD,
//   Approve Deduction with no type (refused), with a type that is not
//   allowed (refused), then with Bank Charge -> Deduction 500 recorded ->
//   balance re-checked (80,000 - 500 = 79,500) -> PENDING_APPROVAL,
//   self-approval (blocked), approval by the demo approver -> clearing -> CLOSED.
var DEMO_APPROVER = 'd33f6290d7533660937e25a599602b2c'; // bcfa.finance.approver
var out = [];

function paymentLine(id) {
    var p = new GlideRecord('x_695068_bcfa_payment');
    if (!p.get(id)) return 'payment not found';
    return p.getValue('bank_reference') + ' ' + p.getValue('amount') + ' state=' + p.getValue('state');
}

function show(label, result) {
    out.push(label + ': ' + (result.ok ? 'ok ' + JSON.stringify(result) : 'REFUSED ' + result.error));
}

function setDeductionType(exceptionSysId, type) {
    // What the reviewer does on the form before clicking Approve Deduction.
    var e = new GlideRecord('x_695068_bcfa_ar_exception');
    e.get(exceptionSysId);
    e.setValue('deduction_type', type);
    e.update();
}

try {
    var intake = new GlideRecord('x_695068_bcfa_finance_intake');
    intake.addQuery('source_reference', 'AR_REMIT_103_BANK_CHARGE.pdf');
    intake.query();
    if (!intake.next() || !intake.getValue('payment')) throw 'Run part 1 first: no processed intake for AR_REMIT_103_BANK_CHARGE.pdf';
    var paymentSysId = intake.getValue('payment');

    var exception = new GlideRecord('x_695068_bcfa_ar_exception');
    exception.addQuery('payment', paymentSysId);
    exception.orderByDesc('sys_created_on');
    exception.setLimit(1);
    exception.query();
    if (!exception.next()) throw 'No AR exception on payment ' + paymentSysId;
    var exceptionSysId = exception.getUniqueValue();
    var note = exception.getValue('ai_recommendation') || '';
    out.push('C ' + exception.getValue('reason_code') + ' ' + exceptionSysId + ' residual=' + exception.getValue('residual_amount') +
        ' | AI note: ' + (note ? note.length + ' chars, mentions bank charge=' + /bank[ _]charge/i.test(note) + ', starts "' + note.substring(0, 120).replace(/\n/g, ' ') + '"' : 'NOT YET RECORDED'));

    var decisionService = new ArExceptionDecisionService();
    show('C no reason', decisionService.decide(exceptionSysId, 'hold', ''));
    show('C hold', decisionService.decide(exceptionSysId, 'hold', 'Phase 13 E2E: confirming the 500 short payment with the customer.'));
    out.push('  -> ' + paymentLine(paymentSysId));

    var reason = 'Phase 13 E2E: remittance states INR 500 correspondent bank charges; accepted as BANK_CHARGE per policy.';
    show('C approve deduction, no type', decisionService.decide(exceptionSysId, 'approve_deduction', reason));
    setDeductionType(exceptionSysId, 'credit_note_netting');
    show('C approve deduction, type not allowed', decisionService.decide(exceptionSysId, 'approve_deduction', reason));
    setDeductionType(exceptionSysId, 'bank_charge');
    var result = decisionService.decide(exceptionSysId, 'approve_deduction', reason);
    show('C approve deduction, bank charge', result);

    if (result.ok) {
        var d = new GlideRecord('x_695068_bcfa_deduction');
        d.get(result.deductionSysId);
        out.push('  deduction ' + d.getValue('deduction_type') + ' ' + d.getValue('amount') + ' ' + d.getValue('status') +
            ' on ' + d.payment_allocation.ar_open_item.getDisplayValue() + ' approved_by=' + d.getDisplayValue('approved_by'));
        if (result.approvalRequired) {
            var ar = new ArDomainService();
            var self = ar.decideApproval(paymentSysId, result.approvalSysId, 'approved', gs.getUserID(), 'Phase 13 E2E: self-approval attempt');
            out.push('  self-approval ' + (self.error ? 'BLOCKED: ' + self.error : 'NOT BLOCKED (defect)'));
            var approved = ar.decideApproval(paymentSysId, result.approvalSysId, 'approved', DEMO_APPROVER, 'Phase 13 E2E: deduction and allocation confirmed by the demo finance approver.');
            out.push('  approval ' + (approved.error ? 'ERROR ' + approved.error : 'ok'));
        }
    }

    var final = new GlideRecord('x_695068_bcfa_ar_exception');
    final.get(exceptionSysId);
    out.push('C final: exception status=' + final.getValue('status') + ' decision=' + final.getValue('decision') + ' type=' + final.getValue('deduction_type') +
        ' by=' + final.getDisplayValue('decided_by') + ' | ' + paymentLine(paymentSysId));

    var t = new GlideRecord('x_695068_bcfa_integration_txn');
    t.addQuery('source_record', paymentSysId);
    t.orderBy('sys_created_on');
    t.query();
    var txns = [];
    while (t.next()) txns.push(t.getValue('operation') + ':' + t.getValue('status') + (t.getValue('external_document_id') ? ':' + t.getValue('external_document_id') : ''));
    out.push('  integration [' + txns.join(', ') + ']');

    var items = new GlideRecord('x_695068_bcfa_ar_open_item');
    items.addQuery('item_number', 'IN', 'ARINV3001,ARINV3002');
    items.orderBy('item_number');
    items.query();
    var lines = [];
    while (items.next()) lines.push(items.getValue('item_number') + ' open=' + items.getValue('open_amount') + ' ' + items.getValue('status'));
    out.push('  open items [' + lines.join(', ') + ']');
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_E2E13B ' + out.join('\n'));
