"""Phase 35 deploy: journey columns, SAP Draft/Direct, FinanceJourneyService,
both Playbooks, journey refresh rules, workspace route, PB-* tests. Wraps the
generated record loader in a drift guard: the modified script includes must
be live == the Phase 34 commit (or already == build).
Usage (after npx now-sdk build): python scripts/deploy/gen_phase35_deploy.py
writes scripts/deploy/phase35_playbook_deploy_bg.js."""
import io, subprocess, json, os, tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SCR = tempfile.gettempdir()
BASE = '49cabd9'  # last commit deployed to the instance (Phase 34)
MOD = ['FinancePolicy', 'ArDomainService', 'AuditEngine', 'MockSAPAdapter', 'IntegrationService', 'FinanceReviewSummary', 'DemoDataSeeder']
JOURNEY = 'journey_stage,journey_stage_order,journey_status,journey_blocked_reason,journey_next_action,journey_owner,journey_open_exceptions,journey_banner,journey_stage_entered,journey_updated'


def h(t):
    a = 7
    for ch in t:
        a = (a * 31 + ord(ch)) % 2147483647
    return a


guard = []
for n in MOD:
    rel = 'src/server/script-includes/' + n + '.server.js'
    head = subprocess.run(['git', 'show', BASE + ':' + rel], cwd=REPO, capture_output=True, check=True).stdout.decode('utf8').replace('\r\n', '\n')
    work = io.open(os.path.join(REPO, rel), encoding='utf8').read().replace('\r\n', '\n')
    guard.append({'api': 'x_695068_bcfa.' + n, 'head': h(head), 'work': h(work)})

files_re = ('^(sttrm_state_ed8955e899e5434088c36103137c5d82|sttrm_state_transition_(14fdee5dfd67473d91f4a45c59405e32|4bfe48a0b32d41b698adc37789151e36|ec905e1cc8334a448b3d57217de0b08c)'
            '|sys_properties_(9dfe1bbcc99e4820a9242058bd4c4f8d|ddb81580bbb94fa8987dd23a299753ed)|sys_ui_action_0b5ff23440a64633a87e2848365ddb9f'
            '|sysauto_script_48946e075fd34e8a898238cbb26f6600|sys_pd_process_definition_'
            '|sys_ux_screen_type_04f8f25684ed46e1a9510a818402c894|sys_ux_app_route_31661743d90841229eb787e61bab30e9|sys_ux_screen_7a02070068ea46cdbc0c130fafcdd314'
            '|sys_ui_action_(23289d58a0c149ed9747d43281b92741|c373c45104914ca199850c25154acf90)'
            '|sys_script_(193bca89839141659d3639cfcd45da4c|a8aa19cc28a14175869732decdd1cd2d|ba88701eeb814799a1d41e7dd563c04f|c42378ba9dca455ea449e5aaee42209d)')
UPD = os.path.join(REPO, 'dist', 'app', 'update')
acts = ['0b5ff23440a64633a87e2848365ddb9f', '23289d58a0c149ed9747d43281b92741', 'c373c45104914ca199850c25154acf90']
roles = [f[:-4] for f in os.listdir(UPD) if f.startswith('sys_ui_action_role_') and any('>' + a + '<' in io.open(os.path.join(UPD, f), encoding='utf8').read() for a in acts)]
files_re = files_re + '|' + '|'.join(roles) + ')'
# PB-* ATF tests (test + steps), the Playbook suite, and the suite links
# (BCFA Regression and BCFA Playbook Regression) for those tests.
keys = io.open(os.path.join(REPO, 'src', 'fluent', 'generated', 'keys.ts'), encoding='utf8').read()
import re
pb = re.findall(r"'test-pb-[a-z]{2}-[0-9]{3}':\s*\{\s*table: 'sys_atf_test'\s*id: '([0-9a-f]{32})'", keys)
assert len(pb) == 22, len(pb)
atf = []
for f in os.listdir(UPD):
    if not f.startswith('sys_atf_'):
        continue
    x = io.open(os.path.join(UPD, f), encoding='utf8').read()
    if f.startswith('sys_atf_test_suite_test_') and any(t in x for t in pb):
        atf.append(f[:-4])
    elif f.startswith('sys_atf_test_suite_3979b8d46f5a40789cabbbeabfc5e71f'):
        atf.append(f[:-4])
    elif (f.startswith('sys_atf_test_') or f.startswith('sys_atf_step_')) and not f.startswith('sys_atf_test_suite') and any(t in x for t in pb):
        atf.append(f[:-4])
print('atf files', len(atf))
files_re = files_re[:-1] + '|' + '|'.join(atf) + ')'
post = os.path.join(REPO, 'scripts', 'deploy', 'preambles', 'phase35_postamble.js')
io.open(post, 'w', encoding='utf8').write("""
  var chk = [];
  ['journey_stage_order', 'journey_blocked_reason'].forEach(function(c) { chk.push('ap.' + c + '=' + new GlideRecord('x_695068_bcfa_ap_invoice').isValidField(c)); });
  ['sap_processing_mode', 'sap_status', 'residual_amount', 'journey_stage_order'].forEach(function(c) { chk.push('pay.' + c + '=' + new GlideRecord('x_695068_bcfa_payment').isValidField(c)); });
  var pd = new GlideRecord('sys_pd_process_definition');
  pd.addQuery('sys_id', 'IN', '74ce2044163b43e7bbaa53a0cb012d42,e01d2325600b49c5a0165460897cd11d');
  pd.query();
  while (pd.next()) {
    var ln = new GlideAggregate('sys_pd_lane'); ln.addQuery('process_definition', pd.getUniqueValue()); ln.addAggregate('COUNT'); ln.query(); ln.next();
    var ac = new GlideAggregate('sys_pd_activity'); ac.addQuery('process_definition', pd.getUniqueValue()); ac.addAggregate('COUNT'); ac.query(); ac.next();
    chk.push(pd.getValue('label') + ' status=' + pd.getValue('status') + ' lanes=' + ln.getAggregate('COUNT') + ' activities=' + ac.getAggregate('COUNT'));
  }
  var rt = new GlideRecord('sys_ux_app_route'); chk.push('playbook route=' + rt.get('31661743d90841229eb787e61bab30e9'));
  out.push('verify: ' + chk.join(', '));
""")
tmp = os.path.join(SCR, 'p35_loader_raw.js')
subprocess.run(['node', 'scripts/deploy/gen_record_loader.mjs', tmp,
                '--si', 'FinanceJourneyService,' + ','.join(MOD),
                '--files', files_re,
                '--choices', '^sys_choice_x_695068_bcfa_(ap_invoice|payment)_(journey_stage|journey_status|sap_processing_mode|sap_status)\\.xml$',
                '--columns', 'x_695068_bcfa_ap_invoice=' + JOURNEY,
                '--columns', 'x_695068_bcfa_payment=allocated_amount,deduction_amount,residual_amount,sap_processing_mode,sap_status,sap_reference,' + JOURNEY,
                '--postamble', post], cwd=REPO, check=True)
loader = io.open(tmp, encoding='utf8').read()
script = ("// Phase 35 (Playbook): journey fields, AR SAP Draft/Direct, FinanceJourneyService and the two\n"
          "// native BCFA Playbooks. Generated by the Phase 35 deploy generator from the now-sdk build.\n"
          "// Run in scope global. Aborts unless each modified script include is live == the Phase 34 source\n"
          "// (or already == this build). Safe to re-run.\n"
          "(function() {\n"
          "function h(t) { var a = 7; for (var i = 0; i < t.length; i++) a = (a * 31 + t.charCodeAt(i)) % 2147483647; return a; }\n"
          "var G = " + json.dumps(guard) + ", drift = [];\n"
          "G.forEach(function(g) { var si = new GlideRecord('sys_script_include'); si.addQuery('api_name', g.api); si.query();\n"
          "  if (!si.next()) { drift.push(g.api + ' missing'); return; }\n"
          "  var v = h(si.getValue('script').replace(/\\r\\n/g, '\\n')); if (v !== g.head && v !== g.work) drift.push(g.api); });\n"
          "if (drift.length) { gs.info('BCFA_DEPLOY ABORTED live script includes differ from the Phase 34 source: ' + drift.join(', ')); return; }\n"
          + loader + "\n})();\n")
dst = os.path.join(REPO, 'scripts', 'deploy', 'phase35_playbook_deploy_bg.js')
io.open(dst, 'w', encoding='utf8', newline='\n').write(script)
print('written', len(script), 'hash', h(script), 'len16', len(script.encode('utf-16-le')) // 2)
