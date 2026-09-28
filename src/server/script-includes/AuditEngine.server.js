// The BCFA evidence chain: one append-only Audit Event row per business
// event (Phase 19). Every row captures process, record, event, before,
// after, user, AI agent where relevant, timestamp, reason and correlation
// ID. Rows are never updated or deleted (Audit Event - Append Only rule).
var AuditEngine = Class.create();

// Event vocabulary (event_type choices). Legacy values stay valid.
AuditEngine.EVENTS = {
    record_created: 'Record Created',
    document_uploaded: 'Document Uploaded',
    document_extracted: 'Document Extracted',
    field_corrected: 'Field Corrected',
    rule_evaluated: 'Rule Evaluated',
    match: 'Match',
    exception_created: 'Exception Created',
    exception_resolved: 'Exception Resolved',
    exception_escalated: 'Exception Escalated',
    ai_invocation: 'AI Agent Invocation',
    ai_recommendation: 'AI Recommendation',
    human_review: 'Human Review',
    approval_requested: 'Approval Requested',
    approval_decision: 'Approval Decision',
    override: 'Override',
    allocation: 'Allocation',
    deduction: 'Deduction',
    integration_call: 'Integration Call',
    integration_result: 'SAP / Mock Result',
    reconciliation: 'Reconciliation',
    closure: 'Closure',
    state_transition: 'State Transition',
    human_decision: 'Human Decision (legacy)'
};

AuditEngine.PROCESS_BY_TABLE = {
    x_695068_bcfa_ap_invoice: 'ap',
    x_695068_bcfa_ap_invoice_line: 'ap',
    x_695068_bcfa_ap_extraction: 'ap',
    x_695068_bcfa_ap_match: 'ap',
    x_695068_bcfa_ap_exception: 'ap',
    x_695068_bcfa_ap_approval: 'ap',
    x_695068_bcfa_payment: 'ar',
    x_695068_bcfa_remittance: 'ar',
    x_695068_bcfa_payment_allocation: 'ar',
    x_695068_bcfa_match_candidate: 'ar',
    x_695068_bcfa_deduction: 'ar',
    x_695068_bcfa_ar_exception: 'ar',
    x_695068_bcfa_ar_approval: 'ar',
    x_695068_bcfa_ar_open_item: 'ar',
    x_695068_bcfa_credit_note: 'ar',
    x_695068_bcfa_finance_intake: 'intake',
    x_695068_bcfa_integration_txn: 'integration'
};

// Default AI agent label when an AI actor type is given without one.
AuditEngine.AI_AGENT_BY_ACTOR = {
    simulated_ai: 'Simulated Document Intelligence',
    claude_ai: 'Claude (legacy provider)',
    now_assist_ai: 'Now Assist'
};

// Lifecycle states whose transition is itself a named business event.
AuditEngine.EVENT_BY_STATE = {
    EXTRACTED: 'document_extracted',
    VALIDATED: 'rule_evaluated',
    NORMALIZED: 'rule_evaluated',
    MATCHED: 'match',
    PARTIALLY_MATCHED: 'match',
    UNMATCHED: 'match',
    POSTED: 'integration_result',
    CLEARED: 'integration_result',
    UNKNOWN_OUTCOME: 'integration_result',
    FAILED: 'integration_result',
    RECONCILED: 'reconciliation',
    CLOSED: 'closure'
};

// Business fields a person may correct after intake; a change is audited
// as field_corrected by the Audit Field Corrections rules.
AuditEngine.CORRECTABLE_FIELDS = {
    x_695068_bcfa_ap_invoice: ['invoice_number', 'vendor', 'company_code', 'currency', 'invoice_date', 'posting_date', 'purchase_order',
        'sales_order_reference', 'gross_amount', 'tax_amount', 'net_amount'],
    x_695068_bcfa_ap_invoice_line: ['material_or_service', 'quantity', 'unit', 'unit_price', 'tax', 'amount', 'po_line', 'receipt_reference'],
    x_695068_bcfa_payment: ['bank_reference', 'value_date', 'posting_date', 'customer', 'currency', 'amount', 'bank_account'],
    x_695068_bcfa_remittance: ['remittance_reference', 'received_date'],
    x_695068_bcfa_finance_intake: ['document_type']
};

AuditEngine.eventForState = function(state) {
    return AuditEngine.EVENT_BY_STATE[state] || 'state_transition';
};

AuditEngine.prototype = {
    initialize: function() {},

    // Appends one Audit Event row. Never throws — a failure to audit must
    // not block the business transaction it's recording, but the caller
    // should still know: it returns '' on failure the same way GlideRecord
    // insert() does.
    // params: { eventType, sourceTable, sourceRecord, correlationId,
    //           process?, actor? (default: session user), actorType,
    //           aiAgent?, reason?, description, beforeValue, afterValue }
    logEvent: function(params) {
        params = params || {};
        try {
            var actorType = params.actorType || 'system';
            var gr = new GlideRecord('x_695068_bcfa_audit_event');
            gr.initialize();
            gr.setValue('correlation_id', params.correlationId || '');
            gr.setValue('process', params.process || AuditEngine.PROCESS_BY_TABLE[params.sourceTable] || 'platform');
            gr.setValue('source_table', params.sourceTable || '');
            gr.setValue('source_record', params.sourceRecord || '');
            gr.setValue('event_type', params.eventType || 'state_transition');
            // The user who performed or initiated the event.
            gr.setValue('actor', params.actor || gs.getUserID());
            gr.setValue('actor_type', actorType);
            gr.setValue('ai_agent', String(params.aiAgent || AuditEngine.AI_AGENT_BY_ACTOR[actorType] || '').substring(0, 100));
            gr.setValue('reason', String(params.reason || '').substring(0, 4000));
            gr.setValue('description', String(params.description || '').substring(0, 4000));
            if (params.beforeValue !== undefined && params.beforeValue !== null) {
                gr.setValue('before_value', JSON.stringify(params.beforeValue));
            }
            if (params.afterValue !== undefined && params.afterValue !== null) {
                gr.setValue('after_value', JSON.stringify(params.afterValue));
            }
            gr.setValue('occurred_at', new GlideDateTime().getValue());
            return gr.insert();
        } catch (e) {
            gs.error('BCFA AuditEngine: audit event not written: ' + e);
            return '';
        }
    },

    // field_corrected: one row listing every correctable field that changed
    // on an update. The first customer identification on a payment is not
    // a correction (ArDomainService audits it as a rule evaluation).
    logFieldChanges: function(current, previous) {
        var table = current.getTableName();
        var fields = AuditEngine.CORRECTABLE_FIELDS[table] || [];
        var before = {};
        var after = {};
        var names = [];
        for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            if (!current.isValidField(f)) continue;
            var was = previous.getValue(f) || '';
            var now = current.getValue(f) || '';
            if (was === now) continue;
            if (table === 'x_695068_bcfa_payment' && f === 'customer' && !was) continue;
            // Automatic classification sets the intake document type as part
            // of processing; only a change made outside processing counts.
            if (table === 'x_695068_bcfa_finance_intake' && (current.getValue('processing_status') === 'classifying' ||
                current.getValue('processing_status') !== previous.getValue('processing_status'))) continue;
            before[f] = was;
            after[f] = now;
            names.push(current.getElement(f).getLabel() + ': "' + (previous.getDisplayValue(f) || '') + '" -> "' + (current.getDisplayValue(f) || '') + '"');
        }
        if (!names.length) return '';
        return this.logEvent({
            correlationId: current.isValidField('correlation_id') ? current.getValue('correlation_id') : '',
            sourceTable: table,
            sourceRecord: current.getUniqueValue(),
            eventType: 'field_corrected',
            actorType: gs.isInteractive() ? 'user' : 'system',
            description: 'Field correction on ' + (current.getDisplayValue() || table) + ': ' + names.join('; '),
            beforeValue: before,
            afterValue: after
        });
    },

    type: 'AuditEngine'
};
