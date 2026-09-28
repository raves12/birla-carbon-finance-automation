// Reacts only to OUR OWN service's state change (ApprovalEngine sets
// approval_state via ApDomainService.decideApproval) — not a raw field edit
// path, so this fires exactly once per approval decision.
// Wrapped in a function so its variables never leak into the caller's
// script scope (a bare "var svc" here once overwrote a caller's variable).
(function executeRule(current, previous) {
    if (current.getValue('approval_state') === 'approved' && previous.getValue('approval_state') !== 'approved') {
        new ApDomainService().postInvoice(current.getUniqueValue());
    }
})(current, previous);
