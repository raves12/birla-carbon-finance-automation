var MockSAPAdapter = Class.create();
MockSAPAdapter.prototype = {
    initialize: function() {},

    // Deterministic pseudo-outcome derived only from the idempotency key —
    // same key always yields the same ground truth, satisfying Section 9's
    // "every mock response must be deterministic" requirement without any
    // stored hidden state. Used to answer "did it actually commit?" when a
    // call was reported as a timeout.
    _deterministicallyCommitted: function(idempotencyKey) {
        var sum = 0;
        var key = idempotencyKey || '';
        for (var i = 0; i < key.length; i++) {
            sum += key.charCodeAt(i);
        }
        return (sum % 2) === 0;
    },

    _sapDocId: function(prefix, idempotencyKey) {
        var sum = 0;
        var key = idempotencyKey || '';
        for (var i = 0; i < key.length; i++) {
            sum += key.charCodeAt(i) * (i + 1);
        }
        return prefix + String(1000000 + (sum % 8999999));
    },

    // ---- Read operations (master/reference data) --------------------------

    getVendor: function(vendorCode) {
        var gr = new GlideRecord('x_695068_bcfa_vendor');
        if (gr.get('vendor_code', vendorCode)) {
            return {
                found: true,
                sysId: gr.getUniqueValue(),
                vendorCode: gr.getValue('vendor_code'),
                name: gr.getValue('name'),
                companyCode: gr.getValue('company_code'),
                currency: gr.getValue('currency'),
                paymentTerms: gr.getValue('payment_terms'),
                active: gr.getValue('active') === '1'
            };
        }
        return { found: false };
    },

    getCustomer: function(customerCode) {
        var gr = new GlideRecord('x_695068_bcfa_customer');
        if (gr.get('customer_code', customerCode)) {
            return {
                found: true,
                sysId: gr.getUniqueValue(),
                customerCode: gr.getValue('customer_code'),
                name: gr.getValue('name'),
                companyCode: gr.getValue('company_code'),
                currency: gr.getValue('currency'),
                active: gr.getValue('active') === '1'
            };
        }
        return { found: false };
    },

    getPO: function(poNumber) {
        var po = new GlideRecord('x_695068_bcfa_purchase_order');
        if (!po.get('po_number', poNumber)) {
            return { found: false };
        }
        var lines = [];
        var line = new GlideRecord('x_695068_bcfa_po_line');
        line.addQuery('purchase_order', po.getUniqueValue());
        line.query();
        while (line.next()) {
            lines.push({
                sysId: line.getUniqueValue(),
                lineNumber: parseInt(line.getValue('line_number'), 10),
                materialOrService: line.getValue('material_or_service'),
                quantity: parseFloat(line.getValue('quantity') || '0'),
                unit: line.getValue('unit'),
                unitPrice: parseFloat(line.getValue('unit_price') || '0'),
                receivedQuantity: parseFloat(line.getValue('received_quantity') || '0')
            });
        }
        return {
            found: true,
            sysId: po.getUniqueValue(),
            poNumber: po.getValue('po_number'),
            vendor: po.getValue('vendor'),
            companyCode: po.getValue('company_code'),
            currency: po.getValue('currency'),
            status: po.getValue('status'),
            lines: lines
        };
    },

    getReceipt: function(receiptNumber) {
        var gr = new GlideRecord('x_695068_bcfa_receipt');
        if (gr.get('receipt_number', receiptNumber)) {
            return {
                found: true,
                sysId: gr.getUniqueValue(),
                receiptNumber: gr.getValue('receipt_number'),
                poLine: gr.getValue('po_line'),
                receiptType: gr.getValue('receipt_type'),
                quantity: parseFloat(gr.getValue('quantity') || '0'),
                sapDocumentId: gr.getValue('sap_document_id')
            };
        }
        return { found: false };
    },

    getOpenARItems: function(customerSysId) {
        var items = [];
        var gr = new GlideRecord('x_695068_bcfa_ar_open_item');
        gr.addQuery('customer', customerSysId);
        gr.addQuery('status', '!=', 'cleared');
        gr.query();
        while (gr.next()) {
            items.push({
                sysId: gr.getUniqueValue(),
                itemNumber: gr.getValue('item_number'),
                currency: gr.getValue('currency'),
                invoiceAmount: parseFloat(gr.getValue('invoice_amount') || '0'),
                openAmount: parseFloat(gr.getValue('open_amount') || '0'),
                dueDate: gr.getValue('due_date'),
                status: gr.getValue('status')
            });
        }
        return { found: true, items: items };
    },

    getCreditNotes: function(customerSysId) {
        var notes = [];
        var gr = new GlideRecord('x_695068_bcfa_credit_note');
        gr.addQuery('customer', customerSysId);
        gr.addQuery('status', 'open');
        gr.query();
        while (gr.next()) {
            notes.push({
                sysId: gr.getUniqueValue(),
                creditNoteNumber: gr.getValue('credit_note_number'),
                amount: parseFloat(gr.getValue('amount') || '0'),
                openAmount: parseFloat(gr.getValue('open_amount') || '0')
            });
        }
        return { found: true, creditNotes: notes };
    },

    getExchangeRate: function(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return { found: true, rate: 1.0 };
        }
        // Small illustrative static rate table for the POC — a real
        // implementation would read SAP table TCURR via CPI.
        var rates = {
            'USD_INR': 83.0, 'INR_USD': 1 / 83.0,
            'EUR_INR': 90.0, 'INR_EUR': 1 / 90.0,
            'USD_EUR': 0.92, 'EUR_USD': 1 / 0.92,
            'HUF_EUR': 0.0025, 'EUR_HUF': 400.0
        };
        var key = fromCurrency + '_' + toCurrency;
        if (rates.hasOwnProperty(key)) {
            return { found: true, rate: rates[key] };
        }
        return { found: false };
    },

    // ---- Write operations (governed, canonical) ----------------------------

    createReceipt: function(payload) {
        var gr = new GlideRecord('x_695068_bcfa_receipt');
        gr.initialize();
        gr.setValue('receipt_number', payload.receiptNumber || ('RCPT' + gs.generateGUID().substring(0, 8).toUpperCase()));
        if (payload.poLine) gr.setValue('po_line', payload.poLine);
        gr.setValue('receipt_type', payload.receiptType || 'grn');
        gr.setValue('quantity', payload.quantity || 0);
        gr.setValue('receipt_date', new GlideDateTime().getDate());
        var sapDocId = this._sapDocId('MIGO', payload.idempotencyKey);
        gr.setValue('sap_document_id', sapDocId);
        var sysId = gr.insert();
        return { status: 'SUCCESS', sysId: sysId, sapDocumentId: sapDocId };
    },

    postVendorInvoice: function(payload) {
        // Never touches x_695068_bcfa_ap_invoice — the canonical contract
        // returns a result; the AP domain layer applies it. See
        // docs/INTEGRATION_CONTRACTS.md.
        var sapDocId = this._sapDocId('MIRO', payload.idempotencyKey);
        return { status: 'SUCCESS', sapDocumentId: sapDocId, message: 'Vendor invoice posted (simulated).' };
    },

    clearPayment: function(payload) {
        var sapDocId = this._sapDocId('FB05', payload.idempotencyKey);
        return { status: 'SUCCESS', sapDocumentId: sapDocId, message: 'Payment cleared (simulated).' };
    },

    // Reveals the ground truth for a previously-timed-out write operation.
    // Implements Section 11's status-query step of Unknown Outcome Control.
    getPostingStatus: function(operation, idempotencyKey) {
        var committed = this._deterministicallyCommitted(idempotencyKey);
        if (committed) {
            var prefix = operation === 'clearPayment' ? 'FB05' : 'MIRO';
            return { outcome: 'COMMITTED', sapDocumentId: this._sapDocId(prefix, idempotencyKey) };
        }
        return { outcome: 'NOT_FOUND' };
    },

    type: 'MockSAPAdapter'
};
