// Phase 42: document evidence (stamp / seal / chop presence, handwriting) and
// goods receipt (GRN) documents read as evidence.
//
// Principles:
//   - Presence, never authenticity: BCFA does not claim a stamp is genuine.
//   - What the reading can establish depends on the platform capability
//     (FinancePolicy.stampDetectionCapability). Measured on this instance
//     (2026-10-14): Document Intelligence returns document text only. A stamp
//     answer from text is a best-effort hint (a printed label such as
//     "Customer's Seal and Signature" reads like a stamp), so it never
//     confirms or rejects a required stamp; a person does.
//   - Whether a stamp is required is governed configuration (BCFA Document
//     Evidence Requirement decision table), not code and not country logic
//     spread through the services.
//   - The AI / OCR finding is kept unchanged next to the human decision
//     (Document Evidence Review rows are append-only).
//   - A handwritten GRN is evidence: it is compared with the authoritative
//     (mock SAP) receipt and never creates or changes it.
var DocumentEvidenceService = Class.create();

DocumentEvidenceService.CRITICAL_GRN_FIELDS = ['grn_number', 'po_number', 'quantity_received'];

DocumentEvidenceService.prototype = {
    initialize: function() {
        this.policy = new FinancePolicy();
        this.auditEngine = new AuditEngine();
    },

    // ---- Extraction finding -> evidence fields ----------------------------

    // YES / NO / UNCERTAIN (any case, Chinese 是 / 否 too) -> yes / no /
    // uncertain; '' when nothing was answered.
    _answer: function(v) {
        var s = String(v === null || v === undefined ? '' : v).replace(/^\s+|\s+$/g, '').toLowerCase();
        if (!s) return '';
        if (s === 'yes' || s === 'y' || s === 'true' || s === '是' || s === '有') return 'yes';
        if (s === 'no' || s === 'n' || s === 'false' || s === '否' || s === '无') return 'no';
        return 'uncertain';
    },

    // The stamp evidence of a reading. data: the extraction contract
    // (stamp_present_read, stamp_type_read, stamp_text, stamp_page,
    // stamp_count). Returns the evidence field values.
    stampEvidence: function(data) {
        data = data || {};
        var capability = this.policy.stampDetectionCapability();
        var answer = this._answer(data.stamp_present_read);
        var finding = 'Extraction answered "' + (data.stamp_present_read || 'nothing') + '"' +
            (data.stamp_text ? '; stamp text read: "' + data.stamp_text + '"' : '') +
            (data.stamp_count !== null && data.stamp_count !== undefined && data.stamp_count !== '' ? '; count: ' + data.stamp_count : '') +
            (data.stamp_page ? '; page: ' + data.stamp_page : '') +
            ' (reading method: ' + (capability === 'native_visual' ? 'native visual reading' : 'document text only, no image understanding') + ').';
        var out = {
            stamp_text: String(data.stamp_text || '').substring(0, 400),
            stamp_page: String(data.stamp_page || '').substring(0, 40),
            stamp_count: this._int(data.stamp_count),
            stamp_type: this._stampType(data.stamp_type_read),
            stamp_ai_finding: finding.substring(0, 1000)
        };
        if (capability === 'native_visual') {
            out.stamp_detection_method = 'native_visual';
            out.stamp_present = answer || 'uncertain';
            out.stamp_evidence_status = answer === 'yes' ? 'confirmed_by_native_visual' : answer === 'no' ? 'not_detected' : 'uncertain';
        } else {
            // Text only: neither a YES nor a NO is evidence of what is on the
            // page (stamps without readable text, lost scripts, labels).
            out.stamp_detection_method = 'ocr_text';
            out.stamp_present = 'uncertain';
            out.stamp_evidence_status = answer === 'yes' ? 'detected_best_effort' : 'uncertain';
        }
        return out;
    },

    // Handwriting of a reading: data.handwriting_present_read and
    // data.handwritten_values. With text-only reading, "no handwriting" is not
    // evidence (measured: handwritten PO / SE numbers on CS-01 were not seen).
    handwritingEvidence: function(data) {
        data = data || {};
        var capability = this.policy.stampDetectionCapability();
        var answer = this._answer(data.handwriting_present_read);
        var values = this._handwrittenText(data.handwritten_values);
        var status;
        if (values) status = 'partially_readable'; // text-only reading cannot show that all handwriting was read
        else if (answer === 'yes') status = 'not_readable';
        else if (answer === 'no' && capability === 'native_visual') status = 'none';
        else status = 'unknown';
        if (values && capability === 'native_visual' && answer === 'yes') status = 'readable';
        return { handwriting_status: status, handwritten_values: values.substring(0, 1000) };
    },

    // Writes the reading's evidence on a new AP invoice (caller updates).
    applyReadingToInvoice: function(invoice, data) {
        var stamp = this.stampEvidence(data);
        for (var k in stamp) if (stamp[k] !== null && stamp[k] !== undefined) invoice.setValue(k, stamp[k]);
        var hw = this.handwritingEvidence(data);
        invoice.setValue('handwriting_status', hw.handwriting_status);
        invoice.setValue('handwritten_values', hw.handwritten_values);
        if (data.vendor_tax_id) invoice.setValue('printed_vendor_tax_id', String(data.vendor_tax_id).substring(0, 60));
        return { stamp: stamp, handwriting: hw };
    },

    // ---- Stamp requirement and validation (AP) ----------------------------

    requirementFor: function(invoice) {
        var country = '';
        if (invoice.getValue('vendor')) {
            var vendor = new GlideRecord('x_695068_bcfa_vendor');
            if (vendor.get(invoice.getValue('vendor'))) country = vendor.getValue('country') || '';
        }
        if (!country) country = invoice.getValue('document_country') || '';
        var req = this.policy.documentEvidenceRequirement({
            country: country, documentType: 'ap_invoice', company: invoice.getValue('company_code') || '',
            vendorType: 'standard', invoiceType: invoice.getValue('purchase_order') || invoice.getValue('printed_po_number') ? 'po' : 'non_po'
        });
        req.country = country;
        return req;
    },

    // Sets stamp_required / stamp_validation_* on the invoice (and saves it)
    // and returns { failure, summary } for ApDomainService.validateInvoice.
    evaluateStamp: function(invoice) {
        var req = this.requirementFor(invoice);
        var status = invoice.getValue('stamp_evidence_status');
        var present = invoice.getValue('stamp_present');
        var result, detail, failure = null;
        if (!req.stampRequired) {
            result = 'not_required';
            detail = 'No stamp required for this invoice (country "' + (req.country || 'not known') + '"; ' + req.source + ').';
        } else if (status === 'human_confirmed' || (status === 'confirmed_by_native_visual' && present === 'yes')) {
            result = 'passed';
            detail = 'Required company stamp present: ' + (status === 'human_confirmed' ? 'confirmed by ' + invoice.getDisplayValue('evidence_reviewed_by') : 'native visual reading') +
                ' (presence only, not authenticity; ' + req.source + ').';
        } else if (status === 'human_rejected' || (status === 'not_detected' && present === 'no')) {
            result = 'missing';
            detail = 'A visible company stamp is required for this invoice (' + req.source + '), but ' +
                (status === 'human_rejected' ? 'the reviewer recorded that there is none' : 'the native visual reading found none') + '.';
            failure = { reasonCode: 'document_evidence_missing', description: detail + ' Obtain a stamped invoice from the vendor or reject it.' };
        } else {
            result = 'review_required';
            detail = 'A visible company stamp is required for this invoice (' + req.source + '). The reading cannot confirm it: ' +
                (invoice.getValue('stamp_ai_finding') || 'no stamp finding recorded') + ' Open the document, check for the stamp and record a Document Evidence ' +
                'Review (stamp present: yes / no), then Re-run Validation.';
            failure = { reasonCode: 'document_evidence_review', description: detail };
        }
        invoice.setValue('stamp_required', req.stampRequired);
        invoice.setValue('stamp_validation_result', result);
        invoice.setValue('stamp_validation_detail', detail.substring(0, 1000));
        invoice.setValue('visual_review_required', result === 'review_required' || result === 'missing');
        invoice.update();
        return { failure: failure, summary: result + ' - ' + detail };
    },

    // ---- Human review (Document Evidence Review rows) ---------------------

    // Before insert: identity, time and the AI value are recorded by the
    // system; the reviewer's value is checked. Returns an error message or ''.
    captureReview: function(review) {
        var item = review.getValue('evidence_item');
        var human = String(review.getValue('human_value') || '').replace(/^\s+|\s+$/g, '');
        if (!review.getValue('ap_invoice') && !review.getValue('grn_extraction')) return 'Choose the AP invoice or the GRN extraction this review belongs to.';
        if (item === 'stamp_present') {
            var v = this._answer(human);
            if (v !== 'yes' && v !== 'no') return 'Stamp present: enter yes or no (look at the document; if you cannot tell, ask the vendor for a clear copy).';
            review.setValue('human_value', v);
        }
        if (!String(review.getValue('reason') || '').replace(/\s+/g, '')) return 'Give the reason for the decision.';
        review.setValue('reviewer', gs.getUserID());
        review.setValue('reviewed_on', new GlideDateTime().getValue());
        review.setValue('ai_value', this._aiValue(review, item).substring(0, 1000));
        return '';
    },

    _aiValue: function(review, item) {
        if (review.getValue('ap_invoice')) {
            var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
            if (!inv.get(review.getValue('ap_invoice'))) return '';
            if (item === 'stamp_present') return (inv.getDisplayValue('stamp_evidence_status') || 'no finding') + '. ' + (inv.getValue('stamp_ai_finding') || '');
            if (item === 'stamp_text') return inv.getValue('stamp_text') || '';
            return '';
        }
        var grn = new GlideRecord('x_695068_bcfa_grn_extraction');
        if (!grn.get(review.getValue('grn_extraction'))) return '';
        if (item === 'stamp_present') return grn.getValue('stamp_present') || '';
        return grn.isValidField(item) ? (grn.getValue(item) || '') : '';
    },

    // After insert: the decision is applied to the AP invoice / GRN
    // extraction (the AI finding fields stay as read) and audited.
    applyReview: function(review) {
        var item = review.getValue('evidence_item');
        var human = review.getValue('human_value');
        if (review.getValue('ap_invoice')) {
            var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
            if (!inv.get(review.getValue('ap_invoice'))) return;
            if (item === 'stamp_present') {
                inv.setValue('stamp_present', human);
                inv.setValue('stamp_evidence_status', human === 'yes' ? 'human_confirmed' : 'human_rejected');
                inv.setValue('stamp_detection_method', 'human');
            } else if (item === 'stamp_text') {
                inv.setValue('stamp_text', String(human).substring(0, 400));
            }
            inv.setValue('evidence_reviewed_by', review.getValue('reviewer'));
            inv.setValue('evidence_reviewed_on', review.getValue('reviewed_on'));
            inv.setValue('evidence_review_decision', (review.getDisplayValue('evidence_item') + ': ' + human + ' - ' + review.getValue('reason')).substring(0, 400));
            inv.update();
            this.auditEngine.logEvent({
                correlationId: inv.getValue('correlation_id'), sourceTable: 'x_695068_bcfa_ap_invoice', sourceRecord: inv.getUniqueValue(),
                eventType: 'human_review', actorType: 'user', reason: review.getValue('reason'),
                description: 'Document evidence reviewed on AP invoice ' + inv.getValue('invoice_number') + ': ' + review.getDisplayValue('evidence_item') +
                    ' = ' + human + ' (AI / OCR value kept: ' + (review.getValue('ai_value') || 'none') + '). Presence only, not authenticity.',
                beforeValue: { ai_value: review.getValue('ai_value') }, afterValue: { evidence_item: item, human_value: human }
            });
            return;
        }
        var grn = new GlideRecord('x_695068_bcfa_grn_extraction');
        if (!grn.get(review.getValue('grn_extraction'))) return;
        grn.setValue('review_status', 'reviewed');
        grn.update();
        this.compareGrn(grn.getUniqueValue());
        this.auditEngine.logEvent({
            sourceTable: 'x_695068_bcfa_grn_extraction', sourceRecord: grn.getUniqueValue(), process: 'ap',
            eventType: 'human_review', actorType: 'user', reason: review.getValue('reason'),
            description: 'GRN evidence reviewed: ' + review.getDisplayValue('evidence_item') + ' = ' + human + ' (read value kept: ' +
                (review.getValue('ai_value') || 'not read') + '). The SAP receipt was not changed.',
            beforeValue: { ai_value: review.getValue('ai_value') }, afterValue: { evidence_item: item, human_value: human }
        });
    },

    // ---- Goods receipt (GRN) documents ------------------------------------

    // Records a GRN reading as evidence and compares it with the SAP
    // receipt. Never creates or updates x_695068_bcfa_receipt. Returns the
    // grn_extraction sys_id and the outcome.
    recordGrnReading: function(intakeSysId, data, taskId) {
        data = data || {};
        var g = new GlideRecord('x_695068_bcfa_grn_extraction');
        g.initialize();
        g.setValue('finance_intake', intakeSysId);
        var fields = ['grn_number', 'po_number', 'vendor_name', 'receipt_date', 'plant', 'material_description', 'material_code', 'po_line',
            'quantity_received', 'uom', 'received_by', 'remarks', 'handwritten_values', 'document_language'];
        for (var i = 0; i < fields.length; i++) {
            if (data[fields[i]] !== null && data[fields[i]] !== undefined) g.setValue(fields[i], String(data[fields[i]]).substring(0, 1000));
        }
        g.setValue('signature_present', this._answer(data.signature_present_read) || 'uncertain');
        g.setValue('stamp_present', this._answer(data.stamp_present_read) || 'uncertain');
        g.setValue('handwritten_text_present', this._answer(data.handwriting_present_read) || 'uncertain');
        var missing = [];
        for (var c = 0; c < DocumentEvidenceService.CRITICAL_GRN_FIELDS.length; c++) {
            var f = DocumentEvidenceService.CRITICAL_GRN_FIELDS[c];
            if (!String(data[f] || '').replace(/\s+/g, '')) missing.push(f);
        }
        var handwritten = this._answer(data.handwriting_present_read) === 'yes' || !!this._handwrittenText(data.handwritten_values);
        var status = missing.length === DocumentEvidenceService.CRITICAL_GRN_FIELDS.length ? 'not_readable'
            : missing.length ? 'partially_readable' : handwritten ? 'handwriting_readable' : 'printed_readable';
        g.setValue('reading_status', status);
        g.setValue('critical_fields_missing', missing.join(', '));
        g.setValue('raw_extraction', JSON.stringify(data.raw || data));
        g.setValue('extraction_task', taskId || '');
        g.setValue('read_on', new GlideDateTime().getValue());
        g.setValue('review_status', 'review_required');
        var id = g.insert();
        var cmp = this.compareGrn(id);
        this.auditEngine.logEvent({
            sourceTable: 'x_695068_bcfa_grn_extraction', sourceRecord: id, process: 'ap', eventType: 'document_extracted', actorType: 'system',
            description: 'Goods receipt document read as evidence: ' + status + (missing.length ? ' (not read: ' + missing.join(', ') + ')' : '') +
                '; ' + cmp.detail + ' No receipt was created or changed.',
            afterValue: { grn_number: data.grn_number || '', po_number: data.po_number || '', quantity_received: data.quantity_received || '', reading_status: status }
        });
        return { grnExtractionSysId: id, readingStatus: status, missing: missing, comparison: cmp };
    },

    // Compares the GRN evidence (reviewer values where recorded, else the
    // read values) with the SAP receipt of the same number.
    compareGrn: function(grnExtractionSysId) {
        var g = new GlideRecord('x_695068_bcfa_grn_extraction');
        if (!g.get(grnExtractionSysId)) return { result: 'not_compared', detail: 'GRN extraction not found.' };
        var v = this._grnValues(g);
        var me = new MatchingEngine();
        var result, detail, receiptId = '';
        if (!v.grn_number) {
            result = 'not_compared';
            detail = 'GRN number not read: not compared with SAP.';
        } else {
            var wanted = me.normalizeInvoiceNumber(v.grn_number);
            var r = new GlideRecord('x_695068_bcfa_receipt');
            r.query();
            var found = null;
            while (r.next()) {
                if (me.normalizeInvoiceNumber(r.getValue('receipt_number')) === wanted) { found = r.getUniqueValue(); break; }
            }
            if (!found) {
                result = 'no_authoritative_receipt';
                detail = 'No SAP receipt ' + v.grn_number + ' exists: the document is evidence only, nothing was created.';
            } else {
                r.get(found);
                receiptId = found;
                var diffs = [];
                var sapQty = parseFloat(r.getValue('quantity') || '');
                var readQty = new NativeDocumentIntelligenceProvider()._num(v.quantity_received);
                if (readQty !== null && !isNaN(sapQty) && Math.abs(readQty - sapQty) > 0.0001) diffs.push('quantity ' + readQty + ' vs SAP ' + sapQty);
                if (readQty === null) diffs.push('quantity not read');
                var sapPo = '';
                var pl = new GlideRecord('x_695068_bcfa_po_line');
                if (r.getValue('po_line') && pl.get(r.getValue('po_line'))) {
                    var po = new GlideRecord('x_695068_bcfa_purchase_order');
                    if (po.get(pl.getValue('purchase_order'))) sapPo = po.getValue('po_number');
                }
                if (v.po_number && sapPo && me.normalizeInvoiceNumber(v.po_number) !== me.normalizeInvoiceNumber(sapPo)) diffs.push('PO ' + v.po_number + ' vs SAP ' + sapPo);
                if (!v.po_number) diffs.push('PO not read');
                result = diffs.length ? 'differs' : 'matches';
                detail = diffs.length ? 'SAP receipt ' + r.getValue('receipt_number') + ' differs: ' + diffs.join('; ') + '.'
                    : 'Matches SAP receipt ' + r.getValue('receipt_number') + ' (PO ' + sapPo + ', quantity ' + sapQty + ').';
            }
        }
        g.setValue('sap_receipt', receiptId);
        g.setValue('comparison_result', result);
        g.setValue('comparison_detail', detail.substring(0, 1000));
        g.update();
        return { result: result, detail: detail };
    },

    // The latest reviewer value per item overrides the read value.
    _grnValues: function(g) {
        var v = { grn_number: g.getValue('grn_number') || '', po_number: g.getValue('po_number') || '', quantity_received: g.getValue('quantity_received') || '' };
        var rv = new GlideRecord('x_695068_bcfa_document_evidence_review');
        rv.addQuery('grn_extraction', g.getUniqueValue());
        rv.orderBy('reviewed_on');
        rv.query();
        while (rv.next()) {
            if (v.hasOwnProperty(rv.getValue('evidence_item'))) v[rv.getValue('evidence_item')] = rv.getValue('human_value');
        }
        return v;
    },

    // ---- helpers ------------------------------------------------------------

    // The handwritten values as read, or '' when none were reported: an empty
    // JSON list ("[]", as the extraction answers for "no handwriting") or a
    // list whose entries carry no value is not handwriting.
    _handwrittenText: function(v) {
        var s = String(v === null || v === undefined ? '' : v).replace(/^\s+|\s+$/g, '');
        if (!s || s === 'null') return '';
        if (s.charAt(0) === '[') {
            try {
                var list = JSON.parse(s);
                var any = false;
                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    if (item && (typeof item !== 'object' || (item.value !== null && item.value !== undefined && String(item.value) !== '') ||
                        String(item.legibility || '').toUpperCase() === 'UNREADABLE')) any = true;
                }
                return any ? s : '';
            } catch (e) {
                return s;
            }
        }
        return s;
    },

    _stampType: function(v) {
        var s = String(v || '').toLowerCase();
        if (!s) return '';
        if (/发票专用章|invoice/.test(s)) return 'invoice_seal';
        if (/财务专用章|finance/.test(s)) return 'finance_seal';
        if (/税|tax/.test(s)) return 'tax_seal';
        if (/公章|chop/.test(s)) return 'company_chop';
        if (/seal|章|印/.test(s)) return 'company_seal';
        return /unknown|uncertain/.test(s) ? 'unknown' : 'other';
    },

    _int: function(v) {
        var n = parseInt(MatchingEngine.foldFullWidth(String(v === null || v === undefined ? '' : v)), 10);
        return isNaN(n) ? null : n;
    },

    type: 'DocumentEvidenceService'
};
