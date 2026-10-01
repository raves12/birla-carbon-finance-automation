# FINAL_E2E_TEST_RESULTS.md

Results are recorded only from actual runs on `pwcmanagementservicesdemo01`. **NOT YET RUN** means the run is waiting on the Phase 35 deploy (`docs/build/PLAYBOOK_BUILD_AND_ACTIVATION.md` §0).

## 1. ATF: BCFA Regression, existing 13 tests (2026-10-01, serial, one at a time)

Run from Scripts - Background (`sn_atf.ExecuteUserTest`), on the instance as deployed through Phase 34. Results read from `sys_atf_test_result`.

| # | Test | Result | Time (UTC) |
|---|---|---|---|
| 1 | Idempotency — duplicate financial write produces one transaction | Success | 08:15:09 |
| 2 | Segregation of Duties — service layer rejects self-approval | Success | 08:19:02 |
| 3 | Unknown Outcome Control — timeout resolves without blind retry | Success | 08:20:20 |
| 4 | Matching Engine — AP duplicate, PO, GRN, quantity, price, tax, totals | Success | 08:20:26 |
| 5 | Matching Engine — AR reference, amount, currency, alias, combinations, residuals | Success | 08:20:33 |
| 6 | Lifecycle — illegal state change refused and audited, legal one allowed | Success | 08:20:40 |
| 7 | Orchestration — flow hand-off, inline mode and state-guarded stages | Success | 08:20:46 |
| 8 | AI guardrails — injection screening and completed-action claims | Success | 08:20:54 |
| 9 | AI identity — least privilege and never an approver | Success | 08:21:01 |
| 10 | Audit trail — events cannot be changed or deleted | Success | 08:21:07 |
| 11 | Matching — ambiguous exact combinations are never chosen by the engine | Success | 08:21:15 |
| 12 | Demo reset — refused without the confirmation text | Success | 08:21:23 |
| 13 | Finance Operations KPIs — all 19 computed | Success | 08:21:30 |

**13 / 13 passed.**

## 2. ATF: Playbook phase, 22 tests (PB-AP-001..006, PB-AR-001..009, PB-UI-001..007)

**NOT YET RUN.** The tests are part of the Phase 35 deploy. Run them after the deploy, Playbook activation and backfill, one at a time (`TEST_PLAN.md` lists the sys_ids).

| Group | Tests | Result |
|---|---|---|
| PB-AP | 6 | NOT YET RUN |
| PB-AR | 9 | NOT YET RUN |
| PB-UI | 7 | NOT YET RUN |

## 3. Fresh-transaction E2E (mandate Phases 7 and 8)

Script `scripts/deploy/phase35_e2e_bg.js`, scope `x_695068_bcfa`, after the Phase 35 deploy.

| Scenario | What it proves | Result |
|---|---|---|
| AP-A clean invoice | matched without exception, MIRO posting, one transaction, audit, journey complete | NOT YET RUN |
| AP-B quantity variance | match failure → exception → journey blocked with WHY → override without reason refused → human override → approval → posting → CLOSED | NOT YET RUN |
| AP-C duplicate | detected; override refused by policy; rejected; never posted | NOT YET RUN |
| AP-D low confidence | human review required; stops at extraction; no match | NOT YET RUN |
| AP-E posting failure | FAILED, not closed, failure recorded, stage 7 blocked | NOT YET RUN |
| AP-F unknown outcome | UNKNOWN_OUTCOME, reconciliation, at most one successful posting | NOT YET RUN |
| AR-A exact match | allocation = payment, residual 0, FB05, open item settled, closed | NOT YET RUN |
| AR-B multi-invoice | two allocations, residual 0, cleared | NOT YET RUN |
| AR-C short pay / bank charge | residual 500 → short-pay exception → human bank-charge deduction → approval → cleared | NOT YET RUN |
| AR-D customer alias | deterministic alias resolution | NOT YET RUN |
| AR-E ambiguous | no guess, no allocation, stage 3 blocked | NOT YET RUN |
| AR-F late remittance | unresolved, then the remittance resumes processing | NOT YET RUN |
| AR-G DRAFT | SAP_DRAFT, PARK document, open item untouched, pending check changes nothing | NOT YET RUN |
| AR-H DIRECT | FB05 clearing, closed | NOT YET RUN |
| AR-I unknown outcome | UNKNOWN_OUTCOME, reconciliation, no duplicate clearing | NOT YET RUN |

### Earlier verified E2E runs (for reference, not this phase)

| Phase | Run | Source |
|---|---|---|
| 12 | AP journey live, document upload to closure; quantity variance override; duplicate rejected | `POC1_AP_JOURNEY.md` |
| 13 | Cash journey live: exact, multi-invoice, bank charge | `POC2_CASH_JOURNEY.md` |
| 25 | Flow-mode E2E: INV-P25-902939 and BANK-P25-902939, all flows COMPLETE | `AUTOMATED_FLOWS.md` |

## 4. Manual tests

`MANUAL_TEST_CASES.md` (MT-AP, MT-AR, MT-SEC, MT-UI). **NOT YET RUN** in this phase.
