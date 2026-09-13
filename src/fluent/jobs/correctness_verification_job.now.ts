import { ScheduledScript } from '@servicenow/sdk/core'

// Same rationale as demo_data_seed_job.now.ts: atf_test_run is unavailable
// in this PDI ("this instance may not have the Automated Test Framework
// REST API plugin active" — confirmed non-transient after a retry), so the
// three ATF Test() definitions in src/fluent/tests/core_correctness.now.ts
// exist as documentation/future-manual-run assets, and this job is what
// actually executes and proves the same three checks now. Logs one
// single-line JSON summary via gs.info prefixed 'BCFA-TEST:' for retrieval
// via the syslog table.
export const correctnessVerificationJob = ScheduledScript({
    $id: Now.ID['job-correctness-verification'],
    name: 'BCFA - One-Time Correctness Verification',
    frequency: 'once',
    executionStart: '2026-09-13 05:07:00',
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
            var intake = apService.intakeInvoice({ invoiceNumber: 'SOD-TEST-' + gs.generateGUID(), currency: 'INR', grossAmount: 100, netAmount: 100, taxAmount: 0 });
            var approvalEngine = new ApprovalEngine();
            var sameUser = gs.getUserID();
            var approvalSysId = approvalEngine.requestApInvoiceApproval(intake.apInvoiceSysId, sameUser);
            var decision = approvalEngine.decideApInvoiceApproval(approvalSysId, 'approved', sameUser, 'attempting self-approval');
            results.segregationOfDuties = { pass: !!decision.error, decision: decision };
        } catch (e2) {
            results.segregationOfDuties = { pass: false, error: e2.toString() };
        }

        try {
            var apService2 = new ApDomainService();
            var intake2 = apService2.intakeInvoice({ invoiceNumber: 'UOC-TEST-' + gs.generateGUID(), currency: 'INR', grossAmount: 100, netAmount: 100, taxAmount: 0 });
            var invoice2 = new GlideRecord('x_695068_bcfa_ap_invoice');
            invoice2.get(intake2.apInvoiceSysId);
            invoice2.setValue('approval_state', 'approved');
            invoice2.setValue('state', 'APPROVED');
            invoice2.update();
            var timeoutResult = apService2.postInvoice(intake2.apInvoiceSysId, 'timeout');
            var afterTimeout = new GlideRecord('x_695068_bcfa_ap_invoice');
            afterTimeout.get(intake2.apInvoiceSysId);
            var stateAfterTimeout = afterTimeout.getValue('state');
            var reconciliation = apService2.reconcilePosting(intake2.apInvoiceSysId, timeoutResult.transactionSysId);
            results.unknownOutcomeControl = {
                pass: (timeoutResult.unknownOutcome === true && stateAfterTimeout === 'UNKNOWN_OUTCOME'),
                timeoutResult: timeoutResult, stateAfterTimeout: stateAfterTimeout, reconciliation: reconciliation
            };
        } catch (e3) {
            results.unknownOutcomeControl = { pass: false, error: e3.toString() };
        }

        gs.info('BCFA-TEST: ' + JSON.stringify(results));
    `,
})
