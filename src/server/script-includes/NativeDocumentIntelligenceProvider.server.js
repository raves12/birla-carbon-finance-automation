// Native document extraction (Phase 40): ServiceNow Document Intelligence,
// generative extraction, with the provider pinned to Now LLM in each BCFA
// use case (di_skill_config provider.use_now_llm; no external LLM).
//
// The use cases hold one field per value and describe facts only: no tax,
// tolerance or approval rule is in any field (scripts/deploy/
// native_extraction_config.json). This class maps the structured result to
// the BCFA extraction contract, the same shape SimulatedDocumentExtraction
// returns, so nothing downstream depends on which provider read the
// document. OCR extracts facts; the deterministic pipeline decides.
//
// Extraction runs asynchronously in the platform. extract() starts a task
// for the intake's current attachment and returns pending; once the task
// has finished, the next call (the "Process Document" action or the BCFA
// Native Extraction Poller job) reads the result. A failed or empty
// extraction is an error for manual review; it never falls back to
// simulated values.
//
// Document Intelligence generative extraction returns no per-field
// confidence. The document confidence here is derived deterministically
// from completeness and arithmetic checks and is labelled as such.
var NativeDocumentIntelligenceProvider = Class.create();

NativeDocumentIntelligenceProvider.SOURCE = 'servicenow_document_intelligence';
NativeDocumentIntelligenceProvider.LABEL = 'NATIVE: ServiceNow Document Intelligence (generative extraction, Now LLM)';
NativeDocumentIntelligenceProvider.USE_CASES = {
    ap: '4f1b9b4aca304a7182f72f68a3c168c9', // BCFA AP Invoice Extraction (Now LLM)
    ar: '394844f2a38542d9bb14f79668777523'  // BCFA AR Payment Advice Extraction (Now LLM)
};
// A task that has not finished after this many minutes is reported as failed.
NativeDocumentIntelligenceProvider.TIMEOUT_MINUTES = 10;

// DocIntel field name, lower case without spaces or punctuation (the key of
// the structured result) -> BCFA contract field.
NativeDocumentIntelligenceProvider.FIELDS = {
    ap: {
        suppliername: 'vendor_name', suppliertaxregistrationnumber: 'vendor_tax_id', suppliercountry: 'vendor_country',
        invoicenumber: 'invoice_number', invoicedate: 'invoice_date', purchaseordernumber: 'po_number', buyercompany: 'buyer_name',
        buyercompanycode: 'company_code', currency: 'currency', paymentterms: 'payment_terms', subtotalbeforetax: 'net_amount',
        discountamount: 'discount_amount', freightamount: 'freight_amount', totaltaxamount: 'tax_amount', taxtype: 'tax_type',
        taxratepercent: 'tax_rate_pct', cgstamount: 'cgst_amount', sgstamount: 'sgst_amount', igstamount: 'igst_amount',
        vatamount: 'vat_amount', withholdingtaxamount: 'wht_amount', withholdingtaxratepercent: 'wht_rate_pct',
        invoicetotal: 'gross_amount', documentlanguage: 'document_language', invoicelineitems: 'lines'
    },
    ar: {
        payername: 'customer_name', customeraccountnumber: 'customer_code', paymentreference: 'payment_reference',
        bankreference: 'bank_reference', paymentdate: 'payment_date', paymentamount: 'payment_amount', currency: 'currency',
        totaldeductionamount: 'deduction_amount', deductionreason: 'deduction_reason', creditordebitnotereferences: 'note_references',
        comments: 'comments', invoicespaid: 'invoice_lines'
    }
};
NativeDocumentIntelligenceProvider.NUMERIC = [
    'net_amount', 'discount_amount', 'freight_amount', 'tax_amount', 'tax_rate_pct', 'cgst_amount', 'sgst_amount', 'igst_amount',
    'vat_amount', 'wht_amount', 'wht_rate_pct', 'gross_amount', 'payment_amount', 'deduction_amount'
];

NativeDocumentIntelligenceProvider.prototype = {
    initialize: function() {},

    // kind: 'ap' (invoice) or 'ar' (payment advice / remittance).
    // Returns { ok:true, data, source, fileName, taskId } once extracted,
    // { ok:false, pending:true, taskId, safeError } while the task runs, or
    // { ok:false, safeError } when extraction cannot run or returned nothing.
    extract: function(intakeSysId, kind) {
        var useCase = NativeDocumentIntelligenceProvider.USE_CASES[kind];
        if (!useCase) return { ok: false, safeError: 'Unknown extraction kind "' + kind + '".' };
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) return { ok: false, safeError: 'Finance Intake record not found.' };
        var attachment = this._attachment(intakeSysId);
        if (!attachment) return { ok: false, safeError: 'No attachment on this intake record.' };
        var fileName = attachment.getValue('file_name');

        // One task per attachment: the task name carries the attachment sys_id,
        // so a replaced document starts a new task.
        var taskName = 'BCFA ' + intake.getValue('number') + ' ' + attachment.getUniqueValue();
        var task = new GlideRecord('sys_di_task');
        var taskId = intake.getValue('extraction_task');
        if (!taskId || !task.get(taskId) || task.getValue('display_name') !== taskName) {
            try {
                var api = new sn_docintel.DocIntelAPI();
                taskId = api.createTask(taskName, useCase, 'x_695068_bcfa_finance_intake', intakeSysId, [attachment.getUniqueValue()]);
                api.processTask(taskId);
            } catch (e) {
                return { ok: false, safeError: 'Document Intelligence could not start an extraction task: ' + (e && e.message ? e.message : e) };
            }
            if (!taskId) return { ok: false, safeError: 'Document Intelligence did not create an extraction task.' };
            intake.setValue('extraction_task', taskId);
            intake.update();
            return { ok: false, pending: true, taskId: taskId, fileName: fileName,
                safeError: 'Native extraction started (Document Intelligence task ' + taskId + '); the result is read when the task finishes.' };
        }

        if (task.getValue('is_processed') !== '1' && task.getValue('is_processed') !== 'true') {
            var started = new GlideDateTime(task.getValue('sys_created_on'));
            var ageMinutes = (new GlideDateTime().getNumericValue() - started.getNumericValue()) / 60000;
            if (ageMinutes > NativeDocumentIntelligenceProvider.TIMEOUT_MINUTES) {
                return { ok: false, taskId: taskId, safeError: 'Native extraction did not finish within ' + NativeDocumentIntelligenceProvider.TIMEOUT_MINUTES +
                    ' minutes (Document Intelligence task ' + taskId + '). Review the document manually.' };
            }
            return { ok: false, pending: true, taskId: taskId, fileName: fileName, safeError: 'Native extraction is still running (Document Intelligence task ' + taskId + ').' };
        }

        var result = this._readResult(taskId);
        if (!result.raw) {
            return { ok: false, taskId: taskId, safeError: 'Native extraction returned no result for "' + fileName + '" (Document Intelligence task ' + taskId + ')' +
                (result.error ? ': ' + result.error : '') + '. Review the document manually.' };
        }
        var data = kind === 'ap' ? this._mapInvoice(result.raw) : this._mapAdvice(result.raw);
        data.field_evidence = result.evidence;
        data.extraction_method = NativeDocumentIntelligenceProvider.LABEL;
        data.extraction_task = taskId;
        return { ok: true, data: data, source: NativeDocumentIntelligenceProvider.SOURCE, fileName: fileName, taskId: taskId };
    },

    // The structured result (di_genai_output) and, per field, the value and
    // its bounding-box candidate where the platform mapped one.
    _readResult: function(taskId) {
        var keys = {};
        var key = new GlideRecord('sys_di_key');
        key.addQuery('task_definition', 'IN', NativeDocumentIntelligenceProvider.USE_CASES.ap + ',' + NativeDocumentIntelligenceProvider.USE_CASES.ar);
        key.query();
        while (key.next()) keys[key.getUniqueValue()] = this._norm(key.getValue('name'));
        var outputId = '', evidence = {};
        var ev = new GlideRecord('sys_di_extracted_value');
        ev.addQuery('task', taskId);
        ev.query();
        while (ev.next()) {
            var meta = {};
            try { meta = JSON.parse(ev.getValue('metadata') || '{}'); } catch (e) {}
            if (!outputId && meta.output_table_id) outputId = meta.output_table_id;
            var name = keys[ev.getValue('key')];
            if (name && ev.getValue('data') && String(ev.getValue('data')).indexOf('[object Object]') < 0) {
                evidence[name] = { value: ev.getValue('data'), candidate: ev.getValue('candidate_id') || '', image: ev.getValue('image') || '' };
            }
        }
        if (!outputId) return { raw: null, error: 'no structured output', evidence: evidence };
        var out = new GlideRecord('di_genai_output');
        if (!out.get(outputId)) return { raw: null, error: 'structured output record missing', evidence: evidence };
        if (out.getValue('error')) return { raw: null, error: out.getValue('error'), evidence: evidence };
        var raw = null;
        try { raw = JSON.parse(out.getValue('data') || ''); } catch (e) { return { raw: null, error: 'structured output is not JSON', evidence: evidence }; }
        return { raw: raw, evidence: evidence };
    },

    _mapInvoice: function(raw) {
        var d = this._mapFields(raw, NativeDocumentIntelligenceProvider.FIELDS.ap);
        d.vendor_code = '';
        var lines = this._array(d.lines);
        d.lines = [];
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i] || {};
            d.lines.push({
                line_number: this._num(l.line_number) || (i + 1), description: this._str(l.description), material_code: this._str(l.material_code),
                quantity: this._num(l.quantity), unit: this._str(l.unit), unit_price: this._num(l.unit_price),
                net_amount: this._num(l.net_amount), tax_amount: this._num(l.tax_amount)
            });
        }
        var checks = this._confidence(d, ['invoice_number', 'vendor_name', 'currency', 'net_amount', 'tax_amount', 'gross_amount']);
        if (d.net_amount !== null && d.tax_amount !== null && d.gross_amount !== null) {
            var expectedGross = d.net_amount + d.tax_amount + (d.freight_amount || 0) - (d.discount_amount || 0);
            // A freight amount the model read from a line already in the net
            // must not count twice: accept either reading.
            if (Math.abs(expectedGross - d.gross_amount) > 1 && Math.abs(d.net_amount + d.tax_amount - d.gross_amount) > 1) {
                checks.penalty(0.2, 'Net ' + d.net_amount + ' + tax ' + d.tax_amount + ' does not equal the total ' + d.gross_amount + '.');
            }
        }
        if (d.lines.length) {
            var lineTotal = 0;
            var unreadable = false;
            for (var j = 0; j < d.lines.length; j++) {
                lineTotal += d.lines[j].net_amount || 0;
                if (d.lines[j].quantity === null || d.lines[j].unit_price === null) unreadable = true;
            }
            if (d.net_amount !== null && Math.abs(lineTotal - d.net_amount) > 1) {
                checks.penalty(0.1, 'Line amounts (' + Math.round(lineTotal * 100) / 100 + ') do not add up to the net amount (' + d.net_amount + ').');
            }
            if (unreadable) checks.penalty(0.2, 'Line quantity or unit price not readable on at least one line.');
        } else {
            checks.penalty(0.1, 'No invoice lines were read.');
        }
        return checks.finish(d);
    },

    _mapAdvice: function(raw) {
        var d = this._mapFields(raw, NativeDocumentIntelligenceProvider.FIELDS.ar);
        if (!d.payment_reference) d.payment_reference = d.bank_reference;
        var lines = this._array(d.invoice_lines);
        d.invoice_lines = [];
        d.invoice_references = [];
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i] || {};
            var ref = this._str(l.invoice_reference);
            d.invoice_lines.push({
                invoice_reference: ref, customer_reference: this._str(l.customer_reference), invoice_amount: this._num(l.invoice_amount),
                amount_applied: this._num(l.amount_applied), deduction_amount: this._num(l.deduction_amount), deduction_reason: this._str(l.deduction_reason)
            });
            if (ref) d.invoice_references.push(ref);
        }
        var checks = this._confidence(d, ['customer_name', 'payment_reference', 'payment_amount', 'currency']);
        if (!d.invoice_lines.length) checks.penalty(0.1, 'No invoice references were read.');
        var applied = 0, allApplied = d.invoice_lines.length > 0;
        for (var j = 0; j < d.invoice_lines.length; j++) {
            if (d.invoice_lines[j].amount_applied === null) allApplied = false;
            applied += d.invoice_lines[j].amount_applied || 0;
        }
        if (allApplied && d.payment_amount !== null && Math.abs(applied - d.payment_amount) > 1) {
            checks.penalty(0.2, 'Amounts applied to invoices (' + Math.round(applied * 100) / 100 + ') do not add up to the payment amount (' + d.payment_amount + ').');
        }
        // The advice's own deduction statement is evidence only: the residual
        // is computed by the allocation, never taken from the document.
        return checks.finish(d);
    },

    _mapFields: function(raw, map) {
        var d = {};
        for (var k in map) d[map[k]] = null;
        for (var rawKey in raw) {
            var field = map[this._norm(rawKey)];
            if (!field) continue;
            var v = raw[rawKey];
            if (field === 'lines' || field === 'invoice_lines') d[field] = v;
            else if (NativeDocumentIntelligenceProvider.NUMERIC.indexOf(field) >= 0) d[field] = this._num(v);
            else d[field] = this._str(v);
        }
        return d;
    },

    // Derived confidence: starts at 1 and loses 0.2 per missing critical
    // field plus the penalties of the arithmetic checks.
    _confidence: function(d, critical) {
        var score = 1, warnings = [];
        for (var i = 0; i < critical.length; i++) {
            if (d[critical[i]] === null || d[critical[i]] === '') {
                score -= 0.2;
                warnings.push('Required field not read: ' + critical[i] + '.');
            }
        }
        return {
            penalty: function(amount, warning) { score -= amount; warnings.push(warning); },
            finish: function(data) {
                data.confidence = Math.max(0, Math.round(score * 100) / 100);
                data.confidence_basis = 'Derived by BCFA from field completeness and arithmetic checks; Document Intelligence generative extraction returns no per-field confidence.';
                data.warnings = warnings;
                return data;
            }
        };
    },

    _array: function(v) {
        if (!v) return [];
        if (typeof v === 'string') {
            try { v = JSON.parse(v); } catch (e) { return []; }
        }
        return Object.prototype.toString.call(v) === '[object Array]' ? v : [];
    },

    // Numbers as printed: 1,234.56 (English), 1.234,56 (German and most of
    // Europe), 1 234,56, 1,23,456.00 (Indian grouping). The last separator
    // followed by one or two digits is the decimal mark (Phase 40: found on
    // the German VAT fixture, where the model returned "2.058,80").
    _num: function(v) {
        if (v === null || v === undefined) return null;
        if (typeof v === 'number') return isNaN(v) ? null : v;
        var s = String(v).replace(/[^0-9.,\-]/g, '');
        if (s === '' || s === '-') return null;
        var lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
        var decimal = lastDot > lastComma ? '.' : ',';
        var at = Math.max(lastDot, lastComma);
        if (at >= 0 && s.length - at - 1 > 2) decimal = null; // 1,234 or 1.234: grouping only
        if (decimal === ',' && lastDot < 0 && s.split(',').length > 2) decimal = null; // 1,23,456: grouping
        var normalized = decimal === ',' ? s.replace(/\./g, '').replace(',', '.') : decimal === '.' ? s.replace(/,/g, '') : s.replace(/[.,]/g, '');
        var n = parseFloat(normalized);
        return isNaN(n) ? null : n;
    },

    _str: function(v) {
        if (v === null || v === undefined) return '';
        return String(v).replace(/^\s+|\s+$/g, '');
    },

    _norm: function(s) {
        return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    },

    _attachment: function(intakeSysId) {
        var a = new GlideRecord('sys_attachment');
        a.addQuery('table_name', 'x_695068_bcfa_finance_intake');
        a.addQuery('table_sys_id', intakeSysId);
        a.orderByDesc('sys_created_on');
        a.setLimit(1);
        a.query();
        return a.next() ? a : null;
    },

    type: 'NativeDocumentIntelligenceProvider'
};
