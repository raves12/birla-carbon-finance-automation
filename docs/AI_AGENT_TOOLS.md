# AI Agent Tools (Phase 7)

Date: 2026-09-27
Instance: `pwcmanagementservicesdemo01.service-now.com`

The BCFA AI agents (AI Agent Studio, Phases 8–9) only ever act through the
tool surface described here. Every tool is a method on the
`FinanceAgentTools` script include. The tools call the 9 published Now Assist
skills through `NowAssistSkillClient`. No external LLM is involved.

## Runtime verification of the native skills

The Skill Kit "Run test" preview doesn't substitute inputs on this instance,
so the skills were verified from a scoped server script instead
(`sn_one_extend.OneExtendUtil.execute`, `mode: 'sync'`):

- `bcfaArResidualExplanation` with a short-pay context returned
  `status: success`, provider **Now LLM**, in about 2.6 s. The explanation was
  correct and advisory only: it labelled the bank-charge cause as a
  hypothesis and never claimed a write-off.
- A published skill runs from script **without** activation in Now Assist
  Admin. The `sn_nowassist_skill_config` rows stay `active=false`, and the
  call resolves with `skillConfigResolutionStatus: not_found` and still
  succeeds. Don't pass the editor URL's `config-id` as `meta.skillConfigId`:
  that is rejected with a permission error. Omit `meta` entirely.
- The response is `capabilities[<capability sys_id>].response`, a JSON string
  `{"model_output": "..."}`.
- The first run auto-granted two runtime cross-scope privileges to the app
  (`SubscriptionEntitlementsService` in Licensing Engine, and "Glide API: user
  roles and groups"). This matches how the app's other runtime privileges
  were created. They are instance records, not declared in Fluent source.
- `bcfaApInvoiceSummary` originally took a Record input. Its v1 output was
  poor: references rendered as sys_ids and most amounts came back "not
  provided". It now has a v2 prompt, the default and published, that uses the
  same String `context` input as the other 8 skills. The old `AP Invoice`
  Record input remains on the skill because v1 still references it, but v2
  doesn't use it.

## Least-privilege rules

1. **Role check first.** Every tool checks the caller against the same role
   set its skill is restricted to (table below). `x_695068_bcfa.admin` passes
   every check.
2. **Caller's ACLs apply.** All reads use `GlideRecordSecure`, so a tool can
   never see more than the calling user can.
3. **Arguments are validated.** Sys_id arguments must be 32 hex characters.
   Lists are capped at 10 rows, context at 12,000 characters, and advice text
   at 4,000 characters.
4. **Read tools write nothing.** Skill tools return advisory text and write
   nothing apart from an audit row.
5. **One write tool, one field.** `recordExceptionAdvice` can set only
   `ai_recommendation` on an AP/AR Exception. Deterministic rules,
   approvals, posting and clearing never read that field. The write is
   audited with before and after values.
6. **No control-plane access.** No tool touches state, approval, posting,
   allocation or clearing fields. No tool calls `ApprovalEngine`,
   `IntegrationService` or any SAP/bank adapter.
7. **Everything is audited.** Every skill call and advice write logs an
   Audit Event with `actor_type = now_assist_ai` (new choice) and the calling
   user as `actor`.
8. **Minimal sensitive data.** Remitter bank account numbers are masked to
   the last 4 digits in any context sent to the model. An exception's earlier
   `ai_recommendation` is left out of its context, so one AI opinion never
   feeds the next.

## Tool catalogue

| Tool | Kind | Skill | Roles |
|---|---|---|---|
| `findApInvoice(invoiceNumber)` | lookup | — | AP read |
| `listOpenApExceptions(apInvoiceSysId)` | lookup | — | AP read |
| `getApInvoiceContext(apInvoiceSysId)` | context | — | AP read |
| `getApExceptionContext(apExceptionSysId)` | context | — | AP read |
| `summarizeApInvoice(apInvoiceSysId)` | skill | bcfaApInvoiceSummary | AP read |
| `explainApException(apExceptionSysId)` | skill | bcfaApMatchExceptionExplanation | AP read |
| `recommendApNextAction(apExceptionSysId)` | skill | bcfaApRecommendedNextAction | AP read |
| `draftVendorClarification(apExceptionSysId)` | skill | bcfaApClarificationDraft | AP draft |
| `findPayment(bankReference)` | lookup | — | AR read |
| `listOpenArExceptions(paymentSysId)` | lookup | — | AR read |
| `getPaymentContext(paymentSysId)` | context | — | AR read |
| `getArExceptionContext(arExceptionSysId)` | context | — | AR read |
| `summarizePayment(paymentSysId)` | skill | bcfaCashApplicationSummary | AR read |
| `explainArMatch(paymentSysId)` | skill | bcfaArMatchExplanation | AR read |
| `explainArResidual(paymentSysId)` | skill | bcfaArResidualExplanation | AR read |
| `recommendArNextAction(arExceptionSysId)` | skill | bcfaArRecommendedNextAction | AR read |
| `draftCustomerClarification(arExceptionSysId)` | skill | bcfaCustomerClarificationDraft | AR draft |
| `recordExceptionAdvice(domain, exceptionSysId, adviceText)` | advisory write | — | AP/AR advice write |

Role sets (all `x_695068_bcfa.*`):

- **AP read:** ap_processor, finance_reviewer, finance_approver, auditor
- **AP draft:** ap_processor, finance_reviewer, finance_approver
- **AP advice write:** ap_processor, finance_reviewer
- **AR sets:** the same as the AP sets, with ar_processor in place of
  ap_processor.

Every tool returns `{ ok: true, ... }` or `{ ok: false, error, message }`,
where `error` is one of `forbidden`, `invalid_argument`, `not_found`,
`skill_error`, `invalid_response`, `exception` or `write_failed`. Messages are
safe to show a user. Skill results carry `advisory: true`.

## Deployment status

- Source: `src/server/script-includes/NowAssistSkillClient.server.js`,
  `src/server/script-includes/FinanceAgentTools.server.js`, and
  `src/fluent/script-includes/native_ai.now.ts`. Also the `now_assist_ai`
  Audit Event actor type and updated `ai_recommendation` hints.
- `now-sdk build` succeeds. Build output for the new and changed records is
  on branch `sn_instances/pwcmanagementservicesdemo01` (commit `5756f3a`).
- **Not yet on the instance.** Do *not* run Studio "Apply Remote Changes"
  before first committing the instance's local changes: the 9 Now Assist
  skills and the DocIntel use cases were built on the instance and aren't in
  source control yet, and an apply could overwrite them. Safe order:
  1. In Studio, **Source Control → Commit Changes** for BCFA, which captures
     the skills and DocIntel in git.
  2. Resolve against commit `5756f3a` if Studio reports the remote as ahead.
  3. **Apply Remote Changes.**

  The alternative is to insert the two script includes, the choice and the
  two hints directly on the instance in scope `x_695068_bcfa`, using the
  build sys_ids so the instance and the repo stay aligned.
- Runtime verification of the tool methods (role denial, sys_id validation,
  a live skill call per domain, advice write and audit row) follows deployment.
