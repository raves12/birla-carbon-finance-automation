import { ScriptInclude } from '@servicenow/sdk/core'

export const apLineResolutionService = ScriptInclude({
    $id: Now.ID['si-ap-line-resolution-service'],
    name: 'ApLineResolutionService',
    active: true,
    apiName: 'x_695068_bcfa.ApLineResolutionService',
    description: 'Deterministic AP invoice-line-to-PO-line/receipt resolution for Finance Document Intake (line number, then material/service, then description+quantity). Kept separate from MatchingEngine, which evaluates tolerance over lines that are already linked and has no opinion about how those links get made.',
    script: Now.include('../../server/script-includes/ApLineResolutionService.server.js'),
})

export const financeDocumentIntakeService = ScriptInclude({
    $id: Now.ID['si-finance-document-intake-service'],
    name: 'FinanceDocumentIntakeService',
    active: true,
    apiName: 'x_695068_bcfa.FinanceDocumentIntakeService',
    description: 'Orchestrates true document-to-transaction processing: reads an uploaded attachment on Finance Document Intake, uses the document type set at upload, reads the fields with the simulated Document Intelligence extraction (fixture values until extraction is licensed), resolves master data deterministically, and hands the resulting AP Invoice / Payment / Remittance to the existing ApDomainService/ArDomainService pipelines. Never sets approval_state/posting_state/state/decision directly and never calls ApprovalEngine or IntegrationService.',
    script: Now.include('../../server/script-includes/FinanceDocumentIntakeService.server.js'),
})
