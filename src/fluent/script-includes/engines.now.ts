import { ScriptInclude } from '@servicenow/sdk/core'

export const matchingEngine = ScriptInclude({
    $id: Now.ID['si-matching-engine'],
    name: 'MatchingEngine',
    active: true,
    apiName: 'x_695068_bcfa.MatchingEngine',
    description: 'Deterministic AP 3-way match, duplicate detection, and AR exact/multi-invoice matching + customer alias resolution. Pure functions over deterministic tolerances.',
    script: Now.include('../../server/script-includes/MatchingEngine.server.js'),
})

export const exceptionEngine = ScriptInclude({
    $id: Now.ID['si-exception-engine'],
    name: 'ExceptionEngine',
    active: true,
    apiName: 'x_695068_bcfa.ExceptionEngine',
    description: 'Creates/resolves AP Exception, AR Exception, and Finance Exception records with structured reason codes.',
    script: Now.include('../../server/script-includes/ExceptionEngine.server.js'),
})

export const approvalEngine = ScriptInclude({
    $id: Now.ID['si-approval-engine'],
    name: 'ApprovalEngine',
    active: true,
    apiName: 'x_695068_bcfa.ApprovalEngine',
    description: 'Requests/decides AP and AR approvals, enforcing segregation of duties (no self-approval) as a service-layer mirror of the ACL rule.',
    script: Now.include('../../server/script-includes/ApprovalEngine.server.js'),
})

export const aiSimulationService = ScriptInclude({
    $id: Now.ID['si-ai-simulation-service'],
    name: 'AISimulationService',
    active: true,
    apiName: 'x_695068_bcfa.AISimulationService',
    description: 'Simulates Now Assist Document Intelligence extraction and AI Agent advisory recommendations — not licensed in this PDI (see docs/DISCOVERY.md). Every output is advisory only.',
    script: Now.include('../../server/script-includes/AISimulationService.server.js'),
})
