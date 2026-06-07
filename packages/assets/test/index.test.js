import 'fake-indexeddb/auto';

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAssetContributionManifest,
  createAssetProvenanceLabel,
  createBinaryAssetViewerSurface,
  createImageAssetViewerSurface,
  createPdfAssetViewerSurface,
  createAssetViewerSurface,
  createSvgAssetViewerSurface,
  createBlobUrlLedger,
  createWorkspaceAssetBinding,
  markAssetBindingReleased,
  selectAssetViewerKind,
} from '../src/index.js';
import {
  createPersistedWorkspaceService,
  createSequentialIdFactory,
  createWorkspaceService,
  exportWorkspaceToZip,
  importWorkspaceFromZip,
  resetWorkspaceDexieStorage,
  workspaceEntryToResourceRef,
} from '@textforge/workspace';

const fixedNow = () => '2026-05-24T00:00:00.000Z';

test('asset viewer helpers select and bind viewer kinds', () => {
  const request = {
    resource: { resourceId: 'resource-1', path: '/docs/system.svg', kind: 'resource', representation: 'bytes', mimeType: 'image/svg+xml' },
    workspaceResource: {
      kind: 'resource',
      representation: 'bytes',
      bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    },
  };

  const binding = createWorkspaceAssetBinding(request);
  const ledger = createBlobUrlLedger({
    createObjectURL: () => 'blob:asset-test',
    revokeObjectURL: () => undefined,
  });
  const lease = ledger.acquire(request.resource, {
    type: 'image/svg+xml',
    data: request.workspaceResource.bytes,
  });

  assert.equal(selectAssetViewerKind(request), 'svg');
  const surface = createAssetViewerSurface(request, { binding, lease });
  assert.equal(surface.model.viewerKind, 'svg');
  assert.equal(surface.model.blobUrl, 'blob:asset-test');
  assert.equal(typeof surface.mount, 'function');
  assert.equal(createImageAssetViewerSurface(request, { binding, lease }).model.viewerKind, 'image');
  assert.equal(createSvgAssetViewerSurface(request, { binding, lease }).model.viewerKind, 'svg');
  assert.equal(createPdfAssetViewerSurface(request, { binding, lease }).model.viewerKind, 'pdf');
  assert.equal(createBinaryAssetViewerSurface(request, { binding, lease }).model.viewerKind, 'binary');
  assert.equal(createAssetContributionManifest().commands.some((command) => command.id === 'asset.download-selected'), true);
  assert.equal(createAssetContributionManifest().commands.some((command) => command.id === 'asset.export-selected-png'), true);
  assert.equal(createAssetProvenanceLabel({
    kind: 'generated',
    pipelineId: '@textforge/diagrams/graphviz-svg',
    sourceResourceId: 'resource-1',
    sourcePath: '/docs/example.md',
    sourceUpdatedAt: fixedNow(),
    generatedAt: fixedNow(),
  }), '@textforge/diagrams/graphviz-svg from /docs/example.md');
  assert.equal(markAssetBindingReleased(binding).state, 'released');
});

test('text-stored SVG resources survive workspace zip round-trip and stay previewable', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'asset-archive-test',
    idFactory: createSequentialIdFactory('entry'),
    now: () => '2026-05-23T00:00:00.000Z',
  });
  workspace.createFolder({ path: '/docs' });
  const svgText = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
  const svg = workspace.createTextResource({
    path: '/docs/system.svg',
    text: svgText,
    languageId: 'svg',
    mimeType: 'image/svg+xml',
    title: 'system.svg',
  });

  const imported = importWorkspaceFromZip(exportWorkspaceToZip(workspace));
  const restoredWorkspace = createWorkspaceService({
    state: imported.state,
    idFactory: createSequentialIdFactory('restored'),
    now: () => '2026-05-23T00:00:00.000Z',
  });
  const restoredSvg = restoredWorkspace.getEntryByPath('/docs/system.svg');

  assert.equal(restoredSvg?.kind, 'resource');
  assert.equal(restoredSvg?.representation, 'text');
  assert.equal(restoredSvg?.text, svgText);
  assert.equal(selectAssetViewerKind({
    resource: workspaceEntryToResourceRef(restoredSvg),
    workspaceResource: restoredSvg,
  }), 'svg');
  assert.equal(createWorkspaceAssetBinding({
    resource: workspaceEntryToResourceRef(restoredSvg),
    workspaceResource: restoredSvg,
    title: svg.metadata.title,
  }).viewerKind, 'svg');
});

test('text-stored SVG resources rehydrate correctly through persisted Dexie workspace storage', async () => {
  const databaseName = `asset-persisted-${Math.random().toString(16).slice(2)}`;
  await resetWorkspaceDexieStorage({ databaseName });

  const seededWorkspace = createWorkspaceService({
    workspaceId: 'asset-persisted-test',
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
  });
  seededWorkspace.createFolder({ path: '/docs' });
  const svgText = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20"/></svg>';
  seededWorkspace.createTextResource({
    path: '/docs/system.svg',
    text: svgText,
    languageId: 'svg',
    mimeType: 'image/svg+xml',
    title: 'system.svg',
  });

  const firstPass = await createPersistedWorkspaceService({
    storageOptions: { databaseName },
    seed: seededWorkspace.snapshot(),
    now: fixedNow,
  });
  await firstPass.workspace.whenIdle();
  firstPass.workspace.disposePersistence();

  const restored = await createPersistedWorkspaceService({
    storageOptions: { databaseName },
    now: fixedNow,
  });
  const restoredSvg = restored.workspace.getEntryByPath('/docs/system.svg');

  assert.equal(restoredSvg?.kind, 'resource');
  assert.equal(restoredSvg?.representation, 'text');
  assert.equal(restoredSvg?.text, svgText);
  assert.equal(selectAssetViewerKind({
    resource: workspaceEntryToResourceRef(restoredSvg),
    workspaceResource: restoredSvg,
  }), 'svg');
  assert.equal(createWorkspaceAssetBinding({
    resource: workspaceEntryToResourceRef(restoredSvg),
    workspaceResource: restoredSvg,
    title: restoredSvg.metadata.title,
  }).viewerKind, 'svg');

  restored.workspace.disposePersistence();
  await resetWorkspaceDexieStorage({ databaseName });
});
