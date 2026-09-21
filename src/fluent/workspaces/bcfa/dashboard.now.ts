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
    ],
    visibilities: [{ $id: Now.ID['bcfa-dashboard-visibility'], experience: bcfaWorkspace }],
    permissions: [],
})
