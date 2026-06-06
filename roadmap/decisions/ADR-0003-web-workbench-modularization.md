# ADR-0003 - Web workbench modularization

## Status

Accepted

## Date

2026-06-06

## Context

The TextForge web shell is currently centered on `apps/textforge-web/src/workbench.js`, a large app entry module that combines bootstrap, browser helpers, workspace seed state, persisted UI state, controller behavior, command dispatch, surface sessions, Lua integration, Markdown preview routing, and React view components.

The app entry contract is intentionally small: `apps/textforge-web/src/main.js` imports `bootTextForgeShell` from `./workbench.js`. That public app-shell contract must remain stable while the implementation becomes easier to review and maintain.

The web app validation script also treats `workbench.js` as the source of many shell behavior signals. Splitting the file therefore requires updating validation to scan the new app-shell module set instead of relying on one monolithic source file.

## Decision

Refactor the web workbench into internal app-shell modules while keeping `src/workbench.js` as the public façade that exports `bootTextForgeShell`.

The refactor must preserve:

- the `main.js` to `workbench.js` import contract;
- command IDs, contribution IDs, surface IDs, test profile names, query parameter names, and user-visible behavior;
- package-root imports from TextForge packages;
- the file-launch build constraints enforced by the existing web checks.

Implementation proceeds in staged commits: roadmap governance, pure helpers, React view components, controller extraction, controller subsystem split, and final validation.

The web checker must scan the split source modules for behavior and security signals while keeping entrypoint checks specific to `main.js` and `workbench.js`.

## Consequences

### Positive

- The app shell becomes easier to review by responsibility.
- Future shell changes can target focused modules instead of a multi-thousand-line closure.
- The public bootstrap contract remains stable.
- Validation reflects the modular source layout rather than enforcing monolithic file structure.

### Negative / trade-offs

- The controller split is riskier than pure extraction because existing behavior relies on shared closure state.
- The validation script must be updated carefully so it does not become too broad or too weak.
- Intermediate commits may still leave some large controller modules until subsystem boundaries are stabilized.

### Follow-up required

- Keep each stage behavior-preserving and incrementally committed.
- Run web app checks after each stage and full repository verification after the final split.
- Record final validation in RAPID and mark the workpackage validated only after verification passes.

## Applies to

- Modules: `MOD-SURFACES-UI`
- Workpackages: `WP-WEB-WORKBENCH-MODULARITY-01`
- Releases: none

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
