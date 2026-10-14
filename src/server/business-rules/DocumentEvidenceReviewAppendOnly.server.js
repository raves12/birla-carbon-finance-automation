// Phase 42: a document evidence decision is evidence; a later decision is a
// new row.
(function executeRule(current, previous) {
    gs.addErrorMessage('Document Evidence Reviews are append-only: record a new review instead of ' + (current.operation() === 'delete' ? 'deleting' : 'changing') + ' this one.');
    current.setAbortAction(true);
})(current, previous);
