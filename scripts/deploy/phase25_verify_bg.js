// Phase 25 verification, part 1. Run in Scripts - Background with scope =
// x_695068_bcfa after phase25_flows_bg.js. Checks the flow configuration,
// then starts one AP invoice and one payment in flow mode (intake only: the
// flows take every later step asynchronously). Progress is read afterwards
// (the records, sys_flow_context and the audit chain); phase25_verify2_bg.js
// records the human approval if the AP rule asks for one.
(function() {
    var out = [];
    var check = function(label, ok, detail) { out.push((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' (' + detail + ')' : '')); };

    // --- configuration --------------------------------------------------------
    var mode = gs.getProperty('x_695068_bcfa.orchestration.mode', '(missing)');
    check('orchestration mode is flow', mode === 'flow' && !FinanceOrchestration.isInline(), mode);

    var flows = new GlideRecord('sys_hub_flow');
    flows.addQuery('sys_scope', '229ba2b1a079431e104010f5ea883e85');
    flows.addQuery('name', 'STARTSWITH', 'BCFA ');
    flows.query();
    var live = 0, notLive = [];
    while (flows.next()) {
        if (flows.getValue('status') === 'published' && flows.getValue('active') === '1') live++;
        else notLive.push(flows.getValue('name') + '=' + flows.getValue('status'));
    }
    check('15 BCFA flows published and active', live === 15 && !notLive.length, live + ' live' + (notLive.length ? '; not live: ' + notLive.join(', ') : ''));

    var ev = new GlideRecord('sysevent_register');
    check('event x_695068_bcfa.flow.stage registered', ev.get('event_name', 'x_695068_bcfa.flow.stage'));
    var sa = new GlideRecord('sysevent_script_action');
    check('script action BCFA - Run Flow Stage active', sa.get('name', 'BCFA - Run Flow Stage') && sa.getValue('active') === '1');

    var job = new GlideRecord('sysauto_script');
    job.get('4e6d10932d304e6a99110d1e8866341b');
    var trig = new GlideRecord('sys_trigger');
    trig.addQuery('document_key', '4e6d10932d304e6a99110d1e8866341b');
    trig.query();
    check('Phase 16 sweep job retired', job.getValue('active') === '0' && !trig.hasNext(), 'active=' + job.getValue('active'));

    // A stage refused outside its state (the guard that keeps a stage from
    // running twice): an invoice that is not RECEIVED is not re-extracted.
    var anyPosted = new GlideRecord('x_695068_bcfa_ap_invoice');
    anyPosted.addQuery('state', 'POSTED');
    anyPosted.setLimit(1);
    anyPosted.query();
    if (anyPosted.next()) {
        var g = new FinanceOrchestration().run('ap_intake', anyPosted.getUniqueValue());
        check('stage guard: ap_intake on a POSTED invoice is skipped', g.outcome === 'skipped', g.detail);
    }
    var bad = new FinanceOrchestration().run('ap_everything', anyPosted.getUniqueValue());
    check('unknown stage rejected', bad.outcome === 'error', bad.detail);

    // --- one AP invoice and one payment, flow mode ------------------------------
    var seeder = new DemoDataSeeder();
    var stamp = String(new GlideDateTime().getNumericValue()).slice(-6);
    var vendor = seeder._lookupSysId('x_695068_bcfa_vendor', 'vendor_code', 'V001');
    var po = seeder._insert('x_695068_bcfa_purchase_order', {
        po_number: 'PO-P25-' + stamp, vendor: vendor, company_code: '1000', currency: 'INR', status: 'open', created_date: new GlideDateTime().getDate()
    });
    var poLine = seeder._insert('x_695068_bcfa_po_line', {
        purchase_order: po, line_number: 1, material_or_service: 'Carbon black feedstock', quantity: 5, unit: 'MT', unit_price: 10000, received_quantity: 5
    });
    seeder._insert('x_695068_bcfa_receipt', {
        receipt_number: 'RCPT-P25-' + stamp, po_line: poLine, receipt_type: 'grn', quantity: 5, receipt_date: new GlideDateTime().getDate(), sap_document_id: 'MIGO-P25-' + stamp
    });
    var today = new GlideDateTime().getDate().getValue();
    var ap = new ApDomainService().intakeAndAutoProcess({
        invoiceNumber: 'INV-P25-' + stamp, vendor: vendor, companyCode: '1000', currency: 'INR',
        purchaseOrder: po, grossAmount: 59000, netAmount: 50000, taxAmount: 9000,
        invoiceDate: new GlideDateTime().getDate(),
        seedExtraction: { invoiceNumber: 'INV-P25-' + stamp, vendor: 'V001', amount: 59000, invoice_date: today, posting_date: today },
        lines: [seeder._seedLine('PO-P25-' + stamp, 'RCPT-P25-' + stamp, 5, 10000, 9000, 50000)]
    });
    check('AP intake hands off to the flows', ap.stoppedAt === 'RECEIVED' && ap.handedTo === 'AP Invoice Intake Flow', JSON.stringify(ap));

    var customer = seeder._lookupSysId('x_695068_bcfa_customer', 'customer_code', 'C001');
    var due = new GlideDateTime();
    due.addDaysUTC(30);
    var amount = 20000 + Number(stamp.slice(-3)) / 100;
    seeder._insert('x_695068_bcfa_ar_open_item', {
        item_number: 'ARI-P25-' + stamp, customer: customer, company_code: '1000', currency: 'INR',
        invoice_amount: amount, open_amount: amount, due_date: due.getDate(), status: 'open'
    });
    var ar = new ArDomainService().intakeAndAutoProcess({
        bankReference: 'BANK-P25-' + stamp, customer: customer, currency: 'INR', amount: amount, bankAccount: 'IN-COLL-001',
        idempotencyKey: 'AR-CLEAR-P25-' + stamp
    });
    check('AR intake hands off to the flows', ar.stoppedAt === 'RECEIVED' && ar.handedTo === 'AR Payment Intake Flow', JSON.stringify(ar));

    out.push('AP invoice INV-P25-' + stamp + ' sys_id=' + ap.apInvoiceSysId);
    out.push('Payment BANK-P25-' + stamp + ' amount=' + amount + ' sys_id=' + ar.paymentSysId);
    gs.info('BCFA_P25 ' + out.join(' | '));
})();
