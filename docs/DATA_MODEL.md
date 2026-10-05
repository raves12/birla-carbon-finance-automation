# DATA_MODEL.md — Birla Carbon Finance Automation

> **Phase 40 update (2026-10-05).** `x_695068_bcfa_ap_extraction.source` is `servicenow_document_intelligence` for uploaded documents (native extraction) and `simulated_document_intelligence` for fixtures and seeded data. New Phase 40 columns (tax breakdown, tax and withholding validation, tolerance detail, payment advice fields, extraction provider) are listed in `CLIENT_POC_CONFIGURATION_AND_SECURITY.md` and the Fluent source.

Stage 3 output. 27 tables, normalized by domain, all verified deployed in the PDI (scope
`x_695068_bcfa`) via `now-sdk build`/`now-sdk install` + MCP `table_list` confirmation. Full field
definitions live in the Fluent source — this document is the index and the cross-domain rationale.

## AP domain (`src/fluent/tables/ap.now.ts`)

| Table | Purpose |
|---|---|
| `x_695068_bcfa_ap_invoice` | Header record for an incoming invoice; carries `state` (AP Invoice StateModel, Stage 5), `approval_state`, `posting_state`, correlation/idempotency-adjacent fields, and `duplicate_key` for duplicate detection. |
| `x_695068_bcfa_ap_invoice_line` | Line items, each optionally tied to a `po_line` and `receipt_reference` for 3-way match. |
| `x_695068_bcfa_ap_extraction` | Simulated Document Intelligence output (DISCOVERY.md: not licensed in this PDI) — extracted fields + confidence, explicitly tagged by `source` as simulated. |
| `x_695068_bcfa_ap_match` | 3-way match result per invoice/PO-line/receipt: variances, tolerance pass/fail, match result. |
| `x_695068_bcfa_ap_exception` | Reviewer-facing exception with structured `reason_code`, plus an `ai_recommendation` field kept separate from any authoritative value. |
| `x_695068_bcfa_ap_approval` | Posting approval gate: requester, approver, decision, notes. |

## AR / Cash Application domain (`src/fluent/tables/ar.now.ts`)

| Table | Purpose |
|---|---|
| `x_695068_bcfa_payment` | Bank payment header; carries `state` (Cash Application StateModel, Stage 6) and a unique `idempotency_key`. |
| `x_695068_bcfa_remittance` | Remittance advice linked to a payment, with simulated extraction output. |
| `x_695068_bcfa_payment_allocation` | One row per payment→AR-open-item allocation, with discount/bank-charge/TCS/residual breakdown. |
| `x_695068_bcfa_match_candidate` | Candidate matches (exact / deterministic-fuzzy / AI-suggested) prior to allocation confirmation — `match_type` makes the AI-suggested rows explicit and distinct from deterministic ones. |
| `x_695068_bcfa_deduction` | Short-pay / bank-charge / TCS / credit-note-netting / unapplied-cash deductions against an allocation. |
| `x_695068_bcfa_ar_exception` | Reviewer-facing exception, same `ai_recommendation`-isolation pattern as AP Exception. |
| `x_695068_bcfa_ar_approval` | Clearing approval gate. |

## Shared / cross-cutting (`src/fluent/tables/shared.now.ts`)

| Table | Purpose |
|---|---|
| `x_695068_bcfa_integration_txn` | Every Integration Service call: correlation ID, unique idempotency key, adapter, status (including `unknown_outcome`), attempt count, request/response JSON payloads. This is the audit trail for Section 11's Unknown Outcome Control. |
| `x_695068_bcfa_finance_exception` | System/integration-level exceptions not yet tied to a specific AP/AR exception record. |
| `x_695068_bcfa_decision_log` | One row per deterministic rule evaluation (rule name/version, input snapshot, result, pass/fail) — the audit trail for Stage 13 Decision Tables. |
| `x_695068_bcfa_reference_mapping` | Generic external-id↔internal-id mapping (vendor/customer/material/GL/currency/payment-terms) for future real-SAP reconciliation. |
| `x_695068_bcfa_customer_alias` | Known name variants for AR fuzzy customer resolution (`CA-07`). |
| `x_695068_bcfa_audit_event` | The append-only, end-to-end evidence chain: one row per business event (Phase 19 vocabulary), with process, record, before/after, actor and actor type, AI agent, reason, correlation ID, time and event sequence. See `docs/AUDIT_FRAMEWORK.md`. |
| `x_695068_bcfa_integration_profile` | Per-adapter behavior configuration: failure mode, response delay, retry policy name — this is what makes the mock adapters deterministic and testable (Stage 7). |

## Mock SAP/bank master data (`src/fluent/tables/master_data.now.ts`)

Because this PDI has no real SAP ECC/CPI connectivity and no APO plugin (DISCOVERY.md), the mock
adapters need something to read from. These tables stand in for governed SAP master/transaction
reads — **only `MockSAPAdapter` queries them**; AP/AR domain logic never touches them directly,
preserving the same seam a real `SAPAdapter` would use.

| Table | Mirrors |
|---|---|
| `x_695068_bcfa_vendor` | SAP vendor master |
| `x_695068_bcfa_customer` | SAP customer master |
| `x_695068_bcfa_purchase_order` / `x_695068_bcfa_po_line` | SAP PO header/line |
| `x_695068_bcfa_receipt` | GRN/SRN (MIGO/ML81N) |
| `x_695068_bcfa_ar_open_item` | Open AR items eligible for clearing |
| `x_695068_bcfa_credit_note` | Open credit notes for netting |

## Design notes

- No generic "finance transaction" mega-table — each domain concept is its own normalized table,
  per the project's explicit instruction.
- `state` on AP Invoice and Payment is a plain `StringColumn`, not a `ChoiceColumn` — the state
  values, labels, and gated transitions are owned by `StateModel()` (Stage 5/6), not the table
  dictionary, so state logic lives in one place.
- Every `*_exception` table's `ai_recommendation` field is a distinct, clearly-labeled column —
  never the same field a deterministic rule or approval decision reads, per the AI-advisory-only
  non-negotiable principle.
- `duplicate_key` (AP Invoice) and `idempotency_key` (Payment, Integration Transaction) are plain
  indexed/unique string fields rather than platform-enforced hard uniqueness on business meaning
  where duplicates must be *caught and routed to an exception*, not silently rejected by the
  database — enforced uniqueness is used only where a true duplicate should never be able to exist
  (e.g., two Integration Transaction rows with the same idempotency key would indicate a bug, not
  a business exception).
