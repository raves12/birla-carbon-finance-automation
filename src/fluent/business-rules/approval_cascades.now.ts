import { BusinessRule } from '@servicenow/sdk/core'

// Approval cascades (see docs/ARTIFACT_STRATEGY.md). Since Phase 25 they act
// only in inline orchestration mode (demo seeding, tests); in flow mode the
// AP Integration / AR Clearing flows post and clear instead. Both react only
// to a state change our own service made, so each fires exactly once per
// approval decision — never in response to a raw, uncontrolled field edit.

export const apInvoiceApprovalCascade = BusinessRule({
    $id: Now.ID['br-ap-invoice-approval-cascade'],
    name: 'AP Invoice - Auto Post After Approval',
    table: 'x_695068_bcfa_ap_invoice',
    when: 'after',
    action: ['update'],
    order: 100,
    active: true,
    description: 'When an AP Invoice becomes approved, automatically invokes the posting eligibility gate and mock SAP posting.',
    script: Now.include('../../server/business-rules/ApInvoiceApprovalCascade.server.js'),
})

export const arPaymentApprovalCascade = BusinessRule({
    $id: Now.ID['br-ar-payment-approval-cascade'],
    name: 'AR Payment - Auto Clear After Approval',
    table: 'x_695068_bcfa_payment',
    when: 'after',
    action: ['update'],
    order: 100,
    active: true,
    description: 'When a Payment becomes approved, automatically invokes the clearing eligibility gate and mock SAP clearing.',
    script: Now.include('../../server/business-rules/ArPaymentApprovalCascade.server.js'),
})
