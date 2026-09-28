var MatchingEngine = Class.create();
MatchingEngine.prototype = {
    initialize: function() {},

    // Fallback tolerances, used only if FinancePolicy cannot be read. The
    // live values are the x_695068_bcfa.ap.tolerance.* properties (POC
    // ASSUMPTION, quantity 2%) — see FinancePolicy.apTolerances().
    DEFAULT_TOLERANCES: {
        quantityPct: 0.02,
        pricePct: 0.02,
        taxAbsolute: 1.0,
        taxRelativePct: 0.02
    },

    TAX_RATE_BY_COUNTRY: {
        'India': 0.18,
        'Hungary': 0.27,
        'United States': 0.0,
        'Germany': 0.19
    },

    // ---- AP: 3-way match ----------------------------------------------------

    threeWayMatch: function(apInvoiceSysId, toleranceOverrides) {
        var tolerances = this._mergeTolerances(toleranceOverrides);

        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) {
            return { error: 'AP Invoice not found' };
        }

        var maxQuantityVariancePct = 0;
        var maxPriceVariancePct = 0;
        var matchedPoLine = null;
        var matchedReceipt = null;
        // Per-line evidence for the exception record and the AI agents.
        var lineEvidence = [];
        var quantityVarianceValue = 0;
        var priceVarianceValue = 0;

        var line = new GlideRecord('x_695068_bcfa_ap_invoice_line');
        line.addQuery('ap_invoice', apInvoiceSysId);
        line.query();
        while (line.next()) {
            var poLineSysId = line.getValue('po_line');
            var receiptSysId = line.getValue('receipt_reference');
            var lineQty = parseFloat(line.getValue('quantity') || '0');
            var lineUnitPrice = parseFloat(line.getValue('unit_price') || '0');
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
                if (poLine.get(poLineSysId)) {
                    var poUnitPrice = parseFloat(poLine.getValue('unit_price') || '0');
                    evidence.poNumber = poLine.getDisplayValue('purchase_order');
                    evidence.poQuantity = parseFloat(poLine.getValue('quantity') || '0');
                    evidence.poUnitPrice = poUnitPrice;
                    if (poUnitPrice > 0) {
                        var priceVariancePct = Math.abs(lineUnitPrice - poUnitPrice) / poUnitPrice;
                        if (priceVariancePct > maxPriceVariancePct) maxPriceVariancePct = priceVariancePct;
                        priceVarianceValue += Math.abs(lineUnitPrice - poUnitPrice) * lineQty;
                    }
                }
            }

            if (receiptSysId) {
                matchedReceipt = receiptSysId;
                var receipt = new GlideRecord('x_695068_bcfa_receipt');
                if (receipt.get(receiptSysId)) {
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
        var expectedRate = this.TAX_RATE_BY_COUNTRY.hasOwnProperty(vendorCountry) ? this.TAX_RATE_BY_COUNTRY[vendorCountry] : null;
        var taxVariance = 0;
        var taxWithinTolerance = true;
        var expectedTax = null;
        if (expectedRate !== null) {
            expectedTax = Math.round(netAmount * expectedRate * 100) / 100;
            taxVariance = Math.abs(taxAmount - expectedTax);
            var taxToleranceBand = Math.max(tolerances.taxAbsolute, expectedTax * tolerances.taxRelativePct);
            taxWithinTolerance = taxVariance <= taxToleranceBand;
        }

        var withinTolerance = (maxQuantityVariancePct <= tolerances.quantityPct) &&
            (maxPriceVariancePct <= tolerances.pricePct) &&
            taxWithinTolerance;

        var matchResult = withinTolerance ? 'matched' : 'mismatch';

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
            lines: lineEvidence,
            tolerancesUsed: tolerances
        };
    },

    detectDuplicateInvoice: function(apInvoiceSysId) {
        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!invoice.get(apInvoiceSysId)) return { error: 'AP Invoice not found' };

        var duplicateKey = this._computeDuplicateKey(invoice.getValue('vendor'), invoice.getValue('invoice_number'), invoice.getValue('gross_amount'));
        if (invoice.getValue('duplicate_key') !== duplicateKey) {
            invoice.setValue('duplicate_key', duplicateKey);
            invoice.update();
        }

        var other = new GlideRecord('x_695068_bcfa_ap_invoice');
        other.addQuery('duplicate_key', duplicateKey);
        other.addQuery('sys_id', '!=', apInvoiceSysId);
        other.addQuery('state', '!=', 'FAILED');
        other.setLimit(1);
        other.query();
        if (other.next()) {
            return { duplicate: true, matchedInvoiceSysId: other.getUniqueValue(), duplicateKey: duplicateKey };
        }
        return { duplicate: false, duplicateKey: duplicateKey };
    },

    // ---- AR: cash application matching --------------------------------------

    exactMatch: function(paymentSysId) {
        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(paymentSysId)) return { error: 'Payment not found' };
        if (!payment.getValue('customer')) return { matched: false, reason: 'no customer resolved' };

        var amount = parseFloat(payment.getValue('amount') || '0');
        var item = new GlideRecord('x_695068_bcfa_ar_open_item');
        item.addQuery('customer', payment.getValue('customer'));
        item.addQuery('status', '!=', 'cleared');
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

    resolveCustomerByAlias: function(candidateName) {
        if (!candidateName) return { resolved: false };
        var alias = new GlideRecord('x_695068_bcfa_customer_alias');
        alias.addQuery('alias_name', candidateName);
        alias.addQuery('active', true);
        alias.orderByDesc('confidence');
        alias.setLimit(1);
        alias.query();
        if (alias.next()) {
            return { resolved: true, customerSysId: alias.getValue('customer'), confidence: parseFloat(alias.getValue('confidence') || '1') };
        }
        var customer = new GlideRecord('x_695068_bcfa_customer');
        customer.addQuery('name', candidateName);
        customer.setLimit(1);
        customer.query();
        if (customer.next()) {
            return { resolved: true, customerSysId: customer.getUniqueValue(), confidence: 1.0 };
        }
        return { resolved: false };
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

    _vendorCountry: function(vendorSysId) {
        if (!vendorSysId) return null;
        var vendor = new GlideRecord('x_695068_bcfa_vendor');
        if (vendor.get(vendorSysId)) return vendor.getValue('country');
        return null;
    },

    _computeDuplicateKey: function(vendorSysId, invoiceNumber, grossAmount) {
        return (vendorSysId || '') + '|' + (invoiceNumber || '') + '|' + (grossAmount || '');
    },

    _mergeTolerances: function(overrides) {
        var merged = {};
        var configured = {};
        try {
            configured = new FinancePolicy().apTolerances();
        } catch (e) {
            configured = {};
        }
        for (var k in this.DEFAULT_TOLERANCES) {
            merged[k] = configured.hasOwnProperty(k) ? configured[k] : this.DEFAULT_TOLERANCES[k];
        }
        if (overrides) {
            for (var k2 in overrides) {
                merged[k2] = overrides[k2];
            }
        }
        return merged;
    },

    type: 'MatchingEngine'
};
