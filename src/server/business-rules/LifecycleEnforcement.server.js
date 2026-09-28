(function executeRule(current, previous /*null when async*/) {
    // Phase 26 backstop: every state change on the table, whoever makes it,
    // must be a transition of the lifecycle state model. The domain services
    // already check before they update (FinanceLifecycle in _setState); this
    // catches any other writer (form, list, import, script).
    if (!current.state.changes()) return;
    var lifecycle = new FinanceLifecycle();
    var table = current.getTableName();
    var from = previous.getValue('state');
    var to = current.getValue('state');
    var gate = lifecycle.evaluate(table, from, to);
    if (gate.allowed) return;
    lifecycle.record(table, current.getUniqueValue(), from, to, gate, { correlationId: current.getValue('correlation_id'), attempt: 'direct update' });
    if (lifecycle.enforcing()) {
        gs.addErrorMessage('State change refused: ' + gate.message);
        current.setAbortAction(true);
    }
})(current, previous);
