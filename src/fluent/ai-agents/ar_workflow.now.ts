import '@servicenow/sdk/global'
import { AiAgenticWorkflow } from '@servicenow/sdk/core'

// Phase 11: BCFA Cash Application Review agentic workflow.
//
// Trigger: an AR Exception is created with status "open". ArDomainService /
// MatchingEngine / ExceptionEngine only raise one after the deterministic
// exact-match attempt has failed (unmatched, ambiguous customer, short or
// over payment, duplicate, currency mismatch), so exact matches never reach
// this workflow and continue the normal cash application flow.
//
// The team resolves the customer if needed, recommends an allocation,
// classifies any residual, optionally drafts a customer message, and saves
// one advisory note to the exception's ai_recommendation field. It then
// stops. It has no tool that can allocate, clear, write off, approve or
// change state; reviewer confirmation, deterministic reconciliation,
// approval and SAP clearing stay with the normal application workflow.
//
// Identity: runs as the dedicated AI user bcfa.ai.reviewer (see
// ap_workflow.now.ts), which holds only ap_processor and ar_processor.

const BCFA_AI_REVIEWER = 'b8efbc9ef2654167b89add3507667685'

const AGENT = {
    customerResolution: '132a20eb57aa4ed5971db8a267ce6395',
    cashMatchRecommendation: '59b6817ef4724c9ea131e5aa57c3f250',
    deductionAnalysis: 'ede6a13bfc184c5d981db3b681d43ebf',
    cashApplicationCommunication: '9fd2181abab54e2eb93dffe220d11d93',
}

const ROLE = {
    admin: '4411dd9103de4bdbb5468924b1e5459f',
    arProcessor: '588d615a5fea475bbe3422f50e91c218',
    financeReviewer: '484c56f4217841e298f5752ea6093a3f',
    financeApprover: 'e1abbc605ba34cbfb77c584ea689c1b2',
}

export const cashApplicationReviewWorkflow = AiAgenticWorkflow({
    $id: Now.ID['bcfa_cash_application_review_workflow'],
    name: 'BCFA Cash Application Review',
    description:
        'Reviews an AR (cash application) exception raised when deterministic matching could not apply a payment: resolves the customer if needed, recommends an allocation, classifies any residual, optionally drafts a customer message, and records one advisory note on the exception for the AR processor. Stops before any allocation, approval or SAP clearing.',
    recordType: 'custom',
    executionMode: 'autopilot',
    runAs: BCFA_AI_REVIEWER,
    securityAcl: {
        $id: Now.ID['bcfa_cash_application_review_workflow_acl'],
        type: 'Specific role',
        roles: [ROLE.admin, ROLE.arProcessor, ROLE.financeReviewer, ROLE.financeApprover],
    },
    team: {
        $id: Now.ID['bcfa_cash_application_review_team'],
        name: 'BCFA Cash Application Review Team',
        members: [
            AGENT.customerResolution,
            AGENT.cashMatchRecommendation,
            AGENT.deductionAnalysis,
            AGENT.cashApplicationCommunication,
        ],
    },
    versions: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `Goal: give the AR processor an advisory review of one cash application (AR) exception. The task contains the AR exception sys_id, its reason code and the payment's sys_id (trigger runs) or bank reference (manual runs). Pass whichever you have to the agents; they accept either.

Route by the reason code in the task:
- customer_ambiguous, or unmatched where the payment has no customer: ask the BCFA Customer Resolution Agent to rank likely customers for the payment, then ask the BCFA Cash Match Recommendation Agent to recommend an allocation for the same payment (it should note that the customer still needs human confirmation).
- unmatched with a customer: ask the BCFA Cash Match Recommendation Agent to recommend an allocation for the payment.
- short_pay, over_pay or currency_mismatch: ask the BCFA Cash Match Recommendation Agent to recommend an allocation, then ask the BCFA Deduction Analysis Agent to analyze the residual for the same payment.
- duplicate or other: ask the BCFA Cash Match Recommendation Agent to review the payment, and state that a human must investigate.
Do not ask any agent to save anything during these steps.

Then:
1. Only if the findings show the customer must be contacted (missing remittance detail, disputed short pay, unidentified payer), ask the BCFA Cash Application Communication Agent to draft a customer clarification for the AR exception sys_id from the task. Otherwise skip this step.
2. Compose one advisory note in plain text, under 3,500 characters, with these sections (include only the sections for agents that ran):
   AI REVIEW (advisory only - a human must decide)
   Customer resolution: ranked candidates with scores and evidence, or "not needed"
   Recommended allocation: candidate invoices, allocation, remaining residual with arithmetic, confidence
   Residual classification: classification, amount, rationale (hypothesis), confidence, required review
   Draft customer message (NOT sent): include only if step 1 ran
   Human decision required: what the AR processor must confirm before any allocation or clearing
3. Ask the BCFA Cash Match Recommendation Agent to save exactly that note to the AR exception with the sys_id from the task, using its Save AR Advisory Recommendation tool.
4. Finish with a one-line summary: the exception sys_id, the path taken and whether the note was saved.

Hard limits:
- This workflow is advisory. Never apply, allocate, clear, write off, approve, reject or change the state of any payment, allocation, deduction or exception. No team member has tools for that, and you must not attempt it.
- Stop after step 4. Reviewer confirmation, deterministic reconciliation, approval and SAP clearing continue only through the normal cash application workflow.
- Never allocate across currencies; if the payment and invoices are in different currencies, say so and leave it to a human.
- If an agent reports a tool error, include the error in the summary and do not save a note built on missing data.`,
        },
    ],
    triggerConfig: [
        {
            name: 'BCFA AR Exception Created',
            description: 'Starts the Cash Application Review when deterministic matching opens a new AR exception.',
            active: true,
            channel: 'Now Assist Panel',
            targetTable: 'x_695068_bcfa_ar_exception',
            triggerFlowDefinitionType: 'record_create',
            triggerCondition: 'status=open',
            objectiveTemplate:
                'Review AR exception ${sys_id} (reason: ${reason_code}) on payment ${payment} and record an advisory recommendation on it.',
            runAsUser: BCFA_AI_REVIEWER,
            showNotifications: false,
        },
    ],
})
