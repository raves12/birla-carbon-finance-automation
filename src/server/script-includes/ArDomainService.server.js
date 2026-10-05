// Orchestrates the Cash Application lifecycle (Section 8 of the build
// brief) on top of the Cash Application StateModel. Same philosophy as
// ApDomainService: real logic runs first, state follows the result.
var ArDomainService = Class.create();
ArDomainService.prototype = {
    initialize: function() {
        this.auditEngine = new AuditEngine();
        this.matchingEngine = new MatchingEngine();
        this.exceptionEngine = new ExceptionEngine();
        this.approvalEngine = new ApprovalEngine();
        this.integrationService = new IntegrationService();
        this.aiSimulation = new AISimulationService();
        this.policy = new FinancePolicy();
    },

    BALANCE_TOLERANCE: 0.01,

    // Public entry point for the "Explain with Now Assist" UI Action on AR
    // Exception. With the native provider it calls the published Now Assist
    // skills through FinanceAgentTools as the current user (role-checked,
    // advisory field only). Other providers keep the legacy path, which
    // for customer_ambiguous re-derives the candidate customers from the
    // exception description.
    explainException: function(arExceptionSysId) {
        if (this.policy.aiProvider() === 'native') {
            var tools = new FinanceAgentTools();
            var target = new GlideRecord('x_695068_bcfa_ar_exception');
            if (!target.get(arExceptionSysId)) return { ok: false, error: 'not_found', message: 'AR exception not found.' };
            var residual = tools.explainArResidual(target.getValue('payment'));
            var next = tools.recommendArNextAction(arExceptionSysId);
            if (!residual.ok && !next.ok) return next;
            var note = 'AI REVIEW (advisory only - a human must decide)' +
                (residual.ok ? '\n\nPayment and residual:\n' + residual.text : '') +
                (next.ok ? '\n\nRecommended next action:\n' + next.text : '');
            var saved = tools.recordExceptionAdvice('ar', arExceptionSysId, note);
            return saved.ok ? { ok: true, recommendation: note } : saved;
        }
        var exception = new GlideRecord('x_695068_bcfa_ar_exception');
        var candidateCustomers = null;
        if (exception.get(arExceptionSysId) && exception.getValue('reason_code') === 'customer_ambiguous') {
            var match = /remitter name "([^"]*)"/.exec(exception.getValue('description') || '');
            if (match) candidateCustomers = this._findCandidateCustomers(match[1]);
        }
        return this._explainArException(arExceptionSysId, candidateCustomers);
    },

    // audit (optional): { eventType, reason, after, actorType } — the business
    // event this transition records; by default derived from the new state
    // (AuditEngine.EVENT_BY_STATE), e.g. CLEARED is a SAP / mock result.
    _setState: function(paymentSysId, newState, correlationId, description, audit) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return false;
        var previous = payment.getValue('state');
        // Phase 26: only transitions of the lifecycle state model (FinanceLifecycle).
        this._lifecycle = this._lifecycle || new FinanceLifecycle();
        var gate = this._lifecycle.evaluate('x_695068_bcfa_payment', previous, newState);
        if (!gate.allowed && this._lifecycle.enforcing()) {
            this._lifecycle.record('x_695068_bcfa_payment', paymentSysId, previous, newState, gate, { correlationId: correlationId || payment.getValue('correlation_id'), attempt: description });
            throw new Error('BCFA lifecycle: ' + gate.message);
        }
        payment.setValue('state', newState);
        payment.update();
        audit = audit || {};
        var after = { state: newState };
        for (var k in (audit.after || {})) after[k] = audit.after[k];
        this.auditEngine.logEvent({
            correlationId: correlationId || payment.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: paymentSysId,
            eventType: audit.eventType || AuditEngine.eventForState(newState),
            actorType: audit.actorType || 'system',
            reason: audit.reason,
            description: description || ('Payment ' + previous + ' -> ' + newState),
            beforeValue: { state: previous },
            afterValue: after
        });
        new FinanceReviewSummary().refreshPayment(paymentSysId);
        return true;
    },

    // Single entry point for the fully-automated portion of the pipeline
    // (Section 8 items 1-15): intake through allocation, stopping naturally
    // at whichever state the deterministic logic reaches (PENDING_APPROVAL
    // or EXCEPTION). See docs/ARTIFACT_STRATEGY.md's Stage 15 refinement.
    intakeAndAutoProcess: function(fields) {
        var intake = this.intakePayment(fields);
        if (fields.remittance) {
            this.intakeRemittance(intake.paymentSysId, fields.remittance);
        }
        // Phase 25: in flow mode the AR flows take it from here.
        if (!FinanceOrchestration.isInline()) return { paymentSysId: intake.paymentSysId, stoppedAt: 'RECEIVED', handedTo: 'AR Payment Intake Flow' };
        var normalization = this.normalizePayment(intake.paymentSysId);
        if (!normalization.normalized) {
            return { paymentSysId: intake.paymentSysId, stoppedAt: 'NORMALIZATION_EXCEPTION', detail: normalization };
        }
        var customer = this.resolveCustomer(intake.paymentSysId, fields.candidateCustomerName);
        if (!customer.resolved) {
            return { paymentSysId: intake.paymentSysId, stoppedAt: 'CUSTOMER_RESOLUTION_EXCEPTION', detail: customer };
        }
        var match = this.matchPayment(intake.paymentSysId);
        if (!match.matched) {
            return { paymentSysId: intake.paymentSysId, stoppedAt: 'MATCH_EXCEPTION', detail: match };
        }
        var allocation = this.allocatePayment(intake.paymentSysId);
        if (!allocation.balanced) {
            return { paymentSysId: intake.paymentSysId, stoppedAt: 'ALLOCATION_EXCEPTION', detail: allocation };
        }
        return { paymentSysId: intake.paymentSysId, stoppedAt: 'PENDING_APPROVAL', detail: allocation };
    },

    intakePayment: function(fields) {
        var correlationId = fields.correlationId || gs.generateGUID();
        var payment = new GlideRecord('x_695068_bcfa_payment');
        payment.initialize();
        payment.setValue('bank_reference', fields.bankReference);
        if (fields.valueDate) payment.setValue('value_date', fields.valueDate);
        if (fields.customer) payment.setValue('customer', fields.customer);
        payment.setValue('currency', fields.currency || '');
        payment.setValue('amount', fields.amount || 0);
        payment.setValue('bank_account', fields.bankAccount || '');
        payment.setValue('source', fields.source || 'bank_statement');
        payment.setValue('correlation_id', correlationId);
        payment.setValue('idempotency_key', fields.idempotencyKey || ('PAY-' + gs.generateGUID()));
        payment.setValue('state', 'RECEIVED');
        var sysId = payment.insert();

        this.auditEngine.logEvent({
            correlationId: correlationId,
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: sysId,
            eventType: 'record_created',
            actorType: 'system',
            description: 'Payment ' + fields.bankReference + ' created (intake, source ' + (fields.source || 'bank_statement') + ')',
            afterValue: { state: 'RECEIVED', bank_reference: fields.bankReference, amount: fields.amount || 0, currency: fields.currency || '',
                customer: fields.customer || '' }
        });
        return { paymentSysId: sysId, correlationId: correlationId };
    },

    // fields.extractedFields: fields already read from a remittance document
    // (Finance Document Intake), stored as is with fields.confidence.
    // fields.seedFields: the seeded JSON-context path, read by the
    // deterministic simulation (no external AI since Phase 34).
    intakeRemittance: function(paymentSysId, fields) {
        var remittance = new GlideRecord('x_695068_bcfa_remittance');
        remittance.initialize();
        remittance.setValue('payment', paymentSysId);
        remittance.setValue('remittance_reference', fields.remittanceReference || '');
        remittance.setValue('source', fields.source || 'email');
        if (fields.receivedDate) remittance.setValue('received_date', fields.receivedDate);
        if (fields.extractedFields) {
            remittance.setValue('extracted_fields', JSON.stringify(fields.extractedFields));
            if (fields.confidence !== undefined) remittance.setValue('confidence', fields.confidence);
            // Phase 40: the advice's key facts as columns (the JSON stays the
            // full record). The advice's deduction statement is evidence only:
            // the residual is always computed by the allocation.
            var x = fields.extractedFields;
            var num = function(v) { var n = parseFloat(v); return isNaN(n) ? '' : n; };
            remittance.setValue('payer_name', String(x.customer_name || '').substring(0, 160));
            remittance.setValue('bank_reference', String(x.bank_reference || x.payment_reference || '').substring(0, 80));
            remittance.setValue('payment_amount', num(x.payment_amount));
            remittance.setValue('currency', String(x.currency || '').substring(0, 3));
            remittance.setValue('advice_deduction_amount', num(x.deduction_amount));
            remittance.setValue('advice_deduction_reason', String(x.deduction_reason || '').substring(0, 255));
            remittance.setValue('invoice_count', (x.invoice_lines || x.invoice_references || []).length);
            if (fields.extractionProvider) remittance.setValue('extraction_provider', fields.extractionProvider);
        }
        var sysId = remittance.insert();
        var parentPayment = new GlideRecord('x_695068_bcfa_payment');
        this.auditEngine.logEvent({
            correlationId: parentPayment.get(paymentSysId) ? parentPayment.getValue('correlation_id') : '',
            sourceTable: 'x_695068_bcfa_remittance',
            sourceRecord: sysId,
            eventType: 'record_created',
            actorType: 'system',
            description: 'Remittance ' + (fields.remittanceReference || '') + ' created for payment (source ' + (fields.source || 'email') + ')',
            afterValue: { payment: paymentSysId, remittance_reference: fields.remittanceReference || '', confidence: fields.confidence }
        });
        if (!fields.extractedFields && fields.seedFields) {
            this.aiSimulation.simulateArExtraction(sysId, fields.seedFields, fields.options);
        }
        return { remittanceSysId: sysId };
    },

    normalizePayment: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { error: 'Payment not found' };
        if (!payment.getValue('bank_reference') || !payment.getValue('amount') || !payment.getValue('currency')) {
            var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'other', 'Missing mandatory payment fields during normalization.');
            this._setState(paymentSysId, 'EXCEPTION', null, 'Normalization failed');
            return { normalized: false, exceptionSysId: exceptionSysId };
        }
        this._setState(paymentSysId, 'NORMALIZED', null, 'Normalized');
        return { normalized: true };
    },

    resolveCustomer: function(paymentSysId, candidateName) {
        this._setState(paymentSysId, 'CUSTOMER_RESOLUTION', null, 'Resolving customer');
        var payment = new GlideRecord('x_695068_bcfa_payment');
        payment.get(paymentSysId);

        if (payment.getValue('customer')) {
            return { resolved: true, customerSysId: payment.getValue('customer') };
        }

        var id = this._identifyCustomer(payment, candidateName);
        if (id.customerSysId) return this._setPaymentCustomer(payment, id.customerSysId, id.how);
        var resolution = id.resolution, remittance = id.remittance, why = id.why;
        var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'customer_ambiguous', 'Could not resolve customer from remitter name "' + candidateName + '".', {
            ruleResult: 'FAIL customer resolution: ' + why + (remittance.available ? '; remittance references ' +
                (remittance.unresolved.length ? 'not all resolved (' + remittance.unresolved.join(', ') + ')' : 'span ' + remittance.customerCount + ' customers') : '; no remittance references') + '.',
            evidence: 'Remitter name: ' + (candidateName || 'none') + '\nAlias result: ' + (resolution.resolved ? resolution.customerSysId + ' at ' + resolution.confidence : 'none') +
                '\nPayment: ' + payment.getValue('amount') + ' ' + payment.getValue('currency') + ', bank reference ' + payment.getValue('bank_reference')
        });
        this._explainArException(exceptionSysId, this._findCandidateCustomers(candidateName));
        this._setState(paymentSysId, 'EXCEPTION', null, 'Customer resolution failed');
        return { resolved: false, exceptionSysId: exceptionSysId };
    },

    // The customer identification rules, without a state change:
    // 1. Remitter name through alias / exact name, accepted only at or
    //    above the configured auto-match confidence (POC ASSUMPTION).
    // 2. Otherwise the customer that owns every invoice referenced on
    //    the remittance, if exactly one customer does and it does not
    //    contradict the name match.
    // Anything else goes to a human; the customer is never guessed.
    // Returns { customerSysId, how } or { customerSysId: null, why, resolution, remittance }.
    _identifyCustomer: function(payment, candidateName) {
        var threshold = this.policy.arAutoMatchConfidence();
        var resolution = this.matchingEngine.resolveCustomerByAlias(candidateName);
        if (resolution.resolved && resolution.confidence >= threshold) {
            return { customerSysId: resolution.customerSysId, how: 'remitter name "' + candidateName + '" (confidence ' + resolution.confidence + ')' };
        }
        var remittance = this.matchingEngine.resolveRemittanceReferences(payment.getUniqueValue());
        if (remittance.available && remittance.unresolved.length === 0 && remittance.customerCount === 1 &&
            (!resolution.resolved || resolution.customerSysId === remittance.customerSysId)) {
            return { customerSysId: remittance.customerSysId, how: 'owner of every invoice referenced on the remittance (' +
                remittance.items.map(function(i) { return i.itemNumber; }).join(', ') + ')' };
        }
        var why = resolution.resolved
            ? 'alias match confidence ' + resolution.confidence + ' is below the auto-match threshold ' + threshold
            : resolution.ambiguous
                ? 'remitter name "' + (candidateName || '') + '" matches ' + resolution.candidates.length + ' different customers'
                : 'remitter name "' + (candidateName || '') + '" did not resolve to a customer';
        return { customerSysId: null, why: why, resolution: resolution, remittance: remittance };
    },

    // The open exception a newly arrived remittance can resolve: the payment
    // could not be matched, or its customer identified, without one.
    findRetryableException: function(paymentSysId) {
        var ex = new GlideRecord('x_695068_bcfa_ar_exception');
        ex.addQuery('payment', paymentSysId);
        ex.addQuery('status', 'IN', 'open,in_review');
        ex.addQuery('reason_code', 'IN', 'unmatched,customer_ambiguous,ambiguous_match');
        ex.orderByDesc('sys_created_on');
        ex.setLimit(1);
        ex.query();
        return ex.next() ? { sysId: ex.getUniqueValue(), number: ex.getValue('number') } : null;
    },

    // Phase 33: a remittance arrived for a payment already in EXCEPTION. In
    // flow mode every bank line that arrives before its remittance goes to
    // customer_ambiguous at intake, so this is the normal cash path. The
    // customer is identified with the remittance by the resolveCustomer
    // rules, without a state change (EXCEPTION -> CUSTOMER_RESOLUTION is not
    // a lifecycle path); then the exception is resolved and matching retried
    // (EXCEPTION -> MATCHING). If the customer still cannot be identified,
    // nothing changes and the exception stays with the person.
    retryWithRemittance: function(paymentSysId, remittanceSysId, actor) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId) || payment.getValue('state') !== 'EXCEPTION') return { retried: false, reason: 'payment is not in EXCEPTION' };
        var ex = this.findRetryableException(paymentSysId);
        if (!ex) return { retried: false, reason: 'no open unmatched, customer_ambiguous or ambiguous_match exception to retry' };
        var reference = remittanceSysId, candidateName = '';
        var rem = new GlideRecord('x_695068_bcfa_remittance');
        if (rem.get(remittanceSysId)) {
            reference = rem.getValue('remittance_reference') || remittanceSysId;
            try { candidateName = JSON.parse(rem.getValue('extracted_fields') || '{}').customer_name || ''; } catch (e) { candidateName = ''; }
        }
        if (!payment.getValue('customer')) {
            var id = this._identifyCustomer(payment, candidateName);
            if (!id.customerSysId) return { retried: false, reason: 'customer still not identified (' + id.why + ')', exceptionNumber: ex.number };
            this._setPaymentCustomer(payment, id.customerSysId, id.how);
        }
        var result = this.resolveExceptionAndRetry(paymentSysId, ex.sysId,
            'Remittance ' + reference + ' received; matching retried.', actor || '');
        result.retried = true;
        result.exceptionNumber = ex.number;
        return result;
    },

    _setPaymentCustomer: function(payment, customerSysId, how) {
        payment.setValue('customer', customerSysId);
        payment.update();
        this.auditEngine.logEvent({
            correlationId: payment.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: payment.getUniqueValue(),
            eventType: 'rule_evaluated',
            actorType: 'system',
            reason: 'Customer identified from ' + how,
            description: 'Customer identified from ' + how + '.',
            afterValue: { customer: customerSysId }
        });
        return { resolved: true, customerSysId: customerSysId, method: how };
    },

    // Deterministic, coarse pre-filter for the customer_ambiguous
    // explanation — the AI only ever sees this short candidate list, never
    // the full customer table. Matches on the first token of the attempted
    // remitter name (e.g. "ACME" out of "ACME Trdg Co") since that's the
    // most stable fragment across abbreviations/misspellings.
    _findCandidateCustomers: function(candidateName) {
        if (!candidateName) return [];
        var firstToken = candidateName.split(/\s+/)[0];
        if (!firstToken) return [];
        var gr = new GlideRecord('x_695068_bcfa_customer');
        gr.addQuery('name', 'STARTSWITH', firstToken);
        gr.setLimit(5);
        gr.query();
        var candidates = [];
        while (gr.next()) {
            candidates.push({ customer_code: gr.getValue('customer_code'), name: gr.getValue('name') });
        }
        return candidates;
    },

    matchPayment: function(paymentSysId) {
        this._setState(paymentSysId, 'MATCHING', null, 'Running remittance, exact and multi-invoice matching');
        this.refreshOpenItems(paymentSysId);

        // Phase 13: the invoices the customer named on the remittance come
        // first. Allocation and the balance check still decide the outcome.
        var remittance = this.matchingEngine.resolveRemittanceReferences(paymentSysId);
        if (remittance.available && remittance.currencyMismatch.length) {
            var currencyExceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'currency_mismatch',
                'Remittance references invoices in another currency: ' + remittance.currencyMismatch.join(', ') + '.', {
                    ruleResult: 'FAIL currency check: payment is ' + this._paymentCurrency(paymentSysId) + ' but ' + remittance.currencyMismatch.join(', ') + '. Cash is never allocated across currencies.',
                    evidence: this._remittanceEvidence(remittance)
                });
            this._explainArException(currencyExceptionSysId);
            this._setState(paymentSysId, 'EXCEPTION', null, 'Currency mismatch between payment and remittance invoices', { eventType: 'match', reason: 'Remittance invoices in another currency: ' + remittance.currencyMismatch.join(', ') });
            return { matched: false, reasonCode: 'currency_mismatch', exceptionSysId: currencyExceptionSysId };
        }
        if (remittance.available && remittance.usable) {
            this.matchingEngine.recordRemittanceCandidates(paymentSysId, remittance);
            this._setState(paymentSysId, 'MATCHED', null, 'Matched to the ' + remittance.items.length + ' invoice(s) referenced on the remittance', { reason: 'Remittance references', after: { mode: 'remittance', items: remittance.items.map(function(i) { return i.itemNumber; }) } });
            return { matched: true, mode: 'remittance', remittance: remittance };
        }

        var exact = this.matchingEngine.exactMatch(paymentSysId);
        if (exact.matched) {
            this._setState(paymentSysId, 'MATCHED', null, 'Exact match found', { reason: 'Single open item equal to the payment amount', after: { mode: 'exact' } });
            return { matched: true, mode: 'exact' };
        }

        // Phase 14: exact combinations. One combination is a match; more
        // than one (or several single items of the exact amount) is
        // ambiguous and goes to a human, with the options for the AI review
        // to rank. The engine never picks between equally exact options.
        var combinations = this.matchingEngine.findExactCombinations(paymentSysId, 3);
        var payment = new GlideRecord('x_695068_bcfa_payment');
        payment.get(paymentSysId);
        if (exact.candidateCount > 1 || combinations.solutions.length > 1) {
            var options = [];
            if (exact.candidateCount > 1) options.push(exact.candidateCount + ' single open items each equal to the payment amount');
            for (var o = 0; o < combinations.solutions.length; o++) {
                options.push('Option ' + (o + 1) + ': ' + combinations.solutions[o].map(function(i) { return i.itemNumber + ' ' + i.openAmount; }).join(' + '));
            }
            this.matchingEngine.recordCombinationCandidates(paymentSysId, payment.getValue('customer'), combinations.solutions, false);
            var ambiguousSysId = this.exceptionEngine.createArException(paymentSysId, 'ambiguous_match',
                'More than one set of open items matches the payment amount exactly.', {
                    subtype: 'multiple_exact_options',
                    ruleResult: 'FAIL matching: the payment amount ' + payment.getValue('amount') + ' is matched exactly by more than one set of open items; the engine does not choose between them.',
                    evidence: options.join('\n') + (combinations.solutions.length >= 3 ? '\n(search stopped after 3 options)' : '') +
                        (remittance.available ? '\n' + this._remittanceEvidence(remittance) : '\nNo remittance references.')
                });
            this._explainArException(ambiguousSysId);
            this._setState(paymentSysId, 'EXCEPTION', null, 'Ambiguous match: several exact options', { eventType: 'match', reason: 'More than one exact option; the engine does not choose', after: { mode: 'ambiguous', options: options } });
            return { matched: false, reasonCode: 'ambiguous_match', exceptionSysId: ambiguousSysId };
        }
        if (combinations.solutions.length === 1) {
            this.matchingEngine.recordCombinationCandidates(paymentSysId, payment.getValue('customer'), combinations.solutions, true);
            this._setState(paymentSysId, 'MATCHED', null, 'Unique exact combination of ' + combinations.solutions[0].length + ' open items', { reason: 'Unique exact combination', after: { mode: 'combination', items: combinations.solutions[0].map(function(i) { return i.itemNumber; }) } });
            return { matched: true, mode: 'combination', items: combinations.solutions[0] };
        }

        var multi = this.matchingEngine.multiInvoiceSuggestion(paymentSysId);
        // Simulated suggestions only; with the native provider the Cash
        // Application Review workflow advises on any exception instead.
        if (this.policy.aiProvider() === 'simulated') this.aiSimulation.suggestTopCandidate(paymentSysId);
        if (!multi.matched) {
            var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'unmatched', 'No open item combination matched this payment.', {
                ruleResult: 'FAIL matching: no open item of the customer equals the payment and no combination was found' +
                    (remittance.available && remittance.unresolved.length ? '; remittance references not found as open items: ' + remittance.unresolved.join(', ') : '') + '.',
                evidence: remittance.available ? this._remittanceEvidence(remittance) : 'No remittance references.'
            });
            this._explainArException(exceptionSysId);
            this._setState(paymentSysId, 'UNMATCHED', null, 'No match found');
            this._setState(paymentSysId, 'EXCEPTION', null, 'Unmatched payment routed to exception');
            return { matched: false, exceptionSysId: exceptionSysId };
        }

        if (multi.exact) {
            this._setState(paymentSysId, 'MATCHED', null, 'Multi-invoice exact allocation candidate found');
            return { matched: true, mode: 'multi_exact', arOpenItemSysIds: multi.arOpenItemSysIds };
        }

        this._setState(paymentSysId, 'PARTIALLY_MATCHED', null, 'Partial multi-invoice candidate found, residual ' + multi.residual);
        return { matched: true, mode: 'partial', residual: multi.residual, arOpenItemSysIds: multi.arOpenItemSysIds };
    },

    // The allocation engine's own result, recorded on the payment for the
    // Review Summary and the Playbook (they display it; they never recompute
    // it). residual = payment - (allocated - approved deductions); negative
    // is a short payment, positive an overpayment.
    _recordAllocationResult: function(paymentSysId, allocatedTotal, deductionTotal, residual) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return;
        payment.setValue('allocated_amount', allocatedTotal);
        payment.setValue('deduction_amount', deductionTotal);
        payment.setValue('residual_amount', residual);
        payment.setWorkflow(false);
        payment.update();
    },

    // Phase 40 (AR-REC-004): the customer's open items are read from SAP
    // through IntegrationService (adapter by configuration) before matching,
    // and the local open-item table, the cache the matching engine works on,
    // is updated from the answer. MOCK SAP answers from that same table, so in
    // the POC the read changes nothing. A failed read does not stop matching:
    // the cached items are used, and the failure is on the integration
    // transaction, the audit trail and the payment journey.
    refreshOpenItems: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId) || !payment.getValue('customer')) return { refreshed: false, reason: 'no customer resolved' };
        var customer = payment.getValue('customer');
        var r = this.integrationService.execute({
            operation: 'getOpenItems',
            adapter: this.policy.sapAdapter(),
            correlationId: payment.getValue('correlation_id'),
            idempotencyKey: 'AR-OPENITEMS-' + paymentSysId + '-' + gs.generateGUID(),
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: paymentSysId,
            payload: { customerSysId: customer }
        });
        if (r.status !== 'success' || !r.response || !r.response.items) {
            return { refreshed: false, status: r.status, transactionSysId: r.transactionSysId };
        }
        var changed = 0, added = 0, items = r.response.items;
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var gr = new GlideRecord('x_695068_bcfa_ar_open_item');
            var found = !!(it.sysId && gr.get(it.sysId) && gr.getValue('customer') === customer);
            if (!found && it.itemNumber) {
                gr = new GlideRecord('x_695068_bcfa_ar_open_item');
                gr.addQuery('item_number', it.itemNumber);
                gr.addQuery('customer', customer);
                gr.query();
                found = gr.next();
            }
            if (!found && !it.itemNumber) continue;
            var values = { currency: it.currency, invoice_amount: it.invoiceAmount, open_amount: it.openAmount, due_date: it.dueDate, status: it.status };
            var diff = false;
            if (!found) {
                gr = new GlideRecord('x_695068_bcfa_ar_open_item');
                gr.initialize();
                gr.setValue('item_number', it.itemNumber);
                gr.setValue('customer', customer);
            }
            for (var k in values) {
                if (values[k] === undefined || values[k] === null || values[k] === '') continue;
                var current = gr.getValue(k);
                var same = typeof values[k] === 'number' ? Math.abs(parseFloat(current || '0') - values[k]) < 0.005 : String(current) === String(values[k]);
                if (!found || !same) { gr.setValue(k, values[k]); diff = true; }
            }
            if (!found) { gr.insert(); added++; } else if (diff) { gr.update(); changed++; }
        }
        return { refreshed: true, items: items.length, changed: changed, added: added, transactionSysId: r.transactionSysId };
    },

    _paymentCurrency: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        return payment.get(paymentSysId) ? payment.getValue('currency') : '';
    },

    _remittanceEvidence: function(remittance) {
        var lines = [];
        for (var i = 0; i < remittance.references.length; i++) {
            var ref = remittance.references[i];
            var item = null;
            for (var j = 0; j < remittance.items.length; j++) {
                if (remittance.items[j].itemNumber === ref.reference) item = remittance.items[j];
            }
            lines.push('Remittance line ' + ref.reference + (ref.applied !== null ? ' applied ' + ref.applied : '') +
                (item ? '; open item open amount ' + item.openAmount : '; NOT FOUND as an open item'));
        }
        lines.push('Payment ' + remittance.paymentAmount + ', referenced open items total ' + remittance.openTotal + ', difference ' + remittance.residual);
        if (remittance.deductionHint) lines.push('Remittance deduction note: ' + remittance.deductionHint.reason + (remittance.deductionHint.amount ? ' (' + remittance.deductionHint.amount + ')' : ''));
        return lines.join('\n');
    },

    // Advisory explanation for a newly raised AR exception. native
    // (default): the BCFA Cash Application Review workflow starts on the
    // exception's creation and records the note asynchronously. simulated:
    // templates. candidateCustomers is kept for the call sites (it was
    // context for the Claude path, removed in Phase 34).
    _explainArException: function(exceptionSysId, candidateCustomers) {
        var provider = this.policy.aiProvider();
        if (provider === 'native') {
            this.auditEngine.logEvent({
                sourceTable: 'x_695068_bcfa_ar_exception',
                sourceRecord: exceptionSysId,
                eventType: 'ai_invocation',
                actorType: 'system',
                aiAgent: 'BCFA Cash Application Review (agentic workflow)',
                description: 'AI review handed to the BCFA Cash Application Review agentic workflow (Now Assist), which starts on exception creation and records an advisory note.'
            });
            new AiInteractionLog().start({ sourceTable: 'x_695068_bcfa_ar_exception', sourceRecord: exceptionSysId, provider: 'now_assist',
                operation: 'exception_review', capability: 'exception_review', workflow: 'BCFA Cash Application Review' });
            return { deferred: true, workflow: 'BCFA Cash Application Review' };
        }
        return this.aiSimulation.recommendArExceptionResolution(exceptionSysId);
    },

    // Builds Payment Allocation rows from the selected Match Candidates and
    // checks Section 8's balance rule: SUM(allocations + approved
    // adjustments) must equal the payment amount. A clean balance proceeds
    // straight to approval; anything else (short-pay/over-pay) is routed to
    // a human via AR Exception rather than silently forced to balance.
    allocatePayment: function(paymentSysId) {
        this._setState(paymentSysId, 'ALLOCATION', null, 'Building payment allocation');

        var payment = new GlideRecord('x_695068_bcfa_payment');
        payment.get(paymentSysId);
        var paymentAmount = parseFloat(payment.getValue('amount') || '0');

        // A re-allocation (after Resolve & Retry) replaces any earlier
        // proposal: earlier proposed allocations are reversed, not reused.
        var previous = new GlideRecord('x_695068_bcfa_payment_allocation');
        previous.addQuery('payment', paymentSysId);
        previous.addQuery('allocation_state', 'proposed');
        previous.query();
        while (previous.next()) {
            previous.setValue('allocation_state', 'reversed');
            previous.update();
        }

        // Candidate precedence: remittance references (Phase 13), then the
        // single exact amount match, then the greedy multi-invoice set.
        var candidateType = 'remittance';
        var selectedItems = [];
        var remittanceCandidate = new GlideRecord('x_695068_bcfa_match_candidate');
        remittanceCandidate.addQuery('payment', paymentSysId);
        remittanceCandidate.addQuery('match_type', 'remittance');
        remittanceCandidate.orderBy('rank');
        remittanceCandidate.query();
        while (remittanceCandidate.next()) selectedItems.push(remittanceCandidate.getValue('ar_open_item'));

        if (selectedItems.length === 0) {
            candidateType = 'exact';
            var candidate = new GlideRecord('x_695068_bcfa_match_candidate');
            candidate.addQuery('payment', paymentSysId);
            candidate.addQuery('match_type', 'exact');
            candidate.query();
            while (candidate.next()) selectedItems.push(candidate.getValue('ar_open_item'));
        }

        if (selectedItems.length === 0) {
            candidateType = 'combination';
            var combination = new GlideRecord('x_695068_bcfa_match_candidate');
            combination.addQuery('payment', paymentSysId);
            combination.addQuery('match_type', 'combination');
            combination.addQuery('selected', true);
            combination.query();
            while (combination.next()) selectedItems.push(combination.getValue('ar_open_item'));
        }

        if (selectedItems.length === 0) {
            candidateType = 'fuzzy';
            var fuzzy = new GlideRecord('x_695068_bcfa_match_candidate');
            fuzzy.addQuery('payment', paymentSysId);
            fuzzy.addQuery('match_type', 'fuzzy');
            fuzzy.orderBy('rank');
            fuzzy.query();
            selectedItems = [];
            while (fuzzy.next()) selectedItems.push(fuzzy.getValue('ar_open_item'));
        }

        // The same open item is never allocated twice (candidates can repeat
        // across match runs).
        var unique = [];
        for (var u = 0; u < selectedItems.length; u++) {
            if (unique.indexOf(selectedItems[u]) < 0) unique.push(selectedItems[u]);
        }
        selectedItems = unique;

        if (selectedItems.length === 0) {
            var noItemExceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'unmatched', 'No selected open items available to allocate.');
            this._setState(paymentSysId, 'EXCEPTION', null, 'Allocation failed: nothing to allocate', { eventType: 'allocation', reason: 'No selected open items available to allocate' });
            return { balanced: false, exceptionSysId: noItemExceptionSysId };
        }

        // Allocate each selected item's FULL open amount, always — never cap
        // to what's left of the payment. Capping to "remaining" would make a
        // fuzzy/partial match always allocate exactly the payment amount by
        // construction, silently absorbing any shortfall instead of letting
        // the balance check below detect and route it as a short-pay
        // exception (this is exactly what the AR-006/007/008 short-pay/
        // bank-charge/credit-note demo scenarios rely on to reach a real
        // exception rather than a silently-clean approval).
        var allocatedTotal = 0;
        var allocationSysIds = [];
        var allocationEvidence = [];
        for (var i = 0; i < selectedItems.length; i++) {
            var item = new GlideRecord('x_695068_bcfa_ar_open_item');
            item.get(selectedItems[i]);
            var openAmount = parseFloat(item.getValue('open_amount') || '0');
            var allocatedAmount = openAmount;
            allocationEvidence.push('Allocated ' + allocatedAmount + ' to ' + item.getValue('item_number') + ' (open ' + openAmount + ' ' + item.getValue('currency') + ', ' + candidateType + ' match)');

            var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
            allocation.initialize();
            allocation.setValue('payment', paymentSysId);
            allocation.setValue('ar_open_item', selectedItems[i]);
            allocation.setValue('allocated_amount', allocatedAmount);
            allocation.setValue('discount', 0);
            allocation.setValue('bank_charge', 0);
            allocation.setValue('tcs', 0);
            allocation.setValue('residual_amount', Math.round((openAmount - allocatedAmount) * 100) / 100);
            allocation.setValue('allocation_state', 'proposed');
            allocationSysIds.push(allocation.insert());

            allocatedTotal += allocatedAmount;
        }
        allocatedTotal = Math.round(allocatedTotal * 100) / 100;

        var difference = Math.round((paymentAmount - allocatedTotal) * 100) / 100;
        this._recordAllocationResult(paymentSysId, allocatedTotal, 0, difference);
        if (Math.abs(difference) <= this.BALANCE_TOLERANCE) {
            this._setState(paymentSysId, 'PENDING_APPROVAL', null, 'Allocation balances (' + allocationEvidence.length + ' item(s), total ' + allocatedTotal + ' = payment ' + paymentAmount + '); ready for approval', { eventType: 'allocation', reason: 'Allocation balances within tolerance ' + this.BALANCE_TOLERANCE,
                after: { candidate_type: candidateType, allocated_total: allocatedTotal, payment_amount: paymentAmount, allocations: allocationEvidence } });
            if (selectedItems.length > 1) this._adviseOnAllocation(paymentSysId);
            return { balanced: true, allocationSysIds: allocationSysIds, allocatedTotal: allocatedTotal, candidateType: candidateType };
        }

        // difference = paymentAmount - allocatedTotal. Positive means the
        // payment was MORE than what got allocated to open items (an
        // overpayment); negative means MORE was allocated than the customer
        // actually paid (a genuine short payment). An earlier version of
        // this had the two labels swapped.
        var reasonCode = difference > 0 ? 'over_pay' : 'short_pay';
        var remittance = this.matchingEngine.resolveRemittanceReferences(paymentSysId);
        // Phase 14: deterministic suggestion for a short pay (credit note of
        // exactly the residual, else bank charge within the limit). Pre-set
        // on the exception for the reviewer to confirm or change.
        var suggestion = reasonCode === 'short_pay' ? this.matchingEngine.classifyResidual(paymentSysId, Math.abs(difference)) : { type: null };
        var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, reasonCode,
            'Allocation total ' + allocatedTotal + ' does not match payment amount ' + paymentAmount + ' (difference ' + difference + ').', {
                ruleResult: 'FAIL allocation balance: payment ' + paymentAmount + ' vs allocated ' + allocatedTotal + ' across ' + selectedItems.length +
                    ' open item(s); residual ' + Math.abs(difference) + (difference < 0 ? ' short' : ' over') + ' (tolerance ' + this.BALANCE_TOLERANCE + ').' +
                    (suggestion.rule ? ' Rule suggestion: ' + (suggestion.type ? suggestion.type.toUpperCase() + ' - ' : 'none - ') + suggestion.rule + '; a reviewer confirms.' : ''),
                evidence: allocationEvidence.join('\n') + (remittance.available ? '\n' + this._remittanceEvidence(remittance) : ''),
                residual: Math.abs(difference),
                subtype: suggestion.type ? 'suggested_' + suggestion.type : '',
                suggestedDeductionType: suggestion.type,
                creditNote: suggestion.creditNoteSysId
            });
        this._explainArException(exceptionSysId);
        this._setState(paymentSysId, 'EXCEPTION', null, 'Allocation does not balance: ' + reasonCode, { eventType: 'allocation', reason: reasonCode + ': payment ' + paymentAmount + ' vs allocated ' + allocatedTotal + ' (difference ' + difference + ')',
            after: { candidate_type: candidateType, allocated_total: allocatedTotal, payment_amount: paymentAmount, difference: difference, suggested_deduction: suggestion.type, allocations: allocationEvidence } });
        return { balanced: false, reasonCode: reasonCode, exceptionSysId: exceptionSysId, allocationSysIds: allocationSysIds, difference: difference };
    },

    // Multi-invoice allocations get an advisory Now Assist explanation on
    // the payment (ai_recommendation) for the reviewer who confirms it.
    // The deterministic balance check has already passed; this never
    // changes the allocation, and a failed AI call never blocks the payment.
    _adviseOnAllocation: function(paymentSysId) {
        if (this.policy.aiProvider() !== 'native') return null;
        try {
            var result = new FinanceAgentTools().explainArMatch(paymentSysId);
            if (!result.ok) return null;
            var note = 'AI MATCH EXPLANATION (advisory only - the reviewer confirms the allocation)\n\n' + result.text;
            var payment = new GlideRecord('x_695068_bcfa_payment');
            if (!payment.get(paymentSysId)) return null;
            payment.setValue('ai_recommendation', note.substring(0, 4000));
            payment.update();
            this.auditEngine.logEvent({
                correlationId: payment.getValue('correlation_id'),
                sourceTable: 'x_695068_bcfa_payment',
                sourceRecord: paymentSysId,
                eventType: 'ai_recommendation',
                actor: gs.getUserID(),
                actorType: 'now_assist_ai',
                aiAgent: 'Now Assist skill: explain AR match',
                description: 'Now Assist explanation of the multi-invoice allocation recorded on the payment (advisory field only)'
            });
            return { ok: true };
        } catch (e) {
            return null;
        }
    },

    // Applies the configured approval rule to a PENDING_APPROVAL payment:
    // requests approval (requester = requestedBy) or, within the
    // auto-approve limit, records a rule-based approval. Clearing only ever
    // happens through the approval cascade and IntegrationService.
    // options (optional): { overrideReason } recorded on the approval (e.g.
    // the approved deduction).
    routeForApproval: function(paymentSysId, requestedBy, options) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { error: 'Payment not found' };
        var rule = this.policy.arApprovalRule(payment.getValue('amount'));
        this.auditEngine.logEvent({
            correlationId: payment.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: paymentSysId,
            eventType: 'rule_evaluated',
            actorType: 'system',
            reason: rule.rule,
            description: 'Approval rule evaluated (POC ASSUMPTION): ' + (rule.required ? 'approval required' : 'no approval required'),
            afterValue: rule
        });
        var approval = this.requestApproval(paymentSysId, requestedBy, {
            type: rule.required ? 'standard' : 'rule', overrideReason: options && options.overrideReason });
        if (rule.required) return { approvalRequired: true, approvalSysId: approval.approvalSysId, rule: rule.rule };
        var decision = this.decideApproval(paymentSysId, approval.approvalSysId, 'approved', null, 'Approved by configured rule: ' + rule.rule);
        return { approvalRequired: false, approvalSysId: approval.approvalSysId, rule: rule.rule, decision: decision };
    },

    // After SAP (mock) confirms clearing, reduce each allocated open item
    // in the mock SAP open-item table so a cleared invoice can never be
    // applied again. An allocation covers the item's full open amount
    // (cash plus any approved deduction), so the item is settled by it.
    _settleOpenItems: function(paymentSysId) {
        var settled = [];
        var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
        allocation.addQuery('payment', paymentSysId);
        allocation.addQuery('allocation_state', '!=', 'reversed');
        allocation.query();
        while (allocation.next()) {
            var item = new GlideRecord('x_695068_bcfa_ar_open_item');
            if (!item.get(allocation.getValue('ar_open_item'))) continue;
            var before = parseFloat(item.getValue('open_amount') || '0');
            var after = Math.max(0, Math.round((before - parseFloat(allocation.getValue('allocated_amount') || '0')) * 100) / 100);
            item.setValue('open_amount', after);
            item.setValue('status', after <= this.BALANCE_TOLERANCE ? 'cleared' : 'partially_cleared');
            item.update();
            settled.push(item.getValue('item_number') + ' ' + before + ' -> ' + after);

            // Credit notes netted against this allocation are used up by it.
            var netting = new GlideRecord('x_695068_bcfa_deduction');
            netting.addQuery('payment_allocation', allocation.getUniqueValue());
            netting.addQuery('deduction_type', 'credit_note_netting');
            netting.addQuery('status', 'approved');
            netting.addNotNullQuery('credit_note');
            netting.query();
            while (netting.next()) {
                var note = new GlideRecord('x_695068_bcfa_credit_note');
                if (!note.get(netting.getValue('credit_note'))) continue;
                var noteBefore = parseFloat(note.getValue('open_amount') || '0');
                var noteAfter = Math.max(0, Math.round((noteBefore - parseFloat(netting.getValue('amount') || '0')) * 100) / 100);
                note.setValue('open_amount', noteAfter);
                if (noteAfter <= this.BALANCE_TOLERANCE) note.setValue('status', 'applied');
                note.update();
                settled.push('credit note ' + note.getValue('credit_note_number') + ' ' + noteBefore + ' -> ' + noteAfter);
            }
        }
        if (settled.length) {
            this.auditEngine.logEvent({
                sourceTable: 'x_695068_bcfa_payment',
                sourceRecord: paymentSysId,
                eventType: 'closure',
                actorType: 'system',
                description: 'Open items settled after clearing: ' + settled.join('; '),
                afterValue: { settled: settled }
            });
        }
        return settled;
    },

    // Re-checks the balance rule AFTER a reviewer has recorded approved
    // Deduction row(s) against an EXCEPTION payment's allocations — the net
    // rule is allocatedTotal - approvedDeductions ≈ paymentAmount (the
    // deduction is what accounts for the gap between what was allocated and
    // what the customer actually paid: a bank charge, credit-note netting,
    // etc.). If it now balances, proceeds to PENDING_APPROVAL exactly like a
    // clean allocatePayment() success; otherwise leaves the payment in
    // EXCEPTION for further review.
    advanceAfterDeduction: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { balanced: false, error: 'Payment not found' };
        var paymentAmount = parseFloat(payment.getValue('amount') || '0');

        var allocatedTotal = 0;
        var allocationSysIds = [];
        var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
        allocation.addQuery('payment', paymentSysId);
        allocation.addQuery('allocation_state', '!=', 'reversed');
        allocation.query();
        while (allocation.next()) {
            allocatedTotal += parseFloat(allocation.getValue('allocated_amount') || '0');
            allocationSysIds.push(allocation.getUniqueValue());
        }

        var deductionTotal = 0;
        for (var i = 0; i < allocationSysIds.length; i++) {
            var deduction = new GlideRecord('x_695068_bcfa_deduction');
            deduction.addQuery('payment_allocation', allocationSysIds[i]);
            deduction.addQuery('status', 'approved');
            deduction.query();
            while (deduction.next()) {
                deductionTotal += parseFloat(deduction.getValue('amount') || '0');
            }
        }

        var netAllocated = Math.round((allocatedTotal - deductionTotal) * 100) / 100;
        var difference = Math.round((paymentAmount - netAllocated) * 100) / 100;
        this._recordAllocationResult(paymentSysId, allocatedTotal, deductionTotal, difference);
        if (Math.abs(difference) <= this.BALANCE_TOLERANCE) {
            this._setState(paymentSysId, 'PENDING_APPROVAL', null, 'Allocation balances after approved deductions; ready for approval', { eventType: 'deduction', reason: 'Approved deductions ' + deductionTotal + ' bring the allocation to the payment amount',
                after: { allocated_total: allocatedTotal, approved_deductions: deductionTotal, net_allocated: netAllocated, payment_amount: paymentAmount } });
            return { balanced: true, netAllocated: netAllocated };
        }
        return { balanced: false, netAllocated: netAllocated, difference: difference };
    },

    // Business override for a payment that will never balance under the
    // deterministic rule (e.g. a confirmed intentional short-pay pending a
    // future credit memo) — moves it forward on a human decision rather than
    // silently forcing the numbers to match.
    forceProceedDespiteImbalance: function(paymentSysId, reason) {
        this._setState(paymentSysId, 'PENDING_APPROVAL', null, reason || 'Manually approved to proceed despite allocation imbalance.', { eventType: 'override', actorType: 'user', reason: reason || 'No reason given' });
        return { balanced: false, forced: true };
    },

    // Reviewer correction (e.g. the customer sent the missing remittance):
    // resolve the exception, re-match, re-allocate and, when it balances,
    // apply the approval rule, the same path as a fresh payment.
    resolveExceptionAndRetry: function(paymentSysId, exceptionSysId, resolutionNotes, resolvedBy) {
        this.exceptionEngine.resolveArException(exceptionSysId, resolutionNotes, resolvedBy);
        this._setState(paymentSysId, 'MATCHING', null, 'Re-matching after correction');
        // Phase 25: in flow mode the AR Exception Flow re-matches and re-allocates.
        if (!FinanceOrchestration.isInline()) return { resolved: true, handedTo: 'AR Exception Flow' };
        var match = this.matchPayment(paymentSysId);
        if (!match.matched) return match;
        var allocation = this.allocatePayment(paymentSysId);
        match.allocation = allocation;
        if (!allocation.balanced) return match;
        match.approval = this.routeForApproval(paymentSysId, resolvedBy);
        return match;
    },

    // options (optional): { group, type ('standard'|'rule'), overrideReason }.
    // Without a group the approval goes to BCFA Finance Approvers.
    requestApproval: function(paymentSysId, requestedBy, options) {
        options = options || {};
        if (!options.group) options.group = FinancePolicy.DEFAULT_APPROVAL_GROUP;
        var approvalSysId = this.approvalEngine.requestPaymentApproval(paymentSysId, requestedBy, options);
        return { approvalSysId: approvalSysId };
    },

    decideApproval: function(paymentSysId, approvalSysId, decision, approver, notes) {
        // Phase 17: the engine's segregation-of-duties gate runs before the
        // payment state changes (a refusal is audited and changes nothing).
        var result = this.approvalEngine.decidePaymentApproval(approvalSysId, decision, approver, notes);
        if (result.error) return result;

        if (decision === 'approved') {
            var approverUser = new GlideRecord('sys_user');
            this._setState(paymentSysId, 'APPROVED', null, 'Approved by ' + (approver && approverUser.get(approver) ? approverUser.getDisplayValue() : 'configured rule'));
        } else {
            var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'other', 'Approval rejected: ' + (notes || ''));
            this._setState(paymentSysId, 'EXCEPTION', null, 'Approval rejected');
            result.exceptionSysId = exceptionSysId;
        }
        this.approvalEngine.recordStateAfter('ar', approvalSysId);
        return result;
    },

    clearPayment: function(paymentSysId, simulateOutcome) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { error: 'Payment not found' };
        if (payment.getValue('state') !== 'APPROVED') {
            return { error: 'Clearing eligibility gate: Payment has not been approved.' };
        }

        // SAP processing mode (client requirement): captured on the payment
        // when clearing starts, from x_695068_bcfa.ar.sap_processing_mode
        // unless already set (e.g. a demo scenario), so every payment records
        // the mode it was processed under.
        var mode = payment.getValue('sap_processing_mode') || this.policy.arSapProcessingMode();
        if (payment.getValue('sap_processing_mode') !== mode) {
            payment.setValue('sap_processing_mode', mode);
            payment.setWorkflow(false);
            payment.update();
        }
        this._setState(paymentSysId, 'CLEARING', null, 'Sending the approved clearing instruction to SAP (' + mode.toUpperCase() + ' mode, mock SAP)');

        var idempotencyKey = payment.getValue('idempotency_key') || ('AR-CLEAR-' + paymentSysId);
        var result = this.integrationService.execute({
            operation: 'clearCustomerPayment',
            adapter: this.policy.sapAdapter(),
            correlationId: payment.getValue('correlation_id'),
            idempotencyKey: idempotencyKey,
            // Business reference: the same bank payment is never cleared twice.
            externalReference: payment.getValue('bank_reference'),
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: paymentSysId,
            payload: { bankReference: payment.getValue('bank_reference'), customer: payment.getValue('customer'), amount: payment.getValue('amount'), processingMode: mode },
            simulateOutcome: simulateOutcome
        });

        return this._applyClearingResult(paymentSysId, result);
    },

    _applyClearingResult: function(paymentSysId, result) {
        if (result.status === 'success' && result.response && result.response.staged) {
            // DRAFT mode: SAP holds a parked (draft) clearing document. Nothing
            // is cleared yet: allocations and open items stay as they are until
            // SAP confirms the draft (checkSapDraftStatus).
            this._setSapStatus(paymentSysId, 'staged_draft', result.response.sapDocumentId);
            this._setState(paymentSysId, 'SAP_DRAFT', null, 'Clearing instruction staged in SAP as a draft (mock SAP): ' + result.response.sapDocumentId + '; awaiting SAP confirmation.',
                { eventType: 'integration_result', reason: 'SAP processing mode DRAFT', after: { sap_processing_mode: 'draft', sap_draft_document: result.response.sapDocumentId, transaction: result.transactionSysId } });
            return { cleared: false, staged: true, sapDraftDocumentId: result.response.sapDocumentId, transactionSysId: result.transactionSysId };
        }
        if (result.status === 'success') {
            this._setSapStatus(paymentSysId, 'cleared', result.response ? result.response.sapDocumentId : '');
            var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
            allocation.addQuery('payment', paymentSysId);
            allocation.addQuery('allocation_state', '!=', 'reversed');
            allocation.query();
            while (allocation.next()) {
                allocation.setValue('allocation_state', 'cleared');
                allocation.update();
            }
            this._settleOpenItems(paymentSysId);
            this._setState(paymentSysId, 'CLEARED', null, 'Cleared in SAP (simulated): ' + (result.response ? result.response.sapDocumentId : ''));
            this.reconcileAndClose(paymentSysId);
            return { cleared: true, sapDocumentId: result.response ? result.response.sapDocumentId : null };
        }

        if (result.unknownOutcome) {
            this._setSapStatus(paymentSysId, 'unknown_outcome', '');
            this._setState(paymentSysId, 'UNKNOWN_OUTCOME', null, 'Clearing outcome unknown (timeout) — will query status before any retry.');
            return { cleared: false, unknownOutcome: true, transactionSysId: result.transactionSysId };
        }

        this._setSapStatus(paymentSysId, 'failed', '');
        var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'other', 'SAP clearing failed: ' + result.status);
        this._setState(paymentSysId, 'FAILED', null, 'Clearing failed: ' + result.status);
        return { cleared: false, failed: true, reasonCode: result.status, exceptionSysId: exceptionSysId };
    },

    // DRAFT mode: asks SAP whether the staged draft clearing document has been
    // posted. A status query only (IntegrationService.queryTransactionStatus):
    // the clearing instruction is never re-sent.
    //   POSTED   -> allocations cleared, open items settled, CLEARED, closed
    //   PENDING  -> no change (still awaiting SAP)
    //   REJECTED -> exception, FAILED
    checkSapDraftStatus: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { error: 'Payment not found' };
        if (payment.getValue('state') !== 'SAP_DRAFT') return { error: 'Only a payment staged as an SAP draft can be checked (state is ' + payment.getValue('state') + ').' };
        var txn = new GlideRecord('x_695068_bcfa_integration_txn');
        txn.addQuery('source_record', paymentSysId);
        txn.addQuery('operation', 'clearCustomerPayment');
        txn.addQuery('status', 'success');
        txn.orderByDesc('sys_created_on');
        txn.setLimit(1);
        txn.query();
        if (!txn.next()) return { error: 'No staged clearing transaction found.' };
        var status = this.integrationService.queryTransactionStatus(txn.getUniqueValue());
        if (status.outcome === 'POSTED') {
            var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
            allocation.addQuery('payment', paymentSysId);
            allocation.addQuery('allocation_state', '!=', 'reversed');
            allocation.query();
            while (allocation.next()) {
                allocation.setValue('allocation_state', 'cleared');
                allocation.update();
            }
            this._settleOpenItems(paymentSysId);
            this._setSapStatus(paymentSysId, 'cleared', status.sapDocumentId || payment.getValue('sap_reference'));
            this._setState(paymentSysId, 'CLEARED', null, 'SAP confirmed the draft (mock SAP): cleared as ' + (status.sapDocumentId || ''), { eventType: 'integration_result', reason: 'SAP draft posted',
                after: { sap_draft_document: payment.getValue('sap_reference'), sap_clearing_document: status.sapDocumentId } });
            this.reconcileAndClose(paymentSysId);
            return { cleared: true, sapDocumentId: status.sapDocumentId };
        }
        if (status.outcome === 'DRAFT_REJECTED') {
            this._setSapStatus(paymentSysId, 'failed', payment.getValue('sap_reference'));
            var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'other', 'SAP rejected the draft clearing document ' + payment.getValue('sap_reference') + ': ' + (status.message || ''));
            this._setState(paymentSysId, 'FAILED', null, 'SAP rejected the draft clearing document (mock SAP).', { eventType: 'integration_result', reason: 'SAP draft rejected' });
            return { cleared: false, failed: true, exceptionSysId: exceptionSysId };
        }
        this.auditEngine.logEvent({
            correlationId: payment.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: paymentSysId,
            eventType: 'integration_result',
            actorType: 'system',
            description: 'SAP draft ' + payment.getValue('sap_reference') + ' not yet confirmed in SAP (mock SAP status: ' + (status.outcome || 'unknown') + '). No change; nothing re-sent.',
            afterValue: { outcome: status.outcome }
        });
        return { cleared: false, pending: true, outcome: status.outcome };
    },

    _setSapStatus: function(paymentSysId, status, reference) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return;
        payment.setValue('sap_status', status);
        if (reference) payment.setValue('sap_reference', reference);
        payment.setWorkflow(false);
        payment.update();
    },

    reconcileClearing: function(paymentSysId, transactionSysId) {
        var resolution = this.integrationService.reconcileUnknownOutcome(transactionSysId);

        if (resolution.resolution === 'POSTED') {
            var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
            allocation.addQuery('payment', paymentSysId);
            allocation.addQuery('allocation_state', '!=', 'reversed');
            allocation.query();
            while (allocation.next()) {
                allocation.setValue('allocation_state', 'cleared');
                allocation.update();
            }
            this._settleOpenItems(paymentSysId);
            this._setSapStatus(paymentSysId, 'cleared', resolution.sapDocumentId);
            this._setState(paymentSysId, 'CLEARED', null, 'Reconciliation confirmed clearing committed: ' + resolution.sapDocumentId, { eventType: 'reconciliation', reason: resolution.resolution });
            this.reconcileAndClose(paymentSysId);
            return { cleared: true, sapDocumentId: resolution.sapDocumentId };
        }

        if (resolution.resolution === 'RETRY') {
            // Restore to APPROVED, not CLEARING — clearPayment()'s own
            // eligibility gate requires state === 'APPROVED' (Payment has no
            // separate approval_state field the way AP Invoice does), so
            // setting CLEARING here would make the retry fail its own gate
            // and get stuck forever. clearPayment() sets CLEARING itself
            // once past the gate.
            this._setState(paymentSysId, 'APPROVED', null, 'Reconciliation confirmed nothing committed — safe to retry.', { eventType: 'reconciliation', reason: resolution.resolution });
            return this.clearPayment(paymentSysId);
        }

        var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'other', 'Integration exception: ' + resolution.reason);
        this._setState(paymentSysId, 'FAILED', null, 'Reconciliation could not confirm outcome — integration exception.', { eventType: 'reconciliation', reason: resolution.reason || resolution.resolution });
        return { cleared: false, failed: true, exceptionSysId: exceptionSysId };
    },

    reconcileAndClose: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { error: 'Payment not found' };

        this.integrationService.execute({
            operation: 'archive',
            adapter: 'mock_archive',
            correlationId: payment.getValue('correlation_id'),
            idempotencyKey: 'AR-ARCHIVE-' + paymentSysId,
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: paymentSysId,
            payload: { sourceTable: 'x_695068_bcfa_payment', sourceRecord: paymentSysId, correlationId: payment.getValue('correlation_id') }
        });

        this._setState(paymentSysId, 'RECONCILED', null, 'Clearing reconciled and archived');
        this._setState(paymentSysId, 'CLOSED', null, 'Payment closed');
        return { closed: true };
    },

    type: 'ArDomainService'
};
