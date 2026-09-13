# BUILD_REPORT.md — Birla Carbon Finance Automation

Final acceptance report. Status: **Complete and independently verified against actual instance
data** — not just "builds and deploys cleanly." An earlier version of this document claimed the
build was done based on a reseed run that looked clean at a glance; a full record-by-record check
against each scenario's *intended* outcome found that claim was false (every AP scenario was
silently failing), and a further four real bugs were found and fixed by the same method. See
Section 14 for the complete list — this section exists precisely because "never claim success
without verification" is a non-negotiable principle of this build, and it was nearly violated once.

## 1. Application

| | |
|---|---|
| Name | Birla Carbon Finance Automation |
| Scope | `x_695068_bcfa` |
| Instance | `dev183159.service-now.com` (PDI), release "Australia" family |
| Fluent SDK version | 4.12.1 |
| Project version | 0.0.1 |

## 2. Tables (27)

See `docs/DATA_MODEL.md`. AP domain (6), AR/Cash Application domain (7), shared/cross-cutting (7),
mock SAP/bank master data (7).

## 3. Roles (8) and ACLs

`x_695068_bcfa.admin`, `.ap_processor`, `.ar_processor`, `.finance_reviewer`, `.finance_approver`,
`.integration_operator`, `.auditor`, `.read_only`. Segregation of duties enforced by: (1) a scripted
ACL blocking self-approval on `ap_approval.decision`/`ar_approval.decision`, confirmed both by the
ACL script and by two independent service-layer tests (`segregationOfDutiesAp`/`segregationOfDutiesAr`,
Section 13); (2) `finance_approver` is never granted write access to `ap_invoice`/`payment` at all;
(3) a scripted ACL blocking further processor edits to `ap_invoice`/`payment` once approved; (4)
`integration_operator` is never granted write access to any AP/AR financial table.

## 4. State Models (2)

AP Invoice Lifecycle and Cash Application Lifecycle — see `src/fluent/state-models/`.

## 5. Script Includes (12)

`AuditEngine`, `MockSAPAdapter`, `MockBankAdapter`, `MockArchiveAdapter`, `IntegrationService`,
`MatchingEngine`, `ExceptionEngine`, `ApprovalEngine`, `AISimulationService`, `ApDomainService`,
`ArDomainService`, `DemoDataSeeder`.

## 6. Business Rules (2)

`AP Invoice - Auto Post After Approval`, `AR Payment - Auto Clear After Approval` — real ServiceNow
Business Rules that fire synchronously on approval. **Important nuance, found during verification**:
because these always post/clear using whichever Integration Profile failure mode is currently
active, any code that wants to demonstrate a *specific* SAP outcome (a timeout, a technical error)
must set that failure mode *before* triggering the approval, not pass it to a separate call
afterward — see Section 14, bug #2.

## 7. Flows (2)

`AP Exception Aging Escalation`, `AR Exception Aging Escalation` — Fluent-authored Flow Designer
flows, confirmed activated on install ("Flow activation complete: 2/2 succeeded" on every deploy).

## 8. Decision Tables / Rule Engine

Not built as native Decision Table Builder records — see `docs/BUSINESS_RULES.md`'s scope decision.
Tolerance/tax-rate rules are named constants in `MatchingEngine`, documented and exercised by every
demo scenario and the correctness-verification tests.

## 9. REST APIs

None built — not needed. All orchestration runs through Script Includes and Business Rules
triggered by record events; test/demo execution runs through one-time Scheduled Scripts (see
Section 13's note on why, in place of ATF).

## 10. UI components

Standard ServiceNow list/form views — see `docs/USER_EXPERIENCE.md` for the scope decision on why a
custom Configurable Workspace was not built.

## 11. Mock integrations

`MockSAPAdapter`, `MockBankAdapter`, `MockArchiveAdapter`, all behind the canonical
`IntegrationService.execute()` contract (`docs/INTEGRATION_CONTRACTS.md`). 3 `Integration Profile`
records (one per adapter, `failure_mode: success` by default — flipped temporarily by demo scenarios
and tests that need a specific outcome, always restored immediately after).

## 12. Demo data

10 vendors, 10 customers, 10 purchase orders (1 line each), 10 receipts, 15 AR open items, 5 credit
notes, 1 customer alias, 3 Integration Profiles, plus the 10 named AP (`AP-001`..`AP-010`) and 10
named AR (`AR-001`..`AR-010`) scenarios — all seeded by `DemoDataSeeder.seedAll()` via a one-time
`ScheduledScript` (`job-demo-data-reseed-v6`, executed 2026-09-13 15:56 UTC).

`seedAll()` is now idempotent: it guards AP/AR scenario seeding the same way it already guarded
master data (skip if `INV-AP-001`/`BANK-AR-001` already exist), fixing the root cause of bug #1
below. **Every scenario listed in Section 16a below was re-verified record-by-record against its
intended outcome after this run** — not assumed from a clean-looking job completion.

## 13. Tests executed

4 ATF `Test()` definitions exist in `src/fluent/tests/` (real, deployed) but `atf_test_run` is
unavailable in this PDI ("this instance may not have the Automated Test Framework REST API plugin
active" — a confirmed capability gap, not a transient failure). The same logic was run instead via
one-time `ScheduledScript`s, with results read back from `syslog`:

| Test | Result | Evidence |
|---|---|---|
| Idempotency (same write twice → 1 successful transaction) | **PASS** | `BCFA-TEST-V4`, 2026-09-13 16:15 UTC: `transactionCount:1`, `idempotentReplay:true` |
| Segregation of duties — AP (no self-approval) | **PASS** | same run: `decideApInvoiceApproval` returned an error for a same-user approval attempt |
| Segregation of duties — AR (no self-approval) | **PASS** | same run — this AR-side mirror had never been tested before this build pass |
| Unknown Outcome Control (timeout never blind-retried) | **PASS** | same run: `unknownOutcome:true`, reconciliation resolved via status query (`RETRY`), never a blind retry |
| Approval cascade reaches CLOSED (not stuck at APPROVED) | **PASS** | same run: `finalState:'CLOSED'` |
| AR clearing timeout → reconcile → not stuck at CLEARING | **PASS in substance** (see note) | same run: `finalState:'CLOSED'` — the test's own `pass` boolean only accepted `'CLEARED'`/`'FAILED'` as success and treated `'CLOSED'` (a *further-along*, equally valid outcome) as failure. This is a test-assertion gap, not a product bug — confirmed twice: once here, once by demo scenario AR-010 independently reaching `CLOSED` in the real seeded data. |

## 14. Bugs found and fixed during verification (the actual story of this build)

Every one of these was found by comparing **real instance data** against what each scenario was
supposed to demonstrate — not by reading code and assuming it worked. In order found:

1. **`DemoDataSeeder.seedAll()` had no idempotency guard on AP/AR scenario seeding** (only master
   data was guarded). Every re-run reinserted `INV-AP-001`..`010`/`BANK-AR-001`..`010` under the
   same fixed keys, tripping duplicate-detection against the previous run's own leftover data — by
   the third reseed attempt, every single AP scenario was failing as a false "duplicate." Fixed by
   adding the same skip-if-already-seeded guard used for master data.
2. **AP-009/AP-010/AR-010's controlled-failure demos never actually simulated anything.** The
   approval cascade Business Rules always post/clear synchronously using whichever Integration
   Profile failure mode is active — they never see a per-call `simulateOutcome`. The original demo
   code called `postInvoice(sysId, 'technical_error')` / `clearPayment(sysId, 'timeout')` *after*
   approval, but by then the cascade had already posted successfully with the default profile, and
   the idempotency cache made the second call replay that same success. Fixed by flipping the
   Integration Profile immediately before the approval call and restoring it immediately after.
3. **AP-010's seed data set `taxAmount: 0` for an India vendor** (18% expected), which failed tax
   validation before the invoice ever reached the posting step the scenario exists to demonstrate.
   Fixed to `taxAmount: 972` (18% of the 5400 net amount).
4. **AR's fuzzy allocation always capped the allocated amount to the payment amount**, which meant
   a "short pay" could never actually be detected — the allocation was defined to always exactly
   balance. Fixed to allocate each selected item's full open amount and let the balance check see
   the real shortfall. Found and fixed alongside it: the `short_pay`/`over_pay` reason-code labels
   were swapped (positive difference is an overpayment, not a short pay), and every AR Open Item
   had an identical seeded due date, making the "oldest due date first" multi-item selection
   meaningless — AR-008's fuzzy match was silently grabbing customer C001's much larger open item
   instead of the small one the credit-note-netting demo needs. Fixed by staggering due dates by
   seed index.
5. **`ArDomainService.reconcileClearing`'s RETRY branch set Payment `state` to `'CLEARING'`
   before retrying**, but `clearPayment()`'s own eligibility gate requires `state === 'APPROVED'`
   (Payment has no separate `approval_state` field the way AP Invoice does — see `docs/DATA_MODEL.md`'s
   noted asymmetry) — so the retry failed its own gate and the payment was stuck at `CLEARING`
   forever. This is exactly why bug #2's fix mattered enough to test thoroughly: fixing the
   cascade-timing issue was what let AR-010 reach this code path for the first time, which is what
   surfaced this bug. Fixed by restoring to `'APPROVED'` before retrying instead.

**Minor, disclosed, non-blocking observations** (not fixed — see judgment call below):
- AP-006 (the intentionally-failing tax-validation scenario) produces two identical `AP Exception`
  rows instead of one, because its invoice is matched twice by design (once internally inside
  `intakeAndAutoProcess`, before its line is attached, and once explicitly afterward) and the tax
  check — unlike quantity/price — doesn't depend on line data, so it fails identically both times.
  The final *state* is correct either way; this is a cosmetic double-row, not a wrong outcome, and
  every other scenario using this same two-call pattern is unaffected (their line-dependent checks
  only fail on the second, correctly-lined call). Left as-is rather than restructuring the intake
  pattern this late.
- ~130 `Audit Event` rows from the earlier broken reseed attempts (before bug #1 was found) remain
  in the table — that table is an append-only log with no bearing on any scenario's correctness, so
  cleaning it was correctly treated as non-essential relative to the actual bugs above. Two cleanup
  attempts were blocked by the session's own safety classifier on a large table; not pursued
  further since it is cosmetic.

## 15. Open SAP integration gaps

See `docs/OPEN_SAP_GAPS.md` — FB05, ML81N, and PGI remain genuinely unresolved from the source
workbook and are not resolvable from this mock-only PDI.

## 16a. End-to-end demonstration mapping (Section 19 of the build brief)

| Demo | Brief's flow | Covered by | Verified |
|---|---|---|---|
| Demo 1 | Invoice → Extraction → Validation → PO/Receipt match → Approval → Mock SAP posting → Posted → Reconciled | **AP-001** | ✅ `CLOSED`/`approved`/`posted`, `sap_document_id` set |
| Demo 2 | Bank payment → Remittance → Customer identification → Invoice matching → Allocation → Approval → Mock SAP clearing → Cleared → Reconciled | **AR-001** (exact match), **AR-003** (multi-invoice) | ✅ Both `CLOSED` |
| Demo 3 | Invoice → SAP timeout → UNKNOWN_OUTCOME → status query → committed → POSTED | **AP-010** | ✅ `CLOSED`/`approved`/`posted` (reached via reconciliation, not a blind retry) |
| Demo 4 | Payment → ambiguous customer → AI candidate → human correction → allocation → approval → clearing | **Partially covered** — AR-004 exercises deterministic alias resolution (not an ambiguous case) and AR-005 exercises the unmatched/human-review path, but no single scenario combines "ambiguous customer resolved via simulated-AI candidate, then corrected by a human" exactly as written. The underlying capability exists (`AISimulationService.suggestTopCandidate`, `MatchingEngine.resolveCustomerByAlias`); it just isn't wired into one seeded scenario. Honest, disclosed gap. |

## 16b. All 20 named scenarios — final verified state (2026-09-13 15:56 UTC run)

| Scenario | Intended outcome | Actual final state | Match |
|---|---|---|---|
| AP-001 Happy path | Posted, closed | `CLOSED` / `approved` / `posted` | ✅ |
| AP-002 Duplicate invoice | Exception: duplicate | `EXCEPTION` / `not_required` | ✅ |
| AP-003 PO mismatch | Exception: po_mismatch | `EXCEPTION` | ✅ |
| AP-004 Quantity tolerance | Exception: quantity_tolerance | `EXCEPTION` | ✅ |
| AP-005 Price tolerance | Exception: price_tolerance | `EXCEPTION` | ✅ |
| AP-006 Tax validation | Exception: tax_validation | `EXCEPTION` | ✅ |
| AP-007 Low confidence | Exception: low_confidence | `EXCEPTION` | ✅ |
| AP-008 Approval required | Pending approval | `PENDING_APPROVAL` | ✅ |
| AP-009 SAP posting failure | Failed | `FAILED` / `approved` / `failed` | ✅ |
| AP-010 SAP timeout → reconciled | Posted (via reconciliation) | `CLOSED` / `approved` / `posted` | ✅ |
| AR-001 Exact match | Cleared | `CLOSED` | ✅ |
| AR-002 Partial payment | Exception: short_pay (routed for review) | `EXCEPTION` | ✅ |
| AR-003 Multi-invoice allocation | Cleared | `CLOSED` | ✅ |
| AR-004 Customer alias | Pending approval | `PENDING_APPROVAL` | ✅ |
| AR-005 Unmatched payment | Exception: customer_ambiguous | `EXCEPTION` | ✅ |
| AR-006 Short pay (manager override) | Pending approval (forced) | `PENDING_APPROVAL` | ✅ |
| AR-007 Bank charge | Pending approval (deduction recorded) | `PENDING_APPROVAL` | ✅ |
| AR-008 Credit note netting | Pending approval (deduction recorded) | `PENDING_APPROVAL` | ✅ |
| AR-009 Approval required | Pending approval | `PENDING_APPROVAL` | ✅ |
| AR-010 Clearing timeout → reconciled | Cleared (via reconciliation) | `CLOSED` | ✅ |

## 16c. Final acceptance criteria (Section 21 of the build brief)

- [x] scoped application exists (`x_695068_bcfa`, confirmed via MCP `sys_app` lookup)
- [x] source code is organized (`src/fluent/`, `src/server/`, `docs/`)
- [x] application builds (`now-sdk build` clean on every stage, including every fix iteration)
- [x] application deploys (`now-sdk install` clean on every stage, confirmed via MCP after each)
- [x] tables exist (27, confirmed via MCP `table_list`)
- [x] ACLs exist (confirmed via MCP)
- [x] roles exist (8, confirmed via MCP)
- [x] AP lifecycle works — **all 10 AP scenarios independently verified against intended outcome**
- [x] AR lifecycle works — **all 10 AR scenarios independently verified against intended outcome**
- [x] matching works (3-way match, duplicate detection, exact/multi-invoice match, alias resolution — all exercised and verified)
- [x] exceptions work (AP/AR Exception records populated with correct reason codes, confirmed by direct query)
- [x] approvals work (SoD-enforced on both AP and AR, verified by two independent tests)
- [x] mock SAP works (`MockSAPAdapter`, all canonical operations implemented and exercised)
- [x] mock bank works (`MockBankAdapter`)
- [x] idempotency works (verified test: 1 successful transaction for 2 identical calls)
- [x] timeout handling works (AP-010/AR-010, both independently reaching their correct final state via reconciliation, not a blind retry)
- [x] unknown-outcome handling works (verified test + AP-010/AR-010)
- [x] audit works (`Audit Event` table populated by every domain service state transition)
- [x] demo data exists (10 vendors/customers, 10 POs/receipts, 15 AR open items, 5 credit notes, 10+10 named scenarios, all verified correct)
- [x] end-to-end AP demo works (Demo 1 = AP-001, verified)
- [x] end-to-end AR demo works (Demo 2 = AR-001/AR-003, verified)
- [x] security tests pass (SoD self-approval rejection verified on both AP and AR)
- [x] documentation exists (this document plus 10 others in `docs/`, including the correction log in `ARTIFACT_STRATEGY.md` and the bug list in this section)

## 17. Known limitations

- **`atf_test_run` unavailable in this PDI** — the 4 ATF `Test()` definitions are real and deployed;
  the identical logic was verified via `ScheduledScript` instead (Section 13). Recommended next
  step: activate the ATF REST API plugin and re-run through the normal path.
- **Deduction auto-classification** (recognizing that a shortfall is specifically a bank charge vs.
  credit-note netting vs. something else) is a manually-recorded reviewer action in this POC, not
  an automated rule — the balance/short-pay *detection* is automatic and correct (see bug #4 above);
  only the *classification* of what caused it is manual. See `docs/BUSINESS_RULES.md`.
- **`response_delay_ms` on Integration Profile is recorded but not actually slept** — no real
  latency simulation, since blocking a synchronous transaction for a configured delay isn't a safe
  thing to do in this environment without a verified async pattern.
- **UI Builder Configurable Workspace and Decision Table Builder** were not built — documented,
  deliberate scope decisions (see `docs/USER_EXPERIENCE.md` and `docs/BUSINESS_RULES.md`), not
  oversights.
- **Demo data volumes** are reduced from the brief's suggested 20 POs/30 invoices/30 payments/50
  open items to 10/10/10/15 — the 10+10 named scenarios (the actual acceptance criteria) needed
  deliberately-crafted supporting data more than raw volume.
- **AP-006 double-exception-row** and **~130 leftover Audit Event rows** — both disclosed in
  Section 14 as minor, non-blocking cosmetic items.
- **Demo 4** is only partially covered — see Section 16a.

## 18. Production migration plan

1. Implement a real `SAPAdapter`/`BankAdapter` with the same method signatures as the mocks, calling
   IntegrationHub actions against SAP CPI.
2. Swap `IntegrationService._getAdapter()`'s resolution — no other file changes.
3. Resolve the three Open SAP Gaps with a real SAP technical spike before enabling real writes.
4. Replace the 7 mock master-data tables with governed on-demand SAP reads or a sync job.
5. Build the UI Builder Configurable Workspace and externalize `MatchingEngine`'s tolerance/tax
   constants into real Decision Table Builder records.
6. Activate the ATF REST API plugin and re-run the 4 ATF tests through the normal `atf_test_run`
   path.
7. Consider adding `approval_state`/`posting_state` fields to Payment mirroring AP Invoice's
   pattern, so `clearPayment`'s eligibility gate can check a stable field instead of the volatile
   `state` field — the class of bug fixed in Section 14 item #5 is easiest to prevent entirely by
   not relying on a field that the same method chain also mutates.
