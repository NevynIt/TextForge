import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAssetViewerSurface,
  createBlobUrlLedger,
  createWorkspaceAssetBinding,
  markAssetBindingReleased,
  selectAssetViewerKind,
} from '../src/index.js';

test('asset viewer helpers select and bind viewer kinds', () => {
  const request = {
    resource: { resourceId: 'resource-1', path: '/docs/system.svg', kind: 'binary', mimeType: 'image/svg+xml' },
    workspaceResource: {
      kind: 'binary',
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
  assert.equal(createAssetViewerSurface(request, { binding, lease }).model.viewerKind, 'svg');
  assert.equal(markAssetBindingReleased(binding).state, 'released');
});
