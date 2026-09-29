import { TestSuite } from '@servicenow/sdk/core'

// Phase 29: every BCFA correctness test in one suite, run from ATF (Test
// Suites > BCFA Regression > Run Test Suite). The ATF REST API plugin is not
// active on this instance, so suites are run in-instance, not over REST.
// "Seed Demo Data" is left out: it writes demo data, it does not check
// anything (use DemoDataSeeder.resetAndReseed instead).

export const bcfaRegressionSuite = TestSuite({
    $id: Now.ID['suite-bcfa-regression'],
    name: 'BCFA Regression',
    description: 'All BCFA correctness tests: integration idempotency, segregation of duties, unknown outcome control, AP/AR matching rules, lifecycle enforcement, flow orchestration, AI guardrails, AI identity, append-only audit, ambiguous-match control, demo reset guard, KPIs.',
    tests: [
        'f29aeb57a3e645b3ae033265f5ff8552', // Idempotency
        '558406a41125475db1ef504e8a4330a6', // Segregation of Duties
        '93bd7d7310f9483bb79b0c4217362234', // Unknown Outcome Control
        '47534e411d2d4be5975ece66c5e47b03', // Matching Engine - AP
        '2a4aad791a2f4f1989f5d1ae5a3afa94', // Matching Engine - AR
        'a93e389547e243dda3c7550a2d2b5b01', // Lifecycle
        'c98429799fcf464b90d8c73cf10a9842', // Orchestration
        'e85a57479aaa4e579c2b2a89ba14e304', // AI guardrails
        '61d67daab2864456b6a8df9916cf2581', // AI identity
        '7647a3d2630b486abb495746b335839d', // Audit trail
        'f015585cd64c4daf8c926f19630c0c98', // Ambiguous match control
        'bf9780dd371d438a8fa4cef710259977', // Demo reset guard
        '83c03e2ddee5469b93dabf55981422c6', // KPIs
    ],
})
