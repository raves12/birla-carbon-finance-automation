// Phase 17 verification. Run in Scripts - Background with scope =
// x_695068_bcfa, after phase17_sod_bg.js (global).
//
// Exercises every segregation-of-duties rule through the same service calls
// the Approve / Reject buttons make, with the demo users, on TEST17 data:
//   AP-1 requested by the finance approver: AI user refused (AI identity),
//        AR processor refused (no ap_approver), finance approver refused
//        (requester), finance controller approves -> posted, closed
//   AP-2 requested by the AP processor, the finance approver recorded a
//        processor decision (hold) on one of its exceptions: finance
//        approver refused (processor), finance controller approves
//   AP-3 2,000,000 -> routed to BCFA Finance Controllers by the approval
//        decision table: finance approver refused (not in the group),
//        finance controller approves
//   AR-1 15,000 payment for TEST14 customer C1402 (ARINV1402C), requested by
//        the AR processor: AR processor refused (no ar_approver), finance
//        approver approves -> cleared
//   AI   no AI identity holds an approver role
// Each approval record shows requested by, group, type, approver, decision,
// comments, time, SoD check, state before and after.
var U = {
    apProcessor: 'bcfa.ap.processor', arProcessor: 'bcfa.ar.processor',
    approver: 'bcfa.finance.approver', controller: 'bcfa.finance.controller', ai: 'bcfa.ai.reviewer'
};
var out = [];
var id = {};

function approvalLine(table, approvalSysId) {
    var a = new GlideRecord(table);
    a.get(approvalSysId);
    return ['requested_by', 'approval_group', 'approval_type', 'approver', 'decision', 'decision_notes', 'decided_at', 'state_before', 'state_after', 'sod_check']
        .map(function(f) { return f + '=' + (a.getDisplayValue(f) || '-'); }).join(' | ');
}
function attempt(label, fn) {
    var r = fn();
    out.push('  ' + label + ': ' + (r.error ? 'REFUSED ' + r.error : 'OK'));
    return r;
}
function apInvoice(label, gross, net, tax, requester) {
    var ap = new ApDomainService();
    var vendor = new GlideRecord('x_695068_bcfa_vendor');
    vendor.get('vendor_code', 'V002');
    var inv = ap.intakeInvoice({ invoiceNumber: 'TEST17-' + label + '-' + gs.generateGUID().substring(0, 6).toUpperCase(),
        vendor: vendor.getUniqueValue(), companyCode: '1000', currency: 'INR', grossAmount: gross, netAmount: net, taxAmount: tax, source: 'manual' });
    ap.runExtraction(inv.apInvoiceSysId, {});
    var v = ap.validateInvoice(inv.apInvoiceSysId);
    var m = v.validated ? ap.matchInvoice(inv.apInvoiceSysId) : { matched: false };
    if (!m.matched) throw label + ' did not reach MATCHED: ' + JSON.stringify(v.validated ? m : v);
    var route = ap.routeForApproval(inv.apInvoiceSysId, requester);
    return { invoice: inv.apInvoiceSysId, approval: route.approvalSysId, ap: ap };
}
function invoiceState(sysId) {
    var i = new GlideRecord('x_695068_bcfa_ap_invoice');
    i.get(sysId);
    return i.getValue('invoice_number') + ' ' + i.getValue('state') + ' posting=' + i.getValue('posting_state');
}

try {
    for (var key in U) {
        var user = new GlideRecord('sys_user');
        if (!user.get('user_name', U[key])) throw 'Missing demo user ' + U[key] + ' (run phase17_sod_bg.js first)';
        id[key] = user.getUniqueValue();
    }

    // AP-1
    var a1 = apInvoice('AP1', 1180, 1000, 180, id.approver);
    out.push('AP-1 ' + invoiceState(a1.invoice));
    attempt('AI user approves', function() { return a1.ap.decideApproval(a1.invoice, a1.approval, 'approved', id.ai, 'TEST17'); });
    attempt('AR processor approves', function() { return a1.ap.decideApproval(a1.invoice, a1.approval, 'approved', id.arProcessor, 'TEST17'); });
    attempt('finance approver (requester) approves', function() { return a1.ap.decideApproval(a1.invoice, a1.approval, 'approved', id.approver, 'TEST17'); });
    attempt('finance controller approves', function() { return a1.ap.decideApproval(a1.invoice, a1.approval, 'approved', id.controller, 'TEST17: approved by the controller.'); });
    out.push('  -> ' + invoiceState(a1.invoice));
    out.push('  approval: ' + approvalLine('x_695068_bcfa_ap_approval', a1.approval));

    // AP-2
    var a2 = apInvoice('AP2', 2360, 2000, 360, id.apProcessor);
    var held = new GlideRecord('x_695068_bcfa_ap_exception');
    held.initialize();
    held.setValue('ap_invoice', a2.invoice);
    held.setValue('reason_code', 'other');
    held.setValue('description', 'TEST17: earlier exception on this invoice, held by the finance approver (processor decision).');
    held.setValue('status', 'closed');
    held.setValue('decision', 'hold');
    held.setValue('decided_by', id.approver);
    held.insert();
    out.push('AP-2 ' + invoiceState(a2.invoice));
    attempt('finance approver (made a processor decision) approves', function() { return a2.ap.decideApproval(a2.invoice, a2.approval, 'approved', id.approver, 'TEST17'); });
    attempt('finance controller approves', function() { return a2.ap.decideApproval(a2.invoice, a2.approval, 'approved', id.controller, 'TEST17: approved by the controller.'); });
    out.push('  -> ' + invoiceState(a2.invoice));

    // AP-3
    var a3 = apInvoice('AP3', 2000000, 1694915.25, 305084.75, id.apProcessor);
    out.push('AP-3 ' + invoiceState(a3.invoice));
    attempt('finance approver (not in BCFA Finance Controllers) approves', function() { return a3.ap.decideApproval(a3.invoice, a3.approval, 'approved', id.approver, 'TEST17'); });
    attempt('finance controller approves', function() { return a3.ap.decideApproval(a3.invoice, a3.approval, 'approved', id.controller, 'TEST17: high value approved by the controller.'); });
    out.push('  -> ' + invoiceState(a3.invoice));
    out.push('  approval: ' + approvalLine('x_695068_bcfa_ap_approval', a3.approval));

    // AR-1
    var ar = new ArDomainService();
    var customer = new GlideRecord('x_695068_bcfa_customer');
    if (!customer.get('customer_code', 'C1402')) throw 'TEST14 customer C1402 not found';
    var pay = ar.intakePayment({ bankReference: 'BANK-T17-' + gs.generateGUID().substring(0, 6).toUpperCase(), customer: customer.getUniqueValue(),
        currency: 'INR', amount: 15000, bankAccount: 'IN-COLL-TEST17', idempotencyKey: 'T17-' + gs.generateGUID() }).paymentSysId;
    ar.normalizePayment(pay);
    ar.resolveCustomer(pay, '');
    var match = ar.matchPayment(pay);
    var alloc = ar.allocatePayment(pay);
    if (!alloc.balanced) throw 'AR-1 did not balance: ' + JSON.stringify(match) + ' ' + JSON.stringify(alloc);
    var arRoute = ar.routeForApproval(pay, id.arProcessor);
    out.push('AR-1 payment matched (' + match.mode + ') and pending approval');
    attempt('AR processor (requester, no ar_approver) approves', function() { return ar.decideApproval(pay, arRoute.approvalSysId, 'approved', id.arProcessor, 'TEST17'); });
    attempt('finance approver approves', function() { return ar.decideApproval(pay, arRoute.approvalSysId, 'approved', id.approver, 'TEST17: clearing approved.'); });
    out.push('  approval: ' + approvalLine('x_695068_bcfa_ar_approval', arRoute.approvalSysId));

    // AI identities hold no approver role.
    var ai = new GlideRecord('sys_user');
    ai.addQuery('identity_type', 'ai_agent');
    ai.query();
    while (ai.next()) {
        var roles = [];
        var grant = new GlideRecord('sys_user_has_role');
        grant.addQuery('user', ai.getUniqueValue());
        grant.addQuery('role.name', 'STARTSWITH', 'x_695068_bcfa.');
        grant.query();
        while (grant.next()) roles.push(grant.getDisplayValue('role'));
        var approverRole = roles.filter(function(r) { return /approver|admin/.test(r); });
        out.push('AI identity ' + ai.getValue('user_name') + ': BCFA roles [' + roles.join(', ') + '] -> ' + (approverRole.length ? 'FAIL holds ' + approverRole.join(', ') : 'PASS no approval role'));
    }
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_P17 ' + out.join('\n'));
