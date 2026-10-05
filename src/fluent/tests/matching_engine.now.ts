import { Test } from '@servicenow/sdk/core'

// Phase 14: deterministic matching rules, tested directly against
// MatchingEngine with isolated data created inside each test (ATF rolls it
// back). The tests never create AP/AR exceptions, so no AI workflow is
// triggered. Run with atf_test_run; tolerances come from the
// x_695068_bcfa.ap.tolerance.* properties (quantity 2%, price 2%).

Test(
    { $id: Now.ID['test-matching-ap-rules'], name: 'Matching Engine — AP duplicate, PO, GRN, quantity, price, tax, totals', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-matching-ap-rules-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var me = new MatchingEngine();
                    var tag = 'T14A' + gs.generateGUID().substring(0, 6).toUpperCase();
                    var ins = function(table, fields) {
                        var g = new GlideRecord(table);
                        g.initialize();
                        for (var k in fields) g.setValue(k, fields[k]);
                        return g.insert();
                    };
                    var vendor = ins('x_695068_bcfa_vendor', { vendor_code: tag + 'V1', name: tag + ' Vendor One', country: 'India', currency: 'INR', active: true });
                    var otherVendor = ins('x_695068_bcfa_vendor', { vendor_code: tag + 'V2', name: tag + ' Vendor Two', country: 'India', currency: 'INR', active: true });
                    var po = ins('x_695068_bcfa_purchase_order', { po_number: tag + 'PO1', vendor: vendor, currency: 'INR', status: 'open' });
                    var otherPo = ins('x_695068_bcfa_purchase_order', { po_number: tag + 'PO2', vendor: otherVendor, currency: 'INR', status: 'open' });
                    var closedPo = ins('x_695068_bcfa_purchase_order', { po_number: tag + 'PO3', vendor: vendor, currency: 'INR', status: 'closed' });
                    var poLine = ins('x_695068_bcfa_po_line', { purchase_order: po, line_number: 1, quantity: 100, unit_price: 50, received_quantity: 100 });
                    var receipt = ins('x_695068_bcfa_receipt', { receipt_number: tag + 'R1', po_line: poLine, receipt_type: 'grn', quantity: 100 });
                    var n = 0;
                    var invoice = function(number, gross, net, tax, poRef, state) {
                        return ins('x_695068_bcfa_ap_invoice', { invoice_number: number || (tag + '-' + (++n)), vendor: vendor, currency: 'INR',
                            gross_amount: gross, net_amount: net, tax_amount: tax, purchase_order: poRef || '', state: state || 'MATCHING' });
                    };
                    var line = function(inv, qty, price, amount, linked, received) {
                        ins('x_695068_bcfa_ap_invoice_line', { ap_invoice: inv, line_number: 1, quantity: qty, unit_price: price, amount: amount,
                            po_line: linked ? poLine : '', receipt_reference: received ? receipt : '' });
                        return inv;
                    };
                    var match = function(inv) { return me.threeWayMatch(inv); };

                    var happy = match(line(invoice(null, 5900, 5000, 900, po), 100, 50, 5000, true, true));
                    assertEqual({ name: 'clean 3-way match passes', shouldbe: true, value: happy.withinTolerance });

                    var qty1 = match(line(invoice(null, 5959, 5050, 909, po), 101, 50, 5050, true, true));
                    assertEqual({ name: 'quantity variance 1% passes (tolerance 2%)', shouldbe: true, value: qty1.withinTolerance });
                    var qty3 = match(line(invoice(null, 6077, 5150, 927, po), 103, 50, 5150, true, true));
                    assertEqual({ name: 'quantity variance 3% fails', shouldbe: false, value: qty3.withinTolerance });
                    assertEqual({ name: 'quantity 3% reported as quantity variance', shouldbe: true, value: qty3.quantityVariancePct > 0.02 });

                    var price2 = match(line(invoice(null, 6018, 5100, 918, po), 100, 51, 5100, true, true));
                    assertEqual({ name: 'price variance exactly 2% passes', shouldbe: true, value: price2.withinTolerance });
                    var price4 = match(line(invoice(null, 6136, 5200, 936, po), 100, 52, 5200, true, true));
                    assertEqual({ name: 'price variance 4% fails', shouldbe: true, value: !price4.withinTolerance && price4.priceVariancePct > 0.02 });

                    var taxBad = match(line(invoice(null, 5800, 5000, 800, po), 100, 50, 5000, true, true));
                    assertEqual({ name: 'tax 800 vs expected 900 (India 18%) fails', shouldbe: false, value: taxBad.taxWithinTolerance });
                    var taxOk = match(line(invoice(null, 5910, 5000, 910, po), 100, 50, 5000, true, true));
                    assertEqual({ name: 'tax 910 within band max(1, 2% of 900) passes', shouldbe: true, value: taxOk.taxWithinTolerance });

                    var noGrn = match(line(invoice(null, 5900, 5000, 900, po), 100, 50, 5000, true, false));
                    assertEqual({ name: 'PO line without goods receipt fails', shouldbe: 1, value: noGrn.receiptIssues.length });
                    var notLinked = match(line(invoice(null, 5900, 5000, 900, po), 100, 50, 5000, false, false));
                    assertEqual({ name: 'line not linked to the PO fails', shouldbe: 1, value: notLinked.linkIssues.length });
                    var noLines = match(invoice(null, 5900, 5000, 900, po));
                    assertEqual({ name: 'PO invoice without lines fails', shouldbe: false, value: noLines.withinTolerance });
                    var total = match(line(invoice(null, 5900, 5000, 900, po), 100, 50, 4000, true, true));
                    assertEqual({ name: 'line total 4000 vs net 5000 fails', shouldbe: false, value: total.lineTotalOk });

                    var wrongVendorInv = invoice(null, 5900, 5000, 900, otherPo);
                    assertEqual({ name: 'PO of another vendor is a po_mismatch', shouldbe: 'po_mismatch', value: me.validatePurchaseOrder(wrongVendorInv).reasonCode });
                    var closedInv = invoice(null, 5900, 5000, 900, closedPo);
                    assertEqual({ name: 'closed PO is a po_mismatch', shouldbe: 'po_mismatch', value: me.validatePurchaseOrder(closedInv).reasonCode });
                    assertEqual({ name: 'own open PO passes', shouldbe: true, value: me.validatePurchaseOrder(invoice(null, 5900, 5000, 900, po)).ok });

                    invoice(tag + '-INV-001', 100, 100, 0, null, 'CLOSED');
                    var exactDup = me.detectDuplicateInvoice(invoice(tag.toLowerCase() + ' inv 001', 100, 100, 0));
                    assertEqual({ name: 'same vendor + normalized number + amount is a duplicate', shouldbe: true, value: exactDup.duplicate && exactDup.sameAmount });
                    var amountDup = me.detectDuplicateInvoice(invoice(tag + 'INV001', 200, 200, 0));
                    assertEqual({ name: 'same vendor + number, different amount is still a duplicate', shouldbe: true, value: amountDup.duplicate && !amountDup.sameAmount });
                    invoice(tag + '-INV-777', 100, 100, 0, null, 'REJECTED');
                    var afterReject = me.detectDuplicateInvoice(invoice(tag + '-INV-777', 100, 100, 0));
                    assertEqual({ name: 'a REJECTED invoice does not block a resubmission', shouldbe: false, value: afterReject.duplicate });

                    stepResult.setOutputMessage('AP matching rules checked with test tag ' + tag);
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-matching-ar-rules'], name: 'Matching Engine — AR reference, amount, currency, alias, combinations, residuals', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-matching-ar-rules-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var me = new MatchingEngine();
                    var tag = 'T14R' + gs.generateGUID().substring(0, 6).toUpperCase();
                    var ins = function(table, fields) {
                        var g = new GlideRecord(table);
                        g.initialize();
                        for (var k in fields) g.setValue(k, fields[k]);
                        return g.insert();
                    };
                    var c1 = ins('x_695068_bcfa_customer', { customer_code: tag + 'C1', name: tag + ' Alpha Tyres Ltd', currency: 'INR', active: true });
                    var c2 = ins('x_695068_bcfa_customer', { customer_code: tag + 'C2', name: tag + ' Beta Rubber Ltd', currency: 'INR', active: true });
                    var item = function(customer, suffix, amount, currency) {
                        return ins('x_695068_bcfa_ar_open_item', { item_number: tag + suffix, customer: customer, currency: currency || 'INR',
                            invoice_amount: amount, open_amount: amount, status: 'open' });
                    };
                    item(c1, 'I1', 50000); item(c1, 'I2', 30000); item(c1, 'I3', 20000); item(c1, 'I5', 30000);
                    item(c1, 'I4', 50000, 'EUR');
                    item(c2, 'J1', 50000); item(c2, 'J2', 30000); item(c2, 'J3', 12345, 'EUR');
                    var payment = function(customer, amount, currency) {
                        return ins('x_695068_bcfa_payment', { bank_reference: tag + '-' + gs.generateGUID().substring(0, 6), customer: customer || '',
                            currency: currency || 'INR', amount: amount, state: 'MATCHING', idempotency_key: tag + gs.generateGUID() });
                    };

                    var exact = me.exactMatch(payment(c1, 50000));
                    assertEqual({ name: 'exact amount matches the single INR item (EUR item of the same amount ignored)', shouldbe: true, value: exact.matched });
                    var crossCurrency = me.exactMatch(payment(c2, 12345));
                    assertEqual({ name: 'an INR payment never matches an EUR item', shouldbe: false, value: crossCurrency.matched });

                    var unique = me.findExactCombinations(payment(c2, 80000), 3);
                    assertEqual({ name: 'unique combination 50000 + 30000 found', shouldbe: 1, value: unique.solutions.length });
                    var ambiguous = me.findExactCombinations(payment(c1, 80000), 3);
                    assertEqual({ name: 'several exact combinations are reported, not chosen', shouldbe: true, value: ambiguous.solutions.length > 1 });

                    var remitPay = payment(c1, 50000);
                    var remit = function(pay, lines) {
                        ins('x_695068_bcfa_remittance', { payment: pay, remittance_reference: tag, extracted_fields: JSON.stringify({ invoice_lines: lines }) });
                    };
                    remit(remitPay, [{ invoice_reference: tag + 'I1', amount_applied: 50000 }]);
                    assertEqual({ name: 'remittance reference resolves to the open item', shouldbe: true, value: me.resolveRemittanceReferences(remitPay).usable });
                    var eurRemit = payment(c1, 50000);
                    remit(eurRemit, [{ invoice_reference: tag + 'I4', amount_applied: 50000 }]);
                    assertEqual({ name: 'remittance reference in another currency is flagged', shouldbe: 1, value: me.resolveRemittanceReferences(eurRemit).currencyMismatch.length });
                    var unknownRemit = payment(c1, 1000);
                    remit(unknownRemit, [{ invoice_reference: tag + 'NOPE', amount_applied: 1000 }]);
                    assertEqual({ name: 'unknown remittance reference is unresolved', shouldbe: 1, value: me.resolveRemittanceReferences(unknownRemit).unresolved.length });

                    ins('x_695068_bcfa_customer_alias', { customer: c1, alias_name: tag + ' ALPHA TYRES', alias_type: 'trade_name', confidence: 1, active: true });
                    var alias = me.resolveCustomerByAlias(tag.toLowerCase() + ' alpha-tyres.');
                    assertEqual({ name: 'normalized alias resolves to the customer', shouldbe: c1, value: alias.customerSysId });
                    ins('x_695068_bcfa_customer_alias', { customer: c1, alias_name: tag + ' SHARED NAME', alias_type: 'trade_name', confidence: 1, active: true });
                    ins('x_695068_bcfa_customer_alias', { customer: c2, alias_name: tag + ' SHARED NAME', alias_type: 'trade_name', confidence: 1, active: true });
                    var shared = me.resolveCustomerByAlias(tag + ' Shared Name');
                    assertEqual({ name: 'a name pointing to two customers is ambiguous, not resolved', shouldbe: true, value: !shared.resolved && shared.ambiguous === true });
                    var byName = me.resolveCustomerByAlias(tag + ' BETA RUBBER LTD');
                    assertEqual({ name: 'exact customer name resolves', shouldbe: c2, value: byName.customerSysId });

                    var bank = me.classifyResidual(payment(c1, 79500), 500);
                    assertEqual({ name: 'residual 500 within the bank charge limit is suggested as bank_charge', shouldbe: 'bank_charge', value: bank.type });
                    var note = ins('x_695068_bcfa_credit_note', { credit_note_number: tag + 'CN1', customer: c2, amount: 750, open_amount: 750, status: 'open' });
                    var credit = me.classifyResidual(payment(c2, 1000), 750);
                    assertEqual({ name: 'residual equal to an open credit note is suggested as credit_note_netting', shouldbe: note, value: credit.creditNoteSysId });
                    var none = me.classifyResidual(payment(c2, 10000), 5000);
                    assertEqual({ name: 'large residual with no credit note gets no suggestion', shouldbe: null, value: none.type });

                    stepResult.setOutputMessage('AR matching rules checked with test tag ' + tag);
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)
