# Current State Assessment

Date: 2026-09-25
Instance assessed: `pwcmanagementservicesdemo01.service-now.com`
Repository: `birla-carbon-finance-automation` @ `0f2224e` (branch `feature/bcfa-native-ai-completion`)

This document is the Phase 0 baseline for completing the Birla Carbon Finance
Automation (BCFA) application on the new ServiceNow instance, per the native-AI
completion program. It classifies every capability area and lists every
material difference found between the git repository and the deployed
instance.

## Classification legend

- **ALREADY WORKING** — exists in git and is deployed and functioning as designed.
- **NEEDS ENHANCEMENT** — exists but requires changes for this program (e.g. Claude removal, native AI substitution).
- **MISSING** — does not exist in git and/or on the instance; must be built.
- **DATA LOST** — configuration/master/transactional data that existed previously is gone and must be reseeded.
- **INSTANCE CONFIGURATION REQUIRED** — exists in git but not on the instance purely because of a deployment gap (build/install needed).
- **LICENSE DEPENDENT** — depends on a ServiceNow entitlement whose licensed status is not yet confirmed.
- **CLIENT INPUT REQUIRED** — cannot proceed without Birla Carbon / SAP-side information.
- **FUTURE** — explicitly out of scope for the two primary POCs.

## Repository vs. deployed instance — the gap

The instance already has an app install that is **older than current git HEAD**.
Specifically:

| Component | In git (`0f2224e`) | On instance | Status |
|---|---|---|---|
| Core tables (28 total minus finance_intake) | Yes | Yes (all present) | ALREADY WORKING |
| `x_695068_bcfa_finance_intake` table | Yes | **No** | INSTANCE CONFIGURATION REQUIRED |
| `ApDomainService`, `ArDomainService`, `MatchingEngine`, `ExceptionEngine`, `ApprovalEngine`, `AuditEngine`, `IntegrationService`, `MockSAPAdapter`, `MockBankAdapter`, `AISimulationService`, `DemoDataSeeder`, `MockArchiveAdapter` | Yes | Yes | ALREADY WORKING |
| `FinanceDocumentIntakeService`, `ApLineResolutionService` | Yes | **No** | INSTANCE CONFIGURATION REQUIRED |
| `BCClaudeClient` | Yes | Yes (updated 2026-09-17, ~2h after the rest) | NEEDS ENHANCEMENT (decommission target) |
| 2 approval-cascade Business Rules | Yes | Yes | ALREADY WORKING |
| `FinanceIntakeAutoNumber` Business Rule | Yes | **No** | INSTANCE CONFIGURATION REQUIRED |
| `Approve` UI Actions (AP/AR) | Yes | Yes | ALREADY WORKING |
| `Explain with Claude` UI Actions (AP/AR exceptions) | Yes | Yes | NEEDS ENHANCEMENT (rename/replace) |
| 6 Finance Document Intake UI Actions | Yes | **No** | INSTANCE CONFIGURATION REQUIRED |
| BCFA Workspace (workspace/list-menu/dashboard) | Yes | Not verified in this pass — verify on next build/install | NEEDS VERIFICATION |
| 8 scoped roles | Yes | Yes | ALREADY WORKING |
| BCFA groups (`BCFA AP Processors`, etc.) | No (never authored) | No | MISSING |
| 7 `x_695068_bcfa.claude.*` system properties | Yes | Yes | NEEDS ENHANCEMENT (remove/replace) |
| Cross-scope privilege (`GlideSysAttachment`) | Yes | Not independently verified | NEEDS ENHANCEMENT (removable once native attachment reading replaces Claude's) |
| Master data (vendor, customer, PO, PO line, receipt, AR open item, credit note) | Seeding logic exists (`DemoDataSeeder`) | **0 records on all master tables** | DATA LOST |
| AP/AR demo transactions (AP-001..010, AR-001..010, Claude demo scenarios) | Seeding logic exists | **0 records** (not yet verified table-by-table beyond master data, but consistent with empty masters) | DATA LOST |
| 2 Flow Designer flows (AP/AR exception aging) | Yes | Not verified in this pass | NEEDS VERIFICATION |
| 2 StateModels (AP invoice, cash application) | Yes | Not verified in this pass | NEEDS VERIFICATION |
| ATF tests (`core_correctness`, `demo_data_seed`) | Yes | Not verified in this pass | NEEDS VERIFICATION |

**Root cause**: the instance was installed from a build produced before the
`0f2224e` commit (Claude integration, workspace, Finance Document Intake) was
fully packaged, or a stale `dist/`/`target/` artifact was installed. Either
way, **Phase 2 (stabilize) requires a fresh `now-sdk build` + `now-sdk install`
against `pwcmanagementservicesdemo01`** before anything else meaningful can be
verified end-to-end.

## Capability classification

### Domain services & engines — ALREADY WORKING
`ApDomainService`, `ArDomainService`, `MatchingEngine`, `ExceptionEngine`,
`ApprovalEngine`, `AuditEngine` are deployed, deterministic, and contain no
external AI dependency (matching/exception/approval/audit logic is pure
script). These are the parts of the spec's "do not recreate working
components" instruction — reuse as-is.

### Integration layer — ALREADY WORKING
`IntegrationService` → `MockSAPAdapter` / `MockBankAdapter` / `MockArchiveAdapter`
seam is deployed and matches the required Domain Service → IntegrationService
→ Adapter → SAP layering. Idempotency, deterministic failure simulation, and
Unknown Outcome Control (`reconcileUnknownOutcome`) are already implemented.
No changes needed for the POC.

### AI integration — NEEDS ENHANCEMENT (the core of this program)
`BCClaudeClient` is a single, well-isolated 1076-line Script Include. Exactly
three consumers call it: `ApDomainService`, `ArDomainService` (both
Claude-first / `AISimulationService`-fallback for extraction, cash-match
recommendation, and exception explanation), and `FinanceDocumentIntakeService`
(Claude-only, no fallback, for document classification and structured
extraction of real uploaded PDFs).

- `AISimulationService` already provides a working, deterministic,
  non-Claude fallback for **every** AP/AR extraction, cash-match, and
  exception-explanation call site. Decommissioning Claude in
  `ApDomainService`/`ArDomainService` is low-risk — the fallback path already
  works and is already exercised by the AP-001..010/AR-001..010 demo
  scenarios and the ATF/job-based correctness tests, none of which depend on
  Claude.
- `FinanceDocumentIntakeService` has **no non-Claude path at all** — it's the
  one place that needs a genuine native-AI replacement (Document Intelligence
  for extraction/classification) rather than just deleting a fallback branch.

### Finance Document Intake feature — NEEDS ENHANCEMENT + INSTANCE CONFIGURATION REQUIRED
Built and live-verified against Claude in the prior session, but (a) not yet
deployed to this instance, and (b) targeted for replacement of its AI layer
under this program. The deterministic parts (`ApLineResolutionService`,
vendor/PO/customer resolution, attachment hash dedup, state transitions) are
reusable as-is; only the three Claude extraction/classification calls need a
native-AI replacement.

### Data model — ALREADY WORKING
28 tables, complete schema, no gaps found relative to the two POC scopes.
`finance_intake` is the 29th table, pending deployment.

### Workspace — NEEDS VERIFICATION, then NEEDS ENHANCEMENT
Workspace exists in git (path `bcfa`, 4 list-menu categories, 1 dashboard).
The "AI & Audit" category and the "AI Calls Logged" dashboard widget are
Claude-specific and will need relabeling to generic "AI Interaction"
terminology once a native AI logging pattern replaces/extends
`x_695068_bcfa_ai_interaction`.

### Master/demo data — DATA LOST
Confirmed via live query: `x_695068_bcfa_vendor`, `x_695068_bcfa_customer`,
`x_695068_bcfa_purchase_order` all return 0 records on the new instance.
`DemoDataSeeder.seedAll()` exists and is idempotent by design — rerunning it
is the correct remediation once the instance is stabilized (Phase 2) and once
`is_demo`/synthetic-data labeling conventions are confirmed (Phase 3).

### Roles & ACLs — ALREADY WORKING
8 roles and ~70 ACLs deployed, including scripted SoD enforcement
(self-approval rejection) and evidence-table read-only lockdown. No groups
exist yet — group creation is new work (Phase 3 persona setup), not a defect.

### Native ServiceNow AI capability — LICENSE DEPENDENT (installed, entitlement unconfirmed)
See `docs/SERVICENOW_AI_READINESS.md` for the full Phase 1 findings. Summary:
AI Agent Studio (`sn_aia_*`), Now Assist / AI Admin Hub (`sn_nowassist_*`),
Document Intelligence (`di_admin_template`, `sys_di_metrics_*` — the current
name for what the source spec calls "Content Understanding"), and Decision
Tables (`sys_decision`, global scope) are all **installed** on this instance.
Installed is not the same as licensed/entitled for active use — that requires
confirmation inside the instance's Now Assist Admin Console / AI Agent Studio
UI (System Diagnostics or Store Entitlements are not reliably queryable via
the Table API), or a manual check by the user. Every phase from 5 onward
(Content Understanding, generative AI skills, AI agents, agentic workflows)
depends on this confirmation.

### SAP interface — CLIENT INPUT REQUIRED (documented, not new)
`docs/OPEN_SAP_GAPS.md` (pre-existing) already documents unresolved FB05/
ML81N/PGI questions. No change from this assessment; Mock SAP remains
correct for the POC per the program's own constraints.

### Extension packs (BPN, TCS, freight, FX, etc.) — FUTURE
Explicitly deferred per the program's Phase 31 instruction. Not assessed
further in this document.

## Summary table

| Area | Classification |
|---|---|
| Domain services & engines | ALREADY WORKING |
| Integration/mock-SAP layer | ALREADY WORKING |
| Claude integration (BCClaudeClient + 2 call sites) | NEEDS ENHANCEMENT |
| Finance Document Intake | NEEDS ENHANCEMENT + INSTANCE CONFIGURATION REQUIRED |
| Data model (tables) | ALREADY WORKING (finance_intake pending deploy) |
| Workspace | NEEDS VERIFICATION → NEEDS ENHANCEMENT |
| Master/demo data | DATA LOST |
| Roles/ACLs | ALREADY WORKING |
| Groups | MISSING |
| Native AI plugins | LICENSE DEPENDENT (installed, entitlement TBC) |
| SAP real interface | CLIENT INPUT REQUIRED / FUTURE |
| Extension packs | FUTURE |

See `docs/IMPLEMENTATION_BACKLOG.md` for the phased plan to close every
non-FUTURE gap above.
