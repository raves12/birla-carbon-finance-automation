// Review summary (Phase 24): the whole review evidence of an AP invoice or a
// payment in one read-only block (review_summary), so a reviewer sees it at
// the top of the form / workspace record without opening each related list.
//   invoice: document, extraction, confidence, invoice, PO, GRN, match
//            comparison, tolerance, exception, AI explanation,
//            recommendation, approval, integration, audit
//   payment: payment, remittance, extracted (Content Understanding) fields,
//            customer, open items, recommended match, allocation, residual,
//            deduction, AI explanation, exception, approval, clearing, audit
// Refreshed on every state change (Ap/ArDomainService._setState) and when an
// AI note is saved; each refresh also refreshes the journey (Playbook) fields
// through FinanceJourneyService. Written with setWorkflow(false): it is a derived display
// field and must not trigger business rules (e.g. the approval cascade).
// Layout: a headline (record, amount, status), then one titled section per
// topic with one fact per bullet and a blank line between sections; amounts,
// percentages and status values are written for a person (FinanceTextFormat).
var FinanceReviewSummary = Class.create();

FinanceReviewSummary.MAX = 8000;

FinanceReviewSummary.prototype = {
    initialize: function() {
        this.fmt = new FinanceTextFormat();
    },

    refreshInvoice: function(sysId) {
        try {
            var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
            if (!inv.get(sysId)) return '';
            var text = this.buildInvoice(inv);
            this._write('x_695068_bcfa_ap_invoice', sysId, text);
            // Playbook phase: the journey fields follow the same refresh.
            new FinanceJourneyService().refreshInvoice(sysId);
            return text;
        } catch (e) {
            gs.warn('BCFA FinanceReviewSummary (invoice ' + sysId + '): ' + e);
            return '';
        }
    },

    refreshPayment: function(sysId) {
        try {
            var pay = new GlideRecord('x_695068_bcfa_payment');
            if (!pay.get(sysId)) return '';
            var text = this.buildPayment(pay);
            this._write('x_695068_bcfa_payment', sysId, text);
            // Playbook phase: the journey fields follow the same refresh.
            new FinanceJourneyService().refreshPayment(sysId);
            return text;
        } catch (e) {
            gs.warn('BCFA FinanceReviewSummary (payment ' + sysId + '): ' + e);
            return '';
        }
    },

    // Refreshes the invoice or payment behind an exception.
    refreshForException: function(exceptionTable, exceptionSysId) {
        var ex = new GlideRecord(exceptionTable);
        if (!ex.get(exceptionSysId)) return;
        if (exceptionTable === 'x_695068_bcfa_ap_exception') this.refreshInvoice(ex.getValue('ap_invoice'));
        else this.refreshPayment(ex.getValue('payment'));
    },

    buildInvoice: function(inv) {
        var id = inv.getUniqueValue(), f = this.fmt, cur = inv.getValue('currency') || '';
        var S = [];
        S.push([(inv.getValue('invoice_number') || 'Invoice') + ' — ' + (inv.getDisplayValue('vendor') || 'vendor not resolved'),
            cur + ' ' + f.money(inv.getValue('gross_amount')) + '  (net ' + f.money(inv.getValue('net_amount')) + ' + tax ' + f.money(inv.getValue('tax_amount')) + ')',
            'Status: ' + f.words(inv.getValue('state')) + '  ·  Approval: ' + f.words(inv.getDisplayValue('approval_state') || '-') + '  ·  Posting: ' + f.words(inv.getDisplayValue('posting_state') || '-')]);

        var intake = this._one('x_695068_bcfa_finance_intake', 'ap_invoice=' + id, 'sys_created_on', true);
        S.push(['DOCUMENT', intake ? this._b(intake.getValue('number') + '  ·  ' + this._file(intake)) : this._b('No uploaded document (source: ' + (inv.getDisplayValue('source') || '-') + ')'),
            intake ? this._b(intake.getDisplayValue('source') + ', ' + f.words(intake.getDisplayValue('processing_status'))) : null]);

        var ex = this._one('x_695068_bcfa_ap_extraction', 'ap_invoice=' + id, 'sys_created_on', true);
        S.push(['EXTRACTION', ex ? this._b(ex.getDisplayValue('source')) : this._b('None'),
            ex ? this._b('Confidence ' + f.percent(ex.getValue('confidence') || inv.getValue('extraction_confidence')) + (ex.getValue('requires_review') === '1' ? '  ·  review required' : '')) : null]);

        var po = inv.purchase_order.getRefRecord();
        var poLines = [po && po.isValidRecord() ? this._b(po.getValue('po_number') + ' (' + f.words(po.getDisplayValue('status')) + ')  ·  ' + po.getDisplayValue('vendor')) : this._b('No PO referenced')];
        var line = new GlideRecord('x_695068_bcfa_ap_invoice_line');
        line.addQuery('ap_invoice', id);
        line.orderBy('line_number');
        line.setLimit(5);
        line.query();
        while (line.next()) {
            var pol = line.po_line.getRefRecord();
            poLines.push(this._b('Line ' + line.getValue('line_number') + ': ' + line.getValue('quantity') + ' @ ' + f.money(line.getValue('unit_price')) +
                (pol && pol.isValidRecord() ? '  ·  PO ' + pol.getValue('quantity') + ' @ ' + f.money(pol.getValue('unit_price')) + '  ·  received ' + (pol.getValue('received_quantity') || 0) : '  ·  no PO line') +
                (line.getValue('receipt_reference') ? '  ·  GRN ' + line.getDisplayValue('receipt_reference') : '  ·  no GRN')));
        }
        S.push(['PURCHASE ORDER AND RECEIPT'].concat(poLines));

        var match = this._one('x_695068_bcfa_ap_match', 'ap_invoice=' + id, 'evaluated_at', true);
        var tol = this._matchTolerances(inv);
        S.push(['3-WAY MATCH',
            match ? this._b('Result: ' + f.words(match.getDisplayValue('match_result')) + (match.getValue('within_tolerance') === '1' ? ', within tolerance' : ', outside tolerance')) : this._b('Not run yet'),
            match ? this._b('Variance: quantity ' + (match.getValue('quantity_variance') || 0) + '  ·  price ' + (match.getValue('price_variance') || 0) + '  ·  tax ' + (match.getValue('tax_variance') || 0)) : null,
            tol ? this._b('Tolerances: ' + tol) : null]);

        S.push(this._exceptions('x_695068_bcfa_ap_exception', 'ap_invoice=' + id));

        var ap = this._one('x_695068_bcfa_ap_approval', 'ap_invoice=' + id, 'sys_created_on', true);
        S.push(['APPROVAL'].concat(this._approval(ap, true)));
        S.push(['SAP POSTING (MOCK SAP)', this._b(this._integration('x_695068_bcfa_ap_invoice', id)),
            inv.getValue('sap_document_id') ? this._b('SAP document ' + inv.getValue('sap_document_id')) : null]);
        S.push(['AUDIT TRAIL', this._b(this._audit(inv.getValue('correlation_id'), id))]);
        return this._cap(this._join(S));
    },

    buildPayment: function(pay) {
        var id = pay.getUniqueValue(), f = this.fmt, cur = pay.getValue('currency') || '';
        var S = [];
        S.push(['Payment ' + pay.getValue('bank_reference') + ' — ' + (pay.getDisplayValue('customer') || 'customer not identified yet'),
            cur + ' ' + f.money(pay.getValue('amount')) + '  ·  value date ' + (pay.getValue('value_date') || '-'),
            'Status: ' + f.words(pay.getValue('state'))]);

        var rem = this._one('x_695068_bcfa_remittance', 'payment=' + id, 'sys_created_on', true);
        S.push(['REMITTANCE / PAYMENT ADVICE',
            rem ? this._b((rem.getValue('remittance_reference') || 'no reference') + '  ·  ' + rem.getDisplayValue('source') + '  ·  received ' + (rem.getValue('received_date') || '-') +
                '  ·  confidence ' + f.percent(rem.getValue('confidence'))) : this._b('None received yet'),
            rem && rem.getValue('extracted_fields') ? this._b('Read from the advice: ' + this._fields(rem.getValue('extracted_fields'))) : null]);

        var customer = pay.customer.getRefRecord();
        var how = this._lastAudit(pay.getValue('correlation_id'), id, 'rule_evaluated', 'Customer identified');
        var cust = ['CUSTOMER', customer && customer.isValidRecord() ? this._b(customer.getValue('name') + ' (' + customer.getValue('customer_code') + ')') : this._b('Not identified yet'),
            how ? this._b(how) : null];
        if (customer && customer.isValidRecord()) {
            var items = [], total = 0, n = 0;
            var oi = new GlideRecord('x_695068_bcfa_ar_open_item');
            oi.addQuery('customer', customer.getUniqueValue());
            oi.addQuery('open_amount', '>', 0);
            oi.orderBy('due_date');
            oi.query();
            while (oi.next()) {
                n++;
                total += parseFloat(oi.getValue('open_amount') || '0');
                if (items.length < 5) items.push(oi.getValue('item_number') + ' ' + f.money(oi.getValue('open_amount')) + ' ' + oi.getValue('currency'));
            }
            cust.push(this._b('Open items: ' + n + ', total ' + f.money(total) + (items.length ? '  (' + items.join(', ') + (n > 5 ? ', …' : '') + ')' : '')));
        }
        S.push(cust);

        var cands = [];
        var mc = new GlideRecord('x_695068_bcfa_match_candidate');
        mc.addQuery('payment', id);
        mc.orderBy('rank');
        mc.setLimit(6);
        mc.query();
        while (mc.next()) cands.push(this._b(mc.getDisplayValue('ar_open_item') + '  ·  ' + f.words(mc.getDisplayValue('match_type')) + '  ·  confidence ' + f.percent(mc.getValue('confidence')) +
            (mc.getValue('selected') === '1' ? '  ·  selected' : '')));
        S.push(['RECOMMENDED MATCH'].concat(cands.length ? cands : [this._b('None')]));

        var allocs = [], allocated = 0, deductions = 0, deds = [];
        var al = new GlideRecord('x_695068_bcfa_payment_allocation');
        al.addQuery('payment', id);
        al.addQuery('allocation_state', '!=', 'reversed');
        al.query();
        while (al.next()) {
            allocated += parseFloat(al.getValue('allocated_amount') || '0');
            allocs.push(this._b(al.getDisplayValue('ar_open_item') + '  ' + f.money(al.getValue('allocated_amount')) + '  (' + f.words(al.getDisplayValue('allocation_state')) + ')'));
            var d = new GlideRecord('x_695068_bcfa_deduction');
            d.addQuery('payment_allocation', al.getUniqueValue());
            d.query();
            while (d.next()) {
                if (d.getValue('status') === 'approved') deductions += parseFloat(d.getValue('amount') || '0');
                deds.push(this._b(f.words(d.getDisplayValue('deduction_type')) + '  ' + f.money(d.getValue('amount')) + '  (' + f.words(d.getDisplayValue('status')) + ')'));
            }
        }
        var amount = parseFloat(pay.getValue('amount') || '0');
        S.push(['ALLOCATION'].concat(allocs.length ? allocs.concat([this._b('Total allocated ' + f.money(allocated))]) : [this._b('None yet')]));
        S.push(['RESIDUAL', allocs.length ? this._b(f.money(amount - (allocated - deductions)) + '  =  payment ' + f.money(amount) + ' − allocated ' + f.money(allocated) +
            ' + approved deductions ' + f.money(deductions)) : this._b('-')]);
        S.push(['DEDUCTIONS'].concat(deds.length ? deds : [this._b('None')]));
        if (pay.getValue('ai_recommendation')) {
            S.push(['AI MATCH EXPLANATION (advisory)', this._b(f.brief(String(pay.getValue('ai_recommendation')).replace(/^AI MATCH EXPLANATION[^\n]*\n[─\s]*/, ''), 300))]);
        }

        S.push(this._exceptions('x_695068_bcfa_ar_exception', 'payment=' + id));

        var ap = this._one('x_695068_bcfa_ar_approval', 'payment=' + id, 'sys_created_on', true);
        S.push(['APPROVAL'].concat(this._approval(ap, false)));
        S.push(['SAP PROCESSING (MOCK SAP)',
            this._b('Mode: ' + (pay.getValue('sap_processing_mode') ? pay.getValue('sap_processing_mode').toUpperCase() : 'not yet sent') + '  ·  SAP status: ' +
                (pay.getDisplayValue('sap_status') || 'not sent') + (pay.getValue('sap_reference') ? '  ·  reference ' + pay.getValue('sap_reference') : '')),
            this._b('Clearing: ' + this._integration('x_695068_bcfa_payment', id))]);
        S.push(['AUDIT TRAIL', this._b(this._audit(pay.getValue('correlation_id'), id))]);
        return this._cap(this._join(S));
    },

    // --- helpers --------------------------------------------------------------

    // Sections: [heading, line, line, ...]; empty lines are dropped and a
    // blank line separates sections.
    _join: function(sections) {
        var out = [];
        for (var i = 0; i < sections.length; i++) {
            var lines = [];
            for (var j = 0; j < sections[i].length; j++) if (sections[i][j]) lines.push(sections[i][j]);
            if (lines.length) out.push(lines.join('\n'));
        }
        return out.join('\n\n');
    },

    _b: function(text) {
        return '• ' + text;
    },

    _approval: function(ap, withSod) {
        if (!ap) return [this._b('Not requested yet')];
        var f = this.fmt;
        return [this._b(f.words(ap.getDisplayValue('decision')) + '  ·  ' + f.words(ap.getDisplayValue('approval_type')) + '  ·  group ' + (ap.getDisplayValue('approval_group') || '-')),
            this._b('Requested by ' + (ap.getDisplayValue('requested_by') || '-') + (ap.getValue('approver') ? '  ·  approver ' + ap.getDisplayValue('approver') : '')),
            withSod && ap.getValue('sod_check') ? this._b('Segregation of duties: ' + f.brief(ap.getValue('sod_check'), 200)) : null];
    },

    _exceptions: function(table, query) {
        var f = this.fmt, lines = ['EXCEPTIONS'];
        var ex = new GlideRecord(table);
        ex.addEncodedQuery(query);
        ex.orderByDesc('sys_created_on');
        ex.setLimit(3);
        ex.query();
        while (ex.next()) {
            lines.push(this._b((ex.getValue('number') || '') + '  ' + ex.getDisplayValue('reason_code') + '  ·  ' + f.words(ex.getDisplayValue('status')) + '  ·  ' + f.words(ex.getDisplayValue('severity')) +
                '  ·  SLA ' + f.words(ex.getDisplayValue('sla_status') || '-') + (ex.getValue('decision') ? '  ·  decision: ' + f.words(ex.getDisplayValue('decision')) : '')));
            if (ex.getValue('rule_result')) lines.push('    Rule: ' + f.brief(f.recordNames(ex.getValue('rule_result')), 220));
            if (ex.getValue('ai_recommendation')) {
                if (ex.getValue('ai_explanation')) lines.push('    AI explanation' + (ex.getValue('ai_confidence') ? ' (confidence ' + ex.getDisplayValue('ai_confidence') + ')' : '') + ': ' +
                    f.brief(f.recordNames(ex.getValue('ai_explanation')), 260));
                var rec = new AiInteractionLog().recommendationOf(ex.getValue('ai_recommendation'));
                if (rec) lines.push('    AI recommendation (advisory; a person decides): ' + f.brief(f.recordNames(rec.replace(/^[^:]*:\s*/, '')), 260));
            }
        }
        if (lines.length === 1) lines.push(this._b('None'));
        return lines;
    },

    _integration: function(table, id) {
        var t = new GlideRecord('x_695068_bcfa_integration_txn');
        t.addQuery('source_table', table);
        t.addQuery('source_record', id);
        t.addQuery('operation', 'NOT IN', 'archive,queryTransactionStatus');
        t.orderByDesc('sys_created_on');
        t.setLimit(1);
        t.query();
        if (!t.next()) return 'Not sent';
        return t.getValue('operation') + ': ' + t.getDisplayValue('status') + '  ·  attempt ' + t.getValue('attempt') + '  ·  reconciliation ' + t.getDisplayValue('reconciliation_state') +
            (t.getValue('external_document_id') ? '  ·  document ' + t.getValue('external_document_id') : '') + (t.getValue('error_code') ? '  ·  ' + t.getValue('error_code') : '');
    },

    _audit: function(correlationId, id) {
        var e = new GlideRecord('x_695068_bcfa_audit_event');
        var q = e.addQuery('source_record', id);
        if (correlationId) q.addOrCondition('correlation_id', correlationId);
        e.orderByDesc('event_sequence');
        e.query();
        var n = e.getRowCount();
        if (!e.next()) return 'No events';
        return n + ' events  ·  last: ' + this._oneLine(e.getValue('description'), 140) + ' (' + e.getDisplayValue('occurred_at') + ')';
    },

    _lastAudit: function(correlationId, id, type, startsWith) {
        var e = new GlideRecord('x_695068_bcfa_audit_event');
        e.addQuery('source_record', id);
        e.addQuery('event_type', type);
        e.addQuery('description', 'STARTSWITH', startsWith);
        e.orderByDesc('event_sequence');
        e.setLimit(1);
        e.query();
        return e.next() ? this._oneLine(e.getValue('description'), 200) : '';
    },

    // The tolerances applied by the last 3-way match (Phase 19 match audit).
    _matchTolerances: function(inv) {
        var e = new GlideRecord('x_695068_bcfa_audit_event');
        e.addQuery('source_record', inv.getUniqueValue());
        e.addQuery('event_type', 'match');
        e.orderByDesc('event_sequence');
        e.setLimit(1);
        e.query();
        if (!e.next()) return '';
        try {
            var t = JSON.parse(e.getValue('after_value') || '{}').tolerances;
            if (!t) return '';
            var pct = function(v) { return v === undefined || v === null ? '-' : (Math.round(v * 1000) / 10) + '%'; };
            return 'quantity ' + pct(t.quantityPct) + '  ·  price ' + pct(t.pricePct) + '  ·  tax ' + (t.taxAbsolute !== undefined ? t.taxAbsolute : '-') + ' or ' + pct(t.taxRelativePct) +
                (t.source ? '  (' + t.source + ')' : '');
        } catch (x) {
            return '';
        }
    },

    _file: function(intake) {
        var a = new GlideRecord('sys_attachment');
        a.addQuery('table_name', 'x_695068_bcfa_finance_intake');
        a.addQuery('table_sys_id', intake.getUniqueValue());
        a.orderByDesc('sys_created_on');
        a.setLimit(1);
        a.query();
        return a.next() ? a.getValue('file_name') : '(no attachment)';
    },

    _fields: function(json) {
        if (!json) return '-';
        try {
            var o = JSON.parse(json);
            var parts = [];
            for (var k in o) {
                if (parts.length >= 10) break;
                var v = o[k];
                parts.push(k.replace(/_/g, ' ') + ': ' + (typeof v === 'object' ? JSON.stringify(v).substring(0, 120) : v));
            }
            return parts.join('  ·  ') || '-';
        } catch (e) {
            return this._oneLine(json, 300);
        }
    },

    _one: function(table, query, orderField, desc) {
        var gr = new GlideRecord(table);
        gr.addEncodedQuery(query);
        if (desc) gr.orderByDesc(orderField); else gr.orderBy(orderField);
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    },

    _oneLine: function(text, max) {
        return String(text || '').replace(/\s+/g, ' ').trim().substring(0, max);
    },

    _cap: function(text) {
        return text.length > FinanceReviewSummary.MAX ? text.substring(0, FinanceReviewSummary.MAX - 3) + '...' : text;
    },

    _write: function(table, sysId, text) {
        var gr = new GlideRecord(table);
        if (!gr.get(sysId) || gr.getValue('review_summary') === text) return;
        gr.setValue('review_summary', text);
        gr.setWorkflow(false);
        gr.update();
    },

    type: 'FinanceReviewSummary'
};
