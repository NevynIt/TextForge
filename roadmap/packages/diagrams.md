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

No direct diagram feature work. These phases establish React shell usability, Dexie persistence, and shell-command composition. This package should not be started early, but later work must consume the resulting workspace, surface, and command contracts through public interfaces.

### Phase 4 — Markdown, local assets, and generated diagram assets

Create. Mermaid and Graphviz rendering pipelines, generated SVG resource creation, SVG-to-PNG rasterization pipeline.

### Phase 7 — ITM visual projections

Update. Add ITM-to-Mermaid, ITM-to-Graphviz, ITM-to-Cytoscape/Sigma adapters where appropriate.

### Phase 9 — Markdown + ITM report generation

Update. Ensure generated SVG/PNG assets can be stored and referenced in reports.

### Phase 15 — Controlled graph, diagram, and pipeline editors

Update. Add React Flow adapter for controlled graph/flowchart/layout-delta editing with explicit patch generation.

## Tests and definition of done

Mermaid/DOT render tests, SVG storage tests, SVG-to-PNG rasterization tests, generated asset stale-state tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
