# CHINESE_DOCUMENT_TEST_RESULTS.md (Phase 42)

Chinese client documents processed on the deployed Phase 42 build, 2026-10-14, instance pwcmanagementservicesdemo01,
native Document Intelligence (Now LLM). Client documents and their values are not stored in git; this report gives
results, not document content beyond what is needed to judge them.

**Bottom line: Chinese support is NOT fixed.** The BCFA logic after the reading is now Unicode-safe and tested, but the
platform's reading step on this release drops the Chinese text of the VAT e-invoices before extraction, so nothing
downstream can work on them. They go to manual review with the reason stated.

## Root cause (traced through the pipeline)

| # | Step | Finding | Status |
|---|---|---|---|
| 1 | File | CS-03, CS-18 are digital PDFs with a proper Chinese text layer (read locally) | OK |
| 2 | Upload / attachment | File copied byte-identical to the intake | OK |
| 3 | Document Intelligence task | Created, processed, no error | OK |
| 4 | **DocReader text** (`di_genai_output.document_text`) | **0 Chinese characters**: CS-18 1961 characters (121 Latin letters), CS-03 1685, CS-17 1685, CS-20 1784; the labels come out as Latin-letter noise ("t + ti JFJ ti lE )"); digits survive | **Root cause** |
| 5 | Language / OCR setting | None exists on this release (`sn_docintel*`) | Not configurable |
| 6 | Multimodal flag (image to the model) | No measurable effect with Now LLM (13-document probe) | No remedy |
| 7 | Extraction (Now LLM) | Correctly returns blanks for labelled fields it cannot place; keeps digit-only values: CS-18 PO 6900018644 and the 4 GRNs | Behaves correctly |
| 8 | BCFA mapping / normalization (before Phase 42) | ASCII-only name keys emptied Chinese names (`[^A-Z0-9]` removed every character) | **Fixed** (Unicode-safe) |
| 9 | Dates / currency / amounts | 2026年09月15日, 人民币 / RMB / ￥, full-width digits were not normalized | **Fixed** (original + normalized + rule kept) |
| 10 | Vendor resolution | Code then exact name only; a Chinese name could never match | **Fixed**: code, tax ID (统一社会信用代码), PO vendor, alias table, Unicode-normalized name; conflicts and ambiguity go to a person |
| 11 | Customer resolution (AR) | Payer on bank advices read as the remitting bank | Open (reading), see CHINA-AR |
| 12 | Confidence / review | Low confidence sent to review without saying why | **Fixed**: the review message carries the reader script count |
| 13 | Downstream AP / AR | Not reached for the e-invoices (no invoice is created from an empty reading, by design) | Blocked by step 4 |

## What was changed (Phase 42)

- `MatchingEngine.canonicalText`: NFKC, full-width fold, Unicode upper-case, separators to one space. Names keep every
  script (Chinese, Korean, Hindi, Arabic, Thai, accents); `normalizeName`, invoice / reference keys and vendor keys use it.
- `MatchingEngine.resolveVendor`: precedence vendor code, tax registration number, PO vendor, active alias
  (`x_695068_bcfa_vendor_alias`), exact / normalized printed name. A PO that belongs to another vendor than the printed
  name is a conflict, not a match.
- `NativeDocumentIntelligenceProvider`: `normalizeDate` (年月日 / 년월일 / . / -, full-width; day-first never guessed),
  `normalizeCurrency` (RMB / 人民币 / 元 → CNY; ¥ / ￥ → CNY only on a Chinese-language document), full-width amounts.
  Original value, normalized value and rule are kept in `normalization`.
- `readerScriptCheck`: characters per script in the reader text, on the intake (`reader_script_check`) and in the
  review message.
- AP use case: Chinese label hints (销售方 / 购买方 名称, 统一社会信用代码, 发票号码, 开票日期, 合计 金额 / 税额,
  价税合计 (小写), 备注) and "copy as printed, never translate".
- Tests: H42-UNI, H42-NUM, H42-VEN (BCFA Regression), all passing.

## Client tests

| Test | Sample (intake) | Expected | Result | Verdict |
|---|---|---|---|---|
| CHINA-AP-001 Chinese invoice with stamp | CS-18 VAT special e-invoice (FDI0000029). The red oval on it is the tax authority's printed supervision seal (全国统一发票监制章), part of the e-invoice template, not a seller chop | Chinese text extracted, language, vendor, number, date, PO, GRN, currency, amounts, taxes, lines, stamp YES, AP processing | Reader text 0 Chinese. Read: PO 6900018644, GRNs 5007474512 / 5007472428 / 5007467866 / 5007465790 (all correct). Not read: invoice number, date, vendor, buyer, currency, amounts, tax, line, language. Stamp: no answer → UNCERTAIN. Confidence 0 → manual review with "Reader text: 1961 characters (Latin 121, Chinese 0 ...)". No invoice created, nothing invented | **FAIL** (platform reading) |
| CHINA-AP-002 Chinese invoice without the required stamp | CS-03 (same layout, no seller chop) | Extraction succeeds, stamp NO, evidence review | Not re-run: a project team member processed the same file today (FDI0000012, before the Phase 42 deploy); a second intake would be a duplicate of it (duplicate control). That run: confidence 0.4, vendor, currency and gross not read, manual review. Same reader result as CS-18 | **FAIL** (platform reading) |
| CHINA-AP-003 Stamp whose text cannot be read | No such sample | stamp YES, text blank, not "absent" | Logic proven by H42-STAMP: a YES with no readable text stays DETECTED_BEST_EFFORT, never treated as absent; a required stamp then needs a person | **Logic PASS; CLIENT SAMPLE REQUIRED** |
| CHINA-AP-004 Chinese scan | No Chinese scan in the pack (CS-03 / 17 / 18 / 20 are digital) | Native OCR on a scan | Not tested. Expectation from Korean / Thai scans: script lost the same way | **CLIENT SAMPLE REQUIRED** |
| CHINA-AR-001 Chinese customer payment advice | CS-15 bilingual JPMorgan credit advice (FDI0000030) | Payer kept in Chinese, references, customer resolved, payment correlated, open items matched | Reader kept 36 Chinese characters. Read: amount 48,060 CNY, date 2026-09-16, sender reference. **Payer read as the bank** (JPMorgan Chase Bank (China) ... Beijing Branch) instead of the Chinese customer → no payment correlated → review "No payment of JPMORGAN ... matches". Nothing matched wrongly | **FAIL** (payer) / control PASS |
| CHINA-AR-002 Chinese remittance, several invoices | CS-21 (FDI0000031): centralized payment of 69 items with **no invoice references printed**; the "AR China" multi-invoice remittances (AR China.rar) are not in the pack | Multi-invoice matching | Amount 175,127.4 CNY and date read; payer read as the bank; no references to match → review | **NOT TESTABLE with the pack** (CLIENT SAMPLE REQUIRED) |

## Rule check

| Rule | Result |
|---|---|
| Chinese characters are never stripped | PASS (H42-UNI; Chinese names survive every key) |
| Original and normalized values both kept | PASS (`normalization` list on every reading) |
| Translated names never authoritative | PASS (native translation off; descriptions require "as printed") |
| No simulated fallback for client files | PASS (native only; GRN has no simulated path) |
| Nothing invented on a failed reading | PASS (blanks stay blank, confidence 0, manual review) |

## Acceptance

Not met. "Chinese support fixed" requires Chinese OCR to succeed on the client samples; it does not on this instance.
What is ready: everything after the reading (Unicode-safe keys, vendor precedence, CNY / date normalization) is
deployed and tested, so the documents will flow once the platform reading keeps the Chinese text. Next step: the
ServiceNow support case in `DOCUMENT_INTELLIGENCE_CAPABILITY_ASSESSMENT.md`. Until then: manual entry from review.
