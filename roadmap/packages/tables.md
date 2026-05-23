# @textforge/tables — Package Implementation Guide

## Purpose

TanStack Table semantic tables, CSV/TSV grid editing, catalogues, matrices, validation tables, and optional AG Grid Community adapter.

## Ownership rule

`@textforge/tables` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/ui`
- `@textforge/itm`

Third-party candidates: TanStack Table, optional AG Grid Community. All third-party dependencies must pass the open-source license gate.

## Public surface

Table surface contributions, catalogue/matrix abstractions, CSV/TSV editing, issue table components.

## Milestone plan

### Phase 11 — Tables, catalogues, and matrices

Create. TanStack Table semantic table surfaces, CSV/TSV grid editor, catalogue/matrix abstractions, validation issue table.

### Phase 12 — Enterprise architecture and ArchiMate foundation

Update. Reusable EA catalogue/matrix editors.

## Tests and definition of done

CSV/grid edit tests, catalogue/matrix patch tests, sorting/filtering behaviour tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
