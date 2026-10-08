"""Phase 41 (hardening for the client sample pack): extends the native
Document Intelligence use cases in native_extraction_config.json. Idempotent:
a field that already exists (by BCFA field name) only gets its description
updated; a new field gets a fixed random sys_id once.

AP: separate charge components (shipping/handling, surcharge, other charges)
so a legitimate charge no longer breaks the total check; due date; GRN and
service-entry (SRN) numbers printed anywhere, including notes/remarks; tax
components; and the page layout of multi-document PDFs (which pages are the
invoice, which are supporting documents). Header fields are read from the
invoice pages only.
AR: beneficiary, value date, advance and TDS per invoice, so payment advices
with withholding reconcile. Facts only: no tax, tolerance or approval rules.

  python scripts/deploy/phase41_extraction_fields.py
  python scripts/deploy/gen_native_extraction.py
"""
import io, json, os, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, 'native_extraction_config.json')
cfg = json.load(io.open(PATH, encoding='utf8'))

INVOICE_ONLY = ' Read it from the vendor invoice itself, never from a purchase order, goods receipt, packing list, delivery receipt, e-mail or other supporting page in the same file.'

AP = [
    # (field, name (<= 40 chars), description)
    ('invoice_number', 'Invoice Number', 'The invoice number exactly as printed (for fiscal documents: the fiscal invoice / NF-e / e-invoice number).' + INVOICE_ONLY),
    ('invoice_date', 'Invoice Date', 'The invoice (issue) date, formatted YYYY-MM-DD. Convert from the printed format and calendar (for example 05.10.2026, 2026年10月05日, 2026.10.05) without guessing day/month order when the document locale makes it clear.' + INVOICE_ONLY),
    ('po_number', 'Purchase Order Number', 'The buyer\'s purchase order number referenced on the invoice, wherever it is printed: header, line items, or a notes / remarks / comments area (for example 备注 "PO No.", 비고, Observações). Empty if none is printed.' + INVOICE_ONLY),
    ('net_amount', 'Subtotal Before Tax', 'The goods / services subtotal before tax and before separately printed charges (shipping, freight, handling, surcharges), as a plain number without currency symbol or thousands separators. If the invoice prints only one pre-tax total that already includes the charges, use that total.' + INVOICE_ONLY),
    ('freight_amount', 'Freight Amount', 'A charge printed as its own amount line labelled freight (for example Freight, Frete, 运费). Empty if none, or if the charge is labelled shipping / handling (use Shipping and Handling Amount). Plain number.' + INVOICE_ONLY),
    ('shipping_amount', 'Shipping and Handling Amount', 'A charge printed as its own amount line for shipping, handling, delivery or postage (for example Shipping/Handling, S&H, Delivery, Postage). Plain number. Empty if none or if it is only included inside the line items.' + INVOICE_ONLY),
    ('surcharge_amount', 'Surcharge Amount', 'Any surcharge printed as its own amount line (for example fuel surcharge, environmental fee, small-order fee). Plain number. Empty if none.' + INVOICE_ONLY),
    ('other_charge_amount', 'Other Charges Amount', 'Any other charge printed as its own amount line that is not tax, freight, shipping/handling, surcharge or discount (for example insurance, packing). Plain number. Empty if none.' + INVOICE_ONLY),
    ('tax_amount', 'Total Tax Amount', 'Total of all taxes charged on the invoice (VAT, GST, sales tax, ICMS, IPI, etc.) as a plain number. Do not include withholding tax deducted by the buyer.' + INVOICE_ONLY),
    ('gross_amount', 'Invoice Total', 'The total amount due on the invoice including tax and charges, as a plain number.' + INVOICE_ONLY),
    ('due_date', 'Due Date', 'Payment due date, formatted YYYY-MM-DD. Empty if not printed.' + INVOICE_ONLY),
    ('grn_number', 'Goods Receipt Number', 'Every goods receipt (GRN / GR / MIGO) number printed anywhere on the invoice pages, including a notes / remarks area (for example 备注 "GRN No." or "GRN:" followed by several numbers on separate lines), comma separated. Empty if none is printed on the invoice.'),
    ('srn_number', 'Service Entry Number', 'Every service entry sheet / service receipt (SRN, SES) number printed on the invoice pages, comma separated. Empty if none.'),
    ('vendor_country', 'Supplier Country', 'Country of the seller (the invoice issuer), from its address or tax registration on the invoice, as a full country name in English. Empty if it cannot be read from the invoice.'),
    ('document_language', 'Document Language', 'Main language the invoice itself is written in, judged from its text (not from addresses or company names), as an English language name (for example English, Chinese, Korean, Portuguese, Thai).'),
    ('tax_components_json', 'Tax Components', 'Every tax amount printed on the invoice as a JSON array, one element per printed tax line: {"printed_label": text as printed, "rate": number of percent or null, "taxable_base": number or null, "amount": number}. Plain numbers. Return [] if no tax is printed.' + INVOICE_ONLY),
    ('invoice_pages', 'Invoice Page Numbers', 'The 1-based page numbers of this file that belong to the vendor invoice itself (fiscal invoice / tax invoice / commercial invoice), comma separated, for example 1,2. Pages of purchase orders, goods receipts, packing lists, delivery receipts, service entry sheets, e-mails and other supporting documents are not invoice pages.'),
    ('supporting_documents_json', 'Supporting Documents', 'Other documents contained in this file, as a JSON array: {"type": one of PURCHASE_ORDER, GOODS_RECEIPT, SERVICE_RECEIPT, PACKING_LIST, DELIVERY_RECEIPT, EMAIL_SUPPORT, OTHER_SUPPORTING_DOCUMENT, "pages": "comma separated 1-based page numbers", "reference": the document number printed on it or null}. Return [] if the file contains only the invoice.'),
]

AR = [
    ('beneficiary_name', 'Beneficiary Name', 'Legal name of the company that receives the payment (the payee / beneficiary). Empty if not printed.'),
    ('value_date', 'Value Date', 'Value date of the payment, formatted YYYY-MM-DD. Empty if not printed.'),
    ('advance_amount', 'Total Advance Amount', 'Total advance or prepayment adjusted against the invoices, as stated on the advice. Plain number. Empty if none.'),
    ('tds_amount', 'Total TDS Amount', 'Total tax deducted at source (TDS) or withholding tax stated on the advice. Plain number. Empty if none.'),
    ('document_language', 'Document Language', 'Main language the advice itself is written in, judged from its text (not from addresses or company names), as an English language name.'),
    ('invoice_lines_json', 'Invoices Paid', 'All invoices this payment covers, as a JSON array. Each element: {"invoice_reference": text, "document_number": text or null, "invoice_date": "YYYY-MM-DD" or null, "customer_reference": text, "invoice_amount": gross invoice amount, "advance_amount": number, "tds_amount": number, "deduction_amount": other deductions, "amount_applied": net amount paid for this invoice, "deduction_reason": text}. Plain numbers only. Use null for values that are not printed. Return [] if no invoices are listed.'),
]


def apply(uc, specs):
    by_field = {f[1]: f for f in uc['fields']}
    added = updated = 0
    for field, name, desc in specs:
        assert len(name) <= 40, name
        if field in by_field:
            if by_field[field][3] != desc:
                by_field[field][3] = desc
                updated += 1
        else:
            uc['fields'].append([uuid.uuid4().hex, field, name, desc])
            added += 1
    return added, updated


ap = next(u for u in cfg['use_cases'] if 'AP Invoice' in u['name'])
ar = next(u for u in cfg['use_cases'] if 'AR Payment' in u['name'])
print('AP added %d, updated %d' % apply(ap, AP))
print('AR added %d, updated %d' % apply(ar, AR))
if 'Phase 41' not in cfg['_comment']:
    cfg['_comment'] += (' Phase 41 (client sample pack): separate charge components (shipping/handling, surcharge, other), due date, GRN/SRN'
                        ' from notes, tax components, invoice pages vs supporting documents in multi-document PDFs, header fields read from the'
                        ' invoice pages only; AR beneficiary, value date, advance and TDS per invoice. Facts only.')
io.open(PATH, 'w', encoding='utf8', newline='\n').write(json.dumps(cfg, indent=2, ensure_ascii=False) + '\n')
