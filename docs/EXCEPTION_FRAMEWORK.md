# Unified Exception Framework (Phase 16)

Date: 2026-09-28
Status: **done** — deployed and verified live.

## Design

AP and AR exceptions stay in their own tables (`x_695068_bcfa_ap_exception`, `x_695068_bcfa_ar_exception`):
the AP and AR agentic workflows trigger on them and the decision services act on them. The framework is
**shared code plus identical fields**: every lifecycle step goes through `ExceptionEngine`, and both tables
carry the same framework fields and display the exception number.

Native task SLAs (`contract_sla` / `task_sla`) require task-based tables; these tables are not task
extensions and cannot be re-parented in place. SLA timing is therefore done by the engine's hourly sweep.
Moving exceptions onto `task` (native SLA, assignment rules, inbox) is the recommended production remodel.
The generic `x_695068_bcfa_finance_exception` table is unused and left in place.

## Fields (spec → field)

| Spec | Field | Set by |
|---|---|---|
| Exception number | `number` (APEX0001001…, AREX0001001…; the record's display value) | `sys_number` counters (APEX / AREX), engine |
| Process | `process` (ap / ar) | engine |
| Source transaction | `ap_invoice` / `payment` | domain services |
| Type / subtype | `reason_code` / `subtype` (e.g. exact_duplicate, same_number_different_amount, suggested_bank_charge, multiple_exact_options) | domain services |
| Severity / priority | `severity` (policy) / `priority` (1–4 from severity, raised per escalation level) | engine |
| Owner / assignment group | `assigned_to` / `assignment_group` (policy defaults) | engine |
| Status | `status` (open, in review, resolved, closed) | engine, decision services |
| SLA / opened / due | `sla_status` (on track, at risk ≥75%, breached, met, missed) / `opened_at` / `sla_due` | engine, sweep |
| Aging / escalation | `aging_bucket` (<1d, 1–3d, 3–7d, >7d) / `escalation_level` (0–2) | sweep |
| Evidence / rule result | `evidence` / `rule_result` | domain services (deterministic) |
| AI explanation / recommendation / confidence | `ai_explanation` / `ai_recommendation` / `ai_confidence` | AI note saved by the agentic workflow; explanation and confidence split from it (best effort) |
| Resolution / resolution reason | `resolution_notes` / `resolution_code` (override approved, rejected, deduction approved, corrected and retried, withdrawn, other) + `decision_reason` | engine, decision services |
| Resolved by / date | `resolved_by` / `resolved_at` (the owner is no longer overwritten) | engine |
| Correlation ID | `correlation_id` (from the invoice / payment) | engine |

## Automation

| Need | Implementation |
|---|---|
| Assignment | On creation: policy group and owner (`ap/ar.exception.assignment_group`, `default_owner`); backfilled for older open exceptions |
| SLA | Due date from severity (`ap/ar.exception.sla_hours`); status by the sweep and on resolution (met / missed) |
| Aging | Hourly sweep sets the aging bucket |
| Escalation | Level 1 at SLA breach (owner + group notified); level 2 at twice the SLA (plus BCFA Finance Controllers); priority raised one step per level; audited |
| Notification | Events `x_695068_bcfa.<ap|ar>_exception.assigned` / `.escalated` and four email notifications sending to the users in parm1 |
| Dashboard | Workspace dashboard tab **Exceptions**: AP/AR SLA breached, AP/AR escalated, open by aging, open by priority |

Job: **BCFA - Exception SLA and Escalation Sweep** (hourly). With an explicit `timeZone: 'UTC'` the
platform's "Adjust Time Based on Time Zone" rule refused to create the job trigger; the job has no explicit
time zone (trigger confirmed, hourly from 10:00).

## Verification (live)

- Deploy `phase16_exceptions_bg.js`: 26 columns added (the two `number` columns were created by the platform
  when the counters were created, with native auto-numbering), 56 records, APEX/AREX counters.
- Backfill: all 14 AP and 11 AR exceptions numbered; AI notes split (e.g. APEX0001013 confidence high with
  its explanation); open exceptions without an owner: 0 AP, 0 AR after the second backfill.
- Sweep: the overdue open demo exceptions (8 AP, 2 AR) breached their SLA and were escalated to level 2.
- TEST16 AREX0001012: created with number, priority 3, opened, SLA due (+24h), on track, owner BCFA Demo AR
  Processor, group BCFA Cash Application, correlation id; **assigned** event processed (owner). Aged past
  twice its SLA and swept: breached, 3–7 days, level 2, priority 1; **escalated** event processed (level 2,
  recipient AR processor). Resolved as withdrawn: closed, resolution code Withdrawn, resolved by/at set, SLA
  missed, owner unchanged.

## Findings

- The first sweep's escalation events for pre-Phase-12 exceptions had no recipients (no owner, group, or
  Controllers members); fixed by the backfill assigning policy defaults.
- **BCFA Finance Controllers has no members** (level 2 adds nobody yet) — Phase 17 approval groups.
- Demo users have no email addresses, so notifications produce no email; the events are the evidence.
- The two daily "aging escalation" flows only log a count and are superseded by the sweep; review in
  Phase 25.
- AI explanation/confidence are parsed from the note; structured fields from the agents would be more
  robust (Phase 20, AI execution log).
- Reloading dictionary XML for an existing column (reason_code) failed ("Length change not allowed"); the
  display flags were set directly instead.
