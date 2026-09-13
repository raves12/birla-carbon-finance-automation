var MockBankAdapter = Class.create();
MockBankAdapter.prototype = {
    initialize: function() {},

    // For this POC, bank statement lines and remittances are seeded directly
    // as Payment/Remittance demo records (Stage 10) rather than pulled
    // through a live polling adapter — there is no real bank connectivity in
    // this PDI (see docs/DISCOVERY.md). This operation exists so the
    // canonical adapter surface and its Integration Profile are complete and
    // ready to be replaced by a real bank-file/SFTP/API adapter later
    // without changing calling code.
    getBankStatement: function(bankAccount, fromDate, toDate) {
        var lines = [];
        var gr = new GlideRecord('x_695068_bcfa_payment');
        gr.addQuery('bank_account', bankAccount);
        if (fromDate) gr.addQuery('value_date', '>=', fromDate);
        if (toDate) gr.addQuery('value_date', '<=', toDate);
        gr.query();
        while (gr.next()) {
            lines.push({
                sysId: gr.getUniqueValue(),
                bankReference: gr.getValue('bank_reference'),
                valueDate: gr.getValue('value_date'),
                amount: parseFloat(gr.getValue('amount') || '0'),
                currency: gr.getValue('currency')
            });
        }
        return { found: true, lines: lines };
    },

    type: 'MockBankAdapter'
};
