// Phase 18 verification. Run in Scripts - Background with scope =
// x_695068_bcfa, after phase18_integration_bg.js (global).
//
// Uses IntegrationService directly with TEST18 idempotency keys and
// references. Only Integration Transaction and audit records are created (no
// invoices or payments change).
//   1 canonical reads through Mock SAP (logged, request hash)
//   2 adapter contract: Mock SAP and the Real SAP seam implement all
//     canonical operations; the real adapter sends nothing (NOT_CONFIGURED)
//   3 idempotency by key: the same post twice -> one transaction, replay
//   4 idempotency by transaction + operation: another key, same source
//     record -> replay of the committed post
//   5 idempotency by external reference: another record, same reference ->
//     blocked as duplicate
//   6 unknown outcome, committed: timeout -> resend blocked -> reconcile
//     (query status) -> confirmed committed -> resend is a replay
//   7 unknown outcome, not committed: timeout -> reconcile -> confirmed not
//     committed -> resend allowed, same transaction, attempt 2 -> success
var out = [];
var svc = new IntegrationService();
var tag = 'T18-' + gs.generateGUID().substring(0, 6).toUpperCase();

function txn(sysId) {
    var t = new GlideRecord('x_695068_bcfa_integration_txn');
    if (!t.get(sysId)) return 'not found';
    return ['operation', 'status', 'attempt', 'reconciliation_state', 'external_document_id', 'external_reference', 'request_hash', 'correlation_id', 'requested_at', 'completed_at', 'error_code']
        .map(function(f) { var v = t.getValue(f) || '-'; return f + '=' + (f === 'request_hash' ? v.substring(0, 12) + '…' : v); }).join(' | ');
}
function countKey(key) {
    var c = new GlideAggregate('x_695068_bcfa_integration_txn');
    c.addQuery('idempotency_key', key);
    c.addAggregate('COUNT');
    c.query();
    return c.next() ? c.getAggregate('COUNT') : 0;
}
// Finds a key suffix whose Mock SAP ground truth (key character-code parity)
// is the wanted one, so both unknown-outcome paths are exercised.
function keyWithParity(prefix, even) {
    for (var i = 0; i < 50; i++) {
        var key = prefix + '-' + i;
        var sum = 0;
        for (var c = 0; c < key.length; c++) sum += key.charCodeAt(c);
        if ((sum % 2 === 0) === even) return key;
    }
    return prefix;
}
function post(key, sourceRecord, reference, mode) {
    return svc.execute({ operation: 'postVendorInvoice', adapter: 'mock_sap', correlationId: tag, idempotencyKey: key, externalReference: reference,
        sourceTable: 'x_695068_bcfa_ap_invoice', sourceRecord: sourceRecord, payload: { invoiceNumber: reference, amount: 100 }, simulateOutcome: mode });
}

try {
    // 1
    var reads = [['getVendor', { vendorCode: 'V001' }], ['getCustomer', { customerCode: 'C001' }], ['getPurchaseOrder', { poNumber: 'PO0001' }], ['getReceipt', { receiptNumber: 'RCPT0001' }]];
    reads.forEach(function(r) {
        var res = svc.execute({ operation: r[0], adapter: 'mock_sap', correlationId: tag, idempotencyKey: tag + '-' + r[0], payload: r[1], simulateOutcome: 'success' });
        out.push('1 ' + r[0] + ': ' + res.status + ' found=' + (res.response && res.response.found) + ' | ' + txn(res.transactionSysId));
    });
    var c1402 = new GlideRecord('x_695068_bcfa_customer');
    c1402.get('customer_code', 'C1402');
    var items = svc.execute({ operation: 'getOpenItems', adapter: 'mock_sap', correlationId: tag, idempotencyKey: tag + '-getOpenItems', payload: { customerSysId: c1402.getUniqueValue() }, simulateOutcome: 'success' });
    out.push('1 getOpenItems (C1402): ' + items.status + ' items=' + (items.response && items.response.items ? items.response.items.length : '?'));

    // 2
    out.push('2 contract mock_sap: ' + JSON.stringify(svc.checkAdapterContract('mock_sap')));
    out.push('2 contract real_sap: ' + JSON.stringify(svc.checkAdapterContract('real_sap')));
    var real = svc.execute({ operation: 'postVendorInvoice', adapter: 'real_sap', correlationId: tag, idempotencyKey: tag + '-real', sourceRecord: tag + '-REAL', externalReference: tag + '-REAL', payload: { amount: 1 }, simulateOutcome: 'success' });
    out.push('2 real_sap post: status=' + real.status + ' | ' + txn(real.transactionSysId));

    // 3
    var p1 = post(tag + '-P1', tag + '-INV1', tag + '|INV1', 'success');
    var p2 = post(tag + '-P1', tag + '-INV1', tag + '|INV1', 'success');
    out.push('3 same key twice: first=' + p1.status + ' second=' + p2.status + ' replay=' + p2.idempotentReplay + ' (' + p2.replayedBy + ') transactions for key=' + countKey(tag + '-P1') + ' same txn=' + (p1.transactionSysId === p2.transactionSysId));

    // 4
    var p3 = post(tag + '-P1-OTHERKEY', tag + '-INV1', tag + '|INV1', 'success');
    out.push('4 other key, same record: status=' + p3.status + ' replay=' + p3.idempotentReplay + ' (' + p3.replayedBy + ') new transactions=' + countKey(tag + '-P1-OTHERKEY'));

    // 5
    var p4 = post(tag + '-P2', tag + '-INV2', tag + '|INV1', 'success');
    out.push('5 other record, same reference: status=' + p4.status + ' blocked=' + p4.blocked + ' | ' + p4.reason);

    // 6
    var kc = keyWithParity(tag + '-UC', true);
    var t1 = post(kc, tag + '-INV3', tag + '|INV3', 'timeout');
    out.push('6 timeout: status=' + t1.status + ' unknownOutcome=' + t1.unknownOutcome + ' | ' + txn(t1.transactionSysId));
    var t2 = post(kc, tag + '-INV3', tag + '|INV3', 'success');
    out.push('6 resend before reconcile: status=' + t2.status + ' | ' + t2.reason);
    var r1 = svc.reconcileUnknownOutcome(t1.transactionSysId);
    out.push('6 reconcile: ' + JSON.stringify(r1) + ' | ' + txn(t1.transactionSysId));
    var t3 = post(kc, tag + '-INV3', tag + '|INV3', 'success');
    out.push('6 resend after reconcile: status=' + t3.status + ' replay=' + t3.idempotentReplay + ' transactions for key=' + countKey(kc));

    // 7
    var kn = keyWithParity(tag + '-UN', false);
    var u1 = post(kn, tag + '-INV4', tag + '|INV4', 'timeout');
    var r2 = svc.reconcileUnknownOutcome(u1.transactionSysId);
    out.push('7 timeout then reconcile: ' + JSON.stringify(r2) + ' | ' + txn(u1.transactionSysId));
    var u2 = post(kn, tag + '-INV4', tag + '|INV4', 'success');
    out.push('7 retry after confirmed not committed: status=' + u2.status + ' attempt=' + u2.attempt + ' same txn=' + (u2.transactionSysId === u1.transactionSysId) + ' | ' + txn(u2.transactionSysId));
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_P18 ' + out.join('\n'));
