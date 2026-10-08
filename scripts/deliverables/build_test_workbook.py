"""Builds deliverables/BCFA_Manual_Test_Workbook.xlsx: manual test cases for
the BCFA POC (AP and Cash Application end to end, extraction, tax,
tolerances, deductions, SAP posting / clearing, AI, Playbooks, workspace,
security, audit), two end-to-end scripts, test data, a defect log and a
summary that counts results.

  python scripts/deliverables/build_test_workbook.py
"""
import os
from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(REPO, 'deliverables', 'BCFA_Manual_Test_Workbook.xlsx')
WS_URL = 'https://pwcmanagementservicesdemo01.service-now.com/now/bcfa/home'

NAVY = PatternFill('solid', fgColor='1F3864')
LIGHT = PatternFill('solid', fgColor='EEF2F8')
WHITE_BOLD = Font(bold=True, color='FFFFFF')
THIN = Side(style='thin', color='B7C3D6')
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP = Alignment(wrap_text=True, vertical='top')
STATUSES = ['Not Run', 'Pass', 'Fail', 'Blocked', 'N/A']

AP_P, AR_P, FA, FC, ADM, AUD = 'AP Processor (bcfa.ap.processor)', 'AR Processor (bcfa.ar.processor)', 'Finance Approver (bcfa.finance.approver)', \
    'Finance Controller (bcfa.finance.controller)', 'Admin', 'Auditor'
RESET = 'Demo data reset done (Test Data sheet, step R1).'
E2E40 = 'Admin ran scripts/deploy/phase40_e2e_bg.js (Test Data, step R3); note the run code shown, e.g. 63D87.'

# (ID, Area, Scenario, Priority, Type, Persona, Preconditions / data, Steps, Expected result, Evidence)
CASES = [
    # ---------------------------------------------------------------- Intake and extraction (AP)
    ('AP-INT-01', 'AP · Intake', 'Upload an AP invoice and start processing', 'High', 'Positive', AP_P,
     'Demo pack prepared (Test Data R2). File test/fixtures/AP_INV_<suffix>_DEMO_NATIVE.pdf.',
     '1. BCFA Workspace > Document Intake > New.\n2. Document Type = AP Invoice. Attach the PDF. Save.\n3. Click Process Document.',
     'Info message: "Native extraction is running (ServiceNow Document Intelligence)…". Intake Processing Status = Extracting; Extraction Provider = Native: ServiceNow Document Intelligence (Now LLM).', 'Screenshot of the intake'),
    ('AP-INT-02', 'AP · Intake', 'Asynchronous completion', 'High', 'Positive', AP_P, 'AP-INT-01 done.',
     '1. Wait about 1 minute (job BCFA - Native Extraction Poller runs every minute).\n2. Refresh the intake.',
     'Processing Status = Completed; AP Invoice field links to INV-AP-<suffix>; Extraction Confidence = 1.', 'Intake and invoice number'),
    ('AP-INT-03', 'AP · Intake', 'Duplicate upload of the same file', 'Medium', 'Negative', AP_P, 'AP-INT-02 done.',
     '1. Create a new intake, attach the SAME PDF, Process Document.',
     'Processing Status = Completed with message "Duplicate of FDI-… — reusing its result, no new transaction created". No second invoice.', 'Intake message'),
    ('AP-INT-04', 'AP · Intake', 'Document type missing', 'Medium', 'Negative', AP_P, '—',
     '1. New intake without Document Type (or Unknown), attach any PDF, Save, Process Document.',
     'Processing Status = Review Required: "Set the document type … then process the document again." Nothing extracted.', 'Intake message'),
    ('AP-OCR-01', 'AP · Extraction', 'Header and line fields read natively', 'High', 'Positive', AP_P, 'AP-INT-02 done.',
     '1. Open INV-AP-<suffix>. Read the Review Summary and the Extraction related list.\n2. Compare with the PDF.',
     'Vendor Rajasthan Carbon Feedstock Pvt Ltd, PO0001, INR, net 5,000, IGST 900, total 5,900, 1 line 100 MT × 50. Extraction source = ServiceNow Document Intelligence (Now LLM); banner NATIVE EXTRACTION.', 'Review Summary screenshot'),
    ('AP-OCR-02', 'AP · Extraction', 'Tax breakdown, country and language recorded as printed', 'High', 'Positive', AP_P, 'AP-INT-02 done.',
     '1. On INV-AP-<suffix> check Tax Type, Tax Rate Pct, IGST Amount, Document Country, Document Language.',
     'Tax Type IGST, rate 18, IGST 900, country India, language English.', 'Field values'),
    ('AP-OCR-03', 'AP · Extraction', 'Multi-country fixture read (vendor not in master data)', 'Medium', 'Positive', AP_P,
     'Fixture test/fixtures/AP_INV_103_VAT7_DE.pdf (German, MwSt. 7 %).',
     '1. New intake, AP Invoice, attach the PDF, Process Document; wait 1 minute; refresh.\n2. Open Extraction JSON on the intake.',
     'Extraction JSON shows Elbtal Fachverlag GmbH, R-2026-3391, EUR, net 2058.80, tax 144.12, total 2202.92, rate 7, 2 lines. Intake goes to Review Required: vendor could not be resolved (the vendor is not in the demo master data) — expected.', 'Extraction JSON'),
    ('AP-OCR-04', 'AP · Extraction', 'Low confidence goes to a person', 'High', 'Negative', AP_P, 'Fixture AP_INV_006_LOW_CONFIDENCE.pdf (vendor unreadable).',
     '1. New intake, AP Invoice, attach, Process Document; wait; refresh.',
     'Review Required with message "Extraction confidence … is below the 0.85 review threshold" and the warnings (e.g. Required field not read: vendor_name). No invoice created.', 'Intake message'),
    ('AP-OCR-05', 'AP · Extraction', 'No fallback to simulated values', 'High', 'Negative', ADM, 'Property document.extraction.provider = native.',
     '1. Review the CP-EXT ATF result (Test Data R4) or upload a non-invoice PDF as AP Invoice.',
     'A document that cannot be read goes to manual review; nothing is filled from fixture values; no SIMULATED label appears.', 'ATF result / intake'),
    # ---------------------------------------------------------------- Validation, tax, match
    ('AP-VAL-01', 'AP · Validation', 'Duplicate invoice detected', 'High', 'Negative', AP_P, RESET, '1. Open the AP exception of INV-AP-001 with reason Duplicate (scenario AP-002).',
     'Reason Duplicate, severity High, rule result names the earlier invoice; journey stage 3 blocked.', 'Exception'),
    ('AP-VAL-02', 'AP · Validation', 'PO mismatch', 'Medium', 'Negative', AP_P, RESET, '1. Open INV-AP-003 and its exception.', 'Exception PO mismatch; stage 3 blocked; WHY explains the PO check.', 'Exception'),
    ('AP-TAX-01', 'AP · Tax', 'Valid GST (IGST) passes', 'High', 'Positive', AP_P, 'AP-INT-02 done.',
     '1. On INV-AP-<suffix> read Tax Regime, Expected Tax Amount, Tax Validation, Tax Validation Detail, Tax Rule Source.',
     'Regime GST, expected 900, result Pass; detail lists "PASS: tax 900 vs expected 900 …" and "PASS: IGST 900 (inter-state) agrees with the total tax"; rule source = decision table BCFA AP Tax Expectation (India: GST 18 %) - POC REFERENCE DATA.', 'Tax fields'),
    ('AP-TAX-02', 'AP · Tax', 'GST mismatch raises a tax exception', 'High', 'Negative', AP_P, E2E40,
     '1. Open invoice E2E-<run>-T2 and its exception.', 'Tax Validation Fail, expected 900 vs printed 50; exception reason Tax validation, subtype gst; evidence lists each tax check; AI note (if any) is advisory only.', 'Exception'),
    ('AP-TAX-03', 'AP · Tax', 'CGST + SGST equal halves pass', 'Medium', 'Positive', AP_P, E2E40, '1. Open E2E-<run>-T1.', 'Tax Validation Pass; tolerance rule stored on the match.', 'Invoice'),
    ('AP-TAX-04', 'AP · Tax', 'VAT rate mismatch (7 % printed, 19 % expected for Germany)', 'High', 'Negative', AP_P, E2E40, '1. Open E2E-<run>-T4 and its exception.',
     'Result Fail; subtype vat; detail names "printed tax rate 7 %" and the expected 19 %.', 'Exception'),
    ('AP-TAX-05', 'AP · Tax', 'Withholding applicable and correct', 'High', 'Positive', AP_P, E2E40, '1. Open E2E-<run>-T5.',
     'WHT Applicable = true (from configuration: India services), WHT Code IN-TDS-SERVICES (POC), expected 100, WHT Result Pass; invoice matched.', 'Invoice'),
    ('AP-TAX-06', 'AP · Tax', 'Withholding mismatch', 'High', 'Negative', AP_P, E2E40, '1. Open E2E-<run>-T6 and its exception.',
     'WHT Result Fail; exception subtype withholding_tax; variance 150 (250 printed vs 100 expected).', 'Exception'),
    ('AP-TAX-07', 'AP · Tax', 'Country without a tax rule goes to manual review', 'Medium', 'Negative', ADM, 'ATF CP-TAX (Test Data R4).',
     '1. Open the latest CP-TAX result.', 'Assertion "withholding printed but not configured needs manual review" and the UNKNOWN regime rule pass.', 'ATF result'),
    ('AP-TOL-01', 'AP · Tolerance', 'Quantity within tolerance', 'High', 'Positive', AP_P, E2E40, '1. Open E2E-<run>-Q1 > AP Match related list.',
     'Matched; Tolerance Source = decision table; Quantity Tolerance Pct 0.02; Tolerance Detail shows expected 100, actual 101, variance 1 %, WITHIN TOLERANCE.', 'Match record'),
    ('AP-TOL-02', 'AP · Tolerance', 'Quantity outside tolerance', 'High', 'Negative', AP_P, E2E40, '1. Open E2E-<run>-Q2 and its exception.',
     'Exception Quantity tolerance; variance 10 %; evidence names the tolerance rule; journey stage 4 blocked.', 'Exception'),
    ('AP-TOL-03', 'AP · Tolerance', 'Price variance', 'Medium', 'Negative', AP_P, RESET, '1. Open INV-AP-005 (or INV-PLAY-02).', 'Exception Price tolerance; match result shows the price variance and tolerance.', 'Exception'),
    ('AP-TOL-04', 'AP · Tolerance', 'Tolerances are configuration, not code', 'Medium', 'Positive', ADM, '—',
     '1. Decision Builder (or Decision Tables list) > BCFA AP Tolerance. Review rows.\n2. System Properties: x_695068_bcfa.ap.tolerance.*.',
     'Default row 2 % quantity, 2 % price, tax 1 / 2 %, total 1, rounding 0.05; properties hold the same values as fallback. Do not change on the shared instance unless agreed.', 'Screenshot'),
    ('AP-GRN-01', 'AP · Match', 'Receipt missing', 'Medium', 'Negative', AP_P, 'An invoice line without a receipt.', '1. Re-run Match on the invoice.', 'Exception GRN missing; stage 4 blocked.', 'Exception'),
    # ---------------------------------------------------------------- AP exceptions and approval
    ('AP-EXC-01', 'AP · Exceptions', 'Exception framework fields', 'Medium', 'Positive', AP_P, RESET, '1. Open the exception of INV-AP-004.',
     'Number APEX…, severity, priority, owner, assignment group, SLA due, SLA status, aging bucket, rule result, evidence, variance, AI recommendation (advisory).', 'Exception form'),
    ('AP-EXC-02', 'AP · Exceptions', 'Explain with Now Assist (advisory)', 'High', 'Positive', AP_P, RESET, '1. On an open AP exception click Explain with Now Assist; wait up to 60 s; refresh.',
     'AI recommendation updated; AI Interaction Log row (provider now_assist, guardrail); invoice state and exception status unchanged.', 'AI Interaction Log'),
    ('AP-EXC-03', 'AP · Exceptions', 'Hold / Request Correction / Resolve & Retry', 'Medium', 'Positive', AP_P, RESET,
     '1. Enter a Decision Reason, Update.\n2. Click Hold (or Request Correction).\n3. On another exception click Resolve & Retry.',
     'Decision and comment recorded; Resolve & Retry re-validates and re-matches; journey refreshes; audit human_review event.', 'Audit Events'),
    ('AP-EXC-04', 'AP · Exceptions', 'Override needs a reason', 'High', 'Negative', FA, RESET, '1. On the quantity exception of INV-AP-004, with an empty Decision Reason, click Approve Override.',
     'Refused: a reason of at least 10 characters is mandatory. Nothing changes.', 'Error message'),
    ('AP-EXC-05', 'AP · Exceptions', 'Override by an authorised approver (D6 workaround)', 'High', 'Positive', AP_P + ', then ' + FC, RESET,
     '1. As AP Processor: enter Decision Reason "Receipt of 5 additional units confirmed by warehouse", Update.\n2. As Finance Controller: click Approve Override.',
     'Override approved; approval recorded with the controller as approver and SoD checks; invoice posts to MOCK SAP and closes. (Approvers cannot type the reason themselves: known defect D6.)', 'Approval + invoice'),
    ('AP-EXC-06', 'AP · Exceptions', 'Duplicate cannot be overridden', 'Medium', 'Negative', FA, RESET, '1. On the duplicate exception click Approve Override (with a reason).',
     'Refused by policy: duplicates are not an allowed override reason.', 'Error message'),
    ('AP-APR-01', 'AP · Approval', 'Approve a matched invoice', 'High', 'Positive', FA, 'AP-INT-02 done (INV-AP-<suffix> PENDING_APPROVAL).',
     '1. AP > Approvals > open the approval for INV-AP-<suffix>.\n2. Optional comment in Decision Notes. Click Approve.\n3. Wait a few seconds; open the invoice.',
     'Approval decided (SoD: not AI, holds ap_approver, not requester, not processor, member of BCFA Finance Approvers). Invoice APPROVED -> POSTING -> POSTED -> CLOSED.', 'Approval + invoice'),
    ('AP-APR-02', 'AP · Approval', 'Reject an approval', 'Medium', 'Negative', FA, 'A pending AP approval.', '1. Enter Decision Notes, click Reject.', 'Invoice REJECTED; nothing posted; audit approval_decision.', 'Invoice'),
    ('AP-APR-03', 'AP · Approval', 'Requester cannot approve', 'High', 'Negative', 'The user who requested the approval', 'A pending approval you requested.', '1. Click Approve.',
     'Refused: "the requester cannot approve their own request"; audited; nothing changes.', 'Error message'),
    ('AP-APR-04', 'AP · Approval', 'Processor role cannot approve', 'High', 'Negative', AP_P, 'A pending AP approval.', '1. Open it.', 'Approve / Reject not available (role ap_approver required).', 'Screenshot'),
    ('AP-APR-05', 'AP · Approval', 'High value routed to Finance Controllers', 'Medium', 'Positive', ADM, 'Decision table BCFA AP Approval.',
     '1. Review rows: tolerance exception > 10 % or amount > 1,000,000 -> Finance Controllers; default -> Finance Approvers.', 'Rows as described; approval_group on approvals follows them.', 'Screenshot'),
    # ---------------------------------------------------------------- AP posting
    ('AP-SAP-01', 'AP · SAP posting', 'Posting to MOCK SAP', 'High', 'Positive', FA, 'AP-APR-01 done.',
     '1. On INV-AP-<suffix> open Integration Transactions.', 'One postVendorInvoice transaction: adapter mock_sap, idempotency key AP-POST-…, status success, SAP document MIRO…; invoice SAP Document ID set; Posting State Posted.', 'Integration transaction'),
    ('AP-SAP-02', 'AP · SAP posting', 'Posting failure', 'Medium', 'Negative', ADM + ' then ' + FA,
     'Integration Profile "Mock SAP - Default".', '1. Set Failure Mode = technical_error.\n2. Approve a pending invoice.\n3. Set Failure Mode back to success.',
     'Invoice FAILED; integration exception; journey stage 7 blocked (Integration Operator). Restore the profile.', 'Invoice + profile restored'),
    ('AP-SAP-03', 'AP · SAP posting', 'Unknown outcome reconciled, never re-sent', 'High', 'Negative', ADM + ' then ' + FA,
     'Integration Profile "Mock SAP - Default".', '1. Set Failure Mode = timeout.\n2. Approve a fresh invoice.\n3. Set Failure Mode back to success.\n4. Open the invoice and its Integration Transactions.',
     'UNKNOWN_OUTCOME, then the AP Reconciliation Flow queries the status: posted (or retried once on the same transaction). Exactly one successful posting.', 'Integration transactions'),
    ('AP-SAP-04', 'AP · SAP posting', 'Real SAP adapter not configured', 'Low', 'Negative', ADM, 'CP-DED ATF result.',
     '1. Review the CP-DED assertion "SAP adapter by configuration: real SAP not configured".', 'Pass: with x_695068_bcfa.sap.adapter = real_sap nothing is sent (NOT_CONFIGURED).', 'ATF result'),
    ('AP-CLS-01', 'AP · Closure', 'Closed invoice and audit chain', 'High', 'Positive', AUD, 'AP-APR-01 done.',
     '1. Open INV-AP-<suffix> > Audit Events.', 'Events in order: document_uploaded, document_extracted, record_created, rule_evaluated, match, approval_requested, approval_decision, integration_call, integration_result, reconciliation, closure; each with actor and correlation ID.', 'Audit list'),
    ('AP-PB-01', 'AP · Playbook', 'Playbook shows the journey', 'High', 'Positive', AP_P, 'AP-INT-02 done.',
     '1. On INV-AP-<suffix> click Open Playbook.\n2. Open stages 2, 3 and 4.',
     'Stage 2 shows Extraction Provider, tax breakdown and confidence; stage 3 shows tax and withholding results with rule source; stage 4 lists Tolerances applied. No activity can be completed by hand.', 'Screenshot'),
    # ---------------------------------------------------------------- AR
    ('AR-INT-01', 'AR · Bank line', 'Bank line arrives before the advice', 'High', 'Positive', AR_P, 'Demo pack prepared (Test Data R2).',
     '1. Cash Application > Payments > open NRC-PAY-26-<suffix>.', 'INR 78,400, no customer; state EXCEPTION with Customer Ambiguous exception; journey stage 3 blocked: "Bank line received without a remittance".', 'Payment'),
    ('AR-OCR-01', 'AR · Advice extraction', 'Upload the payment advice', 'High', 'Positive', AR_P, 'AR-INT-01.',
     '1. Document Intake > New; Document Type = AR Payment Advice (or AR Remittance); attach AR_REMIT_<suffix>_DEMO_NATIVE.pdf; Save; Process Document.\n2. Wait about 1 minute; refresh.',
     'Intake Completed; remittance linked to NRC-PAY-26-<suffix>; Extraction Provider native.', 'Intake'),
    ('AR-OCR-02', 'AR · Advice extraction', 'Advice fields as printed', 'High', 'Positive', AR_P, 'AR-OCR-01.',
     '1. Open the Remittance.', 'Payer Nilgiri Rubber Compounds Ltd, bank reference SBINR…, payment 78,400 INR, advice deduction 1,600 with reason (TDS), invoice count 2.', 'Remittance'),
    ('AR-OCR-03', 'AR · Advice extraction', 'Advice without amount or invoices goes to review', 'Medium', 'Negative', ADM, 'CP-EXT ATF.', '1. Review the CP-EXT assertion AR-OCR-003.', 'Pass.', 'ATF result'),
    ('AR-CUS-01', 'AR · Customer', 'Customer resolved from the advice', 'High', 'Positive', AR_P, 'AR-OCR-01.', '1. Refresh NRC-PAY-26-<suffix>.',
     'Customer = Nilgiri Rubber Compounds Ltd; the Customer Ambiguous exception is resolved.', 'Payment'),
    ('AR-CUS-02', 'AR · Customer', 'Ambiguous customer is never guessed', 'High', 'Negative', AR_P, RESET, '1. Open BANK-PLAY-05.', 'Exception customer_ambiguous; stage 3 blocked; AI may rank candidates, no customer is set.', 'Payment'),
    ('AR-CUS-03', 'AR · Customer', 'Confirmed alias resolves the customer', 'Medium', 'Positive', AR_P, RESET, '1. Open BANK-AR-004.', 'Customer resolved via the confirmed alias LONE STAR TYRE CO.', 'Payment'),
    ('AR-REC-01', 'AR · Open items', 'Open items read through IntegrationService', 'High', 'Positive', AR_P, 'AR-CUS-01.',
     '1. On NRC-PAY-26-<suffix> open Integration Transactions.', 'A getOpenItems transaction, adapter mock_sap, status success, before the match.', 'Integration transaction'),
    ('AR-REC-02', 'AR · Matching', 'Match by the advice references', 'High', 'Positive', AR_P, 'AR-CUS-01.', '1. Open Match Candidates and Allocations of the payment.',
     'Two remittance candidates (ARINV-<suffix>-01, -02, confidence 1, selected); allocations 50,000 and 30,000.', 'Related lists'),
    ('AR-REC-03', 'AR · Matching', 'Exact amount without reference', 'Medium', 'Positive', AR_P, E2E40, '1. Open payment E2E-<run>-R.', 'Matched by exact amount; allocated to the open item; pending approval.', 'Payment'),
    ('AR-REC-04', 'AR · Matching', 'Multi-invoice payment', 'Medium', 'Positive', AR_P, RESET, '1. Open BANK-AR-003.', 'Allocations per open item; total equals the payment.', 'Allocations'),
    ('AR-REC-05', 'AR · Matching', 'Ambiguous combinations go to a person', 'Medium', 'Negative', ADM, 'ATF "Matching — ambiguous exact combinations…".', '1. Review the ATF result.', 'Pass: several exact options raise ambiguous_match; the engine never chooses.', 'ATF result'),
    ('AR-DED-01', 'AR · Deductions', 'Withholding (TDS) suggested from the advice', 'High', 'Positive', AR_P, 'AR-REC-02.',
     '1. Open the payment\'s Short Pay exception.', 'Residual −1,600; rule result "Rule suggestion: WITHHOLDING_TAX - residual 1600 is within the withholding limit … (the advice states: … TDS @2%)".', 'Exception'),
    ('AR-DED-02', 'AR · Deductions', 'Person confirms the withholding deduction', 'High', 'Positive', AR_P, 'AR-DED-01.',
     '1. On the exception set Deduction Type = Withholding Tax and Decision Reason "TDS 2 % certificate to follow", Update.\n2. Click Approve Deduction.',
     'Message "Deduction withholding_tax 1600 approved. Payment state: PENDING_APPROVAL …"; Deduction row: amount 1,600, advice reason, category source human_confirmed.', 'Deduction'),
    ('AR-DED-03', 'AR · Deductions', 'Bank charge within limit', 'Medium', 'Positive', AR_P, RESET, '1. Open the Short Pay exception of BANK-PLAY-04 (short by 500 EUR).\n2. Deduction Type = Bank Charge; Decision Reason "correspondent bank charges confirmed"; Update; Approve Deduction.', 'Accepted (≤ 1,000, no finance approver needed); deduction recorded; payment proceeds to approval.', 'Deduction'),
    ('AR-DED-04', 'AR · Deductions', 'Bank charge above the limit refused', 'High', 'Negative', AR_P, RESET, '1. Open the Short Pay exception of BANK-AR-002 (residual 3,500).\n2. Deduction Type = Bank Charge; Decision Reason; Update; Approve Deduction.', 'Refused (ar.bank_charge.max_amount 1,000); nothing recorded; exception stays open.', 'Error message'),
    ('AR-DED-05', 'AR · Deductions', 'Dispute is never a deduction', 'High', 'Negative', AR_P, RESET, '1. Same exception as AR-DED-04 (BANK-AR-002).\n2. Deduction Type = Dispute (not a deduction); Decision Reason; Update; Approve Deduction.',
     'Refused: a dispute is not a deduction; the exception stays open for investigation.', 'Error message'),
    ('AR-DED-06', 'AR · Deductions', 'AI suggestion does not decide', 'High', 'Negative', AR_P, E2E40, '1. Open E2E-<run>-U: AI note and decision.',
     'AI note left as written (advisory); a person decided (clarification requested); nothing booked from the AI note.', 'Exception'),
    ('AR-APR-01', 'AR · Approval', 'Approve the payment', 'High', 'Positive', FA, 'AR-DED-02 done.',
     '1. Cash Application > Approvals > approval for NRC-PAY-26-<suffix>; Approve.\n2. Wait a few seconds; open the payment.',
     'DIRECT mode: CLEARING -> CLEARED -> CLOSED; clearCustomerPayment transaction success with FB05… document; ARINV-<suffix>-01/02 settled (open amount 0).', 'Payment + transaction'),
    ('AR-APR-02', 'AR · Approval', 'AR processor cannot approve', 'High', 'Negative', AR_P, 'A pending AR approval.', '1. Open it.', 'Approve / Reject not available (role ar_approver required).', 'Screenshot'),
    ('AR-SAP-01', 'AR · SAP clearing', 'DRAFT mode parks the clearing', 'Medium', 'Positive', ADM + ', ' + FA,
     'Property x_695068_bcfa.ar.sap_processing_mode = draft; x_695068_bcfa.mock_sap.draft_outcome = pending.',
     '1. Approve a pending payment.\n2. Open it; click Check SAP Draft Status.\n3. Set draft_outcome = posted; click Check SAP Draft Status.\n4. Set both properties back (direct / pending).',
     'Step 1: SAP_DRAFT, PARK… document, open items unchanged. Step 2: still waiting, nothing re-sent. Step 3: CLEARED -> CLOSED; one clearing transaction.', 'Payment'),
    ('AR-SAP-02', 'AR · SAP clearing', 'Draft rejected by SAP', 'Low', 'Negative', ADM, 'As AR-SAP-01 with draft_outcome = rejected.', '1. Check SAP Draft Status on a SAP_DRAFT payment.', 'FAILED; exception "SAP rejected the draft".', 'Payment'),
    ('AR-SAP-03', 'AR · SAP clearing', 'Clearing unknown outcome', 'Medium', 'Negative', ADM, 'Mock SAP failure mode timeout.', 'As AP-SAP-03 for a payment.', 'UNKNOWN_OUTCOME; AR Reconciliation Flow resolves it; one clearing only.', 'Integration transactions'),
    ('AR-PB-01', 'AR · Playbook', 'Cash Application Playbook', 'High', 'Positive', AR_P, 'AR-OCR-01 done.',
     '1. On the payment click Open Playbook; open stages 2 and 6.', 'Stage 2 lists the payment advice as extracted (provider shown); stage 6 lists the exception and the deduction with the printed reason.', 'Screenshot'),
    ('AR-CLS-01', 'AR · Closure', 'Audit chain of the payment', 'Medium', 'Positive', AUD, 'AR-APR-01 done.', '1. Open the payment > Audit Events.',
     'record_created, rule_evaluated, document events, match, allocation, exception_created, deduction, approval_*, integration_call (getOpenItems, clearCustomerPayment), integration_result, closure.', 'Audit list'),
    # ---------------------------------------------------------------- AI, security, UX, ops
    ('AI-01', 'AI governance', 'Prompt injection in a document is blocked', 'High', 'Negative', ADM, 'ATF "AI guardrails — injection screening…".', '1. Review the ATF result.', 'Pass: the call is not made; AI Interaction Log status refused / Blocked (not sent).', 'ATF result'),
    ('AI-02', 'AI governance', 'AI identity can never approve', 'High', 'Negative', ADM, 'ATF "AI identity — least privilege…".', '1. Review the ATF result.', 'Pass.', 'ATF result'),
    ('AI-03', 'AI governance', 'AI Interaction Log', 'Medium', 'Positive', AUD, 'Some AI runs.', '1. AI & Audit > AI Interaction Log.', 'Each run: capability, skill, recommendation, confidence, guardrail action, human decision; no prompts stored.', 'List'),
    ('SEC-01', 'Security', 'Finance approver cannot edit invoice amounts', 'High', 'Negative', FA, '—', '1. Open an invoice; try to change Gross Amount.', 'Read-only / write refused.', 'Screenshot'),
    ('SEC-02', 'Security', 'Auditor is read-only', 'High', 'Negative', AUD, '—', '1. Open invoices, payments, exceptions, audit events.', 'Can read; cannot change; Playbook view only.', 'Screenshot'),
    ('SEC-03', 'Security', 'Audit events cannot be changed or deleted', 'High', 'Negative', ADM, '—', '1. Try to edit or delete an Audit Event.', 'Refused by the append-only rule.', 'Error message'),
    ('SEC-04', 'Security', 'State cannot be set by hand', 'Medium', 'Negative', ADM, '—', '1. On a closed payment try to set State = RECEIVED (list edit).', 'Aborted: "State change refused …"; refusal audited.', 'Error message'),
    ('UX-01', 'Workspace', 'Finance Operations landing page', 'Medium', 'Positive', ADM, '—', '1. Open ' + WS_URL, '19 KPI cards (AP, AR, AI, Integration); values refreshed every 15 minutes.', 'Screenshot'),
    ('UX-02', 'Workspace', 'Review Summary on records', 'Medium', 'Positive', AP_P, '—', '1. Open an invoice and a payment.', 'Review Summary at the top with extraction, match, tolerances, tax, exceptions, AI (advisory), approval, integration, audit.', 'Screenshot'),
    ('UX-03', 'Workspace', 'Lists and related lists', 'Low', 'Positive', AP_P, '—', '1. Open AP / Cash Application lists; open Integration Transactions and Audit Events related lists.', 'Lists open with BCFA columns; related lists filtered to the record and its correlation ID.', 'Screenshot'),
    ('OPS-01', 'Operations', 'Demo reset', 'Low', 'Positive', ADM, 'Only on agreement.', 'Test Data step R1.', 'Report "AP 9 of 9, AR 10 of 10 as documented"; POC 2 journeys created.', 'Script output'),
    ('OPS-02', 'Operations', 'Regression suite', 'Medium', 'Positive', ADM, '—', 'Test Data step R4.', 'BCFA Regression 39/39 pass.', 'ATF results'),
    # ---------------------------------------------------------------- Phase 41: POC team defects and the client sample pack
    ('P41-D6', 'Security · Approver', 'Finance Approver enters the Decision Reason', 'High', 'Positive', FA, 'An open AP exception and an AR exception.',
     '1. Open the AP exception; type a Decision Reason; Save.\n2. Repeat on the AR exception.\n3. Try to edit another field.',
     'Decision Reason saved on both; every other field stays read-only for the approver.', 'Saved exception'),
    ('P41-D1', 'AP · Intake', 'Duplicate of a duplicate never loops', 'High', 'Negative', AP_P, 'A file already processed once.',
     '1. Upload the same file twice more and Process Document on each.\n2. Open the earliest intake.',
     'Both later intakes show Duplicate Of = the earliest intake and no new transaction; the earliest intake never points at a later one.', 'Intakes'),
    ('P41-D3', 'AP · Intake', 'Process Document without an attachment', 'Medium', 'Negative', AP_P, '—',
     '1. New intake, Document Type AP Invoice, no file; Save; Process Document.',
     'Message "Attachment required…"; status stays New; no AP invoice and no exception.', 'Intake message'),
    ('P41-D2', 'AP · Intake', 'A new attempt clears the stale error', 'Medium', 'Positive', AP_P, 'P41-D3 done.',
     '1. Attach the invoice PDF to the same intake; Process Document.',
     'The old "Attachment required" message is cleared; the audit trail keeps it.', 'Intake and audit events'),
    ('P41-D4', 'Approvals', 'Who may decide is visible', 'Medium', 'Positive', FA, 'An invoice in PENDING_APPROVAL.',
     '1. Open the approval record.', 'Eligible Approvers lists the users who may decide (requester and processor excluded).', 'Approval'),
    ('P41-D5', 'AP · Match', 'Invoice and PO in different currencies', 'High', 'Negative', AP_P, 'An invoice in USD on an INR PO.',
     '1. Re-run Match.', 'Prices compared after conversion at the governed rate (FX detail on the match), or the invoice goes to review with reason Currency mismatch. Never a raw unit-price comparison.', 'Match / exception'),
    ('P41-D6B', 'AP · Re-run', 'Re-run checks from EXCEPTION and PENDING_APPROVAL', 'High', 'Positive', AP_P, 'An invoice in EXCEPTION and one in PENDING_APPROVAL.',
     '1. Re-run Validation on the first.\n2. Re-run Match on the second.',
     'Checks run again from the current state; earlier exceptions are superseded; the pending approval is Withdrawn and can no longer be decided.', 'Invoice, approval'),
    ('P41-D7', 'UI · Playbook', 'Extracted data readable', 'Medium', 'Positive', AP_P, 'A processed intake.',
     '1. Open the intake, then Open Playbook on its invoice.', 'Extracted Data (readable) in sections on the intake and in the Document Understanding stage; no raw JSON.', 'Screenshot'),
    ('P41-D8', 'AR · Correlation', 'Same reference, different customer is not linked', 'High', 'Negative', AR_P, 'A payment with reference R for customer A.',
     '1. Process an advice with reference R from customer B.', 'Not linked; review names the conflicting customer.', 'Intake message'),
    ('P41-D9', 'AP · Extraction', 'Shipping / handling reconciles', 'High', 'Positive', AP_P, 'Invoice with subtotal + sales tax + shipping (e.g. the Uline invoice pages, split under 4 MB).',
     '1. Upload, Process Document, open the invoice.', 'Charges Amount and Amount Reconciliation = Reconciled; confidence unaffected by the charge.', 'Invoice'),
    ('P41-D10', 'AR · Payment', 'A payment created on the form enters the lifecycle', 'Medium', 'Positive', AR_P, '—',
     '1. Create a payment on the form; Save.', 'State RECEIVED, correlation ID and idempotency key set.', 'Payment'),
    ('P41-CS-01', 'Client samples', 'Latin-script invoices', 'High', 'Positive', AP_P, 'Client pack (ask the BCFA team; not in source control).',
     '1. Upload CS-02, CS-12, CS-16, CS-22 as AP Invoice; Process Document; wait 1-2 minutes.',
     'Critical fields as in CLIENT_DOCUMENT_TEST_MATRIX.md; review only because the vendor is not in the POC master data.', 'Intakes'),
    ('P41-CS-02', 'Client samples', 'Payment advices with per-invoice lines', 'High', 'Positive', AR_P, 'Client pack.',
     '1. Upload CS-04, CS-05, CS-09 as AR Payment Advice; Process Document.',
     'Payer, reference, amount, currency read; per-invoice lines reconcile to the payment (CS-04: TDS per invoice); review only for the customer master data.', 'Intakes'),
    ('P41-CS-03', 'Client samples', 'Large package', 'Medium', 'Negative', AP_P, 'Client pack, CS-28 (14.7 MB).',
     '1. Upload as AP Invoice; Process Document.', 'Review: "native extraction accepts up to 4 MB per file. Upload the invoice pages only"; nothing extracted.', 'Intake message'),
    ('P41-CS-04', 'Client samples', 'Not an invoice', 'Medium', 'Negative', AP_P, 'Client pack, CS-23 (PO + GRN only).',
     '1. Upload as AP Invoice; Process Document.', 'Review; no invoice number, vendor or amount invented.', 'Intake'),
    ('P41-CS-05', 'Client samples', 'Chinese / Korean / Thai invoices (known platform limitation)', 'High', 'Negative', AP_P, 'Client pack, CS-18, CS-19, CS-26.',
     '1. Upload as AP Invoice; Process Document.', 'Fields not read are left empty (no value invented); confidence low; review. See MULTILINGUAL_DOCUMENT_INTELLIGENCE_READINESS.md.', 'Intakes'),
]

E2E_AP = [
    ('Prepare', 'Admin', 'Run scripts/deploy/phase40_demo_prep_<suffix>_bg.js (Scripts - Background, scope x_695068_bcfa).', 'Log line BCFA_DEMO40 prep <suffix>: open items and bank line created.'),
    ('1 Intake', AP_P, 'Document Intake > New; Document Type AP Invoice; attach AP_INV_<suffix>_DEMO_NATIVE.pdf; Save; Process Document.', 'Extracting; message about native extraction.'),
    ('2 Extraction', AP_P, 'Wait ~1 minute; refresh the intake; open the invoice.', 'Intake Completed; INV-AP-<suffix> created; NATIVE EXTRACTION banner; confidence 1.'),
    ('3 Validation', AP_P, 'Read the Review Summary (vendor, PO, duplicate check).', 'Vendor Rajasthan Carbon Feedstock Pvt Ltd, PO0001; no exception.'),
    ('4 Tax', AP_P, 'Read Tax Validation fields.', 'GST regime, expected 900, Pass, rule source decision table.'),
    ('5 Match', AP_P, 'AP Match related list.', 'Matched within tolerance; tolerance detail per check.'),
    ('6 Playbook', AP_P, 'Open Playbook.', 'Stages 1–5 complete; stage 6 Approval in progress, owner Finance Approver.'),
    ('7 Approval', FA, 'AP > Approvals > Approve.', 'Approval decided with SoD checks.'),
    ('8 SAP posting', FA, 'Refresh the invoice; Integration Transactions.', 'postVendorInvoice success, MIRO… document, POSTED.'),
    ('9 Closure', AUD, 'Refresh; Audit Events; Playbook.', 'CLOSED; all 8 stages complete; full audit chain.')]
E2E_AR = [
    ('Prepare', 'Admin', 'Same prep script as AP (creates ARINV-<suffix>-01/02 and bank line NRC-PAY-26-<suffix>).', 'Open items and bank line exist.'),
    ('1 Bank line', AR_P, 'Payments > NRC-PAY-26-<suffix>.', 'EXCEPTION, customer ambiguous, waiting for the advice (stage 3).'),
    ('2 Advice intake', AR_P, 'Document Intake > New; AR Payment Advice; attach AR_REMIT_<suffix>_DEMO_NATIVE.pdf; Save; Process Document.', 'Extracting.'),
    ('3 Extraction and correlation', AR_P, 'Wait ~1 minute; refresh the intake and the payment.', 'Intake Completed; remittance linked; customer Nilgiri Rubber Compounds Ltd.'),
    ('4 Open items', AR_P, 'Payment > Integration Transactions.', 'getOpenItems success (MOCK SAP).'),
    ('5 Match and allocation', AR_P, 'Match Candidates, Allocations.', 'Both references matched; allocated 80,000; residual −1,600.'),
    ('6 Deduction', AR_P, 'Short Pay exception: Deduction Type Withholding Tax, Decision Reason; Update; Approve Deduction.', 'Deduction 1,600 withholding recorded (human_confirmed); payment PENDING_APPROVAL.'),
    ('7 Approval', FA, 'Cash Application > Approvals > Approve.', 'Approved with SoD checks.'),
    ('8 SAP clearing', FA, 'Refresh payment; Integration Transactions; open items.', 'clearCustomerPayment success FB05… (DIRECT); open items settled; CLOSED.'),
    ('9 Closure', AUD, 'Playbook; Audit Events.', 'All 9 stages complete; full audit chain.')]

DATA = [
    ('R1', 'Demo data reset (optional, on agreement)', 'Admin: Scripts - Background, scope x_695068_bcfa, run scripts/deploy/phase28_reset_and_reseed_bg.js. Restores INV-AP-001..010, BANK-AR-001..010, BANK-POC2-001..003, INV-PLAY-01..04, BANK-PLAY-01..07.'),
    ('R2', 'Fresh demo pack for E2E tests', 'python scripts/fixtures/gen_phase40_demo_journeys.py <suffix> (new suffix per run, e.g. T1), then run scripts/deploy/phase40_demo_prep_<suffix>_bg.js (scope x_695068_bcfa). Packs D1 (used for rehearsal on 2026-10-05) and D2 (reserved for the client demo) already exist.'),
    ('R3', 'Tax / tolerance / deduction scenarios', 'Run scripts/deploy/phase40_e2e_bg.js (scope x_695068_bcfa). Creates invoices E2E-<run>-T1, T2, T4, T5, T6, Q1, Q2 and payments E2E-<run>-T, U, R; the log line BCFA_E2E40 run <run> lists the results.'),
    ('R4', 'Automated regression', 'Run the ATF suite BCFA Regression (49 tests), one test at a time if the instance is busy; results in Automated Test Framework > Test Results.'),
    ('Users', 'Personas', 'bcfa.ap.processor, bcfa.ar.processor, bcfa.finance.approver, bcfa.finance.controller (impersonate from an admin account; no passwords needed).'),
    ('Fixtures', 'Synthetic PDFs', 'test/fixtures: AP_INV_001..006, AP_INV_101..105 (GST, IGST, German VAT, WHT, 2-page), AR_REMIT_001..005, 101..103, 201..204, *_D1/_D2_DEMO_NATIVE. All watermarked SYNTHETIC.'),
    ('Properties', 'Settings used by tests', 'x_695068_bcfa.document.extraction.provider (native), x_695068_bcfa.sap.adapter (mock_sap), x_695068_bcfa.ar.sap_processing_mode (direct / draft), x_695068_bcfa.mock_sap.draft_outcome, Integration Profile "Mock SAP - Default" failure mode. Restore after each negative test.'),
    ('Workspace', 'URL', WS_URL)]


def header(ws, cols, widths):
    ws.append(cols)
    for i, w in enumerate(widths, 1):
        c = ws.cell(row=1, column=i)
        c.fill, c.font, c.alignment, c.border = NAVY, WHITE_BOLD, Alignment(wrap_text=True, vertical='center'), BORDER
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = 'A2'
    ws.row_dimensions[1].height = 30


def body(ws, start_row):
    for r in ws.iter_rows(min_row=start_row):
        for c in r:
            c.alignment, c.border = WRAP, BORDER
        if r[0].row % 2 == 0:
            for c in r:
                if not c.fill or c.fill.fgColor.rgb in (None, '00000000'):
                    c.fill = LIGHT


def status_validation(ws, col, last_row):
    dv = DataValidation(type='list', formula1='"%s"' % ','.join(STATUSES), allow_blank=False)
    ws.add_data_validation(dv)
    rng = '%s2:%s%d' % (col, col, last_row)
    dv.add(rng)
    for color, val in (('C6EFCE', 'Pass'), ('FFC7CE', 'Fail'), ('FFEB9C', 'Blocked')):
        ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"%s"' % val], fill=PatternFill('solid', fgColor=color)))


wb = Workbook()
rd = wb.active
rd.title = 'Read Me'
rd.column_dimensions['A'].width = 24
rd.column_dimensions['B'].width = 110
for row in [
    ('BCFA Manual Test Workbook', ''),
    ('Application', 'Birla Carbon Finance Automation (x_695068_bcfa) on pwcmanagementservicesdemo01 (Yokohama)'),
    ('Version', 'Phase 41, 2026-10-08'),
    ('Purpose', 'Manual testing of the AP and Cash Application journeys end to end, from document intake to SAP posting / clearing and closure, plus extraction, tax, tolerances, deductions, AI, Playbooks, workspace, security and audit.'),
    ('How to use', '1. Prepare data (sheet Test Data). 2. Run the E2E sheets first, then the Test Cases. 3. For every case record Actual Result, Status (Not Run / Pass / Fail / Blocked / N/A), Tester and Date. 4. Log failures in Defects and put the Defect ID on the case. 5. Summary counts the results.'),
    ('Placeholders', '<suffix> = the demo pack code (e.g. D2); <run> = the code printed by phase40_e2e_bg.js (e.g. 63D87).'),
    ('Personas', 'Switch with Impersonate User from an admin account. Approvals must be decided by a different user from the requester and the processor (segregation of duties).'),
    ('Limits', 'Test documents are SYNTHETIC except the client sample pack (P41-CS cases; kept out of source control); SAP is MOCK SAP; thresholds and tax rates are POC ASSUMPTION / POC REFERENCE DATA. Known platform limitation: Chinese VAT e-invoices and scanned Korean / Thai documents are not read (manual review).'),
    ('Shared instance', 'Restore every property or integration profile you change for a negative test.')]:
    rd.append(row)
rd['A1'].font = Font(bold=True, size=16, color='1F3864')
for r in rd.iter_rows(min_row=2):
    r[0].font = Font(bold=True)
    for c in r:
        c.alignment = WRAP

ws = wb.create_sheet('Test Cases')
cols = ['Test ID', 'Area', 'Scenario', 'Priority', 'Type', 'Persona', 'Preconditions / data', 'Steps', 'Expected result', 'Evidence to capture',
        'Actual result', 'Status', 'Tester', 'Date', 'Defect ID', 'Comments']
header(ws, cols, [11, 16, 30, 9, 10, 22, 30, 48, 52, 18, 30, 11, 12, 11, 11, 24])
for c in CASES:
    ws.append(list(c) + ['', 'Not Run', '', '', '', ''])
body(ws, 2)
ws.auto_filter.ref = 'A1:P%d' % (len(CASES) + 1)
status_validation(ws, 'L', len(CASES) + 1)

for name, rows in (('E2E AP', E2E_AP), ('E2E AR', E2E_AR)):
    s = wb.create_sheet(name)
    header(s, ['Step', 'Persona', 'Action', 'Expected result', 'Actual result', 'Status', 'Tester', 'Date', 'Notes'], [20, 30, 60, 55, 30, 11, 12, 11, 25])
    for r in rows:
        s.append(list(r) + ['', 'Not Run', '', '', ''])
    body(s, 2)
    status_validation(s, 'F', len(rows) + 1)

td = wb.create_sheet('Test Data')
header(td, ['Ref', 'Item', 'Detail'], [10, 34, 110])
for r in DATA:
    td.append(r)
body(td, 2)

df = wb.create_sheet('Defects')
header(df, ['Defect ID', 'Test ID', 'Summary', 'Steps to reproduce', 'Expected', 'Actual', 'Severity', 'Status', 'Raised by', 'Date', 'Owner', 'Resolution'],
       [10, 11, 30, 40, 30, 30, 10, 11, 14, 11, 14, 30])
df.append(['D6', 'AP-EXC-05', 'Finance approver cannot type the Decision Reason on an exception', 'Impersonate bcfa.finance.approver; open an AP exception; try to edit Decision Reason',
           'Approver can enter the reason', 'Field read-only (write ACL allows processor and admin only)', 'Medium', 'Open', 'Build team', '2026-10-05', 'Instance owner / security_admin',
           'Workaround: processor enters the reason, approver approves'])
body(df, 2)
sev = DataValidation(type='list', formula1='"Critical,High,Medium,Low"')
st = DataValidation(type='list', formula1='"Open,In progress,Fixed,Retest,Closed,Rejected"')
df.add_data_validation(sev)
df.add_data_validation(st)
sev.add('G2:G500')
st.add('H2:H500')

sm = wb.create_sheet('Summary', 1)
sm.column_dimensions['A'].width = 26
for col in 'BCDEFG':
    sm.column_dimensions[col].width = 11
sm.append(['Area', 'Total', 'Pass', 'Fail', 'Blocked', 'Not Run', 'N/A'])
for i in range(1, 8):
    c = sm.cell(row=1, column=i)
    c.fill, c.font, c.border = NAVY, WHITE_BOLD, BORDER
areas = []
for c in CASES:
    if c[1] not in areas:
        areas.append(c[1])
n = len(CASES) + 1
for a in areas:
    r = sm.max_row + 1
    sm.append([a, '=COUNTIF(\'Test Cases\'!B2:B%d,A%d)' % (n, r)] +
              ['=COUNTIFS(\'Test Cases\'!B2:B%d,A%d,\'Test Cases\'!L2:L%d,"%s")' % (n, r, n, s) for s in ('Pass', 'Fail', 'Blocked', 'Not Run', 'N/A')])
tot = sm.max_row + 1
sm.append(['Total'] + ['=SUM(%s2:%s%d)' % (col, col, tot - 1) for col in 'BCDEFG'])
for e2e, rows in (('E2E AP', E2E_AP), ('E2E AR', E2E_AR)):
    k = len(rows) + 1
    sm.append([e2e + ' (steps)', '=COUNTA(\'%s\'!A2:A%d)' % (e2e, k)] + ['=COUNTIF(\'%s\'!F2:F%d,"%s")' % (e2e, k, s) for s in ('Pass', 'Fail', 'Blocked', 'Not Run', 'N/A')])
for r in sm.iter_rows(min_row=2):
    for c in r:
        c.border = BORDER
for c in sm[tot]:
    c.font = Font(bold=True)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
wb.save(OUT)
print('written', OUT, len(CASES), 'cases')
