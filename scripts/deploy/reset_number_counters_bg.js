// BCFA: restart the record numbers at 1: FDI0000001 (Document Intake), AP00000001 (AP invoice),
// AR00000001 (payment), RT00000001 (remittance). Scripts - Background, scope global.
// Run AFTER clean_transactions_bg.js: otherwise new numbers would repeat existing ones.
// PREVIEW = true (default): shows the counters, changes nothing. Deletes nothing in either mode.
var PREVIEW = true;

(function() {
    var out = [];
    ['finance_intake', 'ap_invoice', 'payment', 'remittance'].forEach(function(t) {
        var table = 'x_695068_bcfa_' + t;
        var rec = new GlideRecord(table);
        rec.query();
        var left = rec.getRowCount();
        var c = new GlideRecord('sys_number_counter');
        c.addQuery('table', table);
        c.query();
        if (!c.next()) { out.push(t + ': no counter yet'); return; }
        if (left && !PREVIEW) { out.push(t + ': NOT reset, ' + left + ' record(s) still exist (run the cleanup first)'); return; }
        out.push(t + ': last number ' + c.getValue('number') + (PREVIEW ? ' (would restart at 1' + (left ? '; ' + left + ' record(s) still exist' : '') + ')' : ' -> next is 1'));
        if (!PREVIEW) { c.setValue('number', 0); c.update(); }
    });
    gs.print('BCFA_COUNTERS ' + (PREVIEW ? 'PREVIEW ' : '') + out.join(' ; ') + ' ||');
})();
