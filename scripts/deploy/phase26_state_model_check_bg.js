// Phase 26: state models against reality. Run in Scripts - Background with
// scope = x_695068_bcfa. Read-only. Compares every state change recorded in
// the audit trail (before_value.state -> after_value.state) with the declared
// transitions of the AP Invoice Lifecycle and Cash Application Lifecycle
// state models, and checks that every record's current state is a model
// state. Prints transitions that happen but are not modelled (with a count
// and one example), and modelled transitions never observed.
(function() {
    var MODELS = [
        { name: 'AP', model: '3d47c892fca14824b3093e6e0cca1b5a', table: 'x_695068_bcfa_ap_invoice', label: 'invoice_number' },
        { name: 'AR', model: 'abff1713d7c94462ba74a68f0a935603', table: 'x_695068_bcfa_payment', label: 'bank_reference' }
    ];
    var out = [];
    MODELS.forEach(function(m) {
        var valueOf = {}, states = {};
        var st = new GlideRecord('sttrm_state');
        st.addQuery('sttrm_model', m.model);
        st.query();
        while (st.next()) { valueOf[st.getUniqueValue()] = st.getValue('state_value'); states[st.getValue('state_value')] = true; }

        var declared = {};
        var tr = new GlideRecord('sttrm_state_transition');
        tr.addQuery('from_state.sttrm_model', m.model);
        tr.query();
        while (tr.next()) declared[valueOf[tr.getValue('from_state')] + '>' + valueOf[tr.getValue('to_state')]] = 0;

        var observed = {}, examples = {};
        var ev = new GlideRecord('x_695068_bcfa_audit_event');
        ev.addQuery('source_table', m.table);
        ev.addQuery('before_value', 'CONTAINS', '"state"');
        ev.query();
        while (ev.next()) {
            var b, a;
            try { b = JSON.parse(ev.getValue('before_value') || '{}').state; a = JSON.parse(ev.getValue('after_value') || '{}').state; } catch (e) { continue; }
            if (!b || !a || b === a) continue;
            var key = b + '>' + a;
            observed[key] = (observed[key] || 0) + 1;
            if (!examples[key]) examples[key] = ev.getValue('source_record');
        }

        var undeclared = [], used = 0;
        for (var k in observed) {
            if (k in declared) { declared[k] = observed[k]; used++; continue; }
            var rec = new GlideRecord(m.table);
            var label = rec.get(examples[k]) ? rec.getValue(m.label) : examples[k];
            undeclared.push(k + ' x' + observed[k] + ' (e.g. ' + label + ')');
        }
        var unused = [];
        for (var d in declared) if (!declared[d]) unused.push(d);

        var badState = [];
        var agg = new GlideAggregate(m.table);
        agg.addAggregate('COUNT');
        agg.groupBy('state');
        agg.query();
        var dist = [];
        while (agg.next()) {
            var s = agg.getValue('state');
            dist.push(s + '=' + agg.getAggregate('COUNT'));
            if (!states[s]) badState.push(s);
        }

        out.push(m.name + ': model states=' + Object.keys(states).length + ' transitions=' + Object.keys(declared).length +
            ' | observed distinct transitions=' + Object.keys(observed).length + ' (' + used + ' modelled)');
        out.push(m.name + ' NOT MODELLED: ' + (undeclared.join('; ') || 'none'));
        out.push(m.name + ' modelled, never observed: ' + (unused.join(', ') || 'none'));
        out.push(m.name + ' current states: ' + dist.join(', ') + (badState.length ? ' | NOT A MODEL STATE: ' + badState.join(', ') : ''));
    });
    gs.info('BCFA_P26 ' + out.join(' | '));
})();
