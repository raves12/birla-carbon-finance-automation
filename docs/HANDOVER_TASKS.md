# Handover Tasks (need a person)

Two tasks that cannot be scripted:
1. Publishing a Now Assist Skill Kit prompt. This is a UI-only step, and the runtime ignores direct edits to the record.
2. Naming the people who govern the AI.

## Task 1: Publish prompt v3 of *AR Recommended Next Action*: DONE 2026-09-29

Published as the new default prompt *AR Recommended Next Action v3*; see `GENERATIVE_AI_SKILLS_BUILD_GUIDE.md` ("Published 2026-09-29") and the evaluation in `TEST_PLAN.md`. The steps below are kept for future prompt changes. Make every change in the Skill Kit UI; never edit a prompt over the API.

### Steps (reference)

**Why.** In the Phase 29 evaluation, prompt v2 answered "Supported option: none" on ambiguous cash matches, even when
the remittance note plainly named one option. v3 adds one rule so the reviewer gets that pointer. It stays advisory: a
person still decides, and the engine never picks.

**Who.** An admin, or a user with the Now Assist Skill Kit admin role.

1. In the filter navigator (**All**), search **Now Assist Skill Kit** and open it.
2. Open the skill **bcfaArRecommendedNextAction**. It may be listed as *AR Recommended Next Action*. You land in the
   **Prompt Editor**, showing the current finalized prompt (v2).
3. Create v3 from v2. Open the prompt menu (**Manage prompt**, next to the prompt title) and choose
   **Duplicate** / **Create new version**; the label depends on the release. This keeps the `context` input pill in
   the prompt, which a hand-typed `{{context}}` might not do.
4. In the new prompt's text, find the block **"Your suggestion must:"**. After its last bullet (*Note any open questions
   the reviewer should confirm before acting*), add this bullet exactly:

   ```
   - If the exception is an ambiguous match (the data contains "Options to compare"), first decide whether the remittance note or other data points to one option: its own words name that option's invoice numbers or their distinctive digits, the month or dates of its due dates, or its relative age (oldest / newest). If it does, begin with "Supported option: Option N" and quote the words; this is a recommendation for the reviewer, not a decision. If it does not, begin with "Supported option: none". Do not answer "none" when the note plainly names one option.
   ```

   Leave everything else unchanged, in particular the *Strict rules* (advisory only, never bypass a control). For
   reference, the complete v3 prompt should read:

   ```
   You are a finance operations assistant supporting an Accounts Receivable reviewer. Based on the exception details below, suggest ONE reasonable next procedural step a human processor could take, in no more than 120 words.

   Your suggestion must:
   - Be phrased as a recommendation for a human to consider, not an instruction that will be automatically executed
   - Reference similar prior resolutions only if provided in the data
   - Note any open questions the reviewer should confirm before acting
   - If the exception is an ambiguous match (the data contains "Options to compare"), first decide whether the remittance note or other data points to one option: its own words name that option's invoice numbers or their distinctive digits, the month or dates of its due dates, or its relative age (oldest / newest). If it does, begin with "Supported option: Option N" and quote the words; this is a recommendation for the reviewer, not a decision. If it does not, begin with "Supported option: none". Do not answer "none" when the note plainly names one option.

   Strict rules:
   - You are advisory only. You never apply, clear, or write off a payment yourself.
   - Never tell the reviewer to bypass a control or skip an approval step.
   - If required data is missing, say so plainly instead of guessing.
   - Output plain text only, organized as short labeled lines, not JSON.

   Exception data:
   {{context}}
   ```

   The last line must be the `context` input (a pill in the editor), not typed text.
5. Click **Save**, then the **lock icon** left of *Manage prompt* → **Finalize prompt**.
6. Click **Publish skill** (top right). Under *Now LLM Service (Now LLM Generic)*, tick the **new (v3)** prompt, not v2.
7. If Skill Kit asks for **security controls** (access ACL and role restrictions), use *Select roles* for both lists
   with exactly these 5 roles, the same as today:
   - `x_695068_bcfa.ar_processor`
   - `x_695068_bcfa.finance_reviewer`
   - `x_695068_bcfa.finance_approver`
   - `x_695068_bcfa.auditor`
   - `x_695068_bcfa.ai_agent`

   `ai_agent` lets the Cash Application Review workflow call the skill as `bcfa.ai.reviewer`, which Phase 22 depends
   on. Don't choose "Any authenticated user".
8. Click **Publish**.

**Check.** Tell Claude "v3 published". It will re-run the AI evaluation (`scripts/deploy/phase29_ai_eval_bg.js`) and
record the result in `TEST_PLAN.md`. If the hinted cases now show "Supported option: Option N", v3 is live. If a case
recommends a *wrong* option, unpublish v3 by re-publishing with v2 ticked.

## Task 2: Name the AI steward and the business owner: named 2026-09-29

Ravi Kumar Kumar is business owner of all 36 BCFA AI assets and holds `sn_ai_governance.ai_steward`. Remaining: the steward acts on AR0000002 (2d below).

### Steps (reference)

**Why.** AI Control Tower governs the BCFA AI as the solution *BCFA Finance Automation AI*: 2 agentic workflows,
7 agents, 9 skills. Approval request **AR0000002**, *Approve BCFA Finance Automation AI for deployment (proposed risk:
Medium)*, has been Open since 2026-09-28. Nobody can act on it, because no active user holds the AI steward role. The
assets are owned by a stand-in user, *BCFA Demo Finance Controller*.

### 2a. Decide who

| Role | Who it should be | What they do |
|---|---|---|
| **AI steward** | Someone accountable for AI governance, e.g. the Birla Carbon or PwC AI/risk lead, **not** the solution builder | Reviews AR0000002, sets the risk classification, approves or rejects deployment |
| **Business owner** | Birla Carbon's finance process owner, e.g. the AP/AR or finance operations head | Owns the AI assets and their use in the finance process |

They must be users on the instance (`sys_user`). Create them first if needed.

### 2b. Grant the steward role (an admin)

1. **All → User Administration → Users** → open the steward's user record.
2. In the **Roles** related list, click **Edit…**. Add **`sn_ai_governance.ai_steward`**, then **Save**.

The role is only for this person. Do not add it to a group other people are in.

### 2c. Set the business owner

1. **All** → search **AI Control Tower** → open the workspace.
2. Open the AI asset inventory and select **BCFA Finance Automation AI**. Set **Owned by** to the business owner.
3. Its 19 component assets (workflows, agents, skills) and the prompts are also owned by *BCFA Demo Finance
   Controller*. Change them the same way, or tell Claude the owner's user name and it will update them all in one
   script. That is a data update, not a security change.

### 2d. The steward acts on AR0000002

1. The steward logs in and opens **AI Control Tower** → approvals / requests → **AR0000002**. Direct form:
   `/sn_ai_governance_assessment_request.do?sys_id=567ead66ebaf0710311dff0dcad0cd0f`.
2. Read the description: the rationale and evidence (`AI_SECURITY_AND_GUARDRAILS.md`, `AI_EXECUTION_LOG.md`,
   `AUDIT_FRAMEWORK.md`, `APPROVALS_SOD.md`).
3. Set the **risk classification**. Medium is proposed: a finance process with advisory-only AI. The steward may
   choose otherwise.
4. **Approve** or **Reject**, with comments. If approved, move the asset lifecycle from *New* to *Deploy*.

**When done.** Tell Claude who the steward and owner are. It will update `AI_GOVERNANCE.md` and the backlog.

## Task 3: Client POC criteria (Phase 40), open since 2026-10-05

| # | Who | What |
|---|---|---|
| 3a | Birla Carbon | Supply sample AP invoices and AR payment advices per country, and say how they may be handled (instance only, not git). Then the measurement in `OCR_ACCURACY_REPORT.md` §6 is repeated on them |
| 3b | Client IT with ServiceNow | Confirm the Now LLM data-processing and residency terms before real documents are loaded |
| 3c | Finance and tax | Confirm or replace the POC reference data: tax expectations (GST, VAT incl. reduced rates, WHT sections), tolerances, deduction limits (`CLIENT_POC_CONFIGURATION_AND_SECURITY.md`) |
| 3d | Presenter | Demo run N1 (`CLIENT_POC_DEMO_JOURNEYS.md`): approve INV-AP-N1 as a Finance Approver; confirm the 1,600 withholding deduction on AREX0001150 as the AR processor; then approve and clear |
| 3e | Admin | After any Playbook deploy: run `phase35_playbook_yokohama_fix_bg.js` (scope global) and activate both Playbooks in Workflow Studio |
| 3f | Build team | SAP Mode 2: RealSAPAdapter, connectivity, SAP test system (`SAP_POC_MODES.md`). AR-REC-004 and adapter selection were done on 2026-10-05 |
| 3g | Build team | The DocIntel field keys and skill configs are global-scope records created by `gen_native_extraction.py`: include them when the app moves to another instance |

## Task 4: Client sample pack findings (Phase 41), open since 2026-10-08

| # | Who | What |
|---|---|---|
| 4a | Client IT with ServiceNow | Raise a case: the Document Intelligence reader text has no Chinese characters for Chinese VAT e-invoices (CS-18, CS-20; the PDFs have a Chinese text layer) and no Hangul / Thai for scanned or image pages (CS-19, CS-26). Bank documents keep Chinese. Evidence: `MULTILINGUAL_DOCUMENT_INTELLIGENCE_READINESS.md` (finding). Until fixed, these documents are processed from review |
| 4b | Birla Carbon finance | Decide whether Chinese bank acceptance drafts (CS-10) are in scope for AR; BCFA has no draft model |
| 4c | Birla Carbon | Supply samples written in French, Hungarian, Spanish, Arabic and Hindi (none in the pack) |
| 4d | Birla Carbon | Send invoice pages only for large packages (the reader accepts up to 4 MB per file; CS-28 is 14.7 MB) |
| 4e | Build team | Load the client vendors / POs / customers as POC master data. Since 2026-10-09 a client invoice with an unknown vendor or PO is created and sits in EXCEPTION (vendor invalid / PO mismatch); after loading, Re-run Validation links it |
