import { ScheduledScript } from '@servicenow/sdk/core'

// v4: run against a fully wiped transactional data set (all v1/v2/v3 AP
// Invoice/Payment/child/Integration Transaction/Audit Event rows deleted via
// MCP record_delete_by_query) with the real root cause now fixed —
// DemoDataSeeder.seedAll() guards AP/AR scenario seeding the same way it
// already guarded master data, so a re-run against pre-existing scenario
// data skips rather than re-inserting under the same fixed keys and tripping
// its own duplicate-detection. See docs/BUILD_REPORT.md for the full story.
export const demoDataReseedJobV4 = ScheduledScript({
    $id: Now.ID['job-demo-data-reseed-v4'],
    name: 'BCFA - One-Time Demo Data Reseed (v4, idempotency fix, clean slate)',
    frequency: 'once',
    executionStart: '2026-09-13 14:05:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var seeder = new DemoDataSeeder();
        var result = seeder.seedAll();
        gs.info('BCFA-SEED-V4: ' + JSON.stringify(result));
    `,
})
