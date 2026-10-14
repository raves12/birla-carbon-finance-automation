"""Generates src/fluent/playbooks/*.now.ts (BCFA native Playbooks).

Each stage (lane) = one WaitForCondition gate on the parent record
(journey_stage_order > N, maintained by FinanceJourneyService) showing the
stage's record fields, plus read-only RecordList evidence. No activity
changes data, makes a decision or uses AI.
"""
import io, os

# Usage: python scripts/deploy/gen_playbooks.py, then npx now-sdk build.
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'fluent', 'playbooks')
os.makedirs(OUT, exist_ok=True)

ROLES = {
    'admin': '4411dd9103de4bdbb5468924b1e5459f',
    'ap_processor': 'bf505b5092574a7fa59a01048550571a',
    'ap_approver': '8baea712261343df915a5dc4518146d3',
    'ar_processor': '588d615a5fea475bbe3422f50e91c218',
    'ar_approver': '090e2d3150b44d4fbf0385f83b1fed30',
    'finance_reviewer': '484c56f4217841e298f5752ea6093a3f',
    'finance_approver': 'e1abbc605ba34cbfb77c584ea689c1b2',
    'integration_operator': '0c4ec58b4b8d4effa699694222685cfd',
    'auditor': '03604bf4100246588f4250676240bc18',
    'read_only': '8409bca632a3430eb7a56387f244a74f',
}

# Shown on every stage gate after the stage's own fields: the journey
# (BLOCKED BECAUSE: WHAT HAPPENED / WHY, NEXT, WHO) and the POC notice.
JOURNEY_FIELDS = ['journey_stage', 'journey_status', 'journey_blocked_reason', 'journey_next_action',
                  'journey_owner', 'journey_open_exceptions', 'journey_banner', 'journey_stage_entered']
PILL = 'wfa.playbook.dataPill(params.parentRecord)'


def q(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"


def fl(table, cols):
    return "FieldList<'%s'>([%s])" % (table, ', '.join(q(c) for c in cols))


def gate(pfx, lane, n, parent, fields, label, title, desc, pending, cond=None):
    cond = cond or 'journey_stage_order>%d' % n
    return """                    const gate = wfa.playbook.activity(
                        ActivityDefinitions.Core.WaitForCondition,
                        {
                            $id: Now.ID['%(pfx)s_%(lane)s_gate'],
                            label: %(label)s,
                            order: 1,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        {
                            table: '%(parent)s',
                            record: %(pill)s,
                            completion_condition: '%(cond)s',
                        },
                        {
                            tagline: 'SYSTEM DETERMINATION',
                            title: %(title)s,
                            description: %(desc)s,
                            pending_title: %(title)s,
                            pending_description: %(pending)s,
                            record_fields: %(fields)s,
                        },
                    )
""" % dict(pfx=pfx, lane=lane, label=q(label), parent=parent, pill=PILL, cond=cond, title=q(title), desc=q(desc),
           pending=q(pending), fields=fl(parent, fields + JOURNEY_FIELDS))


def evidence(pfx, lane, var, order, table, query, cols, label, list_title, tagline):
    """query: encoded query; {P} = the parent record sys_id, {C} = its customer."""
    q_src = query.replace('{P}', '${' + PILL + '}').replace('{C}', '{{pd.inputRecord.customer}}')  # platform pill format; custom fields are not typed for dataPill()
    return """                    const %(var)s = wfa.playbook.activity(
                        ActivityDefinitions.Core.RecordList,
                        {
                            $id: Now.ID['%(pfx)s_%(lane)s_%(var)s'],
                            label: %(label)s,
                            order: %(order)d,
                            startRule: wfa.playbook.run.Immediately(),
                            restartRule: 'RUN_ALWAYS',
                        },
                        { wait: 'no' },
                        {
                            tagline: %(tagline)s,
                            list_title: %(list_title)s,
                            table: '%(table)s',
                            list_query: `%(query)s`,
                            columns: %(cols)s,
                            row_count: '10',
                            max_columns: '%(maxc)d',
                        },
                    )
""" % dict(var=var, pfx=pfx, lane=lane, label=q(label), order=order, tagline=q(tagline), list_title=q(list_title),
           table=table, query=q_src, cols=q(','.join(cols)), maxc=len(cols))


def lane(pfx, key, order, label, desc, start, acts_src, act_names):
    ret = ', '.join('%s: %s' % (a, a) for a in act_names)
    return """            const %(key)s = wfa.playbook.lane({
                config: {
                    $id: Now.ID['%(pfx)s_lane_%(key)s'],
                    label: %(label)s,
                    name: '%(key)s',
                    order: %(order)d,
                    description: %(desc)s,
                    startRule: %(start)s,
                    restartRule: 'RUN_ALWAYS',
                },
                activities: () => {
%(acts)s                    return { %(ret)s }
                },
            })
""" % dict(key=key, pfx=pfx, label=q(label), order=order, desc=q(desc), start=start, acts=acts_src, ret=ret)


def playbook(fname, header, const, pfx, label, name, desc, parent, roles_view, lanes):
    body = ''.join(l[0] for l in lanes)
    ret = ', '.join('%s: %s' % (l[1], l[1]) for l in lanes)
    roles = '\n'.join(
        "                { role: '%s', view: true%s }, // %s" % (ROLES[r], ', restart: true, laneRestart: true' if r == 'admin' else '', r)
        for r in roles_view)
    src = header + """export const %(const)s = PlaybookDefinition(
    {
        $id: Now.ID['%(pfx)s_playbook'],
        label: %(label)s,
        name: '%(name)s',
        description: %(desc)s,
        parentTable: '%(parent)s',
        access: 'package_private',
        runStrategy: 'run_if_not_running',
        restartable: 'RESTARTABLE_TRUE',
    },
    {
        // View only for every BCFA role; admin may restart a run (a restart
        // only re-reads the journey fields). Actions happen on the records.
        permissions: () => ({
            roles: [
%(roles)s
            ],
        }),
        triggers: [
            wfa.playbook.trigger(
                PlaybookTriggerTypes.RecordCreate,
                { $id: Now.ID['%(pfx)s_trigger_create'], label: 'On creation' },
                { table: '%(parent)s' },
            ),
        ],
    },
    {
        lanes: (params) => {
%(body)s            return { %(ret)s }
        },
    },
)
""" % dict(const=const, pfx=pfx, label=q(label), name=name, desc=q(desc), parent=parent, roles=roles, body=body, ret=ret)
    io.open(os.path.join(OUT, fname), 'w', encoding='utf8', newline='\n').write(src)


HEADER = """import { ActivityDefinitions, PlaybookDefinition, PlaybookTriggerTypes, wfa } from '@servicenow/sdk/automation'

// %s
//
// Native ServiceNow Playbook (Process Automation Designer / Playbook
// Experience). It is a VIEW of the transaction, not a workflow engine:
//  - every stage waits on journey_stage_order on the parent record, which
//    FinanceJourneyService derives from the authoritative state, exceptions,
//    approvals and integration transactions on every state change;
//  - the evidence activities are read-only Record Lists of the authoritative
//    records (match results, allocations, approvals, integration
//    transactions, AI interactions, audit events); amounts are shown as the
//    engines recorded them, never recomputed;
//  - no activity updates a record, approves, posts, clears or calls AI.
// Actions (approve, resolve, check SAP draft, ...) are the existing UI
// actions on the records the lists open, with their ACLs and SoD checks.
// See docs/PLAYBOOK_DESIGN.md. Playbooks deploy as drafts: activate them in
// Workflow Studio (docs/build/PLAYBOOK_BUILD_AND_ACTIVATION.md).
// Generated by the Phase 35 playbook generator; edit both together.

"""
After = 'wfa.playbook.run.After(%s)'
Imm = 'wfa.playbook.run.Immediately()'
BY_P = '{F}={P}^ORDERBYDESCsys_created_on'


def by(field, extra=''):
    return field + '={P}' + extra + '^ORDERBYDESCsys_created_on'


AI_COLS = ['capability', 'skill', 'recommendation', 'confidence', 'guardrail_action', 'human_decision', 'human_decided_by', 'sys_created_on']
AUDIT_COLS = ['occurred_at', 'event_type', 'actor_type', 'actor', 'description']
TXN_COLS = ['operation', 'adapter', 'idempotency_key', 'status', 'attempt', 'external_document_id', 'unknown_outcome_flag', 'reconciliation_state', 'error_code']

# ------------------------------------------------------------------ AP
AP = 'x_695068_bcfa_ap_invoice'
P = 'bcfa_pb_ap'
ap_lanes = []


def ap(key, order, label, desc, start, fields, gate_args, evid):
    src = gate(P, key, order, AP, fields, *gate_args)
    names = ['gate']
    for i, e in enumerate(evid):
        src += evidence(P, key, e[0], i + 2, *e[1:])
        names.append(e[0])
    ap_lanes.append((lane(P, key, order, label, desc, start, src, names), key))


ap('intake', 1, '1. Invoice Intake', 'Invoice received by email, upload or manual entry and registered with a correlation ID.', Imm,
   ['invoice_number', 'source', 'correlation_id', 'state', 'sys_created_on'],
   ('Invoice registered', 'Invoice intake', 'The invoice document was received and registered (intake record, attachment and correlation ID).',
    'Waiting for the invoice to be registered and sent for extraction.'),
   [('intake_records', 'x_695068_bcfa_finance_intake', by('ap_invoice'),
     ['number', 'source', 'source_reference', 'document_type', 'processing_status', 'correlation_id', 'sys_created_on'],
     'Intake record', 'Intake: source document, channel and status (open a row for the attachment)', 'SYSTEM DETERMINATION')])
ap('extraction', 2, '2. Document Understanding', 'Header, tax and line fields read from the invoice document by the configured provider (Extraction provider field): native ServiceNow Document Intelligence on Now LLM by default; SIMULATED DOCUMENT EXTRACTION — POC only for test fixtures. Low confidence or missing fields go to a person.', After % 'intake',
   # Phase 41, defect 7: structured, readable extracted data (document,
   # supplier, invoice, PO/receipt references, amounts, taxes, charges, lines,
   # confidence, source pages, normalization) instead of raw fields / JSON.
   ['extraction_provider', 'extraction_confidence', 'document_language', 'document_country', 'amount_reconciliation', 'amount_reconciliation_detail', 'extraction_summary'],
   ('Extraction complete', 'Document extraction (provider shown)',
    'Fields were read by the provider shown in Extraction provider. Native extraction failure never falls back to simulated values: it goes to manual review. The printed tax breakdown is recorded as read; it is validated in the next stage, not here. Low confidence or a missing mandatory field raises an exception: the stage does not complete until a person resolves it.',
    'Waiting for extraction, or for a person to review a low-confidence / missing-field exception.'),
   [('extraction_records', 'x_695068_bcfa_ap_extraction', by('ap_invoice'),
     ['source', 'confidence', 'requires_review', 'reviewed_by', 'reviewed_at', 'sys_created_on'],
     'Extraction result', 'Extraction result and review (source = provider)', 'EXTRACTION (provider shown)'),
    ('lines', 'x_695068_bcfa_ap_invoice_line', 'ap_invoice={P}^ORDERBYline_number',
     ['line_number', 'material_or_service', 'quantity', 'unit', 'unit_price', 'tax', 'amount'],
     'Extracted lines', 'Invoice lines as extracted', 'EXTRACTION (provider shown)')])
ap('validation', 3, '3. Validation & Enrichment', 'Mandatory fields, vendor, company, PO, currency, duplicate and tax controls by the rules engine.', After % 'extraction',
   ['vendor', 'company_code', 'purchase_order', 'currency', 'gross_amount', 'duplicate_key',
    'tax_regime', 'tax_amount', 'expected_tax_amount', 'tax_variance_amount', 'tax_validation_result', 'tax_validation_detail', 'tax_rule_source',
    'wht_applicable', 'wht_code', 'wht_expected_amount', 'wht_result'],
   ('Validation passed', 'Validation & enrichment', 'Vendor master, company, PO reference, currency, duplicate and tax controls evaluated by the system. TAX VALIDATION: the expected regime, rate and withholding come from configuration (decision table BCFA AP Tax Expectation, rule source shown; POC reference data, not SAP), never from the document; the result is PASS / WITHIN TOLERANCE / WARNING / FAIL / MANUAL REVIEW with the checks in the detail. A failed control raises an exception and the stage stays open.',
    'Waiting for validation, or for a person to resolve a failed control (duplicate, vendor, PO, tax).'),
   [('failed_controls', 'x_695068_bcfa_ap_exception', 'ap_invoice={P}^reason_codeINduplicate,vendor_invalid,po_mismatch,tax_validation,missing_field^ORDERBYDESCsys_created_on',
     ['number', 'reason_code', 'severity', 'status', 'rule_result', 'evidence'],
     'Failed controls', 'FAILED validation controls with evidence (none listed = all controls PASSED)', 'SYSTEM DETERMINATION')])
ap('matching', 4, '4. PO / GRN-SRN / 3-Way Match', 'Deterministic 3-way match of invoice, PO and goods / service receipt within the configured tolerances. AI never overrides a tolerance.', After % 'validation',
   ['purchase_order', 'net_amount', 'currency'],
   ('3-way match passed', 'PO / GRN-SRN / 3-way match', 'MatchingEngine compared each invoice line with its PO line and receipt. Variances and the result below are the engine\'s own record; the Playbook does not recalculate them.',
    'Waiting for the match, or for a person to resolve a quantity, price, receipt or line-total exception.'),
   [('match_results', 'x_695068_bcfa_ap_match', by('ap_invoice'),
     ['po_line', 'receipt', 'quantity_variance', 'price_variance', 'tax_variance', 'within_tolerance', 'match_result', 'evaluated_at'],
     'Match results', 'MATCH RESULT (MatchingEngine): PO line vs GRN/SRN vs invoice, variances and tolerance verdict', 'SYSTEM DETERMINATION'),
    ('tolerances', 'x_695068_bcfa_ap_match', by('ap_invoice'),
     ['tolerance_source', 'quantity_tolerance_pct', 'price_tolerance_pct', 'tax_tolerance_abs', 'tax_tolerance_pct', 'total_tolerance_abs', 'expected_tax', 'tax_result', 'tolerance_detail'],
     'Tolerances applied', 'TOLERANCE RULE APPLIED: rule source, configured tolerances, expected vs actual and result per check (AI never overrides a tolerance)', 'SYSTEM DETERMINATION'),
    ('lines', 'x_695068_bcfa_ap_invoice_line', 'ap_invoice={P}^ORDERBYline_number',
     ['line_number', 'po_line', 'receipt_reference', 'quantity', 'unit_price', 'amount'],
     'Invoice lines', 'SUPPLIER INVOICE lines with their PO line and receipt', 'SYSTEM DETERMINATION')])
ap('exception', 5, '5. Exception Resolution', 'Runs alongside stages 2-4 and completes when no exception is open. System determination, AI recommendation and human decision are kept separate.', After % 'intake',
   ['state', 'journey_open_exceptions'],
   ('No open exceptions', 'Exception resolution',
    'SYSTEM DETERMINATION is the rule result; AI RECOMMENDATION is advisory (Explain Exception, Recommended Next Action, Draft Clarification); HUMAN DECISION is recorded by the authorised person. Only a person resolves; AI never approves or overrides tolerance.',
    'Waiting for the open exceptions to be resolved by their owners.', 'journey_open_exceptions=0^journey_stage_order>5'),
   [('exceptions', 'x_695068_bcfa_ap_exception', by('ap_invoice'),
     ['number', 'reason_code', 'severity', 'status', 'rule_result', 'variance_amount', 'variance_pct', 'ai_recommendation', 'decision', 'decided_by', 'assignment_group', 'sla_due', 'aging_bucket'],
     'Exceptions', 'Exceptions: SYSTEM DETERMINATION (rule result, variance) | AI RECOMMENDATION (advisory) | HUMAN DECISION', 'SYSTEM / AI / HUMAN'),
    ('ai_notes', 'x_695068_bcfa_ai_interaction', by('source_record'), AI_COLS,
     'AI recommendations', 'AI RECOMMENDATION — advisory only: never approves, posts or overrides tolerance', 'AI RECOMMENDATION')])
ap('approval', 6, '6. Approval', 'Human approval within the delegation of authority; ApprovalEngine and segregation of duties are authoritative.', After % 'matching, exception',
   ['approval_state', 'gross_amount', 'currency'],
   ('Approved', 'Approval', 'Approval is a HUMAN DECISION by an authorised approver. The requester and the processor cannot approve (SoD check recorded on the approval). AI cannot approve.',
    'Waiting for an authorised approver.'),
   [('approvals', 'x_695068_bcfa_ap_approval', by('ap_invoice'),
     ['approval_type', 'requested_by', 'approver', 'approval_group', 'decision', 'decided_at', 'sod_check', 'decision_notes', 'override_reason'],
     'Approvals', 'HUMAN DECISION: approval requests, decisions and SoD checks', 'HUMAN DECISION')])
ap('posting', 7, '7. SAP Posting (Mock SAP)', 'MOCK SAP. Idempotent posting through IntegrationService; an unknown outcome is reconciled by a status query, never blind-retried.', After % 'approval',
   ['approval_state', 'posting_state', 'sap_document_id'],
   ('Posted to SAP (MOCK SAP)', 'SAP posting — MOCK SAP',
    'The approved invoice is posted by IntegrationService to MOCK SAP (no real SAP connection in the POC). The Playbook never calls SAP. An UNKNOWN_OUTCOME stays here until reconciliation confirms the result.',
    'Waiting for the MOCK SAP posting result or for reconciliation of an unknown outcome.'),
   [('sap_txns', 'x_695068_bcfa_integration_txn', by('source_record'), TXN_COLS,
     'SAP transactions (MOCK SAP)', 'MOCK SAP integration transactions: adapter, idempotency key, status, document, reconciliation', 'MOCK SAP')])
ap('closure', 8, '8. Closure & Audit', 'Reconciled and closed; full evidence and audit trail of system, AI and human actions.', After % 'posting',
   ['state', 'sap_document_id', 'posting_state', 'correlation_id'],
   ('Closed', 'Closure & audit', 'The invoice is reconciled and closed (or rejected by a person). Closure cannot happen while an UNKNOWN_OUTCOME is unresolved. The audit trail records every system, AI and human action.',
    'Waiting for reconciliation and closure.'),
   [('ai_assistance', 'x_695068_bcfa_ai_interaction', by('source_record'), AI_COLS,
     'AI assistance', 'AI assistance used on this invoice (advisory)', 'AI RECOMMENDATION'),
    ('audit', 'x_695068_bcfa_audit_event', by('source_record'), AUDIT_COLS,
     'Audit trail', 'Audit trail (AuditEngine)', 'AUDIT')])

playbook('ap_invoice_playbook.now.ts', HEADER % 'BCFA AP Invoice Processing Playbook (8 stages).', 'apInvoicePlaybook', P,
         'BCFA AP Invoice Processing Playbook', 'bcfa_ap_invoice_processing',
         'BCFA AP invoice journey: intake, document extraction (native Document Intelligence; simulated provider for fixtures only), validation with tax and withholding checks, PO/GRN-SRN 3-way match, exceptions, approval, MOCK SAP posting, closure. A view of the authoritative state only.',
         AP, ['admin', 'ap_processor', 'ap_approver', 'finance_reviewer', 'finance_approver', 'integration_operator', 'auditor', 'read_only'],
         ap_lanes)

# ------------------------------------------------------------------ AR
AR = 'x_695068_bcfa_payment'
P = 'bcfa_pb_ar'
ar_lanes = []


def ar(key, order, label, desc, start, fields, gate_args, evid):
    src = gate(P, key, order, AR, fields, *gate_args)
    names = ['gate']
    for i, e in enumerate(evid):
        src += evidence(P, key, e[0], i + 2, *e[1:])
        names.append(e[0])
    ar_lanes.append((lane(P, key, order, label, desc, start, src, names), key))


REMIT_COLS = ['remittance_reference', 'source', 'confidence', 'received_date', 'sys_created_on']
ALLOC_COLS = ['ar_open_item', 'allocated_amount', 'discount', 'bank_charge', 'tcs', 'residual_amount', 'allocation_state']

ar('intake', 1, '1. Payment & Remittance Intake', 'Bank payment received; the remittance advice may arrive with it, later or never (PAYMENT ONLY until it does).', Imm,
   ['bank_reference', 'value_date', 'amount', 'currency', 'bank_account', 'source', 'correlation_id'],
   ('Payment registered', 'Payment & remittance intake', 'BANK PAYMENT registered. REMITTANCE: listed below when received (PAYMENT ONLY / PAYMENT + REMITTANCE CORRELATED is shown in Blocked Because).',
    'Waiting for the payment to be normalized.'),
   [('intake_records', 'x_695068_bcfa_finance_intake', by('payment'),
     ['number', 'source', 'source_reference', 'document_type', 'processing_status', 'sys_created_on'],
     'Intake records', 'Intake: bank line and remittance documents', 'SYSTEM DETERMINATION'),
    ('remittances', 'x_695068_bcfa_remittance', by('payment'), REMIT_COLS,
     'Remittance', 'REMITTANCE received for this payment', 'SYSTEM DETERMINATION')])
ar('correlation', 2, '2. Document Understanding', 'Payment advice read by the configured provider (native ServiceNow Document Intelligence on Now LLM by default; SIMULATED DOCUMENT EXTRACTION — POC only for test fixtures) and correlated to the payment by the system.', After % 'intake',
   ['bank_reference', 'amount', 'currency', 'advice_summary'],
   ('Remittance correlated', 'Payment advice extraction & correlation (provider shown)',
    'Advice fields (payer, payment and bank reference, invoice references, deductions with their printed reasons) were read by the provider shown on the remittance and correlated to the payment by the system. Reconciliation precedence: the bank statement and the SAP open items (through IntegrationService) are authoritative; the advice explains the payment, it never overrides them.',
    'Waiting for remittance correlation.'),
   [('remittances', 'x_695068_bcfa_remittance', by('payment'),
     ['remittance_reference', 'extraction_provider', 'payer_name', 'bank_reference', 'payment_amount', 'currency', 'advice_deduction_amount', 'advice_deduction_reason', 'invoice_count', 'confidence'],
     'Payment advice', 'PAYMENT ADVICE as extracted (provider shown) and correlated to this payment', 'EXTRACTION (provider shown)')])
ar('customer', 3, '3. Customer Resolution', 'Customer resolved deterministically (exact or confirmed alias). An ambiguous customer needs a person: AI may rank candidates, never commit one.', After % 'correlation',
   ['customer', 'bank_reference', 'amount'],
   ('Customer resolved', 'Customer resolution', 'CUSTOMER RESOLVED by deterministic rules (exact code or confirmed alias). If ambiguous: CUSTOMER REVIEW REQUIRED — a person confirms; AI may only recommend.',
    'Waiting for customer resolution (an ambiguous customer needs a person).'),
   [('candidates', 'x_695068_bcfa_match_candidate', 'payment={P}^ORDERBYrank',
     ['customer_candidate', 'ar_open_item', 'match_type', 'confidence', 'rank', 'selected'],
     'Candidates', 'Customer / open-item candidates with confidence (system ranking)', 'SYSTEM DETERMINATION')])
ar('open_items', 4, '4. Open Item Retrieval', 'Open AR items of the resolved customer (MOCK SAP reference data in the POC).', After % 'customer',
   ['customer', 'currency'],
   ('Open items retrieved', 'Open item retrieval — MOCK SAP reference data', 'Open AR items of the customer, from the POC master data that stands in for SAP.',
    'Waiting for the customer\'s open items.'),
   [('open_items', 'x_695068_bcfa_ar_open_item', 'customer={C}^ORDERBYdue_date',
     ['item_number', 'invoice_amount', 'open_amount', 'currency', 'due_date', 'status'],
     'Customer open items', 'Customer open items (MOCK SAP reference data)', 'MOCK SAP')])
ar('matching', 5, '5. Matching & Allocation', 'MatchingEngine allocates the payment to open items. Allocated, deduction and residual amounts are the engine\'s own result.', After % 'open_items',
   ['amount', 'allocated_amount', 'deduction_amount', 'residual_amount', 'currency'],
   ('Allocation balanced', 'Matching & allocation',
    'PAYMENT AMOUNT against SELECTED OPEN ITEMS: each allocation below, with the allocated total and residual recorded by the allocation engine (negative residual: short payment; positive: overpayment). Nothing is recalculated here.',
    'Waiting for matching and allocation, or for a person to resolve an unmatched / ambiguous / currency / duplicate exception.'),
   [('allocations', 'x_695068_bcfa_payment_allocation', 'payment={P}^ORDERBYsys_created_on', ALLOC_COLS,
     'Allocations', 'ALLOCATIONS (allocation engine result), one row per open item', 'SYSTEM DETERMINATION')])
ar('exception', 6, '6. Exception / Deduction Resolution', 'Runs alongside stages 2-5 and completes when no exception is open. Residuals, deductions and other exceptions, with system result, AI recommendation and human decision kept separate.', After % 'intake',
   ['residual_amount', 'deduction_amount', 'journey_open_exceptions'],
   ('No open exceptions', 'Exception / deduction resolution',
    'SYSTEM DETERMINATION is the rule result and residual; AI RECOMMENDATION is advisory (Residual Explanation, Deduction Analysis, Recommended Next Action, Customer Clarification Draft); HUMAN DECISION is the deduction classification or resolution by the authorised person.',
    'Waiting for open exceptions or deductions to be resolved by their owners.', 'journey_open_exceptions=0^journey_stage_order>6'),
   [('exceptions', 'x_695068_bcfa_ar_exception', by('payment'),
     ['number', 'reason_code', 'severity', 'status', 'residual_amount', 'rule_result', 'ai_recommendation', 'decision', 'decided_by', 'assignment_group', 'sla_due'],
     'Exceptions', 'Exceptions: SYSTEM DETERMINATION (rule result, residual) | AI RECOMMENDATION (advisory) | HUMAN DECISION', 'SYSTEM / AI / HUMAN'),
    ('deductions', 'x_695068_bcfa_deduction', 'payment_allocation.payment={P}^ORDERBYDESCsys_created_on',
     ['deduction_type', 'amount', 'currency', 'advice_reason', 'advice_amount', 'category_source', 'credit_note', 'status', 'approved_by', 'approved_at'],
     'Deductions', 'HUMAN DECISION: classified deductions (bank charge, TDS / TCS, withholding, credit / debit note, commercial, rounding, ...) with the reason printed on the advice; AI may suggest a category, a person confirms it', 'HUMAN DECISION'),
    ('ai_notes', 'x_695068_bcfa_ai_interaction', by('source_record'), AI_COLS,
     'AI recommendations', 'AI RECOMMENDATION — advisory only: never approves, clears or overrides tolerance', 'AI RECOMMENDATION')])
ar('approval', 7, '7. Approval', 'Human approval of the allocation and any deduction; ApprovalEngine and segregation of duties are authoritative.', After % 'matching, exception',
   ['amount', 'allocated_amount', 'deduction_amount', 'residual_amount'],
   ('Approved', 'Approval', 'Approval is a HUMAN DECISION by an authorised approver (deductions above the threshold need a Finance Approver). The requester and the processor cannot approve. AI cannot approve.',
    'Waiting for an authorised approver.'),
   [('approvals', 'x_695068_bcfa_ar_approval', by('payment'),
     ['approval_type', 'requested_by', 'approver', 'approval_group', 'decision', 'decided_at', 'sod_check', 'decision_notes', 'override_reason'],
     'Approvals', 'HUMAN DECISION: approval requests, decisions and SoD checks', 'HUMAN DECISION')])
ar('sap_processing', 8, '8. SAP Draft / Direct Processing', 'MOCK SAP. DIRECT: SAP clears immediately. DRAFT: staged (parked) in SAP and cleared only after SAP confirms. Mode from x_695068_bcfa.ar.sap_processing_mode, captured on the payment.', After % 'approval',
   ['sap_processing_mode', 'sap_status', 'sap_reference', 'state'],
   ('Cleared in SAP (MOCK SAP)', 'SAP processing (DRAFT / DIRECT) — MOCK SAP',
    'IntegrationService sends the approved clearing instruction to MOCK SAP in the payment\'s processing mode. DRAFT: the payment waits in SAP_DRAFT until SAP confirms the draft (Check SAP Draft Status: a status query, never a re-send). No real SAP posting happens in the POC.',
    'Waiting for MOCK SAP: clearing result, draft confirmation, or reconciliation of an unknown outcome.'),
   [('sap_txns', 'x_695068_bcfa_integration_txn', by('source_record'), TXN_COLS,
     'SAP transactions (MOCK SAP)', 'MOCK SAP integration transactions: mode, adapter, idempotency key, transmission status, reference, reconciliation', 'MOCK SAP')])
ar('closure', 9, '9. Closure & Audit', 'Cleared, reconciled and closed; full evidence and audit trail.', After % 'sap_processing',
   ['state', 'sap_reference', 'allocated_amount', 'deduction_amount', 'residual_amount', 'correlation_id'],
   ('Closed', 'Closure & audit', 'The payment is cleared, reconciled and closed. Closure cannot happen while an UNKNOWN_OUTCOME or an unconfirmed SAP draft is open. The audit trail records every system, AI and human action.',
    'Waiting for clearing confirmation, reconciliation and closure.'),
   [('ai_assistance', 'x_695068_bcfa_ai_interaction', by('source_record'), AI_COLS,
     'AI assistance', 'AI assistance used on this payment (advisory)', 'AI RECOMMENDATION'),
    ('audit', 'x_695068_bcfa_audit_event', by('source_record'), AUDIT_COLS,
     'Audit trail', 'Audit trail (AuditEngine)', 'AUDIT')])

playbook('ar_cash_application_playbook.now.ts', HEADER % 'BCFA Cash Application Playbook (9 stages).', 'arCashApplicationPlaybook', P,
         'BCFA Cash Application Playbook', 'bcfa_cash_application',
         'BCFA cash application journey: payment & remittance intake, payment advice extraction (native Document Intelligence; simulated provider for fixtures only) and correlation, customer, open items, matching & allocation, exceptions & deductions, approval, SAP DRAFT/DIRECT processing (MOCK SAP), closure. A view of the authoritative state only.',
         AR, ['admin', 'ar_processor', 'ar_approver', 'finance_reviewer', 'finance_approver', 'integration_operator', 'auditor', 'read_only'],
         ar_lanes)
print('ok')
