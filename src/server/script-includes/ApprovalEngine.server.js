var ApprovalEngine = Class.create();
ApprovalEngine.prototype = {
    initialize: function() {},

    requestApInvoiceApproval: function(apInvoiceSysId, requestedBy) {
        var approval = new GlideRecord('x_695068_bcfa_ap_approval');
        approval.initialize();
        approval.setValue('ap_invoice', apInvoiceSysId);
        if (requestedBy) approval.setValue('requested_by', requestedBy);
        approval.setValue('decision', 'pending');
        var sysId = approval.insert();

        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (invoice.get(apInvoiceSysId)) {
            invoice.setValue('approval_state', 'pending');
            invoice.update();
        }
        return sysId;
    },

    // Defense-in-depth mirror of the ACL script on ap_approval.decision — the
    // platform ACL is the enforcement point, but the service layer also
    // refuses a self-approval so a caller never sees a misleading partial
    // success.
    decideApInvoiceApproval: function(approvalSysId, decision, approver, notes) {
        var approval = new GlideRecord('x_695068_bcfa_ap_approval');
        if (!approval.get(approvalSysId)) return { error: 'Approval not found' };
        if (approval.getValue('requested_by') && approver && approval.getValue('requested_by') === approver) {
            return { error: 'Segregation of duties violation: requester cannot approve their own transaction.' };
        }
        approval.setValue('decision', decision);
        approval.setValue('decision_notes', notes || '');
        if (approver) approval.setValue('approver', approver);
        approval.setValue('decided_at', new GlideDateTime().getValue());
        approval.update();

        var invoice = new GlideRecord('x_695068_bcfa_ap_invoice');
        if (invoice.get(approval.getValue('ap_invoice'))) {
            invoice.setValue('approval_state', decision === 'approved' ? 'approved' : 'rejected');
            invoice.update();
        }
        return { success: true, decision: decision };
    },

    requestPaymentApproval: function(paymentSysId, requestedBy) {
        var approval = new GlideRecord('x_695068_bcfa_ar_approval');
        approval.initialize();
        approval.setValue('payment', paymentSysId);
        if (requestedBy) approval.setValue('requested_by', requestedBy);
        approval.setValue('decision', 'pending');
        return approval.insert();
    },

    decidePaymentApproval: function(approvalSysId, decision, approver, notes) {
        var approval = new GlideRecord('x_695068_bcfa_ar_approval');
        if (!approval.get(approvalSysId)) return { error: 'Approval not found' };
        if (approval.getValue('requested_by') && approver && approval.getValue('requested_by') === approver) {
            return { error: 'Segregation of duties violation: requester cannot approve their own transaction.' };
        }
        approval.setValue('decision', decision);
        approval.setValue('decision_notes', notes || '');
        if (approver) approval.setValue('approver', approver);
        approval.setValue('decided_at', new GlideDateTime().getValue());
        approval.update();
        return { success: true, decision: decision };
    },

    type: 'ApprovalEngine'
};
