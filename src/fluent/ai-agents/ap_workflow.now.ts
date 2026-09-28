import '@servicenow/sdk/global'
import { AiAgenticWorkflow } from '@servicenow/sdk/core'

// Phase 10: BCFA AP Invoice Review agentic workflow.
//
// Trigger: an AP Exception is created with status "open". That only happens
// when deterministic validation or 3-way matching (ApDomainService /
// MatchingEngine / ExceptionEngine) has already rejected the invoice, so
// clean invoices never reach this workflow and continue the normal AP flow.
//
// The team analyzes the exception, recommends a next action, optionally
// drafts a vendor message, and saves one advisory note to the exception's
// ai_recommendation field. It then stops. It has no tool that can approve,
// post, change state or override a tolerance; posting remains with the
// normal application workflow and a human decision.
//
// Identity: runs as the dedicated AI user bcfa.ai.reviewer
// (identity_type=ai_agent), which holds only x_695068_bcfa.ap_processor and
// ar_processor. That user is created by the Phase 10 deploy script with the
// fixed sys_id below.

const BCFA_AI_REVIEWER = 'b8efbc9ef2654167b89add3507667685'

const AGENT = {
    apExceptionAnalysis: '04cf894018b541cc929bdf7895e8e286',
    apResolutionRecommendation: 'ef84e321673c4969b17dea9d03c4dae5',
    apCommunication: '3c1340425274482fb242410734d781fe',
}

const ROLE = {
    aiAgent: '3820b778bac540099d293cef1520a777',
    admin: '4411dd9103de4bdbb5468924b1e5459f',
    apProcessor: 'bf505b5092574a7fa59a01048550571a',
    financeReviewer: '484c56f4217841e298f5752ea6093a3f',
    financeApprover: 'e1abbc605ba34cbfb77c584ea689c1b2',
}

export const apInvoiceReviewWorkflow = AiAgenticWorkflow({
    $id: Now.ID['bcfa_ap_invoice_review_workflow'],
    name: 'BCFA AP Invoice Review',
    description:
        'Reviews an AP invoice exception raised by deterministic validation or matching: analyzes it, recommends a next action, optionally drafts a vendor message, and records one advisory note on the exception for the AP processor. Stops before any approval or posting.',
    recordType: 'custom',
    executionMode: 'autopilot',
    runAs: BCFA_AI_REVIEWER,
    securityAcl: {
        $id: Now.ID['bcfa_ap_invoice_review_workflow_acl'],
        type: 'Specific role',
        // Phase 22: the AI identity (trigger run-as user) and the processing
        // roles; no admin or approver role.
        roles: [ROLE.aiAgent, ROLE.apProcessor, ROLE.financeReviewer],
    },
    team: {
        $id: Now.ID['bcfa_ap_invoice_review_team'],
        name: 'BCFA AP Invoice Review Team',
        members: [AGENT.apExceptionAnalysis, AGENT.apResolutionRecommendation, AGENT.apCommunication],
    },
    versions: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `Goal: give the AP processor an advisory review of one AP invoice exception. The exception sys_id is in the task.

Steps:
1. Ask the BCFA AP Exception Analysis Agent to analyze the AP exception with the sys_id from the task.
2. Ask the BCFA AP Resolution Recommendation Agent to recommend the next action for the same AP exception sys_id. Do not ask it to save yet.
3. Only if the recommendation is "Request invoice correction from the vendor" or otherwise requires contacting the vendor, ask the BCFA AP Communication Agent to draft a vendor clarification for the same AP exception sys_id. Otherwise skip this step.
4. Compose one advisory note in plain text, under 3,500 characters, with these sections:
   AI REVIEW (advisory only - a human must decide)
   Analysis: exception type, explanation, financial variance, key evidence, likely cause (hypothesis), confidence
   Recommendation: the recommended action, rationale, confidence, human action required
   Draft vendor message (NOT sent): include only if step 3 ran
5. Ask the BCFA AP Resolution Recommendation Agent to save exactly that note to the same AP exception using its Save Advisory Recommendation tool.
6. Finish with a one-line summary: the exception sys_id, the recommended action and whether the note was saved.

Hard limits:
- This workflow is advisory. Never approve, reject, post, pay, hold, release or change the state of the invoice or the exception, and never override a tolerance or approval rule. No team member has tools for that, and you must not attempt it.
- Stop after step 6. Approval and posting continue only through the normal AP application workflow and a human decision.
- If an agent reports a tool error, include the error in the summary and do not save a note built on missing data.`,
        },
    ],
    triggerConfig: [
        {
            name: 'BCFA AP Exception Created',
            description: 'Starts the AP Invoice Review when deterministic validation or matching opens a new AP exception.',
            active: true,
            channel: 'Now Assist Panel',
            targetTable: 'x_695068_bcfa_ap_exception',
            triggerFlowDefinitionType: 'record_create',
            triggerCondition: 'status=open',
            objectiveTemplate: 'Review AP exception ${sys_id} (reason: ${reason_code}) and record an advisory recommendation on it.',
            runAsUser: BCFA_AI_REVIEWER,
            showNotifications: false,
        },
    ],
})
