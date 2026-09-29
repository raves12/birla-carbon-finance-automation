// Phase 30 (before loading): creates the new scoped table
// x_695068_bcfa_poc_metric with its build sys_id (same pattern as the Phase 24
// KPI table). The loader's --columns step then adds its columns.
(function createPocMetricTable() {
    var APP = '229ba2b1a079431e104010f5ea883e85';
    if (new GlideRecord('x_695068_bcfa_poc_metric').isValid()) { out.push('POC metric table already exists'); return; }
    var previousApp = gs.getCurrentApplicationId();
    gs.setCurrentApplicationId(APP);
    try {
        var t = new GlideRecord('sys_db_object');
        t.initialize();
        t.setNewGuidValue('c97786e011264324af510a7449f296d6');
        t.setValue('name', 'x_695068_bcfa_poc_metric');
        t.setValue('label', 'POC Success Metric');
        t.setValue('access', 'public');
        t.setValue('create_access_controls', false);
        t.setValue('is_extendable', false);
        t.setValue('sys_scope', APP);
        t.setValue('sys_package', APP);
        t.insert();
    } finally {
        gs.setCurrentApplicationId(previousApp);
    }
    out.push('POC metric table ' + (new GlideRecord('x_695068_bcfa_poc_metric').isValid() ? 'created' : 'NOT CREATED'));
})();
