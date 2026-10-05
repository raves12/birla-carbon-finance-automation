import { ScriptInclude, Property } from '@servicenow/sdk/core'

// Phase 26: lifecycle state model enforcement. See docs/STATE_MODELS.md.

export const financeLifecycle = ScriptInclude({
    $id: Now.ID['si-finance-lifecycle'],
    name: 'FinanceLifecycle',
    active: true,
    apiName: 'x_695068_bcfa.FinanceLifecycle',
    description: 'Checks AP invoice and payment state changes against the lifecycle state models (sttrm); refuses and audits a transition the model does not allow.',
    script: Now.include('../../server/script-includes/FinanceLifecycle.server.js'),
})

export const lifecycleEnforcement = Property({
    $id: Now.ID['prop-lifecycle-enforcement'],
    name: 'x_695068_bcfa.lifecycle.enforcement',
    type: 'string',
    value: 'enforce',
    description: 'enforce (default) = a state change the AP Invoice / Cash Application lifecycle state model does not allow is refused and audited; monitor = it is allowed but audited as outside the model.',
})
