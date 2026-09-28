// Phase 24 (after loading): puts the read-only Review Summary at the top of
// the AP Invoice and Payment forms (Default view; the workspace record pages
// use the same layout). Idempotent.
(function reviewSummaryOnForms() {
    var SECTIONS = { '49ac48c783db83103d769be0deaad3f9': 'AP Invoice', '6721c4db839b07103d769be0deaad35b': 'Payment' };
    var report = [];
    for (var section in SECTIONS) {
        var has = new GlideRecord('sys_ui_element');
        has.addQuery('sys_ui_section', section);
        has.addQuery('element', 'review_summary');
        has.query();
        if (has.hasNext()) { report.push(SECTIONS[section] + ' already has it'); continue; }
        var shift = new GlideRecord('sys_ui_element');
        shift.addQuery('sys_ui_section', section);
        shift.query();
        while (shift.next()) {
            shift.setValue('position', parseInt(shift.getValue('position') || '0', 10) + 1);
            shift.update();
        }
        var el = new GlideRecord('sys_ui_element');
        el.initialize();
        el.setValue('sys_ui_section', section);
        el.setValue('element', 'review_summary');
        el.setValue('position', 0);
        el.insert();
        report.push(SECTIONS[section] + ' form: Review Summary added at the top');
    }
    out.push('PHASE24 ' + report.join(' | '));
})();

// The KPI refresh job: loading its update XML skips the business rule that
// creates its trigger, so toggle it once to create the trigger.
(function kpiJobTrigger() {
    var job = new GlideRecord('sysauto_script');
    if (!job.get('e06fcfa703f046698cf31d3a7aeb209e')) { out.push('KPI job not found'); return; }
    job.setValue('active', false);
    job.update();
    job.setValue('active', true);
    job.update();
    var trig = new GlideRecord('sys_trigger');
    trig.addQuery('document_key', job.getUniqueValue());
    trig.query();
    out.push('KPI refresh job trigger ' + (trig.next() ? 'scheduled, next run ' + trig.getValue('next_action') : 'NOT created'));
})();
