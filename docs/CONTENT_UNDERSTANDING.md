# Content Understanding / Now Assist DocIntel Configuration (Phase 5)

Date: 2026-09-25 to 2026-09-27 (corrected 2026-09-28, Phase 12)
Instance: `pwcmanagementservicesdemo01.service-now.com`

## Correction (Phase 12): extraction does not return values on this instance

The Phase 5 conclusion below, that these use cases run on the generative
(Now Assist) path, was **wrong**. The Phase 12 spike
(`scripts/deploy/phase12_docintel_spike_bg.js`) created a document task on
`AP_INV_001_CLEAN.pdf` through `sn_docintel.DocIntelAPI`
(`createTask` → `processTask`). The task processed (task
`5ab68716ebe3c310311dff0dcad0cdfa`), but **all 13 fields came back empty**:

- The task's prediction method is **Classic** (the untrained ML method),
  and the use case is `is_trained=false`.
- The platform reported that the prediction server could not process the
  attachments.
- Generative (Now LLM) extraction is not available to these use cases.
  This points to entitlement, but that is unconfirmed.

**Status:** the use cases are configured and field-complete, but DocIntel
extraction is **license- and training-dependent** and returns no values
today. The AP journey therefore uses **simulated extraction** for the
reading step: `SimulatedDocumentExtraction` returns the printed values of
each synthetic fixture, clearly labelled SIMULATED, with no AI and no
external call. Everything after reading is the real deterministic pipeline.
To go native later:

1. Confirm the Now Assist Document Intelligence entitlement with the
   ServiceNow account team.
2. Switch the use cases to the generative method, or train them.
3. Swap `SimulatedDocumentExtraction` for a `DocIntelAPI` call that has the
   same result shape.

The "Capability confirmation" section below is kept for the record.

## Capability confirmation (Phase 5; superseded by the correction above)

This configuration was intended to use **Now Assist DocIntel** (the
GenAI-powered document extraction capability), **not** the legacy
trained-ML Document Intelligence engine, per the program's "no external AI"
mandate. The Phase 5 evidence (below) showed the use cases were created
through the generative wizard; it did not prove that extraction runs on it:

- Both use cases live in `sys_di_task_definition` (the unified "Use Case"
  model Now Assist DocIntel shares with the legacy engine), but their
  `mluc_id` (Machine Learning Use Case ID — populated only when a legacy
  custom ML model has been trained) is **empty** on both records. The
  legacy engine cannot function without training a model first; ours never
  went through that flow.
- The creation wizard for each exposed a **"Language Model"** selector
  (left at "Default", ServiceNow's own managed model) — a concept that
  only exists on the GenAI path. The legacy engine has no language model at
  all; it trains a bespoke statistical/OCR model per use case instead.
- Reached via the dedicated `/now/docintel-admin/` admin app (module path:
  Document Intelligence → "Document Data Extraction" → the *second* Use
  Cases entry in the application navigator — there are two nearly-identical
  entries; the first one is the legacy engine and was deliberately not
  used).

## AP Invoice Extraction

Use case: **BCFA AP Invoice Extraction** (`sys_di_task_definition`
sys_id `0267216deb23c314311dff0dcad0cd8e`)
Target table: `x_695068_bcfa_ap_extraction`

13 fields configured, matching the brief's required AP field list exactly:

| Field | Type |
|---|---|
| Vendor Name | Text |
| Vendor Number | Text |
| Invoice Number | Text |
| PO Number | Text |
| Currency | Text |
| Invoice Date | Date |
| Subtotal | Decimal |
| Tax | Decimal |
| Total | Decimal |
| Invoice Lines (table) → Description | Text |
| Invoice Lines (table) → Quantity | Decimal |
| Invoice Lines (table) → Unit Price | Decimal |
| Invoice Lines (table) → Line Amount | Decimal |

Known cosmetic quirk: three fields (Invoice Number, PO Number, Currency)
were originally mistyped during creation (a batched-input race condition in
the admin UI concatenated field names) and corrected via the Display Name,
but their internal system name still reflects the original typo
(`invoicenumberponumber`, `invoicenumberponumbercurrency`,
`invoicelines...`). This is purely an internal identifier — displayed
labels, types, and extraction behavior are all correct — and is safe to
leave as-is or clean up later via a rename if it becomes confusing.

## AR Remittance Extraction

Use case: **BCFA AR Remittance Extraction** (`sys_di_task_definition`
sys_id `456fe961eba3c314311dff0dcad0cdf3`)
Target table: `x_695068_bcfa_remittance`

10 fields configured, matching the brief's required AR field list:

| Field | Type |
|---|---|
| Customer Name | Text |
| Customer Reference | Text |
| Payment Reference | Text |
| Payment Amount | Decimal |
| Currency | Text |
| Bank Reference | Text |
| Deduction Indication | Text |
| Free-Text Comment | Text |
| Invoice References (table) → Invoice Reference | Text |
| Invoice References (table) → Amount Applied | Decimal |

## Extraction test

Ran one live document task against `AP_INV_001_CLEAN.pdf` (Phase 4 fixture)
via **Document tasks → Create a document task → Open in Document
Intelligence**. Confirmed the review UI correctly renders the document and
recognizes manually-drawn extraction regions (box-select tool → "No value
detected" on an imprecise first attempt, indicating the OCR pipeline is
live and responsive — a properly-drawn box would return a value). Did not
complete fine-grained calibration across the full fixture set — this is a
manual, iterative tagging exercise best done interactively by a human
reviewer, not something to force through browser automation. Recommended
next step whenever the AP/AR journeys are demoed end-to-end (Phase 12/13):
run each of the 11 Phase 4 fixtures through a document task once to build
up a few real "known-good" extraction examples.

## Neither use case is wired into the application yet

These two use cases exist and are field-complete, but nothing in the
application calls them, because they return no values (see the correction
at the top). Since Phase 12, with `x_695068_bcfa.ai.provider = native` (the
default), `FinanceDocumentIntakeService` does not call Claude:

- It uses the document type set at upload.
- It reads AP invoices through `SimulatedDocumentExtraction`.

- It reads AR remittances through `SimulatedDocumentExtraction` too (since Phase 13).

Claude was removed from every document path in Phase 34 (`EXTERNAL_AI_REMOVAL.md`). Payment-advice documents go to
manual review.
