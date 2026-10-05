// Phase 40 (client POC criteria) probe 1: can native ServiceNow document
// extraction run on this instance today? Read-only inventory, then ONE
// DocIntel task on an existing intake attachment (AP_INV_001_CLEAN.pdf if
// present) with the BCFA AP Invoice Extraction use case. Creates only the
// DocIntel task; changes nothing else. Read the result with
// phase40_docintel_result_bg.js. Run in Scripts - Background, scope global.
(function() {
    var out = [];
    // 1. Installed document AI scopes / plugins
    var sc = new GlideRecord('sys_scope');
    sc.addQuery('scope', 'IN', 'sn_docintel,sn_docintel_genai,sn_cu,sn_cu_genai,sn_now_docintel,sn_gen_docintel');
    sc.addEncodedQuery('^ORscopeLIKEdocintel^ORscopeLIKEsn_cu^ORnameLIKEDocument Intelligence^ORnameLIKEContent Understanding');
    sc.query();
    var scopes = [];
    while (sc.next()) scopes.push(sc.getValue('scope') + ' "' + sc.getValue('name') + '" v' + sc.getValue('version') + (sc.getValue('active') == '1' ? '' : ' INACTIVE'));
    out.push('scopes: ' + (scopes.join('; ') || 'none'));
    var pl = new GlideRecord('v_plugin');
    if (pl.isValid()) {
        pl.addEncodedQuery('nameLIKEDocument Intelligence^ORnameLIKEDocIntel^ORnameLIKEContent Understanding^ORidLIKEdocintel');
        pl.query();
        var plugins = [];
        while (pl.next()) plugins.push(pl.getValue('id') + ' "' + pl.getValue('name') + '" ' + pl.getValue('active'));
        out.push('plugins: ' + (plugins.join('; ') || 'none'));
    }
    // 2. DocIntel properties that select the extraction method
    var pr = new GlideRecord('sys_properties');
    pr.addEncodedQuery('nameSTARTSWITHsn_docintel^ORnameSTARTSWITHglide.docintel^ORnameSTARTSWITHsn_cu.');
    pr.query();
    var props = [];
    while (pr.next()) props.push(pr.getValue('name') + '=' + String(pr.getValue('value')).substring(0, 40));
    out.push('properties(' + props.length + '): ' + props.slice(0, 40).join('; '));
    // 3. BCFA use cases and their document config
    ['0267216deb23c314311dff0dcad0cd8e', '456fe961eba3c314311dff0dcad0cdf3'].forEach(function(id) {
        var td = new GlideRecord('sys_di_task_definition');
        if (!td.get(id)) { out.push('use case ' + id + ' missing'); return; }
        var cfg = new GlideRecord('sys_di_doc_config');
        var cfgInfo = '';
        if (cfg.get(td.getValue('document_config'))) {
            var f = [];
            var els = cfg.getElements();
            for (var i = 0; i < els.size(); i++) {
                var n = els.get(i).getName();
                if (/method|model|mode|llm|genai|predict|engine|type/i.test(n)) f.push(n + '=' + cfg.getValue(n));
            }
            cfgInfo = f.join(',');
        }
        out.push('use case "' + td.getValue('display_name') + '" capability=' + td.getValue('capability') + ' target=' + td.getValue('target_table') + ' mluc=' + (td.getValue('mluc_id') || 'none') + ' cfg[' + cfgInfo + ']');
    });
    // 4. Recent DocIntel tasks on BCFA intakes
    var t = new GlideRecord('sys_di_task');
    if (t.isValid()) {
        t.addQuery('source_table', 'x_695068_bcfa_finance_intake');
        t.orderByDesc('sys_created_on');
        t.setLimit(3);
        t.query();
        while (t.next()) out.push('prior task ' + t.getUniqueValue().substring(0, 8) + ' ' + t.getValue('sys_created_on') + ' state=' + t.getValue('state') + ' method=' + t.getValue('prediction_method'));
    }
    // 5. One fresh extraction task on the clean AP fixture
    var att = new GlideRecord('sys_attachment');
    att.addQuery('table_name', 'x_695068_bcfa_finance_intake');
    att.addQuery('file_name', 'AP_INV_001_CLEAN.pdf');
    att.orderByDesc('sys_created_on');
    att.setLimit(1);
    att.query();
    if (!att.next()) {
        out.push('probe: no intake attachment AP_INV_001_CLEAN.pdf');
    } else {
        try {
            var api = new sn_docintel.DocIntelAPI();
            var taskId = api.createTask('BCFA Phase 40 probe - AP_INV_001_CLEAN', '0267216deb23c314311dff0dcad0cd8e',
                'x_695068_bcfa_finance_intake', att.getValue('table_sys_id'), [att.getUniqueValue()]);
            out.push('probe task=' + taskId + ' intake=' + att.getValue('table_sys_id'));
            out.push('processTask=' + JSON.stringify(api.processTask(taskId)));
        } catch (e) {
            out.push('probe ERROR ' + e);
        }
    }
    gs.info('BCFA_DIPROBE ' + out.join(' | '));
})();
