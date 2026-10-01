# FINAL_POC_READINESS_AUDIT.md

**Audit date.** 2026-10-01 (Phase 35). Instance `pwcmanagementservicesdemo01` (Yokohama patch 13). Scope `x_695068_bcfa`. Branch `feature/bcfa-native-ai-completion`.

**Method.**

- Source review of the repository.
- Read-only instance checks over MCP.
- Short read-only background scripts.
- ATF runs, one test at a time.

**Rules.** Nothing below is claimed without evidence. Where a check waits on the Phase 35 deploy, it says so.

Classification: **AVAILABLE**, **CONFIGURATION REQUIRED**, **LICENSE REQUIRED**, **NOT AVAILABLE**, **SIMULATED**, **MOCK**.

## 1. Authoritative current state (Phase 1)

| Area | Finding | Evidence |
|---|---|---|
| Release | Yokohama patch 13 | instance |
| Application | 31 tables, 11 business rules before this phase (+4 journey rules in Phase 35), 19 UI actions (+3), 29 script includes (+1) | build output, `sys_db_object` / `sys_script` / `sys_ui_action` |
| Flows | 15 BCFA flows published and active; 2 AI trigger flows ("AP Exception - Use case: BCFA AP Invoice Review", "AR Exception - Use case: BCFA Cash Application Review") published; **1 stale inactive draft** duplicate "AR Exception - Use case: BCFA Cash Application Review - 6ad14356…" (harmless; delete via Workflow Studio when convenient) | `sys_hub_flow` |
| ACLs | over 100 app ACLs (table, field, AI agent / skill execute, `bcfa.*` route) | `sys_security_acl` |
| Source vs instance drift | none: the seven script includes changed in Phase 35 match the Phase 34 source on the instance (hash check 2026-10-01) | BCFA_DRIFT run |
| External AI | removed (Phase 34); native Now Assist only | `EXTERNAL_AI_REMOVAL.md` |

## 2. AP architecture (Phase 2)

- Intake → simulated extraction → validation (vendor, PO, currency, duplicate, tax) → deterministic 3-way match with tolerances → exception framework → ApprovalEngine with SoD → IntegrationService (idempotency, Unknown Outcome Control) → MockSAPAdapter → reconciliation → closure.
- Flows orchestrate (`AUTOMATED_FLOWS.md`).
- **Status: AVAILABLE**, verified live in Phases 12, 25 and 33 (`POC1_AP_JOURNEY.md`).

## 3. AR architecture (Phase 3)

- Bank line → normalisation → customer identification (exact, confirmed alias ≥ 0.95, or remittance invoice owner) → exact / combination / multi-invoice matching → allocation (allocated − deductions = payment ± 0.01) → deductions by decision table → approval → clearing → reconciliation.
- **Status: AVAILABLE** (`POC2_CASH_JOURNEY.md`).
- **New in Phase 35:** SAP Draft/Direct.

## 4. Document extraction (Phase 4)

- **SIMULATED**, labelled **SIMULATED DOCUMENT EXTRACTION — POC**.
- Native Document Intelligence use cases exist but return no values (Classic, untrained; generative not offered).
- **LICENSE REQUIRED / CONFIGURATION REQUIRED**: `DOCUMENT_AI_ACTIVATION_CHECKLIST.md`.

## 5. Native AI (Phase 5)

- **Native AI.** Now Assist skills and AI agents / agentic workflows: AP Invoice Review, Cash Application Review, explanation and draft skills. Their execute ACLs are on the instance.
- **Advisory only.** AI fields are advisory, the BCFA guard screens input and output, and AI identities are refused by every decision service.
- **Negative tests.** The Phase 29 AI guardrail and identity tests are in ATF.
- **Open item.** Skill Kit prompt V3 publish: see `HANDOVER_TASKS.md`.
- **Status: AVAILABLE (PARTIAL** for the one Skill Kit item).

## 6. Playbook (Phase 6)

| Item | Status |
|---|---|
| Process Automation Designer / Playbook Experience | **AVAILABLE** (published OOTB playbooks; Workflow Studio Playbooks tab) |
| Fluent Playbook API | **AVAILABLE** (SDK 4.12.1) |
| Workspace Playbook page | **AVAILABLE** (`sys_ux_macroponent` "Playbook") |
| BCFA AP Invoice Processing Playbook (8 stages) | built in source (`74ce2044…`) and in the Phase 35 deploy. **Activation: manual in Workflow Studio** |
| BCFA Cash Application Playbook (9 stages) | as above (`e01d2325…`) |
| Schema version 3 on Yokohama | **CONFIGURATION REQUIRED**: confirm at activation |
| PAD on custom tables | **LICENSE REQUIRED** to confirm for production (`PLAYBOOK_DESIGN.md` §25) |
| Workspace embedding | route `playbook` + Open Playbook links |
| Stage synchronisation | FinanceJourneyService + gates on `journey_stage_order`; refresh on state, AI note, exception and approval changes |
| Blocking experience | WHAT HAPPENED / WHY / NEXT / WHO on every gate |
| SYSTEM / AI / HUMAN separation | exception lists and taglines |
| MOCK SAP / SIMULATED labels | gates, lists, banner, Review Summary |
| Role experience | view-only Playbook permissions; actions keep their ACLs and SoD |
| Audit | existing AuditEngine; journey refresh not audited by design |
| Metrics | time in stage (`journey_stage_entered`), stage distribution (backfill output); no Performance Analytics |

## 7–8. E2E (Phases 7–8)

Fresh-transaction script `scripts/deploy/phase35_e2e_bg.js` (AP A–F, AR A–I). Results: `FINAL_E2E_TEST_RESULTS.md`.

## 9. Security / SoD (Phase 9)

- Role model of 11 roles (`APPROVALS_SOD.md`).
- SoD is enforced in ApprovalEngine:
  - requester ≠ approver;
  - processor ≠ approver;
  - approver role and group.
- AI identities are refused.
- **ATF.** SoD self-approval passed on 2026-10-01; the remaining tests are in `FINAL_E2E_TEST_RESULTS.md`.
- **New Phase 35 actions:**
  - Open Playbook only navigates;
  - Check SAP Draft Status is restricted to integration_operator, ar_processor, finance_approver and admin, and is a status query only.
- **Known gap, not changed by me.** The workspace route ACL `bcfa.*` does not list `ap_approver`, `ar_approver` or `integration_operator`. Users with only those roles cannot open the workspace. Role and ACL changes are the instance admin's decision (`HANDOVER_TASKS.md`).

## 10. Workspace (Phase 10)

- BCFA Workspace `/now/bcfa` with lists, dashboard and KPI (`FINANCE_OPERATIONS_WORKSPACE.md`).
- **Phase 35** adds the Playbook route.
- The record page is the platform preset (SRP). A Playbook tab on it would be an instance-side UI Builder variant and was not made (`PLAYBOOK_DESIGN.md` §19).

## 11. Flows (Phase 11)

See section 1. No flow changed in Phase 35. The Playbooks start no flow.

## 12. Integration (Phase 12)

- **MOCK SAP:** authoritative for the POC; idempotency and Unknown Outcome Control tested (ATF).
- **Real SAP: NOT CONFIGURED.** `RealSAPAdapter` is a seam that returns NOT_CONFIGURED.
- **SAP Draft/Direct:** implemented and configuration-driven.
- Checklist: `SAP_ACTIVATION_CHECKLIST.md`.

## 13. ATF (Phase 13)

| Suite | Tests |
|---|---|
| BCFA Regression | 13 → 35 |
| BCFA Playbook Regression | 22 |

Runs are serial, one test at a time. Results: `FINAL_E2E_TEST_RESULTS.md`.

## 14. Source quality (Phase 14)

- `npx now-sdk build` is clean.
- Fluent files are generated where repetitive (`gen_playbooks.py`) and committed with their generator.
- The deploy is drift-guarded and re-runnable.
- No credentials in the repo.
- The CRLF warnings are git line-ending normalisation only.

## 15. Demo data (Phase 15)

- AP-PLAY-01..04 and AR-PLAY-01..07 cover each Playbook situation:
  - not only completed transactions;
  - blocked, waiting and action-required ones too.
- They are part of `resetAndReseed`.

## Open items at audit time

1. **Phase 35 deploy** (`phase35_playbook_deploy_bg.js`, 1.7 MB) must be run by an admin. It cannot be pasted by the assistant (size), and uploading it as an attachment is not allowed on this instance.
2. **Activate both Playbooks** in Workflow Studio (manual by platform design).
3. **Backfill and seed** (`phase35_backfill_and_seed_bg.js`), then the E2E script and the PB-* ATF tests.
4. **Studio commit** of the deployed changes (sys_module source copies).
5. Delete the stale draft flow (housekeeping).
6. Skill Kit prompt V3 publish (`HANDOVER_TASKS.md`).
7. Route ACL roles for approver-only and integration-operator-only users (admin decision).
