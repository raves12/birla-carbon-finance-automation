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
    description: 'Simulated provider of DocumentExtractionService, for tests and demo fixtures only: returns the printed values of the synthetic fixture PDFs by attachment file name, labelled SIMULATED DOCUMENT EXTRACTION - POC. Not OCR; no AI, no external call.',
    script: Now.include('../../server/script-includes/SimulatedDocumentExtraction.server.js'),
})

// Phase 40: document extraction provider abstraction.
export const documentExtractionService = ScriptInclude({
    $id: Now.ID['si-document-extraction-service'],
    name: 'DocumentExtractionService',
    active: true,
    apiName: 'x_695068_bcfa.DocumentExtractionService',
    description: 'Single entry point for reading uploaded documents. Selects the provider by x_695068_bcfa.document.extraction.provider: native (ServiceNow Document Intelligence on Now LLM) or simulated (test fixtures). Same contract for both; no fallback between them.',
    script: Now.include('../../server/script-includes/DocumentExtractionService.server.js'),
})

export const nativeDocumentIntelligenceProvider = ScriptInclude({
    $id: Now.ID['si-native-document-intelligence-provider'],
    name: 'NativeDocumentIntelligenceProvider',
    active: true,
    apiName: 'x_695068_bcfa.NativeDocumentIntelligenceProvider',
    description: 'Native extraction with ServiceNow Document Intelligence (generative, Now LLM): starts or reuses the task for the intake attachment, reads the structured result and maps it to the BCFA extraction contract with a derived (completeness and arithmetic) confidence. Facts only; no rules.',
    script: Now.include('../../server/script-includes/NativeDocumentIntelligenceProvider.server.js'),
})

export const apExceptionDecisionService = ScriptInclude({
    $id: Now.ID['si-ap-exception-decision-service'],
    name: 'ApExceptionDecisionService',
    active: true,
    apiName: 'x_695068_bcfa.ApExceptionDecisionService',
    description: 'Records the human decision on an AP exception (approve override, reject, request correction, hold) with a mandatory reason, role checks and maker/checker. Approved overrides post through the approval cascade and IntegrationService. Never callable by AI.',
    script: Now.include('../../server/script-includes/ApExceptionDecisionService.server.js'),
})
