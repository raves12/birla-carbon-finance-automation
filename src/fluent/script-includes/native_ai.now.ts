import { ScriptInclude } from '@servicenow/sdk/core'

// Native ServiceNow AI (Phase 7). These replace the Claude path
// (BCClaudeClient) once the agents built on them are proven — see
// docs/AI_AGENT_TOOLS.md and IMPLEMENTATION_BACKLOG.md Phase 34.

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
    description: 'Writes the AI Interaction Log: one row per AI execution (Now Assist skills and agentic workflows, simulated extraction, legacy Claude) with capability, skill, agent, workflow, hashed input context, result, confidence, status, duration and the human outcome. Never stores prompts.',
    script: Now.include('../../server/script-includes/AiInteractionLog.server.js'),
})
