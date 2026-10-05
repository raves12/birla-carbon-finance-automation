// Phase 25 (after loading): the BCFA flows go live.
//  1. Children the build no longer has are removed from each flow (the two
//     Phase 12 aging flows keep their sys_ids; their old log-only steps go).
//  2. Each flow is published (sn_fd.FlowAPI.publish, the call the platform
//     itself uses), under the BCFA application.
//  3. The script action is saved once with business rules on, so the event
//     processor picks it up.
//  4. The Phase 16 sweep job (now inactive, superseded by the aging flows)
//     is toggled so its scheduler trigger is removed.
// Generated from the build output by the Phase 25 postamble generator.
(function phase25Flows() {
    var APP = '229ba2b1a079431e104010f5ea883e85';
    var FLOWS = {
        "01952b8915ac4bc1a271bc04f52621a0": {
            "name": "BCFA AR Exception Flow",
            "children": [
                "995ec44307704d21aaf7d764846fbce4",
                "1e4dc4ef423848d793dac4a680be627e",
                "b98b56c67570495dbf9a317f87f6687e"
            ]
        },
        "0b50bcc273bc4529ba9edc08e1d00f6d": {
            "name": "BCFA AR Match Flow",
            "children": [
                "a8117af8a9af44d99dc439d9579c1ce8",
                "a5c4221c16194c1fba2dd919b970cfa8",
                "c35f973010434997b64b2c945be5d1f3"
            ]
        },
        "2ef9ef484cf444f9b3b7b1094338ddec": {
            "name": "BCFA AR Reconciliation Flow",
            "children": [
                "4f881c91463b4ab0b44b872a9300e4cf",
                "389c12fff50147c0bb8cb5523bff2f6b",
                "7892dc11e17a417281cc05f73eb2fd33"
            ]
        },
        "51d1b610be2c4d66bbc973076e0aeebb": {
            "name": "BCFA AP Integration Flow",
            "children": [
                "eaa24e30ee574028b8170111a5a66d98",
                "3e50367101b24980bfc6f9a7e6ed5630",
                "2fc8a14194af4ab1b86fcb204137195f"
            ]
        },
        "52e0960df5c74ea0b2a919c1b76393f7": {
            "name": "BCFA AP Exception Flow",
            "children": [
                "f5d7bd36f0b641b7a50fa3a00f01a932",
                "a2026259023049a285561d3b6c9fd1e9",
                "e63a32bc38b44f25a85c57978d14da07"
            ]
        },
        "7cd373fc414b4655b377a47ff1945844": {
            "name": "BCFA AP Reconciliation Flow",
            "children": [
                "121bfcbd174943b2a73ab5ead9cb6de5",
                "e2932591b6ed43aea69dc5f155bfef90",
                "91730e19ea84443cb881cb555f98dc67"
            ]
        },
        "8769e860868b4d1da62856fa0f7e0f76": {
            "name": "BCFA AP Aging/Escalation Flow",
            "children": [
                "162e5f0885e14dd3a9d2edf237f23366",
                "5cf78cd16a1144fda3b28ea0785fe9c0",
                "71fd676df1dd4cf1be0deb4d70eb6031",
                "26949729f2944b2e94823fda31863355",
                "0cca1ec2e8594aa5b64adb9fcf33583a"
            ]
        },
        "90107bde15394521b47048b7af67162d": {
            "name": "BCFA AR Payment Intake Flow",
            "children": [
                "7bef0632ee844a459060785982986d9a",
                "a8992dadc1e740d6a9625e3c4aceef62",
                "291293a55f4940c1b0ba626dbaec3be6"
            ]
        },
        "b7908b93b5a84e428371dd5febd33db6": {
            "name": "BCFA AR Remittance Processing Flow",
            "children": [
                "4824a82aa6eb4b2f8090fa0bce677fbf",
                "e12483df36234c5f889fe2fb6f9c7e1b",
                "5ddd6246d3404818851814fc1aca44fa"
            ]
        },
        "ba06914e94b548979dcaf5ccfeaf1d35": {
            "name": "BCFA AR Clearing Flow",
            "children": [
                "25fd926850fb4953aa2f95403fec9475",
                "fe34a1901cb1448b9a4cc041475f47d3",
                "4bb8e1bd02284dac90fed1e68d00713a"
            ]
        },
        "ba50cc23ef894ee7a317396f3de70b0c": {
            "name": "BCFA AR Aging/Escalation Flow",
            "children": [
                "61a8c68a36b7403c85db70ecf6d18788",
                "149602ef578047878b14aa593001f4db",
                "ae1c1a50880847cba21dfe08c5ec5143",
                "bd73e793912f4cdfae243b49bffdbfeb",
                "0038ab76fdf64d93aed873fed77f324c"
            ]
        },
        "c54d412b2c6245c0909e60268da78dc9": {
            "name": "BCFA AR Approval Flow",
            "children": [
                "61a88d3e0b0d4d95b62910629e270301",
                "325cb9ca8f604cbe890018b53be94d13",
                "bf20abfc2e21427db7bade96bb0ef554"
            ]
        },
        "d70f8cf1dae84920a48eb7dc2862da5f": {
            "name": "BCFA AP Approval Flow",
            "children": [
                "dfc7b2a27ec848c4b5db30732170474b",
                "e6f8db8983d74a449e1fabd8be1002f7",
                "eabcc20ec21045f08607439ead5092a3"
            ]
        },
        "dc895c4f65c345a0b498a67189bd691f": {
            "name": "BCFA AP Validation Flow",
            "children": [
                "76c260f05dcb42d6b8d12a87a4343fc7",
                "417791869257458ba3e73741e63486c4",
                "5816b614d11541e6823c375996544e71"
            ]
        },
        "fe60b524116245bfa303276c7df23813": {
            "name": "BCFA AP Invoice Intake Flow",
            "children": [
                "429e8163e9e9475dbcb6e13114e0020f",
                "01f8077f23604698bcd84231cc64302a",
                "181ac6754f5d48648d773dd186c0362f"
            ]
        }
    };
    var CHILD_TABLES = ['sys_hub_action_instance_v2', 'sys_hub_flow_logic_instance_v2', 'sys_hub_trigger_instance_v2'];
    var previousApp = gs.getCurrentApplicationId();
    var removed = 0, published = 0, report = [];
    gs.setCurrentApplicationId(APP);
    try {
        for (var id in FLOWS) {
            var keep = FLOWS[id].children.join(',');
            CHILD_TABLES.forEach(function(t) {
                var child = new GlideRecord(t);
                child.addQuery('flow', id);
                child.addQuery('sys_id', 'NOT IN', keep);
                child.query();
                while (child.next()) { child.deleteRecord(); removed++; }
            });
            var error = '';
            try { sn_fd.FlowAPI.publish(id); } catch (e) { error = String(e); }
            var flow = new GlideRecord('sys_hub_flow');
            flow.get(id);
            var ok = flow.getValue('status') === 'published' && flow.getValue('active') === '1';
            if (ok) published++;
            else report.push(FLOWS[id].name + ' NOT PUBLISHED (status=' + flow.getValue('status') + ' active=' + flow.getValue('active') + (error ? ' error=' + error : '') + ')');
        }
    } finally {
        gs.setCurrentApplicationId(previousApp);
    }
    out.push('PHASE25 flows published=' + published + ' of ' + Object.keys(FLOWS).length + ' | stale flow steps removed=' + removed + (report.length ? ' | ' + report.join(' | ') : ''));

    var action = new GlideRecord('sysevent_script_action');
    if (action.get('ac2b06e0b4bb49b4872190d1dbd13e07')) {
        action.setForceUpdate(true);
        action.update();
        out.push('script action "' + action.getValue('name') + '" active=' + action.getValue('active') + ' event=' + action.getValue('event_name'));
    } else out.push('script action NOT FOUND');

    var job = new GlideRecord('sysauto_script');
    if (job.get('4e6d10932d304e6a99110d1e8866341b')) {
        job.setValue('active', true);
        job.update();
        job.setValue('active', false);
        job.update();
        var trig = new GlideRecord('sys_trigger');
        trig.addQuery('document_key', job.getUniqueValue());
        trig.query();
        out.push('Phase 16 sweep job active=' + job.getValue('active') + ', scheduler trigger ' + (trig.hasNext() ? 'STILL PRESENT' : 'removed'));
    } else out.push('sweep job NOT FOUND');
})();
