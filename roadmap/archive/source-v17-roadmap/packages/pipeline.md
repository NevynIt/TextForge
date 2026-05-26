# @textforge/pipeline — Package Implementation Guide

## Purpose

Contribution-based pipeline runner, trace, intermediate values, generated resources, diagnostics, and controlled write-back contracts.

## Ownership rule

`@textforge/pipeline` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`

Third-party candidates: None or near-none. All third-party dependencies must pass the open-source license gate.

## Public surface

PipelineContribution, PipelineStep, PipelineRunner, PipelineTrace, PipelineResult, PipelineValue, CanonicalPatch.

## Milestone plan

### Phase 3.3 — Command palette and contribution-driven shell commands

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


No direct package work. This phase must not pull pipeline contribution loading, diagnostics aggregation, or intermediate reopening forward. It only creates the shell-command substrate that later pipeline actions may use.

### Phase 4 — Markdown, local assets, and generated diagram assets

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.8-P01..P06`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 4: `pnpm --filter @textforge/pipeline add @textforge/core@workspace:* @textforge/workspace@workspace:*`


Create. Minimal pipeline contribution registry, pipeline runner, trace, generated resource output type.

### Phase 4.1 — Foundation stabilization before contribution registries

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`, `ARCH-13.8-P01..P03`.
- Grilling record: `roadmap/grilling/phase-4.1-grilling.md`.
- pnpm packages: Phase 4.1: No new package install.


Update. Audit the Phase 4 pipeline registry, runner, trace model, generated-resource outputs, and diagnostics against the shared Phase 4.1 contracts. Pipeline step identity and intermediate value metadata should be ready to participate in active-capability-scoped resolution in Phase 5 without creating a second registry.

### Phase 5 — Contribution registries and package composition

Implementation anchors:

- Architecture paragraphs: `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`.
- pnpm packages: Phase 5: No new package install.


Update. Add active-capability-scoped step contribution loading, short-name and qualified-name resolution, conflict diagnostics, deterministic resolver fixture coverage, diagnostics aggregation, intermediate representation metadata, and intermediate value reopening through active compatible surfaces. Expose handler metadata for `@textforge/markdown` through the canonical contribution manifest rather than a pipeline-local registry.

### Phase 6 — ITM integration and model/report foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-6.6-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P12`, `ARCH-11.2-P01..P02`, `ARCH-12.2-P01`.
- pnpm packages: Phase 6: No new package install.


Update. Add ITM model value type and ITM-based transformation step contracts.

### Phase 8 — Lua automation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.15-P01..P04`, `ARCH-6.19-P01..P06`, `ARCH-7.10-P01..P05`, `ARCH-11.1-P01..P02`.
- pnpm packages: Phase 8: No new package install.


Update. Add Lua-backed pipeline step type and diagnostics mapping.

### Phase 10 — BPMN support and first mature visual editor

Implementation anchors:

- Architecture paragraphs: `ARCH-5.13-P01..P05`, `ARCH-5.3-P01..P08`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-14.1-P01..P02`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update. Add BPMN XML value and optional BPMN-to-ITM/ITM-to-BPMN extension points.

### Phase 15 — Controlled graph, diagram, and pipeline editors

Implementation anchors:

- Architecture paragraphs: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 15: No new package install.


Update. Add visual pipeline editor schema and controlled write-back patches.

## Tests and definition of done

Include Phase 4.1 stabilization audit checks where this package is in scope. Pipeline execution tests, trace tests, diagnostics aggregation tests, intermediate reopening tests, patch/write-back tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 4 closure note

The package now exposes the Phase 4 baseline runtime: generated-resource descriptors, a minimal contribution manifest shape, a registry for pipeline steps, and a runner/trace contract that the Markdown and diagrams packages can compose without importing app-shell internals. The implementation stays intentionally small so Phase 5 can replace ad hoc registration with broader contribution-pack composition instead of undoing a heavier first pass.

## Phase 4.1 closure note

The package now aligns step identity and failure reporting with the shared diagnostic contract. Missing or failing pipeline steps emit structured diagnostics with machine-readable codes and origin metadata instead of relying only on raw thrown errors, while the package also exposes its runtime as a default-active pipeline capability ready for Phase 5 composition.


## V16 backend-optional responsibilities

`@textforge/pipeline` should represent generated outputs as source, derived, or controlled-generated resources and integrate with changesets only when explicit. Backend-backed service execution must use explicit job APIs, not file writes as fake commands. AI-generated patch text must remain non-mutating until a later user-approved changeset workflow exists.
