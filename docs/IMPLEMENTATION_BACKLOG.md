# Implementation Backlog

Date: 2026-09-25
Branch: `feature/bcfa-native-ai-completion`

Phased backlog derived from `docs/CURRENT_STATE_ASSESSMENT.md` and
`docs/SERVICENOW_AI_READINESS.md`. Phases 0–1 are complete as of this commit.
Execution proceeds in order; each phase is committed separately once it
passes its own verification.

| Phase | Title | Status | Blocker |
|---|---|---|---|
| 0 | Current state and environment assessment | **DONE** | — |
| 1 | ServiceNow native AI readiness | **DONE** (tentative — see readiness doc) | Entitlement unconfirmed, non-blocking |
| 2 | Stabilize the custom application (build + install to parity) | **DONE** | None |
| 3 | Rebuild lost reference and demo data | **DONE** | None — see `docs/DEMO_DATA.md` |
| 4 | Generate synthetic document fixtures | **DONE** | None — see `docs/DOCUMENT_FIXTURES.md` |
| 5 | Content Understanding / Document Intelligence configuration | **DONE (configuration only)** | Extraction returns no values (Classic untrained method; generative extraction not available). Corrected in Phase 12, see `docs/CONTENT_UNDERSTANDING.md` |
| 6 | ServiceNow generative AI skills | **DONE** — all 9 skills built and published in Now Assist Skill Kit on Now LLM Generic, see `docs/GENERATIVE_AI_SKILLS_BUILD_GUIDE.md` | Skill Kit "Run Test" preview doesn't substitute inputs on this instance — runtime verification moves to Phase 7 |
| 7 | AI agent tools (least-privilege) | **DONE** — `NowAssistSkillClient` + `FinanceAgentTools` (18 tools) deployed and tested live against demo data; see `docs/AI_AGENT_TOOLS.md` | None. Role-denial test deferred to Phase 29. Studio "Commit Changes" still needed before any Apply Remote Changes |
| 8 | Native AP AI agents (3) | **DONE** — Exception Analysis, Resolution Recommendation, Communication; deployed and tested in AI Agent Studio; see `docs/AI_AGENT_TOOLS.md` | None |
| 9 | Native AR AI agents (4) | **DONE** — Customer Resolution, Cash Match Recommendation, Deduction Analysis, Cash Application Communication; deployed; 2 of 4 tested live, rest in Phase 13 | Demo data lacks remittances/aliases for a rich customer-resolution demo (Phase 27/28) |
| 10 | AP agentic workflow | **DONE** — BCFA AP Invoice Review (trigger on open AP exception, runs as AI user `bcfa.ai.reviewer`); manual run and unattended trigger run both verified end to end; see `docs/AI_AGENT_TOOLS.md` | None |
| 11 | Cash Application agentic workflow | **DONE** — BCFA Cash Application Review (trigger on open AR exception, runs as `bcfa.ai.reviewer`); manual and unattended runs verified; deterministic currency guard added; see `docs/AI_AGENT_TOOLS.md` | None (routing refinement once demo data has ambiguous remitters, Phase 27/28) |
| 12 | POC 1 AP automation (happy path + exception path) | **DONE** — native path (simulated reading, configurable policy, enriched exceptions, human decisions with maker/checker); happy path and all four decisions verified live, see `docs/POC1_AP_JOURNEY.md` | Document Intelligence extraction not licensed (simulated reading, labelled). Role-denial tests in Phase 29 |
| 13 | POC 2 Cash Application automation | **DONE** — remittance-driven matching, native AI review (retested after an agent-instruction fix), reviewer decisions incl. BANK_CHARGE deduction, open-item settlement on clearing; exact, multi-invoice and deduction paths verified live, see `docs/POC2_CASH_JOURNEY.md` | DocIntel extraction not licensed (simulated reading). Skill output rule breach logged for Phase 21 |
| 14 | Matching engine review | **DONE** — AP duplicate (normalized, any amount), PO vendor/closed, PO-line/GRN linkage, line totals; AR currency-safe exact match, normalized/ambiguity-aware alias, exact combination search with `ambiguous_match`, bank-charge and credit-note suggestions, credit-note netting end to end; live-verified, see `docs/MATCHING_ENGINE_REVIEW.md` | ATF suite deployed but not run: ATF execution disabled on the instance (deferred to Phase 29) |
| 15 | Decision tables for configurable policy | **DONE** — BCFA AP Tolerance, BCFA AP Approval, BCFA AR Deduction built through the supported sn_dt Decision Table API and used by FinancePolicy (property fallback); 15/15 checks passed, see `docs/DECISION_TABLES.md` | Approval-group membership enforced in Phase 17 |
| 16 | Exception management unification | **DONE** — shared ExceptionEngine framework and identical fields on AP/AR exceptions (number, process, subtype, priority, SLA status, aging, escalation, AI explanation/confidence, resolution code/by/at, correlation id); hourly SLA/escalation sweep, notification events and emails, dashboard tab; verified live, see `docs/EXCEPTION_FRAMEWORK.md` | Native task SLAs need task tables (production remodel); Finance Controllers group has no members |
| 17 | Approvals and SoD | **DONE** — AP/AR Approver roles; one SoD gate for every decision (AI never approves, approver role, requester, processor, approval group; last three configurable); full decision record incl. override reason and state before/after; verified live, see `docs/APPROVALS_SOD.md` | UI role-denial tests in Phase 29 |
| 18 | Integration framework | **DONE** — canonical SAP operations, RealSAPAdapter seam, transaction request hash / external reference / reconciliation state, three-level idempotency, unknown-outcome reconciliation without blind retry (retry reuses the transaction); verified live, see `docs/INTEGRATION_CONTRACTS.md` | Real SAP interface details not provided (Mock SAP authoritative) |
| 19 | Audit framework | **DONE** — Audit Event gains process, reason, AI agent and event sequence; 21-event vocabulary (record, upload, extraction, field correction, rule, match, exception, AI invocation/recommendation, human review, approval, override, allocation, deduction, integration, SAP result, reconciliation, closure); append-only rule; correlation-chain related lists; verified live, see `docs/AUDIT_FRAMEWORK.md` | None |
| 20 | AI execution log | **DONE** — `x_695068_bcfa_ai_interaction` is the provider-agnostic AI Interaction Log (Now Assist skills and agentic workflows, simulated, legacy Claude): capability, skill, agent, workflow, hashed input context (no prompts), result, recommendation, confidence, status, duration, initiating user, human accepted/overridden with reason; verified live, see `docs/AI_EXECUTION_LOG.md` | None |
| 21 | Now Assist Guardian | **DONE** — Guardian configured on the 9 BCFA skill capabilities (request+response, prompt injection BLOCK, offensiveness BLOCK; instance-wide settings untouched) and verified to flag injection; FinanceAiGuard blocks injection in record data before any skill call and sanitizes output (plain text, no false completed-action statements — fixes the fully-settled breach); see `docs/AI_SECURITY_AND_GUARDRAILS.md` | Guardian runs async on this instance, so BLOCK acts as monitor until the instance admin sets Async=false |
| 22 | AI security (least privilege) | **DONE** — new role x_695068_bcfa.ai_agent (read what the tools read; write only the exception ai_recommendation field); bcfa.ai.reviewer holds only that role; agent masks and execute ACLs without admin or approver; verified by impersonation and by both agentic workflows running end to end; see `docs/AI_SECURITY_AND_GUARDRAILS.md` section 5 | None |
| 23 | AI Control Tower | **DONE** — AI Control Tower 5.0.6 present; BCFA workflows, agents, skills and prompts inventoried; owner on all assets; skills Deployed; solution asset BCFA Finance Automation AI with subcomponents and agent-to-skill links; Content Understanding registered as planned (license gap); approval request AR0000002 (proposed risk Medium) for AI steward review; see `docs/AI_GOVERNANCE.md` | No active AI steward on the instance: AR0000002 waits for Birla Carbon to name one; named business owner to replace the demo stand-in |
| 24 | Finance Operations workspace enhancement | **DONE** — Finance Operations landing tab (19 KPI cards; FinanceKpiService + x_695068_bcfa_kpi, 15-minute refresh); AP and Cash Application workspace lists per the brief; Review Summary at the top of the AP Invoice and Payment forms (FinanceReviewSummary) and AI Interactions related lists; see `docs/FINANCE_OPERATIONS_WORKSPACE.md` | Rate / average cards to be confirmed visually in the workspace |
| 25 | Automated flows | **DONE** (verified 2026-09-28: an AP invoice and a payment ran intake → approval → posting / clearing through the flows, with only the human approval manual) — 15 Flow Designer flows own the AP/AR hand-offs (intake, validation, exception, approval, integration/clearing, reconciliation, remittance, match, aging/escalation) through event `x_695068_bcfa.flow.stage` → Script Action → FinanceOrchestration (state-guarded stages over the existing domain services); orchestration mode property (flow / inline; seeding inline); Phase 16 sweep job retired; see `docs/AUTOMATED_FLOWS.md` | None |
| 26 | State models | **DONE** (verified 2026-09-28: an illegal change was refused both through the service and by a direct update, and audited; the AP pipeline ran to CLOSED under enforcement; no new unmodelled transitions) — models checked against the audit trail (6 legitimate transitions added, 2 test-only paths now refused); enforced by FinanceLifecycle in `_setState` plus before-update backstop business rules; `state` read-only; enforce / monitor property; see `docs/STATE_MODELS.md` | None (AR clearing under enforcement confirmed: BANK-P25-805373 CLOSED) |
| 27 | Demo transaction data | **DONE** — all 10 AP + 10 AR scenarios; re-verified 2026-09-28 after a Phase 28 reset under the Phase 25 flows and Phase 26 enforcement (20 of 20 as documented; AR-004 alias seeded as confirmed); see `docs/DEMO_DATA.md` | — |
| 28 | Demo reset | **DONE** (verified 2026-09-28) — `DemoDataSeeder.resetAndReseed` (confirmation text + `reset_enabled` property): deletes operational data and non-baseline master rows, upserts master data back to the seeded values (sys_ids kept), re-seeds the 20 scenarios; audit trail kept, AI log kept by default; see `docs/DEMO_DATA.md` | — |
| 29 | Automated testing | **DONE** (2026-09-29) — BCFA Regression 13/13 pass (8 new tests for the Phase 19-28 controls; the suite found and fixed a prompt-injection screening gap). AI ranking quality evaluated on 6 labelled ambiguous matches over 4 runs + one tuning pass: controls always hold (no wrong pick, no completed-action claim); explanations name the right option but commitment is suppressed/inconsistent, so AI explains options and evidence and ranking is not relied on; see `docs/TEST_PLAN.md` | Parked: publish AR next-action prompt v3 through the Skill Kit UI (needs a person; Skill Kit now also requires ACL + role restrictions on update) |
| 30 | POC success metrics | Queued | Depends on Phase 24 dashboard |
| 31 | Extension packs | **FUTURE** — explicitly deferred | — |
| 32 | Documentation | Rolling — update alongside each phase, not as one final pass | — |
| 33 | POC demo script | Queued | Depends on Phases 12–13 |
| 34 | Remove external AI dependencies | Queued — full scan complete (see repo inventory), removal scoped and ready | Depends on Phase 5–13 replacement being functional first (do not remove before the replacement works) |
| 35 | Git and change control | **IN PROGRESS** — branch created, this commit is phase 0/1. Phase 26 finding: records the deploy loader inserted from global scope carried the global `sys_package` (app `sys_scope`); the loader now moves them to the app package, and `phase26_package_repair_bg.js` repaired 271 existing ones (2026-09-28). Residual: 9 `sys_ux_list` records and 1 `sys_ux_list_category` keep the global package (the platform refuses cross-scope writes to those tables, from a script or REST); they are defined in the Fluent source | Studio Commit Changes |

## Phase 2 detail — Stabilize (completed 2026-09-25)

**`now-sdk install` does not work against this instance and should not be
retried without first fixing the underlying issue.** Diagnosis: the CLI's
install path uploads to a legacy session/CSRF-dependent endpoint
(`sn_appclient_upload_processor.do`) that returns an empty 200 response
instead of the expected execution-tracker payload when authenticated via
the OAuth credential type this instance requires (Basic Auth is rejected
instance-wide, so there is no fallback auth type for the CLI to use either).
Reproduced twice with identical results; confirmed via live query that
nothing was applied by either attempt.

**Working deployment path used instead** (fully supported, no unsupported
internal metadata manipulation):
1. Linked the existing app to source control via Studio's native
   **Source Control > Link to Source Control** (not "Import Application",
   which would create a duplicate app). Studio auto-created branch
   `sn_instances/pwcmanagementservicesdemo01` in the GitHub repo, seeded
   with the *instance's own* current metadata as a "historical commit."
2. Merged `feature/bcfa-native-ai-completion` into that branch — confirmed
   conflict-free, since both diverge from `0f2224e` with no overlapping
   files.
3. This alone was insufficient: Studio's native "Apply Remote Changes" only
   understands the classic raw per-record XML representation it exports
   itself, **not** the Fluent/TypeScript source under `src/`. Since Finance
   Document Intake was authored purely in Fluent and never round-tripped
   through Studio, no raw XML existed for it anywhere in that branch.
4. Fix: ran `now-sdk build` locally (this step already worked fine — only
   `install` is broken), then surgically copied the 71 build-output XML
   files corresponding to the missing components (the `finance_intake`
   table + all 21 fields + choices + docs, `FinanceDocumentIntakeService`,
   `ApLineResolutionService`, the `FinanceIntakeAutoNumber` business rule,
   6 UI Actions + their workspace form-action pairs, and the
   `GlideSysAttachment` cross-scope privilege) into the branch's
   `229ba2b1a079431e104010f5ea883e85/` tracked folder, alongside — not
   replacing — the existing content. Verified first that sys_ids for
   already-existing components (e.g. `ApDomainService`,
   `sys_id=5d8f9a6cb8f340a49220bf64557ab807`) matched exactly between the
   local build and the live instance, confirming Fluent's id generation is
   stable and this introduces zero drift.
5. Pushed, then ran Studio's **Apply Remote Changes** again — succeeded
   ("Success with warning", 16 non-blocking warnings), and live MCP queries
   confirmed every component now exists and is active.

**For all future phases**: the working deploy loop is (a) commit to
`feature/bcfa-native-ai-completion`, (b) `now-sdk build` locally, (c) merge
into `sn_instances/pwcmanagementservicesdemo01`, (d) for any genuinely new
component, copy its corresponding files from the fresh `dist/app/` build
output into `229ba2b1a079431e104010f5ea883e85/` on that branch before
pushing, (e) push, (f) run Apply Remote Changes in Studio. Revisit
`now-sdk install` only if ServiceNow/now-sdk fixes OAuth support for the
legacy upload endpoint, or if Basic Auth is ever re-enabled on this
instance.

## Ordering rationale for Phase 34 (Claude removal)

Per the program's own architecture principle ("the finance process MUST
remain safe if ServiceNow AI is unavailable" and "no external AI fallback"),
Claude is removed **after** its native replacement is built and verified,
never before — removing it first would leave `FinanceDocumentIntakeService`
with zero working extraction path (it has no `AISimulationService` fallback
today). `ApDomainService`/`ArDomainService` could safely have their Claude
call sites removed immediately (as they already fall back to
`AISimulationService`), but decommissioning is done as one coherent Phase 34
change rather than piecemeal, to keep the git history and the final
`FINAL_BUILD_REPORT.md` narrative clean.

## Open items requiring user/admin input

- Confirm Now Assist / AI Agent Studio / Document Intelligence entitlement
  in the instance UI (cannot be automated — see `SERVICENOW_AI_READINESS.md`).
- Confirm whether real SAP interface details will ever be provided (Mock SAP
  remains authoritative for the POC regardless — see `docs/OPEN_SAP_GAPS.md`).
- Decide whether demo user provisioning (Phase 3's `bcfa.ap.processor` etc.)
  should create real `sys_user` records now or wait until groups/roles are
  finalized in Phase 17.
