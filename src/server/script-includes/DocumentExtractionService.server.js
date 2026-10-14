// Document extraction entry point (Phase 40). FinanceDocumentIntakeService
// calls only this class; the provider that reads the document is chosen by
// the property x_695068_bcfa.document.extraction.provider:
//   native     ServiceNow Document Intelligence, generative extraction on
//              Now LLM (NativeDocumentIntelligenceProvider). Default.
//   simulated  printed values of the synthetic fixture PDFs, by file name
//              (SimulatedDocumentExtraction). For tests and demo fixtures
//              only; labelled SIMULATED DOCUMENT EXTRACTION — POC.
// Both return the same contract, so nothing downstream depends on the
// provider. There is no fallback between providers: when native
// extraction fails the document goes to manual review, it is never read
// from fixture values instead.
var DocumentExtractionService = Class.create();

DocumentExtractionService.PROPERTY = 'x_695068_bcfa.document.extraction.provider';
DocumentExtractionService.SIMULATED_LABEL = 'SIMULATED DOCUMENT EXTRACTION — POC (fixture values, no OCR)';

DocumentExtractionService.prototype = {
    initialize: function() {
        this.nativeProvider = new NativeDocumentIntelligenceProvider();
        this.simulatedProvider = new SimulatedDocumentExtraction();
    },

    provider: function() {
        return gs.getProperty(DocumentExtractionService.PROPERTY, 'native') === 'simulated' ? 'simulated' : 'native';
    },

    label: function(provider) {
        return (provider || this.provider()) === 'simulated' ? DocumentExtractionService.SIMULATED_LABEL : NativeDocumentIntelligenceProvider.LABEL;
    },

    // kind: 'ap' (invoice) or 'ar' (payment advice / remittance). Returns the
    // provider's envelope plus { provider, label }.
    extract: function(intakeSysId, kind) {
        var provider = this.provider();
        var envelope;
        if (provider === 'simulated' && kind === 'grn') {
            // Phase 42: goods receipts are read natively only (no fixtures).
            envelope = { ok: false, safeError: 'Goods receipt documents are read by native Document Intelligence only; the simulated provider has no GRN fixtures. Review the document manually.' };
        } else if (provider === 'simulated') {
            envelope = kind === 'ap' ? this.simulatedProvider.extractApInvoiceDocument(intakeSysId) : this.simulatedProvider.extractArRemittanceDocument(intakeSysId);
        } else {
            envelope = this.nativeProvider.extract(intakeSysId, kind);
        }
        envelope.provider = provider;
        envelope.label = this.label(provider);
        return envelope;
    },

    type: 'DocumentExtractionService'
};
