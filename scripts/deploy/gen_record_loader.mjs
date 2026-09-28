// Generates a global-scope background script that deploys selected records
// from the now-sdk build output (dist/app) with their build sys_ids:
//   - script includes by name (plus their sys_module record)
//   - any update/ files whose name matches --files <regex>
//   - choice sets from author_elective_update/ matching --choices <regex>
//   - new table columns (--columns table=col1,col2), inserted through
//     sys_dictionary with the build sys_id so the physical column is created
//     (update-XML loading skips the engine that creates columns)
//   - with --demo-users, the Phase 12 demo users and groups
//
// Usage (after `now-sdk build`):
//   node scripts/deploy/gen_record_loader.mjs <output.js> [--si A,B] [--files <regex>]
//        [--choices <regex>] [--columns table=c1,c2 ...] [--demo-users]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const updateDir = path.join(root, 'dist/app/update');
const choiceDir = path.join(root, 'dist/app/author_elective_update');

const argv = process.argv.slice(2);
const outFile = argv[0];
const opt = (name) => {
  const i = argv.indexOf(name);
  return i > 0 ? argv[i + 1] : null;
};
if (!outFile || outFile.startsWith('--')) {
  console.error('Usage: node scripts/deploy/gen_record_loader.mjs <output.js> [--si A,B] [--files <regex>] [--choices <regex>] [--columns table=c1,c2] [--demo-users]');
  process.exit(1);
}

const updates = readdirSync(updateDir);
const readUpdate = (f) => readFileSync(path.join(updateDir, f), 'utf8');
const sysIdOf = (xml) => (xml.match(/<sys_id>([0-9a-f]{32})<\/sys_id>/) || [])[1];

// Demo identities for the AP journey (Phase 12). Referenced by the
// x_695068_bcfa.ap.exception.* properties. No passwords are set: they are
// used through impersonation by an admin, or an admin sets a password.
const DEMO = {
  groups: [
    { sysId: '6c3107e75eeec3146f95ff49b9011def', name: 'BCFA AP Operations', description: 'Demo group: AP processors who own AP exceptions (POC).' },
    { sysId: 'e34ee8a159fd504893d4fc248a6632a7', name: 'BCFA Finance Approvers', description: 'Demo group: finance approvers for AP posting and overrides (POC).' },
    { sysId: 'a42557739c621c40c2570c9fa414cc46', name: 'BCFA Cash Application', description: 'Demo group: AR processors who own cash application exceptions (POC).' },
    { sysId: 'f1c12aaee7e9ac7e31fc871b0eca266b', name: 'BCFA Finance Controllers', description: 'Demo group: approves high-value invoices and overrides above 10% variance (POC decision table routing).' },
  ],
  users: [
    { sysId: '6fe2fbfa188d7aa5829b61d52b3202c9', userName: 'bcfa.ap.processor', first: 'BCFA Demo', last: 'AP Processor', role: 'x_695068_bcfa.ap_processor', group: '6c3107e75eeec3146f95ff49b9011def' },
    { sysId: 'd33f6290d7533660937e25a599602b2c', userName: 'bcfa.finance.approver', first: 'BCFA Demo', last: 'Finance Approver', role: 'x_695068_bcfa.finance_approver', group: 'e34ee8a159fd504893d4fc248a6632a7' },
    { sysId: 'a9f827de8d254b4150e07ac76dd9cef6', userName: 'bcfa.ar.processor', first: 'BCFA Demo', last: 'AR Processor', role: 'x_695068_bcfa.ar_processor', group: 'a42557739c621c40c2570c9fa414cc46' },
  ],
};
const demoPreamble = `
  var demo = ${JSON.stringify(DEMO)};
  demo.groups.forEach(function(g) {
    var grp = new GlideRecord('sys_user_group');
    var exists = grp.get(g.sysId);
    if (!exists) { grp.initialize(); grp.setNewGuidValue(g.sysId); }
    grp.setValue('name', g.name);
    grp.setValue('description', g.description);
    grp.setValue('active', true);
    exists ? grp.update() : grp.insert();
  });
  demo.users.forEach(function(u) {
    var user = new GlideRecord('sys_user');
    var exists = user.get(u.sysId);
    if (!exists) { user.initialize(); user.setNewGuidValue(u.sysId); }
    user.setValue('user_name', u.userName);
    user.setValue('first_name', u.first);
    user.setValue('last_name', u.last);
    user.setValue('active', true);
    exists ? user.update() : user.insert();
    var role = new GlideRecord('sys_user_role');
    if (!role.get('name', u.role)) { out.push('ROLE MISSING ' + u.role); return; }
    var grant = new GlideRecord('sys_user_has_role');
    grant.addQuery('user', u.sysId);
    grant.addQuery('role', role.getUniqueValue());
    grant.query();
    if (!grant.hasNext()) { grant.initialize(); grant.setValue('user', u.sysId); grant.setValue('role', role.getUniqueValue()); grant.insert(); }
    var member = new GlideRecord('sys_user_grmember');
    member.addQuery('user', u.sysId);
    member.addQuery('group', u.group);
    member.query();
    if (!member.hasNext()) { member.initialize(); member.setValue('user', u.sysId); member.setValue('group', u.group); member.insert(); }
  });
  out.push('demo users: ' + demo.users.map(function(u) {
    return u.userName + ' ' + u.role.split('.')[1] + '=' + gs.getUser().getUserByID(u.sysId).hasRole(u.role);
  }).join(', '));
`;

// 1. Script includes by name, plus the matching sys_module record.
const files = [];
for (const name of (opt('--si') || '').split(',').filter(Boolean)) {
  const si = updates.find((f) => f.startsWith('sys_script_include_') && readUpdate(f).includes(`<name>${name}</name>`));
  if (!si) throw new Error('Script include not found in build output: ' + name);
  files.push({ name: si, xml: readUpdate(si) });
  const mod = updates.find((f) => f.startsWith('sys_module_') && readUpdate(f).includes(`var ${name} = Class.create()`));
  if (mod) files.push({ name: mod, xml: readUpdate(mod) });
}

// 2. Other update files by file-name pattern.
if (opt('--files')) {
  const re = new RegExp(opt('--files'));
  for (const f of updates.filter((u) => re.test(u))) files.push({ name: f, xml: readUpdate(f) });
}

// 3. Choice sets.
if (opt('--choices')) {
  const re = new RegExp(opt('--choices'));
  for (const f of readdirSync(choiceDir).filter((c) => re.test(c))) {
    files.push({ name: f, xml: readFileSync(path.join(choiceDir, f), 'utf8') });
  }
}

// 4. New columns: dictionary field values from the build XML, plus the
// column label (sys_documentation) loaded afterwards with its build sys_id.
const columns = [];
const docs = [];
// --columns may be repeated, one table per occurrence.
const columnSpecs = argv.flatMap((a, i) => (a === '--columns' && argv[i + 1] ? [argv[i + 1]] : []));
for (const spec of columnSpecs) {
  const [table, list] = spec.split('=');
  for (const col of list.split(',')) {
    const dictFile = `sys_dictionary_${table}_${col}.xml`;
    const xml = readUpdate(dictFile);
    const body = xml.match(/<sys_dictionary [^>]*>([\s\S]*)<\/sys_dictionary>/)[1];
    const fields = {};
    for (const m of body.matchAll(/<([a-z_]+)(?: [^>]*)?>([^<]*)<\/\1>/g)) {
      if (!['sys_id', 'sys_update_name'].includes(m[1])) fields[m[1]] = m[2];
    }
    columns.push({ sysId: sysIdOf(xml), table, element: col, fields });
    const docFile = `sys_documentation_${table}_${col}_en.xml`;
    docs.push({ name: docFile, xml: readUpdate(docFile) });
  }
}

// --preamble <file>: extra global-scope JS run before loading (it can push
// report lines to `out`).
const preamble = opt('--preamble') ? readFileSync(path.resolve(root, opt('--preamble')), 'utf8') : '';

const script = `// BCFA deploy (Phase 12+): records from the now-sdk build output, upserted
// by build sys_id. Generated by scripts/deploy/gen_record_loader.mjs. Run in
// Scripts - Background with scope = global. Safe to re-run.
var files = ${JSON.stringify(files)};
var columns = ${JSON.stringify(columns)};
var docs = ${JSON.stringify(docs)};
var out = [];
if (gs.getCurrentScopeName() !== 'rhino.global') {
  gs.info('BCFA_DEPLOY ABORTED: run in scope "global", current scope is ' + gs.getCurrentScopeName());
} else {${argv.includes('--demo-users') ? demoPreamble : ''}${preamble}
  var gum = new GlideUpdateManager2();
  var added = 0, present = 0, colFailed = [];
  // Columns first, so choice sets and UI that reference them load cleanly.
  columns.forEach(function(c) {
    if (new GlideRecord(c.table).isValidField(c.element)) { present++; return; }
    var d = new GlideRecord('sys_dictionary');
    d.initialize();
    d.setNewGuidValue(c.sysId);
    for (var k in c.fields) d.setValue(k, c.fields[k]);
    d.setValue('sys_package', '229ba2b1a079431e104010f5ea883e85');
    d.insert();
    if (new GlideRecord(c.table).isValidField(c.element)) added++; else colFailed.push(c.element);
  });
  // Column labels with their build sys_ids; drop the duplicate label the
  // dictionary insert created.
  var docOk = 0;
  docs.forEach(function(f) {
    try { gum.loadXML(f.xml); docOk++; } catch (e) { out.push('FAILED ' + f.name + ': ' + e); }
    var id = (f.xml.match(/<sys_id>([0-9a-f]{32})<\\/sys_id>/) || [])[1];
    var el = (f.xml.match(/<element>([^<]*)<\\/element>/) || [])[1];
    var tbl = (f.xml.match(/<name>([^<]*)<\\/name>/) || [])[1];
    var extra = new GlideRecord('sys_documentation');
    extra.addQuery('name', tbl);
    extra.addQuery('element', el);
    extra.addQuery('language', 'en');
    extra.addQuery('sys_id', '!=', id);
    extra.query();
    while (extra.next()) extra.deleteRecord();
  });
  var ok = 0, failed = 0;
  files.forEach(function(f) {
    try { gum.loadXML(f.xml); ok++; }
    catch (e) { failed++; out.push('FAILED ' + f.name + ': ' + e); }
  });
  out.unshift('columns added=' + added + ' already present=' + present + (colFailed.length ? ' NOT CREATED: ' + colFailed.join(',') : '') +
    ' | labels=' + docOk + ' | records loaded=' + ok + ' failed=' + failed + ' of ' + files.length);
}
gs.info('BCFA_DEPLOY ' + out.join(' | '));
`;
writeFileSync(outFile, script);
const counts = [...files, ...docs].reduce((a, f) => {
  const k = f.name.replace(/_[0-9a-f]{32}\.xml$/, '').replace(/\.xml$/, '');
  a[k] = (a[k] || 0) + 1;
  return a;
}, {});
console.log('records', files.length, 'columns', columns.length, 'bytes', script.length);
console.log(counts);
