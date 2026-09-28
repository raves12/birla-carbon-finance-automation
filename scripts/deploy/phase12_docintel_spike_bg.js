// Phase 12 spike: can DocIntel extract an AP invoice when started from script?
// Creates ONE DocIntel task on the Phase 4 intake record for AP_INV_001_CLEAN.pdf
// using the BCFA AP Invoice Extraction use case, and submits it for processing.
// Changes nothing else. Run in Scripts - Background with scope = global.
var AP_USE_CASE = '0267216deb23c314311dff0dcad0cd8e';      // BCFA AP Invoice Extraction
var INTAKE = '1d3429653b238f904035a50864e45a26';           // FDI for AP_INV_001_CLEAN.pdf
var out = [];
try {
  var att = new GlideRecord('sys_attachment');
  att.addQuery('table_name', 'x_695068_bcfa_finance_intake');
  att.addQuery('table_sys_id', INTAKE);
  att.query();
  if (!att.next()) {
    out.push('NO ATTACHMENT on intake ' + INTAKE);
  } else {
    var api = new sn_docintel.DocIntelAPI();
    var taskId = api.createTask('BCFA Phase 12 spike - AP_INV_001_CLEAN', AP_USE_CASE,
      'x_695068_bcfa_finance_intake', INTAKE, [att.getUniqueValue()]);
    out.push('task=' + taskId + ' attachment=' + att.getValue('file_name'));
    var processed = api.processTask(taskId);
    out.push('processTask returned ' + JSON.stringify(processed));
  }
} catch (e) {
  out.push('ERROR ' + e);
}
gs.info('BCFA_SPIKE ' + out.join(' | '));
