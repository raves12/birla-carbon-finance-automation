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

// AR / Cash Application domain tables. `state` on Payment is a plain
// StringColumn managed by the Cash Application StateModel (Stage 6).

export const x_695068_bcfa_payment = Table({
    name: 'x_695068_bcfa_payment',
    label: 'Payment',
    display: 'bank_reference',
    audit: true,
    schema: {
        bank_reference: StringColumn({ label: 'Bank Reference', mandatory: true, maxLength: 60 }),
        value_date: DateColumn({ label: 'Value Date' }),
        posting_date: DateColumn({ label: 'Posting Date' }),
        customer: ReferenceColumn({ label: 'Customer', referenceTable: 'x_695068_bcfa_customer' }),
        currency: StringColumn({ label: 'Currency', maxLength: 3 }),
        amount: DecimalColumn({ label: 'Amount', scale: 2 }),
        bank_account: StringColumn({ label: 'Bank Account', maxLength: 40 }),
        source: ChoiceColumn({
            label: 'Source',
            default: 'bank_statement',
            choices: { bank_statement: 'Bank Statement', manual: 'Manual Entry' },
        }),
        state: StringColumn({ label: 'State', maxLength: 40, hint: 'Managed by the Cash Application StateModel' }),
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64 }),
        idempotency_key: StringColumn({ label: 'Idempotency Key', maxLength: 128, unique: true }),
    },
})

export const x_695068_bcfa_remittance = Table({
    name: 'x_695068_bcfa_remittance',
    label: 'Remittance',
    display: 'remittance_reference',
    schema: {
        payment: ReferenceColumn({ label: 'Payment', referenceTable: 'x_695068_bcfa_payment' }),
        remittance_reference: StringColumn({ label: 'Remittance Reference', maxLength: 60 }),
        extracted_fields: JsonColumn({ label: 'Extracted Fields' }),
        confidence: DecimalColumn({ label: 'Confidence', scale: 2 }),
        received_date: DateColumn({ label: 'Received Date' }),
        source: ChoiceColumn({
            label: 'Source',
            default: 'email',
            choices: { email: 'Email', document: 'Document Upload', bank_advice: 'Bank Advice' },
        }),
    },
})

export const x_695068_bcfa_payment_allocation = Table({
    name: 'x_695068_bcfa_payment_allocation',
    label: 'Payment Allocation',
    display: 'payment',
    audit: true,
    schema: {
        payment: ReferenceColumn({ label: 'Payment', referenceTable: 'x_695068_bcfa_payment', mandatory: true }),
        ar_open_item: ReferenceColumn({ label: 'AR Open Item', referenceTable: 'x_695068_bcfa_ar_open_item' }),
        allocated_amount: DecimalColumn({ label: 'Allocated Amount', scale: 2 }),
        discount: DecimalColumn({ label: 'Discount', scale: 2 }),
        bank_charge: DecimalColumn({ label: 'Bank Charge', scale: 2 }),
        tcs: DecimalColumn({ label: 'TCS', scale: 2 }),
        residual_amount: DecimalColumn({ label: 'Residual Amount', scale: 2 }),
        allocation_state: ChoiceColumn({
            label: 'Allocation State',
            default: 'proposed',
            choices: { proposed: 'Proposed', approved: 'Approved', cleared: 'Cleared', reversed: 'Reversed' },
        }),
    },
})

export const x_695068_bcfa_match_candidate = Table({
    name: 'x_695068_bcfa_match_candidate',
    label: 'Match Candidate',
    display: 'payment',
    schema: {
        payment: ReferenceColumn({ label: 'Payment', referenceTable: 'x_695068_bcfa_payment', mandatory: true }),
        ar_open_item: ReferenceColumn({ label: 'AR Open Item', referenceTable: 'x_695068_bcfa_ar_open_item' }),
        customer_candidate: ReferenceColumn({ label: 'Customer Candidate', referenceTable: 'x_695068_bcfa_customer' }),
        match_type: ChoiceColumn({
            label: 'Match Type',
            mandatory: true,
            choices: { exact: 'Exact', fuzzy: 'Fuzzy (deterministic)', ai_suggested: 'AI Suggested (advisory)' },
        }),
        confidence: DecimalColumn({ label: 'Confidence', scale: 2 }),
        rank: IntegerColumn({ label: 'Rank' }),
        selected: BooleanColumn({ label: 'Selected', default: false }),
    },
})

export const x_695068_bcfa_deduction = Table({
    name: 'x_695068_bcfa_deduction',
    label: 'Deduction',
    display: 'deduction_type',
    schema: {
        payment_allocation: ReferenceColumn({ label: 'Payment Allocation', referenceTable: 'x_695068_bcfa_payment_allocation' }),
        deduction_type: ChoiceColumn({
            label: 'Deduction Type',
            mandatory: true,
            choices: {
                short_pay: 'Short Pay',
                bank_charge: 'Bank Charge',
                tcs: 'TCS',
                credit_note_netting: 'Credit Note Netting',
                unapplied: 'Unapplied Cash',
            },
        }),
        amount: DecimalColumn({ label: 'Amount', scale: 2 }),
        credit_note: ReferenceColumn({ label: 'Credit Note', referenceTable: 'x_695068_bcfa_credit_note' }),
        status: ChoiceColumn({
            label: 'Status',
            default: 'proposed',
            choices: { proposed: 'Proposed', approved: 'Approved', rejected: 'Rejected' },
        }),
        notes: StringColumn({ label: 'Notes', maxLength: 4000 }),
    },
})

export const x_695068_bcfa_ar_exception = Table({
    name: 'x_695068_bcfa_ar_exception',
    label: 'AR Exception',
    display: 'reason_code',
    audit: true,
    schema: {
        payment: ReferenceColumn({ label: 'Payment', referenceTable: 'x_695068_bcfa_payment', mandatory: true }),
        reason_code: ChoiceColumn({
            label: 'Reason Code',
            mandatory: true,
            choices: {
                unmatched: 'Unmatched Payment',
                customer_ambiguous: 'Customer Ambiguous',
                short_pay: 'Short Pay',
                over_pay: 'Over Pay',
                duplicate: 'Duplicate Payment',
                currency_mismatch: 'Currency Mismatch',
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
            hint: 'Simulated-AI output only. Never read by deterministic rules or approval/clearing logic.',
        }),
    },
})

export const x_695068_bcfa_ar_approval = Table({
    name: 'x_695068_bcfa_ar_approval',
    label: 'AR Approval',
    display: 'payment',
    audit: true,
    schema: {
        payment: ReferenceColumn({ label: 'Payment', referenceTable: 'x_695068_bcfa_payment', mandatory: true }),
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
