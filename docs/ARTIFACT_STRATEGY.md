# ARTIFACT_STRATEGY.md — Birla Carbon Finance Automation

Maps every artifact type this build will need to the tool that will actually create it, based on
verified capability (see `DISCOVERY.md`) rather than assumption. "Fluent SDK" means authored as
TypeScript source in `src/` and deployed via `now-sdk build/deploy`. "Other" means created through
a ServiceNow MCP tool directly, or documented as a manual step for a human to perform in Studio/
Workflow Studio.

| Artifact | Fluent SDK | Flow Designer | UI Builder / Studio | Other | Decision |
|---|---|---|---|---|---|
| Tables & fields (AP, AR, shared domain model) | ✅ Primary | — | — | — | **Fluent.** Core, well-documented capability; this is what the SDK is for. |
| ACLs | ✅ Primary | — | — | — | **Fluent.** Author alongside each table. |
| Roles | ✅ Primary | — | — | — | **Fluent.** |
| Business Rules (simple field validation/defaulting) | ✅ Primary | — | — | — | **Fluent**, kept thin — call into Script Includes for anything non-trivial. |
| Script Includes (AP/AR/matching/integration/mock-adapter logic, calculations) | ✅ Primary | — | — | — | **Fluent.** This is where deterministic business logic lives — testable, no visual-canvas dependency. |
| AP Invoice / Cash Application lifecycle state machines | ✅ Primary — `StateModel()` | — | — | — | **Fluent.** `StateModel()` (`sdk/docs/api/statemodel-api.md`) natively models named states, initial state, sequence, and gated transitions (encoded-query or scripted conditions) against a state field on a table — a direct fit for Section 7/8's `RECEIVED → ... → CLOSED/FAILED/UNKNOWN_OUTCOME` machines. Scripted transition conditions call into Script Includes for tolerance/eligibility checks. |
| Client Scripts / UI Policies (reviewer form behavior) | ✅ Primary | — | — | — | **Fluent**, used sparingly. |
| Scripted REST APIs / REST Messages | ✅ Primary | — | — | — | **Fluent.** Used for the mock adapters' external-facing shape and any ATF/demo hooks. |
| Decision Tables (tolerances, matching hierarchy, approval thresholds) | ❌ No confirmed Fluent builder | — | — | ✅ Decision Table Builder (native app, present in instance) | **Native UI**, or direct record creation against `sn_decision_table_*` tables via MCP `record_create` — only after `metadata_inspect` confirms the exact schema at Stage 13. Do not guess the row structure. |
| Flows / Subflows (state transitions, approvals, retries, SAP-call orchestration) | ✅ Primary — `Flow()` / `Subflow()` / `Action()` (`@servicenow/sdk/automation`) | (produces real Flow Designer records) | — | — | **Fluent.** Confirmed via the bundled SDK docs (`sdk/docs/api/flow/*.md`): `Flow()` + `wfa.trigger()` define triggers (record created/updated, scheduled, inbound email, etc.); `Subflow()` defines reusable typed-input/output units invoked via `wfa.subflow()`; `Action()` defines custom reusable actions built from `wfa.actionStep()` sequences (including `actionStep.script` for arbitrary server logic). This build authors the AP/AR subflows (Intake, Validate, Match, Post/Clear, Execute Integration, Reconcile Unknown Outcome) as real `Subflow()` definitions, not a manual Studio task. The flows still call into Script Includes for pure calculation logic (matching, tolerance checks) via `actionStep.script`; the flows own the orchestration/branching, Script Includes own the deterministic math. |
| AI Agents (fuzzy candidate ranking, exception summaries) | N/A — not installed | — | — | ✅ Simulated Script Include | **Simulated in Script Includes**, per DISCOVERY.md fallback. Output stored in a distinct "AI recommendation" field/table, never in an authoritative field. |
| Document extraction (Now Assist in Document Intelligence) | N/A — not installed | — | — | ✅ Simulated Script Include | **Simulated in Script Includes**: seeded test documents map to deterministic extracted-field + confidence output. Clearly labeled as a Document-Intelligence stand-in. |
| Mock adapters (SAP, Bank, Archive) | ✅ Primary | — | — | — | **Fluent / pure Script Includes.** No visual tooling involved — this is exactly the kind of deterministic, testable logic Fluent is good at. |
| Integration Profiles, canonical payload contracts | ✅ Primary | — | — | — | **Fluent** tables + Script Include validation. |
| AP/AR reviewer workspaces, Exception Queue, Finance Ops Dashboard | Partial (Fluent can define some UX-config artifacts; exact coverage unconfirmed) | — | ✅ Configurable Workspace / UI Builder (framework confirmed present) | — | **UI Builder/Studio**, built manually against the Fluent-defined tables. If Stage 9 confirms Fluent can define the workspace/list/form config, prefer that instead — will verify before assuming either way. |
| ATF Tests | — | — | — | ✅ MCP `atf_test_*` tools | **Native ATF** via MCP tools, not Fluent-authored. |
| Update Set / packaging | — | — | — | ✅ MCP `update_set_*` tools | Scoped-app changes track automatically; update sets used only if/when moving work between instances. |

## Artifacts explicitly NOT forced into Fluent

- **Decision Tables** — no confirmed Fluent builder for `sn_decision_table_decision_condition` et al. exists in the bundled SDK docs (only `DataLookup`, a simpler field-copy-on-match mechanism, was found — not equivalent to Decision Table Builder's rule/action grid). Built via the native Decision Table Builder UI, or via direct, schema-verified record creation if the UI path proves impractical for repeatable POC seeding.
- **AI Agents / Document Intelligence configuration** — these aren't Fluent-buildable *or* available at all in this PDI; simulated entirely in application script instead of attempting any real configuration.

## Refinement: Flow Designer vs. Business Rules for orchestration (Stage 15)

Flows/Subflows/Actions remain genuinely Fluent-buildable (confirmed above). While implementing
Stage 15, a further gap surfaced: the bundled SDK docs document `actionStep.script`'s *shape*
(`required_run_time`, `inputVariables`, `outputVariables`) but never show the actual JavaScript
convention for reading an input variable or assigning an output variable from inside the script
body — every worked example stops at the step's config object. Guessing that convention for a
financial-control application (where getting it wrong means a flow silently does the wrong thing
at runtime, or nothing) would violate the same "never invent/guess an API" principle that governs
everything else in this build.

Business Rules do not have this gap: `BusinessRule({ script: someFunction })` passing
`(current, previous)` GlideRecord objects directly to a plain TypeScript function is documented,
and already proven working in this exact project (the SDK's own scaffold template uses it).

Resolution, not a reversal: **the AP/AR state-machine orchestration (intake → extraction →
validation → matching → approval → posting → reconciliation) is wired via Business Rules calling
the already-built `ApDomainService`/`ArDomainService` Script Includes**, because that data-passing
contract is fully verified. **Flow Designer is still used, for the two things this build needs
that fit its fully-documented `action.core.*` built-ins without any custom script data-passing**:
scheduled exception-aging escalation sweeps (`trigger.scheduled.daily` + `action.core.lookUpRecords`
+ `action.core.sendNotification`/`updateRecord`) for both AP and AR. This keeps every deployed
artifact backed by a documented, verified mechanism rather than an assumption.

## Phase 25: Flow Designer owns the hand-offs

Phase 25 moves the AP/AR hand-offs into Flow Designer (15 flows, `docs/AUTOMATED_FLOWS.md`)
without breaking the rule above. The script-step data convention is still undocumented, so no
flow contains a custom script step. Each flow uses only documented core actions: a record or
scheduled trigger, `action.core.fireEvent`, `action.core.log`, `lookUpRecords` and `forEach`.
The event it fires (`x_695068_bcfa.flow.stage`, parm1 = stage) reaches the domain services
through a Script Action, whose contract (`event.parm1`, `current`) is documented in the SDK. The
steps themselves stay in `ApDomainService` / `ArDomainService`, now called stage by stage through
`FinanceOrchestration`. The approval cascade business rules still exist, but only act in inline
mode (demo seeding and tests).

## Correction log

An earlier pass of this document concluded Flow Designer flows could not be Fluent-authored, based on a stray, unpublished `@servicenow/fluent-flow` reference found only as an internal `devDependency` listing. That conclusion was wrong and has been corrected above after actually reading the bundled SDK documentation (`node_modules/@servicenow/sdk/docs/api/flow/*.md` and `statemodel-api.md`), which describes a real, complete `Flow()`/`Subflow()`/`Action()`/`StateModel()` surface. Recorded here per the project's own principle of documenting uncertainty and corrections rather than silently overwriting them.
