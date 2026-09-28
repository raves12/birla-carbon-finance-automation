import { ScriptInclude, Property } from '@servicenow/sdk/core'

export const demoDataSeeder = ScriptInclude({
    $id: Now.ID['si-demo-data-seeder'],
    name: 'DemoDataSeeder',
    active: true,
    apiName: 'x_695068_bcfa.DemoDataSeeder',
    description: 'Demo data: master data (vendors, customers, POs, receipts, AR open items, credit notes) plus the 10 named AP and 10 named AR scenarios; resetDemoData / resetAndReseed put the data back to that baseline (Phase 28).',
    script: Now.include('../../server/script-includes/DemoDataSeeder.server.js'),
})

// Phase 28: demo reset controls. See docs/DEMO_DATA.md.
export const demoResetEnabled = Property({
    $id: Now.ID['prop-demo-reset-enabled'],
    name: 'x_695068_bcfa.demo.reset_enabled',
    type: 'boolean',
    value: 'true',
    description: 'true = DemoDataSeeder.resetDemoData may delete this instance\'s AP/AR operational data and restore the seeded demo baseline (POC demo instance). Set to false on any instance whose data must never be reset.',
})

export const demoResetClearsAiLog = Property({
    $id: Now.ID['prop-demo-reset-clears-ai-log'],
    name: 'x_695068_bcfa.demo.reset_clears_ai_log',
    type: 'boolean',
    value: 'false',
    description: 'false (default) = a demo reset keeps the AI Interaction Log as governance evidence (the AI KPIs then include earlier runs); true = the reset also clears it, for a clean dashboard. The audit trail is never cleared.',
})
