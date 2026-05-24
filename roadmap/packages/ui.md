# @textforge/ui — Package Implementation Guide

## Purpose

Reusable React UI primitives, workbench chrome, surface frame, dialogs, menus, command palette, common layout primitives, and accessibility wrappers.

## Ownership rule

`@textforge/ui` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`

Third-party candidates: React, React DOM, React Arborist, react-resizable-panels, Radix UI/Floating UI where useful. All third-party dependencies must pass the open-source license gate.

## Public surface

React components and primitives with no feature ownership.

## Milestone plan

### Phase 0 — Repository foundation, package skeleton, security envelope, and dependency policy

Implementation anchors:

- Architecture paragraphs: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.1-P01..P05`, `ARCH-6.17-P01..P04`, `ARCH-6.20-P01..P07`, `ARCH-10-P01..P04`, `ARCH-11.4-P01`.
- pnpm packages: Phase 0: `pnpm --filter @textforge/ui add @textforge/core@workspace:*`


Create. Dependency-light theming tokens, icon conventions, app frame placeholders, and chrome contracts until the React workspace dependency is introduced.

### Phase 1 — Workspace and Stage 1 surface skeleton

Implementation anchors:

- Architecture paragraphs: `ARCH-4.1-P01..P02`, `ARCH-4.2-P01..P03`, `ARCH-4.3-P01..P07`, `ARCH-5.2-P01..P06`, `ARCH-5.3-P01..P05`, `ARCH-5.6-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.2-P01..P04`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.15-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.6-P01..P06`, `ARCH-7.7-P01..P04`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 1: No new external package. Keep `@textforge/core@workspace:*`; pass workspace/surface data through typed props unless a deliberate package-dependency change is recorded.


Update. Workspace tree frame, surface frame, toolbar slots, status badges.

### Phase 3.1 — React workbench shell and UI recovery

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.1: `pnpm --filter @textforge/ui add react react-dom react-arborist`; `pnpm --filter @textforge/ui add -D @types/react @types/react-dom`


Update. Convert the model-only chrome contracts into actual React components and primitives: app frame, top bar, collapsible workspace tree region, main surface frame, compact status rail, main-session tab strip, and utility/debug pane hidden by default.

This phase should make the shell materially more usable for testing while avoiding later feature work. Do not add command palette/menu composition, Dexie persistence, tab groups, drag-reorder, split panes, saved layouts, or domain-specific UI here.

### Phase 3.2 — Dexie workspace persistence recovery

Implementation anchors:

- Architecture paragraphs: `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3.2: No new package install.


Update only as needed for user-facing browser-managed workspace cues, storage reset/clear confirmations, and storage initialization/recovery messages. Do not make `@textforge/ui` own persistence.

### Phase 3.3 — Command palette and contribution-driven shell commands

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: Phase 3.3: No new package install by default; add a palette library only through an explicit RAPID decision.


Update. Add the command palette, command search/filter/execute behaviour, and contribution-driven toolbar/menu slot rendering for shell commands provided by existing packages.

This phase pulls forward only the shell-facing command UI from Phase 5. It must not add plugin management, diagnostics dashboards, deep context-menu proliferation, or full feature-package contribution UX.

### Phase 3.4 — Resource identity badges and workbench readability pass

Implementation anchors:

- Architecture paragraphs: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`.
- pnpm packages: Phase 3.4: `pnpm --filter @textforge/ui add lucide-react`.

Update. Implement the UI side of the single Phase 3.4 pass: compact Shapez.io-style geometric badge primitives, overflow-safe shell layout primitives, compact header/status treatments, grouped command/menu presentation that uses the Phase 3.3 command system, stable utility drawer chrome, clearer active-resource states, scannable inspector/card components, small empty/error/help-state components, and bundled `lucide-react` affordances for generic folder/file/search/import/export/panel/warning/state controls.

The priority is readability and orientation. Keep resource identity in the deterministic placement-based badge token rather than a per-file icon taxonomy. Do not add arbitrary icon pickers, semantic meaning encoded only by color, another icon library, saved layout/session restore, split panes, drag/drop tab management, or Phase 13 advanced tab-management behavior.


### Phase 3.5 — Popup usability, resizable panels, and chrome deduplication pass

Implementation anchors:

- Architecture paragraphs: `ARCH-4-P04..P06`, `ARCH-5.1-P03`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.3-P01..P05`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.5: `pnpm --filter @textforge/ui add react-resizable-panels`.

Update. Implement bounded popup/overlay host chrome, shell-level resizable side panels, collapse states that release real workspace area, and deduplication primitives for active-resource cards, repeated titles/paths, and redundant header buttons. `react-resizable-panels` is allowed here only for left/right shell side panels and utility/inspector sizing; it is not permission to implement IDE split panes or advanced tab groups.

Add screenshot-review support by exposing stable layout landmarks/test IDs where useful and by aligning the implementation with `roadmap/04_phase_3_5_screenshot_validation_checklist.md`.

Do not add dnd-kit, tab drag/reorder, saved layout/session restoration, detached browser windows, arbitrary popup windows outside the app shell, or a new icon library.


### Phase 5 — Contribution registries and package composition

Implementation anchors:

- Architecture paragraphs: `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`.
- pnpm packages: Phase 5: No new package install.


Update. Extend the Phase 3.3 menu/toolbar composition for broader package contributions, feature package feedback, and diagnostics/package-composition status. Do not duplicate the basic command palette already delivered in Phase 3.3.

### Phase 11 — Tables, catalogues, and matrices

Implementation anchors:

- Architecture paragraphs: `ARCH-5.4-P01..P03`, `ARCH-6.15-P01..P04`, `ARCH-6.21-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-11.5-P01..P03`, `ARCH-14.1-P01..P02`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update. Common table toolbar/filter/sort components.

### Phase 13 — Stage 2 advanced tabbed main surfaces

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P04..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.3-P01..P06`, `ARCH-7.4-P01..P03`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 13: `pnpm --filter @textforge/ui add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`. `react-resizable-panels` should already be present from Phase 3.5 for shell side panels.


Update. Add advanced tab chrome, group-aware keyboard navigation, movement affordances, pinned/dirty/stale indicators, and richer tab state beyond the narrow Phase 3.1 main-session strip and the Phase 3.5 bounded side-panel resizing.

## Tests and definition of done

Component tests, accessibility checks, keyboard navigation tests, command palette tests after Phase 3.3, badge rendering/accessibility tests and shell-layout usability smoke tests after Phase 3.4, plus screenshot/layout checks after Phase 3.5.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 3.1 closure note

The package now exports real React workbench primitives instead of model-only chrome helpers. `TextForgeAppFrame`, `TextForgeTopBar`, `TextForgeWorkspaceSidebar`, `TextForgeSessionTabStrip`, `TextForgeUtilityPane`, `TextForgeStatusRail`, and `TextForgeSelectField` render the recovered shell frame while preserving the existing package-owned shell models.

The delivered shell chrome includes the collapsible workspace tree region, narrow main-session tab strip, compact status rail, and a utility pane that stays closed by default. Baseline keyboard and accessibility behaviour now includes semantic tree/tab roles, roving focus for the workspace tree and tab strips, and visible focus treatment, without pulling command palette, layout persistence, or advanced tab management forward.

## Phase 3.2 closure note

The package now also provides the lightweight storage/recovery chrome needed by the shell without taking ownership of persistence itself. `TextForgeCallout` and the existing top-bar, utility-pane, and badge primitives now carry the browser-managed workspace wording, reset confirmation flow, and storage initialization/recovery messaging used by the Phase 3.2 shell.

## Phase 3.3 closure note

The package now renders the command-focused shell chrome promised for this phase: contribution-driven menu and toolbar presentation plus a local command palette with search, keyboard navigation, and execute flow. The Phase 3.3 UI remains intentionally narrow; it does not become a plugin manager, diagnostics dashboard, or full feature-package composition surface.
