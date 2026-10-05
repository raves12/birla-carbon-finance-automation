
  // Phase 16: sys_number counters for exception numbers (APEX / AREX),
  // used by ExceptionEngine.nextNumber(). Created once, never reset.
  [{ table: 'x_695068_bcfa_ap_exception', prefix: 'APEX' }, { table: 'x_695068_bcfa_ar_exception', prefix: 'AREX' }].forEach(function(c) {
    var counter = new GlideRecord('sys_number');
    counter.addQuery('category', c.table);
    counter.query();
    if (counter.next()) { out.push('counter ' + c.prefix + ' exists at ' + counter.getValue('number')); return; }
    counter.initialize();
    counter.setValue('category', c.table);
    counter.setValue('prefix', c.prefix);
    counter.setValue('number', '1000');
    counter.setValue('maximum_digits', '7');
    counter.setValue('sys_scope', '229ba2b1a079431e104010f5ea883e85');
    counter.insert();
    out.push('counter ' + c.prefix + ' created');
  });
