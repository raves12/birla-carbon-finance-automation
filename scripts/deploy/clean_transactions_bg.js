// BCFA: clean the front-end transaction data (Document Intake, AP, Cash Application) for a fresh start.
// Scripts - Background, scope x_695068_bcfa. Run by the instance owner.
//
// PREVIEW = true (default): counts only, changes nothing. Set PREVIEW = false to clean.
//
// PERMANENTLY DELETES (when PREVIEW = false):
//   Finance Document Intakes (and their attachments), AP invoices with their lines, extraction rows,
//   matches, exceptions and approvals; payments with their remittances, allocations, match candidates,
//   deductions, exceptions and approvals; integration transactions, finance exceptions, decision log,
//   AI interaction log.
// KEEPS: master data (vendors, customers, purchase orders, PO lines, goods / service receipts, AR open
//   items, credit notes, customer aliases), configuration, decision tables, users, Playbooks, ATF tests.
//   The KPI and POC scorecard rows stay: they are recalculated every 15 minutes from the (now empty) data.
// RESTORES: AR open items and credit notes to fully open (the payments that cleared them are deleted).
// NUMBERS: afterwards run reset_number_counters_bg.js (scope global) so the next records are
//   FDI0000001, AP00000001, AR00000001 and RT00000001.
// AUDIT: audit events are append-only and are kept unless PURGE_AUDIT = true.
var PREVIEW = true;
var PURGE_AUDIT = false;

(function() {
    var P = 'x_695068_bcfa_';
    var out = { preview: PREVIEW, deleted: {}, restored: {} };
    var wipe = function(table) {
        var g = new GlideRecord(P + table);
        g.query();
        var n = g.getRowCount();
        if (!PREVIEW && n) {
            // Business rules off: the lifecycle and append-only guards must not block the cleanup.
            g.setWorkflow(false);
            g.deleteMultiple();
        }
        out.deleted[table] = n;
    };

    // Attachments of the intakes (the uploaded documents).
    var att = new GlideRecord('sys_attachment');
    att.addQuery('table_name', P + 'finance_intake');
    att.query();
    out.deleted.intake_attachments = att.getRowCount();
    if (!PREVIEW) {
        var gsa = new GlideSysAttachment();
        while (att.next()) gsa.deleteAttachment(att.getUniqueValue());
    }

    // Children first, then parents.
    ['deduction', 'payment_allocation', 'match_candidate', 'remittance', 'ar_exception', 'ar_approval',
        'ap_invoice_line', 'ap_extraction', 'ap_match', 'ap_exception', 'ap_approval',
        'integration_txn', 'finance_exception', 'decision_log', 'ai_interaction',
        'finance_intake', 'ap_invoice', 'payment'].forEach(wipe);
    if (PURGE_AUDIT) wipe('audit_event');

    // Balances back to fully open.
    var restore = function(table, amountField, openStatus, key) {
        var g = new GlideRecord(P + table);
        g.query();
        var n = 0;
        while (g.next()) {
            var full = g.getValue(amountField);
            if (g.getValue('open_amount') === full && g.getValue('status') === openStatus) continue;
            n++;
            if (PREVIEW) continue;
            g.setValue('open_amount', full);
            g.setValue('status', openStatus);
            g.setWorkflow(false);
            g.update();
        }
        out.restored[key] = n;
    };
    restore('ar_open_item', 'invoice_amount', 'open', 'ar_open_items');
    restore('credit_note', 'amount', 'open', 'credit_notes');

    gs.info('BCFA_CLEAN ' + JSON.stringify(out) + ' ||');
})();
