// Phase 20 fix check. Run in Scripts - Background with scope =
// x_695068_bcfa, after phase20_fix_bg.js (global).
//
// recordExceptionAdvice wrote ai_explanation / ai_confidence through
// GlideRecordSecure, which drops writes to those read-only fields, so saved
// notes never filled them. The fix derives them with a system write. This
// re-derives them for existing notes (ExceptionEngine.backfill only fills
// empty fields) and saves a test note through the tool to confirm.
var out = [];
try {
    var counts = new ExceptionEngine().backfill();
    out.push('backfill: ' + JSON.stringify(counts));
    ['x_695068_bcfa_ap_exception', 'x_695068_bcfa_ar_exception'].forEach(function(table) {
        var withNote = new GlideAggregate(table);
        withNote.addNotNullQuery('ai_recommendation');
        withNote.addAggregate('COUNT');
        withNote.query();
        var missing = new GlideAggregate(table);
        missing.addNotNullQuery('ai_recommendation');
        missing.addNullQuery('ai_confidence');
        missing.addNullQuery('ai_explanation');
        missing.addAggregate('COUNT');
        missing.query();
        out.push(table + ': notes ' + (withNote.next() ? withNote.getAggregate('COUNT') : 0) + ', with neither explanation nor confidence ' +
            (missing.next() ? missing.getAggregate('COUNT') : 0) + ' (notes without an Explanation/Analysis section or Confidence line)');
    });

    var exc = new GlideRecord('x_695068_bcfa_ap_exception');
    exc.addQuery('number', 'APEX0001017');
    exc.query();
    if (exc.next()) {
        var note = 'AI REVIEW (advisory only - a human must decide)\n\nAnalysis:\nTEST20 fix check: vendor code missing on the invoice.\nConfidence: Medium\n\nRecommendation:\nRequest invoice correction from the vendor.';
        var saved = new FinanceAgentTools().recordExceptionAdvice('ap', exc.getUniqueValue(), note);
        exc.get(exc.getUniqueValue());
        out.push('APEX0001017 save ' + saved.ok + ': ai_confidence=' + exc.getValue('ai_confidence') + ' | ai_explanation=' + exc.getValue('ai_explanation') +
            (exc.getValue('ai_confidence') === 'medium' && /vendor code missing/.test(exc.getValue('ai_explanation')) ? ' PASS' : ' FAIL'));
    }
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_P20B ' + out.join('\n'));
