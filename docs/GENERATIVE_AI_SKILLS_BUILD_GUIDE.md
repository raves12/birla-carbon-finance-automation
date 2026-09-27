# Phase 6 — Generative AI Skills: Manual Build Guide

Date: 2026-09-27
Instance: `pwcmanagementservicesdemo01.service-now.com`

This is a step-by-step guide to finish building the 9 Now Assist Skill Kit
skills by hand. Browser automation for this specific tool proved very slow
(the tool has several UI bugs — documented below — and the tab kept losing
OS focus, which breaks ServiceNow's canvas-rendered UI). Doing it by hand
will be much faster than continuing to drive it through automation.

## 1. Where to go

URL: `https://pwcmanagementservicesdemo01.service-now.com/now/now-assist-skillkit/skills`

(This exact URL was hard to find — the app is called **"Now Assist Skill
Kit"**, scope `sn_skill_builder`, but its route is `now-assist-skillkit`,
one word, no dashes. If the link ever breaks, go to **All** menu and search
"Now Assist Skill Kit".)

Click **Custom skills** tab → **Create skill** button (top right).

## 2. Known UI bugs — read this first, it will save you time

1. **Skill names must be plain alphanumeric (camelCase). No dashes, no
   underscores.** The hint text says dashes/underscores are allowed — they
   are not; the field silently fails validation (shows "Enter a valid
   Name" and the Next button won't actually submit) if you use `-` or `_`.
   Use names like `bcfaApMatchExceptionExplanation`.
2. **Typing `{{` into the Prompt box auto-inserts a matching `}}`.** If you
   then type your own closing `}}`, you can end up with `{{field}}}}`
   (extra braces) at the very end of the text, especially the last merge
   field in the prompt. **Always check the last line of the prompt after
   typing** and delete any extra `}` characters.
3. **"Run Test" does not work in this environment.** This was extensively
   verified: both a `Record`-type input (`{{apInvoice}}`) and a
   `String`-type input (`{{invoiceContext}}`) resolved to **empty** in the
   "Grounded prompt" view, with or without "Test prompt after applying
   security controls" checked. The underlying LLM call itself works fine
   (real "Now LLM Generic" calls, real token counts/latency — confirmed
   native, non-Claude) — only the *merge-field substitution in the test
   preview* is broken. **Don't spend time debugging this.** Build the
   skill correctly (it will look right in the Prompt editor) and move on.
   Real verification will happen in Phase 7 when skills are wired into a
   Flow Designer action or AI Agent tool, which uses a different, more
   mature invocation path.
4. Use a **single String input** per skill (not a `Record` input,
   not multiple scalar inputs) — see design decision below.

## 3. Design decision: one "context" string input per skill

Instead of a `Record` input with dot-notation field access (which is what
the platform's own sample template suggests, but doesn't seem to work
reliably even outside the Run-Test bug), give every skill **one `String`
input** that already contains the pre-formatted, human-readable record data
as `Key: value` lines. The calling script (a business rule, Flow Designer
script step, or AI Agent tool wrapper — built in later phases) is
responsible for reading the actual GlideRecord and formatting this string
before invoking the skill. This is also just a more robust design for
production use, since it decouples the skill's prompt from GlideRecord API
specifics.

**Input to add on every skill:**

| Field | Value |
|---|---|
| Datatype | `String` |
| Name | `context` *(reuse this exact name on all 9 skills for consistency)* |
| Description | one line, per-skill (see table below) |
| Make input mandatory | ✅ checked |
| Test values | a realistic one-line example, see table below (use `;` to separate fields, not newlines — the Test values box is single-line) |

## 4. Generic steps for every skill

1. **Custom skills → Create skill.**
2. **General info** page:
   - Skill name: camelCase, see table below.
   - Description: see table below.
   - Default provider: leave as **Now LLM Generic / Now LLM Service**
     (already selected by default — this is the native, non-Claude model).
   - Configure security controls:
     - **Select roles** (not "Any authenticated user") for both "Define
       user access" and "Apply role restrictions to skill".
     - Add these 4 roles to both lists (use the "Copy roles from user
       access" link to sync the second list after filling the first):
       - `x_695068_bcfa.ap_processor` (AP skills) or
         `x_695068_bcfa.ar_processor` (AR/Cash Application skills)
       - `x_695068_bcfa.finance_reviewer`
       - `x_695068_bcfa.finance_approver`
       - `x_695068_bcfa.auditor`
   - Click **Next**. Wait for "Creating Skill..." — this actually creates
     the record and takes you to step 2.
3. **Start prompt creation** page: choose **Write from scratch** → **Next**.
4. **Add skill inputs** page: click **+ Add**, fill in the modal:
   - Datatype: `String`
   - Name: `context`
   - Description: per-skill (table below)
   - Check "Make input mandatory"
   - Test values: per-skill one-liner (table below)
   - Click **Add skill input**.
5. Click **Go to summary**, then **Skip to Prompt Editor** (or just wait,
   it auto-lands there after clicking through summary).
6. In the Prompt Editor:
   - A default sample "Incident Summarization" prompt is pre-filled.
     Click into the text box, **Ctrl+A**, then type the real prompt
     (table below). **Check the last line for doubled `}}` and fix.**
   - Click the pencil icon next to the prompt title ("Incident
     Summarization") and rename it to match the skill name in plain
     English (table below has a "Prompt title" column).
   - Click **Save** (top right of the editor panel). You should see
     "Saved prompt successfully".
7. Leave the skill in **Draft** state — we'll publish all 9 together at
   the end of Phase 6 (via **Publish skill** button, top right of the
   skill's main page) once everything is verified in a later phase.
8. Go back to the skills list (click the ServiceNow logo top-left, or use
   **All** menu → search "Now Assist Skill Kit" again, or just navigate
   the URL from step 1 again) and repeat for the next skill.

## 5. Status: all 9 skills built and published, 2026-09-27

All 9 skills below exist in `sys_one_extend_capability`, scoped to the BCFA
app (`229ba2b1a079431e104010f5ea883e85`), each with the roles and the prompt
text listed in section 6. Each prompt was finalized (v1) and the skill
published on 2026-09-27. Runtime verification happens in Phase 7.

**Input shape exception:** `bcfaApInvoiceSummary` was the first skill
built. It takes a **Record** input (`ap_invoice` → `x_695068_bcfa_ap_invoice`)
whose prompt references record fields (`{{ap_invoice.vendor}}` etc.), not
the String `context` input. The other 8 skills take a single mandatory
String input named `context`, which the calling script pre-formats.

**Publishing steps (per skill):** in the prompt editor, click the lock icon
left of **Manage prompt** → **Finalize prompt**. Then **Publish skill** (top
right), tick the finalized prompt under "Now LLM Service (Now LLM Generic)",
and click **Publish**. Without a finalized prompt, publishing fails with
"Finalize at least one prompt to publish". The Skill Kit list still shows
"Inactive" for published skills; activation for end-user UI surfaces is a
separate step in Now Assist Admin. Whether script or agent invocation also
needs that activation is verified in Phase 7.

| Skill | Capability sys_id |
|---|---|
| bcfaApInvoiceSummary | bf551f4a3b2f03104035a50864e45a39 |
| bcfaApMatchExceptionExplanation | 9e56ef863bef03104035a50864e45af8 |
| bcfaApRecommendedNextAction | 3f822056eb2b4310311dff0dcad0cda4 |
| bcfaApClarificationDraft | d325e8daeb2b4310311dff0dcad0cd56 |
| bcfaCashApplicationSummary | f707a812eb6b4310311dff0dcad0cdb4 |
| bcfaArMatchExplanation | f78e64d2ebab4310311dff0dcad0cd40 |
| bcfaArResidualExplanation | 96afe496ebab4310311dff0dcad0cd50 |
| bcfaArRecommendedNextAction | e860f81aebab4310311dff0dcad0cd20 |
| bcfaCustomerClarificationDraft | 3d2130daebab4310311dff0dcad0cd48 |

Additional UI quirks found while building: input descriptions containing
`/` or `:` inside parentheses are rejected; typing `{{context` (without the
closing braces) lets the editor auto-close it cleanly. Each skill writes
~57 records across ~20 tables (capability, definitions, attributes, prompt
config, ACLs and role grants, agent access config), so skills should be
created or cloned through the Skill Kit UI, not the Table API.

## 6. All 9 skills — content to paste in

Every skill's prompt starts the same way (persona + strict rules) and ends
with `{{context}}`. Strict-rules block (use in every skill, adjust the
"never..." lines per-skill if noted):

```
Strict rules:
- You are read-only. Never state or imply that any AP invoice or AR
  payment has been approved, posted, or cleared.
- Never recommend overriding a tolerance, approval limit, or control.
- If required data is missing, say so plainly instead of guessing.
- Output plain text only, organized as short labeled lines, not JSON.
```

---

### 1. AP Invoice Summary — DONE, reference only

- Skill name: `bcfaApInvoiceSummary`
- Description: `Summarizes an AP invoice and its match or exception status for a human reviewer. Read-only: never approves, posts, or changes tolerances.`
- Roles: `x_695068_bcfa.ap_processor`, `finance_reviewer`, `finance_approver`, `auditor`
- Input `context` description: `Structured AP invoice details assembled by the calling script from the AP Invoice record`
- Test value: `Invoice Number: INV-AP-001; Vendor: Contoso Chemicals Ltd; Invoice Date: 2026-08-01; Posting Date: 2026-08-03; Gross Amount: 12500.00; Net Amount: 11500.00; Tax Amount: 1000.00; Currency: USD; Purchase Order: PO-1001; State: matched; Approval State: pending; Posting State: not_posted; Extraction Confidence: 0.97; Source: workspace_upload`
- Prompt title: `AP Invoice Summary`
- Prompt body:
```
You are a finance operations assistant supporting an Accounts Payable reviewer. Summarize the AP invoice below in plain language, in no more than 200 words.

Your summary must include, when the data is available:
- Vendor name and invoice number
- Invoice date and posting date
- Gross amount, net amount, tax amount, and currency
- Approval state and posting state
- Any indication of a match or extraction issue (e.g. low extraction confidence, missing purchase order)

Strict rules:
- You are read-only. Never state or imply that the invoice has been approved, posted, or cleared.
- Never recommend overriding a tolerance, approval limit, or control.
- If required data is missing, say so plainly instead of guessing.
- Output plain text only, organized as short labeled lines, not JSON.

Invoice data:
{{context}}
```

---

### 2. AP Match Exception Explanation

- Skill name: `bcfaApMatchExceptionExplanation`
- Description: `Explains, in plain language, why an AP invoice failed 2-way/3-way match, for a human reviewer. Read-only: never resolves or waives the exception.`
- Roles: `ap_processor`, `finance_reviewer`, `finance_approver`, `auditor`
- Input `context` description: `Structured AP invoice, PO/GRN, and exception details assembled by the calling script`
- Test value: `Invoice Number: INV-AP-004; Vendor: Contoso Chemicals Ltd; Invoice Qty: 120; PO Qty: 100; Invoice Unit Price: 25.00; PO Unit Price: 25.00; Exception Type: quantity_variance; Tolerance Threshold: 5 percent; Variance: 20 percent; Exception State: open`
- Prompt title: `AP Match Exception Explanation`
- Prompt body:
```
You are a finance operations assistant supporting an Accounts Payable reviewer. Explain, in plain language and no more than 180 words, why the AP invoice below failed the matching process.

Your explanation must cover, when the data is available:
- Which match type failed (quantity, price, or tax) and the exact variance
- The tolerance threshold that was exceeded
- The invoice, PO, and GRN quantities/prices being compared
- The current exception state

Strict rules:
- You are read-only. Never state or imply that the exception has been resolved, waived, or approved.
- Never recommend a specific tolerance override value or approval action — describe the discrepancy only.
- If required data is missing, say so plainly instead of guessing.
- Output plain text only, organized as short labeled lines, not JSON.

Exception data:
{{context}}
```

---

### 3. AP Recommended Next Action

- Skill name: `bcfaApRecommendedNextAction`
- Description: `Suggests the next procedural step a human AP processor could take on an exception. Advisory only — never executes or approves anything.`
- Roles: `ap_processor`, `finance_reviewer`, `finance_approver`, `auditor`
- Input `context` description: `Structured AP invoice and exception details, plus prior resolution history if available`
- Test value: `Invoice Number: INV-AP-005; Exception Type: tax_validation; Expected Tax Rate: 18 percent; Invoiced Tax Rate: 12 percent; Country: India; Exception State: open; Prior Similar Exceptions Resolved As: vendor_correction`
- Prompt title: `AP Recommended Next Action`
- Prompt body:
```
You are a finance operations assistant supporting an Accounts Payable reviewer. Based on the exception details below, suggest ONE reasonable next procedural step a human processor could take, in no more than 120 words.

Your suggestion must:
- Be phrased as a recommendation for a human to consider, not an instruction that will be automatically executed
- Reference similar prior resolutions only if provided in the data
- Note any open questions the reviewer should confirm before acting

Strict rules:
- You are advisory only. You never approve, post, override a tolerance, or clear anything yourself.
- Never tell the reviewer to bypass a control or skip an approval step.
- If required data is missing, say so plainly instead of guessing.
- Output plain text only, organized as short labeled lines, not JSON.

Exception data:
{{context}}
```

---

### 4. AP Clarification Draft

- Skill name: `bcfaApClarificationDraft`
- Description: `Drafts a polite vendor clarification email about an AP invoice discrepancy, for a human to review and send. Never sends anything itself.`
- Roles: `ap_processor`, `finance_reviewer`, `finance_approver`
- Input `context` description: `Structured AP invoice and exception details plus the vendor name/contact context`
- Test value: `Vendor: Contoso Chemicals Ltd; Invoice Number: INV-AP-004; Exception Type: quantity_variance; Invoiced Qty: 120; PO Qty: 100; PO Number: PO-1001`
- Prompt title: `AP Clarification Draft`
- Prompt body:
```
You are a finance operations assistant supporting an Accounts Payable reviewer. Draft a short, polite email to the vendor below asking them to clarify the invoice discrepancy, in no more than 150 words.

The draft must:
- Reference the invoice number, PO number, and the specific discrepancy
- Ask a clear, specific question the vendor needs to answer
- Use a neutral, professional tone
- End with a placeholder signature line "[Your name], Accounts Payable"

Strict rules:
- This is a DRAFT for a human to review and send. Never claim the email has been sent.
- Never state or imply that the invoice has been approved, posted, or paid.
- If required data is missing, say so plainly instead of guessing at vendor details.
- Output the email body as plain text only, no JSON, no subject-line metadata beyond a single "Subject:" line at the top.

Discrepancy data:
{{context}}
```

---

### 5. Cash Application Summary

- Skill name: `bcfaCashApplicationSummary`
- Description: `Summarizes an incoming customer payment/remittance and its allocation status for a human AR reviewer. Read-only: never clears or applies cash.`
- Roles: `x_695068_bcfa.ar_processor`, `finance_reviewer`, `finance_approver`, `auditor`
- Input `context` description: `Structured payment and remittance details assembled by the calling script`
- Test value: `Payment Amount: 5000.00; Currency: USD; Customer: Acme Distribution Inc; Bank Reference: BR-20260801-01; Value Date: 2026-08-01; Posting Date: 2026-08-02; State: unapplied; Remittance Reference: REM-0001; Confidence: 0.95`
- Prompt title: `Cash Application Summary`
- Prompt body:
```
You are a finance operations assistant supporting an Accounts Receivable reviewer. Summarize the incoming payment below in plain language, in no more than 180 words.

Your summary must include, when the data is available:
- Customer name, payment amount, and currency
- Value date and posting date
- Bank reference and remittance reference
- Current application/allocation state
- Any indication of a low-confidence extraction

Strict rules:
- You are read-only. Never state or imply that the payment has been applied, cleared, or allocated.
- Never recommend overriding a control or auto-applying the payment.
- If required data is missing, say so plainly instead of guessing.
- Output plain text only, organized as short labeled lines, not JSON.

Payment data:
{{context}}
```

---

### 6. AR Match Explanation

- Skill name: `bcfaArMatchExplanation`
- Description: `Explains how a customer remittance matches (or fails to match) open invoices, for a human AR reviewer. Read-only: never applies the match.`
- Roles: `ar_processor`, `finance_reviewer`, `finance_approver`, `auditor`
- Input `context` description: `Structured remittance and candidate open-invoice match details assembled by the calling script`
- Test value: `Remittance Reference: REM-0002; Payment Amount: 15000.00; Matched Invoices: INV-AR-010 (5000.00), INV-AR-011 (10000.00); Match Type: multi_invoice; Unmatched Amount: 0.00; Confidence: 0.92`
- Prompt title: `AR Match Explanation`
- Prompt body:
```
You are a finance operations assistant supporting an Accounts Receivable reviewer. Explain, in plain language and no more than 160 words, how the remittance below was matched (or why it could not be matched) to open invoices.

Your explanation must cover, when the data is available:
- Which invoice(s) the payment was matched against, and the amounts
- Whether the match is exact, multi-invoice, or partial
- Any unmatched or residual amount

Strict rules:
- You are read-only. Never state or imply that the match has been applied or the invoices cleared.
- Never recommend a specific allocation override.
- If required data is missing, say so plainly instead of guessing.
- Output plain text only, organized as short labeled lines, not JSON.

Match data:
{{context}}
```

---

### 7. AR Residual Explanation

- Skill name: `bcfaArResidualExplanation`
- Description: `Explains the likely cause of a short-pay or over-payment residual on a customer remittance, for a human AR reviewer. Read-only, advisory only.`
- Roles: `ar_processor`, `finance_reviewer`, `finance_approver`, `auditor`
- Input `context` description: `Structured remittance, matched invoice, and residual amount details assembled by the calling script`
- Test value: `Remittance Reference: REM-0003; Invoice Number: INV-AR-006; Invoice Amount: 8000.00; Payment Amount: 7950.00; Residual Amount: 50.00; Residual Type: short_pay; Likely Cause Hint: bank_charge`
- Prompt title: `AR Residual Explanation`
- Prompt body:
```
You are a finance operations assistant supporting an Accounts Receivable reviewer. Explain, in plain language and no more than 140 words, the likely cause of the payment residual (short-pay or over-payment) described below.

Your explanation must cover, when the data is available:
- The invoice amount, payment amount, and exact residual
- Whether this is a short-pay or over-payment
- The most likely cause (e.g. bank charges, early-payment discount, dispute), clearly labeled as a hypothesis, not a fact

Strict rules:
- You are advisory only. Never state the residual has been written off, cleared, or approved for write-off.
- Never recommend a specific write-off amount or GL code.
- If required data is missing, say so plainly instead of guessing.
- Output plain text only, organized as short labeled lines, not JSON.

Residual data:
{{context}}
```

---

### 8. AR Recommended Next Action

- Skill name: `bcfaArRecommendedNextAction`
- Description: `Suggests the next procedural step a human AR processor could take on an unmatched or exception payment. Advisory only.`
- Roles: `ar_processor`, `finance_reviewer`, `finance_approver`, `auditor`
- Input `context` description: `Structured remittance/payment and exception details, plus prior resolution history if available`
- Test value: `Remittance Reference: REM-0004; Payment Amount: 3000.00; Customer: Acme Distribution Inc; Exception Type: unmatched_no_invoice_reference; Days Outstanding: 12; Prior Similar Exceptions Resolved As: customer_contacted`
- Prompt title: `AR Recommended Next Action`
- Prompt body:
```
You are a finance operations assistant supporting an Accounts Receivable reviewer. Based on the exception details below, suggest ONE reasonable next procedural step a human processor could take, in no more than 120 words.

Your suggestion must:
- Be phrased as a recommendation for a human to consider, not an instruction that will be automatically executed
- Reference similar prior resolutions only if provided in the data
- Note any open questions the reviewer should confirm before acting

Strict rules:
- You are advisory only. You never apply, clear, or write off a payment yourself.
- Never tell the reviewer to bypass a control or skip an approval step.
- If required data is missing, say so plainly instead of guessing.
- Output plain text only, organized as short labeled lines, not JSON.

Exception data:
{{context}}
```

---

### 9. Customer Clarification Draft

- Skill name: `bcfaCustomerClarificationDraft`
- Description: `Drafts a polite customer clarification email about an unmatched or short-paid remittance, for a human to review and send. Never sends anything itself.`
- Roles: `ar_processor`, `finance_reviewer`, `finance_approver`
- Input `context` description: `Structured remittance/payment and exception details plus the customer name/contact context`
- Test value: `Customer: Acme Distribution Inc; Remittance Reference: REM-0004; Payment Amount: 3000.00; Exception Type: unmatched_no_invoice_reference; Days Outstanding: 12`
- Prompt title: `Customer Clarification Draft`
- Prompt body:
```
You are a finance operations assistant supporting an Accounts Receivable reviewer. Draft a short, polite email to the customer below asking them to clarify the payment details, in no more than 150 words.

The draft must:
- Reference the payment amount, remittance reference, and the specific issue (e.g. missing invoice reference, short payment)
- Ask a clear, specific question the customer needs to answer
- Use a neutral, professional tone
- End with a placeholder signature line "[Your name], Accounts Receivable"

Strict rules:
- This is a DRAFT for a human to review and send. Never claim the email has been sent.
- Never state or imply that the payment has been applied or cleared.
- If required data is missing, say so plainly instead of guessing at customer details.
- Output the email body as plain text only, no JSON, no subject-line metadata beyond a single "Subject:" line at the top.

Payment data:
{{context}}
```

---

## 7. After all 9 are built

1. Open each skill and click **Publish skill** (top right).
2. Update `docs/IMPLEMENTATION_BACKLOG.md` — change Phase 6 row from
   "Queued" to **DONE**, noting the Run-Test preview limitation and that
   full runtime verification happens in Phase 7.
3. Commit: `git add docs/ && git commit -m "Phase 6: document and build 9 native generative AI skills"` — no source files change for this
   phase (Skill Kit content lives in the platform's own tables, not
   exported via `now-sdk build` the way Fluent-authored components are),
   so this is a docs-only commit unless you choose to also add the 71-file
   Studio XML export for these skill records (optional, not required —
   `sys_gen_ai_skill*`/`sys_ux_*` records are typically managed centrally,
   not per-scoped-app).
4. Let me know when done and I'll pick up Phase 7 (AI agent tools).
