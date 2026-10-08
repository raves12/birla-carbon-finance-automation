// SAP-ready request data (Phase 41). Builds the canonical payload of the two
// SAP writes from the BCFA records, so a real SAP adapter only has to map
// fields to its interface (MIRO / BAPI_INCOMINGINVOICE_CREATE, FB05 or the
// agreed clearing interface) and never reads BCFA tables itself.
//
//   invoicePosting(invoiceSysId)          -> postVendorInvoice payload
//   paymentClearing(paymentSysId, mode)   -> clearCustomerPayment payload
//   check(payload)                        -> { errors, warnings }
//
// Every payload carries schema SapPayloadBuilder.SCHEMA. Values come from the
// records; where SAP needs a value the record does not hold, the documented
// fallback is used and named in payload.defaults (e.g. posting date = today).
// check() lists what SAP would reject (errors) and what looks wrong
// (warnings); MOCK SAP applies it (strict or warn, x_695068_bcfa.mock_sap.
// strict_validation) and a real adapter should call it before sending.
// See docs/INTEGRATION_CONTRACTS.md (SAP request data).
var SapPayloadBuilder = Class.create();

SapPayloadBuilder.SCHEMA = 'bcfa.sap/1';
// BCFA deduction type -> SAP reason code (POC placeholder values: the client's
// SAP customising defines the real reason codes; docs/OPEN_SAP_GAPS.md).
SapPayloadBuilder.REASON_CODES = {
    short_pay: 'Z01', bank_charge: 'Z02', tcs: 'Z03', withholding_tax: 'Z04', credit_note_netting: 'Z05',
    debit_note: 'Z06', commercial_deduction: 'Z07', fx_difference: 'Z08', rounding: 'Z09'
};
SapPayloadBuilder.TOLERANCE = 0.01;

SapPayloadBuilder.prototype = {
    initialize: function() {},

    // ---- AP: vendor invoice posting -----------------------------------------

    invoicePosting: function(invoiceSysId) {
        var inv = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (!inv.get(invoiceSysId)) return null;
        var vendor = inv.vendor.getRefRecord(), po = inv.purchase_order.getRefRecord();
        var hasVendor = vendor && vendor.isValidRecord(), hasPo = po && po.isValidRecord();
        var defaults = [];
        var companyCode = this._first(defaults, 'companyCode', [
            [inv.getValue('company_code'), ''],
            [hasPo ? po.getValue('company_code') : '', 'from the purchase order'],
            [hasVendor ? vendor.getValue('company_code') : '', 'from the vendor']]);
        var postingDate = this._first(defaults, 'postingDate', [
            [inv.getValue('posting_date'), ''],
            [new GlideDateTime().getLocalDate().getValue(), 'today']]);

        var items = [];
        var line = new GlideRecord('x_695068_bcfa_ap_invoice_line');
        line.addQuery('ap_invoice', invoiceSysId);
        line.orderBy('line_number');
        line.query();
        while (line.next()) {
            var pol = line.po_line.getRefRecord(), gr = line.receipt_reference.getRefRecord();
            var hasPol = pol && pol.isValidRecord(), hasGr = gr && gr.isValidRecord();
            items.push({
                line: this._int(line.getValue('line_number')),
                poNumber: hasPol ? pol.purchase_order.getRefRecord().getValue('po_number') : (hasPo ? po.getValue('po_number') : ''),
                poItem: hasPol ? this._int(pol.getValue('line_number')) : null,
                material: line.getValue('material_or_service') || (hasPol ? pol.getValue('material_or_service') : ''),
                quantity: this._num(line.getValue('quantity')),
                unit: line.getValue('unit') || (hasPol ? pol.getValue('unit') : ''),
                unitPrice: this._num(line.getValue('unit_price')),
                amount: this._num(line.getValue('amount')) || this._round(this._num(line.getValue('quantity')) * this._num(line.getValue('unit_price'))),
                tax: this._num(line.getValue('tax')),
                goodsReceipt: hasGr ? gr.getValue('receipt_number') : '',
                goodsReceiptDocument: hasGr ? gr.getValue('sap_document_id') : ''
            });
        }

        var wht = null;
        if (inv.getValue('wht_applicable') === '1' || this._num(inv.getValue('wht_amount'))) {
            wht = { code: inv.getValue('wht_code'), ratePct: this._num(inv.getValue('wht_rate_pct')),
                amount: this._num(inv.getValue('wht_amount')), expectedAmount: this._num(inv.getValue('wht_expected_amount')) };
        }
        return {
            schema: SapPayloadBuilder.SCHEMA,
            operation: 'postVendorInvoice',
            sourceRecord: invoiceSysId,
            correlationId: inv.getValue('correlation_id'),
            companyCode: companyCode,
            vendor: { code: hasVendor ? vendor.getValue('vendor_code') : '', name: hasVendor ? vendor.getValue('name') : '' },
            reference: inv.getValue('invoice_number'),
            documentDate: inv.getValue('invoice_date'),
            postingDate: postingDate,
            currency: inv.getValue('currency'),
            grossAmount: this._num(inv.getValue('gross_amount')),
            netAmount: this._num(inv.getValue('net_amount')),
            taxAmount: this._num(inv.getValue('tax_amount')),
            // Phase 41: charges printed as their own lines and discount.
            chargesAmount: this._num(inv.getValue('charges_amount')),
            discountAmount: this._num(inv.getValue('discount_amount')),
            tax: {
                type: inv.getValue('tax_type'), ratePct: this._num(inv.getValue('tax_rate_pct')),
                igst: this._num(inv.getValue('igst_amount')), cgst: this._num(inv.getValue('cgst_amount')),
                sgst: this._num(inv.getValue('sgst_amount')), vat: this._num(inv.getValue('vat_amount')),
                validation: inv.getValue('tax_validation_result')
            },
            withholding: wht,
            purchaseOrder: hasPo ? po.getValue('po_number') : '',
            items: items,
            defaults: defaults
        };
    },

    // ---- AR: customer payment clearing ---------------------------------------

    paymentClearing: function(paymentSysId, processingMode) {
        var pay = new GlideRecord('x_695068_bcfa_payment');
        if (!pay.get(paymentSysId)) return null;
        var customer = pay.customer.getRefRecord(), hasCustomer = customer && customer.isValidRecord();
        var defaults = [];
        var items = [], deductions = [], allocated = 0, deducted = 0, firstItemCompany = '';
        var al = new GlideRecord('x_695068_bcfa_payment_allocation');
        al.addQuery('payment', paymentSysId);
        al.addQuery('allocation_state', '!=', 'reversed');
        al.query();
        while (al.next()) {
            var oi = al.ar_open_item.getRefRecord(), hasOi = oi && oi.isValidRecord();
            if (hasOi && !firstItemCompany) firstItemCompany = oi.getValue('company_code');
            var clearAmount = this._num(al.getValue('allocated_amount'));
            allocated += clearAmount;
            items.push({
                openItem: hasOi ? oi.getValue('item_number') : '',
                companyCode: hasOi ? oi.getValue('company_code') : '',
                currency: hasOi ? oi.getValue('currency') : '',
                openAmount: hasOi ? this._num(oi.getValue('open_amount')) : 0,
                clearAmount: clearAmount,
                discount: this._num(al.getValue('discount')),
                bankCharge: this._num(al.getValue('bank_charge')),
                tcs: this._num(al.getValue('tcs'))
            });
            var d = new GlideRecord('x_695068_bcfa_deduction');
            d.addQuery('payment_allocation', al.getUniqueValue());
            d.addQuery('status', 'approved');
            d.query();
            while (d.next()) {
                var amount = this._num(d.getValue('amount'));
                deducted += amount;
                var cn = d.credit_note.getRefRecord();
                deductions.push({
                    type: d.getValue('deduction_type'),
                    reasonCode: SapPayloadBuilder.REASON_CODES[d.getValue('deduction_type')] || '',
                    amount: amount,
                    currency: d.getValue('currency') || pay.getValue('currency'),
                    openItem: hasOi ? oi.getValue('item_number') : '',
                    adviceReason: d.getValue('advice_reason'),
                    creditNote: cn && cn.isValidRecord() ? cn.getValue('credit_note_number') : ''
                });
            }
        }
        var companyCode = this._first(defaults, 'companyCode', [
            [hasCustomer ? customer.getValue('company_code') : '', 'from the customer'],
            [firstItemCompany, 'from the first open item']]);
        var postingDate = this._first(defaults, 'postingDate', [
            [pay.getValue('posting_date'), ''],
            [pay.getValue('value_date'), 'the value date'],
            [new GlideDateTime().getLocalDate().getValue(), 'today']]);
        var amount = this._num(pay.getValue('amount'));
        var residual = this._round(amount - (allocated - deducted));
        return {
            schema: SapPayloadBuilder.SCHEMA,
            operation: 'clearCustomerPayment',
            sourceRecord: paymentSysId,
            correlationId: pay.getValue('correlation_id'),
            processingMode: processingMode === 'draft' ? 'draft' : 'direct',
            companyCode: companyCode,
            customer: { code: hasCustomer ? customer.getValue('customer_code') : '', name: hasCustomer ? customer.getValue('name') : '' },
            bankReference: pay.getValue('bank_reference'),
            bankAccount: pay.getValue('bank_account'),
            valueDate: pay.getValue('value_date'),
            postingDate: postingDate,
            currency: pay.getValue('currency'),
            amount: amount,
            items: items,
            deductions: deductions,
            residual: { amount: residual, treatment: Math.abs(residual) <= SapPayloadBuilder.TOLERANCE ? 'none' : residual < 0 ? 'short_payment' : 'overpayment' },
            totals: { cleared: this._round(allocated), deductions: this._round(deducted) },
            defaults: defaults
        };
    },

    // ---- Check -------------------------------------------------------------------

    // What SAP would reject (errors) and what looks wrong (warnings). Only
    // payloads of this schema are checked; anything else returns no findings.
    check: function(p) {
        var errors = [], warnings = [];
        if (!p || p.schema !== SapPayloadBuilder.SCHEMA) return { errors: errors, warnings: warnings, checked: false };
        var need = function(value, label) { if (value === '' || value === null || value === undefined) errors.push(label + ' is missing'); };
        need(p.companyCode, 'Company code');
        need(p.currency, 'Currency');
        need(p.postingDate, 'Posting date');
        if (p.operation === 'postVendorInvoice') {
            need(p.vendor && p.vendor.code, 'SAP vendor number');
            need(p.reference, 'Invoice reference (invoice number)');
            need(p.documentDate, 'Document (invoice) date');
            if (!(p.grossAmount > 0)) errors.push('Gross amount must be greater than zero');
            if (p.purchaseOrder) {
                if (!p.items || !p.items.length) errors.push('PO invoice without items');
                for (var i = 0; p.items && i < p.items.length; i++) {
                    var it = p.items[i];
                    if (!it.poItem) errors.push('Item ' + it.line + ': PO item is missing');
                    if (!(it.quantity > 0)) errors.push('Item ' + it.line + ': quantity must be greater than zero');
                    if (!it.goodsReceipt) warnings.push('Item ' + it.line + ': no goods receipt reference (GR-based invoice verification needs one)');
                }
            }
            var charges = p.chargesAmount || 0, discount = p.discountAmount || 0;
            var readings = [p.netAmount + p.taxAmount + charges - discount, p.netAmount + p.taxAmount, p.netAmount + p.taxAmount + charges];
            var balanced = false;
            for (var r = 0; r < readings.length; r++) if (Math.abs(this._round(readings[r]) - p.grossAmount) <= SapPayloadBuilder.TOLERANCE) balanced = true;
            if (!balanced) {
                errors.push('Net ' + p.netAmount + ' + tax ' + p.taxAmount + ' + charges ' + charges + ' - discount ' + discount + ' does not equal gross ' + p.grossAmount);
            }
            if (p.taxAmount > 0 && !(p.tax && p.tax.type)) warnings.push('Tax amount without a tax type: SAP needs a tax code');
            if (p.withholding && !p.withholding.code) warnings.push('Withholding tax without a withholding tax code');
        } else if (p.operation === 'clearCustomerPayment') {
            need(p.customer && p.customer.code, 'SAP customer number');
            need(p.bankReference, 'Bank reference');
            need(p.valueDate, 'Value date');
            if (!(p.amount > 0)) errors.push('Payment amount must be greater than zero');
            if (!p.items || !p.items.length) errors.push('No open items to clear');
            if (!p.bankAccount) warnings.push('No bank account: SAP derives the house bank / bank GL account from the company code');
            for (var j = 0; p.deductions && j < p.deductions.length; j++) {
                if (!p.deductions[j].reasonCode) errors.push('Deduction ' + p.deductions[j].type + ' ' + p.deductions[j].amount + ': no SAP reason code');
            }
            for (var k = 0; p.items && k < p.items.length; k++) {
                if (p.items[k].currency && p.items[k].currency !== p.currency) warnings.push('Open item ' + p.items[k].openItem + ' is in ' + p.items[k].currency + ', the payment in ' + p.currency);
            }
            if (p.residual && p.residual.treatment !== 'none') warnings.push('Residual ' + p.residual.amount + ' (' + p.residual.treatment.replace('_', ' ') + '): SAP needs a residual item or on-account posting');
        }
        return { errors: errors, warnings: warnings, checked: true };
    },

    // ---- helpers -------------------------------------------------------------------

    // First non-empty candidate [value, how]; a fallback is noted in defaults.
    _first: function(defaults, field, candidates) {
        for (var i = 0; i < candidates.length; i++) {
            if (candidates[i][0]) {
                if (i > 0 && candidates[i][1]) defaults.push(field + ': ' + candidates[i][1]);
                return candidates[i][0];
            }
        }
        return '';
    },

    _num: function(v) {
        var n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    },

    _int: function(v) {
        var n = parseInt(v, 10);
        return isNaN(n) ? null : n;
    },

    _round: function(n) {
        return Math.round(n * 100) / 100;
    },

    type: 'SapPayloadBuilder'
};
