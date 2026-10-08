import { Test } from '@servicenow/sdk/core'

// Phase 41: hardening for the client sample pack and the POC team's defects
// (docs/DEFECT_REMEDIATION_REPORT.md). Deterministic: every test creates its
// own data (ATF rolls it back); no document extraction call, no SAP call
// (MOCK SAP reads only), no AI.

Test(
    { $id: Now.ID['test-h41-d6-acl'], name: 'H41-D6 Finance Approver may write the Decision Reason (AP and AR exceptions), nothing else; AI role may not', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-d6-acl-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var rolesOf = function(name, op) {
                        var out = [];
                        var acl = new GlideRecord('sys_security_acl');
                        acl.addQuery('name', name);
                        acl.addQuery('operation.name', op);
                        acl.addQuery('active', true);
                        acl.query();
                        while (acl.next()) {
                            var r = new GlideRecord('sys_security_acl_role');
                            r.addQuery('sys_security_acl', acl.getUniqueValue());
                            r.query();
                            while (r.next()) out.push(r.sys_user_role.name.toString());
                        }
                        return out.join(',');
                    };
                    ['x_695068_bcfa_ap_exception', 'x_695068_bcfa_ar_exception'].forEach(function(t) {
                        var field = rolesOf(t + '.decision_reason', 'write');
                        assertEqual({ name: t + ' decision_reason: Finance Approver may write', shouldbe: true, value: field.indexOf('x_695068_bcfa.finance_approver') >= 0 });
                        assertEqual({ name: t + ' decision_reason: AI agent role may not', shouldbe: false, value: field.indexOf('x_695068_bcfa.ai_agent') >= 0 });
                        assertEqual({ name: t + ' decision_reason: auditor may not', shouldbe: false, value: field.indexOf('x_695068_bcfa.auditor') >= 0 });
                        var star = rolesOf(t + '.*', 'write');
                        assertEqual({ name: t + ' other fields stay processor/admin only', shouldbe: false, value: star.indexOf('x_695068_bcfa.finance_approver') >= 0 });
                        assertEqual({ name: t + ' record write includes the Finance Approver', shouldbe: true, value: rolesOf(t, 'write').indexOf('x_695068_bcfa.finance_approver') >= 0 });
                    });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h41-d1-dup'], name: 'H41-D1 Duplicate intake: the canonical intake keeps ownership, a duplicate never becomes canonical, no loop', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-d1-dup-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var hash = 'H41D1' + gs.generateGUID();
                    var mk = function(status, dupOf) {
                        var g = new GlideRecord('x_695068_bcfa_finance_intake');
                        g.initialize();
                        g.setValue('document_type', 'unknown');
                        g.setValue('attachment_hash', hash);
                        g.setValue('processing_status', status);
                        if (dupOf) g.setValue('duplicate_of', dupOf);
                        g.setWorkflow(false);
                        return g.insert();
                    };
                    var svc = new FinanceDocumentIntakeService();
                    var a = mk('review_required');
                    var b = mk('new');
                    var forB = svc._findDuplicateIntake(b, hash, '');
                    assertEqual({ name: 'B (later) finds A, in review, as canonical', shouldbe: a, value: forB ? forB.getUniqueValue() : '' });
                    var bRec = new GlideRecord('x_695068_bcfa_finance_intake'); bRec.get(b);
                    bRec.setValue('duplicate_of', a); bRec.setValue('processing_status', 'completed'); bRec.setWorkflow(false); bRec.update();
                    var forA = svc._findDuplicateIntake(a, hash, '');
                    assertEqual({ name: 'A reprocessed after correction does not point at its duplicate B', shouldbe: '', value: forA ? forA.getUniqueValue() : '' });
                    var legacy = mk('completed');
                    var l = new GlideRecord('x_695068_bcfa_finance_intake'); l.get(legacy);
                    l.setValue('processing_error', 'Duplicate of FDI-OLD — reusing its result, no new transaction created.'); l.setWorkflow(false); l.update();
                    var c = mk('new');
                    var forC = svc._findDuplicateIntake(c, hash, '');
                    assertEqual({ name: 'a legacy duplicate (marked only by its message) is never canonical either', shouldbe: a, value: forC ? forC.getUniqueValue() : '' });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h41-d2-d3-intake'], name: 'H41-D2/D3 Process Document: no attachment stays a draft (no transaction, no exception); a new attempt clears the stale error', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-d2-d3-intake-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var svc = new FinanceDocumentIntakeService();
                    var g = new GlideRecord('x_695068_bcfa_finance_intake');
                    g.initialize(); g.setValue('document_type', 'ap_invoice'); g.setValue('processing_status', 'new'); g.setWorkflow(false);
                    var draft = g.insert();
                    var r = svc.processDocument(draft);
                    g.get(draft);
                    assertEqual({ name: 'D3 no attachment: attachmentRequired', shouldbe: true, value: r.attachmentRequired === true });
                    assertEqual({ name: 'D3 status stays new (draft)', shouldbe: 'new', value: g.getValue('processing_status') });
                    assertEqual({ name: 'D3 no AP invoice', shouldbe: true, value: !g.getValue('ap_invoice') });
                    assertEqual({ name: 'D3 clear message', shouldbe: true, value: g.getValue('processing_error').indexOf('Attachment required') === 0 });
                    var ex = new GlideRecord('x_695068_bcfa_audit_event'); ex.addQuery('source_record', draft); ex.addQuery('event_type', 'exception_created'); ex.query();
                    assertEqual({ name: 'D3 no exception raised', shouldbe: false, value: ex.hasNext() });

                    var h = new GlideRecord('x_695068_bcfa_finance_intake');
                    h.initialize(); h.setValue('document_type', 'unknown'); h.setValue('processing_status', 'review_required');
                    h.setValue('processing_error', 'OLD ERROR from a previous attempt'); h.setWorkflow(false);
                    var reviewed = h.insert();
                    new GlideSysAttachment().write(h, 'h41-' + gs.generateGUID() + '.pdf', 'application/pdf', '%PDF-1.4 H41 ' + gs.generateGUID());
                    var r2 = svc.processDocument(reviewed);
                    h.get(reviewed);
                    assertEqual({ name: 'D2 the stale error is cleared for the new attempt', shouldbe: true, value: !h.getValue('processing_error') });
                    assertEqual({ name: 'D2 the attempt stops at review (type still unknown), no extraction', shouldbe: true, value: r2.requiresReview === true && !h.getValue('extraction_task') });
                    var au = new GlideRecord('x_695068_bcfa_audit_event'); au.addQuery('source_record', reviewed); au.addQuery('description', 'CONTAINS', 'previous processing error is cleared'); au.query();
                    assertEqual({ name: 'D2 the old error is kept in the audit trail', shouldbe: true, value: au.hasNext() });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h41-d8-corr'], name: 'H41-D8 Remittance correlation: conflicts and weak evidence never link; exact consistent reference links', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-d8-corr-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var tag = 'H41' + gs.generateGUID().substring(0, 6).toUpperCase();
                    var cust = function(code, name) {
                        var c = new GlideRecord('x_695068_bcfa_customer'); c.initialize();
                        c.setValue('customer_code', code); c.setValue('name', name); c.setValue('active', true); c.setValue('currency', 'INR');
                        return c.insert();
                    };
                    var pay = function(ref, customer, amount, currency) {
                        var p = new GlideRecord('x_695068_bcfa_payment'); p.initialize();
                        p.setValue('bank_reference', ref); if (customer) p.setValue('customer', customer); p.setValue('amount', amount);
                        p.setValue('currency', currency); p.setValue('state', 'RECEIVED'); p.setValue('value_date', '2026-10-05'); p.setWorkflow(false);
                        return p.insert();
                    };
                    var A = cust(tag + 'A', tag + ' Alpha Rubber Ltd'), B = cust(tag + 'B', tag + ' Beta Tyres Ltd');
                    var pA = pay(tag + '-REF-1', A, 1000, 'INR');
                    var svc = new FinanceDocumentIntakeService();
                    var adv = function(o) { var d = { payment_reference: '', customer_code: '', customer_name: '', payment_amount: 1000, currency: 'INR', payment_date: '2026-10-05' }; for (var k in o) d[k] = o[k]; return d; };

                    var ok = svc.correlatePayment(adv({ payment_reference: tag + '-REF-1', customer_code: tag + 'A' }));
                    assertEqual({ name: 'exact reference, same customer, amount and currency links', shouldbe: pA, value: ok.paymentSysId || '' });
                    var ok2 = svc.correlatePayment(adv({ payment_reference: tag.toLowerCase() + ' ref 1', customer_code: tag + 'A' }));
                    assertEqual({ name: 'reference compared without case / spaces / dashes', shouldbe: pA, value: ok2.paymentSysId || '' });
                    var wrongCustomer = svc.correlatePayment(adv({ payment_reference: tag + '-REF-1', customer_code: tag + 'B' }));
                    assertEqual({ name: 'same reference, different customer: not linked', shouldbe: '', value: wrongCustomer.paymentSysId || '' });
                    var wrongCurrency = svc.correlatePayment(adv({ payment_reference: tag + '-REF-1', customer_code: tag + 'A', currency: 'USD' }));
                    assertEqual({ name: 'same reference, different currency: not linked', shouldbe: '', value: wrongCurrency.paymentSysId || '' });
                    var wrongAmount = svc.correlatePayment(adv({ payment_reference: tag + '-REF-1', customer_code: tag + 'A', payment_amount: 1500 }));
                    assertEqual({ name: 'same reference, different amount: not linked', shouldbe: '', value: wrongAmount.paymentSysId || '' });
                    var noRefUnknown = svc.correlatePayment(adv({ customer_name: 'Nobody ' + tag }));
                    assertEqual({ name: 'no reference, customer unresolved: amount + currency alone never links', shouldbe: '', value: noRefUnknown.paymentSysId || '' });
                    var pB1 = pay(tag + '-B1', B, 2000, 'INR');
                    var byCustomer = svc.correlatePayment(adv({ customer_code: tag + 'B', payment_amount: 2000 }));
                    assertEqual({ name: 'no reference, resolved customer, one payment by amount/currency/date links', shouldbe: pB1, value: byCustomer.paymentSysId || '' });
                    pay(tag + '-B2', B, 2000, 'INR');
                    var twoB = svc.correlatePayment(adv({ customer_code: tag + 'B', payment_amount: 2000 }));
                    assertEqual({ name: 'two candidate payments: none chosen', shouldbe: true, value: !twoB.paymentSysId && twoB.candidates.length === 2 });
                    pay(tag + '-DUP', A, 500, 'INR'); pay(tag + '-DUP', B, 500, 'INR');
                    var dupRef = svc.correlatePayment(adv({ payment_reference: tag + '-DUP', customer_code: tag + 'A', payment_amount: 500 }));
                    assertEqual({ name: 'reference carried by two payments: none chosen', shouldbe: '', value: dupRef.paymentSysId || '' });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h41-d10-state'], name: 'H41-D10 A payment created without a lifecycle state starts as RECEIVED', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-d10-state-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var p = new GlideRecord('x_695068_bcfa_payment'); p.initialize();
                    p.setValue('bank_reference', 'H41-D10-' + gs.generateGUID().substring(0, 8)); p.setValue('amount', 10); p.setValue('currency', 'INR');
                    var id = p.insert();
                    p.get(id);
                    assertEqual({ name: 'state RECEIVED', shouldbe: 'RECEIVED', value: p.getValue('state') });
                    assertEqual({ name: 'correlation id set', shouldbe: true, value: !!p.getValue('correlation_id') });
                    assertEqual({ name: 'idempotency key set', shouldbe: true, value: !!p.getValue('idempotency_key') });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h41-d9-recon'], name: 'H41-D9 Totals reconcile with shipping / charges (Uline) and do not change the extraction confidence', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-d9-recon-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var p = new NativeDocumentIntelligenceProvider();
                    var base = { 'Supplier Name': 'Uline', 'Invoice Number': 'U1', 'Currency': 'CAD', 'Invoice Line Items': [{ quantity: 1, unit_price: 1901.34, net_amount: 1901.34 }] };
                    var mk = function(extra) { var r = {}; for (var k in base) r[k] = base[k]; for (var e in extra) r[e] = extra[e]; return p._mapInvoice(r); };
                    var u = mk({ 'Subtotal Before Tax': '1,901.34', 'Total Tax Amount': '199.68', 'Shipping and Handling Amount': '211.70', 'Invoice Total': '2,312.72' });
                    assertEqual({ name: 'Uline: subtotal + sales tax + shipping/handling = total reconciles', shouldbe: 'reconciled', value: u.reconciliation.result });
                    assertEqual({ name: 'Uline: confidence 1', shouldbe: 1, value: u.confidence });
                    var f = mk({ 'Subtotal Before Tax': '1901.34', 'Total Tax Amount': '199.68', 'Freight Amount': '211.70', 'Invoice Total': '2312.72' });
                    assertEqual({ name: 'charge read as freight reconciles too', shouldbe: 'reconciled', value: f.reconciliation.result });
                    var inNet = mk({ 'Subtotal Before Tax': '2113.04', 'Total Tax Amount': '199.68', 'Shipping and Handling Amount': '211.70', 'Invoice Total': '2312.72' });
                    assertEqual({ name: 'shipping already inside the net is not counted twice', shouldbe: 'reconciled', value: inNet.reconciliation.result });
                    var miss = mk({ 'Subtotal Before Tax': '1901.34', 'Total Tax Amount': '199.68', 'Invoice Total': '2312.72' });
                    assertEqual({ name: 'unexplained difference: not reconciled', shouldbe: 'not_reconciled', value: miss.reconciliation.result });
                    assertEqual({ name: 'not reconciled does not lower the extraction confidence', shouldbe: 1, value: miss.confidence });
                    var eu = mk({ 'Currency': 'EUR', 'Subtotal Before Tax': '1.234,56', 'Total Tax Amount': '234,57', 'Invoice Total': '1 469,13', 'Invoice Line Items': [{ quantity: 1, unit_price: 1234.56, net_amount: 1234.56 }] });
                    assertEqual({ name: 'decimal comma amounts normalised and reconciled', shouldbe: 'reconciled|1234.56', value: eu.reconciliation.result + '|' + eu.net_amount });
                    assertEqual({ name: 'original printed value kept', shouldbe: '1.234,56', value: eu.normalization[0].original });
                    var adv = p._mapAdvice({ 'Payer Name': 'Apollo', 'Payment Reference': 'R', 'Payment Amount': '9800', 'Currency': 'INR',
                        'Invoices Paid': [{ invoice_reference: 'I1', invoice_amount: 5000, tds_amount: 100, amount_applied: 4900 }, { invoice_reference: 'I2', invoice_amount: 5000, tds_amount: 100, amount_applied: 4900 }] });
                    assertEqual({ name: 'AR: gross - TDS = paid per invoice, sum = payment', shouldbe: 'reconciled', value: adv.reconciliation.result });
                    assertEqual({ name: 'SAP request check counts the charges', shouldbe: 0, value: new SapPayloadBuilder().check({ schema: 'bcfa.sap/1', operation: 'postVendorInvoice', companyCode: 'X', vendor: { code: 'V' }, reference: 'U1', documentDate: '2026-01-01',
                        postingDate: '2026-01-01', currency: 'CAD', grossAmount: 2312.72, netAmount: 1901.34, taxAmount: 199.68, chargesAmount: 211.70, discountAmount: 0, tax: { type: 'GST' }, items: [] }).errors.length });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h41-d5-fx'], name: 'H41-D5 Invoice and PO in different currencies: converted at the governed rate, or not compared and routed to review', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-d5-fx-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var tag = 'H41FX' + gs.generateGUID().substring(0, 6);
                    var seq = 0;
                    var po = function(cur) { var g = new GlideRecord('x_695068_bcfa_purchase_order'); g.initialize(); g.setValue('po_number', tag + cur + (seq++)); g.setValue('currency', cur); g.setValue('status', 'open'); return g.insert(); };
                    var inv = function(cur, poId) { var g = new GlideRecord('x_695068_bcfa_ap_invoice'); g.initialize(); g.setValue('invoice_number', tag + cur + poId.substring(0, 4)); g.setValue('currency', cur);
                        g.setValue('purchase_order', poId); g.setValue('state', 'MATCHING'); g.setWorkflow(false); var id = g.insert(); g.get(id); return g; };
                    var me = new MatchingEngine();
                    var same = me.currencyCheck(inv('INR', po('INR')));
                    assertEqual({ name: 'same currency: no conversion', shouldbe: false, value: same.required });
                    var conv = me.currencyCheck(inv('USD', po('INR')));
                    assertEqual({ name: 'USD invoice, INR PO: converted at the governed rate', shouldbe: true, value: conv.required && conv.available && conv.rate === 83 });
                    assertEqual({ name: 'conversion records source and date', shouldbe: true, value: conv.detail.indexOf('MOCK SAP') >= 0 && !!conv.rateDate });
                    var none = me.currencyCheck(inv('CAD', po('INR')));
                    assertEqual({ name: 'no approved rate: not available (prices not compared)', shouldbe: true, value: none.required && !none.available });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h41-d6-rerun'], name: 'H41-D6b Re-run: only before approval; a pending approval is withdrawn; the original is never a duplicate of a later copy', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-d6-rerun-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var tag = 'H41RR' + gs.generateGUID().substring(0, 6);
                    var v = new GlideRecord('x_695068_bcfa_vendor'); v.initialize(); v.setValue('vendor_code', tag); v.setValue('name', tag); v.setValue('active', true); var vendor = v.insert();
                    var inv = function(num, state, created) {
                        var g = new GlideRecord('x_695068_bcfa_ap_invoice'); g.initialize();
                        g.setValue('invoice_number', num); g.setValue('vendor', vendor); g.setValue('gross_amount', 100); g.setValue('state', state);
                        if (created) { g.autoSysFields(false); g.setValue('sys_created_on', created); g.setValue('sys_updated_on', created); }
                        g.setWorkflow(false); return g.insert();
                    };
                    var svc = new ApDomainService();
                    var approved = inv(tag + '-APP', 'APPROVED');
                    assertEqual({ name: 're-run refused after approval', shouldbe: true, value: !!svc.rerunChecks(approved, 'validation', gs.getUserID()).error });

                    var pending = inv(tag + '-PEND', 'PENDING_APPROVAL');
                    var a = new GlideRecord('x_695068_bcfa_ap_approval'); a.initialize(); a.setValue('ap_invoice', pending); a.setValue('decision', 'pending'); var apr = a.insert();
                    var n = new ApprovalEngine().withdrawPendingApprovals('ap', pending, 'test re-run', gs.getUserID());
                    a.get(apr);
                    assertEqual({ name: 'pending approval withdrawn', shouldbe: '1|withdrawn', value: n + '|' + a.getValue('decision') });
                    var late = new ApprovalEngine().decideApInvoiceApproval(apr, 'approved', gs.getUserID(), 'late');
                    assertEqual({ name: 'a withdrawn approval can no longer be decided', shouldbe: true, value: !!late.error });

                    var original = inv(tag + '-ORIG', 'PENDING_APPROVAL', '2026-01-01 10:00:00');
                    inv(tag + '-ORIG', 'EXCEPTION', '2026-01-02 10:00:00');
                    var d = new MatchingEngine().detectDuplicateInvoice(original);
                    assertEqual({ name: 're-checking the original never flags it as a duplicate of the later copy', shouldbe: false, value: d.duplicate });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h41-int-outcome'], name: 'H41-SAP The adapter status decides the integration outcome; a crashed write is an unknown outcome', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-int-outcome-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var svc = new IntegrationService();
                    var run = function(op, adapterResult) {
                        var txn = new GlideRecord('x_695068_bcfa_integration_txn'); txn.initialize(); txn.setValue('adapter', 'real_sap');
                        var result = { status: 'success', response: null, unknownOutcome: false };
                        svc._applyAdapterOutcome(op, adapterResult, result, txn);
                        return result.status + '|' + (result.unknownOutcome ? 'unknown' : '-') + '|' + (txn.getValue('error_code') || '');
                    };
                    assertEqual({ name: 'SUCCESS', shouldbe: 'success|-|', value: run('postVendorInvoice', { status: 'SUCCESS', sapDocumentId: 'X' }) });
                    assertEqual({ name: 'VALIDATION_ERROR', shouldbe: 'validation_error|-|VALIDATION_ERROR', value: run('postVendorInvoice', { status: 'VALIDATION_ERROR', message: 'period closed' }) });
                    assertEqual({ name: 'TECHNICAL_ERROR', shouldbe: 'technical_error|-|TECHNICAL_ERROR', value: run('postVendorInvoice', { status: 'TECHNICAL_ERROR' }) });
                    assertEqual({ name: 'write TIMEOUT is an unknown outcome', shouldbe: 'timeout|unknown|TIMEOUT', value: run('postVendorInvoice', { status: 'TIMEOUT' }) });
                    assertEqual({ name: 'read TIMEOUT is a technical error', shouldbe: 'technical_error|-|TIMEOUT', value: run('getOpenItems', { status: 'TIMEOUT' }) });
                    assertEqual({ name: 'DUPLICATE', shouldbe: 'duplicate|-|DUPLICATE', value: run('clearCustomerPayment', { status: 'DUPLICATE' }) });
                    assertEqual({ name: 'NOT_CONFIGURED', shouldbe: 'failed|-|NOT_CONFIGURED', value: run('postVendorInvoice', { status: 'NOT_CONFIGURED' }) });
                    assertEqual({ name: 'read without status is a success', shouldbe: 'success|-|', value: run('getVendor', { found: true }) });
                    var contract = svc.checkAdapterContract('real_sap');
                    assertEqual({ name: 'real SAP adapter implements every canonical operation (incl. getDraftStatus)', shouldbe: true, value: contract.conforms });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h41-num'], name: 'H41-NUM Intakes inserted in the same instant get distinct numbers', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h41-num-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var seen = {}, distinct = 0;
                    for (var k = 0; k < 6; k++) {
                        var g = new GlideRecord('x_695068_bcfa_finance_intake');
                        g.initialize();
                        g.setValue('document_type', 'unknown');
                        g.insert();
                        var n = g.getValue('number');
                        if (n && !seen[n]) { seen[n] = true; distinct++; }
                    }
                    assertEqual({ name: '6 intakes inserted back to back have 6 distinct numbers', shouldbe: 6, value: distinct });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)
