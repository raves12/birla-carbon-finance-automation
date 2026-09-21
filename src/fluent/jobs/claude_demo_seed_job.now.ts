import { ScheduledScript } from '@servicenow/sdk/core'

// One-time Phase 6 seed for the four client demo scenarios (AP happy path,
// AP exception, Cash exact match, Cash short pay). Reports the persisted
// state of each so it can be independently re-verified against the
// instance afterward, not just trusted from this return value.
export const claudeDemoSeedJobV1 = ScheduledScript({
    $id: Now.ID['job-claude-demo-seed-v1'],
    name: 'BCFA - One-Time Claude Demo Scenario Seed (v1)',
    frequency: 'once',
    executionStart: '2026-09-16 00:00:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var seeder = new DemoDataSeeder();
        var result = seeder.seedClaudeDemoScenarios();
        gs.info('BCFA-CLAUDE-DEMO-SEED-V1: ' + JSON.stringify(result));
    `,
})
