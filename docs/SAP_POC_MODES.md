# SAP_POC_MODES.md: SAP in the client POC (Phase 40)

SAP ECC stays the financial system of record. BCFA never posts or clears by itself: it sends approved instructions through `IntegrationService` and records the result.

## Mode 1: Standalone with MOCK SAP (current, demonstrated)

| Item | Current state |
|---|---|
| Adapter | `MockSAPAdapter`, selected by property `x_695068_bcfa.sap.adapter` = `mock_sap` (posting, clearing and the AR open-item read) |
| Reference data | POC tables stand in for SAP: vendors, customers, POs, GRN / SRN, AR open items (`x_695068_bcfa_ar_open_item`). Before AR matching the customer's open items are read through `IntegrationService.getOpenItems` and the local table is updated from the answer (it is the matching cache); MOCK SAP answers from that table |
| Behaviour profile | `x_695068_bcfa_integration_profile` "Mock SAP - Default" (failure mode, response delay) to demonstrate technical errors and unknown outcomes |
| Idempotency | Every financial write has an idempotency key; a duplicate produces one transaction (ATF) |
| Unknown outcome | Reconciled by a status query, never blind-retried (ATF) |
| AR processing mode | `x_695068_bcfa.ar.sap_processing_mode`: DIRECT clears; DRAFT stages a parked document and clears only after SAP confirms. Captured on the payment |
| Labels | Every SAP step is labelled MOCK SAP in the workspace and Playbooks |

What Mode 1 proves: the orchestration, controls, idempotency, unknown-outcome handling, approvals and audit. What it does not prove: anything about real SAP behaviour, data quality, document types or authorisations.

## Mode 2: Test-integrated with a client SAP test system (not built)

Needed before Mode 2 can run:

| # | Item | Owner | State |
|---|---|---|---|
| 1 | Adapter selection by configuration: property `x_695068_bcfa.sap.adapter` (`mock_sap` / `real_sap`) | Build team | **Done** 2026-10-05. With `real_sap` every call fails safely (NOT_CONFIGURED, nothing sent) until item 2 exists |
| 2 | `RealSAPAdapter` implementation of the canonical operations: getVendor, getCustomer, getPurchaseOrder, getReceipt, getOpenItems, postVendorInvoice, clearCustomerPayment, queryTransactionStatus. Today every operation returns NOT_CONFIGURED | Build team + SAP team | **Not done** (contract and conformance check exist) |
| 3 | AR open items read through `IntegrationService.getOpenItems` before matching | Build team | **Done** 2026-10-05 (AR-REC-004). A failed read keeps the cached items and is visible on the integration transaction and the journey. Production must decide whether a failed read should block matching instead |
| 4 | Connectivity: IntegrationHub spoke or the client's middleware (PI/PO, CPI, MuleSoft), MID server if on-premise, credentials in a ServiceNow credential / connection alias | Client IT, ServiceNow admin | Not started |
| 5 | SAP interfaces: BAPI / IDoc / OData for invoice posting (MIRO-equivalent), parked documents, clearing (F-28 / FB05-equivalent), open items, status query | SAP team | Open questions in `OPEN_SAP_GAPS.md` |
| 6 | SAP test system, test company code, test vendors / customers / POs / open items | Client | Not started |
| 7 | Tax: whether SAP tax codes and withholding types replace the POC decision table rows | Client tax + SAP | Open |

## Mode selection for the client POC

- **Recommended for the POC demo: Mode 1**, clearly labelled MOCK SAP. Extraction, tax validation, tolerances, deductions and the journey are demonstrated end to end.
- **Mode 2** is a production-readiness step. It is scoped in `PRODUCTION_IMPLEMENTATION_ESTIMATE.md`.
