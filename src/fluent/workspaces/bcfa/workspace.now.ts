import { Workspace, Acl } from '@servicenow/sdk/core'
import { bcfaListConfig } from './list_menu.now'
import {
    bcfaAdmin,
    bcfaApProcessor,
    bcfaArProcessor,
    bcfaFinanceReviewer,
    bcfaFinanceApprover,
    bcfaAuditor,
    bcfaReadOnly,
} from '../../security/roles.now'

// Demo-friendly workspace UI for the Birla Carbon Finance Automation app —
// same underlying tables, ACLs, StateModels, and UI Actions ("Explain with
// Claude" / "Approve") as the classic platform UI; this only adds a
// purpose-built navigation + dashboard shell around them for a live client
// demo, per the client's request that a workspace is easier to demo from
// than the classic list/form UI.
export const bcfaWorkspace = Workspace({
    $id: Now.ID['bcfa-workspace'],
    title: 'Birla Carbon Finance Automation',
    path: 'bcfa',
    landingPath: 'home',
    active: true,
    tables: [
        'x_695068_bcfa_finance_intake',
        'x_695068_bcfa_ap_invoice',
        'x_695068_bcfa_ap_exception',
        'x_695068_bcfa_ap_extraction',
        'x_695068_bcfa_payment',
        'x_695068_bcfa_ar_exception',
        'x_695068_bcfa_match_candidate',
        'x_695068_bcfa_ai_interaction',
        'x_695068_bcfa_audit_event',
    ],
    listConfig: bcfaListConfig,
})

// Route ACL — name must match {path}.* exactly per the workspace guide.
// Same role set as the workspace's own Applicability, not a new grant.
Acl({
    $id: Now.ID['bcfa-workspace-route-acl'],
    localOrExisting: 'Existing',
    type: 'ux_route',
    operation: 'read',
    roles: [bcfaAdmin, bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaAuditor, bcfaReadOnly],
    name: 'bcfa.*',
})
