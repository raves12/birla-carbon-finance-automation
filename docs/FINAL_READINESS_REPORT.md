# FINAL_READINESS_REPORT.md (Phase 35, 2026-10-01; workspace embedding 2026-10-05)

Evidence: `FINAL_E2E_TEST_RESULTS.md`, `FINAL_POC_READINESS_AUDIT.md`, `PLAYBOOK_DESIGN.md`. Everything below was run on `pwcmanagementservicesdemo01` on 2026-10-01 after the Phase 35 deploy. The workspace embedding was fixed and verified on 2026-10-05.

```
============================================================
OVERALL
============================================================
READY FOR CLIENT DEMO:
YES: "BCFA is ready for the agreed POC demonstration scope."

What works today:
  - both native Playbooks are live;
  - the Playbook is embedded in the BCFA Workspace
    (/x/695068/bcfa/playbook/<table>/<sys_id>);
  - "Open Playbook" on the invoice and payment forms opens that page;
  - every core, AI, SAP Draft/Direct and Playbook test passes.

Manual steps remain for people (Open items below). None of them
blocks the demo.

Production readiness is not claimed.

============================================================
CORE APPLICATION
============================================================
AP E2E:               PASS    (fresh run 6ABE1: AP-A..F; AP-B override approval is a manual
                               step for an authorised approver, the SoD refusal itself passes)
AR E2E:               PASS    (fresh run 6ABE1: AR-A..I + AR-C2)
Document Extraction:  SIMULATED (native Document Intelligence: LICENSE / CONFIG REQUIRED)
Native AI:            PASS    (Now Assist skills and agents live, guarded and tested;
                               AR Recommended Next Action prompt v3 published)
Approvals:            PASS
SoD:                  PASS    (ATF; E2E AP-B: override refused for a non-approver)
SAP Mock:             PASS
Real SAP:             NOT CONFIGURED
Audit:                PASS
Workspace:            PASS    (existing workspace; see Workspace Embedding below)
ATF:                  PASS    (35 / 35 BCFA Regression, serial, after all changes)

============================================================
PLAYBOOK
============================================================
AP Playbook:            PASS  (active, published; 8 stages; Workflow Studio, no errors)
AR Playbook:            PASS  (active, published; 9 stages)
Workspace Embedding:    PASS  (BCFA Workspace Playbook page; Open Playbook opens it;
                               verified 2026-10-05 on BANK-PLAY-02 and INV-PLAY-02;
                               PB-UI-004 / PB-UI-005)
Stage Synchronization:  PASS  (11 demo transactions land on their designed stage; runs
                               complete only when the record is CLOSED; PB-AP-001/006,
                               PB-AR-001, PB-UI-002)
Conditional Stages:     PASS  (parallel exception lanes; PB-AP-002, PB-AR-003)
Exception Experience:   PASS  (WHAT / WHY / NEXT / WHO; SYSTEM / AI / HUMAN columns;
                               PB-AP-002/003)
Role Experience:        PASS  (view-only Playbook permissions; actions keep their ACLs
                               and SoD; PB-UI-005)
Approval Integration:   PASS  (PB-AP-005; E2E AP-A, AR-A)
AI Integration:         PASS  (AI never advances the journey; PB-AP-003)
SAP Draft Mode:         PASS  (PB-AR-006..009; E2E AR-G; AR-PLAY-02/03)
SAP Direct Mode:        PASS  (PB-AR-006; E2E AR-H; AR-PLAY-01)
Auditability:           PASS  (PB-AP-006; integration_result events for SAP_DRAFT)
Playbook Testing:       PASS  (22 / 22)

============================================================
ISSUES
============================================================
Blocking Defects:
  none open.

Defects found and fixed in this phase:
  D1  a bank-charge deduction above the bank charge limit was accepted
      (7,300); now refused;
  D2  Fluent schema-3 Playbooks unreadable by the Yokohama designer; the
      start rules are converted at deploy;
  D3  test PB-UI-006 read sys_choice from the app scope;
  D4  the workspace Playbook screen was inactive;
  D5  the workspace Playbook page answered "Page not found": the screen
      had no parent macroponent (the workspace shell), so the workspace
      left the route out of its route table. The page definition also
      had to move into the BCFA scope. Fixed 2026-10-05.

Open items:
  1. (closed 2026-10-05) BCFA Workspace Playbook page.
  2. AP-B / MT-AP-17: approve the tolerance override as an authorised
     approver (bcfa.finance.controller). The assistant may not impersonate.
  3. Studio commit of the deployed changes, with "Include changes not
     tracked in update sets".
  4. Stale inactive draft flow "AR Exception - Use case: BCFA Cash
     Application Review - 6ad14356…" (housekeeping).
  5. (closed) Skill Kit prompt V3: "AR Recommended Next Action v3" is
     Published and the default prompt of the skill (checked 2026-10-05).
  6. Route ACL bcfa.* omits ap_approver, ar_approver and
     integration_operator (admin decision).
  7. E2E test data: E2E-* customers, open items and payments remain until
     the next demo reset.

Non-Blocking Defects:
  - The Playbook page shows the stage list and the selected stage's
    cards. The full stage diagram is in Workflow Studio.
  - No Playbook tab on the record page itself: the Playbook is a separate
    workspace page, opened from the record (PLAYBOOK_DESIGN.md §18).

License Dependencies:
  - Now Assist Document Intelligence (generative extraction);
  - PAD for custom tables (production);
  - IntegrationHub / SAP spoke (production).

Configuration Dependencies:
  - x_695068_bcfa.ar.sap_processing_mode;
  - x_695068_bcfa.mock_sap.draft_outcome (MOCK SAP only);
  - Playbook re-activation after any re-deploy.

Simulated Capabilities:
  - document extraction (SIMULATED DOCUMENT EXTRACTION — POC).

Mock Capabilities:
  - SAP (MOCK SAP: MIRO / FB05 / PARK);
  - bank statement lines;
  - archive.

Production Gaps:
  - real SAP interfaces (FB05 clearing, ML81N);
  - native extraction;
  - production identities;
  - volume testing;
  - monitoring;
  - client-agreed thresholds.

============================================================
TEST RESULTS
============================================================
ATF test count:           35
ATF passed:               35 (serial, 2026-10-01, after the Phase 35 deploy and fixes;
                          PB-UI-004 / PB-UI-005 rerun and passed 2026-10-05
                          after the workspace page change)
ATF failed:               0
AP E2E result:            PASS (6/6; AP-B approval step manual)
AR E2E result:            PASS (10/10 incl. AR-C2)
Playbook test result:     PASS (22/22)
Security result:          PASS (SoD, AI identity, override SoD in E2E)
AI safety result:         PASS (guardrails, AI identity, PB-AP-003)
UNKNOWN_OUTCOME result:   PASS (ATF; E2E AP-F, AR-I; AP-PLAY-04 / AR-PLAY-07
                                reconciled by the flows)
Idempotency result:       PASS (ATF; single posting / clearing in E2E)

============================================================
CHANGES (Phase 35; since commit 49cabd9)
============================================================
Source (new):
  src/fluent/playbooks/ap_invoice_playbook.now.ts
  src/fluent/playbooks/ar_cash_application_playbook.now.ts
  src/fluent/script-includes/journey.now.ts
  src/fluent/business-rules/journey_refresh.now.ts
  src/fluent/workspaces/bcfa/playbook_route.now.ts
  src/fluent/tests/playbook_tests.now.ts
  src/server/script-includes/FinanceJourneyService.server.js

Source (modified):
  src/fluent/state-models/cash_application_lifecycle.now.ts
  src/fluent/tables/ap.now.ts
  src/fluent/tables/ar.now.ts
  src/fluent/tests/regression_suite.now.ts
  src/fluent/config/policy_properties.now.ts
  src/server/script-includes/ArDomainService.server.js
  src/server/script-includes/ArExceptionDecisionService.server.js
  src/server/script-includes/AuditEngine.server.js
  src/server/script-includes/DemoDataSeeder.server.js
  src/server/script-includes/FinancePolicy.server.js
  src/server/script-includes/FinanceReviewSummary.server.js
  src/server/script-includes/IntegrationService.server.js
  src/server/script-includes/MockSAPAdapter.server.js

Deploy and tests:
  scripts/deploy/gen_playbooks.py
  scripts/deploy/gen_phase35_deploy.py
  scripts/deploy/gen_playbook_yokohama_fix.py
  scripts/deploy/phase35_playbook_deploy_bg.js
  scripts/deploy/phase35_playbook_yokohama_fix_bg.js
  scripts/deploy/phase35_backfill_and_seed_bg.js
  scripts/deploy/phase35_e2e_bg.js
  scripts/deploy/phase35_workspace_playbook_bg.js (2026-10-05 targeted load)
  scripts/deploy/preambles/phase35_postamble.js

ServiceNow records created:
  - 26 columns:
      10 on x_695068_bcfa_ap_invoice;
      16 on x_695068_bcfa_payment;
    with labels and 6 choice sets;
  - FinanceJourneyService;
  - state SAP_DRAFT + 3 transitions;
  - 2 properties;
  - 3 UI actions + 20 roles;
  - 1 scheduled job;
  - 4 business rules;
  - UX screen type, route, screen and page "BCFA Playbook" (the page is a
    BCFA-scoped UI Builder page holding the Playbook component);
  - 2 Playbooks (17 lanes, 42 activities, triggers, inputs, start-rule
    variables; activated, with platform snapshots);
  - 22 ATF tests + steps;
  - suite "BCFA Playbook Regression";
  - 44 suite links.

ServiceNow records modified:
  - 8 script includes (+ sys_module copies);
  - property x_695068_bcfa.ar.bank_charge.max_amount (description).

Exact flows changed:          none
Exact AI artifacts changed:   none
Exact Playbook artifacts:     BCFA AP Invoice Processing Playbook,
                              BCFA Cash Application Playbook (both active)
Exact UI Builder changes:     new BCFA page "BCFA Playbook" (28059a24…) with route,
                              screen and screen type; existing pages unchanged
Exact tests added:            PB-AP-001..006, PB-AR-001..009, PB-UI-001..007;
                              E2E script (16 scenarios)
Demo data:                    AP-PLAY-01..04, AR-PLAY-01..07 seeded with Playbook runs
```
