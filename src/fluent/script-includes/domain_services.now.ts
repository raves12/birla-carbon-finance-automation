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
