import { UiAction, Record } from '@servicenow/sdk/core'
import { bcfaAdmin, bcfaArProcessor, bcfaFinanceApprover } from '../security/roles.now'

// Phase 13: the reviewer's decision on an AR exception. The reviewer sets
// Decision Reason (and, for a deduction, Deduction Type) on the form, then
// chooses one of these. Every rule (roles, mandatory reason, allowed payment
// state, short-pay only, allowed deduction types, deduction threshold, no AI
// identity) is enforced by ArExceptionDecisionService; the roles and
// conditions here only hide buttons that would be refused anyway. The
// service writes the exception itself, so these scripts never call
// current.update().

export const arExceptionApproveDeduction = UiAction({
    $id: Now.ID['ui-action-ar-exception-approve-deduction'],
    table: 'x_695068_bcfa_ar_exception',
    name: 'Approve Deduction',
    actionName: 'approve_deduction_ar_exception',
    hint: 'Accept the short-pay residual as a deduction of the chosen Deduction Type. The balance is re-checked and the payment goes for approval by a different user. Requires a Decision Reason.',
    showUpdate: true,
    condition: "(current.status == 'open' || current.status == 'in_review') && current.reason_code == 'short_pay'",
    roles: [bcfaArProcessor, bcfaFinanceApprover, bcfaAdmin],
    form: { showButton: true, style: 'primary' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var result = new ArExceptionDecisionService().decide(current.getUniqueValue(), 'approve_deduction', current.getValue('decision_reason'));
        if (!result.ok) {
            gs.addErrorMessage(result.error);
        } else {
            gs.addInfoMessage('Deduction ' + result.deductionType + ' ' + result.amount + ' approved. Payment state: ' + result.paymentState + (result.approvalRequired ? ' (awaiting approval by a different user).' : '.'));
        }
        action.setRedirectURL(current);
    `,
})

export const arExceptionRequestClarification = UiAction({
    $id: Now.ID['ui-action-ar-exception-request-clarification'],
    table: 'x_695068_bcfa_ar_exception',
    name: 'Request Clarification',
    actionName: 'request_clarification_ar_exception',
    hint: 'Put the payment on hold while the customer is asked to clarify. Requires a Decision Reason.',
    showUpdate: true,
    condition: "current.status == 'open' || current.status == 'in_review'",
    roles: [bcfaArProcessor, bcfaFinanceApprover, bcfaAdmin],
    form: { showButton: true, style: 'unstyled' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var result = new ArExceptionDecisionService().decide(current.getUniqueValue(), 'request_clarification', current.getValue('decision_reason'));
        if (!result.ok) gs.addErrorMessage(result.error); else gs.addInfoMessage('Clarification requested; payment is on hold. ' + result.next);
        action.setRedirectURL(current);
    `,
})

export const arExceptionHold = UiAction({
    $id: Now.ID['ui-action-ar-exception-hold'],
    table: 'x_695068_bcfa_ar_exception',
    name: 'Hold',
    actionName: 'hold_ar_exception',
    hint: 'Park the payment (ON_HOLD) pending investigation. Requires a Decision Reason.',
    showUpdate: true,
    condition: "current.status == 'open'",
    roles: [bcfaArProcessor, bcfaFinanceApprover, bcfaAdmin],
    form: { showButton: true, style: 'unstyled' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var result = new ArExceptionDecisionService().decide(current.getUniqueValue(), 'hold', current.getValue('decision_reason'));
        if (!result.ok) gs.addErrorMessage(result.error); else gs.addInfoMessage('Payment put on hold.');
        action.setRedirectURL(current);
    `,
})

// Workspace form action records (see approval_actions.now.ts).

const arExceptionApproveDeductionFormAction = Record({
    $id: Now.ID['ui-action-ar-exception-approve-deduction-form-action'],
    table: 'sys_ux_form_action',
    data: { table: 'x_695068_bcfa_ar_exception', ui_action: arExceptionApproveDeduction, action_type: 'ui_action', active: true, name: 'Approve Deduction' },
})

Record({
    $id: Now.ID['ui-action-ar-exception-approve-deduction-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ar_exception', name: 'Approve Deduction', label: 'Approve Deduction', color: 'primary',
        overflow: false, order: 110, active: true, item_type: 'action', action: arExceptionApproveDeductionFormAction,
    },
})

const arExceptionRequestClarificationFormAction = Record({
    $id: Now.ID['ui-action-ar-exception-request-clarification-form-action'],
    table: 'sys_ux_form_action',
    data: { table: 'x_695068_bcfa_ar_exception', ui_action: arExceptionRequestClarification, action_type: 'ui_action', active: true, name: 'Request Clarification' },
})

Record({
    $id: Now.ID['ui-action-ar-exception-request-clarification-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ar_exception', name: 'Request Clarification', label: 'Request Clarification', color: 'secondary',
        overflow: false, order: 120, active: true, item_type: 'action', action: arExceptionRequestClarificationFormAction,
    },
})

const arExceptionHoldFormAction = Record({
    $id: Now.ID['ui-action-ar-exception-hold-form-action'],
    table: 'sys_ux_form_action',
    data: { table: 'x_695068_bcfa_ar_exception', ui_action: arExceptionHold, action_type: 'ui_action', active: true, name: 'Hold' },
})

Record({
    $id: Now.ID['ui-action-ar-exception-hold-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ar_exception', name: 'Hold', label: 'Hold', color: 'secondary',
        overflow: false, order: 130, active: true, item_type: 'action', action: arExceptionHoldFormAction,
    },
})
