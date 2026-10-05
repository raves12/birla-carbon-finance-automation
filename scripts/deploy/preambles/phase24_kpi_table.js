// Phase 24 (before loading): creates the new scoped table x_695068_bcfa_kpi
// with its build sys_id. The loader's --columns step then adds its columns.
// The session's current application is switched to BCFA for the insert so
// the table is created in the app scope, then restored.
(function createKpiTable() {
    var APP = '229ba2b1a079431e104010f5ea883e85';
    if (new GlideRecord('x_695068_bcfa_kpi').isValid()) { out.push('KPI table already exists'); return; }
    var previousApp = gs.getCurrentApplicationId();
    gs.setCurrentApplicationId(APP);
    try {
        var t = new GlideRecord('sys_db_object');
        t.initialize();
        t.setNewGuidValue('80b48fddc4c24937817eacc13469ae64');
        t.setValue('name', 'x_695068_bcfa_kpi');
        t.setValue('label', 'Finance KPI');
        t.setValue('access', 'public');
        t.setValue('create_access_controls', false);
        t.setValue('is_extendable', false);
        t.setValue('sys_scope', APP);
        t.setValue('sys_package', APP);
        t.insert();
    } finally {
        gs.setCurrentApplicationId(previousApp);
    }
    out.push('KPI table ' + (new GlideRecord('x_695068_bcfa_kpi').isValid() ? 'created' : 'NOT CREATED'));
})();
