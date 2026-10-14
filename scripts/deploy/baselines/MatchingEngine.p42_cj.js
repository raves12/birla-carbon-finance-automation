var MatchingEngine = Class.create();

// Phase 42: separators for canonicalText: whitespace, ASCII punctuation and
// symbols, Latin-1 punctuation (no-break space, inverted marks, middle dot,
// guillemets), general punctuation (dashes, quotes, bullets, ellipsis), CJK
// symbols and punctuation except the ideographic iteration / number marks
// 々 〆 〇 (U+3005-3007, used in names), CJK compatibility and small form
// variants, half-width brackets and the katakana middle dot.
MatchingEngine.CANONICAL_SEPARATORS = /[\s!-\/:-@\[-`{-~ -¿‐-⁞　-〄〈-〿︰-﹫｟-･・]+/g;

// Full-width ASCII (U+FF01-FF5E) -> ASCII and the ideographic space -> a
// space, for an engine without String.prototype.normalize (a no-op after
// NFKC).
MatchingEngine.foldFullWidth = function(s) {
    return String(s).replace(/[！-～]/g, function(c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    }).replace(/　/g, ' ');
};

MatchingEngine.prototype = {
    initialize: function() {},

    // Fallback tolerances, used only if FinancePolicy cannot be read. The
    // live values are the x_695068_bcfa.ap.tolerance.* properties (POC
    // ASSUMPTION, quantity 2%) — see FinancePolicy.apTolerances().
    DEFAULT_TOLERANCES: {
        quantityPct: 0.02,
        pricePct: 0.02,
        taxAbsolute: 1.0,
        taxRelativePct: 0.02,
        totalAbsolute: 1.0,
        roundingAbsolute: 0.05
    },

    // Phase 40: the expected tax is no longer a hard-coded country map. It
    // comes from the governed BCFA AP Tax Expectation decision table (or the
    // x_695068_bcfa.ap.tax.reference property) through
    // FinancePolicy.apTaxExpectation, and evaluateTax() below compares the
    // tax printed on the invoice with it.

    // ---- AP: master-data resolution (never guesses an ambiguity) -------------

    // Phase 42: deterministic precedence, never a translation and never a
    // guess between candidates:
    //   1. vendor code
    //   2. tax registration / organization identifier (opts.taxId)
    //   3. purchase order -> its vendor (opts.poNumber), unless the printed
    //      name points to a different vendor (conflict: manual review)
    //   4. active vendor alias in the printed language
    //   5. exact or Unicode-normalized vendor name
    //   6. otherwise unresolved (manual review / vendor exception)
    resolveVendor: function(vendorCode, vendorName, opts) {
        opts = opts || {};
        if (vendorCode) {
            var byCode = new GlideRecord('x_695068_bcfa_vendor');
            byCode.addQuery('vendor_code', vendorCode);
            byCode.addQuery('active', true);
            byCode.query();
            if (byCode.next()) {
                return { resolved: true, vendorSysId: byCode.getUniqueValue(), method: 'vendor_code' };
            }
        }
        var taxKey = this._idKey(opts.taxId);
        // Phase 42: a supplier tax ID equal to the buyer's tax ID printed on the
        // same document is a misreading (the Chinese e-invoice reading put the
        // buyer block's ID in the seller field): it is not used.
        if (taxKey && opts.buyerTaxId && this._idKey(opts.buyerTaxId) === taxKey) taxKey = '';
        if (taxKey.length >= 5) {
            var byTax = new GlideRecord('x_695068_bcfa_vendor');
            byTax.addQuery('active', true);
            byTax.addNotNullQuery('tax_registration_number');
            byTax.query();
            var taxHits = [];
            while (byTax.next()) {
                if (this._idKey(byTax.getValue('tax_registration_number')) === taxKey) taxHits.push(byTax.getUniqueValue());
            }
            if (taxHits.length === 1) {
                // Phase 42: the printed name must not point at another vendor.
                var nameCheck = this._vendorByName(vendorName);
                if (nameCheck.resolved && nameCheck.vendorSysId !== taxHits[0]) {
                    return { resolved: false, conflict: true, candidates: [taxHits[0], nameCheck.vendorSysId],
                        reason: 'Tax registration number "' + opts.taxId + '" belongs to one vendor, but the printed supplier "' + vendorName +
                            '" matches another vendor (' + nameCheck.method + '); not resolved automatically.' };
                }
                return { resolved: true, vendorSysId: taxHits[0], method: 'tax_registration_number' };
            }
            if (taxHits.length > 1) return { resolved: false, ambiguous: true, candidates: taxHits,
                reason: taxHits.length + ' active vendors share tax registration number "' + opts.taxId + '"; not resolved automatically.' };
        }
        var byNameEvidence = this._vendorByName(vendorName);
        if (opts.poNumber) {
            var po = new GlideRecord('x_695068_bcfa_purchase_order');
            po.addQuery('po_number', opts.poNumber);
            po.query();
            if (po.next() && po.getValue('vendor')) {
                var poVendor = po.getValue('vendor');
                var poVendorRec = new GlideRecord('x_695068_bcfa_vendor');
                if (poVendorRec.get(poVendor) && poVendorRec.getValue('active') !== '0' && poVendorRec.getValue('active') !== 'false') {
                    if (byNameEvidence.resolved && byNameEvidence.vendorSysId !== poVendor) {
                        return { resolved: false, conflict: true, candidates: [poVendor, byNameEvidence.vendorSysId],
                            reason: 'Purchase order ' + opts.poNumber + ' belongs to vendor ' + poVendorRec.getValue('name') + ', but the printed supplier "' +
                                vendorName + '" matches another vendor (' + byNameEvidence.method + '); not resolved automatically.' };
                    }
                    return { resolved: true, vendorSysId: poVendor, method: 'purchase_order_vendor' };
                }
            }
        }
        if (byNameEvidence.resolved || byNameEvidence.ambiguous) return byNameEvidence;
        return { resolved: false, reason: 'No unique active vendor match for code "' + (vendorCode || '') + '"' + (opts.taxId ? ' / tax id "' + opts.taxId + '"' : '') +
            (opts.poNumber ? ' / PO "' + opts.poNumber + '"' : '') + ' / name "' + (vendorName || '') + '".' };
    },

    // Steps 4 and 5 of resolveVendor: active alias (unique vendor), then the
    // exact name, then the Unicode-normalized name (unique vendor).
    _vendorByName: function(vendorName) {
        if (!vendorName) return { resolved: false };
        var key = this._vendorNameKey(vendorName);
        if (key.length >= 2) {
            var aliasHits = {};
            var alias = new GlideRecord('x_695068_bcfa_vendor_alias');
            if (alias.isValid()) {
                alias.addQuery('active', true);
                alias.query();
                while (alias.next()) {
                    if (this._vendorNameKey(alias.getValue('alias_name')) !== key) continue;
                    var aliasVendor = new GlideRecord('x_695068_bcfa_vendor');
                    if (aliasVendor.get(alias.getValue('vendor')) && aliasVendor.getValue('active') !== '0' && aliasVendor.getValue('active') !== 'false') {
                        aliasHits[alias.getValue('vendor')] = true;
                    }
                }
            }
            var aliasIds = [];
            for (var v in aliasHits) aliasIds.push(v);
            if (aliasIds.length === 1) return { resolved: true, vendorSysId: aliasIds[0], method: 'vendor_alias' };
            if (aliasIds.length > 1) return { resolved: false, ambiguous: true, candidates: aliasIds,
                reason: 'The alias "' + vendorName + '" belongs to ' + aliasIds.length + ' vendors; not resolved automatically.' };
        }
        return this._vendorByPrintedName(vendorName);
    },

    // Comparison key of an identifier (tax registration, organization code):
    // canonical text without spaces.
    _idKey: function(value) {
        return this.canonicalText(value).replace(/ /g, '');
    },

    _vendorByPrintedName: function(vendorName) {
        if (vendorName) {
            var byName = new GlideRecord('x_695068_bcfa_vendor');
            byName.addQuery('name', vendorName);
            byName.addQuery('active', true);
            byName.query();
            if (byName.getRowCount() === 1) {
                byName.next();
                return { resolved: true, vendorSysId: byName.getUniqueValue(), method: 'exact_name' };
            }
            // The same name read with other spacing, case or punctuation
            // ("D . SURESHPRASAD" = "D. Sureshprasad"); linked only when
            // exactly one active vendor has that normalized name.
            // Phase 42: Unicode-safe, so a Chinese, Korean or accented name
            // is compared as printed (two characters are a valid CJK name).
            var key = this._vendorNameKey(vendorName);
            if (key.length >= 2) {
                var all = new GlideRecord('x_695068_bcfa_vendor');
                all.addQuery('active', true);
                all.query();
                var hits = [];
                while (all.next()) {
                    if (this._vendorNameKey(all.getValue('name')) === key) hits.push(all.getUniqueValue());
                }
                if (hits.length === 1) return { resolved: true, vendorSysId: hits[0], method: 'normalized_name' };
                if (hits.length > 1) return { resolved: false, ambiguous: true, candidates: hits,
                    reason: hits.length + ' active vendors have the name "' + vendorName + '"; not resolved automatically.' };
            }
        }
        return { resolved: false };
    },

    // Comparison key of a vendor name: the canonical text without spaces
    // (any script; see canonicalText).
    _vendorNameKey: function(name) {
        return this.canonicalText(name).replace(/ /g, '');
    },

    resolvePurchaseOrder: function(poNumber) {
        if (!poNumber) return { resolved: false, reason: 'No PO number supplied.' };
        var po = new GlideRecord('x_695068_bcfa_purchase_order');
        po.addQuery('po_number', poNumber);
        po.query();
        if (po.next()) {
            return { resolved: true, poSysId: po.getUniqueValue() };
        }
        return { resolved: false, reason: 'No Purchase Order found with number "' + poNumber + '".' };
    },

    // ---- AP: PO validation and 3-way match -----------------------------------

    // Phase 14: the referenced purchase order must exist, belong to the
    // invoice's vendor and not be closed. Pure check, no writes.
    // Returns { ok:true } or { ok:false, reasonCode:'po_mismatch', description }.
    validatePurchaseOrder: function(apInvoiceSysId) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return { ok: false, reasonCode: 'other', description: 'AP Invoice not found.' };
        if (!invoice.getValue('purchase_order')) return { ok: true, noPo: true };
        var po = new GlideRecord('x_695068_bcfa_purchase_order');
        if (!po.get(invoice.getValue('purchase_order'))) {
            return { ok: false, reasonCode: 'po_mismatch', description: 'Referenced purchase order could not be resolved.' };
        }
        if (invoice.getValue('vendor') && po.getValue('vendor') !== invoice.getValue('vendor')) {
            return { ok: false, reasonCode: 'po_mismatch', description: 'Purchase order ' + po.getValue('po_number') + ' belongs to vendor ' +
                po.getDisplayValue('vendor') + ', not the invoice vendor ' + invoice.getDisplayValue('vendor') + '.' };
        }
        if (po.getValue('status') === 'closed') {
            return { ok: false, reasonCode: 'po_mismatch', description: 'Purchase order ' + po.getValue('po_number') + ' is closed.' };
        }
        return { ok: true, poNumber: po.getValue('po_number') };
    },

    // 3-way match: invoice lines vs PO lines vs goods/service receipts, plus
    // tax and header totals. Checks, all deterministic:
    //   linkage   (PO invoices) at least one line; every line linked to a
    //             line of the invoice's PO                      -> po_mismatch
    //   receipt   (PO invoices) every line has a GRN/SRN for its own PO line
    //                                                            -> grn_missing
    //   quantity  |invoice qty - receipt qty| / receipt qty <= tolerance
    //   price     |invoice price - PO price| / PO price <= tolerance
    //   tax       evaluateTax(): printed tax vs the governed expectation
    //             (amount, rate, GST split, VAT, withholding)
    //   total     |sum of line amounts - header net| <= total tolerance
    //                                                            -> line_total_mismatch
    threeWayMatch: function(apInvoiceSysId, toleranceOverrides) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) {
            return { error: 'AP Invoice not found' };
        }
        var invoicePo = invoice.getValue('purchase_order');
        // Phase 15: tolerances from the BCFA AP Tolerance decision table for
        // this company / vendor country / vendor type / invoice type.
        var tolerances = this._mergeTolerances(toleranceOverrides, {
            company: invoice.getValue('company_code'),
            country: this._vendorCountry(invoice.getValue('vendor')) || '',
            vendorType: 'standard',
            invoiceType: invoicePo ? 'po' : 'non_po'
        });

        // Phase 41, defect 5: an invoice in another currency than its PO is
        // compared only after conversion at a governed rate; without one the
        // prices are not compared at all (never USD 100 = INR 100).
        var currency = this.currencyCheck(invoice);
        var priceFactor = !currency.required ? 1 : currency.available ? currency.rate : null;

        var maxQuantityVariancePct = 0;
        var maxPriceVariancePct = 0;
        var matchedPoLine = null;
        var matchedReceipt = null;
        // Per-line evidence for the exception record and the AI agents.
        var lineEvidence = [];
        var quantityVarianceValue = 0;
        var priceVarianceValue = 0;
        var linkIssues = [];
        var receiptIssues = [];
        var lineCount = 0;
        var lineTotal = 0;

        var line = new GlideRecord('x_695068_bcfa_ap_invoice_line');
        line.addQuery('ap_invoice', apInvoiceSysId);
        line.orderBy('line_number');
        line.query();
        while (line.next()) {
            lineCount++;
            lineTotal += parseFloat(line.getValue('amount') || '0');
            var poLineSysId = line.getValue('po_line');
            var receiptSysId = line.getValue('receipt_reference');
            var lineQty = parseFloat(line.getValue('quantity') || '0');
            var lineUnitPrice = parseFloat(line.getValue('unit_price') || '0');
            var lineLabel = 'line ' + line.getValue('line_number');
            if (invoicePo && !poLineSysId) linkIssues.push(lineLabel + ' is not linked to a PO line');
            if (invoicePo && poLineSysId && !receiptSysId) receiptIssues.push(lineLabel + ' has no goods/service receipt');
            var evidence = {
                lineNumber: line.getValue('line_number'),
                invoiceQuantity: lineQty,
                invoiceUnitPrice: lineUnitPrice,
                poNumber: null,
                poQuantity: null,
                poUnitPrice: null,
                receiptNumber: null,
                receiptQuantity: null
            };

            if (poLineSysId) {
                matchedPoLine = poLineSysId;
                var poLine = new GlideRecord('x_695068_bcfa_po_line');
                if (!poLine.get(poLineSysId)) {
                    linkIssues.push(lineLabel + ' references a PO line that does not exist');
                } else {
                    if (invoicePo && poLine.getValue('purchase_order') !== invoicePo) {
                        linkIssues.push(lineLabel + ' is linked to a line of PO ' + poLine.getDisplayValue('purchase_order') + ', not the invoice PO');
                    }
                    var poUnitPrice = parseFloat(poLine.getValue('unit_price') || '0');
                    evidence.poNumber = poLine.getDisplayValue('purchase_order');
                    evidence.poQuantity = parseFloat(poLine.getValue('quantity') || '0');
                    evidence.poUnitPrice = poUnitPrice;
                    if (poUnitPrice > 0 && priceFactor !== null) {
                        var comparablePrice = Math.round(lineUnitPrice * priceFactor * 10000) / 10000;
                        if (currency.required) evidence.invoiceUnitPriceInPoCurrency = comparablePrice;
                        var priceVariancePct = Math.abs(comparablePrice - poUnitPrice) / poUnitPrice;
                        if (priceVariancePct > maxPriceVariancePct) maxPriceVariancePct = priceVariancePct;
                        priceVarianceValue += Math.abs(comparablePrice - poUnitPrice) * lineQty;
                    }
                }
            }

            if (receiptSysId) {
                matchedReceipt = receiptSysId;
                var receipt = new GlideRecord('x_695068_bcfa_receipt');
                if (!receipt.get(receiptSysId)) {
                    receiptIssues.push(lineLabel + ' references a receipt that does not exist');
                } else {
                    if (poLineSysId && receipt.getValue('po_line') !== poLineSysId) {
                        receiptIssues.push(lineLabel + ' receipt ' + receipt.getValue('receipt_number') + ' belongs to another PO line');
                    }
                    var receiptQty = parseFloat(receipt.getValue('quantity') || '0');
                    evidence.receiptNumber = receipt.getValue('receipt_number');
                    evidence.receiptQuantity = receiptQty;
                    var base = receiptQty > 0 ? receiptQty : (lineQty > 0 ? lineQty : 1);
                    var quantityVariancePct = Math.abs(lineQty - receiptQty) / base;
                    if (quantityVariancePct > maxQuantityVariancePct) maxQuantityVariancePct = quantityVariancePct;
                    quantityVarianceValue += Math.abs(lineQty - receiptQty) * lineUnitPrice;
                }
            }
            lineEvidence.push(evidence);
        }

        var netAmount = parseFloat(invoice.getValue('net_amount') || '0');
        var taxAmount = parseFloat(invoice.getValue('tax_amount') || '0');
        var vendorCountry = this._vendorCountry(invoice.getValue('vendor'));
        var expectation;
        try {
            expectation = new FinancePolicy().apTaxExpectation({ country: vendorCountry || '', company: invoice.getValue('company_code'),
                vendorTaxCategory: this._vendorTaxCategory(invoice.getValue('vendor')) });
        } catch (e) {
            expectation = { regime: 'UNKNOWN', ratePct: null, whtApplicable: false, source: 'tax expectation could not be read: ' + e };
        }
        var taxEvaluation = this.evaluateTax({ netAmount: netAmount, taxAmount: taxAmount, breakdown: this._taxBreakdown(invoice),
            expectation: expectation, tolerances: tolerances });
        var expectedRate = taxEvaluation.expectedRatePct === null ? null : taxEvaluation.expectedRatePct / 100;
        var expectedTax = taxEvaluation.expectedTax;
        var taxVariance = taxEvaluation.taxVariance;
        var taxWithinTolerance = taxEvaluation.result !== 'fail' && taxEvaluation.result !== 'manual_review';

        if (invoicePo && lineCount === 0) linkIssues.push('the invoice references PO ' + invoice.getDisplayValue('purchase_order') + ' but has no lines to match');
        lineTotal = Math.round(lineTotal * 100) / 100;
        // Header-vs-lines check only when lines exist (a header-only
        // non-PO invoice has nothing to compare).
        var lineTotalDifference = lineCount > 0 ? Math.round(Math.abs(lineTotal - netAmount) * 100) / 100 : 0;
        var lineTotalOk = lineTotalDifference <= tolerances.totalAbsolute;

        var withinTolerance = (!currency.required || currency.available) && linkIssues.length === 0 && receiptIssues.length === 0 &&
            (maxQuantityVariancePct <= tolerances.quantityPct) &&
            (maxPriceVariancePct <= tolerances.pricePct) &&
            taxWithinTolerance && lineTotalOk;

        var matchResult = withinTolerance ? 'matched' : 'mismatch';

        // Phase 41, defect 6: the earlier results of this invoice are kept as
        // history and marked superseded, so only this run is current.
        var earlier = new GlideRecord('x_695068_bcfa_ap_match');
        earlier.addQuery('ap_invoice', apInvoiceSysId);
        earlier.addEncodedQuery('superseded=false^ORsupersededISEMPTY'); // rows from before the column existed are empty
        earlier.query();
        while (earlier.next()) {
            earlier.setValue('superseded', true);
            earlier.update();
        }

        var match = new GlideRecord('x_695068_bcfa_ap_match');
        match.initialize();
        match.setValue('ap_invoice', apInvoiceSysId);
        if (matchedPoLine) match.setValue('po_line', matchedPoLine);
        if (matchedReceipt) match.setValue('receipt', matchedReceipt);
        match.setValue('quantity_variance', maxQuantityVariancePct);
        match.setValue('price_variance', maxPriceVariancePct);
        match.setValue('tax_variance', taxVariance);
        match.setValue('within_tolerance', withinTolerance);
        match.setValue('match_result', matchResult);
        match.setValue('evaluated_at', new GlideDateTime().getValue());
        // Phase 40: the tolerance rule used and the expected / actual /
        // variance / result of every check, for the workspace and Playbook.
        match.setValue('tolerance_source', String(tolerances.source || '').substring(0, 255));
        match.setValue('quantity_tolerance_pct', tolerances.quantityPct);
        match.setValue('price_tolerance_pct', tolerances.pricePct);
        match.setValue('tax_tolerance_abs', tolerances.taxAbsolute);
        match.setValue('tax_tolerance_pct', tolerances.taxRelativePct);
        match.setValue('total_tolerance_abs', tolerances.totalAbsolute);
        if (expectedTax !== null) match.setValue('expected_tax', expectedTax);
        match.setValue('tax_result', taxEvaluation.result);
        if (currency.required) match.setValue('fx_detail', String(currency.detail).substring(0, 1000));
        match.setValue('tolerance_detail', this._toleranceDetail(lineEvidence, maxQuantityVariancePct, maxPriceVariancePct, tolerances, taxEvaluation,
            lineTotal, netAmount, lineTotalDifference, lineTotalOk, lineCount).substring(0, 4000));
        var matchSysId = match.insert();

        return {
            matchSysId: matchSysId,
            matchResult: matchResult,
            withinTolerance: withinTolerance,
            quantityVariancePct: maxQuantityVariancePct,
            priceVariancePct: maxPriceVariancePct,
            taxVariance: taxVariance,
            taxWithinTolerance: taxWithinTolerance,
            quantityVarianceValue: Math.round(quantityVarianceValue * 100) / 100,
            priceVarianceValue: Math.round(priceVarianceValue * 100) / 100,
            netAmount: netAmount,
            taxAmount: taxAmount,
            vendorCountry: vendorCountry,
            expectedTaxRate: expectedRate,
            expectedTax: expectedTax,
            taxEvaluation: taxEvaluation,
            lines: lineEvidence,
            lineCount: lineCount,
            linkIssues: linkIssues,
            receiptIssues: receiptIssues,
            lineTotal: lineTotal,
            lineTotalDifference: lineTotalDifference,
            lineTotalOk: lineTotalOk,
            tolerancesUsed: tolerances,
            currency: currency
        };
    },

    // Defect 5: invoice vs PO currency. Same currency (or either unknown):
    // { required: false }. Different: the rate comes only from the governed
    // source, the SAP adapter's getExchangeRate through IntegrationService
    // (MOCK SAP: its static POC rate table; real SAP: SAP's rate), logged as
    // an integration transaction. Returns { required, available, from, to,
    // rate, rateDate, source, detail }.
    currencyCheck: function(invoice) {
        var po = invoice.purchase_order.getRefRecord();
        var from = String(invoice.getValue('currency') || '').toUpperCase();
        var to = po && po.isValidRecord() ? String(po.getValue('currency') || '').toUpperCase() : '';
        if (!from || !to || from === to) return { required: false, from: from, to: to };
        var policy = new FinancePolicy();
        var adapter = policy.sapAdapter();
        var r = new IntegrationService().execute({
            operation: 'getExchangeRate',
            adapter: adapter,
            correlationId: invoice.getValue('correlation_id'),
            idempotencyKey: 'FX-' + from + '-' + to + '-' + gs.generateGUID(),
            sourceTable: 'x_695068_bcfa_ap_invoice',
            sourceRecord: invoice.getUniqueValue(),
            payload: { fromCurrency: from, toCurrency: to, date: invoice.getValue('invoice_date') || '' }
        });
        var res = r.response || {};
        var source = policy.sapLabel() + ' exchange rate (' + (adapter === 'mock_sap' ? 'POC static rate table, MockSAPAdapter' : 'SAP') + ')';
        if (r.status !== 'success' || !res.found || !(res.rate > 0)) {
            return { required: true, available: false, from: from, to: to, source: source,
                detail: 'No approved ' + from + ' to ' + to + ' rate from ' + source + (r.message ? ' (' + r.message + ')' : '') + '; prices were not compared. A person checks the currency.' };
        }
        var rateDate = res.rateDate || new GlideDateTime().getLocalDate().getValue();
        return { required: true, available: true, from: from, to: to, rate: res.rate, rateDate: rateDate, source: source,
            detail: '1 ' + from + ' = ' + res.rate + ' ' + to + ' on ' + rateDate + ' from ' + source + '; invoice prices converted to ' + to + ' before comparison.' };
    },

    // Phase 14: an invoice is a duplicate when another live invoice of the
    // same vendor has the same invoice number after normalization (case,
    // spaces and punctuation ignored), whatever the amount. Same amount is
    // an exact duplicate; a different amount is still flagged (possible
    // re-bill or correction) and a human decides. FAILED and REJECTED
    // invoices do not count, so a rejected invoice can be resubmitted.
    detectDuplicateInvoice: function(apInvoiceSysId) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return { error: 'AP Invoice not found' };

        var duplicateKey = this._computeDuplicateKey(invoice.getValue('vendor'), invoice.getValue('invoice_number'), invoice.getValue('gross_amount'));
        if (invoice.getValue('duplicate_key') !== duplicateKey) {
            invoice.setValue('duplicate_key', duplicateKey);
            invoice.update();
        }
        if (!invoice.getValue('vendor')) return { duplicate: false, duplicateKey: duplicateKey };

        var number = this.normalizeInvoiceNumber(invoice.getValue('invoice_number'));
        var gross = parseFloat(invoice.getValue('gross_amount') || '0');
        var other = new GlideRecord('x_695068_bcfa_ap_invoice');
        other.addQuery('vendor', invoice.getValue('vendor'));
        other.addQuery('sys_id', '!=', apInvoiceSysId);
        other.addQuery('state', 'NOT IN', 'FAILED,REJECTED');
        // Phase 41: only an EARLIER invoice can be the original. Re-checking
        // the original (Re-run Validation / Match) must never flag it as a
        // duplicate of a later copy.
        other.addQuery('sys_created_on', '<=', invoice.getValue('sys_created_on'));
        // Created in the same second: both stay candidates (conservative; a
        // sys_id is not chronological).
        other.orderBy('sys_created_on');
        other.query();
        var sameNumber = null;
        while (other.next()) {
            if (this.normalizeInvoiceNumber(other.getValue('invoice_number')) !== number) continue;
            var otherGross = parseFloat(other.getValue('gross_amount') || '0');
            var exact = Math.abs(otherGross - gross) <= 0.01;
            var found = { duplicate: true, matchedInvoiceSysId: other.getUniqueValue(), matchedInvoiceNumber: other.getValue('invoice_number'),
                matchedState: other.getValue('state'), matchedGross: otherGross, sameAmount: exact, duplicateKey: duplicateKey };
            if (exact) return found;
            if (!sameNumber) sameNumber = found;
        }
        return sameNumber || { duplicate: false, duplicateKey: duplicateKey };
    },

    // Upper case, letters and digits only: "inv-ap 001" == "INVAP001";
    // full-width digits fold ("２６１３２" == "26132") and letters of other
    // scripts are kept (Phase 42).
    normalizeInvoiceNumber: function(value) {
        return this.canonicalText(value).replace(/ /g, '');
    },

    // ---- AR: cash application matching --------------------------------------

    // Phase 13: resolves the invoice references printed on the payment's
    // remittance to open items. Pure lookup, no writes. Never guesses: a
    // reference that does not resolve exactly, references that belong to
    // more than one customer, or an open item in another currency make
    // the result unusable, and the caller falls back or raises an exception.
    // Returns { available:false } when there is no remittance with references.
    resolveRemittanceReferences: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { available: false, error: 'Payment not found' };

        var remittance = new GlideRecord('x_695068_bcfa_remittance');
        remittance.addQuery('payment', paymentSysId);
        remittance.addNotNullQuery('extracted_fields');
        remittance.orderByDesc('sys_created_on');
        remittance.setLimit(1);
        remittance.query();
        if (!remittance.next()) return { available: false };

        var fields = {};
        try {
            fields = JSON.parse(remittance.getValue('extracted_fields')) || {};
        } catch (e) {
            return { available: false };
        }
        var lines = [];
        var refLines = fields.invoice_lines || [];
        for (var l = 0; l < refLines.length; l++) {
            lines.push({ reference: String(refLines[l].invoice_reference || '').trim(), applied: parseFloat(refLines[l].amount_applied || '0') });
        }
        if (lines.length === 0) {
            var refs = fields.invoice_references || [];
            for (var r = 0; r < refs.length; r++) lines.push({ reference: String(refs[r] || '').trim(), applied: null });
        }
        if (lines.length === 0) return { available: false };

        var paymentCustomer = payment.getValue('customer');
        var paymentCurrency = payment.getValue('currency');
        var items = [];
        var unresolved = [];
        var currencyMismatch = [];
        var customers = {};
        for (var i = 0; i < lines.length; i++) {
            var item = new GlideRecord('x_695068_bcfa_ar_open_item');
            item.addQuery('item_number', lines[i].reference);
            item.addQuery('status', '!=', 'cleared');
            if (paymentCustomer) item.addQuery('customer', paymentCustomer);
            item.query();
            if (item.getRowCount() !== 1 || !item.next()) {
                unresolved.push(lines[i].reference);
                continue;
            }
            if (paymentCurrency && item.getValue('currency') && item.getValue('currency') !== paymentCurrency) {
                currencyMismatch.push(lines[i].reference + ' (' + item.getValue('currency') + ')');
            }
            customers[item.getValue('customer')] = true;
            items.push({
                sysId: item.getUniqueValue(),
                itemNumber: item.getValue('item_number'),
                customer: item.getValue('customer'),
                openAmount: parseFloat(item.getValue('open_amount') || '0'),
                applied: lines[i].applied
            });
        }

        var customerIds = [];
        for (var c in customers) customerIds.push(c);
        var openTotal = 0;
        for (var t = 0; t < items.length; t++) openTotal += items[t].openAmount;
        openTotal = Math.round(openTotal * 100) / 100;
        var paymentAmount = parseFloat(payment.getValue('amount') || '0');

        return {
            available: true,
            usable: unresolved.length === 0 && currencyMismatch.length === 0 && customerIds.length === 1,
            remittanceSysId: remittance.getUniqueValue(),
            references: lines,
            items: items,
            unresolved: unresolved,
            currencyMismatch: currencyMismatch,
            customerSysId: customerIds.length === 1 ? customerIds[0] : null,
            customerCount: customerIds.length,
            openTotal: openTotal,
            paymentAmount: paymentAmount,
            residual: Math.round((paymentAmount - openTotal) * 100) / 100,
            deductionHint: fields.deduction_reason ? { amount: fields.deduction_amount, reason: fields.deduction_reason } : null
        };
    },

    // Records the resolved remittance references as selected match
    // candidates (match_type 'remittance'), in remittance order.
    recordRemittanceCandidates: function(paymentSysId, resolution) {
        for (var i = 0; i < resolution.items.length; i++) {
            this._recordMatchCandidate(paymentSysId, resolution.items[i].sysId, resolution.customerSysId, 'remittance', 1.0, i + 1, true);
        }
    },

    exactMatch: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { error: 'Payment not found' };
        if (!payment.getValue('customer')) return { matched: false, reason: 'no customer resolved' };

        var amount = parseFloat(payment.getValue('amount') || '0');
        var item = new GlideRecord('x_695068_bcfa_ar_open_item');
        item.addQuery('customer', payment.getValue('customer'));
        item.addQuery('status', '!=', 'cleared');
        // Phase 14: never match across currencies.
        if (payment.getValue('currency')) item.addQuery('currency', payment.getValue('currency'));
        item.query();
        var candidates = [];
        while (item.next()) {
            var openAmount = parseFloat(item.getValue('open_amount') || '0');
            if (Math.abs(openAmount - amount) <= 0.01) {
                candidates.push(item.getUniqueValue());
            }
        }
        if (candidates.length === 1) {
            this._recordMatchCandidate(paymentSysId, candidates[0], payment.getValue('customer'), 'exact', 1.0, 1, true);
            return { matched: true, arOpenItemSysId: candidates[0] };
        }
        return { matched: false, candidateCount: candidates.length };
    },

    // Greedy multi-invoice allocation suggestion: accumulates the customer's
    // open items (oldest due date first) until the running total reaches the
    // payment amount. Deterministic and simple by design — a POC stand-in
    // for a full subset-sum solver.
    multiInvoiceSuggestion: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { error: 'Payment not found' };
        if (!payment.getValue('customer')) return { matched: false, reason: 'no customer resolved' };

        var amount = parseFloat(payment.getValue('amount') || '0');
        var item = new GlideRecord('x_695068_bcfa_ar_open_item');
        item.addQuery('customer', payment.getValue('customer'));
        item.addQuery('status', '!=', 'cleared');
        if (payment.getValue('currency')) item.addQuery('currency', payment.getValue('currency'));
        item.orderBy('due_date');
        item.query();

        var running = 0;
        var selected = [];
        var rank = 1;
        while (item.next() && running < amount) {
            var openAmount = parseFloat(item.getValue('open_amount') || '0');
            selected.push(item.getUniqueValue());
            this._recordMatchCandidate(paymentSysId, item.getUniqueValue(), payment.getValue('customer'), 'fuzzy', 0.75, rank, false);
            running += openAmount;
            rank++;
        }

        var residual = Math.round((amount - running) * 100) / 100;
        var exact = Math.abs(residual) <= 0.01;
        return { matched: selected.length > 0, exact: exact, residual: residual, arOpenItemSysIds: selected };
    },

    // Phase 14: remitter name -> customer. Compares normalized names (case,
    // punctuation and spacing ignored) against active aliases, then active
    // customer names. A name that points to more than one customer is
    // ambiguous and never resolved; the candidates are returned for a human.
    resolveCustomerByAlias: function(candidateName) {
        var wanted = this.normalizeName(candidateName);
        if (!wanted) return { resolved: false };

        var byCustomer = {};
        var alias = new GlideRecord('x_695068_bcfa_customer_alias');
        alias.addQuery('active', true);
        alias.query();
        while (alias.next()) {
            if (this.normalizeName(alias.getValue('alias_name')) !== wanted) continue;
            var aliasConfidence = parseFloat(alias.getValue('confidence') || '1');
            var existing = byCustomer[alias.getValue('customer')];
            if (!existing || aliasConfidence > existing.confidence) {
                byCustomer[alias.getValue('customer')] = { confidence: aliasConfidence, method: 'alias' };
            }
        }
        var result = this._singleCustomer(byCustomer);
        if (result) return result;

        byCustomer = {};
        var customer = new GlideRecord('x_695068_bcfa_customer');
        customer.addQuery('active', true);
        customer.query();
        while (customer.next()) {
            if (this.normalizeName(customer.getValue('name')) === wanted) {
                byCustomer[customer.getUniqueValue()] = { confidence: 1.0, method: 'exact_name' };
            }
        }
        return this._singleCustomer(byCustomer) || { resolved: false };
    },

    _singleCustomer: function(byCustomer) {
        var ids = [];
        for (var id in byCustomer) ids.push(id);
        if (ids.length === 1) {
            return { resolved: true, customerSysId: ids[0], confidence: byCustomer[ids[0]].confidence, method: byCustomer[ids[0]].method };
        }
        if (ids.length > 1) return { resolved: false, ambiguous: true, candidates: ids };
        return null;
    },

    // Upper case, letters/digits separated by single spaces:
    // "Lone Star Tyre Co." == "LONE STAR TYRE CO". Unicode-safe (Phase 42):
    // "上海某某有限公司", "한국회사", "Müller GmbH" keep their characters.
    normalizeName: function(value) {
        return this.canonicalText(value);
    },

    // Phase 42: Unicode-safe comparison value. The printed value is never
    // changed; this separate canonical value is used only to compare:
    //   - Unicode NFKC: full-width letters, digits and punctuation
    //     ("ＡＢＣ１２３（上海）") and the ideographic space fold to their
    //     standard forms; foldFullWidth covers an engine without normalize()
    //   - upper case (Latin, Greek, Cyrillic ...; scripts without case are
    //     unchanged)
    //   - harmless punctuation (ASCII, general and CJK punctuation such as
    //     、。，「」【】《》・) and whitespace become one space
    //   - letters, digits and marks of every script are kept, accents
    //     included (Müller != Muller)
    // The platform's JavaScript has no \p{L} classes, so the separators are
    // an explicit list (CANONICAL_SEPARATORS); everything else is kept.
    canonicalText: function(value) {
        var s = value === null || value === undefined ? '' : String(value);
        if (typeof s.normalize === 'function') {
            try { s = s.normalize('NFKC'); } catch (e) {}
        }
        s = MatchingEngine.foldFullWidth(s).toUpperCase();
        return s.replace(MatchingEngine.CANONICAL_SEPARATORS, ' ').replace(/\s+/g, ' ').replace(/^ | $/g, '');
    },

    // Phase 14: exact combinations of the customer's open items (same
    // currency) that sum to the payment amount, found by an exhaustive,
    // deterministic search in cents. Stops after maxSolutions. Customers
    // with more than MAX_COMBINATION_ITEMS open items are not searched (the
    // result says so) to bound the work.
    // Returns { searched, solutions: [[{sysId, itemNumber, openAmount}]] }.
    MAX_COMBINATION_ITEMS: 20,

    findExactCombinations: function(paymentSysId, maxSolutions) {
        maxSolutions = maxSolutions || 2;
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId) || !payment.getValue('customer')) return { searched: false, reason: 'no customer', solutions: [] };
        var target = Math.round(parseFloat(payment.getValue('amount') || '0') * 100);

        var items = [];
        var item = new GlideRecord('x_695068_bcfa_ar_open_item');
        item.addQuery('customer', payment.getValue('customer'));
        item.addQuery('status', '!=', 'cleared');
        item.addQuery('open_amount', '>', 0);
        if (payment.getValue('currency')) item.addQuery('currency', payment.getValue('currency'));
        item.orderBy('due_date');
        item.orderBy('item_number');
        item.query();
        while (item.next()) {
            items.push({ sysId: item.getUniqueValue(), itemNumber: item.getValue('item_number'),
                openAmount: parseFloat(item.getValue('open_amount') || '0'), cents: Math.round(parseFloat(item.getValue('open_amount') || '0') * 100) });
        }
        if (items.length > this.MAX_COMBINATION_ITEMS) {
            return { searched: false, reason: items.length + ' open items exceed the search limit of ' + this.MAX_COMBINATION_ITEMS, solutions: [] };
        }

        var solutions = [];
        var chosen = [];
        var search = function(index, remaining) {
            if (solutions.length >= maxSolutions) return;
            if (remaining === 0 && chosen.length > 1) {
                solutions.push(chosen.slice());
                return;
            }
            for (var i = index; i < items.length; i++) {
                if (items[i].cents > remaining) continue;
                chosen.push(items[i]);
                search(i + 1, remaining - items[i].cents);
                chosen.pop();
                if (solutions.length >= maxSolutions) return;
            }
        };
        search(0, target);
        return { searched: true, itemCount: items.length, solutions: solutions };
    },

    // Records one combination as selected candidates, or several as
    // unselected, ranked candidates (rank = combination number) for review.
    recordCombinationCandidates: function(paymentSysId, customerSysId, solutions, selected) {
        for (var s = 0; s < solutions.length; s++) {
            for (var i = 0; i < solutions[s].length; i++) {
                this._recordMatchCandidate(paymentSysId, solutions[s][i].sysId, customerSysId, 'combination', selected ? 1.0 : 0.5, s + 1, !!selected);
            }
        }
    },

    // Phase 14: deterministic suggestion for a short-pay residual, for the
    // reviewer to confirm. A unique open credit note of the customer for
    // exactly the residual suggests credit-note netting; otherwise a residual
    // up to ar.bank_charge.max_amount suggests a bank charge. Never applied
    // automatically.
    classifyResidual: function(paymentSysId, residual) {
        residual = Math.round(parseFloat(residual || '0') * 100) / 100;
        if (residual <= 0.01) return { type: null };
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { type: null };

        if (payment.getValue('customer')) {
            var matches = [];
            var note = new GlideRecord('x_695068_bcfa_credit_note');
            note.addQuery('customer', payment.getValue('customer'));
            note.addQuery('status', 'open');
            note.query();
            while (note.next()) {
                if (Math.abs(parseFloat(note.getValue('open_amount') || '0') - residual) <= 0.01) {
                    matches.push({ sysId: note.getUniqueValue(), number: note.getValue('credit_note_number') });
                }
            }
            if (matches.length === 1) {
                return { type: 'credit_note_netting', creditNoteSysId: matches[0].sysId,
                    rule: 'residual ' + residual + ' equals open credit note ' + matches[0].number + ' of the same customer' };
            }
        }
        var policy = new FinancePolicy();
        // Phase 40: a suggestion only. The reviewer confirms or changes the
        // type, and the decision service enforces each type's limit.
        var roundingMax = policy.arRoundingMax();
        if (residual <= roundingMax) {
            return { type: 'rounding', rule: 'residual ' + residual + ' is within the rounding limit ' + roundingMax + ' (x_695068_bcfa.ar.rounding.max_amount)' };
        }
        var advice = this._adviceDeductionStatement(paymentSysId);
        var stated = advice.reason ? ' (the advice states: "' + advice.reason + '")' : '';
        var paid = parseFloat(payment.getValue('amount') || '0');
        if (/\b(tds|tcs|wht|withholding|tax deducted|income tax)\b/i.test(advice.reason)) {
            var maxWht = Math.round((paid + residual) * policy.arWithholdingMaxPct() * 100) / 100;
            if (residual <= maxWht) {
                return { type: 'withholding_tax', rule: 'residual ' + residual + ' is within the withholding limit ' + maxWht + stated };
            }
        }
        if (/\b(dispute|disputed|damage|damaged|quality|claim|shortage)\b/i.test(advice.reason)) {
            return { type: 'dispute', rule: 'residual ' + residual + ' is disputed by the customer' + stated + '; a dispute is not a deduction and stays open' };
        }
        if (/\b(discount|rebate|commercial|price difference|promotion)\b/i.test(advice.reason)) {
            return { type: 'commercial_deduction', rule: 'residual ' + residual + ' is a commercial deduction' + stated };
        }
        var bankChargeMax = policy.arBankChargeMax();
        if (residual <= bankChargeMax) {
            return { type: 'bank_charge', rule: 'residual ' + residual + ' is within the bank charge limit ' + bankChargeMax + ' (x_695068_bcfa.ar.bank_charge.max_amount)' + stated };
        }
        return { type: null, rule: 'residual ' + residual + ' matches no open credit note, no stated reason and exceeds the bank charge limit ' + bankChargeMax + stated };
    },

    // The deduction the customer's payment advice states (latest remittance
    // of the payment): evidence for the suggestion, never the amount used.
    _adviceDeductionStatement: function(paymentSysId) {
        var r = new GlideRecord('x_695068_bcfa_remittance');
        r.addQuery('payment', paymentSysId);
        r.orderByDesc('sys_created_on');
        r.setLimit(1);
        r.query();
        if (!r.next()) return { reason: '', amount: null };
        var x = {};
        try { x = JSON.parse(r.getValue('extracted_fields') || '{}') || {}; } catch (e) { x = {}; }
        var reasons = [];
        if (x.deduction_reason) reasons.push(String(x.deduction_reason));
        var lines = x.invoice_lines || [];
        for (var i = 0; i < lines.length; i++) if (lines[i] && lines[i].deduction_reason) reasons.push(String(lines[i].deduction_reason));
        return { reason: reasons.join('; '), amount: x.deduction_amount === undefined ? null : x.deduction_amount };
    },

    _recordMatchCandidate: function(paymentSysId, arOpenItemSysId, customerSysId, matchType, confidence, rank, selected) {
        var mc = new GlideRecord('x_695068_bcfa_match_candidate');
        mc.initialize();
        mc.setValue('payment', paymentSysId);
        mc.setValue('ar_open_item', arOpenItemSysId);
        if (customerSysId) mc.setValue('customer_candidate', customerSysId);
        mc.setValue('match_type', matchType);
        mc.setValue('confidence', confidence);
        mc.setValue('rank', rank);
        mc.setValue('selected', !!selected);
        return mc.insert();
    },

    // ---- Phase 40: tax validation --------------------------------------------

    // Results from best to worst. The overall result is the worst check.
    TAX_RESULT_ORDER: ['pass', 'within_tolerance', 'warning', 'manual_review', 'fail'],

    // Validates the tax printed on an invoice against the governed expectation
    // (FinancePolicy.apTaxExpectation). Pure: no reads, no writes. The
    // extraction only supplies what is printed; whether a tax or withholding
    // applies, and at which rate, comes from configuration.
    // input: { netAmount, taxAmount, breakdown: { taxType, ratePct, cgst, sgst,
    //   igst, vat, wht, whtRatePct }, expectation, tolerances }
    // Returns { result, regime, expectedRatePct, expectedTax, taxVariance,
    //   band, source, checks: [text], wht: { applicable, code, ratePct,
    //   expected, extracted, variance, result } }.
    //   pass              variance within rounding
    //   within_tolerance  variance within the tax tolerance band
    //   warning           shown to the reviewer, does not stop the invoice
    //   manual_review     cannot be validated automatically (exception)
    //   fail              outside tolerance or inconsistent (exception)
    evaluateTax: function(input) {
        var b = input.breakdown || {};
        var e = input.expectation || { regime: 'UNKNOWN' };
        var t = input.tolerances || this.DEFAULT_TOLERANCES;
        var rounding = t.roundingAbsolute !== undefined ? t.roundingAbsolute : 0.05;
        var net = Number(input.netAmount) || 0;
        var tax = Number(input.taxAmount) || 0;
        var results = [], checks = [];
        var has = function(v) { return v !== null && v !== undefined && v !== '' && !isNaN(Number(v)); };
        var r2 = function(v) { return Math.round(v * 100) / 100; };
        var add = function(result, text) { results.push(result); checks.push(result.toUpperCase() + ': ' + text); };
        var out = {
            regime: e.regime || 'UNKNOWN', expectedRatePct: null, expectedTax: null, taxVariance: 0, band: null, source: e.source || '',
            wht: { applicable: !!e.whtApplicable, code: e.whtCode || '', ratePct: has(e.whtRatePct) ? Number(e.whtRatePct) : null,
                expected: null, extracted: has(b.wht) ? Number(b.wht) : null, variance: null, result: 'pass' }
        };

        if (!e.regime || e.regime === 'UNKNOWN' || !has(e.ratePct)) {
            add('manual_review', 'no tax expectation is configured (' + (e.source || 'none') + '), so the tax cannot be validated automatically');
        } else {
            var rate = Number(e.ratePct);
            out.expectedRatePct = rate;
            out.expectedTax = r2(net * rate / 100);
            out.taxVariance = r2(Math.abs(tax - out.expectedTax));
            out.band = r2(Math.max(t.taxAbsolute, out.expectedTax * t.taxRelativePct));
            var amountText = 'tax ' + tax + ' vs expected ' + out.expectedTax + ' (' + e.regime + ' ' + rate + '% of net ' + net + '), variance ' +
                out.taxVariance + ', tolerance ' + out.band;
            if (out.taxVariance <= rounding) add('pass', amountText);
            else if (out.taxVariance <= out.band) add('within_tolerance', amountText);
            else add('fail', amountText);

            // A CGST + SGST invoice prints each component's rate (9% + 9% for
            // GST 18%): half the expected rate is the same rate.
            var splitGst = e.regime === 'GST' && (has(b.cgst) || has(b.sgst));
            if (has(b.ratePct) && Math.abs(Number(b.ratePct) - rate) > 0.001 && !(splitGst && Math.abs(Number(b.ratePct) * 2 - rate) <= 0.001)) {
                add('fail', 'printed tax rate ' + Number(b.ratePct) + '% differs from the expected ' + e.regime + ' rate ' + rate + '%');
            }
            var type = String(b.taxType || '').toUpperCase();
            if (type) {
                var printedGst = type.indexOf('GST') >= 0;
                var printedVat = type.indexOf('VAT') >= 0 || type.indexOf('MWST') >= 0 || type.indexOf('UST') >= 0 || type.indexOf('AFA') >= 0;
                if ((e.regime === 'GST' && printedVat && !printedGst) || (e.regime === 'VAT' && printedGst && !printedVat)) {
                    add('warning', 'printed tax type ' + b.taxType + ' does not match the expected regime ' + e.regime);
                }
            }
            if (e.regime === 'GST') {
                var hasCs = has(b.cgst) || has(b.sgst);
                var hasI = has(b.igst);
                if (hasCs && hasI) {
                    add('fail', 'both IGST and CGST/SGST are charged');
                } else if (hasCs) {
                    var cgst = Number(b.cgst) || 0, sgst = Number(b.sgst) || 0;
                    if (Math.abs(cgst - sgst) > rounding) add('fail', 'CGST ' + cgst + ' and SGST ' + sgst + ' are not equal halves of the GST');
                    else if (Math.abs(cgst + sgst - tax) > rounding) add('fail', 'CGST ' + cgst + ' + SGST ' + sgst + ' does not equal the total tax ' + tax);
                    else add('pass', 'CGST ' + cgst + ' + SGST ' + sgst + ' (intra-state split) agrees with the total tax');
                } else if (hasI) {
                    if (Math.abs(Number(b.igst) - tax) > rounding) add('fail', 'IGST ' + Number(b.igst) + ' does not equal the total tax ' + tax);
                    else add('pass', 'IGST ' + Number(b.igst) + ' (inter-state) agrees with the total tax');
                }
            }
            if (e.regime === 'VAT' && has(b.vat) && Math.abs(Number(b.vat) - tax) > rounding) {
                add('fail', 'VAT ' + Number(b.vat) + ' does not equal the total tax ' + tax);
            }
        }

        if (out.wht.applicable && out.wht.ratePct !== null) {
            out.wht.expected = r2(net * out.wht.ratePct / 100);
            if (out.wht.extracted === null) {
                out.wht.result = 'warning';
                add('warning', 'withholding ' + out.wht.code + ' at ' + out.wht.ratePct + '% applies (expected ' + out.wht.expected +
                    ', to be withheld at payment) but none is printed on the invoice');
            } else {
                out.wht.variance = r2(Math.abs(out.wht.extracted - out.wht.expected));
                var whtBand = Math.max(t.taxAbsolute, out.wht.expected * t.taxRelativePct);
                out.wht.result = out.wht.variance <= rounding ? 'pass' : out.wht.variance <= whtBand ? 'within_tolerance' : 'fail';
                add(out.wht.result, 'withholding printed ' + out.wht.extracted + ' vs expected ' + out.wht.expected + ' (' + out.wht.code + ' ' +
                    out.wht.ratePct + '% of net ' + net + '), variance ' + out.wht.variance);
            }
        } else if (out.wht.extracted !== null && out.wht.extracted > 0) {
            out.wht.result = 'manual_review';
            add('manual_review', 'withholding ' + out.wht.extracted + ' is printed but no withholding is configured for this vendor');
        }

        var worst = 0;
        for (var i = 0; i < results.length; i++) worst = Math.max(worst, this.TAX_RESULT_ORDER.indexOf(results[i]));
        out.result = this.TAX_RESULT_ORDER[worst];
        out.checks = checks;
        return out;
    },

    // The tax breakdown as printed (extracted) on the invoice.
    _taxBreakdown: function(invoice) {
        return {
            taxType: invoice.getValue('tax_type'), ratePct: invoice.getValue('tax_rate_pct'), cgst: invoice.getValue('cgst_amount'),
            sgst: invoice.getValue('sgst_amount'), igst: invoice.getValue('igst_amount'), vat: invoice.getValue('vat_amount'),
            wht: invoice.getValue('wht_amount'), whtRatePct: invoice.getValue('wht_rate_pct')
        };
    },

    _vendorTaxCategory: function(vendorSysId) {
        var vendor = new GlideRecord('x_695068_bcfa_vendor');
        if (vendorSysId && vendor.get(vendorSysId)) return vendor.getValue('tax_category') || 'goods';
        return 'goods';
    },

    // Human-readable expected / actual / variance / tolerance / result of
    // every 3-way match check, stored on the match record.
    _toleranceDetail: function(lines, qtyPct, pricePct, t, tax, lineTotal, net, lineDiff, lineOk, lineCount) {
        var pct = function(v) { return (v * 100).toFixed(1) + '%'; };
        var rows = [];
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            if (l.receiptQuantity !== null && l.receiptQuantity !== undefined) {
                rows.push('Line ' + l.lineNumber + ' quantity: expected ' + l.receiptQuantity + ' (GRN ' + (l.receiptNumber || '') + '), actual ' + l.invoiceQuantity);
            }
            if (l.poUnitPrice !== null && l.poUnitPrice !== undefined) {
                rows.push('Line ' + l.lineNumber + ' unit price: expected ' + l.poUnitPrice + ' (PO ' + (l.poNumber || '') + '), actual ' + l.invoiceUnitPrice);
            }
        }
        rows.push('Quantity: largest variance ' + pct(qtyPct) + ', tolerance ' + pct(t.quantityPct) + ' -> ' + (qtyPct > t.quantityPct ? 'EXCEPTION' : 'WITHIN TOLERANCE'));
        rows.push('Unit price: largest variance ' + pct(pricePct) + ', tolerance ' + pct(t.pricePct) + ' -> ' + (pricePct > t.pricePct ? 'EXCEPTION' : 'WITHIN TOLERANCE'));
        rows.push('Tax: ' + tax.result.toUpperCase().replace('_', ' ') + '. ' + tax.checks.join(' | ') + (tax.source ? ' [' + tax.source + ']' : ''));
        if (lineCount > 0) {
            rows.push('Line total: lines ' + lineTotal + ' vs net ' + net + ', difference ' + lineDiff + ', tolerance ' + t.totalAbsolute + ' -> ' + (lineOk ? 'WITHIN TOLERANCE' : 'EXCEPTION'));
        }
        rows.push('Tolerance rule: ' + (t.source || 'engine defaults') + ' (POC ASSUMPTION).');
        return rows.join('\n');
    },


    _vendorCountry: function(vendorSysId) {
        if (!vendorSysId) return null;
        var vendor = new GlideRecord('x_695068_bcfa_vendor');
        if (vendor.get(vendorSysId)) return vendor.getValue('country');
        return null;
    },

    _computeDuplicateKey: function(vendorSysId, invoiceNumber, grossAmount) {
        return (vendorSysId || '') + '|' + (invoiceNumber || '') + '|' + (grossAmount || '');
    },

    _mergeTolerances: function(overrides, context) {
        var merged = {};
        var configured = {};
        try {
            configured = new FinancePolicy().apTolerances(context);
        } catch (e) {
            configured = {};
        }
        for (var k in this.DEFAULT_TOLERANCES) {
            merged[k] = configured.hasOwnProperty(k) ? configured[k] : this.DEFAULT_TOLERANCES[k];
        }
        merged.source = configured.source || 'engine defaults';
        if (overrides) {
            for (var k2 in overrides) {
                merged[k2] = overrides[k2];
            }
        }
        return merged;
    },

    type: 'MatchingEngine'
};
