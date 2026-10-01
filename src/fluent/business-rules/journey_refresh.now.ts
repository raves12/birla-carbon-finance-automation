import { BusinessRule } from '@servicenow/sdk/core'

// Playbook phase: keeps the journey (Playbook) fields of the parent invoice
// or payment current when an exception or approval changes without a
// parent state change (e.g. one of two exceptions resolved, an approval
// requested). Display only: FinanceJourneyService writes the journey_*
// fields with setWorkflow(false) and never changes state.

export const apExceptionJourneyRefresh = BusinessRule({
    $id: Now.ID['br-ap-exception-journey-refresh'],
    name: 'AP Exception - Refresh Invoice Journey',
    table: 'x_695068_bcfa_ap_exception',
    when: 'after',
    action: ['insert', 'update'],
    order: 900,
    active: true,
    description: 'Refreshes the parent invoice journey (Playbook) fields when an AP exception is raised or its status changes. Display only.',
    script: `(function executeRule(current, previous) {
    if (current.operation() === 'update' && !current.status.changes()) return;
    if (current.getValue('ap_invoice')) new FinanceJourneyService().refreshInvoice(current.getValue('ap_invoice'));
})(current, previous);`,
})

export const arExceptionJourneyRefresh = BusinessRule({
    $id: Now.ID['br-ar-exception-journey-refresh'],
    name: 'AR Exception - Refresh Payment Journey',
    table: 'x_695068_bcfa_ar_exception',
    when: 'after',
    action: ['insert', 'update'],
    order: 900,
    active: true,
    description: 'Refreshes the parent payment journey (Playbook) fields when an AR exception is raised or its status changes. Display only.',
    script: `(function executeRule(current, previous) {
    if (current.operation() === 'update' && !current.status.changes()) return;
    if (current.getValue('payment')) new FinanceJourneyService().refreshPayment(current.getValue('payment'));
})(current, previous);`,
})

export const apApprovalJourneyRefresh = BusinessRule({
    $id: Now.ID['br-ap-approval-journey-refresh'],
    name: 'AP Approval - Refresh Invoice Journey',
    table: 'x_695068_bcfa_ap_approval',
    when: 'after',
    action: ['insert', 'update'],
    order: 900,
    active: true,
    description: 'Refreshes the parent invoice journey (Playbook) fields when an approval is requested or decided. Display only.',
    script: `(function executeRule(current, previous) {
    if (current.operation() === 'update' && !current.decision.changes()) return;
    if (current.getValue('ap_invoice')) new FinanceJourneyService().refreshInvoice(current.getValue('ap_invoice'));
})(current, previous);`,
})

export const arApprovalJourneyRefresh = BusinessRule({
    $id: Now.ID['br-ar-approval-journey-refresh'],
    name: 'AR Approval - Refresh Payment Journey',
    table: 'x_695068_bcfa_ar_approval',
    when: 'after',
    action: ['insert', 'update'],
    order: 900,
    active: true,
    description: 'Refreshes the parent payment journey (Playbook) fields when an approval is requested or decided. Display only.',
    script: `(function executeRule(current, previous) {
    if (current.operation() === 'update' && !current.decision.changes()) return;
    if (current.getValue('payment')) new FinanceJourneyService().refreshPayment(current.getValue('payment'));
})(current, previous);`,
})
