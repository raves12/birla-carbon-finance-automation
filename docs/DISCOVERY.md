# DISCOVERY.md — Birla Carbon Finance Automation

Stage 0 output. Everything below was verified against the live PDI (ServiceNow MCP) and the local
toolchain (filesystem/npm) on 2026-09-12. Nothing here is guessed — where a capability could not
be verified, it is marked `Unconfirmed` and treated as unavailable until proven otherwise.

## Instance facts

| Fact | Value |
|---|---|
| Instance | `dev183159.service-now.com` (Personal Developer Instance) |
| Release / build | `glide-australia-02-11-2026__patch3-05-25-2026_06-12-2026_1106.zip` — "Australia" family release |
| Custom scope vendor prefix | `695068` (existing custom scopes: `x_695068_test_ravi`, `x_695068_employee`) |
| Node.js | v24.19.0 (meets SDK's >=20 requirement) |
| npm | 11.17.0 |
| `@servicenow/sdk` (global CLI) | 4.12.1 — `now-sdk` command confirmed on PATH |
| SAP / CPI connectivity | **None.** No SAP ECC RFC Spoke, no CPI/Integration Suite connection exists in this PDI. Confirms mock adapters are not just a POC convenience here — they are the only viable integration path in this environment. |

### Pre-existing local/PDI assets — do not touch

| Asset | What it is | Action |
|---|---|---|
| `C:\Projects\servicenow-apps` | Separate, unrelated project: scope `x_mcp_fluent_demo` ("MCP Fluent Demo"), own git repo, `@servicenow/sdk` 4.10.1 locally pinned. | **Leave untouched.** New app gets its own project directory (`C:\Projects\birla-carbon-finance-automation`, this one) and its own scope. |
| `C:\Projects\servicenow-mcp-server` | The MCP server implementation backing the ServiceNow tools used in this session. | Tooling only, not part of the app. |
| `C:\Projects\TinyGPT` | Unrelated Python project. | Ignore. |
| Update sets: `Test Ravi`, `Employee Onboarding`, `SPM Planning Attributes Core` (all "Default", in progress) | Existing in-progress work from other scoped apps. | Do not add Birla Carbon changes to these; new app will use its own update set. |

## Capability matrix

| Capability | Available? | Reusable? | License/Plugin Dependency | Recommendation |
|---|---|---|---|---|
| Scoped app creation (Studio / App Engine) | Yes | N/A | `App Engine Extras` (active), `App Engine Licensing and Telemetry` (active) | Create new scope `x_695068_bcfa`; proven working already via the sibling MCP Fluent Demo project. |
| Fluent SDK build/deploy (`now-sdk build/deploy`) | Yes | N/A | `@servicenow/sdk` 4.12.1 global; project will pin its own version | Use for tables, fields, ACLs, roles, business rules, script includes, client scripts, scripted REST. |
| Tables / Fields / ACLs / Roles (Fluent) | Yes | N/A | Core Fluent SDK | Build via Fluent — this is the SDK's primary, best-documented surface. |
| Flow Designer (core engine) | Yes (`sys_hub_flow*` tables present) | N/A | Core platform, always on | Available for orchestration. |
| Flow/Subflow/Custom Action authoring via Fluent (`@servicenow/sdk/automation`) | **Yes — confirmed** | N/A | Bundled with `@servicenow/sdk` 4.12.1 (`Flow()`, `Subflow()`, `Action()`, `wfa.trigger()`, `wfa.action()`, `wfa.actionStep()`, `wfa.flowLogic.*`), documented in `node_modules/@servicenow/sdk/docs/api/flow/` | **Correction to an earlier draft of this document**: an initial pass found an unrelated, unpublished `@servicenow/fluent-flow` package referenced only as an internal `devDependency` of `sdk-api` 4.10.1 and wrongly concluded flows must be built by hand in Workflow Studio. Actually inspecting the installed SDK's bundled docs (`sdk/docs/api/flow/*.md`) shows a full, real Flow/Subflow/Action authoring surface. **Flows are Fluent-buildable** — use this instead of manual Studio authoring wherever possible. |
| State machines (`StateModel()`) | **Yes — confirmed** | N/A | Bundled with `@servicenow/sdk` 4.12.1, `sdk/docs/api/statemodel-api.md` | Directly fits the AP/AR lifecycle requirement (Section 7/8 of the brief): named states, gated transitions (encoded-query or scripted conditions), transition history — natively, without hand-rolling a state field + Business Rule guard logic. Use for the AP Invoice and Cash Application state machines instead of a plain Script Include state tracker. |
| IntegrationHub (Designer core) | Yes — `com.glide.ihub.designer.core` active, `sn_integrationhub_designer` v27.0.7 active | N/A | IntegrationHub Designer Core | Available for building custom actions if ever needed; not required for the mock-adapter POC (adapters are pure script). |
| SAP ECC RFC Spoke | **No** — not installed | N/A | Not licensed/installed in this PDI | Confirms: no real SAP path exists here. All SAP calls go through `FinanceAdapter` → `MockSAPAdapter`. |
| Decision Table Builder | Yes — `sn_decision_table_*` tables present | N/A | Core scoped app, present | Available for Stage 13 rule tables; author via Decision Table Builder UI (see ARTIFACT_STRATEGY — no confirmed Fluent builder for its internal condition/action rows). |
| Automated Test Framework (ATF) | Yes — fully active (headless runner, reporting, lists, service catalog, dashboards, performance-testing sub-plugins all active) | N/A | `com.glide.automated_testing_framework` + subsystem plugins | Use MCP `atf_test_*` tools for Stage 11/18 tests. |
| Now Assist Core | Yes — active (v29.3.10) | N/A | `com.now_assist_core` | Base framework present, but see next row — the actual capability the workbook wants is not active. |
| Now Assist in Document Intelligence | **No** — `com.glide.platform_ml_di` ("Platform Document Intelligence") is **inactive** | N/A | Not activated/licensed in this PDI | **Fallback required.** Build a deterministic extraction simulator (Stage 7/Mock Integration territory) that produces structured fields + a confidence score from seeded test documents, explicitly labeled as a stand-in for Document Intelligence. Do not claim real OCR/LLM extraction is running. |
| AI Agents / Agent Orchestrator | **No** — no `ai_agent`-pattern tables found; `AI Agent Resource Access Security and Privacy` plugin inactive | N/A | Not activated/licensed in this PDI | Same fallback pattern: a scripted "AI recommendation" service (fuzzy candidate ranking, exception summaries) that is openly a rule-based/simulated stand-in, stored separately from authoritative values per the non-negotiable AI-advisory-only rule. |
| Accounts Payable Operations (APO) | **No** — no AP/invoice-domain tables found in the instance | N/A | Not installed | This actually matches the project brief directly: build the full AP data model as custom App Engine tables (Stage 3) rather than depending on APO. Treat the workbook's "Recommended if licensed" APO guidance as not applicable to this POC. |
| UI Builder / Configurable Workspace | Yes — `sys_ux_*` tables broadly present (routes, extension points, component endpoints) | N/A | Core platform framework | Available for Stage 9 reviewer workspaces; confirm exact Fluent coverage vs. manual Studio config when Stage 9 starts. |
| RPA Hub | **No** — inactive | N/A | Not installed | Irrelevant to current POC scope (RPA was only a fallback for O2C/LT12/bank-portal cases, which are future/out-of-scope per D-01). Document as an open gap only, no action needed now. |

## Workbook summary (Birla_Carbon_ServiceNow_Process_Feasibility_Blueprint.xlsx)

8 sheets, all read in full or aggregated:

1. **Executive Summary** — recommends APO (where licensed) for AP, a custom App Engine app for Cash Application, thin orchestration for future O2C, IntegrationHub→CPI→ECC for integration, AI as advisory-only, and flags 5 critical technical spikes (FB05, ML81N, PGI, OCR language coverage, plus general SAP interface validation).
2. **Process Inventory** — 60 process steps across:
   - `AP-01`…`AP-11`: current-scope PO/SO invoice processing (intake → extraction → validation → vendor/PO check → GRN/SRN → 3-way match → exception → approval → post → archive)
   - `CA-01`…`CA-17`: current-scope Cash Application (remittance/bank intake → extraction → exact/fuzzy match → allocation → deductions/credit notes → exception → approval → clearing → reconciliation → archive)
   - `AP-UP-01/02`: upstream PR/PO creation — explicitly **not** current scope
   - `O2C-01`…`O2C-10`: future-scope Order-to-Cash
   - `NPO-01`…`NPO-05`: future-scope Non-PO invoice processing
   - `AR-E01`…`AR-E03`, `AP-E01`…`AP-E08`: current-scope **site edge cases** (China promissory notes, freight/toll costing, quantity tolerance, provisional pricing, tax exemption, Hungary FX/VAT/HUF, exchange-rate validation, compliance docs)
3. **ServiceNow Feasibility** — one implementation-approach row per process step; feasibility bands: Strong 23, Conditional 19, Moderate 10, Conditional/Open 4.
4. **Granular Build Tasks** — 421-row delivery backlog. By scope: Current scope 199, Future scope 69, Future-scope-high-level-only 33, Current-scope-site-edge-case 75, Cross-cutting 30, Upstream-not-in-scope 11. By priority: P1 304, P2 102, Low 11. This is an enterprise-implementation-scale backlog, not a POC task list — see Risks below.
5. **T-Code Integration** — 14 SAP transactions with proposal-reported BAPI/API/IDoc availability; the critical contradiction is **FB05** (matrix says BAPI/API available, narrative text says no released BAPI for cash clearing) plus two undocumented interfaces (**ML81N** service-entry, **VL03N**-named PGI).
6. **Architecture Blueprint** — 11-layer target architecture (intake → process/data → document intelligence → rules/decisions → agentic AI → orchestration → HITL UX → SAP integration → audit/control → observability → security). This is the direct source for `ARCHITECTURE.md` in Stage 1.
7. **Dependencies & Assumptions** — 25 dependencies (`D-01`…`D-25`) + 7 assumptions (`A-01`…`A-07`). Critical items: `D-05` (FB05), `D-12` (OCR language coverage), `D-16` (approval/SoD), `D-23` (idempotency). These map directly onto the non-negotiable principles already given for this build.
8. **Product & License Fit** — 11 ServiceNow products mapped to recommendation + fallback; used to build the capability matrix above.

## Confirmed capabilities

- Fluent SDK build/deploy loop (tables, fields, ACLs, roles, business rules, script includes, client scripts, scripted REST)
- Flow Designer engine (UI-authored)
- IntegrationHub Designer
- Decision Table Builder
- Automated Test Framework
- UI Builder / Configurable Workspace framework
- Now Assist Core (base framework only)

## Unavailable capabilities (fallback required)

- Now Assist in Document Intelligence → simulated deterministic extraction service
- AI Agents / Agent Orchestrator → simulated advisory recommendation service
- Accounts Payable Operations → fully custom AP data model (already the plan's direction)
- SAP ECC RFC Spoke / any real SAP or CPI connectivity → mock adapters only (already mandated)
- RPA Hub → not needed for current scope, documented as an open gap only
- Decision Table Builder's internal rows (`sn_decision_table_decision_condition`, etc.) → no confirmed Fluent builder found in the bundled SDK docs; author via the native Decision Table Builder UI (see ARTIFACT_STRATEGY.md)

## Assumptions

- This PDI represents an isolated POC environment with no path to real SAP/CPI; all integration validation in this build is against deterministic mocks, never real SAP.
- The 421-row Granular Build Tasks backlog describes the target production implementation, not the POC — the POC will build a representative, working slice (Stage 5–13 of the execution model) rather than all 421 tasks.
- "AI-assisted" deliverables in this POC (extraction confidence, fuzzy candidate ranking) are simulated/rule-based, not real Now Assist/AI Agent output, and will be labeled as such everywhere they appear in the UI and docs.
- Vendor scope prefix `695068` will be used for the new app: proposed scope `x_695068_bcfa`, confirmed unused.

## Risks

- **Scope containment**: the source workbook is an enterprise delivery blueprint; without explicit boundaries the build could sprawl toward all 421 backlog tasks instead of a working POC. Mitigation: Stage 1 architecture and every subsequent stage will explicitly cite which Process IDs (`AP-01..11`, `CA-01..17`) are in scope for this build, and treat O2C/Non-PO/site-edge-cases as documented-but-not-built future scope, consistent with `D-01`.
- **FB05/ML81N/PGI ambiguity**: cannot be resolved with certainty from the workbook alone (that's the point of `D-05/D-06/D-07`). For this mock-only POC this is low-impact (we define our own canonical contract either way) but must be carried into `OPEN_SAP_GAPS.md` verbatim so a future real-SAP integration doesn't silently assume the wrong pattern.
- **AI capability gap**: because Document Intelligence and AI Agents are not active in this PDI, there's a risk of the build quietly presenting simulated output as if it were real AI. Mitigation: every simulated AI output will carry an explicit "Simulated/Advisory" marker in both data model (a `source` field) and UI.

## Blockers

None for proceeding to Stage 1. All required foundational capabilities (Fluent SDK, Flow Designer, Decision Tables, ATF, UI Builder) are present; the unavailable ones (Document Intelligence, AI Agents, APO, SAP connectivity) all have designed fallbacks that are consistent with the project's own non-negotiable principles (mock adapters, AI advisory-only, no APO dependency).
