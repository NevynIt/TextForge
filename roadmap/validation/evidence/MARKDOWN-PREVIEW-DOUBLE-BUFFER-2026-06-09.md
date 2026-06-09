# Evidence - Markdown Preview Double Buffer 2026-06-09

## Target

- ID: `P-131` / `P-132` / `P-133` / `P-134`
- Type: Corrective validation
- Status: Automated validation passed; manual UI verification required

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Markdown preview keeps the previous rendered content visible while a newer render is pending | Web integration test + source implementation | Pass | `packages/markdown/src/contributions.js`; `apps/textforge-web/test/markdownWorkbenchIntegration.test.js` |
| AC-002 | Markdown preview updates use a hidden staged render and swap only after staging is ready | Package fake-DOM regression test | Pass | `packages/markdown/src/preview.js`; `packages/markdown/test/index.test.js` |
| AC-003 | Preview refresh preserves the scroll position after the staged swap | Package fake-DOM regression test | Pass | `packages/markdown/test/index.test.js` |
| AC-004 | Surface scroll state is keyed by stable session id and restored across tab switching | Source guard + implementation inspection | Pass with manual UI follow-up | `apps/textforge-web/src/workbench/components/app.js`; `apps/textforge-web/scripts/check.mjs` |
| AC-005 | Markdown preview link routing still delegates to the workbench after buffered updates | Package fake-DOM regression test | Pass | `packages/markdown/test/index.test.js` |
| AC-006 | Active-tab and selected-resource persistence does not serialize the browser workspace on every focus/change event | Fake-timer unit test + source guard | Pass | `apps/textforge-web/src/workbench/controller/debounced-latest-committer.js`; `apps/textforge-web/test/debouncedLatestCommitter.test.js`; `apps/textforge-web/scripts/check.mjs` |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | `corepack pnpm --filter @textforge/markdown test` | Passed: 14 tests. |
| EV-002 | test output | `corepack pnpm --filter @textforge/textforge-web test` | Passed: 23 tests; existing Fengari circular dependency warnings observed. |
| EV-003 | source guard | `apps/textforge-web/scripts/check.mjs` | Guards buffered surface updates, session-keyed scroll restoration, and debounced active focus persistence signals. |
| EV-004 | implementation | `apps/textforge-web/src/workbench/components/app.js` | Active surface scroll is captured synchronously before main/popup tab focus changes; `SurfaceMount` uses stable session keys. |
| EV-005 | implementation | `apps/textforge-web/src/workbench/controller/index.js` | UI-state and selected-resource persistence use 10 second latest-value debouncing, and persistence-status emits do not reschedule UI-state writes. |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|
| MD-PREVIEW-DBUF-001 | Medium | Manual verification pending | Repository guidance forbids headless browser UI checks; user should run the manual checks below. |

## Manual UI Verification Requested

- Open a long Markdown preview, scroll partway down, edit the source, and wait for the delayed preview refresh.
- Confirm the preview does not disappear while rendering and returns to the same scroll position after the update.
- Switch from the preview tab to another tab and back, confirming the preview restores the same scroll position.
- Switch repeatedly between tabs and confirm the status rail does not enter "Saving workspace" on each focus change; it should save only after roughly 10 seconds idle or for explicit workspace mutations.

## Validation conclusion

Pass with manual UI verification pending.

## Limitations

- Headless browser UI checks were intentionally not run per repository guidance.
- `corepack pnpm roadmap:dependency-map:publish:check` was not included because `docs/architecture/dependency-map.md` has a pre-existing unstaged generated dependency-map difference outside this corrective change.
