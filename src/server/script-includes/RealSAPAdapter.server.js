// The seam for a real SAP connection (Phase 18). It implements the same
// canonical interface as MockSAPAdapter, so IntegrationService, the domain
// services and the Integration Transaction log do not change when SAP is
// connected; only this class does (e.g. calls to SAP through SAP Integration
// Suite / CPI with a ServiceNow Connection & Credential alias).
//
// Until that connection is configured every method returns
// { status: 'NOT_CONFIGURED' } and sends nothing. IntegrationService treats
// that as a definite, safe failure (nothing was sent, so nothing can have
// committed). No real SAP interface details have been provided for this POC
// (docs/OPEN_SAP_GAPS.md); Mock SAP stays authoritative.
var RealSAPAdapter = Class.create();

// The canonical operations every SAP adapter must implement.
RealSAPAdapter.CANONICAL_OPERATIONS = [
    'getVendor', 'getCustomer', 'getPurchaseOrder', 'getReceipt', 'getOpenItems',
    'postVendorInvoice', 'clearCustomerPayment', 'queryTransactionStatus'
];

RealSAPAdapter.prototype = {
    initialize: function() {},

    _notConfigured: function(operation) {
        return { status: 'NOT_CONFIGURED', found: false, operation: operation,
            message: 'Real SAP adapter is not configured: no SAP connection has been defined for this POC.' };
    },

    getVendor: function(vendorCode) { return this._notConfigured('getVendor'); },
    getCustomer: function(customerCode) { return this._notConfigured('getCustomer'); },
    getPurchaseOrder: function(poNumber) { return this._notConfigured('getPurchaseOrder'); },
    getReceipt: function(receiptNumber) { return this._notConfigured('getReceipt'); },
    getOpenItems: function(customerSysId) { return this._notConfigured('getOpenItems'); },
    postVendorInvoice: function(payload) { return this._notConfigured('postVendorInvoice'); },
    clearCustomerPayment: function(payload) { return this._notConfigured('clearCustomerPayment'); },
    // Would ask SAP whether a write with this idempotency key / external
    // reference committed (e.g. by the reference stored in the SAP document).
    queryTransactionStatus: function(operation, idempotencyKey, externalReference) {
        return { outcome: 'UNAVAILABLE', message: 'Real SAP adapter is not configured.' };
    },

    type: 'RealSAPAdapter'
};
