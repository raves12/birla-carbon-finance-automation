"""Generates the Phase 40 synthetic fixtures (second set) and their ground truth.

Covers what the first set does not: GST split (CGST/SGST), IGST, a German
VAT 7% invoice in German with German number format, an Indian services
invoice with withholding (TDS) printed, a two-page multi-line invoice, and
payment advices with per-invoice TDS, credit-note netting, no invoice
reference, and mixed deductions with a UTR.

Every company is fictional; every page carries the red SYNTHETIC watermark.
These are NOT Birla Carbon documents. Ground truth is written from the same
specs to scripts/eval/ground_truth_synthetic_set2.json (only what is printed).

    python scripts/fixtures/gen_phase40_fixtures.py
"""
import io, json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "test" / "fixtures"
GT = ROOT / "scripts" / "eval" / "ground_truth_synthetic_set2.json"
W, H = A4
LEFT = 25 * 2.83465
WATERMARK = "SYNTHETIC SAMPLE DATA — FOR DEMO/TEST USE ONLY — NOT A REAL TRANSACTION"


def money(v, cur, german=False):
    s = f"{v:,.2f}"
    if german:
        s = s.replace(",", "X").replace(".", ",").replace("X", ".")
        return f"{s} {cur}"
    return f"{cur} {s}"


def footer(c):
    c.setFillColor(colors.HexColor("#cc2222"))
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(W / 2, 40, WATERMARK)
    c.setFillColor(colors.black)


def header_rows(c, y, rows, x2=150):
    for label, value in rows:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(LEFT, y, label)
        c.setFont("Helvetica", 10)
        c.drawString(LEFT + x2, y, value)
        y -= 16
    return y


def table_head(c, y, cols):
    c.setFillColor(colors.HexColor("#333333"))
    c.rect(LEFT, y - 6, W - 2 * LEFT, 20, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    for x, text in cols:
        c.drawString(LEFT + x, y, text)
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 9)
    return y - 20


# ---------------------------------------------------------------- AP specs
AP = []

# 101: GST intra-state, CGST 9% + SGST 9%, three lines.
lines101 = [("Carbon Black N330", "CB-N330", 20, "MT", 41500.00), ("Carbon Black N550", "CB-N550", 10, "MT", 39800.00), ("Pallet handling", "SRV-PAL", 30, "EA", 150.00)]
net101 = sum(q * p for _, _, q, _, p in lines101)
AP.append({
    "file": "AP_INV_101_GST_CGST_SGST.pdf", "kind": "gst_split",
    "vendor": "Konkan Process Chemicals Pvt Ltd", "address": ["Plot 7, MIDC Taloja", "Navi Mumbai, Maharashtra 410208, India"],
    "tax_id_label": "GSTIN", "tax_id": "27AAKCK4821Q1Z9", "country": "India", "title": "TAX INVOICE",
    "number": "KPC/2026-27/0458", "date": "2026-09-24", "date_printed": "2026-09-24", "po": "PO-BC-77102", "currency": "INR",
    "bill_to": "Birla Carbon Demo Company (BC01), Taloja Plant, Maharashtra", "terms": "Net 45",
    "lines": lines101, "net": net101,
    "taxes": [("CGST @ 9%", round(net101 * 0.09, 2)), ("SGST @ 9%", round(net101 * 0.09, 2))],
    "gt_tax": {"tax_type": "CGST+SGST", "tax_rate_pct": 9, "cgst_amount": round(net101 * 0.09, 2), "sgst_amount": round(net101 * 0.09, 2)},
})

# 102: GST inter-state, IGST 18%, dd-mm-yyyy date, two lines.
lines102 = [("Rubber process oil RPO-2", "RPO-2", 12000, "L", 92.50), ("Drum deposit", "DRM", 60, "EA", 750.00)]
net102 = sum(q * p for _, _, q, _, p in lines102)
AP.append({
    "file": "AP_INV_102_IGST.pdf", "kind": "igst",
    "vendor": "Narmada Petro Additives Ltd", "address": ["Survey 112, GIDC Ankleshwar", "Bharuch, Gujarat 393002, India"],
    "tax_id_label": "GSTIN", "tax_id": "24AADCN7314H1ZK", "country": "India", "title": "TAX INVOICE (IGST)",
    "number": "NPA-INV-55217", "date": "2026-09-18", "date_printed": "18-09-2026", "po": "PO-BC-77215", "currency": "INR",
    "bill_to": "Birla Carbon Demo Company (BC01), Taloja Plant, Maharashtra", "terms": "Net 30",
    "lines": lines102, "net": net102,
    "taxes": [("IGST @ 18%", round(net102 * 0.18, 2))],
    "gt_tax": {"tax_type": "IGST", "tax_rate_pct": 18, "igst_amount": round(net102 * 0.18, 2)},
})

# 103: German VAT 7%, German language and number format.
lines103 = [("Fachbuch Rußherstellung", "BK-221", 12, "Stk", 89.90), ("Schulungsunterlagen", "BK-305", 40, "Stk", 24.50)]
net103 = round(sum(q * p for _, _, q, _, p in lines103), 2)
AP.append({
    "file": "AP_INV_103_VAT7_DE.pdf", "kind": "vat_de", "german": True,
    "vendor": "Elbtal Fachverlag GmbH", "address": ["Königstraße 14", "01097 Dresden, Deutschland"],
    "tax_id_label": "USt-IdNr.", "tax_id": "DE298173645", "country": "Germany", "title": "RECHNUNG",
    "number": "R-2026-3391", "date": "2026-09-22", "date_printed": "22.09.2026", "po": "PO-BC-80044", "currency": "EUR",
    "bill_to": "Birla Carbon Demo Company (BC01)", "terms": "Zahlbar innerhalb 14 Tagen",
    "lines": lines103, "net": net103,
    "taxes": [("MwSt. 7 %", round(net103 * 0.07, 2))],
    "gt_tax": {"tax_type": "MwSt.", "tax_rate_pct": 7, "vat_amount": round(net103 * 0.07, 2)},
    "language": "German",
})

# 104: Indian services with TDS printed.
lines104 = [("Process audit services, September 2026", "SAC-998311", 1, "LS", 125000.00), ("Travel reimbursement", "SAC-998311", 1, "LS", 8500.00)]
net104 = sum(q * p for _, _, q, _, p in lines104)
AP.append({
    "file": "AP_INV_104_WHT_SERVICES.pdf", "kind": "wht",
    "vendor": "Sahyadri Engineering Advisors LLP", "address": ["Office 402, Baner Road", "Pune, Maharashtra 411045, India"],
    "tax_id_label": "GSTIN", "tax_id": "27AASFS9921L1ZD", "country": "India", "title": "TAX INVOICE",
    "number": "SEA/26/1189", "date": "2026-09-30", "date_printed": "2026-09-30", "po": "PO-BC-81003", "currency": "INR",
    "bill_to": "Birla Carbon Demo Company (BC01)", "terms": "Net 15",
    "lines": lines104, "net": net104,
    "taxes": [("CGST @ 9%", round(net104 * 0.09, 2)), ("SGST @ 9%", round(net104 * 0.09, 2))],
    "wht": ("Less: TDS @ 2% (deducted by customer)", round(net104 * 0.02, 2)),
    "gt_tax": {"tax_type": "CGST+SGST", "tax_rate_pct": 9, "cgst_amount": round(net104 * 0.09, 2), "sgst_amount": round(net104 * 0.09, 2),
               "wht_amount": round(net104 * 0.02, 2), "wht_rate_pct": 2},
})

# 105: two pages, 44 lines, Hungarian VAT 27%.
lines105 = [(f"Spare part kit SPK-{i:03d}", f"SPK-{i:03d}", (i % 5) + 1, "EA", round(45 + i * 3.25, 2)) for i in range(1, 45)]
net105 = round(sum(q * p for _, _, q, _, p in lines105), 2)
AP.append({
    "file": "AP_INV_105_MULTIPAGE_HU.pdf", "kind": "multipage",
    "vendor": "Tisza Industrial Supplies Kft", "address": ["Dózsa György út 41", "3527 Miskolc, Hungary"],
    "tax_id_label": "VAT", "tax_id": "HU24817362", "country": "Hungary", "title": "INVOICE",
    "number": "TIS-2026-004812", "date": "2026-09-26", "date_printed": "2026-09-26", "po": "PO-BC-81120", "currency": "EUR",
    "bill_to": "Birla Carbon Demo Company (BC01)", "terms": "Net 60",
    "lines": lines105, "net": net105,
    "taxes": [("VAT @ 27%", round(net105 * 0.27, 2))],
    "gt_tax": {"tax_type": "VAT", "tax_rate_pct": 27, "vat_amount": round(net105 * 0.27, 2)},
})


def draw_invoice(s):
    german = s.get("german", False)
    c = canvas.Canvas(str(OUT / s["file"]), pagesize=A4)
    tax_total = round(sum(v for _, v in s["taxes"]), 2)
    gross = round(s["net"] + tax_total, 2)
    labels = ({"no": "Rechnungsnummer:", "date": "Rechnungsdatum:", "po": "Bestellnummer:", "cur": "Währung:", "bill": "Rechnungsempfänger:",
               "terms": "Zahlungsbedingungen:", "net": "Nettobetrag:", "total": "Gesamtbetrag:",
               "cols": [(4, "Pos."), (34, "Beschreibung"), (240, "Artikel"), (300, "Menge"), (350, "Einheit"), (395, "Einzelpreis"), (465, "Betrag")]}
              if german else
              {"no": "Invoice Number:", "date": "Invoice Date:", "po": "Purchase Order:", "cur": "Currency:", "bill": "Bill To:",
               "terms": "Payment Terms:", "net": "Taxable Value:", "total": "Invoice Total:",
               "cols": [(4, "#"), (24, "Description"), (240, "Code"), (300, "Qty"), (340, "UOM"), (385, "Unit Price"), (460, "Amount")]})
    page = 1
    y = H - 80
    c.setFont("Helvetica-Bold", 17)
    c.drawString(LEFT, y, s["vendor"])
    c.setFont("Helvetica", 9)
    for a in s["address"]:
        y -= 13
        c.drawString(LEFT, y, a)
    y -= 13
    c.drawString(LEFT, y, f"{s['tax_id_label']}: {s['tax_id']}")
    y -= 26
    c.setFont("Helvetica-Bold", 14)
    c.drawString(LEFT, y, s["title"])
    y -= 24
    y = header_rows(c, y, [(labels["no"], s["number"]), (labels["date"], s["date_printed"]), (labels["po"], s["po"]),
                           (labels["cur"], s["currency"]), (labels["bill"], s["bill_to"]), (labels["terms"], s["terms"])])
    y -= 10
    y = table_head(c, y, labels["cols"])
    for i, (desc, code, qty, uom, price) in enumerate(s["lines"], start=1):
        if y < 110:
            c.setFont("Helvetica-Oblique", 8)
            c.drawString(LEFT, 70, "Continued on next page" if not german else "Fortsetzung auf der nächsten Seite")
            footer(c)
            c.showPage()
            page += 1
            y = H - 80
            c.setFont("Helvetica-Bold", 11)
            c.drawString(LEFT, y, f"{s['vendor']} — {labels['no']} {s['number']} — page {page}")
            y -= 26
            y = table_head(c, y, labels["cols"])
        amount = round(qty * price, 2)
        vals = [str(i), desc, code, f"{qty:,}" if not german else str(qty), uom,
                money(price, s["currency"], german) if german else f"{price:,.2f}", money(amount, s["currency"], german) if german else f"{amount:,.2f}"]
        for (x, _), v in zip(labels["cols"], vals):
            c.drawString(LEFT + x, y, v)
        y -= 15
    y -= 10
    c.setFont("Helvetica", 10)
    rows = [(labels["net"], money(s["net"], s["currency"], german))] + [(n, money(v, s["currency"], german)) for n, v in s["taxes"]]
    rows.append((labels["total"], money(gross, s["currency"], german)))
    if s.get("wht"):
        rows.append((s["wht"][0], money(s["wht"][1], s["currency"], german)))
        rows.append(("Net amount payable:", money(round(gross - s["wht"][1], 2), s["currency"], german)))
    for label, value in rows:
        c.setFont("Helvetica-Bold" if label in (labels["total"],) else "Helvetica", 10)
        c.drawString(LEFT + 260, y, label)
        c.drawRightString(W - LEFT, y, value)
        y -= 15
    footer(c)
    c.save()
    gt = {"vendor_name": s["vendor"], "vendor_tax_id": s["tax_id"], "vendor_country": s["country"], "invoice_number": s["number"],
          "invoice_date": s["date"], "po_number": s["po"], "company_code": "BC01", "currency": s["currency"], "payment_terms": s["terms"],
          "net_amount": round(s["net"], 2), "tax_amount": tax_total, "gross_amount": gross, "document_language": s.get("language", "English")}
    gt.update(s["gt_tax"])
    gt["lines"] = [{"description": d, "quantity": q, "unit": u, "unit_price": p, "net_amount": round(q * p, 2)} for d, _, q, u, p in s["lines"]]
    return gt


# ---------------------------------------------------------------- AR specs
AR = [
    {"file": "AR_REMIT_201_TDS.pdf", "customer": "Malabar Tyre Works Pvt Ltd", "ref": "MTW-PAY-26-0912", "utr": "UTIBR52026092612345",
     "date": "2026-09-26", "currency": "INR",
     "lines": [("ARINV4101", 120000.00, 117600.00, 2400.00, "TDS @2%"), ("ARINV4102", 80000.00, 78400.00, 1600.00, "TDS @2%")],
     "note": "TDS deducted under section 194Q; certificate to follow.", "deduction_reason": "TDS @2%"},
    {"file": "AR_REMIT_202_CREDIT_NOTE.pdf", "customer": "Godavari Polymers Ltd", "ref": "GPL-REM-7781", "utr": "",
     "date": "2026-09-27", "currency": "INR",
     "lines": [("ARINV4201", 60000.00, 60000.00, 0, ""), ("ARINV4202", 25000.00, 17500.00, 7500.00, "Credit note CN-4201 netted")],
     "note": "Credit note CN-4201 (INR 7,500.00) netted against ARINV4202.", "notes_ref": "CN-4201", "deduction_reason": "Credit note CN-4201 netted"},
    {"file": "AR_REMIT_203_NO_REFERENCE.pdf", "customer": "Kaveri Rubber Mills", "ref": "KRM-ON-ACC-0099", "utr": "HDFCR52026092800451",
     "date": "2026-09-28", "currency": "INR", "lines": [], "amount": 45000.00,
     "note": "Payment on account. Please apply to our oldest open invoices."},
    {"file": "AR_REMIT_204_MULTI_DEDUCTION.pdf", "customer": "Coromandel Elastomers Pvt Ltd", "ref": "CEL-PA-55102", "utr": "ICICR52026092900777",
     "date": "2026-09-29", "currency": "INR",
     "lines": [("ARINV4401", 50000.00, 49975.00, 25.00, "Bank charges"), ("ARINV4402", 40000.00, 36000.00, 4000.00, "Quality claim - damaged bags"),
               ("ARINV4403", 30000.00, 29400.00, 600.00, "Early payment discount 2%")],
     "note": "Deductions as listed. Quality claim reference QC-2026-118."},
]


def draw_advice(s):
    c = canvas.Canvas(str(OUT / s["file"]), pagesize=A4)
    y = H - 90
    c.setFont("Helvetica-Bold", 17)
    c.drawString(LEFT, y, s["customer"])
    y -= 22
    c.setFont("Helvetica-Bold", 14)
    c.drawString(LEFT, y, "PAYMENT ADVICE")
    y -= 30
    paid = s.get("amount", round(sum(l[2] for l in s["lines"]), 2))
    rows = [("Payment Reference:", s["ref"])]
    if s["utr"]:
        rows.append(("UTR / Bank Reference:", s["utr"]))
    rows += [("Payment Date:", s["date"]), ("Currency:", s["currency"]), ("Paid To:", "Birla Carbon Demo Company (BC01)"),
             ("Amount Paid:", money(paid, s["currency"]))]
    y = header_rows(c, y, rows)
    if s["lines"]:
        y -= 12
        y = table_head(c, y, [(4, "Invoice"), (90, "Invoice Amount"), (190, "Deduction"), (265, "Reason"), (420, "Amount Paid")])
        for ref, inv_amt, applied, ded, reason in s["lines"]:
            for x, v in [(4, ref), (90, f"{inv_amt:,.2f}"), (190, f"{ded:,.2f}" if ded else "-"), (265, reason or "-"), (420, f"{applied:,.2f}")]:
                c.drawString(LEFT + x, y, v)
            y -= 16
        total_ded = round(sum(l[3] for l in s["lines"]), 2)
        y -= 6
        c.setFont("Helvetica-Bold", 10)
        c.drawString(LEFT + 4, y, "Total")
        c.drawString(LEFT + 190, y, f"{total_ded:,.2f}")
        c.drawString(LEFT + 420, y, f"{paid:,.2f}")
    y -= 26
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(LEFT, y, s["note"])
    footer(c)
    c.save()
    gt = {"customer_name": s["customer"], "payment_reference": s["ref"], "payment_date": s["date"], "currency": s["currency"], "payment_amount": paid}
    if s["utr"]:
        gt["bank_reference"] = s["utr"]
    deds = [l for l in s["lines"] if l[3]]
    if deds:
        gt["deduction_amount"] = round(sum(l[3] for l in deds), 2)
    if s.get("notes_ref"):
        gt["note_references"] = s["notes_ref"]
    if s.get("deduction_reason"):
        gt["deduction_reason"] = s["deduction_reason"]
    gt["invoice_lines"] = [dict({"invoice_reference": r, "invoice_amount": ia, "amount_applied": ap}, **({"deduction_amount": d} if d else {}))
                           for r, ia, ap, d, _ in s["lines"]]
    return gt


if __name__ == "__main__":
    truth = {"_comment": "Ground truth for the Phase 40 SYNTHETIC fixtures (set 2), written by scripts/fixtures/gen_phase40_fixtures.py from the same specs that draw the PDFs. Not Birla Carbon documents. Only printed fields are listed.",
             "ap": {}, "ar": {}}
    for s in AP:
        truth["ap"][s["file"]] = draw_invoice(s)
        print("wrote", s["file"])
    for s in AR:
        truth["ar"][s["file"]] = draw_advice(s)
        print("wrote", s["file"])
    io.open(GT, "w", encoding="utf8", newline="\n").write(json.dumps(truth, indent=1, ensure_ascii=False) + "\n")
    print("ground truth", GT)
