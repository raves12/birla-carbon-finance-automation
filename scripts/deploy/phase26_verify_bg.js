// Phase 26 verification. Run in Scripts - Background with scope =
// x_695068_bcfa after phase26_lifecycle_bg.js. Checks the enforcement
// configuration, then tries two illegal state changes on CLOSED records:
//   1. through the domain service (matchInvoice on a closed invoice), which
//      must throw before anything runs;
//   2. by a direct update (a closed payment set back to RECEIVED), which the
//      backstop business rule must abort.
// Neither record may change, and each refusal must be audited. Then run
// phase25_verify_bg.js / phase25_verify2_bg.js (legal paths still work) and
// phase26_state_model_check_bg.js (new records use only modelled
// transitions).
(function() {
    var out = [];
    var check = function(label, ok, detail) { out.push((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' (' + detail + ')' : '')); };

    var lifecycle = new FinanceLifecycle();
    check('enforcement mode is enforce', lifecycle.enforcing(), gs.getProperty('x_695068_bcfa.lifecycle.enforcement', '(missing)'));
    var ap = lifecycle.evaluate('x_695068_bcfa_ap_invoice', 'RECEIVED', 'EXTRACTED');
    var ar = lifecycle.evaluate('x_695068_bcfa_payment', 'UNKNOWN_OUTCOME', 'APPROVED');
    check('new transitions modelled (AP RECEIVED->EXTRACTED, AR UNKNOWN_OUTCOME->APPROVED)', ap.allowed && ar.allowed && !ap.message && !ar.message, (ap.message || '') + (ar.message || ''));
    var bad = lifecycle.evaluate('x_695068_bcfa_ap_invoice', 'CLOSED', 'MATCHING');
    check('CLOSED -> MATCHING not allowed', !bad.allowed, bad.message);

    var rules = new GlideRecord('sys_script');
    rules.addQuery('name', 'IN', 'BCFA - Enforce AP Invoice Lifecycle,BCFA - Enforce Payment Lifecycle');
    rules.addActiveQuery();
    rules.query();
    check('both backstop business rules active', rules.getRowCount() === 2, String(rules.getRowCount()));

    var refusals = function(id) {
        var a = new GlideRecord('x_695068_bcfa_audit_event');
        a.addQuery('source_record', id);
        a.addQuery('after_value', 'CONTAINS', '"result":"REFUSED"');
        a.query();
        return a.getRowCount();
    };
    var closed = function(table) {
        var gr = new GlideRecord(table);
        gr.addQuery('state', 'CLOSED');
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    };

    // 1. Through the service.
    var inv = closed('x_695068_bcfa_ap_invoice');
    if (inv) {
        var id = inv.getUniqueValue(), before = refusals(id), error = '';
        try { new ApDomainService().matchInvoice(id); } catch (e) { error = String(e); }
        var after = new GlideRecord('x_695068_bcfa_ap_invoice');
        after.get(id);
        check('service refuses matchInvoice on a CLOSED invoice', error.indexOf('BCFA lifecycle') >= 0 && after.getValue('state') === 'CLOSED', inv.getValue('invoice_number') + ': ' + error);
        check('service refusal audited', refusals(id) === before + 1);
    } else check('a CLOSED invoice to test with', false, 'none found');

    // 2. Direct update.
    var pay = closed('x_695068_bcfa_payment');
    if (pay) {
        var pid = pay.getUniqueValue(), pbefore = refusals(pid);
        pay.setValue('state', 'RECEIVED');
        pay.update();
        var p2 = new GlideRecord('x_695068_bcfa_payment');
        p2.get(pid);
        check('direct update CLOSED -> RECEIVED aborted', p2.getValue('state') === 'CLOSED', pay.getValue('bank_reference') + ' state=' + p2.getValue('state'));
        check('direct refusal audited', refusals(pid) === pbefore + 1);
    } else check('a CLOSED payment to test with', false, 'none found');

    gs.info('BCFA_P26B ' + out.join(' | '));
})();
