import { ScheduledScript } from '@servicenow/sdk/core'

// v5: fixes three more real bugs found by verifying v4's actual data against
// each scenario's intended outcome (not just checking that seeding "ran"):
//   1. AP-009/AP-010/AR-010 — the approval cascade Business Rules always
//      auto-post/auto-clear using the ACTIVE Integration Profile's failure
//      mode, so a later explicit postInvoice()/clearPayment() call with a
//      simulateOutcome override just replayed the cascade's own already-
//      successful result via the idempotency cache. Fixed by flipping the
//      profile immediately around the approval call instead.
//   2. AP-010's seed data set taxAmount: 0 for an India vendor (18% expected),
//      which failed tax validation before the invoice ever reached the
//      posting step this scenario is meant to demonstrate.
//   3. AR-006/007/008's fuzzy allocation always capped the allocated amount
//      to the payment amount, so a "short pay" could never actually be
//      detected — fixed to allocate the full open-item amount and let the
//      balance check see the real shortfall, plus fixed a swapped short_pay/
//      over_pay reason-code label, plus staggered AR Open Item due dates
//      (all previously identical) so multi-item due-date ordering is
//      actually meaningful (AR-008 needs the small item, not C001's larger
//      one, to be picked).
// Master data and scenario data were both fully wiped via MCP before this
// run so the fixes apply cleanly. See docs/BUILD_REPORT.md for the full story.
export const demoDataReseedJobV5 = ScheduledScript({
    $id: Now.ID['job-demo-data-reseed-v5'],
    name: 'BCFA - One-Time Demo Data Reseed (v5, cascade-timing + allocation fixes)',
    frequency: 'once',
    executionStart: '2026-09-13 15:39:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var seeder = new DemoDataSeeder();
        var result = seeder.seedAll();
        gs.info('BCFA-SEED-V5: ' + JSON.stringify(result));
    `,
})
