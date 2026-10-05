// Phase 25 verification, part 2. Run in Scripts - Background with scope =
// x_695068_bcfa a minute or two after phase25_verify_bg.js. Reports how far
// the flows took the newest INV-P25 invoice and BANK-P25 payment (state, the
// flows that ran, the audit trail). If an approval is pending, the demo
// finance approver decides it (a person's decision, not the AI's), and the
// Integration / Clearing flow takes over: run this script again to see it.
(function() {
    var out = [];
    var APPROVER = 'd33f6290d7533660937e25a599602b2c'; // bcfa.finance.approver (demo)

    var newest = function(table, field, prefix) {
        var gr = new GlideRecord(table);
        gr.addQuery(field, 'STARTSWITH', prefix);
        gr.orderByDesc('sys_created_on');
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    };
    var flowsFor = function(id) {
        var ctx = new GlideRecord('sys_flow_context');
        ctx.addQuery('source_record', id);
        ctx.orderBy('sys_created_on');
        ctx.query();
        var list = [];
        while (ctx.next()) list.push(ctx.getValue('name').replace(/^BCFA /, '').replace(/ Flow$/, '') + ':' + ctx.getValue('state'));
        return list.join(', ') || 'none';
    };
    var auditFor = function(id) {
        var a = new GlideRecord('x_695068_bcfa_audit_event');
        a.addQuery('source_record', id);
        a.orderBy('event_sequence');
        a.query();
        var list = [];
        while (a.next()) list.push(a.getValue('event_type'));
        return list.join(' > ');
    };
    var decidePending = function(table, field, id, decide) {
        var appr = new GlideRecord(table);
        appr.addQuery(field, id);
        appr.addQuery('decision', 'pending');
        appr.query();
        if (!appr.next()) return '';
        var r = decide(appr.getUniqueValue());
        return 'pending approval decided by the demo finance approver: ' + JSON.stringify(r);
    };

    var inv = newest('x_695068_bcfa_ap_invoice', 'invoice_number', 'INV-P25-');
    if (inv) {
        var id = inv.getUniqueValue();
        out.push('AP ' + inv.getValue('invoice_number') + ' state=' + inv.getValue('state') + ' approval=' + inv.getValue('approval_state') +
            ' posting=' + inv.getValue('posting_state') + ' sap=' + (inv.getValue('sap_document_id') || '-'));
        out.push('AP flows: ' + flowsFor(id));
        out.push('AP audit: ' + auditFor(id));
        if (inv.getValue('state') === 'PENDING_APPROVAL' || inv.getValue('approval_state') === 'requested') {
            var d = decidePending('x_695068_bcfa_ap_approval', 'ap_invoice', id, function(approvalId) {
                return new ApDomainService().decideApproval(id, approvalId, 'approved', APPROVER, 'Approved for Phase 25 flow verification.');
            });
            if (d) out.push('AP ' + d);
        }
    } else out.push('AP: no INV-P25 invoice found (run phase25_verify_bg.js first)');

    var pay = newest('x_695068_bcfa_payment', 'bank_reference', 'BANK-P25-');
    if (pay) {
        var pid = pay.getUniqueValue();
        var txn = new GlideRecord('x_695068_bcfa_integration_txn');
        txn.addQuery('source_record', pid);
        txn.orderByDesc('sys_created_on');
        txn.setLimit(1);
        txn.query();
        var txnInfo = txn.next() ? txn.getValue('operation') + ' ' + txn.getValue('status') + ' ' + (txn.getValue('external_document_id') || '') : '-';
        out.push('AR ' + pay.getValue('bank_reference') + ' state=' + pay.getValue('state') + ' customer=' + pay.getDisplayValue('customer') +
            ' integration=' + txnInfo);
        out.push('AR flows: ' + flowsFor(pid));
        out.push('AR audit: ' + auditFor(pid));
        if (pay.getValue('state') === 'PENDING_APPROVAL') {
            var d2 = decidePending('x_695068_bcfa_ar_approval', 'payment', pid, function(approvalId) {
                return new ArDomainService().decideApproval(pid, approvalId, 'approved', APPROVER, 'Approved for Phase 25 flow verification.');
            });
            if (d2) out.push('AR ' + d2);
        }
    } else out.push('AR: no BANK-P25 payment found');

    gs.info('BCFA_P25B ' + out.join(' | '));
})();
