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

Third-party candidates: Radix UI/Floating UI where useful. All third-party dependencies must pass the open-source license gate.

## Public surface

React components and primitives with no feature ownership.

## Milestone plan

### Phase 0 — Repository foundation, package skeleton, security envelope, and dependency policy

Create. Minimal React primitives, theming tokens, icon conventions, app frame placeholders.

### Phase 1 — Workspace and Stage 1 surface skeleton

Update. Workspace tree frame, surface frame, toolbar slots, status badges.

### Phase 5 — Contribution registries and package composition

Update. Add command palette and contribution-driven menu/toolbar slots.

### Phase 11 — Tables, catalogues, and matrices

Update. Common table toolbar/filter/sort components.

### Phase 13 — Stage 2 tabbed main surfaces

Update. Add tab chrome and keyboard navigation.

## Tests and definition of done

Component tests, accessibility checks, keyboard navigation tests where applicable.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
