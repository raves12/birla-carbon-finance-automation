import { ScriptInclude } from '@servicenow/sdk/core'

export const apDomainService = ScriptInclude({
    $id: Now.ID['si-ap-domain-service'],
    name: 'ApDomainService',
    active: true,
    apiName: 'x_695068_bcfa.ApDomainService',
    description: 'Orchestrates the AP Invoice lifecycle (intake, extraction, validation, matching, exception resolution, approval, posting, Unknown Outcome reconciliation, archive) on top of the AP Invoice StateModel.',
    script: Now.include('../../server/script-includes/ApDomainService.server.js'),
})

export const arDomainService = ScriptInclude({
    $id: Now.ID['si-ar-domain-service'],
    name: 'ArDomainService',
    active: true,
    apiName: 'x_695068_bcfa.ArDomainService',
    description: 'Orchestrates the Cash Application lifecycle (intake, normalization, customer resolution, matching, allocation, exception resolution, approval, clearing, Unknown Outcome reconciliation, archive) on top of the Cash Application StateModel.',
    script: Now.include('../../server/script-includes/ArDomainService.server.js'),
})

// Phase 42: document evidence (stamp presence, handwriting) and GRN documents
// read as evidence.
export const documentEvidenceService = ScriptInclude({
    $id: Now.ID['si-document-evidence-service'],
    name: 'DocumentEvidenceService',
    active: true,
    apiName: 'x_695068_bcfa.DocumentEvidenceService',
    description: 'Document evidence: stamp / seal / chop presence (never authenticity) against the BCFA Document Evidence Requirement decision table, handwriting status, human evidence reviews (AI value kept, append-only) and goods receipt documents compared with the SAP receipt without changing it.',
    script: Now.include('../../server/script-includes/DocumentEvidenceService.server.js'),
})
