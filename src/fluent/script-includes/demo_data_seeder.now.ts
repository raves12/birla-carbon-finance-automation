import { ScriptInclude } from '@servicenow/sdk/core'

export const demoDataSeeder = ScriptInclude({
    $id: Now.ID['si-demo-data-seeder'],
    name: 'DemoDataSeeder',
    active: true,
    apiName: 'x_695068_bcfa.DemoDataSeeder',
    description: 'Stage 10/17 demo data: master data (vendors, customers, POs, receipts, AR open items, credit notes) plus the 10 named AP and 10 named AR scenarios, run once via an ATF runServerSideScript step.',
    script: Now.include('../../server/script-includes/DemoDataSeeder.server.js'),
})
