import { UiAction, Record } from '@servicenow/sdk/core'
import { bcfaAdmin, bcfaApProcessor, bcfaFinanceApprover } from '../security/roles.now'

// Phase 12: the finance user's decision on an AP exception. The user types
// a Decision Reason on the form, then chooses one of these. Every rule
// (roles, mandatory reason, allowed invoice state, override policy,
// maker/checker, no AI identity) is enforced by ApExceptionDecisionService,
// not by these buttons; the roles and conditions here only hide buttons
// that would be refused anyway. The service writes the exception itself,
// so these scripts never call current.update().

export const apExceptionApproveOverride = UiAction({
    $id: Now.ID['ui-action-ap-exception-approve-override'],
    table: 'x_695068_bcfa_ap_exception',
    name: 'Approve Override',
    actionName: 'approve_override_ap_exception',
    hint: 'Finance approver: accept this tolerance variance. The invoice is approved in the exception owner\'s name (maker/checker) and posts to SAP (mock). Requires a Decision Reason.',
    showUpdate: true,
    condition: "current.status == 'open' || current.status == 'in_review'",
    roles: [bcfaFinanceApprover, bcfaAdmin],
    form: { showButton: true, style: 'primary' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var result = new ApExceptionDecisionService().decide(current.getUniqueValue(), 'approve_override', current.getValue('decision_reason'));
        if (!result.ok) {
            gs.addErrorMessage(result.error);
        } else {
            gs.addInfoMessage('Override approved. Invoice state: ' + result.invoiceState + (result.sapDocumentId ? ', SAP document ' + result.sapDocumentId : '') + '.');
        }
        action.setRedirectURL(current);
    `,
})

export const apExceptionReject = UiAction({
    $id: Now.ID['ui-action-ap-exception-reject'],
    table: 'x_695068_bcfa_ap_exception',
    name: 'Reject Invoice',
    actionName: 'reject_ap_exception',
    hint: 'Reject the invoice: it will not be paid. Requires a Decision Reason.',
    showUpdate: true,
    condition: "current.status == 'open' || current.status == 'in_review'",
    roles: [bcfaApProcessor, bcfaFinanceApprover, bcfaAdmin],
    form: { showButton: true, style: 'destructive' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var result = new ApExceptionDecisionService().decide(current.getUniqueValue(), 'reject', current.getValue('decision_reason'));
        if (!result.ok) gs.addErrorMessage(result.error); else gs.addInfoMessage('Invoice rejected.');
        action.setRedirectURL(current);
    `,
})

export const apExceptionRequestCorrection = UiAction({
    $id: Now.ID['ui-action-ap-exception-request-correction'],
    table: 'x_695068_bcfa_ap_exception',
    name: 'Request Correction',
    actionName: 'request_correction_ap_exception',
    hint: 'Put the invoice on hold until a corrected invoice or credit note arrives; then use Resolve & Retry. Requires a Decision Reason.',
    showUpdate: true,
    condition: "current.status == 'open' || current.status == 'in_review'",
    roles: [bcfaApProcessor, bcfaFinanceApprover, bcfaAdmin],
    form: { showButton: true, style: 'unstyled' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var result = new ApExceptionDecisionService().decide(current.getUniqueValue(), 'request_correction', current.getValue('decision_reason'));
        if (!result.ok) gs.addErrorMessage(result.error); else gs.addInfoMessage('Correction requested; invoice is on hold. ' + result.next);
        action.setRedirectURL(current);
    `,
})

export const apExceptionHold = UiAction({
    $id: Now.ID['ui-action-ap-exception-hold'],
    table: 'x_695068_bcfa_ap_exception',
    name: 'Hold',
    actionName: 'hold_ap_exception',
    hint: 'Park the invoice (ON_HOLD) pending investigation. Requires a Decision Reason.',
    showUpdate: true,
    condition: "current.status == 'open'",
    roles: [bcfaApProcessor, bcfaFinanceApprover, bcfaAdmin],
    form: { showButton: true, style: 'unstyled' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var result = new ApExceptionDecisionService().decide(current.getUniqueValue(), 'hold', current.getValue('decision_reason'));
        if (!result.ok) gs.addErrorMessage(result.error); else gs.addInfoMessage('Invoice put on hold.');
        action.setRedirectURL(current);
    `,
})

// Workspace form action records: needed for the buttons to render in the
// BCFA workspace (see approval_actions.now.ts).

const apExceptionApproveOverrideFormAction = Record({
    $id: Now.ID['ui-action-ap-exception-approve-override-form-action'],
    table: 'sys_ux_form_action',
    data: { table: 'x_695068_bcfa_ap_exception', ui_action: apExceptionApproveOverride, action_type: 'ui_action', active: true, name: 'Approve Override' },
})

Record({
    $id: Now.ID['ui-action-ap-exception-approve-override-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_exception', name: 'Approve Override', label: 'Approve Override', color: 'primary',
        overflow: false, order: 110, active: true, item_type: 'action', action: apExceptionApproveOverrideFormAction,
    },
})

const apExceptionRejectFormAction = Record({
    $id: Now.ID['ui-action-ap-exception-reject-form-action'],
    table: 'sys_ux_form_action',
    data: { table: 'x_695068_bcfa_ap_exception', ui_action: apExceptionReject, action_type: 'ui_action', active: true, name: 'Reject Invoice' },
})

Record({
    $id: Now.ID['ui-action-ap-exception-reject-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_exception', name: 'Reject Invoice', label: 'Reject Invoice', color: 'critical',
        overflow: false, order: 120, active: true, item_type: 'action', action: apExceptionRejectFormAction,
    },
})

const apExceptionRequestCorrectionFormAction = Record({
    $id: Now.ID['ui-action-ap-exception-request-correction-form-action'],
    table: 'sys_ux_form_action',
    data: { table: 'x_695068_bcfa_ap_exception', ui_action: apExceptionRequestCorrection, action_type: 'ui_action', active: true, name: 'Request Correction' },
})

Record({
    $id: Now.ID['ui-action-ap-exception-request-correction-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_exception', name: 'Request Correction', label: 'Request Correction', color: 'secondary',
        overflow: false, order: 130, active: true, item_type: 'action', action: apExceptionRequestCorrectionFormAction,
    },
})

const apExceptionHoldFormAction = Record({
    $id: Now.ID['ui-action-ap-exception-hold-form-action'],
    table: 'sys_ux_form_action',
    data: { table: 'x_695068_bcfa_ap_exception', ui_action: apExceptionHold, action_type: 'ui_action', active: true, name: 'Hold' },
})

Record({
    $id: Now.ID['ui-action-ap-exception-hold-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_exception', name: 'Hold', label: 'Hold', color: 'secondary',
        overflow: false, order: 140, active: true, item_type: 'action', action: apExceptionHoldFormAction,
    },
})
