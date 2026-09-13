import { ScheduledScript } from '@servicenow/sdk/core'

// Execution mechanism for Stage 10/17 demo data. The ATF REST trigger tool
// available to this session errored with "this instance may not have the
// Automated Test Framework REST API plugin active" when invoking
// atf_test_run, so a one-time Scheduled Script (fully documented,
// `frequency: 'once'`) is used instead — it fires on its own once the app
// is installed, without needing any external trigger call. See
// docs/BUILD_REPORT.md for this note. Safe to leave in place: it runs once
// and DemoDataSeeder.seedAll() guards master-data re-seeding.
export const demoDataSeedJob = ScheduledScript({
    $id: Now.ID['job-demo-data-seed'],
    name: 'BCFA - One-Time Demo Data Seed',
    frequency: 'once',
    executionStart: '2026-09-13 05:04:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var seeder = new DemoDataSeeder();
        var result = seeder.seedAll();
        gs.info('BCFA demo data seed result: ' + JSON.stringify(result));
    `,
})
