# @textforge/workspace — Package Implementation Guide

## Purpose

Virtual workspace resources, folders, text/byte content representation, Dexie persistence, ZIP import/export, metadata, provenance, and workspace-relative references.

## Ownership rule

`@textforge/workspace` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`

Third-party candidates: Dexie, fflate. All third-party dependencies must pass the open-source license gate.

## Public surface

WorkspaceService, persisted-workspace helpers, Dexie storage/reset helpers, WorkspaceResource, WorkspaceFolder, WorkspaceMutation, WorkspaceQuery, WorkspaceReferenceResolver, and workspace manifest APIs.

## Milestone plan

### Phase 1 — Workspace and Stage 1 surface skeleton

Implementation anchors:

- Architecture paragraphs: `ARCH-4.1-P01..P02`, `ARCH-4.2-P01..P03`, `ARCH-4.3-P01..P07`, `ARCH-5.2-P01..P06`, `ARCH-5.3-P01..P05`, `ARCH-5.6-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.2-P01..P04`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.15-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.6-P01..P06`, `ARCH-7.7-P01..P04`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 1: `pnpm --filter @textforge/workspace add @textforge/core@workspace:*`


Create. Virtual files/folders, resource IDs, text/binary resource metadata, Dexie schema, basic create/open/save/delete/rename/move APIs. The schema may exist before the real Dexie runtime is wired.

### Phase 3 — ZIP workspace import/export

Implementation anchors:

- Architecture paragraphs: `ARCH-5.9-P01..P05`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.22-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3: `pnpm --filter @textforge/workspace add fflate`


Update. Add fflate ZIP import/export, selected-folder export, full-workspace export, workspace manifest, path normalization, conflict policy.

Whole-workspace import/export uses the TextForge manifest archive format. Selected-folder ZIP flows must stay plain-file oriented: folder export should emit only the folder contents rebased at ZIP root, and folder import should accept ordinary ZIP trees without requiring `textforge-workspace.json`.

### Phase 3.2 — Dexie workspace persistence recovery

Implementation anchors:

- Architecture paragraphs: `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3.2: `pnpm --filter @textforge/workspace add dexie`


Update. Add Dexie as a real runtime dependency and implement versioned IndexedDB-backed persistence for folders, text resources, binary resources, resource metadata, language IDs, workspace manifests, and schema versioning. Hydrate the workspace on startup, persist all core mutation flows, and make ZIP import/export operate against the persisted workspace state.

Include explicit reset/recovery behaviour for corrupted or incompatible local browser storage. Exclude remote sync, filesystem mirroring, directory handles, session-layout restore, and open-tab restore.

### Phase 3.3 — Command palette and contribution-driven shell commands

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: Phase 3.3: No new package install.


Update. Expose existing workspace actions as shell command contributions where applicable, including import/export, selected-folder ZIP export, new folder/resource, rename, delete, and storage reset/recovery actions. Do not add new workspace behaviours solely to populate the palette.

### Phase 3.4 — Resource identity badges and workbench readability pass

Implementation anchors:

- Architecture paragraphs: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`.
- pnpm packages: Phase 3.4: No new package install.

Update. Generate and persist stable document badge seeds/assignments from resource identity, path/name, content representation, and language ID. Use the placement-based `8 × 8 × 8 × 5 = 2560` badge space across shape, accent, mark, and placement. Preserve badges across reload and ZIP export/import where possible. Repair collisions deterministically after restore, duplication, batch upload, or ZIP import, and expose diagnostics when repair changes a badge.

The workspace package does not own the readability pass, but it must provide clean resource metadata so the UI can make the active resource obvious without deriving identity from local filesystem handles, remote sync identity, or arbitrary icon assets.


### Phase 3.6 — Unified workspace resources and representation-based surface routing

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P01..P06`, `ARCH-5.9-P01..P05`, `ARCH-5.11-P01..P09`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.22-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3.6: No new package install.


Update. Replace the public split between `WorkspaceTextResource` and `WorkspaceBinaryResource` with one workspace file/resource contract that stores content as either text or bytes. Folders may remain separate workspace entries for tree operations, but files should no longer be semantically categorized as `kind: text` or `kind: binary`.

Add a safe migration or compatibility layer for the current Dexie schema and workspace ZIP archives. Import classification should choose the stored representation using MIME type, known language definitions, extension, and safe decoding rules without persisting a larger openability taxonomy. SVG should normally import and persist as text with `mimeType: image/svg+xml` and `languageId: svg`; PNG/JPEG/WebP/GIF/AVIF/PDF and other opaque formats should remain byte-stored.

### Phase 3.7 — Context menus as thin command projections

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.7: No new package install.


Update only as needed to let existing workspace commands execute against an explicit context target supplied by a tree-item context menu. Reuse current commands for new folder/resource, upload/import into folder, export selected folder, download selected file, rename, and delete. Do not add separate context-menu-only business logic.

### Phase 4.1 — Foundation stabilization before contribution registries

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`, `ARCH-13.8-P01..P03`.
- Grilling record: `roadmap/grilling/phase-4.1-grilling.md`.
- pnpm packages: Phase 4.1: No new package install.


Update. Ensure workspace resources expose stable identity and content facts separately from viewer/editor eligibility. Import, detection, migration, and resource-state problems should use the shared diagnostic shape. Confirm there is no reintroduced hard text/binary surface-routing partition and that SVG remains valid as both source-openable text and visual-viewable image where facts allow.

## Tests and definition of done

Include Phase 4.1 stabilization audit checks where this package is in scope. Persistence tests, Dexie schema/version tests after Phase 3.2, ZIP import/export tests, path normalization tests, byte-resource round-trip tests, workspace manifest tests, command contribution tests after Phase 3.3, badge identity/collision-repair tests after Phase 3.4, unified-resource/SVG-as-text tests after Phase 3.6, context-menu target tests after Phase 3.7, plus screenshot/layout checks after Phase 3.5.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 3 closure note

The package now exposes an `fflate`-backed archive manifest plus full-workspace and selected-folder ZIP export/import helpers, path normalization, and explicit `error | skip | replace` import conflict handling. Focused `lint` and `test` checks pass for the package, and `corepack pnpm verify` covers the broader workspace wiring.

## Phase 3.2 closure note

The package now ships Dexie as a real runtime dependency and exposes a browser-managed persistence path instead of only a schema placeholder. `openWorkspaceDexieStorage`, `createPersistentWorkspaceService`, `createPersistedWorkspaceService`, and `resetWorkspaceDexieStorage` back the existing workspace model with versioned IndexedDB tables for manifests, folders, text resources, binary resources, and schema metadata.

The in-memory service contract also now carries `getManifest`, `replaceState`, and `setSelectedResourceId`, so startup hydration, selection persistence, ZIP import/export, and explicit storage reset/recovery all operate against the persisted workspace state without pulling tab/session restore forward. Focused package checks now cover Dexie hydration, selection persistence, ID continuity after reload, corrupted-storage detection, and reset recovery.

## Phase 3.3 closure note

The package now exposes its existing shell-facing actions as command contributions instead of leaving them hard-wired in the app shell. The delivered command set covers new folder/resource creation, workspace ZIP import/export, selected-folder ZIP export, rename/delete, and explicit storage reset/retry actions over the existing persisted workspace service without adding new workspace behavior solely to fill the palette.

Single-folder ZIP handling is now intentionally split from whole-workspace dumps: full workspace import/export remains manifest-based, while selected-folder export emits a plain ZIP tree and folder import accepts ordinary ZIP file trees without expecting TextForge metadata files.

## Phase 4.1 closure note

The package now consumes `@textforge/core` only through its public workspace entrypoint and keeps resource identity/content facts separate from surface eligibility. The stabilized audit also confirms that unified resources, including text-stored SVG, continue to flow into the shell as facts for contribution predicates rather than through a reintroduced text-versus-binary routing split.

## WP-RES-01 progress note

`@textforge/workspace` now treats provider-aware resource descriptors as part of the canonical workspace entry metadata rather than as side data. Workspace entries normalize provider IDs, revision IDs, capability IDs, owner/provenance metadata, and diagnostics; bundled docs resolve through a read-only provider baseline; and workspace mutations now enforce resource capabilities such as write, rename, move, delete, and create-child before mutating state.

The bundled docs subtree is now expected to project into the live workspace as a rebuild-time overlay rather than as duplicated persisted user data. IndexedDB should retain only the user-managed workspace state plus local `.textforge` working folders, while `/.textforge/resources` is rebuilt from the bundled app artifact on each load.

## WP-REPO-01 progress note

`@textforge/workspace` now exposes frontend-safe repository-root helpers for local resolution: `createDefaultWorkspaceRepositoryRoots(...)` defines the default writable-workspace and bundled-docs roots, and `resolveWorkspaceRepositoryLocation(...)` resolves workspace paths, relative paths, provider-URI hints such as `bundled://...`, and explicit logical alias fixtures down to canonical workspace paths without direct fetch behavior. This keeps repository/include resolution on the same provider-aware resource model introduced by `WP-RES-01` instead of inventing a second repository metadata stack.


## V16 backend-optional responsibilities

`@textforge/workspace` owns the first local provider implementation seams: IndexedDB, ZIP/folder import/export, generated resources, local service-folder conventions, dirty state, base revisions, and local changeset assembly. It must keep local/offline storage app-managed and must not introduce File System Access API, persistent directory handles, silent file reads/writes, background sync, or arbitrary network providers.
