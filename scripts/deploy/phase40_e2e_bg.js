// Phase 40 E2E: client POC criteria with FRESH transactions (AP tax and
// tolerances, AR deductions and reconciliation). Run in Scripts - Background,
// scope x_695068_bcfa, after the Phase 40 deploys. The pipeline runs inline
// (FinanceOrchestration.runInline); human decisions go through the same
// services the UI actions call, as the signed-in user. Each scenario has its
// own master data (E2E-<run>-*). Output: one line "BCFA_E2E40 {...}".
// Scenario IDs follow docs/CLIENT_POC_TEST_MATRIX.md.
(function() {
    var RUN = gs.generateGUID().substring(0, 5).toUpperCase();
    var K = parseInt(RUN, 16) % 900 + 1;
    var seeder = new DemoDataSeeder();
    var users = seeder._twoUsers();
    var ap = new ApDomainService(), ar = new ArDomainService();
    var arDecide = new ArExceptionDecisionService();
    var results = {}, cur;
    var check = function(name, ok, detail) { cur.checks.push((ok ? 'ok ' : 'FAIL ') + name + (ok ? '' : ' [' + detail + ']')); if (!ok) cur.pass = false; };
    var rec = function(table, id) { var g = new GlideRecord(table); return g.get(id) ? g : null; };
    var count = function(table, q) { var a = new GlideAggregate(table); a.addEncodedQuery(q); a.addAggregate('COUNT'); a.query(); return a.next() ? parseInt(a.getAggregate('COUNT'), 10) : 0; };
    var vendor = function(c) { return seeder._lookupSysId('x_695068_bcfa_vendor', 'vendor_code', c); };
    var po = function(n) { return seeder._lookupSysId('x_695068_bcfa_purchase_order', 'po_number', n); };
    var openEx = function(table, field, id) { var e = new GlideRecord(table); e.addQuery(field, id); e.addQuery('status', 'IN', 'open,in_review'); e.orderByDesc('sys_created_on'); e.setLimit(1); e.query(); return e.next() ? e : null; };
    var lastMatch = function(invId) { var m = new GlideRecord('x_695068_bcfa_ap_match'); m.addQuery('ap_invoice', invId); m.orderByDesc('sys_created_on'); m.setLimit(1); m.query(); return m.next() ? m : null; };
    var scenario = function(key, fn) {
        cur = { pass: true, checks: [] };
        try { FinanceOrchestration.runInline(fn); } catch (e) { cur.pass = false; cur.checks.push('ERROR ' + e); }
        results[key] = (cur.pass ? 'PASS' : 'FAIL') + ' | ' + cur.checks.join('; ');
    };

    // AP invoice on its own PO (qty 100 at 50 received) with the printed tax breakdown.
    var apRun = function(key, vendorCode, currency, qty, price, tax, breakdown) {
        var poNo = 'E2E-' + RUN + '-P' + key, grn = 'E2E-' + RUN + '-G' + key;
        seeder._playbookPo(poNo, vendorCode, 100, 50, grn);
        var net = qty * price;
        return ap.intakeAndAutoProcess({ invoiceNumber: 'E2E-' + RUN + '-' + key, vendor: vendor(vendorCode), companyCode: '1000', currency: currency,
            purchaseOrder: po(poNo), grossAmount: net + tax, taxAmount: tax, netAmount: net, taxBreakdown: breakdown || {},
            seedExtraction: { invoiceNumber: 'E2E-' + RUN + '-' + key, vendor: vendorCode, amount: net + tax },
            lines: [seeder._seedLine(poNo, grn, qty, price, tax, net)] });
    };
    var vendorCountry = function(code) { var v = rec('x_695068_bcfa_vendor', vendor(code)); return v ? v.getValue('country') : ''; };
    // A vendor of Indian services (withholding applies by configuration).
    var servicesVendor = 'E2E' + RUN + 'S';
    seeder._upsert('x_695068_bcfa_vendor', { vendor_code: servicesVendor }, { vendor_code: servicesVendor, name: 'E2E Services ' + RUN + ' Pvt Ltd',
        company_code: '1000', country: 'India', currency: 'INR', tax_category: 'services', active: true });

    scenario('AP-TAX-001 valid GST (CGST + SGST)', function() {
        check('vendor V001 is Indian', vendorCountry('V001') === 'India', vendorCountry('V001'));
        var r = apRun('T1', 'V001', 'INR', 100, 50, 900, { taxType: 'CGST+SGST', ratePct: 18, cgst: 450, sgst: 450 });
        check('matched', r.stoppedAt === 'MATCHED', r.stoppedAt);
        var g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        check('tax validation PASS', g.getValue('tax_validation_result') === 'pass', g.getValue('tax_validation_result'));
        check('expected regime GST', g.getValue('tax_regime') === 'GST', g.getValue('tax_regime'));
        check('rule source is the decision table', g.getValue('tax_rule_source').indexOf('BCFA AP Tax Expectation') >= 0, g.getValue('tax_rule_source'));
        var m = lastMatch(r.apInvoiceSysId);
        check('tolerance rule stored on the match', m && m.getValue('tolerance_source').indexOf('BCFA AP Tolerance') >= 0, m ? m.getValue('tolerance_source') : 'no match');
        cur.checks.push('invoice ' + g.getValue('invoice_number'));
    });

    scenario('AP-TAX-002 GST mismatch', function() {
        var r = apRun('T2', 'V001', 'INR', 100, 50, 50, { taxType: 'GST' });
        check('tax exception', r.stoppedAt === 'MATCH_EXCEPTION' && r.detail.reasonCode === 'tax_validation', r.stoppedAt + '/' + (r.detail ? r.detail.reasonCode : ''));
        var g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        check('tax validation FAIL, expected 900', g.getValue('tax_validation_result') === 'fail' && parseFloat(g.getValue('expected_tax_amount')) === 900, g.getValue('tax_validation_result') + '/' + g.getValue('expected_tax_amount'));
        var ex = openEx('x_695068_bcfa_ap_exception', 'ap_invoice', r.apInvoiceSysId);
        check('exception subtype gst', ex && ex.getValue('subtype') === 'gst', ex ? ex.getValue('subtype') : 'none');
        check('evidence shows the tax checks', ex && ex.getValue('evidence').indexOf('Tax validation FAIL') >= 0, 'evidence');
        check('AI never resolves it', ex && ex.getValue('status') === 'open', ex ? ex.getValue('status') : 'none');
    });

    scenario('AP-TAX-004 VAT mismatch (7% printed, 19% expected)', function() {
        check('vendor V004 is German', vendorCountry('V004') === 'Germany', vendorCountry('V004'));
        var r = apRun('T4', 'V004', 'EUR', 100, 50, 350, { taxType: 'VAT', ratePct: 7, vat: 350 });
        check('tax exception', r.stoppedAt === 'MATCH_EXCEPTION' && r.detail.reasonCode === 'tax_validation', r.stoppedAt);
        var ex = openEx('x_695068_bcfa_ap_exception', 'ap_invoice', r.apInvoiceSysId);
        check('exception subtype vat', ex && ex.getValue('subtype') === 'vat', ex ? ex.getValue('subtype') : 'none');
        var g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        check('detail names the printed rate', g.getValue('tax_validation_detail').indexOf('printed tax rate 7%') >= 0, g.getValue('tax_validation_detail'));
    });

    scenario('AP-TAX-005 withholding applicable (printed, correct)', function() {
        var r = apRun('T5', servicesVendor, 'INR', 100, 50, 900, { taxType: 'GST', wht: 100, whtRatePct: 2 });
        check('matched', r.stoppedAt === 'MATCHED', r.stoppedAt);
        var g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        check('withholding applicable by configuration', g.getValue('wht_applicable') === '1' || g.getValue('wht_applicable') === 'true', g.getValue('wht_applicable'));
        check('withholding expected 100, result PASS', parseFloat(g.getValue('wht_expected_amount')) === 100 && g.getValue('wht_result') === 'pass', g.getValue('wht_expected_amount') + '/' + g.getValue('wht_result'));
        check('withholding code from configuration', g.getValue('wht_code').indexOf('IN-TDS-SERVICES') === 0, g.getValue('wht_code'));
    });

    scenario('AP-TAX-006 withholding mismatch', function() {
        var r = apRun('T6', servicesVendor, 'INR', 100, 50, 900, { taxType: 'GST', wht: 250 });
        check('tax exception', r.stoppedAt === 'MATCH_EXCEPTION' && r.detail.reasonCode === 'tax_validation', r.stoppedAt);
        var ex = openEx('x_695068_bcfa_ap_exception', 'ap_invoice', r.apInvoiceSysId);
        check('exception subtype withholding_tax', ex && ex.getValue('subtype') === 'withholding_tax', ex ? ex.getValue('subtype') : 'none');
        check('variance 150 (250 printed vs 100 expected)', ex && parseFloat(ex.getValue('variance_amount')) === 150, ex ? ex.getValue('variance_amount') : 'none');
    });

    scenario('AP-TOL-001 quantity within tolerance', function() {
        var r = apRun('Q1', 'V001', 'INR', 101, 50, 909, { taxType: 'GST' });
        check('matched (1% vs 2%)', r.stoppedAt === 'MATCHED', r.stoppedAt);
        var m = lastMatch(r.apInvoiceSysId);
        check('detail: expected 100, actual 101', m && m.getValue('tolerance_detail').indexOf('expected 100') >= 0 && m.getValue('tolerance_detail').indexOf('actual 101') >= 0, m ? m.getValue('tolerance_detail') : 'none');
    });

    scenario('AP-TOL-002 quantity outside tolerance', function() {
        var r = apRun('Q2', 'V001', 'INR', 110, 50, 990, { taxType: 'GST' });
        check('quantity exception', r.stoppedAt === 'MATCH_EXCEPTION' && r.detail.reasonCode === 'quantity_tolerance', r.stoppedAt + '/' + (r.detail ? r.detail.reasonCode : ''));
        var ex = openEx('x_695068_bcfa_ap_exception', 'ap_invoice', r.apInvoiceSysId);
        check('evidence names the tolerance rule', ex && ex.getValue('evidence').indexOf('BCFA AP Tolerance') >= 0, 'evidence');
        check('variance 10%', ex && Math.abs(parseFloat(ex.getValue('variance_pct')) - 0.1) < 0.0001, ex ? ex.getValue('variance_pct') : 'none');
    });

    // ---- AR -------------------------------------------------------------------
    var e2eCustomer = function(suffix) {
        var code = 'E2E' + RUN + suffix;
        seeder._upsert('x_695068_bcfa_customer', { customer_code: code }, { customer_code: code, name: 'E2E Customer ' + RUN + ' ' + suffix, country: 'India', currency: 'INR', company_code: '1000', active: true });
        return code;
    };
    var itemNo = function(number, code, amount) { seeder._playbookOpenItem(number, code, 'INR', amount); return seeder._lookupSysId('x_695068_bcfa_ar_open_item', 'item_number', number); };
    var pay = function(key, cust, amount, name) { return ar.intakeAndAutoProcess({ bankReference: 'E2E-' + RUN + '-' + key, customer: cust || '', currency: 'INR', amount: amount,
        bankAccount: 'E2E', idempotencyKey: 'E2E-' + RUN + '-' + key, candidateCustomerName: name || '' }); };
    var advice = function(paymentId, suffix, amount, ref, deduction, reason) {
        var rem = ar.intakeRemittance(paymentId, { remittanceReference: 'E2E-' + RUN + '-REM-' + suffix, source: 'email', confidence: 0.97, extractionProvider: 'native',
            extractedFields: { customer_name: 'E2E Customer ' + RUN + ' ' + suffix, payment_amount: amount, currency: 'INR', invoice_references: [ref],
                invoice_lines: [{ invoice_reference: ref, amount_applied: amount }], deduction_amount: deduction, deduction_reason: reason } });
        ar.retryWithRemittance(paymentId, rem.remittanceSysId, users[0]);
        return rem.remittanceSysId;
    };

    scenario('AR-DED-003 tax deduction (TDS)', function() {
        var code = e2eCustomer('T');
        var n = 'E' + RUN + '-T1';
        itemNo(n, code, 10000);
        var r = pay('T', '', 9800, '');
        var remId = advice(r.paymentSysId, 'T', 9800, n, 200, 'TDS deducted at 2%');
        var rem = rec('x_695068_bcfa_remittance', remId);
        check('advice fields stored', rem.getValue('advice_deduction_reason') === 'TDS deducted at 2%' && rem.getValue('extraction_provider') === 'native', rem.getValue('advice_deduction_reason'));
        var ex = openEx('x_695068_bcfa_ar_exception', 'payment', r.paymentSysId);
        check('short pay exception', ex && ex.getValue('reason_code') === 'short_pay', ex ? ex.getValue('reason_code') : r.stoppedAt);
        check('rule suggests withholding tax', ex && String(ex.getValue('rule_result')).toUpperCase().indexOf('WITHHOLDING_TAX') >= 0, ex ? ex.getValue('rule_result') : '');
        ex.setValue('deduction_type', 'withholding_tax');
        ex.update();
        var d = arDecide.decide(ex.getUniqueValue(), 'approve_deduction', 'E2E ' + RUN + ': TDS certificate received for 200.');
        check('human confirms the withholding deduction', d.ok === true, JSON.stringify(d));
        var ded = new GlideRecord('x_695068_bcfa_deduction');
        ded.addQuery('payment_allocation.payment', r.paymentSysId);
        ded.query();
        check('deduction 200 withholding tax recorded', ded.next() && parseFloat(ded.getValue('amount')) === 200 && ded.getValue('deduction_type') === 'withholding_tax', 'none');
        check('deduction keeps the advice statement and the source', ded.getValue('advice_reason').indexOf('TDS') >= 0 && ded.getValue('category_source') === 'human_confirmed' &&
            ded.getValue('currency') === 'INR', ded.getValue('advice_reason') + '/' + ded.getValue('category_source'));
    });

    var dedU = {};
    scenario('AR-DED-006 incorrect AI deduction suggestion', function() {
        var code = e2eCustomer('U');
        var n = 'E' + RUN + '-U1';
        itemNo(n, code, 10000);
        var r = pay('U', '', 7000, '');
        advice(r.paymentSysId, 'U', 7000, n, 3000, 'adjustment');
        var ex = openEx('x_695068_bcfa_ar_exception', 'payment', r.paymentSysId);
        check('short pay exception, residual 3000', ex && ex.getValue('reason_code') === 'short_pay' && Math.abs(parseFloat(ex.getValue('residual_amount'))) === 3000, ex ? ex.getValue('residual_amount') : r.stoppedAt);
        check('no rule category for an unexplained 3,000', ex && String(ex.getValue('rule_result')).toUpperCase().indexOf('BANK_CHARGE') < 0, ex ? ex.getValue('rule_result') : '');
        // An incorrect advisory suggestion (as an AI note would read).
        ex.setValue('ai_recommendation', 'AI REVIEW (advisory only): the 3,000 residual looks like a bank charge.');
        ex.setValue('deduction_type', 'bank_charge');
        ex.update();
        var d = arDecide.decide(ex.getUniqueValue(), 'approve_deduction', 'E2E ' + RUN + ': following the AI note.');
        check('bank charge above the limit refused despite the AI note', d.ok === false && String(d.error).indexOf('bank charge cannot exceed') >= 0, JSON.stringify(d));
        check('nothing recorded', count('x_695068_bcfa_deduction', 'payment_allocation.payment=' + r.paymentSysId) === 0, 'deduction');
        dedU = { payment: r.paymentSysId, exception: ex.getUniqueValue() };
    });

    scenario('AR-DED-007 human rejects the AI recommendation', function() {
        var ex = rec('x_695068_bcfa_ar_exception', dedU.exception);
        check('exception from AR-DED-006', !!ex, 'missing');
        ex.setValue('deduction_type', 'dispute');
        ex.update();
        var d = arDecide.decide(ex.getUniqueValue(), 'approve_deduction', 'E2E ' + RUN + ': customer disputes the quantity.');
        check('a dispute is never booked as a deduction', d.ok === false && String(d.error).indexOf('not a deduction') >= 0, JSON.stringify(d));
        var c = arDecide.decide(ex.getUniqueValue(), 'request_clarification', 'E2E ' + RUN + ': asked the customer for the claim details.');
        check('clarification requested by the human', c.ok === true, JSON.stringify(c));
        ex = rec('x_695068_bcfa_ar_exception', dedU.exception);
        check('decision and decider recorded', ex.getValue('decision') === 'request_clarification' && ex.getValue('decided_by') === gs.getUserID(), ex.getValue('decision'));
        check('AI note left as written (advisory)', ex.getValue('ai_recommendation').indexOf('looks like a bank charge') >= 0, 'changed');
        check('payment on hold', rec('x_695068_bcfa_payment', dedU.payment).getValue('state') === 'ON_HOLD', rec('x_695068_bcfa_payment', dedU.payment).getValue('state'));
    });

    scenario('AR-REC-003 no invoice reference (exact amount)', function() {
        var code = e2eCustomer('R');
        var n = 'E' + RUN + '-R1';
        var item = itemNo(n, code, 15000 + K);
        var cust = seeder._lookupSysId('x_695068_bcfa_customer', 'customer_code', code);
        var r = pay('R', cust, 15000 + K, '');
        var p = rec('x_695068_bcfa_payment', r.paymentSysId);
        check('matched by exact amount without a reference', ['PENDING_APPROVAL', 'APPROVED', 'MATCHED', 'ALLOCATED'].indexOf(p.getValue('state')) >= 0, p.getValue('state'));
        check('allocated to the open item', count('x_695068_bcfa_payment_allocation', 'payment=' + r.paymentSysId + '^ar_open_item=' + item) === 1, 'no allocation');
    });

    var pass = 0, total = 0;
    for (var k in results) { total++; if (results[k].indexOf('PASS') === 0) pass++; }
    gs.info('BCFA_E2E40 run ' + RUN + ' ' + pass + '/' + total + ' ' + JSON.stringify(results));
})();
