// Single read point for the configurable BCFA finance policy (Phase 12).
// Every value comes from an x_695068_bcfa.* system property (see
// src/fluent/config/policy_properties.now.ts). The initial values are
// synthetic POC ASSUMPTIONS, not Birla Carbon production rules. The
// defaults below apply only when a property is missing or unparsable, so
// a bad edit can never switch a control off.
var FinancePolicy = Class.create();

FinancePolicy.PREFIX = 'x_695068_bcfa.';

FinancePolicy.DEFAULTS = {
    // Phase 41: names of the group's own companies, as printed on documents
    // (Latin, Chinese, Korean). A "vendor invoice" whose seller is one of
    // them is an outgoing sales invoice and never enters AP.
    'own_company_names': 'Birla Carbon,Aditya Birla,博拉碳,비를라카본',
    'ai.provider': 'native',
    // Phase 42: document evidence (POC business configuration). Countries
    // whose AP invoices need a visible company stamp when the decision table
    // cannot be read, and what the platform's reading can establish about
    // stamps ('ocr_text' = measured: text only, no image understanding).
    'document_evidence.stamp_required_countries': 'China',
    'document_evidence.stamp_detection_capability': 'ocr_text',
    'ap.tolerance.quantity_pct': 0.02,
    'ap.tolerance.price_pct': 0.02,
    'ap.tolerance.tax_absolute': 1,
    'ap.tolerance.tax_relative_pct': 0.02,
    'ap.tolerance.total_absolute': 1,
    'ap.tolerance.rounding_absolute': 0.05,
    'ap.tax.reference': '{"India":{"regime":"GST","rate_pct":18},"Germany":{"regime":"VAT","rate_pct":19},"Hungary":{"regime":"VAT","rate_pct":27},"United States":{"regime":"SALES_TAX","rate_pct":0}}',
    'ar.rounding.max_amount': 1,
    'ar.withholding.max_pct': 0.1,
    'ap.extraction.confidence_threshold': 0.85,
    'ap.approval.auto_approve_limit': 0,
    'ap.exception.high_value_variance': 1000,
    'ap.exception.sla_hours': '{"critical":4,"high":8,"medium":24,"low":72}',
    'ap.exception.assignment_group': '',
    'ap.exception.default_owner': '',
    'ap.override.allowed_reasons': 'quantity_tolerance,price_tolerance,tax_validation',
    'ar.approval.auto_approve_limit': 0,
    'ar.match.auto_confidence': 0.95,
    'ar.deduction.approval_threshold': 5000,
    'ar.deduction.allowed_types': 'bank_charge,tcs,withholding_tax,short_pay,credit_note_netting,debit_note,commercial_deduction,fx_difference,rounding',
    'ar.bank_charge.max_amount': 1000,
    'ar.exception.high_value_residual': 5000,
    'ar.exception.sla_hours': '{"critical":4,"high":8,"medium":24,"low":72}',
    'ar.exception.assignment_group': '',
    'ar.exception.default_owner': '',
    'ar.sap_processing_mode': 'direct',
    'sap.adapter': 'mock_sap'
};

// Base severity per AR exception reason. Short and over payments are
// raised to high when the residual reaches ar.exception.high_value_residual.
FinancePolicy.AR_BASE_SEVERITY = {
    unmatched: 'medium',
    customer_ambiguous: 'medium',
    short_pay: 'medium',
    over_pay: 'medium',
    duplicate: 'high',
    currency_mismatch: 'high',
    other: 'medium'
};

// Base severity per AP exception reason. Tolerance failures are raised to
// high when the variance value reaches ap.exception.high_value_variance.
FinancePolicy.AP_BASE_SEVERITY = {
    duplicate: 'high',
    po_mismatch: 'high',
    vendor_invalid: 'high',
    quantity_tolerance: 'medium',
    price_tolerance: 'medium',
    tax_validation: 'medium',
    low_confidence: 'medium',
    missing_field: 'medium',
    other: 'medium'
};

// Phase 15: native Decision Tables (Decision Builder) hold the policy that
// depends on several inputs. They are created through the supported
// sn_dt Decision Table API (scripts/deploy/phase15_decision_tables_bg.js),
// found by name in the app scope and evaluated with sn_dt.DecisionTableAPI.
// If a table is missing, returns no row, or cannot be read, the matching
// x_695068_bcfa.* properties apply instead, so a control is never off.
FinancePolicy.APP_SCOPE = '229ba2b1a079431e104010f5ea883e85';
FinancePolicy.DECISION_TABLES = {
    apTolerance: 'BCFA AP Tolerance',
    apApproval: 'BCFA AP Approval',
    arDeduction: 'BCFA AR Deduction',
    apTax: 'BCFA AP Tax Expectation',
    documentEvidence: 'BCFA Document Evidence Requirement'
};
// Fallback approval group when no decision table row applies.
FinancePolicy.DEFAULT_APPROVAL_GROUP = 'e34ee8a159fd504893d4fc248a6632a7'; // BCFA Finance Approvers

FinancePolicy.prototype = {
    initialize: function() {
        this._tableIds = {};
    },

    // ---- Decision tables ---------------------------------------------------

    // Evaluates a BCFA decision table. Returns { source:'decision_table',
    // table, values:{output: value} } for the first matching row, or null
    // (no table, no row, or an error) so the caller uses its property
    // fallback. Outputs listed in optionalOutputs may be empty on a row (for
    // example a tax row without withholding); every other output must have a
    // value or the decision is not used.
    decide: function(tableKey, inputs, outputs, optionalOutputs) {
        var tableId = this._decisionTableId(tableKey);
        if (!tableId) return null;
        optionalOutputs = optionalOutputs || [];
        try {
            var answer = new sn_dt.DecisionTableAPI().getDecision(tableId, inputs);
            if (!answer || (answer.isValidRecord && !answer.isValidRecord())) return null;
            var values = {};
            for (var i = 0; i < outputs.length; i++) {
                var value = this._answerValue(answer, outputs[i]);
                if (value === null || value === undefined || value === '') return null;
                values[outputs[i]] = value;
            }
            for (var j = 0; j < optionalOutputs.length; j++) {
                var optional = this._answerValue(answer, optionalOutputs[j]);
                values[optionalOutputs[j]] = optional === null || optional === undefined ? '' : optional;
            }
            return { source: 'decision_table', table: FinancePolicy.DECISION_TABLES[tableKey], answer: answer.getDisplayValue(), values: values };
        } catch (e) {
            gs.warn('BCFA FinancePolicy: decision table ' + FinancePolicy.DECISION_TABLES[tableKey] + ' could not be evaluated, using properties: ' + e);
            return null;
        }
    },

    _decisionTableId: function(tableKey) {
        if (this._tableIds.hasOwnProperty(tableKey)) return this._tableIds[tableKey];
        var table = new GlideRecord('sys_decision');
        table.addQuery('name', FinancePolicy.DECISION_TABLES[tableKey]);
        table.addQuery('sys_scope', FinancePolicy.APP_SCOPE);
        table.addQuery('active', true);
        table.setLimit(1);
        table.query();
        this._tableIds[tableKey] = table.next() ? table.getUniqueValue() : null;
        return this._tableIds[tableKey];
    },

    // Reads one result value of a multi-result answer: through the answer's
    // result elements, else from the stored variable value.
    _answerValue: function(answer, name) {
        try {
            if (answer.result_elements && answer.result_elements[name] !== undefined && answer.result_elements[name] !== null) {
                var direct = String(answer.result_elements[name]);
                if (direct !== '' && direct !== 'undefined') return direct;
            }
        } catch (e) {
            // fall through to the stored value
        }
        var stored = new GlideRecord('sys_variable_value');
        stored.addQuery('document', 'sys_decision_multi_result');
        stored.addQuery('document_key', answer.getUniqueValue());
        stored.addQuery('variable.element', name);
        stored.setLimit(1);
        stored.query();
        return stored.next() ? stored.getValue('value') : null;
    },

    _bool: function(value) {
        return value === true || value === 'true' || value === '1';
    },

    // 'native' (ServiceNow AI: Now Assist skills/agents, simulated document
    // extraction until DocIntel extraction is licensed) or 'simulated'
    // (deterministic templates only: the process runs with AI switched off).
    // Any other value, including the removed 'claude' (Phase 34), is native.
    aiProvider: function() {
        return this._string('ai.provider') === 'simulated' ? 'simulated' : 'native';
    },

    // context (optional): { company, country, vendorType, invoiceType }.
    // With a context the BCFA AP Tolerance decision table decides; the
    // x_695068_bcfa.ap.tolerance.* properties are the fallback.
    // Phase 40: also the total-amount tolerance (header net vs sum of lines)
    // and the rounding tolerance (a variance up to this is a PASS rather than
    // WITHIN TOLERANCE). Both come from the table when it has them, else from
    // their properties.
    apTolerances: function(context) {
        var fallback = {
            quantityPct: this._number('ap.tolerance.quantity_pct'),
            pricePct: this._number('ap.tolerance.price_pct'),
            taxAbsolute: this._number('ap.tolerance.tax_absolute'),
            taxRelativePct: this._number('ap.tolerance.tax_relative_pct'),
            totalAbsolute: this._number('ap.tolerance.total_absolute'),
            roundingAbsolute: this._number('ap.tolerance.rounding_absolute'),
            source: 'properties'
        };
        if (!context) return fallback;
        var decision = this.decide('apTolerance', {
            company: context.company || '', country: context.country || '',
            vendor_type: context.vendorType || 'standard', invoice_type: context.invoiceType || 'po'
        }, ['quantity_tolerance_pct', 'price_tolerance_pct', 'tax_tolerance_abs', 'tax_tolerance_pct'], ['total_tolerance_abs', 'rounding_tolerance_abs']);
        if (!decision) return fallback;
        var values = {
            quantityPct: parseFloat(decision.values.quantity_tolerance_pct),
            pricePct: parseFloat(decision.values.price_tolerance_pct),
            taxAbsolute: parseFloat(decision.values.tax_tolerance_abs),
            taxRelativePct: parseFloat(decision.values.tax_tolerance_pct),
            totalAbsolute: decision.values.total_tolerance_abs === '' ? fallback.totalAbsolute : parseFloat(decision.values.total_tolerance_abs),
            roundingAbsolute: decision.values.rounding_tolerance_abs === '' ? fallback.roundingAbsolute : parseFloat(decision.values.rounding_tolerance_abs),
            source: 'decision table ' + decision.table + ' (' + decision.answer + ')'
        };
        for (var k in values) {
            if (k !== 'source' && (isNaN(values[k]) || values[k] < 0)) return fallback;
        }
        return values;
    },

    // Phase 40: the expected tax treatment of an AP invoice, from the BCFA AP
    // Tax Expectation decision table (country, company, vendor tax category)
    // or, without a row, the x_695068_bcfa.ap.tax.reference property. POC
    // REFERENCE DATA: configured expectations to compare the printed tax
    // against, not a tax engine and not data read from SAP.
    // Returns { regime, ratePct, whtApplicable, whtCode, whtRatePct, source }.
    // regime UNKNOWN means nothing is configured: the invoice cannot be
    // validated and goes to manual review.
    apTaxExpectation: function(context) {
        context = context || {};
        var decision = this.decide('apTax', {
            country: context.country || '', company: context.company || '', vendor_tax_category: context.vendorTaxCategory || 'goods'
        }, ['tax_regime', 'expected_rate_pct', 'wht_applicable'], ['wht_code', 'wht_rate_pct']);
        if (decision && decision.values.tax_regime !== 'UNKNOWN') {
            return {
                regime: decision.values.tax_regime,
                ratePct: parseFloat(decision.values.expected_rate_pct),
                whtApplicable: this._bool(decision.values.wht_applicable),
                whtCode: decision.values.wht_code || '',
                whtRatePct: decision.values.wht_rate_pct === '' ? null : parseFloat(decision.values.wht_rate_pct),
                source: 'decision table ' + decision.table + ' (' + decision.answer + ') - POC REFERENCE DATA'
            };
        }
        var reference = {};
        try { reference = JSON.parse(this._string('ap.tax.reference')); } catch (e) { reference = {}; }
        var row = reference[context.country || ''];
        if (row && row.regime) {
            return { regime: row.regime, ratePct: parseFloat(row.rate_pct), whtApplicable: false, whtCode: '', whtRatePct: null,
                source: 'property x_695068_bcfa.ap.tax.reference - POC REFERENCE DATA' };
        }
        return { regime: 'UNKNOWN', ratePct: null, whtApplicable: false, whtCode: '', whtRatePct: null,
            source: 'no tax expectation configured for country "' + (context.country || '') + '"' };
    },

    // Phase 42: BCFA Document Evidence Requirement decision table. context
    // { country, documentType ('ap_invoice'), company, vendorType,
    // invoiceType ('po' / 'non_po') }. Returns { stampRequired,
    // signatureRequired, manualReviewRequired, source }. POC BUSINESS
    // CONFIGURATION (for example: China AP invoices need a visible company
    // stamp), not a statement of law. Fallback property
    // x_695068_bcfa.document_evidence.stamp_required_countries (comma
    // separated countries, AP invoices only).
    documentEvidenceRequirement: function(context) {
        context = context || {};
        var decision = this.decide('documentEvidence', {
            country: context.country || '', document_type: context.documentType || '', company: context.company || '',
            vendor_type: context.vendorType || 'standard', invoice_type: context.invoiceType || ''
        }, ['stamp_required', 'signature_required', 'manual_review_required']);
        if (decision) {
            return {
                stampRequired: this._bool(decision.values.stamp_required),
                signatureRequired: this._bool(decision.values.signature_required),
                manualReviewRequired: this._bool(decision.values.manual_review_required),
                source: 'decision table ' + decision.table + ' (' + decision.answer + ') - POC BUSINESS CONFIGURATION'
            };
        }
        var countries = this._string('document_evidence.stamp_required_countries').split(',');
        var wanted = String(context.country || '').toLowerCase();
        var stamp = false;
        for (var i = 0; i < countries.length; i++) {
            if (wanted && countries[i].replace(/^\s+|\s+$/g, '').toLowerCase() === wanted && context.documentType === 'ap_invoice') stamp = true;
        }
        return { stampRequired: stamp, signatureRequired: false, manualReviewRequired: false,
            source: 'property x_695068_bcfa.document_evidence.stamp_required_countries - POC BUSINESS CONFIGURATION' };
    },

    // Phase 42: what the platform's reading can establish about stamps on
    // this instance: 'ocr_text' (text only, the measured capability) or
    // 'native_visual' (set only once a native image-understanding reading
    // has been verified on client samples).
    stampDetectionCapability: function() {
        var v = this._string('document_evidence.stamp_detection_capability');
        return v === 'native_visual' ? 'native_visual' : 'ocr_text';
    },

    // Phase 40: AR rounding difference that may be written off without an
    // approver, and the largest withholding-tax deduction accepted as a
    // fraction of the invoice amounts it covers.
    arRoundingMax: function() {
        return this._number('ar.rounding.max_amount');
    },

    arWithholdingMaxPct: function() {
        return this._number('ar.withholding.max_pct');
    },

    // BCFA AP Approval decision table: context { amount, exceptionType
    // ('none' for a clean invoice), variancePct (percent), company }.
    // Returns { required, group, rule, source }.
    apApprovalDecision: function(context) {
        var decision = this.decide('apApproval', {
            amount: context.amount || 0, exception_type: context.exceptionType || 'none',
            variance_pct: context.variancePct || 0, company: context.company || ''
        }, ['approval_required', 'approval_group']);
        if (decision) {
            var required = this._bool(decision.values.approval_required);
            return { required: required, group: decision.values.approval_group, source: 'decision table ' + decision.table,
                rule: (required ? 'Approval required' : 'No approval required') + ' by decision table ' + decision.table + ' (' + decision.answer + ') for amount ' +
                    context.amount + ', exception ' + (context.exceptionType || 'none') + ', variance ' + (context.variancePct || 0) + '%.' };
        }
        var fallback = this.apApprovalRule(context.amount);
        fallback.group = FinancePolicy.DEFAULT_APPROVAL_GROUP;
        fallback.source = 'properties';
        return fallback;
    },

    // BCFA AR Deduction decision table: context { deductionType, amount,
    // company }. Returns { allowed, approvalRequired, group, rule, source }.
    arDeductionDecision: function(context) {
        var decision = this.decide('arDeduction', {
            deduction_type: context.deductionType || '', amount: context.amount || 0, company: context.company || ''
        }, ['allowed', 'approval_required', 'approval_group']);
        if (decision) {
            return {
                allowed: this._bool(decision.values.allowed),
                approvalRequired: this._bool(decision.values.approval_required),
                group: decision.values.approval_group,
                source: 'decision table ' + decision.table,
                rule: 'Decision table ' + decision.table + ' (' + decision.answer + ') for ' + context.deductionType + ' ' + context.amount + '.'
            };
        }
        var threshold = this.arDeductionApprovalThreshold();
        return {
            allowed: this.arDeductionTypeAllowed(context.deductionType),
            approvalRequired: parseFloat(context.amount || '0') > threshold,
            group: FinancePolicy.DEFAULT_APPROVAL_GROUP,
            source: 'properties',
            rule: 'Properties: allowed types ' + this._string('ar.deduction.allowed_types') + ', finance approver above ' + threshold + '.'
        };
    },

    extractionConfidenceThreshold: function() {
        return this._number('ap.extraction.confidence_threshold');
    },

    // Phase 41: true when the name is one of the group's own companies
    // (x_695068_bcfa.own_company_names, comma separated, case-insensitive).
    isOwnCompany: function(name) {
        var n = String(name || '').toLowerCase().replace(/\s+/g, ' ');
        if (!n) return false;
        var list = this._string('own_company_names').split(',');
        for (var i = 0; i < list.length; i++) {
            var own = list[i].toLowerCase().replace(/\s+/g, ' ').trim();
            if (own && n.indexOf(own) >= 0) return true;
        }
        return false;
    },

    // Approval is required unless the gross amount is at or below the
    // configured auto-approve limit. The POC default limit is 0, so every
    // invoice goes to a human approver.
    apApprovalRule: function(grossAmount) {
        var limit = this._number('ap.approval.auto_approve_limit');
        var amount = parseFloat(grossAmount || '0');
        var required = !(limit > 0 && amount <= limit);
        return {
            required: required,
            limit: limit,
            rule: required
                ? 'Human approval required: gross ' + amount + (limit > 0 ? ' exceeds the auto-approve limit ' + limit : ' (auto-approve limit is 0, so every invoice needs approval)') + '.'
                : 'No approval required: gross ' + amount + ' is within the auto-approve limit ' + limit + '.'
        };
    },

    apExceptionSeverity: function(reasonCode, varianceAmount) {
        var severity = FinancePolicy.AP_BASE_SEVERITY[reasonCode] || 'medium';
        var tolerance = reasonCode === 'quantity_tolerance' || reasonCode === 'price_tolerance' || reasonCode === 'tax_validation';
        if (tolerance && Math.abs(parseFloat(varianceAmount || '0')) >= this._number('ap.exception.high_value_variance')) {
            severity = 'high';
        }
        return severity;
    },

    // Returns a GlideDateTime for the SLA due date of a new exception.
    apExceptionDueDate: function(severity) {
        return this._dueDate('ap.exception.sla_hours', severity);
    },

    // ---- AR (Phase 13) ----------------------------------------------------

    arApprovalRule: function(amount) {
        var limit = this._number('ar.approval.auto_approve_limit');
        var value = parseFloat(amount || '0');
        var required = !(limit > 0 && value <= limit);
        return {
            required: required,
            limit: limit,
            rule: required
                ? 'Human approval required: payment ' + value + (limit > 0 ? ' exceeds the auto-approve limit ' + limit : ' (auto-approve limit is 0, so every clearing needs approval)') + '.'
                : 'No approval required: payment ' + value + ' is within the auto-approve limit ' + limit + '.'
        };
    },

    // Minimum confidence for resolving a customer automatically from an
    // alias; below it the payment goes to a human as customer_ambiguous.
    arAutoMatchConfidence: function() {
        return this._number('ar.match.auto_confidence');
    },

    // Deductions above this amount need a finance approver to accept them.
    arDeductionApprovalThreshold: function() {
        return this._number('ar.deduction.approval_threshold');
    },

    // Largest short-pay residual the matching engine suggests as a bank
    // charge, and (Phase 35) the largest bank-charge deduction a reviewer
    // can approve.
    arBankChargeMax: function() {
        return this._number('ar.bank_charge.max_amount');
    },

    arDeductionTypeAllowed: function(type) {
        return this._inList('ar.deduction.allowed_types', type);
    },

    arExceptionSeverity: function(reasonCode, residual) {
        var severity = FinancePolicy.AR_BASE_SEVERITY[reasonCode] || 'medium';
        if ((reasonCode === 'short_pay' || reasonCode === 'over_pay') &&
            Math.abs(parseFloat(residual || '0')) >= this._number('ar.exception.high_value_residual')) {
            severity = 'high';
        }
        return severity;
    },

    arExceptionDueDate: function(severity) {
        return this._dueDate('ar.exception.sla_hours', severity);
    },

    arExceptionAssignmentGroup: function() {
        return this._string('ar.exception.assignment_group');
    },

    arExceptionDefaultOwner: function() {
        return this._string('ar.exception.default_owner');
    },

    _dueDate: function(key, severity) {
        var hours = 24;
        try {
            var table = JSON.parse(this._string(key));
            if (table && table[severity] > 0) hours = table[severity];
        } catch (e) {
            // Unparsable property: keep the 24h default.
        }
        var due = new GlideDateTime();
        due.addSeconds(Math.round(hours * 3600));
        return due;
    },

    _inList: function(key, value) {
        var allowed = this._string(key).split(',');
        for (var i = 0; i < allowed.length; i++) {
            if (allowed[i].trim() === value) return true;
        }
        return false;
    },

    apExceptionAssignmentGroup: function() {
        return this._string('ap.exception.assignment_group');
    },

    // How an approved payment is handed to SAP (client requirement):
    // 'direct' = the clearing instruction is processed by SAP immediately;
    // 'draft' = it is staged (parked) in SAP and only counts as cleared once
    // SAP confirms it. Anything else falls back to 'direct'.
    arSapProcessingMode: function() {
        return this._string('ar.sap_processing_mode') === 'draft' ? 'draft' : 'direct';
    },

    // Phase 40: the SAP adapter IntegrationService calls. Only the two SAP
    // adapters are accepted; anything else is MOCK SAP.
    sapAdapter: function() {
        return this._string('sap.adapter') === 'real_sap' ? 'real_sap' : 'mock_sap';
    },

    // Phase 41: how screens and audit texts name the SAP system answering.
    sapLabel: function() {
        return this.sapAdapter() === 'real_sap' ? 'SAP' : 'MOCK SAP';
    },

    apExceptionDefaultOwner: function() {
        return this._string('ap.exception.default_owner');
    },

    overrideAllowed: function(reasonCode) {
        return this._inList('ap.override.allowed_reasons', reasonCode);
    },

    _string: function(key) {
        var value = gs.getProperty(FinancePolicy.PREFIX + key);
        if (value === null || value === undefined || String(value).trim() === '') return String(FinancePolicy.DEFAULTS[key]);
        return String(value).trim();
    },

    _number: function(key) {
        var value = parseFloat(gs.getProperty(FinancePolicy.PREFIX + key));
        return isNaN(value) ? FinancePolicy.DEFAULTS[key] : value;
    },

    type: 'FinancePolicy'
};
