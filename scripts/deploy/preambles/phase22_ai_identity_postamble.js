// Phase 22 (runs after the records load): least privilege for AI.
//  1 bcfa.ai.reviewer (the agentic workflows' run-as AI user) holds only
//    x_695068_bcfa.ai_agent (+ snc_internal); its processor roles go.
//  2 the agent and workflow execute ACLs lose admin and finance_approver
//    (the rebuilt role lists add ai_agent; stale role rows are removed here).
//  3 the 9 Now Assist skill configs (instance records) accept the AI role:
//    added to their role masks and gen_ai_skill execute ACLs.
(function aiLeastPrivilege() {
    var AI_ROLE = '3820b778bac540099d293cef1520a777';
    var AI_USER = 'b8efbc9ef2654167b89add3507667685';
    var REMOVE_FROM_AI_USER = ['bf505b5092574a7fa59a01048550571a', '588d615a5fea475bbe3422f50e91c218'];  // ap_processor, ar_processor
    var NOT_FOR_AGENTS = ['4411dd9103de4bdbb5468924b1e5459f', 'e1abbc605ba34cbfb77c584ea689c1b2'];     // x_695068_bcfa.admin, finance_approver
    var AGENT_ACLS = ['2895fd078be441a3967cb2e4e920a98b', '3db09a3171c44718a9796e8ace5d83a1', '4e792e3f193d4045a9116bc35f083513',
        '6f14b5e030454e698a31342c91718ee8', '723e753574cb41b0a1342e95b84030ca', '94885bdcac5b41028ddda6af46dbdc5f',
        'c09072c3a2e34a60be3f433e20c58766', 'c35780c44ec443bdaed8ef885daf99a7', 'ddc8714aa5f844578bcc2b309059210c'];
    var SKILL_ACLS = ['2e5623c63bef03104035a50864e45a83', '4160f81aebab4310311dff0dcad0cd7a', '6b25e8daeb2b4310311dff0dcad0cdaf',
        '849e64d2ebab4310311dff0dcad0cdef', 'baafe496ebab4310311dff0dcad0cdc2', 'c417e812eb6b4310311dff0dcad0cd58',
        'cc926056eb2b4310311dff0dcad0cd52', 'd62130daebab4310311dff0dcad0cdc7', 'dc651f4a3b2f03104035a50864e45ae8'];
    var SKILL_CONFIGS = ['54651f4a3b2f03104035a50864e45ac5', '625623c63bef03104035a50864e45a64', '08926056eb2b4310311dff0dcad0cd17',
        'a325e8daeb2b4310311dff0dcad0cd9f', '4c17e812eb6b4310311dff0dcad0cd09', 'cc9e64d2ebab4310311dff0dcad0cdaa',
        'e2afe496ebab4310311dff0dcad0cdb2', 'b860f81aebab4310311dff0dcad0cd69', '4a2130daebab4310311dff0dcad0cdaa'];
    var report = [];

    // 1 the AI user
    var has = new GlideRecord('sys_user_has_role');
    has.addQuery('user', AI_USER);
    has.addQuery('role', AI_ROLE);
    has.query();
    if (!has.hasNext()) {
        var grant = new GlideRecord('sys_user_has_role');
        grant.initialize();
        grant.setValue('user', AI_USER);
        grant.setValue('role', AI_ROLE);
        grant.insert();
        report.push('AI user granted ai_agent');
    }
    var removed = 0;
    var old = new GlideRecord('sys_user_has_role');
    old.addQuery('user', AI_USER);
    old.addQuery('role', 'IN', REMOVE_FROM_AI_USER.join(','));
    old.addQuery('inherited', false);
    old.query();
    while (old.next()) { old.deleteRecord(); removed++; }
    report.push('AI user processor grants removed=' + removed);

    // 2 agent / workflow execute ACLs
    var stale = new GlideRecord('sys_security_acl_role');
    stale.addQuery('sys_security_acl', 'IN', AGENT_ACLS.join(','));
    stale.addQuery('sys_user_role', 'IN', NOT_FOR_AGENTS.join(','));
    stale.query();
    var staleCount = 0;
    while (stale.next()) { stale.deleteRecord(); staleCount++; }
    var aiOnAgents = 0;
    AGENT_ACLS.forEach(function(acl) {
        var r = new GlideRecord('sys_security_acl_role');
        r.addQuery('sys_security_acl', acl);
        r.addQuery('sys_user_role', AI_ROLE);
        r.query();
        if (!r.hasNext()) {
            r.initialize();
            r.setValue('sys_security_acl', acl);
            r.setValue('sys_user_role', AI_ROLE);
            r.insert();
        }
        aiOnAgents++;
    });
    report.push('agent/workflow ACLs: admin/approver rows removed=' + staleCount + ', ai_agent on ' + aiOnAgents);

    // 3 skill configs: mask and execute ACL
    var masks = 0;
    var mask = new GlideRecord('sys_agent_access_role_configuration');
    mask.addQuery('agent', 'IN', SKILL_CONFIGS.join(','));
    mask.query();
    while (mask.next()) {
        var list = (mask.getValue('role_list') || '').split(',').filter(function(x) { return x; });
        if (list.indexOf(AI_ROLE) < 0) {
            list.push(AI_ROLE);
            mask.setValue('role_list', list.join(','));
            mask.update();
        }
        masks++;
    }
    var skillAcls = 0;
    SKILL_ACLS.forEach(function(acl) {
        var r = new GlideRecord('sys_security_acl_role');
        r.addQuery('sys_security_acl', acl);
        r.addQuery('sys_user_role', AI_ROLE);
        r.query();
        if (!r.hasNext()) {
            r.initialize();
            r.setValue('sys_security_acl', acl);
            r.setValue('sys_user_role', AI_ROLE);
            r.insert();
        }
        skillAcls++;
    });
    report.push('skill masks with ai_agent=' + masks + ', skill ACLs with ai_agent=' + skillAcls);

    // resulting AI user roles
    var roles = [];
    var now = new GlideRecord('sys_user_has_role');
    now.addQuery('user', AI_USER);
    now.query();
    while (now.next()) roles.push(now.getDisplayValue('role') + (now.getValue('inherited') === '1' ? ' (inherited)' : ''));
    report.push('AI user roles now: ' + roles.join(', '));
    out.push('PHASE22 ' + report.join(' | '));
})();
