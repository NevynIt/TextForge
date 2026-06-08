# Evidence - Source Editor Delayed Propagation 2026-06-08

## Target

- ID: `P-129` / `P-130`
- Type: Corrective validation
- Status: Automated validation passed; manual UI verification required

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | CodeMirror source editor changes update local editor state immediately without saving every keystroke | Source implementation + focused tests | Pass | `apps/textforge-web/src/workbench/controller/index.js`; `packages/editors/src/contributions.js`; `apps/textforge-web/test/delayedTextCommits.test.js` |
| AC-002 | Sibling views receive source editor changes only after a short idle delay | Timer regression test | Pass | `apps/textforge-web/src/workbench/controller/delayed-text-commits.js`; `corepack pnpm --filter @textforge/textforge-web test` |
| AC-003 | Browser workspace persistence is deferred until a longer idle delay | Timer regression test | Pass | `apps/textforge-web/test/delayedTextCommits.test.js`; `corepack pnpm --filter @textforge/textforge-web test` |
| AC-004 | Pending source editor changes flush when navigating away from, closing, renaming, moving, deleting, exporting, or disposing affected resources | Source implementation + timer flush tests | Pass with manual UI follow-up | `apps/textforge-web/src/workbench/controller/index.js`; `apps/textforge-web/test/delayedTextCommits.test.js` |
| AC-005 | Non-CodeMirror text persistence paths, including table grid surfaces, keep existing immediate persistence behavior | Source inspection + existing web integration tests | Pass | `packages/editors/src/contributions.js`; `apps/textforge-web/test/tablesWorkbenchIntegration.test.js` |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | `corepack pnpm --filter @textforge/editors test` | Passed: 2 tests. |
| EV-002 | test output | `corepack pnpm --filter @textforge/textforge-web test` | Passed: 20 tests; existing Fengari circular dependency warnings observed. |
| EV-003 | source inspection | `apps/textforge-web/src/workbench/controller/delayed-text-commits.js` | Timer helper covers independent view/save debounce, navigation flush, and disposal cleanup. |
| EV-004 | source inspection | `packages/editors/src/contributions.js` | CodeMirror source editor uses `scheduleTextEditorDocumentChange` when provided; older `persistTextDocument` fallback remains for other hosts. |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|
| SRC-EDIT-DELAY-001 | Medium | Manual verification pending | Repository guidance forbids headless browser UI checks; user should run the manual checks below. |

## Manual UI Verification Requested

- Open a Markdown/source editor with its preview or another view open, type continuously, and confirm the view does not refresh per character.
- Stop typing and confirm the sibling view updates after roughly 2 seconds.
- Keep editing and confirm workspace save indicators do not fire on every character.
- Switch to another file and back, confirming the latest source text was saved.

## Validation conclusion

Pass with manual UI verification pending.

## Limitations

- Headless browser UI checks were intentionally not run per repository guidance.
- `corepack pnpm roadmap:dependency-map:publish:check` was not included because `docs/architecture/dependency-map.md` has a pre-existing unstaged generated dependency-map difference outside this corrective change.
