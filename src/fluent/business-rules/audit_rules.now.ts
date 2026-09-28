import { BusinessRule } from '@servicenow/sdk/core'

// Phase 19 audit framework rules.

export const auditEventAppendOnly = BusinessRule({
    $id: Now.ID['br-audit-event-append-only'],
    name: 'Audit Event - Append Only',
    table: 'x_695068_bcfa_audit_event',
    when: 'before',
    action: ['update', 'delete'],
    order: 10,
    active: true,
    description: 'Audit Events are evidence: rejects every update and delete so the audit trail stays append-only.',
    script: Now.include('../../server/business-rules/AuditEventAppendOnly.server.js'),
})

// field_corrected auditing (AuditEngine.CORRECTABLE_FIELDS lists the fields).

export const apInvoiceAuditFieldCorrections = BusinessRule({
    $id: Now.ID['br-audit-field-corrections-ap-invoice'],
    name: 'AP Invoice - Audit Field Corrections',
    table: 'x_695068_bcfa_ap_invoice',
    when: 'after',
    action: ['update'],
    order: 900,
    active: true,
    description: 'Records a field_corrected Audit Event when a business field changes after intake.',
    script: Now.include('../../server/business-rules/AuditFieldCorrections.server.js'),
})

export const apInvoiceLineAuditFieldCorrections = BusinessRule({
    $id: Now.ID['br-audit-field-corrections-ap-invoice-line'],
    name: 'AP Invoice Line - Audit Field Corrections',
    table: 'x_695068_bcfa_ap_invoice_line',
    when: 'after',
    action: ['update'],
    order: 900,
    active: true,
    description: 'Records a field_corrected Audit Event when a business field changes after intake.',
    script: Now.include('../../server/business-rules/AuditFieldCorrections.server.js'),
})

export const paymentAuditFieldCorrections = BusinessRule({
    $id: Now.ID['br-audit-field-corrections-payment'],
    name: 'Payment - Audit Field Corrections',
    table: 'x_695068_bcfa_payment',
    when: 'after',
    action: ['update'],
    order: 900,
    active: true,
    description: 'Records a field_corrected Audit Event when a business field changes after intake.',
    script: Now.include('../../server/business-rules/AuditFieldCorrections.server.js'),
})

export const remittanceAuditFieldCorrections = BusinessRule({
    $id: Now.ID['br-audit-field-corrections-remittance'],
    name: 'Remittance - Audit Field Corrections',
    table: 'x_695068_bcfa_remittance',
    when: 'after',
    action: ['update'],
    order: 900,
    active: true,
    description: 'Records a field_corrected Audit Event when a business field changes after intake.',
    script: Now.include('../../server/business-rules/AuditFieldCorrections.server.js'),
})

export const financeIntakeAuditFieldCorrections = BusinessRule({
    $id: Now.ID['br-audit-field-corrections-finance-intake'],
    name: 'Finance Document Intake - Audit Field Corrections',
    table: 'x_695068_bcfa_finance_intake',
    when: 'after',
    action: ['update'],
    order: 900,
    active: true,
    description: 'Records a field_corrected Audit Event when a business field changes after intake.',
    script: Now.include('../../server/business-rules/AuditFieldCorrections.server.js'),
})
