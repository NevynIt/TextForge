# @textforge/diagrams — Package Implementation Guide

## Purpose

Mermaid, Graphviz/Viz.js, SVG generation, SVG-to-PNG rasterization, generated diagram resource handling, and later React Flow editing adapters.

## Ownership rule

`@textforge/diagrams` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/pipeline`
- `@textforge/assets`

Third-party candidates: Mermaid, Viz.js/Graphviz WASM, React Flow later. All third-party dependencies must pass the open-source license gate.

## Public surface

Diagram render pipelines, generated SVG/PNG output APIs, diagram source editors, later controlled diagram editor adapters.

## Milestone plan

### Phase 3.1–3.3 — Recovery-phase compatibility

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`, `ARCH-6.7-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


No direct diagram feature work. These phases establish React shell usability, Dexie persistence, and shell-command composition. This package should not be started early, but later work must consume the resulting workspace, surface, and command contracts through public interfaces.

### Phase 3.6–3.7 — Pre-diagram resource and shell readiness

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P01..P06`, `ARCH-5.11-P01..P09`, `ARCH-6.8-P01..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.22-P01..P04`.
- pnpm packages: No direct package install in these compatibility phases.

No direct diagram feature work. Phase 4 generated SVG output should consume the Phase 3.6 unified resource model and store SVG as text with `mimeType: image/svg+xml` and `languageId: svg`, while generated PNG output remains byte-stored. Context menus in Phase 3.7 may later expose diagram asset commands, but should not start diagram rendering early.

### Phase 4 — Markdown, local assets, and generated diagram assets

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.8-P01..P06`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 4: `pnpm --filter @textforge/diagrams add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/assets@workspace:* mermaid @viz-js/viz`


Create. Mermaid and Graphviz rendering pipelines, generated SVG resource creation, SVG-to-PNG rasterization pipeline, and Markdown-callable handlers for `mermaid`, `dot`, and `graphviz` fenced blocks.

### Phase 7 — ITM visual projections

Implementation anchors:

- Architecture paragraphs: `ARCH-5.12-P01..P04`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-11.5-P01..P03`.
- pnpm packages: Phase 7: `pnpm --filter @textforge/diagrams add cytoscape graphology sigma jsmind`


Update. Add ITM-to-Mermaid, ITM-to-Graphviz, ITM-to-Cytoscape/Sigma adapters where appropriate.

### Phase 9 — Markdown + ITM report generation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 9: No new package install.


Update. Ensure generated SVG/PNG assets can be stored and referenced in reports.

### Phase 15 — Controlled graph, diagram, and pipeline editors

Implementation anchors:

- Architecture paragraphs: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 15: `pnpm --filter @textforge/diagrams add @xyflow/react`


Update. Add React Flow adapter for controlled graph/flowchart/layout-delta editing with explicit patch generation.

## Tests and definition of done

Mermaid/DOT render tests, Markdown fenced-block handler tests, text-stored SVG output tests against Phase 3.6 unified resources, SVG-to-PNG rasterization tests, generated asset stale-state tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
