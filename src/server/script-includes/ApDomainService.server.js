// Orchestrates the AP Invoice lifecycle (Section 7 of the build brief) on
// top of the AP Invoice StateModel. Each method performs the real
// validation/matching/posting work FIRST, then moves the state field to
// whichever transition that result legalizes — state progression is a
// side effect of real logic running, never a bare status flip.
var ApDomainService = Class.create();
ApDomainService.prototype = {
    initialize: function() {
        this.auditEngine = new AuditEngine();
        this.matchingEngine = new MatchingEngine();
        this.exceptionEngine = new ExceptionEngine();
        this.approvalEngine = new ApprovalEngine();
        this.integrationService = new IntegrationService();
        this.aiSimulation = new AISimulationService();
    },

    LOW_CONFIDENCE_THRESHOLD: 0.85,

    _setState: function(apInvoiceSysId, newState, correlationId, description) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return false;
        var previous = invoice.getValue('state');
        invoice.setValue('state', newState);
        invoice.update();
        this.auditEngine.logEvent({
            correlationId: correlationId || invoice.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_ap_invoice',
            sourceRecord: apInvoiceSysId,
            eventType: 'state_transition',
            actorType: 'system',
            description: description || ('AP Invoice ' + previous + ' -> ' + newState),
            beforeValue: { state: previous },
            afterValue: { state: newState }
        });
        return true;
    },

    // Single entry point for the fully-automated portion of the pipeline
    // (Section 7 items 1-14): intake through matching, stopping naturally at
    // whichever state the deterministic logic reaches (MATCHED or
    // EXCEPTION). This is the "flow" for automated intake — see
    // docs/ARTIFACT_STRATEGY.md's Stage 15 refinement for why this is a
    // direct call chain rather than a Flow Designer flow.
    intakeAndAutoProcess: function(fields) {
        var intake = this.intakeInvoice(fields);
        this.runExtraction(intake.apInvoiceSysId, fields.seedExtraction || {}, fields.extractionOptions);
        var validation = this.validateInvoice(intake.apInvoiceSysId);
        if (!validation.validated) {
            return { apInvoiceSysId: intake.apInvoiceSysId, stoppedAt: 'VALIDATION_EXCEPTION', detail: validation };
        }
        var match = this.matchInvoice(intake.apInvoiceSysId);
        if (!match.matched) {
            return { apInvoiceSysId: intake.apInvoiceSysId, stoppedAt: 'MATCH_EXCEPTION', detail: match };
        }
        return { apInvoiceSysId: intake.apInvoiceSysId, stoppedAt: 'MATCHED', detail: match };
    },

    intakeInvoice: function(fields) {
        var correlationId = fields.correlationId || gs.generateGUID();
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        invoice.initialize();
        invoice.setValue('invoice_number', fields.invoiceNumber);
        if (fields.vendor) invoice.setValue('vendor', fields.vendor);
        invoice.setValue('company_code', fields.companyCode || '');
        invoice.setValue('currency', fields.currency || '');
        if (fields.invoiceDate) invoice.setValue('invoice_date', fields.invoiceDate);
        if (fields.purchaseOrder) invoice.setValue('purchase_order', fields.purchaseOrder);
        if (fields.salesOrderReference) invoice.setValue('sales_order_reference', fields.salesOrderReference);
        invoice.setValue('gross_amount', fields.grossAmount || 0);
        invoice.setValue('tax_amount', fields.taxAmount || 0);
        invoice.setValue('net_amount', fields.netAmount || 0);
        invoice.setValue('source', fields.source || 'email');
        invoice.setValue('correlation_id', correlationId);
        if (fields.externalReference) invoice.setValue('external_reference', fields.externalReference);
        invoice.setValue('state', 'RECEIVED');
        invoice.setValue('approval_state', 'not_required');
        invoice.setValue('posting_state', 'not_posted');
        var sysId = invoice.insert();

        this.auditEngine.logEvent({
            correlationId: correlationId,
            sourceTable: 'x_695068_bcfa_ap_invoice',
            sourceRecord: sysId,
            eventType: 'state_transition',
            description: 'AP Invoice received (intake)',
            afterValue: { state: 'RECEIVED' }
        });
        return { apInvoiceSysId: sysId, correlationId: correlationId };
    },

    // seedFields stands in for what real OCR/Document Intelligence would
    // have extracted (see AISimulationService).
    runExtraction: function(apInvoiceSysId, seedFields, options) {
        this._setState(apInvoiceSysId, 'EXTRACTING', null, 'Beginning simulated extraction');
        var result = this.aiSimulation.simulateApExtraction(apInvoiceSysId, seedFields, options);
        this._setState(apInvoiceSysId, 'EXTRACTED', null, 'Extraction complete, confidence ' + result.confidence);
        return result;
    },

    validateInvoice: function(apInvoiceSysId) {
        this._setState(apInvoiceSysId, 'VALIDATING', null, 'Running mandatory-field/vendor/PO/confidence validation');

        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return { error: 'AP Invoice not found' };

        var extraction = new GlideRecord('x_695068_bcfa_ap_extraction');
        extraction.addQuery('ap_invoice', apInvoiceSysId);
        extraction.orderByDesc('sys_created_on');
        extraction.setLimit(1);
        extraction.query();
        var confidence = extraction.next() ? parseFloat(extraction.getValue('confidence') || '1') : 1;

        var failure = null;
        if (confidence < this.LOW_CONFIDENCE_THRESHOLD) {
            failure = { reasonCode: 'low_confidence', description: 'Extraction confidence ' + confidence + ' is below the ' + this.LOW_CONFIDENCE_THRESHOLD + ' review threshold.' };
        } else if (!invoice.getValue('invoice_number') || !invoice.getValue('vendor') || !invoice.getValue('gross_amount')) {
            failure = { reasonCode: 'missing_field', description: 'One or more mandatory fields (invoice number, vendor, gross amount) are missing.' };
        } else {
            var vendor = new GlideRecord('x_695068_bcfa_vendor');
            if (!vendor.get(invoice.getValue('vendor')) || vendor.getValue('active') !== '1') {
                failure = { reasonCode: 'vendor_invalid', description: 'Vendor could not be resolved to an active master record.' };
            } else if (invoice.getValue('purchase_order')) {
                var po = new GlideRecord('x_695068_bcfa_purchase_order');
                if (!po.get(invoice.getValue('purchase_order'))) {
                    failure = { reasonCode: 'po_mismatch', description: 'Referenced purchase order could not be resolved.' };
                }
            }
        }

        if (failure) {
            var exceptionSysId = this.exceptionEngine.createApException(apInvoiceSysId, failure.reasonCode, failure.description);
            this.aiSimulation.recommendApExceptionResolution(exceptionSysId);
            this._setState(apInvoiceSysId, 'EXCEPTION', null, 'Validation failed: ' + failure.reasonCode);
            return { validated: false, reasonCode: failure.reasonCode, exceptionSysId: exceptionSysId };
        }

        this._setState(apInvoiceSysId, 'VALIDATED', null, 'Validation passed');
        return { validated: true };
    },

    matchInvoice: function(apInvoiceSysId) {
        this._setState(apInvoiceSysId, 'MATCHING', null, 'Running duplicate detection and 3-way match');

        var duplicateResult = this.matchingEngine.detectDuplicateInvoice(apInvoiceSysId);
        if (duplicateResult.duplicate) {
            var dupExceptionSysId = this.exceptionEngine.createApException(apInvoiceSysId, 'duplicate', 'Duplicate of AP Invoice ' + duplicateResult.matchedInvoiceSysId);
            this.aiSimulation.recommendApExceptionResolution(dupExceptionSysId);
            this._setState(apInvoiceSysId, 'EXCEPTION', null, 'Duplicate invoice detected');
            return { matched: false, reasonCode: 'duplicate', exceptionSysId: dupExceptionSysId };
        }

        var match = this.matchingEngine.threeWayMatch(apInvoiceSysId);
        if (!match.withinTolerance) {
            var reasonCode = 'price_tolerance';
            if (match.quantityVariancePct > this.matchingEngine.DEFAULT_TOLERANCES.quantityPct) reasonCode = 'quantity_tolerance';
            else if (!match.taxWithinTolerance) reasonCode = 'tax_validation';
            var exceptionSysId2 = this.exceptionEngine.createApException(apInvoiceSysId, reasonCode,
                'Match result: ' + match.matchResult + '. Quantity variance ' + (match.quantityVariancePct * 100).toFixed(1) + '%, price variance ' + (match.priceVariancePct * 100).toFixed(1) + '%.');
            this.aiSimulation.recommendApExceptionResolution(exceptionSysId2);
            this._setState(apInvoiceSysId, 'EXCEPTION', null, 'Match failed: ' + reasonCode);
            return { matched: false, reasonCode: reasonCode, exceptionSysId: exceptionSysId2, match: match };
        }

        this._setState(apInvoiceSysId, 'MATCHED', null, 'Matched within tolerance');
        return { matched: true, match: match };
    },

    // Reviewer correction: resolve the exception, then loop back to
    // re-validate from scratch (Section 7 items 16-17: reviewer correction,
    // rematch).
    resolveExceptionAndRetry: function(apInvoiceSysId, exceptionSysId, resolutionNotes, resolvedBy) {
        this._setState(apInvoiceSysId, 'RESOLUTION', null, 'Reviewer resolving exception');
        this.exceptionEngine.resolveApException(exceptionSysId, resolutionNotes, resolvedBy);
        this._setState(apInvoiceSysId, 'VALIDATING', null, 'Re-validating after correction');
        return this.validateInvoice(apInvoiceSysId);
    },

    requestApproval: function(apInvoiceSysId, requestedBy) {
        this._setState(apInvoiceSysId, 'PENDING_APPROVAL', null, 'Requesting posting approval');
        var approvalSysId = this.approvalEngine.requestApInvoiceApproval(apInvoiceSysId, requestedBy);
        return { approvalSysId: approvalSysId };
    },

    // IMPORTANT ordering: `approvalEngine.decideApInvoiceApproval` sets
    // approval_state = 'approved' and calls .update(), which fires the
    // "AP Invoice - Auto Post After Approval" Business Rule SYNCHRONOUSLY
    // (ServiceNow "after" business rules run in-line, not async) — by the
    // time that call returns, the invoice may already be POSTING/POSTED/
    // RECONCILED/CLOSED. The state must therefore already be 'APPROVED'
    // *before* triggering that update, and this method must never set state
    // again afterward — doing so previously clobbered whatever state the
    // cascade had already legitimately advanced to.
    decideApproval: function(apInvoiceSysId, approvalSysId, decision, approver, notes) {
        if (decision === 'approved') {
            this._setState(apInvoiceSysId, 'APPROVED', null, 'Approving — posting cascade will follow');
        }

        var result = this.approvalEngine.decideApInvoiceApproval(approvalSysId, decision, approver, notes);
        if (result.error) {
            if (decision === 'approved') {
                this._setState(apInvoiceSysId, 'PENDING_APPROVAL', null, 'Approval rejected by service layer (segregation of duties)');
            }
            return result;
        }

        if (decision !== 'approved') {
            var exceptionSysId = this.exceptionEngine.createApException(apInvoiceSysId, 'other', 'Approval rejected: ' + (notes || ''));
            this._setState(apInvoiceSysId, 'EXCEPTION', null, 'Approval rejected');
            result.exceptionSysId = exceptionSysId;
        }
        return result;
    },

    // Posting eligibility gate + mock SAP posting + Section 11 Unknown
    // Outcome Control, all in one step since eligibility is enforced by the
    // state machine itself (only reachable from APPROVED).
    postInvoice: function(apInvoiceSysId, simulateOutcome) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return { error: 'AP Invoice not found' };
        if (invoice.getValue('approval_state') !== 'approved') {
            return { error: 'Posting eligibility gate: AP Invoice has not been approved.' };
        }

        this._setState(apInvoiceSysId, 'POSTING', null, 'Invoking mock SAP posting');
        invoice.setValue('posting_state', 'posting');
        invoice.update();

        var idempotencyKey = 'AP-POST-' + apInvoiceSysId;
        var result = this.integrationService.execute({
            operation: 'postVendorInvoice',
            adapter: 'mock_sap',
            correlationId: invoice.getValue('correlation_id'),
            idempotencyKey: idempotencyKey,
            sourceTable: 'x_695068_bcfa_ap_invoice',
            sourceRecord: apInvoiceSysId,
            payload: { invoiceNumber: invoice.getValue('invoice_number'), vendor: invoice.getValue('vendor'), amount: invoice.getValue('net_amount') },
            simulateOutcome: simulateOutcome
        });

        return this._applyPostingResult(apInvoiceSysId, result);
    },

    _applyPostingResult: function(apInvoiceSysId, result) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        invoice.get(apInvoiceSysId);

        if (result.status === 'success') {
            invoice.setValue('posting_state', 'posted');
            if (result.response && result.response.sapDocumentId) invoice.setValue('sap_document_id', result.response.sapDocumentId);
            invoice.update();
            this._setState(apInvoiceSysId, 'POSTED', null, 'Posted to SAP (simulated): ' + (result.response ? result.response.sapDocumentId : ''));
            this.reconcileAndClose(apInvoiceSysId);
            return { posted: true, sapDocumentId: result.response ? result.response.sapDocumentId : null };
        }

        if (result.unknownOutcome) {
            invoice.setValue('posting_state', 'unknown_outcome');
            invoice.update();
            this._setState(apInvoiceSysId, 'UNKNOWN_OUTCOME', null, 'Posting outcome unknown (timeout) — will query status before any retry, per Section 11.');
            return { posted: false, unknownOutcome: true, transactionSysId: result.transactionSysId };
        }

        invoice.setValue('posting_state', 'failed');
        invoice.update();
        var exceptionSysId = this.exceptionEngine.createApException(apInvoiceSysId, 'other', 'SAP posting failed: ' + result.status);
        this._setState(apInvoiceSysId, 'FAILED', null, 'Posting failed: ' + result.status);
        return { posted: false, failed: true, reasonCode: result.status, exceptionSysId: exceptionSysId };
    },

    // Section 11 status-query step: never a blind retry. Resolves an
    // UNKNOWN_OUTCOME invoice by asking the adapter for ground truth.
    reconcilePosting: function(apInvoiceSysId, transactionSysId) {
        var resolution = this.integrationService.reconcileUnknownOutcome(transactionSysId);

        if (resolution.resolution === 'POSTED') {
            var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
            invoice.get(apInvoiceSysId);
            invoice.setValue('posting_state', 'posted');
            invoice.setValue('sap_document_id', resolution.sapDocumentId);
            invoice.update();
            this._setState(apInvoiceSysId, 'POSTED', null, 'Reconciliation confirmed the posting committed: ' + resolution.sapDocumentId);
            this.reconcileAndClose(apInvoiceSysId);
            return { posted: true, sapDocumentId: resolution.sapDocumentId };
        }

        if (resolution.resolution === 'RETRY') {
            this._setState(apInvoiceSysId, 'POSTING', null, 'Reconciliation confirmed nothing committed — safe to retry.');
            return this.postInvoice(apInvoiceSysId);
        }

        var exceptionSysId = this.exceptionEngine.createApException(apInvoiceSysId, 'other', 'Integration exception: ' + resolution.reason);
        this._setState(apInvoiceSysId, 'FAILED', null, 'Reconciliation could not confirm outcome — integration exception.');
        return { posted: false, failed: true, exceptionSysId: exceptionSysId };
    },

    reconcileAndClose: function(apInvoiceSysId) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return { error: 'AP Invoice not found' };

        this.integrationService.execute({
            operation: 'archive',
            adapter: 'mock_archive',
            correlationId: invoice.getValue('correlation_id'),
            idempotencyKey: 'AP-ARCHIVE-' + apInvoiceSysId,
            sourceTable: 'x_695068_bcfa_ap_invoice',
            sourceRecord: apInvoiceSysId,
            payload: { sourceTable: 'x_695068_bcfa_ap_invoice', sourceRecord: apInvoiceSysId, correlationId: invoice.getValue('correlation_id') }
        });

        this._setState(apInvoiceSysId, 'RECONCILED', null, 'Posting reconciled and archived');
        this._setState(apInvoiceSysId, 'CLOSED', null, 'AP Invoice closed');
        return { closed: true };
    },

    type: 'ApDomainService'
};
