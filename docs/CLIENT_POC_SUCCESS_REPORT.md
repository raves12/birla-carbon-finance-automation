# CLIENT_POC_SUCCESS_REPORT.md: Birla Carbon client POC criteria, status (Phase 40)

Status date: 2026-10-05.
- Instance: `pwcmanagementservicesdemo01` (Yokohama).
- Branch: `feature/bcfa-native-ai-completion`.

**Read this first: no Birla Carbon document has been received.**
- Every extraction result is on project-generated SYNTHETIC documents.
- Every SAP step is MOCK SAP.
- Tax rates are POC REFERENCE DATA.

Readiness below means ready to demonstrate the criterion in the POC with those limits, not production readiness.

## 1. Result by criterion

| Criterion | Status | Evidence | Dependency / limit |
|---|---|---|---|
| Native Document Extraction | **READY WITH DEPENDENCY** | Document Intelligence generative pipeline on Now LLM (model `gpt_oss_120b`), 2 BCFA use cases; native by default; no fallback to simulated values; live runs AP and AR (`CLIENT_POC_DEMO_JOURNEYS.md`) | Client samples; production entitlement; data-residency confirmation for Now LLM; no per-field platform confidence (derived instead); bounding-box evidence empty (position evidence **not met**) |
| AP Multi-country OCR | **READY WITH DEPENDENCY** | 11 synthetic AP invoices: India, Germany (incl. German language), Hungary (2 pages, 44 lines), US. Header 97.9 %, line values 100 %, critical fields 98.4-99.2 % over two runs | 0 client samples. Misses: VAT component on the German invoice, printed WHT amount. Run-to-run variation observed |
| GST | **READY** | CGST + SGST halves, IGST, mixed IGST + CGST/SGST, component rate, mismatch → exception (CP-TAX, E2E T1 / T2); live native invoice validated PASS from the decision table | POC REFERENCE DATA (18 %); place-of-supply logic stays with SAP / the client's tax setup |
| VAT | **READY** | VAT 19 % pass, within tolerance, 7 % vs 19 % fails, regime warning (CP-TAX, E2E T4) | Reduced and special rates need their own rule rows; POC reference data |
| Withholding Tax | **READY WITH DEPENDENCY** | Applicability, code and rate from configuration (never from OCR); printed correct → PASS, mismatch → FAIL, printed but not configured → MANUAL REVIEW, expected but not printed → WARNING (CP-TAX, E2E T5 / T6); AR TDS deductions classified from the advice | Client WHT sections and vendor master; the printed WHT amount was not extracted on the synthetic services invoice (rate was, in run 2) |
| Tolerance Framework | **READY** | One engine (MatchingEngine + FinancePolicy); decision table with property fallback; quantity, price, tax (abs / %), total, rounding; rule source, expected, actual, variance and result stored on the match and shown in the Playbook (CP-TOL, E2E Q1 / Q2) | Client-agreed values |
| AR Payment Advice OCR | **READY WITH DEPENDENCY** | 12 synthetic advices: references, UTR, amounts, per-invoice deductions and reasons; live run resolved the customer and both invoices from the advice | 0 client samples; payer alias read as legal name (AR_REMIT_005); header deduction reason varies between runs |
| Open Item Reconciliation | **READY** | Open items read from SAP through IntegrationService before matching (AR-REC-004, closed 2026-10-05). Precedence: remittance references → exact amount (payment currency) → exact combinations (ambiguous never chosen) → suggestion; customer alias; residual classification (ATF Matching Engine — AR, ambiguous combinations, CP-DED; E2E AR-REC-003, Phase 35 AR-A..I) | Open items come from MOCK SAP; real SAP is Mode 2 |
| Deduction Handling | **READY** | Taxonomy: bank charge, TDS / TCS, withholding, credit / debit note, commercial, rounding, FX, short pay; dispute / unapplied / other never deductions; limits per type; AI suggestion never decides (CP-DED, E2E AR-DED-003/006/007, live run) | Mapping to SAP reason codes |
| Playbook | **READY** | Both Playbooks updated, deployed, converted for Yokohama and active (published 2026-10-05); PB-UI-001/002/003, PB-AP-004 pass | Reactivate after every Playbook deploy |
| Standard-vs-Custom Assessment | **READY** | `STANDARD_VS_CUSTOM_ASSESSMENT.md` | — |
| SAP POC Mode | **READY (Mode 1, MOCK SAP)**; Mode 2 **NOT READY** | Idempotent posting / clearing, DRAFT / DIRECT, unknown-outcome reconciliation (ATF, Playbook tests); adapter selected by `x_695068_bcfa.sap.adapter` | Mode 2 needs the RealSAPAdapter implementation, connectivity and an SAP test system (`SAP_POC_MODES.md`) |

## 2. Overall

```
CLIENT POC READINESS: READY WITH DEPENDENCY
```

The POC can demonstrate every criterion on synthetic documents with MOCK SAP. The dependency that matters is **client sample documents**. Until Birla Carbon supplies them, no statement can be made about extraction accuracy on their invoices and advices, their countries or their layouts.

## 3. Measured, not claimed

| Claim | Status |
|---|---|
| "Universal OCR support" | **Not claimed.** Tested: clean machine-generated PDFs in English and German. Not tested: scans, photos, handwriting, non-Latin scripts, real supplier layouts |
| Accuracy | Synthetic only (`OCR_ACCURACY_REPORT.md`): header 231/236 in both runs; line values 346/346; critical 124/125 (run 1), 123/125 (run 2) |
| Countries | Synthetic India, Germany, Hungary, United States. No client country list was provided; none was assumed |
| Straight-through | Decided by the deterministic pipeline (derived confidence, completeness, tax, match), not by AI |

## 4. Principles kept

- OCR extracts facts. Rules decide. AI explains. People approve.
- ServiceNow-native AI only. No Claude, Anthropic, OpenAI or Gemini runtime. The instance-default Azure OpenAI definition is not used by BCFA.
- AI never approves, overrides a tolerance, posts or clears (ATF *AI identity*, *AI guardrails*, PB-AP-003).
- No tax engine and no second matching engine.
- No client document committed to git.

## 5. Open items

| # | Item | Owner |
|---|---|---|
| 1 | Client sample documents (AP and AR, per country) and approval for how they are handled | Birla Carbon |
| 2 | Confirm Now LLM data processing and residency terms for client documents | ServiceNow / client IT |
| 3 | Client tax expectations (GST, VAT reduced rates, WHT sections) and tolerances | Birla Carbon finance and tax |
| 4 | SAP Mode 2: RealSAPAdapter, connectivity, SAP test system (adapter selection and the open-item read are done) | Build team / SAP team |
| 5 | D6 decision-reason ACL and the workspace route ACL (security_admin) | Instance owner |
| 6 | DocIntel keys and skill configs live in global scope: include them in the migration | Build team |
| 7 | Demo data: E2E records and the live demo run N1 remain; N1's approval and deduction confirmation are left for the presenter | Instance owner |
