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

## Deployment (2026-09-28)

- Source: `src/server/script-includes/NowAssistSkillClient.server.js`,
  `src/server/script-includes/FinanceAgentTools.server.js`, and
  `src/fluent/script-includes/native_ai.now.ts`. Also the `now_assist_ai`
  Audit Event actor type and updated `ai_recommendation` hints.
- Build output for these records is on `sn_instances/pwcmanagementservicesdemo01`
  (commit `5756f3a`).
- **Deployed directly** from a global-scope background script. It set
  `sys_scope`/`sys_package` to the BCFA app and used the build sys_ids,
  because a scoped script is refused create/write on `sys_script_include`,
  `sys_choice` and `sys_documentation`. Verified: both script includes are in
  the BCFA scope, active, with `package_private` access. The
  `now_assist_ai` choice is live and both hints are updated.
- **Don't run Studio "Apply Remote Changes" yet.** The 9 Now Assist skills
  and the DocIntel use cases were built on the instance and aren't in source
  control. First run **Source Control → Commit Changes** in Studio. After
  that the instance and repo should already agree on the Phase 7 records,
  because the sys_ids match.

## Live tool test (2026-09-28, run in scope `x_695068_bcfa`)

| # | Test | Result |
|---|---|---|
| 1 | `summarizeApInvoice('not-a-sys-id')` | `invalid_argument` ✔ |
| 2 | `explainApException(<non-existent sys_id>)` | `not_found` ✔ |
| 3 | `recordExceptionAdvice('xx', …)` | `invalid_argument` ✔ |
| 4 | `findApInvoice('INV-AP-005')` | 1 match, correct vendor and states ✔ |
| 5 | AP exception and payment context | Full context, bank account masked (`****-002`) ✔ |
| 6 | `summarizeApInvoice` (INV-AP-005) | Now LLM, ~1.7 s, correct and read-only ✔ |
| 7 | `explainApException` (price tolerance) | Correctly explained $50 vs $40 = 25% variance, flagged the missing tolerance threshold ✔ |
| 7b | `explainArResidual` (BANK-AR-002) | Now LLM, ~1.4 s, hypothesis clearly labelled ✔ |
| 8 | `recordExceptionAdvice('ap', …)` | Only `ai_recommendation` changed; exception still `open`, invoice untouched; audit row with before/after ✔ |

Every skill call and the advice write produced an Audit Event with
`actor_type = now_assist_ai` and the calling user as actor.

**Not yet tested:** a user with no BCFA role getting `forbidden`. That needs
a dedicated test user and is covered by the Phase 29 automated tests.

## Phase 8: native AP agents (2026-09-28)

Source: `src/fluent/ai-agents/ap_agents.now.ts`, deployed with
`scripts/deploy/phase8_ap_agents_bg.js`. That script is a global-scope
background script that loads the 55 now-sdk build records through
`GlideUpdateManager2.loadXML()`, keeping the build sys_ids.

| Agent | sys_id | Tools |
|---|---|---|
| BCFA AP Exception Analysis Agent | `04cf894018b541cc929bdf7895e8e286` | Find AP Invoice, List Open AP Exceptions, Get AP Exception Context, Explain AP Exception |
| BCFA AP Resolution Recommendation Agent | `ef84e321673c4969b17dea9d03c4dae5` | Same 3 read tools, Recommend AP Next Action, Save Advisory Recommendation (**Supervised**) |
| BCFA AP Communication Agent | `3c1340425274482fb242410734d781fe` | Same 3 read tools, Draft Vendor Clarification |

- **Identity and access.** All three run as the invoking user (no
  `runAsUser`). `dataAccess.roleList` limits them to the BCFA AP roles, and
  each has an execute ACL for the same roles; the Communication agent
  excludes auditor. Tools are per-agent copies because `sn_aia_tool` records
  are keyed by name and can't be shared across agents in Fluent.
- **No control-plane tools.** No agent has a tool that can approve, post,
  change state or override a tolerance.

**Manual tests (AI Agent Studio → Testing):**

| Agent | Task | Result |
|---|---|---|
| Exception Analysis | "Analyze the open exception on AP invoice INV-AP-005" | ✔ Called all 4 tools in order. Output: price_tolerance, 25% ($50 vs $40/MT), **financial variance $3,000**, evidence, hypothesis, High confidence, human decision required |
| Resolution Recommendation | "Recommend the next action … INV-AP-004" | ✔ "Request receipt confirmation from the goods receiver" (invoice 15 MT vs PO/received 10 MT, 50% variance) with evidence. Did not call the save tool unprompted. ⚠ Skipped the Recommend AP Next Action skill call |
| Communication | "Draft a clarification to the vendor … INV-AP-005" | ✔ Skill returned a correct vendor draft (invoice, PO0005, $50 vs $40, 25%, placeholder signature). ⚠ Run ended straight after the tool without the final formatting step, so the chat showed only the post-processing message |

Tuning applied in source for the next deploy: the Resolution agent must call
the skill before answering, and the Communication agent must always present
the draft in its output format.

## Phase 9: native AR agents (2026-09-28)

Source: `src/fluent/ai-agents/ar_agents.now.ts`. Deployed with
`scripts/deploy/phase9_agents_bg.js`, generated by
`scripts/deploy/gen_agent_loader.mjs`. That run loaded 130 records: all 7
agents, their tools, links, configs, versions, access configurations and
ACLs, plus the updated `FinanceAgentTools`. It also delivered the Phase 8
tuning.

| Agent | sys_id | Tools |
|---|---|---|
| BCFA Customer Resolution Agent | `132a20eb57aa4ed5971db8a267ce6395` | Find Payment, Get Payment Context, **Search Customer Candidates** (new) |
| BCFA Cash Match Recommendation Agent | `59b6817ef4724c9ea131e5aa57c3f250` | Find Payment, Get Payment Context, Explain AR Match, List Open AR Exceptions, Save AR Advisory Recommendation (**Supervised**) |
| BCFA Deduction Analysis Agent | `ede6a13bfc184c5d981db3b681d43ebf` | Find Payment, Get Payment Context, Explain AR Residual, List Open AR Exceptions, Save AR Advisory Recommendation (**Supervised**) |
| BCFA Cash Application Communication Agent | `9fd2181abab54e2eb93dffe220d11d93` | Find Payment, List Open AR Exceptions, Get AR Exception Context, Draft Customer Clarification |

`searchCustomerCandidates(nameKeyword)` searches customer names and active
aliases and returns each candidate once, with its evidence (matched field,
alias type and weight) and open-item exposure. Ranking is left to the agent.

**Manual tests (AI Agent Studio → Testing):**

| Agent | Task | Result |
|---|---|---|
| Customer Resolution | "Identify the most likely customer for … BANK-AR-005" | ✔ Read the payment context, found the remitter "UNKNOWN REMITTER XYZ" had no distinctive keyword, and recommended manual identification instead of guessing |
| Deduction Analysis | "Analyze the residual on … BANK-AR-002" | ✔ Called all 3 tools. Classified **OTHER** because the payment is 6,000 EUR against a 9,500 INR invoice, so the residual can't be computed directly. Hypothesis labelled, High confidence with reason, required review stated, nothing saved |

Cash Match and Cash Application Communication follow the same patterns as
the tested agents; exercise them in the Phase 13 end-to-end run. The demo
data has no remittance records and only one customer alias ("LONE STAR TYRE
CO", on the already-resolved BANK-AR-004), which limits how much the
Customer Resolution agent can show. Add an ambiguous-remitter scenario with
aliases in the Phase 27/28 demo data.

### Findings to act on later

- **Markdown in output.** The model sometimes uses markdown bold (`**…**`)
  despite the "plain text" instruction. It's cosmetic. Either strip it in
  the Phase 24 workspace display or tighten the prompts in a v2.
- **Demo data inconsistency (fix before Phase 13).** BANK-AR-002 is EUR but
  its open item ARI0006 is INR, and the allocation shows residual 0 while the
  short-pay exception says -3500. The residual skill correctly surfaced the
  currency mismatch as a hypothesis.
- **Leftover test value.** The `bcfaApInvoiceSummary` payload still carries
  the old Record input's test value (`ap_invoice: "INV-AP-001"`). The v2
  prompt ignores it, so it's harmless.
