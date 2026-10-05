# STATE_MODELS.md — Birla Carbon Finance Automation

Phase 26. Analysis: `scripts/deploy/phase26_state_model_check_bg.js` (read-only). Deploy: `phase26_lifecycle_bg.js`
(scope global). Verify: `phase26_verify_bg.js` (scope x_695068_bcfa).

Two state models define the legal lifecycles:

| Model | Table | States | Transitions |
|---|---|---|---|
| **AP Invoice Lifecycle** | `x_695068_bcfa_ap_invoice` | 19 | 31 |
| **Cash Application Lifecycle** | `x_695068_bcfa_payment` | 18 | 32 |

They are built from `src/fluent/state-models/` into the platform's state model tables (`sttrm_model`, `sttrm_state`,
`sttrm_state_transition`). All transitions are manual: the domain services run the deterministic check, then move the
state.

## Before Phase 26: documentation only

The models were deployed and active, but the platform does not enforce `sttrm` models on a custom table. Its business
rules only maintain the model records themselves. In addition, `state` was editable on the forms. So the models
described the lifecycle but did not control it.

## Checking the models against the audit trail

Every state change writes an audit event with `before_value.state` → `after_value.state`. The analysis script compared
every recorded change with the models (2026-09-28):

| | AP | AR |
|---|---|---|
| Distinct transitions observed | 25 | 22 |
| Of which modelled | 21 | 20 |
| Current states outside the model | none | none |

**Recorded, but not modelled**

| Transition | Count | Source | Decision |
|---|---|---|---|
| AP RECEIVED → VALIDATING | 4 | `validateInvoice` on invoice data that arrived already structured (document intake in inline mode; seeded validation scenarios) | **Legitimate.** Modelled |
| AP APPROVED → PENDING_APPROVAL | 1 | `decideApproval` rolls back an approval the service layer refused | **Legitimate.** Modelled |
| AP MATCHED → MATCHING | 6 | Phase 14 matching test run (2026-09-25 11:52), `matchInvoice` re-run on already-matched invoices | **Not a lifecycle path.** Now refused |
| AP EXCEPTION → MATCHING | 1 | Same test run | **Not a lifecycle path.** Now refused (an exception goes through Resolve & Retry → RESOLUTION → VALIDATING) |
| AR UNKNOWN_OUTCOME → APPROVED | 1 | `reconcileClearing`: nothing was committed in SAP, so it is safe to clear again | **Legitimate.** Modelled |
| AR MATCHING → EXCEPTION | 1 | Ambiguous match (several exact options) or currency mismatch with the remittance (Phase 14) | **Legitimate.** Modelled |

**Added from the code, not yet recorded**

| Transition | Source |
|---|---|
| AP RECEIVED → EXTRACTED | Phase 25 AP Invoice Intake Flow, for an invoice created from an uploaded document whose extraction is already recorded |
| AR RECEIVED → EXCEPTION | `normalizePayment` when mandatory payment fields are missing |

**Modelled, but never recorded.** These were reviewed and kept. They are designed paths that the test data has not
exercised yet:

- **AP:** unknown-outcome → posted / failed; failed → resolution; exception → resolution; resolution → validating;
  pending approval → exception (rejection); on hold → rejected
- **AR:** exception → matching; the unknown-outcome and failure paths; matching → unmatched → exception; pending approval
  → exception

## Enforcement

| Layer | What it does |
|---|---|
| `FinanceLifecycle` (script include) | Reads the allowed transitions from the deployed state model, so the model is the single source of truth. `evaluate(table, from, to)`; staying in the same state is always allowed |
| `ApDomainService._setState` / `ArDomainService._setState` | Every state change the services make is checked first. A transition outside the model is audited and **refused**: the service throws `BCFA lifecycle: …`, so no later step runs on a record in the wrong state. In a flow stage, FinanceOrchestration catches it and logs the error |
| **BCFA - Enforce AP Invoice Lifecycle / BCFA - Enforce Payment Lifecycle** (before-update business rules) | Backstop for any other writer (form, list, import, script): the update is aborted with an error message, and audited |
| `state` field | Read-only on forms. Only the services change it, through the actions (Resolve & Retry, approval decisions and so on) |

Each refusal is an audit event of type **Rule Evaluated**. Its after value is
`{ rule: 'lifecycle', model, to_state, result: 'REFUSED' }` and its reason lists the states allowed from the current one.

Property `x_695068_bcfa.lifecycle.enforcement`:

| Value | Behaviour |
|---|---|
| `enforce` (default) | Transitions outside the model are refused and audited |
| `monitor` | Transitions outside the model are allowed but audited (result `MONITORED`). This is a fallback if a legitimate path turns out to be missing from the model; add the transition, then switch back |

## Verification (2026-09-28)

`phase26_verify_bg.js`:

- **Configuration:** enforcement mode is `enforce`, the new transitions are in the models, and CLOSED → MATCHING is not
  allowed.
- **Through the service:** `matchInvoice` on the closed invoice INV-P25-902939 threw `BCFA lifecycle: The AP Invoice
  Lifecycle does not allow CLOSED -> MATCHING. Allowed from CLOSED: none.` The invoice stayed CLOSED, and the refusal
  was audited.
- **Direct update:** setting the closed payment BANK-AR-001 back to RECEIVED was aborted by the payment backstop rule,
  with the message "State change refused: …". The payment stayed CLOSED, and the refusal was audited.
- **Backstop rule count:** this check failed only because the payment rule's first name, *BCFA - Enforce Cash
  Application Lifecycle*, has 41 characters. The name field holds 40, so the name was truncated and the exact-name
  lookup missed it. The rule itself fired, as the direct-update test shows. It is renamed *BCFA - Enforce Payment
  Lifecycle*.
- **Legal paths still work.** In `phase25_verify_bg.js` / `phase25_verify2_bg.js` under enforcement, INV-P25-805373 ran
  through the flows to CLOSED (posted MIRO1062621), and BANK-P25-805373 reached PENDING_APPROVAL. The only lifecycle
  audit events on the instance are the two deliberate test refusals.
- **Re-run of the state model check:** there are no new unmodelled transitions. The only remaining ones are the two
  Phase 14 test-run paths, which are now refused.

**Changing a lifecycle.** Add the transition to `src/fluent/state-models/*.now.ts` and deploy. Enforcement picks it up
from the model, so no code changes are needed.
