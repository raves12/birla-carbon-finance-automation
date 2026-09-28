# FINANCE_OPERATIONS_WORKSPACE.md — Birla Carbon Finance Automation

Phase 24. Deployed and verified on 2026-09-28 (`scripts/deploy/phase24_workspace_bg.js`, `phase24_verify_bg.js`).

The existing **BCFA Workspace** (`/now/bcfa`) was enhanced. No new workspace was created.

## Landing page: Finance Operations

The dashboard's first tab is **Finance Operations**, with 19 KPI cards. The existing *Overview* and *Exceptions* tabs
follow it.

- **Counts** read the records live.
- **Rates and averages** come from `x_695068_bcfa_kpi`: straight-through rate, auto-match rate, AI acceptance, average
  exception age, and low-confidence documents (which spans three tables). A count cannot express these.
  `FinanceKpiService` recomputes all 19 KPIs every 15 minutes (*BCFA - Finance KPI Refresh*) and on demand, and records
  how each value was computed.

| Card | Definition | Source | Value on 2026-09-28 |
|---|---|---|---|
| AP · Invoices received | All AP invoices | live | 24 |
| AP · Invoices posted | Posting state Posted | live | 9 |
| AP · Straight-through rate | Posted invoices that never had an exception ÷ posted invoices | KPI | 77.78% (7 of 9) |
| AP · Open exceptions | AP exceptions open or in review | live | 12 |
| AP · Pending approvals | AP approvals awaiting a decision | live | 1 |
| AP · Avg exception age | Mean hours since opened, open AP exceptions | KPI | 53.19 h |
| AR · Payments received | All payments | live | 24 |
| AR · Payments matched | Payments in a state reached only after a match | live | 21 |
| AR · Unapplied cash (INR) | Sum of INR payments not yet cleared. Other currencies are listed in the KPI detail, not converted | live | 199,724 (plus EUR 43,000, USD 30,000) |
| AR · Auto-match rate | Payments matched and allocated without any exception ÷ payments that went through matching | KPI | 45.83% (11 of 24) |
| AR · Open exceptions | AR exceptions open or in review | live | 5 |
| AR · Pending approvals | AR approvals awaiting a decision | live | 2 |
| AI · AI-assisted reviews | Exception reviews completed by an agentic workflow or *Explain with Now Assist* | live | 7 |
| AI · Recommendation acceptance | Accepted ÷ (accepted + overridden) AI outputs a person decided on (AI Interaction Log) | KPI | 40% (2 of 5) |
| AI · Overrides | AI outputs a person overrode, with a reason | live | 3 |
| AI · Low-confidence documents | Extraction confidence below the review threshold (0.85) across AP extractions, remittances and document intakes | KPI | 1 |
| Integration · Failures | Transactions failed / technical error / validation error | live | 2 |
| Integration · UNKNOWN_OUTCOME | Writes with an unknown outcome, not yet reconciled | live | 2 |
| Integration · Pending reconciliation | Unknown-outcome transactions waiting for a status query | live | 0 |

The values come from the POC test data, so they reflect test runs, not a business baseline.

## AP workspace (Accounts Payable)

| List | Content |
|---|---|
| Invoice Queue | Invoices not yet posted, closed or rejected |
| Invoice Review | Invoices that need a person: exception, on hold, resolution, unknown outcome, failed |
| Exceptions | AP exceptions open or in review: number, reason, severity, priority, SLA, owner, AI confidence |
| Approvals | AP approvals awaiting a decision |
| Integration Status | Integration transactions of AP invoices: operation, status, attempt, reconciliation, SAP document, error |
| Posted Invoices | Posting state Posted, with the SAP document |

**Invoice review.** The invoice form and workspace record page open with a read-only **Review Summary**, built by
`FinanceReviewSummary`:

- document and file (from Document Intake)
- extraction source and confidence
- invoice
- PO
- lines against PO lines and GRN
- match comparison and variances
- tolerances applied, with their source (decision table or properties)
- exceptions, with rule result, SLA and decision
- AI explanation, confidence and recommendation (marked advisory)
- approval, with segregation-of-duties result
- integration, with SAP document
- audit (event count and last event)

The related lists hold the detail: lines, extraction, match, exceptions, approvals, integration transactions, audit
events and document intake. New in Phase 24 is **AI Interactions**: every AI run in the correlation chain, with its human
outcome.

## Cash Application workspace

| List | Content |
|---|---|
| Payments | All payments |
| Remittances | Remittances with reference, payment, source, received date, confidence |
| Open Items | Customer open items with an open amount |
| Match Candidates | Remittance / exact / combination / fuzzy candidates, rank, confidence, selected |
| Allocations | Allocations not reversed |
| Deductions | Deductions with type, amount, credit note, status, approver |
| Exceptions | AR exceptions open or in review |
| Approvals | AR approvals awaiting a decision |
| Clearing Status | Integration transactions of payments |

**Payment review.** The payment form opens with a Review Summary covering:

- payment
- remittance and its extracted (Content Understanding) fields
- customer, and how it was identified
- the customer's open items
- recommended match (candidates, ranked, selected)
- allocation
- residual, with the arithmetic
- deductions
- AI match explanation
- exceptions, with AI explanation and recommendation
- approval
- clearing
- audit

Related lists: remittances, allocations, match candidates, exceptions, approvals, integration transactions, audit events,
document intake, and AI Interactions (new).

**Keeping it current.** The Review Summary is refreshed on every state change (`Ap/ArDomainService._setState`) and when
an AI note is saved. It is written with `setWorkflow(false)`, so a display field never triggers business rules such as the
approval cascade.

## Access

- The workspace audience is unchanged: admin, AP/AR processors, finance reviewer, finance approver, auditor, read-only.
- Phase 24 lets **AP/AR processors and finance approvers read** the audit events, integration transactions and AI
  Interaction Log of what they review. Before, only auditor, read-only, finance reviewer and admin could.
- The AI agent role (`x_695068_bcfa.ai_agent`) still cannot read any of them.
- The KPI table is readable by the workspace audience and written only by `FinanceKpiService`.

## Notes

- The new scoped table `x_695068_bcfa_kpi` is created by the deploy preamble, which switches the session to the BCFA
  application for the insert. The platform appends a new column to the end of the default form, so the postamble moves
  the Review Summary to the top (position −1).
- **Audit "last event" on older records.** Events written before Phase 19 were backfilled with a second-precision
  `event_sequence`. For those records, the "last event" may be any event from the final second. Events written since
  Phase 19 are ordered to the millisecond.
