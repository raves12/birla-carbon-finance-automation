# OPEN_SAP_GAPS.md — Birla Carbon Finance Automation

Placeholder created in Stage 2 (Application Foundation). Populated in Stage 12 of the project
brief (Section 12: SAP Open Gaps) with a full writeup — business purpose, expected ServiceNow
operation, candidate SAP mechanism, unresolved question, required SAP validation, required field
mapping, authorization requirement, response/error behavior, idempotency requirement — for each of:

- **FB05** (cash clearing) — proposal contradiction: p.21 T-code matrix reports BAPI/API available,
  p.19 narrative states no released BAPI exists for cash clearing. Remains open pending a real SAP
  technical spike; not resolvable from the workbook or this PDI alone (no SAP connectivity exists
  here — see `DISCOVERY.md`).
- **ML81N** (service entry / SRN) — used in the AP flow (workbook p.12) but absent from the
  proposal's T-code availability matrix (p.21). No confirmed interface.
- **PGI** (post goods issue) — proposal flow names `VL03N`, but the matrix reports no API/BAPI/IDoc
  for it; out of scope for this build (O2C is future scope) but recorded for when O2C is picked up.

Per the project's non-negotiable principles, this document must never claim an SAP API is
available unless independently verified — every entry above stays flagged open until a real SAP
technical spike (outside this POC's mock-only scope) resolves it.
