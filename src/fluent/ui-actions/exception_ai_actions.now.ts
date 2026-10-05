import { UiAction, Record } from '@servicenow/sdk/core'

// Minimal Phase 4 UX surface: exactly one manual AI entry point per
// exception table, matching the one place a reviewer genuinely wants more
// AI insight on demand — regenerating the advisory explanation. Extraction
// and cash-match recommendation already run automatically at intake/match
// time (see ApDomainService/ArDomainService), so they have no natural
// "click to run" moment without re-running the whole pipeline; deliberately
// not adding buttons for those to avoid UI that doesn't map to a real
// action a reviewer would take. Both actions only ever write to the
// existing advisory ai_recommendation field — never reason_code, status,
// approval, or posting/clearing state.

// Phase 12: the AP action now uses ServiceNow AI (Now Assist skills via
// FinanceAgentTools, as the signed-in user). Same record ids as the former
// "Explain with Claude" action, so it is updated in place. The AR action
// switched the same way in Phase 13.
export const apExceptionExplainWithNowAssist = UiAction({
    $id: Now.ID['ui-action-ap-exception-explain-claude'],
    table: 'x_695068_bcfa_ap_exception',
    name: 'Explain with Now Assist',
    actionName: 'explain_with_now_assist_ap',
    hint: 'Ask Now Assist to (re)generate the advisory explanation and recommended next action for this exception. Advisory only: it never decides the exception.',
    showUpdate: true,
    form: {
        showButton: true,
        style: 'primary-ai',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var result = new ApDomainService().explainException(current.getUniqueValue());
        if (result && result.ok === false) gs.addErrorMessage('Now Assist could not explain this exception: ' + (result.message || result.error));
        action.setRedirectURL(current);
    `,
})

const apExceptionExplainWithNowAssistFormAction = Record({
    $id: Now.ID['ui-action-ap-exception-explain-claude-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_ap_exception',
        ui_action: apExceptionExplainWithNowAssist,
        action_type: 'ui_action',
        active: true,
        name: 'Explain with Now Assist',
    },
})

Record({
    $id: Now.ID['ui-action-ap-exception-explain-claude-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_exception',
        name: 'Explain with Now Assist',
        label: 'Explain with Now Assist',
        color: 'primary-ai',
        overflow: false,
        order: 100,
        active: true,
        item_type: 'action',
        action: apExceptionExplainWithNowAssistFormAction,
    },
})

export const arExceptionExplainWithNowAssist = UiAction({
    $id: Now.ID['ui-action-ar-exception-explain-claude'],
    table: 'x_695068_bcfa_ar_exception',
    name: 'Explain with Now Assist',
    actionName: 'explain_with_now_assist_ar',
    hint: 'Ask Now Assist to (re)generate the advisory explanation and recommended next action for this exception. Advisory only: it never decides the exception.',
    showUpdate: true,
    form: {
        showButton: true,
        style: 'primary-ai',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var result = new ArDomainService().explainException(current.getUniqueValue());
        if (result && result.ok === false) gs.addErrorMessage('Now Assist could not explain this exception: ' + (result.message || result.error));
        action.setRedirectURL(current);
    `,
})

const arExceptionExplainWithNowAssistFormAction = Record({
    $id: Now.ID['ui-action-ar-exception-explain-claude-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_ar_exception',
        ui_action: arExceptionExplainWithNowAssist,
        action_type: 'ui_action',
        active: true,
        name: 'Explain with Now Assist',
    },
})

Record({
    $id: Now.ID['ui-action-ar-exception-explain-claude-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ar_exception',
        name: 'Explain with Now Assist',
        label: 'Explain with Now Assist',
        color: 'primary-ai',
        overflow: false,
        order: 100,
        active: true,
        item_type: 'action',
        action: arExceptionExplainWithNowAssistFormAction,
    },
})
