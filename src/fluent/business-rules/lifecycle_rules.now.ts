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

// Phase 41, defect 10: a payment created outside ArDomainService.intakePayment
// (e.g. typed into the form) had no lifecycle state, so it never entered the
// pipeline and a later remittance reported it as "already null". Every new
// payment now starts in the lifecycle's first state with the identifiers the
// intake service sets; the AR Payment Intake Flow then normalizes it (missing
// amount or currency becomes a normalization exception, not a silent gap).
export const paymentInitializeLifecycle = BusinessRule({
    $id: Now.ID['br-payment-initialize-lifecycle'],
    name: 'BCFA - Initialize Payment Lifecycle',
    table: 'x_695068_bcfa_payment',
    when: 'before',
    action: ['insert'],
    order: 40,
    active: true,
    description: 'A new payment without a lifecycle state starts as RECEIVED, with a correlation id and idempotency key (defect 10).',
    script: `(function executeRule(current, previous) {
    if (!current.getValue('state')) current.setValue('state', 'RECEIVED');
    if (!current.getValue('correlation_id')) current.setValue('correlation_id', gs.generateGUID());
    if (!current.getValue('idempotency_key')) current.setValue('idempotency_key', 'PAY-' + gs.generateGUID());
})(current, previous);`,
})
