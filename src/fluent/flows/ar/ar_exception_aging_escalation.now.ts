import { Flow, wfa, trigger, action } from '@servicenow/sdk/automation'

Flow(
    {
        $id: Now.ID['flow-ar-exception-aging-escalation'],
        name: 'AR Exception Aging Escalation',
        description: 'Daily sweep for AR Exceptions open more than 3 days; logs a warning for follow-up.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.scheduled.daily,
        { $id: Now.ID['trg-ar-exception-aging'] },
        { time: Time({ hours: 8, minutes: 15, seconds: 0 }, 'UTC') }
    ),
    () => {
        const aging = wfa.action(
            action.core.lookUpRecords,
            { $id: Now.ID['ar-aging-lookup'], annotation: 'Find AR exceptions open more than 3 days' },
            {
                table: 'x_695068_bcfa_ar_exception',
                conditions: 'status=open^sys_created_on<javascript:gs.daysAgoStart(3)',
                max_results: 100,
                sort_column: 'sys_created_on',
                sort_type: 'sort_asc',
            }
        )

        wfa.action(
            action.core.log,
            { $id: Now.ID['ar-aging-log'], annotation: 'Log aging exception count' },
            {
                log_level: 'warn',
                log_message: `AR exception aging sweep found ${wfa.dataPill(aging.Count, 'integer')} open exception(s) older than 3 days.`,
            }
        )
    }
)
