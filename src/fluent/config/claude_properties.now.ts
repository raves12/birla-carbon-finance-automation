import { Property } from '@servicenow/sdk/core'

// Scoped configuration for the Claude integration layer (BCClaudeClient).
// Every value here is read at runtime via gs.getProperty() — never
// hardcoded into business logic — so the model, limits, and kill-switch can
// change without a code deployment. See docs note in BCClaudeClient.server.js
// for how each property is consumed.

export const claudeEnabled = Property({
    $id: Now.ID['prop-claude-enabled'],
    name: 'x_695068_bcfa.claude.enabled',
    type: 'boolean',
    value: 'true',
    description: 'Master kill-switch for the Claude integration layer. When false, BCClaudeClient.invoke() short-circuits to a disabled result and no outbound call is made — the manual/simulated process continues to work.',
})

export const claudeModel = Property({
    $id: Now.ID['prop-claude-model'],
    name: 'x_695068_bcfa.claude.model',
    type: 'string',
    value: 'claude-sonnet-4-5-20250929',
    description: 'Anthropic Messages API model ID used for every Claude call. Confirm/update this value directly — it is never hardcoded into any script.',
})

export const claudeTimeout = Property({
    $id: Now.ID['prop-claude-timeout'],
    name: 'x_695068_bcfa.claude.timeout',
    type: 'integer',
    value: '20000',
    description: 'Outbound HTTP timeout in milliseconds for calls to the Claude Messages API. Note: ServiceNow caps synchronous outbound REST timeouts at the platform level regardless of this value.',
})

export const claudeMaxTokens = Property({
    $id: Now.ID['prop-claude-max-tokens'],
    name: 'x_695068_bcfa.claude.max_tokens',
    type: 'integer',
    value: '2048',
    description: 'Default max_tokens sent with every Claude Messages API request unless a specific call overrides it.',
})

export const claudeConfidenceThreshold = Property({
    $id: Now.ID['prop-claude-confidence-threshold'],
    name: 'x_695068_bcfa.claude.confidence_threshold',
    type: 'string',
    value: '0.85',
    description: 'Minimum confidence (0-1) below which a Claude extraction/recommendation must be routed to the existing human review mechanism rather than accepted automatically. Stored as string/parsed with parseFloat, consistent with how this app already handles decimal thresholds. Reused as-is for document classification confidence (Finance Document Intake) rather than adding a second, separately-tunable threshold — one review bar for every Claude-advisory decision in this app.',
})

// Finance Document Intake (true document-to-transaction processing) —
// attachment validation limits, enforced by BCClaudeClient before any
// outbound call is made so an oversized/unsupported file never reaches the
// network.

export const claudeMaxAttachmentSize = Property({
    $id: Now.ID['prop-claude-max-attachment-size'],
    name: 'x_695068_bcfa.claude.max_attachment_size_bytes',
    type: 'integer',
    value: '10485760',
    description: 'Maximum accepted attachment size in bytes (default 10MB) for Finance Document Intake processing. Checked against sys_attachment.size_bytes before the attachment is read or sent to Claude.',
})

export const claudeAllowedAttachmentTypes = Property({
    $id: Now.ID['prop-claude-allowed-attachment-types'],
    name: 'x_695068_bcfa.claude.allowed_attachment_types',
    type: 'string',
    value: 'application/pdf,image/png,image/jpeg',
    description: 'Comma-separated list of sys_attachment.content_type values accepted for Finance Document Intake processing. Checked before the attachment is read or sent to Claude.',
})
