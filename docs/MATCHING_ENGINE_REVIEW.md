# Matching Engine Review (Phase 14)

Date: 2026-09-28
Status: **done** — rules reinforced, deployed, and the new service paths verified live. The ATF suite is
deployed but not yet run: ATF test execution is disabled on this instance (`sn_atf.runner.enabled`);
running it is deferred to Phase 29 by decision.

Principle: deterministic rules decide; AI may explain and rank options, never choose. Every rule below
lives in `MatchingEngine` (pure checks) and is applied by `ApDomainService` / `ArDomainService`.
Thresholds are `x_695068_bcfa.*` properties (POC ASSUMPTION).

## AP

| Rule | Before | After (Phase 14) | Reason on failure |
|---|---|---|---|
| Duplicate invoice | Same vendor + exact invoice number + exact gross; FAILED excluded | Same vendor + **normalized** invoice number (case, spaces, punctuation ignored), **any amount**; evidence says exact vs different amount (possible re-bill); FAILED and REJECTED excluded so a rejected invoice can be resubmitted | `duplicate` |
| PO match | PO must exist | PO must exist, **belong to the invoice vendor** and **not be closed** (`validatePurchaseOrder`) | `po_mismatch` |
| PO line linkage | Not checked (unlinked lines skipped the price check) | PO invoices need at least one line, every line linked to a line **of the invoice's PO** | `po_mismatch` |
| GRN match | Lines without a receipt skipped the quantity check | Every PO line needs a receipt **for that same PO line** | `grn_missing` (new) |
| Quantity tolerance | 5% hard-coded | `ap.tolerance.quantity_pct` (2%) vs receipt quantity | `quantity_tolerance` |
| Price tolerance | 2% | `ap.tolerance.price_pct` (2%) vs PO unit price | `price_tolerance` |
| Tax validation | Country rate, max(1, 2%) band | Unchanged (configurable since Phase 12) | `tax_validation` |
| Header vs lines | Not checked | Sum of line amounts must equal net within `ap.tolerance.tax_absolute` (1) | `line_total_mismatch` (new) |

Exception reason precedence (one reason per exception): PO linkage → receipt → quantity → price →
tax → line total. The rule result on the exception lists every check with pass/FAIL.

## AR

| Rule | Before | After (Phase 14) |
|---|---|---|
| Exact reference match | Phase 13: remittance invoice references (exact item, one customer, same currency) | Unchanged, first in order |
| Exact amount | Unique open item of the customer equal to the payment, **any currency** | Same, **payment currency only**; several equal items → ambiguous |
| Customer match | Remitter name alias/exact name, first hit | Unchanged gate (`ar.match.auto_confidence` 0.95), see alias |
| Alias match | Exact alias text, highest confidence wins | **Normalized** comparison; a name that points to **two customers is ambiguous, never resolved** |
| Multi-invoice combination | Greedy oldest-first accumulation | **Exact combination search** in cents over the customer's same-currency open items (bounded at 20 items): one combination → match (`combination` candidates); several → `ambiguous_match` exception for the AI to rank and a human to decide; none → greedy suggestion as before (leads to short/over pay) |
| Short-pay | Balance check raises `short_pay` | Unchanged, plus a **rule suggestion** pre-set on the exception |
| Bank charge | Reviewer choice only | Suggested when the residual ≤ `ar.bank_charge.max_amount` (1,000) and no credit note fits |
| Credit-note netting | Not supported by the decision service | Suggested when exactly one open credit note of the customer equals the residual (set on the exception); validated at decision (open, same customer, exact amount); credit note applied on clearing |

Other fixes found in the review:
- **AR Resolve & Retry** now re-matches, re-allocates and routes for approval (it stopped after
  matching); earlier proposed allocations are marked `reversed` and excluded from balance and clearing.
- **Seeder**: AP lines are attached at intake (the stricter match would otherwise fail seeded
  invoices before their lines exist); AR open items take the customer's currency (they were always
  INR, the source of the BANK-AR-002 EUR/INR mismatch). Effective on the next reseed (Phase 28).

## Tests

`src/fluent/tests/matching_engine.now.ts` — two ATF tests with isolated data (rolled back by ATF, no
exceptions created, so no AI runs):
- AP: clean match; quantity 1% pass / 3% fail; price 2% pass / 4% fail; tax fail/pass; missing GRN;
  unlinked line; PO invoice without lines; line total; PO of another vendor; closed PO; exact
  duplicate; same number different amount; resubmission after REJECTED.
- AR: exact amount ignores other-currency items; INR payment never matches EUR item; unique
  combination; several combinations reported not chosen; remittance reference resolved / other
  currency flagged / unknown unresolved; normalized alias; shared alias ambiguous; exact customer
  name; bank charge suggestion; credit note suggestion; no suggestion for a large residual.

**Not yet run**: ATF execution is disabled on the instance and the ATF REST API plugin is not active.

## Live verification (`scripts/deploy/phase14_live_bg.js`, TEST14 data, closed)

| Case | Result |
|---|---|
| Credit-note netting | 38,500 vs ARINV1401 40,000 → short pay 1,500; engine suggested `credit_note_netting` with CN1401 on the exception. AI review classified CREDIT_NOTE 1,500. Approve Deduction → 40,000 − 1,500 = 38,500 → approval by the demo approver → clearing → CLOSED; ARINV1401 cleared, **CN1401 open 0, applied** |
| Ambiguous match | 40,000 = ARINV1402A + B **or** A + C → `ambiguous_match`, both options in the evidence, nothing allocated. Request Clarification → ON_HOLD; customer remittance (A + B) → Resolve & Retry → remittance match → balanced → approval → CLOSED; A and B cleared, **C still open** |

Deploy `phase14_matching_bg.js`: 26 records loaded, 0 failed; `credit_note` column added.

## Findings to act on later

- **AI review quality on ambiguous matches (Phase 21).** The orchestrator also ran the Customer
  Resolution agent although the customer was known (listing unrelated customers), labelled the
  combination candidates "exact remittance match" when there was no remittance, and recommended one
  option (low confidence) rather than a neutral ranking. It stayed advisory and the engine had
  already refused to choose; tighten the route instructions and add output checks.
- **ATF execution disabled** on the instance: enable `sn_atf.runner.enabled` (admin decision) before
  Phase 29, then run this suite and `core_correctness`.
- **Credit notes have no currency field**; netting assumes the customer's currency (payment currency
  is checked against the open items).
- **Combination search** is bounded at 20 open items per customer; beyond that it reports "not
  searched" and falls back to the greedy suggestion.
- **Demo data**: the clean AP fixture (INV-AP-001, 5,900) is now correctly a duplicate of seeded
  INV-AP-001 (5,000); the live demo needs the demo reset (Phase 28) or renumbered fixtures.
