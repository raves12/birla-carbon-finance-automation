"""Phase 40 deploy (client POC criteria): builds a Scripts - Background loader
from the now-sdk build for the records of one Phase 40 step, wrapped in a
drift guard: every modified script include must be live == its source at
BASE (the last deployed commit) or already == this build, else nothing runs.

Usage (after npx now-sdk build):
  python scripts/deploy/gen_phase40_deploy.py <step>
Steps are defined in STEPS below. Output: scripts/deploy/phase40_<step>_bg.js
Run the output in Scripts - Background, scope global.
"""
import io, json, os, re, subprocess, sys, tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SCR = tempfile.gettempdir()

STEPS = {
    # Provider abstraction: DocumentExtractionService, NativeDocumentIntelligenceProvider,
    # intake service and simulated provider changes, provider property, intake
    # columns, poller job, Process Document / Reprocess messages.
    'extraction': {
        'base': 'fd51f95',
        'new_si': ['DocumentExtractionService', 'NativeDocumentIntelligenceProvider'],
        'mod_si': ['FinanceDocumentIntakeService', 'SimulatedDocumentExtraction'],
        'files': r'^(sys_properties_(8445263612c84299b10c8173e3f373a1|9e5446bddbed4292bbc08ec0aa315ce9)'
                 r'|sysauto_script_629f380962754e42b25fe343f0140815'
                 r'|sys_ui_action_(18d525d32dce47ce959ada18613b9a06|d6364c9589c84fea88ccac365a8fdbcc|f13745dac6a540a28a8ce31af80d2ad9))\.xml$',
        'choices': r'^sys_choice_x_695068_bcfa_finance_intake_extraction_provider\.xml$',
        'columns': ['x_695068_bcfa_finance_intake=extraction_provider,extraction_task'],
    },
    # Tax (GST / VAT / withholding), tolerance visibility, AR deduction
    # taxonomy and payment advice fields. The decision tables are built
    # afterwards by phase40_decision_tables_bg.js (scope x_695068_bcfa).
    'tax': {
        'base': '1cfb575',
        'new_si': [],
        'mod_si': ['FinancePolicy', 'MatchingEngine', 'ApDomainService', 'ArDomainService', 'ArExceptionDecisionService', 'FinanceDocumentIntakeService'],
        'files': r'^sys_properties_(fac5180f3ddb4078b27a16e16a899c49|fce08088c996402b8b4a514f6c2e4a36|7de59dea50f7489d934a307f2dfcb123'
                 r'|1a8a42c456cc4ac98310e6d9dd50b290|83f6319d3267417b9ad650e54218b5af|6ec72ccb825549a791ae3ec89844b050)\.xml$',
        'choices': r'^sys_choice_x_695068_bcfa_(ap_invoice_(extraction_provider|tax_validation_result|wht_result)|ap_match_tax_result'
                   r'|ar_exception_deduction_type|deduction_(category_source|deduction_type)|remittance_extraction_provider|vendor_tax_category)\.xml$',
        'columns': [
            'x_695068_bcfa_ap_invoice=extraction_provider,document_country,document_language,tax_type,tax_rate_pct,cgst_amount,sgst_amount,igst_amount,'
            'vat_amount,wht_amount,wht_rate_pct,tax_regime,expected_tax_amount,tax_variance_amount,tax_validation_result,tax_validation_detail,'
            'tax_rule_source,wht_applicable,wht_code,wht_expected_amount,wht_result',
            'x_695068_bcfa_ap_match=tolerance_source,quantity_tolerance_pct,price_tolerance_pct,tax_tolerance_abs,tax_tolerance_pct,total_tolerance_abs,'
            'expected_tax,tax_result,tolerance_detail',
            'x_695068_bcfa_vendor=tax_category',
            'x_695068_bcfa_deduction=currency,advice_reason,advice_amount,ai_recommendation,category_source',
            'x_695068_bcfa_remittance=payer_name,bank_reference,payment_amount,currency,advice_deduction_amount,advice_deduction_reason,invoice_count,extraction_provider',
        ],
    },
}


# ATF tests of a step: the test records, their steps and the suite links
# (BCFA Regression) of the given test sys_ids.
def atf_files(test_ids):
    upd = os.path.join(REPO, 'dist', 'app', 'update')
    out = []
    for f in os.listdir(upd):
        if not f.startswith('sys_atf_'):
            continue
        x = io.open(os.path.join(upd, f), encoding='utf8').read()
        if any(t in x for t in test_ids):
            out.append(f[:-4])
    return out


CP_TESTS = ['0f9684be734741daa3b97ec040e91399', '158431353b0a457195253cd20ac8bac1', 'b389e812f61c4bb09ed7c730aa20b6ee', '3943fb95ed7341bc9d6a7554304c5035']
STEPS['tests'] = {
    'base': 'a2ed8cf',
    'new_si': [],
    'mod_si': ['FinanceJourneyService'],
    'atf': CP_TESTS,
}

# Fixes found by the native extraction measurement (set 2): locale-aware
# number parsing (German "2.058,80") and split GST (CGST + SGST invoices print
# the component rate, 9% of GST 18%).
STEPS['fixes'] = {
    'base': 'ac4462c',
    'new_si': [],
    'mod_si': ['NativeDocumentIntelligenceProvider', 'MatchingEngine'],
    'atf': ['0f9684be734741daa3b97ec040e91399', '3943fb95ed7341bc9d6a7554304c5035', 'a93e389547e243dda3c7550a2d2b5b01', 'c98429799fcf464b90d8c73cf10a9842'],  # CP-TAX split GST; CP-EXT number formats; Lifecycle + Orchestration race fix
}

# Playbooks (Phase 14 of the client POC criteria): provider-aware extraction
# stages, tax / withholding results, tolerances applied, payment advice and
# deduction taxonomy. Follow with phase35_playbook_yokohama_fix_bg.js and
# activate both Playbooks again in Workflow Studio.
STEPS['playbooks'] = {
    'base': '3dadc4c',
    'new_si': [],
    'mod_si': [],
    'files': r'^sys_pd_process_definition_(74ce2044163b43e7bbaa53a0cb012d42|e01d2325600b49c5a0165460897cd11d)\.xml$',
}

# Remaining fixes after the client POC criteria run: AR open items read
# through IntegrationService before matching (AR-REC-004); SAP adapter by
# configuration (x_695068_bcfa.sap.adapter); journey banner labels only the
# extraction actually recorded; native extraction source choice and stale
# "not licensed" labels.
STEPS['remaining'] = {
    'base': '62ead09',
    'new_si': [],
    'mod_si': ['FinancePolicy', 'ApDomainService', 'ArDomainService', 'FinanceJourneyService', 'AISimulationService'],
    'files': r'^(sys_properties_50d388a192d3432398e073c3e549591b'
             r'|sys_documentation_x_695068_bcfa_(ap_extraction_source|finance_intake_classification_reason)_en)\.xml$',
    'choices': r'^sys_choice_x_695068_bcfa_ap_extraction_source\.xml$',
    'atf': ['f8bacf78488341a6a620d529cba81a17', 'b389e812f61c4bb09ed7c730aa20b6ee'],  # PB-AP-004 banner; CP-DED AR-REC-004
}

# Process Document saves a new intake before processing it (it ran on an
# unsaved form and redirected to "Record not found", 2026-10-06).
STEPS['intake_action'] = {
    'base': '4e00db7',
    'new_si': [],
    'mod_si': [],
    'files': r'^sys_ui_action_18d525d32dce47ce959ada18613b9a06\.xml$',
}

# Documents by email: inbound email actions (subject contains BCFA, new and
# forwarded) and FinanceDocumentIntakeService.intakeFromEmail.
STEPS['email_intake'] = {
    'base': '4e00db7',
    'new_si': [],
    'mod_si': ['FinanceDocumentIntakeService'],
    'files': r'^sysevent_in_email_action_(128b2c33deac4f43a03b35a7300afe31|a9751dac9f194764a2e0d28300701527)\.xml$',
}

# Email intake v2: images under 30 KB (signature logos, icons) are skipped.
# The live version is the email_intake deploy, kept in scripts/deploy/baselines.
STEPS['email_intake_v2'] = {
    'base': '4e00db7',
    'base_files': {'FinanceDocumentIntakeService': 'scripts/deploy/baselines/FinanceDocumentIntakeService.email_intake_v1.js'},
    'new_si': [],
    'mod_si': ['FinanceDocumentIntakeService'],
}

# Email intake v3: email intakes are queued and the poller job (system)
# processes them, since Document Intelligence does not run for guest; a
# timed-out extraction task is forgotten so Reprocess starts a new one.
STEPS['email_intake_v3'] = {
    'base': '4e00db7',
    'base_files': {'FinanceDocumentIntakeService': 'scripts/deploy/baselines/FinanceDocumentIntakeService.email_intake_v2.js'},
    'new_si': [],
    'mod_si': ['FinanceDocumentIntakeService', 'NativeDocumentIntelligenceProvider'],
    'files': r'^(sysevent_in_email_action_(128b2c33deac4f43a03b35a7300afe31|a9751dac9f194764a2e0d28300701527)|sysauto_script_629f380962754e42b25fe343f0140815)\.xml$',
}

# "Open Playbook" button on the BCFA Workspace AP invoice and payment forms
# (declarative form action raising NAV_ITEM_SELECTED for the playbook route).
STEPS['playbook_button'] = {
    'base': '4e00db7',
    'new_si': [],
    'mod_si': [],
    'files': r'^(sys_declarative_action_assignment_(425771e68cd443eba638eb679d783284|dd8fdfc2b68c4e8b88d60393512b617a)|sys_declarative_action_payload_definition_1507b8ec57a846abbab06aab42eb9fc6|sys_ux_addon_event_mapping_(8d2a07fda0a8484aa5024c06ed35e6b8|5891ea84e165495abffc8657580fe5b8))\.xml$',
}

# Readable review summary (sections, bullets) and advisory AI notes
# (FinanceTextFormat; "Format AI Note" rules on the four tables holding them).
STEPS['readable_text'] = {
    'base': '4e00db7',
    'new_si': ['FinanceTextFormat'],
    'mod_si': ['FinanceReviewSummary'],
    'files': r'^sys_script_(0b2adbe11d7242e0ac630e8eb7912772|b62093c1380749f7a49719df6bb6a33a|574789dbb1da40fdac0f73f7c263d45f|48d6605789e04e868e719c1c4f1dd416)\.xml$',
}

# Review summary v2: AI excerpts on one line (bullets dropped, "; " joins).
STEPS['readable_text_v2'] = {
    'base': '4e00db7',
    'base_files': {'FinanceReviewSummary': 'scripts/deploy/baselines/FinanceReviewSummary.readable_v1.js'},
    'new_si': [],
    'mod_si': ['FinanceReviewSummary'],
}

# Review summary refreshed after an approval is requested (it showed
# "Approval: Not required" until the next state change).
STEPS['approval_summary'] = {
    'base': '4e00db7',
    'new_si': [],
    'mod_si': ['ApDomainService', 'ArDomainService'],
}

# Phase 41, SAP readiness: SAP-ready request data (SapPayloadBuilder), the
# adapter's own answer decides the outcome, draft status as its own
# operation, labels follow the adapter, no inline posting with real SAP,
# MOCK SAP checks the request (strict or warn).
STEPS['sap_ready'] = {
    'base': '4e00db7',
    'base_files': {
        'ApDomainService': 'scripts/deploy/baselines/ApDomainService.sap_ready_base.js',
        'ArDomainService': 'scripts/deploy/baselines/ArDomainService.sap_ready_base.js',
        'FinanceReviewSummary': 'scripts/deploy/baselines/FinanceReviewSummary.sap_ready_base.js',
    },
    'new_si': ['SapPayloadBuilder'],
    'mod_si': ['IntegrationService', 'MockSAPAdapter', 'RealSAPAdapter', 'ApDomainService', 'ArDomainService', 'FinancePolicy',
               'FinanceJourneyService', 'FinanceReviewSummary', 'FinanceOrchestration'],
    'files': r'^sys_properties_55a168975d634587bcd11123a2432aa6\.xml$',
}

# Phase 41: client sample pack hardening, defects D6 and 1-11, and the SAP
# readiness changes (sap_ready, never deployed on its own). Supersedes
# 'sap_ready'. Baselines: the live versions, extracted from the loaders that
# put them live (scripts/deploy/baseline_from_loader.py).
P41_TESTS = ['1eda99ce35654de09db2537e41ab40e4', 'd09a7e9dcc544091855e186073b0c09c', 'c195e6625f8141a28e8d0f34eb05c79b',
             '0cedd6bd2e5a4266838d9c70266eb805', 'a5e710b603c04c55bfc7e0e5487add80', '3afa39bdc5984e28989dedd23cd5ac67',
             'e7688ebcbf4f4f36ab1294b705380553', '94ce522786d84b10ae39413a27e9f239', '597c9d2e699945d0bf245cef59ff0a71']
STEPS['phase41'] = {
    'base': '4e00db7',
    'base_files': {n: 'scripts/deploy/baselines/' + n + '.p41_base.js' for n in [
        'ApDomainService', 'ArDomainService', 'FinanceReviewSummary', 'FinanceDocumentIntakeService',
        'NativeDocumentIntelligenceProvider', 'FinanceTextFormat']},
    'new_si': ['SapPayloadBuilder'],
    'mod_si': ['IntegrationService', 'MockSAPAdapter', 'RealSAPAdapter', 'ApDomainService', 'ArDomainService', 'FinancePolicy',
               'FinanceJourneyService', 'FinanceReviewSummary', 'FinanceOrchestration', 'FinanceDocumentIntakeService',
               'NativeDocumentIntelligenceProvider', 'FinanceTextFormat', 'MatchingEngine', 'ApprovalEngine'],
    'columns': [
        'x_695068_bcfa_finance_intake=duplicate_of,extraction_summary',
        'x_695068_bcfa_ap_invoice=charges_amount,discount_amount,amount_reconciliation,amount_reconciliation_detail,extraction_summary',
        'x_695068_bcfa_ap_match=fx_detail,superseded',
        'x_695068_bcfa_ap_approval=eligible_approvers',
        'x_695068_bcfa_ar_approval=eligible_approvers',
        'x_695068_bcfa_payment=advice_summary',
    ],
    'choices': r'^sys_choice_x_695068_bcfa_(ap_exception_reason_code|ap_exception_resolution_code|ap_invoice_amount_reconciliation|ap_approval_decision|ar_approval_decision)\.xml$',
    'files': r'^(sys_properties_55a168975d634587bcd11123a2432aa6'
             r'|sys_security_acl_(19556feabb6e4cebb188466e0fe844d6|8efab6aed2954d8daa329c0ff58b2b72|a82769f5b7254201b100279d2395c60c|931ff5fa741e486488593966e3c4c45c)'
             r'|sys_script_f80fe2fb0aa04d42a799be90b747db5e'
             r'|sttrm_state_transition_(df9a5fc82393439a9deeb4318e511104|5b0eec8af64a473f8c57398fe0d052c3|1b1ff17cb7344e5fba4178d341ca3ba4)'
             r'|sys_ui_action_(18d525d32dce47ce959ada18613b9a06|d6364c9589c84fea88ccac365a8fdbcc|2281a5684eea4af5b8e9850af7186ac9|aa49bcfe92ea415bab51ed26ca7b3d9f)'
             r'|sys_atf_test_suite_fc5aebad352146fd876beed00f871088)\.xml$',
    'atf': P41_TESTS,
}

# Phase 41 follow-up: the role links of the 4 decision-reason ACLs (the
# phase41 loader carried the ACLs only) and the two corrected tests.
STEPS['phase41_fix1'] = {
    'base': '4e00db7',
    'new_si': [],
    'mod_si': [],
    'files': r'^sys_security_acl_role_(981f759bef634df794e0c96285e48b92|b12a79289d704075843e7ca4ba4c89c8|ba26c467fd554e5b8c3287e096ce7b2e|dbca2e8e80ac4c78b3096fc2da243a59'
             r'|89ec825bb5da4b9baf9e728af13c43c8|4476c63922bb4f2693ea6ad504a76985|7c9d0592656141ddbd2f1384b03716aa|d7171dc18bc5476395a3a1c418246a20)\.xml$',
    'atf': ['c195e6625f8141a28e8d0f34eb05c79b', '3943fb95ed7341bc9d6a7554304c5035', 'e7688ebcbf4f4f36ab1294b705380553', '597c9d2e699945d0bf245cef59ff0a71'],
}


# Phase 41 client sample run: intake numbers were not unique for intakes
# inserted in the same instant (business rule fallback), plus its ATF test.
STEPS['phase41_fix2'] = {
    'base': '4e00db7',
    'new_si': [],
    'mod_si': [],
    'files': r'^(sys_script_02e3ad1ac8084ff3b5fc039b9b900023|sys_atf_test_suite_fc5aebad352146fd876beed00f871088)\.xml$',
    'atf': ['44e53c4c828f47bfb064e267dd77dd19'],
}

# Phase 41 client sample run: the normalization log no longer records fields
# that were not read (empty original value).
STEPS['phase41_fix3'] = {
    'base': '4e00db7',
    'base_files': {'NativeDocumentIntelligenceProvider': 'scripts/deploy/baselines/NativeDocumentIntelligenceProvider.p41_live.js'},
    'new_si': [],
    'mod_si': ['NativeDocumentIntelligenceProvider'],
}


# Phase 41 follow-up (FDI-BE98E1F5): a good reading always creates the AP
# invoice; vendor / PO not found and printed totals that do not reconcile
# become invoice exceptions (printed values kept; Re-run Validation links them).
STEPS['phase41_fix4'] = {
    'base': '4e00db7',
    'base_files': {n: 'scripts/deploy/baselines/' + n + '.p41_live.js' for n in [
        'ApDomainService', 'MatchingEngine', 'FinanceDocumentIntakeService', 'FinanceJourneyService']},
    'new_si': [],
    'mod_si': ['ApDomainService', 'MatchingEngine', 'FinanceDocumentIntakeService', 'FinanceJourneyService'],
    'columns': ['x_695068_bcfa_ap_invoice=printed_vendor_name,printed_vendor_code,printed_po_number'],
    'choices': r'^sys_choice_x_695068_bcfa_ap_exception_reason_code\.xml$',
    'files': r'^sys_atf_test_suite_fc5aebad352146fd876beed00f871088\.xml$',
    'atf': ['dce97236d47a4ebba8395297d6a10d24'],
}


# H41-D10 reads the state the insert produced (the AR intake flow may move the
# payment on before the test reads it back).
STEPS['phase41_fix5'] = {
    'base': '4e00db7',
    'new_si': [],
    'mod_si': [],
    'atf': ['a5e710b603c04c55bfc7e0e5487add80'],
}


# Vendor resolution by the normalized printed name (spacing / case /
# punctuation), only when exactly one active vendor fits; test H41-VEN.
STEPS['phase41_fix6'] = {
    'base': '5dc2181',
    'new_si': [],
    'mod_si': ['MatchingEngine'],
    'files': r'^sys_atf_test_suite_fc5aebad352146fd876beed00f871088\.xml$',
    'atf': ['c14c5a0850f646758f69254571c72363'],
}


# Payment advice correlation without a reference match: a unique unassigned
# bank line also links when the advice customer is resolved (H41-D8).
# Deployed once; its loader was superseded by phase41_fix8 (same change plus
# the swapped-date reading), which is the loader kept in the repository.
STEPS['phase41_fix7'] = {
    'base': '5dc2181',
    'base_files': {'FinanceDocumentIntakeService': 'scripts/deploy/baselines/FinanceDocumentIntakeService.p41_fix4.js'},
    'new_si': [],
    'mod_si': ['FinanceDocumentIntakeService'],
    'atf': ['0cedd6bd2e5a4266838d9c70266eb805'],
}


# Advice date read day / month swapped: both readings searched (H41-D8). The
# live version is the first phase41_fix7 build (hash measured on the instance).
STEPS['phase41_fix8'] = {
    'base': '5dc2181',
    'base_hash': {'FinanceDocumentIntakeService': 1923424934},
    'new_si': [],
    'mod_si': ['FinanceDocumentIntakeService'],
    'atf': ['0cedd6bd2e5a4266838d9c70266eb805'],
}


# Client test kit install-time property (x_695068_bcfa.client_kit.installed_on).
STEPS['client_kit_prop'] = {
    'base': '5dc2181',
    'new_si': [],
    'mod_si': [],
    'files': r'^sys_properties_b876a1e9d8ee4d27a3b6e26ce9ebaaea\.xml$',
}


# Record numbers (FDI0000001, AP00000001, AR00000001, RT00000001) through the
# platform numbering, Number in lists and forms, and "Now Assist" -> "AI" in
# user-facing text (choice labels, hints, UI actions, audit / KPI text).
STEPS['numbers_ai_terms'] = {
    'base': '63b939e',
    'new_si': [],
    'mod_si': ['AuditEngine', 'ApDomainService', 'ArDomainService', 'FinanceAgentTools', 'FinanceKpiService', 'FinancePocScorecard', 'NowAssistSkillClient'],
    'columns': [
        'x_695068_bcfa_ap_invoice=number',
        'x_695068_bcfa_payment=number',
        'x_695068_bcfa_remittance=number',
    ],
    'choices': r'^sys_choice_x_695068_bcfa_(ai_interaction_guardrail_action|ai_interaction_provider|ap_extraction_source|audit_event_actor_type)\.xml$',
    'files': r'^(sys_number_(06f296e0d013467fa76e8f487eaf62de|4e8d1e79e9ee47bcbbca837d6878a86f|9f8c8a18e581485b8a6b4e8853e8ed27|eb046407223a43cb9355946749ddf77e)'
             r'|sys_dictionary_x_695068_bcfa_finance_intake_number'
             r'|sys_documentation_x_695068_bcfa_(ap_exception|ar_exception|payment)_ai_recommendation_en'
             r'|sys_ui_action_(83a2a055103042c8962ed9a56f25bef5|bc2017ca30674afebde162cd93a9aaa6)'
             r'|sys_ux_form_action_(7ad99fb3124b49cbbbc026595a0f95b4|e5b9785bbba24b2cbfb265e471c82392)'
             r'|sys_ux_form_action_layout_item_(0c77e7ea276e4a8a89bb98bb7bc0942f|ef917fbe842f4aed99b76e2485f7e907)'
             r'|sys_ux_list_(3eb9cd097064452fb5a7203309028379|4efabd9d1c8f4463903a115fa8088508|538d8d5edfed4e0e99e676a6a92ec0a5|6c161d4edb934599aa4e41d2e0563a58|e4c850e33d56444182dd38e5a6790358))\.xml$',
    'atf': ['44e53c4c828f47bfb064e267dd77dd19'],
}


# Phase 42: client document hardening. Unicode-safe names and references,
# vendor resolution precedence (code, tax ID, PO, alias, printed name), stamp /
# seal / chop presence evidence and the China stamp requirement (decision
# table built afterwards by phase42_decision_tables_bg.js, scope
# x_695068_bcfa), goods receipt (GRN) documents read as evidence, document
# evidence reviews. Creates three tables (preamble). The extraction use case
# fields are configured by phase40_native_usecases_bg.js (scope global).
STEPS['phase42'] = {
    'base': 'ebd7e88',
    'preamble': 'scripts/deploy/preambles/phase42_evidence_tables.js',
    'new_si': ['DocumentEvidenceService'],
    'mod_si': ['MatchingEngine', 'FinanceDocumentIntakeService', 'ApDomainService', 'FinanceJourneyService', 'FinancePolicy',
               'NativeDocumentIntelligenceProvider', 'DocumentExtractionService'],
    'columns': [
        'x_695068_bcfa_vendor=tax_registration_number',
        'x_695068_bcfa_vendor_alias=vendor,alias_name,language,country_context,match_strength,source,active',
        'x_695068_bcfa_grn_extraction=finance_intake,grn_number,po_number,vendor_name,receipt_date,plant,material_description,material_code,po_line,'
        'quantity_received,uom,received_by,remarks,signature_present,stamp_present,handwritten_text_present,handwritten_values,document_language,'
        'reading_status,critical_fields_missing,sap_receipt,comparison_result,comparison_detail,review_status,raw_extraction,extraction_task,read_on',
        'x_695068_bcfa_document_evidence_review=ap_invoice,grn_extraction,evidence_item,ai_value,human_value,reason,reviewer,reviewed_on',
        'x_695068_bcfa_ap_invoice=printed_vendor_tax_id,stamp_required,stamp_present,stamp_type,stamp_text,stamp_page,stamp_count,stamp_detection_method,'
        'stamp_evidence_status,stamp_ai_finding,stamp_validation_result,stamp_validation_detail,handwriting_status,handwritten_values,'
        'visual_review_required,evidence_reviewed_by,evidence_reviewed_on,evidence_review_decision',
        'x_695068_bcfa_finance_intake=document_language,reader_script_check,stamp_present,stamp_evidence_status,handwriting_status,visual_review_required,grn_extraction',
    ],
    'choices': r'^sys_choice_x_695068_bcfa_(ai_interaction_operation|ap_exception_reason_code|finance_intake_(document_type|handwriting_status|stamp_evidence_status|stamp_present)'
               r'|ap_invoice_(handwriting_status|stamp_detection_method|stamp_evidence_status|stamp_present|stamp_type|stamp_validation_result)'
               r'|document_evidence_review_evidence_item|grn_extraction_(comparison_result|handwritten_text_present|reading_status|review_status|signature_present|stamp_present)'
               r'|vendor_alias_source)\.xml$',
    'files': r'^(sys_documentation_x_695068_bcfa_(vendor_alias|grn_extraction|document_evidence_review)__en'
             r'|sys_properties_(008e1c736d284348802c137e53fc21d8|e8c71bf005904c908e7df5265201cb07)'
             r'|sys_script_(4507e95050c643418ddeabe73a35a1ca|ac6f5ff616b948d087b21bab48f4e47e|bf97d09c69924725a79ff60fe677ec40)'
             r'|sys_security_acl_(2fe60b223b8f4e64954e01888fbfb8e5|6dc6c660a59941f4901f952301eabe88|8857be8366c74355a883b1f9caece57c|9e776f7dbb524bb6ac350a24b8391b3d'
             r'|a9a87308d82e4aac95b332c70af29174|b0469a04def84e4ca849692b4b5edaf4|bbf8b07d9ee24b869c84df0707505bc2)'
             r'|sys_security_acl_role_(057c5e43|6054dd7d|20584275|3cf2ab53|7e0b5734|92781391|da11f55c|db73df5a|db8bb44d|f7a280e7|8e722d90|dd52b3da|635fbf6c|9a7d5dbe'
             r'|0b885ad5|248acf66|36d78454|946ebe81|98d5da01|a06b242d|d840e161|0443ba6d|0cc87413|dcd08e64|38d82f95|49f236fa|c0ae0fe0|d5e93993|f3604323|f473037f|f7dea741)[0-9a-f]{24})\.xml$',
}


# Phase 42 tests: H42-UNI, H42-NUM, H42-VEN, H42-STAMP, H42-GRN in BCFA Regression.
P42_TESTS = ['f3821bf8183043378f39e96b72261128', '2f839d674ea747a383b8869230c7f8a6', '0d0164aafdb7487bbe4bd4308b0fe3de',
             '656248665a0442af88ff296cfea42f86', '6fe27d4475e045819a350b9ad4c6ec00']
STEPS['phase42_tests'] = {
    'base': 'ebd7e88',
    'new_si': [],
    'mod_si': [],
    'files': r'^sys_atf_test_suite_fc5aebad352146fd876beed00f871088\.xml$',
    'atf': P42_TESTS,
}


# Phase 42 workspace: lists (Goods Receipts (evidence), Document Evidence
# Review, Evidence Decisions, Vendor Aliases) and Document Evidence Reviews
# related lists. The form sections come from phase40_forms_bg.js
# (gen_form_layouts.py).
STEPS['phase42_workspace'] = {
    'base': 'ebd7e88',
    'new_si': [],
    'mod_si': [],
    'files': r'^(sys_ux_list_(2169fbfa78b84705b1e2e18c4bbc8008|91ff569367034271a887242cf7c760a1|f062e43a2d6345218a5839994aeebc3a|a59743452abd4a948851449c4abbe6c9)'
             r'|sys_ux_applicability_m2m_list_(ee2573089cfa4b0298ab8adf5482e80a|7eb0be2b5dab49d19ddeb63f7e3da3a7|04033e21b9c74f4fa4055e9733cd766d|158f09bda66e4bb88367f3ce27bb2c36)'
             r'|sys_ui_related_list_1307fa60389c4f1687ec96c9b3d0b532'
             r'|sys_ui_related_list_entry_(d05f559bf12242db95f71af6a69280b6|d6805c0bd9d345b8afc74cfa22405844|65ee05b2dcee4924a0f880822892ff35))\.xml$',
}


# Phase 42 fix 1 (client run): an empty handwriting list ("[]") is not
# handwriting (FDI0000037 was classed "handwriting readable"); the reader
# script check counts every page group of a multi-page document.
STEPS['phase42_fix1'] = {
    'base': 'ebd7e88',
    'base_files': {n: 'scripts/deploy/baselines/' + n + '.p42_live.js' for n in ['DocumentEvidenceService', 'NativeDocumentIntelligenceProvider']},
    'new_si': [],
    'mod_si': ['DocumentEvidenceService', 'NativeDocumentIntelligenceProvider'],
    'atf': ['6fe27d4475e045819a350b9ad4c6ec00'],
}


# Phase 42 fix 2: a handwritten entry reported as PARTIAL / UNREADABLE without
# a value still counts as handwriting present (not readable).
STEPS['phase42_fix2'] = {
    'base': 'ebd7e88',
    'base_files': {'DocumentEvidenceService': 'scripts/deploy/baselines/DocumentEvidenceService.p42_fix1.js'},
    'new_si': [],
    'mod_si': ['DocumentEvidenceService'],
    'atf': ['6fe27d4475e045819a350b9ad4c6ec00'],
}


# Phase 42, Chinese OCR: extraction use-case routing (kind + Document Language
# Hint -> Latin or CJ OCR use case), Document Language Hint on the intake,
# guards against a seller / buyer tax ID swap (tax ID equal to the buyer's is
# not used; tax ID vs printed name conflict goes to a person); tests H42-ROUTE
# and H42-VEN extended. Use cases: phase40_native_usecases_bg.js (scope global,
# regional_hub_enabled so the platform applies each use case's language).
STEPS['phase42_cj'] = {
    'base': 'ebd7e88',
    'base_files': {
        'NativeDocumentIntelligenceProvider': 'scripts/deploy/baselines/NativeDocumentIntelligenceProvider.p42_fix1.js',
        'FinanceDocumentIntakeService': 'scripts/deploy/baselines/FinanceDocumentIntakeService.p42_live.js',
        'MatchingEngine': 'scripts/deploy/baselines/MatchingEngine.p42_live.js',
    },
    'new_si': [],
    'mod_si': ['NativeDocumentIntelligenceProvider', 'FinanceDocumentIntakeService', 'MatchingEngine'],
    'columns': ['x_695068_bcfa_finance_intake=document_language_hint'],
    'choices': r'^sys_choice_x_695068_bcfa_finance_intake_document_language_hint\.xml$',
    'files': r'^sys_atf_test_suite_fc5aebad352146fd876beed00f871088\.xml$',
    'atf': ['97592bc6b13244f9914f19bff1094a66', '0d0164aafdb7487bbe4bd4308b0fe3de'],
}


# Phase 42, Chinese OCR follow-up (CS-18 run, AP00000099: the model read the
# seller and buyer tax IDs swapped): a tax ID that points at another vendor
# than the printed PO is a conflict; a swap confirmed by the vendor master is
# stated on the intake and the seller's ID kept on the invoice.
STEPS['phase42_cj2'] = {
    'base': 'ebd7e88',
    'base_files': {n: 'scripts/deploy/baselines/' + n + '.p42_cj.js' for n in ['FinanceDocumentIntakeService', 'MatchingEngine']},
    'new_si': [],
    'mod_si': ['FinanceDocumentIntakeService', 'MatchingEngine'],
    'atf': ['0d0164aafdb7487bbe4bd4308b0fe3de'],
}


def h(t):
    a = 7
    for ch in t:
        a = (a * 31 + ord(ch)) % 2147483647
    return a


def main(step):
    cfg = STEPS[step]
    guard = []
    for n in cfg['mod_si']:
        rel = 'src/server/script-includes/' + n + '.server.js'
        if n in cfg.get('base_hash', {}):
            # The live version is known only by its hash (measured on the
            # instance), e.g. an intermediate build replaced locally.
            head = None
        elif n in cfg.get('base_files', {}):
            # Live version came from an uncommitted working copy: compare with the saved copy.
            head = io.open(os.path.join(REPO, cfg['base_files'][n]), encoding='utf8').read().replace('\r\n', '\n')
        else:
            head = subprocess.run(['git', 'show', cfg['base'] + ':' + rel], cwd=REPO, capture_output=True, check=True).stdout.decode('utf8').replace('\r\n', '\n')
        work = io.open(os.path.join(REPO, rel), encoding='utf8').read().replace('\r\n', '\n')
        guard.append({'api': 'x_695068_bcfa.' + n, 'head': cfg['base_hash'][n] if head is None else h(head), 'work': h(work)})
    tmp = os.path.join(SCR, 'p40_loader_raw.js')
    args = ['node', 'scripts/deploy/gen_record_loader.mjs', tmp, '--si', ','.join(cfg['new_si'] + cfg['mod_si'])]
    files = cfg.get('files')
    if cfg.get('atf'):
        names = atf_files(cfg['atf'])
        print('atf files', len(names))
        atf_re = '^(' + '|'.join(names) + r')\.xml$'
        files = atf_re if not files else '(' + files + ')|(' + atf_re + ')'
    if files:
        args += ['--files', files]
    if cfg.get('choices'):
        args += ['--choices', cfg['choices']]
    for c in cfg.get('columns', []):
        args += ['--columns', c]
    if cfg.get('preamble'):
        args += ['--preamble', cfg['preamble']]
    if cfg.get('postamble'):
        args += ['--postamble', cfg['postamble']]
    subprocess.run(args, cwd=REPO, check=True)
    loader = io.open(tmp, encoding='utf8').read()
    script = ("// Phase 40 step '" + step + "'. Generated by scripts/deploy/gen_phase40_deploy.py from the now-sdk build.\n"
              "// Run in scope global. Aborts unless each modified script include is live == its source at " + cfg['base'] + "\n"
              "// (or already == this build). Safe to re-run.\n"
              "(function() {\n"
              "function h(t) { var a = 7; for (var i = 0; i < t.length; i++) a = (a * 31 + t.charCodeAt(i)) % 2147483647; return a; }\n"
              "var G = " + json.dumps(guard) + ", drift = [];\n"
              "G.forEach(function(g) { var si = new GlideRecord('sys_script_include'); si.addQuery('api_name', g.api); si.query();\n"
              "  if (!si.next()) { drift.push(g.api + ' missing'); return; }\n"
              "  var v = h(si.getValue('script').replace(/\\r\\n/g, '\\n')); if (v !== g.head && v !== g.work) drift.push(g.api); });\n"
              "if (drift.length) { gs.info('BCFA_DEPLOY ABORTED live script includes differ from source: ' + drift.join(', ')); return; }\n"
              + loader + "\n})();\n")
    dst = os.path.join(REPO, 'scripts', 'deploy', 'phase40_' + step + '_bg.js')
    io.open(dst, 'w', encoding='utf8', newline='\n').write(script)
    print('written', dst, len(script), 'hash', h(script))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'extraction')
