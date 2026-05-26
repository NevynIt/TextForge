# @textforge/itm — Package Implementation Guide

## Purpose

Canonical ITM parser, serializer, resolver, selectors, styles, views, validation, profiles, and report/model integration interfaces.

## Ownership rule

`@textforge/itm` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

Current validated implementation note:

- TextForge vendors the current upstream `nevynit/ITM` runtime under `packages/itm/src/upstream/` and layers TextForge-owned workspace include resolution, resolver diagnostic taxonomy helpers, Markdown `itm`/`itm-pub` contribution integration, and vendored profile fixtures on top of that runtime.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`

Third-party candidates: YAML parser and XML support where needed. All third-party dependencies must pass the open-source license gate.

## Public surface

parse/serialize/resolve/validate/project APIs, selector/style/viewpoint/profile interfaces, ITM diagnostics.

## Milestone plan

### Phase 3.1–3.3 — Recovery-phase compatibility

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`, `ARCH-6.7-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


No direct ITM feature work. These phases establish React shell usability, Dexie persistence, and shell-command composition. This package should not be started early, but later work must consume the resulting workspace, surface, and command contracts through public interfaces.

### Phase 6 — ITM integration and model/report foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-6.6-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P12`, `ARCH-11.2-P01..P02`, `ARCH-12.2-P01`.
- pnpm packages: Phase 6: `corepack pnpm --filter @textforge/itm add @textforge/core@workspace:* @textforge/workspace@workspace:* yaml fast-xml-parser`


Create. Parser/serializer/resolver interfaces, selectors, styles, views/viewpoints, validation diagnostics, profile package loading, workspace include resolver contract, stable resolver diagnostic categories, and public APIs needed by `@textforge/markdown` to parse `itm` blocks, validate them, and render `itm-pub` publication views.

### Phase 7 — ITM visual projections

Implementation anchors:

- Architecture paragraphs: `ARCH-5.12-P01..P04`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-11.5-P01..P03`.
- pnpm packages: Phase 7: No new package install.


Update. Add projection APIs for tree, graph, mindmap, catalogue, matrix, and report fragments.

### Phase 9 — Markdown + ITM report generation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 9: No new package install.


Update. Add report-oriented view extraction and model fragment export APIs that can be consumed from resolved TF-MD report pipelines.

### Phase 11 — Tables, catalogues, and matrices

Implementation anchors:

- Architecture paragraphs: `ARCH-5.4-P01..P03`, `ARCH-6.15-P01..P04`, `ARCH-6.21-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-11.5-P01..P03`, `ARCH-14.1-P01..P02`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update. Expose node/relationship catalogue and matrix projections.

### Phase 12 — Enterprise architecture and ArchiMate foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.14-P01..P08`, `ARCH-6.10-P01..P13`, `ARCH-6.18-P08..P12`, `ARCH-11.2-P01..P02`, `ARCH-11.5-P01..P03`, `ARCH-12.2-P01`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update. Support ArchiMate profile packaging and validation hooks.

### Phase 15 — Controlled graph, diagram, and pipeline editors

Implementation anchors:

- Architecture paragraphs: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 15: No new package install.


Update. Add small-subgraph patch contracts and view-layout delta support.

## Tests and definition of done

Parser/serializer round-trip tests, resolver taxonomy tests, selector/style/view tests, validation diagnostics, vendored profile fixtures, and Markdown publication integration checks.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.


## V16 backend-optional responsibilities

`@textforge/itm` must treat `%repository` as a provider-resolved declaration. Repository values may look like aliases, URLs, URIs, or hints, but the frontend must not fetch them directly. Resolver diagnostics must distinguish unresolved, unsupported, unauthorized, unavailable, conflicting alias, and version/capability mismatch cases.
