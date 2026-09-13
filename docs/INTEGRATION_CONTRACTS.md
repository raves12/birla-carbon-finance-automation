# INTEGRATION_CONTRACTS.md — Birla Carbon Finance Automation

Canonical business-level operations exposed by `IntegrationService` (`src/server/script-includes/IntegrationService.server.js`).
AP/AR domain logic never calls an adapter directly — everything goes through
`IntegrationService.execute({ operation, adapter, correlationId, idempotencyKey, sourceTable, sourceRecord, payload, simulateOutcome })`,
which is the only place correlation IDs, idempotency, and Unknown Outcome
Control (Section 11) are implemented.

## Idempotency

Every write operation carries an `idempotencyKey`. Before calling the adapter, `IntegrationService`
checks for a prior **successful** `Integration Transaction` with the same key and, if found, returns
that cached response without calling the adapter again — this is the actual idempotency
enforcement point, not a property of the adapter. AP posting uses `'AP-POST-' + apInvoiceSysId`;
AR clearing uses the Payment's own `idempotency_key` field.

## Deterministic failure simulation

Each call resolves an effective failure mode: `params.simulateOutcome` (a per-call override, used by
demo scenarios that need a specific outcome) takes precedence over the active `Integration Profile`
row for that adapter (a systemic toggle used in Stage 12 resilience testing). Modes: `success`,
`validation_error`, `technical_error`, `timeout`, `duplicate`, `delayed_response`,
`partial_response`, `unknown_outcome`.

## Section 11 — Unknown Outcome Control

A `timeout` or `unknown_outcome` result is never blindly retried. `IntegrationService.reconcileUnknownOutcome(transactionSysId)`
queries `MockSAPAdapter.getPostingStatus(operation, idempotencyKey)` for the ground truth
(deterministically derived from the idempotency key — see below) and returns one of:

- `POSTED` — the adapter confirms the write actually committed; the caller marks the invoice/payment
  posted/cleared using the now-confirmed SAP document ID.
- `RETRY` — nothing committed under this idempotency key, so a fresh attempt cannot duplicate
  anything; the caller re-invokes the same operation. Capped at 3 attempts.
- `INTEGRATION_EXCEPTION` — retry limit reached with no confirmed outcome; routed to a Finance/AP/AR
  exception for human resolution.

## Canonical operations

| Operation | Adapter | Payload → Response | Notes |
|---|---|---|---|
| `getVendor` | mock_sap | `{ vendorCode }` → `{ found, sysId, vendorCode, name, companyCode, currency, paymentTerms, active }` | Reads `x_695068_bcfa_vendor` |
| `getCustomer` | mock_sap | `{ customerCode }` → `{ found, sysId, customerCode, name, companyCode, currency, active }` | Reads `x_695068_bcfa_customer` |
| `getPO` | mock_sap | `{ poNumber }` → `{ found, sysId, poNumber, vendor, companyCode, currency, status, lines[] }` | Reads `x_695068_bcfa_purchase_order` + lines |
| `getReceipt` | mock_sap | `{ receiptNumber }` → `{ found, sysId, receiptNumber, poLine, receiptType, quantity, sapDocumentId }` | Reads `x_695068_bcfa_receipt` |
| `getOpenARItems` | mock_sap | `{ customerSysId }` → `{ found, items[] }` | Reads `x_695068_bcfa_ar_open_item` where `status != cleared` |
| `getCreditNotes` | mock_sap | `{ customerSysId }` → `{ found, creditNotes[] }` | Reads `x_695068_bcfa_credit_note` where `status = open` |
| `getExchangeRate` | mock_sap | `{ fromCurrency, toCurrency }` → `{ found, rate }` | Static illustrative rate table — see Open SAP Gaps for the real-TCURR caveat |
| `createReceipt` | mock_sap | `{ receiptNumber?, poLine, receiptType, quantity }` → `{ status, sysId, sapDocumentId }` | Writes `x_695068_bcfa_receipt` |
| `postVendorInvoice` | mock_sap | `{ invoiceNumber, vendor, amount }` → `{ status, sapDocumentId, message }` | **Never touches `x_695068_bcfa_ap_invoice`** — `ApDomainService` applies the result |
| `clearPayment` | mock_sap | `{ bankReference, customer, amount }` → `{ status, sapDocumentId, message }` | **Never touches `x_695068_bcfa_payment`** — `ArDomainService` applies the result |
| `getBankStatement` | mock_bank | `{ bankAccount, fromDate, toDate }` → `{ found, lines[] }` | Reads seeded `x_695068_bcfa_payment` rows (no live bank connectivity in this PDI) |
| `archive` | mock_archive | `{ sourceTable, sourceRecord, correlationId }` → `{ status, archiveReference }` | Used by the reconcile-and-close step of both lifecycles |

## Deterministic mock document IDs and ground truth

`MockSAPAdapter._sapDocId(prefix, idempotencyKey)` derives a fabricated SAP document number from a
simple weighted character-code sum of the idempotency key — same key always yields the same
document ID. `_deterministicallyCommitted(idempotencyKey)` (a plain char-code-sum parity check)
answers whether a "timed out" call actually committed, without any hidden stored state — satisfying
Section 9's requirement that every mock response be deterministic based on
`operation + correlationId + idempotencyKey`, using only the idempotency key (which is itself
derived from the operation and source record) since that is what stays stable across a retry.

## Production migration note

Replacing `MockSAPAdapter`/`MockBankAdapter` with real adapters means changing only
`IntegrationService._getAdapter()`'s adapter resolution and adding a real `SAPAdapter` class with
the same method signatures — no change to `ApDomainService`, `ArDomainService`, `MatchingEngine`, or
any table/ACL/state model. This is the seam described in `ARCHITECTURE.md` section 1.
