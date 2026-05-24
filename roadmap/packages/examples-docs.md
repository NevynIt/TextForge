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

Implementation anchors:

- Architecture paragraphs: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.1-P01..P05`, `ARCH-6.17-P01..P04`, `ARCH-6.20-P01..P07`, `ARCH-10-P01..P04`, `ARCH-11.4-P01`.
- pnpm packages: Phase 0: `pnpm --filter @textforge/examples-docs add @textforge/core@workspace:*`


Create. Project docs index, sample workspace conventions, package documentation template.

### Phase 3.1–3.3 — Recovery-phase documentation alignment

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`, `ARCH-6.7-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update only if the recovery phases change user-facing onboarding, workspace storage wording, shell screenshots, or package contribution examples. Keep examples aligned with the React shell, Dexie persistence boundary, and command-palette flow once those phases land.

### Phase 3.4 — Resource identity badges and workbench readability pass

Implementation anchors:

- Architecture paragraphs: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`.
- pnpm packages: Phase 3.4: No new package install.

Update. Add a short document-badge and workbench-readability style note. Include the placement-based `8 × 8 × 8 × 5 = 2560` badge model, the `lucide-react` generic-icon rule, and sample workspace fixtures or screenshots/checklists showing stable badges, duplicate-name handling, ZIP export/import preservation, deterministic collision repair after restore or batch import, no global horizontal scrolling, compact top chrome, active-resource highlighting, and utility-panel behavior.


### Phase 19 — Release-envelope verification and accreditation evidence

Implementation anchors:

- Architecture paragraphs: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.20-P01..P07`, `ARCH-11.4-P01`, `ARCH-14-P01..P03`.
- pnpm packages: Phase 19: No new package install.


Update. Add release checklist, example accreditation output, sample build artifacts, and end-to-end tutorial workspace.

## Tests and definition of done

Resource browser smoke tests, example workspace load tests, tutorial freshness checks.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.


## Repository pivot responsibility

This package also owns preserved tutorial/example material that is intentionally migrated from the previous implementation. During the pivot, selected legacy examples and fixtures should be moved here or under `fixtures/legacy` with clear provenance notes. It should not become a dump of the old implementation source tree.
