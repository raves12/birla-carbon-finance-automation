import { ScriptInclude } from '@servicenow/sdk/core'

export const auditEngine = ScriptInclude({
    $id: Now.ID['si-audit-engine'],
    name: 'AuditEngine',
    active: true,
    apiName: 'x_695068_bcfa.AuditEngine',
    description: 'Appends Audit Event records — the single end-to-end evidence chain for every state transition, approval decision, integration call, and AI recommendation.',
    script: Now.include('../../server/script-includes/AuditEngine.server.js'),
})

export const mockSapAdapter = ScriptInclude({
    $id: Now.ID['si-mock-sap-adapter'],
    name: 'MockSAPAdapter',
    active: true,
    apiName: 'x_695068_bcfa.MockSAPAdapter',
    description: 'Deterministic mock SAP ECC adapter. Reads mock master data tables and simulates postVendorInvoice/clearPayment/getPostingStatus. Never touches AP/AR domain tables directly.',
    script: Now.include('../../server/script-includes/MockSAPAdapter.server.js'),
})

export const mockBankAdapter = ScriptInclude({
    $id: Now.ID['si-mock-bank-adapter'],
    name: 'MockBankAdapter',
    active: true,
    apiName: 'x_695068_bcfa.MockBankAdapter',
    description: 'Deterministic mock bank adapter for bank statement retrieval.',
    script: Now.include('../../server/script-includes/MockBankAdapter.server.js'),
})

export const mockArchiveAdapter = ScriptInclude({
    $id: Now.ID['si-mock-archive-adapter'],
    name: 'MockArchiveAdapter',
    active: true,
    apiName: 'x_695068_bcfa.MockArchiveAdapter',
    description: 'Deterministic mock archive/records-management adapter used by the AP/AR archive-and-audit steps.',
    script: Now.include('../../server/script-includes/MockArchiveAdapter.server.js'),
})

export const integrationService = ScriptInclude({
    $id: Now.ID['si-integration-service'],
    name: 'IntegrationService',
    active: true,
    apiName: 'x_695068_bcfa.IntegrationService',
    description: 'Canonical Integration Service: correlation ID + idempotency-key handling, deterministic failure simulation via Integration Profile, and Section 11 Unknown Outcome Control. The only script that is allowed to call an adapter.',
    script: Now.include('../../server/script-includes/IntegrationService.server.js'),
})
