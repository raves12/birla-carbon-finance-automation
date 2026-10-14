import {
    Table,
    StringColumn,
    ChoiceColumn,
    BooleanColumn,
    IntegerColumn,
    DecimalColumn,
    DateColumn,
    DateTimeColumn,
    JsonColumn,
    ReferenceColumn,
} from '@servicenow/sdk/core'

// AP domain tables. `state` is a plain StringColumn managed by the AP Invoice
// StateModel (Stage 5) rather than a dictionary choice list, since the state
// model owns the canonical state values, labels and gated transitions.

export const x_695068_bcfa_ap_invoice = Table({
    name: 'x_695068_bcfa_ap_invoice',
    label: 'AP Invoice',
    display: 'invoice_number',
    audit: true,
    // Record numbers AP00000001, AP00000002, ... (10 characters). The
    // vendor's own number stays in invoice_number (the display value).
    autoNumber: {
        prefix: 'AP',
        number: 1,
        numberOfDigits: 8,
    },
    schema: {
        number: StringColumn({ label: 'Number', maxLength: 40, readOnly: true, default: 'javascript:global.getNextObjNumberPadded();' }),
        invoice_number: StringColumn({ label: 'Invoice Number', mandatory: true, maxLength: 40 }),
        vendor: ReferenceColumn({ label: 'Vendor', referenceTable: 'x_695068_bcfa_vendor' }),
        company_code: StringColumn({ label: 'Company Code', maxLength: 10 }),
        currency: StringColumn({ label: 'Currency', maxLength: 3 }),
        invoice_date: DateColumn({ label: 'Invoice Date' }),
        posting_date: DateColumn({ label: 'Posting Date' }),
        purchase_order: ReferenceColumn({ label: 'Purchase Order', referenceTable: 'x_695068_bcfa_purchase_order' }),
        // Vendor and PO as printed on the document. The invoice is created from
        // a good read even when they do not resolve to master data; validation
        // resolves them (again on Re-run Validation) or raises the exception.
        printed_vendor_name: StringColumn({ label: 'Vendor (Printed)', maxLength: 255, readOnly: true, hint: 'Supplier name as printed on the document (extraction).' }),
        printed_vendor_code: StringColumn({ label: 'Vendor Code (Printed)', maxLength: 40, readOnly: true, hint: 'Supplier code / tax ID used as vendor code, as printed (extraction).' }),
        printed_po_number: StringColumn({ label: 'PO Number (Printed)', maxLength: 40, readOnly: true, hint: 'Purchase order number as printed on the document (extraction).' }),
        sales_order_reference: StringColumn({
            label: 'Sales Order Reference',
            maxLength: 40,
            hint: 'Kept generic pending clarification of what "SO" means in AP invoice processing (workbook D-08 — open item)',
        }),
        gross_amount: DecimalColumn({ label: 'Gross Amount', scale: 2 }),
        tax_amount: DecimalColumn({ label: 'Tax Amount', scale: 2 }),
        net_amount: DecimalColumn({ label: 'Net Amount', scale: 2 }),
        // Phase 41: charges printed as their own lines (freight, shipping /
        // handling, surcharge, other) and discount, so the totals reconcile
        // (gross = net + tax + charges - discount). Separate from the
        // extraction confidence.
        charges_amount: DecimalColumn({ label: 'Charges (Freight, Shipping, Other)', scale: 2, hint: 'Freight, shipping/handling, surcharges and other charges printed as their own lines on the invoice.' }),
        discount_amount: DecimalColumn({ label: 'Discount', scale: 2 }),
        amount_reconciliation: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Totals Reconciliation',
            readOnly: true,
            choices: { reconciled: 'Reconciled', not_reconciled: 'Not Reconciled', incomplete: 'Incomplete' },
            hint: 'Deterministic check of the printed totals (net + tax + charges - discount = gross). Independent of the extraction confidence.',
        }),
        amount_reconciliation_detail: StringColumn({ label: 'Totals Reconciliation Detail', maxLength: 1000, readOnly: true }),
        // Phase 41, defect 7: what the document said, in readable sections
        // (FinanceTextFormat.extractionSummary); the raw JSON stays on the
        // intake and AP Extraction records as technical evidence.
        extraction_summary: StringColumn({ label: 'Extracted Data', maxLength: 4000, readOnly: true, hint: 'What Document Intelligence read from the invoice, by section. Evidence only: validation and matching decide.' }),
        extraction_confidence: DecimalColumn({ label: 'Extraction Confidence', scale: 2 }),
        state: StringColumn({ label: 'State', maxLength: 40, readOnly: true, hint: 'Managed by the AP Invoice Lifecycle state model; only its transitions are allowed (Phase 26).' }),
        source: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Source',
            default: 'email',
            choices: { email: 'Email', shared_drive: 'Shared Drive', manual: 'Manual Entry' },
        }),
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64 }),
        external_reference: StringColumn({ label: 'External Reference', maxLength: 64 }),
        duplicate_key: StringColumn({ label: 'Duplicate Key', maxLength: 100, hint: 'Hash of vendor+invoice_number+amount used for duplicate detection' }),
        approval_state: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Approval State',
            default: 'not_required',
            choices: { not_required: 'Not Required', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
        }),
        posting_state: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Posting State',
            default: 'not_posted',
            choices: {
                not_posted: 'Not Posted',
                posting: 'Posting',
                posted: 'Posted',
                failed: 'Failed',
                unknown_outcome: 'Unknown Outcome',
            },
        }),
        sap_document_id: StringColumn({ label: 'SAP Document ID', maxLength: 20 }),
        // Phase 24: one read-only block with the whole review evidence
        // (document, extraction, PO/GRN, match, tolerance, exception, AI,
        // approval, integration, audit), kept current by FinanceReviewSummary.
        review_summary: StringColumn({
            label: 'Review Summary',
            maxLength: 8000,
            readOnly: true,
            hint: 'Generated by FinanceReviewSummary on every state change and AI note: the review evidence in one place. Details are in the related lists.',
        }),
        // Playbook phase: journey presentation fields, derived from the
        // authoritative records by FinanceJourneyService on every state change.
        // Display only: the BCFA Playbook stages wait on journey_stage_order; no
        // business logic reads these fields.
        journey_stage: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Journey Stage',
            readOnly: true,
            choices: {
                intake: '1. Invoice Intake',
                extraction: '2. Document Extraction',
                validation: '3. Validation & Enrichment',
                matching: '4. PO / GRN-SRN / 3-Way Match',
                exception: '5. Exception Resolution',
                approval: '6. Approval',
                posting: '7. SAP Posting (Mock SAP)',
                closure: '8. Closure & Audit',
            },
            hint: 'Where the invoice is in the AP journey (BCFA AP Invoice Processing Playbook).',
        }),
        journey_stage_order: IntegerColumn({ label: 'Journey Stage Order', readOnly: true, hint: 'Playbook stage N completes when this is greater than N.' }),
        journey_status: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Journey Status',
            readOnly: true,
            choices: {
                in_progress: 'In progress (system)',
                action_required: 'Action required',
                waiting: 'Waiting for SAP',
                blocked: 'Blocked',
                complete: 'Complete',
                rejected: 'Rejected',
            },
        }),
        journey_blocked_reason: StringColumn({ label: 'Blocked Because', maxLength: 1000, readOnly: true, hint: 'What happened and why the transaction cannot progress.' }),
        journey_next_action: StringColumn({ label: 'What Needs To Happen Next', maxLength: 500, readOnly: true }),
        journey_owner: StringColumn({ label: 'Who Owns The Action', maxLength: 100, readOnly: true }),
        journey_open_exceptions: IntegerColumn({ label: 'Open Exceptions', readOnly: true }),
        journey_banner: StringColumn({ label: 'POC Notice', maxLength: 200, readOnly: true, hint: 'Simulated and mock capabilities used by this transaction.' }),
        journey_stage_entered: DateTimeColumn({ label: 'Stage Entered', readOnly: true }),
        journey_updated: DateTimeColumn({ label: 'Journey Updated', readOnly: true }),
        // Phase 40 (client POC criteria): document facts and the tax as
        // printed on the invoice (extraction), and the tax validation against
        // the governed expectation (MatchingEngine.evaluateTax). Extraction
        // and validation are separate concerns.
        extraction_provider: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Extraction Provider',
            choices: { native: 'Native: ServiceNow Document Intelligence (Now LLM)', simulated: 'SIMULATED DOCUMENT EXTRACTION — POC' },
        }),
        document_country: StringColumn({ label: 'Document Country', maxLength: 80, hint: 'Supplier country as printed on the invoice (extraction).' }),
        document_language: StringColumn({ label: 'Document Language', maxLength: 40 }),
        tax_type: StringColumn({ label: 'Tax Type (Printed)', maxLength: 40, hint: 'Tax name as printed, e.g. GST, IGST, CGST+SGST, VAT.' }),
        tax_rate_pct: DecimalColumn({ label: 'Tax Rate % (Printed)', scale: 3 }),
        cgst_amount: DecimalColumn({ label: 'CGST (Printed)', scale: 2 }),
        sgst_amount: DecimalColumn({ label: 'SGST (Printed)', scale: 2 }),
        igst_amount: DecimalColumn({ label: 'IGST (Printed)', scale: 2 }),
        vat_amount: DecimalColumn({ label: 'VAT (Printed)', scale: 2 }),
        wht_amount: DecimalColumn({ label: 'Withholding (Printed)', scale: 2 }),
        wht_rate_pct: DecimalColumn({ label: 'Withholding Rate % (Printed)', scale: 3 }),
        tax_regime: StringColumn({ label: 'Expected Tax Regime', maxLength: 40, readOnly: true }),
        expected_tax_amount: DecimalColumn({ label: 'Expected Tax', scale: 2, readOnly: true }),
        tax_variance_amount: DecimalColumn({ label: 'Tax Variance', scale: 2, readOnly: true }),
        tax_validation_result: ChoiceColumn({ label: 'Tax Validation', readOnly: true, choices: {
                pass: 'Pass',
                within_tolerance: 'Within Tolerance',
                warning: 'Warning',
                manual_review: 'Manual Review',
                fail: 'Fail',
            } }),
        tax_validation_detail: StringColumn({ label: 'Tax Validation Detail', maxLength: 2000, readOnly: true }),
        tax_rule_source: StringColumn({ label: 'Tax Rule Source', maxLength: 255, readOnly: true }),
        wht_applicable: BooleanColumn({ label: 'Withholding Applicable', readOnly: true, default: false }),
        wht_code: StringColumn({ label: 'Withholding Code', maxLength: 60, readOnly: true }),
        wht_expected_amount: DecimalColumn({ label: 'Withholding Expected', scale: 2, readOnly: true }),
        wht_result: ChoiceColumn({ label: 'Withholding Validation', readOnly: true, choices: {
                pass: 'Pass',
                within_tolerance: 'Within Tolerance',
                warning: 'Warning',
                manual_review: 'Manual Review',
                fail: 'Fail',
            } }),
        // Phase 42: document evidence (stamp / seal / chop presence and
        // handwriting). Presence detection only: BCFA never claims a stamp is
        // authentic. The AI finding is kept read-only next to the human
        // decision; the governed BCFA Document Evidence Requirement decides
        // whether a stamp is required.
        printed_vendor_tax_id: StringColumn({ label: 'Supplier Tax ID (Printed)', maxLength: 60, readOnly: true, hint: 'Supplier tax registration / organization identifier as printed (extraction). Used to resolve the vendor.' }),
        stamp_required: BooleanColumn({ label: 'Stamp Required', readOnly: true, default: false, hint: 'Set by the BCFA Document Evidence Requirement decision table (POC business configuration, not a statement of law).' }),
        stamp_present: ChoiceColumn({ label: 'Stamp Present', readOnly: true, dropdown: 'dropdown_with_none', choices: { yes: 'Yes', no: 'No', uncertain: 'Uncertain' },
            hint: 'Current stamp finding: the human decision when recorded, otherwise the extraction finding. Presence only, never authenticity.' }),
        stamp_type: ChoiceColumn({ label: 'Stamp Type', readOnly: true, dropdown: 'dropdown_with_none', choices: {
                company_chop: 'Company Chop', company_seal: 'Company Seal', finance_seal: 'Finance Seal', invoice_seal: 'Invoice Seal',
                tax_seal: 'Tax Seal', other: 'Other', unknown: 'Unknown' } }),
        stamp_text: StringColumn({ label: 'Stamp Text', maxLength: 400, readOnly: true, hint: 'Text read inside the stamp, best effort. Empty does not mean the stamp is absent.' }),
        stamp_page: StringColumn({ label: 'Stamp Page', maxLength: 40, readOnly: true }),
        stamp_count: IntegerColumn({ label: 'Stamp Count', readOnly: true }),
        stamp_detection_method: ChoiceColumn({ label: 'Stamp Detection Method', readOnly: true, dropdown: 'dropdown_with_none', choices: {
                native_visual: 'Native visual (image) reading', ocr_text: 'OCR text only (no image understanding)', human: 'Human review', not_run: 'Not run' } }),
        stamp_evidence_status: ChoiceColumn({ label: 'Stamp Evidence Status', readOnly: true, dropdown: 'dropdown_with_none', choices: {
                confirmed_by_native_visual: 'Confirmed by native visual reading', detected_best_effort: 'Detected (best effort, not confirmed)',
                uncertain: 'Uncertain', not_detected: 'Not detected', human_confirmed: 'Human confirmed', human_rejected: 'Human rejected (no stamp)' } }),
        stamp_ai_finding: StringColumn({ label: 'Stamp AI Finding', maxLength: 1000, readOnly: true, hint: 'What the extraction reported about stamps, as read (evidence, immutable).' }),
        stamp_validation_result: ChoiceColumn({ label: 'Stamp Validation', readOnly: true, dropdown: 'dropdown_with_none', choices: {
                not_required: 'Not required', passed: 'Passed', missing: 'Required stamp missing', review_required: 'Review required' } }),
        stamp_validation_detail: StringColumn({ label: 'Stamp Validation Detail', maxLength: 1000, readOnly: true }),
        handwriting_status: ChoiceColumn({ label: 'Handwriting', readOnly: true, dropdown: 'dropdown_with_none', choices: {
                none: 'No handwriting found', readable: 'Handwriting readable', partially_readable: 'Partially readable', not_readable: 'Not readable', unknown: 'Unknown' } }),
        handwritten_values: StringColumn({ label: 'Handwritten Values (Read)', maxLength: 1000, readOnly: true, hint: 'Handwritten values the extraction could read, as read. Never completed by guessing.' }),
        visual_review_required: BooleanColumn({ label: 'Visual Review Required', readOnly: true, default: false }),
        evidence_reviewed_by: ReferenceColumn({ label: 'Evidence Reviewed By', referenceTable: 'sys_user', readOnly: true }),
        evidence_reviewed_on: DateTimeColumn({ label: 'Evidence Reviewed On', readOnly: true }),
        evidence_review_decision: StringColumn({ label: 'Evidence Review Decision', maxLength: 400, readOnly: true }),
    },
    index: [{ unique: false, element: 'duplicate_key' }],
})

export const x_695068_bcfa_ap_invoice_line = Table({
    name: 'x_695068_bcfa_ap_invoice_line',
    label: 'AP Invoice Line',
    display: 'material_or_service',
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        line_number: IntegerColumn({ label: 'Line Number', mandatory: true, min: 1 }),
        material_or_service: StringColumn({ label: 'Material / Service', maxLength: 200 }),
        quantity: DecimalColumn({ label: 'Quantity', scale: 2 }),
        unit: StringColumn({ label: 'Unit', maxLength: 10 }),
        unit_price: DecimalColumn({ label: 'Unit Price', scale: 2 }),
        tax: DecimalColumn({ label: 'Tax', scale: 2 }),
        amount: DecimalColumn({ label: 'Amount', scale: 2 }),
        po_line: ReferenceColumn({ label: 'PO Line', referenceTable: 'x_695068_bcfa_po_line' }),
        receipt_reference: ReferenceColumn({ label: 'Receipt Reference', referenceTable: 'x_695068_bcfa_receipt' }),
    },
})

export const x_695068_bcfa_ap_extraction = Table({
    name: 'x_695068_bcfa_ap_extraction',
    label: 'AP Extraction',
    display: 'ap_invoice',
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        extracted_fields: JsonColumn({ label: 'Extracted Fields' }),
        confidence: DecimalColumn({ label: 'Confidence', scale: 2 }),
        source: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Source',
            default: 'simulated_document_intelligence',
            choices: {
                claude_document_intelligence: 'Claude (legacy, removed in Phase 34)',
                simulated_document_intelligence: 'Simulated extraction (fixture values, tests and demo seed only)',
                now_assist_document_intelligence: 'AI in Document Intelligence (legacy value, not used)',
                servicenow_document_intelligence: 'ServiceNow Document Intelligence (Now LLM)',
            },
            hint: 'Records which engine produced this extraction row: ServiceNow Document Intelligence on Now LLM for uploaded documents (Phase 40), or the simulated extraction for test fixtures and seeded demo data. Claude rows are historical (removed in Phase 34).',
        }),
        requires_review: BooleanColumn({ label: 'Requires Review', default: false }),
        reviewed_by: ReferenceColumn({ label: 'Reviewed By', referenceTable: 'sys_user' }),
        reviewed_at: DateTimeColumn({ label: 'Reviewed At' }),
    },
})

export const x_695068_bcfa_ap_match = Table({
    name: 'x_695068_bcfa_ap_match',
    label: 'AP Match',
    display: 'ap_invoice',
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        po_line: ReferenceColumn({ label: 'PO Line', referenceTable: 'x_695068_bcfa_po_line' }),
        receipt: ReferenceColumn({ label: 'Receipt', referenceTable: 'x_695068_bcfa_receipt' }),
        quantity_variance: DecimalColumn({ label: 'Quantity Variance', scale: 2 }),
        price_variance: DecimalColumn({ label: 'Price Variance', scale: 2 }),
        tax_variance: DecimalColumn({ label: 'Tax Variance', scale: 2 }),
        within_tolerance: BooleanColumn({ label: 'Within Tolerance' }),
        match_result: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Match Result',
            choices: { matched: 'Matched', partial: 'Partial', mismatch: 'Mismatch' },
        }),
        evaluated_at: DateTimeColumn({ label: 'Evaluated At' }),
        // Phase 40: the tolerance rule used and every check's expected /
        // actual / variance / result (MatchingEngine.threeWayMatch).
        tolerance_source: StringColumn({ label: 'Tolerance Rule', maxLength: 255 }),
        quantity_tolerance_pct: DecimalColumn({ label: 'Quantity Tolerance', scale: 4 }),
        price_tolerance_pct: DecimalColumn({ label: 'Price Tolerance', scale: 4 }),
        tax_tolerance_abs: DecimalColumn({ label: 'Tax Tolerance (Absolute)', scale: 2 }),
        tax_tolerance_pct: DecimalColumn({ label: 'Tax Tolerance (Relative)', scale: 4 }),
        total_tolerance_abs: DecimalColumn({ label: 'Total Tolerance (Absolute)', scale: 2 }),
        expected_tax: DecimalColumn({ label: 'Expected Tax', scale: 2 }),
        tax_result: ChoiceColumn({ label: 'Tax Result', choices: {
                pass: 'Pass',
                within_tolerance: 'Within Tolerance',
                warning: 'Warning',
                manual_review: 'Manual Review',
                fail: 'Fail',
            } }),
        tolerance_detail: StringColumn({ label: 'Tolerance Detail', maxLength: 4000 }),
        // Phase 41, defect 6: a newer match of the same invoice supersedes this
        // one (history kept; one current result).
        // Phase 41, defect 5: invoice and PO in different currencies are
        // compared only through a governed rate (source, date, rate, values).
        fx_detail: StringColumn({ label: 'Currency Conversion', maxLength: 1000, readOnly: true }),
        superseded: BooleanColumn({ label: 'Superseded', default: false, readOnly: true, hint: 'A later match of the same invoice replaced this result (re-run). Kept as history.' }),
    },
})

export const x_695068_bcfa_ap_exception = Table({
    name: 'x_695068_bcfa_ap_exception',
    label: 'AP Exception',
    display: 'number',
    audit: true,
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        reason_code: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Reason Code',
            mandatory: true,
            choices: {
                duplicate: 'Duplicate Invoice',
                po_mismatch: 'PO Mismatch',
                quantity_tolerance: 'Quantity Tolerance Failure',
                price_tolerance: 'Price Tolerance Failure',
                tax_validation: 'Tax Validation Failure',
                low_confidence: 'Low-Confidence Extraction',
                missing_field: 'Missing Mandatory Field',
                vendor_invalid: 'Vendor Invalid',
                grn_missing: 'Goods Receipt Missing',
                line_total_mismatch: 'Line Total Mismatch',
                currency_mismatch: 'Currency / FX (no approved rate)',
                totals_not_reconciled: 'Printed Totals Not Reconciled',
                document_evidence_missing: 'Required Stamp Missing',
                document_evidence_review: 'Document Evidence Review (stamp)',
                other: 'Other',
            },
        }),
        description: StringColumn({ label: 'Description', maxLength: 4000 }),
        status: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Status',
            default: 'open',
            choices: { open: 'Open', in_review: 'In Review', resolved: 'Resolved', closed: 'Closed' },
        }),
        assigned_to: ReferenceColumn({ label: 'Assigned To', referenceTable: 'sys_user' }),
        resolution_notes: StringColumn({ label: 'Resolution Notes', maxLength: 4000 }),
        ai_recommendation: StringColumn({
            label: 'AI Recommendation (advisory)',
            maxLength: 4000,
            hint: 'Advisory AI output only (ServiceNow AI, or the legacy simulation). Never read by deterministic rules or approval/posting logic.',
        }),
        // Phase 12 enrichment, set by ExceptionEngine when the exception is
        // raised (deterministic, from FinancePolicy and MatchingEngine).
        severity: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Severity',
            default: 'medium',
            readOnly: true,
            choices: { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' },
        }),
        assignment_group: ReferenceColumn({ label: 'Assignment Group', referenceTable: 'sys_user_group' }),
        sla_due: DateTimeColumn({ label: 'SLA Due', readOnly: true, hint: 'Set from the severity and x_695068_bcfa.ap.exception.sla_hours (POC ASSUMPTION).' }),
        rule_result: StringColumn({ label: 'Rule Result', maxLength: 1000, readOnly: true, hint: 'Deterministic validation / 3-way match result that raised this exception.' }),
        evidence: StringColumn({ label: 'Evidence', maxLength: 4000, readOnly: true, hint: 'Source facts: invoice, PO and GRN quantities and prices, tax, duplicate key.' }),
        variance_amount: DecimalColumn({ label: 'Variance Amount', scale: 2, readOnly: true, hint: 'Value of the variance in invoice currency.' }),
        variance_pct: DecimalColumn({ label: 'Variance %', scale: 2, readOnly: true }),
        // Human decision (ApExceptionDecisionService). The reason is typed by
        // the finance user; the rest is recorded by the service.
        decision: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Decision',
            readOnly: true,
            choices: {
                approve_override: 'Approve Override',
                reject: 'Reject',
                request_correction: 'Request Correction',
                hold: 'Hold',
            },
        }),
        decision_reason: StringColumn({ label: 'Decision Reason', maxLength: 4000, hint: 'Required before choosing Approve Override, Reject, Request Correction or Hold.' }),
        decided_by: ReferenceColumn({ label: 'Decided By', referenceTable: 'sys_user', readOnly: true }),
        decided_at: DateTimeColumn({ label: 'Decided At', readOnly: true }),
        // Phase 16 unified exception framework fields (same on AP and AR,
        // maintained by ExceptionEngine).
        number: StringColumn({ label: 'Number', maxLength: 40, readOnly: true }),
        process: ChoiceColumn({ label: 'Process', default: 'ap', readOnly: true, choices: { ap: 'Accounts Payable', ar: 'Accounts Receivable' } }),
        subtype: StringColumn({ label: 'Subtype', maxLength: 100, readOnly: true }),
        priority: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Priority',
            default: '3',
            readOnly: true,
            choices: { '1': '1 - Critical', '2': '2 - High', '3': '3 - Moderate', '4': '4 - Low' },
            hint: 'From the severity; raised one step per escalation level.',
        }),
        opened_at: DateTimeColumn({ label: 'Opened', readOnly: true }),
        sla_status: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'SLA Status',
            readOnly: true,
            choices: { on_track: 'On Track', at_risk: 'At Risk', breached: 'Breached', met: 'Met', missed: 'Missed' },
            hint: 'At risk from 75% of the SLA; set hourly by the exception sweep and on resolution.',
        }),
        aging_bucket: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Aging',
            readOnly: true,
            choices: { lt_1d: 'Under 1 day', '1_3d': '1-3 days', '3_7d': '3-7 days', gt_7d: 'Over 7 days' },
        }),
        escalation_level: IntegerColumn({ label: 'Escalation Level', default: 0, readOnly: true, hint: '1 at SLA breach, 2 at twice the SLA (Finance Controllers notified).' }),
        ai_explanation: StringColumn({ label: 'AI Explanation (advisory)', maxLength: 4000, readOnly: true, hint: 'Explanation section of the advisory AI note.' }),
        ai_confidence: ChoiceColumn({ label: 'AI Confidence', readOnly: true, choices: { high: 'High', medium: 'Medium', low: 'Low' } }),
        resolution_code: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Resolution Code',
            readOnly: true,
            choices: {
                override_approved: 'Override Approved',
                rejected: 'Rejected',
                deduction_approved: 'Deduction Approved',
                corrected_and_retried: 'Corrected and Retried',
                withdrawn: 'Withdrawn',
                superseded_by_rerun: 'Superseded by Re-run',
                other: 'Other',
            },
        }),
        resolved_by: ReferenceColumn({ label: 'Resolved By', referenceTable: 'sys_user', readOnly: true }),
        resolved_at: DateTimeColumn({ label: 'Resolved', readOnly: true }),
        correlation_id: StringColumn({ label: 'Correlation ID', maxLength: 64, readOnly: true }),
    },
})

export const x_695068_bcfa_ap_approval = Table({
    name: 'x_695068_bcfa_ap_approval',
    label: 'AP Approval',
    display: 'ap_invoice',
    audit: true,
    schema: {
        ap_invoice: ReferenceColumn({ label: 'AP Invoice', referenceTable: 'x_695068_bcfa_ap_invoice', mandatory: true }),
        requested_by: ReferenceColumn({ label: 'Requested By', referenceTable: 'sys_user' }),
        approver: ReferenceColumn({ label: 'Approver', referenceTable: 'sys_user' }),
        approval_group: ReferenceColumn({
            label: 'Approval Group',
            referenceTable: 'sys_user_group',
            readOnly: true,
            hint: 'Group the BCFA AP Approval decision table routed this approval to (Phase 15). Membership is enforced from Phase 17.',
        }),
        // Phase 41, defect 4: approvals go to a group; the decider is recorded
        // in approver only when someone decides. The eligible approvers (active
        // group members who pass every segregation-of-duties check) are listed
        // when the approval is requested, so the destination is never blank.
        eligible_approvers: StringColumn({
            label: 'Eligible Approvers',
            maxLength: 1000,
            readOnly: true,
            hint: 'Active members of the approval group who may decide this approval: they hold the approver role, did not request it and did not process the transaction. Set when the approval is requested.',
        }),
        decision: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Decision',
            default: 'pending',
            choices: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', withdrawn: 'Withdrawn' },
        }),
        decision_notes: StringColumn({ label: 'Decision Notes', maxLength: 4000 }),
        decided_at: DateTimeColumn({ label: 'Decided At' }),
        // Phase 17 decision record (ApprovalEngine).
        approval_type: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Approval Type',
            default: 'standard',
            readOnly: true,
            choices: { standard: 'Standard', override: 'Tolerance Override', rule: 'Configured Rule (no approver)' },
        }),
        override_reason: StringColumn({ label: 'Override Reason', maxLength: 4000, readOnly: true, hint: 'Why the variance or deduction was accepted (from the finance user decision).' }),
        state_before: StringColumn({ label: 'State Before', maxLength: 40, readOnly: true }),
        state_after: StringColumn({ label: 'State After', maxLength: 40, readOnly: true, hint: 'Transaction state after the decision and any posting/clearing.' }),
        sod_check: StringColumn({ label: 'SoD Check', maxLength: 1000, readOnly: true, hint: 'Segregation-of-duties checks the decision passed.' }),
    },
})
