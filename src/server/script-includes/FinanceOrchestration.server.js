// Flow orchestration (Phase 25). The BCFA flows (Flow Designer) own the
// hand-offs of the AP and AR pipelines: each flow's record trigger fires the
// event x_695068_bcfa.flow.stage (parm1 = stage) and the script action
// "BCFA - Run Flow Stage" calls run(stage, record). Each stage runs one
// deterministic step of the existing domain services, and only when the
// record is still in the state the stage expects (so a stage never runs
// twice, and a flow triggered after the record moved on does nothing).
//
// Modes (property x_695068_bcfa.orchestration.mode):
//   flow   (default) the domain services do one step and the flows continue
//   inline the domain services chain the steps synchronously (seeding, tests,
//          and FinanceOrchestration.runInline(fn) for one call)
//
// AI runs only at its appointed points: extraction (in the intake stage), the
// agentic exception review (its own Now Assist trigger on exception creation)
// and the multi-invoice match explanation (in the AR match stage). Approval,
// posting, clearing, reconciliation and aging are deterministic.
var FinanceOrchestration = Class.create();

FinanceOrchestration.PROPERTY = 'x_695068_bcfa.orchestration.mode';
FinanceOrchestration.EVENT = 'x_695068_bcfa.flow.stage';
FinanceOrchestration._inlineDepth = 0;

// True when the domain services should chain steps themselves.
// Phase 41: with real SAP (x_695068_bcfa.sap.adapter = real_sap) the inline
// property is ignored: inline mode posts and clears inside the approver's own
// transaction, which is fine for the instant MOCK SAP but not for SAP calls
// that take seconds or time out. The flows run them in the background
// (event + script action). runInline (seeding, tests) still forces inline.
FinanceOrchestration.isInline = function() {
    if (FinanceOrchestration._inlineDepth > 0) return true;
    return gs.getProperty(FinanceOrchestration.PROPERTY, 'flow') === 'inline' && new FinancePolicy().sapAdapter() !== 'real_sap';
};

// Runs fn with synchronous (inline) chaining, whatever the property says.
FinanceOrchestration.runInline = function(fn) {
    FinanceOrchestration._inlineDepth++;
    try {
        return fn();
    } finally {
        FinanceOrchestration._inlineDepth--;
    }
};

FinanceOrchestration.prototype = {
    initialize: function() {
        this.audit = new AuditEngine();
    },

    // Returns { stage, outcome: 'ran' | 'skipped' | 'error', detail }.
    run: function(stage, sysId) {
        var handler = this['_' + stage];
        if (!handler) return this._result(stage, 'error', 'Unknown stage ' + stage);
        if (FinanceOrchestration.isInline()) return this._result(stage, 'skipped', 'inline orchestration: the domain service chains this step itself');
        try {
            var r = handler.call(this, sysId) || this._result(stage, 'skipped', 'no work');
            r.stage = stage;
            if (r.outcome !== 'skipped') gs.info('BCFA flow stage ' + stage + ' ' + sysId + ': ' + r.outcome + ' - ' + r.detail);
            return r;
        } catch (e) {
            gs.error('BCFA flow stage ' + stage + ' ' + sysId + ' failed: ' + e);
            return this._result(stage, 'error', String(e));
        }
    },

    // --- Accounts Payable -----------------------------------------------------

    // AP Invoice Intake Flow: a new invoice is extracted. An invoice created
    // from an uploaded document already has its extraction evidence.
    _ap_intake: function(id) {
        var inv = this._get('x_695068_bcfa_ap_invoice', id);
        if (!inv || inv.getValue('state') !== 'RECEIVED') return this._skip(inv, 'RECEIVED');
        var ap = new ApDomainService();
        if (this._exists('x_695068_bcfa_ap_extraction', 'ap_invoice=' + id)) {
            ap._setState(id, 'EXTRACTED', null, 'Extraction from the uploaded document (Document Intake)');
            return this._ran('extraction already recorded from the uploaded document');
        }
        var ex = ap.runExtraction(id, {});
        return this._ran('extraction confidence ' + ex.confidence);
    },

    // AP Validation Flow: validation, then duplicate check and 3-way match.
    _ap_validation: function(id) {
        var inv = this._get('x_695068_bcfa_ap_invoice', id);
        if (!inv || inv.getValue('state') !== 'EXTRACTED') return this._skip(inv, 'EXTRACTED');
        return this._validateAndMatch(id);
    },

    // AP Exception Flow: after Resolve & Retry, re-validate and re-match.
    _ap_exception: function(exceptionId) {
        var ex = this._get('x_695068_bcfa_ap_exception', exceptionId);
        if (!ex || ex.getValue('status') !== 'resolved') return this._result('ap_exception', 'skipped', 'exception not resolved');
        var id = ex.getValue('ap_invoice');
        var inv = this._get('x_695068_bcfa_ap_invoice', id);
        if (!inv || inv.getValue('state') !== 'RESOLUTION') return this._skip(inv, 'RESOLUTION');
        new ApDomainService()._setState(id, 'VALIDATING', null, 'Re-validating after correction (AP Exception Flow)');
        return this._validateAndMatch(id);
    },

    // AP Approval Flow: a matched invoice gets the configured approval rule.
    _ap_approval: function(id) {
        var inv = this._get('x_695068_bcfa_ap_invoice', id);
        if (!inv || inv.getValue('state') !== 'MATCHED') return this._skip(inv, 'MATCHED');
        if (this._exists('x_695068_bcfa_ap_approval', 'ap_invoice=' + id + '^decision=pending')) return this._result('ap_approval', 'skipped', 'approval already pending');
        var r = new ApDomainService().routeForApproval(id, this._requester(inv));
        return this._ran(r.approvalRequired ? 'approval requested: ' + r.rule : 'approved by configured rule: ' + r.rule);
    },

    // AP Integration Flow: an approved invoice is posted (IntegrationService).
    _ap_integration: function(id) {
        var inv = this._get('x_695068_bcfa_ap_invoice', id);
        if (!inv || inv.getValue('state') !== 'APPROVED' || inv.getValue('approval_state') !== 'approved') return this._skip(inv, 'APPROVED');
        var r = new ApDomainService().postInvoice(id);
        return this._ran(r.posted ? 'posted ' + r.sapDocumentId : r.unknownOutcome ? 'unknown outcome' : 'posting failed: ' + (r.reasonCode || r.error));
    },

    // AP Reconciliation Flow: an unknown posting outcome is resolved by a
    // status query, never by a blind retry.
    _ap_reconciliation: function(id) {
        var inv = this._get('x_695068_bcfa_ap_invoice', id);
        if (!inv || inv.getValue('state') !== 'UNKNOWN_OUTCOME') return this._skip(inv, 'UNKNOWN_OUTCOME');
        var txn = this._unknownTxn('x_695068_bcfa_ap_invoice', id);
        if (!txn) return this._result('ap_reconciliation', 'error', 'no unknown-outcome transaction found');
        var r = new ApDomainService().reconcilePosting(id, txn);
        return this._ran(r.posted ? 'confirmed posted ' + r.sapDocumentId : r.failed ? 'integration exception' : 'retried');
    },

    // AP Aging/Escalation Flow: one open AP exception aged, SLA, escalation.
    _ap_aging: function(exceptionId) {
        var r = new ExceptionEngine().sweepOne('ap', exceptionId);
        return this._ran(JSON.stringify(r));
    },

    // --- Accounts Receivable ---------------------------------------------------

    // AR Payment Intake Flow: normalize and identify the customer.
    _ar_intake: function(id) {
        var pay = this._get('x_695068_bcfa_payment', id);
        if (!pay || pay.getValue('state') !== 'RECEIVED') return this._skip(pay, 'RECEIVED');
        var ar = new ArDomainService();
        var n = ar.normalizePayment(id);
        if (!n.normalized) return this._ran('normalization exception');
        var c = ar.resolveCustomer(id, '');
        return this._ran(c.resolved ? 'customer identified' : 'customer resolution exception');
    },

    // AR Remittance Processing Flow: a remittance that arrives for a payment
    // stuck on matching resolves that exception and retries the match.
    _ar_remittance: function(remittanceId) {
        var rem = this._get('x_695068_bcfa_remittance', remittanceId);
        if (!rem || !rem.getValue('payment')) return this._result('ar_remittance', 'skipped', 'remittance not linked to a payment');
        var paymentId = rem.getValue('payment');
        var pay = this._get('x_695068_bcfa_payment', paymentId);
        if (!pay || pay.getValue('state') !== 'EXCEPTION') return this._result('ar_remittance', 'skipped', 'payment is ' + (pay ? pay.getValue('state') : 'missing') + '; matching will use the remittance');
        // Phase 33: identifies the customer with the remittance first (a
        // customer_ambiguous payment has none), then resolves and retries.
        var r = new ArDomainService().retryWithRemittance(paymentId, remittanceId, '');
        if (!r.retried) return this._result('ar_remittance', 'skipped', r.reason);
        return this._ran('exception ' + r.exceptionNumber + ' resolved; payment re-matching');
    },

    // AR Match Flow: remittance, exact, combination and multi-invoice match,
    // then allocation (with the AI match explanation for multi-invoice).
    _ar_match: function(id) {
        var pay = this._get('x_695068_bcfa_payment', id);
        if (!pay) return this._skip(pay, 'CUSTOMER_RESOLUTION');
        var st = pay.getValue('state');
        if (!((st === 'CUSTOMER_RESOLUTION' && pay.getValue('customer')) || st === 'MATCHING')) return this._skip(pay, 'CUSTOMER_RESOLUTION (identified) or MATCHING');
        return this._matchAndAllocate(id);
    },

    // AR Exception Flow: after Resolve & Retry, re-match and re-allocate.
    _ar_exception: function(exceptionId) {
        var ex = this._get('x_695068_bcfa_ar_exception', exceptionId);
        if (!ex || ex.getValue('status') !== 'resolved') return this._result('ar_exception', 'skipped', 'exception not resolved');
        var id = ex.getValue('payment');
        var pay = this._get('x_695068_bcfa_payment', id);
        if (!pay || pay.getValue('state') !== 'MATCHING') return this._skip(pay, 'MATCHING');
        return this._matchAndAllocate(id);
    },

    // AR Approval Flow: a balanced payment gets the configured approval rule.
    _ar_approval: function(id) {
        var pay = this._get('x_695068_bcfa_payment', id);
        if (!pay || pay.getValue('state') !== 'PENDING_APPROVAL') return this._skip(pay, 'PENDING_APPROVAL');
        if (this._exists('x_695068_bcfa_ar_approval', 'payment=' + id + '^decision=pending')) return this._result('ar_approval', 'skipped', 'approval already pending');
        var r = new ArDomainService().routeForApproval(id, this._requester(pay));
        return this._ran(r.approvalRequired ? 'approval requested: ' + r.rule : 'approved by configured rule: ' + r.rule);
    },

    // AR Clearing Flow: an approved payment is cleared (IntegrationService).
    _ar_clearing: function(id) {
        var pay = this._get('x_695068_bcfa_payment', id);
        if (!pay || pay.getValue('state') !== 'APPROVED') return this._skip(pay, 'APPROVED');
        var r = new ArDomainService().clearPayment(id);
        return this._ran(r.cleared ? 'cleared ' + r.sapDocumentId : r.unknownOutcome ? 'unknown outcome' : 'clearing failed: ' + (r.reasonCode || r.error));
    },

    // AR Reconciliation Flow: an unknown clearing outcome is resolved by a
    // status query.
    _ar_reconciliation: function(id) {
        var pay = this._get('x_695068_bcfa_payment', id);
        if (!pay || pay.getValue('state') !== 'UNKNOWN_OUTCOME') return this._skip(pay, 'UNKNOWN_OUTCOME');
        var txn = this._unknownTxn('x_695068_bcfa_payment', id);
        if (!txn) return this._result('ar_reconciliation', 'error', 'no unknown-outcome transaction found');
        var r = new ArDomainService().reconcileClearing(id, txn);
        return this._ran(r.cleared ? 'confirmed cleared ' + r.sapDocumentId : r.failed ? 'integration exception' : 'retried');
    },

    // AR Aging/Escalation Flow: one open AR exception aged, SLA, escalation.
    _ar_aging: function(exceptionId) {
        var r = new ExceptionEngine().sweepOne('ar', exceptionId);
        return this._ran(JSON.stringify(r));
    },

    // --- helpers ---------------------------------------------------------------

    _validateAndMatch: function(id) {
        var ap = new ApDomainService();
        var v = ap.validateInvoice(id);
        if (!v.validated) return this._ran('validation exception ' + v.reasonCode);
        var m = ap.matchInvoice(id);
        return this._ran(m.matched ? 'matched within tolerance' : 'match exception ' + m.reasonCode);
    },

    _matchAndAllocate: function(id) {
        var ar = new ArDomainService();
        var m = ar.matchPayment(id);
        if (!m.matched) return this._ran('match exception ' + (m.reasonCode || 'unmatched'));
        var a = ar.allocatePayment(id);
        return this._ran(a.balanced ? 'allocated ' + a.allocatedTotal + ' (' + a.candidateType + ')' : 'allocation exception ' + a.reasonCode);
    },

    // The person who created the record requests the approval (segregation
    // of duties then keeps them from approving it).
    _requester: function(gr) {
        var u = new GlideRecord('sys_user');
        return u.get('user_name', gr.getValue('sys_created_by')) ? u.getUniqueValue() : '';
    },

    _unknownTxn: function(table, id) {
        var t = new GlideRecord('x_695068_bcfa_integration_txn');
        t.addQuery('source_table', table);
        t.addQuery('source_record', id);
        t.addQuery('reconciliation_state', 'pending');
        t.orderByDesc('sys_created_on');
        t.setLimit(1);
        t.query();
        return t.next() ? t.getUniqueValue() : '';
    },

    _get: function(table, id) {
        var gr = new GlideRecord(table);
        return gr.get(id) ? gr : null;
    },

    _exists: function(table, query) {
        var gr = new GlideRecord(table);
        gr.addEncodedQuery(query);
        gr.setLimit(1);
        gr.query();
        return gr.hasNext();
    },

    _skip: function(gr, expected) {
        return this._result('', 'skipped', gr ? 'state is ' + gr.getValue('state') + ', stage needs ' + expected : 'record not found');
    },

    _ran: function(detail) {
        return this._result('', 'ran', detail);
    },

    _result: function(stage, outcome, detail) {
        return { stage: stage, outcome: outcome, detail: detail };
    },

    type: 'FinanceOrchestration'
};
