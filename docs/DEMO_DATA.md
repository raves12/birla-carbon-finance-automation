# Demo Data (Phase 3 / Phase 27)

Date seeded: 2026-09-25
Instance: `pwcmanagementservicesdemo01.service-now.com`
Mechanism: `DemoDataSeeder.seedAll()` (existing, idempotent, pre-built script
include — reused as-is, not rewritten). Invoked via a one-time
`sysauto_script` record created directly through the Table API (the
Fluent-authored `ScheduledScript()` jobs already on this instance from the
original build never actually fired — no corresponding `sys_trigger` was
ever generated for them when they were applied via raw-XML import; a
freshly-inserted `sysauto_script` record created through a normal REST
insert **did** get picked up by the scheduler correctly). The one-time job
used for this run has been deactivated (`active=false`) after confirming it
fired — it's inert now, harmless to leave in place or delete later.

## Synthetic-data marking convention

This app has no `is_demo` boolean field on any table. Rather than add one
retroactively across ~10 tables (a schema change with no functional
benefit), every seeded record already uses a clearly synthetic, immediately
recognizable code scheme that `DemoDataSeeder` itself relies on for its own
idempotency checks — this scheme is the "equivalent" marking the work order
allows in place of a literal `is_demo` field:

- Vendors: `V001`–`V010` — Customers: `C001`–`C010`
- Purchase Orders: `PO0001`–`PO0010` — Receipts: `RCPT0001`–`RCPT0010`
- AR Open Items: `ARI0001`–`ARI0015` — Credit Notes: `CN0001`–`CN0005`
- AP scenarios: invoice number `INV-AP-001`–`INV-AP-010`
- AR scenarios: bank reference `BANK-AR-001`–`BANK-AR-010`

## Demo reset (Phase 28)

`DemoDataSeeder.resetAndReseed('RESET BCFA DEMO DATA')` puts the application's data back to this baseline. Run it with
`scripts/deploy/phase28_reset_and_reseed_bg.js` (Scripts - Background, scope x_695068_bcfa). It reports each scenario's
end state against the tables below.

| | What happens |
|---|---|
| **Deleted** | Every AP invoice and payment, with their lines, extractions, matches, exceptions, approvals, remittances, match candidates, allocations and deductions. Also integration transactions, document intakes (and their attachments), finance exceptions and KPI rows. Also master rows outside the seeded baseline: POs, PO lines, receipts, open items and credit notes whose code is not in the lists above (test data) |
| **Restored** | Master data is upserted by business key (vendor code, PO number, item number and so on). Existing rows keep their sys_id, so reference mappings stay valid, and get their seeded values back, for example an open item's open amount after a clearing consumed it. The integration profiles go back to `failure_mode: success` |
| **Re-seeded** | The 10 AP and 10 AR scenarios (`seedAll`, inline orchestration) |
| **Kept** | The audit trail (append-only; the reset adds one audit event recording what it deleted) and the decision log. The AI Interaction Log is kept as governance evidence unless `x_695068_bcfa.demo.reset_clears_ai_log` is `true`. Configuration is kept: vendors, customers, aliases, integration profiles, reference mappings |

**Safeguards**

- The reset needs the exact confirmation text `RESET BCFA DEMO DATA`.
- It runs only while `x_695068_bcfa.demo.reset_enabled` is `true`. That is the default on this POC instance; set it to
  `false` wherever data must never be reset.
- A plain `seedAll()` still never re-seeds over existing scenarios. It skips when INV-AP-001 / BANK-AR-001 exist.

Seeding runs inline (Phase 25), so each scenario lands in one call. It also runs under lifecycle enforcement (Phase 26),
and a refused transition stops the seed with an error. The Phase 25 flows still trigger on the seeded records. Each flow
stage checks the record's state and skips, because the inline chain has already moved the record on.

### First reset and re-seed (2026-09-28)

**The reset.** It deleted 27 AP invoices and 27 payments, with everything attached to them. It also deleted:

- 15 document intakes and their 15 attachments
- 64 integration transactions
- 19 KPI rows
- 24 non-baseline open items, 3 test POs and 1 test credit note

1,346 audit events were kept. The script was started twice, so the audit trail shows two reset events 27 seconds
apart; the second one removed the first run's freshly seeded scenarios before seeding them again.

**The re-seed.** It ran under the Phase 25 flows and Phase 26 lifecycle enforcement:

- 9 of 9 AP invoice numbers (10 scenarios) and 9 of 10 AR scenarios landed as documented
- no lifecycle refusal
- every flow triggered by the seeded records completed and skipped its stage, because the inline chain had already
  moved the record on; states were unchanged afterwards

**AR-004 ended in EXCEPTION** (`customer_ambiguous`), not PENDING_APPROVAL. The seeded alias *LONE STAR TYRE CO* → C005
had confidence 0.9. Since Phase 14, an alias below the auto-match threshold (0.95) no longer resolves the customer on
its own. The documented end state predates that rule. The alias is master data, so it is now seeded as a confirmed
alias with confidence 1.0. The threshold control itself is unchanged.

AR-006/007/008 still end at PENDING_APPROVAL, as noted above.

### Second reset and re-seed (2026-09-28, with the alias fix)

**All 20 scenarios landed as documented:** 9 of 9 AP invoice numbers (10 scenarios) and 10 of 10 AR scenarios.

**The flows add approval requests after seeding.** The seeder leaves AR-004, 006, 007 and 008 at PENDING_APPROVAL
without an approval request. The AR Approval Flow, triggered by that state, routes each one through the configured
approval rule and creates one pending approval request (created by `system`). So after a reset, every payment waiting
for approval has exactly one pending request for a presenter to act on. There are no duplicates: the flow step skips a
payment that already has a pending approval, which is how AR-009's request from the seeder is left alone.

After a reset, the audit trail keeps the earlier runs' events, and the AI Interaction Log is kept by default. Filter
the audit list by date, or by the correlation IDs of the current records, to see only the current run.

## Master data (confirmed live)

10 vendors, 10 customers, 10 POs (+ 1 line each), 10 receipts, 15 AR open
items, 5 credit notes, 1 customer alias (`LONE STAR TYRE CO` → C005), 3
Integration Profiles (Mock SAP / Mock Bank / Mock Archive, all
`failure_mode: success` at rest — the seeder flips these temporarily during
AP-009/010 and AR-010 and restores them afterward; confirmed restored).

## AP demo scenarios (confirmed live)

| # | Invoice | Scenario | Landed state |
|---|---|---|---|
| AP-001 | INV-AP-001 | Clean 3-way match, happy path | CLOSED / posted |
| AP-002 | INV-AP-001 (dup) | Duplicate invoice | EXCEPTION |
| AP-003 | INV-AP-003 | PO mismatch | EXCEPTION |
| AP-004 | INV-AP-004 | Quantity tolerance failure | EXCEPTION |
| AP-005 | INV-AP-005 | Price tolerance failure | EXCEPTION |
| AP-006 | INV-AP-006 | Tax validation failure | EXCEPTION |
| AP-007 | INV-AP-007 | Low extraction confidence | EXCEPTION |
| AP-008 | INV-AP-008 | Approval required | PENDING_APPROVAL |
| AP-009 | INV-AP-009 | SAP posting failure | FAILED / posting failed |
| AP-010 | INV-AP-010 | SAP timeout → reconciled | CLOSED / posted |

## AR demo scenarios (confirmed live)

| # | Bank Ref | Scenario | Landed state |
|---|---|---|---|
| AR-001 | BANK-AR-001 | Exact match | CLOSED |
| AR-002 | BANK-AR-002 | Partial payment | EXCEPTION |
| AR-003 | BANK-AR-003 | Multi-invoice allocation | CLOSED |
| AR-004 | BANK-AR-004 | Customer alias resolution | PENDING_APPROVAL |
| AR-005 | BANK-AR-005 | Unmatched payment | EXCEPTION |
| AR-006 | BANK-AR-006 | Short pay | PENDING_APPROVAL* |
| AR-007 | BANK-AR-007 | Bank charge deduction | PENDING_APPROVAL* |
| AR-008 | BANK-AR-008 | Credit note netting | PENDING_APPROVAL* |
| AR-009 | BANK-AR-009 | Approval required | PENDING_APPROVAL |
| AR-010 | BANK-AR-010 | Clearing timeout → reconciled | CLOSED |

\* AR-006/007/008 were designed (per the seeder's own code comments) to pass
through an `ALLOCATION_EXCEPTION` intermediate state that the seeder then
resolves programmatically (recording a deduction/override and advancing to
CLOSED). On this run they stopped one step earlier, at `PENDING_APPROVAL`,
instead — a valid, functioning state (not a broken record), just short of
the fully-resolved narrative the code comments describe. Low priority: these
three are still perfectly usable to demo the short-pay/bank-charge/
credit-note-netting *review* experience; only the "reviewer resolves and it
clears automatically" tail end doesn't replay identically on this instance.
Worth a closer look during Phase 13 (Cash Application journey testing) but
not a Phase 3 blocker.

## Not seeded (intentionally deferred)

`DemoDataSeeder.seedClaudeDemoScenarios()` (AP-BC-1001/1002, CASH-BC-0001/2)
was **not** run. It's a Claude-specific demo dataset built for the prior
Finance Document Intake work, and Phase 34 of this program removes Claude as
an active runtime dependency — seeding more Claude-branded demo data now
would just need to be relabeled or removed again shortly. Revisit once the
native-AI replacement for Finance Document Intake (Phase 5) exists, with an
equivalent native-AI demo dataset if still useful at that point.
