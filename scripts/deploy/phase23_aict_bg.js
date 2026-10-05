// Phase 23: govern the BCFA AI solution in AI Control Tower. Run in
// Scripts - Background with scope = global. Idempotent (safe to re-run).
//
// AI Control Tower (sn_ai_governance 5.x) and AI Discovery already inventoried
// the 2 agentic workflows, 7 agents (with their tools and prompts) and 9 Now
// Assist skills as AI digital assets, and linked workflow -> agent -> tool.
// This script completes the governance record:
//   1 ownership: business owner on every BCFA AI asset (the Finance
//     Controller demo identity stands in for Birla Carbon's process owner;
//     managed_by stays the builder / AI steward contact)
//   2 lifecycle: the 9 published skills are Deployed, not Development
//   3 the BCFA solution itself: one AI system asset, "BCFA Finance Automation
//     AI", with the workflows, skills and the planned Content Understanding
//     use case as subcomponents; each agent linked to the skill its tools call
//   4 the Content Understanding (Document Intelligence) use case, registered
//     as planned: not licensed on this instance, simulated extraction in use
//   5 an AI asset approval request for the solution, so the AI steward review
//     (risk classification, approval for deployment) runs through AI Control
//     Tower's own workflow; the proposed risk and its rationale are attached
//   6 report: inventory, ownership, links, governance, usage
var out = [];
var OWNER_USER = 'bcfa.finance.controller';
var SOLUTION = 'BCFA Finance Automation AI';
var PLANNED_DI = 'BCFA Document Extraction (Content Understanding, planned)';
var AGENT_SKILL = {
    'BCFA AP Exception Analysis Agent': 'bcfaApMatchExceptionExplanation',
    'BCFA AP Resolution Recommendation Agent': 'bcfaApRecommendedNextAction',
    'BCFA AP Communication Agent': 'bcfaApClarificationDraft',
    'BCFA Cash Match Recommendation Agent': 'bcfaArMatchExplanation',
    'BCFA Deduction Analysis Agent': 'bcfaArResidualExplanation',
    'BCFA Cash Application Communication Agent': 'bcfaCustomerClarificationDraft'
};
var WORKFLOWS = ['BCFA AP Invoice Review', 'BCFA Cash Application Review'];
var SKILLS = ['bcfaApInvoiceSummary', 'bcfaApMatchExceptionExplanation', 'bcfaApRecommendedNextAction', 'bcfaApClarificationDraft',
    'bcfaCashApplicationSummary', 'bcfaArMatchExplanation', 'bcfaArResidualExplanation', 'bcfaArRecommendedNextAction', 'bcfaCustomerClarificationDraft'];
var DEPLOYED = '31';
var DEVELOPMENT = '33';

function asset(name) {
    var a = new GlideRecord('alm_ai_digital_asset');
    a.addQuery('display_name', name);
    a.query();
    return a.next() ? a : null;
}
function ensureSystem(name, description, installStatus, owner, steward, justification) {
    var existing = asset(name);
    if (existing) return existing.getUniqueValue();
    var model = new GlideRecord('cmdb_ai_system_component_product_model');
    model.addQuery('name', name);
    model.query();
    if (!model.next()) {
        model.initialize();
        model.setValue('name', name);
        model.setValue('description', description);
        model.setValue('cmdb_model_category', '5383f164ffec2a10c0fbffffffffff82');
        if (installStatus === DEPLOYED) model.setValue('status', 'In Production');
        model.insert();
    }
    var a = new GlideRecord('alm_ai_system_digital_asset');
    a.initialize();
    a.setValue('model', model.getUniqueValue());
    a.setValue('model_category', '5383f164ffec2a10c0fbffffffffff82');
    a.setValue('display_name', name);
    a.setValue('install_status', installStatus);
    a.setValue('owned_by', owner);
    a.setValue('managed_by', steward);
    a.setValue('justification', justification);
    return a.insert();
}
function link(systemId, componentId) {
    var m = new GlideRecord('sn_ent_ai_system_subcomponent_m2m');
    m.addQuery('ai_system', systemId);
    m.addQuery('ai_subcomponent', componentId);
    m.query();
    if (m.hasNext()) return false;
    m.initialize();
    m.setValue('ai_system', systemId);
    m.setValue('ai_subcomponent_reference_table', 'alm_ai_system_digital_asset');
    m.setValue('ai_subcomponent', componentId);
    m.setValue('execution_mode', 'Autonomous');
    m.insert();
    return true;
}

try {
    var owner = new GlideRecord('sys_user');
    if (!owner.get('user_name', OWNER_USER)) throw 'Owner user ' + OWNER_USER + ' not found';
    var ownerId = owner.getUniqueValue();

    // 1 + 2 ownership and skill lifecycle
    var owned = 0, deployed = 0, total = 0;
    var steward = '';
    var all = new GlideRecord('alm_ai_digital_asset');
    all.addQuery('display_name', 'STARTSWITH', 'BCFA ').addOrCondition('display_name', 'STARTSWITH', 'bcfa');
    all.query();
    while (all.next()) {
        total++;
        if (!steward && all.getValue('managed_by')) steward = all.getValue('managed_by');
        var changed = false;
        if (!all.getValue('owned_by')) { all.setValue('owned_by', ownerId); owned++; changed = true; }
        if (SKILLS.indexOf(all.getValue('display_name')) >= 0 && all.getValue('install_status') === DEVELOPMENT) {
            all.setValue('install_status', DEPLOYED);
            deployed++;
            changed = true;
        }
        if (changed) all.update();
    }
    steward = steward || gs.getUserID();
    out.push('1-2 BCFA AI assets: ' + total + '; owner set on ' + owned + '; skills moved Development -> Deployed: ' + deployed);

    // 3 + 4 solution and planned Content Understanding use case
    var solutionId = ensureSystem(SOLUTION,
        'Birla Carbon Finance Automation: native ServiceNow AI (Now Assist skills, AI agents and agentic workflows) that explains, summarizes and recommends on AP invoice and AR cash application exceptions. Advisory only: it never approves, overrides a tolerance, posts invoices or clears payments; a person decides. Guardrails: Now Assist Guardian and FinanceAiGuard. Identity: x_695068_bcfa.ai_agent (least privilege). Every run is logged in the BCFA AI Interaction Log.',
        DEPLOYED, ownerId, steward,
        'Reduces manual exception analysis in AP and AR. Human-in-the-loop on every financial decision (segregation of duties enforced by ApprovalEngine). Proposed risk classification: Medium (financial process; advisory only; no autonomous financial action; guardrails and full audit trail).');
    var plannedId = ensureSystem(PLANNED_DI,
        'Planned use of ServiceNow Content Understanding (Document Intelligence) to extract AP invoice and AR remittance fields from uploaded documents. Not licensed on this instance: the POC uses deterministic simulated extraction (fixture values), logged in the AI Interaction Log with provider "Simulated".',
        DEVELOPMENT, ownerId, steward,
        'License gap: Document Intelligence / Content Understanding is not licensed on this instance. When licensed, extracted fields feed the same validation, matching and human review.');
    var links = 0;
    WORKFLOWS.forEach(function(w) { var a = asset(w); if (a && link(solutionId, a.getUniqueValue())) links++; });
    SKILLS.forEach(function(s) { var a = asset(s); if (a && link(solutionId, a.getUniqueValue())) links++; });
    if (link(solutionId, plannedId)) links++;
    var agentLinks = 0;
    for (var agentName in AGENT_SKILL) {
        var ag = asset(agentName);
        var sk = asset(AGENT_SKILL[agentName]);
        if (ag && sk && link(ag.getUniqueValue(), sk.getUniqueValue())) agentLinks++;
    }
    out.push('3-4 solution asset ' + SOLUTION + ' (' + solutionId + '); planned asset ' + PLANNED_DI + ' (' + plannedId + '); new solution links ' + links + '; new agent -> skill links ' + agentLinks);

    // 5 governance: details + approval request for the solution
    var gov = new GlideRecord('sn_ai_governance_asset_governance_details');
    gov.addQuery('asset', solutionId);
    gov.query();
    if (!gov.next()) {
        gov.initialize();
        gov.setValue('asset', solutionId);
        gov.setValue('lifecycle_phase', '6774e00cff4c2650799bffffffffff88');   // New
        gov.setValue('risk_score', '5');                                          // To be determined
        gov.insert();
    }
    var request = new GlideRecord('sn_ai_governance_assessment_request');
    request.addQuery('asset', gov.getUniqueValue());
    request.addActiveQuery();
    request.query();
    if (!request.next()) {
        request.initialize();
        request.setValue('asset', gov.getUniqueValue());
        request.setValue('type', '1');
        request.setValue('short_description', 'Approve ' + SOLUTION + ' for deployment (proposed risk: Medium)');
        request.setValue('description', 'AI solution: ' + SOLUTION + ' (2 agentic workflows, 7 AI agents, 9 Now Assist skills; Content Understanding use case planned, not licensed).\n\n' +
            'Proposed risk classification: Medium. Rationale: finance process (AP posting, AR clearing) but AI is advisory only; approvals, postings and clearing are deterministic and human-approved with segregation of duties; AI identities hold only x_695068_bcfa.ai_agent (read + advisory note); Now Assist Guardian and FinanceAiGuard on every skill call; every AI run in the AI Interaction Log and every business event in the append-only Audit Event trail.\n\n' +
            'Evidence: docs/AI_SECURITY_AND_GUARDRAILS.md, docs/AI_EXECUTION_LOG.md, docs/AUDIT_FRAMEWORK.md, docs/APPROVALS_SOD.md.');
        request.insert();
        out.push('5 approval request ' + request.getValue('number') + ' created for AI steward review');
    } else {
        out.push('5 approval request ' + request.getValue('number') + ' already open (state ' + request.getDisplayValue('state') + ')');
    }

    // 6 report
    var rows = [];
    var rep = new GlideRecord('alm_ai_digital_asset');
    rep.addQuery('display_name', 'STARTSWITH', 'BCFA ').addOrCondition('display_name', 'STARTSWITH', 'bcfa');
    rep.addQuery('sys_class_name', 'alm_ai_system_digital_asset');
    rep.orderBy('display_name');
    rep.query();
    while (rep.next()) {
        var g = new GlideRecord('sn_ai_governance_asset_governance_details');
        g.addQuery('asset', rep.getUniqueValue());
        g.query();
        g.next();
        var subs = new GlideAggregate('sn_ent_ai_system_subcomponent_m2m');
        subs.addQuery('ai_system', rep.getUniqueValue());
        subs.addAggregate('COUNT');
        subs.query();
        rows.push('    ' + rep.getValue('display_name') + ' | ' + rep.getDisplayValue('install_status') + ' | owner ' + rep.getDisplayValue('owned_by') +
            ' | steward ' + rep.getDisplayValue('managed_by') + ' | subcomponents ' + (subs.next() ? subs.getAggregate('COUNT') : 0) +
            ' | lifecycle ' + (g.isValidRecord() ? g.getDisplayValue('lifecycle_phase') : '-') + ' | risk ' + (g.isValidRecord() ? g.getDisplayValue('risk_score') : '-'));
    }
    out.push('6 AI systems in AI Control Tower (' + rows.length + '):\n' + rows.join('\n'));
    var prompts = new GlideAggregate('alm_ai_prompt_digital_asset');
    prompts.addQuery('display_name', 'STARTSWITH', 'BCFA ');
    prompts.addAggregate('COUNT');
    prompts.query();
    out.push('6 prompt assets (agent instructions / roles): ' + (prompts.next() ? prompts.getAggregate('COUNT') : 0));
    var usage = new GlideRecord('sn_ai_governance_ai_inventory_usage');
    usage.orderByDesc('accrual_date');
    usage.setLimit(6);
    usage.query();
    var u = [];
    while (usage.next()) u.push(usage.getValue('accrual_date') + ' ' + usage.getValue('type') + ' inventory=' + usage.getValue('inventory_count') + ' licensable=' + usage.getValue('licensable_count'));
    out.push('6 AI inventory usage (latest): ' + (u.length ? u.join(' | ') : 'none recorded yet'));
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_P23 ' + out.join('\n'));
