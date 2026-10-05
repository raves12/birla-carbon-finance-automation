import {
    Table,
    StringColumn,
    ChoiceColumn,
    BooleanColumn,
    IntegerColumn,
    DecimalColumn,
    DateColumn,
    ReferenceColumn,
} from '@servicenow/sdk/core'

// Mock SAP/bank master and transactional data. This PDI has no real SAP ECC or
// CPI connectivity (see docs/DISCOVERY.md) and no APO/master-data-sync plugin,
// so these tables stand in for what would otherwise be a governed on-demand
// read against SAP master/transaction data. MockSAPAdapter (Stage 7) reads
// exclusively from these tables — application logic never queries them
// directly, preserving the same seam a real SAPAdapter would use later.

export const x_695068_bcfa_vendor = Table({
    name: 'x_695068_bcfa_vendor',
    label: 'Vendor (Mock SAP Master)',
    display: 'name',
    schema: {
        vendor_code: StringColumn({ label: 'Vendor Code', mandatory: true, unique: true, maxLength: 20 }),
        name: StringColumn({ label: 'Name', mandatory: true, maxLength: 200 }),
        company_code: StringColumn({ label: 'Company Code', maxLength: 10 }),
        country: StringColumn({ label: 'Country', maxLength: 60 }),
        currency: StringColumn({ label: 'Currency', maxLength: 3 }),
        payment_terms: StringColumn({ label: 'Payment Terms', maxLength: 40 }),
        bank_account: StringColumn({ label: 'Bank Account', maxLength: 40 }),
        // Phase 40: POC reference data for the BCFA AP Tax Expectation
        // decision table (with the country). Not read from SAP.
        tax_category: ChoiceColumn({
            label: 'Tax Category (POC reference)',
            default: 'goods',
            choices: { goods: 'Goods', services: 'Services' },
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
})

export const x_695068_bcfa_customer = Table({
    name: 'x_695068_bcfa_customer',
    label: 'Customer (Mock SAP Master)',
    display: 'name',
    schema: {
        customer_code: StringColumn({ label: 'Customer Code', mandatory: true, unique: true, maxLength: 20 }),
        name: StringColumn({ label: 'Name', mandatory: true, maxLength: 200 }),
        company_code: StringColumn({ label: 'Company Code', maxLength: 10 }),
        country: StringColumn({ label: 'Country', maxLength: 60 }),
        currency: StringColumn({ label: 'Currency', maxLength: 3 }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
})

export const x_695068_bcfa_purchase_order = Table({
    name: 'x_695068_bcfa_purchase_order',
    label: 'Purchase Order (Mock SAP)',
    display: 'po_number',
    schema: {
        po_number: StringColumn({ label: 'PO Number', mandatory: true, unique: true, maxLength: 20 }),
        vendor: ReferenceColumn({ label: 'Vendor', referenceTable: 'x_695068_bcfa_vendor', mandatory: true }),
        company_code: StringColumn({ label: 'Company Code', maxLength: 10 }),
        currency: StringColumn({ label: 'Currency', maxLength: 3 }),
        status: ChoiceColumn({
            label: 'Status',
            default: 'open',
            choices: { open: 'Open', partially_received: 'Partially Received', closed: 'Closed' },
        }),
        created_date: DateColumn({ label: 'Created Date' }),
    },
})

export const x_695068_bcfa_po_line = Table({
    name: 'x_695068_bcfa_po_line',
    label: 'PO Line (Mock SAP)',
    display: 'material_or_service',
    schema: {
        purchase_order: ReferenceColumn({ label: 'Purchase Order', referenceTable: 'x_695068_bcfa_purchase_order', mandatory: true }),
        line_number: IntegerColumn({ label: 'Line Number', mandatory: true, min: 1 }),
        material_or_service: StringColumn({ label: 'Material / Service', maxLength: 200 }),
        quantity: DecimalColumn({ label: 'Quantity', scale: 2 }),
        unit: StringColumn({ label: 'Unit', maxLength: 10 }),
        unit_price: DecimalColumn({ label: 'Unit Price', scale: 2 }),
        received_quantity: DecimalColumn({ label: 'Received Quantity', scale: 2, default: 0 }),
    },
})

export const x_695068_bcfa_receipt = Table({
    name: 'x_695068_bcfa_receipt',
    label: 'Receipt / GRN-SRN (Mock SAP)',
    display: 'receipt_number',
    schema: {
        receipt_number: StringColumn({ label: 'Receipt Number', mandatory: true, unique: true, maxLength: 20 }),
        po_line: ReferenceColumn({ label: 'PO Line', referenceTable: 'x_695068_bcfa_po_line' }),
        receipt_type: ChoiceColumn({ label: 'Receipt Type', mandatory: true, choices: { grn: 'Goods Receipt (GRN)', srn: 'Service Receipt (SRN)' } }),
        quantity: DecimalColumn({ label: 'Quantity', scale: 2 }),
        receipt_date: DateColumn({ label: 'Receipt Date' }),
        sap_document_id: StringColumn({ label: 'SAP Document ID', maxLength: 20 }),
    },
})

export const x_695068_bcfa_ar_open_item = Table({
    name: 'x_695068_bcfa_ar_open_item',
    label: 'AR Open Item (Mock SAP)',
    display: 'item_number',
    schema: {
        item_number: StringColumn({ label: 'Item Number', mandatory: true, unique: true, maxLength: 20 }),
        customer: ReferenceColumn({ label: 'Customer', referenceTable: 'x_695068_bcfa_customer', mandatory: true }),
        company_code: StringColumn({ label: 'Company Code', maxLength: 10 }),
        currency: StringColumn({ label: 'Currency', maxLength: 3 }),
        invoice_amount: DecimalColumn({ label: 'Invoice Amount', scale: 2 }),
        open_amount: DecimalColumn({ label: 'Open Amount', scale: 2 }),
        due_date: DateColumn({ label: 'Due Date' }),
        status: ChoiceColumn({
            label: 'Status',
            default: 'open',
            choices: { open: 'Open', partially_cleared: 'Partially Cleared', cleared: 'Cleared' },
        }),
    },
})

export const x_695068_bcfa_credit_note = Table({
    name: 'x_695068_bcfa_credit_note',
    label: 'Credit Note (Mock SAP)',
    display: 'credit_note_number',
    schema: {
        credit_note_number: StringColumn({ label: 'Credit Note Number', mandatory: true, unique: true, maxLength: 20 }),
        customer: ReferenceColumn({ label: 'Customer', referenceTable: 'x_695068_bcfa_customer', mandatory: true }),
        amount: DecimalColumn({ label: 'Amount', scale: 2 }),
        open_amount: DecimalColumn({ label: 'Open Amount', scale: 2 }),
        issue_date: DateColumn({ label: 'Issue Date' }),
        status: ChoiceColumn({
            label: 'Status',
            default: 'open',
            choices: { open: 'Open', applied: 'Applied', closed: 'Closed' },
        }),
    },
})
