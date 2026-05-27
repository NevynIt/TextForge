import 'fake-indexeddb/auto';

import assert from 'node:assert/strict';
import test from 'node:test';
import Dexie from 'dexie';

import {
  createWorkspaceContributionManifest,
  createWorkspaceArchiveManifest,
  createPersistedWorkspaceService,
  createSequentialIdFactory,
  createWorkspaceManifest,
  listWorkspaceBadgeDiagnostics,
  createWorkspaceService,
  createWorkspaceTreeItems,
  exportWorkspaceToZip,
  exportWorkspaceFolderToZip,
  importWorkspaceFolderFromZip,
  importWorkspaceFromZip,
  mergeImportedWorkspaceState,
  normalizeWorkspacePath,
  openWorkspaceDexieStorage,
  resetWorkspaceDexieStorage,
  workspaceEntryToResourceRef,
  workspaceDexieSchema,
  workspaceDexieSchemaVersion,
  workspaceProviderIds,
} from '../src/index.js';

const textEncoder = new TextEncoder();
const fixedNow = () => '2026-05-24T00:00:00.000Z';

function createDatabaseName(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

function createSeedWorkspaceState() {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-persisted-test',
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
  });

  workspace.createFolder({ path: '/docs' });
  workspace.createTextResource({
    path: '/docs/notes.md',
    text: '# Stored notes\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  workspace.createTextResource({
    path: '/docs/system.svg',
    text: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16"/></svg>',
    languageId: 'svg',
    mimeType: 'image/svg+xml',
  });
  workspace.createBinaryResource({
    path: '/docs/report.pdf',
    bytes: textEncoder.encode('%PDF-1.7'),
    mimeType: 'application/pdf',
  });

  return workspace.snapshot();
}

test('workspace service normalizes paths and mutates entries', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-test',
    idFactory: createSequentialIdFactory('entry'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  const docs = workspace.createFolder({ path: '/docs' });
  const notes = workspace.createTextResource({ path: '/docs/notes.md', text: '# Notes', languageId: 'markdown' });
  const updated = workspace.saveTextResource({
    resourceId: notes.id,
    text: '# Updated notes',
    languageId: 'yaml',
    mimeType: 'text/yaml',
  });

  assert.equal(normalizeWorkspacePath('docs/../docs/notes.md'), '/docs/notes.md');
  assert.equal(docs.path, '/docs');
  assert.equal(updated.text, '# Updated notes');
  assert.equal(updated.languageId, 'yaml');
  assert.equal(updated.mimeType, 'text/yaml');
  assert.equal(createWorkspaceTreeItems(workspace.snapshot()).length >= 2, true);
});

test('workspace badges stay deterministic and duplicate stored badges are repaired', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-badge-test',
    idFactory: createSequentialIdFactory('badge'),
    now: () => '2026-05-24T00:00:00.000Z',
  });

  workspace.createFolder({ path: '/docs' });
  workspace.createTextResource({
    path: '/docs/notes.md',
    text: '# Notes',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  workspace.createTextResource({
    path: '/docs/intro.md',
    text: '# Intro',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });

  const initialState = workspace.snapshot();
  const notes = initialState.resources.find((resource) => resource.path === '/docs/notes.md');
  const intro = initialState.resources.find((resource) => resource.path === '/docs/intro.md');
  assert.equal(Boolean(notes?.metadata.badge?.key), true);
  assert.equal(Boolean(intro?.metadata.badge?.key), true);
  assert.equal(notes?.metadata.badge?.key.split('-').length, 4);
  assert.equal(['center', 'top', 'right', 'bottom', 'left'].includes(notes?.metadata.badge?.placement ?? ''), true);
  assert.equal(Object.hasOwn(notes?.metadata.badge ?? {}, 'rotation'), false);

  const duplicatedBadgeState = {
    ...initialState,
    resources: initialState.resources.map((resource) =>
      resource.id === intro?.id
        ? {
          ...resource,
          metadata: {
            ...resource.metadata,
            badge: intro?.metadata.badge
              ? {
                ...intro.metadata.badge,
                shape: notes?.metadata.badge?.shape ?? intro.metadata.badge.shape,
                accent: notes?.metadata.badge?.accent ?? intro.metadata.badge.accent,
                mark: notes?.metadata.badge?.mark ?? intro.metadata.badge.mark,
                placement: notes?.metadata.badge?.placement ?? intro.metadata.badge.placement,
              }
              : notes?.metadata.badge,
          },
        }
        : resource),
  };
  const restoredState = createWorkspaceService({
    state: duplicatedBadgeState,
    idFactory: createSequentialIdFactory('restored-badge'),
    now: () => '2026-05-24T00:00:00.000Z',
  }).snapshot();

  const restoredNotes = restoredState.resources.find((resource) => resource.path === '/docs/notes.md');
  const restoredIntro = restoredState.resources.find((resource) => resource.path === '/docs/intro.md');
  assert.notEqual(restoredIntro?.metadata.badge?.key, restoredNotes?.metadata.badge?.key);
  const repairedEntries = [restoredNotes, restoredIntro].filter((resource) => resource?.metadata.badge?.repairedFromKey);
  assert.equal(repairedEntries.length, 1);
  assert.equal(repairedEntries[0]?.metadata.badge?.repairedFromKey, notes?.metadata.badge?.key);

  const diagnostics = listWorkspaceBadgeDiagnostics(restoredState);
  assert.equal(diagnostics.length, 1);
  assert.equal(['/docs/notes.md', '/docs/intro.md'].includes(diagnostics[0]?.path), true);
  assert.equal(['center', 'top', 'right', 'bottom', 'left'].includes(diagnostics[0]?.badge?.placement ?? ''), true);
  assert.equal(createWorkspaceTreeItems(restoredState).every((item) => Boolean(item.badge?.key)), true);
});

test('workspace contribution manifest exposes the Phase 3.3 shell commands', () => {
  const manifest = createWorkspaceContributionManifest();

  assert.equal(manifest.packageId, '@textforge/workspace');
  assert.deepEqual(
    manifest.commands.map((command) => command.id),
    [
      'workspace.new-folder',
      'workspace.new-resource',
      'workspace.upload-file',
      'workspace.import-workspace',
      'workspace.import-folder-zip',
      'workspace.export-workspace',
      'workspace.export-selected-folder',
      'workspace.download-selected-file',
      'workspace.copy-selected-resource',
      'workspace.rename-selected',
      'workspace.delete-selected',
      'workspace.reset-storage',
      'workspace.retry-storage',
    ],
  );
});

test('workspace provider descriptors normalize bundled resources into read-only entries', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-provider-test',
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
    state: {
      manifest: createWorkspaceManifest({
        workspaceId: 'workspace-provider-test',
        name: 'Provider test',
        now: fixedNow,
      }),
      folders: [
        {
          kind: 'folder',
          id: 'folder-bundled',
          path: '/.textforge/resources',
          parentId: 'root',
          metadata: {
            title: 'resources',
            providerId: workspaceProviderIds.bundled,
            createdAt: fixedNow(),
            updatedAt: fixedNow(),
          },
          childIds: [],
        },
        {
          kind: 'folder',
          id: 'folder-bundled-docs',
          path: '/.textforge/resources/docs',
          parentId: 'folder-bundled',
          metadata: {
            title: 'docs',
            providerId: workspaceProviderIds.bundled,
            createdAt: fixedNow(),
            updatedAt: fixedNow(),
          },
          childIds: [],
        },
      ],
      resources: [
        {
          kind: 'resource',
          id: 'resource-bundled',
          path: '/.textforge/resources/docs/guide.md',
          parentId: 'folder-bundled-docs',
          representation: 'text',
          text: '# Guide\n',
          languageId: 'markdown',
          mimeType: 'text/markdown',
          metadata: {
            title: 'guide.md',
            providerId: workspaceProviderIds.bundled,
            provenance: {
              kind: 'bundled',
              bundleId: 'textforge-docs',
              sourcePath: '/docs/guide.md',
              bundledAt: fixedNow(),
            },
            createdAt: fixedNow(),
            updatedAt: fixedNow(),
          },
        },
      ],
    },
  });

  const bundledFolder = workspace.getEntryByPath('/.textforge/resources');
  const bundledResource = workspace.getEntryByPath('/.textforge/resources/docs/guide.md');
  const resourceRef = workspaceEntryToResourceRef(bundledResource);

  assert.equal(bundledFolder?.metadata.providerId, workspaceProviderIds.bundled);
  assert.equal(bundledFolder?.metadata.capabilityIds.includes('resource.create-child'), false);
  assert.equal(bundledResource?.metadata.providerId, workspaceProviderIds.bundled);
  assert.equal(bundledResource?.metadata.capabilityIds.includes('resource.copy'), true);
  assert.equal(bundledResource?.metadata.capabilityIds.includes('resource.write'), false);
  assert.equal(resourceRef.providerId, workspaceProviderIds.bundled);
  assert.equal(resourceRef.provenance?.kind, 'bundled');
  assert.equal(workspace.query({ providerId: workspaceProviderIds.bundled }).length, 3);
});

test('workspace provider descriptors block writes into bundled read-only providers', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-provider-guard-test',
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
    state: {
      manifest: createWorkspaceManifest({
        workspaceId: 'workspace-provider-guard-test',
        name: 'Provider guard test',
        now: fixedNow,
      }),
      folders: [
        {
          kind: 'folder',
          id: 'folder-bundled',
          path: '/.textforge/resources',
          parentId: 'root',
          metadata: {
            title: 'resources',
            providerId: workspaceProviderIds.bundled,
            createdAt: fixedNow(),
            updatedAt: fixedNow(),
          },
          childIds: [],
        },
        {
          kind: 'folder',
          id: 'folder-bundled-docs',
          path: '/.textforge/resources/docs',
          parentId: 'folder-bundled',
          metadata: {
            title: 'docs',
            providerId: workspaceProviderIds.bundled,
            createdAt: fixedNow(),
            updatedAt: fixedNow(),
          },
          childIds: [],
        },
      ],
      resources: [
        {
          kind: 'resource',
          id: 'resource-bundled',
          path: '/.textforge/resources/docs/guide.md',
          parentId: 'folder-bundled-docs',
          representation: 'text',
          text: '# Guide\n',
          languageId: 'markdown',
          mimeType: 'text/markdown',
          metadata: {
            title: 'guide.md',
            providerId: workspaceProviderIds.bundled,
            createdAt: fixedNow(),
            updatedAt: fixedNow(),
          },
        },
      ],
    },
  });

  assert.throws(
    () => workspace.createTextResource({
      path: '/.textforge/resources/docs/new.md',
      text: '# New\n',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    }),
    /does not allow creating child entries/i,
  );
  assert.throws(
    () => workspace.saveTextResource({
      resourceId: 'resource-bundled',
      text: '# Updated\n',
    }),
    /does not allow saving resource content/i,
  );
  assert.throws(
    () => workspace.renameEntry('resource-bundled', '/.textforge/resources/docs/renamed.md'),
    /does not allow renaming/i,
  );
  assert.throws(
    () => workspace.deleteEntry('resource-bundled'),
    /does not allow deleting/i,
  );
});

test('workspace archives round-trip full workspace state through zip', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-archive-test',
    idFactory: createSequentialIdFactory('entry'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  workspace.createFolder({ path: '/docs' });
  const notes = workspace.createTextResource({
    path: '/docs/notes.md',
    text: '# Notes\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  const svgText = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  workspace.createTextResource({
    path: '/docs/system.svg',
    text: svgText,
    languageId: 'svg',
    mimeType: 'image/svg+xml',
  });
  const pdfBytes = textEncoder.encode('%PDF-1.7');
  workspace.createBinaryResource({
    path: '/docs/report.pdf',
    bytes: pdfBytes,
    mimeType: 'application/pdf',
  });

  const manifest = createWorkspaceArchiveManifest(workspace, { exportedAt: '2026-05-23T00:00:00.000Z' });
  const archive = exportWorkspaceToZip(workspace, { exportedAt: '2026-05-23T00:00:00.000Z' });
  const imported = importWorkspaceFromZip(archive);
  const restoredWorkspace = createWorkspaceService({
    state: imported.state,
    idFactory: createSequentialIdFactory('restored'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  assert.equal(manifest.format, 'textforge-workspace-archive');
  assert.equal(manifest.resources.find((resource) => resource.id === notes.id)?.encoding, 'utf8');
  assert.equal(imported.state.manifest.workspaceId, 'workspace-archive-test');
  assert.equal(restoredWorkspace.getEntryByPath('/docs/notes.md')?.kind, 'resource');
  assert.equal(restoredWorkspace.getEntryByPath('/docs/notes.md')?.representation, 'text');
  assert.equal(restoredWorkspace.getEntryByPath('/docs/notes.md')?.text, '# Notes\n');
  assert.equal(restoredWorkspace.getEntryByPath('/docs/notes.md')?.metadata.badge?.key, notes.metadata.badge?.key);
  assert.equal(restoredWorkspace.getEntryByPath('/docs/system.svg')?.representation, 'text');
  assert.equal(restoredWorkspace.getEntryByPath('/docs/system.svg')?.text, svgText);
  assert.equal(restoredWorkspace.getEntryByPath('/docs/report.pdf')?.representation, 'bytes');
  assert.deepEqual(restoredWorkspace.getEntryByPath('/docs/report.pdf')?.bytes, pdfBytes);
});

test('selected folder export rebases a nested folder subtree at archive root', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-folder-export-test',
    idFactory: createSequentialIdFactory('entry'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  workspace.createFolder({ path: '/docs' });
  const guides = workspace.createFolder({ path: '/docs/guides' });
  workspace.createTextResource({
    path: '/docs/guides/intro.md',
    text: '# Intro\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });

  const archive = exportWorkspaceFolderToZip(workspace, guides.path, { exportedAt: '2026-05-23T00:00:00.000Z' });
  const imported = importWorkspaceFolderFromZip(archive);

  assert.deepEqual(imported.folders, []);
  assert.deepEqual(imported.files.map((entry) => entry.path), ['intro.md']);
  assert.equal(new TextDecoder().decode(imported.files[0]?.bytes), '# Intro\n');
});

test('workspace import conflict policies are explicit when merging imported archives', () => {
  const existingWorkspace = createWorkspaceService({
    workspaceId: 'workspace-conflict-target',
    idFactory: createSequentialIdFactory('target'),
    now: () => '2026-05-23T00:00:00.000Z',
  });
  existingWorkspace.createFolder({ path: '/guides' });
  existingWorkspace.createTextResource({
    path: '/guides/old.md',
    text: '# Old\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });

  const importWorkspace = createWorkspaceService({
    workspaceId: 'workspace-conflict-source',
    idFactory: createSequentialIdFactory('source'),
    now: () => '2026-05-23T00:00:00.000Z',
  });
  const guides = importWorkspace.createFolder({ path: '/guides' });
  importWorkspace.createTextResource({
    path: '/guides/new.md',
    text: '# New\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });

  const archive = exportWorkspaceToZip(importWorkspace, { exportedAt: '2026-05-23T00:00:00.000Z' });
  const imported = importWorkspaceFromZip(archive);

  assert.throws(
    () => mergeImportedWorkspaceState(existingWorkspace.snapshot(), imported.state, { conflictPolicy: 'error' }),
    /Workspace import conflict at \/guides/,
  );

  const skippedState = mergeImportedWorkspaceState(existingWorkspace.snapshot(), imported.state, { conflictPolicy: 'skip' });
  const replacedState = mergeImportedWorkspaceState(existingWorkspace.snapshot(), imported.state, { conflictPolicy: 'replace' });

  assert.equal(skippedState.resources.some((resource) => resource.path === '/guides/new.md'), false);
  assert.equal(replacedState.resources.some((resource) => resource.path === '/guides/new.md'), true);
  assert.equal(replacedState.resources.some((resource) => resource.path === '/guides/old.md'), false);
  assert.equal(importWorkspaceFromZip(archive, {
    existingState: existingWorkspace.snapshot(),
    conflictPolicy: 'replace',
  }).state.resources.some((resource) => resource.path === '/guides/new.md'), true);
});

test('persisted workspace service hydrates through Dexie and preserves IDs, selection, and resource content', async () => {
  const databaseName = createDatabaseName('workspace-dexie-hydrate');
  await resetWorkspaceDexieStorage({ databaseName });

  const firstPass = await createPersistedWorkspaceService({
    storageOptions: { databaseName },
    seed: createSeedWorkspaceState(),
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
  });

  assert.equal(firstPass.hydrationSource, 'seed');
  const selectedResource = firstPass.workspace.getEntryByPath('/docs/notes.md');
  firstPass.workspace.setSelectedResourceId(selectedResource?.id);
  const createdText = firstPass.workspace.createTextResource({
    path: '/docs/followup.md',
    text: 'persist me',
    languageId: 'text',
    mimeType: 'text/plain',
  });
  const createdSvg = firstPass.workspace.createTextResource({
    path: '/docs/diagram.svg',
    text: '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6"/></svg>',
    languageId: 'svg',
    mimeType: 'image/svg+xml',
  });
  const createdPdf = firstPass.workspace.createBinaryResource({
    path: '/docs/reference.pdf',
    bytes: textEncoder.encode('%PDF-1.7 reference'),
    mimeType: 'application/pdf',
  });
  await firstPass.workspace.whenIdle();
  firstPass.workspace.disposePersistence();

  const restored = await createPersistedWorkspaceService({
    storageOptions: { databaseName },
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
  });

  assert.equal(restored.hydrationSource, 'storage');
  assert.equal(restored.workspace.getManifest().selectedResourceId, selectedResource?.id);
  assert.equal(restored.workspace.getEntryByPath('/docs/followup.md')?.text, 'persist me');
  assert.equal(
    restored.workspace.getEntryByPath('/docs/followup.md')?.metadata.badge?.key,
    createdText.metadata.badge?.key,
  );
  assert.equal(restored.workspace.getEntryByPath('/docs/diagram.svg')?.representation, 'text');
  assert.equal(restored.workspace.getEntryByPath('/docs/diagram.svg')?.text, createdSvg.text);
  assert.equal(restored.workspace.getEntryByPath('/docs/reference.pdf')?.representation, 'bytes');
  assert.deepEqual(restored.workspace.getEntryByPath('/docs/reference.pdf')?.bytes, createdPdf.bytes);

  const postHydration = restored.workspace.createTextResource({
    path: '/docs/post-hydration.md',
    text: 'new file',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });

  assert.notEqual(postHydration.id, createdText.id);
  assert.notEqual(postHydration.id, createdSvg.id);
  assert.notEqual(postHydration.id, createdPdf.id);
  await restored.workspace.whenIdle();
  restored.workspace.disposePersistence();
  await resetWorkspaceDexieStorage({ databaseName });
});

test('workspace Dexie storage detects corrupted records and explicit reset recovers cleanly', async () => {
  const databaseName = createDatabaseName('workspace-dexie-corrupt');
  await resetWorkspaceDexieStorage({ databaseName });

  const database = new Dexie(databaseName);
  database.version(workspaceDexieSchemaVersion).stores(workspaceDexieSchema);
  await database.open();
  await database.table('manifests').put(createWorkspaceManifest({
    workspaceId: 'broken-workspace',
    name: 'Broken workspace',
    now: fixedNow,
  }));
  database.close();

  const storage = await openWorkspaceDexieStorage({ databaseName });
  await assert.rejects(
    () => storage.loadState(),
    /missing the schema version record/i,
  );
  storage.close();

  await resetWorkspaceDexieStorage({ databaseName });

  const recovered = await createPersistedWorkspaceService({
    storageOptions: { databaseName },
    seed: createSeedWorkspaceState(),
    now: fixedNow,
  });

  assert.equal(recovered.hydrationSource, 'seed');
  assert.equal(recovered.workspace.getEntryByPath('/docs/notes.md')?.kind, 'resource');
  assert.equal(recovered.workspace.getEntryByPath('/docs/notes.md')?.representation, 'text');
  recovered.workspace.disposePersistence();
  await resetWorkspaceDexieStorage({ databaseName });
});

test('workspace Dexie storage migrates legacy textResources and binaryResources into unified resources', async () => {
  const databaseName = createDatabaseName('workspace-dexie-migrate');
  await resetWorkspaceDexieStorage({ databaseName });

  const legacyDatabase = new Dexie(databaseName);
  legacyDatabase.version(1).stores({
    system: 'key',
    folders: 'id, path, parentId, metadata.createdAt, metadata.updatedAt',
    textResources: 'id, path, parentId, languageId, mimeType, metadata.createdAt, metadata.updatedAt',
    binaryResources: 'id, path, parentId, mimeType, metadata.createdAt, metadata.updatedAt',
    manifests: 'workspaceId, name, rootPath, createdAt, updatedAt, selectedResourceId',
  });
  await legacyDatabase.open();
  await legacyDatabase.table('system').bulkPut([
    { key: 'workspace-schema-version', value: 1 },
    { key: 'workspace-last-saved-at', value: fixedNow() },
  ]);
  await legacyDatabase.table('manifests').put(createWorkspaceManifest({
    workspaceId: 'legacy-workspace',
    name: 'Legacy workspace',
    now: fixedNow,
  }));
  await legacyDatabase.table('folders').put({
    kind: 'folder',
    id: 'folder-1',
    path: '/docs',
    parentId: 'root',
    metadata: {
      title: 'docs',
      createdAt: fixedNow(),
      updatedAt: fixedNow(),
    },
    childIds: [],
  });
  await legacyDatabase.table('textResources').put({
    kind: 'text',
    id: 'text-1',
    path: '/docs/notes.md',
    parentId: 'folder-1',
    metadata: {
      title: 'notes.md',
      createdAt: fixedNow(),
      updatedAt: fixedNow(),
    },
    text: '# Legacy notes\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  await legacyDatabase.table('binaryResources').put({
    kind: 'binary',
    id: 'binary-1',
    path: '/docs/report.pdf',
    parentId: 'folder-1',
    metadata: {
      title: 'report.pdf',
      createdAt: fixedNow(),
      updatedAt: fixedNow(),
    },
    bytes: textEncoder.encode('%PDF-legacy'),
    mimeType: 'application/pdf',
  });
  legacyDatabase.close();

  const storage = await openWorkspaceDexieStorage({ databaseName });
  const state = await storage.loadState();
  storage.close();

  assert.equal(state?.resources.find((resource) => resource.path === '/docs/notes.md')?.representation, 'text');
  assert.equal(state?.resources.find((resource) => resource.path === '/docs/report.pdf')?.representation, 'bytes');
  await resetWorkspaceDexieStorage({ databaseName });
});

test('workspace resources preserve generated provenance metadata through create and save flows', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-generated-metadata',
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
  });
  workspace.createFolder({ path: '/generated' });
  const created = workspace.createTextResource({
    path: '/generated/diagram.svg',
    text: '<svg />',
    languageId: 'svg',
    mimeType: 'image/svg+xml',
    metadata: {
      provenance: {
        kind: 'generated',
        pipelineId: '@textforge/diagrams/mermaid-svg',
        sourceResourceId: 'resource-1',
        sourcePath: '/docs/source.md',
        sourceUpdatedAt: fixedNow(),
        generatedAt: fixedNow(),
        blockId: 'block-1',
        blockKind: 'mermaid',
        format: 'svg',
      },
    },
  });

  const saved = workspace.saveTextResource({
    resourceId: created.id,
    text: '<svg><rect /></svg>',
    metadata: {
      provenance: {
        ...created.metadata.provenance,
        generatedAt: '2026-05-24T01:00:00.000Z',
      },
    },
  });

  assert.equal(saved.metadata.provenance?.pipelineId, '@textforge/diagrams/mermaid-svg');
  assert.equal(saved.metadata.provenance?.generatedAt, '2026-05-24T01:00:00.000Z');
});
