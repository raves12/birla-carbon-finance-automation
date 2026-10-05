# AI_GOVERNANCE.md — Birla Carbon Finance Automation

Phase 23. The script `scripts/deploy/phase23_aict_bg.js` was run and verified live on 2026-09-28. The script is idempotent: a
second run changed nothing and found request AR0000002 already open.

The BCFA AI is governed in **ServiceNow AI Control Tower**. It is installed and active on this instance:

- AI Control Tower Core (`sn_ai_governance` 5.0.6)
- AI Control Tower for Now Assist
- AI Discovery
- AI Security and Privacy
- the Value, Health and Engagement dashboards

No premium governance capability was missing, so there is no license gap for governance itself. The one license gap is
the Content Understanding use case (below).

## Inventory

AI Discovery and the Now Assist connector inventoried the BCFA AI automatically as AI digital assets
(`alm_ai_digital_asset`). Phase 23 completed the record.

| Asset | Type | Status | Subcomponents |
|---|---|---|---|
| **BCFA Finance Automation AI** (the solution, Phase 23) | AI system | Deployed | 2 agentic workflows, 9 Now Assist skills, the planned Content Understanding use case (12) |
| BCFA AP Invoice Review, BCFA Cash Application Review | AI system (agentic workflow) | Deployed | Their agents (3 and 4) |
| 7 BCFA AI agents | AI system (agent) | Deployed | Their tools (discovered) plus the Now Assist skill the tools call (Phase 23 link). The Customer Resolution Agent calls no skill |
| 9 BCFA Now Assist skills (`bcfaApInvoiceSummary` … `bcfaCustomerClarificationDraft`) | AI system (skill) | Deployed (was Development; they are published and in use) | — |
| 16 prompt assets (agent instructions and roles) | AI prompt | Deployed | — |
| **BCFA Document Extraction (Content Understanding, planned)** | AI system | Development | — |

Workflow → agent → tool links come from AI Discovery. The agent → skill links were added in Phase 23, because the
tools call the skills from script, which discovery cannot see.

**Content Understanding.** Superseded in Phase 40 (2026-10-05). The Document Intelligence generative pipeline works
on this instance. BCFA extraction runs natively by default through two use cases pinned to Now LLM:
- *BCFA AP Invoice Extraction (Now LLM)*;
- *BCFA AR Payment Advice Extraction (Now LLM)*.

The provider is selected by `x_695068_bcfa.document.extraction.provider`. The simulated provider remains for test fixtures
only and is labelled SIMULATED DOCUMENT EXTRACTION — POC. Extraction output feeds the same validation, matching and human
review. See `OCR_ACCURACY_REPORT.md`. Production entitlement for Document Intelligence is a commercial question that has
not been verified here.

## Ownership

| Role | Who | Where |
|---|---|---|
| Business owner | **Ravi Kumar Kumar** (`ravi.n.kumar@pwc.com`), named 2026-09-29; replaced the stand-in *BCFA Demo Finance Controller* | `owned_by` on all 36 BCFA AI assets in `alm_ai_digital_asset` (solution, workflows, agents, skills, prompts) |
| Technical owner / steward contact | The solution builder | `managed_by` |
| AI steward (AI Control Tower role `sn_ai_governance.ai_steward`) | **Ravi Kumar Kumar** (named 2026-09-29). The role grant is pending: an admin adds the role to the user (not done by Claude, since it is a security change) | Needed to act on the approval request |

## Risk and approval

- Every BCFA asset has AI Control Tower governance details: lifecycle phase *New*, risk *To be determined*.
- Risk was **not** set directly. Setting it directly would bypass AI Control Tower's approval workflow. Instead, **AI asset
  approval request AR0000002** was raised for the solution: *Approve BCFA Finance Automation AI for deployment
  (proposed risk: Medium)*. Its state is Open, with approval Requested. It carries the rationale and the evidence
  documents:
  - **Rationale.** It is a finance process, but the AI is advisory only. Approvals, postings and clearing are
    deterministic and human-approved with segregation of duties. AI identities hold only `x_695068_bcfa.ai_agent`.
    Guardian and FinanceAiGuard run on every skill call. Every AI run is in the AI Interaction Log, and every business
    event is in the append-only Audit Event trail.
  - **Evidence.** `AI_SECURITY_AND_GUARDRAILS.md`, `AI_EXECUTION_LOG.md`, `AUDIT_FRAMEWORK.md`, `APPROVALS_SOD.md`.
- **Next step (Birla Carbon / instance admin).** Name an AI steward (grant `sn_ai_governance.ai_steward`). The steward
  reviews AR0000002, sets the risk classification and moves the lifecycle to *Deploy*.

## Monitoring, usage and activity

| Need | Where |
|---|---|
| AI inventory, ownership, lifecycle, risk, approvals | AI Control Tower workspace (asset inventory and governance details) |
| Usage and licensable counts | AI Control Tower inventory usage (`sn_ai_governance_ai_inventory_usage`): daily snapshots of AI systems, models and AI CIs |
| Value, health and engagement | AI Control Tower Value, Health and Engagement dashboards |
| Per-run activity for BCFA: which skill, agent or workflow ran, on which record, result, confidence, duration, initiating user, human accepted or overridden | BCFA AI Interaction Log (`docs/AI_EXECUTION_LOG.md`) |
| Guardrail actions | AI Interaction Log `guardrail_action` / `guardrail_reason`; Guardian verdicts in the system log (`docs/AI_SECURITY_AND_GUARDRAILS.md`) |
| Agent execution detail | AI Agent execution plans and tasks (`sn_aia_execution_plan` / `sn_aia_execution_task`) |
