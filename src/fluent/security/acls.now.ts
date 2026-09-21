import { Acl } from '@servicenow/sdk/core'
import {
    bcfaAdmin,
    bcfaApProcessor,
    bcfaArProcessor,
    bcfaFinanceReviewer,
    bcfaFinanceApprover,
    bcfaIntegrationOperator,
    bcfaAuditor,
    bcfaReadOnly,
} from './roles.now'

// Segregation-of-duties enforcement (Section 6 of the build brief):
//   1. A processor must not approve their own transaction.
//   2. An approver must not modify source transaction data after approval.
//   3. An integration operator may retry/reconcile integrations but never
//      gets write access to AP/AR financial source tables at all (enforced
//      by omission below, not by a deny rule).
//   4. An auditor gets read-only access to evidence/audit-trail tables only
//      (Audit Event, Integration Transaction, Decision Log) — not full AP/AR
//      record content.
//
// Fluent files are a restricted declarative AST (no loops/control-flow —
// verified by build error TS250 "ForOfStatement is not allowed"), so every
// ACL below is a flat, individual Acl() call rather than generated from an
// array.

// --- Read access: AP tables -------------------------------------------------

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_ap_invoice'],
    type: 'record',
    table: 'x_695068_bcfa_ap_invoice',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_ap_invoice_line'],
    type: 'record',
    table: 'x_695068_bcfa_ap_invoice_line',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_ap_extraction'],
    type: 'record',
    table: 'x_695068_bcfa_ap_extraction',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_ap_match'],
    type: 'record',
    table: 'x_695068_bcfa_ap_match',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_ap_exception'],
    type: 'record',
    table: 'x_695068_bcfa_ap_exception',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

// --- Read access: AR tables -------------------------------------------------

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_payment'],
    type: 'record',
    table: 'x_695068_bcfa_payment',
    operation: 'read',
    roles: [bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_remittance'],
    type: 'record',
    table: 'x_695068_bcfa_remittance',
    operation: 'read',
    roles: [bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_payment_allocation'],
    type: 'record',
    table: 'x_695068_bcfa_payment_allocation',
    operation: 'read',
    roles: [bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_match_candidate'],
    type: 'record',
    table: 'x_695068_bcfa_match_candidate',
    operation: 'read',
    roles: [bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_deduction'],
    type: 'record',
    table: 'x_695068_bcfa_deduction',
    operation: 'read',
    roles: [bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_ar_exception'],
    type: 'record',
    table: 'x_695068_bcfa_ar_exception',
    operation: 'read',
    roles: [bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

// --- Read access: Approval tables -------------------------------------------

Acl({
    $id: Now.ID['acl-read-ap-approval'],
    type: 'record',
    table: 'x_695068_bcfa_ap_approval',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-ar-approval'],
    type: 'record',
    table: 'x_695068_bcfa_ar_approval',
    operation: 'read',
    roles: [bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

// --- Master data: read for all processing roles, write/create reserved for
// integration_operator/admin (stands in for a governed SAP sync). -----------

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_vendor'],
    type: 'record',
    table: 'x_695068_bcfa_vendor',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_vendor'],
    type: 'record',
    table: 'x_695068_bcfa_vendor',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_vendor'],
    type: 'record',
    table: 'x_695068_bcfa_vendor',
    operation: 'create',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_customer'],
    type: 'record',
    table: 'x_695068_bcfa_customer',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_customer'],
    type: 'record',
    table: 'x_695068_bcfa_customer',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_customer'],
    type: 'record',
    table: 'x_695068_bcfa_customer',
    operation: 'create',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_purchase_order'],
    type: 'record',
    table: 'x_695068_bcfa_purchase_order',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_purchase_order'],
    type: 'record',
    table: 'x_695068_bcfa_purchase_order',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_purchase_order'],
    type: 'record',
    table: 'x_695068_bcfa_purchase_order',
    operation: 'create',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_po_line'],
    type: 'record',
    table: 'x_695068_bcfa_po_line',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_po_line'],
    type: 'record',
    table: 'x_695068_bcfa_po_line',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_po_line'],
    type: 'record',
    table: 'x_695068_bcfa_po_line',
    operation: 'create',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_receipt'],
    type: 'record',
    table: 'x_695068_bcfa_receipt',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_receipt'],
    type: 'record',
    table: 'x_695068_bcfa_receipt',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_receipt'],
    type: 'record',
    table: 'x_695068_bcfa_receipt',
    operation: 'create',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_ar_open_item'],
    type: 'record',
    table: 'x_695068_bcfa_ar_open_item',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_ar_open_item'],
    type: 'record',
    table: 'x_695068_bcfa_ar_open_item',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_ar_open_item'],
    type: 'record',
    table: 'x_695068_bcfa_ar_open_item',
    operation: 'create',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_credit_note'],
    type: 'record',
    table: 'x_695068_bcfa_credit_note',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_credit_note'],
    type: 'record',
    table: 'x_695068_bcfa_credit_note',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_credit_note'],
    type: 'record',
    table: 'x_695068_bcfa_credit_note',
    operation: 'create',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

// --- Evidence/audit-trail tables: read-only, no business-role write ACL ----

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_audit_event'],
    type: 'record',
    table: 'x_695068_bcfa_audit_event',
    operation: 'read',
    roles: [bcfaAuditor, bcfaReadOnly, bcfaFinanceReviewer, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_integration_txn'],
    type: 'record',
    table: 'x_695068_bcfa_integration_txn',
    operation: 'read',
    roles: [bcfaAuditor, bcfaReadOnly, bcfaFinanceReviewer, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_decision_log'],
    type: 'record',
    table: 'x_695068_bcfa_decision_log',
    operation: 'read',
    roles: [bcfaAuditor, bcfaReadOnly, bcfaFinanceReviewer, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_ai_interaction'],
    type: 'record',
    table: 'x_695068_bcfa_ai_interaction',
    operation: 'read',
    roles: [bcfaAuditor, bcfaReadOnly, bcfaFinanceReviewer, bcfaAdmin],
    description: 'AI Interaction is an evidence/audit-trail table like Audit Event/Integration Transaction — same read-only role list, no business-role write ACL.',
})

// --- Integration operator: write access scoped to integration tables only --

Acl({
    $id: Now.ID['acl-write-integration-txn'],
    type: 'record',
    table: 'x_695068_bcfa_integration_txn',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
    description: 'Integration operators may update Integration Transaction (e.g. to trigger a reconciliation retry) but have no write access to any AP/AR financial source table.',
})

Acl({
    $id: Now.ID['acl-read-integration-profile'],
    type: 'record',
    table: 'x_695068_bcfa_integration_profile',
    operation: 'read',
    roles: [bcfaIntegrationOperator, bcfaAdmin, bcfaReadOnly],
})

Acl({
    $id: Now.ID['acl-write-integration-profile'],
    type: 'record',
    table: 'x_695068_bcfa_integration_profile',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

// --- Finance Exception / Customer Alias -------------------------------------

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_finance_exception'],
    type: 'record',
    table: 'x_695068_bcfa_finance_exception',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_finance_exception'],
    type: 'record',
    table: 'x_695068_bcfa_finance_exception',
    operation: 'write',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_customer_alias'],
    type: 'record',
    table: 'x_695068_bcfa_customer_alias',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_customer_alias'],
    type: 'record',
    table: 'x_695068_bcfa_customer_alias',
    operation: 'write',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaAdmin],
})

// --- Reference Mapping -------------------------------------------------------

Acl({
    $id: Now.ID['acl-read-reference-mapping'],
    type: 'record',
    table: 'x_695068_bcfa_reference_mapping',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaIntegrationOperator, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-reference-mapping'],
    type: 'record',
    table: 'x_695068_bcfa_reference_mapping',
    operation: 'write',
    roles: [bcfaIntegrationOperator, bcfaAdmin],
})

// --- Write access: AP processing --------------------------------------------

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_ap_invoice_line'],
    type: 'record',
    table: 'x_695068_bcfa_ap_invoice_line',
    operation: 'write',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_ap_invoice_line'],
    type: 'record',
    table: 'x_695068_bcfa_ap_invoice_line',
    operation: 'create',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_ap_extraction'],
    type: 'record',
    table: 'x_695068_bcfa_ap_extraction',
    operation: 'write',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_ap_extraction'],
    type: 'record',
    table: 'x_695068_bcfa_ap_extraction',
    operation: 'create',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_ap_match'],
    type: 'record',
    table: 'x_695068_bcfa_ap_match',
    operation: 'write',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_ap_match'],
    type: 'record',
    table: 'x_695068_bcfa_ap_match',
    operation: 'create',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_ap_exception'],
    type: 'record',
    table: 'x_695068_bcfa_ap_exception',
    operation: 'write',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_ap_exception'],
    type: 'record',
    table: 'x_695068_bcfa_ap_exception',
    operation: 'create',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-ap-invoice'],
    type: 'record',
    table: 'x_695068_bcfa_ap_invoice',
    operation: 'create',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-ap-invoice'],
    type: 'record',
    table: 'x_695068_bcfa_ap_invoice',
    operation: 'write',
    roles: [bcfaApProcessor, bcfaAdmin],
    script: `current.approval_state != 'approved'`,
    description: 'Processors may edit an AP Invoice only before it has been approved (SoD rule #2). Admin can always override for support.',
})

// --- Write access: AR processing --------------------------------------------

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_remittance'],
    type: 'record',
    table: 'x_695068_bcfa_remittance',
    operation: 'write',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_remittance'],
    type: 'record',
    table: 'x_695068_bcfa_remittance',
    operation: 'create',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_payment_allocation'],
    type: 'record',
    table: 'x_695068_bcfa_payment_allocation',
    operation: 'write',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_payment_allocation'],
    type: 'record',
    table: 'x_695068_bcfa_payment_allocation',
    operation: 'create',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_match_candidate'],
    type: 'record',
    table: 'x_695068_bcfa_match_candidate',
    operation: 'write',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_match_candidate'],
    type: 'record',
    table: 'x_695068_bcfa_match_candidate',
    operation: 'create',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_deduction'],
    type: 'record',
    table: 'x_695068_bcfa_deduction',
    operation: 'write',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_deduction'],
    type: 'record',
    table: 'x_695068_bcfa_deduction',
    operation: 'create',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_ar_exception'],
    type: 'record',
    table: 'x_695068_bcfa_ar_exception',
    operation: 'write',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_ar_exception'],
    type: 'record',
    table: 'x_695068_bcfa_ar_exception',
    operation: 'create',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-payment'],
    type: 'record',
    table: 'x_695068_bcfa_payment',
    operation: 'create',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-payment'],
    type: 'record',
    table: 'x_695068_bcfa_payment',
    operation: 'write',
    roles: [bcfaArProcessor, bcfaAdmin],
    script: `current.state != 'APPROVED'`,
    description: 'AR processors may edit a Payment only before it has been approved (SoD rule #2). Admin can always override for support.',
})

// --- Approval gates: SoD rule #1 (no self-approval) -------------------------

Acl({
    $id: Now.ID['acl-create-ap-approval'],
    type: 'record',
    table: 'x_695068_bcfa_ap_approval',
    operation: 'create',
    roles: [bcfaApProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-ap-approval-decision'],
    type: 'record',
    table: 'x_695068_bcfa_ap_approval',
    operation: 'write',
    roles: [bcfaFinanceApprover, bcfaAdmin],
    field: 'decision',
    script: `current.requested_by != gs.getUserID()`,
    description: 'A finance approver may set the decision field on any AP Approval they did not request themselves — blocks self-approval.',
})

Acl({
    $id: Now.ID['acl-create-ar-approval'],
    type: 'record',
    table: 'x_695068_bcfa_ar_approval',
    operation: 'create',
    roles: [bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-ar-approval-decision'],
    type: 'record',
    table: 'x_695068_bcfa_ar_approval',
    operation: 'write',
    roles: [bcfaFinanceApprover, bcfaAdmin],
    field: 'decision',
    script: `current.requested_by != gs.getUserID()`,
    description: 'A finance approver may set the decision field on any AR Approval they did not request themselves — blocks self-approval.',
})

// --- Finance Document Intake -------------------------------------------------
// Same read population as the rest of the app; write/create scoped to the two
// processing roles (either can trigger document intake, since a raw document
// isn't known to be AP or AR until Claude classifies it) plus admin.

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_finance_intake'],
    type: 'record',
    table: 'x_695068_bcfa_finance_intake',
    operation: 'read',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaReadOnly, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-create-x_695068_bcfa_finance_intake'],
    type: 'record',
    table: 'x_695068_bcfa_finance_intake',
    operation: 'create',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaAdmin],
})

Acl({
    $id: Now.ID['acl-write-x_695068_bcfa_finance_intake'],
    type: 'record',
    table: 'x_695068_bcfa_finance_intake',
    operation: 'write',
    roles: [bcfaApProcessor, bcfaArProcessor, bcfaAdmin],
})


