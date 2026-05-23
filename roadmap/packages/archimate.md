# @textforge/archimate — Package Implementation Guide

## Purpose

ArchiMate ITM profile, ArchiMate exchange XML import/export, validation, viewpoints, catalogues, matrices, EA report blocks, and later visual editing investigation.

## Ownership rule

`@textforge/archimate` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/pipeline`
- `@textforge/itm`
- `@textforge/tables`
- `@textforge/markdown`

Third-party candidates: ArchiMate exchange XML utilities; archimate-js only after investigation. All third-party dependencies must pass the open-source license gate.

## Public surface

ArchiMate profile package, validation, import/export, catalogues, matrices, EA report and viewpoint contributions.

## Milestone plan

### Phase 12 — Enterprise architecture and ArchiMate foundation

Create. ArchiMate ITM profile, element/relationship definitions, validation rules, viewpoints, style rules, exchange XML import/export, EA catalogues and matrices.

### Phase 16 — ArchiMate visual editing investigation

Update. Investigate archimate-js; if acceptable, add experimental ArchiMate view editor; otherwise define React Flow fallback. Keep ITM/profile/exchange XML canonical.

## Tests and definition of done

Profile validation tests, exchange XML import/export fixtures, viewpoint/catalogue/matrix/report tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
