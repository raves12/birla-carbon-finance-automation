// Wrapped in a function so its variables never leak into the caller's
// script scope (see ApInvoiceApprovalCascade.server.js).
(function executeRule(current, previous) {
    // Phase 25: in flow mode the AR Clearing Flow clears instead.
    if (!FinanceOrchestration.isInline()) return;
    if (current.getValue('state') === 'APPROVED' && previous.getValue('state') !== 'APPROVED') {
        new ArDomainService().clearPayment(current.getUniqueValue());
    }
})(current, previous);
