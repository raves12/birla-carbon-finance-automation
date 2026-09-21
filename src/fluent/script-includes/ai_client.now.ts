import { ScriptInclude } from '@servicenow/sdk/core'

export const bcClaudeClient = ScriptInclude({
    $id: Now.ID['si-bc-claude-client'],
    name: 'BCClaudeClient',
    active: true,
    apiName: 'x_695068_bcfa.BCClaudeClient',
    description: 'Sole seam for outbound calls to the Anthropic Messages API. Resolves the existing x_695068_bcfa.BC_Claude_API_Credentials Connection & Credential Alias via sn_cc.ConnectionInfoProvider, forces structured tool-call output, and logs every call to AI Interaction. Business-process code (ApDomainService/ArDomainService) must call this class, never sn_cc/sn_ws directly.',
    script: Now.include('../../server/script-includes/BCClaudeClient.server.js'),
})
