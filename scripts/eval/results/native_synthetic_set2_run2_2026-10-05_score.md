| Group | Expected | Extracted | Exact | Normalized | Correct | Missed | Incorrect | False positive | Accuracy (correct / expected) |
|---|---|---|---|---|---|---|---|---|---|
| header | 113 | 109 | 87 | 23 | 110 | 3 | 0 | 1 | 97.3 % |
| line | 292 | 292 | 227 | 65 | 292 | 0 | 0 | 0 | 100.0 % |
| critical | 50 | 49 | 40 | 10 | 50 | 0 | 0 | 0 | 100.0 % |

Documents scored: 9. Straight-through extraction (every critical field correct, no critical false positive): 9 (100.0 %). Extraction needing correction: 0 (0.0 %). Whether a document then flows through without review is decided by the deterministic pipeline (confidence, completeness, matching), not by this score.

| Document | Result | Differences |
|---|---|---|
| AP_INV_101_GST_CGST_SGST.pdf | CRITICAL OK | none |
| AP_INV_102_IGST.pdf | CRITICAL OK | none |
| AP_INV_103_VAT7_DE.pdf | CRITICAL OK | vat_amount: expected 144.12, got '' |
| AP_INV_104_WHT_SERVICES.pdf | CRITICAL OK | wht_amount: expected 2670.0, got '' |
| AP_INV_105_MULTIPAGE_HU.pdf | CRITICAL OK | none |
| AR_REMIT_201_TDS.pdf | CRITICAL OK | deduction_reason: expected 'TDS @2%', got None |
| AR_REMIT_202_CREDIT_NOTE.pdf | CRITICAL OK | none |
| AR_REMIT_203_NO_REFERENCE.pdf | CRITICAL OK | none |
| AR_REMIT_204_MULTI_DEDUCTION.pdf | CRITICAL OK | deduction_reason: not printed, got 'Quality claim reference QC-2026-118.' |
