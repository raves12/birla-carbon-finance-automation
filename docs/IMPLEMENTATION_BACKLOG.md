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
| 2 | Stabilize the custom application (build + install to parity) | NEXT | None |
| 3 | Rebuild lost reference and demo data | Queued | Depends on Phase 2 |
| 4 | Generate synthetic document fixtures | Queued | Depends on Phase 2 |
| 5 | Content Understanding / Document Intelligence configuration | Queued | Entitlement check on first use |
| 6 | ServiceNow generative AI skills | Queued | Entitlement check on first use |
| 7 | AI agent tools (least-privilege) | Queued | Depends on Phase 5/6 data shape |
| 8 | Native AP AI agents (3) | Queued | Depends on Phase 7 |
| 9 | Native AR AI agents (4) | Queued | Depends on Phase 7 |
| 10 | AP agentic workflow | Queued | Depends on Phase 8 |
| 11 | Cash Application agentic workflow | Queued | Depends on Phase 9 |
| 12 | POC 1 AP automation (happy path + exception path) | Queued | Depends on Phases 2–11 |
| 13 | POC 2 Cash Application automation | Queued | Depends on Phases 2–11 |
| 14 | Matching engine review | Low effort — already deterministic and complete; audit only | None |
| 15 | Decision tables for configurable policy | Queued | None (native platform capability, no license gate) |
| 16 | Exception management unification | Partial — `ExceptionEngine`/exception tables already unified; extend fields only if gaps found | None |
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
| 27 | Demo transaction data | Depends on Phase 3 | — |
| 28 | Demo reset | Queued — `DemoDataSeeder` is idempotent by design; add an explicit reset method scoped to `is_demo=true` | None |
| 29 | Automated testing | Partial — `core_correctness` ATF/job suite exists and is Claude-independent; extend for native-AI paths | Depends on Phase 8–13 |
| 30 | POC success metrics | Queued | Depends on Phase 24 dashboard |
| 31 | Extension packs | **FUTURE** — explicitly deferred | — |
| 32 | Documentation | Rolling — update alongside each phase, not as one final pass | — |
| 33 | POC demo script | Queued | Depends on Phases 12–13 |
| 34 | Remove external AI dependencies | Queued — full scan complete (see repo inventory), removal scoped and ready | Depends on Phase 5–13 replacement being functional first (do not remove before the replacement works) |
| 35 | Git and change control | **IN PROGRESS** — branch created, this commit is phase 0/1 | — |

## Phase 2 detail — Stabilize (next action)

1. `now-sdk build` from `C:\Projects\birla-carbon-finance-automation`.
2. `now-sdk install` against `pwcmanagementservicesdemo01`.
3. Re-run the live MCP inventory queries from Phase 0 to confirm
   `finance_intake` table, `FinanceDocumentIntakeService`,
   `ApLineResolutionService`, `FinanceIntakeAutoNumber`, and the 6 Finance
   Document Intake UI Actions now exist.
4. Verify workspace, StateModels, flows, and ATF tests are present and
   loadable.
5. Commit: `chore: assess new BCFA instance` (Phase 0/1 docs, this commit)
   then `fix: stabilize BCFA deployment` (Phase 2, once verified).

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
