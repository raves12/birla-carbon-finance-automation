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
