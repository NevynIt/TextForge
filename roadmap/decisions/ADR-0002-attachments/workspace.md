# ADR-0002 Attachment - @textforge/workspace

## Selected Package

- Package: `@textforge/workspace`
- Scope: package root modularization only.
- Package export map: unchanged, still exposes only `"."` as `./src/index.js`.
- Public facades: `packages/workspace/src/index.js` and `packages/workspace/src/index.ts`.

## Files Created

- `packages/workspace/src/api.ts`
- `packages/workspace/src/archive.js`
- `packages/workspace/src/constants.js`
- `packages/workspace/src/contributions.js`
- `packages/workspace/src/model.js`
- `packages/workspace/src/overlay.js`
- `packages/workspace/src/paths.js`
- `packages/workspace/src/persistence.js`
- `packages/workspace/src/repositories.js`
- `packages/workspace/src/service.js`
- `packages/workspace/src/storage.js`
- `packages/workspace/src/tree.js`
- `packages/workspace/src/types.ts`
- `roadmap/decisions/ADR-0002-attachments/workspace.md`

## Files Modified

- `packages/workspace/src/index.js`
- `packages/workspace/src/index.ts`

## Files Removed

- None.

## Responsibility Split

- `constants.js`: shared package constants, provider IDs, Dexie schema constants, archive constants, storage error codes.
- `contributions.js`: workspace command contributions and contribution manifest creation.
- `paths.js`: workspace path normalization, joins, dirname/basename helpers, sequential ID factory.
- `repositories.js`: repository root defaults and workspace repository location resolution.
- `model.js`: workspace state normalization, metadata cloning, resource refs, badge assignment/diagnostics, entry cloning and mutation helpers.
- `archive.js`: workspace archive manifest creation, full workspace ZIP import/export, folder ZIP import/export, conflict merge policy.
- `storage.js`: Dexie database setup, schema migration, load/save/clear/delete storage operations, storage error snapshots.
- `persistence.js`: persistent workspace wrapper and hydrated persisted service creation.
- `overlay.js`: overlay state projection and overlay-stripping persistence boundary.
- `tree.js`: workspace tree projection and entry detail derivation.
- `service.js`: mutable workspace service implementation and mutation API.
- `types.ts`: public type/interface declarations.
- `api.ts`: public value declarations for the TypeScript facade.
- `index.js` and `index.ts`: explicit public facades only.

## Public Runtime Exports

Before:

- `basenameWorkspacePath`
- `contributions`
- `createDefaultWorkspaceRepositoryRoots`
- `createPersistedWorkspaceService`
- `createPersistentWorkspaceService`
- `createSequentialIdFactory`
- `createWorkspaceArchiveManifest`
- `createWorkspaceContributionManifest`
- `createWorkspaceManifest`
- `createWorkspaceOverlayService`
- `createWorkspaceService`
- `createWorkspaceTreeItems`
- `defaultWorkspaceDexieDatabaseName`
- `dirnameWorkspacePath`
- `exportWorkspaceFolderToZip`
- `exportWorkspaceToZip`
- `importWorkspaceFolderFromZip`
- `importWorkspaceFromZip`
- `joinWorkspacePath`
- `listWorkspaceBadgeDiagnostics`
- `mergeImportedWorkspaceState`
- `normalizeWorkspacePath`
- `openWorkspaceDexieStorage`
- `resetWorkspaceDexieStorage`
- `resolveWorkspaceRepositoryLocation`
- `workspaceCommandContributions`
- `workspaceContribution`
- `workspaceDexieSchema`
- `workspaceDexieSchemaVersion`
- `workspaceEntryToResourceRef`
- `workspaceProviderIds`
- `workspaceStorageErrorCodes`

After:

- `basenameWorkspacePath`
- `contributions`
- `createDefaultWorkspaceRepositoryRoots`
- `createPersistedWorkspaceService`
- `createPersistentWorkspaceService`
- `createSequentialIdFactory`
- `createWorkspaceArchiveManifest`
- `createWorkspaceContributionManifest`
- `createWorkspaceManifest`
- `createWorkspaceOverlayService`
- `createWorkspaceService`
- `createWorkspaceTreeItems`
- `defaultWorkspaceDexieDatabaseName`
- `dirnameWorkspacePath`
- `exportWorkspaceFolderToZip`
- `exportWorkspaceToZip`
- `importWorkspaceFolderFromZip`
- `importWorkspaceFromZip`
- `joinWorkspacePath`
- `listWorkspaceBadgeDiagnostics`
- `mergeImportedWorkspaceState`
- `normalizeWorkspacePath`
- `openWorkspaceDexieStorage`
- `resetWorkspaceDexieStorage`
- `resolveWorkspaceRepositoryLocation`
- `workspaceCommandContributions`
- `workspaceContribution`
- `workspaceDexieSchema`
- `workspaceDexieSchemaVersion`
- `workspaceEntryToResourceRef`
- `workspaceProviderIds`
- `workspaceStorageErrorCodes`

Runtime export diff:

- Missing: none.
- Added: none.

## Public Type Exports

Before and after:

- `CreatePersistedWorkspaceServiceOptions`
- `CreateWorkspaceOverlayServiceOptions`
- `HydratedWorkspaceServiceResult`
- `PersistentWorkspaceService`
- `WorkspaceArchiveExportOptions`
- `WorkspaceArchiveFolderRecord`
- `WorkspaceArchiveImportOptions`
- `WorkspaceArchiveImportResult`
- `WorkspaceArchiveManifest`
- `WorkspaceArchiveResourceEncoding`
- `WorkspaceArchiveResourceRecord`
- `WorkspaceBadgeDiagnostic`
- `WorkspaceBinaryResource`
- `WorkspaceCanonicalPatch`
- `WorkspaceCreateBinaryInput`
- `WorkspaceCreateFolderInput`
- `WorkspaceCreateResourceBinaryInput`
- `WorkspaceCreateResourceInput`
- `WorkspaceCreateResourceTextInput`
- `WorkspaceCreateTextInput`
- `WorkspaceDexieSchema`
- `WorkspaceDexieStorage`
- `WorkspaceEntry`
- `WorkspaceEntryBase`
- `WorkspaceEntryKind`
- `WorkspaceFolder`
- `WorkspaceFolderArchive`
- `WorkspaceFolderArchiveFile`
- `WorkspaceGeneratedProvenance`
- `WorkspaceHydrationSource`
- `WorkspaceImportConflictPolicy`
- `WorkspaceManifest`
- `WorkspaceMetadata`
- `WorkspaceMoveInput`
- `WorkspaceMutation`
- `WorkspacePersistenceStatus`
- `WorkspacePipelineValue`
- `WorkspaceProviderId`
- `WorkspaceQuery`
- `WorkspaceReferenceResolver`
- `WorkspaceRepositoryAlias`
- `WorkspaceRepositoryResolverOptions`
- `WorkspaceRepositoryRoot`
- `WorkspaceResolvedRepositoryLocation`
- `WorkspaceResource`
- `WorkspaceResourceBase`
- `WorkspaceResourceRepresentation`
- `WorkspaceSaveBinaryInput`
- `WorkspaceSaveResourceBinaryInput`
- `WorkspaceSaveResourceInput`
- `WorkspaceSaveResourceTextInput`
- `WorkspaceSaveTextInput`
- `WorkspaceService`
- `WorkspaceServiceOptions`
- `WorkspaceState`
- `WorkspaceStorageDriver`
- `WorkspaceStorageErrorSnapshot`
- `WorkspaceStorageKind`
- `WorkspaceStorageOptions`
- `WorkspaceStorageStatus`
- `WorkspaceTextResource`
- `WorkspaceTreeItem`

Type facade export diff:

- Missing: none.
- Added: none.

## Import Compatibility

Root imports found under `apps` and `packages`:

- `apps/textforge-web/src/workbench.js`
- `apps/textforge-web/src/markdownPreviewLinks.js`
- `packages/assets/src/types.ts`
- `packages/assets/scripts/check.mjs`
- `packages/assets/test/index.test.js`
- `packages/itm/src/internal.js`
- `packages/itm/src/internal.ts`
- `packages/lua/src/runtime.js`
- `packages/lua/src/workspace-modules.js`
- `packages/lua/test/index.test.js`
- package manifests for dependent packages.

Deep import scan:

- Command: `rg "@textforge/workspace/" apps packages -n`
- Result: no `@textforge/workspace/...` deep imports found.

Compatibility notes:

- Package manifest and export map were not changed.
- New internal modules are package-local and are not exposed through `package.json`.
- Existing root import compatibility is preserved through explicit `index.js` and `index.ts` facades.
- Contribution package ID remains `@textforge/workspace`.
- Command IDs and storage/provider/archive constants remain unchanged.

## Commands Run

- `Get-Content packages\workspace\src\index.js`
- `Get-Content packages\workspace\src\index.ts`
- `Get-Content packages\workspace\package.json`
- `Get-Content roadmap\decisions\ADR-0002-package-root-modularization.md`
- `rg "^export" packages\workspace\src\index.js -n`
- `rg "^export" packages\workspace\src\index.ts -n`
- `rg "@textforge/workspace" apps packages test tests examples roadmap -n`
- `corepack pnpm --filter @textforge/workspace lint`
- `corepack pnpm --filter @textforge/workspace typecheck`
- `corepack pnpm --filter @textforge/workspace test`
- `corepack pnpm --filter @textforge/workspace build`
- `rg "@textforge/workspace/" apps packages -n`
- `rg "@textforge/workspace" apps packages -n`
- Runtime export comparison script against `git show HEAD:packages/workspace/src/index.js`
- Type facade export comparison script against `git show HEAD:packages/workspace/src/index.ts`

## Validation Results

- `corepack pnpm --filter @textforge/workspace lint`: passed.
- `corepack pnpm --filter @textforge/workspace typecheck`: passed.
- `corepack pnpm --filter @textforge/workspace test`: passed, 16 tests passed.
- `corepack pnpm --filter @textforge/workspace build`: passed.
- Runtime export comparison: passed, no missing or added public runtime export names.
- Type facade export comparison: passed, no missing or added public type/value names.
- Deep import grep: passed, no deep imports found.

Observed test output note:

- Dexie emitted the pre-existing schema diff warning during tests. Tests still passed and this refactor did not change package schema version or storage contract.

## Risks And Manual Checks

- Package scripts validate JavaScript syntax and runtime behavior but do not run a TypeScript compiler over `src/index.ts`; the type facade was checked by explicit export-name comparison instead.
- Internal helper exports between new package-local modules are not public package exports because `package.json` still exposes only `"."`.
- No app-level rebuild was run because the requested scope was the `@textforge/workspace` package root refactor.
