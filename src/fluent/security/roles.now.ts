import { Role } from '@servicenow/sdk/core'

// Role names follow the platform convention <scope>.<name> (see role-api.md) —
// the short names below match Section 6 of the build brief with the "bcfa_"
// prefix dropped since the scope segment already disambiguates them.

export const bcfaAdmin = Role({
    name: 'x_695068_bcfa.admin',
    description: 'Full administrative access to the Birla Carbon Finance Automation app.',
    scopedAdmin: true,
})

export const bcfaApProcessor = Role({
    name: 'x_695068_bcfa.ap_processor',
    description: 'Processes AP invoices: intake, extraction review, matching exception resolution. Cannot approve postings.',
})

export const bcfaArProcessor = Role({
    name: 'x_695068_bcfa.ar_processor',
    description: 'Processes Cash Application: payment/remittance review, allocation, exception resolution. Cannot approve clearing.',
})

export const bcfaFinanceReviewer = Role({
    name: 'x_695068_bcfa.finance_reviewer',
    description: 'Read/comment access across AP and AR for oversight, without processing or approval authority.',
})

export const bcfaFinanceApprover = Role({
    name: 'x_695068_bcfa.finance_approver',
    description: 'Approves AP posting and AR clearing. Cannot modify source transaction data after approval.',
})

export const bcfaIntegrationOperator = Role({
    name: 'x_695068_bcfa.integration_operator',
    description: 'Can retry/reconcile Integration Transactions. Cannot alter AP/AR financial source values.',
})

export const bcfaAuditor = Role({
    name: 'x_695068_bcfa.auditor',
    description: 'Read-only access to Audit Event, Integration Transaction and Decision Log for evidence review.',
})

export const bcfaReadOnly = Role({
    name: 'x_695068_bcfa.read_only',
    description: 'Read-only access across all Birla Carbon Finance Automation tables.',
})
