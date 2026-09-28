# INTEGRATION_CONTRACTS.md — Birla Carbon Finance Automation

Updated: 2026-09-28 (Phase 18 — verified live, see "Verification").

Canonical business-level operations exposed by `IntegrationService` (`src/server/script-includes/IntegrationService.server.js`).
AP/AR domain logic never calls an adapter directly — everything goes through
`IntegrationService.execute({ operation, adapter, correlationId, idempotencyKey, externalReference, sourceTable, sourceRecord, payload, simulateOutcome })`,
the only place correlation IDs, idempotency, and Unknown Outcome Control are implemented.

## Adapters

| Adapter | Class | Use |
|---|---|---|
| `mock_sap` | `MockSAPAdapter` | Authoritative for the POC: deterministic mock SAP ECC responses over the mock master data tables |
| `real_sap` | `RealSAPAdapter` | **Seam** for a real SAP connection (e.g. SAP Integration Suite via a Connection & Credential alias). Implements every canonical operation; until configured it returns `NOT_CONFIGURED` and sends nothing (the transaction is `failed` with error `NOT_CONFIGURED` — a definite, safe failure) |
| `mock_bank` | `MockBankAdapter` | Bank statement lines |
| `mock_archive` | `MockArchiveAdapter` | Archive on reconcile-and-close |

`IntegrationService.checkAdapterContract(adapter)` verifies an SAP adapter implements every canonical
operation (`RealSAPAdapter.CANONICAL_OPERATIONS`). Connecting SAP later means implementing
`RealSAPAdapter` and pointing the Integration Profile at `real_sap` — no change to the domain services,
tables, ACLs or state models. No real SAP interface details have been provided (`OPEN_SAP_GAPS.md`).

## Canonical operations

| Operation | Payload → Response | Notes |
|---|---|---|
| `getVendor` | `{ vendorCode }` → `{ found, sysId, vendorCode, name, companyCode, currency, paymentTerms, active }` | |
| `getCustomer` | `{ customerCode }` → `{ found, sysId, customerCode, name, companyCode, currency, active }` | |
| `getPurchaseOrder` | `{ poNumber }` → `{ found, sysId, poNumber, vendor, companyCode, currency, status, lines[] }` | alias `getPO` |
| `getReceipt` | `{ receiptNumber }` → `{ found, sysId, receiptNumber, poLine, receiptType, quantity, sapDocumentId }` | |
| `getOpenItems` | `{ customerSysId }` → `{ found, items[] }` | alias `getOpenARItems` |
| `postVendorInvoice` | `{ invoiceNumber, vendor, amount }` → `{ status, sapDocumentId (MIRO…), message }` | financial write; never touches the AP invoice — `ApDomainService` applies the result |
| `clearCustomerPayment` | `{ bankReference, customer, amount }` → `{ status, sapDocumentId (FB05…), message }` | financial write; alias `clearPayment` |
| `queryTransactionStatus` | `{ operation, idempotencyKey, externalReference }` → `{ outcome: COMMITTED \| NOT_FOUND \| UNAVAILABLE, sapDocumentId? }` | read; used by reconciliation |

Also supported: `getCreditNotes`, `getExchangeRate`, `createReceipt` (write), `getBankStatement` (mock_bank),
`archive` (mock_archive).

## Integration Transaction (`x_695068_bcfa_integration_txn`)

One record per idempotency key: `correlation_id`, `operation`, `request_payload` (request),
`request_hash` (SHA-256 of operation + request), `status` (state), `response_payload`,
`external_document_id` (SAP / mock reference), `attempt`, `requested_at` (started), `completed_at`,
`error_code` / `error_message`, `external_reference` (business reference), `reconciliation_state`
(not required, pending, confirmed committed, confirmed not committed, escalated), `unknown_outcome_flag`,
`source_table` / `source_record`, `adapter`. A retry updates the same record (attempt + 1).

## Idempotency — before any financial write

1. **Idempotency key.** A committed transaction (success, or reconciled as committed) is **replayed**,
   never re-sent. A transaction whose outcome is still unknown **blocks** any send until reconciled; an
   escalated one blocks until a person resolves it.
2. **Transaction + operation.** A committed write of the same operation for the same source record under
   a different key is **replayed**.
3. **External reference.** A committed write for the same business reference on a *different* record is
   **blocked** as a duplicate (AP: vendor + normalized invoice number; AR: bank reference).

Blocked sends are audited (`integration_call` audit event) and return `blocked_unknown_outcome`,
`blocked_escalated` or `blocked_duplicate`; nothing is sent. Keys: AP posting `'AP-POST-' + invoice sys_id`;
AR clearing the payment's `idempotency_key`.

## Unknown Outcome Control

A `timeout` or `unknown_outcome` result sets the transaction to unknown outcome
(`reconciliation_state = pending`) and the invoice/payment to `UNKNOWN_OUTCOME`. **The write is never
retried blindly.** `IntegrationService.reconcileUnknownOutcome(transactionSysId)` calls
`queryTransactionStatus` (itself logged as a transaction) and returns:

- `POSTED` — committed: status `reconciled`, `confirmed_committed`, SAP reference recorded; later sends are replays.
- `RETRY` — confirmed nothing committed (`confirmed_not_committed`): only now may the caller send again
  with the same key; the same transaction is reused (attempt + 1).
- `INTEGRATION_EXCEPTION` — retry limit (3) reached (`escalated`) or the status could not be determined
  (stays `pending`, nothing re-sent); routed to an exception for a person.

## Deterministic failure simulation

Effective mode: `params.simulateOutcome` (per call) over the active Integration Profile's `failure_mode`.
Modes: `success`, `validation_error`, `technical_error`, `timeout`, `duplicate`, `delayed_response`,
`partial_response`, `unknown_outcome`.

## Deterministic mock document IDs and ground truth

`MockSAPAdapter._sapDocId(prefix, idempotencyKey)` derives the document number from a weighted
character-code sum of the idempotency key (same key → same document). `_deterministicallyCommitted(idempotencyKey)`
(character-code parity) answers whether a timed-out call committed, with no hidden state.

## Verification (Phase 18, `scripts/deploy/phase18_verify_bg.js`, live)

1. Canonical reads (getVendor, getCustomer, getPurchaseOrder, getReceipt, getOpenItems) succeed and are
   logged with a request hash and correlation id.
2. Adapter contract: `mock_sap` and `real_sap` conform; a post through `real_sap` → `failed`, `NOT_CONFIGURED`, nothing sent.
3. Same key twice → one transaction, second call replayed.
4. Another key, same invoice → replay of the committed post (no new transaction).
5. Another invoice, same external reference → `blocked_duplicate`.
6. Timeout → resend blocked (`blocked_unknown_outcome`) → reconcile → `POSTED` (MIRO…) → resend replayed.
7. Timeout → reconcile → `RETRY` (`confirmed_not_committed`) → retry succeeds on the same transaction, attempt 2.

Fixed in Phase 18: a retry after reconciliation previously inserted a second transaction with the same
(unique) idempotency key, which failed silently.
