# PRODUCTION_IMPLEMENTATION_ESTIMATE.md: from POC to production (Phase 40)

**Indicative estimate**, written 2026-10-05 from the POC build. It is not a quotation. It assumes:
- one ServiceNow instance stack (dev / test / prod) with Now Assist, Document Intelligence and AI Agents entitlements;
- SAP ECC reachable through IntegrationHub or the client's middleware;
- a client team that provides samples, decisions and testers on time.

Ranges are person-weeks (pw) of delivery effort. Client and SAP-team effort are listed separately.

## 1. Starting point

Reusable from the POC:
- data model;
- matching engine, tolerance and tax comparison;
- deduction decision service;
- approvals and SoD;
- exceptions, audit and lifecycle;
- Playbooks and workspace;
- native extraction use cases;
- the AI skills and agents (advisory);
- 39 ATF tests;
- deploy generators.

Not production-ready:
- real SAP integration;
- client document layouts (none measured);
- production tax and tolerance values;
- identity and role model;
- volume, monitoring and operations;
- the open security items (D6, workspace route ACL).

## 2. Workstreams

| # | Workstream | Scope | Effort (pw) | Depends on |
|---|---|---|---|---|
| 1 | Client document assessment | Collect 50-200 representative AP invoices and AR advices per country; ground truth; measure native extraction per country and layout; tune field descriptions; decide straight-through thresholds | 3-6 | Samples, data-handling approval, Now LLM data-residency confirmation |
| 2 | Extraction hardening | Per-country field sets, scanned / image handling, multi-page limits (25 pages, 4 MB per attachment), duplicate handling, review UI for low confidence, page / position evidence if the platform supplies it | 3-5 | 1 |
| 3 | Tax configuration | Replace POC rows with client-approved expectations: GST place-of-supply (CGST/SGST vs IGST), reduced VAT rates, reverse charge, TDS / withholding sections and thresholds per vendor; ideally from SAP tax codes and vendor withholding master | 2-4 | Client tax team, SAP master data |
| 4 | Tolerances and deductions | Client-agreed values per company / country / vendor type; deduction reason-code mapping to SAP reason codes | 1-2 | Finance controllers |
| 5 | SAP integration (Mode 2) | RealSAPAdapter for 8 canonical operations (adapter selection and the open-item read through IntegrationService exist since 2026-10-05); posting, parking, clearing, status query; error and unknown-outcome mapping; open-item cache refresh rules (block or continue on a failed read) | 8-13 | SAP team, middleware, test system (`SAP_POC_MODES.md`) |
| 6 | Bank statement intake | Replace MockBankAdapter: MT940 / CAMT.053 / bank API | 3-5 | Banks, treasury |
| 7 | Security and identity | Role model with HR / AD groups; fix D6 and the route ACL; SoD review; data classification of documents; AI governance sign-off | 2-3 | Security admin, audit |
| 8 | Testing | System and integration testing, UAT support, volume test, regression automation on the client instance | 4-6 | 1-7 |
| 9 | Operations | Monitoring (extraction failures, unknown outcomes, SLA), runbooks, hypercare | 2-3 | 8 |
| 10 | Project management and change | Plan, governance, training, cut-over | 15-20 % of the above | — |

**Total delivery effort: about 28-47 pw plus 15-20 % management**, about 32-56 pw. At a team of 4-5, that is roughly 3-5 months, for AP and AR in the first countries.

## 3. Biggest uncertainties

1. **Real document quality.** No client sample has been measured. Scans, photos and unusual layouts can change workstreams 1-2 by a factor of 2.
2. **SAP interface availability.** Existing BAPIs / IDocs / OData services versus new ABAP work (an SAP-team cost not included above).
3. **Tax scope.** GST place-of-supply logic and withholding sections can grow into tax-engine work. That belongs in SAP or a tax engine, not in BCFA.
4. **Licensing.** Document Intelligence, Now Assist and AI Agents consumption at production volumes (commercial, not estimated here).
5. **Model behaviour.** Generative extraction varies between runs (`OCR_ACCURACY_REPORT.md` §4). Controls and review effort must be sized from measured client data.

## 4. Client and SAP-team effort (not included above)

| Item | Indicative |
|---|---|
| Sample collection and ground truth support | 1-2 pw finance |
| Tax and tolerance decisions | 1-2 pw tax / controllers |
| SAP interfaces, authorisations, test data | 6-12 pw SAP team (depends on existing services) |
| UAT | 2-4 pw finance users |
