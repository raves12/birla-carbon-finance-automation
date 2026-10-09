"""Builds deliverables/BCFA_Technical_Design.docx: the end-to-end technical
design of the Birla Carbon Finance Automation POC. Narrative chapters are
written here; catalogues (tables, fields, choices, script include methods,
properties, roles, ACLs, UI actions, flows, rules, jobs, state models, tests,
AI agents and tools) are generated from the build by extract_inventory.py.

  npx now-sdk build
  python scripts/deliverables/extract_inventory.py
  python scripts/deliverables/build_technical_design.py
"""
import io, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docx_kit import (bullets, box, code, h, new_document, numbered, page_break, para, table, toc, TEAL)  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
INV = json.load(io.open(os.path.join(HERE, 'build', 'inventory.json'), encoding='utf8'))
EXT = json.load(io.open(os.path.join(REPO, 'scripts', 'deploy', 'native_extraction_config.json'), encoding='utf8'))
OUT = os.path.join(REPO, 'deliverables', 'BCFA_Technical_Design.docx')
P = 'x_695068_bcfa'


def short(t):
    return t.replace(P + '_', '').replace(P + '.', '')


def tbl(name):
    return next(t for t in INV['tables'] if t['name'] == name)


def choices(table_name, field):
    return INV['choices'].get(table_name + '.' + field, [])


def choice_text(table_name, field):
    return ', '.join('%s (%s)' % (c['value'], c['label']) for c in choices(table_name, field))


doc = new_document(
    'BCFA Technical Design',
    'Birla Carbon Finance Automation on ServiceNow: AP invoice processing and Cash Application, end to end',
    [('Application', 'Birla Carbon Finance Automation, scope x_695068_bcfa (app sys_id 229ba2b1a079431e104010f5ea883e85)'),
     ('Instance', 'pwcmanagementservicesdemo01.service-now.com (Yokohama)'),
     ('Source', 'github.com/raves12/birla-carbon-finance-automation, branch master (merge d12c78b, 2026-10-05) plus the Phase 41 changes (client sample pack, POC team defects), 2026-10-08'),
     ('Build', 'ServiceNow Fluent SDK 4.12.1 (now-sdk); server scripts in src/server; deployed through Scripts - Background loaders'),
     ('Document status', 'Technical design as built, Phase 41 (client sample pack and POC team defects), 2026-10-08'),
     ('Classification', 'POC. Test documents are SYNTHETIC except the client sample pack (28 files, processed on the instance, kept out of source control); SAP is MOCK SAP; thresholds and tax rates are POC ASSUMPTION / POC REFERENCE DATA')])
toc(doc)

# 1 ------------------------------------------------------------------------
h(doc, '1. Introduction')
h(doc, '1.1 Purpose', 2)
para(doc, 'This document describes how the Birla Carbon Finance Automation (BCFA) proof of concept is built on ServiceNow, at the level of detail a developer, '
     'architect or reviewer needs to understand, operate, test or extend it: every table and field, every lifecycle state and transition, every server-side '
     'component and its methods, the decision tables and properties that hold policy, the flows and rules that orchestrate the work, the integration contract '
     'to SAP, the document extraction design, the AI design and guardrails, security, testing and deployment.')
h(doc, '1.2 Scope', 2)
table(doc, ['In scope (built)', 'Out of scope (documented only)'], [
    ('AP PO/SO invoice processing, workbook processes AP-01..11: intake, document extraction, validation, tax validation, 3-way match, exceptions, approval, SAP posting, reconciliation, closure',
     'O2C (O2C-01..10), Non-PO invoicing (NPO-01..05), AR/AP site edge cases (AR-E01..03, AP-E01..08)'),
    ('Cash Application, workbook processes CA-01..17: bank line intake, payment advice / remittance extraction, customer resolution, open items, matching, allocation, deductions, approval, SAP clearing (DIRECT / DRAFT), reconciliation, closure',
     'Real SAP ECC connectivity (Mode 2), real bank statement feeds, real archive'),
    ('ServiceNow-native AI (Now Assist skills, AI agents, Document Intelligence on Now LLM), advisory only', 'Any external AI runtime (Claude, OpenAI, Gemini): removed in Phase 34 and not used')],
    widths=[9, 8])
h(doc, '1.3 Conventions', 2)
bullets(doc, [
    ('POC ASSUMPTION: ', 'a threshold, limit or rule chosen for the POC, to be agreed with Birla Carbon finance.'),
    ('POC REFERENCE DATA: ', 'tax expectations (GST / VAT / withholding rates) configured for the POC; not tax advice and not read from SAP.'),
    ('MOCK SAP: ', 'every SAP call goes to MockSAPAdapter; document numbers (MIRO…, FB05…, PARK…) are deterministic mock references.'),
    ('SYNTHETIC: ', 'every demo and test document is project-generated and watermarked; no Birla Carbon document has been processed.'),
    ('Names: ', 'tables and properties are shown without the scope prefix where unambiguous: "ap_invoice" means table x_695068_bcfa_ap_invoice; "ap.tolerance.price_pct" means property x_695068_bcfa.ap.tolerance.price_pct.')])
h(doc, '1.4 Design principles', 2)
table(doc, ['Principle', 'How the design enforces it'], [
    ('OCR extracts facts. Rules decide. AI explains. People approve.', 'Extraction writes only the fields printed on the document; MatchingEngine, FinancePolicy and decision tables set every authoritative result; AI writes only advisory fields; approvals are human decisions checked by ApprovalEngine.'),
    ('SAP ECC is the financial system of record', 'BCFA never posts or clears by itself: approved instructions go through IntegrationService to the SAP adapter; the result is recorded, never assumed.'),
    ('Deterministic core', 'State models are enforced (FinanceLifecycle, backstop business rules); every stage of every flow is guarded by the record state; integration writes are idempotent; unknown outcomes are reconciled by a status query, never blind-retried.'),
    ('ServiceNow-native AI only', 'Now Assist skills, AI Agent Studio agents and Document Intelligence on the ServiceNow-hosted Now LLM Service. No external model is called at runtime.'),
    ('AI is advisory', 'AI identities hold no approver role; segregation of duties refuses them; AI tools can write only the advisory note; FinanceAiGuard screens input and sanitises output.'),
    ('Everything is evidenced', 'Append-only Audit Event per business event, correlation ID on every record of a transaction, Integration Transaction per call, AI Interaction Log per AI run.'),
    ('No fallback that hides failure', 'A failed native extraction goes to manual review, never to simulated values; a failed SAP read keeps the cache and is recorded; a decision table that cannot be read falls back to a property and logs it.')],
    widths=[5, 12])

# 2 ------------------------------------------------------------------------
h(doc, '2. Solution architecture')
h(doc, '2.1 Logical architecture', 2)
code(doc, """ USER EXPERIENCE   BCFA Workspace (/now/bcfa/home): Finance Operations dashboard (19 KPIs), AP and Cash
                   Application lists, record pages with Review Summary, Playbook page, classic forms
 PROCESS VIEW      Playbooks (Process Automation Designer): AP Invoice (8 stages), Cash Application (9 stages)
 ORCHESTRATION     15 Flow Designer flows -> event x_695068_bcfa.flow.stage -> Script Action "BCFA - Run Flow Stage"
                   -> FinanceOrchestration.run(stage) ; state models enforced by FinanceLifecycle
 DOMAIN SERVICES   FinanceDocumentIntakeService | ApDomainService | ArDomainService | Ap/ArExceptionDecisionService
 ENGINES           DocumentExtractionService (+ NativeDocumentIntelligenceProvider, SimulatedDocumentExtraction)
                   MatchingEngine | FinancePolicy (decision tables, properties) | ExceptionEngine | ApprovalEngine
                   AuditEngine | FinanceJourneyService | FinanceReviewSummary | FinanceKpiService
 AI (ADVISORY)     Now Assist skills (9) via NowAssistSkillClient | AI agents (7) + agentic workflows (2) via
                   FinanceAgentTools | FinanceAiGuard | AiInteractionLog | Document Intelligence on Now LLM
 INTEGRATION       IntegrationService (idempotency, unknown-outcome control, Integration Transaction)
                   -> adapter from x_695068_bcfa.sap.adapter: MockSAPAdapter | RealSAPAdapter (not configured)
                   -> MockBankAdapter | MockArchiveAdapter
 SYSTEM OF RECORD  SAP ECC (MOCK SAP in the POC; production: IntegrationHub / middleware -> SAP)""")
h(doc, '2.2 Technology components', 2)
table(doc, ['ServiceNow capability', 'Used for', 'Classification'], [
    ('App Engine tables (31) and dictionary', 'Data model of AP, AR, master data (mock SAP), evidence', 'Custom data model'),
    ('State Models (sttrm)', 'AP Invoice Lifecycle (19 states, 31 transitions); Cash Application Lifecycle (19 states, 35 transitions)', 'Standard + script enforcement'),
    ('Flow Designer (15 flows)', 'Hand-off of each pipeline stage; aging and escalation', 'Standard (configured)'),
    ('Decision Builder (4 decision tables)', 'Tolerances, tax expectation, AP approval routing, AR deduction policy', 'Standard (configured)'),
    ('System properties (37)', 'Thresholds, limits, providers, modes; fallback for decision tables', 'Standard (configured)'),
    ('Document Intelligence v8 (generative) + Now LLM', 'Native reading of AP invoices and payment advices', 'Standard (configured)'),
    ('Now Assist skills (9) and AI Agent Studio (7 agents, 2 agentic workflows)', 'Explain, summarise, recommend, draft', 'Standard (configured), advisory'),
    ('Process Automation Designer Playbooks (2)', 'Read-only journey view of each invoice and payment', 'Standard (configured)'),
    ('UI Builder / Configurable Workspace', 'BCFA Workspace, lists, record pages, Playbook page', 'Standard (configured)'),
    ('Script includes (32)', 'Domain services, engines, integration, AI tooling', 'Custom code'),
    ('Business rules (15), UI actions (22), scheduled jobs, events, notifications', 'Lifecycle backstop, audit, user actions, polling, KPI refresh', 'Standard + script'),
    ('Automated Test Framework (40 tests)', 'Regression suite BCFA Regression (39) + seed', 'Standard')],
    widths=[5.5, 8, 3.5])
h(doc, '2.3 Repository and build', 2)
table(doc, ['Path', 'Content'], [
    ('src/fluent/tables', 'Table() definitions: ap.now.ts, ar.now.ts, shared.now.ts, master_data, finance_intake, kpi …'),
    ('src/fluent/state-models', 'AP Invoice and Cash Application lifecycles'),
    ('src/fluent/flows', 'Flow() definitions for AP and AR'),
    ('src/fluent/script-includes', 'ScriptInclude() wrappers pointing at src/server/script-includes/*.server.js'),
    ('src/fluent/business-rules, ui-actions, jobs, security, config, navigation, workspaces, playbooks, ai-agents, tests', 'The remaining metadata'),
    ('src/server/script-includes', 'Server logic (Class.create script includes), about 10,400 lines'),
    ('scripts/deploy', 'Deploy generators (gen_*.py / *.mjs) and the generated Scripts - Background loaders (phase*_bg.js), decision table builders, evaluation and demo scripts'),
    ('scripts/eval, scripts/fixtures, test/fixtures', 'Extraction measurement, fixture generators, synthetic PDFs'),
    ('docs', 'Design and evidence documents (this document consolidates them)')], widths=[6, 11])
para(doc, 'Build and deploy: npx now-sdk build compiles the metadata to update XML (dist/app). now-sdk install is not usable on this instance, so each phase '
     'is deployed by a generated Scripts - Background loader (scripts/deploy/gen_phase40_deploy.py and earlier generators). Each loader carries a drift '
     'guard: it aborts unless every script include it changes is live == the source at the last deployed commit (or already == the new build). The '
     'application is committed to the Studio source-control branch sn_instances/pwcmanagementservicesdemo01 with "Include changes not tracked via the '
     'Customer Update table".')

# 3 ------------------------------------------------------------------------
h(doc, '3. Data model')
para(doc, 'The application owns %d tables with %d fields. The full field catalogue is in Appendix A; the choice lists are in Appendix B.' %
     (len(INV['tables']), sum(len(t['fields']) for t in INV['tables'])))
PURPOSE = {
    'ap_invoice': 'AP invoice header and its lifecycle state; extracted tax breakdown, tax and withholding validation results, journey fields',
    'ap_invoice_line': 'Invoice lines with PO line and receipt references',
    'ap_extraction': 'Extraction result per invoice: source (provider), confidence, extracted fields, review flags',
    'ap_match': '3-way match result per line: variances, tolerances applied (with rule source), tax result, per-check detail',
    'ap_exception': 'AP exceptions (APEX…): reason, severity, SLA, rule result, evidence, AI advice, human decision',
    'ap_approval': 'AP approval requests and decisions with segregation-of-duties evidence',
    'payment': 'Bank payment (cash) and its lifecycle; allocation result, SAP processing mode and status, journey fields',
    'remittance': 'Payment advice / remittance linked to a payment: extracted fields, payer, references, stated deductions, provider',
    'match_candidate': 'Ranked AR match candidates (remittance, exact, combination, fuzzy)',
    'payment_allocation': 'Allocation of a payment to open items',
    'deduction': 'Human-confirmed deduction against an allocation (type, amount, advice reason, category source)',
    'ar_exception': 'AR exceptions (AREX…): reason, residual, rule suggestion, AI advice, human decision',
    'ar_approval': 'AR approval requests and decisions',
    'ar_open_item': 'Customer open items (MOCK SAP reference data / cache refreshed through IntegrationService)',
    'credit_note': 'Customer credit notes (MOCK SAP reference data)',
    'vendor': 'Vendor master (MOCK SAP master), incl. country and tax category',
    'customer': 'Customer master (MOCK SAP master)',
    'customer_alias': 'Confirmed remitter-name aliases with confidence',
    'purchase_order': 'Purchase orders (MOCK SAP)',
    'po_line': 'PO lines (MOCK SAP)',
    'receipt': 'Goods / service receipts, GRN / SRN (MOCK SAP)',
    'finance_intake': 'Finance Document Intake: uploaded document, type, hash, processing status, extraction provider and task',
    'integration_txn': 'One record per integration call / idempotency key: request, response, status, SAP reference, reconciliation',
    'integration_profile': 'Adapter behaviour profile (mock failure mode, delay)',
    'audit_event': 'Append-only audit trail of every business event',
    'decision_log': 'Decision log (legacy evidence)',
    'ai_interaction': 'AI Interaction Log: every AI run, guardrail action and human outcome',
    'finance_exception': 'Generic finance exception (kept, unused)',
    'reference_mapping': 'Reference mappings between BCFA and SAP keys',
    'kpi': 'Finance Operations KPI values (computed every 15 minutes)',
    'poc_metric': 'POC success scorecard metrics'}
rows = []
for t in INV['tables']:
    rows.append((short(t['name']), t['label'], len(t['fields']), t['display'], PURPOSE.get(short(t['name']), '')))
table(doc, ['Table', 'Label', 'Fields', 'Display', 'Purpose'], rows, widths=[3.4, 3.4, 1.2, 2.6, 6.4])
h(doc, '3.1 Key relationships', 2)
table(doc, ['From', 'Field', 'To', 'Meaning'], [
    ('finance_intake', 'ap_invoice / payment / remittance', 'ap_invoice, payment, remittance', 'The transaction created from, or linked to, the uploaded document'),
    ('ap_invoice', 'vendor, purchase_order', 'vendor, purchase_order', 'Resolved master data'),
    ('ap_invoice_line', 'ap_invoice, po_line, receipt', 'ap_invoice, po_line, receipt', '3-way match linkage'),
    ('ap_extraction / ap_match / ap_exception / ap_approval', 'ap_invoice', 'ap_invoice', 'Children of the invoice'),
    ('payment', 'customer', 'customer', 'Resolved customer'),
    ('remittance / match_candidate / payment_allocation / ar_exception / ar_approval', 'payment', 'payment', 'Children of the payment'),
    ('payment_allocation', 'ar_open_item', 'ar_open_item', 'Item the cash is applied to'),
    ('deduction', 'payment_allocation, credit_note', 'payment_allocation, credit_note', 'What a person accepted as a deduction'),
    ('integration_txn / audit_event / ai_interaction', 'source_table + source_record, correlation_id', 'any', 'Evidence chain of a transaction'),
    ('customer_alias', 'customer', 'customer', 'Alias resolution')], widths=[4.5, 4, 4, 4.5])

# 4 ------------------------------------------------------------------------
h(doc, '4. Lifecycles (state models)')
para(doc, 'Both lifecycles are platform state models. They are enforced: FinanceLifecycle reads the allowed transitions from the deployed model; '
     'Ap/ArDomainService._setState checks every change and throws "BCFA lifecycle: …" (audited as a refused rule_evaluated event) for a transition outside the '
     'model; the before-update business rules "BCFA - Enforce AP Invoice Lifecycle" and "BCFA - Enforce Payment Lifecycle" abort any other writer; the state '
     'field is read-only on forms. Property lifecycle.enforcement = enforce (monitor = allow but audit).')
STATE_MEANING = {
    'RECEIVED': 'Created (from a document or a bank line)', 'EXTRACTING': 'Reading the document', 'EXTRACTED': 'Fields extracted',
    'VALIDATING': 'Validation running', 'VALIDATED': 'Fields, vendor, PO, duplicate, confidence checked', 'MATCHING': 'Matching running',
    'MATCHED': 'Match within tolerance / payment matched', 'EXCEPTION': 'Waiting for a person (open exception)', 'RESOLUTION': 'Correction in progress',
    'PENDING_APPROVAL': 'Waiting for an authorised approver', 'APPROVED': 'Approved; posting / clearing next', 'POSTING': 'Sending to SAP',
    'POSTED': 'SAP confirmed the posting', 'UNKNOWN_OUTCOME': 'SAP did not answer; reconciliation by status query', 'FAILED': 'SAP refused; exception raised',
    'RECONCILED': 'Outcome reconciled', 'CLOSED': 'Archived and closed', 'REJECTED': 'Rejected by a person', 'ON_HOLD': 'Put on hold by a person',
    'NORMALIZED': 'Bank line normalised', 'CUSTOMER_RESOLUTION': 'Identifying the customer', 'PARTIALLY_MATCHED': 'Some items matched',
    'UNMATCHED': 'No match', 'ALLOCATION': 'Allocating cash to open items', 'CLEARING': 'Sending the clearing to SAP', 'CLEARED': 'SAP confirmed the clearing',
    'SAP_DRAFT': 'DRAFT mode: parked in SAP, waiting for SAP to confirm'}
for m in INV['state_models']:
    h(doc, '4.%d %s' % (INV['state_models'].index(m) + 1, m['name']), 2)
    table(doc, ['#', 'State', 'Label', 'Initial', 'Meaning'],
          [(s['seq'], s['name'], s['label'], 'yes' if s['initial'] else '', STATE_MEANING.get(s['name'], '')) for s in m['states']],
          widths=[0.8, 4, 4, 1.2, 7])
    by_from = {}
    for t in m['transitions']:
        by_from.setdefault(t['from'], []).append(t['to'])
    table(doc, ['From state', 'Allowed next states'], [(k, ', '.join(sorted(v))) for k, v in sorted(by_from.items())], widths=[4.5, 12.5])

# 5 ------------------------------------------------------------------------
h(doc, '5. AP process design: document intake to SAP posting and closure')
para(doc, 'The AP journey runs as a sequence of guarded stages. Each row below is one stage: what triggers it, what runs, what is checked, what it writes '
     'and where it can stop for a person. The 8 Playbook stages (chapter 13) show the same journey to the user.')
table(doc, ['#', 'Stage', 'Trigger / component', 'Processing', 'Records written', 'Stops for a person when'], [
    ('1', 'Document intake', 'User: BCFA Workspace > Document Intake > New; attach PDF; Document Type = AP Invoice; Process Document (UI action) -> FinanceDocumentIntakeService.processDocument',
     'Attachment hash read from sys_attachment.hash; duplicate intake guard (same hash in another processed intake -> reuse its result); document type taken from upload (no automatic classification); audit document_uploaded',
     'finance_intake (number FDI-…, attachment_hash, processing_status)', 'Document type missing -> review_required'),
    ('2', 'Extraction', 'DocumentExtractionService.extract(intake, "ap"); provider from document.extraction.provider (native)',
     'Native: DocIntelAPI.createTask + processTask on use case "BCFA AP Invoice Extraction (Now LLM)"; intake waits in "extracting"; the job BCFA - Native Extraction Poller (every minute) resumes it when the task is processed (timeout 10 min -> manual review). Result JSON mapped to the extraction contract; numbers parsed locale-aware; derived confidence (1.0 − 0.2 per missing critical field, minus arithmetic-check penalties)',
     'finance_intake.extraction_task / extraction_json / extraction_confidence; audit document_extracted (the invoice is created in the next stage)',
     'Extraction failed, or derived confidence < ap.extraction.confidence_threshold (0.85) -> the intake goes to manual review (review_required); no invoice is created'),
    ('3', 'Invoice creation and master data', 'FinanceDocumentIntakeService.processApInvoiceDocument; MatchingEngine.resolveVendor / resolvePurchaseOrder',
     'A good reading always creates the AP invoice (ApDomainService.intakeInvoice, state RECEIVED, with the printed tax breakdown, country and language). Vendor (code, then unique exact name) and PO (number) are linked when they resolve; the printed vendor name / code and PO number are kept on the invoice either way (printed_vendor_name, printed_vendor_code, printed_po_number). The AP Invoice Intake Flow then records the extraction already done (RECEIVED -> EXTRACTED)', 'ap_invoice, ap_invoice_line, ap_extraction', 'Nothing here stops the invoice: unresolved vendor / PO are decided by validation (stage 4). Only a group-company seller (outgoing invoice) goes to review'),
    ('4', 'Validation', 'Flow BCFA AP Validation Flow (state EXTRACTED) -> FinanceOrchestration ap_validation -> ApDomainService.validateInvoice',
     'First links a printed vendor / PO that now resolves (and the lines to that PO\'s lines and receipts), so Re-run Validation picks up master data added later. Then: confidence, mandatory fields, printed totals reconcile, vendor in master data and active, printed PO found, PO belongs to vendor / not closed (MatchingEngine.validatePurchaseOrder). A printed PO that is not found is never treated as a non-PO invoice',
     'State VALIDATING -> VALIDATED; audit rule_evaluated', 'low_confidence, missing_field, totals_not_reconciled, vendor_invalid (printed vendor not in master), po_mismatch (printed PO not found) exception'),
    ('5', 'Tax validation', 'Inside the match: MatchingEngine.evaluateTax with FinancePolicy.apTaxExpectation',
     'Expected regime / rate / withholding from decision table BCFA AP Tax Expectation (country, company, vendor tax category; property ap.tax.reference fallback). Checks total tax vs expected (rounding / tolerance), printed rate, regime label, CGST = SGST halves, IGST not with CGST/SGST, VAT component, withholding amount / rate. Result PASS / WITHIN TOLERANCE / WARNING / FAIL / MANUAL REVIEW',
     'ap_invoice tax_regime, expected_tax_amount, tax_variance_amount, tax_validation_result, tax_validation_detail, tax_rule_source, wht_*', 'FAIL or MANUAL REVIEW -> tax_validation exception (subtype gst / vat / withholding_tax / tax_not_configured / tax_amount)'),
    ('6', '3-way match', 'ApDomainService.matchInvoice -> MatchingEngine.threeWayMatch',
     'Each invoice line vs its PO line and receipt (GRN/SRN): quantity variance vs quantity tolerance, unit price vs price tolerance, header net vs line total (total tolerance), tax (tax tolerance). Tolerances from decision table BCFA AP Tolerance (company, country, vendor type, invoice type), property fallback. Reason precedence: PO linkage -> receipt -> quantity -> price -> tax / totals',
     'ap_match per line (variances, within_tolerance, tolerance_source, tolerances, expected_tax, tax_result, tolerance_detail); state MATCHING -> MATCHED; audit match', 'Variance outside tolerance -> quantity_tolerance / price_tolerance / grn_missing / tax_validation / line_total_mismatch exception'),
    ('7', 'Exception handling', 'ExceptionEngine.createApException; agentic workflow BCFA AP Invoice Review (advisory); UI actions on the exception',
     'Number APEX…, severity, priority, SLA due, owner and group from policy; AI note (advisory) written by the workflow; human decision: Resolve & Retry, Request Correction, Hold, Reject, Approve Override (finance approver, SoD, reason ≥ 10 chars, allowed reasons only)',
     'ap_exception; ap_approval (override); audit exception_*, ai_*, human_review, override', 'Always: an exception waits for its owner'),
    ('8', 'Approval', 'Flow BCFA AP Approval Flow (state MATCHED) -> ApDomainService.routeForApproval -> FinancePolicy.apApprovalDecision (decision table BCFA AP Approval)',
     'Approval required and group (Finance Approvers / Finance Controllers) from amount, exception type, variance, company; ApprovalEngine.requestApInvoiceApproval; on decision ApprovalEngine.checkSegregation (not AI, approver role, not requester, not processor, member of group)',
     'ap_approval (requested_by, group, type, approver, decision, sod_check, state_before / after); state PENDING_APPROVAL -> APPROVED; audit approval_*', 'Always (auto_approve_limit 0): a Finance Approver decides'),
    ('9', 'SAP posting', 'Flow BCFA AP Integration Flow (APPROVED + approval approved) -> ApDomainService.postInvoice -> IntegrationService.execute(postVendorInvoice, adapter = sap.adapter)',
     'Idempotency key AP-POST-<invoice sys_id>; external reference vendor|normalised invoice number; replay / block rules; MOCK SAP returns MIRO… document; timeout -> UNKNOWN_OUTCOME',
     'integration_txn; ap_invoice posting_state, sap_document_id; state POSTING -> POSTED; audit integration_call, integration_result', 'FAILED -> integration exception (Integration Operator)'),
    ('10', 'Reconciliation', 'Flow BCFA AP Reconciliation Flow (UNKNOWN_OUTCOME) -> ApDomainService.reconcilePosting -> IntegrationService.reconcileUnknownOutcome',
     'queryTransactionStatus: COMMITTED -> POSTED (reference recorded); NOT_FOUND -> RETRY on the same transaction (attempt + 1, max 3); undetermined -> stays pending', 'integration_txn reconciliation_state; audit reconciliation', 'Retry limit reached / status unknown -> exception'),
    ('11', 'Archive and closure', 'ApDomainService.reconcileAndClose -> IntegrationService archive (mock_archive)', 'Archive call; final state', 'state CLOSED; audit closure; journey complete', '—')],
    widths=[0.8, 2.1, 3.0, 5.6, 3.3, 2.4], font=7.5)
h(doc, '5.1 Exception reasons (AP)', 2)
table(doc, ['Reason code', 'Label'], [(c['value'], c['label']) for c in choices(P + '_ap_exception', 'reason_code')], widths=[5, 12])

# 6 ------------------------------------------------------------------------
h(doc, '6. Cash Application process design: bank line to SAP clearing and closure')
table(doc, ['#', 'Stage', 'Trigger / component', 'Processing', 'Records written', 'Stops for a person when'], [
    ('1', 'Bank line intake', 'Bank statement (MockBankAdapter / seeded / demo prep) -> ArDomainService.intakePayment', 'Payment created RECEIVED with bank reference, value date, amount, currency, account, idempotency key, correlation ID',
     'payment; audit record_created', '—'),
    ('2', 'Normalisation and customer identification', 'Flow BCFA AR Payment Intake Flow -> ArDomainService.normalizePayment, resolveCustomer',
     'Mandatory fields; customer from remitter name via confirmed alias / exact name at ≥ ar.match.auto_confidence (0.95), or the single owner of every invoice the remittance references. Never guessed',
     'payment.customer; state NORMALIZED -> CUSTOMER_RESOLUTION; audit rule_evaluated', 'No remittance / ambiguous name -> customer_ambiguous exception (the payment waits for its advice)'),
    ('3', 'Payment advice intake', 'Document Intake > New > Document Type = Payment Advice (or AR Remittance) > Process Document', 'Hash and duplicate guard as for AP',
     'finance_intake', '—'),
    ('4', 'Advice extraction', 'Native use case "BCFA AR Payment Advice Extraction (Now LLM)" (12 fields), asynchronous with the poller',
     'Payer, customer code, payment and bank reference (UTR), date, amount, currency, deduction amount and reason, credit / debit note references, invoices paid with amount applied, deduction and reason per invoice; derived confidence',
     'finance_intake.extraction_json', 'Confidence < 0.85 -> manual review'),
    ('5', 'Correlation to the payment', 'FinanceDocumentIntakeService.processArRemittanceDocument',
     'Payment by reference (payment reference, falling back to the bank reference) or a unique candidate by amount / currency / customer / ±5 days; never links an ambiguous candidate',
     'remittance (extracted fields, payer, bank reference, amounts, advice deduction, invoice count, extraction provider); intake.payment / remittance', 'No / several candidate payments -> manual review'),
    ('6', 'Retry with the remittance', 'Flow BCFA AR Remittance Processing Flow -> ArDomainService.retryWithRemittance', 'Resolves the waiting customer_ambiguous / unmatched exception and identifies the customer from the advice',
     'payment.customer; exception resolved', '—'),
    ('7', 'Open items from SAP', 'ArDomainService.refreshOpenItems -> IntegrationService.execute(getOpenItems, adapter = sap.adapter)',
     'Customer open items read through the integration layer; the local open-item table (cache) updated from the answer; failed read -> cached items used and the failure recorded', 'integration_txn (getOpenItems); ar_open_item', '—'),
    ('8', 'Matching', 'Flow BCFA AR Match Flow -> ArDomainService.matchPayment -> MatchingEngine',
     'Precedence: (1) remittance references resolved to open items (same customer, same currency, not cleared); (2) exact amount, payment currency only; (3) exact combinations in cents (≤ 20 items), one -> match, several -> ambiguous_match for a person; (4) greedy suggestion',
     'match_candidate rows; state MATCHING -> MATCHED; audit match', 'currency_mismatch, ambiguous_match, unmatched exception'),
    ('9', 'Allocation and residual', 'ArDomainService.allocatePayment',
     'Allocations from the selected candidates; balance rule: allocations + approved deductions = payment ± 0.01; residual classified by MatchingEngine.classifyResidual: credit note (exact open note) -> rounding (≤ ar.rounding.max_amount) -> stated reason on the advice (TDS / withholding, dispute, commercial) -> bank charge (≤ ar.bank_charge.max_amount)',
     'payment_allocation; payment allocated / deduction / residual amounts; state ALLOCATION', 'short_pay / over_pay exception with the rule suggestion'),
    ('10', 'Deduction decision', 'AR exception UI action Approve Deduction -> ArExceptionDecisionService',
     'A person confirms the deduction type; decision table BCFA AR Deduction (type, amount, company): allowed, approval needed, group; limits: bank charge ≤ 1,000, rounding ≤ 1, withholding ≤ 10 % of covered invoices; dispute / unapplied / other refused as "not a deduction"',
     'deduction (type, amount, currency, advice reason and amount, AI recommendation, category_source human_confirmed); audit deduction', 'Refused deduction keeps the exception open'),
    ('11', 'Approval', 'Flow BCFA AR Approval Flow (PENDING_APPROVAL) -> ArDomainService.routeForApproval', 'Approval requested (ar.approval.auto_approve_limit 0) for BCFA Finance Approvers; SoD on decision',
     'ar_approval; state APPROVED', 'Always: a Finance Approver decides'),
    ('12', 'SAP clearing', 'Flow BCFA AR Clearing Flow (APPROVED) -> ArDomainService.clearPayment -> IntegrationService.execute(clearCustomerPayment)',
     'Mode captured on the payment from ar.sap_processing_mode: DIRECT -> SAP clears (FB05…), open items settled; DRAFT -> parked document (PARK…), state SAP_DRAFT, open items unchanged until "Check SAP Draft Status" (status query, never a re-send; job BCFA - SAP Draft Status Check every 30 min) confirms',
     'integration_txn; payment sap_processing_mode, sap_status, sap_reference; ar_open_item settled; state CLEARING -> CLEARED / SAP_DRAFT', 'FAILED / draft rejected -> exception'),
    ('13', 'Reconciliation and closure', 'Flow BCFA AR Reconciliation Flow (UNKNOWN_OUTCOME); ArDomainService.reconcileAndClose', 'As AP; archive', 'state CLOSED; audit closure', 'Retry limit / unknown status -> exception')],
    widths=[0.8, 2.1, 3.0, 5.6, 3.3, 2.4], font=7.5)
h(doc, '6.1 Exception reasons (AR) and deduction types', 2)
table(doc, ['Reason code', 'Label'], [(c['value'], c['label']) for c in choices(P + '_ar_exception', 'reason_code')], widths=[5, 12])
table(doc, ['Deduction type', 'Label'], [(c['value'], c['label']) for c in choices(P + '_deduction', 'deduction_type')], widths=[5, 12])

# 7 ------------------------------------------------------------------------
h(doc, '7. Native document extraction design')
para(doc, 'Uploaded documents are read by ServiceNow Document Intelligence (v8.0.2, generative pipeline). Each BCFA use case is pinned to the '
     'ServiceNow-hosted Now LLM Service (skill "Document Key Value Extraction (NowLLM)", model gpt_oss_120b) through its own skill configuration '
     '(provider.use_now_llm = true). The instance-default Azure OpenAI definition is not used by BCFA.')
table(doc, ['Element', 'Design'], [
    ('Provider abstraction', 'DocumentExtractionService.provider() reads document.extraction.provider: native (default) or simulated (test fixtures only, labelled SIMULATED DOCUMENT EXTRACTION — POC). There is no fallback between providers: a native failure goes to manual review.'),
    ('Native provider', 'NativeDocumentIntelligenceProvider.extract(intake, kind): one DocIntel task per attachment, named "BCFA <intake number> <attachment sys_id>", stored in finance_intake.extraction_task; returns pending / ok / error; TIMEOUT_MINUTES = 10.'),
    ('Asynchronous completion', 'The intake waits in processing_status "extracting"; the job BCFA - Native Extraction Poller (every minute) calls processDocument again once sys_di_task.is_processed is true (or the timeout passed).'),
    ('Result', 'di_genai_output.data (JSON keyed by the field names in lower case without spaces), linked from sys_di_extracted_value.metadata.output_table_id.'),
    ('Mapping', '_mapInvoice / _mapAdvice map the JSON to the BCFA extraction contract; _num parses numbers as printed (1,234.56 / 1.234,56 / 1 234,56 / 1,23,456.00): the last separator followed by one or two digits is the decimal mark.'),
    ('Confidence', 'The generative pipeline returns no per-field confidence, so _confidence derives one from completeness and readability: 1.0 minus 0.2 per missing critical field, plus readability penalties. Labelled "Derived". Below 0.85 the document goes to a person. Since Phase 41 the totals reconciliation is reported as a note and no longer lowers the confidence.'),
    ('Totals reconciliation (Phase 41)', 'reconcileInvoice: net + tax + charges (shipping / handling, freight, surcharge, other) - discount = gross, three readings, tolerance 1.00; the line sum is checked against net. reconcileAdvice: per invoice gross - advance - TDS - deduction = paid, and the sum of paid = payment. Result reconciled / not_reconciled / incomplete; not_reconciled goes to review.'),
    ('Multi-document PDFs (Phase 41)', 'Fields Invoice Page Numbers and Supporting Documents (type, pages, reference) are model readings shown to the reviewer; header values are read from invoice pages only (field instructions). Not a guaranteed split.'),
    ('Tax components (Phase 41)', 'Field Tax Components (printed label, rate, base, amount); the printed label is mapped to GST / CGST / SGST / IGST / VAT / SALES_TAX / WHT / TDS / OTHER_TAX for presentation. Validation stays MatchingEngine.evaluateTax.'),
    ('Normalization evidence (Phase 41)', 'For every number read with separators or symbols, the original text, the normalized value and the rule are kept (extraction_json.normalization).'),
    ('Intake controls (Phase 41)', 'No attachment: the intake stays a draft. File over 4 MB: review with "upload the invoice pages only". Same content hash as an earlier intake: duplicate_of, no new transaction. Group-company seller (x_695068_bcfa.own_company_names): review as an outgoing invoice.'),
    ('Evidence', 'The extracted value per field is kept (extraction_json, ap_extraction). Page / position evidence (bounding boxes) came back empty on this instance and is not available.'),
    ('Configuration source', 'scripts/deploy/native_extraction_config.json -> gen_native_extraction.py -> phase40_native_usecases_bg.js (scope global; the field keys and skill configs are global records).')],
    widths=[3.5, 13.5])
for uc in EXT['use_cases']:
    h(doc, '7.%d %s' % (EXT['use_cases'].index(uc) + 1, uc['name']), 2)
    table(doc, ['Contract field', 'DocIntel field', 'Description (the prompt the model reads)'], [(f[1], f[2], f[3]) for f in uc['fields']], widths=[3.2, 3.8, 10], font=7.5)
h(doc, '7.3 Measured accuracy (synthetic documents only)', 2)
table(doc, ['Run', 'Header fields', 'Line values', 'Critical fields', 'Straight-through documents'], [
    ('Run 1 (original descriptions)', '231 / 236', '346 / 346', '124 / 125', '22 / 23'),
    ('Run 2 (VAT / WHT descriptions tuned)', '231 / 236', '346 / 346', '123 / 125', '21 / 23')], widths=[5, 3, 3, 3, 3])
para(doc, '23 project-generated documents (India, Germany incl. German language, Hungary 2-page / 44 lines, US). Not measured: client documents, scans, photos, '
     'handwriting, non-Latin scripts. Details: docs/OCR_ACCURACY_REPORT.md.', italic=True)
h(doc, '7.4 Client sample pack (28 documents, Phase 41)', 2)
table(doc, ['Script of the document', 'Invoices: critical fields', 'Payment / bank advices: critical fields'], [
    ('Latin (English, Italian, Portuguese)', '60 / 71 (85 %)', '19 / 20 (95 %)'),
    ('Chinese', '5 / 32 (16 %): VAT e-invoices', '8 / 10 (80 %): bilingual bank forms'),
    ('Korean', '3 / 16 (19 %): image e-tax invoice', '-'),
    ('Thai', '4 / 8 (50 %): scanned, amounts only', '-')], widths=[5, 6, 6])
para(doc, 'Finding: the text Document Intelligence hands to the model contains no Chinese characters for the Chinese VAT e-invoices (although the PDFs have a '
     'Chinese text layer) and no Hangul / Thai for scanned or image pages; Chinese bank documents and digital Korean pages keep their script. No value is '
     'invented: unread fields stay empty and the document goes to review. Raised as a platform question (HANDOVER_TASKS.md task 4a). Details: '
     'docs/CLIENT_DOCUMENT_TEST_MATRIX.md, docs/MULTILINGUAL_DOCUMENT_INTELLIGENCE_READINESS.md.', italic=True)

# 8 ------------------------------------------------------------------------
h(doc, '8. Rules and policy')
h(doc, '8.1 Decision tables', 2)
para(doc, 'Built through the supported sn_dt Decision Table API (scripts/deploy/phase15_decision_tables_bg.js, phase40_decision_tables_bg.js). '
     'FinancePolicy.decide() evaluates them with sn_dt.DecisionTableAPI.getDecision; if a table is missing, unreadable or has no matching row the '
     'corresponding property applies and a warning is logged. Rows are evaluated first match, in order.')
table(doc, ['Table', 'Inputs', 'Outputs', 'Rows (in order)'], [
    ('BCFA AP Tolerance', 'company, country, vendor_type, invoice_type', 'quantity_tolerance_pct, price_tolerance_pct, tax_tolerance_abs, tax_tolerance_pct, total_tolerance_abs, rounding_tolerance_abs',
     'Strategic vendors: 0.05 / 0.02 / 1 / 0.02 / 1 / 0.05\nDefault: 0.02 / 0.02 / 1 / 0.02 / 1 / 0.05'),
    ('BCFA AP Tax Expectation', 'country, company, vendor_tax_category', 'tax_regime, expected_rate_pct, wht_applicable, wht_code, wht_rate_pct',
     'India + services: GST 18 %, WHT 2 %, IN-TDS-SERVICES (POC)\nIndia: GST 18 %\nGermany: VAT 19 %\nHungary: VAT 27 %\nUnited States: SALES_TAX 0 %\nAny other: UNKNOWN (manual review)'),
    ('BCFA AP Approval', 'amount, exception_type, variance_pct, company', 'approval_required, approval_group',
     'Tolerance exception with variance > 10 %: Finance Controllers\nAmount > 1,000,000: Finance Controllers\nDefault: Finance Approvers'),
    ('BCFA AR Deduction', 'deduction_type, amount, company', 'allowed, approval_required, approval_group',
     'Bank charge, rounding, TDS/TCS, withholding, credit note ≤ 5,000: allowed, no finance approver (BCFA Cash Application)\nThose above 5,000, short pay, debit note, commercial, FX difference: allowed, Finance Approvers\nDispute, unapplied, other: not allowed')],
    widths=[3.3, 3.5, 4.2, 6], font=7.5)
h(doc, '8.2 Tax validation algorithm (MatchingEngine.evaluateTax)', 2)
numbered(doc, [
    'Expectation = FinancePolicy.apTaxExpectation({country: vendor country, company, vendorTaxCategory}); regime UNKNOWN -> result MANUAL REVIEW, nothing else checked.',
    'Expected tax = net amount × expected rate; variance = printed total tax − expected tax.',
    '|variance| ≤ rounding tolerance (0.05) -> PASS; ≤ tax band (max(tax_tolerance_abs, tax_tolerance_pct × expected)) -> WITHIN TOLERANCE; else FAIL.',
    'Printed rate ≠ expected rate -> FAIL (a CGST + SGST invoice may print the component rate: half the expected rate is accepted).',
    'Printed regime label disagrees with the expected regime (GST label on a VAT country, VAT label on a GST country) -> WARNING.',
    'GST: CGST and SGST must be equal halves; IGST together with CGST/SGST -> FAIL; IGST must equal the total tax. VAT: the VAT component, when printed, must equal the total tax.',
    'Withholding: if configured, expected WHT = net × WHT rate; printed equal -> PASS, different -> FAIL, not printed -> WARNING (withheld at payment); printed but not configured -> MANUAL REVIEW.',
    'Overall result = the worst of the checks in the order PASS < WITHIN TOLERANCE < WARNING < MANUAL REVIEW < FAIL; every check is written to tax_validation_detail.'])
h(doc, '8.3 System properties', 2)
table(doc, ['Property', 'Value', 'Description'], [(short(p['name']), p['value'][:60], p['description']) for p in INV['properties']], widths=[5, 2.8, 9.2], font=7.5)

# 9 ------------------------------------------------------------------------
h(doc, '9. Orchestration')
para(doc, 'Each flow owns one hand-off. Its record trigger fires the event x_695068_bcfa.flow.stage (parm1 = stage, parm2 = flow); the Script Action "BCFA - Run '
     'Flow Stage" calls FinanceOrchestration.run(stage, record). A stage runs only if the record is in the state it expects, so a stage never runs twice. '
     'Property orchestration.mode: flow (default) or inline (domain services chain the steps synchronously; used by seeding and tests).')
FLOW_TRIGGER = {
    'BCFA AP Invoice Intake Flow': ('AP invoice created, state RECEIVED', 'ap_intake'), 'BCFA AP Validation Flow': ('AP invoice -> EXTRACTED', 'ap_validation'),
    'BCFA AP Exception Flow': ('AP exception -> resolved', 'ap_exception'), 'BCFA AP Approval Flow': ('AP invoice -> MATCHED', 'ap_approval'),
    'BCFA AP Integration Flow': ('AP invoice -> APPROVED, approval approved', 'ap_integration'), 'BCFA AP Reconciliation Flow': ('AP invoice -> UNKNOWN_OUTCOME', 'ap_reconciliation'),
    'BCFA AP Aging/Escalation Flow': ('Hourly', 'ap_aging'), 'BCFA AR Payment Intake Flow': ('Payment created, state RECEIVED', 'ar_intake'),
    'BCFA AR Remittance Processing Flow': ('Remittance created for a payment', 'ar_remittance'), 'BCFA AR Match Flow': ('Payment -> CUSTOMER_RESOLUTION with a customer', 'ar_match'),
    'BCFA AR Exception Flow': ('AR exception -> resolved', 'ar_exception'), 'BCFA AR Approval Flow': ('Payment -> PENDING_APPROVAL', 'ar_approval'),
    'BCFA AR Clearing Flow': ('Payment -> APPROVED', 'ar_clearing'), 'BCFA AR Reconciliation Flow': ('Payment -> UNKNOWN_OUTCOME', 'ar_reconciliation'),
    'BCFA AR Aging/Escalation Flow': ('Hourly', 'ar_aging')}
table(doc, ['Flow', 'Trigger', 'Stage', 'Description'], [(f['name'], FLOW_TRIGGER.get(f['name'], ('', ''))[0], FLOW_TRIGGER.get(f['name'], ('', ''))[1], f['description'])
                                                        for f in INV['flows']], widths=[4, 3.5, 2.5, 7], font=7.5)
h(doc, '9.1 Business rules', 2)
table(doc, ['Rule', 'Table', 'When', 'Operations', 'Order'], [(b['name'], short(b['table']), b['when'], ', '.join(b['ops']), b['order']) for b in INV['business_rules']],
      widths=[6, 4, 2, 3, 1.5], font=7.5)
h(doc, '9.2 Scheduled jobs', 2)
table(doc, ['Job', 'Run', 'Period', 'Active'], [(j['name'], j['run_type'], j['period'].replace('1970-01-01 ', ''), j['active']) for j in INV['jobs']
                                                  if j['run_type'] != 'once'], widths=[8, 3, 3, 2])
para(doc, 'One-time seeding and verification jobs from early phases (run type "once") have already fired and are inert.', italic=True)
h(doc, '9.3 Events and notifications', 2)
bullets(doc, INV['events'] + ['Email notifications on the exception assigned / escalated events send to the users in parm1 (owner, group, Finance Controllers at level 2).'])

# 10 -----------------------------------------------------------------------
h(doc, '10. Integration design')
para(doc, 'IntegrationService is the only component that calls an adapter. execute({operation, adapter, correlationId, idempotencyKey, externalReference, '
     'sourceTable, sourceRecord, payload, simulateOutcome}) writes one Integration Transaction per idempotency key and an integration_call audit event.')
table(doc, ['Operation', 'Payload -> response', 'Type'], [
    ('getVendor', '{vendorCode} -> {found, sysId, vendorCode, name, companyCode, currency, paymentTerms, active}', 'read'),
    ('getCustomer', '{customerCode} -> {found, sysId, customerCode, name, companyCode, currency, active}', 'read'),
    ('getPurchaseOrder (alias getPO)', '{poNumber} -> {found, sysId, poNumber, vendor, companyCode, currency, status, lines[]}', 'read'),
    ('getReceipt', '{receiptNumber} -> {found, sysId, receiptNumber, poLine, receiptType, quantity, sapDocumentId}', 'read'),
    ('getOpenItems (alias getOpenARItems)', '{customerSysId} -> {found, items[{sysId, itemNumber, currency, invoiceAmount, openAmount, dueDate, status}]}; called before every AR match', 'read'),
    ('postVendorInvoice', '{invoiceNumber, vendor, amount} -> {status, sapDocumentId MIRO…, message}', 'financial write'),
    ('clearCustomerPayment (alias clearPayment)', '{bankReference, customer, amount, processingMode} -> {status, sapDocumentId FB05… / PARK…, message}', 'financial write'),
    ('queryTransactionStatus', '{operation, idempotencyKey, externalReference} -> {outcome COMMITTED | NOT_FOUND | UNAVAILABLE, sapDocumentId?}', 'read (reconciliation)'),
    ('getCreditNotes, getExchangeRate, createReceipt, getBankStatement, archive', 'Supporting operations (mock)', 'mixed')], widths=[4.5, 10.5, 2], font=7.5)
table(doc, ['Control', 'Design'], [
    ('Adapter selection', 'Property sap.adapter: mock_sap (MockSAPAdapter) or real_sap (RealSAPAdapter: every operation returns NOT_CONFIGURED, nothing sent, a definite safe failure). checkAdapterContract verifies an adapter implements the canonical operations.'),
    ('Idempotency 1: key', 'A committed transaction for the key is replayed, never re-sent; an unresolved unknown outcome blocks any send; an escalated key blocks until a person resolves it.'),
    ('Idempotency 2: record + operation', 'A committed write of the same operation for the same source record under another key is replayed.'),
    ('Idempotency 3: business reference', 'A committed write for the same external reference on a different record is blocked as a duplicate (AP: vendor + normalised invoice number; AR: bank reference).'),
    ('Unknown outcome', 'timeout / unknown_outcome -> transaction reconciliation_state pending, record UNKNOWN_OUTCOME; reconcileUnknownOutcome -> queryTransactionStatus -> POSTED (confirmed committed) / RETRY (confirmed not committed; same transaction, attempt + 1, max 3) / INTEGRATION_EXCEPTION.'),
    ('Failure simulation', 'Integration Profile failure_mode or simulateOutcome: success, validation_error, technical_error, timeout, duplicate, delayed_response, partial_response, unknown_outcome.'),
    ('Mock document numbers', 'Derived deterministically from the idempotency key (same key -> same document); "committed?" ground truth from the key parity, no hidden state.'),
    ('Production', 'ServiceNow -> IntegrationHub / client middleware -> SAP ECC. RealSAPAdapter is the seam; no domain change needed.')], widths=[4, 13])

# 11 -----------------------------------------------------------------------
h(doc, '11. AI design (ServiceNow-native, advisory)')
table(doc, ['Element', 'Design'], [
    ('Rule', 'AI may recommend, explain or summarise. It never approves, overrides a tolerance, posts or clears.'),
    ('Where AI runs', 'Document reading (Document Intelligence on Now LLM); exception review (agentic workflows started by the exception); "Explain with Now Assist" on demand; multi-invoice match explanation. Approval, posting, clearing, reconciliation and aging are deterministic.'),
    ('Now Assist skills (9)', 'ap_invoice_summary, ap_match_exception_explanation, ap_recommended_next_action, ap_clarification_draft, cash_application_summary, ar_match_explanation, ar_residual_explanation, ar_recommended_next_action, customer_clarification_draft; called through NowAssistSkillClient (sn_one_extend).'),
    ('AI identity', 'bcfa.ai.reviewer (identity_type ai_agent) holds only processor roles and x_695068_bcfa.ai_agent; ApprovalEngine refuses any AI identity; AI tools write only the advisory note.'),
    ('Guardrails', 'Now Assist Guardian on each BCFA skill capability (prompt injection and offensiveness: BLOCK; instance runs Guardian asynchronously). FinanceAiGuard: input screening (instructions, prompt reveal, role markers, financial commands, control bypass, jailbreak) -> call not made; output sanitising (markdown removed, sentences claiming a completed financial action removed).'),
    ('Evidence', 'AI Interaction Log (capability, skill, recommendation, confidence, guardrail action, human decision, human decided by); audit ai_invocation / ai_recommendation; prompts are not stored.'),
    ('Data minimisation', 'Skills receive only the fields they need; bank accounts masked; no personal data beyond customer / vendor names.')], widths=[3.5, 13.5])
h(doc, '11.1 AI agents and tools', 2)
table(doc, ['Agent', 'Role', 'Description'], [(a['name'], a['role'], a['description'][:400]) for a in INV['ai_agents']], widths=[4.5, 4, 8.5], font=7.5)
table(doc, ['Tool', 'Type', 'Description'], [(t['name'], t['type'], t['description'][:300]) for t in INV['ai_tools']], widths=[4.5, 2.5, 10], font=7.5)

# 12 -----------------------------------------------------------------------
h(doc, '12. Exceptions, approvals and audit')
h(doc, '12.1 Exception framework', 2)
table(doc, ['Aspect', 'Design'], [
    ('Tables', 'ap_exception (APEX…) and ar_exception (AREX…) with identical framework fields; ExceptionEngine creates, resolves and sweeps both.'),
    ('Fields', 'number, process, ap_invoice / payment, reason_code, subtype, severity, priority, assigned_to, assignment_group, status, opened_at, sla_due, sla_status, aging_bucket, escalation_level, evidence, rule_result, variance / residual, ai_explanation, ai_recommendation, ai_confidence, decision, decision_reason, resolution_code, resolution_notes, resolved_by, resolved_at, correlation_id.'),
    ('Defaults', 'Group and owner from ap/ar.exception.assignment_group and default_owner; SLA hours by severity from ap/ar.exception.sla_hours; high severity when the variance / residual reaches ap.exception.high_value_variance / ar.exception.high_value_residual.'),
    ('Aging and escalation', 'Hourly AP/AR Aging/Escalation flows -> ExceptionEngine.sweepOne: aging bucket (<1d, 1–3d, 3–7d, >7d), SLA status (on track, at risk ≥ 75 %, breached), level 1 at breach (owner + group), level 2 at twice the SLA (+ Finance Controllers); priority raised per level; events assigned / escalated.'),
    ('AI', 'The agentic workflow writes the advisory note; ExceptionEngine.splitAdvice splits explanation and confidence. Never read by a rule.')], widths=[3.5, 13.5])
h(doc, '12.2 Approvals and segregation of duties', 2)
table(doc, ['Rule (ApprovalEngine.checkSegregation)', 'Control'], [
    ('An AI identity never approves or rejects', 'always'),
    ('The approver holds the process approver role (ap_approver / ar_approver, via finance_approver, or admin)', 'always'),
    ('The requester cannot approve their own request', 'sod.requester_cannot_approve (true)'),
    ('The processor (creator, or anyone who made a processor decision on one of its exceptions) cannot approve', 'sod.processor_cannot_approve (true)'),
    ('The approver is a member of the group the decision table routed to', 'sod.approver_in_group (true)')], widths=[12, 5])
para(doc, 'Each approval records requested_by, approval_group, approval_type (standard, override, rule), approver, decision, decision_notes, decided_at, '
     'override_reason, sod_check, state_before and state_after. Refusals are audited and change nothing.')
h(doc, '12.3 Audit framework', 2)
para(doc, 'AuditEngine.logEvent writes one append-only Audit Event per business event (process, source record, event type, before / after JSON, actor and '
     'actor type, AI agent, occurred_at, event_sequence in milliseconds, reason, correlation ID). The "Audit Event - Append Only" rule rejects update and '
     'delete. Event types: record_created, document_uploaded, document_extracted, field_corrected, rule_evaluated, match, exception_created / resolved / '
     'escalated, ai_invocation, ai_recommendation, human_review, approval_requested, approval_decision, override, allocation, deduction, integration_call, '
     'integration_result, reconciliation, closure, state_transition.')

# 13 -----------------------------------------------------------------------
h(doc, '13. User experience')
h(doc, '13.1 BCFA Workspace', 2)
table(doc, ['Area', 'Content'], [
    ('Home: Finance Operations', '19 KPI cards: AP invoices received / posted, AP straight-through rate, AP open exceptions, AP pending approvals, AP average exception age, AR payments received / matched, unapplied cash, AR auto-match rate, AR open exceptions, AR pending approvals, AI-assisted reviews, AI recommendation acceptance, AI overrides, low-confidence documents, integration failures, UNKNOWN_OUTCOME, pending reconciliation (FinanceKpiService, every 15 minutes)'),
    ('Accounts Payable', 'Invoice Queue, Invoice Review, Exceptions, Approvals, Integration Status, Posted Invoices'),
    ('Cash Application', 'Payments, Remittances, Open Items, Match Candidates, Allocations, Deductions, Exceptions, Approvals, Clearing Status'),
    ('Document Intake', 'New / Open intakes, processing status, extraction provider'),
    ('AI & Audit', 'AI Interaction Log, Audit Events, POC Success Scorecard'),
    ('Record pages', 'Review Summary at the top (FinanceReviewSummary: document, extraction source and confidence, PO / receipts, match and variances, tolerances and source, tax, exceptions, AI advice (advisory), approval and SoD, integration, audit); related lists incl. AI Interactions; "Open Playbook"')],
    widths=[3.5, 13.5])
h(doc, '13.2 Playbooks', 2)
table(doc, ['Playbook', 'Stages (each = Wait For Condition gate on journey_stage_order + read-only Record Lists)'], [
    ('BCFA AP Invoice Processing Playbook', '1 Invoice Intake · 2 Document Extraction (provider, tax breakdown, confidence) · 3 Validation & Enrichment (tax and withholding results, rule source) · 4 PO / GRN-SRN / 3-Way Match (match results, tolerances applied) · 5 Exception Resolution (SYSTEM / AI / HUMAN) · 6 Approval · 7 SAP Posting (MOCK SAP) · 8 Closure & Audit'),
    ('BCFA Cash Application Playbook', '1 Payment & Remittance Intake · 2 Extraction & Correlation (payment advice as extracted) · 3 Customer Resolution · 4 Open Item Retrieval · 5 Matching & Allocation · 6 Exception / Deduction Resolution (deductions with printed reason) · 7 Approval · 8 SAP Draft / Direct Processing (MOCK SAP) · 9 Closure & Audit')],
    widths=[4.5, 12.5])
para(doc, 'FinanceJourneyService derives journey_stage, journey_stage_order, journey_status, journey_blocked_reason (WHAT HAPPENED / WHY), journey_next_action, '
     'journey_owner, journey_open_exceptions and journey_banner from the authoritative state on every state change. Playbooks only display; no activity '
     'changes data. After a Playbook deploy: run phase35_playbook_yokohama_fix_bg.js and activate both in Workflow Studio.')
h(doc, '13.3 UI actions', 2)
table(doc, ['Action', 'Table', 'Condition', 'Roles'], [(u['name'], short(u['table']), u['condition'][:160], ', '.join(short(r) for r in u['roles']))
                                                       for u in INV['ui_actions']], widths=[3.8, 3.2, 6.5, 3.5], font=7.5)
h(doc, '13.4 Navigation modules', 2)
table(doc, ['Module', 'Table', 'Filter'], [(m['title'], short(m['table']), m['filter'][:120]) for m in INV['modules']], widths=[5, 5, 7], font=7.5)

# 14 -----------------------------------------------------------------------
h(doc, '14. Security')
h(doc, '14.1 Roles', 2)
table(doc, ['Role', 'Description'], [(r['name'], r['description']) for r in INV['roles']], widths=[5.5, 11.5])
para(doc, 'Role containment: ' + '; '.join('%s contains %s' % (c['role'], c['contains']) for c in INV['role_contains']) + '. Demo users: bcfa.ap.processor, '
     'bcfa.ar.processor, bcfa.finance.approver (BCFA Finance Approvers), bcfa.finance.controller (BCFA Finance Controllers and Finance Approvers); AI user '
     'bcfa.ai.reviewer.')
h(doc, '14.2 Access controls', 2)
para(doc, '%d ACLs. Summary by table and operation (full list in Appendix C).' % len(INV['acls']))
matrix = {}
for a in INV['acls']:
    key = a['name'].split('.')[0]
    matrix.setdefault(key, {}).setdefault(a['operation'], set()).update(short(r) for r in a['roles'])
table(doc, ['Object', 'read', 'write', 'create', 'delete', 'other'], [
    (short(k), ', '.join(sorted(v.get('read', []))), ', '.join(sorted(v.get('write', []))), ', '.join(sorted(v.get('create', []))), ', '.join(sorted(v.get('delete', []))),
     '; '.join('%s: %s' % (op, ', '.join(sorted(rs))) for op, rs in v.items() if op not in ('read', 'write', 'create', 'delete')))
    for k, v in sorted(matrix.items())], widths=[3.4, 3.4, 3, 2.4, 2, 2.8], font=6.5)
h(doc, '14.3 Open security items', 2)
bullets(doc, ['D6: a finance approver cannot type the decision reason on an exception (field write ACL). Workaround: the processor records the reason, the approver approves. Fix needs security_admin.',
              'Workspace route ACL bcfa.* and the list audience omit ap_approver, ar_approver and integration_operator (deferred by the instance owner).',
              'Client documents: confirm Now LLM data-processing and residency terms before real documents are loaded.'])

# 15 -----------------------------------------------------------------------
h(doc, '15. Testing and quality')
para(doc, 'Automated Test Framework: suite BCFA Regression (50 tests, run serially; last full run 50/50 on 2026-10-09). End-to-end scripts: '
     'phase35_e2e_bg.js (16 scenarios AP-A..F, AR-A..I, AR-C2; run C119F 16/16) and phase40_e2e_bg.js (11 scenarios; run 63D87 11/11). Manual tests: '
     'deliverables/BCFA_Manual_Test_Workbook.xlsx. Extraction measurement: scripts/eval.')
table(doc, ['ATF test', 'Assertions'], [(t['name'], len(t['assertions'])) for t in INV['atf_tests']], widths=[14, 3], font=7.5)

# 16 -----------------------------------------------------------------------
h(doc, '16. Deployment and operations')
table(doc, ['Topic', 'Procedure'], [
    ('Build', 'npx now-sdk build (dist/app/update XML)'),
    ('Deploy', 'python scripts/deploy/gen_phase40_deploy.py <step> -> Scripts - Background, scope global, run the generated loader. The drift guard aborts unless live script includes equal the base commit or the build. Steps: extraction, tax, tests, fixes, playbooks, remaining; Phase 41: phase41, phase41_fix1 (ACL roles), phase41_fix2 (intake numbers), phase41_fix3 (normalization evidence). A script include deployed from a working copy gets a baseline (scripts/deploy/baseline_from_loader.py) for the next guard.'),
    ('Decision tables', 'phase15_decision_tables_bg.js, phase40_decision_tables_bg.js (scope x_695068_bcfa), idempotent'),
    ('Extraction use cases', 'gen_native_extraction.py -> phase40_native_usecases_bg.js (scope global), idempotent; writes only changed values'),
    ('Playbooks', 'gen_playbooks.py; deploy step playbooks; phase35_playbook_yokohama_fix_bg.js; activate both in Workflow Studio'),
    ('Source control', 'Git master (Fluent source of truth); Studio branch sn_instances/pwcmanagementservicesdemo01 via Studio Commit Changes with "Include changes not tracked…". Never use Apply Remote Changes unless the Studio branch was last written by this instance.'),
    ('Demo data', 'Reset: DemoDataSeeder.resetAndReseed("RESET BCFA DEMO DATA") via phase28_reset_and_reseed_bg.js. Live demo run: gen_phase40_demo_journeys.py <suffix> -> phase40_demo_prep_<suffix>_bg.js'),
    ('Monitoring', 'Workspace KPIs (integration failures, UNKNOWN_OUTCOME, pending reconciliation, open exceptions); Flow Designer executions; syslog "BCFA flow stage … failed"; BCFA - Native Extraction Poller log lines; AI Interaction Log'),
    ('Global-scope records', 'DocIntel field keys and skill configs are global: recreate them with phase40_native_usecases_bg.js when moving the app')], widths=[3.5, 13.5])

# 17 -----------------------------------------------------------------------
h(doc, '17. Limitations, risks and open items')
table(doc, ['Item', 'Impact', 'Next step'], [
    ('Chinese VAT e-invoices, scanned Korean / Thai not read (platform reading step)', 'These client documents go to manual review', 'ServiceNow case (HANDOVER_TASKS.md 4a); no external OCR in BCFA'),
    ('Handwritten PO / GRN / service entry numbers', 'Not read or misread on scans (CS-01, CS-02, CS-06)', 'Reviewer enters them; ask suppliers to print references'),
    ('Bank acceptance drafts (China)', 'No draft / notes-receivable model', 'Scope decision (HANDOVER_TASKS.md 4b)'),
    ('Files over 4 MB', 'Not sent to extraction', 'Upload the invoice pages only'),
    ('No per-field confidence; no position evidence from the generative pipeline', 'Confidence is derived; evidence is value text only', 'Track platform releases'),
    ('Generative extraction varies between runs', 'Single read can differ', 'Keep arithmetic checks, derived confidence and human review'),
    ('MOCK SAP only (Mode 1)', 'No real posting / clearing evidence', 'Mode 2: RealSAPAdapter, connectivity, SAP test system'),
    ('POC tax and tolerance values', 'Not client policy', 'Client tax / finance decisions; SAP tax codes'),
    ('Exceptions are not task-based tables', 'No native task SLA / inbox', 'Remodel on task for production'),
    ('Workspace route ACL', 'Approver usability', 'security_admin decision')], widths=[5.5, 5.5, 6])

# Appendices ---------------------------------------------------------------
page_break(doc)
h(doc, 'Appendix A. Field catalogue')
for t in INV['tables']:
    h(doc, '%s (%s)' % (t['label'], t['name']), 3)
    rows = []
    for f in t['fields']:
        extra = f['reference'] and ('-> ' + short(f['reference'])) or ''
        ch = choices(t['name'], f['name'])
        if ch:
            extra = 'choices: ' + ', '.join(c['value'] for c in ch)[:300]
        rows.append((f['name'], f['label'], f['type'] + (' (%s)' % f['max_length'] if f['max_length'] else ''),
                     ('M' if f['mandatory'] else '') + ('R' if f['read_only'] else ''), extra, f['hint'][:300]))
    table(doc, ['Field', 'Label', 'Type', 'M/R', 'Reference / choices', 'Hint'], rows, widths=[3, 3, 2.2, 0.9, 4, 3.9], font=6.5)
h(doc, 'Appendix B. Choice lists')
table(doc, ['Table.field', 'Values (value: label)'], [(short(k), '; '.join('%s: %s' % (c['value'], c['label']) for c in v)) for k, v in sorted(INV['choices'].items())],
      widths=[5, 12], font=6.5)
h(doc, 'Appendix C. ACLs')
table(doc, ['ACL', 'Operation', 'Roles'], [(short(a['name']), a['operation'], ', '.join(short(r) for r in a['roles'])) for a in INV['acls']], widths=[6, 2.5, 8.5], font=6.5)
h(doc, 'Appendix D. Script include method catalogue')
for s in INV['script_includes']:
    h(doc, '%s (%d lines)' % (s['name'], s['loc']), 3)
    para(doc, s['description'] or s['header'], size=8.5)
    if s['methods']:
        table(doc, ['Method', 'Arguments', 'Purpose (source comment)'], [(m['name'], m['args'], m['comment'][:400]) for m in s['methods']],
              widths=[4.2, 4, 8.8], font=6.5)
h(doc, 'Appendix E. ATF assertions')
for t in INV['atf_tests']:
    if t['assertions']:
        h(doc, t['name'], 3)
        bullets(doc, t['assertions'])
h(doc, 'Appendix F. Glossary')
table(doc, ['Term', 'Meaning'], [
    ('3-way match', 'Invoice line vs PO line vs goods / service receipt'), ('GRN / SRN', 'Goods / service receipt note'), ('MIRO', 'SAP invoice posting (mock document prefix)'),
    ('FB05', 'SAP payment clearing (mock document prefix)'), ('PARK', 'SAP parked document (DRAFT mode)'), ('TDS / TCS', 'Indian tax deducted / collected at source'),
    ('WHT', 'Withholding tax'), ('UTR', 'Unique transaction reference of a bank payment'), ('SoD', 'Segregation of duties'),
    ('UNKNOWN_OUTCOME', 'SAP did not confirm a write; reconciled by a status query'), ('Now LLM', 'ServiceNow-hosted large language model service'),
    ('DocIntel', 'ServiceNow Document Intelligence'), ('Playbook', 'Process Automation Designer journey view')], widths=[4, 13])

os.makedirs(os.path.dirname(OUT), exist_ok=True)
doc.save(OUT)
print('written', OUT)
