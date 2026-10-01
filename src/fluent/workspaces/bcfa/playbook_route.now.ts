import { Record, UiAction } from '@servicenow/sdk/core'
import {
    bcfaAdmin,
    bcfaApProcessor,
    bcfaApApprover,
    bcfaArProcessor,
    bcfaArApprover,
    bcfaFinanceReviewer,
    bcfaFinanceApprover,
    bcfaIntegrationOperator,
    bcfaAuditor,
    bcfaReadOnly,
} from '../../security/roles.now'

// Playbook phase: embeds the native ServiceNow Playbook experience in the
// BCFA Workspace. The record page ("Record Default") is preset-based and not
// editable from Fluent, so the Playbook gets its own workspace route that
// renders the platform's Playbook page (the same page macroponent Service
// Operations Workspace uses) for any BCFA invoice or payment:
//   /now/bcfa/playbook/x_695068_bcfa_ap_invoice/<sys_id>
//   /now/bcfa/playbook/x_695068_bcfa_payment/<sys_id>
// Covered by the existing bcfa.* route ACL. Display only.

const BCFA_APP_CONFIG = 'a31c27cbf9474e3f93e47c8ac7a7cbe1' // sys_ux_app_config of the BCFA workspace
const BCFA_SHELL = 'c276387cc331101080d6d3658940ddd2' // workspace shell macroponent (all BCFA routes)
const PLATFORM_PLAYBOOK_PAGE = '32eb57e82c904510f877b925aa1a4d10' // sys_ux_macroponent "Playbook" (props table, sysId)

export const bcfaPlaybookScreenType = Record({
    $id: Now.ID['bcfa-playbook-screen-type'],
    table: 'sys_ux_screen_type',
    data: { name: 'BCFA Playbook' },
})

export const bcfaPlaybookRoute = Record({
    $id: Now.ID['bcfa-playbook-route'],
    table: 'sys_ux_app_route',
    data: {
        name: 'BCFA Playbook',
        route_type: 'playbook',
        fields: 'table,sysId',
        app_config: BCFA_APP_CONFIG,
        parent_macroponent: BCFA_SHELL,
        screen_type: bcfaPlaybookScreenType,
        order: 500,
    },
})

export const bcfaPlaybookScreen = Record({
    $id: Now.ID['bcfa-playbook-screen'],
    table: 'sys_ux_screen',
    data: {
        name: 'BCFA Playbook',
        app_config: BCFA_APP_CONFIG,
        screen_type: bcfaPlaybookScreenType,
        macroponent: PLATFORM_PLAYBOOK_PAGE,
        order: 100,
        macroponent_config: JSON.stringify({
            sysId: { type: 'CONTEXT_BINDING', binding: { address: ['sysId'], category: 'props' } },
            table: { type: 'CONTEXT_BINDING', binding: { address: ['table'], category: 'props' } },
            label: { type: 'JSON_LITERAL', value: '' },
            bare: { type: 'JSON_LITERAL', value: true },
            scrollable: { type: 'JSON_LITERAL', value: 'y' },
            headerLevel: { type: 'JSON_LITERAL', value: '1' },
            headingOnlyVisibleToScreenReaders: { type: 'JSON_LITERAL', value: false },
            interceptNotifications: { type: 'JSON_LITERAL', value: false },
            propagateNotifications: { type: 'JSON_LITERAL', value: false },
        }),
    },
})

// "Open Playbook" form links (classic form). Navigation only: no data change.
export const apInvoiceOpenPlaybook = UiAction({
    $id: Now.ID['ui-action-ap-invoice-open-playbook'],
    table: 'x_695068_bcfa_ap_invoice',
    name: 'Open Playbook',
    actionName: 'open_playbook_ap_invoice',
    hint: 'Open the BCFA AP Invoice Processing Playbook for this invoice in the BCFA Workspace (view only).',
    showUpdate: true,
    roles: [bcfaAdmin, bcfaApProcessor, bcfaApApprover, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaIntegrationOperator, bcfaAuditor, bcfaReadOnly],
    form: { showLink: true },
    script: `action.setRedirectURL('/now/bcfa/playbook/x_695068_bcfa_ap_invoice/' + current.getUniqueValue());`,
})

export const paymentOpenPlaybook = UiAction({
    $id: Now.ID['ui-action-payment-open-playbook'],
    table: 'x_695068_bcfa_payment',
    name: 'Open Playbook',
    actionName: 'open_playbook_payment',
    hint: 'Open the BCFA Cash Application Playbook for this payment in the BCFA Workspace (view only).',
    showUpdate: true,
    roles: [bcfaAdmin, bcfaArProcessor, bcfaArApprover, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaIntegrationOperator, bcfaAuditor, bcfaReadOnly],
    form: { showLink: true },
    script: `action.setRedirectURL('/now/bcfa/playbook/x_695068_bcfa_payment/' + current.getUniqueValue());`,
})
