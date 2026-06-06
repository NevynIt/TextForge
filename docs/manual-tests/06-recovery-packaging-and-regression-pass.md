# 06 Recovery Packaging And Regression Pass

## Release Smoke: Storage Reset Flow

What to test:

- browser storage reset is explicit and recoverable.

How:

1. Create `/docs/reset-check.md`.
2. Open the storage utility section.
3. Run `Reset Browser Workspace`.
4. Cancel the reset.
5. Confirm `/docs/reset-check.md` still exists.
6. Run `Reset Browser Workspace` again.
7. Confirm with `Reset Browser Workspace Now`.

Expected:

- first click requests confirmation rather than immediately deleting data;
- cancel leaves content intact;
- final confirmation clears user-created content and rebuilds starter seed;
- bundled resources return under `/.textforge/resources`;
- storage status returns to ready.

## Storage Failure Recovery Screen

What to test:

- when storage cannot initialize, the user gets a useful recovery path.

How:

1. Open the app with:

```text
/?recovery=1
```

2. Inspect the recovery screen or storage recovery state.
3. Use `Open Without Files`.
4. Return and use `Reset Workspace` if available.

Expected:

- recovery messaging explains that workspace content and local UI state differ;
- `Open Without Files` keeps current stored workspace data when possible;
- `Reset Workspace` clears persisted browser workspace and rebuilds seed content;
- recovery mode is cleared from non-file URLs after use where applicable.

## Direct File Artifact Regression

What to test:

- production artifact works when opened from disk.

How:

1. Run:

```powershell
corepack pnpm --filter @textforge/textforge-web build
```

2. Open `apps/textforge-web/dist/index.html` directly.
3. Run the release smoke tests from files 01 through 05.

Expected:

- app boots under `file://`;
- bundled resources are available;
- source editor, Markdown preview, ITM surfaces, Lua console, and asset viewers mount;
- links that require app routing stay inside the app when possible;
- behavior that depends on HTTP server APIs fails only with clear messaging.

## Preview Server Regression

What to test:

- production build works through Vite preview.

How:

1. Run:

```powershell
corepack pnpm --filter @textforge/textforge-web build
corepack pnpm --filter @textforge/textforge-web preview --port 4173
```

2. Open `http://127.0.0.1:4173/`.
3. Run the release smoke tests from files 01 through 05.

Expected:

- app boots from built assets;
- no development-only imports are required;
- query profiles work;
- generated downloads still work.

## Responsive Layout Pass

What to test:

- shell layout remains usable at normal desktop, narrow desktop, tablet, and mobile widths.

How:

1. Test these viewports or close equivalents:
   - 1440 x 900;
   - 1280 x 720;
   - 900 x 700;
   - 768 x 1024;
   - 390 x 844.
2. Open:

```text
/?phase35=main
/?phase35=tree-collapsed
/?phase35=utility
/?phase35=popup
/?phase35=panels-narrow
/?phase35=panels-wide
```

3. For each, inspect toolbar, workspace tree, main surface, tabs, inspector, storage pane, and popup host.

Expected:

- no toolbar, tab, panel title, command button, or inspector value overlaps another element;
- side panels can collapse or resize without hiding main content permanently;
- popup surface stays bounded;
- text inside buttons and cards remains readable;
- scrollbars appear inside the intended local surface or panel.

## Browser Console And Network Pass

What to test:

- normal user flows do not emit uncaught errors.

How:

1. Open browser developer tools.
2. Clear the console.
3. Run release smoke tests.
4. Watch for uncaught exceptions, failed imports, blocked resource loads, and infinite warnings.

Expected:

- no uncaught exceptions during normal boot, open, edit, preview, export, reset, or reload;
- expected warnings are actionable and tied to tested invalid fixtures;
- no resource loads try to access host filesystem paths from browser code.

## Final Release Regression Checklist

Run this condensed pass after all fixes are merged:

1. Clean profile boot.
2. Dirty profile boot with existing workspace content.
3. Direct file artifact boot.
4. Preview server boot.
5. Markdown preview and diagram export.
6. ITM tree, graph, mindmap, catalogue, matrix, and report.
7. Lua console, selected Lua run, automation reload, and recovery.
8. BPMN viewer and BPMN ITM visual target.
9. EA dashboard sample.
10. Asset upload, preview, download, and ZIP round trip.
11. Responsive layout across desktop and mobile widths.
12. Storage reset with cancel and confirm.

Expected:

- every item passes or has a logged, accepted release note;
- no unresolved release smoke failure remains;
- current non-goals are documented as non-goals, not silently broken behavior.

