import { Property } from '@servicenow/sdk/core'

// Phase 12: configurable finance policy, read at runtime by FinancePolicy
// (src/server/script-includes/FinancePolicy.server.js). Every value is a
// synthetic POC ASSUMPTION for the demo, not a Birla Carbon production rule.

// Demo assignment group and exception owner, created by the Phase 12 deploy
// script (scripts/deploy/gen_agent_loader.mjs --demo-users).
const BCFA_AP_OPERATIONS_GROUP = '6c3107e75eeec3146f95ff49b9011def'
const BCFA_AP_PROCESSOR_USER = '6fe2fbfa188d7aa5829b61d52b3202c9'

export const aiProvider = Property({
    $id: Now.ID['prop-ai-provider'],
    name: 'x_695068_bcfa.ai.provider',
    type: 'string',
    value: 'native',
    description:
        'AI provider for the AP/AR pipelines. native = ServiceNow AI (Now Assist skills and AI agents; document reading uses simulated extraction until Document Intelligence extraction is licensed on this instance). claude = legacy external path, removed in Phase 34. simulated = deterministic templates only. AI output is advisory in every mode.',
})

export const apQuantityTolerance = Property({
    $id: Now.ID['prop-ap-tolerance-quantity'],
    name: 'x_695068_bcfa.ap.tolerance.quantity_pct',
    type: 'string',
    value: '0.02',
    description: 'POC ASSUMPTION. AP 3-way match quantity tolerance as a fraction: |invoice qty - GRN qty| / GRN qty must not exceed this (0.02 = 2%).',
})

export const apPriceTolerance = Property({
    $id: Now.ID['prop-ap-tolerance-price'],
    name: 'x_695068_bcfa.ap.tolerance.price_pct',
    type: 'string',
    value: '0.02',
    description: 'POC ASSUMPTION. AP 3-way match unit price tolerance as a fraction of the PO unit price (0.02 = 2%).',
})

export const apTaxToleranceAbsolute = Property({
    $id: Now.ID['prop-ap-tolerance-tax-absolute'],
    name: 'x_695068_bcfa.ap.tolerance.tax_absolute',
    type: 'string',
    value: '1',
    description: 'POC ASSUMPTION. Minimum tax tolerance band in invoice currency. The band is the larger of this and tax_relative_pct of the expected tax.',
})

export const apTaxToleranceRelative = Property({
    $id: Now.ID['prop-ap-tolerance-tax-relative'],
    name: 'x_695068_bcfa.ap.tolerance.tax_relative_pct',
    type: 'string',
    value: '0.02',
    description: 'POC ASSUMPTION. Tax tolerance as a fraction of the expected tax (0.02 = 2%).',
})

export const apExtractionConfidenceThreshold = Property({
    $id: Now.ID['prop-ap-extraction-confidence'],
    name: 'x_695068_bcfa.ap.extraction.confidence_threshold',
    type: 'string',
    value: '0.85',
    description: 'POC ASSUMPTION. Extraction or classification confidence (0-1) below which a document goes to human review instead of continuing automatically.',
})

export const apAutoApproveLimit = Property({
    $id: Now.ID['prop-ap-approval-auto-approve-limit'],
    name: 'x_695068_bcfa.ap.approval.auto_approve_limit',
    type: 'string',
    value: '0',
    description: 'POC ASSUMPTION. Matched invoices with a gross amount at or below this value need no human approval. 0 means every invoice needs a finance approver (requester and approver must differ).',
})

export const apHighValueVariance = Property({
    $id: Now.ID['prop-ap-exception-high-value-variance'],
    name: 'x_695068_bcfa.ap.exception.high_value_variance',
    type: 'string',
    value: '1000',
    description: 'POC ASSUMPTION. A quantity, price or tax exception whose variance value (invoice currency) reaches this amount is raised to high severity.',
})

export const apExceptionSlaHours = Property({
    $id: Now.ID['prop-ap-exception-sla-hours'],
    name: 'x_695068_bcfa.ap.exception.sla_hours',
    type: 'string',
    value: '{"critical":4,"high":8,"medium":24,"low":72}',
    description: 'POC ASSUMPTION. Hours to resolve an AP exception, by severity (JSON). Sets the exception SLA due date when it is raised.',
})

export const apExceptionAssignmentGroup = Property({
    $id: Now.ID['prop-ap-exception-assignment-group'],
    name: 'x_695068_bcfa.ap.exception.assignment_group',
    type: 'string',
    value: BCFA_AP_OPERATIONS_GROUP,
    description: 'POC ASSUMPTION. sys_id of the group new AP exceptions are assigned to (demo group BCFA AP Operations).',
})

export const apExceptionDefaultOwner = Property({
    $id: Now.ID['prop-ap-exception-default-owner'],
    name: 'x_695068_bcfa.ap.exception.default_owner',
    type: 'string',
    value: BCFA_AP_PROCESSOR_USER,
    description: 'POC ASSUMPTION. sys_id of the user who owns new AP exceptions (demo user bcfa.ap.processor). The owner is the maker in maker/checker: an override is requested in their name and must be approved by a different user.',
})

export const apOverrideAllowedReasons = Property({
    $id: Now.ID['prop-ap-override-allowed-reasons'],
    name: 'x_695068_bcfa.ap.override.allowed_reasons',
    type: 'string',
    value: 'quantity_tolerance,price_tolerance,tax_validation',
    description: 'POC ASSUMPTION. Comma-separated AP exception reason codes a finance approver may approve by override. Other reasons (duplicate, vendor, PO, missing field, low confidence) must be corrected or rejected.',
})
