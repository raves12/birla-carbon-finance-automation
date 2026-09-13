import { Test } from '@servicenow/sdk/core'

// Not a correctness test — this is the execution mechanism for Stage
// 10/17 demo data (see docs/ARTIFACT_STRATEGY.md: there is no other
// script-execution surface available to this build). Run once via
// atf_test_run after every fresh deploy that needs demo data.
Test(
    { $id: Now.ID['test-seed-demo-data'], name: 'Seed Demo Data (run manually, not a correctness check)', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-seed-demo-data-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var seeder = new DemoDataSeeder();
                    var result = seeder.seedAll();
                    stepResult.setOutputMessage('Demo data seed result: ' + JSON.stringify(result));
                    outputs.result_json = JSON.stringify(result);
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)
