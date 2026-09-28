// Simulated document extraction for the synthetic fixtures (Phase 12).
//
// ServiceNow Document Intelligence is configured on this instance (Phase 5)
// but its extraction returns no values: prediction uses the untrained
// "Classic" method and generative extraction is not entitled (see
// docs/CONTENT_UNDERSTANDING.md). Until it is licensed and trained, the
// reading step uses the values printed on each synthetic PDF in
// test/fixtures/, looked up by the attachment's file name. No AI and no
// external call is involved, and every result is labelled simulated.
//
// Only reading is simulated. Everything after it (vendor/PO/GRN resolution,
// duplicate check, 3-way match, exceptions, approval, posting) is the real
// deterministic pipeline. A document that is not a known fixture is sent
// to manual review rather than guessed.
var SimulatedDocumentExtraction = Class.create();

SimulatedDocumentExtraction.SOURCE = 'simulated_document_intelligence';

// Values as printed on each fixture PDF. vendor_code is left empty: the
// documents only show the vendor name, which the pipeline resolves against
// vendor master data. confidence reflects legibility of the fixture.
SimulatedDocumentExtraction.AP_FIXTURES = {
    'AP_INV_001_CLEAN.pdf': {
        invoice_number: 'INV-AP-001', invoice_date: '2026-09-20', vendor_code: '', vendor_name: 'Rajasthan Carbon Feedstock Pvt Ltd',
        company_code: 'BC01', po_number: 'PO0001', currency: 'INR', net_amount: 5000, tax_amount: 900, gross_amount: 5900,
        lines: [{ line_number: 1, description: 'Carbon Black Feedstock', quantity: 100, unit: 'MT', unit_price: 50, net_amount: 5000, tax_amount: 900 }],
        confidence: 0.97, warnings: []
    },
    'AP_INV_002_QTY_VARIANCE.pdf': {
        invoice_number: 'INV-AP-004', invoice_date: '2026-09-20', vendor_code: '', vendor_name: 'Rhine Logistics GmbH',
        company_code: 'BC01', po_number: 'PO0004', currency: 'EUR', net_amount: 7500, tax_amount: 1425, gross_amount: 8925,
        lines: [{ line_number: 1, description: 'Packaging Equipment - Unit B4', quantity: 15, unit: 'EA', unit_price: 500, net_amount: 7500, tax_amount: 1425 }],
        confidence: 0.96, warnings: ['Document note: quantity delivered (15 EA) exceeds PO0004 / GRN RCPT0004 recorded quantity (10 EA).']
    },
    'AP_INV_003_PRICE_VARIANCE.pdf': {
        invoice_number: 'INV-AP-005', invoice_date: '2026-09-20', vendor_code: '', vendor_name: 'Gulf Coast Feedstock LLC',
        company_code: 'BC01', po_number: 'PO0005', currency: 'USD', net_amount: 15000, tax_amount: 0, gross_amount: 15000,
        lines: [{ line_number: 1, description: 'Carbon Black Feedstock', quantity: 300, unit: 'MT', unit_price: 50, net_amount: 15000, tax_amount: 0 }],
        confidence: 0.96, warnings: ['Document note: invoiced unit price (USD 50.00/MT) exceeds PO0005 contracted price (USD 40.00/MT).']
    },
    'AP_INV_004_DUPLICATE.pdf': {
        invoice_number: 'INV-AP-001', invoice_date: '2026-09-20', vendor_code: '', vendor_name: 'Rajasthan Carbon Feedstock Pvt Ltd',
        company_code: 'BC01', po_number: 'PO0001', currency: 'INR', net_amount: 5000, tax_amount: 900, gross_amount: 5900,
        lines: [{ line_number: 1, description: 'Carbon Black Feedstock', quantity: 100, unit: 'MT', unit_price: 50, net_amount: 5000, tax_amount: 900 }],
        confidence: 0.96, warnings: ['Document is marked TAX INVOICE (RESUBMISSION).']
    },
    'AP_INV_005_TAX_EXCEPTION.pdf': {
        invoice_number: 'INV-AP-006', invoice_date: '2026-09-20', vendor_code: '', vendor_name: 'Chennai Packaging Solutions',
        company_code: 'BC01', po_number: 'PO0006', currency: 'INR', net_amount: 2000, tax_amount: 50, gross_amount: 2050,
        lines: [{ line_number: 1, description: 'Packaging Cartons - Type A', quantity: 1000, unit: 'EA', unit_price: 2, net_amount: 2000, tax_amount: 50 }],
        confidence: 0.95, warnings: ['Document note: tax shown (INR 50.00) is inconsistent with the expected India GST rate of 18%.']
    },
    'AP_INV_006_LOW_CONFIDENCE.pdf': {
        invoice_number: 'INV-AP-007', invoice_date: '2026-09-20', vendor_code: '', vendor_name: 'Miskolc Freight Svcs.',
        company_code: 'BC01', po_number: '', currency: 'EUR', net_amount: 3000, tax_amount: 0, gross_amount: 3000,
        lines: [{ line_number: 1, description: 'Freight chgs - see attch.', quantity: 0, unit: '', unit_price: 0, net_amount: 3000, tax_amount: 0 }],
        confidence: 0.55, warnings: ['Scan quality poor: PO reference, tax breakdown and vendor registration number not clearly legible.', 'Line quantity and unit price unreadable; line amount marked as an estimate.']
    }
};

SimulatedDocumentExtraction.prototype = {
    initialize: function() {},

    // Returns the same envelope shape the legacy extractor returned:
    // { ok:true, data, source, fileName } or { ok:false, safeError }.
    extractApInvoiceDocument: function(intakeSysId) {
        var attachment = new GlideRecord('sys_attachment');
        attachment.addQuery('table_name', 'x_695068_bcfa_finance_intake');
        attachment.addQuery('table_sys_id', intakeSysId);
        attachment.orderByDesc('sys_created_on');
        attachment.setLimit(1);
        attachment.query();
        if (!attachment.next()) return { ok: false, safeError: 'No attachment on this intake record.' };

        var fileName = attachment.getValue('file_name');
        var fixture = SimulatedDocumentExtraction.AP_FIXTURES[fileName];
        if (!fixture) {
            return {
                ok: false,
                safeError: 'Simulated extraction has no values for "' + fileName + '". Document Intelligence extraction is not licensed on this instance, so this document needs manual entry.'
            };
        }
        // Copy so callers can never change the registry.
        var data = JSON.parse(JSON.stringify(fixture));
        data.extraction_method = 'SIMULATED (fixture values; Document Intelligence extraction not licensed)';
        return { ok: true, data: data, source: SimulatedDocumentExtraction.SOURCE, fileName: fileName };
    },

    type: 'SimulatedDocumentExtraction'
};
