"""Builds scripts/deploy/phase40_forms_bg.js: sectioned, two-column default
form layouts for the AP Invoice, Payment, Finance Document Intake and
Remittance forms (classic UI and the BCFA Workspace record pages), and the
field labels / hints missing on the instance (columns added by the Phase 35
and Phase 40 deploy loaders were created without sys_documentation).

The layout is applied the way Form Designer stores it: the untitled main
section (sys_ui_section, caption empty) plus captioned sections, ordered by a
sys_ui_form with sys_ui_form_section rows; two columns use the .split /
.end_split elements. Idempotent: each run rewrites the elements of these
sections. Labels are only inserted where none exists (existing labels are
never changed).

  npx now-sdk build
  python scripts/deliverables/extract_inventory.py
  python scripts/deploy/gen_form_layouts.py
Run phase40_forms_bg.js and phase40_labels_bg.js in Scripts - Background,
scope global.
"""
import io, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
INV = json.load(io.open(os.path.join(REPO, 'scripts', 'deliverables', 'build', 'inventory.json'), encoding='utf8'))
P = 'x_695068_bcfa_'

# section: (caption, left column, right column, full-width fields below)
LAYOUTS = {
    P + 'ap_invoice': [
        ('', ['invoice_number', 'vendor', 'purchase_order', 'invoice_date', 'currency'],
             ['state', 'journey_stage', 'journey_status', 'journey_owner', 'journey_open_exceptions'],
             ['journey_banner', 'journey_blocked_reason', 'journey_next_action']),
        ('Review Summary', [], [], ['review_summary']),
        ('Amounts', ['net_amount', 'tax_amount', 'charges_amount', 'discount_amount', 'gross_amount'], ['company_code', 'posting_date', 'amount_reconciliation', 'sales_order_reference', 'source'], ['amount_reconciliation_detail']),
        ('Document Extraction', ['extraction_provider', 'extraction_confidence'], ['document_country', 'document_language'], ['extraction_summary']),
        ('Tax as Printed on the Invoice', ['tax_type', 'tax_rate_pct', 'igst_amount', 'cgst_amount', 'sgst_amount'], ['vat_amount', 'wht_amount', 'wht_rate_pct'], []),
        ('Tax and Withholding Validation', ['tax_regime', 'expected_tax_amount', 'tax_variance_amount', 'tax_validation_result'],
             ['wht_applicable', 'wht_code', 'wht_expected_amount', 'wht_result'], ['tax_validation_detail', 'tax_rule_source']),
        ('Approval and SAP Posting', ['approval_state', 'posting_state'], ['sap_document_id'], []),
        ('Technical', ['correlation_id', 'duplicate_key', 'external_reference'], ['journey_stage_order', 'journey_stage_entered', 'journey_updated'], []),
    ],
    P + 'payment': [
        ('', ['bank_reference', 'customer', 'amount', 'currency', 'value_date'],
             ['state', 'journey_stage', 'journey_status', 'journey_owner', 'journey_open_exceptions'],
             ['journey_banner', 'journey_blocked_reason', 'journey_next_action']),
        ('Review Summary', [], [], ['review_summary']),
        ('Allocation', ['allocated_amount', 'deduction_amount', 'residual_amount'], ['posting_date', 'bank_account', 'source'], []),
        ('Payment Advice (as read)', [], [], ['advice_summary']),
        ('AI Recommendation (advisory)', [], [], ['ai_recommendation']),
        ('SAP Clearing', ['sap_processing_mode', 'sap_status'], ['sap_reference'], []),
        ('Technical', ['correlation_id', 'idempotency_key'], ['journey_stage_order', 'journey_stage_entered', 'journey_updated'], []),
    ],
    P + 'finance_intake': [
        ('', ['number', 'document_type', 'source', 'source_reference'], ['processing_status', 'requires_review', 'reviewed_by', 'reviewed_at'], ['processing_error']),
        ('Result', ['ap_invoice', 'payment', 'remittance'], ['extraction_provider', 'extraction_confidence', 'extraction_task'], []),
        ('Extracted Data', [], [], ['extraction_summary']),
        ('Technical', ['company_code', 'currency', 'correlation_id'], ['attachment_hash', 'duplicate_of', 'classification_confidence', 'classification_reason'], ['extraction_json']),
    ],
    P + 'remittance': [
        ('', ['payment', 'remittance_reference', 'bank_reference', 'payer_name', 'received_date'],
             ['payment_amount', 'currency', 'advice_deduction_amount', 'advice_deduction_reason', 'invoice_count'], []),
        ('Extraction', ['extraction_provider', 'source', 'confidence'], [], ['extracted_fields']),
    ],
}

# Field labels and hints from the build, for the labels the instance lacks.
fields = {t['name']: {f['name']: f for f in t['fields']} for t in INV['tables']}
labels = []
for t in INV['tables']:
    for f in t['fields']:
        labels.append([t['name'], f['name'], f['label'] or f['name'], f['hint'][:4000]])
# Every layout field must exist on its table.
for table, sections in LAYOUTS.items():
    for cap, left, right, below in sections:
        for f in left + right + below:
            assert f in fields[table], (table, f)

script = """// Generated by scripts/deploy/gen_form_layouts.py. Scope global (form layout records cannot be written from the app scope); every record is filed under the BCFA application.
// Sectioned default form layouts (AP Invoice, Payment, Finance Document Intake, Remittance) and missing field labels.
(function() {
    var LAYOUTS = %s;
    var LABELS = %s;
    var VIEW = 'Default view', APP = '229ba2b1a079431e104010f5ea883e85', out = [], writes = 0, failed = 0;
    function app(gr) { gr.setValue('sys_scope', APP); gr.setValue('sys_package', APP); }
    function ok(id) { if (id) writes++; else failed++; return id; }

    var added = 0;
    LABELS.forEach(function(l) {
        var d = new GlideRecord('sys_documentation');
        d.addQuery('name', l[0]);
        d.addQuery('element', l[1]);
        d.addQuery('language', 'en');
        d.query();
        if (d.hasNext()) return;
        d.initialize();
        d.setValue('name', l[0]);
        d.setValue('element', l[1]);
        d.setValue('language', 'en');
        d.setValue('label', l[2]);
        d.setValue('plural', l[2]);
        if (l[3]) d.setValue('hint', l[3]);
        if (d.insert()) added++;
    });
    out.push('labels added ' + added);

    function section(table, caption) {
        var s = new GlideRecord('sys_ui_section');
        s.addQuery('name', table);
        s.addQuery('view', VIEW);
        if (caption) s.addQuery('caption', caption); else s.addNullQuery('caption');
        s.query();
        if (s.next()) return s.getUniqueValue();
        s.initialize();
        s.setValue('name', table);
        s.setValue('view', VIEW);
        if (caption) s.setValue('caption', caption);
        app(s);
        return ok(s.insert());
    }
    function elements(sectionId, list) {
        var e = new GlideRecord('sys_ui_element');
        e.addQuery('sys_ui_section', sectionId);
        e.query();
        while (e.next()) e.deleteRecord();
        for (var i = 0; i < list.length; i++) {
            var n = new GlideRecord('sys_ui_element');
            n.initialize();
            n.setValue('sys_ui_section', sectionId);
            n.setValue('element', list[i]);
            n.setValue('position', i);
            if (list[i].charAt(0) === '.') n.setValue('type', list[i]);
            app(n);
            ok(n.insert());
        }
    }
    for (var table in LAYOUTS) {
        var form = new GlideRecord('sys_ui_form');
        form.addQuery('name', table);
        form.addQuery('view', VIEW);
        form.query();
        var formId = form.next() ? form.getUniqueValue() : (function() { form.initialize(); form.setValue('name', table); form.setValue('view', VIEW); app(form); return ok(form.insert()); })();
        var keep = {};
        LAYOUTS[table].forEach(function(sec, pos) {
            var id = section(table, sec[0]);
            var list = [];
            if (sec[1].length || sec[2].length) list = list.concat(['.begin_split'], sec[1], ['.split'], sec[2], ['.end_split']);
            list = list.concat(sec[3]);
            elements(id, list);
            keep[id] = true;
            var fs = new GlideRecord('sys_ui_form_section');
            fs.addQuery('sys_ui_form', formId);
            fs.addQuery('sys_ui_section', id);
            fs.query();
            if (fs.next()) { fs.setValue('position', pos); fs.update(); }
            else { fs.initialize(); fs.setValue('sys_ui_form', formId); fs.setValue('sys_ui_section', id); fs.setValue('position', pos); app(fs); ok(fs.insert()); }
        });
        out.push(table.replace('x_695068_bcfa_', '') + ': ' + LAYOUTS[table].length + ' sections');
    }
    gs.info('BCFA_FORMS ' + out.join(' | ') + ' | writes ' + writes + ', failed ' + failed);
})();
""" % (json.dumps({t: [list(s) for s in secs] for t, secs in LAYOUTS.items()}), json.dumps(labels, ensure_ascii=False))
# Labels: sys_documentation cannot be written from the app scope, so they get
# their own script, run in scope global, that files each label under the BCFA
# application (sys_scope / sys_package), as an install would.
labels_script = """// Generated by scripts/deploy/gen_form_layouts.py. Scope global.
// Inserts the BCFA field labels and hints missing on the instance, filed under the BCFA application. Never changes an existing label.
(function() {
    var APP = '229ba2b1a079431e104010f5ea883e85';
    var LABELS = %s;
    var added = 0, failed = 0;
    LABELS.forEach(function(l) {
        var d = new GlideRecord('sys_documentation');
        d.addQuery('name', l[0]);
        d.addQuery('element', l[1]);
        d.addQuery('language', 'en');
        d.query();
        if (d.hasNext()) return;
        d.initialize();
        d.setValue('name', l[0]);
        d.setValue('element', l[1]);
        d.setValue('language', 'en');
        d.setValue('label', l[2]);
        d.setValue('plural', l[2]);
        if (l[3]) d.setValue('hint', l[3]);
        d.setValue('sys_scope', APP);
        d.setValue('sys_package', APP);
        if (d.insert()) added++; else failed++;
    });
    gs.info('BCFA_LABELS added ' + added + ', failed ' + failed + ', of ' + LABELS.length + ' fields');
})();
""" % json.dumps(labels, ensure_ascii=False)
io.open(os.path.join(HERE, 'phase40_labels_bg.js'), 'w', encoding='utf8', newline='\n').write(labels_script)
dst = os.path.join(HERE, 'phase40_forms_bg.js')
io.open(dst, 'w', encoding='utf8', newline='\n').write(script)
print('written', dst, len(script), 'labels', len(labels))
