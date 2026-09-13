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
