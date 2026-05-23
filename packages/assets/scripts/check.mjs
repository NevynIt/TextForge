import assert from 'node:assert/strict';

import {
  assetSurfaceContributions,
  createAssetViewerSurface,
  createAssetViewerSurfaceModel,
  createBlobUrlLedger,
  createWorkspaceAssetBinding,
  markAssetBindingReady,
  selectAssetViewerKind,
} from '../src/index.js';

const request = {
  resource: { resourceId: 'resource-1', path: '/docs/system.svg', kind: 'binary', mimeType: 'image/svg+xml' },
  workspaceResource: {
    kind: 'binary',
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
assert.equal(typeof surface.mount, 'function');
assert.equal(createAssetViewerSurfaceModel(request, readyBinding, lease).mimeType, 'image/svg+xml');

console.info('assets package checks passed');
