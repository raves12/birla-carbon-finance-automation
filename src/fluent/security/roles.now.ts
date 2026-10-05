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

// Phase 17: separate approver roles per process. ApprovalEngine requires
// ap_approver to decide AP posting approvals and ar_approver for AR clearing
// approvals. AI identities must never hold either (enforced in
// ApprovalEngine regardless of roles, and checked by the verification).
export const bcfaApApprover = Role({
    name: 'x_695068_bcfa.ap_approver',
    description: 'Approves AP posting and AP tolerance overrides. Never the processor of the same invoice (segregation of duties).',
})

export const bcfaArApprover = Role({
    name: 'x_695068_bcfa.ar_approver',
    description: 'Approves AR clearing. Never the processor of the same payment (segregation of duties).',
})

export const bcfaFinanceApprover = Role({
    name: 'x_695068_bcfa.finance_approver',
    description: 'Approves AP posting and AR clearing (contains AP Approver and AR Approver). Cannot modify source transaction data after approval.',
    containsRoles: [bcfaApApprover, bcfaArApprover],
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

// Phase 22: the only BCFA role an AI identity holds (least privilege). It
// reads the records the agent tools read and writes one field, the advisory
// ai_recommendation on AP/AR exceptions. It contains no other role and no
// processor, approver or admin rights; AI identities never hold those.
export const bcfaAiAgent = Role({
    name: 'x_695068_bcfa.ai_agent',
    description: 'AI agent identities only (advisory). Reads the records the BCFA agent tools need and writes only the advisory ai_recommendation field on AP/AR exceptions. No processing, approval, posting or admin rights.',
})
