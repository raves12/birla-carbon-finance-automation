import { Property } from '@servicenow/sdk/core'

// Phase 12: configurable finance policy, read at runtime by FinancePolicy
// (src/server/script-includes/FinancePolicy.server.js). Every value is a
// synthetic POC ASSUMPTION for the demo, not a Birla Carbon production rule.

// Demo assignment group and exception owner, created by the Phase 12 deploy
// script (scripts/deploy/gen_agent_loader.mjs --demo-users).
const BCFA_AP_OPERATIONS_GROUP = '6c3107e75eeec3146f95ff49b9011def'
const BCFA_AP_PROCESSOR_USER = '6fe2fbfa188d7aa5829b61d52b3202c9'
const BCFA_CASH_APPLICATION_GROUP = 'a42557739c621c40c2570c9fa414cc46'
const BCFA_AR_PROCESSOR_USER = 'a9f827de8d254b4150e07ac76dd9cef6'

export const aiProvider = Property({
    $id: Now.ID['prop-ai-provider'],
    name: 'x_695068_bcfa.ai.provider',
    type: 'string',
    value: 'native',
    description:
        'AI provider for the AP/AR pipelines. native = ServiceNow AI (Now Assist skills and AI agents). simulated = deterministic templates only (the process runs with AI switched off). Document reading has its own setting, x_695068_bcfa.document.extraction.provider. No external AI provider exists (Claude was removed in Phase 34). AI output is advisory in every mode.',
})

// Phase 40: which provider reads uploaded documents (DocumentExtractionService).
export const documentExtractionProvider = Property({
    $id: Now.ID['prop-document-extraction-provider'],
    name: 'x_695068_bcfa.document.extraction.provider',
    type: 'string',
    value: 'native',
    description:
        'Document extraction provider. native = ServiceNow Document Intelligence, generative extraction on Now LLM (use cases BCFA AP Invoice Extraction (Now LLM) and BCFA AR Payment Advice Extraction (Now LLM)). simulated = printed values of the synthetic test fixtures by file name, for tests and demo fixtures only, labelled SIMULATED DOCUMENT EXTRACTION - POC. A failed native extraction goes to manual review; there is no fallback to simulated values.',
})

// Phase 40: which SAP adapter IntegrationService calls (SAP_POC_MODES.md).
export const sapAdapter = Property({
    $id: Now.ID['prop-sap-adapter'],
    name: 'x_695068_bcfa.sap.adapter',
    type: 'string',
    value: 'mock_sap',
    description:
        'SAP adapter used for vendor invoice posting, payment clearing and the AR open-item read. mock_sap = MOCK SAP (POC Mode 1). real_sap = RealSAPAdapter (Mode 2): not configured in the POC, every call fails safely with NOT_CONFIGURED and nothing is sent. Any other value means mock_sap.',
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

// Phase 40: total-amount and rounding tolerances (fallbacks; the BCFA AP
// Tolerance decision table has them per company / country / vendor type).
export const apTotalToleranceAbsolute = Property({
    $id: Now.ID['prop-ap-tolerance-total-absolute'],
    name: 'x_695068_bcfa.ap.tolerance.total_absolute',
    type: 'string',
    value: '1',
    description: 'POC ASSUMPTION. Largest difference (invoice currency) between the header net amount and the sum of the line amounts that is accepted.',
})

export const apRoundingToleranceAbsolute = Property({
    $id: Now.ID['prop-ap-tolerance-rounding-absolute'],
    name: 'x_695068_bcfa.ap.tolerance.rounding_absolute',
    type: 'string',
    value: '0.05',
    description: 'POC ASSUMPTION. A tax variance up to this amount is a PASS (rounding); above it and within the tax tolerance it is WITHIN TOLERANCE.',
})

export const apTaxReference = Property({
    $id: Now.ID['prop-ap-tax-reference'],
    name: 'x_695068_bcfa.ap.tax.reference',
    type: 'string',
    value: '{"India":{"regime":"GST","rate_pct":18},"Germany":{"regime":"VAT","rate_pct":19},"Hungary":{"regime":"VAT","rate_pct":27},"United States":{"regime":"SALES_TAX","rate_pct":0}}',
    description: 'POC REFERENCE DATA (not tax advice, not read from SAP). Fallback when the BCFA AP Tax Expectation decision table has no row: expected tax regime and rate per vendor country. A country with no entry cannot be validated and goes to manual review.',
})

export const apExtractionConfidenceThreshold = Property({
    $id: Now.ID['prop-ap-extraction-confidence'],
    name: 'x_695068_bcfa.ap.extraction.confidence_threshold',
    type: 'string',
    value: '0.85',
    description: 'POC ASSUMPTION. Document extraction or classification confidence (0-1), for AP invoices and AR remittances, below which a document goes to human review instead of continuing automatically.',
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

// ---- Cash application (Phase 13) -------------------------------------------

export const arAutoApproveLimit = Property({
    $id: Now.ID['prop-ar-approval-auto-approve-limit'],
    name: 'x_695068_bcfa.ar.approval.auto_approve_limit',
    type: 'string',
    value: '0',
    description: 'POC ASSUMPTION. Balanced payments at or below this amount clear without a human approval. 0 means every clearing needs a finance approver (requester and approver must differ).',
})

export const arAutoMatchConfidence = Property({
    $id: Now.ID['prop-ar-match-auto-confidence'],
    name: 'x_695068_bcfa.ar.match.auto_confidence',
    type: 'string',
    value: '0.95',
    description: 'POC ASSUMPTION. Minimum confidence (0-1) to resolve a customer automatically from a remitter alias. Below it the payment goes to a human as customer_ambiguous.',
})

export const arDeductionApprovalThreshold = Property({
    $id: Now.ID['prop-ar-deduction-approval-threshold'],
    name: 'x_695068_bcfa.ar.deduction.approval_threshold',
    type: 'string',
    value: '5000',
    description: 'POC ASSUMPTION. Deductions up to this amount (payment currency) can be accepted by an AR processor; larger deductions need a finance approver.',
})

export const arDeductionAllowedTypes = Property({
    $id: Now.ID['prop-ar-deduction-allowed-types'],
    name: 'x_695068_bcfa.ar.deduction.allowed_types',
    type: 'string',
    value: 'bank_charge,tcs,withholding_tax,short_pay,credit_note_netting,debit_note,commercial_deduction,fx_difference,rounding',
    description: 'POC ASSUMPTION. Fallback when the BCFA AR Deduction decision table cannot be read: comma-separated deduction types a reviewer may accept to balance a short payment. Dispute, unapplied cash and other are never deductions: they stay open for investigation.',
})

export const arHighValueResidual = Property({
    $id: Now.ID['prop-ar-exception-high-value-residual'],
    name: 'x_695068_bcfa.ar.exception.high_value_residual',
    type: 'string',
    value: '5000',
    description: 'POC ASSUMPTION. A short or over payment whose residual (payment currency) reaches this amount is raised to high severity.',
})

export const arExceptionSlaHours = Property({
    $id: Now.ID['prop-ar-exception-sla-hours'],
    name: 'x_695068_bcfa.ar.exception.sla_hours',
    type: 'string',
    value: '{"critical":4,"high":8,"medium":24,"low":72}',
    description: 'POC ASSUMPTION. Hours to resolve an AR exception, by severity (JSON). Sets the exception SLA due date when it is raised.',
})

export const arExceptionAssignmentGroup = Property({
    $id: Now.ID['prop-ar-exception-assignment-group'],
    name: 'x_695068_bcfa.ar.exception.assignment_group',
    type: 'string',
    value: BCFA_CASH_APPLICATION_GROUP,
    description: 'POC ASSUMPTION. sys_id of the group new AR exceptions are assigned to (demo group BCFA Cash Application).',
})

export const arExceptionDefaultOwner = Property({
    $id: Now.ID['prop-ar-exception-default-owner'],
    name: 'x_695068_bcfa.ar.exception.default_owner',
    type: 'string',
    value: BCFA_AR_PROCESSOR_USER,
    description: 'POC ASSUMPTION. sys_id of the user who owns new AR exceptions (demo user bcfa.ar.processor).',
})

// Phase 40: AR rounding and withholding limits.
export const arRoundingMax = Property({
    $id: Now.ID['prop-ar-rounding-max-amount'],
    name: 'x_695068_bcfa.ar.rounding.max_amount',
    type: 'string',
    value: '1',
    description: 'POC ASSUMPTION. A short-pay residual up to this amount is suggested as a rounding difference; a rounding deduction above it is refused.',
})

export const arWithholdingMaxPct = Property({
    $id: Now.ID['prop-ar-withholding-max-pct'],
    name: 'x_695068_bcfa.ar.withholding.max_pct',
    type: 'string',
    value: '0.1',
    description: 'POC ASSUMPTION. The largest withholding-tax (TDS) deduction accepted, as a fraction of the invoice amounts it covers (0.1 = 10%). Above it the deduction is refused and the residual stays an exception.',
})

export const arBankChargeMax = Property({
    $id: Now.ID['prop-ar-bank-charge-max-amount'],
    name: 'x_695068_bcfa.ar.bank_charge.max_amount',
    type: 'string',
    value: '1000',
    description: 'POC ASSUMPTION. Short-pay residuals up to this amount (payment currency) are suggested as a bank charge by the matching engine, and a bank-charge deduction above it is refused (Phase 35). The reviewer confirms every deduction.',
})

// ---- Segregation of duties (Phase 17) ----------------------------------------
// Enforced by ApprovalEngine. The AI-identity refusal and the approver-role
// requirement are always on; these three are configurable ("where
// configured" in the brief) and default to on.

export const sodRequesterCannotApprove = Property({
    $id: Now.ID['prop-sod-requester-cannot-approve'],
    name: 'x_695068_bcfa.sod.requester_cannot_approve',
    type: 'boolean',
    value: 'true',
    description: 'POC ASSUMPTION. The user who requested an approval cannot decide it.',
})

export const sodProcessorCannotApprove = Property({
    $id: Now.ID['prop-sod-processor-cannot-approve'],
    name: 'x_695068_bcfa.sod.processor_cannot_approve',
    type: 'boolean',
    value: 'true',
    description: 'POC ASSUMPTION. The processor of a transaction cannot approve it: the user who created the invoice or payment, or who made a processor decision (hold, request correction or clarification, reject, approve deduction) on one of its exceptions.',
})

export const sodApproverInGroup = Property({
    $id: Now.ID['prop-sod-approver-in-group'],
    name: 'x_695068_bcfa.sod.approver_in_group',
    type: 'boolean',
    value: 'true',
    description: 'POC ASSUMPTION. The approver must be a member of the approval group the approval decision table routed the approval to (BCFA Finance Approvers or BCFA Finance Controllers).',
})
