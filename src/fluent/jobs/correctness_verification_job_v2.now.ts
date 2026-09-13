import { ScheduledScript } from '@servicenow/sdk/core'

// Re-run with the corrected Unknown Outcome Control check (tests
// IntegrationService directly rather than through the invoice-approval
// cascade — see the fix note in src/fluent/tests/core_correctness.now.ts).
export const correctnessVerificationJobV2 = ScheduledScript({
    $id: Now.ID['job-correctness-verification-v2'],
    name: 'BCFA - One-Time Correctness Verification (v2, post-fix)',
    frequency: 'once',
    executionStart: '2026-09-13 06:13:00',
    timeZone: 'UTC',
    active: true,
    script: `
        var results = {};

        try {
            var svc = new IntegrationService();
            var key = 'IDEMPOTENCY-TEST-' + gs.generateGUID();
            var payload = { invoiceNumber: 'IDEMTEST', vendor: '', amount: 100 };
            svc.execute({ operation: 'postVendorInvoice', adapter: 'mock_sap', idempotencyKey: key, payload: payload });
            var r2 = svc.execute({ operation: 'postVendorInvoice', adapter: 'mock_sap', idempotencyKey: key, payload: payload });
            var count = new GlideAggregate('x_695068_bcfa_integration_txn');
            count.addQuery('idempotency_key', key);
            count.addQuery('status', 'success');
            count.addAggregate('COUNT');
            count.query();
            var total = count.next() ? parseInt(count.getAggregate('COUNT'), 10) : 0;
            results.idempotency = { pass: (total === 1 && r2.idempotentReplay === true), transactionCount: total, replay: r2.idempotentReplay };
        } catch (e) {
            results.idempotency = { pass: false, error: e.toString() };
        }

        try {
            var apService = new ApDomainService();
            var intake = apService.intakeInvoice({ invoiceNumber: 'SOD-TEST-V2-' + gs.generateGUID(), currency: 'INR', grossAmount: 100, netAmount: 100, taxAmount: 0 });
            var approvalEngine = new ApprovalEngine();
            var sameUser = gs.getUserID();
            var approvalSysId = approvalEngine.requestApInvoiceApproval(intake.apInvoiceSysId, sameUser);
            var decision = approvalEngine.decideApInvoiceApproval(approvalSysId, 'approved', sameUser, 'attempting self-approval');
            results.segregationOfDuties = { pass: !!decision.error, decision: decision };
        } catch (e2) {
            results.segregationOfDuties = { pass: false, error: e2.toString() };
        }

        try {
            var svc3 = new IntegrationService();
            var key3 = 'UOC-TEST-V2-' + gs.generateGUID();
            var timeoutResult = svc3.execute({
                operation: 'postVendorInvoice', adapter: 'mock_sap', idempotencyKey: key3,
                payload: { invoiceNumber: 'UOC-TEST-V2', amount: 100 }, simulateOutcome: 'timeout'
            });
            var reconciliation = svc3.reconcileUnknownOutcome(timeoutResult.transactionSysId);
            results.unknownOutcomeControl = {
                pass: (timeoutResult.unknownOutcome === true && (reconciliation.resolution === 'POSTED' || reconciliation.resolution === 'RETRY')),
                timeoutResult: timeoutResult, reconciliation: reconciliation
            };
        } catch (e3) {
            results.unknownOutcomeControl = { pass: false, error: e3.toString() };
        }

        // Also verify the decideApproval ordering fix directly: a freshly
        // approved happy-path invoice should reach CLOSED, not get stuck at
        // APPROVED (the bug this job exists to catch).
        try {
            var apService2 = new ApDomainService();
            var vendor = new GlideRecord('x_695068_bcfa_vendor');
            vendor.get('vendor_code', 'V001');
            var intake2 = apService2.intakeInvoice({ invoiceNumber: 'ORDERING-FIX-TEST-' + gs.generateGUID(), vendor: vendor.getUniqueValue(), currency: 'INR', grossAmount: 100, netAmount: 100, taxAmount: 0 });
            apService2.runExtraction(intake2.apInvoiceSysId, {});
            apService2.validateInvoice(intake2.apInvoiceSysId);
            var approvalReq = apService2.requestApproval(intake2.apInvoiceSysId, gs.getUserID());
            var otherUser = new GlideRecord('sys_user');
            otherUser.addQuery('sys_id', '!=', gs.getUserID());
            otherUser.addQuery('active', true);
            otherUser.setLimit(1);
            otherUser.query();
            var approverId = otherUser.next() ? otherUser.getUniqueValue() : gs.getUserID();
            apService2.decideApproval(intake2.apInvoiceSysId, approvalReq.approvalSysId, 'approved', approverId, 'ordering fix verification');
            var finalInvoice = new GlideRecord('x_695068_bcfa_ap_invoice');
            finalInvoice.get(intake2.apInvoiceSysId);
            results.approvalCascadeOrderingFix = { pass: finalInvoice.getValue('state') === 'CLOSED', finalState: finalInvoice.getValue('state'), postingState: finalInvoice.getValue('posting_state') };
        } catch (e4) {
            results.approvalCascadeOrderingFix = { pass: false, error: e4.toString() };
        }

        gs.info('BCFA-TEST-V2: ' + JSON.stringify(results));
    `,
})
