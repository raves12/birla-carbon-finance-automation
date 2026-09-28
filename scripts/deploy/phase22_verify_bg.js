// Phase 22 verification, part 1. Run in Scripts - Background with scope =
// global (it impersonates; the session returns to you at the end), after
// phase22_least_privilege_bg.js.
//
//   1 the AI identity's roles: only x_695068_bcfa.ai_agent among BCFA roles;
//     no admin, security_admin, approver or processor role
//   2 ACL matrix as the AI user (GlideRecordSecure): reads the transaction
//     tables, writes nothing but the exception ai_recommendation field, no
//     access to approvals, audit, integration, intake or the AI log
//   3 the same exception field checks as the AP processor (no regression)
//   4 agent / workflow execute ACLs and masks: ai_agent present, no admin or
//     approver role; skill masks and ACLs accept ai_agent
var out = [];
var me = gs.getUserID();
var session = gs.getSession();
var AI = 'bcfa.ai.reviewer';

function sample(table) {
    var gr = new GlideRecord(table);
    gr.orderByDesc('sys_created_on');
    gr.setLimit(1);
    gr.query();
    return gr.next() ? gr.getUniqueValue() : '';
}
function asUser(userName, fn) {
    var u = new GlideRecord('sys_user');
    if (!u.get('user_name', userName)) return 'user ' + userName + ' not found';
    session.impersonate(u.getUniqueValue());
    try { return fn(); } finally { session.impersonate(me); }
}
function matrix(expect) {
    var rows = [];
    var fail = 0;
    for (var table in expect) {
        var e = expect[table];
        var id = sample(table);
        var gr = new GlideRecordSecure(table);
        var read = id ? gr.get(id) : false;
        var got = { read: read, write: read ? gr.canWrite() : false, create: new GlideRecordSecure(table).canCreate() };
        if (e.fields) {
            for (var f in e.fields) got[f] = read ? gr.getElement(f).canWrite() : false;
        }
        var bad = [];
        for (var k in got) {
            var want = k in e ? e[k] : (e.fields ? e.fields[k] : undefined);
            if (want !== undefined && want !== got[k]) bad.push(k + '=' + got[k] + ' (expected ' + want + ')');
        }
        if (bad.length) fail++;
        rows.push('    ' + table.replace('x_695068_bcfa_', '') + ': ' + Object.keys(got).map(function(k) { return k + '=' + got[k]; }).join(' ') +
            (bad.length ? '  FAIL ' + bad.join(', ') : '  PASS'));
    }
    return { rows: rows, fail: fail };
}

try {
    // 1 roles
    var roleCheck = asUser(AI, function() {
        var names = ['admin', 'security_admin', 'x_695068_bcfa.admin', 'x_695068_bcfa.finance_approver', 'x_695068_bcfa.ap_approver',
            'x_695068_bcfa.ar_approver', 'x_695068_bcfa.ap_processor', 'x_695068_bcfa.ar_processor', 'x_695068_bcfa.finance_reviewer',
            'x_695068_bcfa.auditor', 'x_695068_bcfa.integration_operator', 'x_695068_bcfa.ai_agent'];
        var held = names.filter(function(n) { return gs.hasRole(n); });
        return held;
    });
    var grants = [];
    var g = new GlideRecord('sys_user_has_role');
    g.addQuery('user.user_name', AI);
    g.query();
    while (g.next()) grants.push(g.getDisplayValue('role') + (g.getValue('inherited') === '1' ? ' (inherited)' : ''));
    out.push('1 AI user grants: ' + grants.join(', ') + ' | effective BCFA/admin roles: ' + roleCheck.join(', ') +
        (roleCheck.length === 1 && roleCheck[0] === 'x_695068_bcfa.ai_agent' ? ' PASS' : ' FAIL'));

    // 2 ACL matrix as the AI user
    var aiExpect = {
        x_695068_bcfa_ap_invoice: { read: true, write: false, create: false },
        x_695068_bcfa_payment: { read: true, write: false, create: false },
        x_695068_bcfa_payment_allocation: { read: true, write: false, create: false },
        x_695068_bcfa_deduction: { read: true, write: false, create: false },
        x_695068_bcfa_ap_exception: { read: true, write: true, create: false, fields: { ai_recommendation: true, status: false, decision: false, resolution_notes: false, reason_code: false } },
        x_695068_bcfa_ar_exception: { read: true, write: true, create: false, fields: { ai_recommendation: true, status: false, decision: false, deduction_type: false } },
        x_695068_bcfa_ap_approval: { read: false, create: false },
        x_695068_bcfa_ar_approval: { read: false, create: false },
        x_695068_bcfa_audit_event: { read: false, create: false },
        x_695068_bcfa_ai_interaction: { read: false, create: false },
        x_695068_bcfa_integration_txn: { read: false, create: false },
        x_695068_bcfa_finance_intake: { read: false, create: false },
        x_695068_bcfa_vendor: { read: true, write: false, create: false },
        x_695068_bcfa_ar_open_item: { read: true, write: false, create: false }
    };
    var ai = asUser(AI, function() { return matrix(aiExpect); });
    out.push('2 ACL matrix as ' + AI + ' (' + (ai.fail ? ai.fail + ' FAIL' : 'all PASS') + '):\n' + ai.rows.join('\n'));

    // 3 no regression for the AP processor
    var proc = asUser('bcfa.ap.processor', function() {
        // decision is read-only in the dictionary for everyone (set only by
        // ApExceptionDecisionService), so false is expected.
        return matrix({ x_695068_bcfa_ap_exception: { read: true, write: true, fields: { ai_recommendation: true, status: true, decision: false, resolution_notes: true } },
            x_695068_bcfa_ap_invoice: { read: true, write: true, create: true } });
    });
    out.push('3 AP processor (' + (proc.fail ? proc.fail + ' FAIL' : 'all PASS') + '):\n' + proc.rows.join('\n'));

    // 4 agent / workflow / skill access configuration
    var aclRows = [];
    var acl = new GlideRecord('sys_security_acl');
    acl.addQuery('name', 'STARTSWITH', 'global.x_695068_bcfa.');
    acl.addQuery('type.name', 'gen_ai_agent');
    acl.query();
    var aclFail = 0;
    while (acl.next()) {
        var roles = [];
        var r = new GlideRecord('sys_security_acl_role');
        r.addQuery('sys_security_acl', acl.getUniqueValue());
        r.query();
        while (r.next()) roles.push(r.getDisplayValue('sys_user_role').replace('x_695068_bcfa.', ''));
        var bad = roles.indexOf('admin') >= 0 || roles.indexOf('finance_approver') >= 0 || roles.indexOf('ai_agent') < 0;
        if (bad) aclFail++;
        aclRows.push('    ' + acl.getValue('name').replace('global.x_695068_bcfa.', '') + ': ' + roles.sort().join(', ') + (bad ? '  FAIL' : '  PASS'));
    }
    out.push('4 agent/workflow execute ACLs (' + (aclFail ? aclFail + ' FAIL' : 'all PASS') + '):\n' + aclRows.join('\n'));
    var maskRows = [];
    var mask = new GlideRecord('sys_agent_access_role_configuration');
    mask.addQuery('sys_scope', '229ba2b1a079431e104010f5ea883e85');
    mask.query();
    var maskFail = 0;
    while (mask.next()) {
        var list = mask.getDisplayValue('role_list');
        var isAgent = mask.getValue('agent_table') === 'sn_aia_agent';
        var bad2 = list.indexOf('ai_agent') < 0 || (isAgent && (list.indexOf('x_695068_bcfa.admin') >= 0 || list.indexOf('finance_approver') >= 0));
        if (bad2) maskFail++;
        maskRows.push('    ' + (isAgent ? 'agent ' : 'skill ') + mask.getDisplayValue('agent').replace(/^(AI Agent|Now Assist Skill Config): /, '') + ': ' +
            list.replace(/x_695068_bcfa\./g, '') + (bad2 ? '  FAIL' : '  PASS'));
    }
    out.push('4 role masks (' + (maskFail ? maskFail + ' FAIL' : 'all PASS') + '):\n' + maskRows.join('\n'));
    var skillAclFail = 0;
    var sacl = new GlideRecord('sys_security_acl');
    sacl.addQuery('type.name', 'gen_ai_skill');
    sacl.addQuery('name', 'STARTSWITH', 'bcfa');
    sacl.query();
    var skillCount = 0;
    while (sacl.next()) {
        skillCount++;
        var sr = new GlideRecord('sys_security_acl_role');
        sr.addQuery('sys_security_acl', sacl.getUniqueValue());
        sr.addQuery('sys_user_role.name', 'x_695068_bcfa.ai_agent');
        sr.query();
        if (!sr.hasNext()) skillAclFail++;
    }
    out.push('4 skill execute ACLs with ai_agent: ' + (skillCount - skillAclFail) + '/' + skillCount + (skillAclFail ? ' FAIL' : ' PASS'));
} catch (err) {
    out.push('ERROR ' + err);
    session.impersonate(me);
}
out.push('session user restored: ' + (gs.getUserID() === me));
gs.info('BCFA_P22 ' + out.join('\n'));
