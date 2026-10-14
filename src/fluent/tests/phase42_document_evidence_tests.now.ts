import { Test } from '@servicenow/sdk/core'

// Phase 42: client document hardening (docs/OCR_VISUAL_DOCUMENT_READINESS.md).
// Deterministic: every test creates its own data (ATF rolls it back); no
// document extraction call (readings are fixed test data), no SAP call, no AI.
// These tests prove the BCFA logic around a reading; they do not prove what
// the platform's reader can read (see docs/CHINESE_DOCUMENT_TEST_RESULTS.md).

Test(
    { $id: Now.ID['test-h42-unicode'], name: 'H42-UNI Names and references keep Chinese, Korean, Hindi, Arabic, Thai and accented text; full-width forms fold', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h42-unicode-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var me = new MatchingEngine();
                    var cn = '上海测试化工有限公司';
                    assertEqual({ name: 'Chinese name kept (the Phase 41 ASCII-only key was empty)', shouldbe: cn, value: me.canonicalText(cn) });
                    assertEqual({ name: 'Chinese name with full-width / ASCII parentheses compares equal', shouldbe: me.normalizeName(cn + '(分公司)'), value: me.normalizeName(cn + '（分公司）') });
                    assertEqual({ name: 'two different Chinese names stay different', shouldbe: false, value: me.normalizeName(cn) === me.normalizeName('北京测试化工有限公司') });
                    assertEqual({ name: 'Korean kept', shouldbe: '한국카본 주식회사', value: me.canonicalText(' 한국카본  주식회사 ') });
                    assertEqual({ name: 'Hindi composed / decomposed forms compare equal', shouldbe: me.normalizeName('बिड़ला कार्बन'), value: me.normalizeName('बिड़ला कार्बन') });
                    assertEqual({ name: 'Hindi not emptied', shouldbe: true, value: me.normalizeName('बिड़ला कार्बन').length > 5 });
                    assertEqual({ name: 'Arabic kept', shouldbe: 'شركة الكربون', value: me.canonicalText('شركة الكربون') });
                    assertEqual({ name: 'Thai kept', shouldbe: 'บริษัท เบอร์ล่า', value: me.canonicalText('บริษัท เบอร์ล่า') });
                    assertEqual({ name: 'accents kept, upper-cased', shouldbe: 'SOCIÉTÉ GÉNÉRALE', value: me.canonicalText('Société  Générale') });
                    assertEqual({ name: 'full-width letters, digits and space fold', shouldbe: 'ABC 123', value: me.canonicalText('ＡＢＣ　１２３') });
                    assertEqual({ name: 'invoice number with full-width digits and separators', shouldbe: me.normalizeInvoiceNumber('NO 2026-001'), value: me.normalizeInvoiceNumber('No.２０２６－００１') });
                    assertEqual({ name: 'spacing / punctuation still ignored (Phase 41)', shouldbe: me.normalizeName('D. Sureshprasad'), value: me.normalizeName('D . SURESHPRASAD') });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h42-numbers'], name: 'H42-NUM Chinese / CJK dates, CNY currency forms and full-width amounts normalize; ambiguous forms are not guessed', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h42-numbers-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var p = new NativeDocumentIntelligenceProvider();
                    assertEqual({ name: '2026年9月15日', shouldbe: '2026-09-15', value: p.normalizeDate('2026年9月15日').value });
                    assertEqual({ name: 'full-width ２０２６年０９月１５日', shouldbe: '2026-09-15', value: p.normalizeDate('２０２６年０９月１５日').value });
                    assertEqual({ name: '2026.09.15', shouldbe: '2026-09-15', value: p.normalizeDate('2026.09.15').value });
                    assertEqual({ name: 'Korean 2026년 9월 15일', shouldbe: '2026-09-15', value: p.normalizeDate('2026년 9월 15일').value });
                    assertEqual({ name: 'day-first 15/09/2026 left as read (not guessed)', shouldbe: '15/09/2026', value: p.normalizeDate('15/09/2026').value });
                    assertEqual({ name: 'normalization keeps the rule for audit', shouldbe: true, value: !!p.normalizeDate('2026年9月15日').rule });
                    assertEqual({ name: 'RMB -> CNY', shouldbe: 'CNY', value: p.normalizeCurrency('RMB').value });
                    assertEqual({ name: '人民币 -> CNY', shouldbe: 'CNY', value: p.normalizeCurrency('人民币').value });
                    assertEqual({ name: '￥ on a Chinese document -> CNY', shouldbe: 'CNY', value: p.normalizeCurrency('￥', 'Chinese').value });
                    assertEqual({ name: '¥ on a Japanese document is not turned into CNY', shouldbe: '¥', value: p.normalizeCurrency('¥', 'Japanese').value });
                    assertEqual({ name: 'cny -> CNY', shouldbe: 'CNY', value: p.normalizeCurrency('cny').value });
                    assertEqual({ name: 'full-width amount ￥１２，３４５．６７', shouldbe: 12345.67, value: p._num('￥１２，３４５．６７') });
                    assertEqual({ name: 'amount 69,540.00', shouldbe: 69540, value: p._num('69,540.00') });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h42-vendor'], name: 'H42-VEN Vendor resolution precedence: code, tax ID, PO vendor, alias, printed name; conflicts and ambiguity go to a person', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h42-vendor-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var tag = 'V42' + gs.generateGUID().substring(0, 6).toUpperCase();
                    var mk = function(code, name, tax) { var v = new GlideRecord('x_695068_bcfa_vendor'); v.initialize(); v.setValue('vendor_code', code); v.setValue('name', name);
                        v.setValue('tax_registration_number', tax || ''); v.setValue('country', 'China'); v.setValue('active', true); return v.insert(); };
                    var cnName = '上海测试化工有限公司' + tag;
                    var a = mk(tag + 'A', cnName, '91310000' + tag);
                    var b = mk(tag + 'B', 'Other Vendor ' + tag, '');
                    var me = new MatchingEngine();
                    assertEqual({ name: 'vendor code first', shouldbe: b + '|vendor_code', value: (function(r) { return r.vendorSysId + '|' + r.method; })(me.resolveVendor(tag + 'B', cnName, { taxId: '91310000' + tag })) });
                    var t = me.resolveVendor('', 'unreadable', { taxId: ' 91310000' + tag.toLowerCase() + ' ' });
                    assertEqual({ name: 'tax ID (case / spacing ignored)', shouldbe: a + '|tax_registration_number', value: t.vendorSysId + '|' + t.method });
                    var po = new GlideRecord('x_695068_bcfa_purchase_order'); po.initialize(); po.setValue('po_number', 'PO' + tag); po.setValue('vendor', a); po.setValue('currency', 'CNY'); po.setValue('status', 'open'); po.insert();
                    var p = me.resolveVendor('', 'not in master ' + tag, { poNumber: 'PO' + tag });
                    assertEqual({ name: 'PO vendor when the name is unknown', shouldbe: a + '|purchase_order_vendor', value: p.vendorSysId + '|' + p.method });
                    var c = me.resolveVendor('', 'Other Vendor ' + tag, { poNumber: 'PO' + tag });
                    assertEqual({ name: 'PO of vendor A, printed name of vendor B: conflict, not resolved', shouldbe: 'false|true', value: c.resolved + '|' + c.conflict });
                    var al = new GlideRecord('x_695068_bcfa_vendor_alias'); al.initialize(); al.setValue('vendor', b); al.setValue('alias_name', '别名公司 ' + tag);
                    al.setValue('language', 'Chinese'); al.setValue('source', 'manual'); al.insert();
                    var s = me.resolveVendor('', '别名公司' + tag);
                    assertEqual({ name: 'active alias (spacing ignored)', shouldbe: b + '|vendor_alias', value: s.vendorSysId + '|' + s.method });
                    al.setValue('active', false); al.update();
                    assertEqual({ name: 'inactive alias is not used', shouldbe: false, value: me.resolveVendor('', '别名公司' + tag).resolved });
                    var e = me.resolveVendor('', cnName);
                    assertEqual({ name: 'Chinese printed name, exact', shouldbe: a + '|exact_name', value: e.vendorSysId + '|' + e.method });
                    var n = me.resolveVendor('', ' 上海测试化工有限公司 ' + tag.toLowerCase());
                    assertEqual({ name: 'Chinese printed name, normalized', shouldbe: a + '|normalized_name', value: n.vendorSysId + '|' + n.method });
                    mk(tag + 'C', '上海测试化工有限公司 ' + tag, '');
                    assertEqual({ name: 'two vendors with the same normalized Chinese name: ambiguous', shouldbe: true, value: !!me.resolveVendor('', '上海测试化工有限公司　' + tag).ambiguous });
                    var tc = me.resolveVendor('', 'Other Vendor ' + tag, { taxId: '91310000' + tag });
                    assertEqual({ name: 'tax ID of vendor A, printed name of vendor B: conflict, not resolved', shouldbe: 'false|true', value: tc.resolved + '|' + tc.conflict });
                    var tp = me.resolveVendor('', 'unreadable ' + tag, { taxId: '91310000' + tag, poNumber: 'PO' + tag + 'B' });
                    assertEqual({ name: 'PO number of an unknown PO does not block the tax ID', shouldbe: a, value: tp.vendorSysId });
                    var poB = new GlideRecord('x_695068_bcfa_purchase_order'); poB.initialize(); poB.setValue('po_number', 'PO' + tag + 'B'); poB.setValue('vendor', b); poB.setValue('currency', 'CNY'); poB.setValue('status', 'open'); poB.insert();
                    var tpc = me.resolveVendor('', 'unreadable ' + tag, { taxId: '91310000' + tag, poNumber: 'PO' + tag + 'B' });
                    assertEqual({ name: 'tax ID of vendor A, PO of vendor B: conflict, not resolved', shouldbe: 'false|true', value: tpc.resolved + '|' + tpc.conflict });
                    assertEqual({ name: 'supplier tax ID equal to the buyer tax ID is not used', shouldbe: false,
                        value: me.resolveVendor('', 'unreadable ' + tag, { taxId: '91310000' + tag, buyerTaxId: ' 91310000' + tag.toLowerCase() }).resolved });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h42-stamp'], name: 'H42-STAMP Stamp presence: text-only reading never confirms; China AP invoice needs a person; human yes passes, no is an exception; reviews are append-only and audited', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h42-stamp-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var tag = 'S42' + gs.generateGUID().substring(0, 6).toUpperCase();
                    var ev = new DocumentEvidenceService();
                    var yes = ev.stampEvidence({ stamp_present_read: 'YES', stamp_text: 'Customer Seal and Signature', stamp_count: '1' });
                    assertEqual({ name: 'text-only YES: presence stays uncertain', shouldbe: 'uncertain|detected_best_effort|ocr_text', value: yes.stamp_present + '|' + yes.stamp_evidence_status + '|' + yes.stamp_detection_method });
                    var no = ev.stampEvidence({ stamp_present_read: 'NO' });
                    assertEqual({ name: 'text-only NO is not evidence of absence', shouldbe: 'uncertain|uncertain', value: no.stamp_present + '|' + no.stamp_evidence_status });
                    assertEqual({ name: 'the reading is kept as the AI finding', shouldbe: true, value: yes.stamp_ai_finding.indexOf('Extraction answered "YES"') === 0 });

                    var vendor = function(country) { var v = new GlideRecord('x_695068_bcfa_vendor'); v.initialize(); v.setValue('vendor_code', tag + country.substring(0, 2)); v.setValue('name', 'Vendor ' + tag + country);
                        v.setValue('country', country); v.setValue('active', true); return v.insert(); };
                    var cn = vendor('China'), ind = vendor('India');
                    var invoice = function(v, n) { var t = new GlideRecord('x_695068_bcfa_ap_invoice'); t.initialize(); t.setValue('invoice_number', tag + n); t.setValue('vendor', v); t.setValue('gross_amount', 1000);
                        t.setValue('currency', 'CNY'); t.setValue('state', 'RECEIVED'); t.setWorkflow(false); return t.insert(); };
                    var get = function(id) { var g = new GlideRecord('x_695068_bcfa_ap_invoice'); g.get(id); return g; };

                    var i0 = invoice(cn, '-0');
                    var r0 = ev.evaluateStamp(get(i0));
                    assertEqual({ name: 'China AP invoice without any reading: review, never passed or missing from the country alone', shouldbe: 'document_evidence_review', value: r0.failure && r0.failure.reasonCode });
                    var i1 = invoice(cn, '-1');
                    var g1 = get(i1); ev.applyReadingToInvoice(g1, { stamp_present_read: 'YES', stamp_text: 'Customer Seal and Signature' }); g1.update();
                    var v1 = new ApDomainService().validateInvoice(i1);
                    g1 = get(i1);
                    assertEqual({ name: 'China invoice, text-only YES: validation stops for evidence review', shouldbe: 'document_evidence_review', value: v1.reasonCode });
                    assertEqual({ name: 'stamp required, review required, visual review flagged', shouldbe: 'true|review_required|true', value: (g1.getValue('stamp_required') === '1') + '|' + g1.getValue('stamp_validation_result') + '|' + (g1.getValue('visual_review_required') === '1') });
                    var rIn = ev.evaluateStamp(get(invoice(ind, '-2')));
                    assertEqual({ name: 'India invoice: no stamp required', shouldbe: 'null|not_required', value: rIn.failure + '|' + rIn.summary.split(' ')[0] });

                    var review = function(inv, item, value, reason) { var r = new GlideRecord('x_695068_bcfa_document_evidence_review'); r.initialize(); r.setValue('ap_invoice', inv);
                        r.setValue('evidence_item', item); r.setValue('human_value', value); r.setValue('reason', reason); return r.insert(); };
                    assertEqual({ name: 'stamp review must be yes or no', shouldbe: false, value: !!review(i1, 'stamp_present', 'maybe', 'unclear') });
                    assertEqual({ name: 'stamp review needs a reason', shouldbe: false, value: !!review(i1, 'stamp_present', 'yes', '') });
                    var rid = review(i1, 'stamp_present', 'yes', 'Red invoice seal visible on page 1');
                    g1 = get(i1);
                    assertEqual({ name: 'human yes recorded on the invoice', shouldbe: 'yes|human_confirmed|human|' + gs.getUserID(),
                        value: g1.getValue('stamp_present') + '|' + g1.getValue('stamp_evidence_status') + '|' + g1.getValue('stamp_detection_method') + '|' + g1.getValue('evidence_reviewed_by') });
                    var rec = new GlideRecord('x_695068_bcfa_document_evidence_review'); rec.get(rid);
                    assertEqual({ name: 'AI value kept next to the human value', shouldbe: true, value: rec.getValue('ai_value').indexOf('Extraction answered "YES"') >= 0 && rec.getValue('reviewer') === gs.getUserID() && !!rec.getValue('reviewed_on') });
                    assertEqual({ name: 'after the human yes the stamp check passes', shouldbe: 'passed', value: ev.evaluateStamp(get(i1)).summary.split(' ')[0] });
                    rec.setValue('reason', 'changed'); rec.update();
                    rec.get(rid);
                    assertEqual({ name: 'review is append-only', shouldbe: 'Red invoice seal visible on page 1', value: rec.getValue('reason') });
                    var audit = new GlideRecord('x_695068_bcfa_audit_event'); audit.addQuery('source_record', i1); audit.addQuery('event_type', 'human_review'); audit.query();
                    assertEqual({ name: 'review audited', shouldbe: true, value: audit.hasNext() });

                    var i3 = invoice(cn, '-3');
                    review(i3, 'stamp_present', 'no', 'No stamp on any page');
                    var r3 = ev.evaluateStamp(get(i3));
                    assertEqual({ name: 'human no: required stamp missing exception', shouldbe: 'document_evidence_missing', value: r3.failure && r3.failure.reasonCode });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h42-grn'], name: 'H42-GRN Goods receipt documents are evidence: readability classified, compared with the SAP receipt, reviewed by a person; never create or change a receipt', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h42-grn-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var tag = 'G42' + gs.generateGUID().substring(0, 6).toUpperCase();
                    var v = new GlideRecord('x_695068_bcfa_vendor'); v.initialize(); v.setValue('vendor_code', tag); v.setValue('name', 'Vendor ' + tag); v.setValue('active', true); var vendor = v.insert();
                    var po = new GlideRecord('x_695068_bcfa_purchase_order'); po.initialize(); po.setValue('po_number', 'PO' + tag); po.setValue('vendor', vendor); po.setValue('currency', 'INR'); po.setValue('status', 'open'); var poId = po.insert();
                    var pl = new GlideRecord('x_695068_bcfa_po_line'); pl.initialize(); pl.setValue('purchase_order', poId); pl.setValue('line_number', 1); pl.setValue('quantity', 10); pl.setValue('unit_price', 100); var plId = pl.insert();
                    var rc = new GlideRecord('x_695068_bcfa_receipt'); rc.initialize(); rc.setValue('receipt_number', 'GRN' + tag); rc.setValue('po_line', plId); rc.setValue('receipt_type', 'grn'); rc.setValue('quantity', 10); var rcId = rc.insert();
                    var count = function() { var a = new GlideAggregate('x_695068_bcfa_receipt'); a.addAggregate('COUNT'); a.query(); a.next(); return a.getAggregate('COUNT'); };
                    var before = count();
                    var intake = function() { var i = new GlideRecord('x_695068_bcfa_finance_intake'); i.initialize(); i.setValue('document_type', 'goods_receipt'); i.setWorkflow(false); return i.insert(); };
                    var ev = new DocumentEvidenceService();

                    var hw = ev.recordGrnReading(intake(), { grn_number: 'grn-' + tag.toLowerCase(), po_number: 'PO' + tag, quantity_received: '１０', handwriting_present_read: 'YES', handwritten_values: '[{"label":"Qty","value":"10","page":1,"legibility":"READABLE"}]' });
                    assertEqual({ name: 'handwritten, all critical values read, matches SAP', shouldbe: 'handwriting_readable|matches', value: hw.readingStatus + '|' + hw.comparison.result });
                    var g = new GlideRecord('x_695068_bcfa_grn_extraction'); g.get(hw.grnExtractionSysId);
                    assertEqual({ name: 'linked to the SAP receipt; review still required', shouldbe: rcId + '|review_required', value: g.getValue('sap_receipt') + '|' + g.getValue('review_status') });

                    var d = ev.recordGrnReading(intake(), { grn_number: 'GRN' + tag, po_number: 'PO' + tag, quantity_received: '8' });
                    assertEqual({ name: 'printed, quantity differs from SAP', shouldbe: 'printed_readable|differs', value: d.readingStatus + '|' + d.comparison.result });
                    assertEqual({ name: 'difference explained', shouldbe: true, value: d.comparison.detail.indexOf('quantity 8 vs SAP 10') >= 0 });
                    var empty = ev.recordGrnReading(intake(), { grn_number: 'GRN' + tag, po_number: 'PO' + tag, quantity_received: '10', handwriting_present_read: 'NO', handwritten_values: '[]' });
                    assertEqual({ name: 'an empty handwriting list is not handwriting (client run FDI0000037)', shouldbe: 'printed_readable|unknown',
                        value: empty.readingStatus + '|' + ev.handwritingEvidence({ handwriting_present_read: 'NO', handwritten_values: '[]' }).handwriting_status });
                    assertEqual({ name: 'handwriting reported as partly readable without a value still counts', shouldbe: 'partially_readable',
                        value: ev.handwritingEvidence({ handwritten_values: '[{"label":"GRN","value":null,"page":1,"legibility":"PARTIAL"}]' }).handwriting_status });
                    var part = ev.recordGrnReading(intake(), { grn_number: 'GRN' + tag });
                    assertEqual({ name: 'only the GRN number read: partially readable, missing values listed', shouldbe: 'partially_readable|po_number,quantity_received', value: part.readingStatus + '|' + part.missing.join(',') });
                    var none = ev.recordGrnReading(intake(), {});
                    assertEqual({ name: 'nothing read: not readable, not compared', shouldbe: 'not_readable|not_compared', value: none.readingStatus + '|' + none.comparison.result });
                    assertEqual({ name: 'unknown GRN number: evidence only', shouldbe: 'no_authoritative_receipt', value: ev.recordGrnReading(intake(), { grn_number: 'NOPE' + tag, po_number: 'PO' + tag, quantity_received: '1' }).comparison.result });

                    var r = new GlideRecord('x_695068_bcfa_document_evidence_review'); r.initialize(); r.setValue('grn_extraction', d.grnExtractionSysId); r.setValue('evidence_item', 'quantity_received');
                    r.setValue('human_value', '10'); r.setValue('reason', 'Quantity on the document is 10, the reading was wrong'); r.insert();
                    g.get(d.grnExtractionSysId);
                    assertEqual({ name: 'reviewer value used for the comparison; read value kept', shouldbe: 'reviewed|matches|8', value: g.getValue('review_status') + '|' + g.getValue('comparison_result') + '|' + g.getValue('quantity_received') });
                    rc.get(rcId);
                    assertEqual({ name: 'no receipt created or changed', shouldbe: before + '|10', value: count() + '|' + parseFloat(rc.getValue('quantity')) });

                    var svc = new FinanceDocumentIntakeService();
                    svc._extract = function() { return { ok: true, data: { grn_number: 'GRN' + tag, po_number: 'PO' + tag, quantity_received: '10', confidence: 1, warnings: [] }, source: 'native_document_intelligence', provider: 'native', label: 'Test reading' }; };
                    var iid = intake();
                    var out = svc.processGoodsReceiptDocument(iid);
                    var ik = new GlideRecord('x_695068_bcfa_finance_intake'); ik.get(iid);
                    assertEqual({ name: 'intake: GRN read as evidence, always to a person', shouldbe: 'true|review_required|' + out.grnExtractionSysId, value: out.requiresReview + '|' + ik.getValue('processing_status') + '|' + ik.getValue('grn_extraction') });
                    assertEqual({ name: 'intake review note says nothing was created', shouldbe: true, value: String(ik.getValue('processing_error')).indexOf('No goods receipt was created or changed') >= 0 });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-h42-route'], name: 'H42-ROUTE Extraction use case by kind + language: Chinese goes to the CJ OCR use cases; every routed use case applies its language config', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-h42-route-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var p = new NativeDocumentIntelligenceProvider();
                    var U = NativeDocumentIntelligenceProvider.USE_CASES;
                    assertEqual({ name: 'AP, no hint -> Latin AP use case', shouldbe: U.ap, value: p.resolveUseCase('ap', '').useCase });
                    assertEqual({ name: 'AP, Latin hint -> Latin AP use case', shouldbe: U.ap, value: p.resolveUseCase('ap', 'latin').useCase });
                    assertEqual({ name: 'AP, Chinese (Simplified) -> Chinese AP use case', shouldbe: U.ap_zh, value: p.resolveUseCase('ap', 'zh_hans').useCase });
                    assertEqual({ name: 'AR, no hint -> Latin AR use case', shouldbe: U.ar, value: p.resolveUseCase('ar', '').useCase });
                    assertEqual({ name: 'AR, Chinese (Simplified) -> Chinese AR use case', shouldbe: U.ar_zh, value: p.resolveUseCase('ar', 'zh_hans').useCase });
                    var g = p.resolveUseCase('grn', 'zh_hans');
                    assertEqual({ name: 'GRN, Chinese: no Chinese GRN use case, Latin fallback stated', shouldbe: U.grn + '|true', value: g.useCase + '|' + (g.fallback && g.note.length > 0) });
                    assertEqual({ name: 'visual reading requested: no use case (not configured)', shouldbe: null, value: p.resolveUseCase('ap', '', true).useCase });
                    // Every routed use case: active, language config as routed, and
                    // regional hub on (else the platform ignores its document config).
                    var CJ = '9863298fff62621087f570dd03cb14db', LATIN = 'eaf4020fffe2621087f570dd03cb140f';
                    NativeDocumentIntelligenceProvider.ROUTES.forEach(function(r) {
                        var uc = new GlideRecord('sys_di_task_definition');
                        var found = uc.get(U[r.useCase]);
                        assertEqual({ name: r.useCase + ': active, config ' + (r.language ? 'CJ' : 'Latin') + ', regional hub on', shouldbe: 'true|' + (r.language === 'zh_hans' ? CJ : LATIN) + '|1',
                            value: found + '|' + uc.getValue('document_config') + '|' + (uc.getValue('regional_hub_enabled') === '1' || uc.getValue('regional_hub_enabled') === 'true' ? '1' : '0') });
                    });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)
