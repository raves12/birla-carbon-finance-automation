// Phase 16 verification, part 2. Run in Scripts - Background with scope =
// x_695068_bcfa, after phase16_fix_bg.js (global).
//
// 1. Backfill again: older open exceptions without a group or owner get the
//    policy defaults (so escalations reach someone).
// 2. Finishes the TEST16 exception from part 1 (AREX0001012): ages it past
//    twice its SLA, sweeps (expect level 2 escalation and priority 1), then
//    resolves it as withdrawn (expect SLA missed, resolved by/at, owner kept).
// Notification events are checked separately (the app scope cannot read
// the global event queue).
var out = [];

function row(gr, fields) {
    return fields.map(function(f) { return f + '=' + (gr.getDisplayValue(f) || '-'); }).join(' | ');
}

try {
    var engine = new ExceptionEngine();
    out.push('backfill updated: ' + JSON.stringify(engine.backfill()));
    ['x_695068_bcfa_ap_exception', 'x_695068_bcfa_ar_exception'].forEach(function(table) {
        var unassigned = new GlideAggregate(table);
        unassigned.addQuery('status', 'IN', 'open,in_review');
        unassigned.addNullQuery('assigned_to');
        unassigned.addAggregate('COUNT');
        unassigned.query();
        out.push(table + ': open without owner = ' + (unassigned.next() ? unassigned.getAggregate('COUNT') : 0));
    });

    var test = new GlideRecord('x_695068_bcfa_ar_exception');
    test.addQuery('subtype', 'framework_test');
    test.addQuery('status', 'open');
    test.orderByDesc('sys_created_on');
    test.setLimit(1);
    test.query();
    if (!test.next()) throw 'No open TEST16 exception found (subtype framework_test).';
    var id = test.getUniqueValue();
    out.push('TEST16 ' + test.getValue('number') + ' before: ' + row(test, ['sla_status', 'escalation_level', 'priority']));

    var opened = new GlideDateTime();
    opened.addDaysUTC(-3);
    var due = new GlideDateTime(opened);
    due.addSeconds(24 * 3600);
    test.setValue('opened_at', opened.getValue());
    test.setValue('sla_due', due.getValue());
    test.update();
    out.push('sweep: ' + JSON.stringify(engine.sweep()));
    var aged = new GlideRecord('x_695068_bcfa_ar_exception');
    aged.get(id);
    out.push('after aging + sweep: ' + row(aged, ['sla_status', 'aging_bucket', 'escalation_level', 'priority']));

    engine.resolve('ar', id, { status: 'closed', code: 'withdrawn', notes: 'TEST16: verification record withdrawn.', resolvedBy: gs.getUserID() });
    var done = new GlideRecord('x_695068_bcfa_ar_exception');
    done.get(id);
    out.push('resolved: ' + row(done, ['status', 'resolution_code', 'resolved_by', 'resolved_at', 'sla_status', 'assigned_to']));
    out.push('TEST16 sys_id for the event check: ' + id);
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_P16B ' + out.join('\n'));
