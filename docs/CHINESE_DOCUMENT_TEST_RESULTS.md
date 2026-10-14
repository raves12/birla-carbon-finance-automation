# CHINESE_DOCUMENT_TEST_RESULTS.md (Phase 42, Chinese OCR root cause and remediation)

Instance pwcmanagementservicesdemo01, 2026-10-14. Native ServiceNow Document Intelligence only (Now LLM). Client
documents and their full contents are not stored in git; the evidence (tasks, reader text, outputs) is on the
instance under the task ids below.

**Bottom line (supersedes the first Phase 42 version of this report).** Chinese OCR **works on this instance** when
the use case's language (CJ OCR model) is actually applied. It was not applied before because of how BCFA created its
use cases, not because of a platform limit. With the fix, the Chinese VAT e-invoices and bank advices are read in
Chinese and CS-18 runs through BCFA into an AP invoice. One systematic reading error remains (seller / buyer tax ID
swap on the e-invoice layout); BCFA guards against it deterministically.

## 1. Why Chinese failed previously

| # | Finding | Evidence |
|---|---|---|
| 1 | The language of a generative use case is its **Document Config** (`sys_di_doc_config`): *Latin model (default)* (DocReader step `cjk_support: false`) or *CJ model (supports Chinese and Japanese)* (`9863298f…`, `cjk_support: true`). The Now Assist admin UI offers exactly these two (document type *Now Assist Document*, `DocIntelGenAINowAssistUtil.getLanguageConfig`), default Latin | Platform records |
| 2 | BCFA's use cases were created by script on the default **Latin** config | `scripts/deploy/native_extraction_config.json` (Phase 40) |
| 3 | Even a CJ use case was ignored: the platform business rule **"Update Docreader config"** (`sys_di_task`, before insert) copies the use case's config into the task (`config_json`) **only when the use case has `regional_hub_enabled = true`**. Use cases created in the admin UI get it (property `glide.platform_ml_di.doc_data_extractor.regional_hub_enabled = true`); the field's dictionary default is false and BCFA's script did not set it | BR filter `task_definition.regional_hub_enabled=true`; UI-created use cases on the instance all have it, BCFA's did not |
| 4 | With an empty `config_json`, `DocintelGenAIDocReaderExecute` falls back to its default DocReader step for `doc_qna`, which is the Latin step (`cjk_support: false`), whatever language the use case names | First CJ run (tasks `BCFA CJ …`): CJ use case, task `config_json` null, reader text identical to the Latin run (CS-18: 1961 characters, 0 Han) |
| 5 | Earlier conclusions to withdraw: "DocReader cannot read Chinese on this release", "no language setting exists". Both came from runs that never used the CJ model | This report |

The `enable_multimodal_input` flag played no part: Now LLM is text-only and does not use image input; that assumption is
removed from the BCFA reports.

## 2. Installed components (no patch mismatch for this feature)

| Item | Value |
|---|---|
| Family / build | Yokohama, Patch 13 hotfix 5a (`glide-yokohama-12-18-2024__patch13-hotfix5aw35-08-22-2026_08-26-2026_0028.zip`) |
| Document Intelligence (`sn_docintel`) | 8.0.2 |
| Document Intelligence Admin (`sn_docintel_admin`) | 4.1.0 |
| Content Understanding (`sn_docintel_gen_ai`, the successor of Now Assist in Document Intelligence) | 5.0.10 (already this product) |
| AI Admin Hub (`sn_nowassist_admin`, Now Assist admin console) | 7.0.12 |
| Now Assist Core / Generative AI Controller | 27.13.5 / 12.0.16 |
| AI Platform skills (`sn_nowassist_gs`) | 2.3.2 |
| Vision AI Agent | not installed (no such application on the instance) |
| Spokes present | OpenAI 3.4.0, Microsoft Azure OpenAI 3.8.1 |
| LLM options for Document Key Value Extraction | Now LLM, Now LLM LTS, Azure OpenAI, Amazon Bedrock, Google Cloud Vertex AI (capability definitions; an `image1` input attribute exists for multimodal providers) |

The CJ OCR model is present and works on this release; **no upgrade is needed for Chinese text OCR**. The Zurich-level
documentation describes the same selector; on this Yokohama / Content Understanding 5.0.10 instance it is the
*Language* (document config) choice of the use case.

## 3. Was CJ OCR invoked?

- Before the fix: **no** (task `config_json` empty → Latin fallback), for every BCFA use case and for the first CJ test.
- After the fix (use cases with `regional_hub_enabled = true`): **yes**. Every CJ task carries `cjk_support: true` in
  its `config_json`; Latin tasks carry `false`. Test H42-ROUTE checks the flag and the config of every routed use case.

## 4. Direct ServiceNow test (use-case level, before BCFA orchestration)

Tasks created with `sn_docintel.DocIntelAPI.createTask / processTask` (the same backend as the use-case test
experience), holder records INC0010314 / INC0010316. LLM: Now LLM (text). Use cases:
AP Chinese `a7c2d41e9b3f4c58b1e60d2f7a9c3e51`, AR Chinese `b8d3e52fac404d69c2f71e3a8bad4f62`, AP Latin
`4f1b9b4aca304a7182f72f68a3c168c9`.

| Sample (file) | Task (run 2) | Use case / OCR | Reader characters | Han | Extraction (vs ground truth) |
|---|---|---|---|---|---|
| CS-18 VAT special e-invoice (Invoice for PO6900018644 China BCW.pdf) | 8789632feb378bd0311dff0dcad0cd9a | AP Chinese / CJ | 453 | **160** | Invoice number, date, buyer, PO, all 4 GRNs, CNY, net 1,376,771.68, tax 178,980.32 (13 %), gross 1,555,752.00, line (蒽油 294.65 吨) correct. Seller name with one character wrong (骅 read 弊). **Seller tax ID = the buyer's** |
| CS-18 same file, Latin control | 9b89a32feb378bd0311dff0dcad0cd42 | AP / Latin | 1961 | 0 | Only invoice number, PO, GRNs |
| CS-03 VAT special e-invoice (AP Invoice with PO and GRN no.pdf) | ae89232feb378bd0311dff0dcad0cd5b | AP Chinese / CJ | 393 | **150** | Seller, buyer, number, date, PO, GRN, CNY, net 64,820.00, tax 5,833.80 (9 %), gross 70,653.80, line correct. **Seller tax ID = the buyer's** |
| CS-17 own sales e-invoice (Invoice Sample_Sika.pdf) | 5b89a32feb378bd0311dff0dcad0cdc5 | AP Chinese / CJ | 375 | **151** | Seller, buyer, number, date, amounts (gross 78,580.20), line correct. Seller tax ID = the buyer's |
| CS-20 own sales e-invoice (Invoioce Sample_Lilong.pdf) | 2789e32feb378bd0311dff0dcad0cd7a | AP Chinese / CJ | 465 | **163** | Seller, buyer, number, date, 2 lines, gross 1,695,438.40 correct. Seller tax ID = the buyer's |
| CS-15 bank credit advice (Customer payment_4356 Jiangsu Sandao BCW.pdf) | f289632feb378bd0311dff0dcad0cd40 | AR Chinese / CJ | 897 (2 pages) | **229** | **Payer 江苏三导新材料科技有限公司 correct** (Latin run: the bank), beneficiary, amount 48,060 CNY, references, value date, remark 原料采购 correct |
| CS-21 bank credit advice (JPM Payment advice_Sika.pdf) | 2f89e32feb378bd0311dff0dcad0cdf0 | AR Chinese / CJ | 911 (2 pages) | **224** | **Payer 西卡 (中国) 有限公司 correct**, amount 175,127.40 CNY, references correct; no invoice references printed |

Reader output (beginning, CS-18, CJ): "电子发票（增值税专用发票） 发票号码： 26132000003011241841 … 开票日期: 2026年09月15日 …
统一社会信用代码/纳税人识别号 …". The full reader text and structured output of every run are on the instance
(`di_genai_output` / `di_genai_input` of the task).

**Primary acceptance test (CS-18 produces Chinese characters in the native reader stage): PASSED** (160 Han).

## 5. PDF vs image (CS-18 page 1)

| Input | CJ use case | Latin use case |
|---|---|---|
| Original PDF | 453 characters, **160 Han**, all key fields read (1 character error in the seller name) | 1961 characters, 0 Han |
| JPEG of the same page (the platform's own rendering, `sys_di_image`) | 454 characters, **159 Han**, key fields read; 3 more character errors (潍→灘, 蒽→恵, 增值税专用→增僵税告用) and only the first of 4 GRNs | 2039 characters, 0 Han |

Both PDF and image succeed with the CJ model and both fail with the Latin model: the earlier failure was **not** a PDF
text-layer problem; it was the OCR model selection. The PDF reads slightly better than the image.

## 6. Through BCFA (orchestration)

FDI0000029 (CS-18), Document Language Hint = Chinese (Simplified), reprocessed with the deployed build:

- Routed to the AP Chinese use case (CJ model); reader text 453 characters, 160 Chinese; confidence 1.
- **AP invoice AP00000099 created**: number 26132000003011241841, date 2026-09-15, CNY, net / tax / gross reconcile,
  line kept in Chinese, document language Chinese, country China.
- Vendor resolved to the POC reference vendor by **PO 6900018644** (`purchase_order_vendor`); the seller name was read
  with one wrong character, and the tax ID read as the seller's was the buyer's, so neither was used.
- Validation stopped at **Document Evidence Review (stamp)**: the China rule requires a stamp and the text-only reading
  cannot confirm one (the red oval on the e-invoice is the tax authority's printed supervision seal, not a seller chop).
  This is the designed control; matching runs after a person records the stamp decision.

FDI0000030 (CS-15) and FDI0000031 (CS-21), hint Chinese: payer read and kept in Chinese (江苏三导新材料科技有限公司,
西卡 (中国) 有限公司); no bank line for these payments exists in the POC data, so they go to review ("No payment of
江苏三导新材料科技有限公司 matches reference …"). Open-item matching is not testable: the advices print no invoice
references, and the "AR China" multi-invoice remittances are not in the pack.

POC reference data seeded for this test from the documents themselves (labelled POC, not SAP): vendor
KIT-V-CN-XNLX (name, seller tax ID, China), PO 6900018644 with its one line, customers KIT-C-CN-JSSD and
KIT-C-CN-SIKA. No GRN receipts were seeded (the split of the 4 GRNs is not on the invoice).

## 7. Seller / buyer tax ID swap (systematic, guarded)

On all four e-invoices the extraction put the buyer block's tax ID in the seller field (the reader text interleaves
the left buyer block and the right seller block). After the field description named the seller block explicitly, the
model returned both IDs, swapped. Controls (deterministic, Phase 42):

1. A supplier tax ID equal to the buyer tax ID on the same document is not used.
2. A tax ID that points at another vendor than the printed name or the printed PO is a **conflict** (person decides).
3. When the vendor resolved by PO / name has the "buyer" tax ID in the vendor master, the intake states that the IDs
   were read swapped, and the invoice keeps the seller's ID.
4. Tax ID still comes first in vendor resolution only when nothing contradicts it (H42-VEN).

## 8. Changes made (this remediation)

- Use cases: **BCFA AP Invoice Extraction - Chinese (Now LLM)** and **BCFA AR Payment Advice Extraction - Chinese
  (Now LLM)** on the CJ model, same fields as the Latin use cases (generated from them); all BCFA use cases now created
  with `regional_hub_enabled = true`; new field Buyer Tax Registration Number.
- `NativeDocumentIntelligenceProvider.resolveUseCase(kind, language, visual)`: AP / AR × Latin / Chinese (Simplified);
  GRN Chinese falls back to Latin with a warning; a visual requirement returns no use case (none configured).
  The chosen use case and OCR model are recorded in the extraction (`extraction_use_case`).
- **Document Language Hint** on Finance Document Intake (Latin default / Chinese (Simplified)); a changed hint starts a
  new reading. Low-confidence reviews of a document without the hint now say to set it.
- Downstream contracts unchanged (canonical extraction object → intake → AP / AR services → matching → policy →
  approval → integration). Unicode keys, alias table and vendor precedence from Phase 42 kept.
- Tests: H42-ROUTE (new), H42-VEN (extended with the tax ID guards).

## 9. Recommended production configuration

- One use case per kind and OCR language (Latin, CJ), created in the Now Assist admin UI or by script **with
  `regional_hub_enabled = true`**, and checked by H42-ROUTE.
- Route by an explicit language on the intake (hint from the upload / mailbox / entity: China entities' AP and AR
  default to Chinese). Do not guess the script before OCR.
- Keep Now LLM (text) for extraction; the CJ OCR does the Chinese reading. Image understanding (stamps, handwriting)
  would need a multimodal provider (Azure OpenAI, Amazon Bedrock, Google Vertex AI are listed on the instance): client
  approval and licence required, not enabled by BCFA.
- China master data: vendors with 统一社会信用代码, aliases for name variants, so resolution has tax ID, PO and name
  evidence to cross-check.

## 10. Content Understanding

The instance already runs **Content Understanding 5.0.10** (`sn_docintel_gen_ai`), the successor of Now Assist in
Document Intelligence; BCFA's extraction already uses it (generative use cases, DocReader, Now LLM). No migration of the
extraction seam is needed for Chinese. A newer Content Understanding / platform release is worth taking for the
multimodal (image) path and Vision features once the client approves a multimodal provider; the BCFA seam (provider →
canonical extraction object) stays as is.

## 11. ServiceNow Support

No support case is needed for Chinese OCR. Worth raising as product feedback: a use case created without
`regional_hub_enabled` silently ignores its language (document config) because the "Update Docreader config" rule
filters on that flag. Evidence: tasks `BCFA CJ CS18-PDF-CJ-AP` (18c8a36beb378bd0311dff0dcad0cdec, config_json empty,
0 Han) vs `BCFA CJ2 CS18-PDF-CJ-AP` (8789632feb378bd0311dff0dcad0cd9a, cjk_support true, 160 Han), same file and use
case. Korean and Thai are not covered by the CJ model (Chinese / Japanese only); their reading loss stands.

## Regression

BCFA Regression on the final build: **57 / 57 passed** (incl. H42-ROUTE and H42-VEN with the tax ID guards).

## Client tests (status)

| Test | Result |
|---|---|
| CHINA-AP-001 Chinese invoice (CS-18) | **PASS** for extraction (Chinese read; header, PO, GRNs, amounts, tax, line); seller name 1 character wrong, tax IDs swapped (guarded). AP invoice created; stops at the stamp evidence review by design. Stamp YES not applicable: CS-18 has no seller chop |
| CHINA-AP-002 Chinese invoice without the required stamp (CS-03) | Extraction **PASS** (direct test). Not run through BCFA: a team member's intake of the same file exists (duplicate control). The stamp rule outcome is the same as CS-18 (review, then "Required Stamp Missing" if the reviewer records no stamp) |
| CHINA-AP-003 stamp with unreadable text | Logic PASS (H42-STAMP); no such client sample |
| CHINA-AP-004 Chinese scan | Image of CS-18 read with CJ (159 Han); a real scanned Chinese document is not in the pack |
| CHINA-AR-001 Chinese advice (CS-15) | Payer kept in Chinese and correct, references and amount correct; no bank line in POC data, so not correlated (review) |
| CHINA-AR-002 multi-invoice remittance | Not testable: no invoice references on CS-21; AR China.rar missing |

"Chinese support fixed" is claimed for **reading** (OCR and extraction on client samples, Unicode kept, PO / GRN
usable, AP invoice created with the vendor resolved). Matching / posting of a China invoice and AR correlation need
the stamp decision and China bank / open-item data that the POC does not hold.
