// Phase 26 (change control): application files with the wrong package. Run in
// Scripts - Background with scope = global. Safe to re-run.
//
// Records the deploy loader inserted from global scope got the application's
// sys_scope but the global sys_package (updated records kept theirs). An
// application file should carry the application's package, which is what
// Studio / source control and application export treat as the app's files.
// This moves every such record to the application package. Deletion markers
// (sys_metadata_delete) are left alone. Business rules are not run
// (setWorkflow(false)): only the package changes.
(function() {
    var APP = '229ba2b1a079431e104010f5ea883e85';
    var out = [];
    if (gs.getCurrentScopeName() !== 'rhino.global') {
        gs.info('BCFA_P26PKG ABORTED: run in scope "global", current scope is ' + gs.getCurrentScopeName());
        return;
    }
    var byClass = {}, refused = {}, moved = 0, missing = 0;
    var md = new GlideRecord('sys_metadata');
    md.addQuery('sys_scope', APP);
    md.addQuery('sys_package', '!=', APP).addOrCondition('sys_package', '');
    md.addQuery('sys_class_name', '!=', 'sys_metadata_delete');
    md.query();
    while (md.next()) {
        var cls = md.getValue('sys_class_name');
        var rec = new GlideRecord(cls);
        if (!rec.isValid() || !rec.get(md.getUniqueValue())) { missing++; continue; }
        rec.setValue('sys_package', APP);
        rec.setWorkflow(false);
        // The UX list tables refuse writes from another scope (cross-scope
        // access policy): update() then returns nothing.
        if (!rec.update()) { refused[cls] = (refused[cls] || 0) + 1; continue; }
        moved++;
        byClass[cls] = (byClass[cls] || 0) + 1;
    }
    for (var c in byClass) out.push(c + '=' + byClass[c]);
    for (var r in refused) out.push('REFUSED ' + r + '=' + refused[r]);
    var left = new GlideAggregate('sys_metadata');
    left.addQuery('sys_scope', APP);
    left.addQuery('sys_package', '!=', APP);
    left.addQuery('sys_class_name', '!=', 'sys_metadata_delete');
    left.addAggregate('COUNT');
    left.query();
    var remaining = left.next() ? left.getAggregate('COUNT') : '?';
    gs.info('BCFA_P26PKG moved to the application package=' + moved + (missing ? ' (not found ' + missing + ')' : '') +
        ' | remaining outside it=' + remaining + ' | ' + out.join(', '));
})();
