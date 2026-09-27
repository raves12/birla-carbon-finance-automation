# ServiceNow Native AI Readiness (Phase 1)

Date: 2026-09-25
Instance: `pwcmanagementservicesdemo01.service-now.com`

This assesses whether the target instance can support the native-AI
architecture mandated for this program (no external LLM APIs; ServiceNow AI
Agent Studio, Now Assist, Content Understanding/Document Intelligence,
Decision Tables). Findings are from live MCP table/schema inspection, not
from the instance's own Store/entitlement UI (which MCP cannot reach).

| Capability | AVAILABLE | INSTALLED | LICENSED | CONFIGURED | ACTION REQUIRED |
|---|---|---|---|---|---|
| **AI Agent Studio** (`sn_aia_*`, scope "ServiceNow Otto AI Agents") | Yes | Yes | Unconfirmed | No (no BCFA agents created yet) | Confirm entitlement in AI Agent Studio UI; then Phases 8–9 (create 7 agents) |
| **Now Assist / AI Admin Hub** (`sn_nowassist_*`, `sn_na_*`) | Yes | Yes | Unconfirmed | No (no BCFA skills configured) | Confirm entitlement in Now Assist Admin Console; then Phase 6 (generative AI skills) |
| **Document Intelligence / Now Assist DocIntel** (`sys_di_task_definition`, `sys_di_key`) — current name for "Content Understanding" | Yes | Yes | **Confirmed working (2026-09-27)** | **Yes** — 2 use cases live (AP: 13 fields, AR: 10 fields), see `docs/CONTENT_UNDERSTANDING.md` | None — Phase 5 complete |
| **Decision Tables** (`sys_decision`, global scope) | Yes | Yes (core platform) | Yes (not a separately licensed plugin) | No (no BCFA decision tables created yet) | None blocking — proceed directly to Phase 15 |
| **Now Assist Guardian** | Not independently confirmed | Unconfirmed | Unconfirmed | No | Check for `sn_naguardian_*`/similar tables in a follow-up pass before Phase 21 |
| **AI Control Tower** | Not independently confirmed | Unconfirmed | Unconfirmed | No | Check before Phase 23; treat as license-gated until confirmed, do not block core POC on it |
| **Now LLM Service** (model selection surface used by AI Agent Studio/Now Assist) | Implied by AI Agent Studio presence | Likely | Unconfirmed | No | Confirm which underlying model(s) are enabled once inside AI Agent Studio's agent-creation wizard |

## Why "LICENSED" is unconfirmed rather than "No"

The Table API query for `sys_plugins` (the usual home of plugin
activation state) failed under the current role/ACL — this is a known
ServiceNow restriction (plugin activation state is generally not exposed
through the Table API even to admins, by design, to prevent scripted plugin
manipulation). The presence of `sn_aia_*`, `sn_nowassist_*`, and
`di_admin_template` tables proves the **plugins are activated** (a table only
exists once its owning plugin has run its install scripts), which is
actually the stronger signal — but it doesn't prove the **subscription
entitlement** behind Now Assist/AI Agent Studio is currently active (that's a
separate, commercial gate that can allow the tables to exist while blocking
actual agent execution with a "not entitled" error at runtime).

**Practical implication**: proceed with building AI Agent Studio agents,
Now Assist skills, and Document Intelligence document types (Phases 5–9) as
if entitled, since the tables/UI are present — but the very first live test
of each (Phase 8's first agent run, Phase 5's first document extraction) is
the actual entitlement check. If any of them return an entitlement/license
error at runtime, that specific capability moves to LICENSE DEPENDENT with
exact activation steps documented, and the corresponding POC step falls back
to `AISimulationService` (already present and working) rather than
reintroducing an external AI call.

## Recommended manual verification (user/admin action, cannot be automated)

1. Open **Now Assist Admin Console** (`/now/nowassist-admin`) and confirm at
   least one Now Assist application/skill family shows an active
   subscription.
2. Open **AI Agent Studio** (`/x/sn_aia/...` or via the Now Assist admin
   console's agent builder) and confirm a new agent can be created without
   a licensing error.
3. Open **Document Intelligence Admin** and confirm a document type can be
   created and a test extraction run without a licensing error.

## Conclusion for Phase 1

No blocker identified yet. All required plugins are installed. Proceeding to
Phase 2 (stabilization) and then Phase 5+ (native AI build-out); each native
AI capability will be treated as tentatively available until its first live
call either succeeds or returns an explicit entitlement error, at which point
this document will be updated with the confirmed status and, if needed, an
ACTION REQUIRED entry with exact manual steps.
