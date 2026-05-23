# TextForge Rebuild RAPID Log

This file is maintained in the repository-local `roadmap/` folder. It is part of the implementation record and must be committed with milestone changes.

RAPID means **Risks, Actions, Progress, Issues, and Decisions**. Use this single table instead of separate progress and decision logs.

## Append-only rule

This log is append-only.

Do not edit or delete previous entries. If an entry becomes obsolete, add a new entry with `Status` set to `Superseded` and link it to the previous entry. If a mistake must be corrected, add a new correction entry and link it to the mistaken entry.

Historical entries must always be appended at the end of the file. Do not insert new rows beside similar types, under earlier milestone clusters, or into an older section for convenience.

Keep the historical table in event order so decisions, risks, actions, progress, and issues remain in the sequence they happened rather than being regrouped by type.

The append-only rule makes the implementation history auditable across agent runs.

## Current status block

Keep this block current. It may be edited because it is an operational pointer, not the historical log.

```text
Current branch: rewrite/v2-monorepo
Current milestone: M2 Source-editor coverage and language foundation
Current package focus: apps/textforge-web, core, workspace, surfaces, ui, editors
Last known good command: corepack pnpm verify
Next recommended step: add language mode registration and source editor fallback selection
Open questions: none recorded at document-set creation
```

## ID convention

```text
R-### = Risk
A-### = Action
P-### = Progress
I-### = Issue
D-### = Decision
```

## Status vocabulary

Use these status values only unless there is a strong reason to extend the vocabulary:

```text
Open
In progress
Done
Blocked
Accepted
Superseded
```

Typical use:

| Type | Typical statuses |
|---|---|
| Risk | `Open`, `Accepted`, `Superseded`, `Done` |
| Action | `Open`, `In progress`, `Done`, `Blocked` |
| Progress | usually `Done` |
| Issue | `Open`, `Blocked`, `Done`, `Superseded` |
| Decision | `Accepted`, `Superseded` |

## RAPID entries

Append every new historical row to the end of this table. Do not reorder existing rows or insert a new row above older history just to keep types together.

| ID | Type | Milestone | Status | Entry | Owner | Updated | Links |
|---|---|---|---|---|---|---|---|
| D-001 | Decision | M-1 | Accepted | Use one Git repository with pnpm workspaces, not Git submodules. | Jill | 2026-05-23 |  |
| D-002 | Decision | M-1 | Accepted | Preserve the previous implementation with an archival tag and branch before the rebuild pivot. | Jill | 2026-05-23 | `textforge-v1-final`, `archive/v1-current` |
| D-003 | Decision | M0 | Accepted | Use React, TypeScript, and Vite for the greenfield workbench. | Jill | 2026-05-23 |  |
| D-004 | Decision | M0 | Accepted | ITM is the canonical structural model for model-driven content. | Jill | 2026-05-23 |  |
| D-005 | Decision | M0 | Accepted | The reusable security harness verifies the browser-enforced envelope, not TextForge internal layering. | Jill | 2026-05-23 |  |
| D-006 | Decision | M0 | Accepted | Editors and viewers are both Surface contributions with capabilities and placement options. | Jill | 2026-05-23 |  |
| D-007 | Decision | M0 | Accepted | Visual and rich editors require explicit write-back contracts before they can become authoritative editing surfaces. | Jill | 2026-05-23 |  |
| D-008 | Decision | M0 | Accepted | Use a single append-only RAPID log for risks, actions, progress, issues, and decisions. | Jill | 2026-05-23 |  |
| D-009 | Decision | M0 | Accepted | Implement Phase 0 package contracts as dependency-light TypeScript types and pure helper functions, keeping runtime dependencies at zero for now. | agent | 2026-05-23 |  |
| D-010 | Decision | M0 | Accepted | Keep the Phase 0 UI package dependency-light for now by exposing theme, frame, and chrome contracts until a React workspace dependency is available. | agent | 2026-05-23 | `packages/ui/src/index.ts`, `roadmap/packages/ui.md` |
| A-001 | Action | M-1 | Open | Create archival tag and branch for the current implementation. | agent | 2026-05-23 |  |
| A-002 | Action | M-1 | Open | Create rewrite branch and add roadmap folder with stable filenames. | agent | 2026-05-23 |  |
| R-001 | Risk | M1 | Open | Surface abstraction may grow too complex before the workspace foundation is stable. | agent | 2026-05-23 |  |
| P-001 | Progress | M-1 | Done | Initial rebuild planning package created with roadmap, package guides, pivot instructions, and agent operating rules. | agent | 2026-05-23 |  |
| P-002 | Progress | M-1 | Done | Created archival preservation points, switched to `rewrite/v2-monorepo`, and relocated selected legacy docs, plans, guides, specs, and examples into `docs/legacy`, `docs/design`, `docs/specs`, and `fixtures/legacy`. | agent | 2026-05-23 | `textforge-v1-final`, `archive/v1-current`, `docs/legacy/README_v1.md` |
| P-003 | Progress | M-1 | Done | Removed the old app tree, build artifacts, legacy root configs, and the `external/ITM` submodule from the rewrite branch, then added the pnpm workspace skeleton and placeholder package boundaries. | agent | 2026-05-23 | `apps/textforge-web`, `packages/core`, `pnpm-workspace.yaml` |
| P-004 | Progress | M-1 | Done | Installed the pnpm workspace through Corepack and verified the placeholder workspace scripts with `corepack pnpm verify`. | agent | 2026-05-23 | `pnpm-lock.yaml`, `package.json` |
| P-005 | Progress | M0 | Done | Implemented the Phase 0 package contract block for `@textforge/core`, `@textforge/security-profile`, `@textforge/examples-docs`, and `@textforge/ui`, then re-verified the workspace with `corepack pnpm verify`. | agent | 2026-05-23 | `packages/core/src/index.ts`, `packages/security-profile/src/index.ts`, `packages/security-profile/package.json`, `packages/examples-docs/src/index.ts`, `packages/ui/src/index.ts` |
| D-011 | Decision | M0 | Accepted | Future RAPID history must be appended only at the end of the file so the single table stays in chronological event order rather than being regrouped by type. | Jill | 2026-05-23 | `roadmap/RAPID.md`, `roadmap/AGENTS_START_HERE.md`, `roadmap/README.md` |
| D-012 | Decision | M1 | Accepted | Implement Phase 1 as dependency-light TypeScript contract skeletons with in-memory workspace and surface services, deferring browser-specific adapters and persistence backends to later milestones. | agent | 2026-05-23 | `packages/workspace/src/index.ts`, `packages/surfaces/src/index.ts` |
| P-006 | Progress | M1 | Done | Implemented the workspace virtual entry model, path helpers, workspace Dexie schema placeholder, and in-memory create/open/save/rename/move/delete service skeleton. | agent | 2026-05-23 | `packages/workspace/src/index.ts`, `packages/workspace/package.json`, `packages/core/package.json` |
| D-013 | Decision | M1 | Accepted | Use source-level package exports (`./src/index.ts`) for the source-only workspace skeleton until a real build pipeline exists. | agent | 2026-05-23 | `packages/core/package.json`, `packages/workspace/package.json`, `packages/surfaces/package.json`, `packages/editors/package.json`, `packages/assets/package.json`, `packages/ui/package.json` |
| P-007 | Progress | M1 | Done | Implemented the surface registry and host skeleton, generic text editor contracts, asset viewer bindings and blob URL ledger, and the chrome model helpers for workspace tree, surface frame, toolbar, and status badges. | agent | 2026-05-23 | `packages/surfaces/src/index.ts`, `packages/editors/src/index.ts`, `packages/assets/src/index.ts`, `packages/ui/src/index.ts` |
| P-008 | Progress | M1 | Done | Completed Phase 1 package skeletons and verified the workspace with `corepack pnpm verify`; the repository is ready to move into Phase 2 language-mode and source-editor coverage. | agent | 2026-05-23 | `roadmap/RAPID.md`, `packages/workspace/src/index.ts`, `packages/surfaces/src/index.ts`, `packages/editors/src/index.ts`, `packages/assets/src/index.ts`, `packages/ui/src/index.ts` |
| D-012 | Decision | M1 | Accepted | Agents must validate progressively during implementation and run the best available milestone-scoped verification before any milestone commit, logging any remaining verification gap in RAPID. | agent | 2026-05-23 | `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md` |
| D-014 | Decision | M1 | Accepted | Define the first stable user-facing state as a runnable shell that shows the frame, workspace/navigation chrome, main surface region, toolbar or command entry points, status feedback, and contribution routing, rather than treating package placeholders as ready. | agent | 2026-05-23 | `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md`, `roadmap/AGENTS_START_HERE.md` |
| P-009 | Progress | M1 | Done | Updated the roadmap and agent instructions to define the first runnable shell as a separate stable baseline and to name the user-facing chrome available at that checkpoint. | agent | 2026-05-23 | `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md`, `roadmap/AGENTS_START_HERE.md` |
| D-015 | Decision | M0.5 | Accepted | Implement the runnable shell as a dependency-light browser-native bootstrap with a copied static asset build and a Node static server, avoiding new runtime dependencies until the React workbench layer is introduced. | agent | 2026-05-23 | `apps/textforge-web/package.json`, `apps/textforge-web/scripts/build.mjs`, `apps/textforge-web/scripts/dev-server.mjs`, `apps/textforge-web/src/main.js` |
| P-010 | Progress | M0.5 | Done | Built and browser-verified the first runnable TextForge shell with visible frame, workspace navigation, surface routing, and contribution registry chrome. | agent | 2026-05-23 | `apps/textforge-web/index.html`, `apps/textforge-web/src/main.js`, `apps/textforge-web/src/styles.css`, `apps/textforge-web/scripts/build.mjs`, `apps/textforge-web/scripts/check.mjs`, `apps/textforge-web/scripts/dev-server.mjs` |
