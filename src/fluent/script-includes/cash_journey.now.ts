import { ScriptInclude } from '@servicenow/sdk/core'

// Phase 13: POC 2 cash application — the human decision on an AR exception.

export const arExceptionDecisionService = ScriptInclude({
    $id: Now.ID['si-ar-exception-decision-service'],
    name: 'ArExceptionDecisionService',
    active: true,
    apiName: 'x_695068_bcfa.ArExceptionDecisionService',
    description: 'Records the human decision on an AR exception (approve deduction, request clarification, hold) with a mandatory reason and role checks. An approved deduction is the computed residual; the balance is re-checked, then the payment goes to a different approver and clears via Mock SAP. Never callable by AI.',
    script: Now.include('../../server/script-includes/ArExceptionDecisionService.server.js'),
})
