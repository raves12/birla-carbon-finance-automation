// Phase 20 verification. Run in Scripts - Background with scope =
// x_695068_bcfa, after phase20_ai_log_bg.js (global).
//
//   0 backfill: existing rows (all from the legacy Claude client) get
//     provider, capability, process and start/end times
//   1 AP exception (missing vendor): the agentic workflow hand-off opens a
//     'started' row (the workflow itself runs asynchronously as the AI user
//     and completes that row; checked afterwards). A person then runs the
//     Now Assist skills (explanation, next action) and saves the note; the
//     person's decision (request correction) accepts or overrides each
//     recommendation
//   2 AP journey: simulated extraction, approval by the controller -> the
//     extraction is accepted
//   3 AP field correction after extraction -> the extraction is overridden
//   4 AR two-invoice payment: Now Assist match explanation, approval ->
//     accepted
//   5 every row of the run: process, provider, capability, operation, status,
//     timestamps, initiating user; skill rows: input context hash and size,
//     duration; no prompt text stored
var out = [];
var start = new GlideDateTime().getValue();
var tag = 'T20-' + gs.generateGUID().substring(0, 6).toUpperCase();
var U = { apProcessor: 'bcfa.ap.processor', arProcessor: 'bcfa.ar.processor', approver: 'bcfa.finance.approver', controller: 'bcfa.finance.controller' };
var id = {};
var F = ['started_at', 'process', 'provider', 'capability', 'operation', 'skill', 'agent', 'agentic_workflow', 'status', 'confidence', 'latency_ms',
    'input_context_id', 'input_context_size', 'initiated_by', 'human_decision', 'human_accepted', 'human_overridden', 'override_reason'];

function rows(field, value, label) {
    var gr = new GlideRecord('x_695068_bcfa_ai_interaction');
    gr.addQuery(field, value);
    gr.orderBy('sys_created_on');
    gr.query();
    var list = [];
    while (gr.next()) {
        list.push('    ' + F.map(function(f) {
            var v = gr.getDisplayValue(f) || '';
            if (f === 'input_context_id') v = v ? v.substring(0, 19) + '…' : '';
            return v === '' || v === 'false' ? '' : f + '=' + String(v).substring(0, 60);
        }).filter(function(x) { return x; }).join(' | ') +
            (gr.getValue('recommendation') ? '\n      recommendation: ' + gr.getValue('recommendation').replace(/\s+/g, ' ').substring(0, 140) : ''));
    }
    out.push(label + ' (' + list.length + ' AI interactions):\n' + list.join('\n'));
}
function insert(table, fields) {
    var gr = new GlideRecord(table);
    gr.initialize();
    for (var f in fields) gr.setValue(f, fields[f]);
    return gr.insert();
}

try {
    for (var key in U) {
        var user = new GlideRecord('sys_user');
        if (!user.get('user_name', U[key])) throw 'Missing demo user ' + U[key];
        id[key] = user.getUniqueValue();
    }
    out.push('provider property: ' + new FinancePolicy().aiProvider());

    // 0 backfill
    var legacy = new GlideRecord('x_695068_bcfa_ai_interaction');
    legacy.addNullQuery('provider');
    legacy.query();
    var n = 0;
    while (legacy.next()) {
        var op = legacy.getValue('operation') || '';
        legacy.setValue('provider', 'claude_legacy');
        legacy.setValue('process', AuditEngine.PROCESS_BY_TABLE[legacy.getValue('source_table')] || 'platform');
        legacy.setValue('capability', /^extract/.test(op) ? 'document_extraction' : /^classify/.test(op) ? 'document_classification' :
            /^explain/.test(op) ? 'exception_explanation' : op === 'recommend_cash_match' ? 'cash_match_recommendation' :
            op === 'rank_candidates' ? 'candidate_ranking' : 'connectivity_test');
        legacy.setValue('started_at', legacy.getValue('sys_created_on'));
        legacy.setValue('completed_at', legacy.getValue('sys_created_on'));
        legacy.setWorkflow(false);
        legacy.update();
        n++;
    }
    var byProvider = new GlideAggregate('x_695068_bcfa_ai_interaction');
    byProvider.addAggregate('COUNT');
    byProvider.groupBy('provider');
    byProvider.query();
    var counts = [];
    while (byProvider.next()) counts.push((byProvider.getValue('provider') || 'empty') + '=' + byProvider.getAggregate('COUNT'));
    out.push('0 backfill: ' + n + ' legacy rows; by provider ' + counts.join(', '));

    // 1 AP exception, skills, human decision
    var ap = new ApDomainService();
    var vendor = new GlideRecord('x_695068_bcfa_vendor');
    vendor.get('vendor_code', 'V002');
    var inv1 = ap.intakeInvoice({ invoiceNumber: tag + '-AP1', companyCode: '1000', currency: 'INR', grossAmount: 1180, netAmount: 1000, taxAmount: 180, source: 'manual' });
    ap.runExtraction(inv1.apInvoiceSysId, {});
    var v1 = ap.validateInvoice(inv1.apInvoiceSysId);
    var exc = v1.exceptionSysId;
    var tools = new FinanceAgentTools();
    var explanation = tools.explainApException(exc);
    var recommendation = tools.recommendApNextAction(exc);
    var note = 'AI REVIEW (advisory only - a human must decide)\n\nExplanation:\n' + (explanation.ok ? explanation.text : explanation.message) +
        '\n\nRecommended next action:\n' + (recommendation.ok ? recommendation.text : recommendation.message);
    var saved = tools.recordExceptionAdvice('ap', exc, note);
    out.push('1 skills: explanation ' + (explanation.ok ? 'ok' : explanation.error) + ', next action ' + (recommendation.ok ? 'ok' : recommendation.error) +
        ', note saved ' + saved.ok);
    var decided = new ApExceptionDecisionService().decide(exc, 'request_correction', tag + ': asked the vendor for a corrected invoice with the vendor code.');
    out.push('1 human decision request_correction: ' + (decided.error || 'ok'));
    rows('source_record', exc, '1 AP exception');

    // 2 AP journey, approved
    var inv2 = ap.intakeInvoice({ invoiceNumber: tag + '-AP2', vendor: vendor.getUniqueValue(), companyCode: '1000', currency: 'INR', grossAmount: 1180, netAmount: 1000, taxAmount: 180, source: 'manual' });
    ap.runExtraction(inv2.apInvoiceSysId, {});
    ap.validateInvoice(inv2.apInvoiceSysId);
    ap.matchInvoice(inv2.apInvoiceSysId);
    var route = ap.routeForApproval(inv2.apInvoiceSysId, id.apProcessor);
    var d2 = route.approvalRequired ? ap.decideApproval(inv2.apInvoiceSysId, route.approvalSysId, 'approved', id.controller, tag + ': approved.') : route.decision;
    out.push('2 AP2 approval: ' + (d2.error || d2.decision));
    rows('correlation_id', inv2.correlationId, '2 AP2');

    // 3 correction after extraction
    var inv3 = ap.intakeInvoice({ invoiceNumber: tag + '-AP3', vendor: vendor.getUniqueValue(), companyCode: '1000', currency: 'INR', grossAmount: 1180, netAmount: 1000, taxAmount: 180, source: 'manual' });
    ap.runExtraction(inv3.apInvoiceSysId, {});
    var fix = new GlideRecord('x_695068_bcfa_ap_invoice');
    fix.get(inv3.apInvoiceSysId);
    fix.setValue('invoice_date', '2026-09-26');
    fix.setValue('tax_amount', 180.5);
    fix.update();
    rows('correlation_id', inv3.correlationId, '3 AP3');

    // 4 AR match explanation, approved
    var ar = new ArDomainService();
    var customer = insert('x_695068_bcfa_customer', { customer_code: tag, name: 'TEST20 Customer ' + tag, company_code: '1000', country: 'India', currency: 'INR', active: true });
    insert('x_695068_bcfa_ar_open_item', { item_number: tag + '-A', customer: customer, company_code: '1000', currency: 'INR', invoice_amount: 7000, open_amount: 7000, status: 'open' });
    insert('x_695068_bcfa_ar_open_item', { item_number: tag + '-B', customer: customer, company_code: '1000', currency: 'INR', invoice_amount: 3000, open_amount: 3000, status: 'open' });
    var pay = ar.intakePayment({ bankReference: 'BANK-' + tag, customer: customer, currency: 'INR', amount: 10000, bankAccount: 'IN-COLL-TEST20', idempotencyKey: tag + '-PAY' });
    ar.normalizePayment(pay.paymentSysId);
    ar.resolveCustomer(pay.paymentSysId, '');
    ar.matchPayment(pay.paymentSysId);
    var alloc = ar.allocatePayment(pay.paymentSysId);
    var arRoute = alloc.balanced ? ar.routeForApproval(pay.paymentSysId, id.arProcessor) : null;
    var d4 = arRoute && arRoute.approvalRequired ? ar.decideApproval(pay.paymentSysId, arRoute.approvalSysId, 'approved', id.approver, tag + ': approved.') : { error: 'not routed ' + JSON.stringify(alloc) };
    out.push('4 AR approval: ' + (d4.error || d4.decision));
    rows('correlation_id', pay.correlationId, '4 AR');

    // 5 field checks
    var all = new GlideRecord('x_695068_bcfa_ai_interaction');
    all.addQuery('sys_created_on', '>=', start);
    all.query();
    var total = 0;
    var missing = [];
    var skillRows = 0;
    var skillIssues = [];
    while (all.next()) {
        total++;
        ['process', 'provider', 'capability', 'operation', 'status', 'started_at', 'initiated_by'].forEach(function(f) {
            if (!all.getValue(f)) missing.push(all.getUniqueValue().substring(0, 8) + ':' + f);
        });
        if (all.getValue('status') !== 'started' && !all.getValue('completed_at')) missing.push(all.getUniqueValue().substring(0, 8) + ':completed_at');
        if (all.getValue('provider') === 'now_assist' && all.getValue('skill') && all.getValue('capability') !== 'exception_review') {
            skillRows++;
            if (!/^sha256:[0-9a-f]{64}$/.test(all.getValue('input_context_id') || '')) skillIssues.push('context id');
            if (!(parseInt(all.getValue('input_context_size'), 10) > 0)) skillIssues.push('context size');
            if (!(parseInt(all.getValue('latency_ms'), 10) > 0)) skillIssues.push('duration');
        }
    }
    out.push('5 ' + total + ' AI interactions this run; missing required fields: ' + (missing.length ? missing.join(', ') + ' FAIL' : 'none PASS'));
    out.push('5 ' + skillRows + ' Now Assist skill rows; context hash/size/duration: ' + (skillIssues.length ? skillIssues.join(', ') + ' FAIL' : 'PASS'));
    out.push('5 prompt columns on the table: ' + (new GlideRecord('x_695068_bcfa_ai_interaction').isValidField('prompt') ? 'FAIL prompt column exists' : 'none PASS'));
    out.push('workflow run to check afterwards: exception ' + exc);
} catch (err) {
    out.push('ERROR ' + err + (err && err.stack ? ' ' + err.stack : ''));
}
gs.info('BCFA_P20 ' + out.join('\n'));
