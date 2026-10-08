// Scope global. Run after phase40_playbook_button_bg.js.
// Places the BCFA "Open Playbook" declarative form actions (AP invoice, payment)
// on the BCFA Workspace form action bar: one sys_ux_form_action and one
// sys_ux_form_action_layout_item per table, filed under the BCFA application.
// These records are not in the Fluent source: the SDK identifies
// sys_ux_form_action records by their UI action, so two declarative ones
// (no UI action) collide. A declarative form action without them leaves the
// whole workspace action bar empty, so the assignments are activated last.
// Idempotent.
(function() {
    var APP = '229ba2b1a079431e104010f5ea883e85';
    var ACTIONS = [
        { table: 'x_695068_bcfa_ap_invoice', assignment: '425771e68cd443eba638eb679d783284', name: 'Open Playbook (AP Invoice)' },
        { table: 'x_695068_bcfa_payment', assignment: 'dd8fdfc2b68c4e8b88d60393512b617a', name: 'Open Playbook (Payment)' }
    ];
    var out = [];
    function app(gr) { gr.setValue('sys_scope', APP); gr.setValue('sys_package', APP); }
    ACTIONS.forEach(function(a) {
        var fa = new GlideRecord('sys_ux_form_action');
        fa.addQuery('declarative_action', a.assignment);
        fa.query();
        if (!fa.next()) {
            fa.initialize();
            fa.setValue('declarative_action', a.assignment);
            app(fa);
        }
        fa.setValue('table', a.table);
        fa.setValue('action_type', 'declarative_action');
        fa.setValue('name', a.name);
        fa.setValue('active', true);
        var faId = fa.isNewRecord() ? fa.insert() : (fa.update(), fa.getUniqueValue());

        var li = new GlideRecord('sys_ux_form_action_layout_item');
        li.addQuery('action', faId);
        li.query();
        if (!li.next()) {
            li.initialize();
            li.setValue('action', faId);
            app(li);
        }
        li.setValue('table', a.table);
        li.setValue('name', 'Open Playbook');
        li.setValue('label', 'Open Playbook');
        li.setValue('color', 'secondary');
        li.setValue('overflow', false);
        li.setValue('order', 50);
        li.setValue('active', true);
        li.setValue('item_type', 'action');
        var liId = li.isNewRecord() ? li.insert() : (li.update(), li.getUniqueValue());

        var da = new GlideRecord('sys_declarative_action_assignment');
        var daOk = da.get(a.assignment);
        if (daOk && faId && liId) { da.setValue('active', true); da.update(); }
        out.push(a.table.replace('x_695068_bcfa_', '') + ': form action ' + (faId || 'FAILED') + ', layout item ' + (liId || 'FAILED') + ', assignment ' + (daOk ? 'active' : 'MISSING'));
    });
    gs.info('BCFA_PLAYBOOK_BUTTON ' + out.join(' | '));
})();

// The first attempt (a workspace UI action, now inactive) left a form action
// the platform created for it; it is switched off here.
(function() {
    var fa = new GlideRecord('sys_ux_form_action');
    fa.addQuery('ui_action', 'IN', 'bd29fdf23b4743818e7195de6476cc81,f8756742b7f444638796fb1583777590');
    fa.addQuery('active', true);
    fa.query();
    var n = 0;
    while (fa.next()) {
        var li = new GlideRecord('sys_ux_form_action_layout_item');
        li.addQuery('action', fa.getUniqueValue());
        li.query();
        while (li.next()) { li.setValue('active', false); li.update(); }
        fa.setValue('active', false);
        fa.update();
        n++;
    }
    gs.info('BCFA_PLAYBOOK_BUTTON retired leftover form actions: ' + n);
})();
