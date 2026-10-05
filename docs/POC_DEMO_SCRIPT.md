# POC Demo Script (Phase 33)

A 45-minute live demonstration of the Birla Carbon Finance Automation POC on `pwcmanagementservicesdemo01`. Every step below uses records and buttons that exist on the instance. The expected results come from the verified runs in `POC1_AP_JOURNEY.md`, `POC2_CASH_JOURNEY.md`, `DEMO_DATA.md` and `AUTOMATED_FLOWS.md`.

**The message to land:** the deterministic pipeline decides, and people approve. ServiceNow's own AI (Now Assist) explains and recommends, and it can never approve, post or clear anything. Every step is audited.

## Be upfront about what is simulated

Say this at the start, and again whenever one of these comes up.

| Area | In the POC | Production |
|---|---|---|
| Reading documents | **Simulated.** The fixture PDFs' printed values are looked up by **file name** and labelled SIMULATED. Document Intelligence extraction is not licensed on this instance. | ServiceNow Document Intelligence, same result shape |
| SAP posting and clearing | Mock SAP integration profile (`MIRO…` / `FB05…` documents) | SAP connector |
| Bank statement lines | Created by the seeder | Bank statement integration |
| Thresholds, tolerances, approval limits | `x_695068_bcfa.*` properties labelled POC ASSUMPTION | Agreed with Birla Carbon finance |
| Everything else (matching, exceptions, SoD, lifecycle, flows, audit, AI) | Real platform behaviour | Same |

## Cast

| Persona | User | Use for |
|---|---|---|
| AP processor | `bcfa.ap.processor` | Uploading invoices; exception decisions other than override |
| AR processor | `bcfa.ar.processor` | Uploading remittances; Approve Deduction (up to 5,000) |
| Finance approver | `bcfa.finance.approver` | Approvals and tolerance overrides |
| Admin (presenter) | your own admin login | Impersonating the three users above; the AI & Audit lists |

Switch persona with **Impersonate User** from the admin account. Never type or share demo passwords on screen.

## The day before

1. **Reset the demo data.**
   - Run `scripts/deploy/phase28_reset_and_reseed_bg.js` in Scripts - Background with scope **x_695068_bcfa**.
   - Expect "AP 9 of 9, AR 10 of 10 as documented" and "POC 2 cash journeys created: ARINV1001 … BANK-POC2-003".
   - About a minute later, BANK-POC2-001/002/003 are in **EXCEPTION** (`customer_ambiguous`). That is expected: the bank lines arrived without a remittance.
2. **Check the landing page.** The KPI job refreshes every 15 minutes, so check the landing page at least 15 minutes after the reset. If Phase 30 is deployed, also check that **AI & Audit › POC Success Scorecard** shows 18 rows.
3. **Check Now Assist.** Open any AP exception and click **Explain with Now Assist**. A note should appear within about 5 to 60 seconds. If it doesn't, see *If something goes wrong*.
4. **Put the fixtures on the presenting laptop, with their names unchanged.** Simulated reading is keyed by file name.
   - `test/fixtures/AP_INV_004_DUPLICATE.pdf`
   - `test/fixtures/AR_REMIT_101_EXACT.pdf`, `AR_REMIT_102_MULTI_INVOICE.pdf`, `AR_REMIT_103_BANK_CHARGE.pdf`
5. **Rehearse Act 5.** Upload `AR_REMIT_101_EXACT.pdf` once, then reset again. The late-remittance path was fixed and verified on test data in Phase 33, but not yet with these three fixtures.
6. **Open these browser tabs** in the workspace (`/x/695068/bcfa`):
   - the landing page
   - AP › Approvals
   - AP › Exceptions
   - Document Intake › New / Open
   - Cash Application › Payments
   - AI & Audit › AI Interaction Log

## Running order

| # | Act | Persona | Minutes |
|---|---|---|---|
| 0 | Opening | — | 2 |
| 1 | Finance Operations landing page | admin | 3 |
| 2 | AP happy path: approve and post | finance approver | 5 |
| 3 | AP exception with AI advice | finance approver | 8 |
| 4 | Duplicate invoice, live upload | AP processor | 5 |
| 5 | Cash application, live remittances | AR processor → finance approver | 12 |
| 6 | AI governance and audit | admin | 7 |
| 7 | Close | — | 3 |

### Act 0: Opening

The two POC journeys are AP invoice to posting, and cash receipt to clearing. Both run on native ServiceNow: tables, flows, a state model, decision tables, and Now Assist skills and agents. Now Assist is the only AI in the solution; there is no external AI service. Give the principle in one line: *AI recommends, people decide, controls are code.* Then show the table above.

### Act 1: Finance Operations landing page

1. Open the workspace landing page. It has 19 KPI cards across AP, AR, AI and Integration.
2. Point out:
   - open exceptions, and pending approvals;
   - straight-through rate and auto-match rate. Say these reflect the demo set, which is built to show exceptions.
   - AI-assisted reviews and recommendation acceptance.
3. **Say:** counts are live. Rates are recomputed every 15 minutes, and each rate records how it was computed.

### Act 2: AP happy path (INV-AP-008, PENDING_APPROVAL)

1. Impersonate `bcfa.finance.approver` and open **AP › Approvals**, then the approval for INV-AP-008.
2. Open the invoice and walk the **Review Summary** top to bottom:
   - extraction source and confidence;
   - PO and GRN;
   - the 3-way match;
   - the tolerances applied, and their source;
   - the approval, with its segregation-of-duties result.
3. On the approval, click **Approve** and add a comment.
4. Refresh the invoice after a few seconds. It moves APPROVED → POSTING → POSTED/CLOSED, and **Integration Status** shows `postVendorInvoice: success` with a `MIRO…` document.
5. **Say:** the posting was done by the flow, not by a person pressing "post", and not by AI. The approver's roles and group were checked, and so was the rule that the requester and the processor cannot approve.

### Act 3: AP exception with AI advice (INV-AP-004, quantity tolerance)

1. Still as the approver, open **AP › Exceptions** and the `quantity_tolerance` exception for INV-AP-004. It shows 15 EA invoiced against 10 received, exceeding the 2 % tolerance, with severity, SLA, owner, rule result and evidence.
2. Show the **AI recommendation**: advisory, with a confidence. It was written by the *BCFA AP Invoice Review* agentic workflow, running as the AI identity `bcfa.ai.reviewer`. On the seeded record it explains the 50 % quantity variance (EUR 2,500). It recommends asking Rhine Logistics GmbH for clarification, and includes a draft vendor message marked **NOT sent**. The AI drafts; a person sends.
3. Click **Explain with Now Assist** to regenerate the note live. **Say:**
   - It reads only this exception's evidence.
   - The BCFA guard screens the input for prompt injection before the call.
   - It strips any sentence that claims an action happened, for example "the invoice has been approved".
4. Click **Approve Override** with **no reason**. It is refused, because a reason of at least 10 characters is mandatory.
5. **Known limitation (D6): the approver cannot type the Decision Reason.** The exception fields are writable only by the AP processor and admin. So the processor records the justification and the approver decides (maker/checker):
   - Impersonate `bcfa.ap.processor` (or stay as admin). Enter the **Decision Reason**, for example *"Receipt of 5 additional EA confirmed by warehouse, GRN to follow"*, and click **Update**.
   - Impersonate `bcfa.finance.approver` again and click **Approve Override**. Rehearse this; MT-AP-17 passed this way on 2026-10-05.
   - You are **overriding the AI's recommendation**, and the reason is recorded.
   - The exception is resolved.
   - An approval is requested in the owner's name and approved by you (maker/checker).
   - The invoice posts and closes.
6. **Say:** the AI identity cannot take this decision. The code refuses any `identity_type = ai_agent`, and the ATF regression suite proves it. The override shows up in the AI Interaction Log and in the AI acceptance rate.

### Act 4: Duplicate invoice, live upload (AP_INV_004_DUPLICATE.pdf)

1. Impersonate `bcfa.ap.processor` and open **Document Intake › New / Open**.
2. Create a new intake with Document Type **AP Invoice**, attach `AP_INV_004_DUPLICATE.pdf`, and click **Process Document**.
3. The intake completes and an invoice INV-AP-001 is created. It goes to EXCEPTION with a **duplicate** (high) exception: same vendor and same normalized invoice number as an existing INV-AP-001, whatever the amount.
4. Open the exception.
   - Optional, as `bcfa.finance.approver`: click **Approve Override**. It is **refused by policy**: duplicates are not an allowed override reason; only quantity, price and tax are.
   - Click **Reject Invoice** with a reason. The invoice moves to REJECTED.
5. **Say:** the extraction here is simulated; the duplicate control is real. After a rejection, a corrected resubmission is allowed.

### Act 5: Cash application, live remittances (POC 2)

**The story:** three bank lines arrived this morning with no remittance advice. The customer is unknown, so each one is parked in exception. The AI has already explained what is missing.

1. **Show the waiting payment.**
   - Impersonate `bcfa.ar.processor` and open **Cash Application › Payments**. BANK-POC2-001 (50,000 INR), -002 (80,000) and -003 (79,500) are all in EXCEPTION.
   - Open BANK-POC2-001 and its `customer_ambiguous` exception. There is no remitter name and no references.
2. **Exact match (AR_REMIT_101_EXACT.pdf).**
   - Create a Document Intake with type **AR Remittance**, attach the file, and click **Process Document**.
   - The intake completes with the message "Remittance linked to Payment BANK-POC2-001, which was waiting in exception; the AR Remittance Processing Flow identifies the customer and retries matching."
   - Refresh the payment after a few seconds:
     - the customer is *Sahyadri Tyre Works Pvt Ltd*, identified from the remitter name;
     - the exception is resolved;
     - the payment is matched to ARINV1001 and is at **PENDING_APPROVAL**.
3. **Multi-invoice (AR_REMIT_102_MULTI_INVOICE.pdf).**
   - Same steps. Expect BANK-POC2-002 matched to ARINV2001 + ARINV2002 = 80,000.
   - Show the **Now Assist match explanation** on the payment. It is advisory text for the reviewer and is never read by logic.
4. **Bank charge (AR_REMIT_103_BANK_CHARGE.pdf).**
   - Same steps. Expect BANK-POC2-003 matched to ARINV3001 + ARINV3002, with a residual of 500 and a **short pay** exception.
   - The *BCFA Cash Application Review* workflow adds an AI note classifying the residual (BANK_CHARGE).
   - On the exception, click **Approve Deduction** with Deduction Type **Bank Charge** and a reason. The amount is the computed residual; nobody types it. The payment moves to PENDING_APPROVAL.
   - Optional: first try **Credit Note Netting**. It is refused as not an allowed type.
5. **Approve and clear.**
   - **SoD beat (optional).** Stop impersonating. As yourself, open one of the seeded pending approvals (BANK-AR-004, 006, 007 or 008) and click **Approve**. It is refused: "the requester cannot approve their own request". Checked on 2026-09-29: the reset's approval flow recorded the account that ran the reset as the requester. **Say:** segregation of duties applies to admins too.
   - Impersonate `bcfa.finance.approver` and open **Cash Application › Approvals**.
   - Approve the three payments. Each one clears in Mock SAP with an `FB05…` reference and closes. The open items show 0 open.
6. **Say:**
   - The customer was never guessed. It came from the remitter name at the ≥ 0.95 confidence threshold, or from the single owner of every referenced invoice.
   - Cash is never allocated across currencies.
   - Allocated amount minus deductions must equal the payment, to within 0.01.

### Act 6: AI governance and audit

1. **AI & Audit › AI Interaction Log.** Show:
   - every AI run from this demo: skill or agent, provider `now_assist`, latency, guardrail action;
   - the human outcome (accepted or overridden);
   - one *refused / Blocked* row, from a remittance with injected instructions that was stopped before the call;
   - 3 refused, 0 failed of 228 Now Assist runs to date (Phase 30).
2. **AI & Audit › Audit Event.** Filter by the correlation ID of INV-AP-008 and walk from intake, through validation, match, approval with the SoD result and posting, to close. **Say:**
   - The audit trail is append-only.
   - Every state change is in it (100 % coverage in the scorecard).
   - Refused out-of-lifecycle transitions are recorded too.
3. **AI & Audit › POC Success Scorecard** (once Phase 30 is deployed). Show 18 metrics with proposed targets. All control and AI-safety metrics hold: no AI decision, no SoD violation, no duplicate write, no lifecycle bypass. Say that the automation rates reflect the exception-heavy demo set. The real read-out is a representative sample, against targets agreed with Birla Carbon (`POC_SUCCESS_METRICS.md`).

### Act 7: Close

**Recap:** two journeys end to end, controls in code, and AI that explains but never acts.

**Next steps:**
- Document Intelligence licensing, then training on real invoices and remittances.
- The SAP and bank connectors.
- Agree thresholds and targets with AP and AR owners.
- A two-week pilot on one entity's intake, measured by the scorecard.

## If something goes wrong

| Symptom | Likely cause | What to do |
|---|---|---|
| Upload goes to **Review Required**: "Simulated extraction has no values" | The file was renamed | Re-attach the fixture with its original name |
| Remittance goes to Review Required: "Payment … is already MATCHED/CLOSED…" | That journey was already used | Use another POC 2 file, or reset after the demo |
| Payment stays in EXCEPTION after the remittance | Flow still running (usually seconds) | Refresh after 10–20 s. If it is still there, open the exception: the resolution notes say why, for example "customer still not identified" |
| No AI note, or *Explain with Now Assist* spins | Now Assist is slow or unavailable | Show the note already on the record from the seeding run, and the AI Interaction Log. The pipeline does not depend on AI. |
| Approve is refused | SoD working as designed, e.g. the requester or processor is approving | Approve as `bcfa.finance.approver` |
| KPI cards look stale | Job runs every 15 min | Say so, or show the lists |

## Afterwards

Reset the demo data with step 1 of *The day before*, so that the next audience sees the same starting point. The reset keeps the audit trail and the AI Interaction Log.
