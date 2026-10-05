// Phase 16 verification. Run in Scripts - Background with scope =
// x_695068_bcfa, after phase16_exceptions_bg.js (global).
//
// 1. Backfill: exceptions created before Phase 16 get the framework fields
//    (number, process, opened, priority, correlation id, SLA due/status,
//    AI explanation/confidence split from existing notes).
// 2. Sweep (what the hourly job runs): aging, SLA status, escalation. Older
//    open demo exceptions are past their SLA, so expect escalations.
// 3. A fresh TEST16 AR exception on the closed TEST14 payment: number,
//    priority, SLA, owner/group, correlation id, "assigned" event; then it is
//    aged artificially past twice its SLA and swept (level 2 escalation,
//    "escalated" event), and resolved as withdrawn (SLA missed). The AR AI
//    review workflow also starts on it; its note lands on a resolved record.
var out = [];

function row(table, sysId, fields) {
    var g = new GlideRecord(table);
    if (!g.get(sysId)) return 'not found';
    return fields.map(function(f) { return f + '=' + (g.getDisplayValue(f) || '-'); }).join(' | ');
}
function events(name, sysId) {
    var e = new GlideRecord('sysevent');
    e.addQuery('name', name);
    e.addQuery('instance', sysId);
    e.query();
    var list = [];
    while (e.next()) list.push(e.getValue('state') + ' parm1=' + (e.getValue('parm1') || '-').split(',').length + ' user(s) parm2=' + (e.getValue('parm2') || '-'));
    return name + ': ' + (list.length ? list.join('; ') : 'none');
}

try {
    var engine = new ExceptionEngine();
    out.push('backfill updated: ' + JSON.stringify(engine.backfill()));

    ['x_695068_bcfa_ap_exception', 'x_695068_bcfa_ar_exception'].forEach(function(table) {
        var withNumber = new GlideAggregate(table);
        withNumber.addNotNullQuery('number');
        withNumber.addAggregate('COUNT');
        withNumber.query();
        var total = new GlideAggregate(table);
        total.addAggregate('COUNT');
        total.query();
        out.push(table + ': numbered ' + (withNumber.next() ? withNumber.getAggregate('COUNT') : 0) + ' of ' + (total.next() ? total.getAggregate('COUNT') : 0));
    });
    var sample = new GlideRecord('x_695068_bcfa_ap_exception');
    sample.addNotNullQuery('ai_recommendation');
    sample.orderByDesc('sys_created_on');
    sample.setLimit(1);
    sample.query();
    if (sample.next()) {
        out.push('AI split sample ' + sample.getValue('number') + ': confidence=' + sample.getValue('ai_confidence') + ' explanation="' +
            (sample.getValue('ai_explanation') || '').substring(0, 140).replace(/\n/g, ' ') + '"');
    }

    out.push('sweep: ' + JSON.stringify(engine.sweep()));

    var payment = new GlideRecord('x_695068_bcfa_payment');
    if (!payment.get('bank_reference', 'BANK-T14-CN')) throw 'TEST14 payment BANK-T14-CN not found';
    var id = engine.createArException(payment.getUniqueValue(), 'other', 'TEST16: framework verification exception (withdrawn immediately).', {
        ruleResult: 'TEST16 verification', evidence: 'Created by phase16_verify_bg.js', subtype: 'framework_test'
    });
    var fields = ['number', 'process', 'reason_code', 'subtype', 'severity', 'priority', 'opened_at', 'sla_due', 'sla_status', 'aging_bucket',
        'escalation_level', 'assigned_to', 'assignment_group', 'correlation_id', 'status'];
    out.push('new: ' + row('x_695068_bcfa_ar_exception', id, fields));
    out.push(events('x_695068_bcfa.ar_exception.assigned', id));

    // Age it artificially: opened 3 days ago with a 24h SLA -> level 2.
    var aged = new GlideRecord('x_695068_bcfa_ar_exception');
    aged.get(id);
    var opened = new GlideDateTime();
    opened.addDaysUTC(-3);
    var due = new GlideDateTime(opened);
    due.addSeconds(24 * 3600);
    aged.setValue('opened_at', opened.getValue());
    aged.setValue('sla_due', due.getValue());
    aged.update();
    engine.sweep();
    out.push('after aging + sweep: ' + row('x_695068_bcfa_ar_exception', id, ['sla_status', 'aging_bucket', 'escalation_level', 'priority']));
    out.push(events('x_695068_bcfa.ar_exception.escalated', id));

    engine.resolve('ar', id, { status: 'closed', code: 'withdrawn', notes: 'TEST16: verification record withdrawn.', resolvedBy: gs.getUserID() });
    out.push('resolved: ' + row('x_695068_bcfa_ar_exception', id, ['status', 'resolution_code', 'resolved_by', 'resolved_at', 'sla_status', 'assigned_to']));
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_P16 ' + out.join('\n'));
