# @textforge/itm — Package Implementation Guide

## Purpose

Canonical ITM parser, serializer, resolver, selectors, styles, views, validation, profiles, and report/model integration interfaces.

## Ownership rule

`@textforge/itm` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/pipeline`

Third-party candidates: YAML parser where needed. All third-party dependencies must pass the open-source license gate.

## Public surface

parse/serialize/resolve/validate/project APIs, selector/style/viewpoint/profile interfaces, ITM diagnostics.

## Milestone plan

### Phase 6 — ITM integration and model/report foundation

Create. Parser/serializer/resolver interfaces, selectors, styles, views/viewpoints, validation diagnostics, profile package loading, workspace include resolver contract.

### Phase 7 — ITM visual projections

Update. Add projection APIs for tree, graph, mindmap, catalogue, matrix, and report fragments.

### Phase 9 — Markdown + ITM report generation

Update. Add report-oriented view extraction and model fragment export APIs.

### Phase 11 — Tables, catalogues, and matrices

Update. Expose node/relationship catalogue and matrix projections.

### Phase 12 — Enterprise architecture and ArchiMate foundation

Update. Support ArchiMate profile packaging and validation hooks.

### Phase 15 — Controlled graph, diagram, and pipeline editors

Update. Add small-subgraph patch contracts and view-layout delta support.

## Tests and definition of done

Parser/serializer round-trip tests, resolver tests, selector/style/view tests, validation diagnostics, profile fixtures.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
