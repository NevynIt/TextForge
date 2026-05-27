# WP-LUA-POWER-SESSION — Lua Self-Escalation Session + One-Click Recovery

| Field | Value |
|---|---|
| Legacy source | User discussion (power mode simplification for Lua) |
| Type | optional automation |
| Status | candidate |
| Depends on | WP-LUA (validated), current Lua console/session runtime |
| Enables | High-trust Lua workflows with fast recovery |
| Can be deferred | yes |
| Production required | no |

## Purpose

Define a focused follow-on workpackage that allows Lua to self-escalate into a higher-permission session mode with minimal friction, while preserving a strong recovery path.

This page now records a canonical candidate workpackage in the V18 roadmap. It is startable once selected because it depends only on validated `WP-LUA`, but it does not imply implementation has started.

## What power mode is

Power mode is an elevated Lua session mode where Lua is allowed to call into selected rich JavaScript host objects directly, instead of being limited to the narrow default tf.* bridge only.

In default mode, Lua stays inside the constrained bridge surface and cannot directly interact with internal runtime objects.

In power mode, Lua receives direct handles to approved host objects for advanced inspection and control. The point is to unlock high-agency local automation in one active session, with clear UI indication and fast recovery.

### Example host objects and what they enable

The exact exposed object list is implementation-controlled. To keep rollout deliberate, power mode exposure is split into three levels.

### Minimum level

| Example host object | Example methods/properties | What this enables in Lua |
|---|---|---|
| Workspace service object | getEntryByPath, createTextResource, createFolder, saveTextResource, resolveReference | Inspect workspace state, generate resources, run multi-step scripted refactors, and produce derived artifacts without manual UI steps. |
| Lua execution service object | runSnippet, runConsoleCommand, discover, runAutomation, getAutomationDefinitions | Script higher-order Lua automation flows that discover, validate, and execute automations dynamically. |
| Command dispatcher/registry object | execute(commandId), resolve(context) | Drive shell commands programmatically for repeatable workflows (open views, run actions, trigger exports, and batch operations). |

### Expected level

| Example host object | Example methods/properties | What this enables in Lua |
|---|---|---|
| Surface/session host object | listOpenSurfaceSessions, openResourceEntry, move/focus/close session actions | Orchestrate viewer/editor sessions from scripts, including opening targeted surfaces and managing layout flows. |
| Contribution registry/context resolver object | resolveDocumentContext, registerManifest, manifest queries | Inspect active capabilities/contributions and build diagnostics or tooling that adapts to current capability context. |
| Pipeline trace/runtime integration object | pipeline invocation hooks, trace metadata access | Build scripted pipeline orchestration and inspect intermediate outputs for debugging and quality checks. |

### Optional level

| Example host object | Example methods/properties | What this enables in Lua |
|---|---|---|
| Diagnostics aggregation object | current diagnostics list, publish/clear scoped diagnostics | Generate script-defined diagnostics and integrate script findings into normal diagnostics workflows. |

These levels describe possible power-mode exposure targets and rollout priority, not a requirement to expose every internal object.

## Scope

This workpackage covers only the behavior agreed in discussion:

1. Lua can self-escalate to power mode.
2. No double confirmation is required.
3. No auto-expire timer is used.
4. Elevation is session-scoped.
5. The Lua Console visibly indicates elevated state (badge/marker).
6. Recovery is one click and restarts the app.
7. Recovery restart skips Lua preload on next boot.
8. Normal editor/workspace save behavior remains unchanged.
9. Console transcript is lost after restart (same as normal restart behavior).

## Non-goals

1. No new role/account/identity permission system.
2. No background watchdog, lease timeout, or forced auto-downgrade.
3. No second "are you sure" prompt after Lua requests elevation.
4. No change to broad app security model outside Lua session elevation mechanics.
5. No implied ITM-to-Lua bridge expansion in this workpackage.

## Current anchors in code

Implementation should be planned around existing Lua/runtime integration points:

1. Lua console state/session handling in apps/textforge-web/src/workbench.js.
2. Automation discovery trigger during workspace hydration in apps/textforge-web/src/workbench.js.
3. Console session runtime in packages/lua/src/index.js (createLuaExecutionService / runConsoleCommand).
4. Existing capability and command contribution model in packages/lua/src/index.js.

## Required behavior definition

### 1) Self-escalation from Lua

1. Lua code must be able to request session elevation via a host bridge exposed to Lua runtime.
2. Elevation request takes effect immediately for that active Lua session.
3. The implementation must not require a second user confirmation step for the elevation request.

### 2) Session scope

1. Elevation state belongs to the live Lua session, not a permanent workspace setting.
2. Restarting the app clears the elevated state by default.
3. Elevation does not become an always-on global default.

### 3) Visual indication

1. When a Lua session is elevated, the console surface must display a clear elevated marker (badge/label).
2. Marker must remain visible while elevated and disappear when session ends or is reset.
3. Marker text and styling should be explicit enough to avoid ambiguity about current mode.

### 4) Recovery flow

1. User gets a one-click recovery action when elevated.
2. Recovery action restarts the app.
3. On the next startup after recovery, Lua preload is skipped.
4. Recovery skip is one-shot and cleared after use.

### 5) Persistence expectations

1. Workspace/editor persistence keeps current behavior (saved content remains saved as usual).
2. Lua console transcript is not persisted through restart (expected loss remains unchanged).

## Detailed implementation checklist

### A. Lua runtime contract changes (packages/lua)

1. Add explicit internal representation for "elevated session" state in Lua console session/runtime objects.
2. Expose a Lua-callable escalation entry point in the tf.* bridge used by console/snippet execution.
3. Return escalation state in console command execution results or session metadata so host UI can render badge state.
4. Keep escalation isolated to the current console session key.
5. Do not add automatic downgrade timers.

### B. Workbench integration (apps/textforge-web)

1. Track elevated state per Lua console resource/session in workbench runtime state.
2. Surface elevated state in the Lua console UI container (badge/label visible in console surface).
3. Add one-click recovery action reachable from the console while elevated.
4. Keep existing command registration model; introduce only the minimum additional command/action wiring needed.

### C. Restart + skip-preload mechanism

1. Before restart, persist workspace using existing persistence path.
2. Store a one-shot "skip Lua preload" marker for next boot.
3. Restart app (browser reload) from recovery action.
4. On hydration/bootstrap, read one-shot marker.
5. If marker is present:
   - skip Lua automation preload/discovery on that boot,
   - skip any Lua bootstrap command execution path,
   - then clear the marker.
6. Continue normal non-Lua hydration and workbench startup.

### D. Documentation + validation updates

1. Add/adjust Lua user docs to explain:
   - self-escalation behavior,
   - session-only scope,
   - elevated badge meaning,
   - one-click recovery semantics,
   - expected console transcript loss on restart.
2. Add validation checklist coverage for:
   - self-escalation without second confirmation,
   - no auto-expire,
   - badge visibility,
   - one-click recovery restart,
   - one-shot skip-preload behavior,
   - workspace persistence unchanged.

## Acceptance criteria (definition of done)

1. Lua can trigger elevation from script/console through supported bridge API.
2. Elevation requires no second confirmation.
3. Elevated state is clearly visible in Lua console UI.
4. Elevated state does not auto-expire.
5. Recovery is one click from elevated console context.
6. Recovery restarts app and skips Lua preload exactly once on next boot.
7. Workspace/editor saved content remains available after recovery restart.
8. Console transcript is reset/lost after restart (same expected behavior as normal restart).

## Test scenarios

1. Open Lua console, execute escalation request, verify elevated badge appears immediately.
2. Keep session idle beyond prior timeout expectations, verify no auto-downgrade occurs.
3. Trigger recovery action, verify restart occurs.
4. On first boot after recovery, verify Lua preload/discovery is skipped.
5. Restart again normally, verify Lua preload resumes.
6. Verify edited and persisted workspace resources remain intact.
7. Verify previous console transcript is not restored after restart.

## Canonical roadmap surfaces

This candidate is tracked in:

1. roadmap/workpackages/workpackage-register.md
2. roadmap/workpackages/implementation-status.md
3. roadmap/workpackages/dependency-map.md (generated via roadmap script)
4. roadmap/package-guides/lua.md

## Notes

1. This proposal intentionally avoids adding requirements not explicitly agreed.
2. This remains a planning artifact and does not imply implementation has started.