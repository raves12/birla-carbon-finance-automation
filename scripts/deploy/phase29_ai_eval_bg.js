// Phase 29: AI ranking quality on ambiguous cash matches, stage 1. Run in
// Scripts - Background with scope = x_695068_bcfa after phase29_tests_bg.js.
// Creates 6 labelled ambiguous-match cases (EVAL-P29-*) through the real
// pipeline, checks that the engine chose nothing, and scores the Now Assist
// next-action advice. About a minute (6 skill calls). The Cash Application
// Review agentic workflow also reviews each new exception; score that with
// phase29_ai_eval_stage2_bg.js a few minutes later (it then removes the
// evaluation data).
(function() {
    var r = new FinanceAiEvaluation().run();
    var lines = r.cases.map(function(c) {
        if (c.error) return 'case ' + c.id + ' ERROR ' + c.error;
        return 'case ' + c.id + ' (' + c.label + ') expect ' + c.expect + ' got ' + c.skill.pick + (c.skill.correct ? ' OK' : ' WRONG') +
            ' named [' + c.skill.named.join(' ') + ']' + (c.skill.completedClaim ? ' COMPLETED-ACTION CLAIM' : '') + ' :: ' + c.skill.excerpt;
    });
    gs.info('BCFA_P29EVAL skill advice: hinted ' + r.hinted.correct + '/' + r.hinted.total + ', no-hint (declines) ' + r.noHint.correct + '/' + r.noHint.total +
        ', errors ' + r.errors + ', completed-action claims ' + r.completedClaims + ', deterministic control ' + (r.controlOk ? 'PASS (engine chose nothing)' : 'FAIL') +
        ' || ' + lines.join(' || '));
})();
