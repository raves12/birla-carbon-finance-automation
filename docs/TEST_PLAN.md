# TEST_PLAN.md — Birla Carbon Finance Automation

Stage 11/18 output. Tests are ATF `Test()` definitions using `atf.server.runServerSideScript`
(the documented mechanism for exercising a Script Include with no UI — see the ATF guide), run via
the MCP `atf_test_run` tool. Source: `src/fluent/tests/*.now.ts`.

## Why runServerSideScript rather than form/list-based ATF steps

Every AP/AR state transition happens inside Script Includes (`ApDomainService`, `ArDomainService`,
`MatchingEngine`, `IntegrationService`) rather than through form interactions, so `atf.server.runServerSideScript`
is the correct, documented tool for testing them — the ATF guide explicitly says not to exercise a
Script Include through `atf.form`/`atf.catalog`.

## Tests

| Test | File | What it verifies |
|---|---|---|
| Seed Demo Data | `demo_data_seed.now.ts` | Not a correctness test — the execution mechanism for Stage 10/17 demo data (master data + the 10 AP + 10 AR named scenarios). Run once per fresh deploy. |
| Idempotency | `core_correctness.now.ts` → `test-idempotency` | Calling `IntegrationService.execute()` twice with the same idempotency key produces exactly one successful `Integration Transaction` row, and the second call is reported as a cached replay (`idempotentReplay: true`), not a fresh adapter call. Directly verifies Section 18's idempotency acceptance criterion. |
| Segregation of Duties (self-approval) | `core_correctness.now.ts` → `test-sod-self-approval` | `ApprovalEngine.decideApInvoiceApproval` refuses a decision where `approver === requested_by`, returning an error rather than silently approving. Service-layer mirror of the `acl-write-ap-approval-decision` ACL script. |
| Unknown Outcome Control | `core_correctness.now.ts` → `test-unknown-outcome-control` | A simulated `timeout` on `postInvoice` is reported as `unknownOutcome: true` and leaves the invoice in `UNKNOWN_OUTCOME` — never silently retried or marked posted — then `reconcilePosting` resolves it via a status query rather than a blind retry. Directly verifies Section 11. |

## Phase 29: controls added in Phases 19-28 (`phase29_controls.now.ts`)

These tests cover the deterministic controls around AI. None of them calls a model. ATF rolls their data back.

| Test | What it verifies |
|---|---|
| Lifecycle | RECEIVED → CLOSED through the service throws a lifecycle error, leaves the state unchanged and is audited as REFUSED. A direct update RECEIVED → POSTED is aborted by the backstop rule. Legal and same-state changes pass. The Phase 26 transitions are modelled; the test-run path MATCHED → MATCHING is not |
| Orchestration | Flow mode by default, and `runInline` scopes inline mode to one call. An unknown stage is rejected. Intake hands off to the AP Invoice Intake Flow. The validation stage is skipped while RECEIVED. The intake stage runs once (EXTRACTED), and a second run is skipped |
| AI guardrails | 5 injection samples are blocked, while a human override reason is not treated as injection. A completed-action claim is removed (and a guardrail note added) unless the record really is posted. Markdown is removed |
| AI identity | `bcfa.ai.reviewer` holds only `x_695068_bcfa.ai_agent` among the BCFA roles and is not admin. The segregation check and the approval decision both refuse the AI identity, and the approval stays pending |
| Audit trail | An update and a delete of an audit event are both refused |
| Ambiguous match control | Two exact combinations produce an `ambiguous_match` exception, no selected candidate and no allocation. The engine never chooses |
| Demo reset | Refused without the confirmation text; nothing is deleted |
| KPIs | `FinanceKpiService.refresh()` computes all 19 KPIs, each with a numeric value |

## Phase 29: AI ranking quality on ambiguous matches (`FinanceAiEvaluation`)

Model output is not deterministic, so ranking quality is measured as a score on labelled cases rather than as a
pass/fail ATF step. When several sets of open items match a payment exactly, the engine does not choose; a person
decides, advised by Now Assist.

**The cases.** There are 6, each with two exact combinations totalling 10,000 INR, created through the real pipeline
(`EVAL-P29-*`):

- **4 hinted cases:** the remittance note is free text the engine does not resolve. It names the month, names invoice
  numbers, says "oldest", or contradicts the oldest-first habit. The advice should recommend the right combination and
  not the other.
- **2 no-hint cases:** a generic note, or no remittance at all. The advice should decline to pick and ask for details.

**How it is scored.** Item numbers are read from the recommending lines (recommend, suggest, likely, appears and so
on). A combination counts as picked when all its items are named and none of the other combination's are. The score
also counts any completed-action claim, and confirms the deterministic control: the engine chose nothing.

**Two stages.**

1. `phase29_ai_eval_bg.js` scores the AR next-action skill directly.
2. `phase29_ai_eval_stage2_bg.js`, a few minutes later, scores the advice the Cash Application Review agentic workflow
   saved on each exception, then removes the evaluation data. Audit events and AI Interaction Log rows are kept.

Results: see *Phase 29 results* below.

## Coverage against the brief's Section 18 checklist

| Required coverage | Status |
|---|---|
| Application installs / tables exist / relationships exist | Verified via `now-sdk install` + MCP `table_list`/`record_list` after every stage (see chat history) — not a separate ATF test, since these are structural, build-time-verifiable facts. |
| ACLs work / roles work | 8 roles + 72 ACLs deployed and confirmed via MCP (Stage 4). Self-approval and post-approval-lock scripted ACLs are exercised indirectly by the AP-002 (duplicate → exception, never reaches approval) and the SoD ATF test above. |
| AP lifecycle: happy path, duplicate, mismatch, exception, approval, posting, timeout, unknown outcome, retry | Exercised by demo scenarios AP-001 (happy path/approval/posting), AP-002 (duplicate), AP-003 (PO mismatch), AP-004/AP-005/AP-006 (tolerance/tax exceptions), AP-007 (low confidence), AP-008 (approval pending), AP-009 (posting failure), AP-010 (timeout → unknown outcome → reconciled). |
| AR lifecycle: exact match, fuzzy candidate, allocation, residual, deduction, exception, approval, clearing, timeout, unknown outcome | Exercised by AR-001 through AR-010 (see `docs/DATA_MODEL.md`/`DemoDataSeeder`). |
| Security: processor cannot approve, approver cannot alter source, auditor cannot modify, integration operator cannot alter accounting values | Processor-cannot-approve: ATF test above + ACL. Approver-cannot-alter-source: enforced by never granting `finance_approver` write access to `ap_invoice`/`payment` at all (Stage 4 ACL design), plus the `approval_state`-gated write ACL blocking further processor edits post-approval. Auditor-cannot-modify: no write ACL exists for any business role on the evidence tables (Stage 4). Integration-operator-cannot-alter-accounting-values: `bcfaIntegrationOperator` is never granted write on any AP/AR table, only `Integration Transaction`/`Integration Profile`/master data. |
| Idempotency: same write executed twice → one business transaction | ATF test above. |

## Known test-coverage gaps (honest, not hidden)

- No ATF `atf.form`-based UI tests exist, since Stage 9 delivers standard ServiceNow list/form views
  rather than a custom Configurable Workspace (see `docs/BUILD_REPORT.md` for that scope decision) —
  there is no bespoke UI surface to test beyond the platform's own generated forms.
- Deduction auto-classification (bank charge, credit note netting) is a manually-recorded reviewer
  action in this POC (see `docs/BUSINESS_RULES.md`), so there is no automated test for auto-detecting
  those deduction types — only for the manual-entry path used in demo scenarios AR-007/AR-008.
- Resilience testing (Stage 12) is demonstrated via the per-call `simulateOutcome` override (used by
  demo scenarios AP-009/AP-010/AR-010) rather than by flipping the global `Integration Profile`
  `failure_mode` field in an automated test — both paths exercise the same `IntegrationService.execute()`
  code, so the per-call tests already cover the failure-handling logic itself.
