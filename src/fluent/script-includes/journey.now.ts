import { ScriptInclude, ScheduledScript, Property, UiAction } from '@servicenow/sdk/core'
import { bcfaAdmin, bcfaArProcessor, bcfaFinanceApprover, bcfaIntegrationOperator } from '../security/roles.now'

// Playbook phase: the journey presentation layer and the AR SAP processing
// mode (Draft / Direct). See docs/PLAYBOOK_DESIGN.md.

export const financeJourneyService = ScriptInclude({
    $id: Now.ID['si-finance-journey-service'],
    name: 'FinanceJourneyService',
    active: true,
    apiName: 'x_695068_bcfa.FinanceJourneyService',
    description:
        'Derives the journey (Playbook) fields of an AP invoice or a payment from the authoritative records: stage, status, blocked-because, next action, owner. Display only; refreshed with the Review Summary on every state change.',
    script: Now.include('../../server/script-includes/FinanceJourneyService.server.js'),
})

export const arSapProcessingMode = Property({
    $id: Now.ID['prop-ar-sap-processing-mode'],
    name: 'x_695068_bcfa.ar.sap_processing_mode',
    type: 'string',
    value: 'direct',
    description:
        'How an approved payment is handed to SAP: direct = SAP clears it immediately; draft = it is staged (parked) in SAP and counts as cleared only after SAP confirms it. Captured on each payment when clearing starts. POC: MOCK SAP simulates both modes.',
})

export const mockSapDraftOutcome = Property({
    $id: Now.ID['prop-mock-sap-draft-outcome'],
    name: 'x_695068_bcfa.mock_sap.draft_outcome',
    type: 'string',
    value: 'pending',
    description:
        'MOCK SAP simulation only: what the simulated SAP user has done with a staged draft when its status is checked. pending (default: not yet posted, the payment stays in SAP_DRAFT), posted or rejected. Set to posted to demonstrate the confirmation. Has no meaning for a real SAP adapter.',
})

// Phase 41: MOCK SAP checks the SAP-ready request data (SapPayloadBuilder).
export const mockSapStrictValidation = Property({
    $id: Now.ID['prop-mock-sap-strict-validation'],
    name: 'x_695068_bcfa.mock_sap.strict_validation',
    type: 'boolean',
    value: 'false',
    description:
        'MOCK SAP simulation only. false (default): what real SAP would reject in a posting or clearing request (e.g. no invoice date, no company code) is recorded as warnings on the integration transaction and the audit, and the call succeeds. true: such a request is rejected with VALIDATION_ERROR, as real SAP would, to rehearse SAP-ready data. Has no meaning for a real SAP adapter.',
})

// DRAFT mode: a status query only (nothing is re-sent). Hidden unless the
// payment is staged as an SAP draft.
export const paymentCheckSapDraftStatus = UiAction({
    $id: Now.ID['ui-action-payment-check-sap-draft'],
    table: 'x_695068_bcfa_payment',
    name: 'Check SAP Draft Status',
    actionName: 'check_sap_draft_status_payment',
    hint: 'Ask SAP (MOCK SAP) whether the staged draft clearing document has been posted. A status query only: nothing is re-sent.',
    showUpdate: true,
    condition: "current.state == 'SAP_DRAFT'",
    roles: [bcfaIntegrationOperator, bcfaArProcessor, bcfaFinanceApprover, bcfaAdmin],
    form: { showButton: true, style: 'primary' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var result = new ArDomainService().checkSapDraftStatus(current.getUniqueValue());
        if (result.error) gs.addErrorMessage(result.error);
        else if (result.cleared) gs.addInfoMessage('SAP confirmed the draft (MOCK SAP): cleared as ' + result.sapDocumentId + '.');
        else if (result.failed) gs.addErrorMessage('SAP rejected the draft (MOCK SAP); an exception was raised.');
        else gs.addInfoMessage('The draft is not yet posted in SAP (MOCK SAP). Nothing changed and nothing was re-sent.');
        action.setRedirectURL(current);
    `,
})

export const sapDraftStatusCheckJob = ScheduledScript({
    $id: Now.ID['job-sap-draft-status-check'],
    name: 'BCFA - SAP Draft Status Check',
    frequency: 'periodically',
    executionInterval: Duration({ minutes: 30 }),
    executionStart: '2026-10-01 00:00:00',
    active: true,
    script: `
        // Status query only for payments staged as SAP drafts; never re-sends.
        var pay = new GlideRecord('x_695068_bcfa_payment');
        pay.addQuery('state', 'SAP_DRAFT');
        pay.query();
        var svc = new ArDomainService(), cleared = 0, pending = 0, failed = 0;
        while (pay.next()) {
            var r = svc.checkSapDraftStatus(pay.getUniqueValue());
            if (r.cleared) cleared++; else if (r.failed) failed++; else pending++;
        }
        gs.info('BCFA SAP draft status check: cleared ' + cleared + ', pending ' + pending + ', failed ' + failed);
    `,
})
