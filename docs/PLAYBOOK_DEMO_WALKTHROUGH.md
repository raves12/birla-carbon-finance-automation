# PLAYBOOK_DEMO_WALKTHROUGH.md: five demo walkthroughs with the Playbook (Phase 35)

These walkthroughs add the Playbook to the POC demo (`POC_DEMO_SCRIPT.md`, which keeps the cast, the day-before checks and "If something goes wrong").

**Data.** The demo uses the seeded data:

- AP-PLAY-01..04 and AR-PLAY-01..07 (`DEMO_DATA.md`);
- the baseline AP and AR scenarios;
- the POC 2 cash journeys.

**Say at the start.** Document reading is **SIMULATED DOCUMENT EXTRACTION — POC**, and SAP is **MOCK SAP**. Both labels are visible on every screen used below.

**Playbook URL.** Open Playbook (form, Related Links) opens the BCFA Workspace Playbook page, `/x/695068/bcfa/playbook/<table>/<sys_id>`. If a workspace tab shows "Not found" from an earlier visit, close it first.

Column legend: **Persona**; **Navigation**; **Record**; **Action**; **Expected UI**; **State** (expected); **Automation** (background); **Records** (database records created); **Evidence** (logs and audit).

## DEMO 1: AP happy path

Supplier invoice → upload → extraction → validation → PO/GRN → match → Playbook → approval → MOCK SAP → closure.

| # | Persona | Navigation | Record | Action | Expected UI | State | Automation | Records | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | AP processor | BCFA Workspace → Document Intake → New | new intake, type AP Invoice, attach a clean fixture not yet used (e.g. after a reset `AP_INV_001_CLEAN.pdf`) | **Process Document** | intake Completed; link to the new invoice | invoice RECEIVED → EXTRACTED | AP Invoice Intake Flow | `finance_intake`, `ap_invoice`, `ap_extraction`, `ap_invoice_line` | audit "AP Invoice RECEIVED → EXTRACTING → EXTRACTED"; extraction source SIMULATED |
| 2 | AP processor | invoice form → **Open Playbook** | the new invoice | watch stages 1–4 | stages 1 Intake and 2 Extraction complete; stage 2 title "SIMULATED DOCUMENT EXTRACTION — POC" | VALIDATED → MATCHED | AP Validation Flow (validation, duplicate, tax, 3-way match) | `ap_match` (variances 0, within tolerance) | audit validation and match events |
| 3 | AP processor | Playbook stage 4 | Match results list | read | PO line / receipt / variances / "within tolerance" from MatchingEngine | MATCHED → PENDING_APPROVAL | AP Approval Flow (decision table) | `ap_approval` (pending) | audit approval requested |
| 4 | Finance approver | AP › Approvals | the approval | **Approve** + comment | Playbook stage 6 completes | APPROVED → POSTING → POSTED | AP Integration Flow → IntegrationService → MockSAPAdapter | `integration_txn` (postVendorInvoice, success, MIRO…, idempotency key) | audit approval decided (SoD result), integration result |
| 5 | Finance approver | Playbook stages 7–8 | | read | stage 7 lists the MOCK SAP transaction; stage 8 the AI assistance and audit trail | RECONCILED → CLOSED | reconcile and close | archive (mock) | audit closure |

**Shortcut.** Open INV-PLAY-01, already closed with all 8 stages complete, and walk the stages.

## DEMO 2: AP exception

Invoice → quantity variance → exception → Playbook blocked → AI explanation → human decision → approval → MOCK SAP → closure.

| # | Persona | Navigation | Record | Action | Expected UI | State | Automation | Records | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Finance approver | AP invoice INV-AP-004 → **Open Playbook** | INV-AP-004 | read | stages 1–3 complete; stage 4 open with **Blocked Because**: "WHAT HAPPENED: AEX… Quantity tolerance (high) at 3-Way Match / WHY: 15 invoiced vs 10 received …"; **Next**: Request Correction, Hold or Reject; **Who**: AP Processor | EXCEPTION | — | — | journey fields on the invoice |
| 2 | Finance approver | Playbook stage 5 | Exceptions list | open the exception | columns SYSTEM DETERMINATION (rule result, variance), AI RECOMMENDATION, HUMAN DECISION (empty) | EXCEPTION | — | — | — |
| 3 | Finance approver | exception form | | **Explain with Now Assist** | AI explanation and recommendation (advisory) | unchanged (AI never decides) | Now Assist skill via the BCFA guard | `ai_interaction` | AI Interaction Log; audit AI note |
| 4 | AP processor, then finance approver | exception form | | the processor saves the **Decision Reason**; the approver clicks **Approve Override** (the approver cannot type the reason: D6) | HUMAN DECISION filled (decision, decided by) | RESOLUTION → MATCHED → PENDING_APPROVAL → APPROVED | AP Exception Flow (re-match), approval (maker/checker) | `ap_approval` | audit override, decision, approval |
| 5 | Finance approver | Playbook | | refresh | stage 5 completes (no open exceptions), 6 completes, 7 posting MOCK SAP, 8 closure | POSTED → CLOSED | AP Integration Flow | `integration_txn` | audit integration result, closure |

**Blocked state without acting.** INV-PLAY-02 (price variance) stays blocked at stage 4.

## DEMO 3: AR exact match

Payment + remittance → customer → open item → match → allocation → approval → DIRECT / DRAFT processing → closure.

| # | Persona | Navigation | Record | Action | Expected UI | State | Automation | Records | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | AR processor | Cash Application › Payments → BANK-POC2-001 → **Open Playbook** | BANK-POC2-001 | read | stage 1 "PAYMENT ONLY: no remittance received yet"; stage 3 blocked (customer unknown) | EXCEPTION (customer ambiguous) | — | — | journey |
| 2 | AR processor | Document Intake → New | `AR_REMIT_101_EXACT.pdf`, type AR Remittance | **Process Document** | intake: "Remittance linked to Payment BANK-POC2-001 …" | → CUSTOMER_RESOLUTION → MATCHING → PENDING_APPROVAL | AR Remittance Processing Flow → AR Match Flow → AR Approval Flow | `remittance`, `match_candidate`, `payment_allocation`, `ar_approval` | audit customer resolved, matched, allocated |
| 3 | AR processor | Playbook stages 2–5 | | read | stage 2 SIMULATED remittance; 3 customer resolved; 4 customer open items (MOCK SAP reference data); 5 allocation ARINV1001 50,000, residual 0 | PENDING_APPROVAL | — | — | — |
| 4 | Admin | System Properties | `x_695068_bcfa.ar.sap_processing_mode` | set **draft** (or leave **direct**) | — | — | — | — | — |
| 5 | Finance approver | Cash Application › Approvals | the approval | **Approve** | DIRECT: stage 8 completes, FB05… · DRAFT: stage 8 "waiting": "staged in SAP as a DRAFT (MOCK SAP PARK…) … Nothing is cleared yet" | DIRECT: CLEARED → CLOSED · DRAFT: SAP_DRAFT | AR Clearing Flow → IntegrationService → MockSAPAdapter | `integration_txn` (clearCustomerPayment, mode in payload) | audit integration result "SAP processing mode DRAFT" |
| 6 | Integration operator | payment form | (DRAFT only) | set `x_695068_bcfa.mock_sap.draft_outcome` = posted → **Check SAP Draft Status** | message "SAP confirmed the draft (MOCK SAP): cleared as FB05…"; stage 8 and 9 complete | CLEARED → CLOSED | status query (no re-send) | allocations cleared, open item 0 | audit "SAP draft posted" |
| 7 | Admin | System Properties | | set the mode back to **direct** and draft outcome to **pending** | | | | | |

**Seeded shortcuts**

- AR-PLAY-01: DIRECT, closed.
- AR-PLAY-02: DRAFT, waiting.
- AR-PLAY-03: DRAFT, confirmed.

## DEMO 4: AR short pay

Payment → residual → deduction → AI recommendation → human decision → approval → SAP → closure.

| # | Persona | Navigation | Record | Action | Expected UI | State | Automation | Records | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | AR processor | BANK-PLAY-04 → **Open Playbook** | BANK-PLAY-04 (9,900 against 10,400) | read | stage 5 allocation 10,400, residual −500; stage 6 blocked: "Short pay … WHY: FAIL allocation balance … residual 500 short"; Next: "Classify the residual: Approve Deduction …"; Who: AR Processor | EXCEPTION (short pay) | — | — | journey |
| 2 | AR processor | stage 6 → exception | | **Explain with Now Assist** | AI RECOMMENDATION (e.g. likely bank charge or short pay) | unchanged | Now Assist | `ai_interaction` | AI log |
| 3 | AR processor | exception | | **Approve Deduction**, type Short Pay (or Bank Charge) + reason | HUMAN DECISION recorded; Deductions list shows the deduction | → PENDING_APPROVAL | ArDomainService.advanceAfterDeduction (allocated − deductions = payment) | `deduction` | audit deduction approved |
| 4 | Finance approver | Approvals | | **Approve** | stages 6, 7 complete; 8 clears (MOCK SAP) | CLEARED → CLOSED | AR Clearing Flow | `integration_txn` | audit |

## DEMO 5: AR ambiguous

Payment → ambiguous customer / invoice → Playbook blocked → AI evidence → human resolution → allocation → approval → clearing.

| # | Persona | Navigation | Record | Action | Expected UI | State | Automation | Records | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | AR processor | BANK-PLAY-05 (or BANK-POC2-002) → **Open Playbook** | | read | stage 3 blocked: "Customer ambiguous … WHY: remitter name … did not resolve to a customer"; Next: "Wait for or upload the remittance …"; candidates list (system ranking) | EXCEPTION (customer ambiguous) | — | — | journey |
| 2 | AR processor | exception | | **Explain with Now Assist** | AI evidence and candidate ranking; AI cannot commit a customer | unchanged | Now Assist | `ai_interaction` | AI log |
| 3 | AR processor | Document Intake | `AR_REMIT_102_MULTI_INVOICE.pdf` for BANK-POC2-002 | **Process Document** | customer resolved from the remittance (human-supplied evidence); stage 3 completes | → MATCHING → PENDING_APPROVAL | Remittance Processing → Match | allocations ARINV2001 + ARINV2002 | audit |
| 4 | Finance approver | Approvals | | **Approve** | stages 7–9 complete | CLEARED → CLOSED | AR Clearing Flow | `integration_txn` | audit |

BANK-PLAY-05 has no remittance fixture. It stays blocked: use it to show the blocked state and the Request Clarification / Hold actions.
