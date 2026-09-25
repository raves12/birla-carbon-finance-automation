# Instance Readiness — pwcmanagementservicesdemo01

Date: 2026-09-25

This document records what was directly observed on the target ServiceNow
instance via MCP (`mcp__servicenow__*` tools, authenticated via OAuth Resource
Owner Password Credential grant as `RaviMAdmin`) during Phase 0/1 assessment.

## Application

- Scope: `x_695068_bcfa`, sys_id `229ba2b1a079431e104010f5ea883e85`
- Name: Birla Carbon Finance Automation
- Active: true, version 0.0.1

## Deployed metadata inventory

| Type | Count | Notes |
|---|---|---|
| Tables in scope | 30 | Matches git minus `finance_intake` (not yet deployed) |
| Script Includes in scope | 13 | All core engines + `BCClaudeClient`; `FinanceDocumentIntakeService` and `ApLineResolutionService` **not present** |
| Business Rules in scope | 2 | Both approval cascades; `FinanceIntakeAutoNumber` **not present** |
| UI Actions in scope | 4 | 2× `Approve`, 2× `Explain with Claude`; the 6 Finance Document Intake actions **not present** |
| System properties (`x_695068_bcfa.*`) | 5 found via prefix search (all `claude.*`) — 2 more (`claude.max_attachment_size_bytes`, `claude.allowed_attachment_types`) exist in git but were not confirmed deployed | Confirm full set on next build/install |
| Roles (`x_695068_bcfa.*`) | 8 | Matches git exactly |
| Groups (name contains "BCFA") | 0 | None exist — new work |
| Update sets matching the app | 0 | No update-set trail found; app was likely installed directly via `now-sdk install`, not via update set migration |

## Master data record counts (live query)

| Table | Records |
|---|---|
| `x_695068_bcfa_vendor` | 0 |
| `x_695068_bcfa_customer` | 0 |
| `x_695068_bcfa_purchase_order` | 0 |

Confirms the "data lost" premise stated in the work order. Remediation is
`DemoDataSeeder.seedAll()` once Phase 2 stabilization is complete — see
`docs/IMPLEMENTATION_BACKLOG.md` Phase 3.

## Native AI capability presence (Phase 1 — see also SERVICENOW_AI_READINESS.md)

Confirmed present by table existence (not by entitlement/license check):

- `sn_aia_*` tables (scope "ServiceNow Otto AI Agents") → **AI Agent Studio** is installed.
- `sn_nowassist_*`, `sn_na_*` tables (scopes "AI Admin Hub", "AI Analytics") → **Now Assist** is installed.
- `di_admin_template`, `sys_di_metrics_*` (scope "Document Intelligence Admin") → **Document Intelligence** (the current name for "Content Understanding") is installed.
- `sys_decision`, `sys_decision_multi_result`, `sys_decision_delta` (global scope) → **Decision Tables** are available natively (core platform capability, not a separate plugin).

Not confirmed present:
- A dedicated "Content Understanding" scope by that literal name — the
  capability is present under the **Document Intelligence** scope instead
  (per the work order's own note that this may be the current name).
- `sys_plugins`/`v_plugin` table query failed via the Table API (likely ACL
  or naming restriction) — **entitlement/license status could not be
  confirmed via MCP and requires a manual check** in Now Assist Admin Console
  or AI Agent Studio's own setup UI.

## Connectivity

- OAuth (Resource Owner Password Credential grant, `useraccount` Auth Scope)
  confirmed working end-to-end through the actual MCP server tool path
  (`record_list` against `sys_user` returned live data, including the
  `RaviMAdmin` account).
- Basic Auth is rejected instance-wide (confirmed via the ServiceNow-specific
  401 "User Not Authenticated" signature, independent of account).

## Action items before Phase 2 can complete

1. Run `now-sdk build` then `now-sdk install` against
   `pwcmanagementservicesdemo01` to deploy `finance_intake` table,
   `FinanceDocumentIntakeService`, `ApLineResolutionService`,
   `FinanceIntakeAutoNumber` Business Rule, and the 6 Finance Document Intake
   UI Actions.
2. Re-verify the BCFA workspace, the 2 StateModels, the 2 Flow Designer
   flows, and the ATF tests render/exist post-deployment (not independently
   confirmed in this pass).
3. Confirm licensing/entitlement for AI Agent Studio, Now Assist, and
   Document Intelligence directly in the instance UI (manual admin action —
   cannot be automated via the Table API).
