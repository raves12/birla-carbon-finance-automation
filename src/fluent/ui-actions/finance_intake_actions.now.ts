import { UiAction, Record } from '@servicenow/sdk/core'

// UI Actions backing true document-to-transaction processing end to end —
// "No Scripts - Background should be needed in the final demo" (Phase 12).
// Every script here calls straight into FinanceDocumentIntakeService or the
// existing ApDomainService; none of it duplicates their logic.

export const intakeProcessDocument = UiAction({
    $id: Now.ID['ui-action-intake-process-with-claude'],
    table: 'x_695068_bcfa_finance_intake',
    name: 'Process Document',
    actionName: 'process_document_intake',
    hint: 'Processes the attached document: uses the document type set at upload, reads the fields (simulated extraction until Document Intelligence extraction is licensed), then creates the AP Invoice or Payment/Remittance and runs the deterministic pipeline.',
    showUpdate: true,
    condition: "current.processing_status == 'new'",
    form: {
        showButton: true,
        style: 'primary-ai',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var service = new FinanceDocumentIntakeService();
        var result = service.processDocument(current.getUniqueValue());
        if (result && result.pending) {
            gs.addInfoMessage('Native extraction is running (ServiceNow Document Intelligence). The document continues automatically when it finishes, usually within a minute; refresh to see the result.');
        }
        action.setRedirectURL(current);
    `,
})

const intakeProcessDocumentFormAction = Record({
    $id: Now.ID['ui-action-intake-process-with-claude-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_finance_intake',
        ui_action: intakeProcessDocument,
        action_type: 'ui_action',
        active: true,
        name: 'Process Document',
    },
})

Record({
    $id: Now.ID['ui-action-intake-process-with-claude-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_finance_intake',
        name: 'Process Document',
        label: 'Process Document',
        color: 'primary-ai',
        overflow: false,
        order: 100,
        active: true,
        item_type: 'action',
        action: intakeProcessDocumentFormAction,
    },
})

export const intakeReprocess = UiAction({
    $id: Now.ID['ui-action-intake-reprocess'],
    table: 'x_695068_bcfa_finance_intake',
    name: 'Reprocess',
    actionName: 'reprocess_intake',
    hint: 'Resumes processing from wherever this intake record left off — safe to click again after a failure or after correcting document_type at Review Required.',
    showUpdate: true,
    condition: "current.processing_status == 'failed' || current.processing_status == 'review_required'",
    form: {
        showButton: true,
        style: 'primary',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var service = new FinanceDocumentIntakeService();
        var result = service.processDocument(current.getUniqueValue());
        if (result && result.pending) {
            gs.addInfoMessage('Native extraction is running (ServiceNow Document Intelligence). The document continues automatically when it finishes, usually within a minute; refresh to see the result.');
        }
        action.setRedirectURL(current);
    `,
})

const intakeReprocessFormAction = Record({
    $id: Now.ID['ui-action-intake-reprocess-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_finance_intake',
        ui_action: intakeReprocess,
        action_type: 'ui_action',
        active: true,
        name: 'Reprocess',
    },
})

Record({
    $id: Now.ID['ui-action-intake-reprocess-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_finance_intake',
        name: 'Reprocess',
        label: 'Reprocess',
        color: 'primary',
        overflow: false,
        order: 110,
        active: true,
        item_type: 'action',
        action: intakeReprocessFormAction,
    },
})

export const intakeSendToManualReview = UiAction({
    $id: Now.ID['ui-action-intake-send-to-manual-review'],
    table: 'x_695068_bcfa_finance_intake',
    name: 'Send to Manual Review',
    actionName: 'send_to_manual_review_intake',
    hint: 'Stops automated processing and routes this intake record to a human reviewer.',
    showUpdate: true,
    condition: "current.processing_status != 'completed' && current.processing_status != 'review_required'",
    form: {
        showButton: true,
        style: 'unstyled',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var service = new FinanceDocumentIntakeService();
        service.sendToManualReview(current.getUniqueValue(), 'Manually sent to review from the intake record.');
        action.setRedirectURL(current);
    `,
})

const intakeSendToManualReviewFormAction = Record({
    $id: Now.ID['ui-action-intake-send-to-manual-review-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_finance_intake',
        ui_action: intakeSendToManualReview,
        action_type: 'ui_action',
        active: true,
        name: 'Send to Manual Review',
    },
})

Record({
    $id: Now.ID['ui-action-intake-send-to-manual-review-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_finance_intake',
        name: 'Send to Manual Review',
        label: 'Send to Manual Review',
        color: 'secondary',
        overflow: true,
        order: 120,
        active: true,
        item_type: 'action',
        action: intakeSendToManualReviewFormAction,
    },
})

// ---- AP Exception user actions (Phase 6) -----------------------------------
// Exposes existing ApDomainService resolution behavior — nothing here is new
// logic, only new entry points into it.

export const apInvoiceRerunValidation = UiAction({
    $id: Now.ID['ui-action-ap-invoice-rerun-validation'],
    table: 'x_695068_bcfa_ap_invoice',
    name: 'Re-run Validation',
    actionName: 're_run_validation_ap_invoice',
    hint: 'Re-runs the existing deterministic validation step (confidence, mandatory fields, vendor, PO) against this invoice.',
    showUpdate: true,
    condition: "current.approval_state != 'approved'",
    form: {
        showButton: true,
        style: 'unstyled',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var service = new ApDomainService();
        service.validateInvoice(current.getUniqueValue());
        action.setRedirectURL(current);
    `,
})

const apInvoiceRerunValidationFormAction = Record({
    $id: Now.ID['ui-action-ap-invoice-rerun-validation-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_ap_invoice',
        ui_action: apInvoiceRerunValidation,
        action_type: 'ui_action',
        active: true,
        name: 'Re-run Validation',
    },
})

Record({
    $id: Now.ID['ui-action-ap-invoice-rerun-validation-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_invoice',
        name: 'Re-run Validation',
        label: 'Re-run Validation',
        color: 'secondary',
        overflow: true,
        order: 200,
        active: true,
        item_type: 'action',
        action: apInvoiceRerunValidationFormAction,
    },
})

export const apInvoiceRerunMatch = UiAction({
    $id: Now.ID['ui-action-ap-invoice-rerun-match'],
    table: 'x_695068_bcfa_ap_invoice',
    name: 'Re-run Match',
    actionName: 're_run_match_ap_invoice',
    hint: 'Re-runs the existing deterministic duplicate-detection and 3-way match step against this invoice.',
    showUpdate: true,
    condition: "current.approval_state != 'approved'",
    form: {
        showButton: true,
        style: 'unstyled',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var service = new ApDomainService();
        service.matchInvoice(current.getUniqueValue());
        action.setRedirectURL(current);
    `,
})

const apInvoiceRerunMatchFormAction = Record({
    $id: Now.ID['ui-action-ap-invoice-rerun-match-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_ap_invoice',
        ui_action: apInvoiceRerunMatch,
        action_type: 'ui_action',
        active: true,
        name: 'Re-run Match',
    },
})

Record({
    $id: Now.ID['ui-action-ap-invoice-rerun-match-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_invoice',
        name: 'Re-run Match',
        label: 'Re-run Match',
        color: 'secondary',
        overflow: true,
        order: 210,
        active: true,
        item_type: 'action',
        action: apInvoiceRerunMatchFormAction,
    },
})

export const apExceptionResolveAndRetry = UiAction({
    $id: Now.ID['ui-action-ap-exception-resolve-and-retry'],
    table: 'x_695068_bcfa_ap_exception',
    name: 'Resolve & Retry',
    actionName: 'resolve_and_retry_ap_exception',
    hint: 'Resolves this exception using the notes below, then re-runs the existing deterministic validation step on the linked AP Invoice.',
    showUpdate: true,
    condition: "current.status == 'open' || current.status == 'in_review'",
    form: {
        showButton: true,
        style: 'primary',
    },
    workspace: {
        isConfigurableWorkspace: true,
        showFormButtonV2: true,
    },
    script: `
        var service = new ApDomainService();
        service.resolveExceptionAndRetry(current.ap_invoice.toString(), current.getUniqueValue(), current.resolution_notes.toString(), gs.getUserID());
        action.setRedirectURL(current);
    `,
})

const apExceptionResolveAndRetryFormAction = Record({
    $id: Now.ID['ui-action-ap-exception-resolve-and-retry-form-action'],
    table: 'sys_ux_form_action',
    data: {
        table: 'x_695068_bcfa_ap_exception',
        ui_action: apExceptionResolveAndRetry,
        action_type: 'ui_action',
        active: true,
        name: 'Resolve & Retry',
    },
})

Record({
    $id: Now.ID['ui-action-ap-exception-resolve-and-retry-layout-item'],
    table: 'sys_ux_form_action_layout_item',
    data: {
        table: 'x_695068_bcfa_ap_exception',
        name: 'Resolve & Retry',
        label: 'Resolve & Retry',
        color: 'primary',
        overflow: false,
        order: 90,
        active: true,
        item_type: 'action',
        action: apExceptionResolveAndRetryFormAction,
    },
})
