# STANDARD_VS_CUSTOM_ASSESSMENT.md: what BCFA uses from the platform and what it builds (Phase 40)

Assessment date 2026-10-05. App `x_695068_bcfa`, Yokohama. Counts are taken from the repository.

Classification:
- **Standard (configured)**: a ServiceNow product feature, used through its own designer or API with BCFA data only.
- **Standard + script**: a platform feature driven by BCFA script (for example a Decision Table read through `sn_dt`).
- **Custom**: BCFA code or data model. Owned and maintained by the project.

## 1. Capability by capability

| Capability | Classification | ServiceNow feature | Custom part | Why custom |
|---|---|---|---|---|
| Document extraction (OCR / field reading) | **Standard (configured)** | Document Intelligence v8 generative pipeline, skill "Document Key Value Extraction (NowLLM)", Now LLM Service | Two use cases (25 + 12 fields, defined as data); `DocumentExtractionService` + `NativeDocumentIntelligenceProvider` call `DocIntelAPI` and map the JSON result to the BCFA contract | The mapping, derived confidence and arithmetic checks are BCFA rules; the reading itself is the platform's |
| Simulated extraction | Custom (test only) | none | `SimulatedDocumentExtraction`, labelled SIMULATED DOCUMENT EXTRACTION — POC | Test fixtures without OCR; selectable by property, never a fallback |
| Intake, attachments, duplicate hash | Standard + script | Attachments, scheduled job (native extraction poller) | `FinanceDocumentIntakeService` | Finance-specific routing (AP / AR / payment advice) |
| GST / VAT / withholding expectation | **Standard (configured)** | Decision Table *BCFA AP Tax Expectation* | Rows are POC reference data | Not a tax engine: expectations only. Production rates must come from the client's tax configuration or SAP |
| Tax comparison | Custom | — | `MatchingEngine.evaluateTax` (pure function) | Compares printed tax with the configured expectation; no platform equivalent |
| Tolerances | **Standard (configured)** | Decision Table *BCFA AP Tolerance*, system properties as fallback | `FinancePolicy.apTolerances` reads them | One engine (MatchingEngine) applies them and stores rule, expected, actual and result |
| AP 3-way match | Custom | — | `MatchingEngine.threeWayMatch`, `ApLineResolutionService` | ServiceNow has no PO / GRN / invoice match for an external ERP. SAP's own invoice verification remains the system of record |
| AR matching and allocation | Custom | — | `MatchingEngine` (reference, amount, exact combinations, alias, residual classification) | No platform cash-application engine |
| Deduction taxonomy and limits | **Standard (configured)** | Decision Table *BCFA AR Deduction*, properties | `ArExceptionDecisionService` enforces them | Human decides; rules cap |
| Approvals and SoD | Standard + script | Decision Table *BCFA AP Approval*, groups, roles | `ApprovalEngine` (SoD checks) | Finance maker/checker rules |
| Exceptions, SLA, aging | Standard + script | Tables, flows (aging escalation), SLA fields | `ExceptionEngine` | — |
| Lifecycle | Standard + script | State models, business rules | `FinanceLifecycle` | — |
| Audit | Custom on platform tables | Table, ACLs (append-only) | `AuditEngine` | Finance evidence trail, separate from sys_audit |
| Generative AI (explain, summarise, draft) | **Standard (configured)** | Now Assist skills (9), AI Agent Studio (7 agents, 2 agentic workflows), Now LLM | `NowAssistSkillClient`, `FinanceAiGuard` (guardrails), AI interaction log | Advisory only: AI never approves, overrides tolerance, posts or clears |
| Journey view | **Standard (configured)** | Playbooks (Process Automation Designer): AP 8 stages, AR 9 stages, Wait For Condition + Record List only | `FinanceJourneyService` computes the stage and the "blocked because" text | A view; no Playbook activity changes data |
| Workspace | Standard (configured) | Configurable workspace (UI Builder) | Pages and lists | — |
| SAP integration | Custom (adapter pattern) | — (IntegrationHub spokes not used in the POC) | `IntegrationService`, `MockSAPAdapter`, `RealSAPAdapter` (not configured) | Idempotency, unknown-outcome reconciliation. Production would use IntegrationHub / the client's middleware |
| Bank statement | Custom (mock) | — | `MockBankAdapter` | No bank connection in the POC |
| Tests | Standard | ATF (suite *BCFA Regression*, 39 tests) | Server-side test scripts | — |

## 2. Size of the custom part

| Item | Count |
|---|---|
| Server script includes | 32 (about 10,400 lines; `src/server/script-includes`) |
| Custom tables | 31 |
| Decision tables | 4 (AP Approval, AP Tolerance, AP Tax Expectation, AR Deduction) |
| Playbooks | 2 |
| Document Intelligence use cases | 2 (data, not code) |
| ATF tests in the regression suite | 39 |

## 3. What is deliberately NOT custom

- **No custom OCR, no external AI.** Extraction is Document Intelligence on Now LLM. Claude, Anthropic, OpenAI and Gemini are not runtime providers. The instance-default Azure OpenAI definition is not used by BCFA.
- **No tax engine.** The decision table holds expectations; production tax determination stays in SAP or the client's tax engine.
- **No second matching engine.** Tolerances, tax and deductions all go through `MatchingEngine` and `FinancePolicy`.
- **No posting logic.** SAP posts and clears; BCFA orchestrates and records.

## 4. Upgrade and ownership risk

| Item | Risk | Note |
|---|---|---|
| Document Intelligence generative pipeline | Medium | Field descriptions act as prompts; a platform model change can change results. Re-run the measurement (`OCR_ACCURACY_REPORT.md` §6) after every upgrade |
| DocIntel field keys and skill configs in global scope | Low / medium | Created by script (`gen_native_extraction.py`), outside the Studio app commit. Must be moved with the app explicitly |
| Fluent Playbooks on Yokohama | Medium | Need the start-rule conversion (`gen_playbook_yokohama_fix.py`) and reactivation after each deploy |
| Custom engines (Matching, Policy, Approval) | Owned code | Covered by ATF; must be maintained by the client team or partner |
| Licensing | **Open** | Document Intelligence, Now Assist and AI Agents ran on this demo instance. Production entitlement is a client / ServiceNow commercial question, not verified here |
