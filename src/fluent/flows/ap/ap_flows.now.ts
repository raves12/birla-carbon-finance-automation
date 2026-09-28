import { Flow, wfa, trigger, action } from '@servicenow/sdk/automation'

// Phase 25: Accounts Payable flows (Flow Designer). Each flow owns one hand-off of the
// pipeline: its record trigger fires the event x_695068_bcfa.flow.stage with
// the stage name, and the script action "BCFA - Run Flow Stage" runs that
// deterministic step through FinanceOrchestration (existing domain services,
// guarded by the record's state so a step never runs twice). Only
// documented core actions (fireEvent, log, lookUpRecords, forEach) are used.
// See docs/AUTOMATED_FLOWS.md.

Flow(
    {
        $id: Now.ID['flow-ap-invoice-intake'],
        name: 'BCFA AP Invoice Intake Flow',
        description: 'A new AP invoice is extracted (simulated Document Intelligence, or the extraction already recorded from an uploaded document).',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.created,
        { $id: Now.ID['trg-ap-invoice-intake'] },
        {
            table: 'x_695068_bcfa_ap_invoice',
            condition: 'state=RECEIVED',
            run_flow_in: 'background',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ap-invoice-intake-stage'], annotation: 'Run the deterministic stage: extraction (AI extraction point)' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_ap_invoice',
                parm1: 'ap_intake',
                parm2: 'BCFA AP Invoice Intake Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ap-invoice-intake-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AP Invoice Intake Flow: stage ap_intake requested for ${wfa.dataPill(params.trigger.current.invoice_number, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ap-validation'],
        name: 'BCFA AP Validation Flow',
        description: 'An extracted AP invoice is validated (fields, vendor, PO, confidence) and 3-way matched with duplicate detection and tolerances.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ap-validation'] },
        {
            table: 'x_695068_bcfa_ap_invoice',
            condition: 'state=EXTRACTED',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ap-validation-stage'], annotation: 'Run the deterministic stage: validation and 3-way match' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_ap_invoice',
                parm1: 'ap_validation',
                parm2: 'BCFA AP Validation Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ap-validation-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AP Validation Flow: stage ap_validation requested for ${wfa.dataPill(params.trigger.current.invoice_number, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ap-exception'],
        name: 'BCFA AP Exception Flow',
        description: 'After Resolve and Retry on an AP exception, the invoice is re-validated and re-matched. The AI review of a new exception runs from its own Now Assist agentic workflow trigger.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ap-exception'] },
        {
            table: 'x_695068_bcfa_ap_exception',
            condition: 'status=resolved',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ap-exception-stage'], annotation: 'Run the deterministic stage: re-validate and re-match after correction' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_ap_exception',
                parm1: 'ap_exception',
                parm2: 'BCFA AP Exception Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ap-exception-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AP Exception Flow: stage ap_exception requested for ${wfa.dataPill(params.trigger.current.number, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ap-approval'],
        name: 'BCFA AP Approval Flow',
        description: 'A matched AP invoice gets the configured approval rule (BCFA AP Approval decision table): approval requested, or approved by rule.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ap-approval'] },
        {
            table: 'x_695068_bcfa_ap_invoice',
            condition: 'state=MATCHED',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ap-approval-stage'], annotation: 'Run the deterministic stage: approval routing' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_ap_invoice',
                parm1: 'ap_approval',
                parm2: 'BCFA AP Approval Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ap-approval-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AP Approval Flow: stage ap_approval requested for ${wfa.dataPill(params.trigger.current.invoice_number, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ap-integration'],
        name: 'BCFA AP Integration Flow',
        description: 'An approved AP invoice is posted to SAP (mock) through IntegrationService (idempotency, unknown-outcome control).',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ap-integration'] },
        {
            table: 'x_695068_bcfa_ap_invoice',
            condition: 'state=APPROVED^approval_state=approved',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ap-integration-stage'], annotation: 'Run the deterministic stage: SAP posting' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_ap_invoice',
                parm1: 'ap_integration',
                parm2: 'BCFA AP Integration Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ap-integration-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AP Integration Flow: stage ap_integration requested for ${wfa.dataPill(params.trigger.current.invoice_number, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ap-reconciliation'],
        name: 'BCFA AP Reconciliation Flow',
        description: 'An AP posting with an unknown outcome is reconciled by a status query (never a blind retry).',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['trg-ap-reconciliation'] },
        {
            table: 'x_695068_bcfa_ap_invoice',
            condition: 'state=UNKNOWN_OUTCOME',
            run_flow_in: 'background',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.fireEvent,
            { $id: Now.ID['act-ap-reconciliation-stage'], annotation: 'Run the deterministic stage: status query and reconciliation' },
            {
                event_name: 'x_695068_bcfa.flow.stage',
                record: `${wfa.dataPill(params.trigger.current, 'reference')}`,
                table: 'x_695068_bcfa_ap_invoice',
                parm1: 'ap_reconciliation',
                parm2: 'BCFA AP Reconciliation Flow',
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ap-reconciliation-log'], annotation: 'Record the hand-off in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AP Reconciliation Flow: stage ap_reconciliation requested for ${wfa.dataPill(params.trigger.current.invoice_number, 'string')}`,
            }
        )
    }
)

Flow(
    {
        $id: Now.ID['flow-ap-exception-aging-escalation'],
        name: 'BCFA AP Aging/Escalation Flow',
        description: 'Hourly: ages every open AP exception, sets its SLA status and escalates breaches (level 1 owner and group, level 2 Finance Controllers) through ExceptionEngine.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.scheduled.repeat,
        { $id: Now.ID['trg-ap-exception-aging'] },
        { repeat: Duration({ hours: 1 }) }
    ),
    () => {
        const open = wfa.action(
            action.core.lookUpRecords,
            { $id: Now.ID['act-ap-aging-lookup'], annotation: 'Open AP exceptions' },
            {
                table: 'x_695068_bcfa_ap_exception',
                conditions: 'statusINopen,in_review',
                max_results: 1000,
            }
        )
        wfa.flowLogic.forEach(
            wfa.dataPill(open.Records, 'array.object'),
            { $id: Now.ID['loop-ap-aging'], annotation: 'Age, SLA and escalation per exception' },
            (exception) => {
                wfa.action(
                    action.core.fireEvent,
                    { $id: Now.ID['act-ap-aging-stage'], annotation: 'Run the deterministic aging / escalation step (FinanceOrchestration ap_aging)' },
                    {
                        event_name: 'x_695068_bcfa.flow.stage',
                        record: `${wfa.dataPill(exception.sys_id, 'reference')}`,
                        table: 'x_695068_bcfa_ap_exception',
                        parm1: 'ap_aging',
                        parm2: 'BCFA AP Aging/Escalation Flow',
                    }
                )
            }
        )
        wfa.action(
            action.core.log,
            { $id: Now.ID['act-ap-aging-log'], annotation: 'Record the sweep in the flow log' },
            {
                log_level: 'info',
                log_message: `BCFA AP Aging/Escalation Flow: aging and escalation requested for ${wfa.dataPill(open.Count, 'integer')} open AP exception(s)`,
            }
        )
    }
)
