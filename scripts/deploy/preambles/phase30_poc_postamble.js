// Phase 30 (after loading): the KPI job now also refreshes the scorecard, so
// toggle it once to recreate its trigger (loadXML skips the business rule),
// then compute the scorecard and print it.
(function pocScorecard() {
    var job = new GlideRecord('sysauto_script');
    if (job.get('e06fcfa703f046698cf31d3a7aeb209e')) {
        job.setValue('active', false); job.update();
        job.setValue('active', true); job.update();
    }
    try {
        var metrics = new x_695068_bcfa.FinancePocScorecard().refresh();
        out.push('PHASE30 ' + metrics.map(function(m) {
            return m.code + '=' + m.value + (m.unit === 'percent' ? '%' : '') + ' [' + m.status + (m.comparator ? ' target ' + (m.comparator === 'gte' ? '>=' : '<=') + m.target : '') + ', n=' + m.sample + ']';
        }).join(' | '));
    } catch (e) {
        out.push('PHASE30 scorecard failed: ' + e);
    }
})();
