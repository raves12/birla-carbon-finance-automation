// Phase 12 end-to-end test, part 2 of 2. Run in Scripts - Background with
// scope = x_695068_bcfa, after part 1 and after the AP Invoice Review
// workflow has recorded its advisory notes (a few minutes).
//
// Makes the human decisions through ApExceptionDecisionService, the same
// service the four exception buttons call, as the signed-in user:
//   B quantity variance: missing reason (refused), Hold, then Approve
//     Override -> approval in the owner's name -> Mock SAP -> CLOSED
//   C tax variance:      Request Correction -> ON_HOLD
//   D duplicate:         Approve Override (refused by policy), then Reject
var INTAKE = {
    B: '3d34ada93b238f904035a50864e45ab1',
    C: '07346525eb23c314311dff0dcad0cd94',
    D: 'ea34ada93b238f904035a50864e45ab8'
};
var out = [];

function openException(intakeSysId) {
    var intake = new GlideRecord('x_695068_bcfa_finance_intake');
    if (!intake.get(intakeSysId) || !intake.getValue('ap_invoice')) return null;
    var e = new GlideRecord('x_695068_bcfa_ap_exception');
    e.addQuery('ap_invoice', intake.getValue('ap_invoice'));
    e.orderByDesc('sys_created_on');
    e.setLimit(1);
    e.query();
    return e.next() ? e : null;
}

function state(exception) {
    var e = new GlideRecord('x_695068_bcfa_ap_exception');
    e.get(exception.getUniqueValue());
    var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
    inv.get(e.getValue('ap_invoice'));
    return 'exception status=' + e.getValue('status') + ' decision=' + e.getValue('decision') + ' by=' + e.getDisplayValue('decided_by') +
        ' | invoice ' + inv.getValue('invoice_number') + ' state=' + inv.getValue('state') + ' approval=' + inv.getValue('approval_state') +
        ' posting=' + inv.getValue('posting_state') + ' sap=' + (inv.getValue('sap_document_id') || '-');
}

function show(label, result) {
    out.push(label + ': ' + (result.ok ? 'ok ' + JSON.stringify(result) : 'REFUSED ' + result.error));
}

try {
    var decisionService = new ApExceptionDecisionService();
    ['B', 'C', 'D'].forEach(function(key) {
        var e = openException(INTAKE[key]);
        if (!e) { out.push(key + ': no exception found (run part 1 first)'); return; }
        var note = e.getValue('ai_recommendation');
        out.push(key + ' ' + e.getValue('reason_code') + ' ' + e.getUniqueValue() + ' AI note: ' +
            (note ? note.length + ' chars, starts "' + note.substring(0, 80).replace(/\n/g, ' ') + '"' : 'NOT YET RECORDED'));
    });

    var b = openException(INTAKE.B);
    if (b) {
        show('B no reason', decisionService.decide(b.getUniqueValue(), 'hold', ''));
        show('B hold', decisionService.decide(b.getUniqueValue(), 'hold', 'Phase 12 E2E: checking with the warehouse whether 5 extra units were received.'));
        show('B approve override', decisionService.decide(b.getUniqueValue(), 'approve_override',
            'Phase 12 E2E: warehouse confirmed 15 EA received; GRN RCPT0004 to be amended. Variance accepted.'));
        out.push('B final: ' + state(b));
    }

    var c = openException(INTAKE.C);
    if (c) {
        show('C request correction', decisionService.decide(c.getUniqueValue(), 'request_correction',
            'Phase 12 E2E: vendor to reissue INV-AP-006 with GST at 18% (INR 360.00), not INR 50.00.'));
        out.push('C final: ' + state(c));
    }

    var d = openException(INTAKE.D);
    if (d) {
        show('D approve override', decisionService.decide(d.getUniqueValue(), 'approve_override', 'Phase 12 E2E: attempting to override a duplicate.'));
        show('D reject', decisionService.decide(d.getUniqueValue(), 'reject', 'Phase 12 E2E: resubmission of INV-AP-001, already posted. Do not pay twice.'));
        out.push('D final: ' + state(d));
    }
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_E2E2 ' + out.join('\n'));
