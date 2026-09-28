import { ScriptInclude } from '@servicenow/sdk/core'

// Phase 12: POC 1 AP automation — configurable policy, simulated document
// reading, and the human decision on an AP exception.

export const financePolicy = ScriptInclude({
    $id: Now.ID['si-finance-policy'],
    name: 'FinancePolicy',
    active: true,
    apiName: 'x_695068_bcfa.FinancePolicy',
    description: 'Reads the configurable BCFA finance policy (AI provider, AP tolerances, confidence threshold, approval rule, exception severity/SLA/assignment, override rules) from x_695068_bcfa.* system properties. Values are POC ASSUMPTIONS.',
    script: Now.include('../../server/script-includes/FinancePolicy.server.js'),
})

export const simulatedDocumentExtraction = ScriptInclude({
    $id: Now.ID['si-simulated-document-extraction'],
    name: 'SimulatedDocumentExtraction',
    active: true,
    apiName: 'x_695068_bcfa.SimulatedDocumentExtraction',
    description: 'Returns the printed values of the synthetic fixture PDFs, by attachment file name, labelled SIMULATED. Stands in for Document Intelligence extraction, which is not licensed on this instance. No AI, no external call.',
    script: Now.include('../../server/script-includes/SimulatedDocumentExtraction.server.js'),
})

export const apExceptionDecisionService = ScriptInclude({
    $id: Now.ID['si-ap-exception-decision-service'],
    name: 'ApExceptionDecisionService',
    active: true,
    apiName: 'x_695068_bcfa.ApExceptionDecisionService',
    description: 'Records the human decision on an AP exception (approve override, reject, request correction, hold) with a mandatory reason, role checks and maker/checker. Approved overrides post through the approval cascade and IntegrationService. Never callable by AI.',
    script: Now.include('../../server/script-includes/ApExceptionDecisionService.server.js'),
})
