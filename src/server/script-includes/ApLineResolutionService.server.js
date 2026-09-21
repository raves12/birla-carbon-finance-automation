// Deterministic AP invoice-line-to-PO-line/receipt resolution for Finance
// Document Intake. This is intentionally its OWN script include rather than
// an addition to MatchingEngine: MatchingEngine's job is tolerance
// evaluation over lines that are ALREADY correctly linked
// (threeWayMatch reads whatever po_line/receipt_reference an ap_invoice_line
// row already has — see ApDomainService.matchInvoice) — it has no opinion
// about how those links get made. Line RESOLUTION (which PO line does this
// extracted line actually correspond to?) is a different, earlier concern,
// specific to document intake, and keeping it separate means MatchingEngine
// itself needed zero changes for this feature.
var ApLineResolutionService = Class.create();
ApLineResolutionService.prototype = {
    initialize: function() {},

    // Resolves one Claude-extracted invoice line to a PO Line under the
    // given purchase order, using a deterministic cascade:
    //   1. explicit line number (exact, unique)
    //   2. exact material/service description match (exact, unique)
    //   3. exact description + quantity match (exact, unique)
    // Never guesses across more than one equally plausible candidate —  an
    // ambiguous or absent match is reported as unresolved, not picked, per
    // the "never silently resolve ambiguous master data" safety rule.
    // Returns { resolved:true, poLineSysId, method } or
    // { resolved:false, reason }.
    resolvePoLine: function(purchaseOrderSysId, extractedLine) {
        extractedLine = extractedLine || {};
        if (!purchaseOrderSysId) {
            return { resolved: false, reason: 'No purchase order to resolve against.' };
        }

        if (extractedLine.line_number) {
            var byLineNumber = new GlideRecord('x_695068_bcfa_po_line');
            byLineNumber.addQuery('purchase_order', purchaseOrderSysId);
            byLineNumber.addQuery('line_number', extractedLine.line_number);
            byLineNumber.query();
            if (byLineNumber.getRowCount() === 1) {
                byLineNumber.next();
                return { resolved: true, poLineSysId: byLineNumber.getUniqueValue(), method: 'line_number' };
            }
        }

        if (extractedLine.description) {
            var byMaterial = new GlideRecord('x_695068_bcfa_po_line');
            byMaterial.addQuery('purchase_order', purchaseOrderSysId);
            byMaterial.addQuery('material_or_service', extractedLine.description);
            byMaterial.query();
            if (byMaterial.getRowCount() === 1) {
                byMaterial.next();
                return { resolved: true, poLineSysId: byMaterial.getUniqueValue(), method: 'material_or_service' };
            }
        }

        if (extractedLine.description && extractedLine.quantity) {
            var byDescQty = new GlideRecord('x_695068_bcfa_po_line');
            byDescQty.addQuery('purchase_order', purchaseOrderSysId);
            byDescQty.addQuery('material_or_service', extractedLine.description);
            byDescQty.addQuery('quantity', extractedLine.quantity);
            byDescQty.query();
            if (byDescQty.getRowCount() === 1) {
                byDescQty.next();
                return { resolved: true, poLineSysId: byDescQty.getUniqueValue(), method: 'description_and_quantity' };
            }
        }

        return {
            resolved: false,
            reason: 'No unique PO Line match for line ' + (extractedLine.line_number || '?') +
                ' ("' + (extractedLine.description || '') + '").',
        };
    },

    // Resolves the GRN/SRN Receipt for an already-resolved PO Line. A PO
    // Line may have more than one receipt (partial deliveries); takes the
    // most recent by receipt_date, falling back to sys_created_on — the
    // same "most recent, deterministic tie-break" discipline already used
    // elsewhere in this app (e.g. ApDomainService.validateInvoice's
    // most-recent-extraction lookup).
    resolveReceipt: function(poLineSysId) {
        if (!poLineSysId) {
            return { resolved: false, reason: 'No PO Line to resolve a receipt against.' };
        }
        var receipt = new GlideRecord('x_695068_bcfa_receipt');
        receipt.addQuery('po_line', poLineSysId);
        receipt.orderByDesc('receipt_date');
        receipt.orderByDesc('sys_created_on');
        receipt.setLimit(1);
        receipt.query();
        if (!receipt.next()) {
            return { resolved: false, reason: 'No receipt found for this PO Line.' };
        }
        return { resolved: true, receiptSysId: receipt.getUniqueValue() };
    },

    type: 'ApLineResolutionService',
};
