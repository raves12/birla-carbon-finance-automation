var AuditEngine = Class.create();
AuditEngine.prototype = {
    initialize: function() {},

    // Appends one Audit Event row. Never throws — a failure to audit must
    // not block the business transaction it's recording, but the caller
    // should still know: it returns '' on failure the same way GlideRecord
    // insert() does.
    logEvent: function(params) {
        params = params || {};
        var gr = new GlideRecord('x_695068_bcfa_audit_event');
        gr.initialize();
        gr.setValue('correlation_id', params.correlationId || '');
        gr.setValue('source_table', params.sourceTable || '');
        gr.setValue('source_record', params.sourceRecord || '');
        gr.setValue('event_type', params.eventType || 'state_transition');
        if (params.actor) {
            gr.setValue('actor', params.actor);
        }
        gr.setValue('actor_type', params.actorType || 'system');
        gr.setValue('description', params.description || '');
        if (params.beforeValue !== undefined && params.beforeValue !== null) {
            gr.setValue('before_value', JSON.stringify(params.beforeValue));
        }
        if (params.afterValue !== undefined && params.afterValue !== null) {
            gr.setValue('after_value', JSON.stringify(params.afterValue));
        }
        gr.setValue('occurred_at', new GlideDateTime().getValue());
        return gr.insert();
    },

    type: 'AuditEngine'
};
