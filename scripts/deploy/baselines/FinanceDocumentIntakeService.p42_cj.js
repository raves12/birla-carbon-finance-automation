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

FinanceDocumentIntakeService.MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
FinanceDocumentIntakeService.ATTACHMENT_REQUIRED ='Attachment required: attach the document (PDF, PNG or JPEG) to this intake, then process it. Nothing was processed.';
FinanceDocumentIntakeService.prototype = {
    initialize: function() {
        this.apService = new ApDomainService();
        this.arService = new ArDomainService();
        this.matchingEngine = new MatchingEngine();
        this.lineResolver = new ApLineResolutionService();
        this.auditEngine = new AuditEngine();
        this.policy = new FinancePolicy();
        this.extraction = new DocumentExtractionService();
    },

    // ==== Entry point (backs "Process Document" / "Reprocess") ============

    // Idempotent re-entry: resumes from wherever this intake record already
    // is, rather than assuming a fresh start. Safe to click more than once.
    // Wrapped in try/catch as a last-resort safety net: an uncaught
    // exception anywhere in this pipeline previously left the record stuck
    // silently at whatever status it last reached, with no error visible
    // anywhere (confirmed live) — this guarantees processing_status ends
    // at 'failed' with a safe_error instead, however the underlying cause.
    processDocument: function(intakeSysId) {
        var result;
        try {
            result = this._processDocumentInner(intakeSysId);
        } catch (e) {
            return this._fail(intakeSysId, 'Unexpected error: ' + (e && e.message ? e.message : String(e)));
        }
        // Phase 41, defect 1: duplicates of this intake show its transaction.
        this._syncDuplicates(intakeSysId);
        return result;
    },

    _processDocumentInner: function(intakeSysId) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) {
            return { error: 'Finance Intake record not found: ' + intakeSysId };
        }

        // Phase 41, defect 3: an intake without a document stays a draft. No
        // extraction call, no transaction, no exception: only a clear message.
        if (!this._hasAttachment(intakeSysId)) {
            intake.setValue('processing_error', FinanceDocumentIntakeService.ATTACHMENT_REQUIRED);
            intake.update();
            return { attachmentRequired: true, error: FinanceDocumentIntakeService.ATTACHMENT_REQUIRED };
        }

        // Phase 41 (client pack, LARGE-DOC): Document Intelligence accepts at
        // most 4 MB per file. A larger file (e.g. a 13-page package of scans)
        // goes to review with a clear instruction instead of failing inside
        // extraction. Nothing is extracted.
        var size = this._attachmentSize(intakeSysId);
        if (size > FinanceDocumentIntakeService.MAX_DOCUMENT_BYTES) {
            return this.sendToManualReview(intakeSysId, 'The document is ' + Math.round(size / 104857.6) / 10 + ' MB; native extraction accepts up to 4 MB per file. ' +
                'Upload the invoice pages only (the supporting PO / GRN pages can be attached separately as evidence), then process it again.');
        }

        // Phase 41, defect 2: a new attempt starts clean. The previous error
        // stays in the audit trail (written when it was raised) and is
        // repeated in this event; a new error is written only if this attempt
        // fails. Not while extraction is pending (the poller re-enters).
        var previousError = intake.getValue('processing_error');
        if (previousError && intake.getValue('processing_status') !== 'extracting') {
            intake.setValue('processing_error', '');
            intake.update();
            this.auditEngine.logEvent({
                correlationId: intake.getValue('correlation_id'),
                sourceTable: 'x_695068_bcfa_finance_intake',
                sourceRecord: intakeSysId,
                eventType: 'rule_evaluated',
                actorType: 'system',
                description: 'Processing ' + intake.getValue('number') + ' again: the previous processing error is cleared for this attempt (kept in the audit trail).',
                beforeValue: { processing_error: previousError, processing_status: intake.getValue('processing_status') }
            });
        }

        // Phase 10 — duplicate-intake guard, before anything else runs.
        var hash = this.computeAttachmentHash(intakeSysId);
        // A new (or replaced) document: first processing, or a new hash.
        var newDocument = hash ? intake.getValue('attachment_hash') !== hash : intake.getValue('processing_status') === 'new';
        if (hash && intake.getValue('attachment_hash') !== hash) {
            intake.setValue('attachment_hash', hash);
            intake.update();
        }
        if (newDocument) this._auditUpload(intake, hash);
        if (hash) {
            var duplicate = this._findDuplicateIntake(intakeSysId, hash, intake.getValue('source_reference'));
            if (duplicate) {
                intake.setValue('duplicate_of', duplicate.getUniqueValue());
                if (duplicate.getValue('ap_invoice')) intake.setValue('ap_invoice', duplicate.getValue('ap_invoice'));
                if (duplicate.getValue('payment')) intake.setValue('payment', duplicate.getValue('payment'));
                if (duplicate.getValue('remittance')) intake.setValue('remittance', duplicate.getValue('remittance'));
                intake.setValue('processing_status', 'completed');
                intake.setValue('processing_error', 'Duplicate of ' + duplicate.getValue('number') + ' — reusing its result, no new transaction created.');
                intake.update();
                this.auditEngine.logEvent({
                    sourceTable: 'x_695068_bcfa_finance_intake',
                    sourceRecord: intakeSysId,
                    eventType: 'rule_evaluated',
                    actorType: 'system',
                    reason: 'Duplicate intake: same attachment hash as ' + duplicate.getValue('number'),
                    description: 'Duplicate intake detected (attachment_hash match) — reused ' + duplicate.getValue('number') + ' instead of creating a new transaction.',
                });
                return { duplicate: true, originalIntakeSysId: duplicate.getUniqueValue() };
            }
        }

        var status = intake.getValue('processing_status');
        var documentType = intake.getValue('document_type');

        if (status === 'review_required') {
            if (documentType && documentType !== 'unknown') {
                this.auditEngine.logEvent({
                    correlationId: intake.getValue('correlation_id'),
                    sourceTable: 'x_695068_bcfa_finance_intake',
                    sourceRecord: intakeSysId,
                    eventType: 'human_review',
                    actorType: 'user',
                    reason: intake.getValue('processing_error') || 'Manual review',
                    description: 'Reviewed intake ' + intake.getValue('number') + ' released for processing as ' + intake.getDisplayValue('document_type') + '.',
                    beforeValue: { processing_status: 'review_required' },
                    afterValue: { document_type: documentType }
                });
                return this._dispatchByDocumentType(intakeSysId, documentType);
            }
            return { requiresReview: true, reason: 'document_type is still unknown — set it manually, then run Process Document again.' };
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
        if (documentType === 'goods_receipt') return this.processGoodsReceiptDocument(intakeSysId);
        this.sendToManualReview(intakeSysId, 'Unrecognized document_type: ' + documentType);
        return { requiresReview: true };
    },

    // ==== Phase 3 — Classification ==========================================

    // The document type chosen at upload is used as is (automatic document
    // classification is not configured; the native use cases extract, they
    // do not classify). Without one, the document goes to manual review;
    // nothing guesses.
    // (Model classification with Claude was removed in Phase 34.)
    classifyFinanceDocument: function(intakeSysId) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        intake.get(intakeSysId);
        var preset = intake.getValue('document_type');
        if (preset && preset !== 'unknown') {
            intake.setValue('classification_reason', 'Document type set at upload. Automatic document classification is not configured.');
            intake.update();
            return { classified: true, documentType: preset };
        }
        this.sendToManualReview(intakeSysId, 'Set the document type (AP invoice, payment advice or remittance), then process the document again. Automatic document classification is not configured.');
        return { classified: true, documentType: 'unknown', requiresReview: true };
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

        var envelope = this._extract(intakeSysId, 'ap', 'AP invoice');
        if (!envelope.ok) return envelope.pending ? { pending: true, taskId: envelope.taskId } : { requiresReview: true };
        var extractionSource = envelope.source;

        var data = envelope.data;
        // Phase 42: a supplier tax ID equal to the buyer's tax ID on the same
        // document is a misreading (seen on Chinese VAT e-invoices: the buyer
        // block's ID read into the seller field). Kept as read, not used.
        if (data.vendor_tax_id && data.buyer_tax_id &&
            this.matchingEngine.canonicalText(data.vendor_tax_id).replace(/ /g, '') === this.matchingEngine.canonicalText(data.buyer_tax_id).replace(/ /g, '')) {
            data.vendor_tax_id_as_read = data.vendor_tax_id;
            data.vendor_tax_id = '';
            data.warnings = (data.warnings || []).concat(['Supplier tax ID read equals the buyer tax ID (' + data.vendor_tax_id_as_read + '); not used to identify the vendor.']);
        }
        intake.setValue('extraction_json', JSON.stringify(data));
        intake.setValue('extraction_summary', new FinanceTextFormat().extractionSummary(data, 'ap'));
        this._auditExtraction(intake, data, envelope);
        intake.setValue('extraction_confidence', data.confidence);
        this._recordReadingEvidence(intake, data);
        intake.update();

        // Only the quality of the READING decides here. A document that was
        // not read well enough (low confidence: a critical field is missing)
        // goes to a person; nothing is created from a poor reading.
        var threshold = this.policy.extractionConfidenceThreshold();
        if (data.confidence < threshold) {
            this.sendToManualReview(intakeSysId, 'Extraction confidence ' + data.confidence + ' is below the ' + threshold + ' review threshold.' +
                (data.warnings && data.warnings.length ? ' ' + data.warnings.join(' ') : '') +
                (data.reader_script_check ? ' ' + data.reader_script_check + ' If the document is written in a script missing from that count (for example Chinese), ' +
                    (intake.getValue('document_language_hint') === 'zh_hans' ? 'the platform reading lost it before extraction; enter the values from the document.' :
                        'set Document Language Hint to Chinese (Simplified) and process the document again (CJ OCR model).') : ''));
            return { requiresReview: true };
        }

        // Phase 41: an invoice issued BY a group company is an outgoing sales
        // invoice (an AR open item), not a vendor invoice (client samples
        // Sika / Linglong). Never processed as AP.
        if (this.policy.isOwnCompany(data.vendor_name)) {
            this.sendToManualReview(intakeSysId, 'The seller on this document ("' + data.vendor_name + '") is a group company: this is an outgoing sales invoice, not a vendor invoice. ' +
                'It was not processed as an AP invoice; route it to AR / billing if needed.');
            return { requiresReview: true, outgoingInvoice: true };
        }

        // A good reading always becomes an AP invoice. Vendor and PO are
        // linked when they resolve to master data; when they do not, the
        // printed values are kept on the invoice and validation raises the
        // exception (vendor invalid, PO mismatch, totals not reconciled), so
        // the reviewer works on the invoice, not on the intake.
        // Phase 42: code, tax registration, PO vendor, alias, Unicode name.
        var vendorResolution = this.resolveVendor(data.vendor_code, data.vendor_name, { taxId: data.vendor_tax_id, buyerTaxId: data.buyer_tax_id, poNumber: data.po_number });
        var poResolution = data.po_number ? this.resolvePurchaseOrder(data.po_number) : { resolved: false };

        var intakeResult = this.apService.intakeInvoice({
            correlationId: intake.getValue('correlation_id') || undefined,
            invoiceNumber: data.invoice_number,
            vendor: vendorResolution.resolved ? vendorResolution.vendorSysId : undefined,
            printedVendorName: data.vendor_name || '',
            printedVendorCode: data.vendor_code || '',
            printedVendorTaxId: data.vendor_tax_id || '',
            printedPoNumber: data.po_number || '',
            companyCode: data.company_code || intake.getValue('company_code') || '',
            currency: data.currency,
            invoiceDate: data.invoice_date || undefined,
            purchaseOrder: poResolution.resolved ? poResolution.poSysId : undefined,
            grossAmount: data.gross_amount,
            taxAmount: data.tax_amount,
            netAmount: data.net_amount,
            source: 'workspace_upload',
            externalReference: intake.getValue('source_reference') || undefined,
            taxBreakdown: { taxType: data.tax_type, ratePct: data.tax_rate_pct, cgst: data.cgst_amount, sgst: data.sgst_amount,
                igst: data.igst_amount, vat: data.vat_amount, wht: data.wht_amount, whtRatePct: data.wht_rate_pct },
            documentCountry: data.vendor_country || '',
            documentLanguage: data.document_language || '',
            extractionProvider: envelope.provider,
        });
        apInvoiceSysId = intakeResult.apInvoiceSysId;

        intake.setValue('ap_invoice', apInvoiceSysId);
        intake.setValue('correlation_id', intakeResult.correlationId);
        new AiInteractionLog().linkCorrelation(intakeSysId, intakeResult.correlationId);
        intake.setValue('company_code', data.company_code || '');
        intake.setValue('currency', data.currency || '');
        intake.setValue('processing_status', 'processing');
        intake.update();

        this.auditEngine.logEvent({
            correlationId: intakeResult.correlationId,
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intakeSysId,
            eventType: 'record_created',
            actorType: 'system',
            description: 'Finance Document Intake created AP Invoice ' + data.invoice_number + ' from the uploaded document (' +
                (vendorResolution.resolved ? 'vendor resolved by ' + vendorResolution.method : 'vendor "' + (data.vendor_name || data.vendor_code || '') + '" not in vendor master: validation decides') +
                (data.po_number ? (poResolution.resolved ? '; PO ' + data.po_number + ' linked' : '; PO ' + data.po_number + ' not found: validation decides') : '') + ').',
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
        extraction.setValue('source', extractionSource);
        extraction.setValue('requires_review', false);
        extraction.insert();

        var invoiceForConfidence = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (invoiceForConfidence.get(apInvoiceSysId)) {
            invoiceForConfidence.setValue('extraction_confidence', data.confidence);
            // Phase 41: charges, discount and the totals reconciliation.
            var rec = data.reconciliation || {};
            if (rec.charges) invoiceForConfidence.setValue('charges_amount', rec.charges);
            if (rec.discount) invoiceForConfidence.setValue('discount_amount', rec.discount);
            if (rec.result) invoiceForConfidence.setValue('amount_reconciliation', rec.result);
            if (rec.detail) invoiceForConfidence.setValue('amount_reconciliation_detail', String(rec.detail).substring(0, 1000));
            invoiceForConfidence.setValue('extraction_summary', new FinanceTextFormat().extractionSummary(data, 'ap'));
            // Phase 42: stamp / handwriting evidence as read (the requirement
            // and its validation run in validateInvoice).
            new DocumentEvidenceService().applyReadingToInvoice(invoiceForConfidence, data);
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
        // Phase 25: in flow mode the AP flows continue from the new invoice.
        if (!FinanceOrchestration.isInline()) {
            this._setStatus(intakeSysId, 'completed', 'AP Invoice created from the document; the AP flows continue (validation, matching, approval).');
            return { stoppedAt: 'RECEIVED', apInvoiceSysId: apInvoiceSysId, handedTo: 'AP Invoice Intake Flow' };
        }
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

        // Approval is determined by the configured rule (FinancePolicy); the
        // person processing the document is the requester, so a different
        // user must approve (segregation of duties).
        var approval = this.apService.routeForApproval(apInvoiceSysId, gs.getUserID());
        this._setStatus(intakeSysId, 'completed', approval.approvalRequired
            ? 'AP Invoice matched and pending approval. ' + approval.rule
            : 'AP Invoice matched and approved by configured rule. ' + approval.rule);
        return { stoppedAt: approval.approvalRequired ? 'PENDING_APPROVAL' : 'APPROVED_BY_RULE', apInvoiceSysId: apInvoiceSysId, detail: approval };
    },

    // ==== Deterministic master-data resolvers (never guess ambiguity) ======

    resolveVendor: function(vendorCode, vendorName, opts) {
        return this.matchingEngine.resolveVendor(vendorCode, vendorName, opts);
    },

    resolvePurchaseOrder: function(poNumber) {
        return this.matchingEngine.resolvePurchaseOrder(poNumber);
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

        // Phase 40: a customer payment advice is read like a remittance. The
        // cash itself comes from the bank statement (the Payment); the advice
        // is linked to that payment and supplies the invoice references,
        // amounts applied and any deduction statement. An advice never
        // creates a payment on its own.
        return this.processArRemittanceDocument(intakeSysId);
    },

    // Runs (or re-runs) the EXISTING deterministic AR pipeline against an
    // already-created Payment. Only ever calls the public ArDomainService
    // methods — never touches state directly, never calls ApprovalEngine or
    // IntegrationService.
    _resumePaymentPipeline: function(intakeSysId, paymentSysId, candidateCustomerName) {
        // Phase 25: in flow mode the AR flows continue (payment intake, or
        // remittance processing for an existing payment).
        if (!FinanceOrchestration.isInline()) {
            this._setStatus(intakeSysId, 'completed', 'Document processed; the AR flows continue (matching, allocation, approval).');
            return { stoppedAt: 'HANDED_TO_FLOWS', paymentSysId: paymentSysId, handedTo: 'AR flows' };
        }
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

        // Approval per the configured rule; the person processing the
        // document is the requester, so a different user must approve.
        var approval = this.arService.routeForApproval(paymentSysId, gs.getUserID());
        this._setStatus(intakeSysId, 'completed', approval.approvalRequired
            ? 'Payment matched, allocated (' + (allocation.candidateType || 'deterministic') + ' match) and pending approval. ' + approval.rule
            : 'Payment matched, allocated and approved by configured rule. ' + approval.rule);
        return { stoppedAt: approval.approvalRequired ? 'PENDING_APPROVAL' : 'APPROVED_BY_RULE', paymentSysId: paymentSysId, detail: approval, allocation: allocation };
    },

    // ==== Phase 7/8 — AR remittance extraction + payment correlation =======

    processArRemittanceDocument: function(intakeSysId) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) return { error: 'Finance Intake record not found' };

        if (intake.getValue('remittance')) {
            var linkedPayment = intake.getValue('payment');
            return linkedPayment ? this._resumePaymentPipeline(intakeSysId, linkedPayment) : { stoppedAt: 'ALREADY_LINKED' };
        }

        var envelope = this._extract(intakeSysId, 'ar', 'payment advice / remittance');
        if (!envelope.ok) return envelope.pending ? { pending: true, taskId: envelope.taskId } : { requiresReview: true };

        var data = envelope.data;
        intake.setValue('extraction_json', JSON.stringify(data));
        intake.setValue('extraction_summary', new FinanceTextFormat().extractionSummary(data, 'ar'));
        this._auditExtraction(intake, data, envelope);
        intake.setValue('extraction_confidence', data.confidence);
        this._recordReadingEvidence(intake, data);
        intake.update();

        var threshold = this.policy.extractionConfidenceThreshold();
        if (data.confidence < threshold) {
            this.sendToManualReview(intakeSysId, 'Extraction confidence ' + data.confidence + ' is below the ' + threshold + ' review threshold.' +
                (data.warnings && data.warnings.length ? ' ' + data.warnings.join(' ') : ''));
            return { requiresReview: true };
        }
        // Phase 41: gross - advance - TDS - deductions = paid per invoice, and
        // the amounts paid add up to the payment: a check of its own.
        if (data.reconciliation && data.reconciliation.result === 'not_reconciled') {
            this.sendToManualReview(intakeSysId, data.reconciliation.detail + ' (Extraction confidence ' + data.confidence + ' is not affected; a person checks the amounts.)');
            return { requiresReview: true };
        }

        // --- Correlate to an existing Payment (Phase 41, defect 8) ---
        var correlation = this.correlatePayment(data);
        if (!correlation.paymentSysId) {
            // Never auto-link on weak or conflicting evidence: the candidates
            // and the evidence for and against each are kept for the reviewer.
            intake.setValue('extraction_json', JSON.stringify({ extracted: data, correlation: correlation }));
            intake.update();
            this.sendToManualReview(intakeSysId, correlation.reason);
            return { requiresReview: true, correlation: correlation };
        }
        var found = correlation.paymentSysId;

        // A remittance only drives a payment that has not been processed
        // yet, or one waiting in EXCEPTION for exactly this information
        // (unmatched / customer_ambiguous / ambiguous_match, Phase 33); it
        // never reopens a matched, cleared or closed payment.
        var target = new GlideRecord('x_695068_bcfa_payment');
        target.get(found);
        var targetState = target.getValue('state');
        // Phase 41, defect 10: a payment without a lifecycle state (created
        // outside the bank-statement intake before the default existed) never
        // enters matching.
        if (!targetState) {
            this.sendToManualReview(intakeSysId, 'Payment ' + target.getValue('bank_reference') + ' has no lifecycle state (it was not created through the bank-statement intake), ' +
                'so the remittance was not applied. Check the payment (amount, currency, value date) and set it up through the bank-statement intake, then process this document again.');
            return { requiresReview: true, paymentSysId: found, paymentState: '' };
        }
        var retryable = targetState === 'EXCEPTION' && !!this.arService.findRetryableException(found);
        if (targetState !== 'RECEIVED' && targetState !== 'NORMALIZED' && !retryable) {
            this.sendToManualReview(intakeSysId, 'Payment ' + target.getValue('bank_reference') + ' is already ' + targetState +
                '; the remittance was not applied automatically. Review it against that payment.');
            return { requiresReview: true, paymentSysId: found, paymentState: targetState };
        }

        // The fields read from the document are stored on the remittance,
        // where MatchingEngine.resolveRemittanceReferences reads the
        // invoice references.
        var remittanceIntake = this.arService.intakeRemittance(found, {
            remittanceReference: data.payment_reference || '',
            source: 'document',
            receivedDate: data.payment_date || undefined,
            extractedFields: data,
            confidence: data.confidence,
            extractionProvider: envelope.provider,
        });

        intake.setValue('remittance', remittanceIntake.remittanceSysId);
        intake.setValue('payment', found);
        intake.setValue('processing_status', 'processing');
        intake.update();

        this.auditEngine.logEvent({
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intakeSysId,
            eventType: 'record_created',
            actorType: 'system',
            description: 'Finance Document Intake linked Remittance to Payment ' + found + ' from the uploaded document.',
            afterValue: { remittance: remittanceIntake.remittanceSysId, payment: found },
        });

        if (retryable) return this._retryPaymentWithRemittance(intakeSysId, found, remittanceIntake.remittanceSysId);

        // Re-run the matching/allocation portion of the EXISTING pipeline
        // now that a remittance is attached.
        return this._resumePaymentPipeline(intakeSysId, found, data.customer_name);
    },

    // Phase 33: the payment is in EXCEPTION waiting for its remittance. In
    // flow mode the AR Remittance Processing Flow (triggered by the new
    // remittance) retries; inline, it is retried here.
    _retryPaymentWithRemittance: function(intakeSysId, paymentSysId, remittanceSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        payment.get(paymentSysId);
        var bankRef = payment.getValue('bank_reference');
        if (!FinanceOrchestration.isInline()) {
            this._setStatus(intakeSysId, 'completed', 'Remittance linked to Payment ' + bankRef + ', which was waiting in exception; the AR Remittance Processing Flow identifies the customer and retries matching.');
            return { stoppedAt: 'HANDED_TO_FLOWS', paymentSysId: paymentSysId, handedTo: 'AR Remittance Processing Flow' };
        }
        var r = this.arService.retryWithRemittance(paymentSysId, remittanceSysId, gs.getUserID());
        if (!r.retried) {
            this._setStatus(intakeSysId, 'completed', 'Remittance linked to Payment ' + bankRef + '; ' + r.reason + '. The exception stays with the AR processor.');
            return { stoppedAt: 'EXCEPTION', paymentSysId: paymentSysId, detail: r };
        }
        payment.get(paymentSysId);
        this._setStatus(intakeSysId, 'completed', 'Remittance linked to Payment ' + bankRef + '; exception ' + r.exceptionNumber + ' resolved and matching retried. Payment is now ' + payment.getValue('state') + '.');
        return { stoppedAt: payment.getValue('state'), paymentSysId: paymentSysId, detail: r };
    },

    // Phase 41, defect 8: deterministic remittance-to-payment correlation.
    // Evidence, in precedence order: an exact payment / bank reference (UTR),
    // then currency, amount, customer, date. Returns { paymentSysId, basis,
    // candidates } when exactly one payment is supported and nothing
    // conflicts, else { reason, candidates } for a reviewer. Never links:
    //  - on a reference match whose currency, amount or customer conflicts;
    //  - on amount + currency alone (the customer must be resolved);
    //  - when more than one payment fits.
    // A payment of customer A never receives customer B's remittance.
    correlatePayment: function(data) {
        var customer = this.resolveCustomer(data.customer_code, data.customer_name);
        var adviceCustomer = customer.resolved ? customer.customerSysId : '';
        var self = this, candidates = [];
        var evidenceFor = function(pay) {
            var e = { paymentSysId: pay.getUniqueValue(), bankReference: pay.getValue('bank_reference'), state: pay.getValue('state'), supports: [], conflicts: [] };
            var ref = self._normRef(data.payment_reference);
            if (ref && self._normRef(pay.getValue('bank_reference')) === ref) e.supports.push('reference ' + data.payment_reference);
            if (data.currency && pay.getValue('currency')) {
                if (String(data.currency).toUpperCase() === String(pay.getValue('currency')).toUpperCase()) e.supports.push('currency ' + data.currency);
                else e.conflicts.push('currency: advice ' + data.currency + ', payment ' + pay.getValue('currency'));
            }
            if (data.payment_amount !== null && data.payment_amount !== undefined && data.payment_amount !== '' && pay.getValue('amount')) {
                if (Math.abs(parseFloat(data.payment_amount) - parseFloat(pay.getValue('amount'))) <= 0.01) e.supports.push('amount ' + data.payment_amount);
                else e.conflicts.push('amount: advice ' + data.payment_amount + ', payment ' + pay.getValue('amount'));
            }
            if (adviceCustomer && pay.getValue('customer')) {
                if (pay.getValue('customer') === adviceCustomer) e.supports.push('customer ' + pay.getDisplayValue('customer'));
                else e.conflicts.push('customer: advice ' + (data.customer_name || data.customer_code) + ', payment ' + pay.getDisplayValue('customer'));
            } else if (!adviceCustomer && data.customer_name) {
                e.conflicts.push('customer on the advice (' + data.customer_name + ') could not be resolved: ' + (customer.reason || 'not found'));
            }
            return e;
        };

        // 1. Exact payment / bank reference.
        var refPayments = this._paymentsByReference(data.payment_reference);
        if (refPayments.length) {
            for (var i = 0; i < refPayments.length; i++) candidates.push(evidenceFor(refPayments[i]));
            if (refPayments.length > 1) {
                return { reason: refPayments.length + ' payments carry the reference "' + data.payment_reference + '"; none was linked automatically.', candidates: candidates };
            }
            if (candidates[0].conflicts.length) {
                return { reason: 'Payment ' + candidates[0].bankReference + ' has the same reference but conflicting evidence (' + candidates[0].conflicts.join('; ') + '); not linked.', candidates: candidates };
            }
            return { paymentSysId: candidates[0].paymentSysId, basis: 'reference', candidates: candidates };
        }

        // 2. No reference match: amount + currency + date only together with
        //    a resolved customer, and only when exactly one payment fits.
        if (!adviceCustomer) {
            return { reason: 'No payment carries the reference "' + (data.payment_reference || '') + '" and the customer on the advice could not be resolved' +
                (customer.reason ? ' (' + customer.reason + ')' : '') + '; amount and currency alone are not enough to link a payment.', candidates: candidates };
        }
        var ids = this.findCandidatePayments({ amount: data.payment_amount, currency: data.currency, customerName: data.customer_name,
            customerCode: data.customer_code, date: data.payment_date });
        var pay = new GlideRecord('x_695068_bcfa_payment');
        for (var j = 0; j < ids.length; j++) {
            if (pay.get(ids[j])) candidates.push(evidenceFor(pay));
        }
        var clean = [];
        for (var k = 0; k < candidates.length; k++) if (!candidates[k].conflicts.length) clean.push(candidates[k]);
        if (clean.length === 1 && candidates.length === 1) return { paymentSysId: clean[0].paymentSysId, basis: 'customer + amount + currency + date', candidates: candidates };
        return { reason: candidates.length === 0
            ? 'No payment of ' + (data.customer_name || data.customer_code) + ' matches reference "' + (data.payment_reference || '') + '", amount ' + data.payment_amount + ' ' + (data.currency || '') + ' and date.'
            : candidates.length + ' possible payments by customer, amount, currency and date; none is a reference match, so none was linked automatically.', candidates: candidates };
    },

    // Exact reference match on the payment's bank reference (case, spaces
    // and dashes ignored).
    _paymentsByReference: function(reference) {
        var ref = this._normRef(reference), out = [];
        if (!ref || ref.length < 4) return out;
        var gr = new GlideRecord('x_695068_bcfa_payment');
        // Candidates: the reference as printed, or one containing its longest
        // run of letters / digits (separators differ between bank line and
        // advice); the normalized comparison below decides.
        var chunks = String(reference).split(/[^A-Za-z0-9]+/), longest = '';
        for (var c = 0; c < chunks.length; c++) if (chunks[c].length > longest.length) longest = chunks[c];
        var q = gr.addQuery('bank_reference', String(reference).trim());
        if (longest.length >= 3) q.addOrCondition('bank_reference', 'CONTAINS', longest);
        gr.query();
        while (gr.next()) {
            if (this._normRef(gr.getValue('bank_reference')) === ref) {
                var copy = new GlideRecord('x_695068_bcfa_payment');
                copy.get(gr.getUniqueValue());
                out.push(copy);
            }
        }
        return out;
    },

    // Phase 42: Unicode-safe (full-width digits and letters fold, other
    // scripts kept, punctuation ignored).
    _normRef: function(value) {
        return this.matchingEngine.canonicalText(value).replace(/ /g, '');
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
        // A date printed as 05.10.2026 can be 5 October or 10 May. When both
        // parts are 12 or less, the day / month swapped reading is searched
        // too (same window); every other condition is unchanged.
        var dates = criteria.date ? [String(criteria.date)] : [null];
        var m = criteria.date ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(criteria.date)) : null;
        if (m && m[2] !== m[3] && parseInt(m[2], 10) <= 12 && parseInt(m[3], 10) <= 12) dates.push(m[1] + '-' + m[3] + '-' + m[2]);
        var results = [];
        for (var di = 0; di < dates.length; di++) {
            var gr = new GlideRecord('x_695068_bcfa_payment');
            if (criteria.amount !== undefined && criteria.amount !== null && criteria.amount !== '') gr.addQuery('amount', criteria.amount);
            if (criteria.currency) gr.addQuery('currency', criteria.currency);
            // The customer's payments, and bank lines not yet assigned to any
            // customer (a bank statement line rarely names the customer).
            // Another customer's payment is never a candidate.
            if (customerResolution.resolved) gr.addQuery('customer', customerResolution.customerSysId).addOrCondition('customer', 'ISEMPTY', '');
            if (dates[di]) {
                var from = new GlideDateTime(dates[di] + ' 00:00:00');
                from.addDaysUTC(-5);
                var to = new GlideDateTime(dates[di] + ' 00:00:00');
                to.addDaysUTC(5);
                gr.addQuery('value_date', '>=', from);
                gr.addQuery('value_date', '<=', to);
            }
            gr.query();
            while (gr.next()) if (results.indexOf(gr.getUniqueValue()) < 0) results.push(gr.getUniqueValue());
        }
        return results;
    },

    // ==== Email intake (inbound email action "BCFA - Email Document Intake") =

    // One Finance Document Intake per PDF / PNG / JPEG attachment of an inbound
    // email whose subject contains BCFA (images under 30 KB, e.g. signature
    // logos, are skipped). The document type comes from the
    // subject: ADVICE -> AR Payment Advice, REMITTANCE -> AR Remittance,
    // otherwise AP Invoice. Each intake is queued (New) and the poller job
    // then processes it exactly like an upload (duplicate checks, native
    // extraction, the pipeline). No sender
    // restriction (instance owner's decision, 2026-10-06): the sender is
    // recorded on the audit trail of every intake.
    intakeFromEmail: function(emailSysId, subject, from, headers) {
        var s = String(subject || '').toUpperCase();
        var type = s.indexOf('ADVICE') >= 0 ? 'ar_payment_advice' : s.indexOf('REMITTANCE') >= 0 ? 'ar_remittance' : 'ap_invoice';
        var m = String(headers || '').match(/message-id:\s*(<[^>\r\n]+>)/i);
        var messageId = m ? m[1] : 'email ' + emailSysId;
        var sa = new GlideSysAttachment(), results = [];
        var att = new GlideRecord('sys_attachment');
        att.addQuery('table_name', 'sys_email');
        att.addQuery('table_sys_id', emailSysId);
        att.orderBy('sys_created_on');
        att.query();
        while (att.next()) {
            var name = att.getValue('file_name') || 'document';
            var contentType = String(att.getValue('content_type') || '');
            if (!/(pdf|png|jpe?g)/i.test(contentType) && !/\.(pdf|png|jpe?g)$/i.test(name)) continue;
            // Signature logos and inline icons are small images; a photo or
            // scan of a document is far larger. Images under 30 KB are skipped.
            var isImage = !/pdf/i.test(contentType) && !/\.pdf$/i.test(name);
            if (isImage && parseInt(att.getValue('size_bytes') || '0', 10) < 30720) continue;
            var intake = new GlideRecord('x_695068_bcfa_finance_intake');
            intake.initialize();
            intake.setValue('document_type', type);
            intake.setValue('source', 'email');
            intake.setValue('source_reference', (messageId + ' ' + name).substring(0, 200));
            var intakeSysId = intake.insert();
            sa.writeContentStream(intake, name, contentType || 'application/pdf', sa.getContentStream(att.getUniqueValue()));
            this.auditEngine.logEvent({
                sourceTable: 'x_695068_bcfa_finance_intake',
                sourceRecord: intakeSysId,
                eventType: 'record_created',
                actorType: 'system',
                description: 'Intake ' + intake.getValue('number') + ' created from an email from ' + (from || 'unknown sender') + ' (subject "' +
                    String(subject || '').substring(0, 120) + '"), attachment ' + name + ', type ' + intake.getDisplayValue('document_type') + '.',
                afterValue: { source: 'email', from: from || '', subject: String(subject || '').substring(0, 200), message_id: messageId, file_name: name, document_type: type }
            });
            // Not processed here: an email from an address that is not a
            // ServiceNow user is handled as guest, and Document Intelligence
            // does not run for guest. The intake stays New and the BCFA -
            // Native Extraction Poller job starts it within a minute.
            results.push({ intake: intake.getValue('number'), file: name, type: type, outcome: 'queued' });
        }
        return { documents: results.length, type: type, results: results };
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
            reason: reason || '',
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

    // Phase 41, defect 1: the canonical intake of a document is the first
    // intake that started processing it and is not itself a duplicate (no
    // duplicate_of; legacy duplicates carry "Duplicate of ..." as their
    // processing error). A canonical intake in review keeps ownership, and a
    // duplicate is never a candidate, so a canonical intake processed again
    // never points at its own duplicate and references cannot loop. At most
    // one financial transaction per document content.
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
        gr.addNullQuery('duplicate_of');
        gr.addEncodedQuery('processing_errorISEMPTY^ORprocessing_errorNOT LIKEDuplicate of');
        gr.orderBy('sys_created_on');
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    },

    // Defect 1: duplicates show the canonical intake's transaction once it
    // exists (a duplicate created while the original was still in review
    // had nothing to show yet).
    _syncDuplicates: function(canonicalSysId) {
        var canonical = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!canonical.get(canonicalSysId) || canonical.getValue('duplicate_of')) return;
        var fields = ['ap_invoice', 'payment', 'remittance'];
        var dup = new GlideRecord('x_695068_bcfa_finance_intake');
        dup.addQuery('duplicate_of', canonicalSysId);
        dup.query();
        while (dup.next()) {
            var changed = false;
            for (var i = 0; i < fields.length; i++) {
                if (canonical.getValue(fields[i]) && dup.getValue(fields[i]) !== canonical.getValue(fields[i])) {
                    dup.setValue(fields[i], canonical.getValue(fields[i]));
                    changed = true;
                }
            }
            if (changed) dup.update();
        }
    },

    // Size in bytes of the intake's current (latest) attachment.
    _attachmentSize: function(intakeSysId) {
        var attachment = new GlideRecord('sys_attachment');
        attachment.addQuery('table_name', 'x_695068_bcfa_finance_intake');
        attachment.addQuery('table_sys_id', intakeSysId);
        attachment.orderByDesc('sys_created_on');
        attachment.setLimit(1);
        attachment.query();
        return attachment.next() ? parseInt(attachment.getValue('size_bytes') || '0', 10) : 0;
    },

    _hasAttachment: function(intakeSysId) {
        var attachment = new GlideRecord('sys_attachment');
        attachment.addQuery('table_name', 'x_695068_bcfa_finance_intake');
        attachment.addQuery('table_sys_id', intakeSysId);
        attachment.setLimit(1);
        attachment.query();
        return attachment.hasNext();
    },

    // ==== Internal status/audit helpers =====================================

    // document_uploaded: the first time processing sees an attachment (or a
    // replaced one), with its name, type, size and content hash.
    _auditUpload: function(intake, hash) {
        var attachment = new GlideRecord('sys_attachment');
        attachment.addQuery('table_name', 'x_695068_bcfa_finance_intake');
        attachment.addQuery('table_sys_id', intake.getUniqueValue());
        attachment.orderByDesc('sys_created_on');
        attachment.setLimit(1);
        attachment.query();
        var file = attachment.next()
            ? { file_name: attachment.getValue('file_name'), content_type: attachment.getValue('content_type'), size_bytes: attachment.getValue('size_bytes'),
                uploaded_by: attachment.getValue('sys_created_by'), uploaded_on: attachment.getValue('sys_created_on') }
            : {};
        this.auditEngine.logEvent({
            correlationId: intake.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intake.getUniqueValue(),
            eventType: 'document_uploaded',
            actorType: 'user',
            description: 'Document ' + (file.file_name || '') + ' uploaded to intake ' + intake.getValue('number') + ' (' + intake.getDisplayValue('source') +
                (intake.getValue('document_type') !== 'unknown' ? ', type ' + intake.getDisplayValue('document_type') : '') + ').',
            afterValue: { attachment_hash: hash, source: intake.getValue('source'), source_reference: intake.getValue('source_reference'),
                file_name: file.file_name, content_type: file.content_type, size_bytes: file.size_bytes, uploaded_by: file.uploaded_by, uploaded_on: file.uploaded_on }
        });
    },

    // document_extracted: the structured fields read from the document and
    // the confidence (the full result stays in extraction_json).
    // document_extracted: the structured fields read from the document, the
    // provider and the confidence (the full result stays in extraction_json).
    _auditExtraction: function(intake, data, envelope) {
        var fields = [];
        var skip = { confidence: 1, warnings: 1, field_evidence: 1, extraction_method: 1, extraction_task: 1, confidence_basis: 1 };
        for (var k in data) if (!skip[k] && data[k] !== null && data[k] !== '' && typeof data[k] !== 'object') fields.push(k);
        var type = intake.getValue('document_type');
        var isNative = !!envelope && envelope.provider === 'native';
        new AiInteractionLog().log({
            sourceTable: 'x_695068_bcfa_finance_intake', sourceRecord: intake.getUniqueValue(), process: 'intake', provider: isNative ? 'now_assist' : 'simulated',
            operation: type === 'ap_invoice' ? 'extract_ap_invoice_document' : type === 'ar_payment_advice' ? 'extract_ar_payment_advice_document' :
                type === 'goods_receipt' ? 'extract_goods_receipt_document' : 'extract_ar_remittance_document',
            capability: 'document_extraction', skill: isNative ? 'Document Intelligence (generative, Now LLM)' : 'SimulatedDocumentExtraction', status: 'success', durationMs: 0,
            result: 'Extracted fields: ' + fields.join(', '), confidence: data.confidence,
            model: isNative ? 'Document Key Value Extraction (NowLLM); task ' + envelope.taskId : 'fixture'
        });
        this.auditEngine.logEvent({
            correlationId: intake.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_finance_intake',
            sourceRecord: intake.getUniqueValue(),
            eventType: 'document_extracted',
            actorType: isNative ? 'now_assist_ai' : 'simulated_ai',
            description: (envelope ? envelope.label : 'Extraction') + ' of ' + intake.getDisplayValue('document_type') + ' ' +
                intake.getValue('number') + ', confidence ' + data.confidence + '; fields: ' + fields.join(', '),
            afterValue: { provider: envelope ? envelope.provider : '', confidence: data.confidence, confidence_basis: data.confidence_basis || '',
                fields: fields, warnings: data.warnings || [], extraction_task: data.extraction_task || '' }
        });
    },

    // Phase 42: what the reading established about the document itself,
    // on the intake (language, the reader-text script check, stamp and
    // handwriting findings). Caller updates the intake.
    _recordReadingEvidence: function(intake, data) {
        var evidence = new DocumentEvidenceService();
        intake.setValue('document_language', String(data.document_language || '').substring(0, 40));
        intake.setValue('reader_script_check', String(data.reader_script_check || '').substring(0, 400));
        if (intake.getValue('document_type') === 'ap_invoice' || intake.getValue('document_type') === 'goods_receipt') {
            var stamp = evidence.stampEvidence(data);
            intake.setValue('stamp_present', stamp.stamp_present);
            intake.setValue('stamp_evidence_status', stamp.stamp_evidence_status);
            var hw = evidence.handwritingEvidence(data);
            intake.setValue('handwriting_status', hw.handwriting_status);
            intake.setValue('visual_review_required', stamp.stamp_evidence_status !== 'confirmed_by_native_visual' && stamp.stamp_evidence_status !== 'not_detected');
        }
    },

    // Phase 42: a goods receipt (GRN) document, printed or handwritten, read
    // as EVIDENCE. It is compared with the SAP receipt of the same number and
    // always goes to a person; it never creates or changes a receipt, and a
    // value that was not read is never filled in.
    processGoodsReceiptDocument: function(intakeSysId) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) return { error: 'Finance Intake record not found' };
        if (intake.getValue('grn_extraction')) {
            this.sendToManualReview(intakeSysId, 'This goods receipt document was already read (GRN Extraction ' + intake.getDisplayValue('grn_extraction') + '): review it there.');
            return { requiresReview: true, grnExtractionSysId: intake.getValue('grn_extraction') };
        }
        var envelope = this._extract(intakeSysId, 'grn', 'goods receipt');
        if (!envelope.ok) return envelope.pending ? { pending: true, taskId: envelope.taskId } : { requiresReview: true };
        var data = envelope.data;
        intake.setValue('extraction_json', JSON.stringify(data));
        intake.setValue('extraction_confidence', data.confidence);
        this._auditExtraction(intake, data, envelope);
        this._recordReadingEvidence(intake, data);
        var outcome = new DocumentEvidenceService().recordGrnReading(intakeSysId, data, envelope.taskId);
        intake.setValue('grn_extraction', outcome.grnExtractionSysId);
        intake.update();
        var labels = { printed_readable: 'printed values read', handwriting_readable: 'handwriting read', partially_readable: 'partially readable', not_readable: 'not readable' };
        this.sendToManualReview(intakeSysId, 'Goods receipt read as evidence (' + labels[outcome.readingStatus] + ')' +
            (outcome.missing.length ? '; not read: ' + outcome.missing.join(', ') : '') + '. ' + outcome.comparison.detail +
            ' Check the values against the document in the GRN Extraction and record any correction as a Document Evidence Review. ' +
            'No goods receipt was created or changed.' + (data.reader_script_check ? ' ' + data.reader_script_check : ''));
        return { requiresReview: true, grnExtractionSysId: outcome.grnExtractionSysId, readingStatus: outcome.readingStatus, comparison: outcome.comparison.result };
    },

    // Phase 40: runs the configured extraction provider. While a native task
    // is still running the intake waits in 'extracting' (the BCFA Native
    // Extraction Poller job or a second "Process Document" picks it up).
    // A failure goes to manual review: there is no fallback to fixtures.
    _extract: function(intakeSysId, kind, what) {
        this._setStatus(intakeSysId, 'extracting', 'Reading ' + what + ' fields: ' + this.extraction.label() + '.');
        var envelope = this.extraction.extract(intakeSysId, kind);
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (intake.get(intakeSysId)) {
            intake.setValue('extraction_provider', envelope.provider);
            intake.update();
        }
        if (envelope.pending) {
            this.auditEngine.logEvent({
                sourceTable: 'x_695068_bcfa_finance_intake', sourceRecord: intakeSysId, eventType: 'rule_evaluated', actorType: 'system',
                description: envelope.safeError
            });
            return envelope;
        }
        if (!envelope.ok) this.sendToManualReview(intakeSysId, envelope.safeError);
        return envelope;
    },

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
            reason: message,
            description: 'Processing failed: ' + message,
        });
        return { ok: false, failed: true, safeError: message };
    },

    type: 'FinanceDocumentIntakeService',
};
