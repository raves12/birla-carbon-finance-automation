import {
    Table,
    StringColumn,
    ChoiceColumn,
    IntegerColumn,
    DecimalColumn,
    ReferenceColumn,
    BooleanColumn,
    DateTimeColumn,
} from '@servicenow/sdk/core'

// AI Interaction Log (Phase 20: provider-agnostic) — one row per AI
// execution: Now Assist skills and agentic workflows, the simulated Document
// Intelligence extraction; the Claude client wrote rows until it was removed
// in Phase 34 (kept as evidence). Written by AiInteractionLog. Prompts
// are never stored: the input is identified by input_context_id (SHA-256)
// and input_context_size. The claude_model / claude_request_id columns keep
// their names but hold the model and provider request ID of any provider.
//
// Originally a dedicated, minimal audit trail for every outbound
// call to Claude (removed in Phase 34), separate from Integration Transaction (x_695068_bcfa_
// integration_txn) on purpose: that table's mandatory-unique idempotency_key
// and closed mock_sap/mock_bank/mock_archive adapter list are shaped for
// idempotent financial-system writes, not advisory AI calls, and mixing the
// two would blur the "AI is advisory, SAP integration is authoritative"
// boundary this app is built around. Never stores the API key, the resolved
// Authorization header, or full raw prompt/response bodies — only the
// telemetry needed to debug and audit a call.

export const x_695068_bcfa_ai_interaction = Table({
    name: 'x_695068_bcfa_ai_interaction',
    label: 'AI Interaction Log',
    display: 'operation',
    audit: true,
    schema: {
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64 }),
        source_table: StringColumn({ label: 'Source Table', maxLength: 80 }),
        source_record: StringColumn({ label: 'Source Record', maxLength: 32 }),
        operation: ChoiceColumn({
            dropdown: 'dropdown_with_none',
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
                ap_invoice_summary: 'AP Invoice Summary',
                ap_match_exception_explanation: 'AP Match Exception Explanation',
                ap_recommended_next_action: 'AP Recommended Next Action',
                ap_clarification_draft: 'AP Clarification Draft',
                cash_application_summary: 'Cash Application Summary',
                ar_match_explanation: 'AR Match Explanation',
                ar_residual_explanation: 'AR Residual Explanation',
                ar_recommended_next_action: 'AR Recommended Next Action',
                customer_clarification_draft: 'Customer Clarification Draft',
                exception_review: 'Exception Review',
                suggest_top_candidate: 'Suggest Top Candidate',
            },
        }),
        process: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Process',
            default: 'platform',
            choices: { ap: 'Accounts Payable', ar: 'Accounts Receivable', intake: 'Document Intake', integration: 'Integration', platform: 'Platform' },
        }),
        provider: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Provider',
            choices: {
                now_assist: 'Now Assist (Now LLM)',
                simulated: 'Simulated (deterministic, no model)',
                claude_legacy: 'Claude (legacy, removed in Phase 34)',
            },
        }),
        capability: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'AI Capability',
            choices: {
                document_classification: 'Document Classification',
                document_extraction: 'Document Extraction',
                summarization: 'Summarization',
                exception_explanation: 'Exception Explanation',
                next_action_recommendation: 'Next Action Recommendation',
                exception_review: 'Exception Review (agentic workflow)',
                match_explanation: 'Match Explanation',
                residual_explanation: 'Residual Explanation',
                cash_match_recommendation: 'Cash Match Recommendation',
                candidate_ranking: 'Candidate Ranking',
                communication_draft: 'Communication Draft',
                connectivity_test: 'Connectivity Test',
            },
        }),
        skill: StringColumn({ label: 'Skill', maxLength: 100 }),
        agent: StringColumn({ label: 'AI Agent', maxLength: 100 }),
        agentic_workflow: StringColumn({ label: 'Agentic Workflow', maxLength: 100 }),
        input_context_id: StringColumn({ label: 'Input Context ID', maxLength: 80, hint: 'sha256 of the input context sent to the model. The context itself is not stored.' }),
        input_context_size: IntegerColumn({ label: 'Input Context Size (chars)' }),
        result_summary: StringColumn({ label: 'Result', maxLength: 1000, hint: 'First 1,000 characters of the output. The full advisory note is on the record it was saved to.' }),
        recommendation: StringColumn({ label: 'Recommendation', maxLength: 1000, hint: 'The recommendation section of the output, compared with the human decision.' }),
        started_at: DateTimeColumn({ label: 'Started At' }),
        completed_at: DateTimeColumn({ label: 'Completed At' }),
        human_accepted: BooleanColumn({ label: 'Human Accepted', default: false }),
        human_overridden: BooleanColumn({ label: 'Human Overridden', default: false }),
        override_reason: StringColumn({ label: 'Override Reason', maxLength: 1000 }),
        human_decision: StringColumn({ label: 'Human Decision', maxLength: 100 }),
        human_decided_by: ReferenceColumn({ label: 'Human Decided By', referenceTable: 'sys_user' }),
        human_decided_at: DateTimeColumn({ label: 'Human Decided At' }),
        // Phase 21: what the guardrails did with this execution.
        guardrail_action: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Guardrail Action',
            default: 'none',
            choices: { none: 'None', sanitized: 'Output sanitized', blocked: 'Blocked (not sent)', guardian_blocked: 'Blocked by Now Assist Guardian' },
        }),
        guardrail_reason: StringColumn({ label: 'Guardrail Reason', maxLength: 1000 }),
        claude_model: StringColumn({ label: 'Model', maxLength: 100 }),
        prompt_version: StringColumn({ label: 'Prompt Version', maxLength: 20 }),
        status: ChoiceColumn({
            dropdown: 'dropdown_with_none',
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
                started: 'Started',
                failed: 'Failed',
            },
        }),
        http_status: IntegerColumn({ label: 'HTTP Status' }),
        claude_request_id: StringColumn({ label: 'Provider Request ID', maxLength: 100 }),
        latency_ms: IntegerColumn({ label: 'Duration (ms)' }),
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
