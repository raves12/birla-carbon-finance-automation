import { ScriptInclude } from '@servicenow/sdk/core'

// Phase 29: AI ranking quality on ambiguous cash matches. See docs/TEST_PLAN.md.

export const financeAiEvaluation = ScriptInclude({
    $id: Now.ID['si-finance-ai-evaluation'],
    name: 'FinanceAiEvaluation',
    active: true,
    apiName: 'x_695068_bcfa.FinanceAiEvaluation',
    description: 'Evaluates Now Assist advice on labelled ambiguous cash matches (hinted cases: recommends the right combination; no-hint cases: declines to pick); the deterministic engine never chooses.',
    script: Now.include('../../server/script-includes/FinanceAiEvaluation.server.js'),
})
