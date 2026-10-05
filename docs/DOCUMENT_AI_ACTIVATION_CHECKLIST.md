# DOCUMENT_AI_ACTIVATION_CHECKLIST.md: from simulated extraction to native Document Intelligence

> **Done in Phase 40 (2026-10-05).** Native Document Intelligence extraction is active and is the default provider. The status line below is historical. Remaining items: client samples, production entitlement and Now LLM data terms (`CLIENT_POC_SUCCESS_REPORT.md` §5).

**Status: SIMULATED.** Document extraction in the POC is **SIMULATED DOCUMENT EXTRACTION — POC**.

`SimulatedDocumentExtraction` returns the printed values of each synthetic fixture. It uses no AI and makes no external call, and its output is labelled on:

- the extraction record;
- the Review Summary;
- the journey banner;
- Playbook stage 2 (AP and AR).

Everything after reading is the real deterministic pipeline: validation, matching, exceptions, approvals and integration.

## Why it is simulated (evidence)

`CONTENT_UNDERSTANDING.md`, Phase 12 spike `scripts/deploy/phase12_docintel_spike_bg.js`:

- **Use cases exist and are field-complete:**
  - BCFA AP Invoice Extraction (`sys_di_task_definition` `0267216deb23c314311dff0dcad0cd8e`), 13 fields;
  - BCFA AR Remittance Extraction (`456fe961eba3c314311dff0dcad0cdf3`), 10 fields.
- **A live document task came back empty.**
  - It ran through `sn_docintel.DocIntelAPI` (createTask → processTask) and returned all 13 fields empty.
  - Prediction method: Classic (untrained ML); `is_trained = false`.
  - The prediction server could not process the attachment.
- **Generative extraction is not offered** to these use cases. This points to entitlement, but that is unconfirmed.

Classification: **LICENSE REQUIRED** (to confirm) and **CONFIGURATION REQUIRED** (training or generative method).

## Checklist

| # | Step | Owner / navigation | Done |
|---|---|---|---|
| 1 | Confirm the **Now Assist Document Intelligence** entitlement (generative extraction) for this instance and for production | ServiceNow account team | ☐ |
| 2 | Confirm the plugins are active: Document Intelligence (`com.glide.document_intelligence` / Now Assist DocIntel) and Now Assist platform. **Do not activate plugins on the shared demo instance**: the instance owner does | Instance admin: All → System Applications → All Available Applications | ☐ |
| 3 | Open the use cases | All → Document Intelligence → Use Cases (the second Use Cases entry, the Now Assist / generative one) → BCFA AP Invoice Extraction / BCFA AR Remittance Extraction | ☐ |
| 4 | Switch each use case to the generative (LLM) extraction method; or, for the Classic method, train it with at least the 11 fixture documents (`DOCUMENT_FIXTURES.md`) | Use case → Extraction method / Train | ☐ |
| 5 | Run one document task per fixture; check that each field is extracted with confidence | Use case → Document tasks → Create a document task | ☐ |
| 6 | Replace the reading step: in `FinanceDocumentIntakeService`, call `sn_docintel.DocIntelAPI` (createTask / processTask / getTaskFields). Map the results to the **same result shape** `SimulatedDocumentExtraction` returns (fields + per-field confidence + `source`) | source: `src/server/script-includes/FinanceDocumentIntakeService.server.js` | ☐ |
| 7 | Set the extraction `source` to the native value (e.g. `docintel`). Remove the SIMULATED label: `FinanceJourneyService.SIMULATED_EXTRACTION`, Playbook stage 2 titles (`scripts/deploy/gen_playbooks.py`), the Review Summary | source | ☐ |
| 8 | Keep the confidence threshold and the low-confidence exception (`x_695068_bcfa` policy): a low-confidence field must still go to a person | FinancePolicy | ☐ |
| 9 | Re-run ATF (BCFA Regression) and the AP and AR E2E scenarios with real documents | `FINAL_E2E_TEST_RESULTS.md` | ☐ |
| 10 | Update `CONTENT_UNDERSTANDING.md` with the evidence (task sys_ids, fields, confidences) | docs | ☐ |

## What must not be done

- Do not label simulated extraction as native.
- Do not route documents to an external LLM. Native ServiceNow AI only (`AI_GOVERNANCE.md`, `EXTERNAL_AI_REMOVAL.md`).
