# POC Success Metrics (Phase 30)

The scorecard answers one question from the live records: does the POC do what it set out to do? It has 18 metrics in five pillars. Each metric has a **proposed** target and a status. The targets have not been agreed with Birla Carbon and none is a contractual figure.

| Where | What |
|---|---|
| `FinancePocScorecard` (script include) | `compute()` only reads. `refresh()` also saves one row per metric. |
| `x_695068_bcfa_poc_metric` (table) | One row per metric: value, unit, target rule, proposed target, status, sample size, how it was computed, and when. |
| Workspace list **AI & Audit › POC Success Scorecard** | The saved rows. |
| KPI refresh job (every 15 minutes) | Runs `refresh()` after the dashboard KPIs. |

Each metric gets one of these statuses:

- **met**: the value meets the proposed target.
- **not_met**: the value does not meet the proposed target.
- **no_data**: nothing to measure yet, because the sample is 0.
- **info**: the metric has no target.

## Definitions

### Automation

| Code | Metric | Definition | Proposed target |
|---|---|---|---|
| `ap_first_pass_rate` | AP first-pass rate | Share of AP invoices past intake (not RECEIVED/EXTRACTING/EXTRACTED/VALIDATING) that have no AP exception | ≥ 70 % |
| `ap_stp_rate` | AP straight-through rate | Share of posted AP invoices that have no AP exception | ≥ 60 % |
| `ap_human_touches` | Human actions per posted invoice | Audit events with `actor_type=user` on the correlation chain, divided by the number of posted invoices. An approval decision counts as one. | ≤ 1.5 |
| `ar_auto_match_rate` | AR auto-match rate | Share of payments that went through matching (not RECEIVED/NORMALIZED/CUSTOMER_RESOLUTION/MATCHING) with no AR exception | ≥ 70 % |

### Speed

| Code | Metric | Definition | Proposed target |
|---|---|---|---|
| `ap_cycle_time_p50` | AP cycle time, median | Hours from invoice created to the first audit event into POSTED | ≤ 24 h |
| `ar_cycle_time_p50` | AR cycle time, median | Hours from payment created to the first audit event into CLEARED | ≤ 24 h |
| `exception_sla_attainment` | Exception SLA attainment | Share of AP and AR exceptions with an SLA status that is not `breached` or `missed` | ≥ 90 % |

### Control

| Code | Metric | Definition | Proposed target |
|---|---|---|---|
| `audit_coverage` | Audit coverage of state changes | Share of invoices and payments that left RECEIVED and have a state change in the audit trail | 100 % |
| `sod_violations` | Segregation-of-duties violations | Decided approvals where the approver is the requester or an AI identity | 0 |
| `lifecycle_bypasses` | Out-of-lifecycle state changes that got through | Lifecycle audit events with result `MONITORED`. Enforcement refusals (`REFUSED`) are reported in the detail. | 0 |
| `duplicate_postings` | Duplicate financial writes | Idempotency keys with more than one successful integration write | 0 |
| `unknown_outcome_resolved` | Unknown outcomes reconciled | Share of unknown-outcome integration writes that are no longer `pending` (confirmed, or escalated to a person) | 100 % |

### AI safety

| Code | Metric | Definition | Proposed target |
|---|---|---|---|
| `ai_financial_actions` | Financial decisions made by AI | Approval or exception decisions recorded with an AI identity (`identity_type=ai_agent`) as the decider | 0 (hard rule) |
| `ai_guardrail_interventions` | Guardrail interventions | AI executions that were sanitized or blocked, by the BCFA guardrail or by Now Assist Guardian | Information only |
| `ai_failure_rate` | Now Assist execution failure rate | Now Assist executions that ended in an error or timeout. Guardrail refusals are not failures. The legacy Claude path is excluded: it fails with `credential_error` by design and is removed in Phase 34. | ≤ 5 % |

### AI value

| Code | Metric | Definition | Proposed target |
|---|---|---|---|
| `ai_exception_coverage` | Exceptions with AI advice | Share of AP and AR exceptions that carry an AI recommendation (advisory only) | ≥ 80 % |
| `ai_acceptance_rate` | AI recommendation acceptance | Accepted, divided by (accepted + overridden), over AI outputs a person decided on | ≥ 60 % |
| `ai_latency_p50` | Now Assist skill latency, median | Median `latency_ms` of successful Now Assist calls | ≤ 5000 ms |

## First results (2026-09-29, demo data)

I ran `compute()` read-only on pwcmanagementservicesdemo01 in scope `x_695068_bcfa`. The data behind these results is:

- the 20 seeded demo scenarios, after the Phase 28 reset;
- the Phase 29 ATF and AI-evaluation runs.

**These results are not a performance measurement.** The demo set is designed to show exceptions, so it is exception-heavy by construction.

**Automation**

| Metric | Value | Sample | Status |
|---|---|---|---|
| AP first-pass rate | 30 % | 3 of 10 | not met |
| AP straight-through rate | 100 % | 2 of 2 | met |
| Human actions per posted invoice | 2.0 | 4 events over 2 invoices | not met |
| AR auto-match rate | 50 % | 5 of 10 | not met |

**Speed**

| Metric | Value | Sample | Status |
|---|---|---|---|
| AP cycle time, median | 0 h | 2 | met |
| AR cycle time, median | 0 h | 3 | met |
| Exception SLA attainment | 66.67 % | 8 of 12 | not met |

**Control**

| Metric | Value | Sample | Status |
|---|---|---|---|
| Audit coverage | 100 % | 20 of 20 | met |
| SoD violations | 0 | 6 decided | met |
| Lifecycle bypasses | 0 | 2 refused by enforcement | met |
| Duplicate financial writes | 0 | 11 keys | met |
| Unknown outcomes reconciled | 100 % | 1 of 1 | met |

**AI safety**

| Metric | Value | Sample | Status |
|---|---|---|---|
| Financial decisions made by AI | 0 | — | met |
| Guardrail interventions | 49 | of 292 executions | info |
| Now Assist failure rate | 0 % | 0 of 228 | met |

**AI value**

| Metric | Value | Sample | Status |
|---|---|---|---|
| Exceptions with AI advice | 100 % | 12 of 12 | met |
| AI acceptance | 72.73 % | 16 of 22 | met |
| Now Assist latency, median | 1885 ms | 225 | met |

Reading these results:

- **All the control and AI-safety metrics hold.**
  - No AI decision.
  - No SoD violation.
  - No duplicate write.
  - No lifecycle bypass.
  - Full audit coverage.

  These are the metrics that must hold at any volume.
- **The automation rates show the scenario mix, not performance.** Of the 10 AP scenarios, 7 are built to raise an exception: duplicate, PO mismatch, quantity, price, tax, low extraction confidence, and SAP posting failure. Of the 10 AR scenarios, 5 raise one, for example partial payment, unmatched payment and short pay. On the seeded data, first-pass and auto-match can never exceed 30 % and 50 %.
- **Human touches:** the value comes from 2 posted invoices (4 user audit events), which is too small a sample to judge.
- **Cycle time** is 0 h because the demo seeds each scenario inline in seconds. It becomes meaningful only with real intake.
- **SLA attainment:** the demo exceptions are left open so they can be shown, and after a few days 4 of them have breached their SLA.
- **AI:** the 27 failed executions on record are all legacy Claude calls from 2026-09-25 (`credential_error`, no key), which is why the failure rate counts Now Assist only. The 3 Now Assist refusals are guardrail blocks, not failures.

For a real POC read-out, run the scorecard over a representative sample of real invoices and remittances (for example, two weeks of one entity's intake), then agree the targets with Birla Carbon's AP/AR owners before that run.

## Deploy

1. Run `scripts/deploy/phase30_scorecard_bg.js` in Scripts - Background, with scope set to **global**. The script:
   - creates the table;
   - loads the script include, the ACL, the list and the updated KPI job;
   - runs `refresh()` once;
   - prints a `PHASE30` line.

   It is safe to re-run.
2. To regenerate the script after a change:

   ```
   node scripts/deploy/gen_record_loader.mjs scripts/deploy/phase30_scorecard_bg.js --si FinancePocScorecard --preamble scripts/deploy/preambles/phase30_poc_table.js --postamble scripts/deploy/preambles/phase30_poc_postamble.js --columns x_695068_bcfa_poc_metric=code,label,pillar,value,unit,comparator,target_value,status,sample_size,detail,computed_at --choices x_695068_bcfa_poc_metric --files '^(sys_documentation_x_695068_bcfa_poc_metric__en|sys_security_acl_0bd5e3e8a4ab4d8583dc12588e33ec47|sys_security_acl_role_(7c6fd38a|82012682|87030cac|94472a76|a8a4dc43|c68cfaec|f7b60f39)|sys_ux_list_219cfe7b45aa4cdbbd0b9a2f018c9103|sys_ux_applicability_m2m_list_da6045c9760248ebae850171e54570e8|sysauto_script_e06fcfa703f046698cf31d3a7aeb209e)'
   ```
