// Phase 42: applies the reviewer's decision to the AP invoice / GRN evidence
// (the AI finding stays as read) and audits it.
(function executeRule(current, previous) {
    new DocumentEvidenceService().applyReview(current);
})(current, previous);
