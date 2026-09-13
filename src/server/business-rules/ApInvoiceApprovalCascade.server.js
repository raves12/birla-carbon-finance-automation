// Reacts only to OUR OWN service's state change (ApprovalEngine sets
// approval_state via ApDomainService.decideApproval) — not a raw field edit
// path, so this fires exactly once per approval decision.
if (current.getValue('approval_state') === 'approved' && previous.getValue('approval_state') !== 'approved') {
    var svc = new ApDomainService();
    svc.postInvoice(current.getUniqueValue());
}
