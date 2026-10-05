// Phase 30 (after loading): the KPI job now also refreshes the scorecard, so
// toggle it once to recreate its trigger (loadXML skips the business rule).
// FinancePocScorecard is package-private, so it cannot be called from this
// global-scope script: the job (app scope, every 15 minutes) fills the
// scorecard, or run `new FinancePocScorecard().refresh()` in scope
// x_695068_bcfa for the first rows immediately.
(function pocScorecard() {
    var job = new GlideRecord('sysauto_script');
    var toggled = false;
    if (job.get('e06fcfa703f046698cf31d3a7aeb209e')) {
        job.setValue('active', false); job.update();
        job.setValue('active', true); job.update();
        toggled = true;
    }
    out.push('PHASE30 KPI job ' + (toggled ? 're-armed' : 'NOT FOUND') + '; scorecard rows come from the job, or run new FinancePocScorecard().refresh() in scope x_695068_bcfa');
})();
