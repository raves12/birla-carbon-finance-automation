import { TestSuite } from '@servicenow/sdk/core'

// Phase 29: every BCFA correctness test in one suite, run from ATF (Test
// Suites > BCFA Regression > Run Test Suite). The ATF REST API plugin is not
// active on this instance, so suites are run in-instance, not over REST.
// "Seed Demo Data" is left out: it writes demo data, it does not check
// anything (use DemoDataSeeder.resetAndReseed instead).

export const bcfaRegressionSuite = TestSuite({
    $id: Now.ID['suite-bcfa-regression'],
    name: 'BCFA Regression',
    description: 'All BCFA correctness tests: integration idempotency, segregation of duties, unknown outcome control, AP/AR matching rules, lifecycle enforcement, flow orchestration, AI guardrails, AI identity, append-only audit, ambiguous-match control, demo reset guard, KPIs; Playbook phase PB-AP/PB-AR/PB-UI tests.',
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
        // Playbook phase
        '2fcb44792988419ca019cc4b71d710fc', // PB-AP-001
        'fe032d01d9e640bab97b0c78b6e58fad', // PB-AP-002
        'a75a8ad82a6e43c8a70e5ded37db33f3', // PB-AP-003
        'f8bacf78488341a6a620d529cba81a17', // PB-AP-004
        'fb4d8cce2050473f94cdc811782c1b12', // PB-AP-005
        'b142362a96ab4327a7acca6add1fdf9e', // PB-AP-006
        'd67969d097654cc6abd692a30a5303cc', // PB-AR-001
        '7fc813a100284952ae02d31a7dfa1292', // PB-AR-002
        '382ef6c2c1a04ec58be4d3d021a1a1d3', // PB-AR-003
        'b5d6102029f84a2d8973c3349e83e1f3', // PB-AR-004
        'f9c5f1962e3348f49dc2f00d0378607f', // PB-AR-005
        '490670f7ca5142778d430844beca635d', // PB-AR-006
        '7ff9ebcd577f4d95a7ca5abb60172473', // PB-AR-007
        '9cdc91091fd042aa86ef7f30b4763190', // PB-AR-008
        '8fd1020bc43f4cdb95801daee0016b5b', // PB-AR-009
        '1ac3c349c8f0404dbf132e44c986ae0d', // PB-UI-001
        '1c710f166578455ca5ec948215f1fe32', // PB-UI-002
        'edc71543f2b742b8b8e32268ff38d9ee', // PB-UI-003
        '7afae232f3a3489a92cccd71b7f6872c', // PB-UI-004
        'e37ab660219e4f0a8e9312e3a35e82d4', // PB-UI-005
        'c7572877490e461a8962956f9a17a722', // PB-UI-006
        '3f26577c57064596bf3efeb9afcd1e70', // PB-UI-007
        '0f9684be734741daa3b97ec040e91399', // CP-TAX (AP-TAX-001..006)
        '158431353b0a457195253cd20ac8bac1', // CP-TOL (AP-TOL-001..006)
        'b389e812f61c4bb09ed7c730aa20b6ee', // CP-DED (AR-DED-001..005)
        '3943fb95ed7341bc9d6a7554304c5035', // CP-EXT (extraction provider)
        // Phase 41: client sample pack hardening and the POC team's defects
        '1eda99ce35654de09db2537e41ab40e4', // H41-D6 decision reason ACL
        'd09a7e9dcc544091855e186073b0c09c', // H41-D1 canonical duplicate intake
        'c195e6625f8141a28e8d0f34eb05c79b', // H41-D2/D3 stale error, no attachment
        '0cedd6bd2e5a4266838d9c70266eb805', // H41-D8 remittance correlation
        'a5e710b603c04c55bfc7e0e5487add80', // H41-D10 payment lifecycle start
        '3afa39bdc5984e28989dedd23cd5ac67', // H41-D9 totals reconciliation (shipping)
        'e7688ebcbf4f4f36ab1294b705380553', // H41-D5 currency / FX
        '94ce522786d84b10ae39413a27e9f239', // H41-D6b re-run and stale approval
        '597c9d2e699945d0bf245cef59ff0a71', // H41-SAP adapter outcome mapping
        '44e53c4c828f47bfb064e267dd77dd19', // H41-NUM distinct intake numbers
    ],
})

// Playbook phase: the PB-* tests on their own, for checking the Playbooks,
// the journey fields and SAP Draft/Direct after a Playbook change.
export const bcfaPlaybookSuite = TestSuite({
    $id: Now.ID['suite-bcfa-playbook'],
    name: 'BCFA Playbook Regression',
    description: 'PB-AP-001..006, PB-AR-001..009, PB-UI-001..007: journey stage derivation (blocked because / next / owner), AI never advances the journey, SIMULATED extraction and MOCK SAP labels, SAP Draft/Direct processing, the two native Playbooks (read-only gates), the workspace Playbook route and actions.',
    tests: [
        '2fcb44792988419ca019cc4b71d710fc', // PB-AP-001
        'fe032d01d9e640bab97b0c78b6e58fad', // PB-AP-002
        'a75a8ad82a6e43c8a70e5ded37db33f3', // PB-AP-003
        'f8bacf78488341a6a620d529cba81a17', // PB-AP-004
        'fb4d8cce2050473f94cdc811782c1b12', // PB-AP-005
        'b142362a96ab4327a7acca6add1fdf9e', // PB-AP-006
        'd67969d097654cc6abd692a30a5303cc', // PB-AR-001
        '7fc813a100284952ae02d31a7dfa1292', // PB-AR-002
        '382ef6c2c1a04ec58be4d3d021a1a1d3', // PB-AR-003
        'b5d6102029f84a2d8973c3349e83e1f3', // PB-AR-004
        'f9c5f1962e3348f49dc2f00d0378607f', // PB-AR-005
        '490670f7ca5142778d430844beca635d', // PB-AR-006
        '7ff9ebcd577f4d95a7ca5abb60172473', // PB-AR-007
        '9cdc91091fd042aa86ef7f30b4763190', // PB-AR-008
        '8fd1020bc43f4cdb95801daee0016b5b', // PB-AR-009
        '1ac3c349c8f0404dbf132e44c986ae0d', // PB-UI-001
        '1c710f166578455ca5ec948215f1fe32', // PB-UI-002
        'edc71543f2b742b8b8e32268ff38d9ee', // PB-UI-003
        '7afae232f3a3489a92cccd71b7f6872c', // PB-UI-004
        'e37ab660219e4f0a8e9312e3a35e82d4', // PB-UI-005
        'c7572877490e461a8962956f9a17a722', // PB-UI-006
        '3f26577c57064596bf3efeb9afcd1e70', // PB-UI-007
    ],
})
