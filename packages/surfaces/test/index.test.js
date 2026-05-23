import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMainSurfaceHost,
  createSequentialSessionIdFactory,
  createSurfaceRegistry,
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
      id: 'surface.preview',
      label: 'Preview',
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
});
