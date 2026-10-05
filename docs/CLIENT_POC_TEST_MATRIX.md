# CLIENT_POC_TEST_MATRIX.md: coverage matrix, test data and test IDs (Phase 40)

Status 2026-10-05. Results are from instance `pwcmanagementservicesdemo01`.

## 1. Client samples

| Item | Count |
|---|---|
| Birla Carbon AP invoices received | **0** |
| Birla Carbon AR payment advices received | **0** |
| Synthetic fixtures (project-generated, watermarked SYNTHETIC) | 23 (11 AP, 12 AR) |

No country, layout or accuracy below is a client result. When samples arrive:
1. keep them outside git unless Birla Carbon approves;
2. write the ground truth first;
3. measure them with the evaluation scripts (`OCR_ACCURACY_REPORT.md` §6);
4. add a column to the matrix below.

## 2. Country and language coverage (synthetic only)

Countries come from the fixtures the project generated, not from a Birla Carbon country list. Countries not listed here are **NOT TESTED**.

| Country | Language | Document | Tax content | Fixture(s) | Extraction (synthetic) | Tax validation |
|---|---|---|---|---|---|---|
| India | English | AP invoice | GST 18 % (single line) | AP_INV_001, 004, 005 | Measured | Configured (GST 18 %) |
| India | English | AP invoice | CGST 9 % + SGST 9 % | AP_INV_101 | Measured | Configured |
| India | English | AP invoice | IGST 18 %, date dd-mm-yyyy | AP_INV_102 | Measured | Configured |
| India | English | AP invoice | Services: GST + TDS 2 % printed | AP_INV_104 | Measured (WHT amount missed) | Configured (WHT 2 %, code IN-TDS-SERVICES (POC)) |
| India | English | AR advice | TDS, credit note, no reference, multiple deductions | AR_REMIT_001-004, 101-103, 201-204 | Measured | n/a |
| Germany | English | AP invoice | VAT 19 % | AP_INV_002 | Measured | Configured (VAT 19 %) |
| Germany | **German** | AP invoice | MwSt. 7 %, German number format | AP_INV_103 | Measured (VAT component missed) | 7 % fails against the 19 % row: reduced rates need a rule row |
| Hungary | English | AP invoice | VAT 27 %, 2 pages, 44 lines | AP_INV_105 | Measured | Configured (VAT 27 %) |
| Hungary | English | AP invoice | Degraded (no vendor name, freight only) | AP_INV_006 | Measured: goes to review | Configured |
| Hungary | English | AR advice | Short payment, EUR | AR_REMIT_003 | Measured | n/a |
| United States | English | AP invoice | No sales tax | AP_INV_003 | Measured | Configured (0 %) |
| United States | English | AR advice | Alias customer, USD | AR_REMIT_005 | Measured (payer alias read as legal name) | n/a |
| Any other | any | any | any | none | **NOT TESTED** | Not configured → MANUAL REVIEW |

## 3. Test data matrix

| Fixture | Purpose | Key facts |
|---|---|---|
| AP_INV_001_CLEAN | Clean match | INR 5,000 + GST 900 |
| AP_INV_002_QTY_VARIANCE | Quantity variance | 15 billed vs GRN quantity |
| AP_INV_003_PRICE_VARIANCE | Price variance, US | USD, no tax |
| AP_INV_004_DUPLICATE | Duplicate | Same content as 001 |
| AP_INV_005_TAX_EXCEPTION | GST mismatch | 50 printed vs 360 expected |
| AP_INV_006_LOW_CONFIDENCE | Low confidence | Vendor unreadable, no quantities |
| AP_INV_101_GST_CGST_SGST | Split GST | 3 lines, CGST 110,925 + SGST 110,925 |
| AP_INV_102_IGST | IGST, date format | 2 lines, IGST 207,900 |
| AP_INV_103_VAT7_DE | German language and numbers | MwSt. 7 %, 144.12 |
| AP_INV_104_WHT_SERVICES | Withholding | TDS 2 % printed (2,670) |
| AP_INV_105_MULTIPAGE_HU | Multi-page | 44 lines over 2 pages, VAT 27 % |
| AR_REMIT_001_EXACT / 101_EXACT | Exact reference | One invoice |
| AR_REMIT_002 / 102_MULTI_INVOICE | Multi-invoice | 3 / 2 invoices |
| AR_REMIT_003_SHORT_PAY | Short pay | Partial payment, EUR |
| AR_REMIT_004 / 103_BANK_CHARGE | Bank charge | 25 / 500 deducted |
| AR_REMIT_005_ALIAS_CUSTOMER | Alias | Remitter name differs from the customer master |
| AR_REMIT_201_TDS | Withholding | TDS 2 % on 2 invoices |
| AR_REMIT_202_CREDIT_NOTE | Credit note | CN-4201 netted |
| AR_REMIT_203_NO_REFERENCE | No invoice reference | On-account payment |
| AR_REMIT_204_MULTI_DEDUCTION | Several deductions | Bank charge, quality claim, early payment discount |

Generators: `scripts/fixtures/gen_phase40_fixtures.py` (set 2) and the Phase 31-35 generator (set 1). Ground truth is written from the same specifications.

## 4. Test IDs and results

Sources:
- **ATF**: suite *BCFA Regression*.
- **E2E**: `scripts/deploy/phase40_e2e_bg.js`. Latest run FAAD2, 11/11, 2026-10-05.
- **EVAL**: native extraction measurement (`OCR_ACCURACY_REPORT.md`).

### AP

| ID | Scenario | Source | Result |
|---|---|---|---|
| AP-OCR-001 | Clean invoice: header and lines extracted natively | EVAL (11 AP fixtures), CP-EXT mapping | PASS (synthetic) |
| AP-OCR-002 | Number and date formats (German, Indian, dd-mm-yyyy) | EVAL AP_INV_102 / 103, CP-EXT `_num` | PASS after the parser fix |
| AP-OCR-003 | Multi-page invoice, 44 lines | EVAL AP_INV_105 | PASS (all line values correct) |
| AP-OCR-004 | Low confidence goes to review | CP-EXT, EVAL AP_INV_006 | PASS |
| AP-OCR-005 | Tax breakdown extracted (CGST / SGST / IGST / VAT / WHT) | EVAL AP_INV_101-104 | PARTIAL: VAT component (German) and WHT amount missed in both runs |
| AP-OCR-006 | Native failure goes to manual review, never simulated values | CP-EXT | PASS |
| AP-TAX-001 | Valid GST (CGST + SGST, IGST, component rate 9 %) | CP-TAX, E2E | PASS |
| AP-TAX-002 | GST mismatch, unequal halves, IGST with CGST/SGST | CP-TAX, E2E | PASS |
| AP-TAX-003 | Valid VAT, VAT within tolerance | CP-TAX | PASS |
| AP-TAX-004 | VAT mismatch (7 % vs 19 %), regime warning | CP-TAX, E2E | PASS |
| AP-TAX-005 | Withholding applicable (configured), printed and correct | CP-TAX, E2E | PASS |
| AP-TAX-006 | Withholding mismatch; printed but not configured → manual review | CP-TAX, E2E | PASS |
| AP-TOL-001 | Quantity within tolerance, rule and detail stored | CP-TOL, E2E | PASS |
| AP-TOL-002 | Quantity outside tolerance | CP-TOL, E2E | PASS |
| AP-TOL-003 | Price within tolerance | CP-TOL | PASS |
| AP-TOL-004 | Price outside tolerance | CP-TOL | PASS |
| AP-TOL-005 | Tax within tolerance | CP-TOL | PASS |
| AP-TOL-006 | Tax outside tolerance | CP-TOL | PASS |

### AR

| ID | Scenario | Source | Result |
|---|---|---|---|
| AR-OCR-001 | Single-invoice advice extracted natively | EVAL | PASS (synthetic) |
| AR-OCR-002 | Multi-invoice advice: references and applied amounts | EVAL, CP-EXT | PASS |
| AR-OCR-003 | Advice without amount or invoices goes to review | CP-EXT | PASS |
| AR-OCR-004 | Deductions and reasons per invoice | EVAL AR_REMIT_201 / 204 | PASS per invoice; header reason varies between runs |
| AR-OCR-005 | Payer alias printed differently from the master | EVAL AR_REMIT_005 | FAIL in extraction (legal name returned); customer resolution catches it |
| AR-REC-001 | Exact invoice reference match | ATF Matching Engine — AR | PASS |
| AR-REC-002 | Multi-invoice exact combination; ambiguous never chosen | ATF Matching Engine — AR, ambiguous combinations | PASS |
| AR-REC-003 | No invoice reference: exact amount | E2E | PASS |
| AR-REC-004 | Open items read through IntegrationService before matching; adapter by configuration; a failed read keeps the cached items | CP-DED; E2E (Phase 35 run C119F, Phase 40 run 63D87) | PASS (MOCK SAP). Closed 2026-10-05: `ArDomainService.refreshOpenItems` calls `getOpenItems` and updates the local open-item cache the matching engine reads |
| AR-DED-001 | Bank charge suggested from the advice | CP-DED | PASS |
| AR-DED-002 | Short pay without a reason: manual review | CP-DED | PASS |
| AR-DED-003 | TDS stated on the advice → withholding tax | CP-DED, E2E | PASS |
| AR-DED-004 | Credit note netting | CP-DED | PASS |
| AR-DED-005 | Unknown reason / dispute not auto-classified | CP-DED | PASS |
| AR-DED-006 | Incorrect AI deduction suggestion is refused by the rules | E2E | PASS |
| AR-DED-007 | Human rejects the AI recommendation | E2E | PASS |

### Playbooks

| Test | Result after the Phase 40 Playbook update (2026-10-05) |
|---|---|
| PB-UI-001 Both Playbooks, 8 and 9 stages | PASS |
| PB-UI-002 Stages wait on the journey order | PASS |
| PB-UI-003 Read-only activity types only | PASS |
| PB-AP-004 Extraction and MOCK SAP labels | PASS |
