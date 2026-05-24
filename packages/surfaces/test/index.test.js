import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSurfaceCommandContributions,
  createSurfaceContributionManifest,
  createMainSessionTabStrip,
  createMainSurfaceHost,
  createOpenWithSelection,
  createSequentialSessionIdFactory,
  createSourceEditorFallback,
  createSurfaceRegistry,
  listOpenSurfaceSessions,
} from '../src/index.js';

test('surface registry picks the highest-priority compatible contribution', () => {
  const registry = createSurfaceRegistry([
    {
      id: 'surface.editor',
      label: 'Editor',
      resourceKinds: ['text'],
      placements: ['main'],
      openWithPriority: 20,
    },
    {
      id: 'surface.svg',
      label: 'SVG viewer',
      resourceKinds: ['binary'],
      mimeTypes: ['image/svg+xml'],
      placements: ['main'],
      openWithPriority: 50,
    },
    {
      id: 'surface.preview',
      label: 'Binary preview',
      resourceKinds: ['binary'],
      placements: ['main'],
      openWithPriority: 40,
    },
  ]);

  const host = createMainSurfaceHost({
    hostId: 'main',
    registry,
    idFactory: createSequentialSessionIdFactory('session'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  const session = host.open({
    resource: { resourceId: 'resource-1', kind: 'binary', path: '/docs/system.svg' },
  });

  assert.equal(session.contributionId, 'surface.preview');
  assert.equal(session.freshness, 'current');

  const svgSession = host.open({
    resource: { resourceId: 'resource-2', kind: 'binary', path: '/docs/system.svg', mimeType: 'image/svg+xml' },
  });
  assert.equal(svgSession.contributionId, 'surface.svg');

  const selection = createOpenWithSelection(registry, {
    resource: { resourceId: 'resource-3', kind: 'text', path: '/docs/notes.md' },
  });
  assert.equal(selection.selectedSurfaceId, 'surface.editor');

  const svgSelection = createOpenWithSelection(registry, {
    resource: { resourceId: 'resource-4', kind: 'binary', path: '/docs/system.svg', mimeType: 'image/svg+xml' },
  });
  assert.deepEqual(svgSelection.candidates.map((candidate) => candidate.surfaceId), ['surface.svg', 'surface.preview']);

  const stale = host.markStale(session.id);
  assert.equal(stale?.freshness, 'stale');
  assert.equal(host.markCurrent(session.id)?.freshness, 'current');
  assert.equal(listOpenSurfaceSessions(host.list(), 'main').length, 2);
  assert.equal(createMainSessionTabStrip(host.list(), { activeTabId: svgSession.id }).activeTabId, svgSession.id);

  const fallback = createSourceEditorFallback(session.resource, 'surface.editor', 'explicit-source-open');
  assert.equal(fallback.reason, 'explicit-source-open');
});

test('surface command contributions include shell actions and open-with descriptors', () => {
  const commands = createSurfaceCommandContributions([
    {
      id: 'surface.editor',
      label: 'Editor',
      resourceKinds: ['text'],
      placements: ['main'],
    },
    {
      id: 'surface.svg',
      label: 'SVG viewer',
      resourceKinds: ['binary'],
      mimeTypes: ['image/svg+xml'],
      placements: ['popup'],
    },
  ]);

  assert.equal(commands.some((command) => command.id === 'surface.close-active'), true);
  assert.equal(commands.some((command) => command.id === 'surface.move-active-to-popup'), true);
  assert.equal(commands.some((command) => command.id === 'surface.open-with:surface.editor'), true);
  assert.equal(commands.find((command) => command.id === 'surface.open-with:surface.svg')?.when?.availableSurfaceIds?.[0], 'surface.svg');
  assert.equal(createSurfaceContributionManifest().packageId, '@textforge/surfaces');
});
