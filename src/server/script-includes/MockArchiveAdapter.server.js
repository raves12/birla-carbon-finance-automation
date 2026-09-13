var MockArchiveAdapter = Class.create();
MockArchiveAdapter.prototype = {
    initialize: function() {},

    // Simulates handing a completed transaction's evidence off to a
    // long-term archive/records-management system. Returns a fabricated
    // archive reference; a real implementation would call an actual
    // document-archival endpoint through IntegrationHub.
    archive: function(sourceTable, sourceRecord, correlationId) {
        var archiveRef = 'ARCH-' + gs.generateGUID().substring(0, 12).toUpperCase();
        return { status: 'SUCCESS', archiveReference: archiveRef, sourceTable: sourceTable, sourceRecord: sourceRecord, correlationId: correlationId };
    },

    type: 'MockArchiveAdapter'
};
