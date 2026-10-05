| Group | Expected | Extracted | Exact | Normalized | Correct | Missed | Incorrect | False positive | Accuracy (correct / expected) |
|---|---|---|---|---|---|---|---|---|---|
| header | 123 | 122 | 91 | 30 | 121 | 1 | 1 | 3 | 98.4 % |
| line | 54 | 54 | 54 | 0 | 54 | 0 | 0 | 0 | 100.0 % |
| critical | 75 | 74 | 53 | 20 | 73 | 1 | 1 | 0 | 97.3 % |

Documents scored: 14. Straight-through extraction (every critical field correct, no critical false positive): 12 (85.7 %). Extraction needing correction: 2 (14.3 %). Whether a document then flows through without review is decided by the deterministic pipeline (confidence, completeness, matching), not by this score.

| Document | Result | Differences |
|---|---|---|
| AP_INV_001_CLEAN.pdf | CRITICAL OK | none |
| AP_INV_002_QTY_VARIANCE.pdf | CRITICAL OK | none |
| AP_INV_003_PRICE_VARIANCE.pdf | CRITICAL OK | none |
| AP_INV_004_DUPLICATE.pdf | CRITICAL OK | none |
| AP_INV_005_TAX_EXCEPTION.pdf | CRITICAL OK | none |
| AP_INV_006_LOW_CONFIDENCE.pdf | CRITICAL FIELD WRONG | vendor_name: expected 'Miskolc Freight Svcs.', got ''; freight_amount: not printed, got '3000.00' |
| AR_REMIT_001_EXACT.pdf | CRITICAL OK | none |
| AR_REMIT_002_MULTI_INVOICE.pdf | CRITICAL OK | none |
| AR_REMIT_003_SHORT_PAY.pdf | CRITICAL OK | deduction_amount: not printed, got '2500.00'; deduction_reason: not printed, got 'Partial payment' |
| AR_REMIT_004_BANK_CHARGE.pdf | CRITICAL OK | none |
| AR_REMIT_005_ALIAS_CUSTOMER.pdf | CRITICAL FIELD WRONG | customer_name: expected 'LONE STAR TYRE CO', got 'Lone Star Tyre Corp' |
| AR_REMIT_101_EXACT.pdf | CRITICAL OK | none |
| AR_REMIT_102_MULTI_INVOICE.pdf | CRITICAL OK | none |
| AR_REMIT_103_BANK_CHARGE.pdf | CRITICAL OK | none |
