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

export const apExceptionExplainWithClaude = UiAction({
    $id: Now.ID['ui-action-ap-exception-explain-claude'],
    table: 'x_695068_bcfa_ap_exception',
    name: 'Explain with Claude',
    actionName: 'explain_with_claude_ap',
    hint: 'Ask Claude to (re)generate the advisory AI Recommendation for this exception. Advisory only.',
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
        var service = new ApDomainService();
        service.explainException(current.getUniqueValue());
        action.setRedirectURL(current);
    `,
})

const apExceptionExplainWithClaudeFormAction = Record({
    $id: Now.ID['ui-action-ap-exception-explain-claude-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_ap_exception',
        ui_action: apExceptionExplainWithClaude,
        action_type: 'ui_action',
        active: true,
        name: 'Explain with Claude',
    },
})

Record({
    $id: Now.ID['ui-action-ap-exception-explain-claude-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_exception',
        name: 'Explain with Claude',
        label: 'Explain with Claude',
        color: 'primary-ai',
        overflow: false,
        order: 100,
        active: true,
        item_type: 'action',
        action: apExceptionExplainWithClaudeFormAction,
    },
})

export const arExceptionExplainWithClaude = UiAction({
    $id: Now.ID['ui-action-ar-exception-explain-claude'],
    table: 'x_695068_bcfa_ar_exception',
    name: 'Explain with Claude',
    actionName: 'explain_with_claude_ar',
    hint: 'Ask Claude to (re)generate the advisory AI Recommendation for this exception. Advisory only.',
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
        var service = new ArDomainService();
        service.explainException(current.getUniqueValue());
        action.setRedirectURL(current);
    `,
})

const arExceptionExplainWithClaudeFormAction = Record({
    $id: Now.ID['ui-action-ar-exception-explain-claude-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_ar_exception',
        ui_action: arExceptionExplainWithClaude,
        action_type: 'ui_action',
        active: true,
        name: 'Explain with Claude',
    },
})

Record({
    $id: Now.ID['ui-action-ar-exception-explain-claude-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ar_exception',
        name: 'Explain with Claude',
        label: 'Explain with Claude',
        color: 'primary-ai',
        overflow: false,
        order: 100,
        active: true,
        item_type: 'action',
        action: arExceptionExplainWithClaudeFormAction,
    },
})
