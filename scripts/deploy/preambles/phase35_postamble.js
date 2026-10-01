
  var chk = [];
  ['journey_stage_order', 'journey_blocked_reason'].forEach(function(c) { chk.push('ap.' + c + '=' + new GlideRecord('x_695068_bcfa_ap_invoice').isValidField(c)); });
  ['sap_processing_mode', 'sap_status', 'residual_amount', 'journey_stage_order'].forEach(function(c) { chk.push('pay.' + c + '=' + new GlideRecord('x_695068_bcfa_payment').isValidField(c)); });
  var pd = new GlideRecord('sys_pd_process_definition');
  pd.addQuery('sys_id', 'IN', '74ce2044163b43e7bbaa53a0cb012d42,e01d2325600b49c5a0165460897cd11d');
  pd.query();
  while (pd.next()) {
    var ln = new GlideAggregate('sys_pd_lane'); ln.addQuery('process_definition', pd.getUniqueValue()); ln.addAggregate('COUNT'); ln.query(); ln.next();
    var ac = new GlideAggregate('sys_pd_activity'); ac.addQuery('process_definition', pd.getUniqueValue()); ac.addAggregate('COUNT'); ac.query(); ac.next();
    chk.push(pd.getValue('label') + ' status=' + pd.getValue('status') + ' lanes=' + ln.getAggregate('COUNT') + ' activities=' + ac.getAggregate('COUNT'));
  }
  var rt = new GlideRecord('sys_ux_app_route'); chk.push('playbook route=' + rt.get('31661743d90841229eb787e61bab30e9'));
  out.push('verify: ' + chk.join(', '));
