// Integration framework (Section 9/11/12 of the brief; Phase 18). Every call
// to SAP (mock or real), bank or archive goes through execute(), which
// writes one Integration Transaction per idempotency key with: correlation
// id, operation, request, request hash, state, response, SAP/mock reference,
// attempt, started, completed, error and reconciliation state.
//
// Canonical SAP operations: getVendor, getCustomer, getPurchaseOrder,
// getReceipt, getOpenItems, postVendorInvoice, clearCustomerPayment,
// queryTransactionStatus (RealSAPAdapter.CANONICAL_OPERATIONS). Older names
// (getPO, getOpenARItems, clearPayment) are accepted as aliases.
//
// Idempotency — before any financial write it checks, in order:
//   1. the idempotency key: a successful (or reconciled-as-committed)
//      transaction is replayed, never re-sent; an unresolved unknown outcome
//      blocks the send until it is reconciled
//   2. the transaction + operation: a successful write for the same source
//      record under another key is replayed
//   3. the external reference: a successful write for the same business
//      reference on a different record is blocked as a duplicate
// Unknown outcome — a timeout or ambiguous response sets the transaction to
// unknown outcome (reconciliation pending). The write is never retried
// blindly: reconcileUnknownOutcome() asks the adapter what happened
// (queryTransactionStatus) and only a confirmed "not committed" allows a
// retry, which reuses the same transaction record (attempt + 1).
var IntegrationService = Class.create();

IntegrationService.ALIASES = { getPO: 'getPurchaseOrder', getOpenARItems: 'getOpenItems', clearPayment: 'clearCustomerPayment' };
IntegrationService.WRITE_OPERATIONS = { postVendorInvoice: true, clearCustomerPayment: true, createReceipt: true };
IntegrationService.MAX_ATTEMPTS = 3;

IntegrationService.prototype = {
    initialize: function() {
        this.audit = new AuditEngine();
    },

    _getAdapter: function(adapterName) {
        if (adapterName === 'mock_sap') return new MockSAPAdapter();
        if (adapterName === 'real_sap') return new RealSAPAdapter();
        if (adapterName === 'mock_bank') return new MockBankAdapter();
        if (adapterName === 'mock_archive') return new MockArchiveAdapter();
        throw 'Unknown adapter: ' + adapterName;
    },

    // SAP adapters must implement every canonical operation (the seam that
    // lets the real adapter replace the mock without other changes).
    checkAdapterContract: function(adapterName) {
        var adapter = this._getAdapter(adapterName);
        var missing = [];
        for (var i = 0; i < RealSAPAdapter.CANONICAL_OPERATIONS.length; i++) {
            if (typeof adapter[RealSAPAdapter.CANONICAL_OPERATIONS[i]] !== 'function') missing.push(RealSAPAdapter.CANONICAL_OPERATIONS[i]);
        }
        return { adapter: adapterName, conforms: missing.length === 0, missing: missing };
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

    _txnByKey: function(idempotencyKey) {
        if (!idempotencyKey) return null;
        var gr = new GlideRecord('x_695068_bcfa_integration_txn');
        gr.addQuery('idempotency_key', idempotencyKey);
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    },

    _isCommitted: function(txn) {
        return txn.getValue('status') === 'success' ||
            (txn.getValue('status') === 'reconciled' && txn.getValue('reconciliation_state') === 'confirmed_committed');
    },

    _isUnresolved: function(txn) {
        return txn.getValue('reconciliation_state') === 'pending' ||
            (txn.getValue('unknown_outcome_flag') === '1' && txn.getValue('reconciliation_state') !== 'confirmed_not_committed');
    },

    _replay: function(txn, how) {
        var payload = txn.getValue('response_payload');
        var response = null;
        try { response = payload ? JSON.parse(payload) : null; } catch (e) { response = null; }
        if (!response && txn.getValue('external_document_id')) response = { sapDocumentId: txn.getValue('external_document_id') };
        this.audit.logEvent({
            correlationId: txn.getValue('correlation_id'),
            sourceTable: txn.getValue('source_table') || 'x_695068_bcfa_integration_txn',
            sourceRecord: txn.getValue('source_record') || txn.getUniqueValue(),
            eventType: 'integration_call',
            actorType: 'system',
            reason: 'Idempotent replay by ' + how,
            description: 'Integration ' + txn.getValue('operation') + ' NOT re-sent: replayed the committed transaction ' + txn.getValue('idempotency_key') +
                ' (' + how + ')' + (txn.getValue('external_document_id') ? ', SAP document ' + txn.getValue('external_document_id') : '') + '.',
            afterValue: { transaction: txn.getUniqueValue(), operation: txn.getValue('operation'), replayed_by: how, external_document_id: txn.getValue('external_document_id') }
        });
        return { status: 'success', response: response, transactionSysId: txn.getUniqueValue(), unknownOutcome: false, idempotentReplay: true, replayedBy: how };
    },

    // A committed write of the same operation for the same source record
    // (under any key), or for the same external reference.
    _committedWrite: function(operation, field, value, excludeKey) {
        if (!value) return null;
        var gr = new GlideRecord('x_695068_bcfa_integration_txn');
        gr.addQuery('operation', 'IN', operation + ',' + this._legacyName(operation));
        gr.addQuery(field, value);
        if (excludeKey) gr.addQuery('idempotency_key', '!=', excludeKey);
        gr.addQuery('status', 'IN', 'success,reconciled');
        gr.query();
        while (gr.next()) {
            if (this._isCommitted(gr)) return gr;
        }
        return null;
    },

    _legacyName: function(operation) {
        for (var legacy in IntegrationService.ALIASES) {
            if (IntegrationService.ALIASES[legacy] === operation) return legacy;
        }
        return operation;
    },

    _hash: function(operation, payload) {
        try {
            return new GlideDigest().getSHA256Hex(operation + '|' + JSON.stringify(payload || {}));
        } catch (e) {
            return '';
        }
    },

    _callAdapter: function(adapter, operation, payload) {
        switch (operation) {
            case 'getVendor': return adapter.getVendor(payload.vendorCode);
            case 'getCustomer': return adapter.getCustomer(payload.customerCode);
            case 'getPurchaseOrder': return adapter.getPurchaseOrder(payload.poNumber);
            case 'getReceipt': return adapter.getReceipt(payload.receiptNumber);
            case 'getOpenItems': return adapter.getOpenItems(payload.customerSysId);
            case 'getCreditNotes': return adapter.getCreditNotes(payload.customerSysId);
            case 'getExchangeRate': return adapter.getExchangeRate(payload.fromCurrency, payload.toCurrency);
            case 'createReceipt': return adapter.createReceipt(payload);
            case 'postVendorInvoice': return adapter.postVendorInvoice(payload);
            case 'clearCustomerPayment': return adapter.clearCustomerPayment(payload);
            case 'queryTransactionStatus': return adapter.queryTransactionStatus(payload.operation, payload.idempotencyKey, payload.externalReference, payload.documentId);
            case 'getBankStatement': return adapter.getBankStatement(payload.bankAccount, payload.fromDate, payload.toDate);
            case 'archive': return adapter.archive(payload.sourceTable, payload.sourceRecord, payload.correlationId);
            default: throw 'Unknown operation: ' + operation;
        }
    },

    // Executes one canonical operation through the named adapter.
    // params: { operation, adapter, correlationId, idempotencyKey,
    //           externalReference, sourceTable, sourceRecord, payload,
    //           simulateOutcome }
    // returns: { status, response, transactionSysId, unknownOutcome,
    //            idempotentReplay?, blocked? }
    execute: function(params) {
        params = params || {};
        var operation = IntegrationService.ALIASES[params.operation] || params.operation;
        var adapterName = params.adapter;
        var idempotencyKey = params.idempotencyKey || '';
        var isWrite = !!IntegrationService.WRITE_OPERATIONS[operation];

        // 1. Idempotency key.
        var existing = this._txnByKey(idempotencyKey);
        if (existing) {
            if (this._isCommitted(existing)) return this._replay(existing, 'idempotency key');
            if (this._isUnresolved(existing)) {
                return this._blocked(params, operation, existing, 'unknown_outcome',
                    'An earlier attempt under this idempotency key has an unknown outcome; it must be reconciled (queryTransactionStatus) before anything is re-sent.');
            }
            if (existing.getValue('reconciliation_state') === 'escalated') {
                return this._blocked(params, operation, existing, 'escalated', 'The retry limit was reached for this idempotency key; a person must resolve it.');
            }
        }
        if (isWrite) {
            // 2. Same transaction + operation already committed under another key.
            var sameRecord = this._committedWrite(operation, 'source_record', params.sourceRecord, idempotencyKey);
            if (sameRecord) return this._replay(sameRecord, 'transaction and operation');
            // 3. Same external reference already committed for another record.
            var sameReference = this._committedWrite(operation, 'external_reference', params.externalReference, idempotencyKey);
            if (sameReference && sameReference.getValue('source_record') !== (params.sourceRecord || '')) {
                return this._blocked(params, operation, sameReference, 'duplicate',
                    'External reference ' + params.externalReference + ' was already ' + (operation === 'postVendorInvoice' ? 'posted' : 'cleared') +
                    ' for another record (transaction ' + sameReference.getValue('idempotency_key') + ').');
            }
        }

        var profile = this._getActiveProfile(adapterName);
        var effectiveMode = params.simulateOutcome || profile.failureMode || 'success';
        var requestPayload = params.payload || {};
        var now = new GlideDateTime().getValue();

        var txn = existing;
        var attempt = 1;
        if (txn) {
            attempt = parseInt(txn.getValue('attempt') || '1', 10) + 1;
        } else {
            txn = new GlideRecord('x_695068_bcfa_integration_txn');
            txn.initialize();
            txn.setValue('idempotency_key', idempotencyKey || (operation + '-' + gs.generateGUID()));
        }
        txn.setValue('correlation_id', params.correlationId || (existing ? existing.getValue('correlation_id') : '') || gs.generateGUID());
        txn.setValue('operation', operation);
        txn.setValue('source_table', params.sourceTable || '');
        txn.setValue('source_record', params.sourceRecord || '');
        if (params.externalReference) txn.setValue('external_reference', String(params.externalReference).substring(0, 100));
        txn.setValue('adapter', adapterName);
        txn.setValue('attempt', attempt);
        txn.setValue('requested_at', now);
        txn.setValue('request_payload', JSON.stringify(requestPayload));
        txn.setValue('request_hash', this._hash(operation, requestPayload));
        txn.setValue('error_code', '');
        txn.setValue('error_message', '');
        txn.setValue('unknown_outcome_flag', false);
        txn.setValue('reconciliation_state', 'not_required');

        var result = { status: 'success', response: null, unknownOutcome: false };
        if (effectiveMode === 'validation_error') {
            result.status = 'validation_error';
            txn.setValue('error_code', 'VALIDATION_ERROR');
            txn.setValue('error_message', 'Simulated validation error from ' + adapterName);
        } else if (effectiveMode === 'technical_error') {
            result.status = 'technical_error';
            txn.setValue('error_code', 'TECHNICAL_ERROR');
            txn.setValue('error_message', 'Simulated technical error from ' + adapterName);
        } else if (effectiveMode === 'timeout' || effectiveMode === 'unknown_outcome') {
            result.status = effectiveMode;
            result.unknownOutcome = true;
            txn.setValue('unknown_outcome_flag', true);
            txn.setValue('reconciliation_state', 'pending');
            txn.setValue('error_code', effectiveMode === 'timeout' ? 'TIMEOUT' : 'UNKNOWN_OUTCOME');
            txn.setValue('error_message', 'Outcome unknown: do not retry the write; query the status and reconcile.');
        } else if (effectiveMode === 'duplicate') {
            result.status = 'duplicate';
            txn.setValue('error_code', 'DUPLICATE');
            txn.setValue('error_message', 'Simulated duplicate detected by ' + adapterName);
        } else {
            // 'success', 'delayed_response' (delay recorded, not slept) and
            // 'partial_response' execute the adapter call.
            var adapterPayload = JSON.parse(JSON.stringify(requestPayload));
            adapterPayload.idempotencyKey = idempotencyKey;
            var adapterResult = this._callAdapter(this._getAdapter(adapterName), operation, adapterPayload);
            if (adapterResult && adapterResult.status === 'NOT_CONFIGURED') {
                // Nothing was sent: a definite, safe failure.
                result.status = 'failed';
                result.response = adapterResult;
                txn.setValue('error_code', 'NOT_CONFIGURED');
                txn.setValue('error_message', adapterResult.message);
            } else {
                if (effectiveMode === 'partial_response' && adapterResult) adapterResult.partial = true;
                result.response = adapterResult;
                if (adapterResult && adapterResult.sapDocumentId) txn.setValue('external_document_id', adapterResult.sapDocumentId);
            }
        }

        txn.setValue('status', result.status);
        txn.setValue('response_payload', JSON.stringify(result.response));
        txn.setValue('completed_at', new GlideDateTime().getValue());
        result.transactionSysId = existing ? (txn.update() && txn.getUniqueValue()) : txn.insert();
        result.attempt = attempt;
        this.audit.logEvent({
            correlationId: txn.getValue('correlation_id'),
            sourceTable: params.sourceTable || 'x_695068_bcfa_integration_txn',
            sourceRecord: params.sourceRecord || result.transactionSysId,
            eventType: 'integration_call',
            actorType: 'system',
            reason: txn.getValue('error_message') || '',
            description: 'Integration ' + operation + ' via ' + adapterName + ' (attempt ' + attempt + '): ' + result.status +
                (txn.getValue('external_document_id') ? ', document ' + txn.getValue('external_document_id') : '') +
                (txn.getValue('error_code') ? ', ' + txn.getValue('error_code') : '') + '.',
            beforeValue: { operation: operation, idempotency_key: txn.getValue('idempotency_key'), request_hash: txn.getValue('request_hash'),
                external_reference: txn.getValue('external_reference') },
            afterValue: { transaction: result.transactionSysId, status: result.status, attempt: attempt, external_document_id: txn.getValue('external_document_id'),
                error_code: txn.getValue('error_code'), reconciliation_state: txn.getValue('reconciliation_state') }
        });
        return result;
    },

    // Audit of an Unknown Outcome reconciliation on the business record.
    _auditReconciliation: function(txn, resolution, outcome) {
        this.audit.logEvent({
            correlationId: txn.getValue('correlation_id'),
            sourceTable: txn.getValue('source_table') || 'x_695068_bcfa_integration_txn',
            sourceRecord: txn.getValue('source_record') || txn.getUniqueValue(),
            eventType: 'reconciliation',
            actorType: 'system',
            reason: resolution.reason || ('Status query outcome ' + outcome),
            description: 'Unknown outcome of ' + txn.getValue('operation') + ' ' + txn.getValue('idempotency_key') + ' reconciled: ' + resolution.resolution +
                (resolution.sapDocumentId ? ' (' + resolution.sapDocumentId + ')' : '') + '.',
            beforeValue: { reconciliation_state: 'pending', attempt: txn.getValue('attempt') },
            afterValue: { resolution: resolution.resolution, status_query: outcome, reconciliation_state: txn.getValue('reconciliation_state'),
                status: txn.getValue('status'), external_document_id: txn.getValue('external_document_id') }
        });
        return resolution;
    },

    _blocked: function(params, operation, txn, kind, reason) {
        this.audit.logEvent({
            correlationId: params.correlationId || txn.getValue('correlation_id'),
            sourceTable: params.sourceTable || 'x_695068_bcfa_integration_txn',
            sourceRecord: params.sourceRecord || txn.getUniqueValue(),
            eventType: 'integration_call',
            actorType: 'system',
            reason: reason,
            description: 'Integration ' + operation + ' NOT sent: ' + reason,
            afterValue: { operation: operation, idempotencyKey: params.idempotencyKey, externalReference: params.externalReference, blockingTransaction: txn.getUniqueValue() }
        });
        return {
            status: kind === 'unknown_outcome' ? 'blocked_unknown_outcome' : kind === 'escalated' ? 'blocked_escalated' : 'blocked_duplicate',
            blocked: true, unknownOutcome: kind === 'unknown_outcome', transactionSysId: txn.getUniqueValue(), reason: reason, response: null
        };
    },

    // Canonical queryTransactionStatus: asks the transaction's adapter
    // whether a write committed. Read-only; logged as its own transaction.
    queryTransactionStatus: function(transactionSysId) {
        var txn = new GlideRecord('x_695068_bcfa_integration_txn');
        if (!txn.get(transactionSysId)) return { outcome: 'UNAVAILABLE', message: 'Transaction not found' };
        var query = this.execute({
            operation: 'queryTransactionStatus',
            adapter: txn.getValue('adapter') || 'mock_sap',
            correlationId: txn.getValue('correlation_id'),
            idempotencyKey: 'QTS-' + txn.getValue('idempotency_key') + '-' + gs.generateGUID().substring(0, 8),
            sourceTable: txn.getValue('source_table'),
            sourceRecord: txn.getValue('source_record'),
            payload: { operation: txn.getValue('operation'), idempotencyKey: txn.getValue('idempotency_key'), externalReference: txn.getValue('external_reference'),
                documentId: txn.getValue('external_document_id') },
            simulateOutcome: 'success'
        });
        return query.response || { outcome: 'UNAVAILABLE' };
    },

    // Unknown Outcome Control. Never re-sends the write itself: it queries
    // the status and records the reconciliation. Returns
    // { resolution: 'POSTED' | 'RETRY' | 'INTEGRATION_EXCEPTION', sapDocumentId?, reason? }.
    // 'RETRY' means the adapter confirmed nothing committed, so the caller
    // may safely send again with the same idempotency key.
    reconcileUnknownOutcome: function(transactionSysId) {
        var txn = new GlideRecord('x_695068_bcfa_integration_txn');
        if (!txn.get(transactionSysId)) {
            return { resolution: 'INTEGRATION_EXCEPTION', reason: 'Transaction not found' };
        }
        var status = this.queryTransactionStatus(transactionSysId);
        var attempt = parseInt(txn.getValue('attempt') || '1', 10);

        if (status.outcome === 'COMMITTED') {
            txn.setValue('status', 'reconciled');
            txn.setValue('reconciliation_state', 'confirmed_committed');
            if (status.sapDocumentId) txn.setValue('external_document_id', status.sapDocumentId);
            txn.setValue('unknown_outcome_flag', false);
            txn.update();
            return this._auditReconciliation(txn, { resolution: 'POSTED', sapDocumentId: status.sapDocumentId }, status.outcome);
        }
        if (status.outcome === 'NOT_FOUND') {
            txn.setValue('unknown_outcome_flag', false);
            if (attempt < IntegrationService.MAX_ATTEMPTS) {
                txn.setValue('reconciliation_state', 'confirmed_not_committed');
                txn.update();
                return this._auditReconciliation(txn, { resolution: 'RETRY' }, status.outcome);
            }
            txn.setValue('reconciliation_state', 'escalated');
            txn.setValue('status', 'failed');
            txn.update();
            return this._auditReconciliation(txn, { resolution: 'INTEGRATION_EXCEPTION', reason: 'Retry limit reached with no confirmed outcome.' }, status.outcome);
        }
        // The status could not be determined: stays pending, nothing re-sent.
        return this._auditReconciliation(txn, { resolution: 'INTEGRATION_EXCEPTION', reason: 'Status could not be determined (' + (status.message || status.outcome) + '); the transaction stays pending reconciliation.' }, status.outcome);
    },

    type: 'IntegrationService'
};
