import { Test } from '@servicenow/sdk/core'

// Playbook phase regression: PB-AP-001..006, PB-AR-001..009, PB-UI-001..007.
// Server-side checks (ATF rolls back the records each test creates). The
// journey tests build the authoritative records directly (setWorkflow(false))
// and assert what FinanceJourneyService derives from them; the Playbooks
// display those fields and wait on journey_stage_order. Run one test at a
// time (sn_atf.ExecuteUserTest), see docs/TEST_PLAN.md.

// Each step inlines the same helpers (ATF steps cannot share code):
//   inv(state)            inserts an AP invoice in the given state
//   pay(state)            inserts a payment in the given state
//   exc(table, field, parentId, reason, rule, ai)  inserts an open exception
// ---- AP Playbook -------------------------------------------------------------

Test({ $id: Now.ID['test-pb-ap-001'], name: 'PB-AP-001 AP Playbook — state to stage mapping', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ap-001-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var expected = { RECEIVED: 1, EXTRACTED: 2, VALIDATED: 3, MATCHED: 4, PENDING_APPROVAL: 6, POSTING: 7, POSTED: 7, RECONCILED: 8, CLOSED: 9, REJECTED: 9 };
                var seen = [];
                for (var s in expected) {
                    var j = journey('x_695068_bcfa_ap_invoice', inv(s));
                    assertEqual({ name: s + ' maps to stage order ' + expected[s], shouldbe: expected[s], value: j.order });
                    seen.push(s + '=' + j.order + '/' + j.stage);
                }
                assertEqual({ name: 'CLOSED is complete', shouldbe: 'complete', value: journey('x_695068_bcfa_ap_invoice', inv('CLOSED')).status });
                assertEqual({ name: 'REJECTED is rejected', shouldbe: 'rejected', value: journey('x_695068_bcfa_ap_invoice', inv('REJECTED')).status });
                stepResult.setOutputMessage(seen.join(', '));

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ap-002'], name: 'PB-AP-002 AP Playbook — blocked at 3-way match shows WHAT / WHY / NEXT / WHO', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ap-002-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var id = inv('EXCEPTION');
                exc('x_695068_bcfa_ap_exception', 'ap_invoice', id, 'price_tolerance', 'Unit price 50.00 vs PO 40.00: +25% exceeds the 2% tolerance.');
                var j = journey('x_695068_bcfa_ap_invoice', id);
                assertEqual({ name: 'stops at stage 4 (3-way match)', shouldbe: 4, value: j.order });
                assertEqual({ name: 'status blocked', shouldbe: 'blocked', value: j.status });
                assertEqual({ name: 'WHAT HAPPENED stated', shouldbe: true, value: j.blocked.indexOf('WHAT HAPPENED') === 0 });
                assertEqual({ name: 'WHY is the rule result', shouldbe: true, value: j.blocked.indexOf('WHY: Unit price 50.00 vs PO 40.00') > 0 });
                assertEqual({ name: 'next action given', shouldbe: true, value: j.next.length > 0 });
                assertEqual({ name: 'owner given', shouldbe: true, value: j.owner.length > 0 });
                assertEqual({ name: 'one open exception', shouldbe: 1, value: j.openExceptions });
                stepResult.setOutputMessage(j.blocked + ' | NEXT: ' + j.next + ' | WHO: ' + j.owner);

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ap-003'], name: 'PB-AP-003 AP Playbook — AI recommendation never advances the journey', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ap-003-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var id = inv('EXCEPTION');
                exc('x_695068_bcfa_ap_exception', 'ap_invoice', id, 'quantity_tolerance', 'Invoiced 15 vs received 10.', 'Recommend: accept the variance and approve.');
                var j = journey('x_695068_bcfa_ap_invoice', id);
                var g = new GlideRecord('x_695068_bcfa_ap_invoice'); g.get(id);
                assertEqual({ name: 'still blocked despite an AI recommendation to approve', shouldbe: 'blocked', value: j.status });
                assertEqual({ name: 'WHY uses the system determination, not the AI text', shouldbe: -1, value: j.blocked.indexOf('Recommend: accept') });
                assertEqual({ name: 'invoice state unchanged (AI does not decide)', shouldbe: 'EXCEPTION', value: g.getValue('state') });
                stepResult.setOutputMessage(j.blocked);

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ap-004'], name: 'PB-AP-004 AP Playbook — simulated extraction and MOCK SAP labels', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ap-004-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var j = journey('x_695068_bcfa_ap_invoice', inv('EXTRACTED'));
                assertEqual({ name: 'banner names the simulated extraction', shouldbe: true, value: String(j.banner).indexOf('SIMULATED DOCUMENT EXTRACTION — POC') >= 0 });
                assertEqual({ name: 'banner names MOCK SAP', shouldbe: true, value: String(j.banner).indexOf('MOCK SAP') >= 0 });
                stepResult.setOutputMessage(j.banner);

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ap-005'], name: 'PB-AP-005 AP Playbook — unknown SAP outcome blocks posting for the Integration Operator', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ap-005-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var j = journey('x_695068_bcfa_ap_invoice', inv('UNKNOWN_OUTCOME'));
                assertEqual({ name: 'stage 7 (SAP posting)', shouldbe: 7, value: j.order });
                assertEqual({ name: 'blocked', shouldbe: 'blocked', value: j.status });
                assertEqual({ name: 'owner Integration Operator', shouldbe: 'Integration Operator', value: j.owner });
                assertEqual({ name: 'says never blindly re-sent', shouldbe: true, value: j.blocked.indexOf('never blindly re-sent') > 0 });
                var p = journey('x_695068_bcfa_ap_invoice', inv('PENDING_APPROVAL'));
                assertEqual({ name: 'pending approval: action required by a Finance Approver', shouldbe: 'action_required|Finance Approver', value: p.status + '|' + p.owner });
                stepResult.setOutputMessage(j.blocked + ' || ' + p.blocked);

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ap-006'], name: 'PB-AP-006 AP Playbook — journey refresh is display only', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ap-006-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var id = inv('MATCHED');
                var audit = function() { var a = new GlideAggregate('x_695068_bcfa_audit_event'); a.addQuery('source_record', id); a.addAggregate('COUNT'); a.query(); return a.next() ? parseInt(a.getAggregate('COUNT'), 10) : 0; };
                var before = audit();
                var j = new FinanceJourneyService().refreshInvoice(id);
                var g = new GlideRecord('x_695068_bcfa_ap_invoice'); g.get(id);
                assertEqual({ name: 'state unchanged by the refresh', shouldbe: 'MATCHED', value: g.getValue('state') });
                assertEqual({ name: 'journey fields written', shouldbe: '4|matching', value: g.getValue('journey_stage_order') + '|' + g.getValue('journey_stage') });
                assertEqual({ name: 'no audit event from a display refresh', shouldbe: before, value: audit() });
                assertEqual({ name: 'refresh returns the derived journey', shouldbe: 4, value: j.order });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

// ---- AR Playbook -------------------------------------------------------------

Test({ $id: Now.ID['test-pb-ar-001'], name: 'PB-AR-001 Cash Application Playbook — state to stage mapping', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ar-001-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var expected = { RECEIVED: 1, CUSTOMER_RESOLUTION: 3, MATCHING: 5, ALLOCATION: 5, PENDING_APPROVAL: 7, CLEARING: 8, SAP_DRAFT: 8, UNKNOWN_OUTCOME: 8, CLEARED: 9, RECONCILED: 9, CLOSED: 10 };
                var seen = [];
                for (var s in expected) {
                    var j = journey('x_695068_bcfa_payment', pay(s));
                    assertEqual({ name: s + ' maps to stage order ' + expected[s], shouldbe: expected[s], value: j.order });
                    seen.push(s + '=' + j.order + '/' + j.stage);
                }
                stepResult.setOutputMessage(seen.join(', '));

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ar-002'], name: 'PB-AR-002 Cash Application Playbook — payment only vs payment with remittance', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ar-002-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var id = pay('RECEIVED');
                var j1 = journey('x_695068_bcfa_payment', id);
                assertEqual({ name: 'no remittance: stage 1, PAYMENT ONLY', shouldbe: '1|true', value: j1.order + '|' + (j1.blocked.indexOf('PAYMENT ONLY') === 0) });
                var r = new GlideRecord('x_695068_bcfa_remittance'); r.initialize(); r.setValue('payment', id); r.setValue('remittance_reference', 'PB-REM'); r.setWorkflow(false); r.insert();
                var j2 = journey('x_695068_bcfa_payment', id);
                assertEqual({ name: 'with remittance: stage 2 (correlation)', shouldbe: 2, value: j2.order });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ar-003'], name: 'PB-AR-003 Cash Application Playbook — short payment blocks the deduction stage', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ar-003-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var id = pay('EXCEPTION');
                exc('x_695068_bcfa_ar_exception', 'payment', id, 'short_pay', 'Residual -500.00: payment below the allocated open items.', 'Likely a bank charge.');
                var j = journey('x_695068_bcfa_payment', id);
                assertEqual({ name: 'stage 6 (exception / deduction)', shouldbe: 6, value: j.order });
                assertEqual({ name: 'blocked', shouldbe: 'blocked', value: j.status });
                assertEqual({ name: 'WHY is the rule result', shouldbe: true, value: j.blocked.indexOf('WHY: Residual -500.00') > 0 });
                assertEqual({ name: 'next action: a person classifies the residual', shouldbe: true, value: j.next.indexOf('Approve Deduction') >= 0 });
                assertEqual({ name: 'owner AR Processor', shouldbe: true, value: j.owner.indexOf('AR Processor') === 0 });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ar-004'], name: 'PB-AR-004 Cash Application Playbook — ambiguous customer blocks customer resolution', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ar-004-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var id = pay('EXCEPTION');
                exc('x_695068_bcfa_ar_exception', 'payment', id, 'customer_ambiguous', 'Remitter name matches no customer above 0.95.');
                var j = journey('x_695068_bcfa_payment', id);
                assertEqual({ name: 'stage 3 (customer resolution)', shouldbe: 3, value: j.order });
                assertEqual({ name: 'no remittance: next action asks for it', shouldbe: true, value: j.next.indexOf('remittance') >= 0 });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ar-005'], name: 'PB-AR-005 SAP processing mode — configuration-driven, direct by default', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ar-005-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var prop = new GlideRecord('sys_properties');
                assertEqual({ name: 'property exists', shouldbe: true, value: prop.get('name', 'x_695068_bcfa.ar.sap_processing_mode') });
                var mode = new FinancePolicy().arSapProcessingMode();
                assertEqual({ name: 'mode is draft or direct', shouldbe: true, value: mode === 'draft' || mode === 'direct' });
                prop.setValue('value', 'draft'); prop.update();
                assertEqual({ name: 'draft when configured', shouldbe: 'draft', value: new FinancePolicy().arSapProcessingMode() });
                prop.setValue('value', 'anything-else'); prop.update();
                assertEqual({ name: 'unknown values fall back to direct', shouldbe: 'direct', value: new FinancePolicy().arSapProcessingMode() });
                prop.setValue('value', 'direct'); prop.update();

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ar-006'], name: 'PB-AR-006 MOCK SAP — DRAFT stages a parked document, DIRECT clears', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ar-006-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var m = new MockSAPAdapter();
                var draft = m.clearPayment({ bankReference: 'PB-TEST', amount: 100, processingMode: 'draft', idempotencyKey: 'PB-DRAFT-' + gs.generateGUID() });
                var direct = m.clearPayment({ bankReference: 'PB-TEST', amount: 100, processingMode: 'direct', idempotencyKey: 'PB-DIRECT-' + gs.generateGUID() });
                assertEqual({ name: 'draft response is staged', shouldbe: true, value: draft.staged === true });
                assertEqual({ name: 'draft document is a parked (PARK) document', shouldbe: 0, value: String(draft.sapDocumentId).indexOf('PARK') });
                assertEqual({ name: 'direct response is not staged', shouldbe: true, value: !direct.staged });
                assertEqual({ name: 'direct document is a clearing (FB05) document', shouldbe: 0, value: String(direct.sapDocumentId).indexOf('FB05') });
                stepResult.setOutputMessage(JSON.stringify({ draft: draft, direct: direct }));

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ar-007'], name: 'PB-AR-007 SAP draft status — pending changes nothing; only SAP_DRAFT payments can be checked', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ar-007-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var prop = new GlideRecord('sys_properties'); prop.get('name', 'x_695068_bcfa.mock_sap.draft_outcome');
                var saved = prop.getValue('value');
                prop.setValue('value', 'pending'); prop.update();
                assertEqual({ name: 'pending draft reported as DRAFT_PENDING', shouldbe: 'DRAFT_PENDING', value: new MockSAPAdapter().getDraftStatus('PARK-TEST', 'K').outcome });
                prop.setValue('value', 'rejected'); prop.update();
                assertEqual({ name: 'rejected draft reported as DRAFT_REJECTED', shouldbe: 'DRAFT_REJECTED', value: new MockSAPAdapter().getDraftStatus('PARK-TEST', 'K').outcome });
                prop.setValue('value', saved); prop.update();
                var r = new ArDomainService().checkSapDraftStatus(pay('PENDING_APPROVAL'));
                assertEqual({ name: 'a payment not in SAP_DRAFT is refused', shouldbe: true, value: !!r.error });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ar-008'], name: 'PB-AR-008 DRAFT end to end — staged, nothing cleared, then cleared after SAP confirms', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ar-008-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var seeder = new DemoDataSeeder();
                var users = seeder._twoUsers();
                var ar = new ArDomainService();
                var customer = seeder._lookupSysId('x_695068_bcfa_customer', 'customer_code', 'C006');
                var item = new GlideRecord('x_695068_bcfa_ar_open_item'); item.initialize();
                item.setValue('item_number', 'PB-T-' + gs.generateGUID().substring(0, 8)); item.setValue('customer', customer); item.setValue('company_code', '1000');
                item.setValue('currency', 'INR'); item.setValue('invoice_amount', 31313); item.setValue('open_amount', 31313); item.setValue('status', 'open');
                var itemId = item.insert();
                var r = FinanceOrchestration.runInline(function() {
                    return ar.intakeAndAutoProcess({ bankReference: 'PB-T-' + gs.generateGUID().substring(0, 8), customer: customer, currency: 'INR', amount: 31313, bankAccount: 'PB-T', idempotencyKey: 'PB-T-' + gs.generateGUID() });
                });
                assertEqual({ name: 'matched and pending approval', shouldbe: 'PENDING_APPROVAL', value: r.stoppedAt });
                var p = new GlideRecord('x_695068_bcfa_payment'); p.get(r.paymentSysId); p.setValue('sap_processing_mode', 'draft'); p.setWorkflow(false); p.update();
                FinanceOrchestration.runInline(function() {
                    var a = ar.requestApproval(r.paymentSysId, users[0]);
                    ar.decideApproval(r.paymentSysId, a.approvalSysId, 'approved', users[1], 'PB-AR-008');
                });
                p.get(r.paymentSysId);
                assertEqual({ name: 'payment staged in SAP_DRAFT', shouldbe: 'SAP_DRAFT|staged_draft', value: p.getValue('state') + '|' + p.getValue('sap_status') });
                item.get(itemId);
                assertEqual({ name: 'open item not cleared while the draft is unconfirmed', shouldbe: 31313, value: parseFloat(item.getValue('open_amount')) });
                assertEqual({ name: 'journey waiting at SAP processing', shouldbe: '8|waiting', value: p.getValue('journey_stage_order') + '|' + p.getValue('journey_status') });
                var prop = new GlideRecord('sys_properties'); prop.get('name', 'x_695068_bcfa.mock_sap.draft_outcome');
                var saved = prop.getValue('value');
                prop.setValue('value', 'posted'); prop.update();
                var c = ar.checkSapDraftStatus(r.paymentSysId);
                prop.setValue('value', saved); prop.update();
                p.get(r.paymentSysId); item.get(itemId);
                assertEqual({ name: 'cleared after SAP confirmed the draft', shouldbe: true, value: c.cleared === true });
                assertEqual({ name: 'payment closed', shouldbe: 'CLOSED', value: p.getValue('state') });
                assertEqual({ name: 'open item settled', shouldbe: 0, value: parseFloat(item.getValue('open_amount')) });
                stepResult.setOutputMessage('draft ' + p.getValue('sap_reference') + ' -> ' + JSON.stringify(c));

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ar-009'], name: 'PB-AR-009 SAP_DRAFT journey — waiting for SAP, nothing re-sent', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ar-009-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var id = pay('SAP_DRAFT');
                var g = new GlideRecord('x_695068_bcfa_payment'); g.get(id); g.setValue('sap_processing_mode', 'draft'); g.setValue('sap_reference', 'PARK-PB-TEST'); g.setWorkflow(false); g.update();
                var j = journey('x_695068_bcfa_payment', id);
                assertEqual({ name: 'stage 8, waiting', shouldbe: '8|waiting', value: j.order + '|' + j.status });
                assertEqual({ name: 'says nothing is cleared yet', shouldbe: true, value: j.blocked.indexOf('Nothing is cleared yet') > 0 });
                assertEqual({ name: 'next action is a status query only', shouldbe: true, value: j.next.indexOf('nothing is re-sent') > 0 });
                assertEqual({ name: 'banner shows SAP mode DRAFT and MOCK SAP', shouldbe: true, value: j.banner.indexOf('SAP mode DRAFT') > 0 && j.banner.indexOf('MOCK SAP') >= 0 });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

// ---- Playbook definitions and workspace ---------------------------------------

Test({ $id: Now.ID['test-pb-ui-001'], name: 'PB-UI-001 Both native Playbooks exist with 8 and 9 stages', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ui-001-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var expect = { 'BCFA AP Invoice Processing Playbook': ['x_695068_bcfa_ap_invoice', 8], 'BCFA Cash Application Playbook': ['x_695068_bcfa_payment', 9] };
                for (var label in expect) {
                    var pd = new GlideRecord('sys_pd_process_definition');
                    assertEqual({ name: label + ' exists', shouldbe: true, value: pd.get('label', label) });
                    var lanes = new GlideAggregate('sys_pd_lane'); lanes.addQuery('process_definition', pd.getUniqueValue()); lanes.addAggregate('COUNT'); lanes.query(); lanes.next();
                    assertEqual({ name: label + ' stage count', shouldbe: expect[label][1], value: parseInt(lanes.getAggregate('COUNT'), 10) });
                    stepResult.setOutputMessage(label + ': status ' + pd.getValue('status') + ', active ' + pd.getValue('active'));
                }

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ui-002'], name: 'PB-UI-002 Every Playbook stage waits on the authoritative journey order', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ui-002-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var WAIT = '5009aca043713110333c145f15b8f212';
                ['BCFA AP Invoice Processing Playbook', 'BCFA Cash Application Playbook'].forEach(function(label) {
                    var pd = new GlideRecord('sys_pd_process_definition'); pd.get('label', label);
                    var lane = new GlideRecord('sys_pd_lane'); lane.addQuery('process_definition', pd.getUniqueValue()); lane.query();
                    var gated = 0, lanes = 0;
                    while (lane.next()) {
                        lanes++;
                        var g = new GlideRecord('sys_pd_activity'); g.addQuery('lane', lane.getUniqueValue()); g.addQuery('activity_definition', WAIT); g.query();
                        if (g.hasNext()) gated++;
                    }
                    assertEqual({ name: label + ': one Wait For Condition gate per stage', shouldbe: lanes, value: gated });
                });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ui-003'], name: 'PB-UI-003 Playbook is not a workflow engine — read-only activity types only', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ui-003-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                // Wait For Condition and Record List: neither updates a record,
                // approves, posts, clears or calls AI.
                var ALLOWED = ['5009aca043713110333c145f15b8f212', '0b7f23cf77045110612c1b1ad910612b'];
                var act = new GlideRecord('sys_pd_activity');
                act.addQuery('process_definition.label', 'IN', 'BCFA AP Invoice Processing Playbook,BCFA Cash Application Playbook');
                act.query();
                var total = 0, other = [];
                while (act.next()) { total++; if (ALLOWED.indexOf(act.getValue('activity_definition')) < 0) other.push(act.getValue('label')); }
                assertEqual({ name: 'activities found', shouldbe: true, value: total >= 17 });
                assertEqual({ name: 'no activity outside Wait For Condition / Record List', shouldbe: '', value: other.join(', ') });
                stepResult.setOutputMessage(total + ' activities, all read-only');

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ui-004'], name: 'PB-UI-004 BCFA Workspace has the Playbook route on the platform Playbook page', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ui-004-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var route = new GlideRecord('sys_ux_app_route');
                route.addQuery('app_config', 'a31c27cbf9474e3f93e47c8ac7a7cbe1');
                route.addQuery('route_type', 'playbook');
                route.query();
                assertEqual({ name: 'playbook route in the BCFA workspace', shouldbe: true, value: route.next() });
                assertEqual({ name: 'route takes table and sysId', shouldbe: 'table,sysId', value: route.getValue('fields') });
                var screen = new GlideRecord('sys_ux_screen');
                screen.addQuery('screen_type', route.getValue('screen_type'));
                screen.query();
                assertEqual({ name: 'screen renders the platform Playbook page', shouldbe: '32eb57e82c904510f877b925aa1a4d10', value: screen.next() ? screen.getValue('macroponent') : '' });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ui-005'], name: 'PB-UI-005 Open Playbook and Check SAP Draft Status actions are correctly scoped', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ui-005-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                ['x_695068_bcfa_ap_invoice', 'x_695068_bcfa_payment'].forEach(function(t) {
                    var a = new GlideRecord('sys_ui_action'); a.addQuery('table', t); a.addQuery('name', 'Open Playbook'); a.addQuery('active', true); a.query();
                    assertEqual({ name: 'Open Playbook on ' + t, shouldbe: true, value: a.next() });
                    assertEqual({ name: 'Open Playbook only navigates', shouldbe: true, value: a.getValue('script').indexOf('setRedirectURL') >= 0 && a.getValue('script').indexOf('update(') < 0 });
                });
                var c = new GlideRecord('sys_ui_action'); c.addQuery('action_name', 'check_sap_draft_status_payment'); c.query();
                assertEqual({ name: 'Check SAP Draft Status exists', shouldbe: true, value: c.next() });
                assertEqual({ name: 'shown only for SAP_DRAFT', shouldbe: true, value: c.getValue('condition').indexOf('SAP_DRAFT') >= 0 });
                var roles = new GlideRecord('sys_ui_action_role'); roles.addQuery('sys_ui_action', c.getUniqueValue()); roles.addQuery('sys_user_role.name', 'x_695068_bcfa.ai_agent'); roles.query();
                assertEqual({ name: 'the AI agent role cannot run it', shouldbe: false, value: roles.hasNext() });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ui-006'], name: 'PB-UI-006 Journey stage choices match the Playbook stages', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ui-006-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var count = function(table) { var c = new GlideAggregate('sys_choice'); c.addQuery('name', table); c.addQuery('element', 'journey_stage'); c.addQuery('inactive', false); c.addAggregate('COUNT'); c.query(); return c.next() ? parseInt(c.getAggregate('COUNT'), 10) : 0; };
                assertEqual({ name: 'AP: 8 stages', shouldbe: 8, value: count('x_695068_bcfa_ap_invoice') });
                assertEqual({ name: 'AR: 9 stages', shouldbe: 9, value: count('x_695068_bcfa_payment') });
                var g = new GlideRecord('x_695068_bcfa_payment');
                assertEqual({ name: 'payment carries sap_processing_mode / sap_status / residual', shouldbe: true, value: g.isValidField('sap_processing_mode') && g.isValidField('sap_status') && g.isValidField('residual_amount') });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})

Test({ $id: Now.ID['test-pb-ui-007'], name: 'PB-UI-007 Review Summary shows the SAP processing mode with MOCK SAP label', active: true }, (atf) => {
    atf.server.runServerSideScript({
        $id: Now.ID['test-pb-ui-007-step'],
        script: `
            (function(outputs, steps, params, stepResult, assertEqual) {
                function inv(state) {
                    var g = new GlideRecord('x_695068_bcfa_ap_invoice');
                    g.initialize();
                    g.setValue('invoice_number', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('gross_amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function pay(state) {
                    var g = new GlideRecord('x_695068_bcfa_payment');
                    g.initialize();
                    g.setValue('bank_reference', 'PB-TEST-' + gs.generateGUID().substring(0, 8));
                    g.setValue('currency', 'INR');
                    g.setValue('amount', 100);
                    g.setValue('state', state);
                    g.setWorkflow(false);
                    return g.insert();
                }
                function exc(table, field, parentId, reason, rule, ai) {
                    var g = new GlideRecord(table);
                    g.initialize();
                    g.setValue(field, parentId);
                    g.setValue('reason_code', reason);
                    g.setValue('status', 'open');
                    g.setValue('severity', 'high');
                    g.setValue('rule_result', rule || '');
                    g.setValue('ai_recommendation', ai || '');
                    g.setWorkflow(false);
                    return g.insert();
                }
                function journey(table, id) {
                    var g = new GlideRecord(table);
                    g.get(id);
                    var svc = new FinanceJourneyService();
                    return table === 'x_695068_bcfa_ap_invoice' ? svc.invoiceJourney(g) : svc.paymentJourney(g);
                }
                var id = pay('SAP_DRAFT');
                var g = new GlideRecord('x_695068_bcfa_payment'); g.get(id); g.setValue('sap_processing_mode', 'draft'); g.setValue('sap_status', 'staged_draft'); g.setValue('sap_reference', 'PARK-PB-UI'); g.setWorkflow(false); g.update();
                new FinanceReviewSummary().refreshPayment(id);
                g.get(id);
                var s = String(g.getValue('review_summary'));
                assertEqual({ name: 'summary names the SAP processing mode', shouldbe: true, value: s.indexOf('SAP PROCESSING') >= 0 });
                assertEqual({ name: 'summary labels MOCK SAP', shouldbe: true, value: s.indexOf('MOCK SAP') >= 0 });
                assertEqual({ name: 'journey refreshed with the summary', shouldbe: '8', value: g.getValue('journey_stage_order') });

            })(outputs, steps, params, stepResult, assertEqual);
        `,
    })
})
