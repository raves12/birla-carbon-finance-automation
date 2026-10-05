# CLIENT_POC_CONFIGURATION_AND_SECURITY.md: configuration and security for the client POC criteria (Phase 40)

All values are **POC ASSUMPTIONS or POC REFERENCE DATA** until Birla Carbon finance and tax confirm them. None is read from SAP.

## 1. Extraction

| Setting | Value | Where | Meaning |
|---|---|---|---|
| `x_695068_bcfa.document.extraction.provider` | `native` | System property | `native`: Document Intelligence on Now LLM. `simulated`: fixture values, labelled SIMULATED DOCUMENT EXTRACTION — POC (tests only). There is no fallback between providers: a failed native extraction goes to manual review |
| `x_695068_bcfa.ap.extraction.confidence_threshold` | 0.85 | System property | Below it, AP invoices and AR advices go to human review. The native confidence is derived, not returned by the platform (`OCR_ACCURACY_REPORT.md` §5) |
| AP use case | BCFA AP Invoice Extraction (Now LLM), 25 fields | `sys_di_task_definition` 4f1b9b4a…, keys `sys_di_key` | Source: `scripts/deploy/native_extraction_config.json`. Apply with `gen_native_extraction.py` → `phase40_native_usecases_bg.js` (scope global) |
| AR use case | BCFA AR Payment Advice Extraction (Now LLM), 12 fields | `sys_di_task_definition` 394844f2… | Same |
| Skill configs | provider `use_now_llm: true`, response type `document_extraction` | `di_skill_config` (global scope) | Per use case; the instance-wide default provider is unchanged |
| Poller | BCFA - Native Extraction Poller, every 1 minute | Scheduled job | Resumes intakes waiting for an asynchronous DocIntel result; times out after 10 minutes to manual review |

## 2. Tax and withholding (AP)

| Setting | Value | Where |
|---|---|---|
| Decision table *BCFA AP Tax Expectation* | India services: GST 18 %, WHT 2 %, code IN-TDS-SERVICES (POC); India: GST 18 %; Germany: VAT 19 %; Hungary: VAT 27 %; United States: no sales tax; any other: UNKNOWN → manual review | Decision Tables (inputs: country, company, vendor tax category) |
| `x_695068_bcfa.ap.tax.reference` | JSON fallback per country (same rates) | System property, used only when the table has no row |
| Vendor tax category | goods / services | `x_695068_bcfa_vendor.tax_category` |

Rules applied by `MatchingEngine.evaluateTax`:
- The expected regime, rate and withholding come from configuration, never from the document.
- Results: PASS (variance ≤ rounding), WITHIN TOLERANCE (≤ tax band), WARNING (for example a GST label on a VAT invoice, or withholding expected but not printed), FAIL, MANUAL REVIEW (no configured expectation).
- GST: CGST and SGST must be equal halves; IGST must not appear together with CGST / SGST; a CGST + SGST invoice may print the component rate (9 % of 18 %).
- Reduced or special rates (for example German 7 %) need their own decision-table row; without it they fail against the standard rate. This is intended: the system does not guess the rate.

## 3. Tolerances (AP)

| Tolerance | Default | Property fallback |
|---|---|---|
| Quantity | 2 % | `ap.tolerance.quantity_pct` |
| Unit price | 2 % | `ap.tolerance.price_pct` |
| Tax | max(1.00, 2 % of expected tax) | `ap.tolerance.tax_absolute`, `tax_relative_pct` |
| Header net vs line total | 1.00 | `ap.tolerance.total_absolute` |
| Rounding (tax PASS band) | 0.05 | `ap.tolerance.rounding_absolute` |

Source of truth: decision table *BCFA AP Tolerance* (company, country, vendor type, invoice type). The match stores the rule source, every tolerance used, expected tax, tax result and a per-check detail (rule, expected, actual, variance, result).

## 4. AR deductions

| Setting | Value |
|---|---|
| Decision table *BCFA AR Deduction* | Bank charge, rounding, TDS / TCS, withholding, credit note up to 5,000: allowed without a finance approver. Those above 5,000, and any short pay, debit note, commercial deduction or FX difference: finance approver. Dispute, unapplied cash, other: **not a deduction** (stays open) |
| `ar.bank_charge.max_amount` | 1,000 (larger bank charge refused) |
| `ar.rounding.max_amount` | 1 (larger rounding refused) |
| `ar.withholding.max_pct` | 0.1 (withholding above 10 % of the covered invoices refused) |
| `ar.deduction.approval_threshold` | 5,000 |
| `ar.deduction.allowed_types` | Fallback list when the decision table cannot be read |

A person classifies every deduction. The deduction record keeps the reason and amount printed on the advice, the AI recommendation if any, and `category_source = human_confirmed`.

## 5. Security

| Control | State |
|---|---|
| AI role | ServiceNow-native AI only (Now Assist skills, AI agents, Document Intelligence on Now LLM). AI may recommend, explain and summarise. It never approves, overrides a tolerance, posts or clears. The AI identity holds no approver role (ATF *AI identity*) |
| External AI | None at runtime: no Claude, Anthropic, OpenAI or Gemini provider. The instance-default Azure OpenAI definition is not used by BCFA use cases |
| Segregation of duties | Requester and processor cannot approve; approver must be in the routed group (ATF *Segregation of Duties*; E2E) |
| Extraction output | Facts only: the printed tax breakdown is stored as read and validated separately |
| Data sent for extraction | The document content is processed by the ServiceNow-hosted Now LLM Service. Data residency and processing terms for client documents must be confirmed with ServiceNow before real samples are loaded |
| Client documents | Not committed to git. None received |
| Credentials | None stored by BCFA. No SAP connection exists |
| Audit | Append-only audit events for extraction (provider recorded), exceptions, decisions, approvals and integration calls. The tax validation result and its checks are stored on the invoice and in the exception evidence (no separate audit event) |

Open security items (need the instance owner or security_admin; the assistant does not grant roles or change ACLs):

| # | Item | State |
|---|---|---|
| D6 | Finance approver cannot type the decision reason on an AP exception (field write ACL). Workaround: the processor enters the reason, the approver approves | Open, POC workaround |
| 6 | Workspace route ACL and audience omit ap_approver, ar_approver and integration_operator | Deferred by the instance owner |
| — | DocIntel keys and skill configs live in global scope, outside the app commit | Document for migration |
