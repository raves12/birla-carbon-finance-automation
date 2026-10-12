# MANUAL_TEST_CASES.md: BCFA manual test coverage (Phase 35)

Every implemented feature has at least one manual test, and every exception has a negative test. Automated equivalents are in `TEST_PLAN.md`.

## How to run

- **Environment.** BCFA Workspace (`/now/bcfa/home`) or the classic forms.
- **Personas.** The demo users (`DEMO_DATA.md`): `bcfa.ap.processor`, `bcfa.finance.approver`, `bcfa.ar.processor`, `bcfa.finance.controller`.
  - An admin impersonates them (user menu → Impersonate User).
  - No passwords are set or needed.
- **Data.** Start from the seeded baseline:
  - AP-001..010 and AR-001..010;
  - POC 2 cash journeys;
  - AP-PLAY-01..04 and AR-PLAY-01..07.
  - Reset with `DemoDataSeeder.resetAndReseed('RESET BCFA DEMO DATA')`.
- **Recording.** Record the result (Pass / Fail with evidence) in `FINAL_E2E_TEST_RESULTS.md`.

"Journey" below means the record's `journey_*` fields and the Playbook.

## AP

| ID | Feature | Persona | Steps | Expected | Negative? |
|---|---|---|---|---|---|
| MT-AP-01 | Intake | AP Processor | Finance Intake → New → attach `AP_INV_001_CLEAN.pdf`, document type AP invoice → Submit → **Process Document** | Intake processed; AP invoice created; correlation ID shared; journey stage 1 → 2 | |
| MT-AP-02 | Extraction (simulated) | AP Processor | Open the invoice from MT-AP-01 → Review Summary and extraction record | Extracted header and lines; label **SIMULATED DOCUMENT EXTRACTION — POC**; confidence shown | |
| MT-AP-03 | Low confidence | AP Processor | Open INV-AP-007 | EXCEPTION low confidence; journey stage 2 blocked: WHAT / WHY (confidence below threshold) / NEXT / WHO | yes |
| MT-AP-04 | Correction / reprocess | AP Processor | Intake record of a document → **Reprocess**; or **Send to Manual Review** | Re-extraction recorded and audited; manual review sets requires review | |
| MT-AP-05 | Vendor | AP Processor | Create an invoice with an inactive or unknown vendor (or edit the PO vendor) → **Re-run Validation** | Exception vendor invalid; stage 3 blocked | yes |
| MT-AP-06 | PO | AP Processor | Open INV-AP-003 | Exception PO mismatch; stage 3 blocked | yes |
| MT-AP-07 | GRN missing | AP Processor | Invoice line without a receipt → **Re-run Match** | Exception GRN missing; stage 4 blocked | yes |
| MT-AP-08 | Duplicate | AP Processor | Open the duplicate of INV-AP-001 (AP-002) | Exception duplicate; stage 3 blocked | yes |
| MT-AP-09 | Quantity variance | AP Processor | Open INV-AP-004 | Exception quantity tolerance with variance and tolerance; stage 4 blocked | yes |
| MT-AP-10 | Price variance | AP Processor | Open INV-PLAY-02 (or INV-AP-005) | Exception price tolerance; match result shows price variance; stage 4 blocked | yes |
| MT-AP-11 | Tax variance | AP Processor | Open INV-AP-006 | Exception tax validation; stage 3 blocked | yes |
| MT-AP-12 | Exception actions | AP Processor | On an open exception: **Request Correction**, **Hold**, **Resolve & Retry** | Each action recorded with decision and comment; Resolve & Retry re-validates; journey refreshes | |
| MT-AP-13 | AI explanation | AP Processor | On an exception: **Explain with Now Assist** | AI explanation saved to the exception and the AI Interaction Log; state unchanged; journey still blocked | |
| MT-AP-14 | Approval | Finance Approver | INV-PLAY-03 → approval → **Approve** | Approved; posted to MOCK SAP; CLOSED; journey stages 6–8 complete | |
| MT-AP-15 | Rejection | Finance Approver | Another pending approval → **Reject** with a comment | Invoice REJECTED; journey status rejected; nothing posted | |
| MT-AP-16 | SoD | AP Processor (as requester) | Try **Approve** on an approval you requested | Refused (segregation of duties); audited | yes |
| MT-AP-17 | Override | AP Processor, then Finance Controller | On a tolerance exception: the AP processor enters the **Decision Reason** and saves; the finance controller clicks **Approve Override** (the approver cannot edit the reason field: defect D6) | Override recorded with the controller as decider; only the authorised role can do it | PASS 2026-10-05 (APEX0001065; D6 workaround) |
| MT-AP-18 | Posting | (system) | After MT-AP-14: integration transaction | `postVendorInvoice` success, adapter mock_sap, idempotency key, MIRO document; labelled MOCK SAP | |
| MT-AP-19 | Posting failure | Admin | Integration Profile Mock SAP - Default → failure mode technical_error → approve an invoice → set back to success | FAILED; exception; journey stage 7 blocked (Integration Operator) | yes |
| MT-AP-20 | UNKNOWN_OUTCOME | Integration Operator | Admin sets Mock SAP - Default failure mode `timeout`, approve a fresh invoice, set it back to `success`; open the invoice at once (or INV-PLAY-04's audit trail) | UNKNOWN_OUTCOME; journey stage 7 blocked: "never blindly re-sent"; within seconds the AP Reconciliation Flow resolves it by status query, with one posting only | yes |
| MT-AP-21 | Audit | Auditor | INV-AP-001 → Audit Events related list | Every state change, decision, AI note and integration call, with actor and before/after | |
| MT-AP-22 | Playbook | AP Processor | INV-PLAY-02 → **Open Playbook** | Playbook: stages 1–3 complete, 4 in progress with Blocked Because; stage 5 lists the exception with SYSTEM / AI / HUMAN columns | |

## AR

| ID | Feature | Persona | Steps | Expected | Negative? |
|---|---|---|---|---|---|
| MT-AR-01 | Payment | AR Processor | Open BANK-PLAY-01 | Bank payment fields; journey complete | |
| MT-AR-02 | Remittance | AR Processor | Upload a remittance (`AR_REMIT_101`) for BANK-POC2-001 via Finance Intake | Remittance linked; journey stage 2 (correlation) | |
| MT-AR-03 | Exact match | AR Processor | BANK-AR-001 / BANK-PLAY-01 | Allocation equals the open item; residual 0 | |
| MT-AR-04 | Partial | AR Processor | BANK-AR-002 | Short-pay exception; residual −3,500 | yes |
| MT-AR-05 | Short pay | AR Processor | BANK-PLAY-04 → exception → **Approve Deduction** (type short pay) | Deduction recorded (HUMAN DECISION); payment proceeds to approval | yes |
| MT-AR-06 | Overpayment | AR Processor | Payment above the open item | Over-pay exception; residual positive | yes |
| MT-AR-07 | Multi-invoice | AR Processor | BANK-AR-003 / BANK-POC2-002 | Allocations per open item; total equals payment | |
| MT-AR-08 | Customer alias | AR Processor | BANK-AR-004 | Customer resolved via confirmed alias | |
| MT-AR-09 | Ambiguous customer | AR Processor | BANK-PLAY-05 | Exception customer ambiguous; journey stage 3 blocked; AI may rank, cannot commit | yes |
| MT-AR-10 | Late remittance | AR Processor | Payment without remittance (PAYMENT ONLY) → upload the remittance later | Remittance Processing Flow resumes matching | |
| MT-AR-11 | Deduction / bank charge | AR Processor | BANK-AR-007 | Bank charge suggested by rule; reviewer confirms with **Approve Deduction** | |
| MT-AR-12 | AI | AR Processor | Exception → **Explain with Now Assist** | Explanation saved; nothing approved or cleared | |
| MT-AR-13 | Approval | Finance Approver | BANK-PLAY-06 → approval → **Approve** | Approved; cleared (DIRECT); CLOSED | |
| MT-AR-14 | DRAFT mode | Finance Approver, then Integration Operator | Property `x_695068_bcfa.ar.sap_processing_mode` = draft → approve a payment → **Check SAP Draft Status** (outcome pending) → set `x_695068_bcfa.mock_sap.draft_outcome` = posted → **Check SAP Draft Status** | SAP_DRAFT with PARK document and open item unchanged; then CLEARED → CLOSED; nothing re-sent (one clearing transaction) | |
| MT-AR-15 | DIRECT mode | Finance Approver | Mode direct → approve | Cleared immediately (FB05) | |
| MT-AR-16 | Draft rejected | Integration Operator | `draft_outcome` = rejected → **Check SAP Draft Status** on a SAP_DRAFT payment | FAILED; exception "SAP rejected the draft" | yes |
| MT-AR-17 | Failure | Admin | Mock SAP failure mode technical_error → approve | FAILED; exception; stage 8 blocked | yes |
| MT-AR-18 | UNKNOWN_OUTCOME | Integration Operator | As MT-AP-20 for a payment (or BANK-PLAY-07's audit trail) | UNKNOWN_OUTCOME; stage 8 blocked until the AR Reconciliation Flow resolves it | yes |
| MT-AR-19 | Reconciliation | Integration Operator | BANK-PLAY-07: integration transactions and audit trail | Resolved by status query (AR Reconciliation Flow); one clearing; CLOSED | |
| MT-AR-20 | Audit | Auditor | BANK-AR-001 → Audit Events | Complete trail | |
| MT-AR-21 | Playbook | AR Processor | BANK-PLAY-02 → **Open Playbook** | Stages 1–7 complete; 8 "waiting": DRAFT staged, nothing cleared yet, next: Check SAP Draft Status | |

## Security

| ID | Test | Persona | Expected | Negative? |
|---|---|---|---|---|
| MT-SEC-01 | Role positive: AP Processor resolves AP exceptions | ap_processor | Allowed | |
| MT-SEC-02 | Role negative: AP Processor approves | ap_processor | Approve not shown / refused | yes |
| MT-SEC-03 | Finance Approver edits invoice amounts | finance_approver | Field read-only / write refused (ACL) | yes |
| MT-SEC-04 | Auditor | auditor | Read everything, change nothing; Playbook view only | yes |
| MT-SEC-05 | Integration Operator edits allocations | integration_operator | Refused | yes |
| MT-SEC-06 | AI negative permissions | ai_agent identity (Phase 29 test) | Cannot approve, post, clear or override; AI writes only advisory fields | yes |
| MT-SEC-07 | Check SAP Draft Status | ai_agent / read_only | Action not available | yes |
| MT-SEC-08 | SoD: requester = approver | any | Refused, audited | yes |
| MT-SEC-09 | Playbook manual completion | any non-admin | No activity can be completed by hand (gates and read-only lists only) | yes |

## UI

| ID | Area | Steps | Expected |
|---|---|---|---|
| MT-UI-01 | Playbook (AP) | INV-PLAY-01 → Open Playbook | 8 stages complete; closure shows AI assistance and audit trail |
| MT-UI-02 | Playbook (AR) | BANK-PLAY-03 → Open Playbook | 9 stages complete; stage 8 shows DRAFT then posted |
| MT-UI-03 | Lists | BCFA Workspace → AP Invoices / Payments / Exceptions lists | Lists open with BCFA columns |
| MT-UI-04 | Forms | Open an invoice and a payment | Review Summary at the top, including SAP PROCESSING (payment); journey fields |
| MT-UI-05 | Related lists | Invoice → Integration Transactions, Audit Events | Filtered to the record and its correlation ID |
| MT-UI-06 | Actions | Payment in SAP_DRAFT | Check SAP Draft Status visible; hidden in other states |
| MT-UI-07 | Dashboards / KPIs | BCFA Workspace → Home | KPI tiles refreshed every 15 minutes; POC scorecard |

## Phase 41: POC team defects and the client sample pack

Defect fixes: `DEFECT_REMEDIATION_REPORT.md`. Client samples: `CLIENT_DOCUMENT_TEST_MATRIX.md` (the documents are
kept outside source control; ask the BCFA team for the pack). Automated equivalents: H41-* in `TEST_PLAN.md`.

| ID | Feature | Persona | Steps | Expected | Negative? |
|---|---|---|---|---|---|
| MT-41-01 | Decision Reason (D6) | Finance Approver | Open an AP exception and an AR exception → enter a Decision Reason → Save | Only Decision Reason is editable; saved | |
| MT-41-02 | Duplicate intake (D1) | AP Processor | Upload the same file twice (e.g. CS-13 and CS-14) → Process Document on both | The second is **Duplicate Of** the first, completed, no new transaction; the first never points at the second | yes |
| MT-41-03 | No attachment (D3) | AP Processor | New intake without a file → Process Document | Message "Attachment required"; status stays New; no transaction, no exception | yes |
| MT-41-04 | Stale error (D2) | AP Processor | Intake with a processing error → attach the right file → Process Document | The old error is cleared for the new attempt (kept in the audit trail) | |
| MT-41-05 | Eligible approvers (D4) | Finance Approver | Open a pending approval | **Eligible Approvers** lists who may decide | |
| MT-41-06 | Currency (D5) | AP Processor | Invoice in USD on an INR PO → Re-run Match | Converted at the governed rate (shown in FX detail) or routed to review; never a raw unit-price comparison | yes |
| MT-41-07 | Re-run (D6) | AP Processor | Invoice in EXCEPTION, then one in PENDING_APPROVAL → Re-run Validation / Re-run Match | Checks re-run from the current state; a pending approval is withdrawn; old exceptions superseded | |
| MT-41-08 | Readable extracted data (D7) | AP Processor | Open an intake and its Playbook | Extracted Data (readable) in sections; no raw JSON | |
| MT-41-09 | AR correlation (D8) | AR Processor | Advice with a reference used by another customer's payment | Not linked; review with the conflict named | yes |
| MT-41-10 | Shipping (D9) | AP Processor | Invoice with subtotal + tax + shipping (e.g. Uline invoice pages) | Totals reconcile with the charge; confidence unchanged | |
| MT-41-11 | Payment state (D10) | AR Processor | Create a payment on the form | State RECEIVED, correlation ID set | |
| MT-41-12 | Large file | AP Processor | Upload CS-28 (14.7 MB) → Process Document | Review: "accepts up to 4 MB per file. Upload the invoice pages only" | yes |
| MT-41-13 | Own sales invoice (E2) | AP Processor | Upload a Birla Carbon sales invoice as AP invoice (when its seller can be read) | Review as an outgoing invoice; no AP invoice | yes |
| MT-41-14 | Not an invoice | AP Processor | Upload CS-23 (PO + GRN only) as AP invoice | Review; no invoice number, vendor or amount invented | yes |
| MT-41-15 | Latin-script invoices | AP Processor | Upload CS-02, CS-12, CS-16, CS-22 | Critical fields match the matrix; review only for master data (vendor not in POC data) | |
| MT-41-16 | Payment advices | AR Processor | Upload CS-04 (TDS), CS-05, CS-09 (mixed number formats) | Per-invoice lines reconcile to the payment; TDS per invoice on CS-04 | |
| MT-41-17 | Chinese / Korean / Thai | AP Processor | Upload CS-18, CS-19, CS-26 | Known platform limitation: fields not read (no value invented), confidence low, review | yes |
| MT-41-18 | Distinct numbers | admin | Create several intakes at once (e.g. by e-mail) | Every intake has its own number | |
| MT-41-19 | Invoice created with unknown vendor / PO | AP Processor | Upload an invoice whose vendor and PO are not in master data (e.g. `test/fixtures/AP_INV_107_TH_VAT7.pdf`) → Process Document | Intake Completed; AP invoice created with Vendor (Printed) and PO Number (Printed); EXCEPTION Vendor Invalid. Add the vendor → Re-run Validation → vendor linked, then PO Mismatch until the PO exists | yes |

The full client sample run (28 documents, step-by-step, expected result per sample, reset) is in the local, git-ignored
`test/client_samples/kit/BCFA_Client_Sample_Test_Guide.xlsx`, built by the client test kit (`scripts/client_samples/build_test_kit.py`).
