import { ScheduledScript } from '@servicenow/sdk/core'

// v6: fixes the third bug found by fully verifying v5's AR-010 outcome
// (state stuck at CLEARING instead of reaching CLOSED). Root cause:
// ArDomainService.reconcileClearing's RETRY branch set Payment state to
// 'CLEARING' before calling clearPayment() again, but clearPayment()'s own
// eligibility gate requires state === 'APPROVED' (Payment has no separate
// approval_state field the way AP Invoice does) — so the retry failed its
// own gate and the payment was stuck forever. Fixed by restoring state to
// 'APPROVED' before the retry call instead. All demo data wiped via MCP
// before this run. See docs/BUILD_REPORT.md for the full story.
export const demoDataReseedJobV6 = ScheduledScript({
    $id: Now.ID['job-demo-data-reseed-v6'],
    name: 'BCFA - One-Time Demo Data Reseed (v6, AR clearing-retry gate fix)',
    frequency: 'once',
    executionStart: '2026-09-13 15:56:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var seeder = new DemoDataSeeder();
        var result = seeder.seedAll();
        gs.info('BCFA-SEED-V6: ' + JSON.stringify(result));
    `,
})
