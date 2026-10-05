# Decision Tables for Configurable Policy (Phase 15)

Date: 2026-09-28
Status: **done** — three native Decision Builder tables built and verified on the instance (15/15 checks).

## How they were built (supported interface only)

Decision Builder has no Fluent SDK builder (SDK 4.12.1 ships only the `sn_dt` script API types), so
the tables are built by `scripts/deploy/phase15_decision_tables_bg.js` (run in scope
`x_695068_bcfa`) through the **supported scripted Decision Table API** — the same calls Decision
Builder's own `sn_decision_table` repositories and the platform's Document Intelligence code make:

| Step | API call |
|---|---|
| Table | `sn_dt.DecisionTableAPI.createDecisionTable({name, label, description, scope, accessibleFrom})` → multi-result table (`sys_decision_multi_result`) |
| Inputs | `sn_dt.DecisionTableBuilderAPI.createInput({model, label, element, internal_type, …})` |
| Grid columns | `sn_dt.DecisionTableAPI.createConditions(table, [{label, decisionInput, defaultOperator}])` |
| Outputs | `sn_dt.DecisionTableBuilderAPI.createAnswerElement({model, label, element, internal_type, reference})` |
| Answers | `sn_dt.DecisionTableAPI.findOrCreateMultipleAnswerRecord(table, {element: value, label})` |
| Rows | `sn_dt.DecisionTableBuilderAPI.createQuestion({decision_table, label, condition, answer, order})` |

No decision-table record is inserted or edited directly. The script is idempotent (existing tables are
left alone; `REBUILD = true` deletes through the same API and rebuilds; a table without rows is
rebuilt automatically) and ends with a verification that evaluates every table through `FinancePolicy`.
The tables live on the instance (like the Now Assist skills) and reach git through Studio
**Commit Changes**; the build script is the reproducible source.

## Tables (all values POC ASSUMPTION; rows evaluated first match, in order)

**BCFA AP Tolerance** — inputs `company`, `country`, `vendor_type`, `invoice_type`;
outputs `quantity_tolerance_pct`, `price_tolerance_pct`, `tax_tolerance_abs`, `tax_tolerance_pct`.

| Order | Condition | Quantity | Price | Tax abs | Tax % |
|---|---|---|---|---|---|
| 100 | `vendor_type=strategic` (example; no vendor has this type yet) | 0.05 | 0.02 | 1 | 0.02 |
| 200 | Default | 0.02 | 0.02 | 1 | 0.02 |

**BCFA AP Approval** — inputs `amount`, `exception_type` (`none` for a clean invoice), `variance_pct`,
`company`; outputs `approval_required`, `approval_group` (reference to a group).

| Order | Condition | Required | Group |
|---|---|---|---|
| 100 | Tolerance exception (quantity, price, tax, line total) with variance > 10% | true | BCFA Finance Controllers |
| 200 | Amount > 1,000,000 | true | BCFA Finance Controllers |
| 300 | Default | true | BCFA Finance Approvers |

**BCFA AR Deduction** — inputs `deduction_type`, `amount`, `company`; outputs `allowed`,
`approval_required` (needs a finance approver), `approval_group`.

| Order | Condition | Allowed | Approver needed | Group |
|---|---|---|---|---|
| 100 | Bank charge, TCS or credit note, amount ≤ 5,000 | true | false | BCFA Cash Application |
| 200 | Those types above 5,000, or any short pay | true | true | BCFA Finance Approvers |
| 300 | Any other type (e.g. unapplied cash) | false | true | BCFA Finance Approvers |

## How the app uses them

`FinancePolicy.decide()` finds a table by name in the app scope and evaluates it with
`sn_dt.DecisionTableAPI.getDecision`. If the table is missing, no row matches, or it cannot be read,
the matching `x_695068_bcfa.*` properties apply (logged as a warning), so a control is never off.

| Use | Where | Inputs |
|---|---|---|
| 3-way match tolerances | `MatchingEngine.threeWayMatch` → `FinancePolicy.apTolerances(context)` | invoice company code, vendor country, vendor type (`standard` until vendors carry one), invoice type (`po` / `non_po`) |
| AP approval routing | `ApDomainService.routeForApproval`, `ApExceptionDecisionService` (override) → `FinancePolicy.apApprovalDecision` | gross amount, exception type, variance %, company; the group is recorded on the AP Approval (`approval_group`) |
| AR deduction | `ArExceptionDecisionService` (Approve Deduction) → `FinancePolicy.arDeductionDecision` | deduction type, residual amount, customer company |

The exception evidence and approval audit name the table and row that decided.

## Verification (`BCFA_DT`, all PASS)

Tolerance default 0.02 and strategic vendor 0.05 from the table; clean 5,900 invoice → approval by
Finance Approvers; quantity override at 50% → Finance Controllers; price override at 5% → Finance
Approvers; 2,500,000 → Finance Controllers; bank charge 500 allowed without approver; bank charge
7,000 and short pay 300 need an approver; unapplied cash not allowed; every source reported as the
decision table (not the fallback).

## Behaviour changes and notes

- Tolerance overrides above 10% variance and invoices above 1,000,000 are now routed to
  **BCFA Finance Controllers** (the Phase 12 quantity override at 50% would route there). The group is
  recorded now; **membership is enforced in Phase 17** (group-based approval).
- An **unexplained short pay** now needs a finance approver at any amount (previously an AR processor
  could accept it up to 5,000).
- `ap.approval.auto_approve_limit`, `ar.deduction.allowed_types` and
  `ar.deduction.approval_threshold` remain as the **fallback** only.
- Vendors have no type field yet; `vendor_type` is `standard` for every invoice, so the strategic row
  is an example until one is added. Credit notes have no currency (see Phase 14).
- The AR clearing approval rule (`ar.approval.auto_approve_limit`) was not part of the brief's
  examples and stays a property.
