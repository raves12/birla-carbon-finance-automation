import { Record, ScriptAction, ScriptInclude, Property } from '@servicenow/sdk/core'

// Phase 25: the link between the BCFA flows and the deterministic domain
// services. Each flow fires x_695068_bcfa.flow.stage (parm1 = stage, parm2 =
// flow name) on its record; this script action runs the stage through
// FinanceOrchestration. See docs/AUTOMATED_FLOWS.md.

export const flowStageEvent = Record({
    $id: Now.ID['event-flow-stage'],
    table: 'sysevent_register',
    data: {
        event_name: 'x_695068_bcfa.flow.stage',
        description: 'A BCFA flow requests one deterministic pipeline stage on the event record (parm1 = stage, parm2 = flow).',
        fired_by: 'BCFA flows (Flow Designer)',
    },
})

export const runFlowStage = ScriptAction({
    $id: Now.ID['script-action-run-flow-stage'],
    name: 'BCFA - Run Flow Stage',
    eventName: 'x_695068_bcfa.flow.stage',
    active: true,
    order: 100,
    description: 'Runs the pipeline stage a BCFA flow requested (FinanceOrchestration.run), guarded by the record state.',
    script: `(function() {
    var result = new FinanceOrchestration().run(event.parm1, current.getUniqueValue());
    if (result.outcome === 'error') gs.error('BCFA ' + event.parm2 + ': stage ' + event.parm1 + ' failed on ' + current.getUniqueValue() + ': ' + result.detail);
})();`,
})

export const financeOrchestration = ScriptInclude({
    $id: Now.ID['si-finance-orchestration'],
    name: 'FinanceOrchestration',
    active: true,
    apiName: 'x_695068_bcfa.FinanceOrchestration',
    description: 'Runs one deterministic AP/AR pipeline stage for the BCFA flows, guarded by the record state; flow vs inline orchestration mode.',
    script: Now.include('../../../server/script-includes/FinanceOrchestration.server.js'),
})

export const orchestrationMode = Property({
    $id: Now.ID['prop-orchestration-mode'],
    name: 'x_695068_bcfa.orchestration.mode',
    type: 'string',
    value: 'flow',
    description: 'flow (default) = the BCFA flows drive the AP/AR pipeline stage by stage; inline = the domain services chain the stages synchronously (demo seeding and tests use inline for one call through FinanceOrchestration.runInline).',
})
