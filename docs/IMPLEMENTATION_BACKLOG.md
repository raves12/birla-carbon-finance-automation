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
| 17 | Approvals and SoD | Mostly done — SoD already enforced via scripted ACL; add group-based approval routing | None |
| 18 | Integration framework | **ALREADY WORKING** — no changes planned | None |
| 19 | Audit framework | **ALREADY WORKING** — `AuditEngine`/`audit_event` cover the required event set; extend `actor_type` choices for new native-AI agents | None |
| 20 | AI execution log | Needs rework — repurpose `x_695068_bcfa_ai_interaction` (currently Claude-specific) into a provider-agnostic AI Interaction Log | Depends on Phase 8/9 agent output shape |
| 21 | Now Assist Guardian | Queued | Presence unconfirmed — verify first |
| 22 | AI security (least privilege) | Queued | Depends on Phase 7 tool scoping |
| 23 | AI Control Tower | Queued | Presence unconfirmed — document gap if unavailable, non-blocking |
| 24 | Finance Operations workspace enhancement | Queued | Depends on Phase 20 relabeling |
| 25 | Automated flows | Partial — 2 of ~16 listed flows exist (AP/AR exception aging); rest run as direct script orchestration by design (`docs/ARTIFACT_STRATEGY.md`) — evaluate case by case, do not force Flow Designer where direct orchestration already works | None |
| 26 | State models | **ALREADY WORKING** — verify post-Phase-2 deploy | None |
| 27 | Demo transaction data | **DONE** — all 10 AP + 10 AR scenarios seeded and verified live, see `docs/DEMO_DATA.md` | — |
| 28 | Demo reset | Queued — `DemoDataSeeder` is idempotent by design; add an explicit reset method scoped to `is_demo=true` | None |
| 29 | Automated testing | Partial — `core_correctness` ATF/job suite exists and is Claude-independent; extend for native-AI paths | Depends on Phase 8–13 |
| 30 | POC success metrics | Queued | Depends on Phase 24 dashboard |
| 31 | Extension packs | **FUTURE** — explicitly deferred | — |
| 32 | Documentation | Rolling — update alongside each phase, not as one final pass | — |
| 33 | POC demo script | Queued | Depends on Phases 12–13 |
| 34 | Remove external AI dependencies | Queued — full scan complete (see repo inventory), removal scoped and ready | Depends on Phase 5–13 replacement being functional first (do not remove before the replacement works) |
| 35 | Git and change control | **IN PROGRESS** — branch created, this commit is phase 0/1 | — |

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
