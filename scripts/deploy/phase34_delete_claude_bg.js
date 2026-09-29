// Phase 34: deletes the Claude records from the instance. Run in Scripts -
// Background with scope = global (the platform refuses these deletes from the
// application scope), AFTER phase34_si_patch_bg.js has removed every call to
// BCClaudeClient. Refuses to delete while any app script still references it.
// Safe to re-run. Does not touch the x_695068_bcfa.BC_Claude_API_Credentials
// alias or its credential: see docs/EXTERNAL_AI_REMOVAL.md.
(function() {
var APP = '229ba2b1a079431e104010f5ea883e85';
var DEL = { sys_script_include: ['b8b296d6009944209283a8e91a573ae6'], sysauto_script: ['3ea0bc119c5b439682351ff485c661b8', 'e7e65a52158a4f729e4d512d736f65cd'],
  sys_properties: ['14de0ec35d204c53a2371a5f2d872355', '19d3680cb7374fd7a900a3686ce4a353', '732add1fdb044f53b34565facd13fd3a', 'a967c0acc6a84c9783c0349931fca287', 'd085cc4939df4bcca67aa60e3bd99af8'] };
var skip = {}; for (var t in DEL) DEL[t].forEach(function(id) { skip[id] = true; });
var refs = [];
['sys_script_include', 'sys_script', 'sys_ui_action', 'sysauto_script', 'sysevent_script_action', 'sys_script_fix'].forEach(function(t) {
  var g = new GlideRecord(t); g.addQuery('sys_scope', APP); g.addQuery('script', 'CONTAINS', 'BCClaudeClient'); g.query();
  while (g.next()) if (!skip[g.getUniqueValue()]) refs.push(t + ':' + g.getDisplayValue());
});
if (refs.length) { gs.info('BCFA_P34DEL ABORTED, still referenced by ' + refs.join(', ')); return; }
var out = [];
for (var t2 in DEL) DEL[t2].forEach(function(id) {
  var g = new GlideRecord(t2);
  if (!g.get(id)) { out.push(t2 + ':' + id.substr(0, 6) + ' absent'); return; }
  if (g.getValue('sys_scope') !== APP) { out.push(t2 + ':' + id.substr(0, 6) + ' NOT IN APP, skipped'); return; }
  var label = g.getDisplayValue(); out.push(t2 + ':' + label + (g.deleteRecord() ? ' deleted' : ' DELETE FAILED'));
});
gs.info('BCFA_P34DEL ' + out.join(' | '));
})();
