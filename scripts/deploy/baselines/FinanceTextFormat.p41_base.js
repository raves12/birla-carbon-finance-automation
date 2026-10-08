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
