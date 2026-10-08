import { BusinessRule } from '@servicenow/sdk/core'

// Readable advisory AI notes: whichever writer saves an AI note (agents, Now
// Assist skills, the AI simulation), it is laid out the same way before it is
// stored: section headings on their own line, bullets, record numbers instead
// of ids, the draft message set apart (FinanceTextFormat.aiNote). Presentation
// only: the wording is unchanged, and the section parsers
// (AiInteractionLog.recommendationOf, ExceptionEngine.splitAdvice) read the
// formatted note the same way.

const FORMAT_EXCEPTION_NOTES = `(function executeRule(current, previous) {
    var fmt = new FinanceTextFormat();
    ['ai_recommendation', 'ai_explanation'].forEach(function(field) {
        if (!current.isValidField(field) || !current[field].changes() || !current.getValue(field)) return;
        var max = current[field].getED().getLength() || 4000;
        var text = fmt.aiNote(current.getValue(field));
        if (text !== current.getValue(field)) current.setValue(field, text.length > max ? text.substring(0, max - 1) + '…' : text);
    });
})(current, previous);`

const FORMAT_RECOMMENDATION = `(function executeRule(current, previous) {
    var fmt = new FinanceTextFormat();
    ['ai_recommendation'].forEach(function(field) {
        if (!current.isValidField(field) || !current[field].changes() || !current.getValue(field)) return;
        var max = current[field].getED().getLength() || 4000;
        var text = fmt.aiNote(current.getValue(field));
        if (text !== current.getValue(field)) current.setValue(field, text.length > max ? text.substring(0, max - 1) + '…' : text);
    });
})(current, previous);`

export const apExceptionFormatAiNote = BusinessRule({
    $id: Now.ID['br-ap-exception-format-ai-note'],
    name: 'AP Exception - Format AI Note',
    table: 'x_695068_bcfa_ap_exception',
    when: 'before',
    action: ['insert', 'update'],
    order: 50,
    active: true,
    description: 'Lays out the advisory AI recommendation and explanation for reading (FinanceTextFormat.aiNote). Presentation only.',
    script: FORMAT_EXCEPTION_NOTES,
})

export const arExceptionFormatAiNote = BusinessRule({
    $id: Now.ID['br-ar-exception-format-ai-note'],
    name: 'AR Exception - Format AI Note',
    table: 'x_695068_bcfa_ar_exception',
    when: 'before',
    action: ['insert', 'update'],
    order: 50,
    active: true,
    description: 'Lays out the advisory AI recommendation and explanation for reading (FinanceTextFormat.aiNote). Presentation only.',
    script: FORMAT_EXCEPTION_NOTES,
})

export const paymentFormatAiNote = BusinessRule({
    $id: Now.ID['br-payment-format-ai-note'],
    name: 'Payment - Format AI Match Explanation',
    table: 'x_695068_bcfa_payment',
    when: 'before',
    action: ['insert', 'update'],
    order: 50,
    active: true,
    description: 'Lays out the advisory AI match explanation for reading (FinanceTextFormat.aiNote). Presentation only.',
    script: FORMAT_RECOMMENDATION,
})

export const deductionFormatAiNote = BusinessRule({
    $id: Now.ID['br-deduction-format-ai-note'],
    name: 'Deduction - Format AI Recommendation',
    table: 'x_695068_bcfa_deduction',
    when: 'before',
    action: ['insert', 'update'],
    order: 50,
    active: true,
    description: 'Lays out the advisory AI recommendation copied from the exception for reading (FinanceTextFormat.aiNote). Presentation only.',
    script: FORMAT_RECOMMENDATION,
})
