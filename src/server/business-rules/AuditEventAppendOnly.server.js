// Audit Events are evidence: once written they are never changed or
// removed through the application. (Retention purges are a platform
// administration task outside the app, and are not done by BCFA code.)
(function executeRule(current, previous) {
    gs.addErrorMessage('Audit Events are append-only and cannot be ' + (current.operation() === 'delete' ? 'deleted' : 'changed') + '.');
    current.setAbortAction(true);
})(current, previous);
