import { BusinessRule } from '@servicenow/sdk/core'

// Phase 26: the lifecycle state models are enforced. The domain services check
// every transition before they update (FinanceLifecycle, in _setState); these
// before-update rules are the backstop for any other writer. See
// docs/STATE_MODELS.md.

export const apInvoiceLifecycleEnforcement = BusinessRule({
    $id: Now.ID['br-ap-invoice-lifecycle-enforcement'],
    name: 'BCFA - Enforce AP Invoice Lifecycle',
    table: 'x_695068_bcfa_ap_invoice',
    when: 'before',
    action: ['update'],
    order: 50,
    active: true,
    description: 'Refuses (and audits) a state change that the AP Invoice Lifecycle state model does not allow, whoever makes it.',
    script: Now.include('../../server/business-rules/LifecycleEnforcement.server.js'),
})

export const paymentLifecycleEnforcement = BusinessRule({
    $id: Now.ID['br-payment-lifecycle-enforcement'],
    name: 'BCFA - Enforce Payment Lifecycle',
    table: 'x_695068_bcfa_payment',
    when: 'before',
    action: ['update'],
    order: 50,
    active: true,
    description: 'Refuses (and audits) a state change that the Cash Application Lifecycle state model does not allow, whoever makes it.',
    script: Now.include('../../server/business-rules/LifecycleEnforcement.server.js'),
})
