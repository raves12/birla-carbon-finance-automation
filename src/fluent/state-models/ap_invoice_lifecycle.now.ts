import { StateModel } from '@servicenow/sdk/core'

// AP Invoice lifecycle (Section 7 of the build brief). All transitions are
// manual (no `automatic: true`) — the AP subflows (Stage 15) decide when a
// transition is legal by running the actual validation/matching/posting
// logic first, then explicitly moving the state field forward. This keeps
// state progression fully driven by our own deterministic Script Include
// logic rather than depending on engine-evaluated automatic-transition
// timing that isn't documented clearly enough to rely on for a financial
// control flow.

export const apInvoiceLifecycle = StateModel({
    $id: Now.ID['ap-invoice-lifecycle'],
    name: 'AP Invoice Lifecycle',
    table: 'x_695068_bcfa_ap_invoice',
    stateField: 'state',
    states: {
        received: { $id: Now.ID['ap-state-received'], label: 'Received', value: 'RECEIVED', sequence: 0, initial: true },
        extracting: { $id: Now.ID['ap-state-extracting'], label: 'Extracting', value: 'EXTRACTING', sequence: 1 },
        extracted: { $id: Now.ID['ap-state-extracted'], label: 'Extracted', value: 'EXTRACTED', sequence: 2 },
        validating: { $id: Now.ID['ap-state-validating'], label: 'Validating', value: 'VALIDATING', sequence: 3 },
        validated: { $id: Now.ID['ap-state-validated'], label: 'Validated', value: 'VALIDATED', sequence: 4 },
        matching: { $id: Now.ID['ap-state-matching'], label: 'Matching', value: 'MATCHING', sequence: 5 },
        matched: { $id: Now.ID['ap-state-matched'], label: 'Matched', value: 'MATCHED', sequence: 6 },
        exception: { $id: Now.ID['ap-state-exception'], label: 'Exception', value: 'EXCEPTION', sequence: 7 },
        resolution: { $id: Now.ID['ap-state-resolution'], label: 'Resolution', value: 'RESOLUTION', sequence: 8 },
        pending_approval: { $id: Now.ID['ap-state-pending-approval'], label: 'Pending Approval', value: 'PENDING_APPROVAL', sequence: 9 },
        approved: { $id: Now.ID['ap-state-approved'], label: 'Approved', value: 'APPROVED', sequence: 10 },
        posting: { $id: Now.ID['ap-state-posting'], label: 'Posting', value: 'POSTING', sequence: 11 },
        posted: { $id: Now.ID['ap-state-posted'], label: 'Posted', value: 'POSTED', sequence: 12 },
        reconciled: { $id: Now.ID['ap-state-reconciled'], label: 'Reconciled', value: 'RECONCILED', sequence: 13 },
        closed: { $id: Now.ID['ap-state-closed'], label: 'Closed', value: 'CLOSED', sequence: 14 },
        failed: { $id: Now.ID['ap-state-failed'], label: 'Failed', value: 'FAILED', sequence: 15 },
        unknown_outcome: { $id: Now.ID['ap-state-unknown-outcome'], label: 'Unknown Outcome', value: 'UNKNOWN_OUTCOME', sequence: 16 },
    },
    transitions: [
        { $id: Now.ID['ap-trans-received-extracting'], from: 'received', to: 'extracting' },
        { $id: Now.ID['ap-trans-extracting-extracted'], from: 'extracting', to: 'extracted' },
        { $id: Now.ID['ap-trans-extracted-validating'], from: 'extracted', to: 'validating' },
        { $id: Now.ID['ap-trans-validating-validated'], from: 'validating', to: 'validated' },
        { $id: Now.ID['ap-trans-validating-exception'], from: 'validating', to: 'exception' },
        { $id: Now.ID['ap-trans-validated-matching'], from: 'validated', to: 'matching' },
        { $id: Now.ID['ap-trans-matching-matched'], from: 'matching', to: 'matched' },
        { $id: Now.ID['ap-trans-matching-exception'], from: 'matching', to: 'exception' },
        { $id: Now.ID['ap-trans-exception-resolution'], from: 'exception', to: 'resolution' },
        { $id: Now.ID['ap-trans-resolution-validating'], from: 'resolution', to: 'validating' },
        { $id: Now.ID['ap-trans-matched-pending-approval'], from: 'matched', to: 'pending_approval' },
        { $id: Now.ID['ap-trans-pending-approval-approved'], from: 'pending_approval', to: 'approved' },
        { $id: Now.ID['ap-trans-pending-approval-exception'], from: 'pending_approval', to: 'exception' },
        { $id: Now.ID['ap-trans-approved-posting'], from: 'approved', to: 'posting' },
        { $id: Now.ID['ap-trans-posting-posted'], from: 'posting', to: 'posted' },
        { $id: Now.ID['ap-trans-posting-unknown-outcome'], from: 'posting', to: 'unknown_outcome' },
        { $id: Now.ID['ap-trans-posting-failed'], from: 'posting', to: 'failed' },
        { $id: Now.ID['ap-trans-unknown-outcome-posted'], from: 'unknown_outcome', to: 'posted' },
        { $id: Now.ID['ap-trans-unknown-outcome-posting'], from: 'unknown_outcome', to: 'posting' },
        { $id: Now.ID['ap-trans-unknown-outcome-failed'], from: 'unknown_outcome', to: 'failed' },
        { $id: Now.ID['ap-trans-posted-reconciled'], from: 'posted', to: 'reconciled' },
        { $id: Now.ID['ap-trans-reconciled-closed'], from: 'reconciled', to: 'closed' },
        { $id: Now.ID['ap-trans-failed-resolution'], from: 'failed', to: 'resolution' },
    ],
})
