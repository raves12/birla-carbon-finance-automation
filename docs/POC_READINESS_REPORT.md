# POC_READINESS_REPORT.md (Phase 41, 2026-10-08)

Evidence-based readiness of the Birla Carbon Finance Automation POC after the hardening for the client sample pack and
the POC team's defects. A row is PASS only with evidence from the instance (ATF, manual run or client-sample run).

## 1. Where things stand

- **Deployed** on the instance on 2026-10-08: all Phase 41 fixes, the extended Document Intelligence fields, forms and
  labels, and both Playbooks (re-activated). Details: `DEFECT_REMEDIATION_REPORT.md`.
- **ATF, BCFA Regression:** 49 / 49 passed on 2026-10-08 (serial run of every test, after all deploys).
- **Client sample pack:** all 28 samples processed with native Document Intelligence on the instance
  (`CLIENT_DOCUMENT_TEST_MATRIX.md`):
  - Latin-script invoices (English, Italian, Portuguese): 85 % of critical fields read correctly;
  - English payment advices: 95 %;
  - Chinese VAT e-invoices, the Korean image invoice and the Thai scan: mostly not read, because the platform's reading
    step loses those scripts (`MULTILINGUAL_DOCUMENT_INTELLIGENCE_READINESS.md`). Nothing is invented; they go to
    review.
- **SAP:** MOCK SAP only; no live SAP is claimed. SAP-ready request data and real-outcome mapping are built
  (`SAP_ACTIVATION_CHECKLIST.md`).

## 2. Final readiness

### Defects

| Item | Status | Evidence / what remains |
|---|---|---|
| Defect D6 (approver decision reason) | **PASS (ATF)** | H41-D6; manual MT-41-01 as Finance Approver (POC team) |
| Defect 1 (duplicate loop) | **PASS** | H41-D1; client pairs CS-13/14 and CS-26/27 detected as duplicates, no new transaction |
| Defect 2 (stale error) | **PASS (ATF)** | H41-D2/D3 |
| Defect 3 (no attachment) | **PASS (ATF)** | H41-D2/D3 |
| Defect 4 (blank approver) | **DEPLOYED** | Eligible Approvers set on new approvals; manual MT-41-05 |
| Defect 5 (currency) | **PASS (ATF)** | H41-D5 |
| Defect 6 (re-run match / validation) | **PASS (ATF)** | H41-D6b; manual MT-41-07 |
| Defect 7 (Playbook extracted data) | **DEPLOYED** | Playbooks re-activated; visual check MT-41-08 |
| Defect 8 (AR correlation) | **PASS** | H41-D8 (7 scenarios); no client advice linked on weak evidence |
| Defect 9 (shipping) | **PASS (ATF)** | H41-D9 on the Uline figures; the Uline file (14.7 MB) itself must be split first |
| Defect 10 (AR null state) | **PASS (ATF)** | H41-D10 |
| Defect 11 (multilingual) | **PARTIAL** | Latin scripts verified on client documents; Chinese VAT e-invoices, scanned Korean and Thai not readable on this instance (platform); 5 languages have no client sample |
| Found in the run: E5 (duplicate intake numbers), E6 (normalization noise) | **PASS** | Fixed and deployed; H41-NUM |

### Capabilities

| Capability | Status | Evidence / what remains |
|---|---|---|
| Native AP Document Intelligence | **PASS on Latin-script client invoices** (85 % critical fields); **FAIL on Chinese / Korean / Thai invoices** | Client run 2026-10-08; review catches every gap |
| Native AR Document Intelligence | **PASS on English advices** (95 %); Chinese bank advices PARTIAL (payer read as the remitting bank) | CS-04 TDS per invoice, CS-05 / CS-09 per-invoice lines reconcile |
| Image-only / scanned documents | **PASS for Latin scripts** (CS-01, CS-02, CS-07, CS-11, CS-12); handwriting **not read** | Handwritten PO / GRN / SE numbers missed or misread |
| Digital PDFs | **PASS** (English, Chinese bank forms); Chinese VAT e-invoices FAIL (platform) | |
| Multi-document PDF segmentation | **PARTIAL** | Supporting PO totals never contaminated the invoice (CS-11, CS-12 traps passed); page numbers reported by the model are imprecise; no reviewer page-selection UI |
| Large documents | **PASS (control)** | 28-page CS-25 read on all pages (net / tax missed); 14.7 MB CS-28 stopped by the 4 MB check with a clear instruction |
| Shipping / freight | **PASS (ATF)** | H41-D9 |
| Tax component model | **PARTIAL** | Components read (CGST / SGST on CS-01, CS-02; VAT on CS-26); validation only for configured regimes |
| TDS / WHT | **PASS (AR, client)**; AP as Phase 40 | CS-04: TDS per invoice read and reconciled |
| Cross-currency handling | **PASS (ATF)** | H41-D5; MOCK SAP lacks CAD / CNY / KRW / BRL / THB rates (review) |
| AR correlation | **PASS** | H41-D8; client advices unlinked when the customer is unknown |
| Duplicate detection | **PASS** | Hash duplicates on the client pairs; invoice-level duplicate CS-08 / CS-19 not testable (invoice number not read) |
| Playbook | **PASS (re-activated)** | Visual check of the Document Understanding stage by the POC team |
| Approvals / SoD | **PASS (ATF)** | Withdrawal (H41-D6b); eligible approvers deployed |
| ATF Regression | **PASS 49/49 (2026-10-08)** | |

### Languages

| Language | Status |
|---|---|
| English | **VERIFIED WITH CLIENT SAMPLE** (invoices and advices; handwriting excluded) |
| Italian | **VERIFIED WITH CLIENT SAMPLE** (CS-07) |
| Portuguese | **VERIFIED WITH CLIENT SAMPLE** (CS-12); CS-11 partial |
| Chinese | **NOT SUPPORTED ON THIS INSTANCE for VAT e-invoices** (platform); bank advices partial |
| Korean | **NOT SUPPORTED ON THIS INSTANCE for image invoices** (platform); digital pages keep Hangul |
| Thai | **NOT SUPPORTED ON THIS INSTANCE for scans** (platform) |
| French, Spanish, Arabic, Hindi | **CLIENT SAMPLE REQUIRED** |
| Hungarian | Synthetic only; **CLIENT SAMPLE REQUIRED** |

Per the completion rules, these are **not** declared complete:
- multilingual support (Chinese, Korean, Thai fail; five languages untested);
- invoice processing for multi-document packages (page layout imprecise; large files need splitting);
- tax handling beyond the configured regimes.

## 3. Findings from the client pack that need a decision

1. **Chinese / Korean / Thai reading (platform):** raise with ServiceNow (`HANDOVER_TASKS.md` 4a). Until then, these
   documents are processed by a person from review.
2. **Bank acceptance drafts (China, CS-10):** BCFA has no notes-receivable model; in scope for China AR or not?
3. **Own sales invoices sent as "samples" (CS-17, CS-20):** AR open items. BCFA routes group-company sellers to review
   (could not trigger here because the Chinese text was not read).
4. **Bank credit advices without invoice references (CS-15, CS-21, CS-13/14):** cash application relies on customer and
   amount, or SAP open items; expect review unless an exact single open item matches.
5. **Client master data:** every client sample stopped at "vendor / customer not in master data". Load the client
   vendors and customers to take samples past review.
6. **Large files:** CS-28 (14.7 MB) must be sent as invoice pages only (4 MB per file).
7. **FX rates:** production rates must come from SAP (TCURR) or the client's treasury source.

## 4. Manual E2E regression

Defect behaviour is covered by ATF. The persona steps (approver decisions, SoD) are run by the POC team with
`MANUAL_TEST_CASES.md` (MT-41-*) and `deliverables/BCFA_Manual_Test_Workbook.xlsx` (P41-*).

| AP | AR |
|---|---|
| Clean invoice | Exact match |
| Quantity exception | Multi-invoice (CS-05) |
| Price exception | TDS (CS-04 Apollo) |
| Tax exception | Bank charge (CS-14) |
| Duplicate (CS-26/27 verified; CS-08/CS-19 not testable) | Short pay |
| Foreign currency (USD invoice on INR PO) | Ambiguous customer |
| Freight / shipping (Uline pages, split) | Wrong-customer correlation attempt (same reference, other customer) |
| Multilingual (CS-07, CS-12 verified; CS-03, CS-08, CS-27 platform limitation) | Late remittance |
| Multi-document bundle (CS-12, CS-16, CS-22, CS-25) | Multilingual (CS-15, CS-21) |
| Low confidence | Approval / SoD (requester, processor, AI identity) |
| Approval / SoD + Re-run with pending approval | UNKNOWN_OUTCOME |
| UNKNOWN_OUTCOME | |

## 5. Next steps

1. POC team: run the persona steps of §4 and record them in the workbook.
2. Client IT with ServiceNow: the Chinese / Korean / Thai reading question (`HANDOVER_TASKS.md` 4a).
3. Birla Carbon: decisions in §3; samples in French, Hungarian, Spanish, Arabic and Hindi.
4. Merge the Phase 41 pull request (the client documents stay out of git).
