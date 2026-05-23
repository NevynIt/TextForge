# @textforge/markdown — Package Implementation Guide

## Purpose

Markdown preview, report pipeline, workspace image resolution, embedded diagrams, embedded ITM publication blocks, and print-optimized HTML.

## Ownership rule

`@textforge/markdown` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/pipeline`
- `@textforge/assets`
- `@textforge/diagrams`
- `@textforge/itm`

Third-party candidates: markdown-it, unified/remark/rehype, KaTeX integration hooks. All third-party dependencies must pass the open-source license gate.

## Public surface

Markdown preview/report surfaces, Markdown pipelines, local asset resolver integration, report block contribution APIs.

## Milestone plan

### Phase 4 — Markdown, local assets, and generated diagram assets

Create. markdown-it preview surface, workspace-relative image resolver, Markdown toolbar for inserting workspace images/diagram blocks, print-optimized HTML baseline.

### Phase 6 — ITM integration and model/report foundation

Update. Add embedded ITM publication blocks and ITM-driven report fragments.

### Phase 9 — Markdown + ITM report generation

Update. unified/remark/rehype report pipeline, section generation, local asset embedding/resolution, report preview surface.

### Phase 12 — Enterprise architecture and ArchiMate foundation

Update. Add EA report blocks: views, catalogues, matrices, traceability tables.

### Phase 14 — Rich Markdown editing, optional and round-trip gated

Update. Add Milkdown rich Markdown surface behind feature flag; preserve source editor fallback; implement round-trip tests for fenced ITM/Mermaid/DOT/KaTeX/front matter/local images.

### Phase 17 — Sketch and annotation resources

Update. Allow insertion of sketch assets into Markdown reports.

### Phase 18 — Late PDF generation and PDF annotation

Update. Evaluate local Markdown/HTML-to-PDF pipeline after print HTML stabilizes.

## Tests and definition of done

Markdown rendering tests, workspace image resolution tests, report pipeline tests, fenced-block preservation tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
