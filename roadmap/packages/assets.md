# @textforge/assets — Package Implementation Guide

## Purpose

Read-only image/SVG/PDF/generic binary resource surfaces, blob URL lifecycle, asset picker, provenance display, and export helpers.

## Ownership rule

`@textforge/assets` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/ui`

Third-party candidates: PDF.js, browser image/SVG APIs. All third-party dependencies must pass the open-source license gate.

## Public surface

Asset viewer surfaces, blob URL service, asset picker, generated asset metadata/provenance views.

## Milestone plan

### Phase 1 — Workspace and Stage 1 surface skeleton

Create. Image/SVG/PDF/generic binary read-only surfaces; blob URL lifecycle; workspace asset binding.

### Phase 3 — ZIP workspace import/export

Update. Ensure binary files round-trip through workspace ZIP.

### Phase 4 — Markdown, local assets, and generated diagram assets

Update. Add generated asset provenance, stale-state display, SVG/PNG export actions.

### Phase 17 — Sketch and annotation resources

Update. Add Excalidraw sketch/annotation resource surface if still desired; store sketch JSON plus SVG/PNG exports as workspace resources.

### Phase 18 — Late PDF generation and PDF annotation

Update. Optional PDF annotation layer over PDF.js; store annotations as separate workspace resources/deltas.

## Tests and definition of done

Image/SVG/PDF viewing tests, blob URL lifecycle tests, generated asset provenance tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 1 closure note

The package now exposes concrete image, SVG, PDF, and generic binary viewer surface factories, plus typed surface model and mount contracts. The web shell exercises the SVG viewer through the surface registry with blob URL binding, and CDP validation verifies the mounted viewer path.
