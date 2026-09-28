import '@servicenow/sdk/global'
import { AiAgent } from '@servicenow/sdk/core'

// Phase 9: the four native Cash Application (AR) agents. Same pattern as the
// AP agents (ap_agents.now.ts): every tool is a thin script wrapper over
// FinanceAgentTools, agents run as the invoking user limited to BCFA AR
// roles, and no agent has any tool that can allocate, clear, write off,
// approve or change state. Tool names carry a per-agent suffix because
// sn_aia_tool records are keyed by name and can't be shared across agents.

const ROLE = {
    admin: '4411dd9103de4bdbb5468924b1e5459f',
    arProcessor: '588d615a5fea475bbe3422f50e91c218',
    financeReviewer: '484c56f4217841e298f5752ea6093a3f',
    financeApprover: 'e1abbc605ba34cbfb77c584ea689c1b2',
    auditor: '03604bf4100246588f4250676240bc18',
}

const AR_READ_ROLES = [ROLE.admin, ROLE.arProcessor, ROLE.financeReviewer, ROLE.financeApprover, ROLE.auditor]
const AR_DRAFT_ROLES = [ROLE.admin, ROLE.arProcessor, ROLE.financeReviewer, ROLE.financeApprover]

const SAFETY_RULES = `Hard limits (never break these):
- You are advisory only. You may recommend, but you cannot and must never apply, allocate, clear, write off, approve, reject or change the state of any payment, allocation, deduction or exception, and never override a control. You have no tools for any of that.
- Never claim or imply that a payment has been applied, allocated, cleared or written off.
- Only state facts that appear in tool results. If data is missing, say it is missing. Label any cause you infer as a hypothesis.
- If a tool returns ok:false, tell the user the message it returned and stop; do not guess the answer.
- Always finish with a written answer to the user in the output format; the user cannot see tool results directly.`

export const customerResolutionAgent = AiAgent({
    $id: Now.ID['bcfa_customer_resolution_agent'],
    name: 'BCFA Customer Resolution Agent',
    description:
        'Analyzes a payment reference, remittance, remitter name, customer aliases and open items and returns ranked customer candidates with score, evidence and reason. Advisory only: never assigns a customer.',
    agentRole: 'Cash application customer identification analyst (advisory)',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Identifying likely customers...',
    postProcessingMessage: 'Customer candidates ready. A human confirms the customer.',
    securityAcl: {
        $id: Now.ID['bcfa_customer_resolution_agent_acl'],
        type: 'Specific role',
        roles: AR_READ_ROLES,
    },
    dataAccess: {
        roleList: AR_READ_ROLES,
        description: 'Runs with the caller identity, limited to the BCFA AR read roles.',
    },
    tools: [
        {
            name: 'Find Payment (Customer Resolution)',
            description: 'Looks up payments by exact bank reference and returns their sys_id, customer, amount, currency and state. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Looking up the payment...',
            postMessage: 'Payment lookup complete.',
            inputs: [{ name: 'bank_reference', description: 'Exact bank reference, e.g. BANK-AR-005', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().findPayment(inputs.bank_reference);
})(inputs);`,
        },
        {
            name: 'Get Payment Context (Customer Resolution)',
            description:
                'Returns the full evidence for one payment as text: amount, currency, dates, masked remitter account, remittances and extracted fields, match candidates, allocations, open exceptions and the customer\'s open items. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Gathering the payment evidence...',
            postMessage: 'Evidence gathered.',
            inputs: [{ name: 'payment_sys_id', description: 'sys_id of the payment', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().getPaymentContext(inputs.payment_sys_id);
})(inputs);`,
        },
        {
            name: 'Search Customer Candidates',
            description:
                'Finds customers whose name or active alias (legal, trade, bank remitter name, known misspelling) contains a keyword, with the evidence matched and each candidate\'s open items and open amount. Pass one distinctive word or short phrase, not a full sentence. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Searching customers and aliases...',
            postMessage: 'Customer search complete.',
            inputs: [{ name: 'name_keyword', description: 'A distinctive keyword from the remitter or customer name, at least 3 characters, e.g. LONE STAR', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().searchCustomerCandidates(inputs.name_keyword);
})(inputs);`,
        },
    ],
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `You identify which customer most likely sent a payment, for a human cash application reviewer. You never assign the customer yourself.

Steps:
1. If you were given a payment sys_id, use it; if you were given a bank reference, call Find Payment (Customer Resolution).
2. Call Get Payment Context (Customer Resolution) to read the payment, remittance, existing match candidates and exceptions.
3. Pick 1-3 distinctive keywords from the remitter or customer names in the evidence (e.g. a company name without "GmbH", "Ltd", "Corp"). Call Search Customer Candidates once per keyword.
4. Rank the candidates. Score each from 0.00 to 1.00 using: exact name or legal-name match (strong), bank remitter alias match weighted by its alias weight (strong), trade name or known misspelling (medium), currency matching the payment (supporting), an open item whose amount or reference fits the payment (strong supporting), existing deterministic match candidates for the same customer (supporting). Explain the score.
5. If no candidate is credible, say so and recommend manual customer identification.

Output format (plain text):
Payment: <bank reference> - <amount> <currency>
Ranked customer candidates:
1. <customer name> (<code>) - score <0.00-1.00>
   Evidence: <specific matches and figures>
   Reason: <one sentence>
(repeat for each candidate, best first)
Recommendation: <confirm candidate 1 | manual identification needed>
Human decision required: Yes - an AR processor must confirm the customer.

${SAFETY_RULES}`,
        },
    ],
})

export const cashMatchRecommendationAgent = AiAgent({
    $id: Now.ID['bcfa_cash_match_recommendation_agent'],
    name: 'BCFA Cash Match Recommendation Agent',
    description:
        'Analyzes a payment, its remittance, the resolved customer and open invoices and recommends candidate invoices, an allocation and the remaining residual with confidence and explanation. A recommendation only: the deterministic application validates allocation totals.',
    agentRole: 'Cash application match advisor (advisory)',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Working out a recommended allocation...',
    postProcessingMessage: 'Allocation recommendation ready. The application validates totals and a human decides.',
    securityAcl: {
        $id: Now.ID['bcfa_cash_match_recommendation_agent_acl'],
        type: 'Specific role',
        roles: AR_READ_ROLES,
    },
    dataAccess: {
        roleList: AR_READ_ROLES,
        description: 'Runs with the caller identity, limited to the BCFA AR read roles. Saving advice additionally needs ar_processor or finance_reviewer (checked by the tool).',
    },
    tools: [
        {
            name: 'Find Payment (Cash Match)',
            description: 'Looks up payments by exact bank reference and returns their sys_id, customer, amount, currency and state. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Looking up the payment...',
            postMessage: 'Payment lookup complete.',
            inputs: [{ name: 'bank_reference', description: 'Exact bank reference, e.g. BANK-AR-002', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().findPayment(inputs.bank_reference);
})(inputs);`,
        },
        {
            name: 'Get Payment Context (Cash Match)',
            description:
                'Returns the full evidence for one payment as text, including remittance invoice references, match candidates, proposed allocations with residuals and the customer\'s open items. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Gathering the payment evidence...',
            postMessage: 'Evidence gathered.',
            inputs: [{ name: 'payment_sys_id', description: 'sys_id of the payment', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().getPaymentContext(inputs.payment_sys_id);
})(inputs);`,
        },
        {
            name: 'Explain AR Match',
            description:
                'Calls the native Now Assist skill that explains how the payment matches, or fails to match, open invoices. Returns advisory text. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Asking Now Assist to explain the match...',
            postMessage: 'Match explanation received.',
            inputs: [{ name: 'payment_sys_id', description: 'sys_id of the payment', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().explainArMatch(inputs.payment_sys_id);
})(inputs);`,
        },
        {
            name: 'List Open AR Exceptions (Cash Match)',
            description: 'Lists the open or in-review exceptions for one payment (sys_id, reason, status, description). Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Checking open exceptions...',
            postMessage: 'Exception list retrieved.',
            inputs: [{ name: 'payment_sys_id', description: 'sys_id of the payment', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().listOpenArExceptions(inputs.payment_sys_id);
})(inputs);`,
        },
        {
            name: 'Save AR Advisory Recommendation (Cash Match)',
            description:
                'Saves the final recommendation text to an AR exception\'s advisory AI Recommendation field only. Changes nothing else and is audited.',
            type: 'script',
            recordType: 'custom',
            // Autopilot so the triggered BCFA Cash Application Review workflow
            // can record its advisory note unattended (Phase 11, same decision
            // as the AP workflow). The tool can only write ai_recommendation,
            // is role-checked and audited; in chat, save only when asked.
            executionMode: 'autopilot',
            preMessage: 'Saving the advisory recommendation...',
            postMessage: 'Advisory recommendation saved to the exception.',
            inputs: [
                { name: 'ar_exception_sys_id', description: 'sys_id of the AR exception', mandatory: true },
                { name: 'advice_text', description: 'The final recommendation text, exactly as shown to the user', mandatory: true },
            ],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().recordExceptionAdvice('ar', inputs.ar_exception_sys_id, inputs.advice_text);
})(inputs);`,
        },
    ],
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `You recommend how an incoming customer payment should be matched to open invoices, for a human cash application reviewer. The application's deterministic logic validates any allocation and a human decides; you only recommend.

Steps:
1. If you were given a payment sys_id, use it; if you were given a bank reference, call Find Payment (Cash Match).
2. Call Get Payment Context (Cash Match) to read the payment, remittance references, candidates, allocations and open items.
3. Always call Explain AR Match to get the Now Assist explanation before you answer.
4. Recommend an allocation: which open items to apply the payment to and how much to each. Prefer invoices named in the remittance; otherwise exact amount matches; otherwise the oldest due items for the same customer. Never allocate more to an item than its open amount.
5. Compute the remaining residual = payment amount - total recommended allocation, and show the arithmetic.
   Currency rule (hard): if the payment context contains a line starting "CURRENCY MISMATCH", you must not allocate any amount to the open items it names, and you must not add, subtract or compare their amounts with the payment. For those items write "Recommended allocation: none - currency mismatch, human review required" and "Remaining residual: not computable across currencies". Only items in the payment currency may be allocated.
6. Saving: call List Open AR Exceptions (Cash Match) and then Save AR Advisory Recommendation (Cash Match) only when the request explicitly asks you to save a given note text; save exactly that text. A request to review, recommend, analyze or "record a recommendation" on an exception is NOT a request to save: return your recommendation and let the requester compose and save the final note. Never save your own analysis unasked.

Output format (plain text):
Payment: <bank reference> - <amount> <currency> - customer <name or "not identified">
Candidate invoices: <item number, open amount, why it is a candidate - one per line>
Recommended allocation: <item number: amount - one per line>
Remaining residual: <amount> (<payment> - <total allocated>)
Confidence: <High|Medium|Low> - <reason>
Explanation: <2-4 sentences>
Validation: The application must validate these totals; an AR processor decides.

${SAFETY_RULES}`,
        },
    ],
})

export const deductionAnalysisAgent = AiAgent({
    $id: Now.ID['bcfa_deduction_analysis_agent'],
    name: 'BCFA Deduction Analysis Agent',
    description:
        'Analyzes a payment residual and suggests a deduction classification (BANK_CHARGE, SHORT_PAY, TCS, CREDIT_NOTE, OTHER) with amount, rationale, confidence and required review. Advisory only: never creates or approves a deduction or write-off.',
    agentRole: 'Cash application deduction analyst (advisory)',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Analyzing the residual...',
    postProcessingMessage: 'Deduction analysis ready. A human decides how to treat the residual.',
    securityAcl: {
        $id: Now.ID['bcfa_deduction_analysis_agent_acl'],
        type: 'Specific role',
        roles: AR_READ_ROLES,
    },
    dataAccess: {
        roleList: AR_READ_ROLES,
        description: 'Runs with the caller identity, limited to the BCFA AR read roles. Saving advice additionally needs ar_processor or finance_reviewer (checked by the tool).',
    },
    tools: [
        {
            name: 'Find Payment (Deduction)',
            description: 'Looks up payments by exact bank reference and returns their sys_id, customer, amount, currency and state. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Looking up the payment...',
            postMessage: 'Payment lookup complete.',
            inputs: [{ name: 'bank_reference', description: 'Exact bank reference, e.g. BANK-AR-002', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().findPayment(inputs.bank_reference);
})(inputs);`,
        },
        {
            name: 'Get Payment Context (Deduction)',
            description:
                'Returns the full evidence for one payment as text, including allocations with discount, bank charge, TCS and residual, existing deductions, remittance notes and open exceptions. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Gathering the payment evidence...',
            postMessage: 'Evidence gathered.',
            inputs: [{ name: 'payment_sys_id', description: 'sys_id of the payment', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().getPaymentContext(inputs.payment_sys_id);
})(inputs);`,
        },
        {
            name: 'Explain AR Residual',
            description:
                'Calls the native Now Assist skill that explains the likely cause of the short-pay or over-payment residual, labelled as a hypothesis. Returns advisory text. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Asking Now Assist about the residual...',
            postMessage: 'Residual explanation received.',
            inputs: [{ name: 'payment_sys_id', description: 'sys_id of the payment', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().explainArResidual(inputs.payment_sys_id);
})(inputs);`,
        },
        {
            name: 'List Open AR Exceptions (Deduction)',
            description: 'Lists the open or in-review exceptions for one payment (sys_id, reason, status, description). Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Checking open exceptions...',
            postMessage: 'Exception list retrieved.',
            inputs: [{ name: 'payment_sys_id', description: 'sys_id of the payment', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().listOpenArExceptions(inputs.payment_sys_id);
})(inputs);`,
        },
        {
            name: 'Save AR Advisory Recommendation (Deduction)',
            description:
                'Saves the final analysis text to an AR exception\'s advisory AI Recommendation field only. Changes nothing else and is audited.',
            type: 'script',
            recordType: 'custom',
            // Autopilot so the triggered BCFA Cash Application Review workflow
            // can record its advisory note unattended (Phase 11, same decision
            // as the AP workflow). The tool can only write ai_recommendation,
            // is role-checked and audited; in chat, save only when asked.
            executionMode: 'autopilot',
            preMessage: 'Saving the advisory analysis...',
            postMessage: 'Advisory analysis saved to the exception.',
            inputs: [
                { name: 'ar_exception_sys_id', description: 'sys_id of the AR exception', mandatory: true },
                { name: 'advice_text', description: 'The final analysis text, exactly as shown to the user', mandatory: true },
            ],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().recordExceptionAdvice('ar', inputs.ar_exception_sys_id, inputs.advice_text);
})(inputs);`,
        },
    ],
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `You analyze the residual left on a customer payment (the difference between what was paid and what was due) and suggest how it should be classified, for a human cash application reviewer. You never create, approve or post a deduction or write-off.

Allowed classifications (choose exactly one; if the residual clearly has two parts, give each part its own line):
- BANK_CHARGE: small difference consistent with bank or intermediary fees, or a remittance note mentioning charges
- SHORT_PAY: customer paid less than invoiced without an agreed reason (possible dispute, pricing or quantity issue)
- TCS: difference consistent with tax collected at source withheld by the customer
- CREDIT_NOTE: difference matches an open credit note for the same customer
- OTHER: none of the above fit, or the evidence is contradictory (for example a currency mismatch)

Steps:
1. If you were given a payment sys_id, use it; if you were given a bank reference, call Find Payment (Deduction).
2. Always call Get Payment Context (Deduction) to read amounts, allocations, deductions, remittance notes and exceptions, even if another agent already described the payment. Base your answer only on what these tools return.
3. Always call Explain AR Residual to get the Now Assist hypothesis before you answer.
4. Work out the residual amount from the evidence (payment amount vs amounts due) and show the arithmetic.
   Currency rule (hard): if the payment context contains a line starting "CURRENCY MISMATCH", classify as OTHER, write "Residual: not computable across currencies" and "Amount: not computable - currency mismatch", and state that a human must confirm the correct currency and exchange treatment. Never subtract or compare amounts in different currencies.
5. Saving: call List Open AR Exceptions (Deduction) and then Save AR Advisory Recommendation (Deduction) only when the request explicitly asks you to save a given note text; save exactly that text. A request to analyze a residual is NOT a request to save: return your analysis. Never save your own analysis unasked.

Output format (plain text):
Payment: <bank reference> - <amount> <currency>
Residual: <amount> (<how it was calculated>)
Recommended classification: <BANK_CHARGE|SHORT_PAY|TCS|CREDIT_NOTE|OTHER>
Amount: <amount to classify>
Rationale: <2-3 sentences, cause labelled as a hypothesis>
Confidence: <High|Medium|Low> - <reason>
Required review: <who must review and what they must confirm>

${SAFETY_RULES}`,
        },
    ],
})

export const cashApplicationCommunicationAgent = AiAgent({
    $id: Now.ID['bcfa_cash_application_communication_agent'],
    name: 'BCFA Cash Application Communication Agent',
    description:
        'Drafts customer or internal clarification text about an unmatched, short-paid or ambiguous payment. Produces draft text only and never sends anything; external communication needs workflow approval.',
    agentRole: 'Cash application communication drafter (draft only)',
    recordType: 'custom',
    channel: 'nap',
    processingMessage: 'Drafting the clarification...',
    postProcessingMessage: 'Draft ready for your review. Nothing has been sent.',
    securityAcl: {
        $id: Now.ID['bcfa_cash_application_communication_agent_acl'],
        type: 'Specific role',
        roles: AR_DRAFT_ROLES,
    },
    dataAccess: {
        roleList: AR_DRAFT_ROLES,
        description: 'Runs with the caller identity, limited to the BCFA roles allowed to draft AR communications.',
    },
    tools: [
        {
            name: 'Find Payment (Communication)',
            description: 'Looks up payments by exact bank reference and returns their sys_id, customer, amount, currency and state. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Looking up the payment...',
            postMessage: 'Payment lookup complete.',
            inputs: [{ name: 'bank_reference', description: 'Exact bank reference, e.g. BANK-AR-002', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().findPayment(inputs.bank_reference);
})(inputs);`,
        },
        {
            name: 'List Open AR Exceptions (Communication)',
            description: 'Lists the open or in-review exceptions for one payment (sys_id, reason, status, description). Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Checking open exceptions...',
            postMessage: 'Exception list retrieved.',
            inputs: [{ name: 'payment_sys_id', description: 'sys_id of the payment', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().listOpenArExceptions(inputs.payment_sys_id);
})(inputs);`,
        },
        {
            name: 'Get AR Exception Context (Communication)',
            description:
                'Returns the full evidence for one AR exception as text: exception reason and description plus the full payment context. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Gathering the exception evidence...',
            postMessage: 'Evidence gathered.',
            inputs: [{ name: 'ar_exception_sys_id', description: 'sys_id of the AR exception', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().getArExceptionContext(inputs.ar_exception_sys_id);
})(inputs);`,
        },
        {
            name: 'Draft Customer Clarification',
            description:
                'Calls the native Now Assist skill that drafts a short, polite customer clarification email about the payment exception. Returns draft text only; nothing is sent. Read-only.',
            type: 'script',
            recordType: 'custom',
            executionMode: 'autopilot',
            preMessage: 'Drafting with Now Assist...',
            postMessage: 'Draft generated.',
            inputs: [{ name: 'ar_exception_sys_id', description: 'sys_id of the AR exception', mandatory: true }],
            script: `(function(inputs) {
    return new x_695068_bcfa.FinanceAgentTools().draftCustomerClarification(inputs.ar_exception_sys_id);
})(inputs);`,
        },
    ],
    versionDetails: [
        {
            name: 'V1',
            number: 1,
            state: 'published',
            instructions: `You draft clarification messages about customer payments that could not be applied cleanly (unmatched, short-paid, ambiguous customer, currency mismatch). You only produce draft text for a human to review, edit and send after workflow approval. You have no ability to send email or messages, and you must never say that anything has been sent.

Audiences: customer (external), or internal (treasury, sales account owner, AR reviewer). If the user does not say which, ask; default to customer.

Steps:
1. If you were given an AR exception sys_id, use it. If you were given a bank reference, call Find Payment (Communication), then List Open AR Exceptions (Communication); if several are open, draft for the one the user named or ask which.
2. Call Get AR Exception Context (Communication) to read the facts.
3. For the customer: call Draft Customer Clarification and use its draft as the basis. For internal audiences: write the draft yourself from the context (treasury: confirm bank details and value date; sales owner: ask about agreed discounts or disputes; AR reviewer: summarize the exception and the decision needed).
4. Keep drafts under 150 words, neutral and professional, quoting the bank reference, amount, currency and the specific invoices or figures in question. Never include full bank account numbers. End with a placeholder signature line "[Your name], Accounts Receivable".

Output format (plain text):
Audience: <audience>
Subject: <one line>
Draft:
<message body>
Note: Draft only - review it, get workflow approval for external sending, and send it yourself.

${SAFETY_RULES}`,
        },
    ],
})
