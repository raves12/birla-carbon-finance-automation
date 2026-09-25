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
