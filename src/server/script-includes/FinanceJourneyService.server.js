// Journey presentation layer (Playbook phase). Derives, from the authoritative
// records, where an AP invoice or a payment is in its business journey and,
// when it cannot progress, why, what must happen next and who owns it. The
// BCFA Playbooks show these fields and wait on journey_stage_order; they never
// decide anything themselves.
//
// It only READS the authoritative data (state, exceptions, approvals,
// integration transactions, extraction, remittances) and writes the journey_*
// display fields with setWorkflow(false), like FinanceReviewSummary. It does
// no financial arithmetic: amounts shown come from the domain services'
// own results (allocated_amount, residual_amount, variances on the match and
// exception records).
//
// Stage orders (a Playbook stage N completes when journey_stage_order > N):
//   AP  1 intake, 2 extraction, 3 validation, 4 PO/GRN 3-way match,
//       5 exception (parallel lane), 6 approval, 7 SAP posting, 8 closure,
//       9 done (CLOSED or REJECTED)
//   AR  1 payment/remittance intake, 2 extraction & correlation, 3 customer,
//       4 open items, 5 matching & allocation, 6 exception / deduction
//       (parallel lane), 7 approval, 8 SAP processing (draft or direct),
//       9 cleared, 10 done (CLOSED)
// A blocked transaction stays on the stage where it was blocked (taken from
// the open exception's reason), so the Playbook stops there.
var FinanceJourneyService = Class.create();

FinanceJourneyService.AP_STAGES = {
    1: 'intake', 2: 'extraction', 3: 'validation', 4: 'matching', 5: 'exception', 6: 'approval', 7: 'posting', 8: 'closure', 9: 'closure'
};
FinanceJourneyService.AR_STAGES = {
    1: 'intake', 2: 'correlation', 3: 'customer', 4: 'open_items', 5: 'matching', 6: 'exception', 7: 'approval', 8: 'sap_processing', 9: 'closure', 10: 'closure'
};
FinanceJourneyService.AP_STATE_ORDER = {
    RECEIVED: 1, EXTRACTING: 2, EXTRACTED: 2, VALIDATING: 3, VALIDATED: 3, MATCHING: 4, MATCHED: 4,
    PENDING_APPROVAL: 6, APPROVED: 6, POSTING: 7, UNKNOWN_OUTCOME: 7, POSTED: 7, FAILED: 7, RECONCILED: 8, CLOSED: 9, REJECTED: 9
};
FinanceJourneyService.AR_STATE_ORDER = {
    CUSTOMER_RESOLUTION: 3, MATCHING: 5, MATCHED: 5, PARTIALLY_MATCHED: 5, UNMATCHED: 5, ALLOCATION: 5,
    PENDING_APPROVAL: 7, APPROVED: 7, CLEARING: 8, SAP_DRAFT: 8, UNKNOWN_OUTCOME: 8, FAILED: 8, CLEARED: 9, RECONCILED: 9, CLOSED: 10
};
// Stage where an open exception of this reason blocks the transaction.
FinanceJourneyService.AP_REASON_STAGE = {
    low_confidence: 2, missing_field: 2, duplicate: 3, vendor_invalid: 3, po_mismatch: 3, tax_validation: 3,
    quantity_tolerance: 4, price_tolerance: 4, grn_missing: 4, line_total_mismatch: 4
};
FinanceJourneyService.AR_REASON_STAGE = {
    customer_ambiguous: 3, unmatched: 5, ambiguous_match: 5, currency_mismatch: 5, duplicate: 5, short_pay: 6, over_pay: 6
};
FinanceJourneyService.SIMULATED_EXTRACTION = 'SIMULATED DOCUMENT EXTRACTION — POC';
// Phase 40: a document read by the native provider says so instead.
FinanceJourneyService.NATIVE_EXTRACTION = 'NATIVE EXTRACTION — ServiceNow Document Intelligence (Now LLM)';
FinanceJourneyService.MOCK_SAP = 'MOCK SAP';

FinanceJourneyService.prototype = {
    initialize: function() {},

    refreshInvoice: function(sysId) {
        try {
            var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
            if (!inv.get(sysId)) return null;
            var j = this.invoiceJourney(inv);
            this._write(inv, j);
            return j;
        } catch (e) {
            gs.warn('BCFA FinanceJourneyService (invoice ' + sysId + '): ' + e);
            return null;
        }
    },

    refreshPayment: function(sysId) {
        try {
            var pay = new GlideRecord('x_695068_bcfa_payment');
            if (!pay.get(sysId)) return null;
            var j = this.paymentJourney(pay);
            this._write(pay, j);
            return j;
        } catch (e) {
            gs.warn('BCFA FinanceJourneyService (payment ' + sysId + '): ' + e);
            return null;
        }
    },

    // ---- AP ------------------------------------------------------------------

    invoiceJourney: function(inv) {
        var id = inv.getUniqueValue();
        var state = inv.getValue('state') || 'RECEIVED';
        var open = this._openExceptions('x_695068_bcfa_ap_exception', 'ap_invoice', id);
        var j = { openExceptions: open.length, banner: this._apBanner(id) };
        var order = FinanceJourneyService.AP_STATE_ORDER[state];

        if (state === 'EXCEPTION' || state === 'ON_HOLD' || state === 'RESOLUTION') {
            var ex = open[0];
            order = ex ? (FinanceJourneyService.AP_REASON_STAGE[ex.reason] || this._apOtherStage(id)) : 3;
            if (state === 'RESOLUTION') {
                return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'in_progress',
                    'Exception resolved; the invoice is being re-validated and re-matched.', 'No action: the system re-runs validation and matching.', 'System');
            }
            if (ex) {
                var stageName = this._label(FinanceJourneyService.AP_STAGES[order]);
                return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'blocked',
                    'WHAT HAPPENED: ' + ex.number + ' ' + ex.reasonLabel + ' (' + ex.severity + ') at ' + stageName + (state === 'ON_HOLD' ? '; invoice ON HOLD' : '') +
                    '\nWHY: ' + (ex.ruleResult || ex.description || 'see the exception'),
                    this._apNextAction(ex.reason), this._apOwner(ex.reason));
            }
            return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'blocked', 'Invoice in ' + state + ' with no open exception.', 'Review the invoice.', 'AP Processor');
        }
        if (!order) order = 1;

        if (state === 'PENDING_APPROVAL') {
            var appr = this._pendingApproval('x_695068_bcfa_ap_approval', 'ap_invoice', id);
            return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'action_required',
                'WHAT HAPPENED: invoice matched within tolerance and routed for approval' + (appr ? ' (' + appr.number + ', ' + appr.type + ')' : '') +
                '\nWHY: approval is required by the configured approval rule before posting.',
                'Approve or reject the approval request (requester and processor cannot approve).', 'Finance Approver');
        }
        if (state === 'UNKNOWN_OUTCOME') {
            return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'blocked',
                'WHAT HAPPENED: SAP posting response unknown (' + FinanceJourneyService.MOCK_SAP + ')' +
                '\nWHY: the write may or may not have committed; it is never blindly re-sent.',
                'Reconciliation queries the posting status (AP Reconciliation Flow); retry only if SAP confirms nothing was posted.', 'Integration Operator');
        }
        if (state === 'FAILED') {
            return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'blocked',
                'WHAT HAPPENED: SAP posting failed (' + FinanceJourneyService.MOCK_SAP + ')' + '\nWHY: ' + (this._lastIntegrationError(id) || 'see the integration transaction'),
                'Investigate the integration error, then Resolve & Retry.', 'Integration Operator');
        }
        if (state === 'CLOSED') return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'complete', '', 'None: posted and closed.', '');
        if (state === 'REJECTED') return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'rejected', 'Invoice rejected by a person; it will not be posted.', 'None.', '');
        if (order <= 2 && state === 'EXTRACTED') {
            return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'in_progress', '', 'No action: validation starts automatically.', 'System');
        }
        return this._finish(j, order, FinanceJourneyService.AP_STAGES, 'in_progress', '', 'No action: the system is processing this stage.', 'System');
    },

    _apOtherStage: function(id) {
        if (this._exists('x_695068_bcfa_integration_txn', 'source_record=' + id + '^operation=postVendorInvoice^status!=success')) return 7;
        if (this._exists('x_695068_bcfa_ap_approval', 'ap_invoice=' + id + '^decision=rejected')) return 6;
        return 3;
    },

    _apNextAction: function(reason) {
        switch (reason) {
            case 'low_confidence':
            case 'missing_field':
                return 'Review the extracted fields against the source document, correct permitted fields, then Resolve & Retry (or Reject).';
            case 'duplicate':
                return 'Reject the duplicate. Duplicates cannot be overridden by policy.';
            case 'quantity_tolerance':
            case 'price_tolerance':
            case 'tax_validation':
                return 'Request Correction from the vendor, Hold, Reject, or (Finance Approver, not the owner) Approve Override with a reason.';
            default:
                return 'Review the exception and decide: Request Correction, Hold or Reject.';
        }
    },

    _apOwner: function(reason) {
        return (reason === 'quantity_tolerance' || reason === 'price_tolerance' || reason === 'tax_validation') ? 'AP Processor (override: Finance Approver)' : 'AP Processor';
    },

    _apBanner: function(id) {
        var parts = [];
        var ex = new GlideRecord('x_695068_bcfa_ap_extraction');
        ex.addQuery('ap_invoice', id);
        ex.orderByDesc('sys_created_on');
        ex.setLimit(1);
        ex.query();
        // Phase 40: label only what was recorded. No extraction record (not
        // extracted yet, or entered by hand) means no extraction label.
        if (ex.next()) {
            if (String(ex.getValue('source')).indexOf('simulated') === 0) parts.push(FinanceJourneyService.SIMULATED_EXTRACTION);
            else if (ex.getValue('source') === 'servicenow_document_intelligence') parts.push(FinanceJourneyService.NATIVE_EXTRACTION);
        }
        parts.push(FinanceJourneyService.MOCK_SAP);
        return parts.join(' · ');
    },

    // ---- AR ------------------------------------------------------------------

    paymentJourney: function(pay) {
        var id = pay.getUniqueValue();
        var state = pay.getValue('state') || 'RECEIVED';
        var open = this._openExceptions('x_695068_bcfa_ar_exception', 'payment', id);
        var hasRemittance = this._exists('x_695068_bcfa_remittance', 'payment=' + id);
        var mode = pay.getValue('sap_processing_mode') || new FinancePolicy().arSapProcessingMode();
        // Phase 40: a payment without a remittance has no document reading to label.
        var reading = this._exists('x_695068_bcfa_remittance', 'payment=' + id + '^extraction_provider=native') ? FinanceJourneyService.NATIVE_EXTRACTION
            : hasRemittance ? FinanceJourneyService.SIMULATED_EXTRACTION : '';
        var j = { openExceptions: open.length, banner: (reading ? reading + ' · ' : '') + FinanceJourneyService.MOCK_SAP + ' · SAP mode ' + mode.toUpperCase() };
        var order = FinanceJourneyService.AR_STATE_ORDER[state];
        if (state === 'RECEIVED' || state === 'NORMALIZED') order = hasRemittance ? 2 : 1;

        if (state === 'EXCEPTION' || state === 'ON_HOLD') {
            var ex = open[0];
            order = ex ? (FinanceJourneyService.AR_REASON_STAGE[ex.reason] || this._arOtherStage(id)) : 5;
            if (ex) {
                var why = ex.ruleResult || ex.description || 'see the exception';
                if (ex.reason === 'customer_ambiguous' && !hasRemittance) why = 'Bank line received without a remittance: the remitter could not be matched to a customer. ' + why;
                return this._finish(j, order, FinanceJourneyService.AR_STAGES, 'blocked',
                    'WHAT HAPPENED: ' + ex.number + ' ' + ex.reasonLabel + ' (' + ex.severity + ')' + (state === 'ON_HOLD' ? '; payment ON HOLD' : '') + '\nWHY: ' + why,
                    this._arNextAction(ex.reason, hasRemittance), this._arOwner(ex.reason));
            }
            return this._finish(j, order, FinanceJourneyService.AR_STAGES, 'blocked', 'Payment in ' + state + ' with no open exception.', 'Review the payment.', 'AR Processor');
        }
        if (!order) order = 1;

        if (state === 'PENDING_APPROVAL') {
            var appr = this._pendingApproval('x_695068_bcfa_ar_approval', 'payment', id);
            return this._finish(j, order, FinanceJourneyService.AR_STAGES, 'action_required',
                'WHAT HAPPENED: payment matched and allocated' + (appr ? '; approval ' + appr.number + ' requested' : '') +
                '\nWHY: clearing requires approval by the configured rule (deductions above the threshold need a Finance Approver).',
                'Approve or reject the approval request (requester and processor cannot approve).', 'Finance Approver');
        }
        if (state === 'SAP_DRAFT') {
            return this._finish(j, order, FinanceJourneyService.AR_STAGES, 'waiting',
                'WHAT HAPPENED: approved clearing instruction staged in SAP as a DRAFT (' + FinanceJourneyService.MOCK_SAP + (pay.getValue('sap_reference') ? ' ' + pay.getValue('sap_reference') : '') + ')' +
                '\nWHY: SAP processing mode is DRAFT: SAP must confirm (post) the draft before the payment is cleared. Nothing is cleared yet.',
                'Confirm the draft in SAP, then Check SAP Draft Status (status query only, nothing is re-sent).', 'SAP user / Integration Operator');
        }
        if (state === 'UNKNOWN_OUTCOME') {
            return this._finish(j, order, FinanceJourneyService.AR_STAGES, 'blocked',
                'WHAT HAPPENED: SAP clearing response unknown (' + FinanceJourneyService.MOCK_SAP + ')\nWHY: the clearing may or may not have committed; it is never blindly re-sent.',
                'Reconciliation queries the clearing status (AR Reconciliation Flow); retry only if SAP confirms nothing was cleared.', 'Integration Operator');
        }
        if (state === 'FAILED') {
            return this._finish(j, order, FinanceJourneyService.AR_STAGES, 'blocked',
                'WHAT HAPPENED: SAP clearing failed (' + FinanceJourneyService.MOCK_SAP + ')\nWHY: ' + (this._lastIntegrationError(id) || 'see the integration transaction'),
                'Investigate the integration error and resolve the exception.', 'Integration Operator');
        }
        if (state === 'CLOSED') return this._finish(j, order, FinanceJourneyService.AR_STAGES, 'complete', '', 'None: cleared and closed.', '');
        if (order === 1) {
            return this._finish(j, order, FinanceJourneyService.AR_STAGES, 'in_progress', 'PAYMENT ONLY: no remittance received yet.', 'No action: the payment is being normalized; a remittance may follow.', 'System');
        }
        return this._finish(j, order, FinanceJourneyService.AR_STAGES, 'in_progress', '', 'No action: the system is processing this stage.', 'System');
    },

    _arOtherStage: function(id) {
        if (this._exists('x_695068_bcfa_integration_txn', 'source_record=' + id + '^operation=clearCustomerPayment^status!=success')) return 8;
        if (this._exists('x_695068_bcfa_ar_approval', 'payment=' + id + '^decision=rejected')) return 7;
        return 5;
    },

    _arNextAction: function(reason, hasRemittance) {
        switch (reason) {
            case 'customer_ambiguous':
                return hasRemittance ? 'Confirm the customer (AI may rank candidates; a person confirms), then retry matching.' :
                    'Wait for or upload the remittance: Document Intake links it and matching resumes automatically.';
            case 'short_pay':
            case 'over_pay':
                return 'Classify the residual: Approve Deduction with an allowed type (bank charge, TCS, short pay), Request Clarification, or Hold.';
            case 'ambiguous_match':
                return 'Choose between the options with the customer or remittance evidence (AI explains the options; it does not decide).';
            default:
                return 'Review the exception: Request Clarification or Hold.';
        }
    },

    _arOwner: function(reason) {
        return (reason === 'short_pay' || reason === 'over_pay') ? 'AR Processor (above threshold: Finance Approver)' : 'AR Processor';
    },

    // ---- shared --------------------------------------------------------------

    _finish: function(j, order, stages, status, blocked, next, owner) {
        j.order = order;
        j.stage = stages[order] || 'intake';
        j.status = status;
        j.blocked = blocked || '';
        j.next = next || '';
        j.owner = owner || '';
        return j;
    },

    _label: function(stage) {
        return { intake: 'Intake', extraction: 'Document Extraction', validation: 'Validation', matching: '3-Way Match', exception: 'Exception', approval: 'Approval',
            posting: 'SAP Posting', closure: 'Closure', correlation: 'Correlation', customer: 'Customer Resolution', open_items: 'Open Items',
            sap_processing: 'SAP Processing' }[stage] || stage;
    },

    _openExceptions: function(table, field, id) {
        var out = [];
        var ex = new GlideRecord(table);
        ex.addQuery(field, id);
        ex.addQuery('status', 'IN', 'open,in_review');
        ex.orderByDesc('sys_created_on');
        ex.query();
        while (ex.next()) {
            out.push({ number: ex.getValue('number'), reason: ex.getValue('reason_code'), reasonLabel: ex.getDisplayValue('reason_code'),
                severity: ex.getDisplayValue('severity') || 'medium', ruleResult: ex.getValue('rule_result'), description: ex.getValue('description') });
        }
        return out;
    },

    _pendingApproval: function(table, field, id) {
        var a = new GlideRecord(table);
        a.addQuery(field, id);
        a.addQuery('decision', 'pending');
        a.orderByDesc('sys_created_on');
        a.setLimit(1);
        a.query();
        return a.next() ? { number: a.getValue('number') || a.getUniqueValue(), type: a.getDisplayValue('approval_type') } : null;
    },

    _lastIntegrationError: function(id) {
        var t = new GlideRecord('x_695068_bcfa_integration_txn');
        t.addQuery('source_record', id);
        t.addNotNullQuery('error_code');
        t.orderByDesc('sys_created_on');
        t.setLimit(1);
        t.query();
        return t.next() ? t.getValue('error_code') + ': ' + t.getValue('error_message') : '';
    },

    _exists: function(table, query) {
        var g = new GlideRecord(table);
        g.addEncodedQuery(query);
        g.setLimit(1);
        g.query();
        return g.hasNext();
    },

    // Display fields only; setWorkflow(false) so no business rule (approval
    // cascade, lifecycle backstop) runs on this write.
    _write: function(rec, j) {
        var changedStage = rec.getValue('journey_stage_order') !== String(j.order);
        rec.setValue('journey_stage', j.stage);
        rec.setValue('journey_stage_order', j.order);
        rec.setValue('journey_status', j.status);
        rec.setValue('journey_blocked_reason', String(j.blocked).substring(0, 1000));
        rec.setValue('journey_next_action', String(j.next).substring(0, 500));
        rec.setValue('journey_owner', j.owner);
        rec.setValue('journey_open_exceptions', j.openExceptions);
        rec.setValue('journey_banner', j.banner);
        if (changedStage || !rec.getValue('journey_stage_entered')) rec.setValue('journey_stage_entered', new GlideDateTime());
        rec.setValue('journey_updated', new GlideDateTime());
        rec.setWorkflow(false);
        rec.update();
    },

    type: 'FinanceJourneyService'
};
