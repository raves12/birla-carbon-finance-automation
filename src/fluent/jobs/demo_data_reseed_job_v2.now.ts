import { ScheduledScript } from '@servicenow/sdk/core'

// Re-run after fixing the ApDomainService.decideApproval ordering bug (see
// docs/BUILD_REPORT.md) that the first seed run (job-demo-data-seed) hit.
// Master data seeding is skipped automatically (DemoDataSeeder guards on
// vendor V001 already existing); this adds a fresh, correct set of AP-001..
// 010 / AR-001..010 scenario records. The original run's records are left
// in place rather than deleted (deleting them was correctly blocked as a
// bulk destructive operation) — see docs/BUILD_REPORT.md for which records
// are the ones to reference.
export const demoDataReseedJobV2 = ScheduledScript({
    $id: Now.ID['job-demo-data-reseed-v2'],
    name: 'BCFA - One-Time Demo Data Reseed (v2, post-fix)',
    frequency: 'once',
    executionStart: '2026-09-13 06:10:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var seeder = new DemoDataSeeder();
        var result = seeder.seedAll();
        gs.info('BCFA demo data reseed (v2) result: ' + JSON.stringify(result));
    `,
})
