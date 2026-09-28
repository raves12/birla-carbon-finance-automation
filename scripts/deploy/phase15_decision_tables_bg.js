// Phase 15: builds the three BCFA decision tables (Decision Builder) through
// the supported sn_dt.DecisionTableAPI, the same API the platform's own
// Document Intelligence code uses. No decision-table record is written
// directly. Run in Scripts - Background with scope = x_695068_bcfa (so the
// tables belong to the app), after phase15_policy_bg.js (global).
//
// Idempotent: a table that already exists is left alone, unless REBUILD is
// true, in which case it is deleted through the same API and rebuilt.
// Afterwards every table is evaluated with sample inputs through
// FinancePolicy (the code the app uses) and the results are printed with
// the expected values. Rows are evaluated first match, in order.
//
// All values are POC ASSUMPTIONS, not Birla Carbon production policy.
var REBUILD = false;
var GROUP = {
    approvers: 'e34ee8a159fd504893d4fc248a6632a7',    // BCFA Finance Approvers
    controllers: 'f1c12aaee7e9ac7e31fc871b0eca266b',  // BCFA Finance Controllers
    cashApplication: 'a42557739c621c40c2570c9fa414cc46' // BCFA Cash Application
};
var SCOPE_ID = '229ba2b1a079431e104010f5ea883e85';
var TOLERANCE_TYPES = 'quantity_tolerance,price_tolerance,tax_validation,line_total_mismatch';

// Row conditions use the input element names; {company} etc. are replaced
// with the element the API actually created for that input.
var TABLES = [
    {
        name: 'BCFA AP Tolerance',
        description: 'AP 3-way match tolerances by company, vendor country, vendor type and invoice type (POC ASSUMPTION).',
        inputs: [
            { name: 'company', label: 'Company', type: 'string', operator: '=' },
            { name: 'country', label: 'Country', type: 'string', operator: '=' },
            { name: 'vendor_type', label: 'Vendor Type', type: 'string', operator: '=' },
            { name: 'invoice_type', label: 'Invoice Type', type: 'string', operator: '=' }
        ],
        outputs: [
            { name: 'quantity_tolerance_pct', label: 'Quantity Tolerance Pct', type: 'decimal' },
            { name: 'price_tolerance_pct', label: 'Price Tolerance Pct', type: 'decimal' },
            { name: 'tax_tolerance_abs', label: 'Tax Tolerance Abs', type: 'decimal' },
            { name: 'tax_tolerance_pct', label: 'Tax Tolerance Pct', type: 'decimal' }
        ],
        rows: [
            { label: 'Strategic vendors (POC example; no vendor has this type yet)', condition: '{vendor_type}=strategic',
                values: { quantity_tolerance_pct: '0.05', price_tolerance_pct: '0.02', tax_tolerance_abs: '1', tax_tolerance_pct: '0.02' } },
            { label: 'Default', condition: '{company}ANYTHING',
                values: { quantity_tolerance_pct: '0.02', price_tolerance_pct: '0.02', tax_tolerance_abs: '1', tax_tolerance_pct: '0.02' } }
        ]
    },
    {
        name: 'BCFA AP Approval',
        description: 'Whether an AP invoice needs approval and which group approves it, by amount, exception type, variance and company (POC ASSUMPTION).',
        inputs: [
            { name: 'amount', label: 'Amount', type: 'decimal', operator: '>' },
            { name: 'exception_type', label: 'Exception Type', type: 'string', operator: '=' },
            { name: 'variance_pct', label: 'Variance Pct', type: 'decimal', operator: '>' },
            { name: 'company', label: 'Company', type: 'string', operator: '=' }
        ],
        outputs: [
            { name: 'approval_required', label: 'Approval Required', type: 'boolean' },
            { name: 'approval_group', label: 'Approval Group', type: 'reference', reference: 'sys_user_group' }
        ],
        rows: [
            { label: 'Tolerance override above 10% variance', condition: '{exception_type}IN' + TOLERANCE_TYPES + '^{variance_pct}>10',
                values: { approval_required: 'true', approval_group: GROUP.controllers } },
            { label: 'High value above 1,000,000', condition: '{amount}>1000000',
                values: { approval_required: 'true', approval_group: GROUP.controllers } },
            { label: 'Default', condition: '{company}ANYTHING',
                values: { approval_required: 'true', approval_group: GROUP.approvers } }
        ]
    },
    {
        name: 'BCFA AR Deduction',
        description: 'Whether a cash application deduction is allowed and whether it needs a finance approver, by deduction type, amount and company (POC ASSUMPTION).',
        inputs: [
            { name: 'deduction_type', label: 'Deduction Type', type: 'string', operator: '=' },
            { name: 'amount', label: 'Amount', type: 'decimal', operator: '<=' },
            { name: 'company', label: 'Company', type: 'string', operator: '=' }
        ],
        outputs: [
            { name: 'allowed', label: 'Allowed', type: 'boolean' },
            { name: 'approval_required', label: 'Approval Required', type: 'boolean' },
            { name: 'approval_group', label: 'Approval Group', type: 'reference', reference: 'sys_user_group' }
        ],
        rows: [
            { label: 'Bank charge, TCS or credit note up to 5,000', condition: '{deduction_type}INbank_charge,tcs,credit_note_netting^{amount}<=5000',
                values: { allowed: 'true', approval_required: 'false', approval_group: GROUP.cashApplication } },
            { label: 'Allowed types above 5,000, and any unexplained short pay', condition: '{deduction_type}INbank_charge,tcs,credit_note_netting,short_pay',
                values: { allowed: 'true', approval_required: 'true', approval_group: GROUP.approvers } },
            { label: 'Any other type (e.g. unapplied cash) is not a deduction', condition: '{deduction_type}ANYTHING',
                values: { allowed: 'false', approval_required: 'true', approval_group: GROUP.approvers } }
        ]
    }
];

var out = [];
var api = new sn_dt.DecisionTableAPI();

function isSuccess(response) {
    return response && String(response.status).toLowerCase() === 'success';
}
function errorsOf(response) {
    if (!response) return 'no response';
    var parts = [];
    ['status', 'errors', 'errorCode', 'errorMessage', 'message', 'results'].forEach(function(key) {
        if (response[key] === undefined) return;
        try { parts.push(key + '=' + JSON.stringify(response[key])); } catch (e) { parts.push(key + '=' + response[key]); }
    });
    return parts.join(' ');
}
var builder = new sn_dt.DecisionTableBuilderAPI();
function existingTable(name) {
    var table = new GlideRecord('sys_decision');
    table.addQuery('name', name);
    table.addQuery('sys_scope', SCOPE_ID);
    table.query();
    return table.next() ? table.getUniqueValue() : null;
}
function questionCount(tableId) {
    var q = new GlideRecord('sys_decision_question');
    q.addQuery('decision_table', tableId);
    q.addQuery('default_answer', false);
    q.query();
    return q.getRowCount();
}

function build(spec) {
    var tableId = existingTable(spec.name);
    // A table without rows is an incomplete earlier build: rebuild it.
    if (tableId && (REBUILD || questionCount(tableId) === 0)) {
        out.push(spec.name + ': deleted for rebuild (' + errorsOf(api.deleteDecisionTable(tableId)) + ')');
        tableId = null;
    }
    if (tableId) {
        out.push(spec.name + ': already exists (' + tableId + ', ' + questionCount(tableId) + ' rows), not rebuilt');
        return tableId;
    }

    var created = api.createDecisionTable({ name: spec.name, label: spec.name, description: spec.description, scope: 'x_695068_bcfa', accessibleFrom: 'public' });
    if (!isSuccess(created)) throw spec.name + ': createDecisionTable failed ' + errorsOf(created);
    tableId = created.record.getValue('sys_id');

    // Inputs: record-shaped, as Decision Builder's own DecisionInputRepository
    // sends them (internal_type, label, element required).
    var element = {};
    var inputIds = {};
    var elementReport = [];
    for (var j = 0; j < spec.inputs.length; j++) {
        var inputSpec = spec.inputs[j];
        var input = builder.createInput({ model: tableId, label: inputSpec.label, element: inputSpec.name, internal_type: inputSpec.type,
            max_length: inputSpec.type === 'string' ? 100 : 40, mandatory: false, active: true, order: (j + 1) * 100 });
        if (!isSuccess(input)) throw spec.name + ': createInput ' + inputSpec.name + ' failed ' + errorsOf(input);
        element[inputSpec.name] = input.record.getValue('element');
        inputIds[inputSpec.name] = input.record.getValue('sys_id');
        elementReport.push(inputSpec.name + '->' + input.record.getValue('element'));
    }

    // Grid columns in Decision Builder (display only; rows carry the logic).
    var conditionPayload = [];
    for (var c = 0; c < spec.inputs.length; c++) {
        conditionPayload.push({ label: spec.inputs[c].label, decisionInput: inputIds[spec.inputs[c].name], defaultOperator: spec.inputs[c].operator });
    }
    var conditions = api.createConditions(tableId, conditionPayload);

    // Outputs (result elements), same record shape (AnswerElementRepository).
    var outputReport = [];
    for (var o = 0; o < spec.outputs.length; o++) {
        var outputSpec = spec.outputs[o];
        var outputFields = { model: tableId, label: outputSpec.label, element: outputSpec.name, internal_type: outputSpec.type,
            max_length: 40, active: true, order: (o + 1) * 100 };
        if (outputSpec.reference) outputFields.reference = outputSpec.reference;
        var created = builder.createAnswerElement(outputFields);
        if (!isSuccess(created)) throw spec.name + ': createAnswerElement ' + outputSpec.name + ' failed ' + errorsOf(created);
        outputReport.push(outputSpec.name + '->' + created.record.getValue('element'));
    }

    var questions = [];
    for (var r = 0; r < spec.rows.length; r++) {
        var row = spec.rows[r];
        var answerValues = { label: row.label };
        for (var key in row.values) answerValues[key] = row.values[key];
        var answerId = api.findOrCreateMultipleAnswerRecord(tableId, answerValues);
        var condition = row.condition.replace(/\{([a-z_]+)\}/g, function(match, name) { return element[name] || name; }) + '^EQ';
        questions.push({ label: spec.name + ' - ' + row.label, condition: condition, answer: String(answerId), order: (r + 1) * 100 });
    }
    // Rows (decisions), record-shaped, one at a time.
    var rowErrors = [];
    for (var q = 0; q < questions.length; q++) {
        var createdRow = builder.createQuestion({ decision_table: tableId, label: questions[q].label, condition: questions[q].condition,
            answer: questions[q].answer, order: questions[q].order, default_answer: false, active: true });
        if (!isSuccess(createdRow)) rowErrors.push(questions[q].label + ': ' + errorsOf(createdRow));
    }
    out.push(spec.name + ': created ' + tableId + ' | inputs ' + elementReport.join(', ') + ' | columns ' + (isSuccess(conditions) ? 'ok' : errorsOf(conditions)) +
        ' | outputs ' + outputReport.join(', ') + ' | rows ' + questionCount(tableId) + '/' + questions.length +
        (rowErrors.length ? ' | ROW ERRORS ' + rowErrors.join('; ') : '') + ' | first condition: ' + questions[0].condition);
    if (questionCount(tableId) < questions.length) throw spec.name + ': not all rows were created';
    return tableId;
}

function check(label, actual, expected) {
    var pass = String(actual) === String(expected);
    out.push((pass ? 'PASS ' : 'FAIL ') + label + ': got ' + actual + (pass ? '' : ', expected ' + expected));
}

try {
    if (gs.getCurrentScopeName() !== 'x_695068_bcfa') throw 'Run this in scope x_695068_bcfa (current: ' + gs.getCurrentScopeName() + ')';
    for (var t = 0; t < TABLES.length; t++) build(TABLES[t]);

    // Evaluate through FinancePolicy, exactly as the app does.
    var policy = new FinancePolicy();
    var tol = policy.apTolerances({ company: '1000', country: 'India', vendorType: 'standard', invoiceType: 'po' });
    check('AP tolerance default: quantity', tol.quantityPct, 0.02);
    check('AP tolerance source', tol.source.indexOf('decision table') === 0, true);
    var strategic = policy.apTolerances({ company: '1000', country: 'Germany', vendorType: 'strategic', invoiceType: 'po' });
    check('AP tolerance strategic vendor: quantity', strategic.quantityPct, 0.05);

    var clean = policy.apApprovalDecision({ amount: 5900, exceptionType: 'none', variancePct: 0, company: '1000' });
    check('AP approval clean 5,900: required', clean.required, true);
    check('AP approval clean 5,900: group Finance Approvers', clean.group, GROUP.approvers);
    var override50 = policy.apApprovalDecision({ amount: 8925, exceptionType: 'quantity_tolerance', variancePct: 50, company: '1000' });
    check('AP approval quantity override at 50%: group Finance Controllers', override50.group, GROUP.controllers);
    var override5 = policy.apApprovalDecision({ amount: 8925, exceptionType: 'price_tolerance', variancePct: 5, company: '1000' });
    check('AP approval price override at 5%: group Finance Approvers', override5.group, GROUP.approvers);
    var big = policy.apApprovalDecision({ amount: 2500000, exceptionType: 'none', variancePct: 0, company: '1000' });
    check('AP approval 2,500,000: group Finance Controllers', big.group, GROUP.controllers);
    check('AP approval source', clean.source.indexOf('decision table') === 0, true);

    var bank = policy.arDeductionDecision({ deductionType: 'bank_charge', amount: 500, company: '1000' });
    check('AR bank charge 500: allowed', bank.allowed, true);
    check('AR bank charge 500: approval required', bank.approvalRequired, false);
    var bankBig = policy.arDeductionDecision({ deductionType: 'bank_charge', amount: 7000, company: '1000' });
    check('AR bank charge 7,000: approval required', bankBig.approvalRequired, true);
    var shortPay = policy.arDeductionDecision({ deductionType: 'short_pay', amount: 300, company: '1000' });
    check('AR short pay 300: approval required', shortPay.approvalRequired, true);
    var unapplied = policy.arDeductionDecision({ deductionType: 'unapplied', amount: 100, company: '1000' });
    check('AR unapplied 100: allowed', unapplied.allowed, false);
    check('AR deduction source', bank.source.indexOf('decision table') === 0, true);
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_DT ' + out.join('\n'));
