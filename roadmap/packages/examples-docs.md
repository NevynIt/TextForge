# @textforge/examples-docs — Package Implementation Guide

## Purpose

Bundled documentation, examples, sample workspaces, tutorial resources, test fixtures, and resource-browser content.

## Ownership rule

`@textforge/examples-docs` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`

Third-party candidates: None. All third-party dependencies must pass the open-source license gate.

## Public surface

Resource-browser content, sample workspaces, fixtures, tutorials, package docs.

## Milestone plan

### Phase 0 — Repository foundation, package skeleton, security envelope, and dependency policy

Create. Project docs index, sample workspace conventions, package documentation template.

### Phase 19 — Release-envelope verification and accreditation evidence

Update. Add release checklist, example accreditation output, sample build artifacts, and end-to-end tutorial workspace.

## Tests and definition of done

Resource browser smoke tests, example workspace load tests, tutorial freshness checks.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.


## Repository pivot responsibility

This package also owns preserved tutorial/example material that is intentionally migrated from the previous implementation. During the pivot, selected legacy examples and fixtures should be moved here or under `fixtures/legacy` with clear provenance notes. It should not become a dump of the old implementation source tree.
