import { Record, ScheduledScript } from '@servicenow/sdk/core'

// Phase 16: automation for the unified exception framework
// (src/server/script-includes/ExceptionEngine.server.js).
//
// - Notification events, fired by ExceptionEngine:
//     x_695068_bcfa.<ap|ar>_exception.assigned   on creation, parm1 = owner
//     x_695068_bcfa.<ap|ar>_exception.escalated  on escalation, parm1 = owner,
//                                                 group members (and Finance
//                                                 Controllers at level 2),
//                                                 parm2 = level
// - One email notification per event, sent to the users in parm1.
// - An hourly sweep: aging buckets, SLA at risk / breached, escalation.
//
// Email category: Uncategorized (c97d83137f4432005f58108c3ffa917a).
// Native task SLAs (contract_sla) need task-based tables; the exception
// tables are not task extensions, so SLA timing is done by the sweep.

Record({
    $id: Now.ID['event-ap-exception-assigned'],
    table: 'sysevent_register',
    data: { event_name: 'x_695068_bcfa.ap_exception.assigned', table: 'x_695068_bcfa_ap_exception', description: 'A new AP exception was raised and assigned (parm1 = owner).', fired_by: 'ExceptionEngine' },
})
Record({
    $id: Now.ID['event-ap-exception-escalated'],
    table: 'sysevent_register',
    data: { event_name: 'x_695068_bcfa.ap_exception.escalated', table: 'x_695068_bcfa_ap_exception', description: 'An AP exception breached its SLA and was escalated (parm1 = recipients, parm2 = level).', fired_by: 'ExceptionEngine' },
})
Record({
    $id: Now.ID['event-ar-exception-assigned'],
    table: 'sysevent_register',
    data: { event_name: 'x_695068_bcfa.ar_exception.assigned', table: 'x_695068_bcfa_ar_exception', description: 'A new AR exception was raised and assigned (parm1 = owner).', fired_by: 'ExceptionEngine' },
})
Record({
    $id: Now.ID['event-ar-exception-escalated'],
    table: 'sysevent_register',
    data: { event_name: 'x_695068_bcfa.ar_exception.escalated', table: 'x_695068_bcfa_ar_exception', description: 'An AR exception breached its SLA and was escalated (parm1 = recipients, parm2 = level).', fired_by: 'ExceptionEngine' },
})

const ASSIGNED_BODY = `<p>Exception <b>\${number}</b> has been assigned to you.</p>
<p>Type: \${reason_code} \${subtype}<br/>Severity: \${severity} / Priority: \${priority}<br/>SLA due: \${sla_due}</p>
<p>Rule result: \${rule_result}</p>
<p>Open the exception: \${URI_REF}</p>
<p>AI notes on the exception are advisory only; the decision is yours.</p>`

const ESCALATED_BODY = `<p>Exception <b>\${number}</b> has breached its SLA and was escalated (escalation level \${escalation_level}).</p>
<p>Type: \${reason_code} \${subtype}<br/>Severity: \${severity} / Priority: \${priority}<br/>Opened: \${opened_at} / SLA due: \${sla_due}<br/>Owner: \${assigned_to} / Group: \${assignment_group}</p>
<p>Rule result: \${rule_result}</p>
<p>Open the exception: \${URI_REF}</p>`

Record({
    $id: Now.ID['notification-ap-exception-assigned'],
    table: 'sysevent_email_action',
    data: {
        name: 'BCFA AP exception assigned', collection: 'x_695068_bcfa_ap_exception', generation_type: 'event', event_name: 'x_695068_bcfa.ap_exception.assigned',
        event_parm_1: true, send_self: true, active: true, content_type: 'text/html', category: 'c97d83137f4432005f58108c3ffa917a',
        subject: 'AP exception ${number} assigned to you: ${reason_code} (SLA due ${sla_due})', message_html: ASSIGNED_BODY,
    },
})
Record({
    $id: Now.ID['notification-ap-exception-escalated'],
    table: 'sysevent_email_action',
    data: {
        name: 'BCFA AP exception escalated', collection: 'x_695068_bcfa_ap_exception', generation_type: 'event', event_name: 'x_695068_bcfa.ap_exception.escalated',
        event_parm_1: true, send_self: true, active: true, content_type: 'text/html', category: 'c97d83137f4432005f58108c3ffa917a',
        subject: 'ESCALATED (level ${escalation_level}): AP exception ${number} breached its SLA', message_html: ESCALATED_BODY,
    },
})
Record({
    $id: Now.ID['notification-ar-exception-assigned'],
    table: 'sysevent_email_action',
    data: {
        name: 'BCFA AR exception assigned', collection: 'x_695068_bcfa_ar_exception', generation_type: 'event', event_name: 'x_695068_bcfa.ar_exception.assigned',
        event_parm_1: true, send_self: true, active: true, content_type: 'text/html', category: 'c97d83137f4432005f58108c3ffa917a',
        subject: 'AR exception ${number} assigned to you: ${reason_code} (SLA due ${sla_due})', message_html: ASSIGNED_BODY,
    },
})
Record({
    $id: Now.ID['notification-ar-exception-escalated'],
    table: 'sysevent_email_action',
    data: {
        name: 'BCFA AR exception escalated', collection: 'x_695068_bcfa_ar_exception', generation_type: 'event', event_name: 'x_695068_bcfa.ar_exception.escalated',
        event_parm_1: true, send_self: true, active: true, content_type: 'text/html', category: 'c97d83137f4432005f58108c3ffa917a',
        subject: 'ESCALATED (level ${escalation_level}): AR exception ${number} breached its SLA', message_html: ESCALATED_BODY,
    },
})

export const exceptionSweepJob = ScheduledScript({
    $id: Now.ID['job-exception-sla-sweep'],
    name: 'BCFA - Exception SLA and Escalation Sweep',
    frequency: 'periodically',
    executionInterval: Duration({ hours: 1 }),
    executionStart: '2026-09-28 00:00:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var result = new ExceptionEngine().sweep();
        gs.info('BCFA exception sweep: ' + JSON.stringify(result));
    `,
})
