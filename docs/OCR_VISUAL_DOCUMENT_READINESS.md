# OCR_VISUAL_DOCUMENT_READINESS.md (Phase 42)

Readiness of BCFA for the client's document requirements (OCR, multilingual / Chinese extraction, stamp / seal / chop
presence, China stamp rule, handwritten GRN), measured on instance pwcmanagementservicesdemo01 on 2026-10-14 with the
deployed Phase 42 build and the Birla client sample pack. Details: `DOCUMENT_INTELLIGENCE_CAPABILITY_ASSESSMENT.md`,
`CHINESE_DOCUMENT_TEST_RESULTS.md`, `HANDWRITTEN_GRN_TEST_RESULTS.md`.

**Summary.** Printed Latin-script documents are read natively and flow into AP / AR. **Chinese is read** with the CJ
OCR model once the use case's language is applied (it was not before: BCFA created its use cases without
`regional_hub_enabled`, so every task used the Latin model; see `CHINESE_DOCUMENT_TEST_RESULTS.md`). CS-18 runs through
BCFA into an AP invoice. Korean images and Thai scans are still not readable (outside the CJ model). Stamp presence and
handwriting are **not reliably detected**: Now LLM is text-only, so every stamp answer stays uncertain and a person
decides, and handwritten GRN numbers were mostly not read. These cases are detected, explained and routed to a person,
with full audit. Nothing external was added (native ServiceNow only).

## Readiness matrix

| Capability | ServiceNow native support | Enabled in instance? | BCFA configured? | Client sample tested? | Result | Limitation | Manual review required? |
|---|---|---|---|---|---|---|---|
| Printed OCR | Yes (DocReader + Now LLM) | Yes | Yes (AP 41 fields, AR 17) | Yes: CS-01, 02, 06, 07, 12, 16, 22, 25, advices | Header fields 85-95 % correct on Latin scripts | No per-field confidence from the platform; lines partial on scans | Only below the confidence threshold or on a failed check |
| Scanned OCR | Yes | Yes | Yes | Yes: CS-01, 02, 06, 12 (scans) | Latin scans read (CS-02 complete, CS-06 / CS-01 most header fields) | Thai / Korean scans lose their script; values printed near handwriting are misread | Yes when a critical field is missing |
| Simplified Chinese | Yes: CJ OCR model (use-case language) | Yes | Yes: AP / AR Chinese use cases, routed by Document Language Hint; `regional_hub_enabled` so the language is applied | Yes: CS-18, CS-03, CS-17, CS-20 (e-invoices), CS-15, CS-21 (bank advices) | **Pass**: CS-18 160 Han in the reader text; invoice number, date, PO, GRNs, CNY, net / tax / gross, line correct; AP00000099 created through BCFA (FDI0000029) | Seller / buyer tax ID read swapped on e-invoices (guarded); 1 character error in a name; Korean / Thai not covered by CJ | Only on a failed check (vendor, stamp rule, matching) |
| Chinese party names | Yes (CJ) | Yes | Yes: names kept as printed (Unicode keys), vendor precedence code → tax ID → PO → alias → name, conflicts to a person, alias table | Yes: CS-18, CS-03, CS-15, CS-21 | **Pass** with errors: payers on bank advices correct in Chinese; e-invoice seller names correct on 3 of 4, one character wrong on CS-18 (resolved by PO instead) | One-character OCR errors defeat exact / normalized name match: aliases and PO / tax ID evidence carry resolution | When no consistent evidence resolves the party |
| Chinese tables | Yes (CJ) | Yes | Yes (line items field) | Yes: CS-18, CS-03, CS-17, CS-20 | **Pass**: lines with Chinese descriptions, quantity, unit (吨 / 千克), price, amount, tax read (CS-20: 2 lines) | Material codes only where printed | On a matching failure |
| Chinese PO / GRN references | Yes | Yes | Yes (PO / GRN in 备注 hints) | Yes: CS-18, CS-03 | **Pass**: PO and all GRNs read (CS-18: 4 GRNs from the PDF; the image read only the first) | GRN receipts for China not in POC data | For matching without SAP receipts |
| Stamp presence | No visual detection on this instance (text only; multimodal flag without effect with Now LLM) | n/a | Yes: evidence fields, statuses, decision table, human review, property `stamp_detection_capability = ocr_text` | Yes: CS-01, 02, 06, 12, 18 (stamped / unstamped checked by eye) | **Not reliable**: 1 of 4 real stamps answered YES (CS-01, and with the printed label as its text); 3 real stamps answered NO | Text-only reading cannot see stamps | **Yes, whenever a stamp is required** (China AP) |
| Stamp text | No (text only) | n/a | Yes (`stamp_text`, as read) | Yes: CS-01 | **Fail**: read the printed "(CommonSeal)" label, not the stamp ("BILL RECEIVED") | Never decisive | Yes |
| Multiple stamps | No | n/a | Yes (`stamp_count`) | Yes: CS-01 (1 stamp + printed seal label), CS-12 (receiving stamp page) | **Fail**: CS-12 answered 0 stamps | Text only | Yes |
| Faint stamp | No | n/a | Yes | Yes: CS-02 (partly printed, faint blue company seal) | **Fail**: answered NO | Text only | Yes |
| Handwritten GRN | No handwriting-aware reading; OCR reads some handwriting as plain text | Yes (OCR) | Yes: GRN use case, GRN Extraction (evidence), comparison with SAP receipt, reviewer corrections | Yes: CS-12, CS-02, CS-06, CS-01 (no standalone handwritten GRN slip in the pack) | **Fail**: of 7 handwritten numbers 1 read, 1 misread by one digit, 5 not read; handwriting never recognised as such | Evidence only, never authoritative | **Always** |
| Printed GRN | Yes | Yes | Yes | Yes: CS-23, CS-08 page 5 | **Pass** for GRN and PO numbers (4 / 4); quantity not reliable; Korean supplier names on images lost | No SAP receipt for these numbers in the POC data (NO_AUTHORITATIVE_RECEIPT) | Always (GRN documents are evidence) |
| Multilingual AP | Latin and CJ yes; Thai / Hangul images no | Yes | Yes | Yes: English, Portuguese, Italian, Turkish formats; Chinese; Korean, Thai | Latin and Chinese **pass**; Korean image / Thai **fail** | Language must be hinted on the intake (Chinese) | For Korean / Thai |
| Multilingual AR | Latin and CJ yes | Yes | Yes | Yes: English advices; CS-15, CS-21 (Chinese / English) | **Pass** for reading (payer, amount, references); correlation not tested (no China bank lines / open items in POC data) | No multi-invoice Chinese remittance in the pack (AR China.rar missing) | When no payment / open item matches |

## Stamp tests (actual client documents, checked by eye)

Reading: native AP / GRN use case, stamp fields; capability `ocr_text` (text only).

| Test | Sample | Ground truth | Extraction answered | BCFA evidence status | Verdict |
|---|---|---|---|---|---|
| STAMP-001 Clear company stamp | CS-06 (FDI0000034): blue rectangular company stamp with signature | Stamp present | NO | UNCERTAIN (a NO from text is not evidence) | Detection **FAIL**; control PASS |
| STAMP-002 Faint stamp | CS-02 (FDI0000033): faint, partly printed round company seal + printed "Customer's Seal and Signature" box | Stamp present | NO (Phase 41 probe: YES with the label as its text) | UNCERTAIN | Detection **FAIL**; control PASS |
| STAMP-003 Stamp over printed text | CS-01 (FDI0000032): buyer "BILL RECEIVED 30 SEP 2026" stamp over the totals; printed "(CommonSeal)" label, no seller seal | 1 stamp (receipt stamp) | YES, type COMPANY_SEAL, text "CommonSeal" | DETECTED_BEST_EFFORT (never confirmed) | Presence right, type and text **wrong** |
| STAMP-004 Multiple stamps / stamp page | CS-12 (FDI0000035, GRN use case): receiving stamp box on page 2 | Stamp present | NO | stamp_present "no" on the GRN evidence, which is a reading, never a decision | Detection **FAIL** |
| STAMP-005 Red round graphic that is not a seller chop | CS-18 (FDI0000029): red oval tax-authority supervision seal printed in the e-invoice template, QR code, red printed text; no seller chop | No seller chop | nothing (reading failed) | UNCERTAIN | Not falsely detected (but nothing was read) |

False-positive controls in place: the field descriptions state that a printed label or box ("Seal and Signature",
盖章), a logo, letterhead, watermark or QR code is not a stamp, and that a stamp is never inferred from country or
document type; after this change the printed label on CS-02 no longer produced a YES. Because the reading is text
only, the controls cannot be proven on red logos / round graphics; therefore no answer is ever treated as a
confirmation.

**Acceptance: "stamp detection implemented" is NOT claimed.** Stamp presence is a human check on this instance.

## China stamp rule (built, deployed, tested)

- Decision table **BCFA Document Evidence Requirement** (inputs country, document type, company code, vendor type,
  invoice type; outputs stamp required, signature required, manual review required). Row 1: China + AP invoice →
  stamp required (POC BUSINESS CONFIGURATION, not legal advice: fully digital Chinese e-invoices carry no seller seal
  by design, so the business should confirm this rule). Fallback property
  `x_695068_bcfa.document_evidence.stamp_required_countries` = China.
- Country comes from the vendor master, else the country read from the invoice; **never** from the file name.
- Validation (`DocumentEvidenceService.evaluateStamp`, in AP validation):
  - stamp not required → NOT_REQUIRED;
  - required and confirmed (by a person, or by a verified native visual reading) → PASSED;
  - required and a person recorded "no stamp" (or a verified native visual NO) → **exception "Required Stamp Missing"**;
  - required and anything else (UNCERTAIN, DETECTED_BEST_EFFORT, no reading) → **exception "Document Evidence Review
    (stamp)"**: the reviewer opens the document, records a Document Evidence Review (stamp present yes / no + reason),
    then Re-run Validation.
- Missing stamp text never means "no stamp".
- Live checks (8 / 8) and ATF H42-STAMP pass. On the client China invoices the rule was not reached, because no
  invoice can be created from their empty reading.

## Status values (no fake confidence)

`stamp_evidence_status`: CONFIRMED_BY_NATIVE_VISUAL, DETECTED_BEST_EFFORT, UNCERTAIN, NOT_DETECTED, HUMAN_CONFIRMED,
HUMAN_REJECTED; `stamp_present`: YES / NO / UNCERTAIN; `stamp_detection_method`: native_visual / ocr_text / human.
With the measured capability (`ocr_text`) only DETECTED_BEST_EFFORT and UNCERTAIN can come from a reading; the
platform returns no per-field confidence and none is invented. Handwriting: READABLE / PARTIALLY_READABLE /
NOT_READABLE / NONE (native visual only) / UNKNOWN. GRN reading: PRINTED_READABLE / HANDWRITING_READABLE /
PARTIALLY_READABLE / NOT_READABLE.

## Workspace (BCFA Workspace and classic forms)

- AP Invoice form: section **Document Evidence (stamp / seal, handwriting)**: stamp required, present, evidence status,
  detection method, validation result and detail, visual review required, type, text, page, count, AI finding,
  handwriting status and values, printed supplier tax ID, reviewer, review time, decision. Related list **Document
  Evidence Reviews**. The attachment is on the invoice / intake (Attachments).
- Finance Intake form: section **Document Evidence**: document language, stamp present / status, handwriting, visual
  review required, GRN extraction, reader text check (characters per script).
- GRN Extraction form (values as read, comparison with SAP, review status, raw extraction under Technical) with related
  lists Document Evidence Reviews and Finance Intake.
- Lists: Document Intake → Goods Receipts (evidence); Accounts Payable → Document Evidence Review (invoices needing a
  visual check), Evidence Decisions, Vendor Aliases.
- Intake document type **Goods Receipt / GRN (evidence)**.

## Audit

| Event | Where |
|---|---|
| Extraction request, provider / model, task | AI interaction log (operation extract_*_document, incl. extract_goods_receipt_document) and `document_extracted` audit event |
| Language, reader script counts | Intake (`document_language`, `reader_script_check`), extraction JSON |
| Visual extraction use | `stamp_detection_method` (ocr_text / native_visual / human) |
| Stamp / handwriting finding | `stamp_ai_finding`, evidence fields, raw extraction (immutable on the intake and GRN extraction) |
| GRN values | GRN Extraction + `document_extracted` audit event with the critical values |
| Human review / correction | Document Evidence Review (append-only: create only, business rule blocks update / delete) + `human_review` audit event with AI value and reviewer value |
| Final evidence result | `stamp_validation_result` / detail on the invoice; exception with "Document evidence:" in its evidence |

## Tests and regression

New ATF tests in BCFA Regression (all passing): H42-UNI (Unicode names), H42-NUM (CJK dates, CNY, full-width
amounts), H42-VEN (vendor precedence), H42-STAMP (stamp evidence and China rule), H42-GRN (GRN evidence).
Full BCFA Regression result: see the section below.

## Full regression (2026-10-14)

**After the Chinese OCR remediation** (CJ use cases, routing, Document Language Hint, tax ID guards): BCFA Regression,
57 tests (56 + H42-ROUTE), run one at a time on the final build, 13:16-13:50 instance time: **57 / 57 passed**.

Before it (first Phase 42 build):

BCFA Regression suite, 56 tests, run one at a time on the final Phase 42 build (after phase42_fix2), 08:20-08:55
instance time: **56 / 56 passed**. Covers English invoices, India GST, German / Hungarian VAT, freight / shipping, PO /
GRN 3-way matching, duplicate detection, reprocessing, approvals, SoD, AR exact and multi-invoice match, TDS / WHT,
short pay, late remittance, attachment propagation, active-record controls, Playbooks, and H42-UNI / NUM / VEN / STAMP /
GRN. The ATF runs consumed record numbers (rolled back data, counters advanced); reset the counters with
`scripts/deploy/reset_number_counters_bg.js` (scope global) before a clean demo if needed.

## What is needed to go further

1. ServiceNow: Korean / Thai OCR coverage on this release, and a native image-understanding reading for stamps and
   handwriting (a multimodal provider needs the client's approval). Chinese: resolved (CJ model).
2. Client: decision on the Azure OpenAI multimodal provider (data to Azure OpenAI; licence), the China stamp rule for
   fully digital e-invoices, real handwritten GRN slips, a Chinese scan, the "AR China" multi-invoice remittances.
3. Master data: Chinese vendors / customers with tax IDs and aliases for the China entities, so resolution works once
   documents are readable.
