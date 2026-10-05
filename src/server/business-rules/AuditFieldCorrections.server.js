// Records a field_corrected Audit Event when a person (or a service)
// changes a business field after intake. The field list per table is
// AuditEngine.CORRECTABLE_FIELDS. A correction also marks the AI extraction
// behind the record as overridden in the AI Interaction Log (Phase 20).
(function executeRule(current, previous) {
    var audit = new AuditEngine();
    if (audit.logFieldChanges(current, previous)) new AiInteractionLog().recordCorrection(current, audit.lastCorrectedFields);
})(current, previous);
