# AI_EXECUTION_LOG.md — Birla Carbon Finance Automation

Phase 20. Verified live on 2026-09-28 (`scripts/deploy/phase20_verify_bg.js`, plus a query of the agentic workflow run).

Every AI execution in BCFA writes one row to the **AI Interaction Log** (`x_695068_bcfa_ai_interaction`), whichever
provider ran it. The writer is `AiInteractionLog` (`src/server/script-includes/AiInteractionLog.server.js`).

- **Now Assist.** Skills and agentic workflows. This is the production path.
- **Simulated.** The deterministic extraction and templates. Document Intelligence is not licensed on this instance.
- **Claude (legacy).** Written by `BCClaudeClient` until Phase 34.

The existing table was reused. The Claude-named columns keep their names but now carry any provider's data, under the labels
*Model*, *Provider Request ID* and *Duration (ms)*.

## What each row captures

| Requirement | Field(s) |
|---|---|
| Record, process | `source_table`, `source_record`, `process` (AP, AR, Document Intake, Platform) |
| AI capability | `capability`: document classification or extraction, summarization, exception or match or residual explanation, next-action recommendation, exception review (agentic workflow), cash-match recommendation, candidate ranking, communication draft, connectivity test |
| Skill | `skill`: the published Now Assist skill key (e.g. `ap_recommended_next_action`), `AISimulationService` / `SimulatedDocumentExtraction`, or the skills behind *Explain with Now Assist* |
| Agent | `agent`: the AI agent whose tool made the call (e.g. *BCFA AP Resolution Recommendation Agent*). Empty when a person ran the skill |
| Agentic workflow | `agentic_workflow`: *BCFA AP Invoice Review* or *BCFA Cash Application Review* |
| Input context identifier | `input_context_id` (`sha256:` of the context sent to the model) and `input_context_size`. **The prompt and the context are never stored** |
| Result | `result_summary` (first 1,000 characters) and `recommendation` (the recommendation section, compared with the human decision). The full note stays on the record it was saved to |
| Confidence | `confidence`: 0–1. The High / Medium / Low label of an advisory note maps to 0.9 / 0.6 / 0.3 |
| Status | `status`: started, success, failed (plus the legacy Claude statuses) |
| Duration, timestamp | `latency_ms` (*Duration*), `started_at`, `completed_at` |
| Initiating user | `initiated_by`: the person, or the AI user when an agent made the call |
| Human accepted / overridden | `human_accepted`, `human_overridden`, `override_reason`, `human_decision`, `human_decided_by`, `human_decided_at` |
| Correlation ID | `correlation_id`: the transaction's. Intake rows join it when the intake creates the transaction |

## When rows are written

| Event | Row |
|---|---|
| A Now Assist skill runs (`FinanceAgentTools._runSkill`, for agents and for people) | One row: skill, capability, hashed context, result, duration, status. Agent and workflow are filled when the AI user ran it |
| An exception hands off to its agentic workflow | A **started** row for the workflow |
| The workflow saves its note (`recordExceptionAdvice` as the AI user) | That row completes: agent, result, recommendation, confidence, and the duration of the whole run |
| A person saves a note with *Explain with Now Assist* | Its own exception-review row |
| Simulated extraction and recommendations; intake extraction | Rows with provider *Simulated* |
| A legacy Claude call | Its row, with provider *Claude (legacy)* |

## Human outcome

- **Exception decision** (`Ap/ArExceptionDecisionService`): each recommendation on the exception (exception review,
  next action, cash match, ranking) is **accepted** when it agrees with the decision and **overridden** otherwise,
  with the person's reason. Agreement is a keyword check between the decision and the recommendation text:
  - AP: request correction ↔ "correct"; hold ↔ "hold"; approve override ↔ "tolerance approval"; reject ↔ "reject" or "duplicate".
  - AR: request clarification ↔ clarification / contact the customer / short pay; hold ↔ "hold"; approve deduction ↔ the approved deduction type named in the residual classification.

  Explanations get the decision recorded but are neither accepted nor overridden.
- **Approval decision** (`ApprovalEngine`, by a person): the extraction, summaries and explanations in the
  transaction's chain are accepted on approval and overridden on rejection, with the approver's notes as the reason.
- **Field correction** (the *Audit Field Corrections* rules): the extraction behind the record is overridden, and the
  corrected fields become the reason.

## Verification (live)

- **Backfill.** 27 legacy Claude rows now show provider, capability, process and times.
- **Explain with Now Assist on an AP exception.** Two real Now Assist calls, each with a hashed context of 906 characters and
  durations of 1.9 s and 1.2 s. The person's *request correction* decision overrode the skill's recommendation
  ("verify the missing vendor information"), with the person's reason.
- **Agentic workflow, as the AI user.** Each skill call is logged with its agent:
  - explanation: *AP Exception Analysis Agent*
  - next action: *AP Resolution Recommendation Agent*
  - vendor draft: *AP Communication Agent*

  The started workflow row completed when the note was saved. Status success, duration 63.7 s, confidence 0.9,
  recommendation "Request invoice correction from the vendor". In this test the person had already decided before
  the note arrived, so that row stays undecided. A decision made after the note records the outcome.
- **AP approval.** The controller's approval accepted the simulated extraction.
- **AP correction.** Correcting the invoice date and tax amount overrode the extraction ("Corrected after extraction:
  invoice_date, tax_amount").
- **AR approval.** Approving the two-invoice allocation accepted the Now Assist match explanation (1.5 s, hashed context).
- **Field checks.** Every row has process, provider, capability, operation, status, times and initiating user. Every
  skill row has a SHA-256 context identifier, a size and a duration. The table has no prompt column.
- **Fixed during the phase.** The exception fields `ai_explanation` / `ai_confidence` (Phase 16) were never filled by a
  saved note. `GlideRecordSecure` silently drops writes to their read-only fields. The service now derives them with a
  system write after the caller's ACL-checked save of the note itself.
