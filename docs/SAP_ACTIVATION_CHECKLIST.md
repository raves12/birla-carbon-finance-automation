# SAP_ACTIVATION_CHECKLIST.md: moving BCFA from MOCK SAP to a real SAP connection

**Status: real SAP is NOT CONFIGURED.**

- Every SAP call in the POC goes to `MockSAPAdapter` (MOCK SAP). `RealSAPAdapter` is the seam: every method returns `NOT_CONFIGURED` and sends nothing.
- No SAP connection details have been provided (`OPEN_SAP_GAPS.md`).
- Do not connect to SAP without approved connection details and the sign-offs below.

## What does not change when SAP is connected

- Domain services, state models, tables, ACLs and approvals.
- The Integration Transaction log, idempotency and Unknown Outcome Control (`INTEGRATION_CONTRACTS.md`).
- The Playbooks.

Only `RealSAPAdapter` and the Integration Profiles change.

## 1. Decisions and sign-offs (before any build)

| # | Item | Owner | Done |
|---|---|---|---|
| 1.1 | Integration pattern chosen: SAP Integration Suite (CPI) / API Management / direct OData / RFC via MID server | Client SAP architect | ☐ |
| 1.2 | **FB05 clearing interface** confirmed: the proposal contradicts itself (p.19 "no released BAPI", p.21 "BAPI available"). A technical spike must decide | Client SAP team | ☐ |
| 1.3 | **SAP processing mode** agreed per company code: DIRECT (post / clear) or DRAFT (park, e.g. FBV1 / parked document, confirmed in SAP). BCFA supports both (`x_695068_bcfa.ar.sap_processing_mode`) | Finance process owner | ☐ |
| 1.4 | AP invoice posting interface (MIRO / BAPI_INCOMINGINVOICE_CREATE or equivalent) confirmed | Client SAP team | ☐ |
| 1.5 | Status-query interface for Unknown Outcome Control: find a document by the BCFA idempotency key / external reference | Client SAP team | ☐ |
| 1.6 | Draft status interface (DRAFT mode): read whether a parked document was posted, is pending or was deleted | Client SAP team | ☐ |
| 1.7 | ML81N (service entry) interface: absent from the T-code matrix (`OPEN_SAP_GAPS.md`) | Client SAP team | ☐ |
| 1.8 | Master data source of truth: vendors, customers, POs, receipts and open items read live from SAP or replicated | Architect | ☐ |
| 1.9 | Non-production SAP client for testing, with test company codes | Client Basis | ☐ |

## 2. ServiceNow configuration (admin, on the target instance)

| # | Step | Navigation | Done |
|---|---|---|---|
| 2.1 | Create a credential (Basic / OAuth 2.0 / certificate) for the SAP or CPI endpoint. **Never store credentials in source control or this repo** | All → Connections & Credentials → Credentials → New | ☐ |
| 2.2 | Create a Connection & Credential Alias (e.g. `x_695068_bcfa.sap`) and an HTTP(S) connection to the endpoint | All → Connections & Credentials → Connection & Credential Aliases → New | ☐ |
| 2.3 | If on-premise: MID server and its connection | All → MID Server → Servers | ☐ |
| 2.4 | Implement `RealSAPAdapter` methods (`getVendor`, `getCustomer`, `getPurchaseOrder`, `getReceipt`, `getOpenItems`, `postVendorInvoice`, `clearCustomerPayment`, `queryTransactionStatus`) against the alias (sn_ws.RESTMessageV2 or IntegrationHub spoke). Keep the canonical response shapes (`INTEGRATION_CONTRACTS.md`) | source: `src/server/script-includes/RealSAPAdapter.server.js` | ☐ |
| 2.5 | `clearCustomerPayment` honours `payload.processingMode`: `draft` → return `{ status: 'SUCCESS', staged: true, sapDocumentId: <parked doc> }`; `direct` → `{ status: 'SUCCESS', sapDocumentId: <clearing doc> }` | RealSAPAdapter | ☐ |
| 2.6 | `queryTransactionStatus(operation, key, extRef, documentId)`: for a parked document return `POSTED` (with the posted document), `DRAFT_PENDING` or `DRAFT_REJECTED`, as MockSAPAdapter does | RealSAPAdapter | ☐ |
| 2.7 | `IntegrationService.checkAdapterContract('real_sap')` returns no missing operations | Scripts - Background | ☐ |
| 2.8 | Point the integration profile at the real adapter: Integration Profile **Mock SAP - Default** → inactive; new profile adapter `real_sap`, mode **Passthrough (future real connectivity)**, active | BCFA Workspace → Integration Profiles (`x_695068_bcfa_integration_profile`) | ☐ |
| 2.9 | Timeouts and retry policy agreed; an unknown outcome is never blind-retried (already enforced) | IntegrationService | ☐ |

## 3. Tests before go-live (non-production SAP)

| # | Test | Expected | Done |
|---|---|---|---|
| 3.1 | ATF BCFA Regression, all tests | pass (the mock-specific tests keep running on the mock profile in the test instance) | ☐ |
| 3.2 | AP post, happy path | MIRO document returned; invoice POSTED → CLOSED; integration transaction success | ☐ |
| 3.3 | AP timeout (network cut) | UNKNOWN_OUTCOME; reconciliation finds the document; no duplicate posting | ☐ |
| 3.4 | Idempotency: same key twice | one SAP document | ☐ |
| 3.5 | AR DIRECT clearing | FB05 document; open items cleared in SAP and in BCFA | ☐ |
| 3.6 | AR DRAFT clearing | parked document; payment SAP_DRAFT; post the draft in SAP → Check SAP Draft Status → CLEARED; delete the draft in SAP → FAILED with exception | ☐ |
| 3.7 | Authorisation failure (wrong credential) | definite failure, exception, nothing committed | ☐ |
| 3.8 | Playbook stage 7 / 8 shows the real adapter and document (remove MOCK SAP labels: `FinanceJourneyService.MOCK_SAP`, Playbook stage titles via `gen_playbooks.py`) | labels updated | ☐ |

## 4. Remaining production gaps (outside the POC)

- Real master data synchronisation and SAP-side duplicate checks.
- Volume and performance testing.
- Monitoring and alerting on integration failures.
- Production licences: IntegrationHub / spokes, PAD for custom tables.
