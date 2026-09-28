"""Generates the Phase 13 (POC 2 cash application) synthetic remittance PDFs.

Same layout and watermark as the Phase 4 fixtures (docs/DOCUMENT_FIXTURES.md).
Every name is fictional. Run from the repo root:

    python scripts/fixtures/gen_poc2_remittances.py
"""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parents[2] / "test" / "fixtures"

REMITTANCES = [
    {
        "file": "AR_REMIT_101_EXACT.pdf",
        "customer": "Sahyadri Tyre Works Pvt Ltd",
        "bank_reference": "BANK-POC2-001",
        "amount": "INR 50,000.00",
        "lines": [("ARINV1001", "INR 50,000.00")],
        "note": "Payment settles invoice ARINV1001 in full.",
    },
    {
        "file": "AR_REMIT_102_MULTI_INVOICE.pdf",
        "customer": "Nilgiri Rubber Compounds Ltd",
        "bank_reference": "BANK-POC2-002",
        "amount": "INR 80,000.00",
        "lines": [("ARINV2001", "INR 50,000.00"), ("ARINV2002", "INR 30,000.00")],
        "note": "One payment covering two open invoices.",
    },
    {
        "file": "AR_REMIT_103_BANK_CHARGE.pdf",
        "customer": "Vindhya Elastomers Pvt Ltd",
        "bank_reference": "BANK-POC2-003",
        "amount": "INR 79,500.00",
        "lines": [("ARINV3001", "INR 50,000.00"), ("ARINV3002", "INR 29,500.00 (of INR 30,000.00 due)")],
        "note": "Amount remitted less INR 500.00 correspondent bank charges.",
    },
]


def draw(spec):
    path = OUT / spec["file"]
    c = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    left = 25 * 2.83465  # 25 mm

    y = height - 90
    c.setFont("Helvetica-Bold", 18)
    c.drawString(left, y, spec["customer"])
    y -= 24
    c.setFont("Helvetica-Bold", 14)
    c.drawString(left, y, "REMITTANCE ADVICE")

    y -= 34
    fields = [
        ("Bank Reference:", spec["bank_reference"]),
        ("Payment Date:", "2026-09-26"),
        ("Currency:", "INR"),
        ("Paid To:", "Birla Carbon Demo Company (BC01)"),
        ("Remitted Amount:", spec["amount"]),
    ]
    for label, value in fields:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(left, y, label)
        c.setFont("Helvetica", 10)
        c.drawString(left + 140, y, value)
        y -= 18

    y -= 12
    c.setFillColor(colors.HexColor("#333333"))
    c.rect(left, y - 6, width - 2 * left, 22, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(left + 4, y, "Invoice Reference")
    c.drawString(left + 310, y, "Amount Applied")
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 10)
    y -= 24
    for reference, applied in spec["lines"]:
        c.drawString(left + 4, y, reference)
        c.drawString(left + 310, y, applied)
        y -= 18

    y -= 16
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(left, y, spec["note"])

    c.setFillColor(colors.HexColor("#cc2222"))
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width / 2, 40, "SYNTHETIC SAMPLE DATA — FOR DEMO/TEST USE ONLY — NOT A REAL TRANSACTION")
    c.save()
    return path


if __name__ == "__main__":
    for spec in REMITTANCES:
        print("wrote", draw(spec))
