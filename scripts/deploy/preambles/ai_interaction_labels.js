// Phase 20: the AI Interaction table becomes the provider-agnostic AI
// Interaction Log. Existing columns keep their names; their labels change
// (update-XML loading of an existing column's dictionary is not used).
(function relabelAiInteraction() {
    var labels = { '': 'AI Interaction Log', claude_model: 'Model', claude_request_id: 'Provider Request ID', latency_ms: 'Duration (ms)' };
    var changed = [];
    for (var element in labels) {
        var doc = new GlideRecord('sys_documentation');
        doc.addQuery('name', 'x_695068_bcfa_ai_interaction');
        if (element) doc.addQuery('element', element);
        else doc.addNullQuery('element');
        doc.addQuery('language', 'en');
        doc.query();
        while (doc.next()) {
            if (doc.getValue('label') === labels[element]) continue;
            doc.setValue('label', labels[element]);
            if (!element) doc.setValue('plural', 'AI Interaction Logs');
            doc.update();
            changed.push((element || 'table') + '=' + labels[element]);
        }
    }
    var table = new GlideRecord('sys_db_object');
    if (table.get('name', 'x_695068_bcfa_ai_interaction') && table.getValue('label') !== 'AI Interaction Log') {
        table.setValue('label', 'AI Interaction Log');
        table.update();
        changed.push('sys_db_object');
    }
    gs.info('BCFA_LABELS ' + (changed.length ? changed.join(', ') : 'already current'));
})();
