import { Test } from '@servicenow/sdk/core'

// Phase 40: client POC success criteria (AP tax and tolerances, AR
// deductions, document extraction provider). Deterministic: every test
// creates its own data (ATF rolls it back) and none creates an AP/AR
// exception, so no AI workflow runs. Full decision flows are in
// scripts/deploy/phase40_e2e_bg.js. Scenario IDs follow
// docs/CLIENT_POC_TEST_MATRIX.md.

Test(
    { $id: Now.ID['test-cp-tax'], name: 'CP-TAX GST, VAT and withholding validated against the governed expectation (AP-TAX-001..006)', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-cp-tax-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var me = new MatchingEngine();
                    var pol = new FinancePolicy();
                    var tol = pol.apTolerances({ company: 'BC01', country: 'India', vendorType: 'standard', invoiceType: 'po' });
                    var inGoods = pol.apTaxExpectation({ country: 'India', company: 'BC01', vendorTaxCategory: 'goods' });
                    var inServices = pol.apTaxExpectation({ country: 'India', company: 'BC01', vendorTaxCategory: 'services' });
                    var de = pol.apTaxExpectation({ country: 'Germany', company: 'BC01', vendorTaxCategory: 'goods' });
                    var ev = function(net, tax, breakdown, expectation) {
                        return me.evaluateTax({ netAmount: net, taxAmount: tax, breakdown: breakdown || {}, expectation: expectation, tolerances: tol });
                    };
                    var has = function(r, text) { return r.checks.join(' | ').indexOf(text) >= 0; };

                    assertEqual({ name: 'expectation comes from the decision table', shouldbe: true, value: inGoods.source.indexOf('decision table') === 0 });
                    // AP-TAX-001 valid GST
                    var g1 = ev(5000, 900, { taxType: 'CGST+SGST', ratePct: 18, cgst: 450, sgst: 450 }, inGoods);
                    assertEqual({ name: 'AP-TAX-001 GST 18% with equal CGST/SGST passes', shouldbe: 'pass', value: g1.result });
                    assertEqual({ name: 'AP-TAX-001 expected tax 900', shouldbe: 900, value: g1.expectedTax });
                    assertEqual({ name: 'AP-TAX-001 IGST equal to the tax passes', shouldbe: 'pass', value: ev(5000, 900, { taxType: 'IGST', igst: 900 }, inGoods).result });
                    assertEqual({ name: 'AP-TAX-001 CGST/SGST invoice printing the component rate 9% passes', shouldbe: 'pass', value: ev(5000, 900, { taxType: 'CGST+SGST', ratePct: 9, cgst: 450, sgst: 450 }, inGoods).result });
                    assertEqual({ name: 'AP-TAX-001 IGST invoice printing 9% fails', shouldbe: 'fail', value: ev(5000, 900, { taxType: 'IGST', ratePct: 9, igst: 900 }, inGoods).result });
                    // AP-TAX-002 GST mismatch
                    var g2 = ev(2000, 50, { taxType: 'GST' }, inGoods);
                    assertEqual({ name: 'AP-TAX-002 GST 50 vs expected 360 fails', shouldbe: 'fail', value: g2.result });
                    assertEqual({ name: 'AP-TAX-002 variance 310', shouldbe: 310, value: g2.taxVariance });
                    var split = ev(5000, 900, { cgst: 400, sgst: 500 }, inGoods);
                    assertEqual({ name: 'AP-TAX-002 unequal CGST/SGST fails', shouldbe: true, value: split.result === 'fail' && has(split, 'not equal halves') });
                    var both = ev(5000, 900, { cgst: 450, sgst: 450, igst: 900 }, inGoods);
                    assertEqual({ name: 'AP-TAX-002 IGST together with CGST/SGST fails', shouldbe: true, value: both.result === 'fail' && has(both, 'both IGST and CGST/SGST') });
                    // AP-TAX-003 valid VAT
                    assertEqual({ name: 'AP-TAX-003 VAT 19% passes', shouldbe: 'pass', value: ev(7500, 1425, { taxType: 'VAT', ratePct: 19, vat: 1425 }, de).result });
                    assertEqual({ name: 'AP-TAX-003 VAT 0.40 off is within tolerance', shouldbe: 'within_tolerance', value: ev(7500, 1425.4, {}, de).result });
                    // AP-TAX-004 VAT mismatch (7% printed, 19% expected)
                    var v4 = ev(7500, 525, { taxType: 'VAT', ratePct: 7, vat: 525 }, de);
                    assertEqual({ name: 'AP-TAX-004 VAT 7% vs expected 19% fails', shouldbe: true, value: v4.result === 'fail' && has(v4, 'printed tax rate 7%') });
                    assertEqual({ name: 'AP-TAX-004 a GST label on a German invoice is a warning', shouldbe: true, value: has(ev(7500, 1425, { taxType: 'GST' }, de), 'does not match the expected regime') });
                    // AP-TAX-005 withholding applicable
                    assertEqual({ name: 'AP-TAX-005 withholding applies to Indian services (configured)', shouldbe: true, value: inServices.whtApplicable && inServices.whtRatePct === 2 });
                    var w5 = ev(10000, 1800, { wht: 200, whtRatePct: 2 }, inServices);
                    assertEqual({ name: 'AP-TAX-005 printed withholding 200 = 2% of 10,000 passes', shouldbe: 'pass', value: w5.wht.result });
                    assertEqual({ name: 'AP-TAX-005 overall result pass', shouldbe: 'pass', value: w5.result });
                    var w5n = ev(10000, 1800, {}, inServices);
                    assertEqual({ name: 'AP-TAX-005 withholding not printed is a warning (withheld at payment)', shouldbe: true, value: w5n.result === 'warning' && w5n.wht.expected === 200 });
                    // AP-TAX-006 withholding mismatch
                    var w6 = ev(10000, 1800, { wht: 500 }, inServices);
                    assertEqual({ name: 'AP-TAX-006 printed withholding 500 vs expected 200 fails', shouldbe: true, value: w6.result === 'fail' && w6.wht.result === 'fail' });
                    var w6u = ev(5000, 900, { wht: 100 }, inGoods);
                    assertEqual({ name: 'AP-TAX-006 withholding printed but not configured needs manual review', shouldbe: 'manual_review', value: w6u.result });
                    // not configured
                    var br = ev(1000, 100, {}, pol.apTaxExpectation({ country: 'Brazil', company: 'BC01', vendorTaxCategory: 'goods' }));
                    assertEqual({ name: 'unconfigured country is never validated automatically', shouldbe: 'manual_review', value: br.result });
                    stepResult.setOutputMessage('AP-TAX-001..006 checked against ' + inGoods.source);
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-cp-tol'], name: 'CP-TOL Tolerances configured, applied by the matching engine and visible on the match (AP-TOL-001..006)', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-cp-tol-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var me = new MatchingEngine();
                    var tag = 'TCP' + gs.generateGUID().substring(0, 6).toUpperCase();
                    var ins = function(table, fields) { var g = new GlideRecord(table); g.initialize(); for (var k in fields) g.setValue(k, fields[k]); return g.insert(); };
                    var vendor = ins('x_695068_bcfa_vendor', { vendor_code: tag + 'V', name: tag + ' Vendor', country: 'India', currency: 'INR', tax_category: 'goods', active: true });
                    var po = ins('x_695068_bcfa_purchase_order', { po_number: tag + 'PO', vendor: vendor, currency: 'INR', status: 'open', company_code: 'BC01' });
                    var poLine = ins('x_695068_bcfa_po_line', { purchase_order: po, line_number: 1, quantity: 100, unit_price: 50, received_quantity: 100 });
                    var receipt = ins('x_695068_bcfa_receipt', { receipt_number: tag + 'R', po_line: poLine, receipt_type: 'grn', quantity: 100 });
                    var n = 0;
                    var run = function(qty, price, tax) {
                        var net = qty * price;
                        var inv = ins('x_695068_bcfa_ap_invoice', { invoice_number: tag + '-' + (++n), vendor: vendor, currency: 'INR', company_code: 'BC01',
                            gross_amount: net + tax, net_amount: net, tax_amount: tax, purchase_order: po, state: 'MATCHING' });
                        ins('x_695068_bcfa_ap_invoice_line', { ap_invoice: inv, line_number: 1, quantity: qty, unit_price: price, amount: net, po_line: poLine, receipt_reference: receipt });
                        var r = me.threeWayMatch(inv);
                        var m = new GlideRecord('x_695068_bcfa_ap_match');
                        m.get(r.matchSysId);
                        r.record = m;
                        return r;
                    };

                    var t1 = run(101, 50, 909);
                    assertEqual({ name: 'AP-TOL-001 quantity 101 vs GRN 100 (1%, tolerance 2%) is within tolerance', shouldbe: true, value: t1.withinTolerance });
                    assertEqual({ name: 'AP-TOL-001 rule used is the decision table', shouldbe: true, value: t1.record.getValue('tolerance_source').indexOf('BCFA AP Tolerance') >= 0 });
                    assertEqual({ name: 'AP-TOL-001 quantity tolerance stored', shouldbe: 0.02, value: parseFloat(t1.record.getValue('quantity_tolerance_pct')) });
                    assertEqual({ name: 'AP-TOL-001 detail shows expected, actual and result', shouldbe: true,
                        value: t1.record.getValue('tolerance_detail').indexOf('quantity: expected 100') >= 0 && t1.record.getValue('tolerance_detail').indexOf('actual 101') >= 0 });
                    var t2 = run(110, 50, 990);
                    assertEqual({ name: 'AP-TOL-002 quantity 110 (10%) is an exception', shouldbe: true, value: !t2.withinTolerance && t2.quantityVariancePct > 0.02 });
                    assertEqual({ name: 'AP-TOL-002 detail says EXCEPTION', shouldbe: true, value: t2.record.getValue('tolerance_detail').indexOf('tolerance 2.0% -> EXCEPTION') >= 0 });
                    var t3 = run(100, 51, 918);
                    assertEqual({ name: 'AP-TOL-003 unit price 51 vs PO 50 (2%) is within tolerance', shouldbe: true, value: t3.withinTolerance });
                    var t4 = run(100, 52, 936);
                    assertEqual({ name: 'AP-TOL-004 unit price 52 (4%) is an exception', shouldbe: true, value: !t4.withinTolerance && t4.priceVariancePct > 0.02 });
                    var t5 = run(100, 50, 900.5);
                    assertEqual({ name: 'AP-TOL-005 tax 900.50 vs expected 900 is within tolerance', shouldbe: 'within_tolerance', value: t5.taxEvaluation.result });
                    assertEqual({ name: 'AP-TOL-005 invoice still matches', shouldbe: true, value: t5.withinTolerance });
                    assertEqual({ name: 'AP-TOL-005 tax result stored on the match', shouldbe: 'within_tolerance', value: t5.record.getValue('tax_result') });
                    var t6 = run(100, 50, 950);
                    assertEqual({ name: 'AP-TOL-006 tax 950 vs expected 900 is outside tolerance', shouldbe: true, value: t6.taxEvaluation.result === 'fail' && !t6.taxWithinTolerance });
                    assertEqual({ name: 'AP-TOL-006 expected tax stored on the match', shouldbe: 900, value: parseFloat(t6.record.getValue('expected_tax')) });
                    stepResult.setOutputMessage('AP-TOL-001..006 checked with tag ' + tag);
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-cp-ded'], name: 'CP-DED Deduction taxonomy: rule suggestions and governed limits (AR-DED-001..005)', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-cp-ded-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var me = new MatchingEngine();
                    var pol = new FinancePolicy();
                    var tag = 'TCD' + gs.generateGUID().substring(0, 6).toUpperCase();
                    var ins = function(table, fields) { var g = new GlideRecord(table); g.initialize(); for (var k in fields) g.setValue(k, fields[k]); return g.insert(); };
                    var cust = ins('x_695068_bcfa_customer', { customer_code: tag + 'C', name: tag + ' Tyres', currency: 'INR', active: true });
                    var pay = function(amount, reason) {
                        var p = ins('x_695068_bcfa_payment', { bank_reference: tag + '-' + gs.generateGUID().substring(0, 6), customer: cust, currency: 'INR', amount: amount,
                            state: 'MATCHING', idempotency_key: tag + gs.generateGUID() });
                        if (reason) ins('x_695068_bcfa_remittance', { payment: p, remittance_reference: tag, extracted_fields: JSON.stringify({ deduction_reason: reason }) });
                        return p;
                    };
                    assertEqual({ name: 'AR-DED-001 small residual with a bank-charge statement is a bank charge', shouldbe: 'bank_charge',
                        value: me.classifyResidual(pay(10975, 'correspondent bank charges'), 25).type });
                    assertEqual({ name: 'AR-DED-002 short pay of 2,500 with no stated reason gets no category (manual review)', shouldbe: null,
                        value: me.classifyResidual(pay(15000, 'Partial payment'), 2500).type });
                    assertEqual({ name: 'AR-DED-003 TDS stated on the advice is suggested as withholding tax', shouldbe: 'withholding_tax',
                        value: me.classifyResidual(pay(9800, 'TDS deducted at 2%'), 200).type });
                    var note = ins('x_695068_bcfa_credit_note', { credit_note_number: tag + 'CN', customer: cust, amount: 750, open_amount: 750, status: 'open' });
                    assertEqual({ name: 'AR-DED-004 residual equal to an open credit note is credit note netting', shouldbe: note,
                        value: me.classifyResidual(pay(1000), 750).creditNoteSysId });
                    assertEqual({ name: 'AR-DED-005 unknown reason above the bank charge limit gets no category', shouldbe: null,
                        value: me.classifyResidual(pay(7000, 'adjustment'), 3000).type });
                    assertEqual({ name: 'AR-DED-005 a disputed quantity is classified as a dispute', shouldbe: 'dispute',
                        value: me.classifyResidual(pay(7000, 'short shipment claim'), 3000).type });
                    assertEqual({ name: 'rounding difference', shouldbe: 'rounding', value: me.classifyResidual(pay(9999.5), 0.5).type });
                    var dispute = pol.arDeductionDecision({ deductionType: 'dispute', amount: 3000, company: 'BC01' });
                    assertEqual({ name: 'a dispute is never an allowed deduction', shouldbe: false, value: dispute.allowed });
                    var other = pol.arDeductionDecision({ deductionType: 'other', amount: 10, company: 'BC01' });
                    assertEqual({ name: 'other is never an allowed deduction', shouldbe: false, value: other.allowed });
                    var commercial = pol.arDeductionDecision({ deductionType: 'commercial_deduction', amount: 100, company: 'BC01' });
                    assertEqual({ name: 'a commercial deduction needs a finance approver', shouldbe: true, value: commercial.allowed && commercial.approvalRequired });
                    assertEqual({ name: 'withholding limit is a governed fraction', shouldbe: 0.1, value: pol.arWithholdingMaxPct() });
                    stepResult.setOutputMessage('AR-DED-001..005 checked with tag ' + tag);
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-cp-ext'], name: 'CP-EXT Extraction provider: native by default, simulated labelled, no fallback, derived confidence (AP-OCR-004, AR-OCR-003)', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-cp-ext-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var svc = new DocumentExtractionService();
                    var native = new NativeDocumentIntelligenceProvider();
                    assertEqual({ name: 'provider is native by default', shouldbe: 'native', value: svc.provider() });
                    assertEqual({ name: 'simulated provider is labelled SIMULATED DOCUMENT EXTRACTION - POC', shouldbe: true,
                        value: svc.label('simulated').indexOf('SIMULATED DOCUMENT EXTRACTION') === 0 });
                    assertEqual({ name: 'native provider is labelled as ServiceNow Document Intelligence on Now LLM', shouldbe: true,
                        value: svc.label('native').indexOf('Document Intelligence') > 0 && svc.label('native').indexOf('Now LLM') > 0 });

                    // No fallback: a native extraction that cannot run is an error, never fixture values.
                    var intake = new GlideRecord('x_695068_bcfa_finance_intake');
                    intake.initialize();
                    intake.setValue('document_type', 'ap_invoice');
                    intake.setValue('source_reference', 'ATF-CP-EXT-' + gs.generateGUID().substring(0, 6));
                    var id = intake.insert();
                    var r = svc.extract(id, 'ap');
                    assertEqual({ name: 'no attachment: native extraction fails', shouldbe: false, value: r.ok });
                    assertEqual({ name: 'no attachment: no data, no simulated values', shouldbe: true, value: !r.data && r.provider === 'native' });

                    // Mapping of a structured Document Intelligence result (as returned for AP_INV_001_CLEAN.pdf).
                    var clean = native._mapInvoice({ suppliername: 'Rajasthan Carbon Feedstock Pvt Ltd', invoicenumber: 'INV-AP-001', currency: 'INR',
                        subtotalbeforetax: '5000.00', totaltaxamount: '900.00', taxtype: 'GST', taxratepercent: '18', invoicetotal: '5900.00',
                        invoicelineitems: [{ line_number: 1, description: 'Carbon Black Feedstock', quantity: 100, unit: 'MT', unit_price: 50, net_amount: 5000, tax_amount: 900 }] });
                    assertEqual({ name: 'clean invoice: numbers parsed', shouldbe: '5000/900/5900', value: clean.net_amount + '/' + clean.tax_amount + '/' + clean.gross_amount });
                    assertEqual({ name: 'clean invoice: derived confidence 1', shouldbe: 1, value: clean.confidence });
                    assertEqual({ name: 'confidence basis is stated as derived', shouldbe: true, value: clean.confidence_basis.indexOf('Derived') === 0 });
                    // AP-OCR-004 low confidence (as returned for AP_INV_006_LOW_CONFIDENCE.pdf).
                    var poor = native._mapInvoice({ suppliername: 'Miskolc Freight Svcs.', invoicenumber: 'INV-AP-007', currency: 'EUR',
                        subtotalbeforetax: '3000.00', totaltaxamount: '0.00', invoicetotal: '3000.00',
                        invoicelineitems: [{ line_number: 1, description: 'Freight chgs - see attch.', quantity: null, unit: null, unit_price: null, net_amount: 3000, tax_amount: 0 }] });
                    assertEqual({ name: 'AP-OCR-004 unreadable line quantity lowers the confidence below the review threshold', shouldbe: true,
                        value: poor.confidence < new FinancePolicy().extractionConfidenceThreshold() });
                    var broken = native._mapInvoice({ suppliername: 'X', invoicenumber: 'Y', currency: 'INR', subtotalbeforetax: '1000', totaltaxamount: '180', invoicetotal: '2000',
                        invoicelineitems: [{ quantity: 1, unit_price: 1000, net_amount: 1000 }] });
                    assertEqual({ name: 'net + tax not equal to total is flagged', shouldbe: true, value: broken.warnings.join(' ').indexOf('does not equal the total') >= 0 });
                    // AR-OCR-003 low confidence advice: missing amount and references.
                    var advice = native._mapAdvice({ payername: 'Some Customer', bankreference: 'UTR1', currency: 'INR', invoicespaid: [] });
                    assertEqual({ name: 'AR-OCR-003 advice without amount or invoices goes below the threshold', shouldbe: true,
                        value: advice.confidence < new FinancePolicy().extractionConfidenceThreshold() });
                    var multi = native._mapAdvice({ payername: 'Deccan Rubber Industries', bankreference: 'BANK-AR-003', paymentamount: '25000.00', currency: 'INR',
                        invoicespaid: [{ invoice_reference: 'ARI0002', amount_applied: 8000 }, { invoice_reference: 'ARI0003', amount_applied: 12000 }, { invoice_reference: 'ARI0004', amount_applied: 5000 }] });
                    assertEqual({ name: 'AR-OCR-002 multi-invoice advice: three references, applied amounts add up', shouldbe: '3/1', value: multi.invoice_references.length + '/' + multi.confidence });
                    assertEqual({ name: 'payment reference falls back to the bank reference', shouldbe: 'BANK-AR-003', value: multi.payment_reference });
                    // AP-OCR-002 number formats as printed (German VAT fixture returned "2.058,80").
                    assertEqual({ name: 'AP-OCR-002 German number 2.058,80', shouldbe: 2058.8, value: native._num('2.058,80') });
                    assertEqual({ name: 'AP-OCR-002 English number 115,375.00', shouldbe: 115375, value: native._num('115,375.00') });
                    assertEqual({ name: 'AP-OCR-002 Indian grouping 1,23,456.00', shouldbe: 123456, value: native._num('1,23,456.00') });
                    assertEqual({ name: 'AP-OCR-002 space grouping 1 234,56', shouldbe: 1234.56, value: native._num('1 234,56') });
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)
