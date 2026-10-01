"""Converts the deployed BCFA Playbooks from the Fluent schema-3 start rules to
the schema the Yokohama Process Automation Designer reads.

Fluent (SDK 4.12) writes schema 3: lane/activity `start_rule_name` strings and
`starts_after_lanes` lists. Yokohama has no such fields: it reads
  sys_pd_lane.start_rule      -> sys_pd_lane_start_rule_definition
                                 (immediate | after_lanes ...), with the
                                 predecessor lanes in the start-rule variable
                                 "Lanes" (sys_variable_value)
  sys_pd_activity.start_rule  -> sys_pd_activity_start_rule_definition
and existing playbooks on the instance are schema 2.
Usage (after npx now-sdk build): python scripts/deploy/gen_playbook_yokohama_fix.py
writes scripts/deploy/phase35_playbook_yokohama_fix_bg.js (run in scope global).
"""
import io, json, os, re

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
UPD = os.path.join(REPO, 'dist', 'app', 'update')
PLAYBOOKS = ['74ce2044163b43e7bbaa53a0cb012d42', 'e01d2325600b49c5a0165460897cd11d']

lanes, acts = [], []
for pb in PLAYBOOKS:
    s = io.open(os.path.join(UPD, 'sys_pd_process_definition_%s.xml' % pb), encoding='utf8').read()
    for m in re.finditer(r'<sys_pd_lane action="INSERT_OR_UPDATE"[^>]*>(.*?)</sys_pd_lane>', s, re.S):
        b = m.group(1)
        g = lambda k: (re.search(r'<%s>([^<]*)</%s>' % (k, k), b) or [None, ''])[1]
        lanes.append({'id': g('sys_id'), 'rule': g('start_rule_name'), 'after': g('starts_after_lanes')})
    for m in re.finditer(r'<sys_pd_activity action="INSERT_OR_UPDATE"[^>]*>(.*?)</sys_pd_activity>', s, re.S):
        b = m.group(1)
        g = lambda k: (re.search(r'<%s>([^<]*)</%s>' % (k, k), b) or [None, ''])[1]
        acts.append({'id': g('sys_id'), 'rule': g('start_rule_name'), 'after': g('starts_after_activities')})

assert all(a['rule'] == 'immediate' for a in acts), 'only immediate activity start rules are converted'
assert all(l['rule'] in ('immediate', 'after_items') for l in lanes)

script = """// Phase 35: converts the BCFA Playbooks' start rules to the Yokohama schema
// (see scripts/deploy/gen_playbook_yokohama_fix.py). Run in scope global
// after phase35_playbook_deploy_bg.js. Safe to re-run.
(function() {
var PB = %s, LANES = %s, ACTS = %s;
var LANE_RULE = { immediate: 'b823830967fc41ddb84959d97897b1ae', after_lanes: '7407ca1ac3e02110f1f504186e40dd50' };
var ACT_IMMEDIATE = 'ef8ab8c0a3f04bceb117263f51401070', LANES_VAR = '9a070e1ac3e02110f1f504186e40ddd2';
var out = { lanes: 0, vars: 0, acts: 0, pd: 0 };
LANES.forEach(function(l) {
    var g = new GlideRecord('sys_pd_lane'); if (!g.get(l.id)) return;
    g.setValue('start_rule', l.rule === 'immediate' ? LANE_RULE.immediate : LANE_RULE.after_lanes);
    g.setWorkflow(false); g.update(); out.lanes++;
    var v = new GlideRecord('sys_variable_value'); v.addQuery('document', 'sys_pd_lane'); v.addQuery('document_key', l.id); v.addQuery('variable', LANES_VAR); v.query();
    if (l.rule === 'immediate') { while (v.next()) v.deleteRecord(); return; }
    if (!v.next()) { v.initialize(); v.setValue('document', 'sys_pd_lane'); v.setValue('document_key', l.id); v.setValue('variable', LANES_VAR); v.setValue('order', 100); }
    v.setValue('value', l.after); v.setValue('sys_scope', '229ba2b1a079431e104010f5ea883e85');
    v.isNewRecord() ? v.insert() : v.update(); out.vars++;
});
ACTS.forEach(function(a) {
    var g = new GlideRecord('sys_pd_activity'); if (!g.get(a.id)) return;
    g.setValue('start_rule', ACT_IMMEDIATE); g.setWorkflow(false); g.update(); out.acts++;
});
PB.forEach(function(id) {
    var p = new GlideRecord('sys_pd_process_definition'); if (!p.get(id)) return;
    p.setValue('schema_version', 2); p.setWorkflow(false); p.update(); out.pd++;
});
gs.info('BCFA_PBFIX ' + JSON.stringify(out));
})();
""" % (json.dumps(PLAYBOOKS), json.dumps(lanes), json.dumps(acts))
dst = os.path.join(REPO, 'scripts', 'deploy', 'phase35_playbook_yokohama_fix_bg.js')
io.open(dst, 'w', encoding='utf8', newline='\n').write(script)
print('lanes', len(lanes), 'activities', len(acts), 'bytes', len(script))
