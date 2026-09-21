import {
    Table,
    StringColumn,
    ChoiceColumn,
    BooleanColumn,
    IntegerColumn,
    DecimalColumn,
    DateTimeColumn,
    JsonColumn,
    ReferenceColumn,
} from '@servicenow/sdk/core'

// Cross-cutting tables: correlation/idempotency tracking, generic exceptions,
// deterministic-rule execution log, reference-data mapping, audit trail, and
// mock-adapter behavior configuration. See docs/ARCHITECTURE.md section 3
// ("Integration Service", "Audit Engine") and Section 9 of the build brief.

export const x_695068_bcfa_integration_txn = Table({
    name: 'x_695068_bcfa_integration_txn',
    label: 'Integration Transaction',
    display: 'correlation_id',
    audit: true,
    schema: {
        correlation_id: StringColumn({ label: 'Correlation ID', mandatory: true, maxLength: 64 }),
        idempotency_key: StringColumn({ label: 'Idempotency Key', mandatory: true, maxLength: 128, unique: true }),
        operation: StringColumn({
            label: 'Operation',
            mandatory: true,
            maxLength: 64,
            hint: 'Canonical business-level operation name, e.g. postVendorInvoice, clearPayment, getVendor',
        }),
        source_table: StringColumn({ label: 'Source Table', maxLength: 80 }),
        source_record: StringColumn({ label: 'Source Record', maxLength: 32, hint: 'sys_id of the AP/AR record this call was made for' }),
        adapter: ChoiceColumn({
            label: 'Adapter',
            mandatory: true,
            choices: { mock_sap: 'Mock SAP Adapter', mock_bank: 'Mock Bank Adapter', mock_archive: 'Mock Archive Adapter' },
        }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            default: 'pending',
            choices: {
                pending: 'Pending',
                success: 'Success',
                validation_error: 'Validation Error',
                technical_error: 'Technical Error',
                timeout: 'Timeout',
                duplicate: 'Duplicate',
                unknown_outcome: 'Unknown Outcome',
                reconciled: 'Reconciled',
                failed: 'Failed',
            },
        }),
        attempt: IntegerColumn({ label: 'Attempt', default: 1, min: 1 }),
        request_payload: JsonColumn({ label: 'Request Payload' }),
        response_payload: JsonColumn({ label: 'Response Payload' }),
        error_code: StringColumn({ label: 'Error Code', maxLength: 64 }),
        error_message: StringColumn({ label: 'Error Message', maxLength: 4000 }),
        external_document_id: StringColumn({ label: 'External Document ID', maxLength: 64, hint: 'SAP or bank document reference once known' }),
        unknown_outcome_flag: BooleanColumn({ label: 'Unknown Outcome', default: false }),
        requested_at: DateTimeColumn({ label: 'Requested At' }),
        completed_at: DateTimeColumn({ label: 'Completed At' }),
    },
})

export const x_695068_bcfa_finance_exception = Table({
    name: 'x_695068_bcfa_finance_exception',
    label: 'Finance Exception',
    display: 'reason_code',
    audit: true,
    schema: {
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64 }),
        domain: ChoiceColumn({
            label: 'Domain',
            mandatory: true,
            choices: { ap: 'Accounts Payable', ar: 'Accounts Receivable', integration: 'Integration', general: 'General' },
        }),
        source_table: StringColumn({ label: 'Source Table', maxLength: 80 }),
        source_record: StringColumn({ label: 'Source Record', maxLength: 32 }),
        reason_code: StringColumn({ label: 'Reason Code', mandatory: true, maxLength: 64 }),
        description: StringColumn({ label: 'Description', maxLength: 4000 }),
        severity: ChoiceColumn({
            label: 'Severity',
            default: 'medium',
            choices: { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' },
        }),
        status: ChoiceColumn({
            label: 'Status',
            default: 'open',
            choices: { open: 'Open', in_review: 'In Review', resolved: 'Resolved', closed: 'Closed' },
        }),
        assigned_to: ReferenceColumn({ label: 'Assigned To', referenceTable: 'sys_user' }),
        resolution_notes: StringColumn({ label: 'Resolution Notes', maxLength: 4000 }),
    },
})

export const x_695068_bcfa_decision_log = Table({
    name: 'x_695068_bcfa_decision_log',
    label: 'Decision Log',
    display: 'rule_name',
    schema: {
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64 }),
        transaction_reference: StringColumn({ label: 'Transaction Reference', maxLength: 32, hint: 'sys_id of the AP Invoice or Payment this decision was evaluated for' }),
        rule_name: StringColumn({ label: 'Rule Name', mandatory: true, maxLength: 100 }),
        rule_version: StringColumn({ label: 'Rule Version', maxLength: 40 }),
        domain: ChoiceColumn({ label: 'Domain', mandatory: true, choices: { ap: 'Accounts Payable', ar: 'Accounts Receivable' } }),
        input_snapshot: JsonColumn({ label: 'Input Snapshot' }),
        result: JsonColumn({ label: 'Result' }),
        passed: BooleanColumn({ label: 'Passed' }),
        executed_at: DateTimeColumn({ label: 'Executed At' }),
    },
})

export const x_695068_bcfa_reference_mapping = Table({
    name: 'x_695068_bcfa_reference_mapping',
    label: 'Reference Mapping',
    display: 'external_value',
    schema: {
        mapping_type: ChoiceColumn({
            label: 'Mapping Type',
            mandatory: true,
            choices: {
                vendor: 'Vendor',
                customer: 'Customer',
                material: 'Material',
                gl_account: 'GL Account',
                currency: 'Currency',
                payment_terms: 'Payment Terms',
            },
        }),
        external_system: StringColumn({ label: 'External System', maxLength: 40, default: 'SAP_ECC' }),
        external_value: StringColumn({ label: 'External Value', mandatory: true, maxLength: 100 }),
        internal_value: StringColumn({ label: 'Internal Value', maxLength: 100 }),
        internal_reference_table: StringColumn({ label: 'Internal Reference Table', maxLength: 80 }),
        internal_reference_record: StringColumn({ label: 'Internal Reference Record', maxLength: 32 }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
})

export const x_695068_bcfa_customer_alias = Table({
    name: 'x_695068_bcfa_customer_alias',
    label: 'Customer Alias',
    display: 'alias_name',
    schema: {
        customer: ReferenceColumn({ label: 'Customer', referenceTable: 'x_695068_bcfa_customer', mandatory: true }),
        alias_name: StringColumn({ label: 'Alias Name', mandatory: true, maxLength: 200 }),
        alias_type: ChoiceColumn({
            label: 'Alias Type',
            choices: {
                legal_name: 'Legal Name',
                trade_name: 'Trade Name',
                bank_remitter_name: 'Bank Remitter Name',
                misspelling: 'Known Misspelling',
            },
        }),
        confidence: DecimalColumn({ label: 'Confidence Weight', scale: 2, default: 1 }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
})

export const x_695068_bcfa_audit_event = Table({
    name: 'x_695068_bcfa_audit_event',
    label: 'Audit Event',
    display: 'event_type',
    schema: {
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64 }),
        source_table: StringColumn({ label: 'Source Table', maxLength: 80 }),
        source_record: StringColumn({ label: 'Source Record', maxLength: 32 }),
        event_type: ChoiceColumn({
            label: 'Event Type',
            mandatory: true,
            choices: {
                state_transition: 'State Transition',
                approval_decision: 'Approval Decision',
                integration_call: 'Integration Call',
                ai_recommendation: 'AI Recommendation',
                exception_created: 'Exception Created',
                exception_resolved: 'Exception Resolved',
            },
        }),
        actor: ReferenceColumn({ label: 'Actor', referenceTable: 'sys_user' }),
        actor_type: ChoiceColumn({
            label: 'Actor Type',
            mandatory: true,
            default: 'system',
            choices: { user: 'User', system: 'System', simulated_ai: 'Simulated AI (advisory, legacy)', claude_ai: 'Claude (advisory)' },
        }),
        description: StringColumn({ label: 'Description', maxLength: 4000 }),
        before_value: JsonColumn({ label: 'Before Value' }),
        after_value: JsonColumn({ label: 'After Value' }),
        occurred_at: DateTimeColumn({ label: 'Occurred At' }),
    },
})

export const x_695068_bcfa_integration_profile = Table({
    name: 'x_695068_bcfa_integration_profile',
    label: 'Integration Profile',
    display: 'name',
    schema: {
        name: StringColumn({ label: 'Name', mandatory: true, unique: true, maxLength: 100 }),
        adapter: ChoiceColumn({
            label: 'Adapter',
            mandatory: true,
            choices: { mock_sap: 'Mock SAP Adapter', mock_bank: 'Mock Bank Adapter', mock_archive: 'Mock Archive Adapter' },
        }),
        mode: ChoiceColumn({
            label: 'Mode',
            default: 'simulation',
            choices: { simulation: 'Simulation', passthrough: 'Passthrough (future real connectivity)' },
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
        response_delay_ms: IntegerColumn({ label: 'Response Delay (ms)', default: 0, min: 0 }),
        failure_mode: ChoiceColumn({
            label: 'Failure Mode',
            default: 'success',
            choices: {
                success: 'Success',
                validation_error: 'Validation Error',
                technical_error: 'Technical Error',
                timeout: 'Timeout',
                duplicate: 'Duplicate',
                delayed_response: 'Delayed Response',
                partial_response: 'Partial Response',
                unknown_outcome: 'Unknown Outcome',
            },
        }),
        failure_code: StringColumn({ label: 'Failure Code', maxLength: 40 }),
        retry_policy: StringColumn({ label: 'Retry Policy Name', maxLength: 100 }),
    },
})
