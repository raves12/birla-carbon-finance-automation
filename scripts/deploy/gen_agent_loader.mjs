// Generates a global-scope background script that loads BCFA AI records from
// the now-sdk build output (dist/app) through GlideUpdateManager2.loadXML(),
// the same loader update sets use, so every record keeps its build sys_id.
//
// Loads: every AI agent and its tools, tool links, configs, versions and
// access-role configurations; each agent's execute ACL and ACL role rows;
// and the given script includes (with their module records).
//
// Also loads agentic workflows (use case, team, members, config override,
// triggers) and, with --ai-user, first creates the dedicated BCFA AI user
// that the workflows run as.
//
// Usage (after `now-sdk build`):
//   node scripts/deploy/gen_agent_loader.mjs <output.js> [--ai-user] [ScriptIncludeName ...]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'dist/app/update');
const args = process.argv.slice(2);
const withAiUser = args.includes('--ai-user');
const [outFile, ...includeNames] = args.filter((a) => a !== '--ai-user');
if (!outFile) {
  console.error('Usage: node scripts/deploy/gen_agent_loader.mjs <output.js> [--ai-user] [ScriptIncludeName ...]');
  process.exit(1);
}

// The dedicated AI user the BCFA agentic workflows run as (runAs /
// trigger runAsUser in src/fluent/ai-agents/*_workflow.now.ts). It holds only
// the processor roles: it can read and record advisory notes, never approve.
const AI_USER = {
  sysId: 'b8efbc9ef2654167b89add3507667685',
  userName: 'bcfa.ai.reviewer',
  roles: ['x_695068_bcfa.ap_processor', 'x_695068_bcfa.ar_processor'],
};
const aiUserPreamble = `
  // Dedicated AI user (identity_type=ai_agent) the BCFA workflows run as.
  var aiUser = new GlideRecord('sys_user');
  var aiUserExists = aiUser.get('${AI_USER.sysId}');
  if (!aiUserExists) { aiUser.initialize(); aiUser.setNewGuidValue('${AI_USER.sysId}'); }
  aiUser.setValue('user_name', '${AI_USER.userName}');
  aiUser.setValue('first_name', 'BCFA AI');
  aiUser.setValue('last_name', 'Reviewer');
  aiUser.setValue('identity_type', 'ai_agent');
  aiUser.setValue('active', true);
  aiUserExists ? aiUser.update() : aiUser.insert();
  ${JSON.stringify(AI_USER.roles)}.forEach(function(roleName) {
    var role = new GlideRecord('sys_user_role');
    if (!role.get('name', roleName)) { out.push('ROLE MISSING ' + roleName); return; }
    var grant = new GlideRecord('sys_user_has_role');
    grant.addQuery('user', '${AI_USER.sysId}');
    grant.addQuery('role', role.getUniqueValue());
    grant.query();
    if (!grant.hasNext()) {
      grant.initialize();
      grant.setValue('user', '${AI_USER.sysId}');
      grant.setValue('role', role.getUniqueValue());
      grant.insert();
    }
  });
  var aiCheck = new GlideRecord('sys_user');
  aiCheck.get('${AI_USER.sysId}');
  out.push('ai user ' + aiCheck.getValue('user_name') + ' identity_type=' + aiCheck.getValue('identity_type') +
    ' ap_processor=' + gs.getUser().getUserByID('${AI_USER.sysId}').hasRole('x_695068_bcfa.ap_processor'));
`;

const all = readdirSync(dir);
const read = (f) => readFileSync(path.join(dir, f), 'utf8');
const sysIdOf = (xml) => (xml.match(/<sys_id>([0-9a-f]{32})<\/sys_id>/) || [])[1];

// Agent and workflow execute ACLs are named global.x_695068_bcfa.<name>.
const agentAcls = all.filter((f) => /^sys_security_acl_[0-9a-f]{32}\.xml$/.test(f) && /<name>global\.x_695068_bcfa\.BCFA /.test(read(f)));
const aclIds = agentAcls.map((f) => sysIdOf(read(f)));
const aclRoles = all.filter((f) => f.startsWith('sys_security_acl_role_') && aclIds.some((id) => read(f).includes(id)));

// Script includes by name, plus the matching module record (same script body).
const includes = [];
for (const name of includeNames) {
  const si = all.find((f) => f.startsWith('sys_script_include_') && read(f).includes(`<name>${name}</name>`));
  if (!si) throw new Error('Script include not found in build output: ' + name);
  includes.push(si);
  const mod = all.find((f) => f.startsWith('sys_module_') && read(f).includes(`var ${name} = Class.create()`));
  if (mod) includes.push(mod);
}

const byPrefix = (p, exclude = []) => all.filter((f) => f.startsWith(p) && !exclude.some((e) => f.startsWith(e)));
const picked = [
  ...includes,
  ...agentAcls,
  ...aclRoles,
  ...byPrefix('sn_aia_tool_'),
  ...byPrefix('sn_aia_agent_', ['sn_aia_agent_config_', 'sn_aia_agent_tool_m2m_']),
  ...byPrefix('sn_aia_agent_config_'),
  ...byPrefix('sn_aia_version_'),
  ...byPrefix('sn_aia_agent_tool_m2m_'),
  ...byPrefix('sys_agent_access_role_configuration_'),
  ...byPrefix('sn_aia_usecase_', ['sn_aia_usecase_config_override_']),
  ...byPrefix('sn_aia_usecase_config_override_'),
  ...byPrefix('sn_aia_team_', ['sn_aia_team_member_']),
  ...byPrefix('sn_aia_team_member_'),
  ...byPrefix('sn_aia_trigger_configuration_'),
  ...byPrefix('sn_aia_trigger_agent_usecase_m2m_'),
];

const files = picked.map((f) => ({ name: f.replace('.xml', ''), xml: read(f) }));
const script = `// BCFA AI deploy: loads AI agents, tools, configs, versions, access-role
// configurations, agent ACLs and script includes from the now-sdk build output.
// Generated by scripts/deploy/gen_agent_loader.mjs. Run in Scripts - Background
// with scope = global. Re-running is safe (records are upserted by sys_id).
var files = ${JSON.stringify(files)};
var out = [];
if (gs.getCurrentScopeName() !== 'rhino.global') {
  gs.info('BCFA_DEPLOY ABORTED: run in scope "global", current scope is ' + gs.getCurrentScopeName());
} else {${withAiUser ? aiUserPreamble : ''}
  var gum = new GlideUpdateManager2();
  var ok = 0, failed = 0;
  files.forEach(function(f) {
    try { gum.loadXML(f.xml); ok++; }
    catch (e) { failed++; out.push('FAILED ' + f.name + ': ' + e); }
  });
  var agent = new GlideRecord('sn_aia_agent');
  agent.addEncodedQuery('nameSTARTSWITHBCFA ');
  agent.orderBy('name');
  agent.query();
  var agents = [];
  while (agent.next()) agents.push(agent.getValue('name') + (agent.getValue('sys_scope') === '229ba2b1a079431e104010f5ea883e85' ? '' : ' (WRONG SCOPE ' + agent.getValue('sys_scope') + ')'));
  // loadXML skips business rules, so a loaded trigger never gets the Flow
  // Designer flow that actually fires it, and its trigger-to-workflow link is
  // generated inactive ("Trying to execute a disabled trigger"). Activate both
  // here, as AI Agent Studio does when a trigger is switched on in its UI:
  // toggling active through a normal update runs the business rule that
  // generates the flow.
  var trigger = new GlideRecord('sn_aia_trigger_configuration');
  trigger.addEncodedQuery('nameSTARTSWITHBCFA ^active=true');
  trigger.query();
  while (trigger.next()) {
    if (!trigger.getValue('trigger_flow')) {
      trigger.setValue('active', false);
      trigger.update();
      trigger.setValue('active', true);
      trigger.update();
    }
    var link = new GlideRecord('sn_aia_trigger_agent_usecase_m2m');
    link.addQuery('trigger_configuration', trigger.getUniqueValue());
    link.addQuery('active', false);
    link.query();
    while (link.next()) {
      link.setValue('active', true);
      link.update();
    }
    out.push('trigger ' + trigger.getValue('name') + (trigger.getValue('trigger_flow') ? ' active with flow' : ' HAS NO FLOW'));
  }
  var usecase = new GlideRecord('sn_aia_usecase');
  usecase.addEncodedQuery('nameSTARTSWITHBCFA ');
  usecase.query();
  var workflows = [];
  while (usecase.next()) workflows.push(usecase.getValue('name'));
  out.unshift('loaded=' + ok + ' failed=' + failed + ' of ' + files.length + ' | ' + agents.length + ' agents: ' + agents.join('; ') +
    ' | ' + workflows.length + ' workflows: ' + workflows.join('; '));
}
gs.info('BCFA_DEPLOY ' + out.join(' | '));
`;
writeFileSync(outFile, script);
const counts = picked.reduce((a, f) => {
  const k = f.replace(/_[0-9a-f]{32}\.xml$/, '');
  a[k] = (a[k] || 0) + 1;
  return a;
}, {});
console.log('files', files.length, 'bytes', script.length);
console.log(counts);
