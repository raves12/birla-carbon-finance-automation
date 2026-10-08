# MULTILINGUAL_DOCUMENT_INTELLIGENCE_READINESS.md (Phase 41)

**Requirement:** document understanding in English, French, Portuguese, Hungarian, Italian, Spanish, Arabic, Thai,
Korean, Hindi and Chinese. This is about reading documents, not translating the Workspace UI.

**Approach (unchanged):** native ServiceNow Document Intelligence, generative extraction pinned to Now LLM, reading the
document directly. Nothing is translated first. The use-case field descriptions are written in English and ask for
values as printed; dates and numbers are normalized by BCFA afterwards (original value, normalized value and rule are
kept; `NativeDocumentIntelligenceProvider._mapFields`). Document language is the model's reading of the document text
(field *Document Language*), never derived from a file name or a party's country.

**Evidence levels used below**

| Level | Meaning |
|---|---|
| VERIFIED WITH CLIENT SAMPLE | A Birla Carbon document in this language was processed natively on the instance and its critical fields matched the manual ground truth |
| CLIENT SAMPLE AVAILABLE, RUN PENDING | The client pack contains a document written in this language (ground truth recorded), but the native run has not been executed yet |
| TESTED WITH SYNTHETIC SAMPLE | Project-generated documents only (Phase 40 measurement, `OCR_ACCURACY_REPORT.md`); not client-approved evidence |
| CLIENT SAMPLE REQUIRED | No document in the client pack is written in this language; no client evidence possible yet |

Product documentation alone is never counted as a pass.

## Status (2026-10-08, after the client sample run)

All 28 client samples were processed natively on the instance with the Phase 41 build (results per sample:
`CLIENT_DOCUMENT_TEST_MATRIX.md`). Critical fields read correctly, compared with the manual ground truth:

| Script of the document | Invoices | Payment / bank advices |
|---|---|---|
| Latin (English, Italian, Portuguese) | 60 / 71 (85 %): CS-01, 02, 06, 07, 11, 12, 16, 22, 25 | 19 / 20 (95 %): CS-04, 05, 09, 13 |
| Chinese | 5 / 32 (16 %): CS-03, 17, 18, 20 | 8 / 10 (80 %): CS-15, 21 (bilingual bank forms) |
| Korean | 3 / 16 (19 %): CS-08, 19 | - |
| Thai | 4 / 8 (50 %, amounts only): CS-26 | - |

No value was invented on any failed document: unread fields stay empty, confidence drops and the intake goes to review.

| Language | Native capability status | Client sample available? | Samples (`CLIENT_DOCUMENT_TEST_MATRIX.md`) | AP tested? | AR tested? | Document types | Extraction result | Critical fields | Line items | Manual review expected | Known limitations | Final status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| English | Native extraction working (Phase 40 synthetic + client pack) | Yes (many) | CS-01, CS-02, CS-04, CS-05, CS-06, CS-09, CS-13/14, CS-16, CS-22, CS-25, CS-28 | Yes (client) | Yes (client) | Tax invoices (India, scanned), US invoices, export invoice, multi-document packages, payment advices, bank transfer notice | Read | Invoices 41/48; advices 19/20 | CS-02, CS-16, CS-22 complete; CS-06 4 of 4; CS-01 0 of 4 | Handwritten PO / GRN / SE numbers not read or misread; export invoice total not read as gross; free-text invoice references (CS-13) not read | CS-28 (14.7 MB) must be split; CS-25 (28 pages) read but net / tax not | **VERIFIED WITH CLIENT SAMPLE** (header fields); lines PARTIAL |
| French | Generative model, no BCFA evidence | **No** | none | No | No | - | - | - | - | - | No French document in the pack | **CLIENT SAMPLE REQUIRED** |
| Portuguese | Read on scans | Yes | CS-11 (rental statement + boleto + PO), CS-12 (DANFE / NF-e + PO) | Yes | - | Brazilian fiscal (DANFE), boleto | Read | 11/15: CS-12 7/7; CS-11 amount, currency, PO only | 0 | CS-11: vendor read as the tenant, boleto number not read | PO totals did not contaminate the invoice amounts (traps passed); page layout imprecise | **VERIFIED WITH CLIENT SAMPLE** (CS-12); CS-11 PARTIAL |
| Hungarian | Generative model | **No** (client) | none in the pack | Synthetic only: the 44-line, 2-page Hungarian invoice read correctly (Phase 40) | No | - | - | - | - | - | Synthetic, clean digital PDF only | TESTED WITH SYNTHETIC SAMPLE; **CLIENT SAMPLE REQUIRED** |
| Italian | Read on a scanned package | Yes | CS-07 (FatturaPA invoice print + Italian PO + 2 GRN pages) | Yes | - | Italian electronic invoice print | Read | 8/8 | 4 of 5 | Vendor not in POC master data | Result of an earlier upload of the same file (pre-Phase 41 fields) | **VERIFIED WITH CLIENT SAMPLE** |
| Spanish | Generative model | **No** | none: the Bridgestone Hispania advices (CS-05, CS-09) are written in English | No | No | - | - | - | - | - | A Spanish payer is not Spanish-language evidence | **CLIENT SAMPLE REQUIRED** |
| Arabic | Generative model, right-to-left script untested | **No** | none: the Birla Carbon Egypt documents (CS-05, CS-06) are in English | No | No | - | - | - | - | - | No Arabic document in the pack | **CLIENT SAMPLE REQUIRED** |
| Thai | **Thai script not recognised on the scan** | Yes | CS-26 (= CS-27) Thai tax invoice / delivery order | Yes | - | Thai tax invoice, scanned | Amounts only | 4/8: date, net, VAT, gross correct; invoice number wrong (another printed number); vendor, currency, PO not read | 1 of 1 | Always | The reader text of the scan has no Thai characters | **NOT SUPPORTED ON THIS INSTANCE (scans)** |
| Korean | **Hangul not recognised on scanned / image pages**; kept on digital pages | Yes | CS-08 (e-tax invoice image + Service PO + GRN), CS-19 (same invoice), CS-23 (PO + GRN only) | Yes | - | Korean e-tax invoice (image), service PO | Image invoice not read | 3/16 (PO, GRN, currency, net from the digital pages) | - | Always | The reader text of the image invoice has no Hangul; the vendor was taken from the buyer | **NOT SUPPORTED ON THIS INSTANCE (image invoices)** |
| Hindi | Generative model, Devanagari untested | **No** | none: the India documents are in English | No | No | - | - | - | - | - | An Indian document in English is not Hindi evidence | **CLIENT SAMPLE REQUIRED** |
| Chinese | **Chinese text lost on VAT e-invoices**; kept on bank forms | Yes | AP: CS-03, CS-18 (VAT special e-invoices). AR: CS-15, CS-21 (bilingual bank credit advices), CS-10 (bank acceptance draft). Also CS-17, CS-20 (own sales invoices) | Yes | Yes | VAT e-invoice, bank credit advice, bank acceptance draft | E-invoices: digits only. Bank advices: read | E-invoices 5/32; advices 8/10 (payer read as the remitting bank) | 0 | Always for e-invoices; advices stay unlinked (payer) | The reader text of the VAT e-invoices has no Chinese characters | **NOT SUPPORTED ON THIS INSTANCE (VAT e-invoices)**; bank advices PARTIAL |

## Finding: the reading step loses Chinese, Korean and Thai text (2026-10-08)

First seen on CS-20 (FDI-E856F0BD), then confirmed across the pack by counting the characters in the text that
DocReader hands to the model (`di_genai_output` of each run):

| Sample | Kind | Chinese / Hangul / Thai characters in the reader text |
|---|---|---|
| CS-18, CS-20 | Chinese VAT e-invoices (digital PDF) | 0: labels become Latin-letter noise; digits survive |
| CS-10, CS-15, CS-21 | Chinese bank documents (digital PDF) | 14 to 123 per page |
| CS-08 page 1, CS-19 | Korean e-tax invoice (image) | 0 |
| CS-08 PO / GRN pages | Korean (digital PDF) | 5 to 114 per page |
| CS-26 | Thai tax invoice (scan) | 0 |

- **Effect:** with the labels gone the model cannot tell which number is which, and it correctly returns blanks
  (CS-17, CS-19, CS-20: nothing; CS-03, CS-18: only numbers such as invoice number, PO, GRN).
- **Where the loss happens:** in the platform's reading step, not in the files. The CS-20 PDF has a proper Chinese
  text layer (164 characters in the local analysis), but its reader text has none. Scans and images in these scripts
  come out the same way.
- **Not the cause:** the BCFA configuration (a control run of the D3 invoice with the same use case extracted every
  field), file size or pages, the run user (system).
- **No platform setting found:** there is no language or OCR setting under `sn_docintel*` on this instance.
- **Action:** raise with ServiceNow (DocReader support for CJK and Thai text on this release, and why the VAT
  e-invoice text layer is not used). BCFA adds no external OCR (constraint). Until then these documents are processed
  manually from review.
- **Page limit:** `sn_docintel_gen_ai.docreader.page_limit` is 16, but CS-25 (28 pages) was read on all 28 pages, so
  this setting did not limit the run. The 4 MB per file limit does apply (CS-28).

## What is in place for multilingual documents (built, Phase 41)

- Field descriptions ask for values as printed, with locale-aware date conversion, references found in notes / remarks
  areas (备注, 비고, Observações), all GRN numbers (CS-18 prints four), and only invoice pages for header values.
- Number normalization for `1,234.56`, `1.234,56`, `1 234,56` and mixed formats on one page (CS-06, CS-09), with the
  original and the rule kept for each field.
- Tax components keep the printed label and map it to a normalized type (GST / CGST / SGST / IGST / VAT / SALES_TAX /
  WHT / TDS / OTHER_TAX, including 增值税, 부가세, ภาษีมูลค่าเพิ่ม, IVA, TVA, MwSt., PST / QST). Validation remains the
  configured policy (`MatchingEngine.evaluateTax`); BCFA makes no statutory tax determination.
- Group-company sellers (Latin, Chinese and Korean names, `x_695068_bcfa.own_company_names`) are routed to review as
  outgoing invoices (CS-17, CS-20).

## How the run was done (repeatable)

1. Each sample was attached to a new Finance Document Intake (source Workspace Upload, document type chosen as a tester
   would) and processed with **Process Document**; Document Intelligence ran natively on the instance.
2. The extracted values were compared with the ground truth (`test/client_samples/ground_truth.json`, local only) and
   recorded in `test/client_samples/results.json` (local only); `scripts/client_samples/build_test_matrix.py`
   regenerates the matrix.
3. Four samples matched earlier uploads by the POC team (same content: CS-03, CS-07, CS-16, CS-22): their result is
   the earlier intake's (CS-03 and CS-16 were processed from review for this run).

For French, Hungarian, Spanish, Arabic and Hindi, the client needs to supply at least one real AP invoice and, where
relevant, one payment advice written in that language.
