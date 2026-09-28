// Phase 29: AI ranking quality, stage 2. Run in Scripts - Background with
// scope = x_695068_bcfa 3-5 minutes after phase29_ai_eval_bg.js. Scores the
// advice the Cash Application Review agentic workflow saved on each
// evaluation exception, then removes the evaluation data (audit events and
// AI Interaction Log rows are kept). Set CLEANUP = false to keep the cases
// for a look in the workspace.
(function() {
    var CLEANUP = true;
    var FORCE_CLEANUP = false; // true: clean up even if some cases never got agent advice
    var ev = new FinanceAiEvaluation();
    var r = ev.scoreAgentAdvice();
    var pending = r.cases.filter(function(c) { return c.error === 'no agent advice saved yet'; }).length;
    var lines = r.cases.map(function(c) {
        if (c.error) return 'case ' + c.id + ' ' + c.error;
        return 'case ' + c.id + ' (' + c.label + ') expect ' + c.expect + ' got ' + c.skill.pick + (c.skill.correct ? ' OK' : ' WRONG') +
            ' named [' + c.skill.named.join(' ') + ']' + (c.skill.completedClaim ? ' COMPLETED-ACTION CLAIM' : '') + ' :: ' + c.skill.excerpt;
    });
    var cleaned = '';
    if (CLEANUP && (!pending || FORCE_CLEANUP)) cleaned = ' | cleanup ' + JSON.stringify(ev.cleanup());
    else if (pending) cleaned = ' | ' + pending + ' case(s) still waiting for the agent: run again in a few minutes, or set FORCE_CLEANUP (no cleanup yet)';
    gs.info('BCFA_P29EVAL2 agent advice: hinted ' + r.hinted.correct + '/' + r.hinted.total + ', no-hint (declines) ' + r.noHint.correct + '/' + r.noHint.total +
        ', completed-action claims ' + r.completedClaims + cleaned + ' || ' + lines.join(' || '));
})();
