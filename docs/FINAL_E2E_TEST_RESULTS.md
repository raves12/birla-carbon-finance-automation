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

## 1b. ATF: full BCFA Regression after all Phase 35 changes (2026-10-01)

All 35 tests (13 existing + 22 PB-*) were run serially after:

- the Phase 35 deploy;
- Playbook activation;
- backfill and seeding;
- the bank-charge fix (D1);
- the PB-UI-006 test fix (D3).

**35 / 35 passed.** PB-UI-004 and PB-UI-005 were rerun after the Open Playbook change (D4): both passed.

## 1c. Playbook demo transactions (backfill and seed, 2026-10-01)

| Scenario | Landed | Playbook run |
|---|---|---|
| AP-PLAY-01 | CLOSED, stage 9 complete | Complete |
| AP-PLAY-02 | EXCEPTION, stage 4 blocked | In progress |
| AP-PLAY-03 | PENDING_APPROVAL, stage 6 action required (Finance Approver) | In progress |
| AP-PLAY-04 | UNKNOWN_OUTCOME at seeding → reconciled by the AP Reconciliation Flow → CLOSED | Complete |
| AR-PLAY-01 | CLOSED (DIRECT) | Complete |
| AR-PLAY-02 | SAP_DRAFT, stage 8 waiting (SAP user / Integration Operator) | In progress |
| AR-PLAY-03 | CLOSED (DRAFT confirmed) | Complete |
| AR-PLAY-04 | EXCEPTION short pay, stage 6 blocked | In progress |
| AR-PLAY-05 | EXCEPTION customer ambiguous, stage 3 blocked | In progress |
| AR-PLAY-06 | PENDING_APPROVAL, stage 7 action required | In progress |
| AR-PLAY-07 | UNKNOWN_OUTCOME at seeding → reconciled by the AR Reconciliation Flow → CLOSED | Complete |

**Live UI check.**

- **Open Playbook** on BANK-PLAY-02 opens the native Playbook Experience: "SAP processing (DRAFT / DIRECT) — MOCK SAP", Waiting for SAP, PARK reference, Blocked Because, Next and Owner.
- INV-PLAY-02 shows "PO / GRN-SRN / 3-way match", Blocked: price tolerance.

**BCFA Workspace Playbook page (2026-10-05).**

- `/x/695068/bcfa/playbook/x_695068_bcfa_payment/<BANK-PLAY-02>`: all 9 AR stages, with 1–7 complete and 9 pending. Stage 8 "SAP Draft / Direct Processing" is in progress (1/2). Its card shows Draft staged in SAP (PARK1014846), WHAT HAPPENED / WHY, the next action and the owner (SAP user / Integration Operator).
- INV-PLAY-02: all 8 AP stages, with 1–3 complete and stage 4 (3-way match) and the stage 5 exception lane in progress.
- **Open Playbook** on the BANK-PLAY-02 form opens the same workspace page.
- PB-UI-004 (route → active screen under the shell → BCFA page with the Playbook component) and PB-UI-005 were rerun: both passed.

## 2. ATF: Playbook phase, 22 tests (PB-AP-001..006, PB-AR-001..009, PB-UI-001..007)

Run 2026-10-01 after the deploy, activation and backfill, one at a time.

| Group | Tests | Result |
|---|---|---|
| PB-AP | 6 | 6 passed |
| PB-AR | 9 | 9 passed |
| PB-UI | 7 | 7 passed. PB-UI-006 failed on its first run (test defect D3), fixed and passed |

**22 / 22 passed.**

## 3. Fresh-transaction E2E (mandate Phases 7 and 8): **16 / 16 PASS** (run 6ABE1, 2026-10-01)

Script `scripts/deploy/phase35_e2e_bg.js`, scope `x_695068_bcfa`, inline pipeline, signed in as the admin. Every run creates its own POs, receipts, open items and (AR-C / C2) customers; amounts carry a per-run offset.

| Scenario | Result | Evidence (checks that passed) |
|---|---|---|
| AP-A clean invoice | PASS | matched without exception; 3-way match within tolerance; approved; posted MIRO…; one posting; audit trail; journey 9 complete |
| AP-B quantity variance | PASS | match failure → quantity tolerance exception; journey stage 4 blocked with WHY; override without a reason refused; **override refused by SoD for a user who is not an authorised approver**, nothing changed. **Completed 2026-10-05 (MT-AP-17):** the reason was entered first (D6), then `bcfa.finance.controller` approved the override on APEX0001065. Result: SoD check passed and recorded; one posting, MIRO1052731 (attempt 1); archived; CLOSED; journey complete; full audit trail |
| AP-C duplicate | PASS | duplicate detected; stage 3 blocked; override refused by policy; rejected; never posted |
| AP-D low confidence | PASS | low-confidence exception; stage 2 blocked; no match created |
| AP-E posting failure | PASS | FAILED, not closed; failed integration transaction; stage 7 blocked |
| AP-F unknown outcome | PASS | UNKNOWN_OUTCOME; stage 7 blocked; reconciled by status query; one posting only; closed |
| AR-A exact match | PASS | allocation = payment, residual 0; FB05 (MOCK SAP); open item settled; one clearing; journey 10 complete |
| AR-B multi-invoice | PASS | two allocations, residual 0, cleared, both items settled |
| AR-C short pay / bank charge | PASS | bank line then remittance (50,000 + 29,500 applied, 500 bank charge note); allocated 80,000, residual −500; rule suggests BANK_CHARGE; human approves the deduction (500); approved; cleared; both items settled |
| AR-C2 bank charge above the limit | PASS | residual −2,000 classified as bank charge → **refused** (limit 1,000); nothing recorded; stays in exception |
| AR-D customer alias | PASS | resolved to C005 by the confirmed alias; matched |
| AR-E ambiguous customer | PASS | no guess; no allocation; stage 3 blocked |
| AR-F late remittance | PASS | unresolved bank line; remittance resumes processing; customer resolved; matched |
| AR-G DRAFT mode | PASS | SAP_DRAFT, staged, PARK document; open item untouched; journey 8 waiting; pending check changes nothing, one clearing transaction |
| AR-H DIRECT mode | PASS | FB05 clearing; closed |
| AR-I unknown outcome | PASS | UNKNOWN_OUTCOME; stage 8 blocked; reconciled; no duplicate clearing; closed |

### Defects found by the E2E runs and fixed

| # | Defect | Fix | Verified |
|---|---|---|---|
| D1 | A bank-charge deduction of any amount could be approved (a 7,300 residual across two open items was accepted as a "bank charge"); the bank charge limit was only used to suggest the type | `ArExceptionDecisionService` refuses a bank charge above `x_695068_bcfa.ar.bank_charge.max_amount` | AR-C2 PASS; AR-C (500) PASS |
| D2 | Playbook records written by Fluent (schema 3) could not be read by the Yokohama designer (55 errors, Activate disabled) | start-rule conversion appended to the deploy (`gen_playbook_yokohama_fix.py`) | both Playbooks validated and activated |
| D3 | Test PB-UI-006 read `sys_choice` from the app scope | uses the field's own choice list | PB-UI-006 PASS |
| D5 | The BCFA Workspace Playbook page answered "Page not found": the screen had no parent macroponent, so the workspace left the route out of its route table | screen parent = workspace shell; page definition in the BCFA scope | live check 2026-10-05; PB-UI-004 PASS |

Earlier runs of the E2E script (BB6BE, CA9C9, B3EC9, E65D9, F3ADD, 137E5) failed on test-data problems: amounts colliding with open items left by earlier runs, item numbers over 20 characters, and a wrong residual sign in a check. They also surfaced D1. Each fix is in the script history.

### Earlier verified E2E runs (for reference, not this phase)

| Phase | Run | Source |
|---|---|---|
| 12 | AP journey live, document upload to closure; quantity variance override; duplicate rejected | `POC1_AP_JOURNEY.md` |
| 13 | Cash journey live: exact, multi-invoice, bank charge | `POC2_CASH_JOURNEY.md` |
| 25 | Flow-mode E2E: INV-P25-902939 and BANK-P25-902939, all flows COMPLETE | `AUTOMATED_FLOWS.md` |

## 4. Manual tests

`MANUAL_TEST_CASES.md` (MT-AP, MT-AR, MT-SEC, MT-UI). **Not run as a manual pass in this phase.** Their system behaviour is covered by the ATF and E2E runs above. MT-AP-17 (override approval by an authorised approver) was run on 2026-10-05: **PASS**, with the defect D6 workaround (the approver cannot edit the Decision Reason, so it is entered first).
