import { Test } from '@servicenow/sdk/core'

// Stage 11/18 correctness tests, run via atf_test_run. Kept as
// runServerSideScript + assertEqual since these test Script Includes with no
// UI (see the ATF guide: "Do NOT try to exercise a Script Include through
// atf.form/atf.catalog").

Test(
    { $id: Now.ID['test-idempotency'], name: 'Idempotency — duplicate financial write produces one transaction', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-idempotency-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var svc = new IntegrationService();
                    var key = 'IDEMPOTENCY-TEST-' + gs.generateGUID();
                    var payload = { invoiceNumber: 'IDEMTEST', vendor: '', amount: 100 };
                    var r1 = svc.execute({ operation: 'postVendorInvoice', adapter: 'mock_sap', idempotencyKey: key, payload: payload });
                    var r2 = svc.execute({ operation: 'postVendorInvoice', adapter: 'mock_sap', idempotencyKey: key, payload: payload });

                    var count = new GlideAggregate('x_695068_bcfa_integration_txn');
                    count.addQuery('idempotency_key', key);
                    count.addQuery('status', 'success');
                    count.addAggregate('COUNT');
                    count.query();
                    var total = 0;
                    if (count.next()) total = parseInt(count.getAggregate('COUNT'), 10);

                    assertEqual({ name: 'exactly one successful transaction for a reused idempotency key', shouldbe: 1, value: total });
                    assertEqual({ name: 'second call is served from cache, not re-executed', shouldbe: true, value: r2.idempotentReplay === true });
                    stepResult.setOutputMessage('Idempotency test: ' + total + ' successful transaction(s) for key ' + key + '; replay=' + r2.idempotentReplay);
                    outputs.transaction_count = total;
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-sod-self-approval'], name: 'Segregation of Duties — service layer rejects self-approval', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-sod-self-approval-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    var apService = new ApDomainService();
                    var intake = apService.intakeInvoice({ invoiceNumber: 'SOD-TEST-' + gs.generateGUID(), currency: 'INR', grossAmount: 100, netAmount: 100, taxAmount: 0 });
                    var approvalEngine = new ApprovalEngine();
                    var sameUser = gs.getUserID();
                    var approvalSysId = approvalEngine.requestApInvoiceApproval(intake.apInvoiceSysId, sameUser);
                    var decision = approvalEngine.decideApInvoiceApproval(approvalSysId, 'approved', sameUser, 'attempting self-approval');

                    assertEqual({ name: 'self-approval is rejected by the service layer', shouldbe: true, value: !!decision.error });
                    stepResult.setOutputMessage('SoD self-approval test result: ' + JSON.stringify(decision));
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)

Test(
    { $id: Now.ID['test-unknown-outcome-control'], name: 'Unknown Outcome Control — timeout resolves without blind retry', active: true },
    (atf) => {
        atf.server.runServerSideScript({
            $id: Now.ID['test-unknown-outcome-control-step'],
            script: `
                (function(outputs, steps, params, stepResult, assertEqual) {
                    // Tested directly against IntegrationService (where
                    // Section 11 is actually implemented) rather than
                    // through ApDomainService.postInvoice, so this test
                    // can't be confused by the auto-post Business Rule
                    // cascade that a real approval triggers.
                    var svc = new IntegrationService();
                    var key = 'UOC-TEST-' + gs.generateGUID();
                    var timeoutResult = svc.execute({
                        operation: 'postVendorInvoice', adapter: 'mock_sap', idempotencyKey: key,
                        payload: { invoiceNumber: 'UOC-TEST', amount: 100 }, simulateOutcome: 'timeout'
                    });
                    assertEqual({ name: 'a timed-out call is reported as unknown outcome, not silently retried', shouldbe: true, value: timeoutResult.unknownOutcome === true });
                    assertEqual({ name: 'a timed-out call does not return a response payload', shouldbe: null, value: timeoutResult.response });

                    var reconciliation = svc.reconcileUnknownOutcome(timeoutResult.transactionSysId);
                    assertEqual({ name: 'reconciliation resolves to POSTED or RETRY, never a silent success assumption', shouldbe: true, value: (reconciliation.resolution === 'POSTED' || reconciliation.resolution === 'RETRY') });
                    stepResult.setOutputMessage('Unknown Outcome Control test: timeout=' + timeoutResult.unknownOutcome + ', reconciliation=' + JSON.stringify(reconciliation));
                })(outputs, steps, params, stepResult, assertEqual);
            `,
        })
    }
)
