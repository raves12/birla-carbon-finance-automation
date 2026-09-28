// Phase 13: the human decision on an AR (cash application) exception. The
// reviewer chooses one of three outcomes and must give a reason:
//   approve_deduction      accept the short-pay residual as a deduction of
//                          the type chosen on the exception (e.g. BANK_CHARGE).
//                          The amount is the residual the deterministic
//                          balance check computed, never a typed number. A
//                          Deduction record is created, the balance is
//                          re-checked (allocation - approved deductions =
//                          payment), and the payment goes for approval by a
//                          different user, then clearing via Mock SAP.
//   request_clarification  the payment waits (ON_HOLD) for the customer
//   hold                   the payment is parked (ON_HOLD)
//
// AI never calls this service: no agent tool reaches it, AI identities are
// refused, and every decision is recorded against the signed-in user. The
// AI note on the exception is advisory input to the human only.
var ArExceptionDecisionService = Class.create();

ArExceptionDecisionService.DECISIONS = {
    approve_deduction: { roles: ['x_695068_bcfa.ar_processor', 'x_695068_bcfa.finance_approver'], from: ['EXCEPTION', 'ON_HOLD'] },
    request_clarification: { roles: ['x_695068_bcfa.ar_processor', 'x_695068_bcfa.finance_approver'], from: ['EXCEPTION', 'ON_HOLD'] },
    hold: { roles: ['x_695068_bcfa.ar_processor', 'x_695068_bcfa.finance_approver'], from: ['EXCEPTION'] }
};

ArExceptionDecisionService.MIN_REASON_CHARS = 10;

ArExceptionDecisionService.prototype = {
    initialize: function() {
        this.arService = new ArDomainService();
        this.auditEngine = new AuditEngine();
        this.policy = new FinancePolicy();
    },

    // Returns { ok:true, decision, paymentState, ... } or { ok:false, error }.
    // Every check runs before anything is written.
    decide: function(exceptionSysId, decision, reason) {
        var rule = ArExceptionDecisionService.DECISIONS[decision];
        if (!rule) return this._error('Unknown decision "' + decision + '".');

        var userId = gs.getUserID();
        if (this._isAiIdentity(userId)) {
            return this._error('AI identities cannot decide AR exceptions. A finance user must make this decision.');
        }
        if (!this._hasAnyRole(rule.roles)) {
            return this._error('You need one of these roles to ' + decision.replace(/_/g, ' ') + ': ' + rule.roles.join(', ') + '.');
        }

        reason = reason ? String(reason).trim() : '';
        if (reason.length < ArExceptionDecisionService.MIN_REASON_CHARS) {
            return this._error('Enter a decision reason (at least ' + ArExceptionDecisionService.MIN_REASON_CHARS + ' characters) before choosing a decision.');
        }

        var exception = new GlideRecord('x_695068_bcfa_ar_exception');
        if (!exception.get(exceptionSysId)) return this._error('AR exception not found.');
        var status = exception.getValue('status');
        if (status !== 'open' && status !== 'in_review') return this._error('This exception is already ' + status + '.');

        var payment = new GlideRecord('x_695068_bcfa_payment');
        if (!payment.get(exception.getValue('payment'))) return this._error('The linked payment was not found.');
        if (rule.from.indexOf(payment.getValue('state')) < 0) {
            return this._error('The payment is in state ' + payment.getValue('state') + '; ' + decision.replace(/_/g, ' ') + ' is only allowed from ' + rule.from.join(' or ') + '.');
        }

        return this['_' + decision](exception, payment, reason, userId);
    },

    _approve_deduction: function(exception, payment, reason, userId) {
        if (exception.getValue('reason_code') !== 'short_pay') {
            return this._error('Only a short payment can be balanced with a deduction; this exception is ' + exception.getDisplayValue('reason_code') + '.');
        }
        var type = exception.getValue('deduction_type');
        if (!type) return this._error('Choose the Deduction Type on the exception (for example Bank Charge) before approving the deduction.');
        if (!this.policy.arDeductionTypeAllowed(type)) {
            return this._error('Deduction type ' + exception.getDisplayValue('deduction_type') + ' is not allowed (x_695068_bcfa.ar.deduction.allowed_types).');
        }

        var balance = this._balance(payment);
        if (balance.allocations.length === 0) return this._error('The payment has no allocations to attach a deduction to.');
        var amount = balance.residual;
        if (amount <= this.arService.BALANCE_TOLERANCE) {
            return this._error('There is no short-pay residual left to deduct (allocated ' + balance.allocated + ', approved deductions ' + balance.deductions + ', payment ' + balance.payment + ').');
        }
        var threshold = this.policy.arDeductionApprovalThreshold();
        if (amount > threshold && !gs.hasRole('x_695068_bcfa.finance_approver') && !gs.hasRole('x_695068_bcfa.admin')) {
            return this._error('A deduction of ' + amount + ' exceeds ' + threshold + ' (x_695068_bcfa.ar.deduction.approval_threshold) and needs a finance approver.');
        }

        // Attach to the allocation the remittance short-paid, else the last.
        var target = balance.allocations[balance.allocations.length - 1];
        var remittance = new MatchingEngine().resolveRemittanceReferences(payment.getUniqueValue());
        if (remittance.available) {
            for (var i = 0; i < remittance.items.length; i++) {
                var ref = remittance.items[i];
                if (ref.applied !== null && ref.applied < ref.openAmount - this.arService.BALANCE_TOLERANCE) {
                    for (var a = 0; a < balance.allocations.length; a++) {
                        if (balance.allocations[a].item === ref.sysId) target = balance.allocations[a];
                    }
                }
            }
        }

        var deduction = new GlideRecord('x_695068_bcfa_deduction');
        deduction.initialize();
        deduction.setValue('payment_allocation', target.sysId);
        deduction.setValue('deduction_type', type);
        deduction.setValue('amount', amount);
        deduction.setValue('status', 'approved');
        deduction.setValue('approved_by', userId);
        deduction.setValue('approved_at', new GlideDateTime().getValue());
        deduction.setValue('notes', reason);
        var deductionSysId = deduction.insert();

        var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
        if (allocation.get(target.sysId) && (type === 'bank_charge' || type === 'tcs')) {
            allocation.setValue(type, amount);
            allocation.update();
        }

        this._recordDecision(exception, 'approve_deduction', reason, userId, 'resolved',
            'Deduction ' + type + ' ' + amount + ' approved by ' + gs.getUserDisplayName() + ': ' + reason);

        // Deterministic re-check: allocation - approved deductions = payment.
        var advance = this.arService.advanceAfterDeduction(payment.getUniqueValue());
        if (!advance.balanced) {
            return this._error('The deduction was recorded but the payment still does not balance (difference ' + advance.difference + '). It stays in exception.');
        }
        var approval = this.arService.routeForApproval(payment.getUniqueValue(), userId);
        var after = new GlideRecord('x_695068_bcfa_payment');
        after.get(payment.getUniqueValue());
        return {
            ok: true,
            decision: 'approve_deduction',
            deductionSysId: deductionSysId,
            deductionType: type,
            amount: amount,
            netAllocated: advance.netAllocated,
            approvalRequired: approval.approvalRequired,
            approvalSysId: approval.approvalSysId,
            paymentState: after.getValue('state')
        };
    },

    _request_clarification: function(exception, payment, reason, userId) {
        this._recordDecision(exception, 'request_clarification', reason, userId, 'in_review', null);
        if (payment.getValue('state') !== 'ON_HOLD') {
            this.arService._setState(payment.getUniqueValue(), 'ON_HOLD', null, 'Customer clarification requested: ' + reason);
        }
        return { ok: true, decision: 'request_clarification', paymentState: 'ON_HOLD', next: 'When the customer replies, correct the data and use Resolve & Retry, or approve a deduction.' };
    },

    _hold: function(exception, payment, reason, userId) {
        this._recordDecision(exception, 'hold', reason, userId, 'in_review', null);
        this.arService._setState(payment.getUniqueValue(), 'ON_HOLD', null, 'Payment put on hold: ' + reason);
        return { ok: true, decision: 'hold', paymentState: 'ON_HOLD' };
    },

    _balance: function(payment) {
        var result = { payment: parseFloat(payment.getValue('amount') || '0'), allocated: 0, deductions: 0, allocations: [] };
        var allocation = new GlideRecord('x_695068_bcfa_payment_allocation');
        allocation.addQuery('payment', payment.getUniqueValue());
        allocation.orderBy('sys_created_on');
        allocation.query();
        while (allocation.next()) {
            result.allocated += parseFloat(allocation.getValue('allocated_amount') || '0');
            result.allocations.push({ sysId: allocation.getUniqueValue(), item: allocation.getValue('ar_open_item') });
            var deduction = new GlideRecord('x_695068_bcfa_deduction');
            deduction.addQuery('payment_allocation', allocation.getUniqueValue());
            deduction.addQuery('status', 'approved');
            deduction.query();
            while (deduction.next()) result.deductions += parseFloat(deduction.getValue('amount') || '0');
        }
        result.allocated = Math.round(result.allocated * 100) / 100;
        result.deductions = Math.round(result.deductions * 100) / 100;
        result.residual = Math.round((result.allocated - result.deductions - result.payment) * 100) / 100;
        return result;
    },

    _recordDecision: function(exception, decision, reason, userId, newStatus, resolutionNotes) {
        var before = { status: exception.getValue('status'), decision: exception.getValue('decision') };
        exception.setValue('decision', decision);
        exception.setValue('decision_reason', reason);
        exception.setValue('decided_by', userId);
        exception.setValue('decided_at', new GlideDateTime().getValue());
        exception.setValue('status', newStatus);
        if (resolutionNotes) exception.setValue('resolution_notes', resolutionNotes);
        exception.update();

        this.auditEngine.logEvent({
            sourceTable: 'x_695068_bcfa_ar_exception',
            sourceRecord: exception.getUniqueValue(),
            eventType: 'human_decision',
            actor: userId,
            actorType: 'user',
            description: 'AR exception decision "' + decision + '" by ' + gs.getUserDisplayName() + ': ' + reason,
            beforeValue: before,
            afterValue: { status: newStatus, decision: decision, reason: reason, deduction_type: exception.getValue('deduction_type') }
        });
    },

    _isAiIdentity: function(userId) {
        var user = new GlideRecord('sys_user');
        return user.get(userId) && user.getValue('identity_type') === 'ai_agent';
    },

    _hasAnyRole: function(roles) {
        for (var i = 0; i < roles.length; i++) {
            if (gs.hasRole(roles[i])) return true;
        }
        return gs.hasRole('x_695068_bcfa.admin');
    },

    _error: function(message) {
        return { ok: false, error: message };
    },

    type: 'ArExceptionDecisionService'
};
