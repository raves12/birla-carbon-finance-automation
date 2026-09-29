import { Table, StringColumn, ChoiceColumn, DecimalColumn, IntegerColumn, DateTimeColumn } from '@servicenow/sdk/core'

// Phase 30: POC success scorecard, one row per metric, recomputed by
// FinancePocScorecard (with the 15-minute KPI refresh, and on demand). Targets
// are proposals to agree with Birla Carbon, not contractual figures.
// See docs/POC_SUCCESS_METRICS.md.
export const x_695068_bcfa_poc_metric = Table({
    name: 'x_695068_bcfa_poc_metric',
    label: 'POC Success Metric',
    display: 'label',
    schema: {
        code: StringColumn({ label: 'Code', mandatory: true, unique: true, maxLength: 60 }),
        label: StringColumn({ label: 'Metric', mandatory: true, maxLength: 100 }),
        pillar: ChoiceColumn({
            label: 'Pillar',
            choices: { automation: 'Automation', speed: 'Speed', control: 'Control', ai_safety: 'AI safety', ai_value: 'AI value' },
        }),
        value: DecimalColumn({ label: 'Value', scale: 2 }),
        unit: ChoiceColumn({
            label: 'Unit',
            choices: { percent: 'Percent', count: 'Count', hours: 'Hours', ms: 'Milliseconds', ratio: 'Ratio' },
        }),
        comparator: ChoiceColumn({ label: 'Target Rule', choices: { gte: 'At least', lte: 'At most' } }),
        target_value: DecimalColumn({ label: 'Proposed Target', scale: 2, hint: 'Proposed for the POC, to be agreed with Birla Carbon.' }),
        status: ChoiceColumn({
            label: 'Status',
            choices: { met: 'Met', not_met: 'Not met', no_data: 'No data yet', info: 'Information (no target)' },
        }),
        sample_size: IntegerColumn({ label: 'Sample Size', hint: 'How many records the value is based on.' }),
        detail: StringColumn({ label: 'Detail', maxLength: 1000, hint: 'How the value was computed, with numerator and denominator.' }),
        computed_at: DateTimeColumn({ label: 'Computed At' }),
    },
})
