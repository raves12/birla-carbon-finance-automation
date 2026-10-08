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
//
// Contract for an implementation (Phase 41, docs/INTEGRATION_CONTRACTS.md):
//  - writes receive the SAP-ready payload of SapPayloadBuilder (schema
//    bcfa.sap/1: company code, SAP vendor / customer number, dates, amounts,
//    tax, withholding, PO items with goods receipts, open items, deductions
//    with reason codes) plus payload.idempotencyKey; call
//    new SapPayloadBuilder().check(payload) before sending and return
//    VALIDATION_ERROR on errors, so nothing incomplete reaches SAP;
//  - every method returns an object with status:
//      SUCCESS          done (writes: sapDocumentId; a parked clearing also
//                       staged: true)
//      VALIDATION_ERROR SAP refused the request (nothing posted); message
//      TECHNICAL_ERROR  the request did not reach SAP (connection refused,
//                       authentication failed); nothing posted
//      TIMEOUT / UNKNOWN_OUTCOME  the request may have reached SAP; the
//                       outcome is not known (IntegrationService starts
//                       Unknown Outcome Control, never a blind retry)
//      DUPLICATE        SAP already holds this document (reference check)
//    An exception thrown by a write is treated as UNKNOWN_OUTCOME (the
//    request may have been sent); by a read as TECHNICAL_ERROR.
var RealSAPAdapter = Class.create();

// The canonical operations every SAP adapter must implement.
RealSAPAdapter.CANONICAL_OPERATIONS = [
    'getVendor', 'getCustomer', 'getPurchaseOrder', 'getReceipt', 'getOpenItems',
    'postVendorInvoice', 'clearCustomerPayment', 'queryTransactionStatus', 'getDraftStatus'
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
    // Governed exchange rate (Phase 41, defect 5): SAP's rate (e.g. TCURR,
    // rate type M) on the date: { found, rate, rateDate, rateType }.
    getExchangeRate: function(fromCurrency, toCurrency) { return this._notConfigured('getExchangeRate'); },
    // DRAFT mode: would read the parked clearing document and answer
    // { outcome: 'POSTED', sapDocumentId } | { outcome: 'DRAFT_PENDING' } |
    // { outcome: 'DRAFT_REJECTED' } (deleted or rejected in SAP).
    getDraftStatus: function(draftDocumentId, idempotencyKey) {
        return { outcome: 'UNAVAILABLE', message: 'Real SAP adapter is not configured.' };
    },

    type: 'RealSAPAdapter'
};
