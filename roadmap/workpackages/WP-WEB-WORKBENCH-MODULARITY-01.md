# WP-WEB-WORKBENCH-MODULARITY-01 - Web workbench modularization

## Registry

- Workpackage ID: `WP-WEB-WORKBENCH-MODULARITY-01`
- Authoritative state: `roadmap-state.yaml`
- Status: `validated`
- Module: `MOD-SURFACES-UI`
- ADRs: `ADR-0003`

## Outcome

Split the TextForge web workbench implementation into focused internal app-shell modules while preserving the existing bootstrap contract and runtime behavior.

## Scope

The executable scope is limited to `apps/textforge-web/src/workbench.js`, new internal modules under `apps/textforge-web/src/workbench/`, and the web app validation script updates required to validate the modular layout.

## Non-goals

- Changing the public `main.js` to `workbench.js` entry contract.
- Renaming command IDs, contribution IDs, surface IDs, query parameters, test profiles, or package imports.
- Refactoring generated bundled docs or `styles.css`.
- Redesigning the workbench UX or controller behavior.

## Package Impact

No package public API impact is intended. This is an app-shell internal refactor for `@textforge/textforge-web`.

## Interfaces / Contracts Changed

No public runtime contract changes are intended. `bootTextForgeShell(rootElement)` remains the public web shell bootstrap exported from `src/workbench.js`.

## Validation Criteria

- `src/workbench.js` remains below 250 lines and exports `bootTextForgeShell`.
- `src/main.js` continues importing from `./workbench.js`.
- Existing query/test flows continue working, including `testProfile`, `phase35`, `recovery`, `luaConsole`, `luaSkipPreload`, Markdown preview, ITM visual targets, popup sessions, and browser workspace reset.
- Web app lint, typecheck, test, and build commands pass.
- Full repository verification passes after the final split.

## Evidence Required

- RAPID progress entry when implementation starts.
- RAPID progress entry after final validation.
- Command output summary in the final implementation response.

## Open Decisions

- None. The accepted split strategy is staged extraction: pure helpers, view components, controller façade extraction, controller subsystem modules.

## Notes

Keep commits incremental and stage-scoped so regressions can be bisected to a narrow extraction step.
