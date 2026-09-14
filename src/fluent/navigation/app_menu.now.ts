import { ApplicationMenu, Record } from '@servicenow/sdk/core'

// UAT finding: the app had no navigator entry at all — every table had to be
// reached by typing a raw list URL, which is not something to hand a client
// presenter. This gives the demo a normal ServiceNow "All" menu entry with
// one section per part of the story: AP, AR, reference/master data, and the
// cross-cutting integration/audit evidence trail. Fluent source files only
// allow literal builder calls (no helper functions/ternaries), so each
// module is written out explicitly rather than generated from a loop.

export const bcfaAppMenu = ApplicationMenu({
    $id: Now.ID['bcfa-app-menu'],
    title: 'Birla Carbon Finance Automation',
    hint: 'AP invoice processing and AR cash application — POC',
    description: 'Accounts Payable and Accounts Receivable orchestration/exception/approval/audit layer over a mock SAP ECC.',
    active: true,
})

// --- Accounts Payable -------------------------------------------------------
export const modApInvoices = Record({
    $id: Now.ID['bcfa-mod-ap-invoices'],
    table: 'sys_app_module',
    data: { title: 'AP Invoices', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_ap_invoice', active: true, order: 100 },
})
export const modApExceptions = Record({
    $id: Now.ID['bcfa-mod-ap-exceptions'],
    table: 'sys_app_module',
    data: { title: 'AP Exceptions', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_ap_exception', active: true, order: 110 },
})
export const modApApprovals = Record({
    $id: Now.ID['bcfa-mod-ap-approvals'],
    table: 'sys_app_module',
    data: { title: 'AP Approvals', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_ap_approval', active: true, order: 120 },
})

// --- Accounts Receivable / Cash Application ---------------------------------
export const modArSeparator = Record({
    $id: Now.ID['bcfa-mod-ar-separator'],
    table: 'sys_app_module',
    data: { title: 'Accounts Receivable', application: bcfaAppMenu, link_type: 'SEPARATOR', active: true, order: 200 },
})
export const modPayments = Record({
    $id: Now.ID['bcfa-mod-payments'],
    table: 'sys_app_module',
    data: { title: 'Payments', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_payment', active: true, order: 210 },
})
export const modArExceptions = Record({
    $id: Now.ID['bcfa-mod-ar-exceptions'],
    table: 'sys_app_module',
    data: { title: 'AR Exceptions', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_ar_exception', active: true, order: 220 },
})
export const modArApprovals = Record({
    $id: Now.ID['bcfa-mod-ar-approvals'],
    table: 'sys_app_module',
    data: { title: 'AR Approvals', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_ar_approval', active: true, order: 230 },
})
export const modDeductions = Record({
    $id: Now.ID['bcfa-mod-deductions'],
    table: 'sys_app_module',
    data: { title: 'Deductions', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_deduction', active: true, order: 240 },
})

// --- Reference / Master Data -------------------------------------------------
export const modRefSeparator = Record({
    $id: Now.ID['bcfa-mod-ref-separator'],
    table: 'sys_app_module',
    data: { title: 'Reference / Master Data', application: bcfaAppMenu, link_type: 'SEPARATOR', active: true, order: 300 },
})
export const modVendors = Record({
    $id: Now.ID['bcfa-mod-vendors'],
    table: 'sys_app_module',
    data: { title: 'Vendors', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_vendor', active: true, order: 310 },
})
export const modCustomers = Record({
    $id: Now.ID['bcfa-mod-customers'],
    table: 'sys_app_module',
    data: { title: 'Customers', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_customer', active: true, order: 320 },
})
export const modPurchaseOrders = Record({
    $id: Now.ID['bcfa-mod-pos'],
    table: 'sys_app_module',
    data: { title: 'Purchase Orders', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_purchase_order', active: true, order: 330 },
})
export const modArOpenItems = Record({
    $id: Now.ID['bcfa-mod-ar-open-items'],
    table: 'sys_app_module',
    data: { title: 'AR Open Items', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_ar_open_item', active: true, order: 340 },
})
export const modCreditNotes = Record({
    $id: Now.ID['bcfa-mod-credit-notes'],
    table: 'sys_app_module',
    data: { title: 'Credit Notes', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_credit_note', active: true, order: 350 },
})

// --- Integration & Audit -----------------------------------------------------
export const modIntSeparator = Record({
    $id: Now.ID['bcfa-mod-int-separator'],
    table: 'sys_app_module',
    data: { title: 'Integration & Audit', application: bcfaAppMenu, link_type: 'SEPARATOR', active: true, order: 400 },
})
export const modIntegrationTxn = Record({
    $id: Now.ID['bcfa-mod-integration-txn'],
    table: 'sys_app_module',
    data: { title: 'Integration Transactions', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_integration_txn', active: true, order: 410 },
})
export const modAuditEvents = Record({
    $id: Now.ID['bcfa-mod-audit-events'],
    table: 'sys_app_module',
    data: { title: 'Audit Events', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_audit_event', active: true, order: 420 },
})
export const modIntegrationProfiles = Record({
    $id: Now.ID['bcfa-mod-integration-profiles'],
    table: 'sys_app_module',
    data: { title: 'Integration Profiles', application: bcfaAppMenu, link_type: 'LIST', name: 'x_695068_bcfa_integration_profile', active: true, order: 430 },
})
