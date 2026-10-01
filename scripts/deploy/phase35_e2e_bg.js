// Phase 35 E2E: FRESH transactions for AP scenarios A-F and AR scenarios A-I
// (mandate Phases 7 and 8). Run in Scripts - Background, scope x_695068_bcfa,
// AFTER phase35_playbook_deploy_bg.js. Pipeline runs inline
// (FinanceOrchestration.runInline); human decisions are made through the
// same services the UI actions call, as the signed-in user. Each scenario
// gets its own master data (E2E-<run>-*) so nothing seeded is consumed.
// Output: one line "BCFA_E2E {...}" with PASS/FAIL per scenario.
(function() {
    var RUN = gs.generateGUID().substring(0, 5).toUpperCase();
    // Per-run amount offset, so open items left by an earlier run (e.g. a
    // payment left in SAP_DRAFT) never make this run's matches ambiguous.
    var K = parseInt(RUN, 16) % 900 + 1;
    var seeder = new DemoDataSeeder();
    var users = seeder._twoUsers();
    var ap = new ApDomainService(), ar = new ArDomainService();
    var apDecide = new ApExceptionDecisionService(), arDecide = new ArExceptionDecisionService();
    var results = {}, cur;
    var check = function(name, ok, detail) { cur.checks.push((ok ? 'ok ' : 'FAIL ') + name + (ok ? '' : ' [' + detail + ']')); if (!ok) cur.pass = false; };
    var rec = function(table, id) { var g = new GlideRecord(table); return g.get(id) ? g : null; };
    var count = function(table, q) { var a = new GlideAggregate(table); a.addEncodedQuery(q); a.addAggregate('COUNT'); a.query(); return a.next() ? parseInt(a.getAggregate('COUNT'), 10) : 0; };
    var vendor = function(c) { return seeder._lookupSysId('x_695068_bcfa_vendor', 'vendor_code', c); };
    var customer = function(c) { return seeder._lookupSysId('x_695068_bcfa_customer', 'customer_code', c); };
    var po = function(n) { return seeder._lookupSysId('x_695068_bcfa_purchase_order', 'po_number', n); };
    var openEx = function(table, field, id) { var e = new GlideRecord(table); e.addQuery(field, id); e.addQuery('status', 'IN', 'open,in_review'); e.orderByDesc('sys_created_on'); e.setLimit(1); e.query(); return e.next() ? e : null; };
    var journey = function(g, order, status) { check('journey ' + order + '/' + status, g.getValue('journey_stage_order') === String(order) && g.getValue('journey_status') === status, g.getValue('journey_stage_order') + '/' + g.getValue('journey_status')); };
    var scenario = function(key, fn) {
        cur = { pass: true, checks: [] };
        try { FinanceOrchestration.runInline(fn); } catch (e) { cur.pass = false; cur.checks.push('ERROR ' + e); }
        results[key] = (cur.pass ? 'PASS' : 'FAIL') + ' | ' + cur.checks.join('; ');
    };
    var setupPo = function(poNo, vendorCode, qty, price, grn) { seeder._playbookPo(poNo, vendorCode, qty, price, grn); };
    var approveAp = function(id) { var a = ap.requestApproval(id, users[0]); return ap.decideApproval(id, a.approvalSysId, 'approved', users[1], 'E2E ' + RUN + ' approval'); };
    var approveAr = function(id) { var a = ar.requestApproval(id, users[0]); return ar.decideApproval(id, a.approvalSysId, 'approved', users[1], 'E2E ' + RUN + ' approval'); };
    var setMode = function(id, mode) { var p = rec('x_695068_bcfa_payment', id); p.setValue('sap_processing_mode', mode); p.setWorkflow(false); p.update(); };

    // ---- AP A: clean invoice -> CLOSED --------------------------------------
    var invA = 'E2E-' + RUN + '-A';
    scenario('AP-A clean', function() {
        setupPo('E2E-' + RUN + '-PA', 'V001', 100, 50, 'E2E-' + RUN + '-GA');
        var r = ap.intakeAndAutoProcess({ invoiceNumber: invA, vendor: vendor('V001'), companyCode: '1000', currency: 'INR', purchaseOrder: po('E2E-' + RUN + '-PA'),
            grossAmount: 5000, taxAmount: 900, netAmount: 5000, seedExtraction: { invoiceNumber: invA, vendor: 'V001', amount: 5000 },
            lines: [seeder._seedLine('E2E-' + RUN + '-PA', 'E2E-' + RUN + '-GA', 100, 50, 900, 5000)] });
        check('matched without exception', r.stoppedAt === 'MATCHED', r.stoppedAt);
        check('3-way match within tolerance', count('x_695068_bcfa_ap_match', 'ap_invoice=' + r.apInvoiceSysId + '^within_tolerance=true') > 0, 'no in-tolerance match');
        approveAp(r.apInvoiceSysId);
        var g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        check('CLOSED', g.getValue('state') === 'CLOSED', g.getValue('state'));
        check('MOCK SAP MIRO document', String(g.getValue('sap_document_id')).indexOf('MIRO') === 0, g.getValue('sap_document_id'));
        check('one successful posting', count('x_695068_bcfa_integration_txn', 'source_record=' + r.apInvoiceSysId + '^operation=postVendorInvoice^status=success') === 1, 'count');
        check('audit trail', count('x_695068_bcfa_audit_event', 'source_record=' + r.apInvoiceSysId) >= 5, 'few events');
        journey(g, 9, 'complete');
        cur.checks.push('ref ' + invA + ' ' + g.getValue('sap_document_id'));
    });

    // ---- AP B: quantity variance -> exception -> human override -> CLOSED -----
    scenario('AP-B quantity variance', function() {
        setupPo('E2E-' + RUN + '-PB', 'V004', 10, 500, 'E2E-' + RUN + '-GB');
        var n = 'E2E-' + RUN + '-B';
        var r = ap.intakeAndAutoProcess({ invoiceNumber: n, vendor: vendor('V004'), companyCode: '1000', currency: 'EUR', purchaseOrder: po('E2E-' + RUN + '-PB'),
            grossAmount: 5000, netAmount: 5000, taxAmount: 950, seedExtraction: { invoiceNumber: n },
            lines: [seeder._seedLine('E2E-' + RUN + '-PB', 'E2E-' + RUN + '-GB', 15, 500, 950, 5000)] });
        check('match failure', r.stoppedAt === 'MATCH_EXCEPTION', r.stoppedAt);
        var ex = openEx('x_695068_bcfa_ap_exception', 'ap_invoice', r.apInvoiceSysId);
        check('quantity tolerance exception', ex && ex.getValue('reason_code') === 'quantity_tolerance', ex ? ex.getValue('reason_code') : 'none');
        var g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        journey(g, 4, 'blocked');
        check('blocked because has WHY', String(g.getValue('journey_blocked_reason')).indexOf('WHY:') > 0, g.getValue('journey_blocked_reason'));
        var noReason = apDecide.decide(ex.getUniqueValue(), 'approve_override', '');
        check('override without reason refused', !noReason.ok, JSON.stringify(noReason));
        var d = apDecide.decide(ex.getUniqueValue(), 'approve_override', 'E2E ' + RUN + ': 5 extra units confirmed received by the warehouse.');
        if (!d.ok && String(d.error).indexOf('Segregation of duties') === 0) {
            // The override needs an authorised approver (ap_approver, in the
            // routed group). Run by anyone else, SoD must refuse it and change
            // nothing; the approval itself is manual test MT-AP-17.
            check('override refused for a user who is not an authorised approver (SoD)', true, '');
            check('nothing changed', rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId).getValue('state') === 'EXCEPTION', 'state');
            cur.checks.push('MANUAL: approve the override of ' + ex.getValue('number') + ' as bcfa.finance.controller (MT-AP-17)');
            return;
        }
        check('human override accepted', d.ok === true, JSON.stringify(d));
        g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        check('CLOSED after approval and posting', g.getValue('state') === 'CLOSED', g.getValue('state'));
        check('decision recorded', rec('x_695068_bcfa_ap_exception', ex.getUniqueValue()).getValue('decision') === 'approve_override', 'decision');
    });

    // ---- AP C: duplicate -> override refused -> reject ----------------------
    scenario('AP-C duplicate', function() {
        var r = ap.intakeAndAutoProcess({ invoiceNumber: invA, vendor: vendor('V001'), companyCode: '1000', currency: 'INR', grossAmount: 5000, netAmount: 5000, taxAmount: 900,
            seedExtraction: { invoiceNumber: invA, vendor: 'V001', amount: 5000 } });
        var ex = openEx('x_695068_bcfa_ap_exception', 'ap_invoice', r.apInvoiceSysId);
        check('duplicate detected', ex && ex.getValue('reason_code') === 'duplicate', ex ? ex.getValue('reason_code') : r.stoppedAt);
        journey(rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId), 3, 'blocked');
        var o = apDecide.decide(ex.getUniqueValue(), 'approve_override', 'E2E ' + RUN + ': attempting to override a duplicate.');
        check('duplicate override refused by policy', !o.ok, JSON.stringify(o));
        var j = apDecide.decide(ex.getUniqueValue(), 'reject', 'E2E ' + RUN + ': duplicate of an invoice already posted.');
        check('rejected', j.ok && rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId).getValue('state') === 'REJECTED', JSON.stringify(j));
        check('never posted', count('x_695068_bcfa_integration_txn', 'source_record=' + r.apInvoiceSysId) === 0, 'txn exists');
    });

    // ---- AP D: low extraction confidence -> stops at extraction ---------------
    scenario('AP-D low confidence', function() {
        var i = ap.intakeInvoice({ invoiceNumber: 'E2E-' + RUN + '-D', vendor: vendor('V007'), companyCode: '1000', currency: 'EUR', grossAmount: 3000, netAmount: 3000, taxAmount: 0 });
        ap.runExtraction(i.apInvoiceSysId, { invoiceNumber: 'E2E-' + RUN + '-D' }, { forceConfidence: 0.5 });
        ap.validateInvoice(i.apInvoiceSysId);
        var ex = openEx('x_695068_bcfa_ap_exception', 'ap_invoice', i.apInvoiceSysId);
        check('human review required', ex && ex.getValue('reason_code') === 'low_confidence', ex ? ex.getValue('reason_code') : 'none');
        var g = rec('x_695068_bcfa_ap_invoice', i.apInvoiceSysId);
        journey(g, 2, 'blocked');
        check('no silent progression (no match)', count('x_695068_bcfa_ap_match', 'ap_invoice=' + i.apInvoiceSysId) === 0, 'matched');
    });

    // ---- AP E: posting failure ----------------------------------------------
    scenario('AP-E posting failure', function() {
        setupPo('E2E-' + RUN + '-PE', 'V009', 150, 45, 'E2E-' + RUN + '-GE');
        var n = 'E2E-' + RUN + '-E';
        var r = ap.intakeAndAutoProcess({ invoiceNumber: n, vendor: vendor('V009'), companyCode: '1000', currency: 'USD', purchaseOrder: po('E2E-' + RUN + '-PE'),
            grossAmount: 6750, netAmount: 6750, taxAmount: 0, seedExtraction: { invoiceNumber: n }, lines: [seeder._seedLine('E2E-' + RUN + '-PE', 'E2E-' + RUN + '-GE', 150, 45, 0, 6750)] });
        check('matched', r.stoppedAt === 'MATCHED', r.stoppedAt);
        seeder._setAdapterFailureMode('mock_sap', 'technical_error');
        try { approveAp(r.apInvoiceSysId); } finally { seeder._setAdapterFailureMode('mock_sap', 'success'); }
        var g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        check('FAILED, not closed', g.getValue('state') === 'FAILED', g.getValue('state'));
        check('failure recorded', count('x_695068_bcfa_integration_txn', 'source_record=' + r.apInvoiceSysId + '^status!=success') >= 1, 'no failed txn');
        journey(g, 7, 'blocked');
    });

    // ---- AP F: unknown outcome -> reconciliation, single posting -------------
    scenario('AP-F unknown outcome', function() {
        setupPo('E2E-' + RUN + '-PF', 'V010', 90, 60, 'E2E-' + RUN + '-GF');
        var n = 'E2E-' + RUN + '-F';
        var r = ap.intakeAndAutoProcess({ invoiceNumber: n, vendor: vendor('V010'), companyCode: '1000', currency: 'INR', purchaseOrder: po('E2E-' + RUN + '-PF'),
            grossAmount: 6372, netAmount: 5400, taxAmount: 972, seedExtraction: { invoiceNumber: n }, lines: [seeder._seedLine('E2E-' + RUN + '-PF', 'E2E-' + RUN + '-GF', 90, 60, 972, 5400)] });
        seeder._setAdapterFailureMode('mock_sap', 'timeout');
        try { approveAp(r.apInvoiceSysId); } finally { seeder._setAdapterFailureMode('mock_sap', 'success'); }
        var g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        check('UNKNOWN_OUTCOME', g.getValue('state') === 'UNKNOWN_OUTCOME', g.getValue('state'));
        journey(g, 7, 'blocked');
        var txn = seeder._latestIntegrationTxn('x_695068_bcfa_ap_invoice', r.apInvoiceSysId, 'postVendorInvoice');
        var res = ap.reconcilePosting(r.apInvoiceSysId, txn);
        g = rec('x_695068_bcfa_ap_invoice', r.apInvoiceSysId);
        check('reconciled (no blind retry)', g.getValue('state') !== 'UNKNOWN_OUTCOME', g.getValue('state') + ' ' + JSON.stringify(res));
        check('single accounting transaction', count('x_695068_bcfa_integration_txn', 'source_record=' + r.apInvoiceSysId + '^operation=postVendorInvoice^status=success') <= 1, 'duplicate posting');
        cur.checks.push('final ' + g.getValue('state'));
    });

    // ---- AR -------------------------------------------------------------------
    var item = function(code, cur_, amount) { var n = 'E2E-' + RUN + '-' + code + '-' + amount; seeder._playbookOpenItem(n, code, cur_, amount); return seeder._lookupSysId('x_695068_bcfa_ar_open_item', 'item_number', n); };
    var pay = function(key, cust, cur_, amount, name) { return ar.intakeAndAutoProcess({ bankReference: 'E2E-' + RUN + '-' + key, customer: cust || '', currency: cur_, amount: amount,
        bankAccount: 'E2E', idempotencyKey: 'E2E-' + RUN + '-' + key, candidateCustomerName: name || '' }); };
    var cleared = function(payId, itemIds) {
        var p = rec('x_695068_bcfa_payment', payId);
        check('CLOSED', p.getValue('state') === 'CLOSED', p.getValue('state'));
        check('FB05 clearing (MOCK SAP)', String(p.getValue('sap_reference')).indexOf('FB05') === 0, p.getValue('sap_reference'));
        itemIds.forEach(function(i) { check('open item settled', parseFloat(rec('x_695068_bcfa_ar_open_item', i).getValue('open_amount')) === 0, 'open'); });
        check('one clearing', count('x_695068_bcfa_integration_txn', 'source_record=' + payId + '^operation=clearCustomerPayment^status=success') === 1, 'count');
        journey(p, 10, 'complete');
    };

    scenario('AR-A exact match', function() {
        var i = item('C006', 'INR', 51234 + K);
        var r = pay('A', customer('C006'), 'INR', 51234 + K);
        check('allocated, pending approval', r.stoppedAt === 'PENDING_APPROVAL', r.stoppedAt);
        var p = rec('x_695068_bcfa_payment', r.paymentSysId);
        check('allocation = payment, residual 0', parseFloat(p.getValue('allocated_amount')) === 51234 + K && parseFloat(p.getValue('residual_amount')) === 0, p.getValue('allocated_amount') + '/' + p.getValue('residual_amount'));
        setMode(r.paymentSysId, 'direct');
        approveAr(r.paymentSysId);
        cleared(r.paymentSysId, [i]);
    });

    scenario('AR-B multi-invoice', function() {
        var i1 = item('C007', 'EUR', 12345 + K), i2 = item('C007', 'EUR', 7655);
        var r = pay('B', customer('C007'), 'EUR', 20000 + K);
        check('pending approval', r.stoppedAt === 'PENDING_APPROVAL', r.stoppedAt);
        check('two allocations', count('x_695068_bcfa_payment_allocation', 'payment=' + r.paymentSysId) === 2, count('x_695068_bcfa_payment_allocation', 'payment=' + r.paymentSysId));
        var p = rec('x_695068_bcfa_payment', r.paymentSysId);
        check('no incorrect residual', parseFloat(p.getValue('residual_amount')) === 0, p.getValue('residual_amount'));
        setMode(r.paymentSysId, 'direct');
        approveAr(r.paymentSysId);
        cleared(r.paymentSysId, [i1, i2]);
    });

    // A customer of this run only, so no other open item joins the allocation.
    var e2eCustomer = function(suffix) {
        var code = 'E2E' + RUN + suffix;
        seeder._upsert('x_695068_bcfa_customer', { customer_code: code }, { customer_code: code, name: 'E2E Customer ' + RUN + ' ' + suffix, country: 'India', currency: 'INR', company_code: '1000', active: true });
        return code;
    };
    // Open item with an explicit short number (item_number is 20 characters).
    var itemNo = function(number, code, amount) { seeder._playbookOpenItem(number, code, 'INR', amount); return seeder._lookupSysId('x_695068_bcfa_ar_open_item', 'item_number', number); };

    scenario('AR-C short pay / bank charge', function() {
        var code = e2eCustomer('C');
        var n1 = 'E' + RUN + '-C1', n2 = 'E' + RUN + '-C2';
        var i1 = itemNo(n1, code, 50000), i2 = itemNo(n2, code, 30000);
        // Bank line first (customer unknown), then the remittance naming both
        // invoices: the live POC 2 cash path (AR_REMIT_103_BANK_CHARGE).
        var r = pay('C', '', 'INR', 79500, '');
        var rem = ar.intakeRemittance(r.paymentSysId, { remittanceReference: 'E2E-' + RUN + '-REM-C', source: 'email', confidence: 0.97,
            extractedFields: { customer_name: 'E2E Customer ' + RUN + ' C', payment_amount: 79500, currency: 'INR',
                invoice_references: [n1, n2],
                invoice_lines: [{ invoice_reference: n1, amount_applied: 50000 }, { invoice_reference: n2, amount_applied: 29500 }],
                deduction_amount: 500, deduction_reason: 'Amount remitted less INR 500.00 correspondent bank charges.' } });
        ar.retryWithRemittance(r.paymentSysId, rem.remittanceSysId, users[0]);
        var ex = openEx('x_695068_bcfa_ar_exception', 'payment', r.paymentSysId);
        check('residual -> short pay exception', ex && ex.getValue('reason_code') === 'short_pay', ex ? ex.getValue('reason_code') : r.stoppedAt);
        var p = rec('x_695068_bcfa_payment', r.paymentSysId);
        // residual = payment - (allocated - deductions): negative is a short payment.
        check('allocated 80,000, residual -500', parseFloat(p.getValue('allocated_amount')) === 80000 && parseFloat(p.getValue('residual_amount')) === -500, p.getValue('allocated_amount') + '/' + p.getValue('residual_amount'));
        check('rule suggests a bank charge', String(ex.getValue('rule_result')).indexOf('BANK_CHARGE') >= 0, 'no suggestion');
        journey(p, 6, 'blocked');
        ex.setValue('deduction_type', 'bank_charge'); ex.update();
        var d = arDecide.decide(ex.getUniqueValue(), 'approve_deduction', 'E2E ' + RUN + ': 500 bank charge confirmed on the bank statement.');
        check('human classification accepted', d.ok === true, JSON.stringify(d));
        check('deduction of 500 recorded', count('x_695068_bcfa_deduction', 'amount=500^payment_allocation.payment=' + r.paymentSysId) === 1, 'none');
        setMode(r.paymentSysId, 'direct');
        p = rec('x_695068_bcfa_payment', r.paymentSysId);
        if (p.getValue('state') === 'PENDING_APPROVAL') approveAr(r.paymentSysId);
        p = rec('x_695068_bcfa_payment', r.paymentSysId);
        check('cleared and closed', p.getValue('state') === 'CLOSED', p.getValue('state'));
        [i1, i2].forEach(function(i) { check('open item settled', parseFloat(rec('x_695068_bcfa_ar_open_item', i).getValue('open_amount')) === 0, 'open'); });
    });

    scenario('AR-C2 bank charge above the limit refused', function() {
        var code = e2eCustomer('C2');
        var n3 = 'E' + RUN + '-C3';
        itemNo(n3, code, 10000);
        var r = pay('C2', '', 'INR', 8000, '');
        var rem = ar.intakeRemittance(r.paymentSysId, { remittanceReference: 'E2E-' + RUN + '-REM-C2', source: 'email', confidence: 0.97,
            extractedFields: { customer_name: 'E2E Customer ' + RUN + ' C2', payment_amount: 8000, currency: 'INR',
                invoice_references: [n3], invoice_lines: [{ invoice_reference: n3, amount_applied: 8000 }],
                deduction_amount: 2000, deduction_reason: 'Short paid by 2,000.' } });
        ar.retryWithRemittance(r.paymentSysId, rem.remittanceSysId, users[0]);
        var ex = openEx('x_695068_bcfa_ar_exception', 'payment', r.paymentSysId);
        check('short pay exception', ex && ex.getValue('reason_code') === 'short_pay', ex ? ex.getValue('reason_code') : r.stoppedAt);
        ex.setValue('deduction_type', 'bank_charge'); ex.update();
        var d = arDecide.decide(ex.getUniqueValue(), 'approve_deduction', 'E2E ' + RUN + ': trying to book 2,000 as a bank charge.');
        check('bank charge above the limit refused', d.ok === false && String(d.error).indexOf('bank charge cannot exceed') >= 0, JSON.stringify(d));
        check('nothing recorded', count('x_695068_bcfa_deduction', 'payment_allocation.payment=' + r.paymentSysId) === 0, 'deduction');
        check('still in exception', rec('x_695068_bcfa_payment', r.paymentSysId).getValue('state') === 'EXCEPTION', 'state');
    });

    scenario('AR-D customer alias', function() {
        item('C005', 'USD', 4321 + K);
        var r = pay('D', '', 'USD', 4321 + K, 'LONE STAR TYRE CO');
        var p = rec('x_695068_bcfa_payment', r.paymentSysId);
        check('alias resolved deterministically to C005', p.getValue('customer') === customer('C005'), p.getValue('customer'));
        check('matched', r.stoppedAt === 'PENDING_APPROVAL', r.stoppedAt);
    });

    scenario('AR-E ambiguous customer', function() {
        var r = pay('E', '', 'INR', 7777 + K, 'UNKNOWN E2E REMITTER ' + RUN);
        var ex = openEx('x_695068_bcfa_ar_exception', 'payment', r.paymentSysId);
        check('system does not guess', ex && ex.getValue('reason_code') === 'customer_ambiguous', ex ? ex.getValue('reason_code') : r.stoppedAt);
        check('no allocation without governance', count('x_695068_bcfa_payment_allocation', 'payment=' + r.paymentSysId) === 0, 'allocated');
        journey(rec('x_695068_bcfa_payment', r.paymentSysId), 3, 'blocked');
    });

    scenario('AR-F late remittance', function() {
        item('C010', 'INR', 23456 + K);
        var r = pay('F', '', 'INR', 23456 + K, '');
        check('initially unresolved', r.stoppedAt === 'CUSTOMER_RESOLUTION_EXCEPTION', r.stoppedAt);
        var rem = ar.intakeRemittance(r.paymentSysId, { remittanceReference: 'E2E-' + RUN + '-REM-F', source: 'email', confidence: 0.97,
            extractedFields: { customer_name: 'Karnataka Elastomers Pvt Ltd', payment_amount: 23456 + K, currency: 'INR', invoice_references: ['E2E-' + RUN + '-C010-' + (23456 + K)] } });
        var x = ar.retryWithRemittance(r.paymentSysId, rem.remittanceSysId, users[0]);
        var p = rec('x_695068_bcfa_payment', r.paymentSysId);
        check('remittance resumed processing', x.retried === true, JSON.stringify(x));
        check('customer resolved and matched', p.getValue('customer') === customer('C010') && p.getValue('state') === 'PENDING_APPROVAL', p.getValue('state'));
    });

    scenario('AR-G DRAFT mode', function() {
        var i = item('C002', 'INR', 24680 + K);
        var r = pay('G', customer('C002'), 'INR', 24680 + K);
        setMode(r.paymentSysId, 'draft');
        approveAr(r.paymentSysId);
        var p = rec('x_695068_bcfa_payment', r.paymentSysId);
        check('SAP_DRAFT, staged', p.getValue('state') === 'SAP_DRAFT' && p.getValue('sap_status') === 'staged_draft', p.getValue('state') + '/' + p.getValue('sap_status'));
        check('parked document (PARK)', String(p.getValue('sap_reference')).indexOf('PARK') === 0, p.getValue('sap_reference'));
        check('no claim of final clearing (open item open)', parseFloat(rec('x_695068_bcfa_ar_open_item', i).getValue('open_amount')) === 24680 + K, 'cleared');
        journey(p, 8, 'waiting');
        var c = ar.checkSapDraftStatus(r.paymentSysId);
        check('pending draft: no change, nothing re-sent', c.pending === true && count('x_695068_bcfa_integration_txn', 'source_record=' + r.paymentSysId + '^operation=clearCustomerPayment') === 1, JSON.stringify(c));
        cur.checks.push('ref ' + p.getValue('bank_reference') + ' left in SAP_DRAFT');
    });

    scenario('AR-H DIRECT mode', function() {
        var i = item('C003', 'EUR', 13579 + K);
        var r = pay('H', customer('C003'), 'EUR', 13579 + K);
        setMode(r.paymentSysId, 'direct');
        approveAr(r.paymentSysId);
        cleared(r.paymentSysId, [i]);
    });

    scenario('AR-I unknown outcome', function() {
        item('C009', 'USD', 9753 + K);
        var r = pay('I', customer('C009'), 'USD', 9753 + K);
        setMode(r.paymentSysId, 'direct');
        seeder._setAdapterFailureMode('mock_sap', 'timeout');
        try { approveAr(r.paymentSysId); } finally { seeder._setAdapterFailureMode('mock_sap', 'success'); }
        var p = rec('x_695068_bcfa_payment', r.paymentSysId);
        check('UNKNOWN_OUTCOME, closure blocked', p.getValue('state') === 'UNKNOWN_OUTCOME', p.getValue('state'));
        journey(p, 8, 'blocked');
        var txn = seeder._latestIntegrationTxn('x_695068_bcfa_payment', r.paymentSysId, 'clearCustomerPayment');
        var res = ar.reconcileClearing(r.paymentSysId, txn);
        p = rec('x_695068_bcfa_payment', r.paymentSysId);
        check('reconciled', p.getValue('state') !== 'UNKNOWN_OUTCOME', p.getValue('state') + ' ' + JSON.stringify(res));
        check('no duplicate clearing', count('x_695068_bcfa_integration_txn', 'source_record=' + r.paymentSysId + '^operation=clearCustomerPayment^status=success') <= 1, 'duplicate');
        cur.checks.push('final ' + p.getValue('state'));
    });

    var pass = 0, total = 0;
    for (var k in results) { total++; if (results[k].indexOf('PASS') === 0) pass++; }
    gs.info('BCFA_E2E run ' + RUN + ' ' + pass + '/' + total + ' PASS ' + JSON.stringify(results));
})();
