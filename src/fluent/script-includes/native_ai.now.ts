import { ScriptInclude } from '@servicenow/sdk/core'

// Native ServiceNow AI (Phase 7). These replaced the Claude path
// (BCClaudeClient), which was removed in Phase 34 — see
// docs/AI_AGENT_TOOLS.md and docs/AI_GOVERNANCE.md.

export const nowAssistSkillClient = ScriptInclude({
    $id: Now.ID['si-now-assist-skill-client'],
    name: 'NowAssistSkillClient',
    active: true,
    apiName: 'x_695068_bcfa.NowAssistSkillClient',
    description: 'Invokes the 9 published BCFA Now Assist skills (Now LLM Service) with a pre-formatted context string and returns advisory text. Never writes to business records.',
    script: Now.include('../../server/script-includes/NowAssistSkillClient.server.js'),
})

export const financeAgentTools = ScriptInclude({
    $id: Now.ID['si-finance-agent-tools'],
    name: 'FinanceAgentTools',
    active: true,
    apiName: 'x_695068_bcfa.FinanceAgentTools',
    description: 'Least-privilege, role-checked tool surface for the BCFA AI agents: read-only lookups and context, advisory Now Assist skill calls, and one write tool limited to the advisory ai_recommendation field.',
    script: Now.include('../../server/script-includes/FinanceAgentTools.server.js'),
})

// Phase 20: provider-agnostic AI Interaction Log writer.
export const aiInteractionLog = ScriptInclude({
    $id: Now.ID['si-ai-interaction-log'],
    name: 'AiInteractionLog',
    active: true,
    apiName: 'x_695068_bcfa.AiInteractionLog',
    description: 'Writes the AI Interaction Log: one row per AI execution (Now Assist skills and agentic workflows, simulated extraction; historical Claude rows until Phase 34) with capability, skill, agent, workflow, hashed input context, result, confidence, status, duration and the human outcome. Never stores prompts.',
    script: Now.include('../../server/script-includes/AiInteractionLog.server.js'),
})

// Phase 21: BCFA's own guardrails around every Now Assist skill call.
export const financeAiGuard = ScriptInclude({
    $id: Now.ID['si-finance-ai-guard'],
    name: 'FinanceAiGuard',
    active: true,
    apiName: 'x_695068_bcfa.FinanceAiGuard',
    description: 'BCFA AI guardrails (defence in depth next to Now Assist Guardian): screens skill input for prompt injection and sanitizes skill output (plain text, no statement that a financial action is completed unless the record is in that state).',
    script: Now.include('../../server/script-includes/FinanceAiGuard.server.js'),
})
