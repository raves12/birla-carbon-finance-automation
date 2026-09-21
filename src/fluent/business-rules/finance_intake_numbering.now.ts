import { BusinessRule } from '@servicenow/sdk/core'

export const financeIntakeAutoNumber = BusinessRule({
    $id: Now.ID['br-finance-intake-auto-number'],
    name: 'Finance Document Intake - Assign Number',
    table: 'x_695068_bcfa_finance_intake',
    when: 'before',
    action: ['insert'],
    order: 100,
    active: true,
    description: 'Explicitly assigns the record number via GlideRecord.setNumber() — the platform\'s implicit auto-number-on-insert hook was not firing for this table despite correct sys_number/number_ref/primary-flag configuration (confirmed live), so this is a deterministic fallback rather than a workaround for a configuration mistake.',
    script: Now.include('../../server/business-rules/FinanceIntakeAutoNumber.server.js'),
})
