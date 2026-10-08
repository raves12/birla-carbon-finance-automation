// Readable text for the read-only blocks reviewers read on the forms: the
// review summary (FinanceReviewSummary) and the advisory AI notes
// (ai_recommendation / ai_explanation, formatted by the "Format AI note"
// business rules). Presentation only: no business logic reads the result
// except the two section parsers below, whose input stays compatible.
//
// AI notes keep their section headings as "HEADING:" on their own line with
// the section text directly below it and a blank line between sections:
// AiInteractionLog.recommendationOf and ExceptionEngine.splitAdvice read a
// section from its heading up to the first blank line.
var FinanceTextFormat = Class.create();

// Top-level sections of the AI notes (agents, Now Assist skills, AI
// simulation). A line holding only one of these, followed by ":", is a
// section heading.
FinanceTextFormat.SECTION = /^[\s\-*]*(analysis|explanation|recommendation|recommended next action|recommended allocation|residual classification|open questions|note|notes|human decision[^:]*|customer resolution[^:]*|draft (?:vendor|customer)[^:]*)\s*:\s*$/i;
// Records a 32-character id in AI text can stand for, with the field that
// names them for a person.
FinanceTextFormat.RECORDS = [
    ['x_695068_bcfa_ap_invoice', 'invoice_number', 'AP invoice'],
    ['x_695068_bcfa_payment', 'bank_reference', 'payment'],
    ['x_695068_bcfa_ap_exception', 'number', 'AP exception'],
    ['x_695068_bcfa_ar_exception', 'number', 'AR exception'],
    ['x_695068_bcfa_purchase_order', 'po_number', 'PO'],
    ['x_695068_bcfa_ar_open_item', 'item_number', 'open item'],
    ['x_695068_bcfa_finance_intake', 'number', 'intake'],
];
FinanceTextFormat.RULE = '────────────────────';

FinanceTextFormat.prototype = {
    initialize: function() {
        this._names = {};
    },

    // ---- AI notes -----------------------------------------------------------

    // Idempotent: formatting a formatted note returns it unchanged.
    aiNote: function(text) {
        if (!text) return text;
        var lines = this.recordNames(String(text)).replace(/\r\n?/g, '\n').split('\n');
        var out = [], lastSection = '';
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/\s+$/, '');
            if (i === 0 && /^AI (REVIEW|MATCH EXPLANATION)\b/i.test(line)) {
                out.push(line);
                out.push(FinanceTextFormat.RULE);
                if (lines[i + 1] === FinanceTextFormat.RULE) i++;
                continue;
            }
            if (line === FinanceTextFormat.RULE) {
                if (out.length && out[out.length - 1] !== '' && out[out.length - 1] !== FinanceTextFormat.RULE) out.push('');
                if (out[out.length - 1] !== FinanceTextFormat.RULE) out.push(line);
                continue;
            }
            var m = FinanceTextFormat.SECTION.exec(line);
            if (m) {
                var section = m[1].toUpperCase();
                // "Recommended next action:" directly followed by the model's
                // own "recommendation:" heading: one heading is enough.
                if (/^RECOMMENDATION$/.test(section) && /^RECOMMEND/.test(lastSection) && out[out.length - 1] === lastSection + ':') continue;
                while (out.length && out[out.length - 1] === '') out.pop();
                if (/^DRAFT/.test(section)) {
                    if (out[out.length - 1] !== FinanceTextFormat.RULE) {
                        if (out.length) out.push('');
                        out.push(FinanceTextFormat.RULE);
                    }
                } else if (out.length && out[out.length - 1] !== FinanceTextFormat.RULE) {
                    out.push('');
                }
                out.push(section + ':');
                lastSection = section;
                continue;
            }
            // Bullets: "- x" / "* x" -> "• x"; indented ones -> "◦ x".
            var b = /^(\s*)[-*•◦]\s+(.*)$/.exec(line);
            if (b) line = (b[1].length >= 2 ? '    ◦ ' : '• ') + b[2];
            // Lower-case sub-headings written by the model ("open questions:").
            line = line.replace(/^([a-z])([a-z ]{2,40}:)$/, function(all, first, rest) { return first.toUpperCase() + rest; });
            if (line === '' && (out.length === 0 || out[out.length - 1] === '' || out[out.length - 1] === FinanceTextFormat.RULE)) continue;
            out.push(line);
        }
        while (out.length && out[out.length - 1] === '') out.pop();
        return out.join('\n');
    },

    // Replaces record ids in free text with the record's number, so the
    // reader sees "AP Invoice TEST-RK-001", not an id.
    recordNames: function(text) {
        var self = this;
        return String(text || '')
            .replace(/,?\s*\bsys_id\s+([0-9a-f]{32})\b/g, function(all, id) { return self._name(id) ? '' : all; })
            .replace(/\b[0-9a-f]{32}\b/g, function(id) { return self._name(id) || id; });
    },

    _name: function(id) {
        if (this._names[id] !== undefined) return this._names[id];
        var name = '';
        for (var i = 0; i < FinanceTextFormat.RECORDS.length && !name; i++) {
            var r = FinanceTextFormat.RECORDS[i];
            var gr = new GlideRecord(r[0]);
            if (gr.get(id)) {
                name = gr.getValue(r[1]) || '';
            }
        }
        this._names[id] = name;
        return name;
    },

    // ---- Extraction summary (Phase 41, defect 7) -----------------------------

    // What the document said, in sections a finance user reads, from the
    // extraction contract (NativeDocumentIntelligenceProvider). kind 'ap' or
    // 'ar'. The raw JSON stays on the intake / extraction / remittance
    // records as technical evidence.
    extractionSummary: function(d, kind) {
        if (!d) return '';
        var S = [], self = this;
        var v = function(x) { return x === null || x === undefined || x === '' ? '-' : x; };
        var m = function(x) { return x === null || x === undefined || x === '' ? '-' : self.money(x); };
        var b = function(text) { return '• ' + text; };
        var conf = ['EXTRACTION CONFIDENCE', b(this.percent(d.confidence) + ' (' + (d.confidence_basis ? 'completeness and readability; Document Intelligence returns no per-field confidence' : 'as reported') + ')')];
        for (var w = 0; d.warnings && w < d.warnings.length && w < 6; w++) conf.push('    ' + d.warnings[w]);
        var norm = ['NORMALIZATION'];
        for (var n = 0; d.normalization && n < d.normalization.length && n < 8; n++) {
            var x = d.normalization[n];
            norm.push(b(x.field.replace(/_/g, ' ') + ': printed "' + x.original + '" read as ' + x.normalized + ' (' + x.rule + ')'));
        }
        if (norm.length === 1) norm.push(b('Values used as printed.'));
        if (kind === 'ar') {
            S.push(['PAYMENT', b('Reference ' + v(d.payment_reference) + (d.bank_reference && d.bank_reference !== d.payment_reference ? '  ·  bank reference / UTR ' + d.bank_reference : '')),
                b('Amount ' + v(d.currency) + ' ' + m(d.payment_amount) + '  ·  payment date ' + v(d.payment_date) + (d.value_date ? '  ·  value date ' + d.value_date : ''))]);
            S.push(['PAYER', b(v(d.customer_name) + (d.customer_code ? ' (account ' + d.customer_code + ')' : '')),
                d.beneficiary_name ? b('Beneficiary: ' + d.beneficiary_name) : null, d.document_language ? b('Language: ' + d.document_language) : null]);
            var inv = ['INVOICE REFERENCES'];
            for (var i = 0; d.invoice_lines && i < d.invoice_lines.length && i < 15; i++) {
                var l = d.invoice_lines[i];
                inv.push(b(v(l.invoice_reference) + (l.invoice_date ? ' (' + l.invoice_date + ')' : '') + ': gross ' + m(l.invoice_amount) +
                    (l.advance_amount ? '  −  advance ' + m(l.advance_amount) : '') + (l.tds_amount ? '  −  TDS ' + m(l.tds_amount) : '') +
                    (l.deduction_amount ? '  −  deduction ' + m(l.deduction_amount) : '') + '  =  paid ' + m(l.amount_applied) + (l.deduction_reason ? '  (' + l.deduction_reason + ')' : '')));
            }
            if (d.invoice_lines && d.invoice_lines.length > 15) inv.push('    … ' + (d.invoice_lines.length - 15) + ' more');
            if (inv.length === 1) inv.push(b('No invoice references read.'));
            S.push(inv);
            S.push(['DEDUCTIONS (as stated by the customer; evidence only, never approved automatically)',
                b('Total deduction ' + m(d.deduction_amount) + (d.deduction_reason ? '  ·  reason: ' + d.deduction_reason : '')),
                d.tds_amount ? b('TDS / withholding ' + m(d.tds_amount)) : null, d.advance_amount ? b('Advance adjusted ' + m(d.advance_amount)) : null,
                d.note_references ? b('Credit / debit notes: ' + d.note_references) : null]);
            if (d.reconciliation) S.push(['RECONCILIATION', b(d.reconciliation.detail)]);
        } else {
            var pages = ['DOCUMENT', b('Language: ' + v(d.document_language) + '  ·  supplier country: ' + v(d.vendor_country)),
                d.invoice_pages ? b('Invoice pages: ' + d.invoice_pages) : null];
            for (var p = 0; d.supporting_documents && p < d.supporting_documents.length && p < 8; p++) {
                var sd = d.supporting_documents[p] || {};
                pages.push(b('Supporting: ' + this.words(sd.type || 'other') + (sd.pages ? ' (pages ' + sd.pages + ')' : '') + (sd.reference ? ' ' + sd.reference : '') + ': evidence only, not used as invoice values'));
            }
            S.push(pages);
            S.push(['SUPPLIER', b(v(d.vendor_name) + (d.vendor_tax_id ? '  ·  tax id ' + d.vendor_tax_id : ''))]);
            S.push(['INVOICE', b('Number ' + v(d.invoice_number) + '  ·  date ' + v(d.invoice_date) + (d.due_date ? '  ·  due ' + d.due_date : '')),
                b('Currency ' + v(d.currency) + (d.payment_terms ? '  ·  terms ' + d.payment_terms : '') + (d.buyer_name ? '  ·  buyer ' + d.buyer_name : '') + (d.company_code ? ' (' + d.company_code + ')' : ''))]);
            S.push(['PO / RECEIPT REFERENCES (as printed)', b('PO ' + v(d.po_number) + '  ·  GRN ' + v(d.grn_number) + '  ·  service entry ' + v(d.srn_number))]);
            var r = d.reconciliation || {};
            S.push(['AMOUNTS', b('Net ' + m(d.net_amount) + '  ·  tax ' + m(d.tax_amount) + '  ·  total ' + m(d.gross_amount)),
                r.detail ? b(r.detail) : null]);
            var charges = ['CHARGES'];
            if (d.freight_amount) charges.push(b('Freight ' + m(d.freight_amount)));
            if (d.shipping_amount) charges.push(b('Shipping / handling ' + m(d.shipping_amount)));
            if (d.surcharge_amount) charges.push(b('Surcharge ' + m(d.surcharge_amount)));
            if (d.other_charge_amount) charges.push(b('Other charges ' + m(d.other_charge_amount)));
            if (d.discount_amount) charges.push(b('Discount ' + m(d.discount_amount)));
            if (charges.length === 1) charges.push(b('None printed'));
            S.push(charges);
            var taxes = ['TAXES (as printed; validated separately)', b('Type ' + v(d.tax_type) + (d.tax_rate_pct ? ' @ ' + d.tax_rate_pct + '%' : ''))];
            for (var t = 0; d.tax_components && t < d.tax_components.length && t < 8; t++) {
                var c = d.tax_components[t];
                taxes.push(b(c.printed_label + ' → ' + (c.normalized_tax_type || '-') + (c.rate !== null ? ' @ ' + c.rate + '%' : '') + (c.taxable_base !== null ? ' on ' + m(c.taxable_base) : '') + ': ' + m(c.amount)));
            }
            if (!d.tax_components || !d.tax_components.length) {
                if (d.cgst_amount) taxes.push(b('CGST ' + m(d.cgst_amount)));
                if (d.sgst_amount) taxes.push(b('SGST ' + m(d.sgst_amount)));
                if (d.igst_amount) taxes.push(b('IGST ' + m(d.igst_amount)));
                if (d.vat_amount) taxes.push(b('VAT ' + m(d.vat_amount)));
            }
            if (d.wht_amount) taxes.push(b('Withholding ' + m(d.wht_amount) + (d.wht_rate_pct ? ' @ ' + d.wht_rate_pct + '%' : '')));
            S.push(taxes);
            var lines = ['LINES'];
            for (var k = 0; d.lines && k < d.lines.length && k < 12; k++) {
                var ln = d.lines[k];
                lines.push(b(ln.line_number + '. ' + (ln.description || ln.material_code || '-') + '  ·  ' + v(ln.quantity) + ' ' + (ln.unit || '') + ' × ' + m(ln.unit_price) + ' = ' + m(ln.net_amount) +
                    (ln.tax_amount ? ' (tax ' + m(ln.tax_amount) + ')' : '')));
            }
            if (d.lines && d.lines.length > 12) lines.push('    … ' + (d.lines.length - 12) + ' more');
            if (lines.length === 1) lines.push(b('No lines read.'));
            S.push(lines);
        }
        S.push(conf);
        S.push(norm);
        var out = [];
        for (var s = 0; s < S.length; s++) {
            var rows = [];
            for (var j = 0; j < S[s].length; j++) if (S[s][j]) rows.push(S[s][j]);
            if (rows.length > 1) out.push(rows.join('\n'));
        }
        var text = out.join('\n\n');
        return text.length > 4000 ? text.substring(0, 3990) + ' …' : text;
    },

    // ---- Values -------------------------------------------------------------

    // "PENDING_APPROVAL" / "not_required" -> "Pending approval" / "Not required".
    words: function(value) {
        var s = String(value === undefined || value === null ? '' : value).replace(/_/g, ' ').trim();
        if (!s) return '';
        if (s === s.toUpperCase()) s = s.toLowerCase();
        return s.charAt(0).toUpperCase() + s.substring(1);
    },

    // 5900 -> "5,900.00"; empty -> "-".
    money: function(value) {
        if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) return '-';
        var n = Math.round(parseFloat(value) * 100) / 100;
        var neg = n < 0;
        var parts = Math.abs(n).toFixed(2).split('.');
        var whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return (neg ? '-' : '') + whole + '.' + parts[1];
    },

    // 0.97 -> "97%"; 1 -> "100%"; "" -> "-".
    percent: function(value) {
        if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) return '-';
        var v = parseFloat(value);
        return Math.round((v <= 1 ? v * 100 : v) * 10) / 10 + '%';
    },

    // The first sentence(s) of a note, up to max characters, on one line.
    brief: function(text, max) {
        var s = String(text || '').replace(/\s+/g, ' ').trim();
        if (s.length <= max) return s;
        var cut = s.substring(0, max);
        var stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
        return (stop > max / 3 ? cut.substring(0, stop + 1) : cut.replace(/\s+\S*$/, '')) + ' …';
    },

    type: 'FinanceTextFormat'
};
