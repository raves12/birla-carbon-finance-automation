# USER_EXPERIENCE.md — Birla Carbon Finance Automation

Stage 9 output and scope decision.

## What exists

Every table in this app (Stage 3) automatically gets a standard ServiceNow list view and form view,
scoped by the ACLs built in Stage 4 — an `ap_processor` can open AP Invoice/Exception/Approval
records, an `ar_processor` the AR equivalents, a `finance_approver` sees the approval queue, and an
`auditor` sees the evidence tables read-only. Related lists (AP Invoice → AP Invoice Line/AP
Extraction/AP Match/AP Exception/AP Approval, and the AR equivalents) give a reviewer the full
evidence trail for one record without custom UI work, because they follow directly from the
`ReferenceColumn` relationships already defined in the data model.

This is a genuinely usable reviewer experience for this POC: an AP processor can find open AP
Exceptions (list view, filtered by `status=open`), open one, see the linked invoice, extraction
confidence, match variances, and the simulated AI recommendation, and act on it — all through
platform-generated forms.

## What was deliberately not built, and why

The brief's target UX (`AP Workspace`, `Cash Application Workspace`, `Exception Queue`, `Finance
Operations Dashboard` as purpose-built Configurable Workspace/UI Builder experiences) was **not**
built in this POC. Reasons:

1. `docs/ARTIFACT_STRATEGY.md` flagged UI Builder/Configurable Workspace Fluent coverage as
   unconfirmed going in ("If Stage 9 confirms Fluent can define the workspace/list/form config,
   prefer that instead — will verify before assuming either way"). Having now reached Stage 9: no
   `Workspace`/`UIBuilder`-equivalent Fluent API turned up alongside the confirmed ones (`Table`,
   `Acl`, `Role`, `BusinessRule`, `Flow`/`Subflow`/`Action`, `StateModel`) while building every
   other stage — there is a `workspace` guide subfolder in the bundled docs, but building a full
   custom workspace is a substantially larger, UI-driven effort than this POC's remaining scope
   allows for once weighed against finishing the full state-machine/testing/demo-data work.
2. A custom workspace's *value* here is discoverability and a nicer visual layout — it does not
   change what a reviewer can actually see or do, which is already fully governed by the ACLs and
   relationships already built. The standard list/form UI is a strict subset of the same
   functionality, not a different one.

## Recommended manual next step

Build the AP Workspace / Cash Application Workspace / Exception Queue / Finance Operations
Dashboard in UI Builder / Configurable Workspace through Studio, against the tables and ACLs this
POC already deployed — no data model or security changes are needed first. This is exactly the
"document the exact manual step" fallback the project's own principles call for when an artifact
isn't confirmed Fluent-buildable within the available time.
