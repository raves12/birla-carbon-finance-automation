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
    ar: '394844f2a38542d9bb14f79668777523', // BCFA AR Payment Advice Extraction (Now LLM)
    grn: '6d0f2a8c3e7b4f1a9c5d2e8b7a6f4c31', // BCFA Goods Receipt / GRN Extraction (Now LLM), Phase 42
    // Phase 42: the same fields read with the CJ OCR model (Chinese / Japanese).
    ap_zh: 'a7c2d41e9b3f4c58b1e60d2f7a9c3e51', // BCFA AP Invoice Extraction - Chinese (Now LLM)
    ar_zh: 'b8d3e52fac404d69c2f71e3a8bad4f62' // BCFA AR Payment Advice Extraction - Chinese (Now LLM)
};
// Phase 42: extraction use-case routing, kind + document language + visual
// requirement -> use case. The language of a use case is its document config
// (OCR model): Latin model (default) or CJ model (Chinese / Japanese). The
// language comes from the intake's Document Language Hint (it cannot be
// detected safely before OCR). No visual (image-understanding) use case is
// configured: Now LLM is text-only, and a multimodal provider needs approval.
NativeDocumentIntelligenceProvider.ROUTES = [
    { kind: 'ap', language: 'zh_hans', visual: false, useCase: 'ap_zh', ocr: 'CJ model (Chinese / Japanese)' },
    { kind: 'ar', language: 'zh_hans', visual: false, useCase: 'ar_zh', ocr: 'CJ model (Chinese / Japanese)' },
    { kind: 'ap', language: '', visual: false, useCase: 'ap', ocr: 'Latin model (default)' },
    { kind: 'ar', language: '', visual: false, useCase: 'ar', ocr: 'Latin model (default)' },
    { kind: 'grn', language: '', visual: false, useCase: 'grn', ocr: 'Latin model (default)' }
];
NativeDocumentIntelligenceProvider.LANGUAGES = { '': 'Latin scripts (default)', latin: 'Latin scripts (default)', zh_hans: 'Chinese (Simplified)' };
// A task that has not finished after this many minutes is reported as failed.
NativeDocumentIntelligenceProvider.TIMEOUT_MINUTES = 10;

// DocIntel field name, lower case without spaces or punctuation (the key of
// the structured result) -> BCFA contract field.
NativeDocumentIntelligenceProvider.FIELDS = {
    ap: {
        suppliername: 'vendor_name', suppliertaxregistrationnumber: 'vendor_tax_id', suppliercountry: 'vendor_country',
        buyertaxregistrationnumber: 'buyer_tax_id', // Phase 42: guards against a seller / buyer tax ID swap
        invoicenumber: 'invoice_number', invoicedate: 'invoice_date', purchaseordernumber: 'po_number', buyercompany: 'buyer_name',
        buyercompanycode: 'company_code', currency: 'currency', paymentterms: 'payment_terms', subtotalbeforetax: 'net_amount',
        discountamount: 'discount_amount', freightamount: 'freight_amount', totaltaxamount: 'tax_amount', taxtype: 'tax_type',
        taxratepercent: 'tax_rate_pct', cgstamount: 'cgst_amount', sgstamount: 'sgst_amount', igstamount: 'igst_amount',
        vatamount: 'vat_amount', withholdingtaxamount: 'wht_amount', withholdingtaxratepercent: 'wht_rate_pct',
        invoicetotal: 'gross_amount', documentlanguage: 'document_language', invoicelineitems: 'lines',
        // Phase 41: charge components, references from notes, tax components
        // and the page layout of multi-document PDFs.
        shippingandhandlingamount: 'shipping_amount', surchargeamount: 'surcharge_amount', otherchargesamount: 'other_charge_amount',
        duedate: 'due_date', goodsreceiptnumber: 'grn_number', serviceentrynumber: 'srn_number', taxcomponents: 'tax_components',
        invoicepagenumbers: 'invoice_pages', supportingdocuments: 'supporting_documents',
        // Phase 42: document evidence as read (DocumentEvidenceService decides
        // what it is worth).
        stamppresent: 'stamp_present_read', stamptype: 'stamp_type_read', stamptext: 'stamp_text', stamppage: 'stamp_page',
        stampcount: 'stamp_count', handwrittentextpresent: 'handwriting_present_read', handwrittenvalues: 'handwritten_values'
    },
    ar: {
        payername: 'customer_name', customeraccountnumber: 'customer_code', paymentreference: 'payment_reference',
        bankreference: 'bank_reference', paymentdate: 'payment_date', paymentamount: 'payment_amount', currency: 'currency',
        totaldeductionamount: 'deduction_amount', deductionreason: 'deduction_reason', creditordebitnotereferences: 'note_references',
        comments: 'comments', invoicespaid: 'invoice_lines',
        // Phase 41
        beneficiaryname: 'beneficiary_name', valuedate: 'value_date', totaladvanceamount: 'advance_amount', totaltdsamount: 'tds_amount',
        documentlanguage: 'document_language'
    },
    // Phase 42: goods receipt (GRN) documents, printed or handwritten.
    grn: {
        goodsreceiptnumber: 'grn_number', purchaseordernumber: 'po_number', suppliername: 'vendor_name', receiptdate: 'receipt_date',
        plantorsite: 'plant', materialorservicedescription: 'material_description', materialcode: 'material_code', polinenumber: 'po_line',
        quantityreceived: 'quantity_received', unitofmeasure: 'uom', receivedby: 'received_by', remarks: 'remarks',
        signaturepresent: 'signature_present_read', stamppresent: 'stamp_present_read', handwrittentextpresent: 'handwriting_present_read',
        handwrittenvalues: 'handwritten_values', documentlanguage: 'document_language'
    }
};
// Phase 42: date fields normalized to YYYY-MM-DD (original kept).
NativeDocumentIntelligenceProvider.DATES = ['invoice_date', 'due_date', 'payment_date', 'value_date', 'receipt_date'];
NativeDocumentIntelligenceProvider.NUMERIC = [
    'net_amount', 'discount_amount', 'freight_amount', 'tax_amount', 'tax_rate_pct', 'cgst_amount', 'sgst_amount', 'igst_amount',
    'vat_amount', 'wht_amount', 'wht_rate_pct', 'gross_amount', 'payment_amount', 'deduction_amount',
    'shipping_amount', 'surcharge_amount', 'other_charge_amount', 'advance_amount', 'tds_amount'
];
// Phase 41: absolute difference (document currency) within which printed
// totals count as reconciled (rounding on the document).
NativeDocumentIntelligenceProvider.RECONCILE_TOLERANCE = 1;

NativeDocumentIntelligenceProvider.prototype = {
    initialize: function() {},

    // kind: 'ap' (invoice) or 'ar' (payment advice / remittance).
    // Returns { ok:true, data, source, fileName, taskId } once extracted,
    // { ok:false, pending:true, taskId, safeError } while the task runs, or
    // { ok:false, safeError } when extraction cannot run or returned nothing.
    // Phase 42: the use case for kind + language (+ visual requirement).
    // language: '' / 'latin' (default) or 'zh_hans'. Returns { useCase (sys_id),
    // key, language, ocr, fallback, note } or { useCase: null, note } when no
    // configured use case can read the document as required.
    resolveUseCase: function(kind, language, visual) {
        var lang = language === 'latin' ? '' : String(language || '');
        var routes = NativeDocumentIntelligenceProvider.ROUTES;
        var pick = function(l) {
            for (var i = 0; i < routes.length; i++) {
                if (routes[i].kind === kind && routes[i].language === l && routes[i].visual === !!visual) return routes[i];
            }
            return null;
        };
        if (visual) return { useCase: null, note: 'No visual (image-understanding) extraction use case is configured: Now LLM is text-only.' };
        var route = pick(lang), fallback = false, note = '';
        if (!route && lang) {
            route = pick('');
            fallback = true;
            note = 'No ' + (NativeDocumentIntelligenceProvider.LANGUAGES[lang] || lang) + ' use case for ' + kind + ' documents; read with the Latin OCR model.';
        }
        if (!route) return { useCase: null, note: 'Unknown extraction kind "' + kind + '".' };
        return { useCase: NativeDocumentIntelligenceProvider.USE_CASES[route.useCase], key: route.useCase, language: route.language,
            languageLabel: NativeDocumentIntelligenceProvider.LANGUAGES[route.language], ocr: route.ocr, fallback: fallback, note: note };
    },

    extract: function(intakeSysId, kind) {
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        if (!intake.get(intakeSysId)) return { ok: false, safeError: 'Finance Intake record not found.' };
        var route = this.resolveUseCase(kind, intake.getValue('document_language_hint'), false);
        var useCase = route.useCase;
        if (!useCase) return { ok: false, safeError: route.note };
        var attachment = this._attachment(intakeSysId);
        if (!attachment) return { ok: false, safeError: 'No attachment on this intake record.' };
        var fileName = attachment.getValue('file_name');

        // One task per attachment and reading language: the task name carries
        // the attachment sys_id (and the language), so a replaced document or a
        // changed Document Language Hint starts a new task.
        var taskName = 'BCFA ' + intake.getValue('number') + ' ' + attachment.getUniqueValue() + (route.language ? ' ' + route.language : '');
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
                // Forget the stuck task, so Reprocess starts a new one.
                intake.setValue('extraction_task', '');
                intake.update();
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
        var data = kind === 'ap' ? this._mapInvoice(result.raw) : kind === 'grn' ? this._mapGrn(result.raw) : this._mapAdvice(result.raw);
        data.field_evidence = result.evidence;
        if (result.readerText) {
            data.reader_script_check = result.readerText.summary;
            data.reader_text_counts = result.readerText;
        }
        data.extraction_method = NativeDocumentIntelligenceProvider.LABEL;
        data.extraction_task = taskId;
        // Phase 42: which use case / OCR model read the document.
        data.extraction_use_case = { sys_id: useCase, key: route.key, language: route.languageLabel, ocr_model: route.ocr };
        if (route.fallback) {
            data.warnings = (data.warnings || []).concat([route.note]);
        }
        return { ok: true, data: data, source: NativeDocumentIntelligenceProvider.SOURCE, fileName: fileName, taskId: taskId };
    },

    // The structured result (di_genai_output) and, per field, the value and
    // its bounding-box candidate where the platform mapped one.
    _readResult: function(taskId) {
        var keys = {};
        var key = new GlideRecord('sys_di_key');
        var useCases = [];
        for (var uc in NativeDocumentIntelligenceProvider.USE_CASES) useCases.push(NativeDocumentIntelligenceProvider.USE_CASES[uc]);
        key.addQuery('task_definition', 'IN', useCases.join(','));
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
        return { raw: raw, evidence: evidence, readerText: this.readerScriptCheck(taskId) };
    },

    // Phase 42: characters per script in the text the platform's reader
    // (DocReader) produced for the task. Shows whether the reading step kept
    // the document's script: a Chinese e-invoice whose reader text has no
    // Chinese characters lost its labels and names before extraction. A
    // multi-page document has one reader text per page group: all are counted.
    readerScriptCheck: function(taskId) {
        var o = new GlideRecord('di_genai_output');
        o.addQuery('task', taskId);
        o.query();
        var c = null;
        var add = function(t, key, re) { c[key] += (t.match(re) || []).length; };
        while (o.next()) {
            var j = null;
            try { j = JSON.parse(o.getValue('data') || ''); } catch (e) { j = null; }
            if (!j || j.document_text === undefined) continue;
            var t = String(j.document_text || '');
            if (!c) c = { chinese: 0, korean: 0, thai: 0, devanagari: 0, arabic: 0, latin: 0, length: 0, parts: 0 };
            add(t, 'chinese', /[\u4e00-\u9fff\u3400-\u4dbf]/g);
            add(t, 'korean', /[\uac00-\ud7af\u1100-\u11ff]/g);
            add(t, 'thai', /[\u0e00-\u0e7f]/g);
            add(t, 'devanagari', /[\u0900-\u097f]/g);
            add(t, 'arabic', /[\u0600-\u06ff]/g);
            add(t, 'latin', /[A-Za-z\u00c0-\u024f]/g);
            c.length += t.length;
            c.parts++;
        }
        if (!c) return null;
        c.summary = 'Reader text: ' + c.length + ' characters' + (c.parts > 1 ? ' in ' + c.parts + ' page groups' : '') + ' (Latin ' + c.latin + ', Chinese ' + c.chinese +
            ', Korean ' + c.korean + ', Thai ' + c.thai + ', Devanagari ' + c.devanagari + ', Arabic ' + c.arabic + ').';
        return c;
    },

    // Phase 41: extraction confidence and financial reconciliation are
    // separate. data.confidence reflects only what was read (critical
    // fields present, line quantity / price readable); the arithmetic is a
    // deterministic result of its own (data.reconciliation), so a legitimate
    // charge such as shipping/handling no longer lowers the confidence.
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
        d.tax_components = this._taxComponents(this._array(d.tax_components));
        d.supporting_documents = this._array(d.supporting_documents);
        d.invoice_pages = this._str(d.invoice_pages);
        var checks = this._confidence(d, ['invoice_number', 'vendor_name', 'currency', 'net_amount', 'tax_amount', 'gross_amount']);
        if (d.lines.length) {
            var unreadable = false;
            for (var j = 0; j < d.lines.length; j++) {
                if (d.lines[j].quantity === null || d.lines[j].unit_price === null) unreadable = true;
            }
            if (unreadable) checks.penalty(0.2, 'Line quantity or unit price not readable on at least one line.');
        } else {
            checks.note('No invoice lines were read.');
        }
        d.reconciliation = this.reconcileInvoice(d);
        if (d.reconciliation.result === 'not_reconciled') checks.note(d.reconciliation.detail);
        return checks.finish(d);
    },

    // Gross = net + tax + freight + shipping/handling + surcharge + other
    // charges - discount. A charge the model read that is already inside the
    // net must not count twice, so the readings tried are: everything; net +
    // tax (charges and discount already in the net); net + tax + charges
    // (discount already in the net). The first reading that holds is recorded.
    reconcileInvoice: function(d) {
        var tol = NativeDocumentIntelligenceProvider.RECONCILE_TOLERANCE;
        var n = function(v) { return v === null || v === undefined ? 0 : v; };
        var r2 = function(v) { return Math.round(v * 100) / 100; };
        var charges = r2(n(d.freight_amount) + n(d.shipping_amount) + n(d.surcharge_amount) + n(d.other_charge_amount));
        var out = {
            components: { net: d.net_amount, tax: d.tax_amount, freight: d.freight_amount, shipping_handling: d.shipping_amount,
                surcharge: d.surcharge_amount, other_charges: d.other_charge_amount, discount: d.discount_amount, gross: d.gross_amount },
            charges: charges, discount: r2(n(d.discount_amount)), tolerance: tol
        };
        if (d.net_amount === null || d.gross_amount === null) {
            out.result = 'incomplete';
            out.detail = 'Totals not reconciled: net or gross amount not read.';
            return out;
        }
        var readings = [
            ['net + tax + charges - discount', n(d.net_amount) + n(d.tax_amount) + charges - n(d.discount_amount)],
            ['net + tax (charges and discount included in the net)', n(d.net_amount) + n(d.tax_amount)],
            ['net + tax + charges (discount included in the net)', n(d.net_amount) + n(d.tax_amount) + charges]
        ];
        for (var i = 0; i < readings.length; i++) {
            if (Math.abs(readings[i][1] - d.gross_amount) <= tol) {
                out.result = 'reconciled';
                out.formula = readings[i][0];
                out.expected = r2(readings[i][1]);
                out.variance = r2(d.gross_amount - readings[i][1]);
                out.detail = 'Totals reconcile: ' + readings[i][0] + ' = ' + out.expected + ' (printed total ' + d.gross_amount + ').';
                break;
            }
        }
        if (!out.result) {
            out.result = 'not_reconciled';
            out.formula = readings[0][0];
            out.expected = r2(readings[0][1]);
            out.variance = r2(d.gross_amount - readings[0][1]);
            out.detail = 'Totals do not reconcile: net ' + d.net_amount + ' + tax ' + n(d.tax_amount) + ' + charges ' + charges + ' - discount ' + n(d.discount_amount) +
                ' = ' + out.expected + ', printed total ' + d.gross_amount + ' (difference ' + out.variance + ').';
        }
        if (d.lines.length) {
            var lineTotal = 0;
            for (var j = 0; j < d.lines.length; j++) lineTotal += d.lines[j].net_amount || 0;
            out.lines = { total: r2(lineTotal), net: d.net_amount, agree: Math.abs(lineTotal - d.net_amount) <= tol || Math.abs(lineTotal - (d.net_amount + charges)) <= tol };
        }
        return out;
    },

    _taxComponents: function(list) {
        var out = [];
        for (var i = 0; i < list.length; i++) {
            var t = list[i] || {};
            var label = this._str(t.printed_label);
            out.push({ printed_label: label, normalized_tax_type: this._taxType(label), rate: this._num(t.rate), taxable_base: this._num(t.taxable_base), amount: this._num(t.amount) });
        }
        return out;
    },

    // Printed tax label -> normalized type (presentation and evidence only;
    // tax validation stays in FinancePolicy / MatchingEngine.evaluateTax).
    _taxType: function(label) {
        var s = String(label || '').toUpperCase();
        if (/IGST/.test(s)) return 'IGST';
        if (/CGST/.test(s)) return 'CGST';
        if (/SGST|UTGST/.test(s)) return 'SGST';
        if (/TDS/.test(s)) return 'TDS';
        if (/WITHHOLD|WHT|RETEN/.test(s)) return 'WHT';
        if (/\bGST\b/.test(s)) return 'GST';
        if (/SALES TAX|STATE TAX|COUNTY TAX|CITY TAX|\bPST\b|\bQST\b|\bRST\b/.test(s)) return 'SALES_TAX';
        if (/VAT|IVA|TVA|MWST|UST|ÁFA|AFA|增值税|부가세|부가가치세|ภาษีมูลค่าเพิ่ม/.test(s)) return 'VAT';
        if (/ICMS|IPI|PIS|COFINS|ISS/.test(s)) return 'OTHER_TAX';
        return s ? 'OTHER_TAX' : '';
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
                invoice_reference: ref, document_number: this._str(l.document_number), invoice_date: this._str(l.invoice_date),
                customer_reference: this._str(l.customer_reference), invoice_amount: this._num(l.invoice_amount),
                advance_amount: this._num(l.advance_amount), tds_amount: this._num(l.tds_amount),
                amount_applied: this._num(l.amount_applied), deduction_amount: this._num(l.deduction_amount), deduction_reason: this._str(l.deduction_reason)
            });
            if (ref) d.invoice_references.push(ref);
        }
        var checks = this._confidence(d, ['customer_name', 'payment_reference', 'payment_amount', 'currency']);
        if (!d.invoice_lines.length) checks.note('No invoice references were read.');
        d.reconciliation = this.reconcileAdvice(d);
        if (d.reconciliation.result === 'not_reconciled') checks.note(d.reconciliation.detail);
        // The advice's own deduction statement is evidence only: the residual
        // is computed by the allocation, never taken from the document.
        return checks.finish(d);
    },

    // Phase 42: a goods receipt reading. Critical values (GRN, PO, quantity)
    // are judged by DocumentEvidenceService; nothing here is authoritative.
    _mapGrn: function(raw) {
        var d = this._mapFields(raw, NativeDocumentIntelligenceProvider.FIELDS.grn);
        d.raw = raw;
        var checks = this._confidence(d, ['grn_number', 'po_number', 'quantity_received']);
        return checks.finish(d);
    },

    // Per invoice: gross - advance - TDS - other deductions = paid (where the
    // advice prints them); overall: sum of amounts paid = payment amount.
    reconcileAdvice: function(d) {
        var tol = NativeDocumentIntelligenceProvider.RECONCILE_TOLERANCE;
        var n = function(v) { return v === null || v === undefined ? 0 : v; };
        var r2 = function(v) { return Math.round(v * 100) / 100; };
        var out = { lines: [], tolerance: tol };
        var applied = 0, allApplied = d.invoice_lines.length > 0, lineIssues = [];
        for (var i = 0; i < d.invoice_lines.length; i++) {
            var l = d.invoice_lines[i];
            if (l.amount_applied === null) allApplied = false;
            applied += n(l.amount_applied);
            if (l.invoice_amount !== null && l.amount_applied !== null) {
                var expected = r2(l.invoice_amount - n(l.advance_amount) - n(l.tds_amount) - n(l.deduction_amount));
                var ok = Math.abs(expected - l.amount_applied) <= tol;
                out.lines.push({ invoice: l.invoice_reference, gross: l.invoice_amount, advance: l.advance_amount, tds: l.tds_amount,
                    other_deduction: l.deduction_amount, paid: l.amount_applied, expected_paid: expected, ok: ok });
                if (!ok) lineIssues.push(l.invoice_reference + ': gross ' + l.invoice_amount + ' - advance ' + n(l.advance_amount) + ' - TDS ' + n(l.tds_amount) +
                    ' - deduction ' + n(l.deduction_amount) + ' = ' + expected + ', printed paid ' + l.amount_applied);
            }
        }
        out.total_paid = r2(applied);
        out.payment_amount = d.payment_amount;
        if (!allApplied || d.payment_amount === null) {
            out.result = 'incomplete';
            out.detail = 'Advice not fully reconciled: the amount paid per invoice or the payment amount was not read.';
        } else if (Math.abs(applied - d.payment_amount) > tol) {
            out.result = 'not_reconciled';
            out.detail = 'Amounts paid per invoice (' + out.total_paid + ') do not add up to the payment amount (' + d.payment_amount + ').';
        } else if (lineIssues.length) {
            out.result = 'not_reconciled';
            out.detail = 'Invoice lines do not reconcile: ' + lineIssues.join('; ') + '.';
        } else {
            out.result = 'reconciled';
            out.detail = 'Advice reconciles: amounts paid per invoice add up to the payment amount ' + d.payment_amount + '.';
        }
        return out;
    },

    _mapFields: function(raw, map) {
        var d = {}, normalization = [];
        for (var k in map) d[map[k]] = null;
        for (var rawKey in raw) {
            var field = map[this._norm(rawKey)];
            if (!field) continue;
            var v = raw[rawKey];
            if (field === 'lines' || field === 'invoice_lines' || field === 'tax_components' || field === 'supporting_documents') d[field] = v;
            else if (NativeDocumentIntelligenceProvider.NUMERIC.indexOf(field) >= 0) {
                d[field] = this._num(v);
                // Phase 41: the printed value and the rule are kept (only
                // for a value that was read: an empty field is not normalized).
                if (typeof v === 'string' && /\d/.test(v) && !/^\s*-?\d+(\.\d+)?\s*$/.test(v) && String(d[field]) !== v) {
                    normalization.push({ field: field, original: v, normalized: d[field], rule: this._numRule(v) });
                }
            } else if (NativeDocumentIntelligenceProvider.DATES.indexOf(field) >= 0) {
                // Phase 42: 2026年09月15日, 2026.09.15, full-width digits -> 2026-09-15
                var date = this.normalizeDate(v);
                d[field] = date.value;
                if (date.rule) normalization.push({ field: field, original: this._str(v), normalized: date.value, rule: date.rule });
            } else d[field] = this._str(v);
        }
        if (d.currency !== undefined) {
            var cur = this.normalizeCurrency(d.currency, d.document_language);
            if (cur.rule) normalization.push({ field: 'currency', original: d.currency, normalized: cur.value, rule: cur.rule });
            d.currency = cur.value;
        }
        d.normalization = normalization;
        return d;
    },

    // Phase 42: a date as printed or as returned -> YYYY-MM-DD. Accepts
    // full-width digits and the Chinese / Japanese / Korean year-month-day
    // forms (2026年9月15日, 2026년 9월 15일) and year-first forms with . / -.
    // A day-first or month-first date is left as returned (the field
    // descriptions ask the model to convert it with the document locale; an
    // ambiguous order is never guessed here). Returns { value, rule }.
    normalizeDate: function(v) {
        var s = this._str(v);
        if (!s) return { value: '', rule: '' };
        var f = MatchingEngine.foldFullWidth(s.normalize ? s.normalize('NFKC') : s);
        var m = f.match(/^(\d{4})\s*[年년.\/\-]\s*(\d{1,2})\s*[月월.\/\-]\s*(\d{1,2})\s*[日일]?$/);
        if (!m) return { value: s, rule: '' };
        var mm = parseInt(m[2], 10), dd = parseInt(m[3], 10);
        if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return { value: s, rule: '' };
        var out = m[1] + '-' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd;
        return { value: out, rule: out === s ? '' : 'year-month-day date normalized (full-width digits, 年月日 / 년월일, . or / separators)' };
    },

    // Phase 42: currency as returned -> ISO 4217. RMB / 人民币 / 元 -> CNY;
    // ¥ / ￥ -> CNY only on a Chinese-language document (the same sign is
    // used for JPY), otherwise left as returned (not guessed). Returns
    // { value, rule }.
    normalizeCurrency: function(v, language) {
        var s = this._str(v);
        var f = MatchingEngine.foldFullWidth(s.normalize ? s.normalize('NFKC') : s).toUpperCase().replace(/\s+/g, '');
        if (!f) return { value: '', rule: '' };
        if (f === 'RMB' || f === '人民币' || f === '人民幣' || f === '元' || f === 'CN¥') return { value: 'CNY', rule: 'Chinese currency name -> CNY' };
        if (/^[A-Z]{3}$/.test(f)) return { value: f, rule: f === s ? '' : 'currency code upper-cased / full-width folded' };
        if ((f === '¥' || f === 'YEN') && /chinese|中文/i.test(String(language || ''))) return { value: 'CNY', rule: '¥ on a Chinese-language document -> CNY' };
        return { value: s, rule: '' };
    },

    _numRule: function(v) {
        var s = String(v).replace(/[^0-9.,\-]/g, '');
        var lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
        if (lastComma > lastDot && s.length - lastComma - 1 <= 2) return 'decimal comma, "." / space grouping (e.g. 1.234,56)';
        if (lastDot > lastComma && s.length - lastDot - 1 <= 2) return 'decimal point, "," / space grouping (e.g. 1,234.56)';
        return 'grouping separators and symbols removed';
    },

    // Extraction confidence: starts at 1 and loses 0.2 per missing critical
    // field plus readability penalties. Notes (reconciliation, missing lines)
    // are reported but do not change the confidence.
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
            note: function(warning) { warnings.push(warning); },
            finish: function(data) {
                data.confidence = Math.max(0, Math.round(score * 100) / 100);
                data.confidence_basis = 'Derived by BCFA from field completeness and readability; Document Intelligence generative extraction returns no per-field confidence. ' +
                    'Financial arithmetic is reported separately (reconciliation) and does not change it.';
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
        // Phase 42: full-width digits and separators (１２３，４５６．７８) fold first.
        var folded = MatchingEngine.foldFullWidth(String(v));
        if (folded.normalize) folded = folded.normalize('NFKC');
        var s = folded.replace(/[^0-9.,\-]/g, '');
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
