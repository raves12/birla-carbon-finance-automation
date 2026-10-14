# HANDWRITTEN_GRN_TEST_RESULTS.md (Phase 42)

Goods receipt (GRN) reading on the deployed Phase 42 build, 2026-10-14, instance pwcmanagementservicesdemo01, native
Document Intelligence (Now LLM), use case **BCFA Goods Receipt / GRN Extraction (Now LLM)** (17 fields).

**Bottom line: handwritten GRNs are NOT supported.** Printed GRN numbers and PO numbers are read; handwritten GRN
numbers on the client documents were not read, and one handwritten PO number was read with a wrong digit. Every GRN
reading goes to a person; nothing creates or changes an SAP receipt.

## Sample availability

The client pack has **no standalone handwritten GRN document**. The handwritten goods-receipt evidence it contains:

| Sample | What is handwritten (checked by eye) |
|---|---|
| CS-12 page 2 (Brazil) | Receiving stamp ("Recebimento Mercadoria(s)/Serviço(s)") filled by hand: date 14/07/2026, MIGO (GRN) number (= SAP receipt 5007366994 in the POC data), "Obs." = the PO number, initials |
| CS-02 (India) | "GRN - 5007482798" written across the invoice, a document number at the bottom |
| CS-06 (Egypt) | Two 10-digit receipt numbers written at the top of the invoice |
| CS-01 (India) | SE (service entry) number, PO number with date, approval notes, initials |

Printed GRN pages: CS-23 (Korean / English PO + GRN image), CS-08 page 5 (GRN page in a 5-page invoice package).

## How BCFA handles a GRN document (built, Phase 42)

- Intake document type **Goods Receipt / GRN (evidence)** → `FinanceDocumentIntakeService.processGoodsReceiptDocument`.
- Reading recorded in **GRN Extraction (Evidence)** (`x_695068_bcfa_grn_extraction`): every read value, signature /
  stamp / handwriting answers, the raw extraction (immutable), the reading status:
  PRINTED_READABLE / HANDWRITING_READABLE / PARTIALLY_READABLE / NOT_READABLE from the critical values
  (GRN number, PO number, quantity).
- Compared with the SAP receipt of the same number (`x_695068_bcfa_receipt`, Mock SAP): MATCHES / DIFFERS /
  NO_AUTHORITATIVE_RECEIPT / NOT_COMPARED. No receipt is ever created or changed.
- Always to manual review. A reviewer records a correction as a **Document Evidence Review** (append-only): AI / OCR
  value, reviewer value, reviewer, time, reason. The comparison is redone with the reviewer value; the read value stays.
- Workspace: Document Intake → **Goods Receipts (evidence)**; Accounts Payable → **Evidence Decisions**.
- Test H42-GRN (BCFA Regression): classification, comparison, reviewer correction, no receipt created: passing.

## Client tests

| Test | Sample (intake) | Ground truth (by eye) | Read | Status | Verdict |
|---|---|---|---|---|---|
| GRN-HW-001 Clear handwritten GRN | CS-02 (FDI0000033, AP use case, handwriting fields) | Handwritten "GRN - 5007482798" (an SAP receipt with this number is in the POC data) | GRN not read; "handwritten text present: NO" | Invoice created (AP00000017), receipt linked through its PO line, not through the handwritten number. Separately, the invoice stopped at 3-way match: the HSN code 28012000 was read as the unit price (price exception raised, not a Phase 42 change) | **FAIL** (not read; nothing invented) |
| GRN-HW-002 Partially legible GRN | CS-12 receiving stamp (FDI0000035, GRN use case) | MIGO 5007366994, date, PO 4300033212, initials, all handwritten | MIGO (GRN) number **not read**, quantity not read, date not read; the handwritten PO number **read correctly** (4300033212); "plant" filled with the supplier name; handwriting answered NO | PARTIALLY_READABLE, NOT_COMPARED, manual review | **FAIL** (extraction) / control **PASS** |
| GRN-HW-003 Poor handwriting | CS-01 (FDI0000032, AP use case) | Handwritten PO "1100063205 / 30.06.26", SE number, notes | PO read as "11000 63265\| 30-06.26" (one digit wrong, date joined); SE number not read; handwriting answered NO | Intake to review (currency not read). A misread PO cannot be linked: it would raise a PO exception, never a wrong match | **FAIL** (misread) / control **PASS** |
| Extra: handwritten receipt numbers | CS-06 (FDI0000034, AP use case) | Two handwritten 10-digit numbers | Not read; handwriting answered NO | Review (tax not read) | **FAIL** (not read) |
| Printed GRN 1 | CS-23 (FDI0000036, GRN use case) | GRN 5007505432, PO 6700038549 | GRN and PO correct; receipt date, receiver, material code read; supplier name lost (Korean on an image); quantity not read | PARTIALLY_READABLE; no SAP receipt 5007505432 in the POC data → NO_AUTHORITATIVE_RECEIPT; review | **PASS** for GRN / PO; quantity FAIL |
| Printed GRN 2 | CS-08 page 5 (FDI0000037, GRN use case) | GRN 5007505432, PO 6700038549 | GRN and PO correct; plant read; quantity read as 0.00 (to be checked by the reviewer); supplier name partly (Korean) | Recorded as HANDWRITING_READABLE: **defect**, the extraction answered an empty list "[]" for handwritten values and BCFA counted it as handwriting. Fixed and deployed (phase42_fix1, H42-GRN extended); the record of this run keeps the status it was given | **PASS** for GRN / PO; status defect fixed |

## Findings

1. **Handwriting is read only as OCR text, without knowing it is handwriting.** The model answered "handwritten text
   present: NO" on all four documents with handwriting. So "no handwriting" is never evidence (BCFA records UNKNOWN,
   not NONE, while the capability is text-only).
2. **Handwritten numbers are mostly missed, sometimes misread.** Of 7 handwritten reference numbers: 1 read
   correctly (CS-12 PO), 1 misread by one digit (CS-01 PO), 5 not read (GRN / MIGO on CS-02, CS-12, two on CS-06, SE on
   CS-01).
3. **Printed GRN / PO numbers are reliable** on these samples (4 of 4), Korean supplier names on images are not.
4. **Controls held:** no receipt created or changed; no value invented for an unread field; every reading went to a
   person; a misread reference cannot link to the wrong record (PO / receipt lookup by exact normalized number).

## Acceptance

Not met for handwritten GRN: report as **NOT SUPPORTED on this instance (handwriting)**, printed GRN **PARTIAL**
(numbers yes, quantity not reliably). Human review stays mandatory. Needed: real handwritten GRN slips from the
client, and a native visual (handwriting-aware) reading on this platform.
