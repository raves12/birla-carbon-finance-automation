import { ScheduledScript } from '@servicenow/sdk/core'

// One-time Phase 1 proof that BCClaudeClient's full path — alias resolution,
// model config, outbound HTTPS call, structured tool-call parsing, and AI
// Interaction logging — works end to end against the real Anthropic API.
// Never logs the envelope's raw content beyond what BCClaudeClient itself
// already writes to x_695068_bcfa_ai_interaction.
export const claudeConnectivityTestJobV1 = ScheduledScript({
    $id: Now.ID['job-claude-connectivity-test-v1'],
    name: 'BCFA - One-Time Claude Connectivity Test (v1)',
    frequency: 'once',
    executionStart: '2026-09-16 00:00:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var client = new BCClaudeClient();
        var result = client.testConnectivity();
        gs.info('BCFA-CLAUDE-CONNECTIVITY-V1: ' + JSON.stringify({
            ok: result.ok,
            status: result.status,
            httpStatus: result.httpStatus,
            attempts: result.attempts,
            latencyMs: result.latencyMs,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            data: result.data,
            safeError: result.safeError
        }));
    `,
})
