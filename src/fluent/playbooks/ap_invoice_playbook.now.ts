import { ActivityDefinitions, PlaybookDefinition, PlaybookTriggerTypes, wfa } from '@servicenow/sdk/automation'

// BCFA AP Invoice Processing Playbook (8 stages).
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

export const apInvoicePlaybook = PlaybookDefinition(
    {
        $id: Now.ID['bcfa_pb_ap_playbook'],
        label: 'BCFA AP Invoice Processing Playbook',
        name: 'bcfa_ap_invoice_processing',
        description: 'BCFA AP invoice journey: intake, simulated extraction (POC), validation, PO/GRN-SRN 3-way match, exceptions, approval, MOCK SAP posting, closure. Display of the authoritative state only.',
        parentTable: 'x_695068_bcfa_ap_invoice',
        access: 'package_private',
        runStrategy: 'run_if_not_running',
        restartable: 'RESTARTABLE_TRUE',
    },
    {
        permissions: () => ({
            roles: [
                { role: '4411dd9103de4bdbb5468924b1e5459f', view: true, restart: true, laneRestart: true }, // admin,
                { role: 'bf505b5092574a7fa59a01048550571a', view: true }, // ap_processor,
                { role: '8baea712261343df915a5dc4518146d3', view: true }, // ap_approver,
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
                { $id: Now.ID['bcfa_pb_ap_trigger_create'], label: 'On creation' },
                { table: 'x_695068_bcfa_ap_invoice' },
            ),
        ],
    },
    {
        lanes: (params) => {
            const intake = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ap_lane_intake'],
                    label: '1. Invoice Intake',
                    name: 'intake',
                    order: 1,
                    description: 'Invoice received by email, upload or manual entry and registered with a correlation ID.',
                    startRule: wfa.playbook.run.Immediately(),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ap_intake_gate'],
                            label: 'Invoice registered',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_ap_invoice',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>1',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Invoice intake',
                            description: 'The invoice document has been received and registered.',
                            pending_title: 'Invoice intake',
                            pending_description: 'Waiting for the invoice to be registered and sent for extraction.',
                            record_fields: FieldList<'x_695068_bcfa_ap_invoice'>(['invoice_number', 'vendor', 'gross_amount', 'currency', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const intake_records = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ap_intake_intake_records'],
                            label: 'Intake record',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            list_title: 'Intake (source document)',
                            table: 'x_695068_bcfa_finance_intake',
                            list_query: `ap_invoice=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'number,source,document_type,processing_status,classification_confidence,sys_created_on',
                            row_count: '10',
                            max_columns: '6',
                        },
                    )
                    return { gate: gate, intake_records: intake_records }
                },
            })
            const extraction = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ap_lane_extraction'],
                    label: '2. Document Extraction',
                    name: 'extraction',
                    order: 2,
                    description: 'SIMULATED DOCUMENT EXTRACTION — POC. Header and line fields extracted from the invoice document; low-confidence fields go to a person.',
                    startRule: wfa.playbook.run.After(intake),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ap_extraction_gate'],
                            label: 'Extraction complete',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_ap_invoice',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>2',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'SIMULATED DOCUMENT EXTRACTION — POC',
                            description: 'Fields were extracted by the POC extraction simulation (native Document Intelligence is not active on this instance). Low confidence or missing fields raise an exception for a person.',
                            pending_title: 'SIMULATED DOCUMENT EXTRACTION — POC',
                            pending_description: 'Waiting for extraction to finish or for a person to resolve a low-confidence / missing-field exception.',
                            record_fields: FieldList<'x_695068_bcfa_ap_invoice'>(['invoice_number', 'vendor', 'gross_amount', 'currency', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const extraction_records = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ap_extraction_extraction_records'],
                            label: 'Extraction result (SIMULATED)',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SIMULATED DOCUMENT EXTRACTION — POC',
                            list_title: 'SIMULATED DOCUMENT EXTRACTION — POC',
                            table: 'x_695068_bcfa_ap_extraction',
                            list_query: `ap_invoice=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'source,confidence,requires_review,reviewed_by,reviewed_at',
                            row_count: '10',
                            max_columns: '5',
                        },
                    )
                    return { gate: gate, extraction_records: extraction_records }
                },
            })
            const validation = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ap_lane_validation'],
                    label: '3. Validation & Enrichment',
                    name: 'validation',
                    order: 3,
                    description: 'Vendor, PO, duplicate and tax checks by the rules engine.',
                    startRule: wfa.playbook.run.After(extraction),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ap_validation_gate'],
                            label: 'Validation passed',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_ap_invoice',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>3',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Validation & enrichment',
                            description: 'Vendor master, PO reference, duplicate and tax rules evaluated by the system.',
                            pending_title: 'Validation & enrichment',
                            pending_description: 'Waiting for validation, or for a person to resolve a validation exception (duplicate, vendor, PO, tax).',
                            record_fields: FieldList<'x_695068_bcfa_ap_invoice'>(['invoice_number', 'vendor', 'gross_amount', 'currency', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const lines = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ap_validation_lines'],
                            label: 'Invoice lines',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            list_title: 'Invoice lines (as extracted and enriched)',
                            table: 'x_695068_bcfa_ap_invoice_line',
                            list_query: `ap_invoice=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'line_number,material_or_service,quantity,unit_price,tax,amount,po_line,receipt_reference',
                            row_count: '10',
                            max_columns: '8',
                        },
                    )
                    return { gate: gate, lines: lines }
                },
            })
            const matching = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ap_lane_matching'],
                    label: '4. PO / GRN-SRN / 3-Way Match',
                    name: 'matching',
                    order: 4,
                    description: 'Deterministic 3-way match within configured tolerances. AI never overrides a tolerance.',
                    startRule: wfa.playbook.run.After(validation),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ap_matching_gate'],
                            label: '3-way match passed',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_ap_invoice',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>4',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'PO / GRN-SRN / 3-way match',
                            description: 'Quantity and price matched against the PO and the goods / service receipt within the configured tolerances (deterministic rules).',
                            pending_title: 'PO / GRN-SRN / 3-way match',
                            pending_description: 'Waiting for the match, or for a person to resolve a quantity, price, receipt or line-total exception.',
                            record_fields: FieldList<'x_695068_bcfa_ap_invoice'>(['invoice_number', 'vendor', 'gross_amount', 'currency', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const lines = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ap_matching_lines'],
                            label: 'Matched lines',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            list_title: 'Lines matched to PO and receipt',
                            table: 'x_695068_bcfa_ap_invoice_line',
                            list_query: `ap_invoice=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'line_number,quantity,unit_price,amount,po_line,receipt_reference',
                            row_count: '10',
                            max_columns: '6',
                        },
                    )
                    return { gate: gate, lines: lines }
                },
            })
            const exception = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ap_lane_exception'],
                    label: '5. Exception Resolution',
                    name: 'exception',
                    order: 5,
                    description: 'Runs alongside stages 2-4. Shows each exception with the system rule result, the advisory AI recommendation and the human decision, kept separate.',
                    startRule: wfa.playbook.run.After(intake),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ap_exception_gate'],
                            label: 'No open exceptions',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_ap_invoice',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_open_exceptions=0^journey_stage_order>5',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Exception resolution',
                            description: 'System determination, AI recommendation and human decision are shown separately. Only a person can resolve an exception; AI may only recommend.',
                            pending_title: 'Exception resolution',
                            pending_description: 'Waiting for open exceptions to be resolved by a person.',
                            record_fields: FieldList<'x_695068_bcfa_ap_invoice'>(['invoice_number', 'vendor', 'gross_amount', 'currency', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const exceptions = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ap_exception_exceptions'],
                            label: 'Exceptions',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'SYSTEM / AI / HUMAN',
                            list_title: 'Exceptions: SYSTEM DETERMINATION (rule result) | AI RECOMMENDATION (advisory) | HUMAN DECISION',
                            table: 'x_695068_bcfa_ap_exception',
                            list_query: `ap_invoice=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'number,reason_code,status,rule_result,ai_recommendation,decision,decided_by,assignment_group',
                            row_count: '10',
                            max_columns: '8',
                        },
                    )
                    const ai_notes = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ap_exception_ai_notes'],
                            label: 'AI recommendations',
                            order: 3,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'AI RECOMMENDATION',
                            list_title: 'AI RECOMMENDATION — advisory only (Now Assist); never approves, posts or overrides tolerance',
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
                    $id: Now.ID['bcfa_pb_ap_lane_approval'],
                    label: '6. Approval',
                    name: 'approval',
                    order: 6,
                    description: 'Human approval within the delegation of authority, with segregation of duties enforced.',
                    startRule: wfa.playbook.run.After(matching, exception),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ap_approval_gate'],
                            label: 'Approved',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_ap_invoice',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>6',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Approval',
                            description: 'Approval is a HUMAN DECISION. Segregation of duties is checked by the system; AI cannot approve.',
                            pending_title: 'Approval',
                            pending_description: 'Waiting for an authorised approver.',
                            record_fields: FieldList<'x_695068_bcfa_ap_invoice'>(['invoice_number', 'vendor', 'gross_amount', 'currency', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const approvals = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ap_approval_approvals'],
                            label: 'Approvals',
                            order: 2,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: 'HUMAN DECISION',
                            list_title: 'HUMAN DECISION: approvals',
                            table: 'x_695068_bcfa_ap_approval',
                            list_query: `ap_invoice=${wfa.playbook.dataPill(params.parentRecord)}^ORDERBYDESCsys_created_on`,
                            columns: 'approval_type,approver,decision,decided_at,sod_check,decision_notes',
                            row_count: '10',
                            max_columns: '6',
                        },
                    )
                    return { gate: gate, approvals: approvals }
                },
            })
            const posting = wfa.playbook.lane({
                config: {
                    $id: Now.ID['bcfa_pb_ap_lane_posting'],
                    label: '7. SAP Posting (Mock SAP)',
                    name: 'posting',
                    order: 7,
                    description: 'MOCK SAP. Idempotent posting; an unknown outcome is reconciled by status query, never blind-retried.',
                    startRule: wfa.playbook.run.After(approval),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ap_posting_gate'],
                            label: 'Posted to SAP (MOCK SAP)',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_ap_invoice',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>7',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'SAP posting — MOCK SAP',
                            description: 'The approved invoice is posted through the integration service to MOCK SAP (no real SAP connection in the POC).',
                            pending_title: 'SAP posting — MOCK SAP',
                            pending_description: 'Waiting for the MOCK SAP posting result or for reconciliation of an unknown outcome.',
                            record_fields: FieldList<'x_695068_bcfa_ap_invoice'>(['invoice_number', 'vendor', 'gross_amount', 'currency', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const sap_txns = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ap_posting_sap_txns'],
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
                    $id: Now.ID['bcfa_pb_ap_lane_closure'],
                    label: '8. Closure & Audit',
                    name: 'closure',
                    order: 8,
                    description: 'Reconciled and closed; full audit trail of system, AI and human actions.',
                    startRule: wfa.playbook.run.After(posting),
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['bcfa_pb_ap_closure_gate'],
                            label: 'Closed',
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: 'x_695068_bcfa_ap_invoice',
                            record: wfa.playbook.dataPill(params.parentRecord),
                            completion_condition: 'journey_stage_order>8',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: 'Closure & audit',
                            description: 'The invoice is reconciled and closed (or rejected by a person). The audit trail records every system, AI and human action.',
                            pending_title: 'Closure & audit',
                            pending_description: 'Waiting for reconciliation and closure.',
                            record_fields: FieldList<'x_695068_bcfa_ap_invoice'>(['invoice_number', 'vendor', 'gross_amount', 'currency', 'state', 'journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action', 'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']),
                        },
                    )
                    const audit = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['bcfa_pb_ap_closure_audit'],
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
            return { intake: intake, extraction: extraction, validation: validation, matching: matching, exception: exception, approval: approval, posting: posting, closure: closure }
        },
    },
)
