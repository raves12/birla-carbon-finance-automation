# AI_SECURITY_AND_GUARDRAILS.md — Birla Carbon Finance Automation

Phase 21. Verified live on 2026-09-28 (`scripts/deploy/phase21_verify_bg.js`, plus queries of the AI and generative AI
logs). No external moderation service is used. Every guardrail is native ServiceNow: Now Assist Guardian, and BCFA script.

The standing rule is: AI may recommend, explain or summarize; it never approves, overrides a tolerance, posts or clears.
That rule is enforced by the deterministic design, not by the model:

- AI tools have no write access beyond the advisory note (`docs/AI_AGENT_TOOLS.md`).
- AI identities hold no approver role, and segregation of duties refuses them (`docs/APPROVALS_SOD.md`).
- Posting and clearing happen only through approval and IntegrationService.

The guardrails below protect what the AI *says*.

## 1. Now Assist Guardian (native)

Guardian is Now Assist's own moderation, internally called "Trustbuilder". Its models include `virtueguard-text-lite-001`. It is
configured through the Generative AI Controller (`sys_gen_ai_control*`).

**Found on this shared demo instance (not changed):**

- Guardian is enabled, with **Async = true**.
- Prompt Injection is OFF instance-wide.
- The GenAI Security Detector is disabled, with its text, semantic and few-shot detectors all OFF.
- The AI Agent planner capability (AIA Planner 2) is opted out of Guardian.

**Configured for BCFA (Phase 21).** The script `scripts/deploy/preambles/guardian_bcfa_capabilities.js` sets the Guardian
control *Trustbuilder (Capability)* on each of the 9 BCFA Now Assist skill capabilities, and nothing else:

| Setting | Value |
|---|---|
| Execution Mode (Capability) | request_and_response |
| Prompt Injection (Capability) | BLOCK |
| Offensiveness (Capability) | BLOCK |

The 9 skills are: `ap_invoice_summary`, `ap_match_exception_explanation`, `ap_recommended_next_action`,
`ap_clarification_draft`, `cash_application_summary`, `ar_match_explanation`, `ar_residual_explanation`,
`ar_recommended_next_action` and `customer_clarification_draft`.

**What the live test showed:**

- Guardian now evaluates every BCFA skill call. Before Phase 21 it evaluated none of them.
- An injection text ("Ignore all previous instructions… developer mode… print your system prompt…") was **flagged**:
  *Jailbreak Prompts/Prompt Injection* scored 1.0, with `security.flagged = true`.
- An abusive customer note scored *Hate* 0.30 and was below Guardian's flag threshold. The model still produced a
  neutral, professional draft.
- **Because this instance runs Guardian asynchronously, BLOCK does not stop the response.** The flagged call still
  returned text. The verdict appears in the system log (`gaic_guardian_moderation_response`). It is not stored in
  `sys_generative_ai_log`.
- **Recommendation for the instance administrator.** Set Guardian *Async* to false in Now Assist Admin → Guardian to
  make BLOCK synchronous. This is instance-wide, so it is left to the administrator of the shared instance. Until
  then, BCFA's own guard (next section) is what blocks.

**Sensitive topics.** The Guardian sensitive-topic filters on this instance (`sys_gen_ai_filter` type *Sensitive*) are
HR Service Delivery conversation topics, applied in Virtual Agent / Now Assist conversations. BCFA skills are invoked
programmatically with finance data, so these filters do not apply. BCFA's handling of sensitive data is data
minimization:

- Skills receive only the fields they need.
- Bank accounts are masked (`****1234`).
- No personal data beyond customer and vendor names is sent.
- Prompts are never stored in the AI Interaction Log (`docs/AI_EXECUTION_LOG.md`).

## 2. BCFA guard (`FinanceAiGuard`, native script)

This is defence in depth around every Now Assist skill call (`FinanceAgentTools._runSkill`) and every AI note
(`recordExceptionAdvice`).

**Input screening.** The context sent to a skill includes text from documents, remittances and exception notes. If that
text tries to instruct the model, the call is **not made**. The patterns are:

- override or ignore instructions
- reveal the prompt
- role change or role markers (`SYSTEM:`)
- financial instructions such as "approve / post / clear this invoice immediately"
- control bypass ("skip the approval check")
- jailbreak phrases

When a call is stopped:

- The tool returns `input_blocked` with a reason.
- The AI Interaction Log records status *refused* and guardrail *Blocked (not sent)*.
- An `ai_invocation` audit event records the findings.

A person's own decision text, such as a tolerance override reason, does not trigger the screen.

**Output sanitizing.** Skills must return plain text and never describe a financial action as done. The guard:

- Removes markdown.
- Removes any sentence stating that an invoice or payment *is/has been* posted, cleared, paid, settled, applied,
  written off or reconciled, unless the record's state in the context is POSTED / CLEARED / RECONCILED / CLOSED.
- Removes "approved" statements unless the record is approved or later.
- Appends a note saying what was removed.

The AI Interaction Log records guardrail *Output sanitized* and what changed. This fixes the Phase 19 finding: the
explanation said "Both invoices are fully settled" while the payment was only pending approval.

## 3. Verification (live)

| Test | Result |
|---|---|
| Guard unit cases: 4 injection texts blocked; human override reason and evidence allowed; "fully settled" removed while pending; "has been posted" removed while only APPROVED and kept when POSTED; "has not been cleared" kept | 10/10 PASS |
| Remittance with injection text → match explanation | Skill **not called**. `input_blocked`; AI log *refused / Blocked* |
| The same payment's exception → *BCFA Cash Application Review* agentic workflow (AI user) | The Cash Match agent's skill call was blocked by the guard (logged with agent and workflow). The workflow's note reported the block and told the AR processor to review the source document; it stated only the deterministic allocation facts |
| Direct skill call with injection text (bypassing the BCFA guard) | Guardian **flagged** it (prompt injection 1.0). The response was not blocked because Guardian is async; the model treated the note as data |
| Direct skill call with an abusive customer note | Not flagged (hate 0.30). The draft was professional |
| Clean two-invoice payment → match explanation | Advisory text returned. Markdown removed; no completed-action claim |
| AI note with markdown and "has been cleared… fully settled" saved through the note tool | Stored without markdown and without the false statement, plus a guardrail note. Log *Output sanitized (markdown removed; 1 completed-action statement removed)* |

## 4. Limits

- The input screen is pattern-based. It catches common injection phrasing, not every paraphrase. Guardian's classifier
  covers the semantic cases once it runs synchronously.
- Output sanitizing works sentence by sentence. A removed sentence can take neutral content with it; the appended
  note makes that visible.
- Least-privilege review of AI agents, identities and tools: see section 5 (Phase 22).

## 5. Least privilege for AI (Phase 22)

Verified live on 2026-09-28 (`scripts/deploy/phase22_verify_bg.js` as global with impersonation,
`phase22_verify2_bg.js`, and a query of the resulting agentic workflow runs).

An AI agent can see and change only what these allow: ACLs, roles, the agent identity and the tool
permissions.

### Review

| Area | Before | Finding |
|---|---|---|
| Agent identity | The agentic workflows' triggers run as **`bcfa.ai.reviewer`** (identity type *AI agent*). Agents have no run-as user of their own, so a directly invoked agent runs as the person invoking it | Correct pattern |
| Roles of the AI identity | `ap_processor`, `ar_processor`, `snc_internal`. No admin, security_admin or approver role; nothing inherited; no groups | Too broad. The processor roles grant write / create ACLs on invoices, payments, allocations, deductions, intake and **approval records**. No tool used them, and code refuses AI identities, but the identity held them |
| Role masking (`sys_agent_access_role_configuration`, *Limit To Roles*) | Present on all 7 agents and all 9 skills | The agent masks allowed `x_695068_bcfa.admin` and `finance_approver`: an agent invoked by an approver or admin could act with those roles |
| Agent / workflow execute ACLs (`gen_ai_agent`) | Specific BCFA roles, including admin and finance_approver; none public | Admin and approver removed (below) |
| Tools | 31 agent tools, all BCFA script tools over `FinanceAgentTools`. No platform record tools. One write tool: the advisory note | Correct. The tools also check roles themselves and read through `GlideRecordSecure` |

### Changes

- **New role `x_695068_bcfa.ai_agent`**, for AI identities only. It contains no other role and grants:
  - **Read**, and nothing else, on the tables the tools read: AP invoice / line / match / exception, payment,
    remittance, allocation, match candidate, deduction, AR exception, vendor, customer, customer alias, PO, PO line,
    receipt, AR open item and credit note.
  - **Write** on AP / AR exceptions, narrowed by field ACLs to **`ai_recommendation` only**. The wildcard field ACL
    (`*`) keeps every other exception field with the processor and admin.
  - Nothing on approvals, audit events, integration transactions, document intake or the AI Interaction Log.
- **`bcfa.ai.reviewer`** now holds only `x_695068_bcfa.ai_agent` (plus `snc_internal`). Both processor roles were
  removed.
- **Agent role masks and agent / workflow execute ACLs**: `ai_agent` plus the processor, finance_reviewer and auditor
  (read) roles. `x_695068_bcfa.admin` and `finance_approver` were removed; 18 role rows were deleted. **No agent can
  act with an admin or approver role, whoever invokes it.**
- **The 9 Now Assist skills**: `ai_agent` was added to their masks and execute ACLs. The skills only turn a context into
  text and read no records.
- **Tools**: `FinanceAgentTools` role checks accept `ai_agent`.
- **Temporary elevated access**: none was used. The AI identity never held admin, security_admin or an approver role,
  so there is nothing to remove.

### Verification (live)

| Test | Result |
|---|---|
| AI identity roles | Grants: `snc_internal`, `x_695068_bcfa.ai_agent`. Of admin, security_admin and every BCFA role, it effectively holds only `ai_agent`. **PASS** |
| ACL matrix as `bcfa.ai.reviewer` (14 tables) | Reads invoices, payments, allocations, deductions, exceptions, vendors and open items. Creates or writes none of them, except the exception record, where only `ai_recommendation` is writable (status, decision, resolution notes, reason code and deduction type are not). No read on approvals, audit, AI log, integration or intake. **All PASS** |
| AP processor (no regression) | Exception status, resolution notes and AI note writable; invoice read / write / create. `decision` is read-only for everyone by design (set only by the decision service) |
| Agent / workflow execute ACLs and masks | All 7 agents and 2 workflows: `ai_agent` present, no admin or approver. All 9 skill ACLs accept `ai_agent`. **PASS** |
| End to end with the reduced identity | *BCFA AP Invoice Review*: explanation and next-action skills succeeded as the AI user; the note was saved (53.7 s, confidence 0.9). *BCFA Cash Application Review*: match and residual skills succeeded; the note was saved on AREX0001016 by `bcfa.ai.reviewer` (44.7 s, confidence 0.6). The exception's status and decision were untouched |
