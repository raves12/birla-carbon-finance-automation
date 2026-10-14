(function executeRule(current, previous /*null when async*/) {
    // Explicit fallback for auto-numbering: sys_db_object.number_ref and the
    // number column's primary flag are both configured correctly (confirmed
    // live via direct dictionary/sys_number inspection), and even the
    // documented GlideRecord.setNumber() call did not populate the field on
    // this table (confirmed live, twice, including after a full platform
    // cache flush). Rather than keep chasing whichever internal mechanism
    // isn't firing, this computes and assigns the number directly against
    // the same sys_number counter record — deterministic, and independent
    // of that mechanism entirely.
    if (current.getValue('number')) return;

    var counter = new GlideRecord('sys_number');
    counter.addQuery('category', 'x_695068_bcfa_finance_intake');
    counter.query();
    if (counter.next()) {
        var next = parseInt(counter.getValue('number'), 10) + 1;
        var digits = parseInt(counter.getValue('maximum_digits') || '7', 10);
        var prefix = counter.getValue('prefix') || '';
        var padded = String(next);
        while (padded.length < digits) {
            padded = '0' + padded;
        }
        current.setValue('number', prefix + padded);
        counter.setValue('number', String(next));
        counter.update();
    } else {
        // No counter record found at all — fall back to something unique
        // and traceable rather than leaving the record unnumbered. The first
        // 8 characters of the sys_id are not unique for records inserted in
        // the same instant (two client samples got the same number), so a
        // taken number gets the last 4 characters of the sys_id appended.
        var id = current.getUniqueValue();
        var number = 'FDI-' + id.substring(0, 8).toUpperCase();
        var taken = new GlideRecord('x_695068_bcfa_finance_intake');
        taken.addQuery('number', number);
        taken.setLimit(1);
        taken.query();
        if (taken.hasNext()) number += '-' + id.substring(id.length - 4).toUpperCase();
        current.setValue('number', number);
    }
})(current, previous);
