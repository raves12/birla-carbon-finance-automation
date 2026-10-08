# CLIENT_POC_DEMO_JOURNEYS.md: demo journeys for the client POC criteria (Phase 40)

Every document is **SYNTHETIC**, and SAP is **MOCK SAP**. Records named below exist on `pwcmanagementservicesdemo01` as of 2026-10-05.

Open records in the BCFA Workspace. Use **Open Playbook** on an invoice or payment to see the stage view:
- extraction provider;
- tax and withholding result;
- tolerances applied;
- payment advice;
- deductions.

## Who does what

| Actor | Does |
|---|---|
| ServiceNow Document Intelligence (Now LLM) | Reads the document. Facts only |
| Rules (decision tables, MatchingEngine) | Tax expectation, tolerances, match, deduction limits |
| Now Assist (AI) | Explains, summarises, drafts, suggests. Never approves, overrides, posts or clears |
| People | Confirm deductions, resolve exceptions, approve |

## AP-1: native extraction, GST validated, matched (live run N1)

| Step | What to show | Record |
|---|---|---|
| 1 | The PDF on the intake (AP_INV_N1_DEMO_NATIVE.pdf, Rajasthan Carbon Feedstock, PO0001, IGST 18 % = 900) | Intake FDI-6D6170BC |
| 2 | Extraction provider "Native: ServiceNow Document Intelligence (Now LLM)". The intake waited about a minute (asynchronous extraction, poller) | Intake, invoice INV-AP-N1 |
| 3 | Extracted header, IGST 900, rate 18, country India, derived confidence 1.0 | Invoice INV-AP-N1, Playbook stage 2 |
| 4 | Tax validation **PASS**: expected 900 from decision table *BCFA AP Tax Expectation* (India: GST 18 %, POC REFERENCE DATA); IGST agrees with the total | Invoice, Playbook stage 3 |
| 5 | 3-way match MATCHED with the tolerance rule and values stored | Playbook stage 4, "Tolerances applied" |
| 6 | PENDING_APPROVAL: a Finance Approver (not the requester or processor) approves | Playbook stage 6 |
| 7 | After approval: posting to MOCK SAP, closure, audit | Playbook stages 7-8 |

Step 6 is left for the presenter: the approval is a human decision.

## AP-2: GST / VAT / withholding exceptions

| Scenario | Record | Shows |
|---|---|---|
| GST printed 50 on net 5,000, expected 900 | E2E-FAAD2-T2 (EXCEPTION) | FAIL, subtype gst, evidence with each tax check; AI may explain, a person decides |
| VAT 7 % printed, Germany expects 19 % | E2E-FAAD2-T4 (EXCEPTION) | FAIL, "printed tax rate 7 %" in the detail. Reduced rates need their own rule row |
| Withholding 250 printed, 100 expected | E2E-FAAD2-T6 (EXCEPTION) | Withholding FAIL; code IN-TDS-SERVICES (POC) comes from configuration, not from the document |
| Withholding printed and correct | E2E-FAAD2-T5 (PENDING_APPROVAL) | Withholding PASS |

These invoices were created by the E2E script with the printed tax breakdown, without document extraction. The native extraction of the same kinds of documents is shown in `OCR_ACCURACY_REPORT.md` (AP_INV_101-104).

## AP-3: tolerances

| Scenario | Record | Shows |
|---|---|---|
| Quantity 101 vs GRN 100 (1 %, tolerance 2 %) | E2E-FAAD2-Q1 (PENDING_APPROVAL) | WITHIN TOLERANCE, matched; rule source, expected, actual and result per check |
| Quantity 110 (10 %) | E2E-FAAD2-Q2 (EXCEPTION) | Outside tolerance; only a person can override, with SoD |

## AR-1: payment first, payment advice later, TDS deduction (live run N1)

| Step | What to show | Record |
|---|---|---|
| 1 | Bank line NRC-PAY-26-1005, INR 78,400, no customer | Payment NRC-PAY-26-1005 |
| 2 | Customer Resolution blocked: customer ambiguous, waiting for the advice | Exception AREX0001149 |
| 3 | Payment advice AR_REMIT_R1_DEMO_NATIVE.pdf read natively: payer Nilgiri Rubber Compounds Ltd, ARINV2001 and ARINV2002, TDS @2% per invoice | Intake (PH40-DEMO-R1), remittance |
| 4 | Customer resolved and both invoices matched by reference (open items: POC data standing in for MOCK SAP) | Payment, Playbook stages 3-5 |
| 5 | Short pay 1,600. Rule suggestion **WITHHOLDING_TAX**: within the withholding limit (10 %), quoting the advice "TDS @2%" | Exception AREX0001150 |
| 6 | The AR processor confirms the deduction as withholding tax. The deduction record keeps the printed reason, the amount and `category_source = human_confirmed` | Presenter |
| 7 | Approval, MOCK SAP clearing (DIRECT or DRAFT), closure | Playbook stages 7-9 |

## AR-2: deduction taxonomy and limits

| Scenario | Record / test | Shows |
|---|---|---|
| Bank charge within the limit | CP-DED AR-DED-001 | Suggested from the advice statement |
| Short pay without reason | CP-DED AR-DED-002 | No category: manual review |
| Credit note netting | CP-DED AR-DED-004 | Exact open credit note |
| Dispute | CP-DED AR-DED-005 | Never a deduction: stays open |
| AI suggests a wrong deduction | E2E-FAAD2-U (ON_HOLD, residual −3,000) | Rules refuse it; the human rejects the AI recommendation (AR-DED-006/007) |

## AR-3: no invoice reference

| Scenario | Record | Shows |
|---|---|---|
| Payment without invoice references, exact amount of one open item | E2E-FAAD2-R (PENDING_APPROVAL) | Exact-amount match in the payment currency; several equal items would be ambiguous and go to a person |
| On-account advice (no invoices listed) | Extraction: AR_REMIT_203 | Read natively; matching would leave it unapplied for a person |

## Repeating the live runs

`python scripts/fixtures/gen_phase40_demo_journeys.py <suffix>` writes a new AP invoice and payment advice (`test/fixtures/*_<suffix>_DEMO_NATIVE.pdf`) and two scripts (scope x_695068_bcfa):
- `scripts/deploy/phase40_demo_prep_<suffix>_bg.js` creates this run's MOCK SAP open items (ARINV-<suffix>-01 / -02 of Nilgiri Rubber Compounds Ltd) and the bank line NRC-PAY-26-<suffix>; the presenter then uploads the two PDFs in Document Intake (live demo, `deliverables/BCFA_Client_Demo_Script.docx`);
- `scripts/deploy/phase40_demo_journeys_<suffix>_bg.js` does the same and processes both documents unattended (rehearsal / check).

Every run has its own invoice number, payment reference and open items, so no reset is needed between runs. Run D1 was executed unattended on 2026-10-05: INV-AP-D1 PENDING_APPROVAL with tax PASS; NRC-PAY-26-D1 short pay 1,600 suggested as withholding tax. Pack D2 is reserved for the client demo. (Run N1 above used the earlier version of the generator.) The E2E records come from `scripts/deploy/phase40_e2e_bg.js`; each run creates its own (run FAAD2 shown here).
