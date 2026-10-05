import { ScheduledScript } from '@servicenow/sdk/core'

// Phase 40: native document extraction runs asynchronously in Document
// Intelligence. An intake waits in 'extracting' while its task runs; this
// job continues each such intake once its task has finished (or reports a
// task that never finishes, after NativeDocumentIntelligenceProvider's
// timeout). It only calls the intake service's own entry point.
export const nativeExtractionPollerJob = ScheduledScript({
    $id: Now.ID['job-native-extraction-poller'],
    name: 'BCFA - Native Extraction Poller',
    frequency: 'periodically',
    executionInterval: Duration({ minutes: 1 }),
    executionStart: '2026-10-05 00:00:00',
    active: true,
    script: `
        var intake = new GlideRecord('x_695068_bcfa_finance_intake');
        intake.addQuery('processing_status', 'extracting');
        intake.addQuery('extraction_provider', 'native');
        intake.addNotNullQuery('extraction_task');
        intake.setLimit(20);
        intake.query();
        var svc = new FinanceDocumentIntakeService(), resumed = 0, waiting = 0;
        while (intake.next()) {
            var task = new GlideRecord('sys_di_task');
            var done = task.get(intake.getValue('extraction_task')) && (task.getValue('is_processed') === '1' || task.getValue('is_processed') === 'true');
            var age = (new GlideDateTime().getNumericValue() - new GlideDateTime(intake.getValue('sys_updated_on')).getNumericValue()) / 60000;
            if (done || age > NativeDocumentIntelligenceProvider.TIMEOUT_MINUTES) {
                svc.processDocument(intake.getUniqueValue());
                resumed++;
            } else {
                waiting++;
            }
        }
        if (resumed || waiting) gs.info('BCFA native extraction poller: resumed ' + resumed + ', still running ' + waiting);
    `,
})
