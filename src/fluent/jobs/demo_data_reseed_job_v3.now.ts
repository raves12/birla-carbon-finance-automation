import { ScheduledScript } from '@servicenow/sdk/core'

// Re-run after fixing the real root cause of the "vendor_invalid" bug seen
// throughout the v2 reseed: GlideRecord.getValue() on a boolean column
// returns '1'/'0', not 'true'/'false' — ApDomainService.validateInvoice and
// MockSAPAdapter.getVendor/getCustomer were comparing against the wrong
// string literal, so every active-vendor check failed unconditionally. See
// docs/BUILD_REPORT.md for the full story. Master data seeding is skipped
// automatically; this adds a fresh, correct set of scenario records.
export const demoDataReseedJobV3 = ScheduledScript({
    $id: Now.ID['job-demo-data-reseed-v3'],
    name: 'BCFA - One-Time Demo Data Reseed (v3, boolean-comparison fix)',
    frequency: 'once',
    executionStart: '2026-09-13 06:27:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var seeder = new DemoDataSeeder();
        var result = seeder.seedAll();
        gs.info('BCFA demo data reseed (v3) result: ' + JSON.stringify(result));
    `,
})
