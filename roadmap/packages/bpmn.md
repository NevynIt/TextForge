# @textforge/bpmn — Package Implementation Guide

## Purpose

BPMN XML support, bpmn-js viewer/modeler surfaces, controlled XML write-back, diagnostics, and later ITM/BPMN mapping.

## Ownership rule

`@textforge/bpmn` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/pipeline`
- `@textforge/editors`
- `@textforge/itm`

Third-party candidates: bpmn-js, bpmn-moddle. All third-party dependencies must pass the open-source license gate.

## Public surface

BPMN XML surfaces, modeler write-back contract, BPMN diagnostics, BPMN import/export extension points.

## Milestone plan

### Phase 10 — BPMN support and first mature visual editor

Create. BPMN XML language integration, bpmn-js viewer/modeler surfaces, controlled edit mode, XML patch preview/apply/discard, diagnostics refresh.

### Phase 11 — Tables, catalogues, and matrices

Update. Add BPMN task/event/gateway catalogue surfaces if useful.

## Tests and definition of done

BPMN XML load/render/edit/write-back tests, attribution/license acceptance evidence, diagnostics tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
