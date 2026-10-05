import { StateModel } from '@servicenow/sdk/core'

// Cash Application lifecycle (Section 8 of the build brief). Enforced since
// Phase 26 (see docs/STATE_MODELS.md). Same manual-
// transition philosophy as the AP Invoice lifecycle — see
// ap_invoice_lifecycle.now.ts for the rationale.

export const cashApplicationLifecycle = StateModel({
    $id: Now.ID['cash-app-lifecycle'],
    name: 'Cash Application Lifecycle',
    table: 'x_695068_bcfa_payment',
    stateField: 'state',
    states: {
        received: { $id: Now.ID['ca-state-received'], label: 'Received', value: 'RECEIVED', sequence: 0, initial: true },
        normalized: { $id: Now.ID['ca-state-normalized'], label: 'Normalized', value: 'NORMALIZED', sequence: 1 },
        customer_resolution: { $id: Now.ID['ca-state-customer-resolution'], label: 'Customer Resolution', value: 'CUSTOMER_RESOLUTION', sequence: 2 },
        matching: { $id: Now.ID['ca-state-matching'], label: 'Matching', value: 'MATCHING', sequence: 3 },
        matched: { $id: Now.ID['ca-state-matched'], label: 'Matched', value: 'MATCHED', sequence: 4 },
        partially_matched: { $id: Now.ID['ca-state-partially-matched'], label: 'Partially Matched', value: 'PARTIALLY_MATCHED', sequence: 5 },
        unmatched: { $id: Now.ID['ca-state-unmatched'], label: 'Unmatched', value: 'UNMATCHED', sequence: 6 },
        allocation: { $id: Now.ID['ca-state-allocation'], label: 'Allocation', value: 'ALLOCATION', sequence: 7 },
        exception: { $id: Now.ID['ca-state-exception'], label: 'Exception', value: 'EXCEPTION', sequence: 8 },
        pending_approval: { $id: Now.ID['ca-state-pending-approval'], label: 'Pending Approval', value: 'PENDING_APPROVAL', sequence: 9 },
        approved: { $id: Now.ID['ca-state-approved'], label: 'Approved', value: 'APPROVED', sequence: 10 },
        clearing: { $id: Now.ID['ca-state-clearing'], label: 'Clearing', value: 'CLEARING', sequence: 11 },
        cleared: { $id: Now.ID['ca-state-cleared'], label: 'Cleared', value: 'CLEARED', sequence: 12 },
        reconciled: { $id: Now.ID['ca-state-reconciled'], label: 'Reconciled', value: 'RECONCILED', sequence: 13 },
        closed: { $id: Now.ID['ca-state-closed'], label: 'Closed', value: 'CLOSED', sequence: 14 },
        failed: { $id: Now.ID['ca-state-failed'], label: 'Failed', value: 'FAILED', sequence: 15 },
        unknown_outcome: { $id: Now.ID['ca-state-unknown-outcome'], label: 'Unknown Outcome', value: 'UNKNOWN_OUTCOME', sequence: 16 },
        // Phase 13 human decisions on an exception (ArExceptionDecisionService).
        on_hold: { $id: Now.ID['ca-state-on-hold'], label: 'On Hold', value: 'ON_HOLD', sequence: 17 },
        // Playbook phase: SAP processing mode DRAFT. The approved clearing is
        // staged in SAP and awaits SAP confirmation; it is not cleared yet.
        sap_draft: { $id: Now.ID['ca-state-sap-draft'], label: 'SAP Draft (awaiting SAP confirmation)', value: 'SAP_DRAFT', sequence: 18 },
    },
    transitions: [
        { $id: Now.ID['ca-trans-received-normalized'], from: 'received', to: 'normalized' },
        { $id: Now.ID['ca-trans-normalized-customer-resolution'], from: 'normalized', to: 'customer_resolution' },
        { $id: Now.ID['ca-trans-customer-resolution-matching'], from: 'customer_resolution', to: 'matching' },
        { $id: Now.ID['ca-trans-customer-resolution-exception'], from: 'customer_resolution', to: 'exception' },
        { $id: Now.ID['ca-trans-matching-matched'], from: 'matching', to: 'matched' },
        { $id: Now.ID['ca-trans-matching-partially-matched'], from: 'matching', to: 'partially_matched' },
        { $id: Now.ID['ca-trans-matching-unmatched'], from: 'matching', to: 'unmatched' },
        { $id: Now.ID['ca-trans-matched-allocation'], from: 'matched', to: 'allocation' },
        { $id: Now.ID['ca-trans-partially-matched-allocation'], from: 'partially_matched', to: 'allocation' },
        { $id: Now.ID['ca-trans-unmatched-exception'], from: 'unmatched', to: 'exception' },
        { $id: Now.ID['ca-trans-allocation-exception'], from: 'allocation', to: 'exception' },
        { $id: Now.ID['ca-trans-allocation-pending-approval'], from: 'allocation', to: 'pending_approval' },
        { $id: Now.ID['ca-trans-exception-matching'], from: 'exception', to: 'matching' },
        { $id: Now.ID['ca-trans-pending-approval-approved'], from: 'pending_approval', to: 'approved' },
        { $id: Now.ID['ca-trans-pending-approval-exception'], from: 'pending_approval', to: 'exception' },
        { $id: Now.ID['ca-trans-approved-clearing'], from: 'approved', to: 'clearing' },
        { $id: Now.ID['ca-trans-clearing-cleared'], from: 'clearing', to: 'cleared' },
        { $id: Now.ID['ca-trans-clearing-unknown-outcome'], from: 'clearing', to: 'unknown_outcome' },
        { $id: Now.ID['ca-trans-clearing-failed'], from: 'clearing', to: 'failed' },
        { $id: Now.ID['ca-trans-unknown-outcome-cleared'], from: 'unknown_outcome', to: 'cleared' },
        { $id: Now.ID['ca-trans-unknown-outcome-clearing'], from: 'unknown_outcome', to: 'clearing' },
        { $id: Now.ID['ca-trans-unknown-outcome-failed'], from: 'unknown_outcome', to: 'failed' },
        { $id: Now.ID['ca-trans-cleared-reconciled'], from: 'cleared', to: 'reconciled' },
        { $id: Now.ID['ca-trans-reconciled-closed'], from: 'reconciled', to: 'closed' },
        { $id: Now.ID['ca-trans-failed-exception'], from: 'failed', to: 'exception' },
        // Approved deduction re-balances the allocation; hold / clarification (Phase 13).
        { $id: Now.ID['ca-trans-exception-pending-approval'], from: 'exception', to: 'pending_approval' },
        { $id: Now.ID['ca-trans-exception-on-hold'], from: 'exception', to: 'on_hold' },
        { $id: Now.ID['ca-trans-on-hold-pending-approval'], from: 'on_hold', to: 'pending_approval' },
        { $id: Now.ID['ca-trans-on-hold-matching'], from: 'on_hold', to: 'matching' },
        // Phase 26: transitions the pipeline makes that the model lacked.
        // Mandatory payment fields missing at normalization.
        { $id: Now.ID['ca-trans-received-exception'], from: 'received', to: 'exception' },
        // Ambiguous match (several exact options) or currency mismatch with
        // the remittance: the engine does not choose, straight to exception.
        { $id: Now.ID['ca-trans-matching-exception'], from: 'matching', to: 'exception' },
        // Reconciliation confirmed nothing was committed: safe to clear again.
        { $id: Now.ID['ca-trans-unknown-outcome-approved'], from: 'unknown_outcome', to: 'approved' },
        // Playbook phase: DRAFT mode. Staged, then confirmed or rejected by SAP.
        { $id: Now.ID['ca-trans-clearing-sap-draft'], from: 'clearing', to: 'sap_draft' },
        { $id: Now.ID['ca-trans-sap-draft-cleared'], from: 'sap_draft', to: 'cleared' },
        { $id: Now.ID['ca-trans-sap-draft-failed'], from: 'sap_draft', to: 'failed' },
    ],
})
