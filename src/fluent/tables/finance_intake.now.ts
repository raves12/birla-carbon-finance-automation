import {
    Table,
    StringColumn,
    ChoiceColumn,
    BooleanColumn,
    DecimalColumn,
    DateTimeColumn,
    JsonColumn,
    ReferenceColumn,
} from '@servicenow/sdk/core'

// Finance Document Intake — the single entry point for TRUE document-to-
// transaction processing (raw PDF/image in, AP Invoice or Payment/Remittance
// out). This table exists specifically so a user can attach a real document
// BEFORE any AP/AR transaction exists, which inverts today's flow (AP
// Invoice/Payment created first, extraction fed pre-supplied context second
// — see ApDomainService.intakeInvoice / ArDomainService.intakePayment).
// FinanceDocumentIntakeService is the only script that writes to this table
// and to the AP/AR domain tables it creates; ApDomainService/ArDomainService
// remain the sole authority over state/approval_state/posting_state once a
// transaction exists. Standard ServiceNow attachments are used (no special
// per-table flag is required for a table to accept attachments).
export const x_695068_bcfa_finance_intake = Table({
    name: 'x_695068_bcfa_finance_intake',
    label: 'Finance Document Intake',
    display: 'number',
    audit: true,
    autoNumber: {
        prefix: 'FDI',
        numberOfDigits: 7,
    },
    schema: {
        // NOT mandatory at the dictionary level, deliberately — the
        // platform's own auto-number generation populates this on insert
        // (see autoNumber above), which is too late to satisfy a
        // client-side mandatory check; every OOB auto-numbered table
        // (incident.number, task.number, ...) follows the same pattern.
        // `primary: true` is what actually tells the platform's insert()
        // this is THE number field to auto-generate against the sys_number
        // counter — without it the counter record exists but is never
        // consulted (confirmed live: the counter stayed at its initial
        // value after a real insert with this flag missing).
        number: StringColumn({ label: 'Number', primary: true }),
        source: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Source',
            default: 'workspace_upload',
            choices: {
                workspace_upload: 'Workspace Upload',
                email: 'Email',
                shared_drive: 'Shared Drive',
                manual: 'Manual Entry',
            },
        }),
        source_reference: StringColumn({
            label: 'Source Reference',
            maxLength: 200,
            hint: 'Free-text origin reference — e.g. an email message ID — used alongside attachment_hash for Phase 10 duplicate-intake detection.',
        }),
        document_type: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Document Type',
            default: 'unknown',
            choices: {
                unknown: 'Unknown',
                ap_invoice: 'AP Invoice',
                ar_payment_advice: 'AR Payment Advice',
                ar_remittance: 'AR Remittance',
            },
        }),
        processing_status: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Processing Status',
            mandatory: true,
            default: 'new',
            choices: {
                new: 'New',
                classifying: 'Classifying',
                extracting: 'Extracting',
                review_required: 'Review Required',
                processing: 'Processing',
                completed: 'Completed',
                failed: 'Failed',
            },
        }),
        classification_confidence: DecimalColumn({ label: 'Classification Confidence', scale: 2 }),
        classification_reason: StringColumn({
            label: 'Classification Reason',
            maxLength: 1000,
            hint: 'How the document type was decided (set at upload; automatic document classification is not configured). Older rows hold the reason the Claude classifier returned (removed in Phase 34).',
        }),
        extraction_confidence: DecimalColumn({ label: 'Extraction Confidence', scale: 2 }),
        company_code: StringColumn({ label: 'Company Code', maxLength: 10 }),
        currency: StringColumn({ label: 'Currency', maxLength: 3 }),
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64 }),
        claude_request_id: StringColumn({ label: 'Provider Request ID (legacy)', maxLength: 100 }),
        attachment_hash: StringColumn({
            label: 'Attachment Hash',
            maxLength: 64,
            hint: 'SHA-256 of the primary attachment content, computed at classification time. Phase 10 duplicate-intake detection key, independent of the existing AP Invoice duplicate_key check (vendor+invoice_number+amount), which only runs after a transaction already exists.',
        }),
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice' }),
        payment: ReferenceColumn({ label: 'Payment', referenceTable: 'x_695068_bcfa_payment' }),
        remittance: ReferenceColumn({ label: 'Remittance', referenceTable: 'x_695068_bcfa_remittance' }),
        // Phase 41, defect 1: the canonical (earliest) intake of the same
        // document content. Set only on a later duplicate; a canonical intake
        // never points at a duplicate, so references cannot loop.
        duplicate_of: ReferenceColumn({
            label: 'Duplicate Of',
            referenceTable: 'x_695068_bcfa_finance_intake',
            readOnly: true,
            hint: 'The earlier intake of the same document (same content hash). This intake creates no transaction; it shows the original\'s result.',
        }),
        processing_error: StringColumn({
            label: 'Processing Error',
            maxLength: 4000,
            hint: 'Human-readable failure description only — never exception internals or credential material (same discipline as ai_interaction.safe_error).',
        }),
        // Phase 41, defect 7: the extracted data in readable sections.
        extraction_summary: StringColumn({ label: 'Extracted Data (readable)', maxLength: 4000, readOnly: true }),
        extraction_json: JsonColumn({
            label: 'Extraction JSON',
            hint: 'Full, unedited structured extraction result. Retained verbatim for audit even after a reviewer corrects a value — see Phase 9/11.',
        }),
        // Phase 40: which provider read the document, and the Document
        // Intelligence task of a native extraction (one task per attachment).
        extraction_provider: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Extraction Provider',
            choices: {
                native: 'Native: ServiceNow Document Intelligence (Now LLM)',
                simulated: 'SIMULATED DOCUMENT EXTRACTION — POC',
            },
        }),
        extraction_task: StringColumn({
            label: 'Extraction Task',
            maxLength: 32,
            hint: 'Document Intelligence task (sys_di_task) of the native extraction of the current attachment.',
        }),
        requires_review: BooleanColumn({ label: 'Requires Review', default: false }),
        reviewed_by: ReferenceColumn({ label: 'Reviewed By', referenceTable: 'sys_user' }),
        reviewed_at: DateTimeColumn({ label: 'Reviewed At' }),
    },
    index: [{ unique: false, element: 'attachment_hash' }],
})
