import assert from 'node:assert/strict';

import {
  assetSurfaceContributions,
  createBinaryAssetViewerSurface,
  createImageAssetViewerSurface,
  createAssetProvenanceLabel,
  createAssetViewerSurface,
  createAssetViewerSurfaceModel,
  createBlobUrlLedger,
  createPdfAssetViewerSurface,
  createSvgAssetViewerSurface,
  createWorkspaceAssetBinding,
  markAssetBindingReady,
  selectAssetViewerKind,
} from '../src/index.js';
import {
  createSequentialIdFactory,
  createWorkspaceService,
  exportWorkspaceToZip,
  importWorkspaceFromZip,
  workspaceEntryToResourceRef,
} from '@textforge/workspace';

const request = {
  resource: { resourceId: 'resource-1', path: '/docs/system.svg', kind: 'resource', representation: 'bytes', mimeType: 'image/svg+xml' },
  workspaceResource: {
    kind: 'resource',
    representation: 'bytes',
    bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
  },
  provenance: 'generated',
};

assert.equal(assetSurfaceContributions[1].viewerKind, 'svg');
assert.equal(selectAssetViewerKind(request), 'svg');

const binding = createWorkspaceAssetBinding(request);
const ledger = createBlobUrlLedger({
  createObjectURL: () => 'blob:asset-check',
  revokeObjectURL: () => undefined,
});
const lease = ledger.acquire(request.resource, {
  type: 'image/svg+xml',
  data: request.workspaceResource.bytes,
});
const readyBinding = markAssetBindingReady(binding, lease.url);
const surface = createAssetViewerSurface(request, { binding: readyBinding, lease });

assert.equal(surface.model.viewerKind, 'svg');
assert.equal(surface.model.blobUrl, 'blob:asset-check');
assert.equal(surface.model.provenanceLabel, 'generated');
assert.equal(typeof surface.mount, 'function');
assert.equal(createAssetViewerSurfaceModel(request, readyBinding, lease).mimeType, 'image/svg+xml');
assert.equal(createImageAssetViewerSurface(request, { binding: readyBinding, lease }).model.viewerKind, 'image');
assert.equal(createSvgAssetViewerSurface(request, { binding: readyBinding, lease }).model.viewerKind, 'svg');
assert.equal(createPdfAssetViewerSurface(request, { binding: readyBinding, lease }).model.viewerKind, 'pdf');
assert.equal(createBinaryAssetViewerSurface(request, { binding: readyBinding, lease }).model.viewerKind, 'binary');

const workspace = createWorkspaceService({
  workspaceId: 'asset-archive-check',
  idFactory: createSequentialIdFactory('entry'),
  now: () => '2026-05-23T00:00:00.000Z',
});
workspace.createFolder({ path: '/docs' });
workspace.createTextResource({
  path: '/docs/system.svg',
  text: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
  languageId: 'svg',
  mimeType: 'image/svg+xml',
  title: 'system.svg',
});
const importedArchive = importWorkspaceFromZip(exportWorkspaceToZip(workspace));
const restoredWorkspace = createWorkspaceService({
  state: importedArchive.state,
  idFactory: createSequentialIdFactory('restored'),
  now: () => '2026-05-23T00:00:00.000Z',
});
const restoredSvg = restoredWorkspace.getEntryByPath('/docs/system.svg');

assert.equal(restoredSvg?.kind, 'resource');
assert.equal(restoredSvg?.representation, 'text');
assert.equal(selectAssetViewerKind({
  resource: workspaceEntryToResourceRef(restoredSvg),
  workspaceResource: restoredSvg,
}), 'svg');
assert.equal(createWorkspaceAssetBinding({
  resource: workspaceEntryToResourceRef(restoredSvg),
  workspaceResource: restoredSvg,
  title: restoredSvg?.metadata.title,
}).viewerKind, 'svg');
assert.equal(createAssetProvenanceLabel({
  kind: 'generated',
  pipelineId: '@textforge/diagrams/mermaid-svg',
  sourceResourceId: 'resource-1',
  sourcePath: '/docs/source.md',
  sourceUpdatedAt: '2026-05-23T00:00:00.000Z',
  generatedAt: '2026-05-23T00:00:00.000Z',
}), '@textforge/diagrams/mermaid-svg from /docs/source.md');

console.info('assets package checks passed');
