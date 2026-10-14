# DOCUMENT_INTELLIGENCE_CAPABILITY_ASSESSMENT.md (Phase 42)

Live capability audit of instance **pwcmanagementservicesdemo01** (Yokohama Patch 13 hotfix 5a), 2026-10-14, for
the client document requirements: printed OCR, multilingual and Chinese extraction, stamp / seal / chop presence,
China stamp validation, handwritten GRN. Every status below comes from the instance (records, properties, test
runs). Product documentation alone is never counted as a capability.

## Status vocabulary

| Status | Meaning |
|---|---|
| AVAILABLE_AND_ENABLED | Installed, active, and used by BCFA |
| AVAILABLE_NOT_CONFIGURED | Installed; a setting exists that BCFA does not use (reason given) |
| AVAILABLE_REQUIRES_ACTIVATION | Would need a plugin / provider activation that is not done |
| LICENSE_DEPENDENCY | Depends on an entitlement or a decision outside this POC |
| NOT_SUPPORTED | Measured on this instance: does not work |
| UNKNOWN_NEEDS_PLATFORM_CONFIRMATION | Cannot be established from the instance; ServiceNow must confirm |

## Installed document capabilities

| Application (scope) | Version | Active |
|---|---|---|
| Document Intelligence (`sn_docintel`) | 8.0.2 | yes |
| Content Understanding (`sn_docintel_gen_ai`) | 5.0.10 | yes |
| Document Intelligence Admin (`sn_docintel_admin`) | 4.1.0 | yes |
| sn-docintel-iframe | 1.0.4 | yes |

Relevant platform properties: `sn_docintel_gen_ai.docreader.page_limit` = 16, `sn_docintel_gen_ai.docreader.concurrent_request` = 4.
No language, OCR-engine or script setting exists under `sn_docintel*` (searched properties and the extraction skill
configuration). Measured limits: 4 MB per file; at most 5 attachments on the source record of a task.

How a generative extraction runs on this instance: **DocReader** (the platform's reading / OCR step) turns each page
into text; the **Now LLM** extraction model then fills the use-case fields from that text. The skill configuration
(`di_skill_config`) carries pipeline flags, among them `enable_multimodal_input` and `enable_native_translation`.

## Capability matrix

| # | Capability | Status | Evidence on this instance | BCFA use |
|---|---|---|---|---|
| 1 | Printed OCR, Latin scripts (digital and scanned) | AVAILABLE_AND_ENABLED | Client run 2026-10-08 and 2026-10-14: English, Portuguese, Italian invoices and advices read (header fields 85-95 %) | AP / AR extraction use cases (Now LLM) |
| 2 | Generative field extraction (Now LLM) | AVAILABLE_AND_ENABLED | 3 BCFA use cases: AP Invoice (41 fields), AR Payment Advice (17), **GRN (17, new)** | All document intake |
| 3 | Multilingual extraction, Latin scripts | AVAILABLE_AND_ENABLED | Portuguese CS-12, Italian CS-07, Turkish number formats CS-06 | Same use cases, values as printed |
| 4 | Simplified Chinese OCR (CJ model) on VAT e-invoices and bank advices | **AVAILABLE_AND_ENABLED** (since the Phase 42 remediation) | Use-case language = document config *CJ model (supports Chinese and Japanese)*. CS-18 PDF: 160 Han in the reader text, header / PO / GRN / amounts / line read; CS-03, CS-17, CS-20, CS-15, CS-21 the same (`CHINESE_DOCUMENT_TEST_RESULTS.md`). Earlier 0-Han results came from tasks that silently used the Latin model (see row 8) | AP / AR Chinese use cases, routed by the intake's Document Language Hint |
| 5 | Chinese on bilingual bank forms (digital PDF) | AVAILABLE_AND_ENABLED | With CJ: CS-15 229 Han, CS-21 224 Han; payer read correctly in Chinese (with Latin: the bank was read as payer) | AR Chinese use case |
| 6 | Korean on image pages | **NOT_SUPPORTED** | CS-19, CS-23 image text: 0 Hangul; CS-08 digital pages keep Hangul (20 characters) | Manual review |
| 7 | Thai on scans | **NOT_SUPPORTED** | CS-26: 0 Thai characters in the reader text | Manual review |
| 8 | Language / OCR configuration (use case Document Config: Latin / CJ) | AVAILABLE_AND_ENABLED | Offered by the Now Assist admin UI for document type *Now Assist Document*. **Applied to a task only if the use case has `regional_hub_enabled = true`** (platform BR *Update Docreader config*); BCFA's script-created use cases lacked it, so every task used the Latin model. Fixed in `gen_native_extraction.py`; checked by test H42-ROUTE | All BCFA use cases |
| 9 | `enable_multimodal_input` with the Now LLM provider | NOT_SUPPORTED (by design) | Now LLM is text-only and does not use image input; the 13-document probe showed no effect. This flag is not a route to visual reading | Off |
| 10 | Multimodal LLM providers for Document Key Value Extraction (Azure OpenAI, Amazon Bedrock, Google Cloud Vertex AI) | **LICENSE_DEPENDENCY** (and a client decision) | Capability definitions present on the instance (with an `image1` input); Azure OpenAI and OpenAI spokes installed. Not tested: documents would go to a third-party LLM, against the POC rule, and the entitlement is not confirmed | Not enabled. Needed only for image understanding (stamps, handwriting) |
| 11 | `enable_native_translation` | AVAILABLE_NOT_CONFIGURED (deliberately) | Translation would run on the reader text, which has already lost the Chinese; and translated company names must never be used as authoritative (strict rule) | Off. Names are kept as printed |
| 12 | Native visual stamp / seal / chop detection (object detection) | **NOT_SUPPORTED** | No visual-object capability on this instance; with rows 9 and 10 out, the model sees text only. Client run: a real blue company seal (CS-02, CS-06) answered NO; a receiving stamp page (CS-12) answered NO; a printed "(CommonSeal)" label answered YES | Stamp evidence fields; every answer stays UNCERTAIN / DETECTED_BEST_EFFORT; a person decides |
| 13 | Stamp text reading | NOT_SUPPORTED (as visual); best effort from text | Stamp text read on CS-01 was the printed label "CommonSeal", not the stamp | Shown as "as read", never decisive |
| 14 | Signature detection | NOT_SUPPORTED (visual); best effort from text | No visual capability; the GRN use case answers YES / NO / UNCERTAIN from text | Evidence only |
| 15 | Handwriting recognition | Partial (DocReader OCR reads some handwriting as text) | CS-01 handwritten PO read with a digit wrong ("11000 63265" for 1100063205); CS-12 handwritten MIGO (GRN) number not read, the handwritten "Obs" number read; CS-02 / CS-06 handwritten GRN numbers not read. The model never knew the values were handwritten (answered NO) | GRN use case + review; never authoritative |
| 16 | Bounding-box mapping of values | AVAILABLE_AND_ENABLED | `enable_bounding_box_mapping` true; candidates returned for part of the fields | Field evidence |
| 17 | Per-field confidence | NOT_SUPPORTED (generative extraction returns none) | `sys_di_extracted_value` has no confidence for generative keys | BCFA confidence = field completeness (documented); no fake confidence |
| 18 | Classic (non-generative) Document Intelligence extraction | AVAILABLE_AND_ENABLED (not used for these requirements) | Legacy use case "BCFA AP Invoice Extraction" active; it uses the same reading step | Not used |

## Decisions taken

- **Correction (Chinese OCR remediation, 2026-10-14):** the earlier finding "DocReader drops Chinese on this release"
  was wrong. BCFA's use cases were created without `regional_hub_enabled`, so the platform never applied their
  language (document config) and every task read with the Latin model. With the CJ model applied, Chinese is read;
  see `CHINESE_DOCUMENT_TEST_RESULTS.md`. Korean (images) and Thai (scans) are outside the CJ model and stay
  NOT_SUPPORTED (rows 6 and 7).
- **Nothing external was added.** Extraction stays native (Document Intelligence, Now LLM). No Claude, OpenAI, Gemini
  or other OCR / vision service at runtime.
- **Configured what is available:** stamp / seal / chop and handwriting fields on the AP use case, Chinese label hints
  (销售方, 购买方, 发票号码, 开票日期, 价税合计, 备注, 统一社会信用代码) with "as printed, never translate", and a new
  **BCFA Goods Receipt / GRN Extraction (Now LLM)** use case (17 fields). Generated by
  `scripts/deploy/gen_native_extraction.py`, live 2026-10-14.
- **Stamp capability set to what was measured:** property `x_695068_bcfa.document_evidence.stamp_detection_capability`
  = `ocr_text`. With `ocr_text`, a YES is DETECTED_BEST_EFFORT and a NO is UNCERTAIN, never NOT_DETECTED. Set it to
  `native_visual` only after a native image-understanding reading has been verified on stamped and unstamped client
  documents.
- **The reading loss is detected, not hidden:** every native reading now records the characters per script in the
  reader text (`reader_script_check` on the intake). A Chinese document whose reader text has no Chinese characters is
  explained on the intake and in the review message.

## Open with ServiceNow / the client

1. Chinese: resolved (CJ model). Product feedback: a use case without `regional_hub_enabled` silently ignores its
   language. Korean (images) and Thai (scans): ask which OCR model covers them on this release.
2. Image understanding for stamps: is there a native visual capability (or a Now LLM multimodal path) for this
   release? Until then stamp presence is a human check.
3. Azure OpenAI multimodal provider: client decision (data leaves to Azure OpenAI) and entitlement confirmation. Not
   enabled by BCFA.
