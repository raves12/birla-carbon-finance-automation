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

// Playbook phase: the native ServiceNow Playbook experience for BCFA records,
// inside the BCFA Workspace: /x/695068/bcfa/playbook/<table>/<sys_id>
// (route "playbook" -> screen "BCFA Playbook" -> BCFA-scoped page holding the
// platform Playbook component). Verified 2026-10-05 on BANK-PLAY-02 (9 AR
// stages, stage 8 SAP Draft) and INV-PLAY-02 (8 AP stages, stage 4 + the
// exception lane). "Open Playbook" on the invoice and payment forms opens it.
// The record page ("Record Default") is preset-based and not editable from
// Fluent. Covered by the existing bcfa.* route ACL. Display only.

const BCFA_APP_CONFIG = 'a31c27cbf9474e3f93e47c8ac7a7cbe1' // sys_ux_app_config of the BCFA workspace
const BCFA_SHELL = 'c276387cc331101080d6d3658940ddd2' // workspace shell macroponent (all BCFA routes)
const PAGE_TEMPLATE = '19be392623033300f4b4c50947bf65ba' // platform "Page Template" (all UIB pages extend it)
const PLAYBOOK_COMPONENT = 'ed99051389038d7a6d57069eecc5a122' // platform Playbook component (Playbook Experience Components)


// The page definition must be in the BCFA scope: UI Builder treats a page whose
// definition is in another scope as read-only, and the workspace does not
// render it ("Page not found"). Same composition as the Service Operations
// Workspace Playbook page: one Playbook component bound to the page's
// table / sysId and the session user.
export const bcfaPlaybookPage = Record({
    $id: Now.ID['bcfa-playbook-page-macroponent'],
    table: 'sys_ux_macroponent',
    data: {
        name: 'BCFA Playbook',
        category: 'page',
        schema_version: '1.0.0',
        extends: PAGE_TEMPLATE,
        root_component_config: '{}',
        required_translations: '[ ]',
        data: '[]',
        props: JSON.stringify([
            { defaultValue: null, description: '', disabled: false, fieldType: 'string', label: 'Table', mandatory: false, name: 'table', readOnly: false, selectable: false, typeMetadata: null, valueType: 'string' },
            { defaultValue: null, description: '', disabled: false, fieldType: 'string', label: 'sysId', mandatory: false, name: 'sysId', readOnly: false, selectable: false, typeMetadata: null, valueType: 'string' },
        ]),
        composition: JSON.stringify([
            {
                definition: { id: PLAYBOOK_COMPONENT, type: 'MACROPONENT' },
                elementId: 'bcfa_playbook',
                elementLabel: 'BCFA Playbook',
                eventMappings: [],
                isHero: false,
                isHidden: { type: 'JSON_LITERAL', value: null },
                isNonDestructive: false,
                overrides: null,
                propertyValues: {
                    activityView: { type: 'JSON_LITERAL', value: 'stacked' },
                    compactMode: { type: 'JSON_LITERAL', value: null },
                    daClientActionContract: { type: 'JSON_LITERAL', value: null },
                    enableFullWidthCards: { type: 'JSON_LITERAL', value: true },
                    parentSysId: { type: 'CONTEXT_BINDING', binding: { address: ['sysId'], category: 'props' } },
                    parentTable: { type: 'CONTEXT_BINDING', binding: { address: ['table'], category: 'props' } },
                    recordGeneratorQuery: { type: 'JSON_LITERAL', value: null },
                    selectedActivityContextId: { type: 'JSON_LITERAL', value: null },
                    selectedLaneContextId: { type: 'JSON_LITERAL', value: null },
                    selectedPlaybookContextId: { type: 'JSON_LITERAL', value: '' },
                    userId: { type: 'JSON_LITERAL', value: null },
                    userSession: { binding: { address: ['user'], category: 'session' }, type: 'CONTEXT_BINDING' },
                },
                slot: null,
                styles: null,
            },
        ]),
        layout: JSON.stringify({
            default: {
                children: null, isInline: null, items: [{ element_id: 'bcfa_playbook', styles: {} }], root: null, rules: null,
                styles: { 'flex-direction': 'column', width: '' }, templateId: '5832fd4d53c31010e6bcddeeff7b12db', type: 'flex',
            },
            version: '3.0.0',
        }),
    },
})

export const bcfaPlaybookScreenType = Record({
    $id: Now.ID['bcfa-playbook-screen-type'],
    table: 'sys_ux_screen_type',
    data: { name: 'BCFA Playbook', description: 'BCFA Playbook page (platform Playbook component)' },
})

export const bcfaPlaybookRoute = Record({
    $id: Now.ID['bcfa-playbook-route'],
    table: 'sys_ux_app_route',
    data: {
        name: 'BCFA Playbook',
        description: 'BCFA Playbook page (platform Playbook component) for an AP invoice or a payment: /x/695068/bcfa/playbook/<table>/<sys_id>',
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
        macroponent: bcfaPlaybookPage,
        // The workspace lists a route only when its screen names the shell as
        // parent macroponent; without it the route is missing from the
        // workspace route table and the page shows "Page not found".
        parent_macroponent: BCFA_SHELL,
        active: true, // a screen is inactive unless set (the route then shows "Page not found")
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
    hint: 'Open the BCFA AP Invoice Processing Playbook for this invoice (native Playbook in the BCFA Workspace, view only).',
    showUpdate: true,
    roles: [bcfaAdmin, bcfaApProcessor, bcfaApApprover, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaIntegrationOperator, bcfaAuditor, bcfaReadOnly],
    form: { showLink: true },
    script: `action.setRedirectURL('/x/695068/bcfa/playbook/x_695068_bcfa_ap_invoice/' + current.getUniqueValue());`,
})

export const paymentOpenPlaybook = UiAction({
    $id: Now.ID['ui-action-payment-open-playbook'],
    table: 'x_695068_bcfa_payment',
    name: 'Open Playbook',
    actionName: 'open_playbook_payment',
    hint: 'Open the BCFA Cash Application Playbook for this payment (native Playbook in the BCFA Workspace, view only).',
    showUpdate: true,
    roles: [bcfaAdmin, bcfaArProcessor, bcfaArApprover, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaIntegrationOperator, bcfaAuditor, bcfaReadOnly],
    form: { showLink: true },
    script: `action.setRedirectURL('/x/695068/bcfa/playbook/x_695068_bcfa_payment/' + current.getUniqueValue());`,
})
