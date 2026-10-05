# ARCHITECTURE.md — Birla Carbon Finance Automation

> **Phase 40 update (2026-10-05).** Layer 3 (Document Intelligence) is native: `DocumentExtractionService` selects ServiceNow Document Intelligence on Now LLM by default; the simulated script include is for test fixtures only. SAP calls use the adapter named in `x_695068_bcfa.sap.adapter` (`SAP_POC_MODES.md`).

Target logical architecture for the POC, derived from the workbook's own 11-layer Architecture
Blueprint sheet and constrained by the verified capabilities/gaps in `DISCOVERY.md` and
`ARTIFACT_STRATEGY.md`. Scope: AP PO/SO invoice processing (`AP-01..11`) and Cash Application
(`CA-01..17`) only. O2C, Non-PO and site edge cases are documented as future scope, not built.

## 1. Logical architecture

```
                              SERVICE NOW PDI  (scope: x_695068_bcfa)

   ┌─────────────────────────────────────────────────────────────────────┐
   │                         USER EXPERIENCE                             │
   │                                                                     │
   │  AP Workspace   Cash Application Workspace   Exception Queue        │
   │  Finance Operations Dashboard                                       │
   │  (Configurable Workspace / UI Builder — see ARTIFACT_STRATEGY)      │
   └───────────────────────────────┬─────────────────────────────────────┘
                                    │
   ┌───────────────────────────────▼─────────────────────────────────────┐
   │                    BIRLA CARBON FINANCE APP                         │
   │                                                                     │
   │  AP Domain            (Script Includes + tables, ap/)               │
   │  AR Domain            (Script Includes + tables, ar/)               │
   │  Matching Engine      (matching/)                                   │
   │  Exception Engine     (exceptions/)                                 │
   │  Approval Engine      (approvals/)                                  │
   │  Audit Engine         (audit/)                                      │
   │  Integration Service  (integration/)                                │
   │                                                                     │
   │  Orchestration: Flow Designer flows/subflows, authored in Fluent    │
   │  (Flow()/Subflow()/Action()) — these own branching/state transitions;│
   │  Script Includes own deterministic calculation logic (tolerances,   │
   │  matching, mock adapter calls), invoked from flow steps.            │
   └───────────────────────────────┬─────────────────────────────────────┘
                                    │
   ┌───────────────────────────────▼─────────────────────────────────────┐
   │                  CANONICAL INTEGRATION LAYER                        │
   │                                                                     │
   │  Business-level operations (getVendor, postVendorInvoice, ...)      │
   │  Correlation ID + Idempotency Key on every call                     │
   │  Retry policy: never blind-retry a write on timeout (Section 11)    │
   │  Response normalization into Integration Transaction records        │
   └───────────────────────────────┬─────────────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                        ▼                       ▼
                MOCK SAP ADAPTER        MOCK BANK ADAPTER
                        │                       │
                        └───────────┬───────────┘
                                    │
                     MOCK ARCHIVE ADAPTER (audit/evidence sink)
                                    │
                          ── FUTURE CPI BOUNDARY ──
                                    │
                              SAP ECC (not present
                              in this PDI — no RFC
                              spoke/CPI installed)
```

**Production target** (documented, not built in this POC):
`ServiceNow → IntegrationHub → SAP CPI / Integration Suite → SAP ECC`.
The POC does not depend on CPI — DISCOVERY.md confirms no SAP RFC Spoke or CPI connection exists
in this PDI, so this is a hard constraint, not a design preference. The Canonical Integration
Layer is exactly the seam where a real `SAPAdapter` (calling IntegrationHub actions against CPI)
would later replace `MockSAPAdapter` without touching AP/AR/Matching/Exception/Approval/Audit
domain logic.

## 2. Workbook layer → build component mapping

| # | Workbook layer | Concrete component in this build | Authoring path (per ARTIFACT_STRATEGY) |
|---|---|---|---|
| 1 | Intake / Channels | AP Invoice / Payment / Remittance intake records with source evidence + correlation ID, created from simulated inbound documents (no real mailbox/SFTP wiring in POC) | Fluent (tables) + Script Includes (intake normalization) |
| 2 | Process / Data Layer | Custom App Engine tables: AP Invoice(+Line), Payment, Remittance, Payment Allocation, Match Candidate, Deduction, AP/AR Exception, AP/AR Approval, Integration Transaction, Finance Exception, Decision Log, Reference Mapping, Customer Alias, Audit Event, Integration Profile | Fluent |
| 3 | Document Intelligence | Simulated extraction Script Include (Document Intelligence not licensed — DISCOVERY.md) | Fluent (Script Include), explicitly labeled simulated |
| 4 | Rules / Decisions | Decision Tables for tolerances/thresholds/routing; deterministic calculation Script Includes for anything Decision Tables can't express cleanly | Decision Table Builder (native UI) + Fluent (Script Includes) |
| 5 | Agentic AI | Simulated advisory Script Include (candidate ranking, exception summaries); output stored in a distinct field/table, never authoritative | Fluent (Script Include), explicitly labeled simulated |
| 6 | Workflow Orchestration | Flow Designer flows/subflows (Fluent-authored) wrapping Script Include calculation calls; `StateModel()` drives the AP/AR lifecycle state fields with gated transitions | Fluent (`Flow()`, `Subflow()`, `Action()`, `StateModel()`) |
| 7 | Human-in-the-loop UX | AP/AR reviewer workspaces, exception workbench, approval screens | UI Builder / Configurable Workspace |
| 8 | SAP Integration | `FinanceAdapter` interface; `MockSAPAdapter`, `MockBankAdapter`, `MockArchiveAdapter` | Fluent (pure Script Includes) |
| 9 | Audit / Control | `Audit Event` table + correlation ID threaded through every domain record and integration transaction | Fluent |
| 10 | Observability / Ops | Integration Transaction status dashboard, exception aging, STP/match-rate reporting | UI Builder / native reporting (Stage 9/13) |
| 11 | Security | Roles, ACLs, segregation-of-duties enforcement (processor ≠ approver) | Fluent |

## 3. Domain responsibilities

- **AP Domain** — owns the AP Invoice lifecycle, modeled as a `StateModel()` on the AP Invoice table (`RECEIVED` → ... → `CLOSED`/`FAILED`/`UNKNOWN_OUTCOME`, per Section 7 of the build spec), with gated transitions (scripted conditions calling Script Includes for validation/tolerance checks) and Flow Designer subflows driving the transitions themselves. No SAP calls of its own; delegates all external calls to the Integration Service.
- **AR Domain** — owns the Cash Application lifecycle as a `StateModel()` on the Payment table (`RECEIVED` → ... → `CLOSED`/`FAILED`/`UNKNOWN_OUTCOME`, per Section 8). Same integration boundary rule.
- **Matching Engine** — pure functions: 3-way match (AP) and exact/fuzzy/multi-invoice match (AR). Takes normalized inputs, returns match result + evidence; never mutates domain records directly — callers apply the result.
- **Exception Engine** — creates/updates `Finance Exception`/`AP Exception`/`AR Exception` records with a structured reason-code taxonomy (never free-text-only), routes by site/company code, tracks SLA/aging.
- **Approval Engine** — enforces posting/clearing eligibility gates and segregation of duties (a processor cannot approve their own transaction; an approver cannot modify source data after approval — enforced at the ACL/business-rule layer, not just UI).
- **Audit Engine** — appends `Audit Event` records for every material action (state transition, approval decision, integration call) keyed by correlation ID; read-only to everyone except the system.
- **Integration Service** — the only domain allowed to call adapters. Owns correlation ID generation, idempotency key derivation, retry policy, and Unknown Outcome Control (Section 11): a timeout on a financial write never triggers a blind retry — it moves the transaction to `UNKNOWN_OUTCOME` and requires a status query before any further action.

## 4. AI / control boundary (non-negotiable, restated for this architecture)

Simulated Document Intelligence and simulated Agentic AI both write only to advisory fields
(e.g., `ai_recommendation`, `extraction_confidence`) on `Integration Transaction`/`Decision Log`-
adjacent records. Deterministic Decision Tables and Script Include calculations are the only
things allowed to set authoritative fields (match result, tolerance pass/fail, posting
eligibility). No code path exists (or will exist) that lets a simulated-AI output directly set an
approval state or trigger a posting call — every posting/clearing call is gated by the Approval
Engine, which only reads deterministic fields.

## 5. Open architecture items carried from the workbook

These do not block this POC (which never calls real SAP) but are recorded here so a future
real-SAP integration inherits them rather than rediscovering them. Full detail lands in
`OPEN_SAP_GAPS.md` in a later stage:

- **FB05** (cash clearing) — proposal contradicts itself on BAPI/API availability; the canonical
  `CLEAR_PAYMENT` contract in this build is written to be agnostic to whether the eventual real
  implementation is a BAPI/API call or an RFC/batch-input call.
- **ML81N** (service entry / SRN) — no confirmed interface; `createReceipt()` in the canonical
  contract is written generically enough to not assume a specific SAP mechanism.
- **PGI** (post goods issue) — out of scope for this POC (O2C is future scope), but the mapping
  question (`VL03N` vs. actual function) is preserved as a note for when O2C is built.

## 6. Deviations from a literal reading of the original target diagram

- "Mock Archive Adapter" is added to the original two-adapter diagram (SAP, Bank) because the
  build spec's Stage 7 explicitly lists a `MockArchiveAdapter` — included here for consistency.
- No other deviations remain. An earlier draft of this document assumed Flow Designer flows would
  have to be manually built in Workflow Studio (Fluent flow-authoring appeared unconfirmed at the
  time); that was wrong and has been corrected (see ARTIFACT_STRATEGY.md's correction log) after
  finding a complete, documented `Flow()`/`Subflow()`/`Action()`/`StateModel()` surface bundled
  with the installed SDK. Orchestration is now built the way the original diagram implies: real
  Flow Designer flows, authored in code.
