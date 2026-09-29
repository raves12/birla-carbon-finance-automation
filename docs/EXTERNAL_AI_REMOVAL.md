# External AI Removal (Phase 34)

Date: 2026-09-29
Instance: `pwcmanagementservicesdemo01.service-now.com`

The Claude client (`BCClaudeClient`) and every code path that could call it have been removed. The AP and AR processes
now use only ServiceNow-native AI: Now Assist skills, AI agents and agentic workflows. Where Document Intelligence is not
licensed, a deterministic simulation is used instead. No code in the application can call an external LLM.

This follows the program's ordering rule. Claude was removed only after its native replacement was built and verified:
- Phases 5–13 built it.
- Phase 29 put it under ATF regression.
- The live provider has been `native` since Phase 12.

## What was removed

| Item | Where | How |
|---|---|---|
| `BCClaudeClient` script include (the only outbound call to the Anthropic API) | source and instance | File deleted; record deleted |
| Properties `x_695068_bcfa.claude.*` (enabled, model, timeout, max_tokens, confidence_threshold; attachment size and types in source) | source and instance | Deleted |
| One-time jobs *Claude Connectivity Test (v1)* and *Claude Demo Scenario Seed (v1)* | source and instance | Deleted |
| `DemoDataSeeder.seedClaudeDemoScenarios` (never run) | source and instance | Removed |
| Claude branches in `ApDomainService` (invoice extraction, exception explanation) | source and instance | Removed. Extraction is the simulation, and exception advice is the Now Assist workflow (or the simulation). |
| Claude branches in `ArDomainService` (remittance extraction, cash-match suggestion, exception explanation) | source and instance | Removed, as above |
| Claude classification and extraction in `FinanceDocumentIntakeService` | source and instance | Removed. The document type is set at upload, and fields are read by the simulated Document Intelligence extraction. The payment-advice document-to-payment path read documents with Claude only. It was removed; payment advices go to manual review, as they already did on the native provider. |
| `claude` value of `x_695068_bcfa.ai.provider` | `FinancePolicy`, property description | Removed. Only `native` and `simulated` remain. `simulated` runs the process with AI switched off. |

The instance was patched from this source with a checksum-verified patch (`BCFA_PATCH`). Each changed script include
was applied only if the live copy matched the previous commit exactly, and the result matches this commit exactly.
Deletions ran from global scope, because the platform refuses those deletes from the application scope. They are
recorded in the update set.

## What was kept, and why

- **History.** AI Interaction Log rows with provider `claude_legacy` (27 `credential_error` rows from 2026-09-25) stay as
  governance evidence. So do audit events with actor type `claude_ai`, and extraction rows with source
  `claude_document_intelligence`. Their choice labels now read *Claude (legacy, removed in Phase 34)*.
- **Column names.** `ai_interaction.claude_model` / `claude_request_id` and `finance_intake.claude_request_id` keep
  their names, because renaming a column drops its data. Their labels are provider-neutral: *Model*, *Provider
  Request ID*, *Provider Request ID (legacy)*.
- **Record identities.** The UI actions *Explain with Now Assist* and *Process Document* keep the Fluent `$id` keys
  from when they were Claude actions (`ui-action-…-claude`). Changing a key changes the sys_id and would create
  duplicates. Only the TypeScript variable names were renamed.
- **The `GlideSysAttachment` cross-scope privilege.** It was added for the Claude client. It is still needed by the demo
  reset (`DemoDataSeeder`), which deletes intake attachments.

## Manual step for an administrator

The Connection & Credential alias **`x_695068_bcfa.BC_Claude_API_Credentials`** ("BC Claude API Credentials", sys_id
`fbca237e831783103d769be0deaad335`) predates this program and is still on the instance. Nothing references it any
more. Its connection and credential hold the Anthropic API key, so deleting them is left to an administrator who can
confirm the key is no longer needed anywhere else:

1. Revoke the API key in the Anthropic console, if it is not used elsewhere.
2. In *Connections & Credentials › Connection & Credential Aliases*, open the alias. Delete its HTTP connection and
   API-key credential, then the alias itself.

No credential value is, or ever was, stored in this repository.

## Verification (2026-09-29)

- **Smoke test** in scope `x_695068_bcfa`:
  - `ApDomainService`, `ArDomainService`, `FinanceDocumentIntakeService`, `DemoDataSeeder`, `AiInteractionLog`,
    `AuditEngine` and `ApLineResolutionService` all construct.
  - `BCClaudeClient` is undefined.
  - `FinancePolicy.aiProvider()` returns `native`.
  - `seedClaudeDemoScenarios` is undefined.
  - The `ap_extraction.source` default is `simulated_document_intelligence`.
- **Reference scan:** no app script include, business rule, UI action, scheduled job, script action or fix script
  contains `BCClaudeClient`. The deletion script checked this before deleting.
- **ATF, BCFA Regression: 13/13 pass** after the removal (run 6 in `TEST_PLAN.md`). One test in the first run after
  the removal failed only because it counted all AP invoices while the other tests inserted theirs concurrently. It now
  counts only pre-existing invoices.

## Source scan

`grep -ri "claude\|anthropic"` over `src/` now finds only:
- historical choice labels and comments;
- the legacy column names;
- the stable `$id` keys.

It finds no call, class, property or job. The Studio source-control export folder (`229ba2b1…/`) still shows the
removed records until Studio's *Commit Changes* runs (Phase 35).
