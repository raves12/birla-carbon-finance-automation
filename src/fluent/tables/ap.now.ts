import {
    Table,
    StringColumn,
    ChoiceColumn,
    BooleanColumn,
    IntegerColumn,
    DecimalColumn,
    DateColumn,
    DateTimeColumn,
    JsonColumn,
    ReferenceColumn,
} from '@servicenow/sdk/core'

// AP domain tables. `state` is a plain StringColumn managed by the AP Invoice
// StateModel (Stage 5) rather than a dictionary choice list, since the state
// model owns the canonical state values, labels and gated transitions.

export const x_695068_bcfa_ap_invoice = Table({
    name: 'x_695068_bcfa_ap_invoice',
    label: 'AP Invoice',
    display: 'invoice_number',
    audit: true,
    schema: {
        invoice_number: StringColumn({ label: 'Invoice Number', mandatory: true, maxLength: 40 }),
        vendor: ReferenceColumn({ label: 'Vendor', referenceTable: 'x_695068_bcfa_vendor' }),
        company_code: StringColumn({ label: 'Company Code', maxLength: 10 }),
        currency: StringColumn({ label: 'Currency', maxLength: 3 }),
        invoice_date: DateColumn({ label: 'Invoice Date' }),
        posting_date: DateColumn({ label: 'Posting Date' }),
        purchase_order: ReferenceColumn({ label: 'Purchase Order', referenceTable: 'x_695068_bcfa_purchase_order' }),
        sales_order_reference: StringColumn({
            label: 'Sales Order Reference',
            maxLength: 40,
            hint: 'Kept generic pending clarification of what "SO" means in AP invoice processing (workbook D-08 — open item)',
        }),
        gross_amount: DecimalColumn({ label: 'Gross Amount', scale: 2 }),
        tax_amount: DecimalColumn({ label: 'Tax Amount', scale: 2 }),
        net_amount: DecimalColumn({ label: 'Net Amount', scale: 2 }),
        extraction_confidence: DecimalColumn({ label: 'Extraction Confidence', scale: 2 }),
        state: StringColumn({ label: 'State', maxLength: 40, hint: 'Managed by the AP Invoice StateModel' }),
        source: ChoiceColumn({
            label: 'Source',
            default: 'email',
            choices: { email: 'Email', shared_drive: 'Shared Drive', manual: 'Manual Entry' },
        }),
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64 }),
        external_reference: StringColumn({ label: 'External Reference', maxLength: 64 }),
        duplicate_key: StringColumn({ label: 'Duplicate Key', maxLength: 100, hint: 'Hash of vendor+invoice_number+amount used for duplicate detection' }),
        approval_state: ChoiceColumn({
            label: 'Approval State',
            default: 'not_required',
            choices: { not_required: 'Not Required', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
        }),
        posting_state: ChoiceColumn({
            label: 'Posting State',
            default: 'not_posted',
            choices: {
                not_posted: 'Not Posted',
                posting: 'Posting',
                posted: 'Posted',
                failed: 'Failed',
                unknown_outcome: 'Unknown Outcome',
            },
        }),
        sap_document_id: StringColumn({ label: 'SAP Document ID', maxLength: 20 }),
    },
    index: [{ unique: false, element: 'duplicate_key' }],
})

export const x_695068_bcfa_ap_invoice_line = Table({
    name: 'x_695068_bcfa_ap_invoice_line',
    label: 'AP Invoice Line',
    display: 'material_or_service',
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        line_number: IntegerColumn({ label: 'Line Number', mandatory: true, min: 1 }),
        material_or_service: StringColumn({ label: 'Material / Service', maxLength: 200 }),
        quantity: DecimalColumn({ label: 'Quantity', scale: 2 }),
        unit: StringColumn({ label: 'Unit', maxLength: 10 }),
        unit_price: DecimalColumn({ label: 'Unit Price', scale: 2 }),
        tax: DecimalColumn({ label: 'Tax', scale: 2 }),
        amount: DecimalColumn({ label: 'Amount', scale: 2 }),
        po_line: ReferenceColumn({ label: 'PO Line', referenceTable: 'x_695068_bcfa_po_line' }),
        receipt_reference: ReferenceColumn({ label: 'Receipt Reference', referenceTable: 'x_695068_bcfa_receipt' }),
    },
})

export const x_695068_bcfa_ap_extraction = Table({
    name: 'x_695068_bcfa_ap_extraction',
    label: 'AP Extraction',
    display: 'ap_invoice',
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        extracted_fields: JsonColumn({ label: 'Extracted Fields' }),
        confidence: DecimalColumn({ label: 'Confidence', scale: 2 }),
        source: ChoiceColumn({
            label: 'Source',
            default: 'claude_document_intelligence',
            choices: {
                claude_document_intelligence: 'Claude (JSON-context extraction)',
                simulated_document_intelligence: 'Simulated (deterministic fallback, legacy)',
                now_assist_document_intelligence: 'Now Assist in Document Intelligence (not licensed in this PDI)',
            },
            hint: 'Records which engine actually produced this extraction row. Claude is tried first when x_695068_bcfa.claude.enabled is true; the simulated fallback runs only if Claude is disabled or unavailable.',
        }),
        requires_review: BooleanColumn({ label: 'Requires Review', default: false }),
        reviewed_by: ReferenceColumn({ label: 'Reviewed By', referenceTable: 'sys_user' }),
        reviewed_at: DateTimeColumn({ label: 'Reviewed At' }),
    },
})

export const x_695068_bcfa_ap_match = Table({
    name: 'x_695068_bcfa_ap_match',
    label: 'AP Match',
    display: 'ap_invoice',
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        po_line: ReferenceColumn({ label: 'PO Line', referenceTable: 'x_695068_bcfa_po_line' }),
        receipt: ReferenceColumn({ label: 'Receipt', referenceTable: 'x_695068_bcfa_receipt' }),
        quantity_variance: DecimalColumn({ label: 'Quantity Variance', scale: 2 }),
        price_variance: DecimalColumn({ label: 'Price Variance', scale: 2 }),
        tax_variance: DecimalColumn({ label: 'Tax Variance', scale: 2 }),
        within_tolerance: BooleanColumn({ label: 'Within Tolerance' }),
        match_result: ChoiceColumn({
            label: 'Match Result',
            choices: { matched: 'Matched', partial: 'Partial', mismatch: 'Mismatch' },
        }),
        evaluated_at: DateTimeColumn({ label: 'Evaluated At' }),
    },
})

export const x_695068_bcfa_ap_exception = Table({
    name: 'x_695068_bcfa_ap_exception',
    label: 'AP Exception',
    display: 'reason_code',
    audit: true,
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        reason_code: ChoiceColumn({
            label: 'Reason Code',
            mandatory: true,
            choices: {
                duplicate: 'Duplicate Invoice',
                po_mismatch: 'PO Mismatch',
                quantity_tolerance: 'Quantity Tolerance Failure',
                price_tolerance: 'Price Tolerance Failure',
                tax_validation: 'Tax Validation Failure',
                low_confidence: 'Low-Confidence Extraction',
                missing_field: 'Missing Mandatory Field',
                vendor_invalid: 'Vendor Invalid',
                other: 'Other',
            },
        }),
        description: StringColumn({ label: 'Description', maxLength: 4000 }),
        status: ChoiceColumn({
            label: 'Status',
            default: 'open',
            choices: { open: 'Open', in_review: 'In Review', resolved: 'Resolved', closed: 'Closed' },
        }),
        assigned_to: ReferenceColumn({ label: 'Assigned To', referenceTable: 'sys_user' }),
        resolution_notes: StringColumn({ label: 'Resolution Notes', maxLength: 4000 }),
        ai_recommendation: StringColumn({
            label: 'AI Recommendation (advisory)',
            maxLength: 4000,
            hint: 'Advisory AI output only (Now Assist, or the legacy simulation). Never read by deterministic rules or approval/posting logic.',
        }),
    },
})

export const x_695068_bcfa_ap_approval = Table({
    name: 'x_695068_bcfa_ap_approval',
    label: 'AP Approval',
    display: 'ap_invoice',
    audit: true,
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        requested_by: ReferenceColumn({ label: 'Requested By', referenceTable: 'sys_user' }),
        approver: ReferenceColumn({ label: 'Approver', referenceTable: 'sys_user' }),
        decision: ChoiceColumn({
            label: 'Decision',
            default: 'pending',
            choices: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
        }),
        decision_notes: StringColumn({ label: 'Decision Notes', maxLength: 4000 }),
        decided_at: DateTimeColumn({ label: 'Decided At' }),
    },
})
