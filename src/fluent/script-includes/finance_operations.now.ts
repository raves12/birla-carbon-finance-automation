import { ScriptInclude, ScheduledScript, Acl } from '@servicenow/sdk/core'
import {
    bcfaAdmin,
    bcfaApProcessor,
    bcfaArProcessor,
    bcfaFinanceReviewer,
    bcfaFinanceApprover,
    bcfaAuditor,
    bcfaReadOnly,
} from '../security/roles.now'

// Phase 24: Finance Operations workspace support.

export const financeKpiService = ScriptInclude({
    $id: Now.ID['si-finance-kpi-service'],
    name: 'FinanceKpiService',
    active: true,
    apiName: 'x_695068_bcfa.FinanceKpiService',
    description: 'Computes the 19 Finance Operations KPIs (AP, AR, AI, integration) from the records and stores them in x_695068_bcfa_kpi for the workspace landing page.',
    script: Now.include('../../server/script-includes/FinanceKpiService.server.js'),
})

export const financeReviewSummary = ScriptInclude({
    $id: Now.ID['si-finance-review-summary'],
    name: 'FinanceReviewSummary',
    active: true,
    apiName: 'x_695068_bcfa.FinanceReviewSummary',
    description: 'Builds the read-only review summary of an AP invoice or a payment (document, extraction, PO/GRN, match, tolerance, exception, AI, approval, integration, audit) shown at the top of the record.',
    script: Now.include('../../server/script-includes/FinanceReviewSummary.server.js'),
})

export const financeKpiRefreshJob = ScheduledScript({
    $id: Now.ID['job-finance-kpi-refresh'],
    name: 'BCFA - Finance KPI Refresh',
    frequency: 'periodically',
    executionInterval: Duration({ minutes: 15 }),
    executionStart: '2026-09-28 10:00:00',
    active: true,
    script: `
        var kpis = new FinanceKpiService().refresh();
        gs.info('BCFA KPI refresh: ' + Object.keys(kpis).length + ' KPIs');
    `,
})

Acl({
    $id: Now.ID['acl-read-x_695068_bcfa_kpi'],
    type: 'record',
    table: 'x_695068_bcfa_kpi',
    operation: 'read',
    roles: [bcfaAdmin, bcfaApProcessor, bcfaArProcessor, bcfaFinanceReviewer, bcfaFinanceApprover, bcfaAuditor, bcfaReadOnly],
    description: 'Finance KPIs: the whole workspace audience reads them; only FinanceKpiService writes them.',
})
