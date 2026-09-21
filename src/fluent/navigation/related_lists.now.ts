import { Record } from '@servicenow/sdk/core'

// UAT finding: the AP Invoice and Payment forms showed only their own
// fields — no related lists at all, so a presenter would have to leave the
// invoice/payment they're on and manually filter separate lists to show the
// extraction, match, exception, and approval evidence for that one record.
// This wires up the full story on both forms. Integration Transaction and
// Audit Event are polymorphic (source_table/source_record strings, not a
// real reference field), so those two use an explicit sys_relationship with
// a query_with script; everything else is a plain reference field, so it
// uses the implicit 'child_table.field' form per the relationship-guide.

// --- AP Invoice --------------------------------------------------------

export const apInvoiceToIntegrationTxnRel = Record({
    $id: Now.ID['ap-invoice-to-integration-txn-rel'],
    table: 'sys_relationship',
    data: {
        name: 'AP Invoice to Integration Transactions',
        basic_apply_to: 'x_695068_bcfa_ap_invoice',
        basic_query_from: 'x_695068_bcfa_integration_txn',
        advanced: false,
        simple_reference: false,
        query_with: `(function refineQuery(current, parent) {
    current.addQuery('source_table', 'x_695068_bcfa_ap_invoice');
    current.addQuery('source_record', parent.sys_id);
})(current, parent);`,
    },
})

export const apInvoiceToAuditEventRel = Record({
    $id: Now.ID['ap-invoice-to-audit-event-rel'],
    table: 'sys_relationship',
    data: {
        name: 'AP Invoice to Audit Events',
        basic_apply_to: 'x_695068_bcfa_ap_invoice',
        basic_query_from: 'x_695068_bcfa_audit_event',
        advanced: false,
        simple_reference: false,
        query_with: `(function refineQuery(current, parent) {
    current.addQuery('source_table', 'x_695068_bcfa_ap_invoice');
    current.addQuery('source_record', parent.sys_id);
})(current, parent);`,
    },
})

export const apInvoiceRelatedList = Record({
    $id: Now.ID['ap-invoice-related-list'],
    table: 'sys_ui_related_list',
    data: { name: 'x_695068_bcfa_ap_invoice', view: 'Default view' },
})

export const apInvoiceLineEntry = Record({
    $id: Now.ID['ap-invoice-line-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: apInvoiceRelatedList, position: 0, related_list: 'x_695068_bcfa_ap_invoice_line.ap_invoice' },
})
export const apExtractionEntry = Record({
    $id: Now.ID['ap-extraction-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: apInvoiceRelatedList, position: 1, related_list: 'x_695068_bcfa_ap_extraction.ap_invoice' },
})
export const apMatchEntry = Record({
    $id: Now.ID['ap-match-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: apInvoiceRelatedList, position: 2, related_list: 'x_695068_bcfa_ap_match.ap_invoice' },
})
export const apExceptionEntry = Record({
    $id: Now.ID['ap-exception-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: apInvoiceRelatedList, position: 3, related_list: 'x_695068_bcfa_ap_exception.ap_invoice' },
})
export const apApprovalEntry = Record({
    $id: Now.ID['ap-approval-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: apInvoiceRelatedList, position: 4, related_list: 'x_695068_bcfa_ap_approval.ap_invoice' },
})
export const apIntegrationTxnEntry = Record({
    $id: Now.ID['ap-integration-txn-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: apInvoiceRelatedList, position: 5, related_list: `REL:${apInvoiceToIntegrationTxnRel}` },
})
export const apAuditEventEntry = Record({
    $id: Now.ID['ap-audit-event-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: apInvoiceRelatedList, position: 6, related_list: `REL:${apInvoiceToAuditEventRel}` },
})
export const apFinanceIntakeEntry = Record({
    $id: Now.ID['ap-finance-intake-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: apInvoiceRelatedList, position: 7, related_list: 'x_695068_bcfa_finance_intake.ap_invoice' },
})

// --- Payment -------------------------------------------------------------

export const paymentToIntegrationTxnRel = Record({
    $id: Now.ID['payment-to-integration-txn-rel'],
    table: 'sys_relationship',
    data: {
        name: 'Payment to Integration Transactions',
        basic_apply_to: 'x_695068_bcfa_payment',
        basic_query_from: 'x_695068_bcfa_integration_txn',
        advanced: false,
        simple_reference: false,
        query_with: `(function refineQuery(current, parent) {
    current.addQuery('source_table', 'x_695068_bcfa_payment');
    current.addQuery('source_record', parent.sys_id);
})(current, parent);`,
    },
})

export const paymentToAuditEventRel = Record({
    $id: Now.ID['payment-to-audit-event-rel'],
    table: 'sys_relationship',
    data: {
        name: 'Payment to Audit Events',
        basic_apply_to: 'x_695068_bcfa_payment',
        basic_query_from: 'x_695068_bcfa_audit_event',
        advanced: false,
        simple_reference: false,
        query_with: `(function refineQuery(current, parent) {
    current.addQuery('source_table', 'x_695068_bcfa_payment');
    current.addQuery('source_record', parent.sys_id);
})(current, parent);`,
    },
})

export const paymentRelatedList = Record({
    $id: Now.ID['payment-related-list'],
    table: 'sys_ui_related_list',
    data: { name: 'x_695068_bcfa_payment', view: 'Default view' },
})

export const remittanceEntry = Record({
    $id: Now.ID['remittance-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: paymentRelatedList, position: 0, related_list: 'x_695068_bcfa_remittance.payment' },
})
export const paymentAllocationEntry = Record({
    $id: Now.ID['payment-allocation-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: paymentRelatedList, position: 1, related_list: 'x_695068_bcfa_payment_allocation.payment' },
})
export const matchCandidateEntry = Record({
    $id: Now.ID['match-candidate-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: paymentRelatedList, position: 2, related_list: 'x_695068_bcfa_match_candidate.payment' },
})
export const arExceptionEntry = Record({
    $id: Now.ID['ar-exception-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: paymentRelatedList, position: 3, related_list: 'x_695068_bcfa_ar_exception.payment' },
})
export const arApprovalEntry = Record({
    $id: Now.ID['ar-approval-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: paymentRelatedList, position: 4, related_list: 'x_695068_bcfa_ar_approval.payment' },
})
export const paymentIntegrationTxnEntry = Record({
    $id: Now.ID['payment-integration-txn-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: paymentRelatedList, position: 5, related_list: `REL:${paymentToIntegrationTxnRel}` },
})
export const paymentAuditEventEntry = Record({
    $id: Now.ID['payment-audit-event-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: paymentRelatedList, position: 6, related_list: `REL:${paymentToAuditEventRel}` },
})
export const paymentFinanceIntakeEntry = Record({
    $id: Now.ID['payment-finance-intake-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: paymentRelatedList, position: 7, related_list: 'x_695068_bcfa_finance_intake.payment' },
})

// --- Payment Allocation → Deduction ---------------------------------------

export const paymentAllocationRelatedList = Record({
    $id: Now.ID['payment-allocation-related-list'],
    table: 'sys_ui_related_list',
    data: { name: 'x_695068_bcfa_payment_allocation', view: 'Default view' },
})

export const deductionEntry = Record({
    $id: Now.ID['deduction-entry'],
    table: 'sys_ui_related_list_entry',
    data: { list_id: paymentAllocationRelatedList, position: 0, related_list: 'x_695068_bcfa_deduction.payment_allocation' },
})
