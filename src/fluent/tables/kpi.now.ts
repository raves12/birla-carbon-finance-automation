import { Table, StringColumn, ChoiceColumn, DecimalColumn, DateTimeColumn } from '@servicenow/sdk/core'

// Phase 24: Finance Operations KPIs, one row per KPI, recomputed by
// FinanceKpiService (scheduled every 15 minutes, and on demand). The
// workspace landing page reads counts live from the records and the rates
// and averages (which a count cannot express) from this table.
export const x_695068_bcfa_kpi = Table({
    name: 'x_695068_bcfa_kpi',
    label: 'Finance KPI',
    display: 'label',
    schema: {
        code: StringColumn({ label: 'Code', mandatory: true, unique: true, maxLength: 60 }),
        label: StringColumn({ label: 'KPI', mandatory: true, maxLength: 100 }),
        category: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Category',
            choices: { ap: 'Accounts Payable', ar: 'Accounts Receivable', ai: 'AI', integration: 'Integration' },
        }),
        value: DecimalColumn({ label: 'Value', scale: 2 }),
        unit: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Unit',
            choices: { count: 'Count', percent: 'Percent', hours: 'Hours', amount: 'Amount (INR)' },
        }),
        detail: StringColumn({ label: 'Detail', maxLength: 1000, hint: 'How the value was computed, with numerator and denominator where relevant.' }),
        computed_at: DateTimeColumn({ label: 'Computed At' }),
    },
})
