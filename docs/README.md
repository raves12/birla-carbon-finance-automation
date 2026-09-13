# Birla Carbon Finance Automation

ServiceNow scoped application (`x_695068_bcfa`) built with the Fluent SDK, implementing the
Accounts Payable PO/SO invoice processing and Accounts Receivable Cash Application flows described
in `Birla_Carbon_ServiceNow_Process_Feasibility_Blueprint.xlsx`, translated into a ServiceNow
orchestration/exception/approval/audit layer that treats SAP ECC as the untouched financial
system of record. See `docs/DISCOVERY.md` for what was verified about this PDI before building
anything, and `docs/ARCHITECTURE.md` for the target design.

## Scope

Current build scope (per `docs/DISCOVERY.md` and the workbook's own `D-01` decision):

- `AP-01..11` — PO/SO invoice processing (intake → extraction → validation → match → exception →
  approval → post → reconcile → archive)
- `CA-01..17` — Cash Application (remittance/bank intake → match → allocation → exception →
  approval → clear → reconcile → archive)

Out of scope for this build (documented, not implemented): O2C (`O2C-01..10`), Non-PO invoicing
(`NPO-01..05`), and the AR/AP site edge cases (`AR-E01..03`, `AP-E01..08`) — see the workbook's
Process Inventory sheet.

## Project layout

Adapted from the Fluent SDK's actual conventions (verified against the installed SDK's bundled
docs, `node_modules/@servicenow/sdk/docs/`) rather than a generic folder scheme:

```
src/
  fluent/                  Metadata-defining *.now.ts files (compiled by now-sdk build)
    tables/                Table() definitions — AP, AR, shared domain model
    security/              Role(), ACL() definitions
    state-models/          StateModel() — AP Invoice and Cash Application lifecycles
    script-includes/       ScriptInclude() wrappers (each points at src/server/script-includes/*.server.js)
    flows/ap/, flows/ar/    Flow()/Subflow()/Action() definitions (exception-aging escalation)
    business-rules/        BusinessRule() definitions — the actual state-machine cascade wiring
    tests/                 ATF Test() definitions (Stage 11/18) — deployed but not runnable via
                            atf_test_run in this PDI (see docs/BUILD_REPORT.md); the same checks
                            were executed via the one-time jobs below instead
    jobs/                  ScheduledScript() one-time jobs: demo data seeding and the correctness
                            verification that atf_test_run couldn't run directly
  server/
    script-includes/       *.server.js — classic Class.create() logic bodies for each ScriptInclude,
                            plus the business-rule cascade scripts (via Now.include, legacy style)
docs/                      This documentation set
```

## Documents in this folder

| Document | Purpose |
|---|---|
| `DISCOVERY.md` | Stage 0 — verified PDI/SDK capabilities, gaps, fallbacks |
| `ARTIFACT_STRATEGY.md` | Stage 0 — which tool builds which artifact, and why |
| `ARCHITECTURE.md` | Stage 1 — target logical architecture |
| `DATA_MODEL.md` | Stage 3 — table/field definitions |
| `INTEGRATION_CONTRACTS.md` | Canonical SAP/bank operation payload contracts |
| `BUSINESS_RULES.md` | Decision tables and deterministic rule definitions |
| `TEST_PLAN.md` | ATF/security/idempotency test coverage |
| `OPEN_SAP_GAPS.md` | FB05/ML81N/PGI and other unresolved SAP interface questions |
| `BUILD_REPORT.md` | Final acceptance report (written at project completion) |

## Non-negotiable principles

See the project brief for the full list; the two that shape every design decision here:

1. SAP ECC is the untouched financial system of record — ServiceNow never recreates SAP accounting
   logic, and every SAP operation is a business-level canonical operation behind an adapter.
2. AI (simulated in this POC — see DISCOVERY.md) is advisory only. Deterministic rules and human
   approval gate every financial write; nothing an AI/simulated-AI component produces can reach an
   authoritative field or trigger a posting/clearing call directly.
