// Lifecycle enforcement (Phase 26). The AP Invoice Lifecycle and Cash
// Application Lifecycle state models (sttrm_model, built from
// src/fluent/state-models) are the single source of truth for which state
// changes are legal. Two places check them:
//   - Ap/ArDomainService._setState, before every state change the services
//     make: a transition the model does not allow is audited and refused
//     (the service throws, so no later step runs on a record in the wrong
//     state).
//   - the "BCFA - Enforce ... Lifecycle" business rules, a backstop for any
//     other writer (form, list, import, script): the update is aborted.
// Staying in the same state is always allowed. A record's first state is set
// on insert (RECEIVED) and is not checked here.
//
// Property x_695068_bcfa.lifecycle.enforcement:
//   enforce (default) refuse and audit
//   monitor           allow, but audit the transition as outside the model
var FinanceLifecycle = Class.create();

FinanceLifecycle.PROPERTY = 'x_695068_bcfa.lifecycle.enforcement';
FinanceLifecycle.MODELS = {
    x_695068_bcfa_ap_invoice: 'AP Invoice Lifecycle',
    x_695068_bcfa_payment: 'Cash Application Lifecycle'
};

FinanceLifecycle.prototype = {
    initialize: function() {
        this._transitions = {};
    },

    enforcing: function() {
        return gs.getProperty(FinanceLifecycle.PROPERTY, 'enforce') !== 'monitor';
    },

    // { allowed, model, message }. No side effects.
    evaluate: function(table, from, to) {
        var model = FinanceLifecycle.MODELS[table];
        if (!model || !from || from === to) return { allowed: true, model: model || '' };
        var allowed = this._allowed(table);
        if (allowed === null) return { allowed: true, model: model, message: 'State model ' + model + ' not found; transition not checked' };
        if (allowed[from + '>' + to]) return { allowed: true, model: model };
        var next = [];
        for (var k in allowed) if (k.indexOf(from + '>') === 0) next.push(k.split('>')[1]);
        return {
            allowed: false,
            model: model,
            message: 'The ' + model + ' does not allow ' + from + ' -> ' + to + '. Allowed from ' + from + ': ' + (next.join(', ') || 'none') + '.'
        };
    },

    // Audits a transition outside the model: refused (enforce) or let
    // through (monitor).
    record: function(table, sysId, from, to, verdict, context) {
        new AuditEngine().logEvent({
            correlationId: context.correlationId || '',
            sourceTable: table,
            sourceRecord: sysId,
            eventType: 'rule_evaluated',
            actorType: 'system',
            reason: verdict.message,
            description: (this.enforcing() ? 'Lifecycle: refused ' : 'Lifecycle (monitor): outside the model ') + from + ' -> ' + to +
                (context.attempt ? ' (' + context.attempt + ')' : ''),
            beforeValue: { from_state: from },
            afterValue: { rule: 'lifecycle', model: verdict.model, to_state: to, result: this.enforcing() ? 'REFUSED' : 'MONITORED' }
        });
    },

    // Allowed "FROM>TO" pairs of the table's model, read once per instance;
    // null when the model is missing.
    _allowed: function(table) {
        if (table in this._transitions) return this._transitions[table];
        var model = new GlideRecord('sttrm_model');
        model.addQuery('table_name', table);
        model.addQuery('active', true);
        model.setLimit(1);
        model.query();
        if (!model.next()) return (this._transitions[table] = null);
        var values = {};
        var st = new GlideRecord('sttrm_state');
        st.addQuery('sttrm_model', model.getUniqueValue());
        st.query();
        while (st.next()) values[st.getUniqueValue()] = st.getValue('state_value');
        var allowed = {};
        var tr = new GlideRecord('sttrm_state_transition');
        tr.addQuery('from_state.sttrm_model', model.getUniqueValue());
        tr.query();
        while (tr.next()) allowed[values[tr.getValue('from_state')] + '>' + values[tr.getValue('to_state')]] = true;
        return (this._transitions[table] = allowed);
    },

    type: 'FinanceLifecycle'
};
