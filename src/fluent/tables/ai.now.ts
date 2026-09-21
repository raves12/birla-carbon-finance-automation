import {
    Table,
    StringColumn,
    ChoiceColumn,
    IntegerColumn,
    DecimalColumn,
    ReferenceColumn,
} from '@servicenow/sdk/core'

// AI Interaction Log — a dedicated, minimal audit trail for every outbound
// call to Claude, separate from Integration Transaction (x_695068_bcfa_
// integration_txn) on purpose: that table's mandatory-unique idempotency_key
// and closed mock_sap/mock_bank/mock_archive adapter list are shaped for
// idempotent financial-system writes, not advisory AI calls, and mixing the
// two would blur the "AI is advisory, SAP integration is authoritative"
// boundary this app is built around. Never stores the API key, the resolved
// Authorization header, or full raw prompt/response bodies — only the
// telemetry needed to debug and audit a call.

export const x_695068_bcfa_ai_interaction = Table({
    name: 'x_695068_bcfa_ai_interaction',
    label: 'AI Interaction',
    display: 'operation',
    audit: true,
    schema: {
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64 }),
        source_table: StringColumn({ label: 'Source Table', maxLength: 80 }),
        source_record: StringColumn({ label: 'Source Record', maxLength: 32 }),
        operation: ChoiceColumn({
            label: 'Operation',
            mandatory: true,
            choices: {
                connectivity_test: 'Connectivity Test',
                extract_invoice: 'Extract Invoice',
                extract_remittance: 'Extract Remittance',
                explain_ap_exception: 'Explain AP Exception',
                explain_ar_exception: 'Explain AR Exception',
                recommend_cash_match: 'Recommend Cash Match',
                rank_candidates: 'Rank Candidates (Fuzzy Match)',
                classify_finance_document: 'Classify Finance Document',
                extract_ap_invoice_document: 'Extract AP Invoice Document',
                extract_ar_payment_advice_document: 'Extract AR Payment Advice Document',
                extract_ar_remittance_document: 'Extract AR Remittance Document',
            },
        }),
        claude_model: StringColumn({ label: 'Claude Model', maxLength: 100 }),
        prompt_version: StringColumn({ label: 'Prompt Version', maxLength: 20 }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            choices: {
                success: 'Success',
                http_error: 'HTTP Error',
                timeout: 'Timeout',
                invalid_response: 'Invalid Response',
                credential_error: 'Credential Error',
                disabled: 'Disabled',
                refused: 'Refused',
            },
        }),
        http_status: IntegerColumn({ label: 'HTTP Status' }),
        claude_request_id: StringColumn({ label: 'Claude Request ID', maxLength: 100 }),
        latency_ms: IntegerColumn({ label: 'Latency (ms)' }),
        input_tokens: IntegerColumn({ label: 'Input Tokens' }),
        output_tokens: IntegerColumn({ label: 'Output Tokens' }),
        confidence: DecimalColumn({ label: 'Confidence', scale: 2 }),
        safe_error: StringColumn({
            label: 'Safe Error',
            maxLength: 4000,
            hint: 'Human-readable failure description only — never exception internals, request/response bodies, or credential material.',
        }),
        initiated_by: ReferenceColumn({ label: 'Initiated By', referenceTable: 'sys_user' }),
    },
})
