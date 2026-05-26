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

### Phase 3.1–3.3 — Recovery-phase compatibility

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`, `ARCH-6.7-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


No direct table feature work. These phases establish React shell usability, Dexie persistence, and shell-command composition. This package should not be started early, but later work must consume the resulting workspace, surface, and command contracts through public interfaces.

### Phase 11 — Tables, catalogues, and matrices

Implementation anchors:

- Architecture paragraphs: `ARCH-5.4-P01..P03`, `ARCH-6.15-P01..P04`, `ARCH-6.21-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-11.5-P01..P03`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 11: `pnpm --filter @textforge/tables add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* @textforge/itm@workspace:* @tanstack/react-table`


Create. TanStack Table semantic table surfaces, CSV/TSV grid editor, catalogue/matrix abstractions, validation issue table.

### Phase 12 — Enterprise architecture and ArchiMate foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.14-P01..P08`, `ARCH-6.10-P01..P13`, `ARCH-6.18-P08..P12`, `ARCH-11.2-P01..P02`, `ARCH-11.5-P01..P03`, `ARCH-12.2-P01`.
- pnpm packages: Phase 12: No new package install.


Update. Reusable EA catalogue/matrix editors.

## Tests and definition of done

CSV/grid edit tests, catalogue/matrix patch tests, sorting/filtering behaviour tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
