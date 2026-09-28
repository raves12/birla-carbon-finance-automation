// Records a field_corrected Audit Event when a person (or a service)
// changes a business field after intake. The field list per table is
// AuditEngine.CORRECTABLE_FIELDS.
(function executeRule(current, previous) {
    new AuditEngine().logFieldChanges(current, previous);
})(current, previous);
