// Phase 42: records who decided, when, and the AI / OCR value next to the
// reviewer's value; rejects an incomplete decision.
(function executeRule(current, previous) {
    var error = new DocumentEvidenceService().captureReview(current);
    if (error) {
        gs.addErrorMessage(error);
        current.setAbortAction(true);
    }
})(current, previous);
