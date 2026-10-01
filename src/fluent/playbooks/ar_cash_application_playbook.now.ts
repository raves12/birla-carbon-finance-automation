import { ActivityDefinitions, PlaybookDefinition, PlaybookTriggerTypes, wfa } from '@servicenow/sdk/automation'

// BCFA Cash Application Playbook (9 stages).
//
// Native ServiceNow Playbook (Process Automation Designer / Playbook
// Experience). It is a VIEW of the transaction, not a workflow engine:
//  - every stage waits on journey_stage_order on the parent record, which
//    FinanceJourneyService derives from the authoritative state, exceptions,
//    approvals and integration transactions on every state change;
//  - the evidence activities are read-only Record Lists;
//  - no activity updates a record, approves, posts, clears or calls AI.
// The domain services, state models, business rules and flows remain the only
// place where the transaction is processed. See docs/PLAYBOOK_DESIGN.md.
// Playbooks deploy as drafts: activate in Workflow Studio (see
// docs/build/PLAYBOOK_BUILD_AND_ACTIVATION.md).

export const arCashApplicationPlaybook = PlaybookDefinition(
    {
        $id: Now.ID['bcfa_pb_ar_playbook'],
        label: 'BCFA Cash Application Playbook',
        name: 'bcfa_cash_application',
        description: 'BCFA cash application journey: payment & remittance intake, simulated extraction (POC) and correlation, customer, open items, matching & allocation, exceptions & deductions, approval, SAP DRAFT/DIRECT processing (MOCK SAP), closure. Display of the authoritative state only.',
        parentTable: 'x_695068_bcfa_payment',
        access: 'package_private',
        runStrategy: 'run_if_not_running',
        restartable: 'RESTARTABLE_TRUE',
    },
    {
        permissions: () => ({
            roles: [
                { role: '4411dd9103de4bdbb5468924b1e5459f', view: true, restart: true, laneRestart: true }, // admin,
                { role: '588d615a5fea475bbe3422f50e91c218', view: true }, // ar_processor,
                { role: '090e2d3150b44d4fbf0385f83b1fed30', view: true }, // ar_approver,
                { role: '484c56f4217841e298f5752ea6093a3f', view: true }, // finance_reviewer,
                { role: 'e1abbc605ba34cbfb77c584ea689c1b2', view: true }, // finance_approver,
                { role: '0c4ec58b4b8d4effa699694222685cfd', view: true }, // integration_operator,
                { role: '03604bf4100246588f4250676240bc18', view: true }, // auditor,
                { role: '8409bca632a3430eb7a56387f244a74f', view: true }, // read_only
            ],
        }),
        triggers: [
            wfa.playbook.trigger(
                PlaybookTriggerTypes.RecordCreate,
                { $id: Now.ID['bcfa_pb_ar_trigger_create'], label: 'On creation' },
                { table: 'x_695068_bcfa_payment' },
            ),
        ],
    },
    {
        lanes: (params) => {
            const intake = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ar_lane_intake'],
                    label: '1. Payment & Remittance Intake',
                    name: 'intake',
                    order: 1,
                    description: 'Bank payment received; remittance advice may arrive with it, later or never.',
                    startRule: wfa.playbook.run.Immediately(),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ar_intake_gate'],
                            label: 'Payment registered',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_payment',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>1',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Payment & remittance intake',
                            description: 'The bank payment has been received and normalized.',
                            pending_title: 'Payment & remittance intake',
                            pending_description: 'Waiting for the payment to be normalized.',
                            record_fields: FieldList<'x_695068_bcfa_payment'>(['bank_reference', 'customer', 'amount', 'currency', 'state', 'sap_processing_mode', 'sap_status', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const intake_records = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_intake_intake_records'],
                            label: 'Intake records',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            list_title: 'Intake (payment / remittance documents)',
                            table: 'x_695068_bcfa_finance_intake',
                            list_query: `payment=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'number,source,document_type,processing_status,sys_created_on',
                            row_count: '10',
                            max_columns: '5',
                        },
                    )
                    return { gate: gate, intake_records: intake_records }
                },
            })
            const correlation = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ar_lane_correlation'],
                    label: '2. Extraction & Correlation',
                    name: 'correlation',
                    order: 2,
                    description: 'SIMULATED DOCUMENT EXTRACTION — POC for the remittance; correlated to the payment.',
                    startRule: wfa.playbook.run.After(intake),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ar_correlation_gate'],
                            label: 'Remittance correlated',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_payment',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>2',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Remittance extraction & correlation',
                            description: 'SIMULATED DOCUMENT EXTRACTION — POC: remittance fields extracted and correlated to the payment by the system.',
                            pending_title: 'Remittance extraction & correlation',
                            pending_description: 'Waiting for remittance correlation.',
                            record_fields: FieldList<'x_695068_bcfa_payment'>(['bank_reference', 'customer', 'amount', 'currency', 'state', 'sap_processing_mode', 'sap_status', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const remittances = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_correlation_remittances'],
                            label: 'Remittances (SIMULATED)',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SIMULATED DOCUMENT EXTRACTION — POC',
                            list_title: 'SIMULATED DOCUMENT EXTRACTION — POC: remittance',
                            table: 'x_695068_bcfa_remittance',
                            list_query: `payment=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'remittance_reference,source,confidence,received_date',
                            row_count: '10',
                            max_columns: '4',
                        },
                    )
                    return { gate: gate, remittances: remittances }
                },
            })
            const customer = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ar_lane_customer'],
                    label: '3. Customer Resolution',
                    name: 'customer',
                    order: 3,
                    description: 'Customer identified deterministically; an ambiguous customer goes to a person.',
                    startRule: wfa.playbook.run.After(correlation),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ar_customer_gate'],
                            label: 'Customer resolved',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_payment',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>3',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Customer resolution',
                            description: 'The customer is resolved from the bank data and remittance by deterministic rules.',
                            pending_title: 'Customer resolution',
                            pending_description: 'Waiting for customer resolution (an ambiguous customer needs a person).',
                            record_fields: FieldList<'x_695068_bcfa_payment'>(['bank_reference', 'customer', 'amount', 'currency', 'state', 'sap_processing_mode', 'sap_status', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const candidates = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_customer_candidates'],
                            label: 'Candidates',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            list_title: 'Customer / match candidates',
                            table: 'x_695068_bcfa_match_candidate',
                            list_query: `payment=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'customer_candidate,ar_open_item,match_type,confidence,rank,selected',
                            row_count: '10',
                            max_columns: '6',
                        },
                    )
                    return { gate: gate, candidates: candidates }
                },
            })
            const open_items = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ar_lane_open_items'],
                    label: '4. Open Item Retrieval',
                    name: 'open_items',
                    order: 4,
                    description: 'Open AR items of the resolved customer retrieved for matching.',
                    startRule: wfa.playbook.run.After(customer),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ar_open_items_gate'],
                            label: 'Open items retrieved',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_payment',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>4',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Open item retrieval',
                            description: 'Open AR items of the customer were retrieved for matching.',
                            pending_title: 'Open item retrieval',
                            pending_description: 'Waiting for open items.',
                            record_fields: FieldList<'x_695068_bcfa_payment'>(['bank_reference', 'customer', 'amount', 'currency', 'state', 'sap_processing_mode', 'sap_status', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const allocations = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_open_items_allocations'],
                            label: 'Proposed allocations',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            list_title: 'Open items in scope (allocation engine)',
                            table: 'x_695068_bcfa_payment_allocation',
                            list_query: `payment=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'ar_open_item,allocated_amount,discount,bank_charge,tcs,residual_amount,allocation_state',
                            row_count: '10',
                            max_columns: '7',
                        },
                    )
                    return { gate: gate, allocations: allocations }
                },
            })
            const matching = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ar_lane_matching'],
                    label: '5. Matching & Allocation',
                    name: 'matching',
                    order: 5,
                    description: 'Deterministic matching and allocation; amounts come from the allocation engine, never recomputed.',
                    startRule: wfa.playbook.run.After(open_items),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ar_matching_gate'],
                            label: 'Allocation balanced',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_payment',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>5',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Matching & allocation',
                            description: 'The allocation engine matched the payment to open items. Allocated, deduction and residual amounts are its own result.',
                            pending_title: 'Matching & allocation',
                            pending_description: 'Waiting for matching and allocation, or for a person to resolve an unmatched / ambiguous / currency / duplicate exception.',
                            record_fields: FieldList<'x_695068_bcfa_payment'>(['bank_reference', 'customer', 'amount', 'allocated_amount', 'deduction_amount', 'residual_amount', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const allocations = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_matching_allocations'],
                            label: 'Allocations',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            list_title: 'Allocations (allocation engine result)',
                            table: 'x_695068_bcfa_payment_allocation',
                            list_query: `payment=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'ar_open_item,allocated_amount,discount,bank_charge,tcs,residual_amount,allocation_state',
                            row_count: '10',
                            max_columns: '7',
                        },
                    )
                    return { gate: gate, allocations: allocations }
                },
            })
            const exception = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ar_lane_exception'],
                    label: '6. Exception / Deduction Resolution',
                    name: 'exception',
                    order: 6,
                    description: 'Runs alongside stages 2-5. Short and over payments and other exceptions, with system result, AI recommendation and human decision kept separate.',
                    startRule: wfa.playbook.run.After(intake),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ar_exception_gate'],
                            label: 'No open exceptions',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_payment',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_open_exceptions=0^journey_stage_order>6',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Exception / deduction resolution',
                            description: 'System determination, AI recommendation and human decision are shown separately. Only a person can approve a deduction or resolve an exception.',
                            pending_title: 'Exception / deduction resolution',
                            pending_description: 'Waiting for open exceptions or deductions to be resolved by a person.',
                            record_fields: FieldList<'x_695068_bcfa_payment'>(['bank_reference', 'customer', 'amount', 'allocated_amount', 'deduction_amount', 'residual_amount', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const exceptions = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_exception_exceptions'],
                            label: 'Exceptions',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SYSTEM / AI / HUMAN',
                            list_title: 'Exceptions: SYSTEM DETERMINATION (rule result) | AI RECOMMENDATION (advisory) | HUMAN DECISION',
                            table: 'x_695068_bcfa_ar_exception',
                            list_query: `payment=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'number,reason_code,status,residual_amount,rule_result,ai_recommendation,decision,decided_by',
                            row_count: '10',
                            max_columns: '8',
                        },
                    )
                    const ai_notes = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_exception_ai_notes'],
                            label: 'AI recommendations',
                            order: 3,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'AI RECOMMENDATION',
                            list_title: 'AI RECOMMENDATION — advisory only (Now Assist); never approves, clears or overrides tolerance',
                            table: 'x_695068_bcfa_ai_interaction',
                            list_query: `source_record=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'capability,skill,recommendation,confidence,human_decision,human_decided_by,guardrail_action',
                            row_count: '10',
                            max_columns: '7',
                        },
                    )
                    return { gate: gate, exceptions: exceptions, ai_notes: ai_notes }
                },
            })
            const approval = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ar_lane_approval'],
                    label: '7. Approval',
                    name: 'approval',
                    order: 7,
                    description: 'Human approval of the allocation and any deduction, with segregation of duties.',
                    startRule: wfa.playbook.run.After(matching, exception),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ar_approval_gate'],
                            label: 'Approved',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_payment',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>7',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Approval',
                            description: 'Approval is a HUMAN DECISION. Segregation of duties is checked by the system; AI cannot approve.',
                            pending_title: 'Approval',
                            pending_description: 'Waiting for an authorised approver.',
                            record_fields: FieldList<'x_695068_bcfa_payment'>(['bank_reference', 'customer', 'amount', 'allocated_amount', 'deduction_amount', 'residual_amount', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const approvals = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_approval_approvals'],
                            label: 'Approvals',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'HUMAN DECISION',
                            list_title: 'HUMAN DECISION: approvals',
                            table: 'x_695068_bcfa_ar_approval',
                            list_query: `payment=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'approval_type,approver,decision,decided_at,sod_check,decision_notes',
                            row_count: '10',
                            max_columns: '6',
                        },
                    )
                    return { gate: gate, approvals: approvals }
                },
            })
            const sap_processing = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ar_lane_sap_processing'],
                    label: '8. SAP Draft / Direct Processing',
                    name: 'sap_processing',
                    order: 8,
                    description: 'MOCK SAP. DIRECT: SAP clears immediately. DRAFT: staged (parked) in SAP; cleared only after SAP confirms. Mode from x_695068_bcfa.ar.sap_processing_mode.',
                    startRule: wfa.playbook.run.After(approval),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ar_sap_processing_gate'],
                            label: 'Cleared in SAP (MOCK SAP)',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_payment',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>8',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'SAP processing (DRAFT / DIRECT) — MOCK SAP',
                            description: 'The approved clearing instruction is sent to MOCK SAP in the configured mode. In DRAFT mode the payment waits in SAP_DRAFT until SAP confirms the draft (status query only, never re-sent).',
                            pending_title: 'SAP processing (DRAFT / DIRECT) — MOCK SAP',
                            pending_description: 'Waiting for MOCK SAP: clearing result, draft confirmation, or reconciliation of an unknown outcome.',
                            record_fields: FieldList<'x_695068_bcfa_payment'>(['bank_reference', 'amount', 'state', 'sap_processing_mode', 'sap_status', 'sap_reference', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const sap_txns = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_sap_processing_sap_txns'],
                            label: 'SAP transactions (MOCK SAP)',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'MOCK SAP',
                            list_title: 'MOCK SAP integration transactions',
                            table: 'x_695068_bcfa_integration_txn',
                            list_query: `source_record=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'operation,adapter,status,attempt,external_document_id,unknown_outcome_flag,reconciliation_state',
                            row_count: '10',
                            max_columns: '7',
                        },
                    )
                    return { gate: gate, sap_txns: sap_txns }
                },
            })
            const closure = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ar_lane_closure'],
                    label: '9. Closure & Audit',
                    name: 'closure',
                    order: 9,
                    description: 'Cleared, reconciled and closed; full audit trail.',
                    startRule: wfa.playbook.run.After(sap_processing),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ar_closure_gate'],
                            label: 'Closed',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_payment',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>9',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Closure & audit',
                            description: 'The payment is cleared, reconciled and closed. The audit trail records every system, AI and human action.',
                            pending_title: 'Closure & audit',
                            pending_description: 'Waiting for reconciliation and closure.',
                            record_fields: FieldList<'x_695068_bcfa_payment'>(['bank_reference', 'customer', 'amount', 'currency', 'state', 'sap_processing_mode', 'sap_status', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const audit = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ar_closure_audit'],
                            label: 'Audit trail',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'AUDIT',
                            list_title: 'Audit trail',
                            table: 'x_695068_bcfa_audit_event',
                            list_query: `source_record=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'occurred_at,event_type,actor_type,actor,description',
                            row_count: '10',
                            max_columns: '5',
                        },
                    )
                    return { gate: gate, audit: audit }
                },
            })
            return { intake: intake, correlation: correlation, customer: customer, open_items: open_items, matching: matching, exception: exception, approval: approval, sap_processing: sap_processing, closure: closure }
        },
    },
)
