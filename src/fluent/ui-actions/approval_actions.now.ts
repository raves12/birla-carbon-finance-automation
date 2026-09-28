import { UiAction, Record } from '@servicenow/sdk/core'
import { bcfaApApprover, bcfaArApprover, bcfaAdmin } from '../security/roles.now'

// Discovered missing during Phase 6 demo validation: this app had zero UI
// Actions for approval decisions anywhere — every approval in the seeded
// demo data was driven by a direct ApDomainService/ArDomainService script
// call, never a clickable button. Editing AP Approval/AR Approval's
// `decision` field via the classic form does NOT cascade to posting/
// clearing (that sync only happens inside ApprovalEngine's own code, called
// from ApDomainService.decideApproval/ArDomainService.decideApproval) —
// confirmed live, where a manual field edit left the invoice sitting at
// PENDING_APPROVAL with no cascade. Without one of these, a live client
// demo has nothing to click for the "approve and watch it post" moment.
// Same role list as the existing self-approval ACL on each table's
// `decision` field (defense in depth, not a new access grant), and the
// existing ACL script (`requested_by != gs.getUserID()`) still enforces
// segregation of duties even if this button is somehow invoked
// incorrectly.

export const apApprovalApproveAction = UiAction({
    $id: Now.ID['ui-action-ap-approval-approve'],
    table: 'x_695068_bcfa_ap_approval',
    name: 'Approve',
    actionName: 'approve_ap_approval',
    hint: 'Approves this AP Invoice for posting. Triggers the same posting cascade a script-driven approval would.',
    showUpdate: true,
    condition: "current.decision == 'pending'",
    roles: [bcfaApApprover, bcfaAdmin],
    form: {
        showButton: true,
        style: 'primary',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var service = new ApDomainService();
        var result = service.decideApproval(current.getValue('ap_invoice'), current.getUniqueValue(), 'approved', gs.getUserID(), current.getValue('decision_notes') || 'Approved via UI.');
        if (result.error) {
            gs.addErrorMessage(result.error);
        } else {
            gs.addInfoMessage('Approved — posting cascade triggered.');
        }
        action.setRedirectURL(current);
    `,
})

// Workspace integration records — required for the button to render inside
// the BCFA workspace's Next Experience form; a UI Action with
// workspace.isConfigurableWorkspace alone has no visible entry point there.
const apApprovalApproveFormAction = Record({
    $id: Now.ID['ui-action-ap-approval-approve-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_ap_approval',
        ui_action: apApprovalApproveAction,
        action_type: 'ui_action',
        active: true,
        name: 'Approve',
    },
})

Record({
    $id: Now.ID['ui-action-ap-approval-approve-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_approval',
        name: 'Approve',
        label: 'Approve',
        color: 'primary',
        overflow: false,
        order: 100,
        active: true,
        item_type: 'action',
        action: apApprovalApproveFormAction,
    },
})

export const arApprovalApproveAction = UiAction({
    $id: Now.ID['ui-action-ar-approval-approve'],
    table: 'x_695068_bcfa_ar_approval',
    name: 'Approve',
    actionName: 'approve_ar_approval',
    hint: 'Approves this Payment for clearing. Triggers the same clearing cascade a script-driven approval would.',
    showUpdate: true,
    condition: "current.decision == 'pending'",
    roles: [bcfaArApprover, bcfaAdmin],
    form: {
        showButton: true,
        style: 'primary',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var service = new ArDomainService();
        var result = service.decideApproval(current.getValue('payment'), current.getUniqueValue(), 'approved', gs.getUserID(), current.getValue('decision_notes') || 'Approved via UI.');
        if (result.error) {
            gs.addErrorMessage(result.error);
        } else {
            gs.addInfoMessage('Approved — clearing cascade triggered.');
        }
        action.setRedirectURL(current);
    `,
})

const arApprovalApproveFormAction = Record({
    $id: Now.ID['ui-action-ar-approval-approve-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_ar_approval',
        ui_action: arApprovalApproveAction,
        action_type: 'ui_action',
        active: true,
        name: 'Approve',
    },
})

Record({
    $id: Now.ID['ui-action-ar-approval-approve-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ar_approval',
        name: 'Approve',
        label: 'Approve',
        color: 'primary',
        overflow: false,
        order: 100,
        active: true,
        item_type: 'action',
        action: arApprovalApproveFormAction,
    },
})

// Phase 17: Reject, with mandatory comments. Same segregation-of-duties
// gate as Approve (ApprovalEngine); a rejection raises an exception on the
// invoice or payment for the processor to handle.

export const apApprovalRejectAction = UiAction({
    $id: Now.ID['ui-action-ap-approval-reject'],
    table: 'x_695068_bcfa_ap_approval',
    name: 'Reject',
    actionName: 'reject_ap_approval',
    hint: 'Rejects this AP Invoice approval. Enter the reason in Decision Notes first.',
    showUpdate: true,
    condition: "current.decision == 'pending'",
    roles: [bcfaApApprover, bcfaAdmin],
    form: { showButton: true, style: 'destructive' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var notes = current.getValue('decision_notes');
        if (!notes || notes.trim().length < 10) {
            gs.addErrorMessage('Enter the rejection reason in Decision Notes (at least 10 characters) before rejecting.');
        } else {
            var result = new ApDomainService().decideApproval(current.getValue('ap_invoice'), current.getUniqueValue(), 'rejected', gs.getUserID(), notes);
            if (result.error) gs.addErrorMessage(result.error); else gs.addInfoMessage('Rejected — an exception was raised on the invoice.');
        }
        action.setRedirectURL(current);
    `,
})

const apApprovalRejectFormAction = Record({
    $id: Now.ID['ui-action-ap-approval-reject-form-action'],
    table: 'sys_ux_form_action',
    data: { table: 'x_695068_bcfa_ap_approval', ui_action: apApprovalRejectAction, action_type: 'ui_action', active: true, name: 'Reject' },
})

Record({
    $id: Now.ID['ui-action-ap-approval-reject-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_approval', name: 'Reject', label: 'Reject', color: 'critical',
        overflow: false, order: 110, active: true, item_type: 'action', action: apApprovalRejectFormAction,
    },
})

export const arApprovalRejectAction = UiAction({
    $id: Now.ID['ui-action-ar-approval-reject'],
    table: 'x_695068_bcfa_ar_approval',
    name: 'Reject',
    actionName: 'reject_ar_approval',
    hint: 'Rejects this Payment approval. Enter the reason in Decision Notes first.',
    showUpdate: true,
    condition: "current.decision == 'pending'",
    roles: [bcfaArApprover, bcfaAdmin],
    form: { showButton: true, style: 'destructive' },
    workspace: { isConfigurableWorkspace: true, showFormButtonV2: true },
    script: `
        var notes = current.getValue('decision_notes');
        if (!notes || notes.trim().length < 10) {
            gs.addErrorMessage('Enter the rejection reason in Decision Notes (at least 10 characters) before rejecting.');
        } else {
            var result = new ArDomainService().decideApproval(current.getValue('payment'), current.getUniqueValue(), 'rejected', gs.getUserID(), notes);
            if (result.error) gs.addErrorMessage(result.error); else gs.addInfoMessage('Rejected — an exception was raised on the payment.');
        }
        action.setRedirectURL(current);
    `,
})

const arApprovalRejectFormAction = Record({
    $id: Now.ID['ui-action-ar-approval-reject-form-action'],
    table: 'sys_ux_form_action',
    data: { table: 'x_695068_bcfa_ar_approval', ui_action: arApprovalRejectAction, action_type: 'ui_action', active: true, name: 'Reject' },
})

Record({
    $id: Now.ID['ui-action-ar-approval-reject-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ar_approval', name: 'Reject', label: 'Reject', color: 'critical',
        overflow: false, order: 110, active: true, item_type: 'action', action: arApprovalRejectFormAction,
    },
})
