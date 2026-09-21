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
        this.claudeClient = new BCClaudeClient();
    },

    BALANCE_TOLERANCE: 0.01,

    // Public entry point for the "Explain with Claude" UI Action on AR
    // Exception — same purpose as ApDomainService.explainException. For a
    // customer_ambiguous exception, re-derives the same candidate-customer
    // context from the exception's own description so a manual re-run is
    // just as informed as the automatic call was.
    explainException: function(arExceptionSysId) {
        var exception = new GlideRecord('x_695068_bcfa_ar_exception');
        var candidateCustomers = null;
        if (exception.get(arExceptionSysId) && exception.getValue('reason_code') === 'customer_ambiguous') {
            var match = /remitter name "([^"]*)"/.exec(exception.getValue('description') || '');
            if (match) candidateCustomers = this._findCandidateCustomers(match[1]);
        }
        return this._explainArException(arExceptionSysId, candidateCustomers);
    },

    _setState: function(paymentSysId, newState, correlationId, description) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return false;
        var previous = payment.getValue('state');
        payment.setValue('state', newState);
        payment.update();
        this.auditEngine.logEvent({
            correlationId: correlationId || payment.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: paymentSysId,
            eventType: 'state_transition',
            actorType: 'system',
            description: description || ('Payment ' + previous + ' -> ' + newState),
            beforeValue: { state: previous },
            afterValue: { state: newState }
        });
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
            eventType: 'state_transition',
            description: 'Payment received (bank intake)',
            afterValue: { state: 'RECEIVED' }
        });
        return { paymentSysId: sysId, correlationId: correlationId };
    },

    intakeRemittance: function(paymentSysId, fields) {
        var remittance = new GlideRecord('x_695068_bcfa_remittance');
        remittance.initialize();
        remittance.setValue('payment', paymentSysId);
        remittance.setValue('remittance_reference', fields.remittanceReference || '');
        remittance.setValue('source', fields.source || 'email');
        if (fields.receivedDate) remittance.setValue('received_date', fields.receivedDate);
        var sysId = remittance.insert();
        if (fields.seedFields) {
            this._runClaudeRemittanceExtraction(sysId, fields.seedFields, fields.options) ||
                this.aiSimulation.simulateArExtraction(sysId, fields.seedFields, fields.options);
        }
        return { remittanceSysId: sysId };
    },

    // Returns a simulateArExtraction()-shaped result on success, or null if
    // Claude is disabled/unavailable/invalid so the caller falls back —
    // same pattern as ApDomainService._runClaudeExtraction.
    _runClaudeRemittanceExtraction: function(remittanceSysId, seedFields, options) {
        if (!this.claudeClient.isEnabled()) return null;

        var envelope = this.claudeClient.extractRemittance(remittanceSysId, seedFields);
        if (!envelope.ok) return null;

        var data = envelope.data;
        var forcedConfidence = options && options.forceConfidence !== undefined ? options.forceConfidence : null;
        var confidence = forcedConfidence !== null ? forcedConfidence : data.confidence;

        var remittance = new GlideRecord('x_695068_bcfa_remittance');
        if (!remittance.get(remittanceSysId)) return null;
        remittance.setValue('extracted_fields', JSON.stringify(data));
        remittance.setValue('confidence', confidence);
        remittance.update();

        this.auditEngine.logEvent({
            sourceTable: 'x_695068_bcfa_remittance',
            sourceRecord: remittanceSysId,
            eventType: 'ai_recommendation',
            actorType: 'claude_ai',
            description: 'Claude remittance extraction, confidence ' + confidence + (data.warnings && data.warnings.length ? '; warnings: ' + data.warnings.join('; ') : ''),
            afterValue: { confidence: confidence }
        });

        return { confidence: confidence };
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

        var resolution = this.matchingEngine.resolveCustomerByAlias(candidateName);
        if (resolution.resolved) {
            payment.setValue('customer', resolution.customerSysId);
            payment.update();
            return { resolved: true, customerSysId: resolution.customerSysId, confidence: resolution.confidence };
        }

        var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'customer_ambiguous', 'Could not resolve customer from remitter name "' + candidateName + '".');
        this._explainArException(exceptionSysId, this._findCandidateCustomers(candidateName));
        this._setState(paymentSysId, 'EXCEPTION', null, 'Customer resolution failed');
        return { resolved: false, exceptionSysId: exceptionSysId };
    },

    // Deterministic, coarse pre-filter for the customer_ambiguous
    // explanation — Claude only ever sees this short candidate list, never
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
        this._setState(paymentSysId, 'MATCHING', null, 'Running exact and multi-invoice matching');

        var exact = this.matchingEngine.exactMatch(paymentSysId);
        if (exact.matched) {
            this._setState(paymentSysId, 'MATCHED', null, 'Exact match found');
            return { matched: true, mode: 'exact' };
        }

        var multi = this.matchingEngine.multiInvoiceSuggestion(paymentSysId);
        this._recommendClaudeCashMatch(paymentSysId) || this.aiSimulation.suggestTopCandidate(paymentSysId);
        if (!multi.matched) {
            var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'unmatched', 'No open item combination matched this payment.');
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

    // Returns a suggestTopCandidate()-shaped result on success, or null if
    // Claude is disabled/unavailable/invalid so the caller falls back to
    // the deterministic heuristic. Reuses the exact same candidate
    // population multiInvoiceSuggestion just considered (this customer's
    // not-cleared open items) — Claude never sees a broader population.
    _recommendClaudeCashMatch: function(paymentSysId) {
        if (!this.claudeClient.isEnabled()) return null;

        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId) || !payment.getValue('customer')) return null;

        var item = new GlideRecord('x_695068_bcfa_ar_open_item');
        item.addQuery('customer', payment.getValue('customer'));
        item.addQuery('status', '!=', 'cleared');
        item.query();
        var candidateSysIds = [];
        while (item.next()) candidateSysIds.push(item.getUniqueValue());
        if (candidateSysIds.length === 0) return null;

        var envelope = this.claudeClient.recommendCashMatch(paymentSysId, candidateSysIds);
        if (!envelope.ok) return null;

        var data = envelope.data;
        var suggestion = new GlideRecord('x_695068_bcfa_match_candidate');
        suggestion.initialize();
        suggestion.setValue('payment', paymentSysId);
        if (data.recommended_open_item_sys_id) suggestion.setValue('ar_open_item', data.recommended_open_item_sys_id);
        suggestion.setValue('customer_candidate', payment.getValue('customer'));
        suggestion.setValue('match_type', 'ai_suggested');
        suggestion.setValue('confidence', data.confidence);
        suggestion.setValue('rank', 0);
        suggestion.setValue('selected', false);
        var sysId = suggestion.insert();

        this.auditEngine.logEvent({
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: paymentSysId,
            eventType: 'ai_recommendation',
            actorType: 'claude_ai',
            description: 'Claude cash-match recommendation: ' + data.match_type + ', confidence ' + data.confidence + '. ' + (data.explanation || ''),
            afterValue: { matchType: data.match_type, recommendedItemNumber: data.recommended_item_number || null }
        });

        return { suggested: true, matchCandidateSysId: sysId, matchType: data.match_type };
    },

    // Writes an analyst-facing explanation into the exception's existing
    // advisory field (ai_recommendation). Same Claude-first-with-fallback
    // pattern as ApDomainService._explainApException. candidateCustomers is
    // optional context for the customer_ambiguous case (see
    // _findCandidateCustomers).
    _explainArException: function(exceptionSysId, candidateCustomers) {
        if (this.claudeClient.isEnabled()) {
            var envelope = this.claudeClient.explainCashException(exceptionSysId, candidateCustomers);
            if (envelope.ok && !envelope.data.insufficient_information) {
                var recommendation = envelope.data.explanation +
                    (envelope.data.recommended_action ? ' Recommended next step: ' + envelope.data.recommended_action : '') +
                    (envelope.data.evidence && envelope.data.evidence.length ? ' Evidence: ' + envelope.data.evidence.join('; ') + '.' : '');
                var exception = new GlideRecord('x_695068_bcfa_ar_exception');
                if (exception.get(exceptionSysId)) {
                    exception.setValue('ai_recommendation', recommendation);
                    exception.update();
                }
                this.auditEngine.logEvent({
                    sourceTable: 'x_695068_bcfa_ar_exception',
                    sourceRecord: exceptionSysId,
                    eventType: 'ai_recommendation',
                    actorType: 'claude_ai',
                    description: 'Claude exception explanation, confidence ' + envelope.data.confidence,
                    afterValue: { recommendation: recommendation }
                });
                return { recommendation: recommendation };
            }
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

        var candidateType = 'exact';
        var candidate = new GlideRecord('x_695068_bcfa_match_candidate');
        candidate.addQuery('payment', paymentSysId);
        candidate.addQuery('match_type', 'exact');
        candidate.query();
        var exactCandidates = [];
        while (candidate.next()) exactCandidates.push(candidate.getValue('ar_open_item'));

        var selectedItems = exactCandidates;
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

        if (selectedItems.length === 0) {
            var noItemExceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'unmatched', 'No selected open items available to allocate.');
            this._setState(paymentSysId, 'EXCEPTION', null, 'Allocation failed: nothing to allocate');
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
        for (var i = 0; i < selectedItems.length; i++) {
            var item = new GlideRecord('x_695068_bcfa_ar_open_item');
            item.get(selectedItems[i]);
            var openAmount = parseFloat(item.getValue('open_amount') || '0');
            var allocatedAmount = openAmount;

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
        if (Math.abs(difference) <= this.BALANCE_TOLERANCE) {
            this._setState(paymentSysId, 'PENDING_APPROVAL', null, 'Allocation balances; ready for approval');
            return { balanced: true, allocationSysIds: allocationSysIds, allocatedTotal: allocatedTotal };
        }

        // difference = paymentAmount - allocatedTotal. Positive means the
        // payment was MORE than what got allocated to open items (an
        // overpayment); negative means MORE was allocated than the customer
        // actually paid (a genuine short payment). An earlier version of
        // this had the two labels swapped.
        var reasonCode = difference > 0 ? 'over_pay' : 'short_pay';
        var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, reasonCode,
            'Allocation total ' + allocatedTotal + ' does not match payment amount ' + paymentAmount + ' (difference ' + difference + ').');
        this._explainArException(exceptionSysId);
        this._setState(paymentSysId, 'EXCEPTION', null, 'Allocation does not balance: ' + reasonCode);
        return { balanced: false, reasonCode: reasonCode, exceptionSysId: exceptionSysId, allocationSysIds: allocationSysIds, difference: difference };
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
        if (Math.abs(difference) <= this.BALANCE_TOLERANCE) {
            this._setState(paymentSysId, 'PENDING_APPROVAL', null, 'Allocation balances after approved deductions; ready for approval');
            return { balanced: true, netAllocated: netAllocated };
        }
        return { balanced: false, netAllocated: netAllocated, difference: difference };
    },

    // Business override for a payment that will never balance under the
    // deterministic rule (e.g. a confirmed intentional short-pay pending a
    // future credit memo) — moves it forward on a human decision rather than
    // silently forcing the numbers to match.
    forceProceedDespiteImbalance: function(paymentSysId, reason) {
        this._setState(paymentSysId, 'PENDING_APPROVAL', null, reason || 'Manually approved to proceed despite allocation imbalance.');
        return { balanced: false, forced: true };
    },

    resolveExceptionAndRetry: function(paymentSysId, exceptionSysId, resolutionNotes, resolvedBy) {
        this.exceptionEngine.resolveArException(exceptionSysId, resolutionNotes, resolvedBy);
        this._setState(paymentSysId, 'MATCHING', null, 'Re-matching after correction');
        return this.matchPayment(paymentSysId);
    },

    requestApproval: function(paymentSysId, requestedBy) {
        var approvalSysId = this.approvalEngine.requestPaymentApproval(paymentSysId, requestedBy);
        return { approvalSysId: approvalSysId };
    },

    decideApproval: function(paymentSysId, approvalSysId, decision, approver, notes) {
        var result = this.approvalEngine.decidePaymentApproval(approvalSysId, decision, approver, notes);
        if (result.error) return result;

        if (decision === 'approved') {
            this._setState(paymentSysId, 'APPROVED', null, 'Approved by ' + approver);
        } else {
            var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'other', 'Approval rejected: ' + (notes || ''));
            this._setState(paymentSysId, 'EXCEPTION', null, 'Approval rejected');
            result.exceptionSysId = exceptionSysId;
        }
        return result;
    },

    clearPayment: function(paymentSysId, simulateOutcome) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { error: 'Payment not found' };
        if (payment.getValue('state') !== 'APPROVED') {
            return { error: 'Clearing eligibility gate: Payment has not been approved.' };
        }

        this._setState(paymentSysId, 'CLEARING', null, 'Invoking mock SAP clearing');

        var idempotencyKey = payment.getValue('idempotency_key') || ('AR-CLEAR-' + paymentSysId);
        var result = this.integrationService.execute({
            operation: 'clearPayment',
            adapter: 'mock_sap',
            correlationId: payment.getValue('correlation_id'),
            idempotencyKey: idempotencyKey,
            sourceTable: 'x_695068_bcfa_payment',
            sourceRecord: paymentSysId,
            payload: { bankReference: payment.getValue('bank_reference'), customer: payment.getValue('customer'), amount: payment.getValue('amount') },
            simulateOutcome: simulateOutcome
        });

        return this._applyClearingResult(paymentSysId, result);
    },

    _applyClearingResult: function(paymentSysId, result) {
        if (result.status === 'success') {
            var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
            allocation.addQuery('payment', paymentSysId);
            allocation.query();
            while (allocation.next()) {
                allocation.setValue('allocation_state', 'cleared');
                allocation.update();
            }
            this._setState(paymentSysId, 'CLEARED', null, 'Cleared in SAP (simulated): ' + (result.response ? result.response.sapDocumentId : ''));
            this.reconcileAndClose(paymentSysId);
            return { cleared: true, sapDocumentId: result.response ? result.response.sapDocumentId : null };
        }

        if (result.unknownOutcome) {
            this._setState(paymentSysId, 'UNKNOWN_OUTCOME', null, 'Clearing outcome unknown (timeout) — will query status before any retry.');
            return { cleared: false, unknownOutcome: true, transactionSysId: result.transactionSysId };
        }

        var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'other', 'SAP clearing failed: ' + result.status);
        this._setState(paymentSysId, 'FAILED', null, 'Clearing failed: ' + result.status);
        return { cleared: false, failed: true, reasonCode: result.status, exceptionSysId: exceptionSysId };
    },

    reconcileClearing: function(paymentSysId, transactionSysId) {
        var resolution = this.integrationService.reconcileUnknownOutcome(transactionSysId);

        if (resolution.resolution === 'POSTED') {
            var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
            allocation.addQuery('payment', paymentSysId);
            allocation.query();
            while (allocation.next()) {
                allocation.setValue('allocation_state', 'cleared');
                allocation.update();
            }
            this._setState(paymentSysId, 'CLEARED', null, 'Reconciliation confirmed clearing committed: ' + resolution.sapDocumentId);
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
            this._setState(paymentSysId, 'APPROVED', null, 'Reconciliation confirmed nothing committed — safe to retry.');
            return this.clearPayment(paymentSysId);
        }

        var exceptionSysId = this.exceptionEngine.createArException(paymentSysId, 'other', 'Integration exception: ' + resolution.reason);
        this._setState(paymentSysId, 'FAILED', null, 'Reconciliation could not confirm outcome — integration exception.');
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
