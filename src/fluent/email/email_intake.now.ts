import { InboundEmailAction } from '@servicenow/sdk/core'

// Phase 40: documents by email. An inbound email (new or forwarded) whose
// subject contains BCFA becomes one Finance Document Intake per PDF / PNG /
// JPEG attachment (FinanceDocumentIntakeService.intakeFromEmail), queued and
// then processed like an upload by the BCFA - Native Extraction Poller job
// (senders who are not users are handled as guest, and Document Intelligence
// does not run for guest). Subject keywords: ADVICE ->
// AR Payment Advice, REMITTANCE -> AR Remittance, otherwise AP Invoice.
// No sender restriction (instance owner's decision, 2026-10-06); the sender
// is on the audit trail. Stops further inbound actions for these emails only.

const script = `
(function runAction(current, event, email, logger, classifier) {
    var emailSysId = event.instance || (typeof sys_email !== 'undefined' ? sys_email.getUniqueValue() : '');
    var r = new FinanceDocumentIntakeService().intakeFromEmail(emailSysId, email.subject, email.from, email.headers);
    if (!r.documents) {
        logger.warn('BCFA email intake: no PDF, PNG or JPEG attachment in "' + email.subject + '"; nothing created.');
    } else {
        logger.info('BCFA email intake: ' + r.documents + ' document(s) as ' + r.type + ', queued for the poller: ' + JSON.stringify(r.results));
    }
})(current, event, email, logger, classifier);
`

InboundEmailAction({
    $id: Now.ID['inbound-email-bcfa-intake-new'],
    name: 'BCFA - Email Document Intake',
    description: 'New email whose subject contains BCFA: one Finance Document Intake per PDF / PNG / JPEG attachment, processed like an upload (native extraction, duplicate checks, AP / AR pipeline). Subject ADVICE -> AR Payment Advice, REMITTANCE -> AR Remittance, otherwise AP Invoice.',
    table: 'x_695068_bcfa_finance_intake',
    type: 'new',
    action: 'record_action',
    active: true,
    order: 10,
    filterCondition: 'subjectLIKEBCFA^EQ',
    stopProcessing: true,
    script: script,
})

InboundEmailAction({
    $id: Now.ID['inbound-email-bcfa-intake-forward'],
    name: 'BCFA - Email Document Intake (forwarded)',
    description: 'Forwarded email whose subject contains BCFA: same as BCFA - Email Document Intake.',
    table: 'x_695068_bcfa_finance_intake',
    type: 'forward',
    action: 'record_action',
    active: true,
    order: 10,
    filterCondition: 'subjectLIKEBCFA^EQ',
    stopProcessing: true,
    script: script,
})
