// Phase 40: reads the native extraction output of the evaluation tasks ("BCFA PH40 eval <file>") and
// logs one line per document: BCFA_EVAL <file> <task state> <raw structured output>. Read-only.
// The lines are compared to scripts/eval/ground_truth_synthetic.json by scripts/eval/score_extraction.py.
// Scope global.
(function() {
    var latest = {};
    var t = new GlideRecord('sys_di_task');
    t.addQuery('display_name', 'STARTSWITH', 'BCFA PH40 eval ');
    t.orderBy('sys_created_on');
    t.query();
    while (t.next()) latest[t.getValue('display_name')] = t.getUniqueValue(); // newest task per document
    var n = 0;
    for (var name in latest) {
        var file = name.substring('BCFA PH40 eval '.length);
        var task = new GlideRecord('sys_di_task');
        task.get(latest[name]);
        var raw = '', outputId = '';
        var ev = new GlideRecord('sys_di_extracted_value');
        ev.addQuery('task', latest[name]);
        ev.addQuery('metadata', 'CONTAINS', 'output_table_id');
        ev.query();
        while (!outputId && ev.next()) {
            try { outputId = JSON.parse(ev.getValue('metadata') || '{}').output_table_id || ''; } catch (e) {}
        }
        if (outputId) {
            var o = new GlideRecord('di_genai_output');
            if (o.get(outputId)) raw = o.getValue('data') + (o.getValue('error') ? ' ERROR ' + o.getValue('error') : '');
        }
        gs.info('BCFA_EVAL ' + file + ' processed=' + task.getValue('is_processed') + ' ' + raw);
        n++;
    }
    gs.info('BCFA_EVALDONE documents=' + n);
})();
