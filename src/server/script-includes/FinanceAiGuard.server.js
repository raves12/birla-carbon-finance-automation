// BCFA's own AI guardrails (Phase 21), in front of and behind every Now
// Assist skill call. Native ServiceNow script only; no external moderation
// service. Now Assist Guardian (prompt injection, offensiveness) runs on the
// BCFA skill capabilities as well; this is defence in depth for the things
// Guardian does not know about the finance process:
//
//  - screenInput: the context sent to a skill contains text from documents,
//    remittances and exception notes. Text that tries to instruct the model
//    (ignore previous instructions, reveal the prompt, approve / post / clear
//    this, override a control...) stops the call: nothing is sent.
//  - sanitizeOutput: skills must return plain text and must never describe
//    a financial action as done. Markdown is removed, and a sentence that
//    says an invoice or payment is approved, posted, cleared, paid, settled,
//    applied or written off is removed unless the record really is in a
//    posted / cleared state; a note says what was removed.
var FinanceAiGuard = Class.create();

FinanceAiGuard.INJECTION_PATTERNS = [
    { id: 'override_instructions', re: /\b(ignore|disregard|forget|override)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|your|the system)\b[^.\n]{0,20}\b(instructions?|prompts?|rules|guidelines|directions)\b/i },
    { id: 'reveal_prompt', re: /\b(reveal|show|print|repeat|output|display)\b[^.\n]{0,20}\b(your|the)\b[^.\n]{0,15}\b(system prompt|prompt|instructions)\b/i },
    { id: 'role_change', re: /\b(you are now|from now on you|act as|pretend to be|roleplay as)\b/i },
    // At the start of a line, or after a field label ("Notes: system: ...",
    // found by the Phase 29 ATF test): document text reaches the context
    // behind a label.
    { id: 'role_marker', re: /(^|\n|:)\s*(system|assistant|developer)\s*:\s/i },
    { id: 'financial_instruction', re: /\b(approve|post|clear|release|pay|write off|settle)\b[^.\n]{0,25}\b(this|the)\b[^.\n]{0,15}\b(invoice|payment|exception|allocation)\b[^.\n]{0,25}\b(now|immediately|automatically|without (approval|review))\b/i },
    // "override" is left out: a person's decision may legitimately mention a
    // tolerance override, and that text is part of the context.
    { id: 'control_bypass', re: /\b(bypass|skip|disable|circumvent)\b[^.\n]{0,20}\b(tolerance|approval|control|segregation|guardrail|policy|check)s?\b/i },
    { id: 'jailbreak', re: /\b(jailbreak|DAN mode|developer mode|do anything now)\b/i }
];

// Sentences stating a financial action as completed. Approval is true from
// the APPROVED state on; posting / clearing / payment only once the record
// is posted or cleared (the record state is in the skill context).
FinanceAiGuard.APPROVED_CLAIM = /\b((has|have|had) been |(is|are|was|were) (now |already )?)approved\b/i;
FinanceAiGuard.DONE_CLAIM = /\b((has|have|had) been |(is|are|was|were) (now )?(fully |already )?)(posted|cleared|paid|settled|applied|written off|released|reconciled)\b|\bfully (settled|paid|cleared)\b/i;
FinanceAiGuard.APPROVED_STATE = /\b(Invoice State|Payment State):\s*(APPROVED|POSTING|POSTED|CLEARING|CLEARED|RECONCILED|CLOSED)\b|Approval State:\s*approved\b/i;
FinanceAiGuard.DONE_STATE = /\b(Invoice State|Payment State):\s*(POSTED|CLEARED|RECONCILED|CLOSED)\b/;

FinanceAiGuard.prototype = {
    initialize: function() {},

    // Returns { ok: true } or { ok: false, findings: [ids], reason }.
    screenInput: function(text) {
        text = String(text || '');
        var findings = [];
        for (var i = 0; i < FinanceAiGuard.INJECTION_PATTERNS.length; i++) {
            var p = FinanceAiGuard.INJECTION_PATTERNS[i];
            if (p.re.test(text)) findings.push(p.id);
        }
        if (!findings.length) return { ok: true, findings: [] };
        return { ok: false, findings: findings,
            reason: 'Possible prompt injection in the record data (' + findings.join(', ') + '); the AI call was not made. A person should review the source document.' };
    },

    // Returns { text, actions: [..] } — actions empty when nothing changed.
    sanitizeOutput: function(text, context) {
        var actions = [];
        var original = String(text || '');
        var out = original
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/(^|\n)\s{0,3}#{1,6}\s+/g, '$1')
            .replace(/`+/g, '')
            .replace(/(^|\n)(\s*)\*\s+/g, '$1$2- ');
        if (out !== original) actions.push('markdown removed');

        context = String(context || '');
        var approvedTrue = FinanceAiGuard.APPROVED_STATE.test(context);
        if (!FinanceAiGuard.DONE_STATE.test(context)) {
            var removed = 0;
            out = out.split('\n').map(function(line) {
                // Split into sentences, keep the line's own leading marker.
                var parts = line.match(/[^.!?]+[.!?]*\s*/g);
                if (!parts) return line;
                var kept = parts.filter(function(sentence) {
                    var falseClaim = FinanceAiGuard.DONE_CLAIM.test(sentence) || (!approvedTrue && FinanceAiGuard.APPROVED_CLAIM.test(sentence));
                    if (falseClaim) { removed++; return false; }
                    return true;
                });
                return kept.join('').replace(/\s+$/, '');
            }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
            if (removed) {
                actions.push(removed + ' completed-action statement(s) removed');
                out = (out ? out + '\n\n' : '') + '[Guardrail: removed ' + removed + ' statement(s) describing a financial action as completed. Nothing has been approved, posted or cleared by AI; a person decides.]';
            }
        }
        return { text: out, actions: actions };
    },

    type: 'FinanceAiGuard'
};
