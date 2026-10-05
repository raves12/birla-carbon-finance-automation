// Phase 27/28: demo reset and re-seed. Run in Scripts - Background with scope
// = x_695068_bcfa after phase28_demo_reset_bg.js.
//
// DESTRUCTIVE: deletes every AP invoice and payment on the instance (with
// their exceptions, approvals, matches, allocations, integration
// transactions, document intakes, KPI rows) and master rows outside the
// seeded baseline, then re-seeds the 10 AP + 10 AR demo scenarios. The audit
// trail, decision log and (by default) the AI Interaction Log are kept.
// See docs/DEMO_DATA.md.
//
// Then compares each scenario's end state with docs/DEMO_DATA.md. Seeding
// runs inline, under lifecycle enforcement (Phase 26) and with the Phase 25
// flows live; a refused transition stops the seed and is reported.
(function() {
    var out = [];
    var seeder = new DemoDataSeeder();
    var result;
    try {
        result = seeder.resetAndReseed(DemoDataSeeder.RESET_CONFIRMATION);
    } catch (e) {
        gs.info('BCFA_P28 SEED STOPPED: ' + e);
        return;
    }
    if (result.refused) { gs.info('BCFA_P28 REFUSED: ' + result.reason); return; }
    var d = result.reset.deleted, parts = [];
    for (var t in d) if (d[t]) parts.push(t + '=' + d[t]);
    out.push('deleted: ' + parts.join(', '));
    out.push('seed: master ' + (result.seed.masterData.skipped ? 'SKIPPED' : JSON.stringify(result.seed.masterData)) +
        ', AP ' + (result.seed.apScenarios.skipped ? 'SKIPPED' : 'seeded') + ', AR ' + (result.seed.arScenarios.skipped ? 'SKIPPED' : 'seeded') +
        (result.poc2 ? ', POC 2 cash journeys created: ' + (result.poc2.created.join(' ') || 'none (already present)') : ''));

    // Documented end states (docs/DEMO_DATA.md). AP-001 and its duplicate
    // AP-002 share INV-AP-001: the first created is AP-001.
    var expectedAp = { 'INV-AP-001': ['CLOSED', 'EXCEPTION'], 'INV-AP-003': ['EXCEPTION'], 'INV-AP-004': ['EXCEPTION'], 'INV-AP-005': ['EXCEPTION'],
        'INV-AP-006': ['EXCEPTION'], 'INV-AP-007': ['EXCEPTION'], 'INV-AP-008': ['PENDING_APPROVAL'], 'INV-AP-009': ['FAILED'], 'INV-AP-010': ['CLOSED'] };
    var expectedAr = { 'BANK-AR-001': 'CLOSED', 'BANK-AR-002': 'EXCEPTION', 'BANK-AR-003': 'CLOSED', 'BANK-AR-004': 'PENDING_APPROVAL',
        'BANK-AR-005': 'EXCEPTION', 'BANK-AR-006': 'PENDING_APPROVAL', 'BANK-AR-007': 'PENDING_APPROVAL', 'BANK-AR-008': 'PENDING_APPROVAL',
        'BANK-AR-009': 'PENDING_APPROVAL', 'BANK-AR-010': 'CLOSED' };

    var apOk = 0, apBad = [];
    for (var inv in expectedAp) {
        var gr = new GlideRecord('x_695068_bcfa_ap_invoice');
        gr.addQuery('invoice_number', inv);
        gr.orderBy('sys_created_on');
        gr.query();
        var got = [];
        while (gr.next()) got.push(gr.getValue('state'));
        if (got.join(',') === expectedAp[inv].join(',')) apOk++;
        else apBad.push(inv + ' expected ' + expectedAp[inv].join('/') + ' got ' + (got.join('/') || 'none'));
    }
    var arOk = 0, arBad = [];
    for (var ref in expectedAr) {
        var p = new GlideRecord('x_695068_bcfa_payment');
        var st = p.get('bank_reference', ref) ? p.getValue('state') : 'none';
        if (st === expectedAr[ref]) arOk++;
        else arBad.push(ref + ' expected ' + expectedAr[ref] + ' got ' + st);
    }
    out.push('AP scenarios as documented: ' + apOk + ' of 9 invoice numbers (10 scenarios)' + (apBad.length ? ' | AP DIFF: ' + apBad.join('; ') : ''));
    out.push('AR scenarios as documented: ' + arOk + ' of 10' + (arBad.length ? ' | AR DIFF: ' + arBad.join('; ') : ''));

    var totals = function(table) { var a = new GlideAggregate(table); a.addAggregate('COUNT'); a.query(); return a.next() ? a.getAggregate('COUNT') : '?'; };
    out.push('now on the instance: invoices=' + totals('x_695068_bcfa_ap_invoice') + ' payments=' + totals('x_695068_bcfa_payment') +
        ' POs=' + totals('x_695068_bcfa_purchase_order') + ' open items=' + totals('x_695068_bcfa_ar_open_item') + ' audit events kept=' + totals('x_695068_bcfa_audit_event'));
    gs.info('BCFA_P28 ' + out.join(' | '));
})();
