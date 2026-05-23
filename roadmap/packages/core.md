# @textforge/core — Package Implementation Guide

## Purpose

Shared contracts, diagnostics, contribution manifests, capabilities, resource references, source ranges, commands, and typed values.

## Ownership rule

`@textforge/core` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies: none or minimal.

Third-party candidates: None or near-none. All third-party dependencies must pass the open-source license gate.

## Public surface

Types and interfaces only: diagnostics, resource refs, source ranges, capabilities, commands, manifests, value envelopes, and patch contracts.

## Milestone plan

### Phase 0 — Repository foundation, package skeleton, security envelope, and dependency policy

Create. Define stable types: Diagnostic, Severity, SourceRange, ResourceRef, ContributionManifest, Command, Capability, PipelineValue, CanonicalPatch placeholders.

### Phase 2 — Source-editor coverage and language foundation

Update. Stabilize language IDs, editor capabilities, lint/diagnostic bridge types.

### Phase 5 — Contribution registries and package composition

Update. Finalize contribution pack manifest shape and dependency declarations.

### Phase 13 — Stage 2 tabbed main surfaces

Update. Add stable session persistence types if needed.

## Tests and definition of done

Type-level tests, compatibility tests for public contracts, no feature dependency leakage.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 2 progress note

The package now defines stable source-editor language IDs, language metadata for the Phase 2 formats, editor capability IDs, and a diagnostic bridge contract. Runtime helpers infer language IDs from MIME type or extension for downstream editor and surface packages.
