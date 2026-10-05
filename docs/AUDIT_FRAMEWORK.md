# AUDIT_FRAMEWORK.md — Birla Carbon Finance Automation

Phase 19. Verified live on 2026-09-28 (`scripts/deploy/phase19_verify_bg.js`, `phase19_verify2_bg.js`).

Every business event in BCFA is written as one **Audit Event** (`x_695068_bcfa_audit_event`) by
`AuditEngine.logEvent` (`src/server/script-includes/AuditEngine.server.js`). The Audit Events of a
transaction, together with its Integration Transactions, form its evidence chain.

## What each Audit Event captures

| Requirement | Field | How it is filled |
|---|---|---|
| Process | `process` | AP, AR, Document Intake, Integration or Platform, derived from the source table (`AuditEngine.PROCESS_BY_TABLE`) |
| Record | `source_table`, `source_record` | The record the event is about (invoice, payment, exception, approval, intake…) |
| Event | `event_type` | The event vocabulary below |
| Before / after | `before_value`, `after_value` | JSON: states, field values, rule results, variances, allocations, transaction outcomes |
| User | `actor`, `actor_type` | The person who acted, or else the session user who started the work. `actor_type` is user, system, or an AI type |
| AI agent | `ai_agent` | The agent, skill or agentic workflow involved (for example *BCFA Cash Application Review (agentic workflow)*, *Now Assist skill: explain AR match*) |
| Timestamp | `occurred_at`, `event_sequence` | `event_sequence` is epoch milliseconds plus a counter: sort by it to read a chain in exact order (`occurred_at` only resolves to the second) |
| Reason | `reason` | The stated human reason, the rule outcome, or the failure cause |
| Correlation ID | `correlation_id` | Shared by every event of one transaction: intake, exceptions, approvals, integration calls |

## Event vocabulary

| Event | Written when | Where |
|---|---|---|
| `record_created` | AP invoice, payment or remittance created; intake created a transaction | Ap/ArDomainService intake, FinanceDocumentIntakeService |
| `document_uploaded` | Processing first sees a document (file name, type, size, hash, uploader) | FinanceDocumentIntakeService |
| `document_extracted` | Fields extracted (simulated Document Intelligence; legacy Claude) | AISimulationService, intake, EXTRACTED transition |
| `field_corrected` | A business field changes after intake (old and new values) | *Audit Field Corrections* rules on AP Invoice, AP Invoice Line, Payment, Remittance, Finance Intake (document type) |
| `rule_evaluated` | Validation, normalization, customer identification, approval rule (decision table), duplicate intake | Domain services |
| `match` | 3-way match result with variances and applied tolerances; AR remittance / exact / combination / partial / ambiguous / currency | Domain services |
| `exception_created` / `exception_resolved` / `exception_escalated` | Exception lifecycle, with rule result, SLA and escalation level | ExceptionEngine |
| `ai_invocation` | An AI workflow or Now Assist skill is invoked | Domain services (workflow hand-off), FinanceAgentTools |
| `ai_recommendation` | An advisory AI note is recorded | FinanceAgentTools, domain services |
| `human_review` | A person decides an exception (hold, reject, request correction/clarification) or releases a reviewed intake | Ap/ArExceptionDecisionService, intake |
| `approval_requested` / `approval_decision` | Approval created (type, group, requester); decided or refused by segregation of duties (with the checks) | ApprovalEngine |
| `override` | AP override approval decision; AR manager override of an allocation imbalance | ApExceptionDecisionService, ArDomainService |
| `allocation` | Allocation balances, fails to balance, or has nothing to allocate | ArDomainService |
| `deduction` | A person approves a deduction; the allocation balances after deductions | ArExceptionDecisionService, ArDomainService |
| `integration_call` | Every call through IntegrationService (request hash, key, reference → status, document, error), every replay and every blocked send | IntegrationService |
| `integration_result` | The SAP / mock outcome applied to the invoice or payment (POSTED, CLEARED, FAILED, UNKNOWN_OUTCOME) | Domain services |
| `reconciliation` | Unknown-outcome reconciliation (POSTED / RETRY / INTEGRATION_EXCEPTION); reconcile-and-archive | IntegrationService, domain services |
| `closure` | Invoice or payment closed; open items and credit notes settled | Domain services |
| `state_transition` | Any other lifecycle step (e.g. MATCHING, POSTING) | Domain services |

`human_decision` is kept as a legacy value for events written before Phase 19.

Lifecycle transitions whose target state is itself a business event are classified automatically
(`AuditEngine.EVENT_BY_STATE`: EXTRACTED, VALIDATED, NORMALIZED, MATCHED, PARTIALLY_MATCHED, UNMATCHED, POSTED,
CLEARED, UNKNOWN_OUTCOME, FAILED, RECONCILED, CLOSED). Call sites can override this with an explicit event and reason.

## Integrity

- **Append-only.** The *Audit Event - Append Only* business rule rejects every update and delete (verified:
  both refused). There is no write ACL for business roles. Read access: auditor, read-only, finance
  reviewer and admin.
- **Never blocks the business transaction.** `logEvent` catches its own failures, logs them and returns `''`.
- **Backfill.** Events written before Phase 19 were backfilled with `process` (from the source table) and
  `event_sequence` (from the creation time). This ran as a one-time maintenance script using
  `setWorkflow(false)`. That route is available to administrators only.

## Viewing the chain

- The AP Invoice and Payment forms' **Audit Events** related list shows the record's own events and every
  event sharing its correlation ID (intake, exceptions, approvals, integration).
- In the BCFA Workspace, the Audit Event list shows occurred at, process, event, actor, actor type,
  AI agent, description, reason and correlation ID.

## Verification (live)

- **AP journey.** Record created → extraction → validation (rule, with reason) → 3-way match (variances,
  tolerances) → approval rule (decision table) → approval requested → approval (SoD checks) →
  integration call (MIRO document) → SAP result → reconciliation → closure. 18 events.
- **AP exception.** Validation failure → exception created (rule result) → AI invocation (agentic workflow)
  → human review (hold, reason) → field corrected (vendor, invoice date, old and new values). A second
  case covers escalation to level 1 and resolution (SLA met).
- **AR journey.** Combination match → allocation (2 items) → Now Assist explanation (ai_agent recorded) →
  approval → clearing → settlement and closure.
- **AR short pay.** Partial match → allocation failure → exception → deduction approved by a person →
  balanced after deduction → approval requested. Payment bank account corrected (`field_corrected`).
  Manager override of a short pay (`override`).
- **Integration.** A timeout, then reconciliation to RETRY, is recorded as a call, a status query and a
  reconciliation.
- **Document intake.** Upload (file name, hash) → extraction without values → manual review → document type
  corrected → human review.
- **Integrity.** An update and a delete of an Audit Event were refused. No event lacks process, record,
  user or timestamp. Every event type is present in the table.
