# TextForge Rebuild RAPID Log

This file is maintained in the repository-local `roadmap/` folder. It is part of the implementation record and must be committed with phase-slice changes.

RAPID means **Risks, Actions, Progress, Issues, and Decisions**. Use this single table instead of separate progress and decision logs.

## Append-only rule

This log is append-only.

Do not edit or delete previous entries. If an entry becomes obsolete, add a new entry with `Status` set to `Superseded` and link it to the previous entry. If a mistake must be corrected, add a new correction entry and link it to the mistaken entry.

Historical entries must always be appended at the end of the file. Do not insert new rows beside similar types, under earlier phase clusters, or into an older section for convenience.

Keep the historical table in event order so decisions, risks, actions, progress, and issues remain in the sequence they happened rather than being regrouped by type.

The append-only rule makes the implementation history auditable across agent runs.

## Current status block

Keep this block current. It may be edited because it is an operational pointer, not the historical log.

```text
Current branch: rewrite/v2-monorepo
Current phase: Phase 1 - Workspace and Stage 1 surface validation
Current package focus: packages/editors, packages/assets, apps/textforge-web
Last known good command: corepack pnpm verify; node apps/textforge-web/scripts/validate-codemirror-cdp.mjs 9222 http://127.0.0.1:4174
Next recommended step: perform a final Phase 1 closure audit against workspace, surface routing, CodeMirror editor, and asset viewer promises before advancing to Phase 2
Open questions: none
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

| ID | Type | Phase | Status | Entry | Owner | Updated | Links |
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
| D-016 | Decision | M0.5 | Accepted | Treat direct `file://` launchability of the built shell as part of the runnable local/static artifact requirement, not as a preview-server-only behavior to defer to a later phase. | agent | 2026-05-23 | `apps/textforge-web/index.html`, `apps/textforge-web/scripts/check.mjs`, `roadmap/AGENTS_START_HERE.md`, `apps/textforge-web/README.md` |
| P-011 | Progress | M0.5 | Done | Fixed the shell entrypoint to use relative asset paths so `apps/textforge-web/dist/index.html` works from `file://`, re-verified the package checks, and updated the shell and agent instructions to make local/static verification and the understand-implement-verify-document-finalize phase plan explicit. | agent | 2026-05-23 | `apps/textforge-web/index.html`, `apps/textforge-web/scripts/check.mjs`, `apps/textforge-web/README.md`, `roadmap/AGENTS_START_HERE.md` |
| D-017 | Decision | Docs | Accepted | The main rebuild whitepaper is architecture-only. Authoritative implementation sequencing, phase order, package rollout, and current milestone state live in the V15 roadmap documents and RAPID log, not in duplicate milestone summaries inside the whitepaper. | agent | 2026-05-23 | `roadmap/textforge_rebuild_whitepaper_main.md`, `roadmap/README.md` |
| P-012 | Progress | Docs | Done | Updated the rebuild whitepaper from V13 to V15 alignment, removed its obsolete milestone summary, and clarified the roadmap authority split in the roadmap index. | agent | 2026-05-23 | `roadmap/textforge_rebuild_whitepaper_main.md`, `roadmap/README.md`, `roadmap/RAPID.md` |
| D-018 | Decision | Docs | Accepted | The one-time repository pivot runbook is obsolete after the completed pivot. Keep the pivot policy in the package-aware roadmap and repository strategy, and remove the standalone pivot instruction from the live roadmap set. | agent | 2026-05-23 | `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md`, `roadmap/AGENTS_START_HERE.md`, `roadmap/README.md` |
| P-013 | Progress | Docs | Done | Removed the obsolete pivot instruction, updated roadmap references to Phase -1 and repository strategy, and trimmed remaining whitepaper operational language that duplicated live agent instructions. | agent | 2026-05-23 | `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md`, `roadmap/AGENTS_START_HERE.md`, `roadmap/README.md`, `roadmap/textforge_rebuild_whitepaper_main.md` |
| D-019 | Decision | Docs | Accepted | Progress-tracking instructions and RAPID should use the phase model from the package-aware roadmap as the primary execution unit. Use "phase" or "phase slice" for active work tracking rather than standalone milestone terminology. | agent | 2026-05-23 | `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md`, `roadmap/README.md`, `roadmap/RAPID.md` |
| P-014 | Progress | Docs | Done | Updated the live progress-tracking instructions and RAPID terminology to refer to current phase and phase slices, while leaving historical RAPID entries intact. | agent | 2026-05-23 | `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md`, `roadmap/README.md`, `roadmap/RAPID.md` |
| I-001 | Issue | M1 | Open | Phase 1 is not cleanly closed: the runnable shell is still hard-coded instead of being composed from the Phase 1 packages, `@textforge/editors` and `@textforge/assets` stop at contract/helper level rather than concrete surface skeletons, package validation remains placeholder-level, and current diagnostics still report TypeScript errors in the workspace/surfaces/assets slice. | agent | 2026-05-23 | `roadmap/phase-1-gap-audit-2026-05-23.md`, `apps/textforge-web/src/main.js`, `packages/editors/src/index.ts`, `packages/assets/src/index.ts`, `packages/workspace/src/index.ts`, `packages/surfaces/src/index.ts` |
| A-003 | Action | M1 | Open | Close the Phase 1 gap by either reducing the roadmap claim to contract-only skeleton status or by finishing the missing shell integration, concrete editor/asset surfaces, and focused validation needed for an honest Phase 1 completion. | agent | 2026-05-23 | `roadmap/phase-1-gap-audit-2026-05-23.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/RAPID.md` |
| P-015 | Progress | Docs | Done | Audited RAPID against the repository state, corrected the live current-phase block back to a Phase 1 closure slice, and recorded the concrete Phase 1 closure gaps in a dedicated roadmap note. | agent | 2026-05-23 | `roadmap/RAPID.md`, `roadmap/phase-1-gap-audit-2026-05-23.md` |
| D-020 | Decision | M1 | Accepted | Phase closure is completion-only. Do not reclassify unfinished roadmap scope downward to exit a phase; Phase 1 remains open until its missing work is implemented and validated. | agent | 2026-05-23 | `roadmap/RAPID.md`, `roadmap/phase-1-gap-audit-2026-05-23.md`, `roadmap/00_package_aware_roadmap.md` |
| A-004 | Action | M1 | Open | Finish the missing Phase 1 work: wire the shell to the Phase 1 package APIs, add concrete editor and asset surface implementations, replace placeholder package validation with focused checks, and fix the current workspace/surfaces/assets compile errors before moving to Phase 2. | agent | 2026-05-23 | `roadmap/phase-1-gap-audit-2026-05-23.md`, `apps/textforge-web/src/main.js`, `packages/editors/src/index.ts`, `packages/assets/src/index.ts`, `packages/workspace/src/index.ts`, `packages/surfaces/src/index.ts` |
| P-016 | Progress | Docs | Done | Removed the descoping closure option from the Phase 1 audit note, updated the live RAPID status block to require completion, and appended a completion-only Phase 1 closure decision and replacement follow-up action. | agent | 2026-05-23 | `roadmap/RAPID.md`, `roadmap/phase-1-gap-audit-2026-05-23.md` |
| D-021 | Decision | M1 | Accepted | A-004 supersedes the descoping branch in A-003. Treat A-003 as historical only; the active closure path is to finish the missing Phase 1 work. | agent | 2026-05-23 | `roadmap/RAPID.md`, `roadmap/phase-1-gap-audit-2026-05-23.md` |
| D-022 | Decision | M1 | Accepted | Close Phase 1 with browser-native textarea and blob-url surface facades behind the existing package APIs, preserving the package contracts for a later CodeMirror/PDF adapter phase instead of blocking closure on third-party editor/viewer integration. | agent | 2026-05-23 | `packages/editors/src/index.js`, `packages/assets/src/index.js`, `apps/textforge-web/src/workbench.js` |
| I-002 | Issue | M1 | Open | Local headless browser screenshot capture was unreliable in this environment, so visual QA for the rewritten shell stopped at source inspection, package tests, build output, and preview-server load checks. | agent | 2026-05-23 | `apps/textforge-web/dist`, `corepack pnpm verify` |
| P-017 | Progress | M1 | Done | Wired the app shell to the Phase 1 package APIs, added browser-native runtime entrypoints and smoke tests for `@textforge/core`, `@textforge/workspace`, `@textforge/surfaces`, `@textforge/ui`, `@textforge/editors`, and `@textforge/assets`, and re-verified the workspace with `corepack pnpm verify`. | agent | 2026-05-23 | `apps/textforge-web/src/workbench.js`, `apps/textforge-web/scripts/build.mjs`, `apps/textforge-web/scripts/check.mjs`, `packages/core/src/index.js`, `packages/workspace/src/index.js`, `packages/surfaces/src/index.js`, `packages/ui/src/index.js`, `packages/editors/src/index.js`, `packages/assets/src/index.js` |
| D-023 | Decision | M1 | Accepted | D-022 is too strong and is superseded by validation: the implementation delivers a runnable package-driven shell and package facades, but it does not yet deliver the promised Phase 1 CodeMirror-backed editor or concrete image/SVG/PDF viewer surfaces. Phase 1 remains open until that value exists or the roadmap is revised honestly. | agent | 2026-05-23 | `roadmap/RAPID.md`, `packages/editors/src/index.js`, `packages/assets/src/index.js`, `apps/textforge-web/src/workbench.js` |
| I-003 | Issue | M1 | Open | Validation shows a mismatch between the Phase 1 promise and the delivered implementation: the editor is a textarea facade and the asset viewer is a blob-url preview facade, so the phase cannot be considered fully executed yet. | agent | 2026-05-23 | `roadmap/00_package_aware_roadmap.md`, `roadmap/packages/editors.md`, `roadmap/packages/assets.md`, `packages/editors/src/index.js`, `packages/assets/src/index.js` |
| P-018 | Progress | M1 | Done | Performed a validation review of the Phase 1 claim against the actual implementation and found the shell wiring correct but the promised Phase 1 surface depth incomplete. | agent | 2026-05-23 | `packages/editors/src/index.js`, `packages/assets/src/index.js`, `apps/textforge-web/src/workbench.js` |
| D-024 | Decision | Docs | Accepted | Facade closures are not accepted. A phase may only be claimed closed after validation demonstrates the promised user-facing behavior, not merely API preservation, browser-native shims, or build/test success. | agent | 2026-05-23 | `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md` |
| P-019 | Progress | Docs | Done | Tightened the agent instructions and roadmap operating model so future phase claims require validation of the promised behavior and explicitly reject facade-only closures. | agent | 2026-05-23 | `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/RAPID.md` |
| D-025 | Decision | Docs | Accepted | Phase claims must not be revised downward to mask incomplete work. If the promised phase value is not implemented and validated, the phase stays open until it is or the roadmap itself is explicitly changed by a documented decision. | agent | 2026-05-23 | `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/RAPID.md` |
| P-020 | Progress | Docs | Done | Clarified the closure rule to forbid downward phase revisions and require validation of the promised value before any closure claim. | agent | 2026-05-23 | `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/RAPID.md` |
| D-026 | Decision | M1 | Accepted | Supersede the dependency-light browser-native shell packaging decision for the Phase 1 editor slice: the web shell should use Vite again so real CodeMirror dependencies are bundled rather than resolved through import-map or vendor shims. | agent | 2026-05-23 | `apps/textforge-web/package.json`, `apps/textforge-web/index.html`, `packages/editors/package.json` |
| P-021 | Progress | M1 | Done | Replaced the editor facade with a real CodeMirror 6 `EditorView`/`EditorState` implementation, switched the web app back to Vite package imports, and validated the running Vite preview through CDP by proving `.cm-editor`, `.cm-content`, an attached `textforgeCodeMirrorView`, and a successful CodeMirror-dispatched edit. | agent | 2026-05-23 | `packages/editors/src/index.js`, `packages/editors/src/index.ts`, `apps/textforge-web/src/workbench.js`, `apps/textforge-web/scripts/validate-codemirror-cdp.mjs` |
| I-004 | Issue | M1 | Done | The previous editor implementation was still a facade and did not satisfy Phase 1. It is now closed by the real CodeMirror implementation and browser-level CDP validation. | agent | 2026-05-23 | `I-003`, `P-021`, `packages/editors/src/index.js` |
