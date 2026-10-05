# POC 1 — AP Automation Journey (Phase 12)

> **Phase 40 update (2026-10-05).** Uploaded documents are now read natively by ServiceNow Document Intelligence on Now LLM (`x_695068_bcfa.document.extraction.provider = native`). The simulated extraction described below remains for test fixtures and seeded data only. See `CLIENT_POC_DEMO_JOURNEYS.md` and `OCR_ACCURACY_REPORT.md`.

Date: 2026-09-28
Instance: `pwcmanagementservicesdemo01.service-now.com`
Status: **verified live end to end** (happy path and all four exception decisions)

## What runs where

| Step | Component | AI? |
|---|---|---|
| Upload PDF, set document type | Finance Document Intake (`x_695068_bcfa_finance_intake`), "Process Document" button | No |
| Read invoice fields | `SimulatedDocumentExtraction`: printed values of the synthetic fixture, labelled **SIMULATED** (Document Intelligence extraction is not licensed/trained on this instance, see `CONTENT_UNDERSTANDING.md`) | No |
| Confidence check | `ApDomainService.validateInvoice` vs `ap.extraction.confidence_threshold` (0.85) | No |
| Vendor, PO, PO line, GRN | `FinanceDocumentIntakeService.resolveVendor/resolvePurchaseOrder`, `ApLineResolutionService` | No |
| Duplicate, quantity, price, tax checks | `MatchingEngine` with `ap.tolerance.*` (quantity 2%, price 2%, tax max(1, 2%)) | No |
| Approval routing | `ApDomainService.routeForApproval` with `ap.approval.auto_approve_limit` (0: always human); requester ≠ approver | No |
| Posting | Approval cascade → `IntegrationService` → Mock SAP (`MIRO…` document) → archive → CLOSED | No |
| Exception record | `ExceptionEngine.createApException`: severity, SLA due, assignment group, owner, rule result, evidence, variance | No |
| Explanation and recommendation | BCFA AP Invoice Review agentic workflow (Now Assist), triggered on exception creation, runs as `bcfa.ai.reviewer`, writes only the advisory `ai_recommendation` | **Yes, advisory only** |
| Decision | Finance user: Approve Override / Reject Invoice / Request Correction / Hold, mandatory reason (`ApExceptionDecisionService`) | No (AI identities are refused) |

All thresholds are `x_695068_bcfa.*` system properties, labelled **POC ASSUMPTION**
(`src/fluent/config/policy_properties.now.ts`). `x_695068_bcfa.ai.provider = native` keeps
Claude out of the AP path; AR still uses Claude until Phase 13.

## Decision rules

| Decision | Who | From invoice state | Result |
|---|---|---|---|
| Approve Override | `finance_approver` (not the exception owner) | EXCEPTION, ON_HOLD | Only for `ap.override.allowed_reasons` (quantity, price, tax). Exception resolved; approval requested in the owner's name and approved by the decider (maker/checker); posts to Mock SAP; CLOSED |
| Reject Invoice | `ap_processor` or `finance_approver` | EXCEPTION, ON_HOLD | Exception closed; invoice REJECTED |
| Request Correction | `ap_processor` or `finance_approver` | EXCEPTION, ON_HOLD | Exception in review; invoice ON_HOLD; after the correction, "Resolve & Retry" re-validates, re-matches and routes for approval |
| Hold | `ap_processor` or `finance_approver` | EXCEPTION | Exception in review; invoice ON_HOLD |

Every decision needs a Decision Reason of at least 10 characters, is refused for users with
`identity_type = ai_agent`, records decision / reason / decided by / decided at on the exception,
and writes a `human_decision` audit event.

## Live results

Deploy: `scripts/deploy/phase12_ap_journey_bg.js` (global) — 109 records loaded, 0 failed; 11
columns present with their build sys_ids; demo users `bcfa.ap.processor` (ap_processor) and
`bcfa.finance.approver` (finance_approver) and groups BCFA AP Operations / BCFA Finance Approvers.

Tests: `scripts/deploy/phase12_e2e_part1_bg.js` and `phase12_e2e_part2_bg.js`
(scope x_695068_bcfa, run as the admin user).

| Case | Fixture | Result |
|---|---|---|
| A happy path | `AP_INV_001_CLEAN.pdf` | Simulated extraction 0.97 → matched → PENDING_APPROVAL. Self-approval **blocked** (SoD). Approved by the demo approver → posted `MIRO1065681` → CLOSED. Integration: `postVendorInvoice:success`, `archive:success` |
| B quantity | `AP_INV_002_QTY_VARIANCE.pdf` | `quantity_tolerance`, 15 vs GRN 10 = 50% vs 2%, variance 2,500 EUR → severity **high**, SLA 8h, group BCFA AP Operations, owner demo AP processor. AI note (1,586 chars) explained the variance from the evidence and recommended receipt confirmation. No reason → **refused**; Hold → ON_HOLD; Approve Override → posted `MIRO1068580` → CLOSED. A repeat decision → refused (already resolved) |
| C tax | `AP_INV_005_TAX_EXCEPTION.pdf` | `tax_validation`, tax 50 vs expected 360 (India 18%), variance 310 → medium, SLA 24h. AI note recorded. Request Correction → ON_HOLD |
| D duplicate | `AP_INV_004_DUPLICATE.pdf` | `duplicate` of case A (same vendor, number, 5,900) → high. AI note recorded. Approve Override → **refused by policy**; Reject → REJECTED |

## Defect found and fixed during verification

Both approval-cascade business rules (`AP Invoice - Auto Post After Approval`,
`AR Payment - Auto Clear After Approval`) declared `var svc` at the top level of their script. In
the calling script's context the variable leaked and overwrote the caller's own `svc`. Both are
now wrapped in `(function executeRule(current, previous) {...})(current, previous)`, updated on
the instance and in source.

## Findings to act on later

- **Duplicate key includes the amount (Phase 14).** The same vendor and invoice number with a
  different gross is not flagged. The clean fixture (INV-AP-001, 5,900) was accepted although
  seeded INV-AP-001 (5,000) exists.
- **Fixture collides with seed data.** `AP_INV_003_PRICE_VARIANCE.pdf` is identical to seeded
  AP-005, so it is (correctly) raised as a duplicate, not a price variance. Fix with the demo reset
  (Phase 28) or new fixture numbers.
- **Consumed intake records.** The four intake records used here are processed. Re-upload the PDFs
  for the live demo (Phase 33 script).
- **Role-denial tests (Phase 29).** Tests ran as admin because the app's script includes are
  package-private and cannot be impersonated from global scope; the role and AI-identity refusals
  are covered by code review, not yet by a live test.
- **Document Intelligence.** Replace `SimulatedDocumentExtraction` with a `DocIntelAPI` call once
  extraction is licensed/trained (same result shape).
