// Phase 12 end-to-end test, part 1 of 2. Run in Scripts - Background with
// scope = x_695068_bcfa (the app scope, NOT global), after
// phase12_ap_journey_bg.js has been deployed.
//
// Processes four synthetic fixture PDFs through Finance Document Intake,
// exactly as the "Process Document" button does:
//   A  AP_INV_001_CLEAN.pdf          happy path -> approval by the demo
//                                     finance approver -> Mock SAP -> CLOSED
//   B  AP_INV_002_QTY_VARIANCE.pdf   quantity exception (decided in part 2)
//   C  AP_INV_005_TAX_EXCEPTION.pdf  tax exception      (decided in part 2)
//   D  AP_INV_004_DUPLICATE.pdf      duplicate of A      (decided in part 2)
// B, C and D start the native BCFA AP Invoice Review workflow, which records
// an advisory note on each exception a minute or two later.
var INTAKE = {
    A: '1d3429653b238f904035a50864e45a26',
    B: '3d34ada93b238f904035a50864e45ab1',
    C: '07346525eb23c314311dff0dcad0cd94',
    D: 'ea34ada93b238f904035a50864e45ab8'
};
var DEMO_APPROVER = 'd33f6290d7533660937e25a599602b2c'; // bcfa.finance.approver
var out = [];

function invoiceLine(id) {
    var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
    if (!inv.get(id)) return 'invoice not found';
    return inv.getValue('invoice_number') + ' state=' + inv.getValue('state') + ' approval=' + inv.getValue('approval_state') +
        ' posting=' + inv.getValue('posting_state') + ' sap=' + (inv.getValue('sap_document_id') || '-') +
        ' gross=' + inv.getValue('gross_amount') + ' ' + inv.getValue('currency');
}

function extractionLine(id) {
    var ex = new GlideRecord('x_695068_bcfa_ap_extraction');
    ex.addQuery('ap_invoice', id);
    ex.orderByDesc('sys_created_on');
    ex.setLimit(1);
    ex.query();
    return ex.next() ? 'extraction source=' + ex.getValue('source') + ' confidence=' + ex.getValue('confidence') : 'no extraction row';
}

function exceptionLine(id) {
    var e = new GlideRecord('x_695068_bcfa_ap_exception');
    if (!e.get(id)) return 'exception not found';
    return 'exception=' + id + ' reason=' + e.getValue('reason_code') + ' severity=' + e.getValue('severity') +
        ' sla_due=' + e.getValue('sla_due') + ' group=' + e.getDisplayValue('assignment_group') + ' owner=' + e.getDisplayValue('assigned_to') +
        ' variance=' + e.getValue('variance_amount') + ' (' + e.getValue('variance_pct') + '%) rule=' + e.getValue('rule_result') +
        ' | evidence=' + (e.getValue('evidence') || '').replace(/\n/g, ' / ');
}

try {
    out.push('provider=' + new FinancePolicy().aiProvider() + ' tolerances=' + JSON.stringify(new FinancePolicy().apTolerances()));
    var fdi = new FinanceDocumentIntakeService();
    var ap = new ApDomainService();

    // A: happy path.
    var a = fdi.processDocument(INTAKE.A);
    out.push('A stoppedAt=' + a.stoppedAt + ' ' + (a.apInvoiceSysId ? invoiceLine(a.apInvoiceSysId) + ' ' + extractionLine(a.apInvoiceSysId) : JSON.stringify(a)));
    if (a.stoppedAt === 'PENDING_APPROVAL') {
        var approvalId = a.detail.approvalSysId;
        // Segregation of duties: the requester (you, who processed it) cannot approve.
        var self = ap.decideApproval(a.apInvoiceSysId, approvalId, 'approved', gs.getUserID(), 'Phase 12 E2E: self-approval attempt');
        out.push('A self-approval ' + (self.error ? 'BLOCKED: ' + self.error : 'NOT BLOCKED (defect)'));
        var approved = ap.decideApproval(a.apInvoiceSysId, approvalId, 'approved', DEMO_APPROVER, 'Phase 12 E2E: approved by the demo finance approver.');
        out.push('A approval ' + (approved.error ? 'ERROR ' + approved.error : 'ok') + ' -> ' + invoiceLine(a.apInvoiceSysId));
        var txn = new GlideRecord('x_695068_bcfa_integration_txn');
        txn.addQuery('source_record', a.apInvoiceSysId);
        txn.orderBy('sys_created_on');
        txn.query();
        var txns = [];
        while (txn.next()) txns.push(txn.getValue('operation') + ':' + txn.getValue('status'));
        out.push('A integration txns: ' + txns.join(', '));
    }

    // B, C, D: exception paths (decisions happen in part 2).
    ['B', 'C', 'D'].forEach(function(key) {
        var r = fdi.processDocument(INTAKE[key]);
        var line = key + ' stoppedAt=' + r.stoppedAt;
        if (r.apInvoiceSysId) line += ' ' + invoiceLine(r.apInvoiceSysId) + ' ' + extractionLine(r.apInvoiceSysId);
        if (r.detail && r.detail.exceptionSysId) line += ' ' + exceptionLine(r.detail.exceptionSysId);
        if (!r.apInvoiceSysId) line += ' ' + JSON.stringify(r);
        out.push(line);
    });
} catch (e) {
    out.push('ERROR ' + e);
}
gs.info('BCFA_E2E1 ' + out.join('\n'));
