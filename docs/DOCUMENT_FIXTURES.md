# Synthetic Document Fixtures (Phase 4)

Date: 2026-09-25

11 synthetic PDF documents under `test/fixtures/`, generated with a local
Python/reportlab script (not committed — one-off generation tool; the PDFs
themselves are the durable artifact). Every fixture carries a visible red
"SYNTHETIC SAMPLE DATA — FOR DEMO/TEST USE ONLY" watermark and uses only
fictional company names already established by `DemoDataSeeder` (Phase 3) —
no real vendor, customer, or Birla Carbon information anywhere.

Each fixture's numbers are self-consistent (a real invoice/remittance a
human could read and understand) rather than forced to match the exact
internal DB field quirks of its corresponding seeded scenario — the fixture
exists to visually demonstrate the exception type, not to reconcile to the
cent with `DemoDataSeeder`'s own internal arithmetic shortcuts.

| Fixture | Maps to scenario | Demonstrates |
|---|---|---|
| `AP_INV_001_CLEAN.pdf` | AP-001 | Clean 3-way match — no exception |
| `AP_INV_002_QTY_VARIANCE.pdf` | AP-004 | Invoiced quantity exceeds PO/GRN quantity |
| `AP_INV_003_PRICE_VARIANCE.pdf` | AP-005 | Invoiced unit price exceeds PO price |
| `AP_INV_004_DUPLICATE.pdf` | AP-002 | Resubmission of an already-processed invoice number |
| `AP_INV_005_TAX_EXCEPTION.pdf` | AP-006 | Tax amount inconsistent with expected country rate |
| `AP_INV_006_LOW_CONFIDENCE.pdf` | AP-007 | Deliberately degraded layout/legibility — missing PO reference, unclear fields |
| `AR_REMIT_001_EXACT.pdf` | AR-001 | Remittance exactly matches one open invoice |
| `AR_REMIT_002_MULTI_INVOICE.pdf` | AR-003 | One remittance covering three open invoices |
| `AR_REMIT_003_SHORT_PAY.pdf` | AR-006 | Remittance short of the open invoice amount |
| `AR_REMIT_004_BANK_CHARGE.pdf` | AR-007 | Remittance short by a small, bank-charge-sized amount |
| `AR_REMIT_005_ALIAS_CUSTOMER.pdf` | AR-004 | Remitter name differs from registered customer legal name (alias resolution) |

## Loader

[`scripts/attach_fixtures.mjs`](../scripts/attach_fixtures.mjs) — a
Node.js script (no new npm dependency; uses Node's built-in `--env-file` and
`fetch`) that, for every fixture:

1. Looks up an existing `x_695068_bcfa_finance_intake` record by
   `source_reference` (the fixture's filename) — creates one if missing,
   with `document_type` pre-set (`ap_invoice` / `ar_remittance`) and
   `processing_status: 'new'`.
2. Checks whether that intake record already has an attachment — uploads
   the PDF via the standard `/api/now/attachment/file` REST endpoint if not.

Idempotent — rerun freely; verified by running it twice (first run created
11 intake records + 11 attachments, second run reported all 11 already
present and skipped). Credentials are read from the environment only, via
`node --env-file=<path> scripts/attach_fixtures.mjs` — nothing is hardcoded
in the script or committed to git.

Run from the repo root:

```bash
node --env-file=../servicenow-mcp-server/.env scripts/attach_fixtures.mjs
```

(or point `--env-file` at any `.env` with `SN_INSTANCE`, `SN_USERNAME`,
`SN_PASSWORD`, `SN_CLIENT_ID`, `SN_CLIENT_SECRET` for this instance's OAuth
Application Registry.)

## Result (confirmed live, 2026-09-25)

All 11 `x_695068_bcfa_finance_intake` records created (auto-numbered
`FDI-XXXXXXXX`, confirming the Phase 2 auto-number Business Rule works
correctly on real inserts) and all 11 PDFs attached. Each sits at
`processing_status: 'new'`, ready to be picked up by Phase 5's Content
Understanding configuration and the native-AI-driven Finance Document
Intake pipeline once that replaces the current Claude-only extraction path.
