# AUTOMATED_FLOWS.md — Birla Carbon Finance Automation

Phase 25. Deploy: `scripts/deploy/phase25_flows_bg.js` (scope global). Verify: `phase25_verify_bg.js`, then
`phase25_verify2_bg.js` (scope x_695068_bcfa).

The AP and AR pipelines are now driven by **15 Flow Designer flows**, one per hand-off. Before Phase 25, a single
synchronous call (`intakeAndAutoProcess`) ran intake through matching, and business rules cascaded approval into posting
or clearing. Now each step is a separate, visible flow run (Flow Designer → Executions, `sys_flow_context`), so an
operator can see where a document is, which flow moved it and what happened.

## How a flow runs a step

```
record change (state) ──► BCFA flow (record trigger, background)
                              │ action.core.fireEvent  x_695068_bcfa.flow.stage  parm1 = stage, parm2 = flow
                              │ action.core.log
                              ▼
                     Script Action "BCFA - Run Flow Stage"
                              │ new FinanceOrchestration().run(event.parm1, current)
                              ▼
                     ApDomainService / ArDomainService step (unchanged logic)
                              │ _setState(next state)  ──► next flow's trigger
```

- **The flows hold no business logic.** They decide *when* a step runs; the existing, tested domain services decide
  *what* it does. There are no custom script steps; see `docs/ARTIFACT_STRATEGY.md` (Phase 25) for why.
- **Every stage is guarded by the record's state.** A stage runs only when the record is still in the state it expects;
  otherwise it is skipped. So a stage never runs twice, and a flow that fires after the record has moved on does nothing.
  An unknown stage name is rejected.
- **Stage failures** are written to the system log (`BCFA flow stage … failed`), and the Script Action logs the flow name.
  Every step that runs writes its audit events as before (`docs/AUDIT_FRAMEWORK.md`).

## The flows

| Flow | Trigger | Stage (FinanceOrchestration) | What it does |
|---|---|---|---|
| **BCFA AP Invoice Intake Flow** | AP invoice created, state RECEIVED | `ap_intake` | Extraction (AI extraction point; simulated Document Intelligence), or the extraction already recorded from an uploaded document → EXTRACTED |
| **BCFA AP Validation Flow** | AP invoice → EXTRACTED | `ap_validation` | Field, vendor, PO and confidence validation; duplicate check; 3-way match with tolerances → MATCHED or an exception |
| **BCFA AP Exception Flow** | AP exception → resolved | `ap_exception` | After Resolve & Retry: re-validate and re-match the invoice |
| **BCFA AP Approval Flow** | AP invoice → MATCHED | `ap_approval` | Approval rule from the BCFA AP Approval decision table: approval requested (group, segregation of duties) or approved by rule |
| **BCFA AP Integration Flow** | AP invoice → APPROVED with approval approved | `ap_integration` | SAP posting (mock) through IntegrationService: idempotency, unknown-outcome control |
| **BCFA AP Reconciliation Flow** | AP invoice → UNKNOWN_OUTCOME | `ap_reconciliation` | Status query and reconciliation, never a blind retry |
| **BCFA AP Aging/Escalation Flow** | Hourly | `ap_aging` (per open exception) | Age, SLA status (at risk / breached), escalation level 1 (owner and group) and 2 (Finance Controllers) |
| **BCFA AR Payment Intake Flow** | Payment created, state RECEIVED | `ar_intake` | Normalization, customer identification (alias at the auto-match confidence, or the owner of the remittance invoices) |
| **BCFA AR Remittance Processing Flow** | Remittance created for a payment | `ar_remittance` | For a payment stuck on matching (unmatched / ambiguous): resolve that exception and retry matching with the remittance |
| **BCFA AR Match Flow** | Payment → CUSTOMER_RESOLUTION with a customer | `ar_match` | Remittance, exact, combination and multi-invoice matching, then allocation; multi-invoice gets the Now Assist match explanation (AI point) |
| **BCFA AR Exception Flow** | AR exception → resolved | `ar_exception` | After Resolve & Retry: re-match and re-allocate |
| **BCFA AR Approval Flow** | Payment → PENDING_APPROVAL | `ar_approval` | Approval rule: approval requested or approved by rule |
| **BCFA AR Clearing Flow** | Payment → APPROVED | `ar_clearing` | SAP clearing (mock) through IntegrationService; cleared open items settled |
| **BCFA AR Reconciliation Flow** | Payment → UNKNOWN_OUTCOME | `ar_reconciliation` | Status query and reconciliation |
| **BCFA AR Aging/Escalation Flow** | Hourly | `ar_aging` (per open exception) | As for AP |

Flows run as system and in the background, so the user who saved the record is not kept waiting.

## Where AI runs, and where it does not

AI runs only at its appointed points:

- extraction (AP intake)
- the Now Assist exception review, which starts from its own agentic workflow trigger when an exception is created
- the multi-invoice match explanation (AR match)

**Approval, posting, clearing, reconciliation and aging are deterministic.** No flow lets AI approve, override a
tolerance, post or clear. A person decides every approval request; the flow then posts or clears.

## Orchestration mode

Property `x_695068_bcfa.orchestration.mode`:

| Value | Behaviour |
|---|---|
| `flow` (default) | Domain services do one step and return; the flows continue. `intakeAndAutoProcess` returns `stoppedAt: 'RECEIVED'`, and Resolve & Retry returns once the exception is resolved |
| `inline` | The domain services chain the steps synchronously as before Phase 25; the approval cascade business rules post or clear on approval |

Demo seeding (`DemoDataSeeder.seedAll` and the scenario seeders) always runs inline, through
`FinanceOrchestration.runInline(fn)`, so the seeded scenarios land in their documented end states in one call.

## Replaced

- The Phase 12 log-only aging flows are replaced, with the same sys_ids, by the AP and AR Aging/Escalation Flows. Their
  old steps are removed on deploy.
- The Phase 16 scheduled job **BCFA - Exception SLA and Escalation Sweep** is inactive; the aging flows run the same
  ExceptionEngine logic per exception (`ExceptionEngine.sweepOne`).

## Deploy notes

- Loading the flows from update XML leaves them as drafts. The deploy postamble publishes each one with
  `sn_fd.FlowAPI.publish` (the call the platform itself uses) under the BCFA application.
- The postamble also saves the Script Action once with business rules on, and toggles the retired sweep job so its
  scheduler trigger is removed.
