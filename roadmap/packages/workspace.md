# @textforge/workspace — Package Implementation Guide

## Purpose

Virtual workspace, text/binary resources, folders, Dexie persistence, ZIP import/export, metadata, provenance, and workspace-relative references.

## Ownership rule

`@textforge/workspace` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`

Third-party candidates: Dexie, fflate. All third-party dependencies must pass the open-source license gate.

## Public surface

WorkspaceService, WorkspaceResource, WorkspaceFolder, WorkspaceMutation, WorkspaceQuery, WorkspaceReferenceResolver, workspace manifest APIs.

## Milestone plan

### Phase 1 — Workspace and Stage 1 surface skeleton

Create. Virtual files/folders, resource IDs, text/binary resource metadata, Dexie schema, basic create/open/save/delete/rename/move APIs. The schema may exist before the real Dexie runtime is wired.

### Phase 3 — ZIP workspace import/export

Update. Add fflate ZIP import/export, selected-folder export, full-workspace export, workspace manifest, path normalization, conflict policy.

### Phase 3.2 — Dexie workspace persistence recovery

Update. Add Dexie as a real runtime dependency and implement versioned IndexedDB-backed persistence for folders, text resources, binary resources, resource metadata, language IDs, workspace manifests, and schema versioning. Hydrate the workspace on startup, persist all core mutation flows, and make ZIP import/export operate against the persisted workspace state.

Include explicit reset/recovery behaviour for corrupted or incompatible local browser storage. Exclude remote sync, filesystem mirroring, directory handles, session-layout restore, and open-tab restore.

### Phase 3.3 — Command palette and contribution-driven shell commands

Update. Expose existing workspace actions as shell command contributions where applicable, including import/export, selected-folder ZIP export, new folder/resource, rename, delete, and storage reset/recovery actions. Do not add new workspace behaviours solely to populate the palette.

## Tests and definition of done

Persistence tests, Dexie schema/version tests after Phase 3.2, ZIP import/export tests, path normalization tests, binary resource round-trip tests, workspace manifest tests, and command contribution tests after Phase 3.3.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 3 progress note

The package now exposes an `fflate`-backed archive manifest plus full-workspace ZIP export/import helpers with text and binary round-trip coverage. Selected-folder export and explicit import conflict policy handling remain the next Phase 3 slice.
