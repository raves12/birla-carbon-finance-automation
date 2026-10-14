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

// Phase 42: multilingual party resolution and document evidence.

// Vendor names as printed in another language or script (for example the
// Chinese legal name of a vendor whose master record is in English). Controlled
// reference data maintained by people: BCFA never translates a printed name
// and treats the translation as the master record.
export const x_695068_bcfa_vendor_alias = Table({
    name: 'x_695068_bcfa_vendor_alias',
    label: 'Vendor Alias',
    display: 'alias_name',
    schema: {
        vendor: ReferenceColumn({ label: 'Vendor', referenceTable: 'x_695068_bcfa_vendor', mandatory: true }),
        alias_name: StringColumn({ label: 'Alias Name', mandatory: true, maxLength: 200, hint: 'The name exactly as printed on documents, in its own script (for example 信诺立兴（黄骅市）集团股份有限公司).' }),
        language: StringColumn({ label: 'Language', maxLength: 40, hint: 'Language / script of the alias, for example Chinese, Korean, English.' }),
        country_context: StringColumn({ label: 'Country / Context', maxLength: 80 }),
        match_strength: DecimalColumn({ label: 'Match Strength', scale: 2, default: 1, hint: 'Reference weight of this alias (1 = confirmed legal name). A matching alias resolves the vendor only when it points to exactly one vendor.' }),
        source: ChoiceColumn({
            label: 'Source',
            dropdown: 'dropdown_with_none',
            default: 'manual',
            choices: { master_data: 'Vendor master data', sap: 'SAP', manual: 'Maintained manually', reviewer: 'Confirmed by a reviewer' },
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
})

// Human review of document evidence: one row per decision. The AI / OCR value
// is copied in when the row is created and never changes; the reviewer's
// value, reason, identity and time are recorded next to it. Append-only
// (business rule): a later decision is a new row.
export const x_695068_bcfa_document_evidence_review = Table({
    name: 'x_695068_bcfa_document_evidence_review',
    label: 'Document Evidence Review',
    display: 'evidence_item',
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice' }),
        grn_extraction: ReferenceColumn({ label: 'GRN Extraction', referenceTable: 'x_695068_bcfa_grn_extraction' }),
        evidence_item: ChoiceColumn({
            label: 'Evidence Item',
            mandatory: true,
            choices: {
                stamp_present: 'Stamp present',
                stamp_text: 'Stamp text',
                grn_number: 'GRN number',
                po_number: 'PO number',
                quantity_received: 'Quantity received',
                receipt_date: 'Receipt date',
                other: 'Other value',
            },
        }),
        ai_value: StringColumn({ label: 'AI / OCR Value', maxLength: 1000, readOnly: true, hint: 'The value the extraction produced, copied when this review was recorded. Never edited.' }),
        human_value: StringColumn({ label: 'Reviewer Value', maxLength: 1000, mandatory: true,
            hint: 'Stamp present: yes or no. Other items: the value as read by the reviewer from the document.' }),
        reason: StringColumn({ label: 'Reason', maxLength: 1000, mandatory: true }),
        reviewer: ReferenceColumn({ label: 'Reviewer', referenceTable: 'sys_user', readOnly: true }),
        reviewed_on: DateTimeColumn({ label: 'Reviewed On', readOnly: true }),
    },
})

// Phase 42: a goods receipt (GRN) document read by Document Intelligence,
// including handwritten receipts. Evidence only: it never creates or changes
// the authoritative receipt (x_695068_bcfa_receipt, mock SAP); it is compared
// with it, and uncertain critical values go to a person.
export const x_695068_bcfa_grn_extraction = Table({
    name: 'x_695068_bcfa_grn_extraction',
    label: 'GRN Extraction (Evidence)',
    display: 'grn_number',
    schema: {
        finance_intake: ReferenceColumn({ label: 'Finance Intake', referenceTable: 'x_695068_bcfa_finance_intake', readOnly: true }),
        grn_number: StringColumn({ label: 'GRN Number (Read)', maxLength: 60, readOnly: true }),
        po_number: StringColumn({ label: 'PO Number (Read)', maxLength: 60, readOnly: true }),
        vendor_name: StringColumn({ label: 'Vendor (Read)', maxLength: 200, readOnly: true }),
        receipt_date: StringColumn({ label: 'Receipt Date (Read)', maxLength: 40, readOnly: true }),
        plant: StringColumn({ label: 'Plant / Site (Read)', maxLength: 100, readOnly: true }),
        material_description: StringColumn({ label: 'Material / Service (Read)', maxLength: 400, readOnly: true }),
        material_code: StringColumn({ label: 'Material Code (Read)', maxLength: 60, readOnly: true }),
        po_line: StringColumn({ label: 'PO Line (Read)', maxLength: 20, readOnly: true }),
        quantity_received: StringColumn({ label: 'Quantity Received (Read)', maxLength: 40, readOnly: true }),
        uom: StringColumn({ label: 'Unit (Read)', maxLength: 20, readOnly: true }),
        received_by: StringColumn({ label: 'Received By (Read)', maxLength: 100, readOnly: true }),
        remarks: StringColumn({ label: 'Remarks (Read)', maxLength: 1000, readOnly: true }),
        signature_present: ChoiceColumn({ label: 'Signature Present', readOnly: true, dropdown: 'dropdown_with_none', choices: { yes: 'Yes', no: 'No', uncertain: 'Uncertain' } }),
        stamp_present: ChoiceColumn({ label: 'Stamp Present', readOnly: true, dropdown: 'dropdown_with_none', choices: { yes: 'Yes', no: 'No', uncertain: 'Uncertain' } }),
        handwritten_text_present: ChoiceColumn({ label: 'Handwritten Text Present', readOnly: true, dropdown: 'dropdown_with_none', choices: { yes: 'Yes', no: 'No', uncertain: 'Uncertain' } }),
        handwritten_values: StringColumn({ label: 'Handwritten Values (Read)', maxLength: 1000, readOnly: true }),
        document_language: StringColumn({ label: 'Document Language', maxLength: 40, readOnly: true }),
        reading_status: ChoiceColumn({
            label: 'Reading Result',
            readOnly: true,
            dropdown: 'dropdown_with_none',
            choices: {
                printed_readable: 'Printed values read',
                handwriting_readable: 'Handwriting readable',
                partially_readable: 'Partially readable',
                not_readable: 'Not readable',
            },
            hint: 'Measured from the critical values (GRN number, PO number, quantity) the reading returned, not from a model confidence.',
        }),
        critical_fields_missing: StringColumn({ label: 'Critical Values Not Read', maxLength: 200, readOnly: true }),
        sap_receipt: ReferenceColumn({ label: 'SAP Receipt (Authoritative)', referenceTable: 'x_695068_bcfa_receipt', readOnly: true }),
        comparison_result: ChoiceColumn({
            label: 'Comparison with SAP Receipt',
            readOnly: true,
            dropdown: 'dropdown_with_none',
            choices: {
                matches: 'Matches the SAP receipt',
                differs: 'Differs from the SAP receipt',
                no_authoritative_receipt: 'No SAP receipt with this number',
                not_compared: 'Not compared (GRN number not read)',
            },
        }),
        comparison_detail: StringColumn({ label: 'Comparison Detail', maxLength: 1000, readOnly: true }),
        review_status: ChoiceColumn({
            label: 'Review Status',
            dropdown: 'dropdown_with_none',
            default: 'review_required',
            choices: { review_required: 'Review required', reviewed: 'Reviewed', rejected: 'Rejected as evidence' },
        }),
        raw_extraction: JsonColumn({ label: 'Raw Extraction (immutable)', hint: 'The structured reading as returned by Document Intelligence. Never edited; reviewer corrections are Document Evidence Review rows.' }),
        extraction_task: StringColumn({ label: 'Extraction Task', maxLength: 32, readOnly: true }),
        read_on: DateTimeColumn({ label: 'Read On', readOnly: true }),
    },
})
