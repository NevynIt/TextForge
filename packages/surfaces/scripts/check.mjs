import assert from 'node:assert/strict';

import {
  contributions,
  createMainSurfaceHost,
  createOpenWithSelection,
  createOpenWithSurfaceCommand,
  createPopupSurfaceHost,
  createSequentialSessionIdFactory,
  createSourceEditorFallback,
  createSurfaceRegistry,
  createSurfaceSessionTab,
} from '../src/index.js';

const registry = createSurfaceRegistry([
  {
    id: 'surface.editor',
    label: 'Editor',
    kind: 'text-editor',
    resourceKinds: ['text'],
    placements: ['main', 'popup'],
    openWithPriority: 100,
  },
  {
    id: 'surface.asset',
    label: 'Asset',
    kind: 'asset-viewer',
    resourceKinds: ['binary'],
    placements: ['main', 'popup'],
    openWithPriority: 80,
  },
]);

const mainHost = createMainSurfaceHost({
  hostId: 'main',
  registry,
  idFactory: createSequentialSessionIdFactory('main'),
  now: () => '2026-05-23T00:00:00.000Z',
});
const popupHost = createPopupSurfaceHost({
  hostId: 'popup',
  registry,
  idFactory: createSequentialSessionIdFactory('popup'),
  now: () => '2026-05-23T00:00:00.000Z',
});

assert.equal(contributions.id, '@textforge/surfaces');
assert.equal(createOpenWithSurfaceCommand('surface.editor', 'Editor').id, 'open-with:surface.editor');

const textSession = mainHost.open({
  resource: { resourceId: 'resource-1', kind: 'text', path: '/docs/note.md' },
  title: 'notes.md',
});
const assetSession = popupHost.open({
  resource: { resourceId: 'resource-2', kind: 'binary', path: '/docs/system.svg' },
  placement: 'popup',
});

assert.equal(textSession.contributionId, 'surface.editor');
assert.equal(textSession.freshness, 'current');
assert.equal(mainHost.markStale(textSession.id)?.state, 'stale');
assert.equal(mainHost.markCurrent(textSession.id)?.freshness, 'current');
assert.equal(assetSession.placement, 'popup');
assert.equal(createSurfaceSessionTab(textSession).resourceId, 'resource-1');
assert.equal(createOpenWithSelection(registry, {
  resource: { resourceId: 'resource-3', kind: 'binary', path: '/docs/system.svg' },
}).selectedSurfaceId, 'surface.asset');
assert.equal(
  createSourceEditorFallback(textSession.resource, 'surface.editor', 'explicit-source-open').sourceSurfaceId,
  'surface.editor',
);

console.info('surfaces package checks passed');
