// Phase 42 (before loading): creates the new scoped tables with their build
// sys_ids (same pattern as the Phase 24 KPI and Phase 30 POC metric tables):
//   x_695068_bcfa_vendor_alias             Vendor Alias
//   x_695068_bcfa_grn_extraction           GRN Extraction (Evidence)
//   x_695068_bcfa_document_evidence_review Document Evidence Review
// The loader's --columns step then adds their columns.
(function createEvidenceTables() {
    var APP = '229ba2b1a079431e104010f5ea883e85';
    var TABLES = [
        ['af8a0bba2faa4d32a1476955ba7dd789', 'x_695068_bcfa_vendor_alias', 'Vendor Alias'],
        ['f72ffb1824ff404791410c84f492cfe7', 'x_695068_bcfa_grn_extraction', 'GRN Extraction (Evidence)'],
        ['198aaab73fbf4699bb865d616ee81c2a', 'x_695068_bcfa_document_evidence_review', 'Document Evidence Review']
    ];
    var previousApp = gs.getCurrentApplicationId();
    gs.setCurrentApplicationId(APP);
    try {
        TABLES.forEach(function(spec) {
            if (new GlideRecord(spec[1]).isValid()) { out.push(spec[1] + ' already exists'); return; }
            var t = new GlideRecord('sys_db_object');
            t.initialize();
            t.setNewGuidValue(spec[0]);
            t.setValue('name', spec[1]);
            t.setValue('label', spec[2]);
            t.setValue('access', 'public');
            t.setValue('create_access_controls', false);
            t.setValue('is_extendable', false);
            t.setValue('sys_scope', APP);
            t.setValue('sys_package', APP);
            t.insert();
            out.push(spec[1] + ' ' + (new GlideRecord(spec[1]).isValid() ? 'created' : 'NOT CREATED'));
        });
    } finally {
        gs.setCurrentApplicationId(previousApp);
    }
})();
