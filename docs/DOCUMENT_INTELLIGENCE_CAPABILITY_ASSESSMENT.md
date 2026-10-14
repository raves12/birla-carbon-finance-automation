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
| 4 | Simplified Chinese text on VAT e-invoices (digital PDF) | **NOT_SUPPORTED** | Reader text of CS-18 (2026-10-14, FDI0000029): 1961 characters, **0 Chinese**; CS-03, CS-17, CS-20 the same. The PDFs have a proper Chinese text layer locally. All Chinese labels, names and amounts are lost before the model runs | Detected and explained on the intake ("Reader text ... Chinese 0"); manual review |
| 5 | Chinese on bilingual bank forms (digital PDF) | AVAILABLE_AND_ENABLED (partial) | CS-15: 36 Chinese characters kept, CS-21: 17; amount, currency, date, references read; payer read as the remitting bank | AR advice use case |
| 6 | Korean on image pages | **NOT_SUPPORTED** | CS-19, CS-23 image text: 0 Hangul; CS-08 digital pages keep Hangul (20 characters) | Manual review |
| 7 | Thai on scans | **NOT_SUPPORTED** | CS-26: 0 Thai characters in the reader text | Manual review |
| 8 | Language / OCR configuration for Chinese | **UNKNOWN_NEEDS_PLATFORM_CONFIRMATION** | No such setting on this release; whether a later release or a support fix restores CJK in DocReader must come from ServiceNow | Raise with ServiceNow |
| 9 | `enable_multimodal_input` (image to the model) with the Now LLM provider | AVAILABLE_NOT_CONFIGURED | Probe 2026-10-14: 13 client documents (CS-01, 02, 03, 06, 12, 15, 17, 18, 19, 20, 21, 23, 26) run with the flag off and on, same reader text: 11 outputs identical; CS-17 read 3 more values with the flag on (invoice number, date, total: digits that are in the reader text) and CS-26 read 3 fewer, i.e. run-to-run variance in both directions. No stamp, handwriting or Chinese value changed. No measurable image understanding with the Now LLM provider on this release | Left off in the BCFA use cases (no measured benefit) |
| 10 | Azure OpenAI provider (`use_azure_api`) with multimodal input | **LICENSE_DEPENDENCY** (and a policy decision) | The provider option exists in the platform skill configuration. Not tested: it sends client documents to Azure OpenAI, which conflicts with the POC rule "no OpenAI at runtime", and the entitlement is not confirmed | Not used. Needs the client's decision and licence confirmation |
| 11 | `enable_native_translation` | AVAILABLE_NOT_CONFIGURED (deliberately) | Translation would run on the reader text, which has already lost the Chinese; and translated company names must never be used as authoritative (strict rule) | Off. Names are kept as printed |
| 12 | Native visual stamp / seal / chop detection (object detection) | **NOT_SUPPORTED** | No visual-object capability on this instance; with rows 9 and 10 out, the model sees text only. Client run: a real blue company seal (CS-02, CS-06) answered NO; a receiving stamp page (CS-12) answered NO; a printed "(CommonSeal)" label answered YES | Stamp evidence fields; every answer stays UNCERTAIN / DETECTED_BEST_EFFORT; a person decides |
| 13 | Stamp text reading | NOT_SUPPORTED (as visual); best effort from text | Stamp text read on CS-01 was the printed label "CommonSeal", not the stamp | Shown as "as read", never decisive |
| 14 | Signature detection | NOT_SUPPORTED (visual); best effort from text | No visual capability; the GRN use case answers YES / NO / UNCERTAIN from text | Evidence only |
| 15 | Handwriting recognition | Partial (DocReader OCR reads some handwriting as text) | CS-01 handwritten PO read with a digit wrong ("11000 63265" for 1100063205); CS-12 handwritten MIGO (GRN) number not read, the handwritten "Obs" number read; CS-02 / CS-06 handwritten GRN numbers not read. The model never knew the values were handwritten (answered NO) | GRN use case + review; never authoritative |
| 16 | Bounding-box mapping of values | AVAILABLE_AND_ENABLED | `enable_bounding_box_mapping` true; candidates returned for part of the fields | Field evidence |
| 17 | Per-field confidence | NOT_SUPPORTED (generative extraction returns none) | `sys_di_extracted_value` has no confidence for generative keys | BCFA confidence = field completeness (documented); no fake confidence |
| 18 | Classic (non-generative) Document Intelligence extraction | AVAILABLE_AND_ENABLED (not used for these requirements) | Legacy use case "BCFA AP Invoice Extraction" active; it uses the same reading step | Not used |

## Decisions taken

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

1. DocReader drops Chinese (VAT e-invoices), Korean (images) and Thai (scans) on this release: support case for CJK /
   Thai text in DocReader and why the e-invoice text layer is not used.
2. Image understanding for stamps: is there a native visual capability (or a Now LLM multimodal path) for this
   release? Until then stamp presence is a human check.
3. Azure OpenAI multimodal provider: client decision (data leaves to Azure OpenAI) and entitlement confirmation. Not
   enabled by BCFA.
