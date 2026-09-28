import '@servicenow/sdk/global'
import { AiAgent } from '@servicenow/sdk/core'

// Phase 8: the three native AP agents (AI Agent Studio). Every tool is a thin
// script wrapper over FinanceAgentTools, which does the role checks,
// GlideRecordSecure reads, Now Assist skill calls and audit logging — see
// docs/AI_AGENT_TOOLS.md. No agent has any tool that can approve, post,
// change state or override a tolerance: those capabilities simply don't
// exist in the tool surface.
//
// Identity: agents run as the invoking user (no runAsUser). dataAccess
// limits which of the caller's roles the agent may use. roleList uses the
// real sys_user_role sys_ids (this instance has no
// sys_agent_access_role_mapping table, so roleMap is unavailable).

const ROLE = {
    aiAgent: '3820b778bac540099d293cef1520a777',
    admin: '4411dd9103de4bdbb5468924b1e5459f',
    apProcessor: 'bf505b5092574a7fa59a01048550571a',
    financeReviewer: '484c56f4217841e298f5752ea6093a3f',
    financeApprover: 'e1abbc605ba34cbfb77c584ea689c1b2',
    auditor: '03604bf4100246588f4250676240bc18',
}

// Phase 22: no admin or approver role in any agent's mask or execute ACL;
// AI identities hold only ROLE.aiAgent.
const AP_READ_ROLES = [ROLE.aiAgent, ROLE.apProcessor, ROLE.financeReviewer, ROLE.auditor]
const AP_DRAFT_ROLES = [ROLE.aiAgent, ROLE.apProcessor, ROLE.financeReviewer]

const SAFETY_RULES = `Hard limits (never break these):
- You are advisory only. You may recommend an action, but you cannot and must never perform one: never approve, reject, post, pay, hold, release, or change the state of any invoice or exception, and never override a tolerance, approval limit or segregation-of-duties rule. You have no tools for any of that.
- Never claim or imply that an invoice has been approved, posted, resolved or waived.
- Only state facts that appear in tool results. If data is missing, say it is missing. Label any cause you infer as a hypothesis.
- If a tool returns ok:false, tell the user the message it returned and stop; do not guess the answer.`

export const apExceptionAnalysisAgent = AiAgent({
    $id: Now.ID['bcfa_ap_exception_analysis_agent'],
    name: 'BCFA AP Exception Analysis Agent',
    description:
        'Analyzes an AP invoice exception (invoice, lines, vendor, PO, GRN, match and tolerance results, tax) and explains the exception type, variance, evidence and likely cause. Advisory only: never approves, overrides or posts.',
    agentRole: 'Accounts Payable exception analyst (advisory)',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Analyzing the AP exception...',
    postProcessingMessage: 'Exception analysis complete. This is advisory; a human decides the outcome.',
    securityAcl: {
        $id: Now.ID['bcfa_ap_exception_analysis_agent_acl'],
        type: 'Specific role',
        roles: AP_READ_ROLES,
    },
    dataAccess: {
        roleList: AP_READ_ROLES,
        description: 'Runs with the caller identity, limited to the BCFA AP read roles.',
    },
    tools: [
        {
            name: 'Find AP Invoice',
            description: 'Looks up AP invoices by exact invoice number and returns their sys_id, vendor, amount and states. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Looking up the AP invoice...',
            postMessage: 'Invoice lookup complete.',
            inputs: [{ name: 'invoice_number', description: 'Exact AP invoice number, e.g. INV-AP-005', mandatory: true }],
            script: `(function(inputs) {
            return new x_695068_bcfa.FinanceAgentTools().findApInvoice(inputs.invoice_number);
        })(inputs);`,
        },
        {
            name: 'List Open AP Exceptions',
            description: 'Lists the open or in-review exceptions for one AP invoice (sys_id, reason, status, description). Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Checking open exceptions...',
            postMessage: 'Exception list retrieved.',
            inputs: [{ name: 'ap_invoice_sys_id', description: 'sys_id of the AP invoice', mandatory: true }],
            script: `(function(inputs) {
            return new x_695068_bcfa.FinanceAgentTools().listOpenApExceptions(inputs.ap_invoice_sys_id);
        })(inputs);`,
        },
        {
            name: 'Get AP Exception Context',
            description:
                'Returns the full evidence for one AP exception as text: exception reason and description, invoice header, vendor, PO, invoice lines with PO ordered/received quantity and PO price, match results with variances, and other open exceptions. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Gathering the exception evidence...',
            postMessage: 'Evidence gathered.',
            inputs: [{ name: 'ap_exception_sys_id', description: 'sys_id of the AP exception', mandatory: true }],
            script: `(function(inputs) {
            return new x_695068_bcfa.FinanceAgentTools().getApExceptionContext(inputs.ap_exception_sys_id);
        })(inputs);`,
        },
        {
            name: 'Explain AP Exception',
            description:
                'Calls the native Now Assist skill that explains, in plain language, why the AP invoice failed matching (variance, threshold, compared quantities and prices). Returns advisory text. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Generating the explanation with Now Assist...',
            postMessage: 'Explanation generated.',
            inputs: [{ name: 'ap_exception_sys_id', description: 'sys_id of the AP exception', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().explainApException(inputs.ap_exception_sys_id);
})(inputs);`,
        },
    ],
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `You analyze Accounts Payable invoice exceptions for a human AP reviewer.

Steps:
1. Identify the exception. If you were given an AP exception sys_id, use it. If you were given an invoice number, use Find AP Invoice, then List Open AP Exceptions for that invoice. If there are several open exceptions, analyze each one. If none are open, say so and stop.
2. For each exception, call Get AP Exception Context to read the evidence.
3. Call Explain AP Exception for the same exception to get the plain-language explanation.
4. Using only the evidence and the explanation, produce the analysis in the output format below.

Confidence: High when the evidence contains the exact figures behind the exception (e.g. invoice price vs PO price, invoiced vs received quantity); Medium when the exception type is clear but some figures are missing; Low when key evidence is missing or contradictory. State the reason for the confidence.

Output format (plain text, one block per exception):
Exception type: <reason>
Invoice: <invoice number> - <vendor>
Explanation: <2-4 sentences>
Financial variance: <amounts and percentage, or "not available">
Evidence: <bullet list of the specific figures and records you relied on>
Likely cause (hypothesis): <one or two sentences>
Confidence: <High|Medium|Low> - <reason>
Human decision required: Yes - an AP processor must review and decide.

${SAFETY_RULES}`,
        },
    ],
})

export const apResolutionRecommendationAgent = AiAgent({
    $id: Now.ID['bcfa_ap_resolution_recommendation_agent'],
    name: 'BCFA AP Resolution Recommendation Agent',
    description:
        'Recommends the next procedural action for an AP invoice exception from a fixed list (request correction, request receipt confirmation, route to AP processor, tolerance approval, investigate duplicate, validate tax, hold) with rationale and evidence. Advisory only.',
    agentRole: 'Accounts Payable resolution advisor (advisory)',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Working out a recommended next action...',
    postProcessingMessage: 'Recommendation ready. A human must decide and act.',
    securityAcl: {
        $id: Now.ID['bcfa_ap_resolution_recommendation_agent_acl'],
        type: 'Specific role',
        roles: AP_READ_ROLES,
    },
    dataAccess: {
        roleList: AP_READ_ROLES,
        description: 'Runs with the caller identity, limited to the BCFA AP read roles. Saving advice additionally needs ap_processor or finance_reviewer (checked by the tool).',
    },
    tools: [
        {
            name: 'Find AP Invoice (Resolution)',
            description: 'Looks up AP invoices by exact invoice number and returns their sys_id, vendor, amount and states. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Looking up the AP invoice...',
            postMessage: 'Invoice lookup complete.',
            inputs: [{ name: 'invoice_number', description: 'Exact AP invoice number, e.g. INV-AP-005', mandatory: true }],
            script: `(function(inputs) {
            return new x_695068_bcfa.FinanceAgentTools().findApInvoice(inputs.invoice_number);
        })(inputs);`,
        },
        {
            name: 'List Open AP Exceptions (Resolution)',
            description: 'Lists the open or in-review exceptions for one AP invoice (sys_id, reason, status, description). Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Checking open exceptions...',
            postMessage: 'Exception list retrieved.',
            inputs: [{ name: 'ap_invoice_sys_id', description: 'sys_id of the AP invoice', mandatory: true }],
            script: `(function(inputs) {
            return new x_695068_bcfa.FinanceAgentTools().listOpenApExceptions(inputs.ap_invoice_sys_id);
        })(inputs);`,
        },
        {
            name: 'Get AP Exception Context (Resolution)',
            description:
                'Returns the full evidence for one AP exception as text: exception reason and description, invoice header, vendor, PO, invoice lines with PO ordered/received quantity and PO price, match results with variances, and other open exceptions. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Gathering the exception evidence...',
            postMessage: 'Evidence gathered.',
            inputs: [{ name: 'ap_exception_sys_id', description: 'sys_id of the AP exception', mandatory: true }],
            script: `(function(inputs) {
            return new x_695068_bcfa.FinanceAgentTools().getApExceptionContext(inputs.ap_exception_sys_id);
        })(inputs);`,
        },
        {
            name: 'Recommend AP Next Action',
            description:
                'Calls the native Now Assist skill that suggests one reasonable next procedural step for the AP exception, phrased as a recommendation for a human. Returns advisory text. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Asking Now Assist for a recommended next step...',
            postMessage: 'Suggestion received.',
            inputs: [{ name: 'ap_exception_sys_id', description: 'sys_id of the AP exception', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().recommendApNextAction(inputs.ap_exception_sys_id);
})(inputs);`,
        },
        {
            name: 'Save Advisory Recommendation',
            description:
                'Saves the final recommendation text to the AP exception\'s advisory AI Recommendation field only. Changes nothing else and is audited.',
            type: 'script',
            recordType: 'custom',
            // Autopilot so the triggered BCFA AP Invoice Review workflow can
            // record its advisory note with nobody present to confirm (Phase 10
            // decision). Safe because the tool can only write ai_recommendation,
            // is role-checked and audited, and nothing reads that field for
            // decisions. In chat the instructions still say: save only when asked.
            executionMode: 'autopilot',
            preMessage: 'Saving the advisory recommendation...',
            postMessage: 'Advisory recommendation saved to the exception.',
            inputs: [
                { name: 'ap_exception_sys_id', description: 'sys_id of the AP exception', mandatory: true },
                { name: 'advice_text', description: 'The final recommendation text, exactly as shown to the user', mandatory: true },
            ],
            script: `(function(inputs) {
    var tools = new x_695068_bcfa.FinanceAgentTools();
    return tools.recordExceptionAdvice('ap', inputs.ap_exception_sys_id, inputs.advice_text);
})(inputs);`,
        },
    ],
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `You recommend the next procedural action for an Accounts Payable invoice exception. A human AP processor makes the decision and takes the action.

Allowed recommendations (choose exactly one per exception):
- Request invoice correction from the vendor
- Request receipt confirmation from the goods receiver
- Send to AP processor for manual review
- Send for tolerance approval (a human approver decides; you never approve)
- Investigate possible duplicate
- Validate tax with the tax team
- Hold invoice pending clarification

Steps:
1. Identify the exception (use the sys_id you were given, or Find AP Invoice (Resolution) then List Open AP Exceptions (Resolution)).
2. Call Get AP Exception Context (Resolution) to read the evidence.
3. Always call Recommend AP Next Action to get the Now Assist suggestion before you answer. Do not skip this step, even if the answer seems obvious from the evidence.
4. Map the suggestion and the evidence to exactly one allowed recommendation. Guidance: price variance -> request invoice correction, or tolerance approval if the variance looks like an agreed price change; quantity variance -> request receipt confirmation; duplicate -> investigate possible duplicate; tax -> validate tax; low extraction confidence or missing fields -> send to AP processor; vendor or PO problems -> hold invoice pending clarification.
5. Show the result in the output format below.
6. Only if the user asks you to save it, call Save Advisory Recommendation with the exact text you showed. Never save without being asked.

Output format (plain text):
Recommendation: <one allowed recommendation>
Rationale: <2-3 sentences>
Evidence: <bullet list of specific figures and records>
Confidence: <High|Medium|Low> - <reason>
Human action required: <what the AP processor needs to do next>

${SAFETY_RULES}`,
        },
    ],
})

export const apCommunicationAgent = AiAgent({
    $id: Now.ID['bcfa_ap_communication_agent'],
    name: 'BCFA AP Communication Agent',
    description:
        'Drafts professional clarification text about an AP invoice exception for a vendor, procurement, the goods receiver or a finance reviewer. Produces draft text only and never sends anything.',
    agentRole: 'Accounts Payable communication drafter (draft only)',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Drafting the clarification...',
    postProcessingMessage: 'Draft ready for your review. Nothing has been sent.',
    securityAcl: {
        $id: Now.ID['bcfa_ap_communication_agent_acl'],
        type: 'Specific role',
        roles: AP_DRAFT_ROLES,
    },
    dataAccess: {
        roleList: AP_DRAFT_ROLES,
        description: 'Runs with the caller identity, limited to the BCFA roles allowed to draft AP communications.',
    },
    tools: [
        {
            name: 'Find AP Invoice (Communication)',
            description: 'Looks up AP invoices by exact invoice number and returns their sys_id, vendor, amount and states. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Looking up the AP invoice...',
            postMessage: 'Invoice lookup complete.',
            inputs: [{ name: 'invoice_number', description: 'Exact AP invoice number, e.g. INV-AP-005', mandatory: true }],
            script: `(function(inputs) {
            return new x_695068_bcfa.FinanceAgentTools().findApInvoice(inputs.invoice_number);
        })(inputs);`,
        },
        {
            name: 'List Open AP Exceptions (Communication)',
            description: 'Lists the open or in-review exceptions for one AP invoice (sys_id, reason, status, description). Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Checking open exceptions...',
            postMessage: 'Exception list retrieved.',
            inputs: [{ name: 'ap_invoice_sys_id', description: 'sys_id of the AP invoice', mandatory: true }],
            script: `(function(inputs) {
            return new x_695068_bcfa.FinanceAgentTools().listOpenApExceptions(inputs.ap_invoice_sys_id);
        })(inputs);`,
        },
        {
            name: 'Get AP Exception Context (Communication)',
            description:
                'Returns the full evidence for one AP exception as text: exception reason and description, invoice header, vendor, PO, invoice lines with PO ordered/received quantity and PO price, match results with variances, and other open exceptions. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Gathering the exception evidence...',
            postMessage: 'Evidence gathered.',
            inputs: [{ name: 'ap_exception_sys_id', description: 'sys_id of the AP exception', mandatory: true }],
            script: `(function(inputs) {
            return new x_695068_bcfa.FinanceAgentTools().getApExceptionContext(inputs.ap_exception_sys_id);
        })(inputs);`,
        },
        {
            name: 'Draft Vendor Clarification',
            description:
                'Calls the native Now Assist skill that drafts a short, polite vendor clarification email about the AP exception. Returns draft text only; nothing is sent. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Drafting with Now Assist...',
            postMessage: 'Draft generated.',
            inputs: [{ name: 'ap_exception_sys_id', description: 'sys_id of the AP exception', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().draftVendorClarification(inputs.ap_exception_sys_id);
})(inputs);`,
        },
    ],
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `You draft clarification messages about Accounts Payable invoice exceptions. You only produce draft text for a human to review, edit and send. You have no ability to send email or messages, and you must never say that anything has been sent.

Audiences you can draft for: vendor, procurement (buyer), goods receiver, finance reviewer. If the user does not say which, ask; default to vendor.

Steps:
1. Identify the exception (use the sys_id you were given, or Find AP Invoice (Communication) then List Open AP Exceptions (Communication)).
2. Call Get AP Exception Context (Communication) to read the facts.
3. For a vendor: call Draft Vendor Clarification and use its draft as the basis.
   For procurement, the goods receiver or a finance reviewer: write the draft yourself from the context. Procurement: ask them to confirm the agreed price or PO terms. Goods receiver: ask them to confirm the received quantity and date. Finance reviewer: summarize the exception and the decision needed.
4. Keep drafts under 150 words, neutral and professional, quoting the invoice number, PO number and the specific figures in question. End with a placeholder signature line "[Your name], Accounts Payable".
5. After the last tool call, you must always write your final answer to the user containing the full draft in the output format below. Never finish with only a tool call; the user cannot see tool results directly.

Output format (plain text):
Audience: <audience>
Subject: <one line>
Draft:
<message body>
Note: Draft only - review and send it yourself.

${SAFETY_RULES}`,
        },
    ],
})
