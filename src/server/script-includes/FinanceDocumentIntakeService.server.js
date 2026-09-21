// Orchestrates TRUE document-to-transaction processing: a raw uploaded
// PDF/image becomes an AP Invoice or Payment/Remittance, which is then
// handed to the EXISTING ApDomainService/ArDomainService pipelines exactly
// as if it had been created any other way. This class never sets
// approval_state, posting_state, state, or a decision field on any AP/AR
// record, and never calls ApprovalEngine/IntegrationService/a mock adapter
// directly — it only ever calls ApDomainService/ArDomainService's own public
// methods (intakeInvoice/attachInvoiceLine/validateInvoice/matchInvoice/
// requestApproval, intakePayment/intakeRemittance/normalizePayment/
// resolveCustomer/matchPayment/allocatePayment/requestApproval). That is
// what keeps the existing domain services authoritative by construction,
// not just by convention.
var FinanceDocumentIntakeService = Class.create();
FinanceDocumentIntakeService.prototype = {
    initialize: function() {
        this.apService = new ApDomainService();
        this.arService = new ArDomainService();
        this.matchingEngine = new MatchingEngine();
        this.lineResolver = new ApLineResolutionService();
        this.claudeClient = new BCClaudeClient();
        this.auditEngine = new AuditEngine();
    },

    // ==== Entry point (backs "Process with Claude" / "Reprocess") =========

    // Idempotent re-entry: resumes from wherever this intake record already
    // is, rather than assuming a fresh start. Safe to click more than once.
    // Wrapped in try/catch as a last-resort safety net: an uncaught
    // exception anywhere in this pipeline previously left the record stuck
    // silently at whatever status it last reached, with no error visible
    // anywhere (confirmed live) — this guarantees processing_status ends
    // at 'failed' with a safe_error instead, however the underlying cause.
    processDocument: function(intakeSysId) {
        try {
            return this._processDocumentInner(intakeSysId);
        } catch (e) {
            return this._fail(intakeSysId, 'Unexpected error: ' + (e && e.message ? e.message : String(e)));
        }
    },

    _processDocumentInner: function(intakeSysId) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) {
            return { error: 'Finance Intake record not found: ' + intakeSysId };
        }

        // Phase 10 — duplicate-intake guard, before anything else runs.
        var hash = this.computeAttachmentHash(intakeSysId);
        if (hash && intake.getValue('attachment_hash') !== hash) {
            intake.setValue('attachment_hash', hash);
            intake.update();
        }
        if (hash) {
            var duplicate = this._findDuplicateIntake(intakeSysId, hash, intake.getValue('source_reference'));
            if (duplicate) {
                if (duplicate.getValue('ap_invoice')) intake.setValue('ap_invoice', duplicate.getValue('ap_invoice'));
                if (duplicate.getValue('payment')) intake.setValue('payment', duplicate.getValue('payment'));
                if (duplicate.getValue('remittance')) intake.setValue('remittance', duplicate.getValue('remittance'));
                intake.setValue('processing_status', 'completed');
                intake.setValue('processing_error', 'Duplicate of ' + duplicate.getValue('number') + ' — reusing its result, no new transaction created.');
                intake.update();
                this.auditEngine.logEvent({
                    sourceTable: 'x_695068_bcfa_finance_intake',
                    sourceRecord: intakeSysId,
                    eventType: 'exception_created',
                    actorType: 'system',
                    description: 'Duplicate intake detected (attachment_hash match) — reused ' + duplicate.getValue('number') + ' instead of creating a new transaction.',
                });
                return { duplicate: true, originalIntakeSysId: duplicate.getUniqueValue() };
            }
        }

        var status = intake.getValue('processing_status');
        var documentType = intake.getValue('document_type');

        if (status === 'review_required') {
            if (documentType && documentType !== 'unknown') {
                return this._dispatchByDocumentType(intakeSysId, documentType);
            }
            return { requiresReview: true, reason: 'document_type is still unknown — set it manually, then run Process with Claude again.' };
        }

        // new / failed / classifying (an interrupted prior attempt) — safe
        // to (re)classify; classification does not create any transaction.
        var classification = this.classifyFinanceDocument(intakeSysId);
        if (!classification.classified) {
            return classification;
        }
        if (classification.requiresReview) {
            return classification;
        }
        return this._dispatchByDocumentType(intakeSysId, classification.documentType);
    },

    _dispatchByDocumentType: function(intakeSysId, documentType) {
        if (documentType === 'ap_invoice') return this.processApInvoiceDocument(intakeSysId);
        if (documentType === 'ar_payment_advice') return this.processArPaymentAdviceDocument(intakeSysId);
        if (documentType === 'ar_remittance') return this.processArRemittanceDocument(intakeSysId);
        this.sendToManualReview(intakeSysId, 'Unrecognized document_type: ' + documentType);
        return { requiresReview: true };
    },

    // ==== Phase 3 — Classification ==========================================

    classifyFinanceDocument: function(intakeSysId) {
        this._setStatus(intakeSysId, 'classifying', 'Classifying uploaded document with Claude.');

        var envelope = this.claudeClient.classifyFinanceDocument(intakeSysId);
        if (!envelope.ok) {
            this._fail(intakeSysId, 'Classification failed: ' + envelope.safeError);
            return { classified: false };
        }

        var data = envelope.data;
        var mappedType = this._mapClaudeDocumentType(data.document_type);

        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        intake.get(intakeSysId);
        intake.setValue('document_type', mappedType);
        intake.setValue('classification_confidence', data.confidence);
        intake.setValue('classification_reason', data.reason || '');
        intake.setValue('claude_request_id', envelope.requestId || intake.getValue('claude_request_id'));
        intake.update();

        var threshold = this.claudeClient.confidenceThreshold();
        if (mappedType === 'unknown' || data.confidence < threshold) {
            this.sendToManualReview(intakeSysId,
                mappedType === 'unknown'
                    ? 'Claude could not confidently classify this document.'
                    : 'Classification confidence ' + data.confidence + ' is below the ' + threshold + ' review threshold.');
            return { classified: true, documentType: mappedType, requiresReview: true };
        }

        return { classified: true, documentType: mappedType };
    },

    _mapClaudeDocumentType: function(claudeType) {
        var map = {
            AP_INVOICE: 'ap_invoice',
            AR_PAYMENT_ADVICE: 'ar_payment_advice',
            AR_REMITTANCE: 'ar_remittance',
            UNKNOWN: 'unknown',
        };
        return map[claudeType] || 'unknown';
    },

    // ==== Phase 4/5 — AP invoice document extraction + transaction creation

    processApInvoiceDocument: function(intakeSysId) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) return { error: 'Finance Intake record not found' };

        var apInvoiceSysId = intake.getValue('ap_invoice');
        if (apInvoiceSysId) {
            // A transaction already exists from a prior attempt — resume its
            // own pipeline rather than creating a second invoice.
            return this._resumeApInvoicePipeline(intakeSysId, apInvoiceSysId);
        }

        this._setStatus(intakeSysId, 'extracting', 'Extracting AP invoice fields from the attached document.');
        var envelope = this.claudeClient.extractApInvoiceDocument(intakeSysId);
        if (!envelope.ok) {
            return this._fail(intakeSysId, 'AP invoice extraction failed: ' + envelope.safeError);
        }

        var data = envelope.data;
        intake.setValue('extraction_json', JSON.stringify(data));
        intake.setValue('extraction_confidence', data.confidence);
        intake.setValue('claude_request_id', envelope.requestId || intake.getValue('claude_request_id'));
        intake.update();

        var threshold = this.claudeClient.confidenceThreshold();
        if (data.confidence < threshold) {
            this.sendToManualReview(intakeSysId, 'Extraction confidence ' + data.confidence + ' is below the ' + threshold + ' review threshold.');
            return { requiresReview: true };
        }

        var vendorResolution = this.resolveVendor(data.vendor_code, data.vendor_name);
        if (!vendorResolution.resolved) {
            this.sendToManualReview(intakeSysId, 'Vendor could not be resolved: ' + vendorResolution.reason);
            return { requiresReview: true };
        }

        var poResolution = data.po_number ? this.resolvePurchaseOrder(data.po_number) : { resolved: false };
        if (data.po_number && !poResolution.resolved) {
            // A PO was stated on the invoice but couldn't be resolved — do
            // not silently drop it and proceed as if there were none; a
            // human needs to see why the PO reference didn't resolve.
            this.sendToManualReview(intakeSysId, 'PO number "' + data.po_number + '" was extracted but could not be resolved to an existing Purchase Order.');
            return { requiresReview: true };
        }

        var intakeResult = this.apService.intakeInvoice({
            correlationId: intake.getValue('correlation_id') || undefined,
            invoiceNumber: data.invoice_number,
            vendor: vendorResolution.vendorSysId,
            companyCode: data.company_code || intake.getValue('company_code') || '',
            currency: data.currency,
            invoiceDate: data.invoice_date || undefined,
            purchaseOrder: poResolution.resolved ? poResolution.poSysId : undefined,
            grossAmount: data.gross_amount,
            taxAmount: data.tax_amount,
            netAmount: data.net_amount,
            source: 'workspace_upload',
            externalReference: intake.getValue('source_reference') || undefined,
        });
        apInvoiceSysId = intakeResult.apInvoiceSysId;

        intake.setValue('ap_invoice', apInvoiceSysId);
        intake.setValue('correlation_id', intakeResult.correlationId);
        intake.setValue('company_code', data.company_code || '');
        intake.setValue('currency', data.currency || '');
        intake.setValue('processing_status', 'processing');
        intake.update();

        this.auditEngine.logEvent({
            correlationId: intakeResult.correlationId,
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intakeSysId,
            eventType: 'state_transition',
            actorType: 'system',
            description: 'Finance Document Intake created AP Invoice ' + data.invoice_number + ' from the uploaded document (vendor resolved by ' + vendorResolution.method + ').',
            afterValue: { ap_invoice: apInvoiceSysId },
        });

        // AP Extraction evidence row (Phase 5 item 9) — same table/shape the
        // existing JSON-context extraction path already writes to, so the
        // AP Invoice form's existing related list shows it identically.
        var extraction = new GlideRecord('x_695068_bcfa_ap_extraction');
        extraction.initialize();
        extraction.setValue('ap_invoice', apInvoiceSysId);
        extraction.setValue('extracted_fields', JSON.stringify(data));
        extraction.setValue('confidence', data.confidence);
        extraction.setValue('source', 'claude_document_intelligence');
        extraction.setValue('requires_review', false);
        extraction.insert();

        var invoiceForConfidence = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (invoiceForConfidence.get(apInvoiceSysId)) {
            invoiceForConfidence.setValue('extraction_confidence', data.confidence);
            invoiceForConfidence.update();
        }

        // Create + resolve AP Invoice Lines (Phase 5 items 5-8).
        var lines = data.lines || [];
        for (var i = 0; i < lines.length; i++) {
            var extractedLine = lines[i];
            var poLineSysId = null;
            var receiptSysId = null;
            if (poResolution.resolved) {
                var lineResolution = this.lineResolver.resolvePoLine(poResolution.poSysId, extractedLine);
                if (lineResolution.resolved) {
                    poLineSysId = lineResolution.poLineSysId;
                    var receiptResolution = this.lineResolver.resolveReceipt(poLineSysId);
                    if (receiptResolution.resolved) receiptSysId = receiptResolution.receiptSysId;
                }
            }
            this.apService.attachInvoiceLine(apInvoiceSysId, {
                lineNumber: extractedLine.line_number || (i + 1),
                materialOrService: extractedLine.description || '',
                quantity: extractedLine.quantity || 0,
                unit: extractedLine.unit || '',
                unitPrice: extractedLine.unit_price || 0,
                tax: extractedLine.tax_amount || 0,
                amount: extractedLine.net_amount || 0,
                poLine: poLineSysId,
                receiptReference: receiptSysId,
            });
        }

        return this._resumeApInvoicePipeline(intakeSysId, apInvoiceSysId);
    },

    // Runs (or re-runs) the EXISTING deterministic AP pipeline against an
    // already-created AP Invoice. Only ever calls the public
    // ApDomainService methods — validate/match/requestApproval — never
    // touches approval_state/posting_state/state directly, and never calls
    // ApprovalEngine or IntegrationService.
    _resumeApInvoicePipeline: function(intakeSysId, apInvoiceSysId) {
        var validation = this.apService.validateInvoice(apInvoiceSysId);
        if (!validation.validated) {
            this._setStatus(intakeSysId, 'completed', 'AP Invoice created; deterministic validation raised a ' + validation.reasonCode + ' exception — see the AP Invoice for analyst review.');
            return { stoppedAt: 'VALIDATION_EXCEPTION', apInvoiceSysId: apInvoiceSysId, detail: validation };
        }

        var match = this.apService.matchInvoice(apInvoiceSysId);
        if (!match.matched) {
            this._setStatus(intakeSysId, 'completed', 'AP Invoice created; deterministic 3-way match raised a ' + match.reasonCode + ' exception — see the AP Invoice for analyst review.');
            return { stoppedAt: 'MATCH_EXCEPTION', apInvoiceSysId: apInvoiceSysId, detail: match };
        }

        var approval = this.apService.requestApproval(apInvoiceSysId, gs.getUserID());
        this._setStatus(intakeSysId, 'completed', 'AP Invoice matched and pending approval.');
        return { stoppedAt: 'PENDING_APPROVAL', apInvoiceSysId: apInvoiceSysId, detail: approval };
    },

    // ==== Deterministic master-data resolvers (never guess ambiguity) ======

    resolveVendor: function(vendorCode, vendorName) {
        if (vendorCode) {
            var byCode = new GlideRecord('x_695068_bcfa_vendor');
            byCode.addQuery('vendor_code', vendorCode);
            byCode.addQuery('active', true);
            byCode.query();
            if (byCode.next()) {
                return { resolved: true, vendorSysId: byCode.getUniqueValue(), method: 'vendor_code' };
            }
        }
        if (vendorName) {
            var byName = new GlideRecord('x_695068_bcfa_vendor');
            byName.addQuery('name', vendorName);
            byName.addQuery('active', true);
            byName.query();
            if (byName.getRowCount() === 1) {
                byName.next();
                return { resolved: true, vendorSysId: byName.getUniqueValue(), method: 'exact_name' };
            }
        }
        return { resolved: false, reason: 'No unique active vendor match for code "' + (vendorCode || '') + '" / name "' + (vendorName || '') + '".' };
    },

    resolvePurchaseOrder: function(poNumber) {
        if (!poNumber) return { resolved: false, reason: 'No PO number supplied.' };
        var po = new GlideRecord('x_695068_bcfa_purchase_order');
        po.addQuery('po_number', poNumber);
        po.query();
        if (po.next()) {
            return { resolved: true, poSysId: po.getUniqueValue() };
        }
        return { resolved: false, reason: 'No Purchase Order found with number "' + poNumber + '".' };
    },

    // Tries an exact customer_code match first (strongest deterministic
    // signal, mirroring resolveVendor's vendor_code-first cascade); falls
    // back to the EXISTING MatchingEngine.resolveCustomerByAlias, which
    // already implements alias-table-then-exact-name resolution — reused
    // rather than duplicated.
    resolveCustomer: function(customerCode, customerName) {
        if (customerCode) {
            var byCode = new GlideRecord('x_695068_bcfa_customer');
            byCode.addQuery('customer_code', customerCode);
            byCode.addQuery('active', true);
            byCode.query();
            if (byCode.next()) {
                return { resolved: true, customerSysId: byCode.getUniqueValue(), method: 'customer_code' };
            }
        }
        if (customerName) {
            var aliasResult = this.matchingEngine.resolveCustomerByAlias(customerName);
            if (aliasResult.resolved) {
                return { resolved: true, customerSysId: aliasResult.customerSysId, method: 'alias_or_exact_name', confidence: aliasResult.confidence };
            }
        }
        return { resolved: false, reason: 'No unique active customer match for code "' + (customerCode || '') + '" / name "' + (customerName || '') + '".' };
    },

    // ==== Phase 7/8 — AR payment advice extraction + transaction creation ==

    processArPaymentAdviceDocument: function(intakeSysId) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) return { error: 'Finance Intake record not found' };

        var paymentSysId = intake.getValue('payment');
        if (paymentSysId) {
            return this._resumePaymentPipeline(intakeSysId, paymentSysId);
        }

        this._setStatus(intakeSysId, 'extracting', 'Extracting AR payment advice fields from the attached document.');
        var envelope = this.claudeClient.extractArPaymentAdviceDocument(intakeSysId);
        if (!envelope.ok) {
            return this._fail(intakeSysId, 'AR payment advice extraction failed: ' + envelope.safeError);
        }

        var data = envelope.data;
        intake.setValue('extraction_json', JSON.stringify(data));
        intake.setValue('extraction_confidence', data.confidence);
        intake.setValue('claude_request_id', envelope.requestId || intake.getValue('claude_request_id'));
        intake.update();

        var threshold = this.claudeClient.confidenceThreshold();
        if (data.confidence < threshold) {
            this.sendToManualReview(intakeSysId, 'Extraction confidence ' + data.confidence + ' is below the ' + threshold + ' review threshold.');
            return { requiresReview: true };
        }

        // Deterministic resolution attempt up front; if it fails, the raw
        // customer name is still passed through to ArDomainService.resolveCustomer
        // below (Phase 8 step 3), which has its own alias/exact-name logic
        // and customer_ambiguous exception path — not duplicated here.
        var customerResolution = this.resolveCustomer(data.customer_code, data.customer_name);

        var paymentIntake = this.arService.intakePayment({
            correlationId: intake.getValue('correlation_id') || undefined,
            bankReference: data.bank_reference,
            valueDate: data.value_date || undefined,
            customer: customerResolution.resolved ? customerResolution.customerSysId : undefined,
            currency: data.currency,
            amount: data.amount,
            source: 'workspace_upload',
        });
        paymentSysId = paymentIntake.paymentSysId;

        intake.setValue('payment', paymentSysId);
        intake.setValue('correlation_id', paymentIntake.correlationId);
        intake.setValue('currency', data.currency || '');
        intake.setValue('processing_status', 'processing');
        intake.update();

        this.auditEngine.logEvent({
            correlationId: paymentIntake.correlationId,
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intakeSysId,
            eventType: 'state_transition',
            actorType: 'system',
            description: 'Finance Document Intake created Payment ' + data.bank_reference + ' from the uploaded document.',
            afterValue: { payment: paymentSysId },
        });

        if (data.remittance_reference) {
            this.arService.intakeRemittance(paymentSysId, {
                remittanceReference: data.remittance_reference,
                source: 'workspace_upload',
            });
        }

        return this._resumePaymentPipeline(intakeSysId, paymentSysId, data.customer_name);
    },

    // Runs (or re-runs) the EXISTING deterministic AR pipeline against an
    // already-created Payment. Only ever calls the public ArDomainService
    // methods — never touches state directly, never calls ApprovalEngine or
    // IntegrationService.
    _resumePaymentPipeline: function(intakeSysId, paymentSysId, candidateCustomerName) {
        var normalization = this.arService.normalizePayment(paymentSysId);
        if (!normalization.normalized) {
            this._setStatus(intakeSysId, 'completed', 'Payment created; normalization raised an exception — see the Payment for analyst review.');
            return { stoppedAt: 'NORMALIZATION_EXCEPTION', paymentSysId: paymentSysId, detail: normalization };
        }

        var customer = this.arService.resolveCustomer(paymentSysId, candidateCustomerName);
        if (!customer.resolved) {
            this._setStatus(intakeSysId, 'completed', 'Payment created; customer resolution raised a customer_ambiguous exception — see the Payment for analyst review.');
            return { stoppedAt: 'CUSTOMER_RESOLUTION_EXCEPTION', paymentSysId: paymentSysId, detail: customer };
        }

        var match = this.arService.matchPayment(paymentSysId);
        if (!match.matched) {
            this._setStatus(intakeSysId, 'completed', 'Payment created; matching raised an unmatched exception — see the Payment for analyst review.');
            return { stoppedAt: 'MATCH_EXCEPTION', paymentSysId: paymentSysId, detail: match };
        }

        var allocation = this.arService.allocatePayment(paymentSysId);
        if (!allocation.balanced) {
            this._setStatus(intakeSysId, 'completed', 'Payment created and matched; allocation raised a ' + (allocation.reasonCode || 'balance') + ' exception — see the Payment for analyst review.');
            return { stoppedAt: 'ALLOCATION_EXCEPTION', paymentSysId: paymentSysId, detail: allocation };
        }

        var approval = this.arService.requestApproval(paymentSysId, gs.getUserID());
        this._setStatus(intakeSysId, 'completed', 'Payment matched, allocated, and pending approval.');
        return { stoppedAt: 'PENDING_APPROVAL', paymentSysId: paymentSysId, detail: approval };
    },

    // ==== Phase 7/8 — AR remittance extraction + payment correlation =======

    processArRemittanceDocument: function(intakeSysId) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) return { error: 'Finance Intake record not found' };

        if (intake.getValue('remittance')) {
            var linkedPayment = intake.getValue('payment');
            return linkedPayment ? this._resumePaymentPipeline(intakeSysId, linkedPayment) : { stoppedAt: 'ALREADY_LINKED' };
        }

        this._setStatus(intakeSysId, 'extracting', 'Extracting AR remittance fields from the attached document.');
        var envelope = this.claudeClient.extractArRemittanceDocument(intakeSysId);
        if (!envelope.ok) {
            return this._fail(intakeSysId, 'AR remittance extraction failed: ' + envelope.safeError);
        }

        var data = envelope.data;
        intake.setValue('extraction_json', JSON.stringify(data));
        intake.setValue('extraction_confidence', data.confidence);
        intake.setValue('claude_request_id', envelope.requestId || intake.getValue('claude_request_id'));
        intake.update();

        var threshold = this.claudeClient.confidenceThreshold();
        if (data.confidence < threshold) {
            this.sendToManualReview(intakeSysId, 'Extraction confidence ' + data.confidence + ' is below the ' + threshold + ' review threshold.');
            return { requiresReview: true };
        }

        // --- Correlate to an existing Payment (Phase 8 steps 2-4) ---
        var found = this._findPaymentByReference(data.payment_reference) || this._findPaymentByReference(data.customer_code);
        if (!found) {
            var candidates = this.findCandidatePayments({
                amount: data.payment_amount,
                currency: data.currency,
                customerName: data.customer_name,
                customerCode: data.customer_code,
                date: data.payment_date,
            });
            if (candidates.length !== 1) {
                // Zero or multiple candidates — never auto-link an ambiguous
                // match. Persist the candidate list alongside Claude's own
                // result so a reviewer can pick, then stop.
                intake.setValue('extraction_json', JSON.stringify({ claude: data, candidatePaymentSysIds: candidates }));
                intake.update();
                this.sendToManualReview(intakeSysId,
                    candidates.length === 0
                        ? 'No existing Payment reference matched "' + (data.payment_reference || '') + '", and no unambiguous candidate was found by amount/currency/customer/date.'
                        : candidates.length + ' possible Payments found by amount/currency/customer/date — none is an exact reference match, so none was linked automatically.');
                return { requiresReview: true, candidates: candidates };
            }
            found = candidates[0];
        }

        var remittanceIntake = this.arService.intakeRemittance(found, {
            remittanceReference: data.payment_reference || '',
            source: 'workspace_upload',
            receivedDate: data.payment_date || undefined,
        });

        intake.setValue('remittance', remittanceIntake.remittanceSysId);
        intake.setValue('payment', found);
        intake.setValue('processing_status', 'processing');
        intake.update();

        this.auditEngine.logEvent({
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intakeSysId,
            eventType: 'state_transition',
            actorType: 'system',
            description: 'Finance Document Intake linked Remittance to Payment ' + found + ' from the uploaded document.',
            afterValue: { remittance: remittanceIntake.remittanceSysId, payment: found },
        });

        // Re-run the matching/allocation portion of the EXISTING pipeline
        // now that a remittance is attached.
        return this._resumePaymentPipeline(intakeSysId, found, data.customer_name);
    },

    _findPaymentByReference: function(reference) {
        if (!reference) return null;
        var gr = new GlideRecord('x_695068_bcfa_payment');
        gr.addQuery('bank_reference', reference);
        gr.query();
        if (gr.getRowCount() === 1) {
            gr.next();
            return gr.getUniqueValue();
        }
        return null;
    },

    // Phase 8 rule 3 — suggest possible payments by amount + currency +
    // customer + a +/-5-day date window, when an exact reference match
    // isn't available. Deliberately conservative: returns the raw candidate
    // list and NEVER picks a winner itself — ambiguity (0 or >1 results) is
    // always surfaced to a human (Safety Rules: never silently resolve
    // ambiguous master data).
    findCandidatePayments: function(criteria) {
        criteria = criteria || {};
        var customerResolution = this.resolveCustomer(criteria.customerCode, criteria.customerName);
        var gr = new GlideRecord('x_695068_bcfa_payment');
        if (criteria.amount !== undefined && criteria.amount !== null && criteria.amount !== '') gr.addQuery('amount', criteria.amount);
        if (criteria.currency) gr.addQuery('currency', criteria.currency);
        if (customerResolution.resolved) gr.addQuery('customer', customerResolution.customerSysId);
        if (criteria.date) {
            var from = new GlideDateTime(criteria.date + ' 00:00:00');
            from.addDaysUTC(-5);
            var to = new GlideDateTime(criteria.date + ' 00:00:00');
            to.addDaysUTC(5);
            gr.addQuery('value_date', '>=', from);
            gr.addQuery('value_date', '<=', to);
        }
        gr.query();
        var results = [];
        while (gr.next()) results.push(gr.getUniqueValue());
        return results;
    },

    // ==== Phase 6/UI action backing =========================================

    sendToManualReview: function(intakeSysId, reason) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (intake.get(intakeSysId)) {
            intake.setValue('processing_status', 'review_required');
            intake.setValue('requires_review', true);
            intake.setValue('processing_error', reason || '');
            intake.update();
        }
        this.auditEngine.logEvent({
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intakeSysId,
            eventType: 'exception_created',
            actorType: 'system',
            description: 'Routed to manual review: ' + (reason || ''),
        });
        return { requiresReview: true, reason: reason };
    },

    // ==== Phase 10 — idempotency / duplicate intake =========================

    // Reads the hash the platform already computed for the attachment at
    // upload time (sys_attachment.hash) rather than recomputing one — no
    // need to read/decode the attachment content at all for this, and it
    // sidesteps any uncertainty about which digest API/signature is valid
    // to call from a scoped script (confirmed live: an earlier version of
    // this method called GlideDigest directly and silently prevented the
    // entire processDocument() pipeline from running — a thrown exception
    // this early aborted before even the first audit event could be
    // logged, with no error surfaced back through the UI Action REST call).
    computeAttachmentHash: function(intakeSysId) {
        var attachment = new GlideRecord('sys_attachment');
        attachment.addQuery('table_name', 'x_695068_bcfa_finance_intake');
        attachment.addQuery('table_sys_id', intakeSysId);
        attachment.orderByDesc('sys_created_on');
        attachment.setLimit(1);
        attachment.query();
        if (!attachment.next()) return null;

        return attachment.getValue('hash') || null;
    },

    _findDuplicateIntake: function(intakeSysId, hash, sourceReference) {
        var gr = new GlideRecord('x_695068_bcfa_finance_intake');
        gr.addQuery('sys_id', '!=', intakeSysId);
        if (hash) {
            gr.addQuery('attachment_hash', hash);
        } else if (sourceReference) {
            gr.addQuery('source_reference', sourceReference);
        } else {
            return null;
        }
        gr.addQuery('processing_status', 'IN', 'completed,processing,review_required,extracting,classifying');
        gr.orderBy('sys_created_on');
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    },

    // ==== Internal status/audit helpers =====================================

    _setStatus: function(intakeSysId, status, description) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) return false;
        var previous = intake.getValue('processing_status');
        intake.setValue('processing_status', status);
        intake.update();
        this.auditEngine.logEvent({
            correlationId: intake.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intakeSysId,
            eventType: 'state_transition',
            actorType: 'system',
            description: description || ('Finance Intake ' + previous + ' -> ' + status),
            beforeValue: { processing_status: previous },
            afterValue: { processing_status: status },
        });
        return true;
    },

    _fail: function(intakeSysId, message) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (intake.get(intakeSysId)) {
            intake.setValue('processing_status', 'failed');
            intake.setValue('processing_error', message);
            intake.update();
        }
        this.auditEngine.logEvent({
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intakeSysId,
            eventType: 'exception_created',
            actorType: 'system',
            description: message,
        });
        return { ok: false, failed: true, safeError: message };
    },

    type: 'FinanceDocumentIntakeService',
};
