import { Flow, wfa, trigger, action } from '@servicenow/sdk/automation'

// Phase 25: Accounts Receivable (Cash Application) flows (Flow Designer). Each flow owns one hand-off of the
// pipeline: its record trigger fires the event x_695068_bcfa.flow.stage with
// the stage name, and the script action "BCFA - Run Flow Stage" runs that
// deterministic step through FinanceOrchestration (existing domain services,
// guarded by the record's state so a step never runs twice). Only
// documented core actions (fireEvent, log, lookUpRecords, forEach) are used.
// See docs/AUTOMATED_FLOWS.md.

Flow(
    {
        $id: Now.ID['flow-ar-payment-intake'],
        name: 'BCFA AR Payment Intake Flow',
        description: 'A new payment is normalized and its customer identified (alias at the auto-match confidence, or the owner of the remittance invoices).',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.created,
        { $id: Now.ID['trg-ar-payment-intake'] },
        {
            table: 'x_695068_bcfa_payment',
            condition: 'state=RECEIVED',
            run_flow_in: 'background',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ar-payment-intake-stage'], annotation: 'Run the deterministic stage: normalization and customer identification' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_payment',
                parm1: 'ar_intake',
                parm2: 'BCFA AR Payment Intake Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ar-payment-intake-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AR Payment Intake Flow: stage ar_intake requested for ${wfa.dataPill(params.trigger.current.bank_reference, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ar-remittance'],
        name: 'BCFA AR Remittance Processing Flow',
        description: 'A remittance that arrives for a payment stuck on matching resolves that exception and retries the match.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.created,
        { $id: Now.ID['trg-ar-remittance'] },
        {
            table: 'x_695068_bcfa_remittance',
            condition: 'paymentISNOTEMPTY',
            run_flow_in: 'background',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ar-remittance-stage'], annotation: 'Run the deterministic stage: retry matching with the remittance' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_remittance',
                parm1: 'ar_remittance',
                parm2: 'BCFA AR Remittance Processing Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ar-remittance-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AR Remittance Processing Flow: stage ar_remittance requested for ${wfa.dataPill(params.trigger.current.remittance_reference, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ar-match'],
        name: 'BCFA AR Match Flow',
        description: 'An identified payment is matched (remittance, exact, exact combination, multi-invoice) and allocated; a multi-invoice allocation gets the Now Assist match explanation.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ar-match'] },
        {
            table: 'x_695068_bcfa_payment',
            condition: 'state=CUSTOMER_RESOLUTION^customerISNOTEMPTY',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ar-match-stage'], annotation: 'Run the deterministic stage: matching and allocation (AI match explanation point)' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_payment',
                parm1: 'ar_match',
                parm2: 'BCFA AR Match Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ar-match-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AR Match Flow: stage ar_match requested for ${wfa.dataPill(params.trigger.current.bank_reference, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ar-exception'],
        name: 'BCFA AR Exception Flow',
        description: 'After Resolve and Retry on an AR exception (or a remittance retry), the payment is re-matched and re-allocated. The AI review of a new exception runs from its own Now Assist agentic workflow trigger.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ar-exception'] },
        {
            table: 'x_695068_bcfa_ar_exception',
            condition: 'status=resolved',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ar-exception-stage'], annotation: 'Run the deterministic stage: re-match and re-allocate after correction' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_ar_exception',
                parm1: 'ar_exception',
                parm2: 'BCFA AR Exception Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ar-exception-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AR Exception Flow: stage ar_exception requested for ${wfa.dataPill(params.trigger.current.number, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ar-approval'],
        name: 'BCFA AR Approval Flow',
        description: 'A balanced payment gets the configured approval rule: approval requested, or approved by rule.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ar-approval'] },
        {
            table: 'x_695068_bcfa_payment',
            condition: 'state=PENDING_APPROVAL',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ar-approval-stage'], annotation: 'Run the deterministic stage: approval routing' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_payment',
                parm1: 'ar_approval',
                parm2: 'BCFA AR Approval Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ar-approval-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AR Approval Flow: stage ar_approval requested for ${wfa.dataPill(params.trigger.current.bank_reference, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ar-clearing'],
        name: 'BCFA AR Clearing Flow',
        description: 'An approved payment is cleared in SAP (mock) through IntegrationService; cleared open items are settled.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ar-clearing'] },
        {
            table: 'x_695068_bcfa_payment',
            condition: 'state=APPROVED',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ar-clearing-stage'], annotation: 'Run the deterministic stage: SAP clearing' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_payment',
                parm1: 'ar_clearing',
                parm2: 'BCFA AR Clearing Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ar-clearing-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AR Clearing Flow: stage ar_clearing requested for ${wfa.dataPill(params.trigger.current.bank_reference, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ar-reconciliation'],
        name: 'BCFA AR Reconciliation Flow',
        description: 'A clearing with an unknown outcome is reconciled by a status query (never a blind retry).',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ar-reconciliation'] },
        {
            table: 'x_695068_bcfa_payment',
            condition: 'state=UNKNOWN_OUTCOME',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ar-reconciliation-stage'], annotation: 'Run the deterministic stage: status query and reconciliation' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_payment',
                parm1: 'ar_reconciliation',
                parm2: 'BCFA AR Reconciliation Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ar-reconciliation-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AR Reconciliation Flow: stage ar_reconciliation requested for ${wfa.dataPill(params.trigger.current.bank_reference, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ar-exception-aging-escalation'],
        name: 'BCFA AR Aging/Escalation Flow',
        description: 'Hourly: ages every open AR exception, sets its SLA status and escalates breaches (level 1 owner and group, level 2 Finance Controllers) through ExceptionEngine.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.scheduled.repeat,
        { $id: Now.ID['trg-ar-exception-aging'] },
        { repeat: Duration({ hours: 1 }) }
    ),
    () => {
        const open = wfa.action(
            action.core.lookUpRecords,
            { $id: Now.ID['act-ar-aging-lookup'], annotation: 'Open AR exceptions' },
            {
                table: 'x_695068_bcfa_ar_exception',
                conditions: 'statusINopen,in_review',
                max_results: 1000,
            }
        )
        wfa.flowLogic.forEach(
            wfa.dataPill(open.Records, 'array.object'),
            { $id: Now.ID['loop-ar-aging'], annotation: 'Age, SLA and escalation per exception' },
            (exception) => {
                wfa.action(
                    action.core.fireEvent,
                    { $id: Now.ID['act-ar-aging-stage'], annotation: 'Run the deterministic aging / escalation step (FinanceOrchestration ar_aging)' },
                    {
                        event_name: 'x_695068_bcfa.flow.stage',
                        record: `${wfa.dataPill(exception.sys_id, 'reference')}`,
                        table: 'x_695068_bcfa_ar_exception',
                        parm1: 'ar_aging',
                        parm2: 'BCFA AR Aging/Escalation Flow',
                    }
                )
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ar-aging-log'], annotation: 'Record the sweep in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AR Aging/Escalation Flow: aging and escalation requested for ${wfa.dataPill(open.Count, 'integer')} open AR exception(s)`,
            }
        )
    }
)
