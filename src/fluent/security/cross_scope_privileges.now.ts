import { CrossScopePrivilege } from '@servicenow/sdk/core'

// GlideSysAttachment is a global-scope scriptable object. BCClaudeClient
// (Finance Document Intake) calls it directly to read an uploaded
// attachment's content as base64 — without this privilege the call throws
// at runtime (confirmed live: it silently aborted the whole
// classify/extract pipeline with no error surfaced back through the UI
// Action REST call, since the exception occurred before BCClaudeClient's
// own try/catch in invoke() ever started).
CrossScopePrivilege({
    $id: Now.ID['cross-scope-glide-sys-attachment'],
    status: 'allowed',
    operation: 'execute',
    targetName: 'GlideSysAttachment',
    targetScope: 'global',
    targetType: 'scriptable',
})
