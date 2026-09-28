# Approvals and Segregation of Duties (Phase 17)

Date: 2026-09-28
Status: **done** — deployed and verified live (every rule refused and allowed as designed).

## Roles

| Brief | Role | Notes |
|---|---|---|
| AP Processor | `x_695068_bcfa.ap_processor` | Processes invoices and exceptions; cannot approve |
| AP Approver | `x_695068_bcfa.ap_approver` (new) | Approves AP posting and tolerance overrides |
| AR Processor | `x_695068_bcfa.ar_processor` | Processes payments and exceptions; cannot approve |
| AR Approver | `x_695068_bcfa.ar_approver` (new) | Approves AR clearing |
| Finance Reviewer | `x_695068_bcfa.finance_reviewer` | Read/oversight |
| Auditor | `x_695068_bcfa.auditor` | Evidence tables, read-only |
| Read Only | `x_695068_bcfa.read_only` | Read-only |
| BCFA Admin | `x_695068_bcfa.admin` | Scoped admin |

`x_695068_bcfa.finance_approver` contains AP Approver and AR Approver (existing grants keep working).
Integration Operator (`integration_operator`) is kept for integration retries.

Demo users: `bcfa.ap.processor`, `bcfa.ar.processor`, `bcfa.finance.approver` (BCFA Finance
Approvers), `bcfa.finance.controller` (BCFA Finance Controllers and Finance Approvers). The AI user
`bcfa.ai.reviewer` holds only the two processor roles.

## Segregation of duties

One gate, `ApprovalEngine.checkSegregation`, runs for every approval decision (approve or reject, AP
and AR) and as a pre-check before any state change (AP decision, AP tolerance override). Refusals are
audited (`approval_decision` event) and change nothing.

| Rule | Always / configurable |
|---|---|
| An AI identity (`sys_user.identity_type = ai_agent`) never approves or rejects | always |
| The approver holds the process approver role (AP Approver / AR Approver, via Finance Approver, or BCFA Admin) | always |
| The requester cannot approve their own request | `x_695068_bcfa.sod.requester_cannot_approve` |
| The processor of the transaction cannot approve it: its creator, or anyone who made a processor decision (AP: hold, request correction, reject; AR: approve deduction, hold, request clarification) on one of its exceptions | `x_695068_bcfa.sod.processor_cannot_approve` |
| The approver is a member of the approval group routed by the BCFA AP Approval decision table (AR clearing: BCFA Finance Approvers) | `x_695068_bcfa.sod.approver_in_group` |

Configurable rules default to on (POC ASSUMPTION). Rule-based approvals (`approval_type = rule`, when the
approval decision table says no approval is required) have no approver and skip the person checks; the
rule is recorded. ACLs on the approval `decision` fields (AP Approver / AR Approver, not the requester)
remain as the platform-level guard; the Approve and Reject buttons (Reject needs comments) use the same
service path.

## What each approval records

`requested_by`, `approval_group`, `approval_type` (standard, tolerance override, configured rule),
`approver`, `decision`, `decision_notes` (comments), `decided_at`, `override_reason` (the finance user's
reason for an override or accepted deduction), `sod_check` (the checks passed), `state_before` and
`state_after` (the invoice or payment state before the decision and after posting or clearing).

## Verification (`phase17_verify_bg.js`, TEST17 data, all closed)

| Case | Refused | Approved |
|---|---|---|
| AP-1, requested by the finance approver | AI user (AI identity); AR processor (no ap_approver); finance approver (requester) | finance controller → posted, CLOSED |
| AP-2, the finance approver held an exception of the invoice | finance approver ("made the processor decision hold on exception APEX0001015") | finance controller → CLOSED |
| AP-3, 2,000,000 (routed to BCFA Finance Controllers) | finance approver (not a member of BCFA Finance Controllers) | finance controller → CLOSED |
| AR-1, 15,000 exact match, requested by the AR processor | AR processor (no ar_approver) | finance approver → cleared, CLOSED |

Approval records showed every field, e.g. AP-3: requested by BCFA Demo AP Processor, group BCFA Finance
Controllers, standard, approver BCFA Demo Finance Controller, approved, comments, time, state
PENDING_APPROVAL → CLOSED, SoD "not an AI identity; holds ap_approver; not the requester; not the
processor; member of the approval group". All six AI identities on the instance hold no BCFA approval
or admin role.

## Notes

- Earlier behaviour now refused: in the Phase 12 test one user held an exception and then approved its
  override; the processor rule now blocks that. Admins approving from the UI must be in the routed group.
- The previous Finance Approver role rows on the decision ACLs and Approve buttons remain alongside the
  new approver roles (harmless: Finance Approver contains both).
- Seeder approvals now use the demo processor (requester) and demo finance approver.
- Role-denial testing through the UI with impersonation is Phase 29.
