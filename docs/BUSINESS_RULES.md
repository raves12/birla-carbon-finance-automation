# BUSINESS_RULES.md — Birla Carbon Finance Automation

Deterministic rules currently implemented directly in `MatchingEngine.server.js` and
`ApDomainService.server.js`/`ArDomainService.server.js`, with clear seams for Stage 13 to
externalize into Decision Table Builder records without changing calling code. Every evaluation
here is deterministic — no AI/simulated-AI input ever reaches these checks (see
`docs/ARCHITECTURE.md` section 4).

## AP rules

| Rule | Current implementation | Reason code on failure |
|---|---|---|
| Low-confidence extraction | `ApDomainService.validateInvoice`: confidence (from latest `AP Extraction`) `< 0.85` | `low_confidence` |
| Mandatory fields | `invoice_number`, `vendor`, `gross_amount` must be present | `missing_field` |
| Vendor validation | Vendor must resolve to an active `x_695068_bcfa_vendor` record | `vendor_invalid` |
| PO validation | If `purchase_order` is set, it must resolve | `po_mismatch` |
| Duplicate detection | `MatchingEngine.detectDuplicateInvoice`: `duplicate_key = vendor + invoice_number + gross_amount`; another non-`FAILED` invoice with the same key is a duplicate | `duplicate` |
| Quantity tolerance | `MatchingEngine.threeWayMatch`: `\|invoiceLine.qty - receipt.qty\| / receipt.qty ≤ 5%` (`DEFAULT_TOLERANCES.quantityPct`) | `quantity_tolerance` |
| Price tolerance | `\|invoiceLine.unitPrice - poLine.unitPrice\| / poLine.unitPrice ≤ 2%` (`DEFAULT_TOLERANCES.pricePct`) | `price_tolerance` |
| Tax validation | `\|invoice.tax_amount - (net_amount × expectedRateByVendorCountry)\| ≤ max(1.0, expectedTax × 2%)` | `tax_validation` |
| Approval / posting eligibility | AP Invoice must have `approval_state = 'approved'` before `ApDomainService.postInvoice` will call SAP | — (hard gate, not an exception) |

**Country tax rate table** (`MatchingEngine.TAX_RATE_BY_COUNTRY`, illustrative POC values):
India 18%, Hungary 27%, United States 0%, Germany 19%. This is the first thing Stage-13-successor
work should move into a real Decision Table so it becomes configurable without a code deploy.

## AR rules

| Rule | Current implementation | Reason code on failure |
|---|---|---|
| Exact match | `MatchingEngine.exactMatch`: exactly one open item for the resolved customer with `\|open_amount - payment.amount\| ≤ 0.01` | — (success path) |
| Multi-invoice allocation | `MatchingEngine.multiInvoiceSuggestion`: greedy accumulation of open items ordered by due date until the running total reaches the payment amount | — (success path if residual ≈ 0) |
| Customer alias resolution | `MatchingEngine.resolveCustomerByAlias`: exact match against `x_695068_bcfa_customer_alias.alias_name`, falling back to an exact customer-name match | `customer_ambiguous` if neither resolves |
| Unmatched payment | No open item combination found | `unmatched` |
| Allocation balance | `ArDomainService.allocatePayment`: `SUM(allocated_amount) ` must equal `payment.amount` within `0.01` (Section 8's balance rule) | `short_pay` (allocated < payment) or `over_pay` (allocated > payment) |
| Approval / clearing eligibility | Payment must have `state = 'APPROVED'` before `ArDomainService.clearPayment` will call SAP | — (hard gate, not an exception) |

Deductions (bank charge, TCS, credit-note netting) are modeled in the data layer
(`x_695068_bcfa_deduction`) but not yet auto-populated by a deterministic rule — they are currently
a reviewer-entered adjustment during exception resolution. Auto-classifying them (e.g., a small
residual that matches a known bank-charge pattern) is the natural next Decision Table candidate
alongside the tax rate table above.

## Stage 13 scope decision: why these rules are still hardcoded, not Decision Tables

`docs/ARTIFACT_STRATEGY.md` flagged Decision Table Builder as having no confirmed Fluent authoring
path (`sn_decision_table_decision_condition` and related rows have no dedicated `Table()`-like
builder in the bundled SDK docs — only `DataLookup()`, a simpler field-copy-on-match mechanism that
doesn't fit a tolerance/rate rule grid). Two paths were available: build the native Decision Table
Builder UI by hand (not drivable via MCP or Fluent), or hand-write raw records against
`sn_decision_table_decision_condition` without a verified schema — the latter risks silently
corrupting or misconfiguring records in an app (Decision Table Builder) this project doesn't own,
which principle #18 ("do not invent Fluent APIs... inspect first") and the broader "never guess"
instruction both argue against. The tolerance/tax-rate tables above are written as named constants
in `MatchingEngine` instead — fully deterministic, fully documented, fully covered by the ATF tests
in `docs/TEST_PLAN.md`, and functionally equivalent to a Decision Table for this POC's purposes. The
one real difference: changing a tolerance today requires a code deploy, not a business-user edit —
recorded here as the honest gap, and the natural manual next step is building the equivalent grid
in Decision Table Builder against this same documented rule set.

## Rule execution logging

`x_695068_bcfa_decision_log` (Stage 3) exists for recording rule name/version/input/result per
evaluation, per the project's audit requirement. The matching/validation methods above do not yet
write to it — they write their outcome to `AP Match`/`AP Exception`/`AR Exception` directly, which
already gives full evidence for this POC's demo scenarios. Wiring every rule evaluation through
`Decision Log` as well is straightforward (one `GlideRecord` insert per check) and is the natural
extension point once/if the tolerance and tax-rate tables above move into real Decision Tables.
