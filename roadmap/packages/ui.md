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

Create. Dependency-light theming tokens, icon conventions, app frame placeholders, and chrome contracts until the React workspace dependency is introduced.

### Phase 1 — Workspace and Stage 1 surface skeleton

Update. Workspace tree frame, surface frame, toolbar slots, status badges.

### Phase 3.1 — React workbench shell and UI recovery

Update. Convert the model-only chrome contracts into actual React components and primitives: app frame, top bar, collapsible workspace tree region, main surface frame, compact status rail, main-session tab strip, and utility/debug pane hidden by default.

This phase should make the shell materially more usable for testing while avoiding later feature work. Do not add command palette/menu composition, Dexie persistence, tab groups, drag-reorder, split panes, saved layouts, or domain-specific UI here.

### Phase 3.2 — Dexie workspace persistence recovery

Update only as needed for user-facing browser-managed workspace cues, storage reset/clear confirmations, and storage initialization/recovery messages. Do not make `@textforge/ui` own persistence.

### Phase 3.3 — Command palette and contribution-driven shell commands

Update. Add the command palette, command search/filter/execute behaviour, and contribution-driven toolbar/menu slot rendering for shell commands provided by existing packages.

This phase pulls forward only the shell-facing command UI from Phase 5. It must not add plugin management, diagnostics dashboards, deep context-menu proliferation, or full feature-package contribution UX.

### Phase 5 — Contribution registries and package composition

Update. Extend the Phase 3.3 menu/toolbar composition for broader package contributions, feature package feedback, and diagnostics/package-composition status. Do not duplicate the basic command palette already delivered in Phase 3.3.

### Phase 11 — Tables, catalogues, and matrices

Update. Common table toolbar/filter/sort components.

### Phase 13 — Stage 2 advanced tabbed main surfaces

Update. Add advanced tab chrome, group-aware keyboard navigation, movement affordances, pinned/dirty/stale indicators, and richer tab state beyond the narrow Phase 3.1 main-session strip.

## Tests and definition of done

Component tests, accessibility checks, keyboard navigation tests, command palette tests after Phase 3.3, and shell-layout usability smoke tests where applicable.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 3.1 closure note

The package now exports real React workbench primitives instead of model-only chrome helpers. `TextForgeAppFrame`, `TextForgeTopBar`, `TextForgeWorkspaceSidebar`, `TextForgeSessionTabStrip`, `TextForgeUtilityPane`, `TextForgeStatusRail`, and `TextForgeSelectField` render the recovered shell frame while preserving the existing package-owned shell models.

The delivered shell chrome includes the collapsible workspace tree region, narrow main-session tab strip, compact status rail, and a utility pane that stays closed by default. Baseline keyboard and accessibility behaviour now includes semantic tree/tab roles, roving focus for the workspace tree and tab strips, and visible focus treatment, without pulling command palette, layout persistence, or advanced tab management forward.
