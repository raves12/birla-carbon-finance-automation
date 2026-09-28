// Single read point for the configurable BCFA finance policy (Phase 12).
// Every value comes from an x_695068_bcfa.* system property (see
// src/fluent/config/policy_properties.now.ts). The initial values are
// synthetic POC ASSUMPTIONS, not Birla Carbon production rules. The
// defaults below apply only when a property is missing or unparsable, so
// a bad edit can never switch a control off.
var FinancePolicy = Class.create();

FinancePolicy.PREFIX = 'x_695068_bcfa.';

FinancePolicy.DEFAULTS = {
    'ai.provider': 'native',
    'ap.tolerance.quantity_pct': 0.02,
    'ap.tolerance.price_pct': 0.02,
    'ap.tolerance.tax_absolute': 1,
    'ap.tolerance.tax_relative_pct': 0.02,
    'ap.extraction.confidence_threshold': 0.85,
    'ap.approval.auto_approve_limit': 0,
    'ap.exception.high_value_variance': 1000,
    'ap.exception.sla_hours': '{"critical":4,"high":8,"medium":24,"low":72}',
    'ap.exception.assignment_group': '',
    'ap.exception.default_owner': '',
    'ap.override.allowed_reasons': 'quantity_tolerance,price_tolerance,tax_validation'
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

FinancePolicy.prototype = {
    initialize: function() {},

    // 'native' (ServiceNow AI: Now Assist skills/agents, simulated document
    // extraction until DocIntel extraction is licensed), 'claude' (legacy,
    // removed in Phase 34) or 'simulated' (deterministic templates only).
    aiProvider: function() {
        var value = this._string('ai.provider');
        return value === 'claude' || value === 'simulated' ? value : 'native';
    },

    apTolerances: function() {
        return {
            quantityPct: this._number('ap.tolerance.quantity_pct'),
            pricePct: this._number('ap.tolerance.price_pct'),
            taxAbsolute: this._number('ap.tolerance.tax_absolute'),
            taxRelativePct: this._number('ap.tolerance.tax_relative_pct')
        };
    },

    extractionConfidenceThreshold: function() {
        return this._number('ap.extraction.confidence_threshold');
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
        var hours = 24;
        try {
            var table = JSON.parse(this._string('ap.exception.sla_hours'));
            if (table && table[severity] > 0) hours = table[severity];
        } catch (e) {
            // Unparsable property: keep the 24h default.
        }
        var due = new GlideDateTime();
        due.addSeconds(Math.round(hours * 3600));
        return due;
    },

    apExceptionAssignmentGroup: function() {
        return this._string('ap.exception.assignment_group');
    },

    apExceptionDefaultOwner: function() {
        return this._string('ap.exception.default_owner');
    },

    overrideAllowed: function(reasonCode) {
        var allowed = this._string('ap.override.allowed_reasons').split(',');
        for (var i = 0; i < allowed.length; i++) {
            if (allowed[i].trim() === reasonCode) return true;
        }
        return false;
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
