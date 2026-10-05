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
        this.policy = new FinancePolicy();
    },

    // Public entry point for the "Explain with Now Assist" UI Action on AP
    // Exception: regenerates the advisory ai_recommendation on demand, as
    // the current user. With the native provider it calls the published
    // Now Assist skills through FinanceAgentTools (role-checked, advisory
    // field only); other providers use the automatic path below.
    explainException: function(apExceptionSysId) {
        if (this.policy.aiProvider() !== 'native') return this._explainApException(apExceptionSysId);

        var tools = new FinanceAgentTools();
        var explanation = tools.explainApException(apExceptionSysId);
        if (!explanation.ok) return explanation;
        var recommendation = tools.recommendApNextAction(apExceptionSysId);
        var note = 'AI REVIEW (advisory only - a human must decide)\n\nExplanation:\n' + explanation.text +
            (recommendation.ok ? '\n\nRecommended next action:\n' + recommendation.text : '\n\nRecommended next action: not available (' + recommendation.error + ')');
        var saved = tools.recordExceptionAdvice('ap', apExceptionSysId, note);
        return saved.ok ? { ok: true, recommendation: note } : saved;
    },

    // audit (optional): { eventType, reason, after } — the business event
    // this transition records; by default derived from the new state
    // (AuditEngine.EVENT_BY_STATE), e.g. MATCHED is a match event.
    _setState: function(apInvoiceSysId, newState, correlationId, description, audit) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return false;
        var previous = invoice.getValue('state');
        // Phase 26: only transitions of the lifecycle state model (FinanceLifecycle).
        this._lifecycle = this._lifecycle || new FinanceLifecycle();
        var gate = this._lifecycle.evaluate('x_695068_bcfa_ap_invoice', previous, newState);
        if (!gate.allowed && this._lifecycle.enforcing()) {
            this._lifecycle.record('x_695068_bcfa_ap_invoice', apInvoiceSysId, previous, newState, gate, { correlationId: correlationId || invoice.getValue('correlation_id'), attempt: description });
            throw new Error('BCFA lifecycle: ' + gate.message);
        }
        invoice.setValue('state', newState);
        invoice.update();
        audit = audit || {};
        var after = { state: newState };
        for (var k in (audit.after || {})) after[k] = audit.after[k];
        this.auditEngine.logEvent({
            correlationId: correlationId || invoice.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_ap_invoice',
            sourceRecord: apInvoiceSysId,
            eventType: audit.eventType || AuditEngine.eventForState(newState),
            actorType: 'system',
            reason: audit.reason,
            description: description || ('AP Invoice ' + previous + ' -> ' + newState),
            beforeValue: { state: previous },
            afterValue: after
        });
        new FinanceReviewSummary().refreshInvoice(apInvoiceSysId);
        return true;
    },

    // Single entry point for the fully-automated portion of the pipeline
    // (Section 7 items 1-14): intake through matching, stopping naturally at
    // whichever state the deterministic logic reaches (MATCHED or
    // EXCEPTION). This is the "flow" for automated intake — see
    // docs/ARTIFACT_STRATEGY.md's Stage 15 refinement for why this is a
    // direct call chain rather than a Flow Designer flow.
    // fields.lines (optional): invoice lines (attachInvoiceLine field shape)
    // attached before extraction and matching, so the 3-way match sees them.
    intakeAndAutoProcess: function(fields) {
        var intake = this.intakeInvoice(fields);
        var lines = fields.lines || [];
        for (var i = 0; i < lines.length; i++) this.attachInvoiceLine(intake.apInvoiceSysId, lines[i]);
        // Phase 25: in flow mode the AP flows take it from here.
        if (!FinanceOrchestration.isInline()) return { apInvoiceSysId: intake.apInvoiceSysId, stoppedAt: 'RECEIVED', handedTo: 'AP Invoice Intake Flow' };
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
        // Phase 40: the tax breakdown and document facts as printed (from the
        // extraction). Validation compares them with the governed expectation.
        var printed = fields.taxBreakdown || {};
        var printedFields = { taxType: 'tax_type', ratePct: 'tax_rate_pct', cgst: 'cgst_amount', sgst: 'sgst_amount', igst: 'igst_amount',
            vat: 'vat_amount', wht: 'wht_amount', whtRatePct: 'wht_rate_pct' };
        for (var pf in printedFields) {
            if (printed[pf] !== null && printed[pf] !== undefined && printed[pf] !== '') invoice.setValue(printedFields[pf], printed[pf]);
        }
        if (fields.documentCountry) invoice.setValue('document_country', fields.documentCountry);
        if (fields.documentLanguage) invoice.setValue('document_language', fields.documentLanguage);
        if (fields.extractionProvider) invoice.setValue('extraction_provider', fields.extractionProvider);
        invoice.setValue('state', 'RECEIVED');
        invoice.setValue('approval_state', 'not_required');
        invoice.setValue('posting_state', 'not_posted');
        var sysId = invoice.insert();

        this.auditEngine.logEvent({
            correlationId: correlationId,
            sourceTable: 'x_695068_bcfa_ap_invoice',
            sourceRecord: sysId,
            eventType: 'record_created',
            actorType: 'system',
            description: 'AP Invoice ' + fields.invoiceNumber + ' created (intake, source ' + (fields.source || 'email') + ')',
            afterValue: { state: 'RECEIVED', invoice_number: fields.invoiceNumber, vendor: fields.vendor || '', gross_amount: fields.grossAmount || 0,
                currency: fields.currency || '', purchase_order: fields.purchaseOrder || '' }
        });
        return { apInvoiceSysId: sysId, correlationId: correlationId };
    },

    // Creates one AP Invoice Line row. Previously this was only ever done as
    // a raw GlideRecord insert inline inside DemoDataSeeder — this method
    // encapsulates the same shape as a proper, reusable service call so
    // FinanceDocumentIntakeService (and any future caller) doesn't have to
    // reach around ApDomainService to create a line. Deliberately dumb: it
    // only writes fields it is given — po_line/receipt_reference resolution
    // is the caller's job (deterministic line-matching lives in
    // ApLineResolutionService, not here), matching the existing separation
    // where ApDomainService orchestrates state and MatchingEngine owns
    // tolerance evaluation.
    attachInvoiceLine: function(apInvoiceSysId, fields) {
        var line = new GlideRecord('x_695068_bcfa_ap_invoice_line');
        line.initialize();
        line.setValue('ap_invoice', apInvoiceSysId);
        line.setValue('line_number', fields.lineNumber || 1);
        line.setValue('material_or_service', fields.materialOrService || '');
        line.setValue('quantity', fields.quantity || 0);
        line.setValue('unit', fields.unit || '');
        line.setValue('unit_price', fields.unitPrice || 0);
        line.setValue('tax', fields.tax || 0);
        line.setValue('amount', fields.amount || 0);
        if (fields.poLine) line.setValue('po_line', fields.poLine);
        if (fields.receiptReference) line.setValue('receipt_reference', fields.receiptReference);
        return line.insert();
    },

    // seedFields stands in for whatever partial, as-if-OCR'd fields a real
    // extraction step would have produced. This is the deterministic
    // simulated extraction (AISimulationService): Document Intelligence
    // extraction is not licensed on this instance (see
    // docs/CONTENT_UNDERSTANDING.md). No external AI is called (the Claude
    // path was removed in Phase 34). Extraction never blocks the pipeline
    // on an AI outage.
    runExtraction: function(apInvoiceSysId, seedFields, options) {
        this._setState(apInvoiceSysId, 'EXTRACTING', null, 'Beginning extraction');
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

        var confidenceThreshold = this.policy.extractionConfidenceThreshold();
        var failure = null;
        if (confidence < confidenceThreshold) {
            failure = { reasonCode: 'low_confidence', description: 'Extraction confidence ' + confidence + ' is below the ' + confidenceThreshold + ' review threshold (POC ASSUMPTION).' };
        } else if (!invoice.getValue('invoice_number') || !invoice.getValue('vendor') || !invoice.getValue('gross_amount')) {
            failure = { reasonCode: 'missing_field', description: 'One or more mandatory fields (invoice number, vendor, gross amount) are missing.' };
        } else {
            var vendor = new GlideRecord('x_695068_bcfa_vendor');
            if (!vendor.get(invoice.getValue('vendor')) || vendor.getValue('active') !== '1') {
                failure = { reasonCode: 'vendor_invalid', description: 'Vendor could not be resolved to an active master record.' };
            } else {
                // PO exists, belongs to this vendor and is not closed (Phase 14).
                var poCheck = this.matchingEngine.validatePurchaseOrder(apInvoiceSysId);
                if (!poCheck.ok) failure = { reasonCode: poCheck.reasonCode, description: poCheck.description };
            }
        }

        if (failure) {
            var exceptionSysId = this.exceptionEngine.createApException(apInvoiceSysId, failure.reasonCode, failure.description, {
                ruleResult: 'FAIL validation: ' + failure.description,
                evidence: 'Extraction confidence: ' + confidence + ' (threshold ' + confidenceThreshold + ')\n' +
                    'Invoice number: ' + (invoice.getValue('invoice_number') || 'missing') + '\n' +
                    'Vendor: ' + (invoice.getDisplayValue('vendor') || 'missing') + '\n' +
                    'Gross amount: ' + (invoice.getValue('gross_amount') || 'missing') + ' ' + invoice.getValue('currency') + '\n' +
                    'Purchase order: ' + (invoice.getDisplayValue('purchase_order') || invoice.getValue('purchase_order') || 'none')
            });
            this._explainApException(exceptionSysId);
            this._setState(apInvoiceSysId, 'EXCEPTION', null, 'Validation failed: ' + failure.reasonCode,
                { eventType: 'rule_evaluated', reason: failure.description, after: { rule: 'validation', result: 'FAIL', reason_code: failure.reasonCode, confidence: confidence } });
            return { validated: false, reasonCode: failure.reasonCode, exceptionSysId: exceptionSysId };
        }

        this._setState(apInvoiceSysId, 'VALIDATED', null, 'Validation passed',
            { reason: 'Confidence ' + confidence + ' >= ' + confidenceThreshold + '; mandatory fields present; vendor active; PO valid.', after: { rule: 'validation', result: 'PASS', confidence: confidence } });
        return { validated: true };
    },

    matchInvoice: function(apInvoiceSysId) {
        this._setState(apInvoiceSysId, 'MATCHING', null, 'Running duplicate detection and 3-way match');

        var duplicateResult = this.matchingEngine.detectDuplicateInvoice(apInvoiceSysId);
        if (duplicateResult.duplicate) {
            var original = new GlideRecord('x_695068_bcfa_ap_invoice');
            original.get(duplicateResult.matchedInvoiceSysId);
            var thisInvoice = new GlideRecord('x_695068_bcfa_ap_invoice');
            thisInvoice.get(apInvoiceSysId);
            var dupExceptionSysId = this.exceptionEngine.createApException(apInvoiceSysId, 'duplicate', 'Duplicate of AP Invoice ' + duplicateResult.matchedInvoiceSysId, {
                subtype: duplicateResult.sameAmount ? 'exact_duplicate' : 'same_number_different_amount',
                ruleResult: duplicateResult.sameAmount
                    ? 'FAIL duplicate check: same vendor, invoice number and gross amount as AP invoice ' + original.getValue('invoice_number') + ' (state ' + original.getValue('state') + ').'
                    : 'FAIL duplicate check: same vendor and invoice number as AP invoice ' + original.getValue('invoice_number') + ' (state ' + original.getValue('state') +
                        ') but a different gross amount (' + thisInvoice.getValue('gross_amount') + ' vs ' + duplicateResult.matchedGross + '): possible re-bill or correction; confirm with the vendor.',
                evidence: 'Vendor: ' + thisInvoice.getDisplayValue('vendor') + '; invoice number ' + thisInvoice.getValue('invoice_number') +
                    ' (normalized ' + this.matchingEngine.normalizeInvoiceNumber(thisInvoice.getValue('invoice_number')) + ')' +
                    '\nExisting invoice: ' + original.getValue('invoice_number') + ', sys_id ' + duplicateResult.matchedInvoiceSysId + ', gross ' + duplicateResult.matchedGross +
                    ', state ' + original.getValue('state') + ', SAP document ' + (original.getValue('sap_document_id') || 'none') +
                    '\nThis invoice: gross ' + thisInvoice.getValue('gross_amount') + ' ' + thisInvoice.getValue('currency')
            });
            this._explainApException(dupExceptionSysId);
            this._setState(apInvoiceSysId, 'EXCEPTION', null, 'Duplicate invoice detected',
                { eventType: 'match', reason: 'Duplicate of AP invoice ' + original.getValue('invoice_number'),
                    after: { rule: 'duplicate_check', result: 'FAIL', matched_invoice: duplicateResult.matchedInvoiceSysId, same_amount: duplicateResult.sameAmount } });
            return { matched: false, reasonCode: 'duplicate', exceptionSysId: dupExceptionSysId };
        }

        var match = this.matchingEngine.threeWayMatch(apInvoiceSysId);
        this._recordTaxValidation(apInvoiceSysId, match);
        if (!match.withinTolerance) {
            // One reason per exception, in order of what a reviewer must
            // fix first: PO linkage, receipt, quantity, price, tax, totals.
            var tolerances = match.tolerancesUsed;
            var reasonCode = 'line_total_mismatch';
            if (match.linkIssues.length) reasonCode = 'po_mismatch';
            else if (match.receiptIssues.length) reasonCode = 'grn_missing';
            else if (match.quantityVariancePct > tolerances.quantityPct) reasonCode = 'quantity_tolerance';
            else if (match.priceVariancePct > tolerances.pricePct) reasonCode = 'price_tolerance';
            else if (!match.taxWithinTolerance) reasonCode = 'tax_validation';
            var exceptionSysId2 = this.exceptionEngine.createApException(apInvoiceSysId, reasonCode,
                'Match result: ' + match.matchResult + '. Quantity variance ' + (match.quantityVariancePct * 100).toFixed(1) + '%, price variance ' + (match.priceVariancePct * 100).toFixed(1) + '%.',
                this._matchExceptionDetails(reasonCode, match));
            this._explainApException(exceptionSysId2);
            this._setState(apInvoiceSysId, 'EXCEPTION', null, 'Match failed: ' + reasonCode,
                { eventType: 'match', reason: this._matchExceptionDetails(reasonCode, match).ruleResult, after: this._matchSummary(match, 'FAIL') });
            return { matched: false, reasonCode: reasonCode, exceptionSysId: exceptionSysId2, match: match };
        }

        this._setState(apInvoiceSysId, 'MATCHED', null, 'Matched within tolerance',
            { reason: 'Duplicate check, PO linkage, receipt, quantity, price, tax and line total within tolerance.', after: this._matchSummary(match, 'PASS') });
        return { matched: true, match: match };
    },

    // Audit summary of a 3-way match: result, variances and the tolerances
    // (with their source) that were applied.
    _matchSummary: function(match, result) {
        return { rule: '3_way_match', result: result, match_result: match.matchResult, quantity_variance_pct: match.quantityVariancePct,
            price_variance_pct: match.priceVariancePct, tax_variance: match.taxVariance, line_total_ok: match.lineTotalOk, tolerances: match.tolerancesUsed };
    },

    // Deterministic rule result, evidence and variance for a failed 3-way
    // match: what the exception shows the reviewer and what the AI agents
    // explain. Only facts the MatchingEngine computed; no AI.
    _matchExceptionDetails: function(reasonCode, match) {
        var t = match.tolerancesUsed;
        var pct = function(v) { return (v * 100).toFixed(1) + '%'; };
        var checks = [
            'PO linkage ' + (match.linkIssues.length ? 'FAIL (' + match.linkIssues.join('; ') + ')' : 'pass'),
            'receipt ' + (match.receiptIssues.length ? 'FAIL (' + match.receiptIssues.join('; ') + ')' : 'pass'),
            'quantity ' + pct(match.quantityVariancePct) + ' vs tolerance ' + pct(t.quantityPct) + (match.quantityVariancePct > t.quantityPct ? ' FAIL' : ' pass'),
            'price ' + pct(match.priceVariancePct) + ' vs tolerance ' + pct(t.pricePct) + (match.priceVariancePct > t.pricePct ? ' FAIL' : ' pass'),
            'tax variance ' + match.taxVariance + (match.taxWithinTolerance ? ' pass' : ' FAIL'),
            'line total ' + match.lineTotal + ' vs net ' + match.netAmount + (match.lineTotalOk ? ' pass' : ' FAIL (difference ' + match.lineTotalDifference + ')')
        ];
        var evidence = [];
        for (var i = 0; i < match.lines.length; i++) {
            var l = match.lines[i];
            evidence.push('Line ' + l.lineNumber + ': invoice qty ' + l.invoiceQuantity + ' at ' + l.invoiceUnitPrice +
                '; PO ' + (l.poNumber || 'not linked') + (l.poQuantity !== null ? ' qty ' + l.poQuantity + ' at ' + l.poUnitPrice : '') +
                '; GRN ' + (l.receiptNumber || 'not linked') + (l.receiptQuantity !== null ? ' qty ' + l.receiptQuantity : ''));
        }
        evidence.push('Net ' + match.netAmount + ', tax ' + match.taxAmount +
            (match.expectedTax !== null ? ', expected tax ' + match.expectedTax + ' (' + match.vendorCountry + ' rate ' + pct(match.expectedTaxRate) + ')' : ', no expected tax rate for vendor country'));
        if (match.taxEvaluation) {
            evidence.push('Tax validation ' + match.taxEvaluation.result.toUpperCase().replace('_', ' ') + ': ' + match.taxEvaluation.checks.join(' | ') +
                ' [' + match.taxEvaluation.source + ']');
        }
        evidence.push('Tolerances (POC ASSUMPTION) from ' + (t.source || 'x_695068_bcfa.ap.tolerance.* properties') + '.');

        var varianceAmount = match.priceVarianceValue;
        var variancePct = match.priceVariancePct;
        if (reasonCode === 'quantity_tolerance') {
            varianceAmount = match.quantityVarianceValue;
            variancePct = match.quantityVariancePct;
        } else if (reasonCode === 'tax_validation') {
            varianceAmount = match.taxVariance;
            variancePct = match.expectedTax ? match.taxVariance / match.expectedTax : 0;
        } else if (reasonCode === 'line_total_mismatch') {
            varianceAmount = match.lineTotalDifference;
            variancePct = match.netAmount ? match.lineTotalDifference / match.netAmount : 0;
        } else if (reasonCode === 'po_mismatch' || reasonCode === 'grn_missing') {
            varianceAmount = null;
            variancePct = null;
        }
        var subtype = '';
        if (reasonCode === 'tax_validation' && match.taxEvaluation) {
            var te = match.taxEvaluation;
            subtype = te.result === 'manual_review' && te.regime === 'UNKNOWN' ? 'tax_not_configured'
                : te.wht.result === 'fail' || te.wht.result === 'manual_review' ? 'withholding_tax'
                : te.regime === 'GST' ? 'gst' : te.regime === 'VAT' ? 'vat' : 'tax_amount';
            if (subtype === 'withholding_tax' && te.wht.expected !== null && te.wht.extracted !== null) {
                varianceAmount = te.wht.variance;
                variancePct = te.wht.expected ? te.wht.variance / te.wht.expected : 0;
            }
        }
        return {
            ruleResult: 'FAIL 3-way match (' + reasonCode + '): ' + checks.join('; ') + '.',
            evidence: evidence.join('\n'),
            varianceAmount: varianceAmount,
            variancePct: variancePct,
            subtype: subtype
        };
    },

    // Phase 40: stores the tax validation result on the invoice (expected
    // regime and tax, variance, withholding, result and the rule source), so
    // the workspace, Review Summary and Playbook show it.
    _recordTaxValidation: function(apInvoiceSysId, match) {
        var te = match && match.taxEvaluation;
        if (!te) return;
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return;
        invoice.setValue('tax_regime', te.regime);
        if (te.expectedTax !== null) invoice.setValue('expected_tax_amount', te.expectedTax);
        invoice.setValue('tax_variance_amount', te.taxVariance);
        invoice.setValue('tax_validation_result', te.result);
        invoice.setValue('tax_validation_detail', te.checks.join('\n').substring(0, 2000));
        invoice.setValue('tax_rule_source', String(te.source || '').substring(0, 255));
        invoice.setValue('wht_applicable', te.wht.applicable);
        invoice.setValue('wht_code', te.wht.code || '');
        if (te.wht.expected !== null) invoice.setValue('wht_expected_amount', te.wht.expected);
        invoice.setValue('wht_result', te.wht.applicable || te.wht.extracted !== null ? te.wht.result : '');
        invoice.update();
    },

    // Applies the configured approval rule to a MATCHED invoice: either
    // requests human approval (requester = requestedBy) or, when the gross
    // amount is within the configured auto-approve limit, records a
    // rule-based approval. Either way posting only happens through the
    // approval cascade and IntegrationService.
    // Phase 15: the BCFA AP Approval decision table decides whether approval
    // is needed and which group approves (inputs: amount, exception type,
    // variance %, company). context (optional): { exceptionType, variancePct }
    // for an invoice approved after an exception; a clean invoice is 'none'.
    routeForApproval: function(apInvoiceSysId, requestedBy, context) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return { error: 'AP Invoice not found' };
        context = context || {};
        var rule = this.policy.apApprovalDecision({
            amount: parseFloat(invoice.getValue('gross_amount') || '0'),
            exceptionType: context.exceptionType || 'none',
            variancePct: context.variancePct || 0,
            company: invoice.getValue('company_code')
        });
        this.auditEngine.logEvent({
            correlationId: invoice.getValue('correlation_id'),
            sourceTable: 'x_695068_bcfa_ap_invoice',
            sourceRecord: apInvoiceSysId,
            eventType: 'rule_evaluated',
            actorType: 'system',
            reason: rule.rule,
            description: 'Approval rule evaluated (BCFA AP Approval decision table): ' + (rule.required ? 'approval required' : 'no approval required'),
            afterValue: rule
        });
        var approval = this.requestApproval(apInvoiceSysId, requestedBy, { group: rule.group, type: rule.required ? 'standard' : 'rule' });
        if (rule.required) return { approvalRequired: true, approvalSysId: approval.approvalSysId, rule: rule.rule };
        var decision = this.decideApproval(apInvoiceSysId, approval.approvalSysId, 'approved', null, 'Approved by configured rule: ' + rule.rule);
        return { approvalRequired: false, approvalSysId: approval.approvalSysId, rule: rule.rule, decision: decision };
    },

    // Advisory explanation for a newly raised exception (ai_recommendation,
    // never read by any deterministic rule or approval/posting logic).
    // native (default): nothing runs here. The BCFA AP Invoice Review
    // agentic workflow is triggered by the exception's creation, runs as
    // the AI user and saves its note asynchronously.
    // simulated: deterministic templated explanation only (the Claude
    // provider was removed in Phase 34).
    _explainApException: function(exceptionSysId) {
        var provider = this.policy.aiProvider();
        if (provider === 'native') {
            this.auditEngine.logEvent({
                sourceTable: 'x_695068_bcfa_ap_exception',
                sourceRecord: exceptionSysId,
                eventType: 'ai_invocation',
                actorType: 'system',
                aiAgent: 'BCFA AP Invoice Review (agentic workflow)',
                description: 'AI review handed to the BCFA AP Invoice Review agentic workflow (Now Assist), which starts on exception creation and records an advisory note.'
            });
            new AiInteractionLog().start({ sourceTable: 'x_695068_bcfa_ap_exception', sourceRecord: exceptionSysId, provider: 'now_assist',
                operation: 'exception_review', capability: 'exception_review', workflow: 'BCFA AP Invoice Review' });
            return { deferred: true, workflow: 'BCFA AP Invoice Review' };
        }
        return this.aiSimulation.recommendApExceptionResolution(exceptionSysId);
    },

    // Reviewer correction: resolve the exception, then loop back to
    // re-validate and rematch from scratch (Section 7 items 16-17). If the
    // corrected invoice now matches, the configured approval rule applies.
    resolveExceptionAndRetry: function(apInvoiceSysId, exceptionSysId, resolutionNotes, resolvedBy) {
        this._setState(apInvoiceSysId, 'RESOLUTION', null, 'Reviewer resolving exception');
        this.exceptionEngine.resolveApException(exceptionSysId, resolutionNotes, resolvedBy);
        // Phase 25: in flow mode the AP Exception Flow re-validates and re-matches.
        if (!FinanceOrchestration.isInline()) return { resolved: true, handedTo: 'AP Exception Flow' };
        this._setState(apInvoiceSysId, 'VALIDATING', null, 'Re-validating after correction');
        var validation = this.validateInvoice(apInvoiceSysId);
        if (!validation.validated) return validation;
        var match = this.matchInvoice(apInvoiceSysId);
        if (!match.matched) return match;
        match.approval = this.routeForApproval(apInvoiceSysId, resolvedBy);
        return match;
    },

    // options (optional): { group, type ('standard'|'override'|'rule'),
    // overrideReason }; a bare group sys_id is accepted too.
    requestApproval: function(apInvoiceSysId, requestedBy, options) {
        this._setState(apInvoiceSysId, 'PENDING_APPROVAL', null, 'Requesting posting approval');
        var approvalSysId = this.approvalEngine.requestApInvoiceApproval(apInvoiceSysId, requestedBy, options);
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
        // Phase 17: segregation of duties is checked before any state
        // changes; a refused decision is audited by the engine and leaves the
        // invoice untouched.
        var sod = this.approvalEngine.checkSegregation({ process: 'ap', approvalSysId: approvalSysId }, approver);
        if (!sod.ok) return this.approvalEngine.decideApInvoiceApproval(approvalSysId, decision, approver, notes);

        if (decision === 'approved') {
            this._setState(apInvoiceSysId, 'APPROVED', null, 'Approving — posting cascade will follow');
        }

        var result = this.approvalEngine.decideApInvoiceApproval(approvalSysId, decision, approver, notes);
        if (result.error) {
            if (decision === 'approved') {
                this._setState(apInvoiceSysId, 'PENDING_APPROVAL', null, 'Approval refused by the service layer: ' + result.error);
            }
            return result;
        }

        if (decision !== 'approved') {
            var exceptionSysId = this.exceptionEngine.createApException(apInvoiceSysId, 'other', 'Approval rejected: ' + (notes || ''));
            this._setState(apInvoiceSysId, 'EXCEPTION', null, 'Approval rejected');
            result.exceptionSysId = exceptionSysId;
        }
        this.approvalEngine.recordStateAfter('ap', approvalSysId);
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
            // Business reference: the same vendor invoice number is never
            // posted twice, even under another key (Phase 18).
            externalReference: invoice.getValue('vendor') + '|' + new MatchingEngine().normalizeInvoiceNumber(invoice.getValue('invoice_number')),
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
            this._setState(apInvoiceSysId, 'POSTED', null, 'Reconciliation confirmed the posting committed: ' + resolution.sapDocumentId, { eventType: 'reconciliation', reason: resolution.reason || resolution.resolution });
            this.reconcileAndClose(apInvoiceSysId);
            return { posted: true, sapDocumentId: resolution.sapDocumentId };
        }

        if (resolution.resolution === 'RETRY') {
            this._setState(apInvoiceSysId, 'POSTING', null, 'Reconciliation confirmed nothing committed — safe to retry.', { eventType: 'reconciliation', reason: resolution.reason || resolution.resolution });
            return this.postInvoice(apInvoiceSysId);
        }

        var exceptionSysId = this.exceptionEngine.createApException(apInvoiceSysId, 'other', 'Integration exception: ' + resolution.reason);
        this._setState(apInvoiceSysId, 'FAILED', null, 'Reconciliation could not confirm outcome — integration exception.', { eventType: 'reconciliation', reason: resolution.reason || resolution.resolution });
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
