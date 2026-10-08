"""Builds deliverables/BCFA_Client_Demo_Script.docx: the presenter's script for
the client demo of the BCFA POC: AP and Cash Application end to end, from
document intake to MOCK SAP posting / clearing and closure.

  python scripts/deliverables/build_demo_script.py [SUFFIX]   (default D2)
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docx_kit import (SAY_FILL, box, bullets, h, new_document, numbered, page_break, para, table, toc, TEAL)  # noqa: E402

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
S = sys.argv[1] if len(sys.argv) > 1 else 'D2'
OUT = os.path.join(REPO, 'deliverables', 'BCFA_Client_Demo_Script.docx')
WS = 'https://pwcmanagementservicesdemo01.service-now.com/now/bcfa/home'
INV = 'INV-AP-' + S
PAY = 'NRC-PAY-26-' + S
AP_PDF = 'AP_INV_%s_DEMO_NATIVE.pdf' % S
AR_PDF = 'AR_REMIT_%s_DEMO_NATIVE.pdf' % S
APP, ARP, FAP, FCT = 'bcfa.ap.processor', 'bcfa.ar.processor', 'bcfa.finance.approver', 'bcfa.finance.controller'


def say(doc, *lines):
    box(doc, 'SAY', list(lines), fill=SAY_FILL, title_color=TEAL)


def steps(doc, rows):
    table(doc, ['#', 'Do (click)', 'The audience sees', 'Point out'], rows, widths=[0.8, 5.6, 5.6, 5], font=8.5)


doc = new_document(
    'BCFA Client Demo Script',
    'Birla Carbon Finance Automation on ServiceNow: AP and Cash Application end to end, from document intake to SAP posting, clearing and closure',
    [('Audience', 'Birla Carbon finance (AP, AR / cash application, controllership), IT and SAP stakeholders'),
     ('Duration', 'About 60 minutes plus questions (core path 40 minutes)'),
     ('Instance / workspace', WS),
     ('Demo data pack', '%s: invoice %s, payment %s, open items ARINV-%s-01 / -02, files %s and %s' % (S, INV, PAY, S, AP_PDF, AR_PDF)),
     ('Presenter account', 'An admin account that can impersonate the demo users (no demo passwords are needed or shown)'),
     ('Status', 'Phase 40, 2026-10-05. Documents are SYNTHETIC; SAP is MOCK SAP')])
toc(doc)

# 1 ------------------------------------------------------------------------
h(doc, '1. The demo at a glance')
box(doc, 'Key message', ['OCR extracts facts. Rules decide. AI explains. People approve. SAP stays the system of record.',
                         'Everything happens on native ServiceNow: Document Intelligence on the ServiceNow-hosted Now LLM reads the documents, decision tables and '
                         'the matching engine decide, Now Assist explains, people approve, and every step is audited.'])
table(doc, ['Act', 'What the client sees', 'Persona', 'Minutes'], [
    ('0', 'Opening: the problem, the principle, what is real and what is simulated', 'Presenter', '3'),
    ('1', 'Finance Operations landing page', 'Admin', '3'),
    ('2', 'AP end to end: upload an invoice PDF -> native extraction -> validation and GST check -> 3-way match -> approval -> posting to SAP (MOCK) -> closure', 'AP processor, finance approver', '15'),
    ('3', 'AP exceptions with AI advice: tolerance breach, tax mismatch, override with segregation of duties', 'AP processor, finance controller', '8'),
    ('4', 'Cash Application end to end: bank line -> payment advice PDF -> native extraction -> customer and open items -> match -> TDS deduction -> approval -> clearing in SAP (MOCK) -> closure', 'AR processor, finance approver', '15'),
    ('5', 'SAP DRAFT mode (optional)', 'Finance approver', '4'),
    ('6', 'Controls: AI governance, audit trail, segregation of duties, unknown outcome', 'Admin / auditor', '6'),
    ('7', 'Close and next steps', 'Presenter', '3')], widths=[1, 10.5, 4, 1.5])
h(doc, '1.1 Be upfront about what is real', 2)
table(doc, ['Area', 'In this POC', 'In production'], [
    ('Reading documents', 'Real: ServiceNow Document Intelligence (generative) on Now LLM. The documents are synthetic and watermarked; accuracy on Birla Carbon documents has not been measured yet', 'Same service, measured and tuned on Birla Carbon samples per country'),
    ('Rules (tax, tolerances, deductions, approvals)', 'Real decision tables and engine; the values are POC assumptions / POC reference data', 'Values agreed with finance and tax'),
    ('SAP', 'MOCK SAP: posting (MIRO…), clearing (FB05…), parked documents (PARK…), open items; idempotency and unknown-outcome handling are real', 'SAP ECC through IntegrationHub / middleware'),
    ('Bank statement', 'Bank line created by the demo preparation script', 'Bank statement integration (MT940 / CAMT)'),
    ('AI', 'Real Now Assist skills and agents, advisory only', 'Same')], widths=[3.5, 8, 5.5])
h(doc, '1.2 Cast', 2)
table(doc, ['Persona', 'User', 'Used for'], [
    ('AP processor', APP, 'Uploading invoices; exception actions other than approval'),
    ('AR processor', ARP, 'Uploading payment advices; confirming deductions'),
    ('Finance approver', FAP, 'Approving invoices and payments'),
    ('Finance controller', FCT, 'Tolerance overrides and high-value approvals'),
    ('Admin (presenter)', 'your account', 'Landing page, impersonation, AI & Audit lists')], widths=[3.5, 4.5, 9])
para(doc, 'Switch persona from the user menu (top right) > Impersonate User. Stop impersonating the same way. Never type or show passwords.', italic=True)

# 2 ------------------------------------------------------------------------
h(doc, '2. Before the demo')
h(doc, '2.1 The day before', 2)
numbered(doc, [
    'Rehearse once with a throw-away pack: python scripts/fixtures/gen_phase40_demo_journeys.py R1, run scripts/deploy/phase40_demo_prep_R1_bg.js, and walk Acts 2 and 4 with test/fixtures/AP_INV_R1_DEMO_NATIVE.pdf and AR_REMIT_R1_DEMO_NATIVE.pdf. (Pack D1 was used for the dry run on 2026-10-05; its records stay as a fallback.)',
    'Optional, only if a clean data set is wanted and agreed: run the demo reset (scripts/deploy/phase28_reset_and_reseed_bg.js, scope x_695068_bcfa). It restores the seeded scenarios used in Acts 3, 5 and 6. Do it at least 15 minutes before the landing page is shown (KPI refresh).',
    'Check the settings (System Properties): x_695068_bcfa.document.extraction.provider = native; x_695068_bcfa.sap.adapter = mock_sap; x_695068_bcfa.ar.sap_processing_mode = direct; x_695068_bcfa.mock_sap.draft_outcome = pending; Integration Profile "Mock SAP - Default" failure mode = success.',
    'Check Now Assist: open any AP exception, click Explain with Now Assist; a note appears within 5–60 seconds.',
    'Copy %s and %s from test/fixtures to the presenting laptop (desktop). Open both PDFs in a viewer so you can show them.' % (AP_PDF, AR_PDF)])
h(doc, '2.2 Thirty minutes before', 2)
numbered(doc, [
    'Admin: System Definition > Scripts - Background, scope x_695068_bcfa, paste or load scripts/deploy/phase40_demo_prep_%s_bg.js, Run. Expect "BCFA_DEMO40 prep %s: ARINV-%s-01 created; ARINV-%s-02 created; bank line %s INR 78,400 created …".' % (S, S, S, S, PAY),
    'Within a minute the bank line %s goes to EXCEPTION (customer ambiguous): it is waiting for its payment advice. That is the starting point of Act 4.' % PAY,
    'Open browser tabs: the workspace home (%s); Document Intake (New); AP > Invoices; AP > Approvals; Cash Application > Payments; Cash Application > Approvals; AI & Audit > AI Interaction Log.' % WS,
    'Close notifications and zoom the browser to 110–125 % for the room.'])
box(doc, 'Fallback records (already processed on 2026-10-05)', [
    ('AP: ', 'INV-AP-D1 (native extraction, tax PASS, waiting for approval) and INV-AP-N1.'),
    ('AR: ', 'NRC-PAY-26-D1 (advice read, customer resolved, short pay 1,600 suggested as withholding) and NRC-PAY-26-1005.'),
    ('Use them ', 'if extraction is slow during the live run; the steps from "approval" onwards are identical.')])

# 3 ------------------------------------------------------------------------
h(doc, '3. Act 0: Opening (3 minutes)')
say(doc, 'Today we follow one supplier invoice and one customer payment all the way through: from the PDF arriving, to the posting or clearing in SAP, to closure.',
    'Everything runs on native ServiceNow. ServiceNow Document Intelligence reads the documents on ServiceNow\'s own language model; decision tables and a '
    'deterministic matching engine decide; Now Assist explains and drafts; people approve. SAP stays the financial system of record.',
    'In this POC the documents are synthetic, SAP is a mock that behaves like SAP, and the thresholds and tax rates are POC values for us to agree together.')

h(doc, '4. Act 1: Finance Operations landing page (3 minutes)')
steps(doc, [
    ('1', 'Open the workspace home: ' + WS, 'Finance Operations dashboard with 19 KPI cards: AP, AR, AI, Integration', 'Live counts; rates recomputed every 15 minutes, each with how it was computed'),
    ('2', 'Point at AP open exceptions, pending approvals, straight-through rate', 'Numbers reflect the demo set, built to show exceptions', 'The real baseline comes from a pilot on representative volume'),
    ('3', 'Point at AI-assisted reviews and recommendation acceptance; integration failures and UNKNOWN_OUTCOME', 'AI and integration are measured like any other process', 'Nothing is hidden: overrides of AI advice are counted')])

# 5 ------------------------------------------------------------------------
h(doc, '5. Act 2: AP end to end (15 minutes)')
para(doc, 'Persona: impersonate %s.' % APP, bold_lead='Start: ')
h(doc, '5.1 Document intake', 2)
steps(doc, [
    ('1', 'Show the PDF %s on screen' % AP_PDF, 'Tax invoice from Rajasthan Carbon Feedstock Pvt Ltd, PO0001, 100 MT carbon black feedstock at 50, IGST 18 % = 900, total INR 5,900', 'A normal supplier invoice; watermark SYNTHETIC'),
    ('2', 'Workspace > Document Intake > New. Document Type = AP Invoice. Attach the PDF. Save', 'Intake record FDI-… with the attachment', 'Email, upload or SFTP would land here the same way'),
    ('3', 'Click Process Document', 'Message: "Native extraction is running (ServiceNow Document Intelligence)…"; Processing Status Extracting; Extraction Provider: Native: ServiceNow Document Intelligence (Now LLM)', 'The file hash is recorded; uploading the same file twice is caught as a duplicate')])
say(doc, 'While it reads (about a minute): Document Intelligence runs on the ServiceNow-hosted Now LLM, not an external AI service. It returns only facts '
    'printed on the document. It does not decide anything: if it is not sure, the document goes to a person, never to a guess.')
h(doc, '5.2 Extraction result', 2)
steps(doc, [
    ('4', 'Refresh the intake after ~1 minute', 'Processing Status Completed; AP Invoice = %s; Extraction Confidence 1' % INV, 'Confidence is derived from completeness and arithmetic checks (net + tax = total, line sum = net)'),
    ('5', 'Open %s. Read the Review Summary from the top' % INV, 'Banner NATIVE EXTRACTION — ServiceNow Document Intelligence (Now LLM) · MOCK SAP; vendor, PO0001, INR, net 5,000, IGST 900, total 5,900; one line 100 MT × 50', 'Vendor and PO were resolved against master data; the invoice was created only after that'),
    ('6', 'Point at Tax Type, Tax Rate Pct, IGST Amount, Document Country, Document Language', 'IGST, 18, 900, India, English', 'The tax breakdown is stored as printed; it is validated separately')])
h(doc, '5.3 Validation and GST check', 2)
steps(doc, [
    ('7', 'Scroll to the tax section (Tax Regime, Expected Tax Amount, Tax Validation, Tax Validation Detail, Tax Rule Source)', 'GST, expected 900, Pass; detail "PASS: tax 900 vs expected 900 (GST 18 % of net 5000)…", "PASS: IGST 900 (inter-state) agrees with the total tax"; rule source: decision table BCFA AP Tax Expectation (India: GST 18 %) - POC REFERENCE DATA', 'The expected rate comes from configuration by country, company and vendor category, never from the document. Results: PASS / WITHIN TOLERANCE / WARNING / FAIL / MANUAL REVIEW'),
    ('8', 'Point at the duplicate and PO checks in the Review Summary', 'No duplicate (vendor + normalised invoice number), PO belongs to the vendor and is open', 'Deterministic rules, every one audited')])
h(doc, '5.4 3-way match', 2)
steps(doc, [
    ('9', 'Open the AP Match related list', 'Line vs PO line vs goods receipt RCPT0001: quantity 100 vs 100, price 50 vs 50, within tolerance; Tolerance Source = decision table; Tolerance Detail with expected / actual / variance / result for each check', 'Tolerances (quantity 2 %, price 2 %, tax, total, rounding) are configuration in a decision table, applied by one engine; AI never overrides them')])
h(doc, '5.5 The journey in the Playbook', 2)
steps(doc, [
    ('10', 'Click Open Playbook', 'AP Invoice Playbook: stages 1–5 complete, stage 6 Approval in progress, owner Finance Approver', 'The Playbook only shows the journey; it cannot change data'),
    ('11', 'Open stage 2 and stage 4', 'Stage 2: extraction provider, tax breakdown, confidence. Stage 4: match results and Tolerances applied', 'Every stage shows the evidence behind it')])
h(doc, '5.6 Approval', 2)
steps(doc, [
    ('12', 'Impersonate %s. Workspace > AP > Approvals. Open the approval for %s' % (FAP, INV), 'Approval requested for BCFA Finance Approvers (from the decision table BCFA AP Approval)', 'Approval routing is configuration: high value or large variances go to the controllers'),
    ('13', 'Optional comment in Decision Notes. Click Approve', 'Message "Approved — posting cascade triggered."; segregation-of-duties result on the approval: not an AI identity, holds ap_approver, not the requester, not the processor, member of the group', 'The person who processed the invoice cannot approve it; neither can AI')])
h(doc, '5.7 Posting to SAP (MOCK SAP) and closure', 2)
steps(doc, [
    ('14', 'Open %s again after a few seconds' % INV, 'State APPROVED -> POSTING -> POSTED -> CLOSED; SAP Document ID MIRO…; Posting State Posted', 'The flow posted it, not a person and not AI'),
    ('15', 'Open the Integration Transactions related list', 'postVendorInvoice: adapter mock_sap, idempotency key AP-POST-…, status success, document MIRO…', 'One key per invoice: a retry can never post twice; a timeout is reconciled by asking SAP, never by re-sending'),
    ('16', 'Open Playbook again; then Audit Events', 'All 8 stages complete. Audit: uploaded, extracted, created, validated, matched, approval requested, approved (with SoD), integration call, SAP result, closure — each with actor and time', 'This is the evidence an auditor gets for every invoice')])

# 6 ------------------------------------------------------------------------
h(doc, '6. Act 3: AP exceptions with AI advice (8 minutes)')
para(doc, 'Uses seeded records (after a demo reset) and the Phase 40 E2E records. Persona: %s.' % APP, bold_lead='Data: ')
steps(doc, [
    ('1', 'AP > Exceptions. Open the Quantity tolerance exception of INV-AP-004', '15 units invoiced vs 10 received, beyond the 2 % tolerance; number APEX…, severity, SLA, owner, rule result, evidence', 'The system decided this is an exception; the evidence is deterministic'),
    ('2', 'Show the AI recommendation; click Explain with Now Assist', 'Advisory note: explains the 50 % variance, recommends asking the supplier, includes a draft message marked NOT sent', 'AI explains and drafts. It reads only this exception\'s evidence, input is screened for prompt injection, and any sentence claiming an action was done is removed'),
    ('3', 'Optional: open a tax exception: invoice E2E-<run>-T2 (GST 50 printed vs 900 expected) or E2E-<run>-T4 (VAT 7 % vs 19 %)', 'Tax Validation Fail with each check listed; subtype gst / vat', 'The same governed expectation catches GST, VAT and withholding mismatches'),
    ('4', 'On the INV-AP-004 exception click Approve Override with no reason', 'Refused: a reason of at least 10 characters is mandatory', 'Controls are code'),
    ('5', 'As %s enter Decision Reason "Receipt of 5 additional units confirmed by warehouse", Update. Impersonate %s, click Approve Override' % (APP, FCT), 'Override approved; an approval recorded with the controller and SoD checks; the invoice posts to MOCK SAP and closes', 'Maker / checker: the processor records why, an authorised controller decides (known limitation D6: approvers cannot type the reason themselves yet)')])

# 7 ------------------------------------------------------------------------
h(doc, '7. Act 4: Cash Application end to end (15 minutes)')
para(doc, 'Persona: impersonate %s.' % ARP, bold_lead='Start: ')
say(doc, 'This morning a bank line of INR 78,400 arrived. The bank tells us the amount and a reference, but not who paid or which invoices it covers.')
h(doc, '7.1 The bank line is waiting', 2)
steps(doc, [
    ('1', 'Cash Application > Payments. Open %s' % PAY, 'INR 78,400, no customer; state EXCEPTION; Customer Ambiguous exception', 'The system never guesses the customer'),
    ('2', 'Open Playbook', 'Stage 3 Customer Resolution blocked: WHAT HAPPENED / WHY "Bank line received without a remittance…" / NEXT / WHO', 'Clear ownership of every blocked item')])
h(doc, '7.2 Payment advice intake and native extraction', 2)
steps(doc, [
    ('3', 'Show the PDF %s' % AR_PDF, 'Payment advice from Nilgiri Rubber Compounds Ltd: reference %s, two invoices ARINV-%s-01 (50,000) and -02 (30,000), TDS @2 %% deducted (1,000 + 600), paid 78,400' % (PAY, S), 'A typical Indian customer advice with TDS'),
    ('4', 'Document Intake > New. Document Type = AR Payment Advice. Attach the PDF. Save. Process Document', 'Native extraction is running; Extracting', 'Same native reading as for invoices, with a payment-advice field set'),
    ('5', 'After ~1 minute refresh the intake', 'Completed; Remittance linked to %s' % PAY, 'The advice is matched to the bank line by its reference; an ambiguous match would go to a person')])
h(doc, '7.3 Customer, open items from SAP, match', 2)
steps(doc, [
    ('6', 'Refresh %s' % PAY, 'Customer Nilgiri Rubber Compounds Ltd; the Customer Ambiguous exception resolved', 'The customer came from the advice, deterministically'),
    ('7', 'Integration Transactions related list', 'getOpenItems via mock_sap, success, before the match', 'Open items are read from SAP through the integration layer, then matched'),
    ('8', 'Match Candidates and Allocations', 'Two remittance candidates (confidence 1, selected): ARINV-%s-01 and -02; allocations 50,000 and 30,000; residual −1,600' % S, 'Precedence: references on the advice, then exact amount, then exact combinations; ambiguity goes to a person')])
h(doc, '7.4 The TDS deduction', 2)
steps(doc, [
    ('9', 'Open the Short Pay exception', 'Residual 1,600 short. Rule suggestion: WITHHOLDING_TAX — within the withholding limit (10 %), "the advice states: TDS @2%"', 'The rule suggests; the reason printed on the advice is the evidence, not the decision'),
    ('10', 'Set Deduction Type = Withholding Tax; Decision Reason "TDS 2 % — certificate to follow"; Update; click Approve Deduction', '"Deduction withholding_tax 1600 approved. Payment state: PENDING_APPROVAL (awaiting approval by a different user)."', 'Limits per type are in a decision table: bank charge ≤ 1,000, rounding ≤ 1, withholding ≤ 10 %; disputes are never deductions'),
    ('11', 'Cash Application > Deductions (or the payment\'s deductions)', 'Deduction 1,600 withholding tax, currency INR, advice reason, category source human_confirmed', 'Who decided and why is kept with the money')])
h(doc, '7.5 Approval, clearing in SAP (MOCK SAP), closure', 2)
steps(doc, [
    ('12', 'Impersonate %s. Cash Application > Approvals. Approve the approval for %s' % (FAP, PAY), '"Approved — clearing cascade triggered."; SoD checks recorded', 'The AR processor who accepted the deduction cannot approve the payment'),
    ('13', 'Open %s after a few seconds; Integration Transactions' % PAY, 'DIRECT mode: CLEARING -> CLEARED -> CLOSED; clearCustomerPayment success, document FB05…', 'Clearing is idempotent; an unknown outcome is reconciled by a status query'),
    ('14', 'AR Open Items: ARINV-%s-01 and -02' % S, 'Open amount 0, status cleared', 'A cleared invoice can never be applied twice'),
    ('15', 'Open Playbook; Audit Events', 'All 9 stages complete; full evidence chain including the deduction and both integration calls', '')])

# 8 ------------------------------------------------------------------------
h(doc, '8. Act 5 (optional): SAP DRAFT mode (4 minutes)')
para(doc, 'Uses the seeded payment BANK-PLAY-02 (after a demo reset), which is waiting in SAP_DRAFT.', italic=True)
steps(doc, [
    ('1', 'Open BANK-PLAY-02', 'State SAP_DRAFT; SAP reference PARK…; open item PB-ARI-02 still open', 'DRAFT mode parks the clearing in SAP for SAP-side review; nothing counts as cleared until SAP confirms'),
    ('2', 'Click Check SAP Draft Status', 'Still waiting (pending); nothing re-sent', 'A status query only, never a second send'),
    ('3', 'Optional (admin): set x_695068_bcfa.mock_sap.draft_outcome = posted; click Check SAP Draft Status; set it back to pending', 'CLEARED -> CLOSED; one clearing transaction', 'Mode is configuration: x_695068_bcfa.ar.sap_processing_mode = direct / draft')])

h(doc, '9. Act 6: Controls (6 minutes)')
steps(doc, [
    ('1', 'AI & Audit > AI Interaction Log', 'Every AI run: skill / agent, provider now_assist, guardrail action, human outcome (accepted / overridden); a refused row for a remittance with injected instructions', 'AI never approves, posts, clears or overrides a tolerance; the AI identity holds no approver role'),
    ('2', 'Audit Events filtered by the correlation ID of %s' % INV, 'The full chain in order, append-only', 'Audit events cannot be changed or deleted'),
    ('3', 'SoD beat: as the user who requested an approval, click Approve', 'Refused: "the requester cannot approve their own request"', 'Segregation of duties applies to admins too'),
    ('4', 'Open INV-PLAY-04 > Integration Transactions / Audit', 'A MOCK SAP timeout (UNKNOWN_OUTCOME) reconciled by a status query; exactly one posting', 'No blind retries of financial writes')])

h(doc, '10. Act 7: Close (3 minutes)')
say(doc, 'Recap: two journeys end to end on native ServiceNow; documents read natively; tax, tolerances and deductions governed by configuration; '
    'AI that explains but never acts; people approve; SAP stays the system of record; every step evidenced.')
bullets(doc, ['Next 1: measure native extraction on Birla Carbon sample invoices and payment advices per country (we bring the measurement method).',
              'Next 2: agree tax expectations (GST place of supply, VAT reduced rates, TDS sections), tolerances and deduction limits with finance and tax.',
              'Next 3: connect an SAP test system (Mode 2): RealSAPAdapter through IntegrationHub or your middleware.',
              'Next 4: a pilot on one entity\'s volume, measured by the POC scorecard.'])

# 11 -----------------------------------------------------------------------
h(doc, '11. Questions you may get')
table(doc, ['Question', 'Answer'], [
    ('How accurate is the OCR?', 'On 23 synthetic documents (India, Germany incl. German, Hungary 2 pages / 44 lines, US): header fields 231 of 236, all 346 line values, critical fields 123–124 of 125. We have not measured Birla Carbon documents yet; that is the first next step.'),
    ('Which languages and countries?', 'Tested: English and German, INR / EUR / USD, Indian and European number formats. Not tested: scans, photos, handwriting, non-Latin scripts. We do not claim universal OCR.'),
    ('Is an external AI (OpenAI, Claude…) involved?', 'No. Document Intelligence runs on ServiceNow\'s own Now LLM Service; Now Assist skills and agents are ServiceNow-native.'),
    ('Can the AI approve or post?', 'No. AI identities have no approver role; segregation of duties refuses them in code; posting and clearing only follow a human approval.'),
    ('What if SAP times out?', 'The transaction goes to UNKNOWN_OUTCOME and is reconciled by asking SAP for the status; it is never re-sent blindly; one idempotency key per invoice / payment.'),
    ('Where do tax rates come from?', 'From a decision table (country, company, vendor tax category), POC reference data today; in production from your tax setup or SAP tax codes. Never from the document.'),
    ('How are tolerances changed?', 'In the decision table BCFA AP Tolerance (by company, country, vendor type, invoice type) without code; properties are the fallback.'),
    ('What about TDS on receipts?', 'The advice\'s stated reason is evidence; the rule suggests withholding within the configured limit; a person confirms; the deduction keeps the printed reason and who confirmed it.'),
    ('What is standard ServiceNow and what is custom?', 'Standard: Document Intelligence, Now Assist, AI Agents, Flow Designer, Decision Builder, Playbooks, Workspace, ATF. Custom: the matching engine, tax comparison, domain services and the SAP adapter seam (see the Standard vs Custom assessment).'),
    ('How long to production?', 'Indicatively 32–56 person-weeks for AP and AR in the first countries, driven mainly by real document quality and SAP interface availability (Production Implementation Estimate).')],
    widths=[4.5, 12.5])

h(doc, '12. If something goes wrong')
table(doc, ['Symptom', 'Likely cause', 'What to do'], [
    ('Intake stays Extracting for more than 2 minutes', 'Poller not yet run, or the extraction task is slow', 'Keep talking (Act 2 SAY box); after 3 minutes switch to the fallback record INV-AP-D1 / NRC-PAY-26-D1. After 10 minutes the intake goes to manual review by design'),
    ('Intake Completed with "Duplicate of FDI-…"', 'The same file was uploaded before', 'Use the next pack (generate a new suffix) or the fallback records'),
    ('Advice goes to Review Required: payment already …', 'The bank line was used already', 'Run the prep script of a new pack'),
    ('Approve refused: requester / processor', 'Wrong persona', 'Impersonate %s (not the user who uploaded or confirmed the deduction)' % FAP),
    ('Approve Override refused: reason missing', 'D6: approver cannot type the reason', 'As the AP processor enter the Decision Reason first'),
    ('Explain with Now Assist shows nothing', 'Now Assist slow (5–60 s)', 'Refresh after a minute; show the existing AI note on the record'),
    ('Landing page numbers look stale', 'KPI refresh every 15 minutes', 'Mention it; numbers catch up')], widths=[4.5, 4.5, 8])

h(doc, '13. Reference card')
table(doc, ['Item', 'Value'], [
    ('Workspace', WS), ('AP demo invoice', '%s (file %s)' % (INV, AP_PDF)), ('AR demo payment', '%s INR 78,400; open items ARINV-%s-01 / -02; file %s' % (PAY, S, AR_PDF)),
    ('Prep script', 'scripts/deploy/phase40_demo_prep_%s_bg.js (Scripts - Background, scope x_695068_bcfa)' % S),
    ('New pack', 'python scripts/fixtures/gen_phase40_demo_journeys.py <SUFFIX>'),
    ('Seeded scenarios', 'INV-AP-001..010, BANK-AR-001..010, INV-PLAY-01..04, BANK-PLAY-01..07, BANK-POC2-001..003'),
    ('Fallback', 'INV-AP-D1, NRC-PAY-26-D1, INV-AP-N1, NRC-PAY-26-1005'),
    ('Settings', 'document.extraction.provider native; sap.adapter mock_sap; ar.sap_processing_mode direct; mock_sap.draft_outcome pending')], widths=[4, 13])

os.makedirs(os.path.dirname(OUT), exist_ok=True)
doc.save(OUT)
print('written', OUT)
