var IntegrationService = Class.create();
IntegrationService.prototype = {
    initialize: function() {},

    _getAdapter: function(adapterName) {
        if (adapterName === 'mock_sap') return new MockSAPAdapter();
        if (adapterName === 'mock_bank') return new MockBankAdapter();
        if (adapterName === 'mock_archive') return new MockArchiveAdapter();
        throw 'Unknown adapter: ' + adapterName;
    },

    _getActiveProfile: function(adapterName) {
        var gr = new GlideRecord('x_695068_bcfa_integration_profile');
        gr.addQuery('adapter', adapterName);
        gr.addQuery('active', true);
        gr.orderByDesc('sys_created_on');
        gr.setLimit(1);
        gr.query();
        if (gr.next()) {
            return {
                failureMode: gr.getValue('failure_mode') || 'success',
                responseDelayMs: parseInt(gr.getValue('response_delay_ms') || '0', 10)
            };
        }
        return { failureMode: 'success', responseDelayMs: 0 };
    },

    // Finds a prior *successful* transaction for this idempotency key. If one
    // exists, the caller must not re-execute the write — it gets the cached
    // result instead. This is the actual idempotency enforcement point
    // (Section 12 / Section 18 of the build brief).
    _findSuccessfulByIdempotencyKey: function(idempotencyKey) {
        if (!idempotencyKey) return null;
        var gr = new GlideRecord('x_695068_bcfa_integration_txn');
        gr.addQuery('idempotency_key', idempotencyKey);
        gr.addQuery('status', 'success');
        gr.setLimit(1);
        gr.query();
        if (gr.next()) {
            return {
                sysId: gr.getUniqueValue(),
                responsePayload: gr.getValue('response_payload') ? JSON.parse(gr.getValue('response_payload')) : null
            };
        }
        return null;
    },

    _callAdapter: function(adapter, operation, payload) {
        switch (operation) {
            case 'getVendor': return adapter.getVendor(payload.vendorCode);
            case 'getCustomer': return adapter.getCustomer(payload.customerCode);
            case 'getPO': return adapter.getPO(payload.poNumber);
            case 'getReceipt': return adapter.getReceipt(payload.receiptNumber);
            case 'getOpenARItems': return adapter.getOpenARItems(payload.customerSysId);
            case 'getCreditNotes': return adapter.getCreditNotes(payload.customerSysId);
            case 'getExchangeRate': return adapter.getExchangeRate(payload.fromCurrency, payload.toCurrency);
            case 'createReceipt': return adapter.createReceipt(payload);
            case 'postVendorInvoice': return adapter.postVendorInvoice(payload);
            case 'clearPayment': return adapter.clearPayment(payload);
            case 'getBankStatement': return adapter.getBankStatement(payload.bankAccount, payload.fromDate, payload.toDate);
            case 'archive': return adapter.archive(payload.sourceTable, payload.sourceRecord, payload.correlationId);
            default: throw 'Unknown operation: ' + operation;
        }
    },

    // Executes one canonical business operation through the named adapter,
    // with idempotency short-circuiting, deterministic-failure simulation,
    // and full Integration Transaction audit logging.
    //
    // params: { operation, adapter, correlationId, idempotencyKey,
    //           sourceTable, sourceRecord, payload, simulateOutcome }
    //
    // returns: { status, response, transactionSysId, unknownOutcome }
    execute: function(params) {
        params = params || {};
        var operation = params.operation;
        var adapterName = params.adapter;
        var idempotencyKey = params.idempotencyKey || '';
        var correlationId = params.correlationId || gs.generateGUID();

        var cached = this._findSuccessfulByIdempotencyKey(idempotencyKey);
        if (cached) {
            return { status: 'success', response: cached.responsePayload, transactionSysId: cached.sysId, unknownOutcome: false, idempotentReplay: true };
        }

        var profile = this._getActiveProfile(adapterName);
        var effectiveMode = params.simulateOutcome || profile.failureMode || 'success';

        var txn = new GlideRecord('x_695068_bcfa_integration_txn');
        txn.initialize();
        txn.setValue('correlation_id', correlationId);
        txn.setValue('idempotency_key', idempotencyKey || (operation + '-' + gs.generateGUID()));
        txn.setValue('operation', operation);
        txn.setValue('source_table', params.sourceTable || '');
        txn.setValue('source_record', params.sourceRecord || '');
        txn.setValue('adapter', adapterName);
        txn.setValue('attempt', 1);
        txn.setValue('requested_at', new GlideDateTime().getValue());

        var result = { status: 'success', response: null, unknownOutcome: false };

        if (effectiveMode === 'validation_error') {
            result.status = 'validation_error';
            txn.setValue('error_code', 'VALIDATION_ERROR');
            txn.setValue('error_message', 'Simulated validation error from ' + adapterName);
        } else if (effectiveMode === 'technical_error') {
            result.status = 'technical_error';
            txn.setValue('error_code', 'TECHNICAL_ERROR');
            txn.setValue('error_message', 'Simulated technical error from ' + adapterName);
        } else if (effectiveMode === 'timeout') {
            result.status = 'timeout';
            result.unknownOutcome = true;
            txn.setValue('unknown_outcome_flag', true);
            txn.setValue('error_code', 'TIMEOUT');
            txn.setValue('error_message', 'Simulated timeout — outcome unknown, do not blind-retry.');
        } else if (effectiveMode === 'unknown_outcome') {
            result.status = 'unknown_outcome';
            result.unknownOutcome = true;
            txn.setValue('unknown_outcome_flag', true);
            txn.setValue('error_message', 'Simulated ambiguous response.');
        } else if (effectiveMode === 'duplicate') {
            result.status = 'duplicate';
            txn.setValue('error_code', 'DUPLICATE');
            txn.setValue('error_message', 'Simulated duplicate detected by ' + adapterName);
        } else {
            // 'success', 'delayed_response' (delay is recorded, not actually
            // slept — see docs/BUILD_REPORT.md known limitations), and
            // 'partial_response' all execute the real adapter call.
            var adapter = this._getAdapter(adapterName);
            var payload = params.payload || {};
            payload.idempotencyKey = idempotencyKey;
            var adapterResult = this._callAdapter(adapter, operation, payload);
            if (effectiveMode === 'partial_response') {
                adapterResult.partial = true;
            }
            result.status = 'success';
            result.response = adapterResult;
            if (adapterResult && adapterResult.sapDocumentId) {
                txn.setValue('external_document_id', adapterResult.sapDocumentId);
            }
        }

        txn.setValue('status', result.status);
        txn.setValue('response_payload', JSON.stringify(result.response));
        txn.setValue('request_payload', JSON.stringify(params.payload || {}));
        txn.setValue('completed_at', new GlideDateTime().getValue());
        result.transactionSysId = txn.insert();

        return result;
    },

    // Section 11 — Unknown Outcome Control. Queries the adapter for the
    // ground truth of a previously timed-out/ambiguous write and decides the
    // next step WITHOUT blindly retrying.
    // returns: { resolution: 'POSTED' | 'RETRY' | 'INTEGRATION_EXCEPTION', sapDocumentId? }
    reconcileUnknownOutcome: function(transactionSysId) {
        var txn = new GlideRecord('x_695068_bcfa_integration_txn');
        if (!txn.get(transactionSysId)) {
            return { resolution: 'INTEGRATION_EXCEPTION', reason: 'Transaction not found' };
        }
        var operation = txn.getValue('operation');
        var idempotencyKey = txn.getValue('idempotency_key');
        var attempt = parseInt(txn.getValue('attempt') || '1', 10);

        var adapter = new MockSAPAdapter();
        var status = adapter.getPostingStatus(operation, idempotencyKey);

        if (status.outcome === 'COMMITTED') {
            txn.setValue('status', 'reconciled');
            txn.setValue('external_document_id', status.sapDocumentId);
            txn.setValue('unknown_outcome_flag', false);
            txn.update();
            return { resolution: 'POSTED', sapDocumentId: status.sapDocumentId };
        }

        // NOT_FOUND: nothing was ever committed under this idempotency key,
        // so a retry cannot create a duplicate. Cap attempts so a
        // persistently failing integration still surfaces as an exception
        // rather than looping forever.
        if (attempt < 3) {
            txn.setValue('attempt', attempt + 1);
            txn.update();
            return { resolution: 'RETRY' };
        }
        txn.setValue('status', 'failed');
        txn.update();
        return { resolution: 'INTEGRATION_EXCEPTION', reason: 'Retry limit reached with no confirmed outcome.' };
    },

    type: 'IntegrationService'
};
