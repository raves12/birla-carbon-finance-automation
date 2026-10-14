"""Builds the client test kit loaders from the local, git-ignored kit spec
(test/client_samples/kit/spec.json) and manifest (test/client_samples/manifest.json).

  python scripts/client_samples/build_test_kit.py

Writes, next to the spec (git-ignored, they contain client data):
  kit_setup_bg.js  Scripts - Background, scope x_695068_bcfa. Idempotent.
                   - Earlier intakes of the client documents stop counting as
                     duplicates (their content hash is cleared; nothing deleted).
                   - Test master data: vendors, POs, PO lines, receipts,
                     customers, AR open items (restored to fully open).
                   - The bank lines of the payment advices (payments created
                     through the bank-statement intake, unless one exists).
  kit_reset_bg.js  Scripts - Background, scope x_695068_bcfa. Run by the
                   instance owner: PERMANENTLY DELETES the transactions created
                   by processing the client documents (intakes, AP invoices,
                   kit payments and everything attached to them; audit events
                   are append-only and stay), then runs the setup again.
"""
import io, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
CS = os.path.join(REPO, 'test', 'client_samples')
KIT = os.path.join(CS, 'kit')
spec = json.load(io.open(os.path.join(KIT, 'spec.json'), encoding='utf8'))
manifest = json.load(io.open(os.path.join(CS, 'manifest.json'), encoding='utf8'))
pack = {
    'hashes': sorted({m['sha256'] for m in manifest}),
    'files': sorted({m['file'] for m in manifest}),
}
for k in ('_comment',):
    spec.pop(k, None)

SETUP = r'''
function bcfaKitSetup(SPEC, PACK) {
    var out = { neutralized: 0, vendors: 0, pos: 0, lines: 0, receipts: 0, customers: 0, items: 0, payments_created: 0, payments_existing: 0 };
    var audit = new AuditEngine();
    // When the kit was first installed: the reset only touches intakes of the
    // client documents created after it.
    var PROP = 'x_695068_bcfa.client_kit.installed_on';
    if (!gs.getProperty(PROP)) gs.setProperty(PROP, new GlideDateTime().getValue());
    out.installed_on = gs.getProperty(PROP) || 'NOT SET (deploy the property first)';
    var upsert = function(table, keyField, keyValue, values) {
        var g = new GlideRecord(table);
        g.addQuery(keyField, keyValue);
        g.query();
        var isNew = !g.next();
        if (isNew) { g.initialize(); g.setValue(keyField, keyValue); }
        for (var k in values) g.setValue(k, values[k]);
        return isNew ? g.insert() : (g.update(), g.getUniqueValue());
    };

    // 1. Earlier intakes of the client documents: no longer duplicate anchors.
    var old = new GlideRecord('x_695068_bcfa_finance_intake');
    old.addQuery('attachment_hash', 'IN', PACK.hashes.join(','));
    old.query();
    while (old.next()) {
        old.setValue('attachment_hash', '');
        old.setWorkflow(false);
        old.update();
        audit.logEvent({ sourceTable: 'x_695068_bcfa_finance_intake', sourceRecord: old.getUniqueValue(), eventType: 'rule_evaluated', actorType: 'system',
            description: 'Client test kit: intake ' + old.getValue('number') + ' (earlier run of a client document) no longer counts for duplicate detection (content hash cleared).' });
        out.neutralized++;
    }

    // 2. Test master data.
    var vendorIds = {};
    SPEC.vendors.forEach(function(v) {
        vendorIds[v.code] = upsert('x_695068_bcfa_vendor', 'vendor_code', v.code, { name: v.name, company_code: v.company, country: v.country,
            currency: v.currency, tax_category: v.tax_category, active: true });
        out.vendors++;
    });
    SPEC.purchase_orders.forEach(function(p) {
        var poId = upsert('x_695068_bcfa_purchase_order', 'po_number', p.po, { vendor: vendorIds[p.vendor], company_code: p.company, currency: p.currency, status: 'open' });
        out.pos++;
        p.lines.forEach(function(l) {
            var line = new GlideRecord('x_695068_bcfa_po_line');
            line.addQuery('purchase_order', poId);
            line.addQuery('line_number', l.n);
            line.query();
            var lineId;
            var received = 0;
            l.receipts.forEach(function(r) { received += r.q; });
            if (line.next()) {
                line.setValue('material_or_service', l.d); line.setValue('quantity', l.q); line.setValue('unit', l.u); line.setValue('unit_price', l.p);
                line.setValue('received_quantity', received); line.update(); lineId = line.getUniqueValue();
            } else {
                line.initialize(); line.setValue('purchase_order', poId); line.setValue('line_number', l.n); line.setValue('material_or_service', l.d);
                line.setValue('quantity', l.q); line.setValue('unit', l.u); line.setValue('unit_price', l.p); line.setValue('received_quantity', received);
                lineId = line.insert();
            }
            out.lines++;
            l.receipts.forEach(function(r) {
                upsert('x_695068_bcfa_receipt', 'receipt_number', r.no, { po_line: lineId, receipt_type: r.type, quantity: r.q, receipt_date: r.date });
                out.receipts++;
            });
        });
    });
    var customerIds = {};
    SPEC.customers.forEach(function(c) {
        customerIds[c.code] = upsert('x_695068_bcfa_customer', 'customer_code', c.code, { name: c.name, company_code: c.company, country: c.country,
            currency: c.currency, active: true });
        out.customers++;
    });
    SPEC.open_items.forEach(function(i) {
        upsert('x_695068_bcfa_ar_open_item', 'item_number', i.item, { customer: customerIds[i.customer], company_code: i.company, currency: i.currency,
            invoice_amount: i.amount, open_amount: i.amount, due_date: i.due, status: 'open' });
        out.items++;
    });

    // 3. Bank lines (cash) the payment advices refer to.
    var ar = new ArDomainService();
    SPEC.payments.forEach(function(p) {
        var key = 'KIT-PAY-' + p.ref;
        var pay = new GlideRecord('x_695068_bcfa_payment');
        pay.addQuery('idempotency_key', key);
        pay.query();
        if (pay.next()) { out.payments_existing++; return; }
        ar.intakePayment({ bankReference: p.ref, valueDate: p.value_date, currency: p.currency, amount: p.amount, source: 'bank_statement', idempotencyKey: key });
        out.payments_created++;
    });
    return out;
}
'''

RESET = r'''
function bcfaKitReset(SPEC, PACK, preview) {
    // preview: count only, delete nothing.
    var out = { preview: !!preview, intakes: 0, invoices: 0, payments: 0, children: 0 };
    var del = function(table, field, value) {
        if (!value) return;
        var g = new GlideRecord(table);
        g.addQuery(field, 'IN', value);
        g.query();
        while (g.next()) { if (!preview) { g.setWorkflow(false); g.deleteRecord(); } out.children++; }
    };
    // Intakes of the client documents: by content hash, or by file name
    // (an intake stopped before hashing, e.g. a file over 4 MB).
    var intakeIds = [];
    var byHash = new GlideRecord('x_695068_bcfa_finance_intake');
    byHash.addQuery('attachment_hash', 'IN', PACK.hashes.join(','));
    byHash.query();
    while (byHash.next()) intakeIds.push(byHash.getUniqueValue());
    var att = new GlideRecord('sys_attachment');
    att.addQuery('table_name', 'x_695068_bcfa_finance_intake');
    att.addQuery('file_name', 'IN', PACK.files.join(','));
    att.addQuery('sys_created_on', '>=', gs.getProperty('x_695068_bcfa.client_kit.installed_on') || '2999-01-01 00:00:00');
    att.query();
    while (att.next()) if (intakeIds.indexOf(att.getValue('table_sys_id')) < 0) intakeIds.push(att.getValue('table_sys_id'));

    var invoiceIds = [], correlations = [];
    var intake = new GlideRecord('x_695068_bcfa_finance_intake');
    intake.addQuery('sys_id', 'IN', intakeIds.join(','));
    intake.query();
    while (intake.next()) {
        if (intake.getValue('ap_invoice') && invoiceIds.indexOf(intake.getValue('ap_invoice')) < 0) invoiceIds.push(intake.getValue('ap_invoice'));
        if (intake.getValue('correlation_id')) correlations.push(intake.getValue('correlation_id'));
    }
    var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
    inv.addQuery('sys_id', 'IN', invoiceIds.join(','));
    inv.query();
    while (inv.next()) if (inv.getValue('correlation_id')) correlations.push(inv.getValue('correlation_id'));

    // Kit payments and their AR records.
    var paymentIds = [];
    var keys = SPEC.payments.map(function(p) { return 'KIT-PAY-' + p.ref; });
    var pay = new GlideRecord('x_695068_bcfa_payment');
    pay.addQuery('idempotency_key', 'IN', keys.join(','));
    pay.query();
    while (pay.next()) { paymentIds.push(pay.getUniqueValue()); if (pay.getValue('correlation_id')) correlations.push(pay.getValue('correlation_id')); }

    var allocationIds = [];
    var alloc = new GlideRecord('x_695068_bcfa_payment_allocation');
    alloc.addQuery('payment', 'IN', paymentIds.join(','));
    alloc.query();
    while (alloc.next()) allocationIds.push(alloc.getUniqueValue());

    var invList = invoiceIds.join(','), payList = paymentIds.join(','), corrList = correlations.join(',');
    ['x_695068_bcfa_ap_invoice_line', 'x_695068_bcfa_ap_extraction', 'x_695068_bcfa_ap_match', 'x_695068_bcfa_ap_exception', 'x_695068_bcfa_ap_approval']
        .forEach(function(t) { del(t, 'ap_invoice', invList); });
    del('x_695068_bcfa_deduction', 'payment_allocation', allocationIds.join(','));
    ['x_695068_bcfa_remittance', 'x_695068_bcfa_payment_allocation', 'x_695068_bcfa_match_candidate', 'x_695068_bcfa_ar_exception', 'x_695068_bcfa_ar_approval']
        .forEach(function(t) { del(t, 'payment', payList); });
    ['x_695068_bcfa_integration_txn', 'x_695068_bcfa_finance_exception', 'x_695068_bcfa_decision_log']
        .forEach(function(t) { del(t, 'correlation_id', corrList); });
    var att2 = new GlideRecord('sys_attachment');
    att2.addQuery('table_name', 'x_695068_bcfa_finance_intake');
    att2.addQuery('table_sys_id', 'IN', intakeIds.join(','));
    att2.query();
    var gsa = new GlideSysAttachment();
    while (att2.next()) { if (!preview) gsa.deleteAttachment(att2.getUniqueValue()); out.children++; }
    var dropAll = function(table, ids, counter) {
        var g = new GlideRecord(table);
        g.addQuery('sys_id', 'IN', ids.join(','));
        g.query();
        while (g.next()) { if (!preview) { g.setWorkflow(false); g.deleteRecord(); } out[counter]++; }
    };
    dropAll('x_695068_bcfa_ap_invoice', invoiceIds, 'invoices');
    dropAll('x_695068_bcfa_payment', paymentIds, 'payments');
    dropAll('x_695068_bcfa_finance_intake', intakeIds, 'intakes');
    return out;
}
'''

HEAD = '// Client test kit, generated by scripts/client_samples/build_test_kit.py. CONFIDENTIAL (client data); do not commit.\n// Scripts - Background, scope x_695068_bcfa.\n'
data = 'var SPEC = ' + json.dumps(spec, ensure_ascii=False) + ';\nvar PACK = ' + json.dumps(pack, ensure_ascii=False) + ';\n'
setup = HEAD + data + SETUP + "gs.info('BCFA_KIT_SETUP ' + JSON.stringify(bcfaKitSetup(SPEC, PACK)) + ' ||');\n"
reset = (HEAD + '// PERMANENTLY DELETES the transactions created by processing the client documents, then runs the setup again.\n' + data + SETUP + RESET +
         "var r = bcfaKitReset(SPEC, PACK);\ngs.info('BCFA_KIT_RESET deleted ' + JSON.stringify(r) + ' ||');\n"
         "gs.info('BCFA_KIT_SETUP ' + JSON.stringify(bcfaKitSetup(SPEC, PACK)) + ' ||');\n")
preview = (HEAD + '// PREVIEW of the reset: counts what the reset would delete; changes nothing.\n' + data + RESET +
           "gs.info('BCFA_KIT_RESET_PREVIEW ' + JSON.stringify(bcfaKitReset(SPEC, PACK, true)) + ' ||');\n")
for name, text in (('kit_setup_bg.js', setup), ('kit_reset_bg.js', reset), ('kit_reset_preview_bg.js', preview)):
    io.open(os.path.join(KIT, name), 'w', encoding='utf8', newline='\n').write(text)
    print('written', name, len(text))
