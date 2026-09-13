import { Flow, wfa, trigger, action } from '@servicenow/sdk/automation'

// Real Flow Designer flow authored entirely in Fluent, using only
// fully-documented action.core.* built-ins (no custom actionStep.script
// data-passing — see docs/ARTIFACT_STRATEGY.md's Stage 15 refinement for
// why the core AP/AR state-machine orchestration instead uses Business
// Rules). Runs once daily and logs a warning when AP exceptions have sat
// open for more than 3 days, standing in for a real escalation
// notification in this POC.

Flow(
    {
        $id: Now.ID['flow-ap-exception-aging-escalation'],
        name: 'AP Exception Aging Escalation',
        description: 'Daily sweep for AP Exceptions open more than 3 days; logs a warning for follow-up.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.scheduled.daily,
        { $id: Now.ID['trg-ap-exception-aging'] },
        { time: Time({ hours: 8, minutes: 0, seconds: 0 }, 'UTC') }
    ),
    () => {
        const aging = wfa.action(
            action.core.lookUpRecords,
            { $id: Now.ID['ap-aging-lookup'], annotation: 'Find AP exceptions open more than 3 days' },
            {
                table: 'x_695068_bcfa_ap_exception',
                conditions: 'status=open^sys_created_on<javascript:gs.daysAgoStart(3)',
                max_results: 100,
                sort_column: 'sys_created_on',
                sort_type: 'sort_asc',
            }
        )

        wfa.action(
            action.core.log,
            { $id: Now.ID['ap-aging-log'], annotation: 'Log aging exception count' },
            {
                log_level: 'warn',
                log_message: `AP exception aging sweep found ${wfa.dataPill(aging.Count, 'integer')} open exception(s) older than 3 days.`,
            }
        )
    }
)
