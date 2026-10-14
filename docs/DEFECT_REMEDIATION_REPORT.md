# DEFECT_REMEDIATION_REPORT.md (Phase 41, 2026-10-08)

Defects reported by the POC team (D6 and 1-11), plus defects found while fixing them and while reading the client sample
pack. Method per defect: reproduce, trace the root cause, fix the lowest correct layer, unit check, ATF test, manual
test, full regression.

## Deployment status (read first)

**Deployed and verified on 2026-10-08** (after the admin session's `security_admin` elevation):

| Loader (Scripts - Background, scope global) | Result |
|---|---|
| `phase40_phase41_bg.js` | 12 columns, 76 records, 0 failed |
| `phase40_native_usecases_bg.js` | AP 34 fields, AR 17 fields |
| `phase40_labels_bg.js`, `phase40_forms_bg.js` | 12 labels; 175 form writes |
| `phase40_phase41_fix1_bg.js` | 8 ACL role links (D6) + 2 corrected tests |
| `phase40_playbooks_bg.js` + `phase35_playbook_yokohama_fix_bg.js` | Both Playbooks reloaded and **re-activated** in Workflow Studio (published) |
| `phase40_phase41_fix2_bg.js` | E5: distinct intake numbers + test H41-NUM |
| `phase40_phase41_fix3_bg.js` | E6: normalization evidence only for values read |

- **ATF, BCFA Regression:** 51 / 51 passed on 2026-10-13 (serial run after the record-numbering and AI-terminology changes; 51 / 51 on 2026-10-12).
- **Client sample pack:** all 28 samples processed natively (`CLIENT_DOCUMENT_TEST_MATRIX.md`).

## Summary

| Defect | Area | Reproduced | Root cause | Status |
|---|---|---|---|---|
| D6 | Approver cannot enter Decision Reason | Yes (POC team; ACL definitions inspected) | AP/AR exception write ACLs grant processor and admin only | **Fixed, deployed; ATF H41-D6 PASS** |
| 1 | Duplicate intake loop | Root cause confirmed in code | Duplicate search accepted any other intake with the same hash, including later duplicates | **Fixed, deployed; ATF H41-D1 PASS; client pairs CS-13/14 and CS-26/27 PASS** |
| 2 | Stale processing error | Root cause confirmed in code | `processing_error` never cleared on a new attempt | **Fixed, deployed; ATF H41-D2/D3 PASS** |
| 3 | Intake without attachment | Root cause confirmed in code | Processing ran with no document; the extraction failure raised a review "exception" | **Fixed, deployed; ATF H41-D2/D3 PASS** |
| 4 | Blank approver | Yes (approval records: approver empty until decided) | Group approvals; nothing showed who may decide | **Fixed, deployed** (Eligible Approvers); manual check MT-41-05 |
| 5 | Currency comparison | Root cause confirmed in code | 3-way match compared invoice and PO unit prices without checking currency | **Fixed, deployed; ATF H41-D5 PASS** |
| 6 | Re-run Match / Re-run Validation | Root cause confirmed in code and state model | Buttons entered VALIDATING / MATCHING, which the lifecycle refuses from EXCEPTION, MATCHED, PENDING_APPROVAL; no stale-approval handling | **Fixed, deployed; ATF H41-D6b PASS** |
| 7 | Playbook shows raw extracted data | Yes (forms and Playbook card) | Extracted data only as JSON; stage card listed 21 raw fields | **Fixed, deployed**; Playbooks re-activated |
| 8 | Wrong AR payment / customer correlation | Root cause confirmed in code | Customer code tried as a bank reference; a reference match linked with no currency / amount / customer check; amount + currency alone could link | **Fixed, deployed; ATF H41-D8 PASS**; client advices never linked on weak evidence |
| 9 | Shipping component | Root cause confirmed in code | Gross = net + tax (+ freight) arithmetic counted against extraction confidence; shipping / handling not modelled | **Fixed, deployed; ATF H41-D9 PASS** (Uline figures); CS-28 needs splitting (14.7 MB) |
| 10 | AR payment "already null" | **Yes, on the live instance**: 5 payments created via the form on 7-8 Oct have an empty state | Payment state set only by the bank-statement intake; form-created payments never entered the lifecycle | **Fixed, deployed; ATF H41-D10 PASS** |
| 11 | Multilingual support | Run on the client pack | Fields and normalization for non-English layouts (built); platform reading step loses Chinese (VAT e-invoices) and scanned Korean / Thai text | **Latin scripts verified** (Italian, Portuguese, English); **Chinese / Korean / Thai invoices not supported on this instance** (platform; `MULTILINGUAL_DOCUMENT_INTELLIGENCE_READINESS.md`) |
| E1 (found) | Duplicate detection direction | Found while fixing D6 | Invoice duplicate check also compared with LATER invoices: re-checking an original flags it as a duplicate of its copy | **Fixed, deployed; ATF H41-D6b PASS** |
| E2 (found) | Outgoing invoices treated as AP | Found in the client pack (CS-17, CS-20) | No check that the seller is not a group company | **Fixed, deployed** (review). On the pack these two were not read at all (Chinese e-invoices), so they went to review anyway |
| E3 (found) | Bank acceptance drafts (China) | Found in the client pack (CS-10) | No draft / notes-receivable model | Not built: routed to review (verified on CS-10); scope decision needed |
| E4 (found) | SAP request check vs charges | Found while fixing D9 | SAP-ready check required net + tax = gross | **Fixed, deployed; ATF H41-D9 PASS** |
| E5 (found) | Two intakes with the same number | **Yes, in the client sample run**: two intakes created in the same second were both FDI-C51DFC39 | The number business rule falls back to the first 8 characters of the sys_id, which are shared by records inserted in the same instant | **Fixed, deployed** (a taken number gets the end of the sys_id appended); ATF H41-NUM PASS; the affected intake was renumbered |
| E6 (found) | Noise in the normalization evidence | Seen in the client run (CS-01) | Fields that were not read were listed as "normalized" (empty original) | **Fixed, deployed** (only values read are listed) |
| E8 (POC team, FDI-BE98E1F5) | Invoice not created when the vendor is unknown | **Yes, on the live instance**: a complete, reconciled reading (confidence 1) stopped at the intake with "Vendor could not be resolved" | The intake resolved vendor and PO before creating the invoice and sent the intake to review when either failed (also when the printed totals did not reconcile) | **Fixed, deployed 2026-10-09**: a good reading always creates the invoice; the printed vendor / PO are kept and validation raises vendor_invalid / po_mismatch / totals_not_reconciled on the invoice; Re-run Validation links them once they exist. ATF H41-INV PASS; FDI-BE98E1F5 reprocessed: invoice SPF-IV6909-0412 in EXCEPTION (APEX0001104 vendor invalid) |
| E7 (found) | File without an extension | Seen in the client run (CS-24, "Pasted Image") | The platform reader never finished the task | Safe: the 10-minute timeout sends it to review. No change |

## Detail

### D6: Finance Approver cannot enter the Decision Reason

- **Test:** MT D6 / ATF H41-D6.
- **Root cause:**
  - `acls.now.ts` grants record and catch-all field write on `x_695068_bcfa_ap_exception` and `_ar_exception` only to the processor and admin.
  - The Finance Approver decides AP overrides, rejections, corrections and holds (`ApExceptionDecisionService.ACTIONS`) and AR deductions (`ArExceptionDecisionService`), but could not write any field, so Decision Reason was read-only.
- **Risk:** the approver cannot record a reason, so decisions are either blocked or undocumented.
- **Fix (least privilege):**
  - A record-level write ACL for the Finance Approver role (`acl-write-ap/ar-exception-decision-approver`).
  - A field ACL that allows `decision_reason` for processor, Finance Approver and admin (`acl-write-ap/ar-exception-decision-reason`).
  - The catch-all field ACL is unchanged, so every other field stays processor and admin only.
  - Auditor, read-only and the AI agent role get nothing new.
- **Components:** `src/fluent/security/acls.now.ts` (4 ACLs).
- **ATF:** H41-D6 checks the ACL definitions (approver may write `decision_reason`; AI agent and auditor may not; catch-all field unchanged).
- **Manual test:** as a Finance Approver, open an AP exception and enter a Decision Reason. Only Decision Reason is editable. Then Approve Override.

### Defect 1: duplicate intake loop

- **Test:** DUP-CLIENT-001/002 / ATF H41-D1.
- **Root cause:** `_findDuplicateIntake` returned the oldest *other* intake with the same hash in any active status, whether or not it was itself a duplicate. In the reported sequence:
  1. B is marked a duplicate of A, which is in review, and shows "completed".
  2. A is reprocessed and finds B, so A becomes a duplicate of B.
  3. The result is circular references and no transaction.
- **Fix:**
  - New `duplicate_of` reference on the intake.
  - Only an intake that is not itself a duplicate can be canonical. Legacy duplicates, marked only by their "Duplicate of …" message, are also excluded.
  - A canonical intake in review keeps ownership.
  - Duplicates show the canonical intake's transaction once it exists (`_syncDuplicates`).
  - At most one transaction per document content.
- **Components:** `FinanceDocumentIntakeService` (`_findDuplicateIntake`, `_syncDuplicates`, `processDocument`), `finance_intake.duplicate_of`.
- **Client regression data:** CS-13 = CS-14 and CS-26 = CS-27 (byte-identical, different names).

### Defect 2: stale processing error

- **Root cause:** `processing_error` was written on failure and review but never cleared when a new attempt started.
- **Fix:**
  - At the start of a new attempt (not while extraction is pending), the previous error is cleared.
  - It is repeated in an audit event; the original error is already in the audit trail from when it was raised.
  - A new error is written only if this attempt fails.
- **Component:** `FinanceDocumentIntakeService._processDocumentInner`.

### Defect 3: intake without attachment

- **Root cause:** processing went ahead with no document. The provider reported "No attachment", which sent the intake to manual review and logged an `exception_created` audit event, a misleading finance exception.
- **Fix:**
  - No attachment means no processing at all: no extraction call, no transaction, no exception.
  - The intake stays a draft with the message "Attachment required: …".
  - Process Document and Reprocess show it as an error message.
- **Components:** `FinanceDocumentIntakeService` (`_hasAttachment`, `ATTACHMENT_REQUIRED`), intake UI actions.

### Defect 4: blank approver

- **Root cause:** AP and AR approvals go to a **group** (decision table). `approver` is filled only when someone decides, so the Workspace showed a blank approver.
- **Fix:**
  - New field **Eligible Approvers** on AP and AR approvals, filled when the approval is requested.
  - It lists the active group members who pass every check of the decision itself (`ApprovalEngine.checkSegregation`): approver role, not the requester, not the processor, not an AI identity.
  - When nobody qualifies, it says so ("None: … An administrator must add an eligible approver").
  - No user is ever picked arbitrarily.
- **Components:** `ApprovalEngine` (`eligibleApprovers`, `_request`), approval tables.

### Defect 5: currency comparison

- **Root cause:** `MatchingEngine.threeWayMatch` compared invoice unit prices with PO unit prices as plain numbers, so a USD invoice could "match" an INR PO.
- **Fix:**
  - Different invoice and PO currencies are compared only after conversion at a governed rate. The rate comes from the SAP adapter's `getExchangeRate` through `IntegrationService`: MOCK SAP's labelled static POC table, or SAP's rate when connected. It is logged as an integration transaction.
  - The rate, date, source, and original and converted values are kept on the match (`fx_detail`).
  - With no rate, prices are not compared. The match fails with the new reason **Currency / FX (no approved rate)** and a person decides.
  - AR already compared only open items in the payment currency (unchanged).
- **Note:** the MOCK SAP rate table has no CAD, CNY, KRW, BRL or THB rates (the client sample currencies). A cross-currency invoice in those currencies goes to review rather than using an invented rate.
- **Components:** `MatchingEngine.currencyCheck`, `ApDomainService` (reason mapping), `RealSAPAdapter.getExchangeRate` (stub), `ap_match.fx_detail`, AP exception reason `currency_mismatch`.

### Defect 6: Re-run Match / Re-run Validation

- **Root cause:**
  - The buttons called `validateInvoice` and `matchInvoice` directly, and these first move the invoice to VALIDATING or MATCHING.
  - The AP lifecycle allows those only from RECEIVED, EXTRACTED or RESOLUTION, and VALIDATED respectively. From the states a reviewer re-runs from (EXCEPTION, ON_HOLD, MATCHED, PENDING_APPROVAL), the first step was refused.
  - There was no handling of an approval already pending for the old data.
- **Fix: `ApDomainService.rerunChecks`.**
  1. Only before approval; an approved invoice is locked.
  2. A pending approval is **withdrawn** (new decision value "Withdrawn") and can no longer be decided.
  3. Open exceptions from the automated checks are closed as "Superseded by Re-run" and kept as history; human-decision exceptions stay open.
  4. The invoice goes to RESOLUTION, then validation, then 3-way match, from current master data and configuration.
  5. Earlier match rows are marked `superseded`, so exactly one current match exists.
  6. A matched invoice gets the configured approval rule again.
  - New state transitions: VALIDATED, MATCHED and PENDING_APPROVAL to RESOLUTION.
  - The buttons are shown only in VALIDATED, MATCHED, EXCEPTION, ON_HOLD and PENDING_APPROVAL, and report the result.
- **Found and fixed (E1):** `MatchingEngine.detectDuplicateInvoice` compared with all invoices, including later ones. Re-checking the original TEST-RK-001 would have flagged it as a duplicate of its e-mailed copy. Now only earlier invoices count; same-second creations stay candidates, which is conservative.

### Defect 7: Playbook extracted data UX

- **Root cause:**
  - Extracted data was available only as JSON (intake "Extracted Data", AP Extraction, remittance).
  - The AP Playbook stage card listed 21 raw fields.
- **Fix: readable, sectioned summaries** (`FinanceTextFormat.extractionSummary`):
  - **AP, on the invoice ("Extracted Data"):** Document (language, country, invoice pages, supporting documents), Supplier, Invoice, PO / receipt references, Amounts (with the totals reconciliation), Charges, Taxes (printed components to normalized type), Lines, Extraction confidence, Normalization.
  - **AR, on the payment ("Payment Advice (as read)"):** Payment, Payer, Invoice references (gross − advance − TDS − deduction = paid), Deductions (evidence only), Reconciliation, Confidence.
  - The intake shows the same summary; the JSON moves to the Technical section as evidence.
  - Both stage-2 lanes are renamed "2. Document Understanding".
- **Components:** `FinanceTextFormat`, `FinanceDocumentIntakeService`, `ArDomainService.intakeRemittance`, `gen_playbooks.py`, `gen_form_layouts.py`, three new fields.
- **Manual step:** re-activate both Playbooks in Workflow Studio after the deploy.

### Defect 8: wrong AR payment / customer correlation (high control risk)

- **Root cause** (`processArRemittanceDocument`):
  1. When the advice's payment reference did not match, the **customer code** was tried as a bank reference.
  2. A reference match linked the remittance with **no check** of currency, amount or customer.
  3. Without a reference, one payment matching amount and currency could link even when the customer was unknown.
- **Fix: `FinanceDocumentIntakeService.correlatePayment`** (deterministic precedence and conflict checks).
  - **Exact reference (UTR / bank reference):** compared ignoring case and separators. It links only if currency, amount and customer agree; any conflict goes to review with the evidence.
  - **Without a reference:** links only when the customer is resolved and exactly one payment fits on amount, currency and date window.
  - **Never links** when more than one payment carries the reference or fits.
  - Every candidate's supporting and conflicting evidence is stored for the reviewer.
- **ATF H41-D8 scenarios:** same reference with a different customer, different currency or different amount; unresolved customer; two candidates; reference on two payments; and the positive cases.

### Defect 9: shipping component

- **Root cause:**
  - The extraction's derived confidence lost 0.2 when gross ≠ net + tax (+ freight), and shipping / handling was not a field.
  - So the correctly read Uline invoice (1,901.34 + 199.68 + 211.70 = 2,312.72) dropped below the review threshold.
- **Fix:**
  - New extraction fields: shipping and handling, surcharge, other charges, tax components.
  - A separate deterministic **totals reconciliation**: gross = net + tax + charges − discount, or the charges / discount already inside the net, with no double counting.
  - It is stored on the invoice (`charges_amount`, `discount_amount`, `amount_reconciliation`, detail).
  - **Extraction confidence is now completeness and readability only.**
  - Unreconciled totals go to review with the reason; the confidence is unchanged.
  - AR payment advices reconcile per invoice (gross − advance − TDS − deduction = paid) and overall.
- **Client data:** CS-28 (Uline), ground truth matches the brief.

### Defect 10: AR payment "already null"

- **Reproduced on the live instance (2026-10-08):** 5 payments created through the form on 7-8 Oct (bank references "SBI", "UTIBR…", "E2E-137E5-G/H") have an empty lifecycle state; 2 have no amount or currency either.
- **Root cause:**
  - Only `ArDomainService.intakePayment` set the state, to RECEIVED.
  - A form-created payment never entered the lifecycle or the AR flows.
  - A later remittance reported it as "already null".
- **Fix:**
  - Before-insert rule **BCFA - Initialize Payment Lifecycle**: every new payment starts as RECEIVED with a correlation ID and idempotency key, so the AR Payment Intake Flow normalizes it (a missing amount or currency becomes a normalization exception).
  - Remittance correlation refuses a payment without a state, with a clear message.
- **Existing records:** the 5 payments stay as they are (no data changed). The correlation guard handles them; the testers can recreate them.

### Defect 11: multilingual support

See `MULTILINGUAL_DOCUMENT_INTELLIGENCE_READINESS.md`.
- Built: field descriptions for notes / remarks and invoice-only pages, locale-aware normalization with evidence, normalized tax labels across languages, group-company detection in Latin / Chinese / Korean.
- Client evidence exists for English, Chinese, Korean, Portuguese, Thai and **Italian** (CS-07, Birla Carbon Italy, not expected).
- No client sample exists for French, Hungarian, Spanish, Arabic or Hindi.

### E2: Birla Carbon's own sales invoices as "vendor invoices"

- CS-17 and CS-20 are VAT e-invoices **issued by** Birla Carbon Jining to Sika and Dezhou Linglong: AR open items, not AP.
- Fix: when the seller is a group company (`x_695068_bcfa.own_company_names`, default `Birla Carbon, Aditya Birla, 博拉碳, 비를라카본`), the intake goes to review as an outgoing invoice and no AP invoice is created.

### E3: Chinese bank acceptance draft (process gap, not built)

- CS-10 is an electronic bank acceptance draft (CNY 9,230,000, maturity 2027-03-29) received by endorsement, not cash.
- BCFA's AR model (bank payment, advice, open items) has no notes-receivable / draft lifecycle (receipt, endorsement chain, maturity, discounting).
- It is processed as an advice that fails correlation and goes to review.
- A scope decision is needed if drafts are in scope for China AR.

## Regression

- **ATF:** BCFA Regression 51 / 51 passed on 2026-10-13 (serial run after the record-numbering and AI-terminology changes; 51 / 51 on 2026-10-12) (Phase 40 baseline 35/35; Phase 41 adds H41-D1, D2/D3, D5, D6, D6b, D8,
  D9, D10, SAP, NUM and INV).
- **Client samples:** `CLIENT_DOCUMENT_TEST_MATRIX.md` (28 samples, results per sample).
- **Manual:** `MANUAL_TEST_CASES.md` (MT-41-*) and `deliverables/BCFA_Manual_Test_Workbook.xlsx` (P41-*). Steps that need
  a persona (Finance Approver decisions) are run by the POC team; impersonation is not done by the build agent.

### E8: the invoice must be created when the document was read well (FDI-BE98E1F5)

- **Report:** the POC team uploaded a Thai invoice (synthetic fixture, digital PDF). Every field was read
  (confidence 1, totals reconciled, 3 lines), but the intake stopped in review with "Vendor could not be resolved" and
  no invoice was created.
- **Root cause:** `processApInvoiceDocument` checked master data before creating the invoice: vendor not resolved,
  printed PO not found, or printed totals not reconciled sent the intake to review.
- **Fix (requirement: extraction only decides whether the reading is good; business checks happen on the invoice):**
  - The intake stops only for a poor reading (confidence below the threshold, i.e. a critical field missing) or a
    group-company seller (an outgoing invoice, not AP).
  - Otherwise the AP invoice is always created. Vendor and PO are linked when they resolve; the printed vendor name /
    code and PO number are kept on the invoice (`printed_vendor_name`, `printed_vendor_code`, `printed_po_number`,
    shown in the Document Extraction section).
  - `ApDomainService.validateInvoice` first links a printed vendor / PO that now resolves (and the lines to the PO's
    lines and receipts), then raises, one at a time: `missing_field`, `totals_not_reconciled` (new reason),
    `vendor_invalid` ("Vendor "…" printed on the invoice is not in the vendor master"), `po_mismatch` ("Purchase
    order "…" printed on the invoice was not found"). A printed PO that is not found is never treated as a non-PO
    invoice.
  - Re-run Validation therefore completes the invoice once the vendor / PO are added to master data.
- **Evidence:** ATF H41-INV (8 assertions); FDI-BE98E1F5 reprocessed: AP invoice SPF-IV6909-0412 (THB 2,653,600, 3
  lines) in EXCEPTION with APEX0001104 Vendor Invalid.
- **Not changed:** AR advices still go to review when the customer is unknown (a remittance needs a payment to apply
  to).

### Found while preparing the client sample test kit (2026-10-12)

| Item | Found on | Root cause | Status |
|---|---|---|---|
| E9 Vendor not linked when the printed name differs only in spacing / case / punctuation | Client readings ("D . SURESHPRASAD") | Vendor resolution was exact-name only; generative readings vary in punctuation | **Fixed, deployed**: unique normalized-name match (`MatchingEngine.resolveVendor`), ATF H41-VEN |
| E10 Advice not linked to an unassigned bank line | CS-13 dry run: the reading took another reference and read 05.10.2026 as 10 May | The fallback (resolved customer + amount + currency + date) only searched payments already assigned to that customer, and only the date as read | **Fixed, deployed**: unassigned bank lines are candidates too (another customer's payment never is), and an ambiguous day / month date is searched both ways; still links only when exactly one payment fits. ATF H41-D8 (3 new assertions) |
| E11 NF-e totals flagged as not reconciled | CS-12 (Brazil) | ICMS is included in the item prices on an NF-e; the reconciliation adds the tax on top | **Open (known limitation)**: the invoice goes to EXCEPTION Printed Totals Not Reconciled (no override for this reason); tax-inclusive regimes need a rule |
| E12 Bank booked as customer | CS-15 / CS-21 with customer CD01 ("JPMORGAN CHASE BANK (CHINA)…", created by a tester on 2026-10-09) | Master data: the remitting bank exists as a customer, so the misread payer resolves to it | **Open (data)**: deactivate CD01; the client test guide says so |

The client sample test kit (`scripts/client_samples/build_test_kit.py`; spec, loaders and guide in the git-ignored
`test/client_samples/kit/`) sets up POC test data from the documents, lists the expected result per sample (from a dry
run of all 28 on the instance) and provides an owner-run reset.
