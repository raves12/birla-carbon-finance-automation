import { Dashboard } from '@servicenow/sdk/core'
import { bcfaWorkspace } from './workspace.now'

// Landing page for the BCFA workspace — mandatory for the workspace to
// function. Gives a client the state of the whole demo (open exceptions,
// pending approvals, AI call volume) at a glance before drilling into any
// one record.
export const bcfaDashboard = Dashboard({
    $id: Now.ID['bcfa-dashboard'],
    name: 'BCFA Overview',
    tabs: [
        // Phase 24: Finance Operations landing page. Counts read the records
        // live; rates and averages (and the multi-table low-confidence count)
        // come from x_695068_bcfa_kpi, refreshed every 15 minutes by
        // FinanceKpiService (docs/FINANCE_OPERATIONS_WORKSPACE.md).
        {
            $id: Now.ID['bcfa-dashboard-tab-finance-operations'],
            name: 'Finance Operations',
            widgets: [
                {
                    $id: Now.ID['bcfa-fo-ap-received'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AP · Invoices received',
                        dataSources: [{ id: 'ds1', label: 'Invoices received', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ap_invoice', filterQuery: '' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 8, position: { x: 0, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-fo-ap-posted'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AP · Invoices posted',
                        dataSources: [{ id: 'ds1', label: 'Invoices posted', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ap_invoice', filterQuery: 'posting_state=posted' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 8, position: { x: 8, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-fo-ap-stp'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AP · Straight-through rate (%)',
                        dataSources: [{ id: 'ds1', label: 'Straight-through rate (%)', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_kpi', filterQuery: 'code=ap_stp_rate' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'AVG', axisId: 'primary', aggregateField: 'value' }],
                    },
                    height: 10, width: 8, position: { x: 16, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-fo-ap-open-exc'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AP · Open exceptions',
                        dataSources: [{ id: 'ds1', label: 'Open exceptions', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ap_exception', filterQuery: 'statusINopen,in_review' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 8, position: { x: 24, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-fo-ap-pending'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AP · Pending approvals',
                        dataSources: [{ id: 'ds1', label: 'Pending approvals', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ap_approval', filterQuery: 'decision=pending' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 8, position: { x: 32, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-fo-ap-age'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AP · Avg exception age (hours)',
                        dataSources: [{ id: 'ds1', label: 'Avg exception age (hours)', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_kpi', filterQuery: 'code=ap_avg_exception_age' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'AVG', axisId: 'primary', aggregateField: 'value' }],
                    },
                    height: 10, width: 8, position: { x: 40, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-fo-ar-received'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AR · Payments received',
                        dataSources: [{ id: 'ds1', label: 'Payments received', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_payment', filterQuery: '' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 8, position: { x: 0, y: 11 },
                },
                {
                    $id: Now.ID['bcfa-fo-ar-matched'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AR · Payments matched',
                        dataSources: [{ id: 'ds1', label: 'Payments matched', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_payment', filterQuery: 'stateINMATCHED,PARTIALLY_MATCHED,ALLOCATION,PENDING_APPROVAL,APPROVED,CLEARING,CLEARED,UNKNOWN_OUTCOME,RECONCILED,CLOSED' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 8, position: { x: 8, y: 11 },
                },
                {
                    $id: Now.ID['bcfa-fo-ar-unapplied'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AR · Unapplied cash (INR)',
                        dataSources: [{ id: 'ds1', label: 'Unapplied cash (INR)', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_payment', filterQuery: 'stateNOT INCLEARED,RECONCILED,CLOSED^currency=INR' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'SUM', axisId: 'primary', aggregateField: 'amount' }],
                    },
                    height: 10, width: 8, position: { x: 16, y: 11 },
                },
                {
                    $id: Now.ID['bcfa-fo-ar-auto'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AR · Auto-match rate (%)',
                        dataSources: [{ id: 'ds1', label: 'Auto-match rate (%)', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_kpi', filterQuery: 'code=ar_auto_match_rate' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'AVG', axisId: 'primary', aggregateField: 'value' }],
                    },
                    height: 10, width: 8, position: { x: 24, y: 11 },
                },
                {
                    $id: Now.ID['bcfa-fo-ar-open-exc'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AR · Open exceptions',
                        dataSources: [{ id: 'ds1', label: 'Open exceptions', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ar_exception', filterQuery: 'statusINopen,in_review' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 8, position: { x: 32, y: 11 },
                },
                {
                    $id: Now.ID['bcfa-fo-ar-pending'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AR · Pending approvals',
                        dataSources: [{ id: 'ds1', label: 'Pending approvals', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ar_approval', filterQuery: 'decision=pending' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 8, position: { x: 40, y: 11 },
                },
                {
                    $id: Now.ID['bcfa-fo-ai-reviews'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AI · AI-assisted reviews',
                        dataSources: [{ id: 'ds1', label: 'AI-assisted reviews', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ai_interaction', filterQuery: 'capability=exception_review^status=success' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 12, position: { x: 0, y: 22 },
                },
                {
                    $id: Now.ID['bcfa-fo-ai-accept'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AI · Recommendation acceptance (%)',
                        dataSources: [{ id: 'ds1', label: 'Recommendation acceptance (%)', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_kpi', filterQuery: 'code=ai_acceptance_rate' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'AVG', axisId: 'primary', aggregateField: 'value' }],
                    },
                    height: 10, width: 12, position: { x: 12, y: 22 },
                },
                {
                    $id: Now.ID['bcfa-fo-ai-overrides'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AI · Overrides',
                        dataSources: [{ id: 'ds1', label: 'Overrides', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ai_interaction', filterQuery: 'human_overridden=true' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 12, position: { x: 24, y: 22 },
                },
                {
                    $id: Now.ID['bcfa-fo-ai-lowconf'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AI · Low-confidence documents',
                        dataSources: [{ id: 'ds1', label: 'Low-confidence documents', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_kpi', filterQuery: 'code=ai_low_confidence_documents' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'AVG', axisId: 'primary', aggregateField: 'value' }],
                    },
                    height: 10, width: 12, position: { x: 36, y: 22 },
                },
                {
                    $id: Now.ID['bcfa-fo-int-failures'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'Integration · Failures',
                        dataSources: [{ id: 'ds1', label: 'Failures', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_integration_txn', filterQuery: 'statusINfailed,technical_error,validation_error' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 16, position: { x: 0, y: 33 },
                },
                {
                    $id: Now.ID['bcfa-fo-int-unknown'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'Integration · UNKNOWN_OUTCOME',
                        dataSources: [{ id: 'ds1', label: 'UNKNOWN_OUTCOME', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_integration_txn', filterQuery: 'unknown_outcome_flag=true' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 16, position: { x: 16, y: 33 },
                },
                {
                    $id: Now.ID['bcfa-fo-int-pending-rec'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'Integration · Pending reconciliation',
                        dataSources: [{ id: 'ds1', label: 'Pending reconciliation', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_integration_txn', filterQuery: 'reconciliation_state=pending' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 10, width: 16, position: { x: 32, y: 33 },
                },
            ],
        },
        {
            $id: Now.ID['bcfa-dashboard-tab-overview'],
            name: 'Overview',
            widgets: [
                {
                    $id: Now.ID['bcfa-widget-open-ap-exceptions'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'Open AP Exceptions',
                        dataSources: [{
                            id: 'ds1', label: 'AP Exception', sourceType: 'table',
                            tableOrViewName: 'x_695068_bcfa_ap_exception', filterQuery: 'status=open',
                        }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 12, width: 9, position: { x: 0, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-widget-pending-ap-approvals'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'Pending AP Approvals',
                        dataSources: [{
                            id: 'ds1', label: 'AP Invoice', sourceType: 'table',
                            tableOrViewName: 'x_695068_bcfa_ap_invoice', filterQuery: 'state=PENDING_APPROVAL',
                        }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 12, width: 9, position: { x: 10, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-widget-open-ar-exceptions'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'Open AR Exceptions',
                        dataSources: [{
                            id: 'ds1', label: 'AR Exception', sourceType: 'table',
                            tableOrViewName: 'x_695068_bcfa_ar_exception', filterQuery: 'status=open',
                        }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 12, width: 9, position: { x: 20, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-widget-pending-ar-approvals'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'Pending AR Approvals',
                        dataSources: [{
                            id: 'ds1', label: 'Payment', sourceType: 'table',
                            tableOrViewName: 'x_695068_bcfa_payment', filterQuery: 'state=PENDING_APPROVAL',
                        }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 12, width: 9, position: { x: 30, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-widget-ai-calls-logged'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AI Calls Logged',
                        dataSources: [{
                            id: 'ds1', label: 'AI Interaction', sourceType: 'table',
                            tableOrViewName: 'x_695068_bcfa_ai_interaction', filterQuery: '',
                        }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 12, width: 9, position: { x: 39, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-widget-ap-exceptions-by-reason'],
                    component: 'vertical-bar',
                    componentProps: {
                        headerTitle: 'AP Exceptions by Reason Code',
                        dataSources: [{
                            id: 'ds1', label: 'AP Exception', sourceType: 'table',
                            tableOrViewName: 'x_695068_bcfa_ap_exception', filterQuery: '',
                        }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                        groupBy: [{ groupBy: [{ dataSource: 'ds1', groupByField: 'reason_code' }], maxNumberOfGroups: 10, showOthers: false }],
                        sortBy: 'value',
                    },
                    height: 16, width: 24, position: { x: 0, y: 13 },
                },
                {
                    $id: Now.ID['bcfa-widget-ar-exceptions-by-reason'],
                    component: 'vertical-bar',
                    componentProps: {
                        headerTitle: 'AR Exceptions by Reason Code',
                        dataSources: [{
                            id: 'ds1', label: 'AR Exception', sourceType: 'table',
                            tableOrViewName: 'x_695068_bcfa_ar_exception', filterQuery: '',
                        }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                        groupBy: [{ groupBy: [{ dataSource: 'ds1', groupByField: 'reason_code' }], maxNumberOfGroups: 10, showOthers: false }],
                        sortBy: 'value',
                    },
                    height: 16, width: 24, position: { x: 24, y: 13 },
                },
            ],
        },
        // Phase 16: unified exception management view (AP and AR use the
        // same framework fields, so every widget has an AP and an AR twin).
        {
            $id: Now.ID['bcfa-dashboard-tab-exceptions'],
            name: 'Exceptions',
            widgets: [
                {
                    $id: Now.ID['bcfa-widget-ap-sla-breached'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AP SLA Breached',
                        dataSources: [{ id: 'ds1', label: 'AP Exception', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ap_exception', filterQuery: 'statusINopen,in_review^sla_status=breached' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 12, width: 12, position: { x: 0, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-widget-ar-sla-breached'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AR SLA Breached',
                        dataSources: [{ id: 'ds1', label: 'AR Exception', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ar_exception', filterQuery: 'statusINopen,in_review^sla_status=breached' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 12, width: 12, position: { x: 12, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-widget-ap-escalated'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AP Escalated',
                        dataSources: [{ id: 'ds1', label: 'AP Exception', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ap_exception', filterQuery: 'statusINopen,in_review^escalation_level>0' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 12, width: 12, position: { x: 24, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-widget-ar-escalated'],
                    component: 'single-score',
                    componentProps: {
                        headerTitle: 'AR Escalated',
                        dataSources: [{ id: 'ds1', label: 'AR Exception', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ar_exception', filterQuery: 'statusINopen,in_review^escalation_level>0' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                    },
                    height: 12, width: 12, position: { x: 36, y: 0 },
                },
                {
                    $id: Now.ID['bcfa-widget-ap-open-by-aging'],
                    component: 'vertical-bar',
                    componentProps: {
                        headerTitle: 'Open AP Exceptions by Aging',
                        dataSources: [{ id: 'ds1', label: 'AP Exception', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ap_exception', filterQuery: 'statusINopen,in_review' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                        groupBy: [{ groupBy: [{ dataSource: 'ds1', groupByField: 'aging_bucket' }], maxNumberOfGroups: 5, showOthers: false }],
                        sortBy: 'value',
                    },
                    height: 16, width: 24, position: { x: 0, y: 13 },
                },
                {
                    $id: Now.ID['bcfa-widget-ar-open-by-aging'],
                    component: 'vertical-bar',
                    componentProps: {
                        headerTitle: 'Open AR Exceptions by Aging',
                        dataSources: [{ id: 'ds1', label: 'AR Exception', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ar_exception', filterQuery: 'statusINopen,in_review' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                        groupBy: [{ groupBy: [{ dataSource: 'ds1', groupByField: 'aging_bucket' }], maxNumberOfGroups: 5, showOthers: false }],
                        sortBy: 'value',
                    },
                    height: 16, width: 24, position: { x: 24, y: 13 },
                },
                {
                    $id: Now.ID['bcfa-widget-ap-open-by-priority'],
                    component: 'vertical-bar',
                    componentProps: {
                        headerTitle: 'Open AP Exceptions by Priority',
                        dataSources: [{ id: 'ds1', label: 'AP Exception', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ap_exception', filterQuery: 'statusINopen,in_review' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                        groupBy: [{ groupBy: [{ dataSource: 'ds1', groupByField: 'priority' }], maxNumberOfGroups: 5, showOthers: false }],
                        sortBy: 'value',
                    },
                    height: 16, width: 24, position: { x: 0, y: 30 },
                },
                {
                    $id: Now.ID['bcfa-widget-ar-open-by-priority'],
                    component: 'vertical-bar',
                    componentProps: {
                        headerTitle: 'Open AR Exceptions by Priority',
                        dataSources: [{ id: 'ds1', label: 'AR Exception', sourceType: 'table', tableOrViewName: 'x_695068_bcfa_ar_exception', filterQuery: 'statusINopen,in_review' }],
                        metrics: [{ dataSource: 'ds1', id: 'm1', aggregateFunction: 'COUNT', axisId: 'primary' }],
                        groupBy: [{ groupBy: [{ dataSource: 'ds1', groupByField: 'priority' }], maxNumberOfGroups: 5, showOthers: false }],
                        sortBy: 'value',
                    },
                    height: 16, width: 24, position: { x: 24, y: 30 },
                },
            ],
        },
    ],
    visibilities: [{ $id: Now.ID['bcfa-dashboard-visibility'], experience: bcfaWorkspace }],
    permissions: [],
})
