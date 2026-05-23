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

No direct package work. This phase must not pull pipeline contribution loading, diagnostics aggregation, or intermediate reopening forward. It only creates the shell-command substrate that later pipeline actions may use.

### Phase 4 — Markdown, local assets, and generated diagram assets

Create. Minimal pipeline contribution registry, pipeline runner, trace, generated resource output type.

### Phase 5 — Contribution registries and package composition

Update. Add step contribution loading, diagnostics aggregation, intermediate value reopening using the broader contribution-pack system that extends Phase 3.3.

### Phase 6 — ITM integration and model/report foundation

Update. Add ITM model value type and ITM-based transformation step contracts.

### Phase 8 — Lua automation

Update. Add Lua-backed pipeline step type and diagnostics mapping.

### Phase 10 — BPMN support and first mature visual editor

Update. Add BPMN XML value and optional BPMN-to-ITM/ITM-to-BPMN extension points.

### Phase 15 — Controlled graph, diagram, and pipeline editors

Update. Add visual pipeline editor schema and controlled write-back patches.

## Tests and definition of done

Pipeline execution tests, trace tests, diagnostics aggregation tests, intermediate reopening tests, patch/write-back tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
