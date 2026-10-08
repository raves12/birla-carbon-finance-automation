"""Phase 40 demo journeys: one fresh SYNTHETIC AP invoice and one fresh
SYNTHETIC payment advice per run, for the end-to-end client demo
(docs/deliverables BCFA_Client_Demo_Script.docx, CLIENT_POC_DEMO_JOURNEYS.md).

  AP: Rajasthan Carbon Feedstock Pvt Ltd, PO0001 (100 MT at 50, RCPT0001),
      invoice INV-AP-<suffix>, IGST 18 % = 900. Expected: native extraction,
      tax PASS (decision table), MATCHED, PENDING_APPROVAL for a Finance
      Approver, then MOCK SAP posting (MIRO) and CLOSED.
  AR: two open items of Nilgiri Rubber Compounds Ltd created for this run
      (ARINV-<suffix>-01 50,000 and ARINV-<suffix>-02 30,000, MOCK SAP reference
      data), a bank line of 78,400 without a customer, then the customer's
      advice with TDS 2 % deducted (1,000 + 600). Expected: the payment waits
      at customer resolution; the advice resolves the customer and both
      references; short pay 1,600 with the rule suggestion WITHHOLDING_TAX;
      a person confirms the deduction; approval; MOCK SAP clearing (FB05);
      CLOSED.

Each run needs a new suffix (letters and digits): invoice number, payment
reference, open items and file content are then new, so no duplicate check
or earlier run interferes.

  python scripts/fixtures/gen_phase40_demo_journeys.py D1

writes
  test/fixtures/AP_INV_<suffix>_DEMO_NATIVE.pdf
  test/fixtures/AR_REMIT_<suffix>_DEMO_NATIVE.pdf
  scripts/deploy/phase40_demo_prep_<suffix>_bg.js      the live demo: creates
      the open items and the bank line only; the presenter uploads the two
      PDFs in the BCFA Workspace (Document Intake)
  scripts/deploy/phase40_demo_journeys_<suffix>_bg.js  unattended: prep, then
      both documents are attached and processed by script (rehearsal / check)
Both scripts run in Scripts - Background, scope x_695068_bcfa. Extraction is
asynchronous: the native extraction poller continues each document within
about a minute.
"""
import base64, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_phase40_fixtures as g  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]

PREP = """    // MOCK SAP reference data for this run: two open invoices of Nilgiri Rubber Compounds Ltd.
    var cust = new GlideRecord('x_695068_bcfa_customer');
    if (!cust.get('name', 'Nilgiri Rubber Compounds Ltd')) { gs.info('BCFA_DEMO40 ABORTED: customer Nilgiri Rubber Compounds Ltd not found (run the demo reset first)'); return; }
    var items = [['ARINV-%(s)s-01', 50000, '2026-09-30'], ['ARINV-%(s)s-02', 30000, '2026-10-02']], out = [];
    items.forEach(function(it) {
        var oi = new GlideRecord('x_695068_bcfa_ar_open_item');
        if (oi.get('item_number', it[0])) { out.push(it[0] + ' exists'); return; }
        oi.initialize();
        oi.setValue('item_number', it[0]);
        oi.setValue('customer', cust.getUniqueValue());
        oi.setValue('company_code', cust.getValue('company_code'));
        oi.setValue('currency', 'INR');
        oi.setValue('invoice_amount', it[1]);
        oi.setValue('open_amount', it[1]);
        oi.setValue('due_date', it[2]);
        oi.setValue('status', 'open');
        oi.insert();
        out.push(it[0] + ' created');
    });
    // The bank statement line: the cash arrives before the advice, without a customer.
    var pay = new GlideRecord('x_695068_bcfa_payment');
    var paymentSysId;
    if (pay.get('bank_reference', '%(ref)s')) { paymentSysId = pay.getUniqueValue(); out.push('bank line exists'); }
    else {
        paymentSysId = new ArDomainService().intakePayment({ bankReference: '%(ref)s', currency: 'INR', amount: 78400, bankAccount: 'DEMO-%(s)s',
            source: 'bank_statement', idempotencyKey: 'PH40-DEMO-AR-%(s)s' }).paymentSysId;
        out.push('bank line %(ref)s INR 78,400 created');
    }
"""


def main(suffix):
    if not re.match(r'^[A-Z0-9]{1,8}$', suffix):
        raise SystemExit('suffix: 1-8 upper-case letters or digits')
    g.OUT = ROOT / 'test' / 'fixtures'
    ap = {
        'file': 'AP_INV_%s_DEMO_NATIVE.pdf' % suffix, 'kind': 'gst',
        'vendor': 'Rajasthan Carbon Feedstock Pvt Ltd', 'address': ['RIICO Industrial Area', 'Bhiwadi, Rajasthan 301019, India'],
        'tax_id_label': 'GSTIN', 'tax_id': '08AACCR1234F1Z5', 'country': 'India', 'title': 'TAX INVOICE',
        'number': 'INV-AP-%s' % suffix, 'date': '2026-10-05', 'date_printed': '2026-10-05', 'po': 'PO0001', 'currency': 'INR',
        'bill_to': 'Birla Carbon Demo Company (BC01)', 'terms': 'Net 30',
        'lines': [('Carbon Black Feedstock', 'CBF-100', 100, 'MT', 50.00)], 'net': 5000.00,
        'taxes': [('IGST @ 18%', 900.00)],
        'gt_tax': {'tax_type': 'IGST', 'tax_rate_pct': 18, 'igst_amount': 900.00},
    }
    ref = 'NRC-PAY-26-%s' % suffix
    ar = {'file': 'AR_REMIT_%s_DEMO_NATIVE.pdf' % suffix, 'customer': 'Nilgiri Rubber Compounds Ltd', 'ref': ref, 'utr': 'SBINR520261005' + suffix,
          'date': '2026-10-05', 'currency': 'INR',
          'lines': [('ARINV-%s-01' % suffix, 50000.00, 49000.00, 1000.00, 'TDS @2%'), ('ARINV-%s-02' % suffix, 30000.00, 29400.00, 600.00, 'TDS @2%')],
          'note': 'TDS deducted under section 194Q; certificate to follow.', 'deduction_reason': 'TDS @2%'}
    g.draw_invoice(ap)
    g.draw_advice(ar)
    b64 = lambda f: base64.b64encode((g.OUT / f).read_bytes()).decode()
    v = {'s': suffix, 'ref': ref, 'apf': ap['file'], 'arf': ar['file']}
    prep = PREP % v
    head = ('// Phase 40 demo journeys, run %(s)s: %(what)s.\n'
            '// Generated by scripts/fixtures/gen_phase40_demo_journeys.py. SYNTHETIC documents, MOCK SAP data. Scope x_695068_bcfa.\n'
            '(function() {\n')
    prep_js = (head % dict(v, what='demo preparation (open items and bank line; the PDFs are uploaded in the workspace)') + prep +
               "    gs.info('BCFA_DEMO40 prep %(s)s: ' + out.join('; ') + '. Upload %(apf)s (AP Invoice) and %(arf)s (Payment Advice) in Document Intake.');\n})();\n" % v)
    auto_js = (head % dict(v, what='unattended run (preparation, then both documents processed)') + prep + """    function intake(type, ref, file, data) {
        var i = new GlideRecord('x_695068_bcfa_finance_intake');
        i.initialize();
        i.setValue('document_type', type);
        i.setValue('source_reference', ref);
        var id = i.insert();
        new GlideSysAttachment().writeBase64(i, file, 'application/pdf', data);
        return id;
    }
    var svc = new FinanceDocumentIntakeService();
    var apId = intake('ap_invoice', 'PH40-DEMO-AP-%(s)s', '%(apf)s', '%(apb)s');
    out.push('AP intake ' + apId + ' ' + JSON.stringify(svc.processDocument(apId)));
    var arId = intake('ar_payment_advice', 'PH40-DEMO-AR-%(s)s', '%(arf)s', '%(arb)s');
    out.push('payment ' + paymentSysId + ' AR intake ' + arId + ' ' + JSON.stringify(svc.processDocument(arId)));
    gs.info('BCFA_DEMO40 run %(s)s: ' + out.join(' | '));
})();
""" % dict(v, apb=b64(ap['file']), arb=b64(ar['file'])))
    d = ROOT / 'scripts' / 'deploy'
    (d / ('phase40_demo_prep_%s_bg.js' % suffix)).write_text(prep_js, encoding='utf8', newline='\n')
    (d / ('phase40_demo_journeys_%s_bg.js' % suffix)).write_text(auto_js, encoding='utf8', newline='\n')
    print('written', ap['file'], ar['file'], 'phase40_demo_prep_%s_bg.js' % suffix, 'phase40_demo_journeys_%s_bg.js' % suffix)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'D1')
