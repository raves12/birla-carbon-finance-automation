"""Builds build/inventory.json for the technical design document from the
now-sdk build (dist/app; run npx now-sdk build first) and the server scripts.
Read-only."""
import glob, io, json, os, re
import xml.etree.ElementTree as ET

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
APP = os.path.join(REPO, 'dist', 'app')
UPD = os.path.join(APP, 'update')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build', 'inventory.json')
os.makedirs(os.path.dirname(OUT), exist_ok=True)


def rec(path, tag):
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError:
        return None
    el = root.find('.//' + tag)
    if el is None or el.get('action') == 'DELETE':
        return None
    return el


def txt(el, name):
    c = el.find(name)
    return (c.text or '').strip() if c is not None and c.text else ''


def disp(el, name):
    c = el.find(name)
    if c is None:
        return ''
    return (c.get('display_value') or c.text or '').strip()


inv = {}

# Tables and fields
docs = {}
for f in glob.glob(os.path.join(UPD, 'sys_documentation_*.xml')):
    el = rec(f, 'sys_documentation')
    if el is not None:
        docs[(txt(el, 'name'), txt(el, 'element'))] = {'label': txt(el, 'label'), 'hint': txt(el, 'hint')}
tables = []
for f in sorted(glob.glob(os.path.join(APP, 'dictionary', '*.xml'))):
    root = ET.parse(f).getroot()
    t = root.find('element')
    fields = []
    for e in t.findall('element'):
        n = e.get('name')
        d = docs.get((t.get('name'), n), {})
        fields.append({'name': n, 'type': e.get('type'), 'label': e.get('label') or d.get('label', ''), 'max_length': e.get('max_length') or '',
                       'mandatory': e.get('mandatory') == 'true', 'read_only': e.get('read_only') == 'true', 'reference': e.get('reference') or '',
                       'default': e.get('default') or '', 'hint': d.get('hint', '')})
    tables.append({'name': t.get('name'), 'label': t.get('label'), 'display': t.get('display') or '', 'audit': t.get('audit'), 'fields': fields})
inv['tables'] = tables

# Choices
choices = {}
for f in glob.glob(os.path.join(APP, 'author_elective_update', 'sys_choice_*.xml')):
    root = ET.parse(f).getroot()
    for s in root.iter('sys_choice_set'):
        if s.get('action') == 'DELETE':
            continue
    for c in root.iter('sys_choice'):
        if c.get('action') == 'DELETE':
            continue
        key = txt(c, 'name') + '.' + txt(c, 'element')
        choices.setdefault(key, []).append({'value': txt(c, 'value'), 'label': txt(c, 'label'), 'seq': int(txt(c, 'sequence') or 0)})
for k in choices:
    choices[k].sort(key=lambda x: x['seq'])
inv['choices'] = choices

# Script includes (descriptions from the build, methods from the source)
sis = []
for f in glob.glob(os.path.join(UPD, 'sys_script_include_*.xml')):
    el = rec(f, 'sys_script_include')
    if el is None:
        continue
    name = txt(el, 'name')
    src = os.path.join(REPO, 'src', 'server', 'script-includes', name + '.server.js')
    methods = []
    header = ''
    if os.path.exists(src):
        lines = io.open(src, encoding='utf8').read().split('\n')
        hdr = []
        for ln in lines:
            if ln.startswith('//'):
                hdr.append(ln[2:].strip())
            elif hdr:
                break
        header = ' '.join(hdr)
        for i, ln in enumerate(lines):
            m = re.match(r'^    ([A-Za-z_]\w*): function\s*\(([^)]*)\)', ln) or re.match(r'^(\w+\.[A-Za-z_]\w*) = function\s*\(([^)]*)\)', ln)
            if not m:
                continue
            cm = []
            j = i - 1
            while j >= 0 and lines[j].strip().startswith('//'):
                cm.insert(0, lines[j].strip()[2:].strip())
                j -= 1
            methods.append({'name': m.group(1), 'args': m.group(2).strip(), 'comment': ' '.join(cm), 'line': i + 1})
        loc = len(lines)
    else:
        loc = 0
    sis.append({'name': name, 'api_name': txt(el, 'api_name'), 'description': txt(el, 'description'), 'header': header, 'methods': methods, 'loc': loc})
sis.sort(key=lambda s: s['name'])
inv['script_includes'] = sis

# Properties
props = []
for f in glob.glob(os.path.join(UPD, 'sys_properties_*.xml')):
    el = rec(f, 'sys_properties')
    if el is not None:
        props.append({'name': txt(el, 'name'), 'value': txt(el, 'value'), 'type': txt(el, 'type'), 'description': txt(el, 'description')})
props.sort(key=lambda p: p['name'])
inv['properties'] = props

# Roles
roles = []
role_by_id = {}
for f in glob.glob(os.path.join(UPD, 'sys_user_role_*.xml')):
    if 'contains' in f:
        continue
    el = rec(f, 'sys_user_role')
    if el is not None:
        roles.append({'name': txt(el, 'name'), 'description': txt(el, 'description')})
        role_by_id[txt(el, 'sys_id')] = txt(el, 'name')
contains = []
for f in glob.glob(os.path.join(UPD, 'sys_user_role_contains_*.xml')):
    el = rec(f, 'sys_user_role_contains')
    if el is not None:
        r, c = el.find('role'), el.find('contains')
        contains.append({'role': (r.get('display_value') or role_by_id.get(r.text, r.text)), 'contains': (c.get('display_value') or role_by_id.get(c.text, c.text))})
roles.sort(key=lambda r: r['name'])
inv['roles'] = roles
inv['role_contains'] = contains

# ACLs
acl_roles = {}
for f in glob.glob(os.path.join(UPD, 'sys_security_acl_role_*.xml')) + glob.glob(os.path.join(APP, 'author_elective_update', 'sys_security_acl_role_*.xml')):
    el = rec(f, 'sys_security_acl_role')
    if el is None:
        continue
    a = el.find('sys_security_acl')
    r = el.find('sys_user_role')
    acl_roles.setdefault(a.text, []).append(r.get('display_value') or role_by_id.get(r.text, r.text))
acls = []
for f in glob.glob(os.path.join(UPD, 'sys_security_acl_*.xml')):
    if '_role_' in f:
        continue
    el = rec(f, 'sys_security_acl')
    if el is None:
        continue
    acls.append({'name': txt(el, 'name'), 'operation': disp(el, 'operation'), 'type': txt(el, 'type'), 'description': txt(el, 'description'),
                 'condition': txt(el, 'condition'), 'scripted': txt(el, 'advanced') == 'true', 'roles': sorted(set(acl_roles.get(txt(el, 'sys_id'), [])))})
acls.sort(key=lambda a: (a['name'], a['operation']))
inv['acls'] = acls

# UI actions
uia_roles = {}
for f in glob.glob(os.path.join(UPD, 'sys_ui_action_role_*.xml')) + glob.glob(os.path.join(APP, 'author_elective_update', 'sys_ui_action_role_*.xml')):
    el = rec(f, 'sys_ui_action_role')
    if el is None:
        continue
    a = el.find('sys_ui_action')
    r = el.find('sys_user_role')
    uia_roles.setdefault(a.text, []).append(r.get('display_value') or role_by_id.get(r.text, r.text))
uias = []
for f in glob.glob(os.path.join(UPD, 'sys_ui_action_*.xml')):
    if '_role_' in f:
        continue
    el = rec(f, 'sys_ui_action')
    if el is None:
        continue
    uias.append({'name': txt(el, 'name'), 'table': txt(el, 'table'), 'action_name': txt(el, 'action_name'), 'condition': txt(el, 'condition'),
                 'hint': txt(el, 'hint'), 'comments': txt(el, 'comments'), 'roles': sorted(set(uia_roles.get(txt(el, 'sys_id'), []))),
                 'script': txt(el, 'script')[:1500]})
uias.sort(key=lambda u: (u['table'], u['name']))
inv['ui_actions'] = uias

# Business rules
brs = []
for f in glob.glob(os.path.join(UPD, 'sys_script_*.xml')):
    if 'sys_script_include' in f:
        continue
    el = rec(f, 'sys_script')
    if el is None:
        continue
    ops = [o for o in ('insert', 'update', 'delete', 'query') if txt(el, 'action_' + o) == 'true']
    brs.append({'name': txt(el, 'name'), 'table': txt(el, 'collection'), 'when': txt(el, 'when'), 'ops': ops, 'order': txt(el, 'order'),
                'condition': txt(el, 'condition') or txt(el, 'filter_condition'), 'description': txt(el, 'description'), 'active': txt(el, 'active')})
brs.sort(key=lambda b: (b['table'], b['name']))
inv['business_rules'] = brs

# Flows (names, descriptions, trigger type)
flows = []
for f in glob.glob(os.path.join(UPD, 'sys_hub_flow_*.xml')):
    root = ET.parse(f).getroot()
    fl = root.find('.//sys_hub_flow')
    if fl is None:
        continue
    trig = root.find('.//sys_hub_trigger_instance_v2')
    flows.append({'name': txt(fl, 'name'), 'description': txt(fl, 'description'), 'run_as': txt(fl, 'run_as'),
                  'trigger': txt(trig, 'trigger_type') if trig is not None else ''})
flows.sort(key=lambda x: x['name'])
inv['flows'] = flows

# Scheduled jobs
jobs = []
for f in glob.glob(os.path.join(UPD, 'sysauto_script_*.xml')):
    el = rec(f, 'sysauto_script')
    if el is None:
        continue
    jobs.append({'name': txt(el, 'name'), 'run_type': txt(el, 'run_type'), 'period': txt(el, 'run_period'), 'active': txt(el, 'active')})
jobs.sort(key=lambda j: j['name'])
inv['jobs'] = jobs

# State models
states = {}
models = {}
for f in glob.glob(os.path.join(UPD, 'sttrm_model_*.xml')):
    el = rec(f, 'sttrm_model')
    if el is not None:
        models[txt(el, 'sys_id')] = {'name': txt(el, 'name'), 'table': txt(el, 'table'), 'states': [], 'transitions': []}
for f in glob.glob(os.path.join(UPD, 'sttrm_state_*.xml')):
    if 'transition' in f:
        continue
    el = rec(f, 'sttrm_state')
    if el is None:
        continue
    states[txt(el, 'sys_id')] = {'name': txt(el, 'state_value'), 'label': txt(el, 'state_label'), 'seq': int(txt(el, 'state_sequence') or 0),
                                 'initial': txt(el, 'initial_state') == 'true', 'model': txt(el, 'sttrm_model')}
    m = models.get(states[txt(el, 'sys_id')]['model'])
    if m:
        m['states'].append(states[txt(el, 'sys_id')])
for f in glob.glob(os.path.join(UPD, 'sttrm_state_transition_*.xml')):
    el = rec(f, 'sttrm_state_transition')
    if el is None:
        continue
    fr, to = states.get(txt(el, 'from_state'), {}), states.get(txt(el, 'to_state'), {})
    m = models.get(fr.get('model'))
    if m:
        m['transitions'].append({'name': txt(el, 'name'), 'from': fr.get('name'), 'to': to.get('name')})
for m in models.values():
    m['states'].sort(key=lambda x: x['seq'])
    m['transitions'].sort(key=lambda t: (t['from'] or '', t['to'] or ''))
inv['state_models'] = list(models.values())

# ATF tests with their assertion names
steps = {}
for f in glob.glob(os.path.join(UPD, 'sys_atf_step_*.xml')):
    raw = io.open(f, encoding='utf8').read()
    m = re.search(r'<test[^>]*>([0-9a-f]{32})</test>', raw)
    if not m:
        continue
    names = re.findall(r"name: '([^']{3,200})'", raw)
    steps.setdefault(m.group(1), []).extend(names)
tests = []
for f in glob.glob(os.path.join(UPD, 'sys_atf_test_*.xml')):
    if 'suite' in f:
        continue
    el = rec(f, 'sys_atf_test')
    if el is None:
        continue
    tests.append({'name': txt(el, 'name'), 'description': txt(el, 'description'), 'active': txt(el, 'active'), 'assertions': steps.get(txt(el, 'sys_id'), [])})
tests.sort(key=lambda t: t['name'])
inv['atf_tests'] = tests

# AI agents, tools, use cases
agents = []
for f in glob.glob(os.path.join(UPD, 'sn_aia_agent_*.xml')):
    if 'agent_tool' in f or 'agent_config' in f:
        continue
    el = rec(f, 'sn_aia_agent')
    if el is not None:
        agents.append({'name': txt(el, 'name'), 'role': txt(el, 'role'), 'description': txt(el, 'description')})
tools = []
for f in glob.glob(os.path.join(UPD, 'sn_aia_tool_*.xml')):
    el = rec(f, 'sn_aia_tool')
    if el is not None:
        tools.append({'name': txt(el, 'name'), 'type': txt(el, 'type'), 'description': txt(el, 'description')})
ucs = []
for f in glob.glob(os.path.join(UPD, 'sn_aia_usecase_*.xml')):
    if 'config_override' in f:
        continue
    el = rec(f, 'sn_aia_usecase')
    if el is not None:
        ucs.append({'name': txt(el, 'name'), 'description': txt(el, 'description')})
inv['ai_agents'] = sorted(agents, key=lambda a: a['name'])
inv['ai_tools'] = sorted(tools, key=lambda a: a['name'])
inv['ai_usecases'] = ucs

# Events, notifications, navigation modules
inv['events'] = sorted({txt(rec(f, 'sysevent_register'), 'event_name') for f in glob.glob(os.path.join(UPD, 'sysevent_register_*.xml')) if rec(f, 'sysevent_register') is not None})
mods = []
for f in glob.glob(os.path.join(UPD, 'sys_app_module_*.xml')):
    el = rec(f, 'sys_app_module')
    if el is not None:
        mods.append({'title': txt(el, 'title'), 'table': txt(el, 'name'), 'filter': txt(el, 'filter'), 'order': int(txt(el, 'order') or 0)})
inv['modules'] = sorted(mods, key=lambda m: m['order'])

io.open(OUT, 'w', encoding='utf8').write(json.dumps(inv, indent=1, ensure_ascii=False))
for k, v in inv.items():
    print(k, len(v))
