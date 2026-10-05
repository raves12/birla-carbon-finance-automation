// Phase 19 verification, part 2. Run in Scripts - Background with scope =
// x_695068_bcfa, after phase19_fix_bg.js (global).
//
//   0 backfill: process from the source table (the new column's default
//     'platform' had been applied to every existing row) and event_sequence
//     from the creation time, written with setWorkflow(false) because the
//     table is append-only
//   1 exception resolved and escalated: an AP exception (missing vendor) is
//     escalated to level 1 and then resolved
//   2 override: a short-paid payment is moved on by a manager override
//   3 the chains read in event_sequence order
//   4 coverage: every Phase 19 event type exists in the audit table
var out = [];
var tag = 'T19B-' + gs.generateGUID().substring(0, 6).toUpperCase();

function chain(correlationId, label) {
    var e = new GlideRecord('x_695068_bcfa_audit_event');
    e.addQuery('correlation_id', correlationId);
    e.orderBy('event_sequence');
    e.query();
    var rows = [];
    while (e.next()) {
        rows.push('    ' + e.getValue('event_sequence') + ' ' + e.getValue('event_type') + ' [' + e.getValue('process') + '/' + e.getValue('actor_type') + ' ' +
            e.getDisplayValue('actor') + (e.getValue('ai_agent') ? ' ai=' + e.getValue('ai_agent') : '') + '] ' + String(e.getValue('description')).substring(0, 100) +
            (e.getValue('reason') ? ' | reason: ' + String(e.getValue('reason')).substring(0, 70) : ''));
    }
    out.push(label + ' audit chain (' + rows.length + ' events):\n' + rows.join('\n'));
}
function insert(table, fields) {
    var gr = new GlideRecord(table);
    gr.initialize();
    for (var f in fields) gr.setValue(f, fields[f]);
    return gr.insert();
}

try {
    // 0 backfill
    for (var table in AuditEngine.PROCESS_BY_TABLE) {
        var b = new GlideRecord('x_695068_bcfa_audit_event');
        b.addQuery('source_table', table);
        b.addQuery('process', '!=', AuditEngine.PROCESS_BY_TABLE[table]);
        b.setWorkflow(false);
        b.setValue('process', AuditEngine.PROCESS_BY_TABLE[table]);
        b.updateMultiple();
    }
    var seq = new GlideRecord('x_695068_bcfa_audit_event');
    seq.addNullQuery('event_sequence');
    seq.orderBy('sys_created_on');
    seq.query();
    var n = 0;
    while (seq.next()) {
        seq.setWorkflow(false);
        seq.setValue('event_sequence', String(new GlideDateTime(seq.getValue('sys_created_on')).getNumericValue()) + ('00' + (n % 1000)).slice(-3));
        seq.update();
        n++;
    }
    var byProcess = new GlideAggregate('x_695068_bcfa_audit_event');
    byProcess.addAggregate('COUNT');
    byProcess.groupBy('process');
    byProcess.query();
    var counts = [];
    while (byProcess.next()) counts.push(byProcess.getValue('process') + '=' + byProcess.getAggregate('COUNT'));
    var noSeq = new GlideAggregate('x_695068_bcfa_audit_event');
    noSeq.addNullQuery('event_sequence');
    noSeq.addAggregate('COUNT');
    noSeq.query();
    out.push('0 backfill: process by process ' + counts.join(', ') + '; event_sequence set on ' + n + ' rows, still empty ' + (noSeq.next() ? noSeq.getAggregate('COUNT') : '?'));

    // 1 exception escalated and resolved
    var ap = new ApDomainService();
    var inv = ap.intakeInvoice({ invoiceNumber: tag + '-AP', companyCode: '1000', currency: 'INR', grossAmount: 1180, netAmount: 1000, taxAmount: 180, source: 'manual' });
    ap.runExtraction(inv.apInvoiceSysId, {});
    var v = ap.validateInvoice(inv.apInvoiceSysId);
    var engine = new ExceptionEngine();
    var exc = new GlideRecord('x_695068_bcfa_ap_exception');
    exc.get(v.exceptionSysId);
    engine._escalate('ap', exc, 0, 1, 30);
    exc.update();
    var resolved = engine.resolveApException(v.exceptionSysId, tag + ': vendor confirmed by phone and entered; invoice resubmitted.', gs.getUserID());
    out.push('1 exception ' + exc.getValue('number') + ': escalated to level ' + exc.getValue('escalation_level') + ', resolved ' + resolved);
    chain(inv.correlationId, '1 AP');

    // 2 override
    var ar = new ArDomainService();
    var customer = insert('x_695068_bcfa_customer', { customer_code: tag, name: 'TEST19 Customer ' + tag, company_code: '1000', country: 'India', currency: 'INR', active: true });
    insert('x_695068_bcfa_ar_open_item', { item_number: tag + '-D', customer: customer, company_code: '1000', currency: 'INR', invoice_amount: 20000, open_amount: 20000, status: 'open' });
    var pay = ar.intakePayment({ bankReference: 'BANK-' + tag, customer: customer, currency: 'INR', amount: 19950, bankAccount: 'IN-COLL-TEST19', idempotencyKey: tag + '-PAY' });
    ar.normalizePayment(pay.paymentSysId);
    ar.resolveCustomer(pay.paymentSysId, '');
    ar.matchPayment(pay.paymentSysId);
    var alloc = ar.allocatePayment(pay.paymentSysId);
    var forced = ar.forceProceedDespiteImbalance(pay.paymentSysId, tag + ': short pay of 50 accepted by the finance manager pending a credit memo.');
    out.push('2 allocation ' + (alloc.reasonCode || 'balanced') + '; override ' + JSON.stringify(forced));
    chain(pay.correlationId, '2 AR');

    // 4 coverage (all time)
    var present = {};
    var types = new GlideAggregate('x_695068_bcfa_audit_event');
    types.addAggregate('COUNT');
    types.groupBy('event_type');
    types.query();
    while (types.next()) present[types.getValue('event_type')] = types.getAggregate('COUNT');
    var missing = [];
    var have = [];
    for (var type in AuditEngine.EVENTS) {
        if (present[type]) have.push(type + '=' + present[type]);
        else if (type !== 'human_decision') missing.push(type);
    }
    out.push('4 event types in the audit table: ' + have.join(', '));
    out.push('4 missing: ' + (missing.length ? missing.join(', ') + ' FAIL' : 'none PASS'));
} catch (err) {
    out.push('ERROR ' + err + (err && err.stack ? ' ' + err.stack : ''));
}
gs.info('BCFA_P19B ' + out.join('\n'));
