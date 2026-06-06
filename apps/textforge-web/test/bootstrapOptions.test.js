import assert from 'node:assert/strict';
import test from 'node:test';

import {
  readWorkbenchBootstrapOptions,
  readWorkbenchTestProfile,
  sampleResourcePaths,
} from '../src/workbench/bootstrap-options.js';
import {
  createRestoredSurfaceOpenOptions,
  migrateStoredWorkbenchUiState,
} from '../src/workbench/session-restore.js';
import { createBundledOverlayId } from '../src/workbench/workspace-seed.js';

function withWindowHref(href, callback) {
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: new URL(href),
    },
  });

  try {
    return callback();
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      });
    }
  }
}

test('plain startup has no implicit screenshot or test profile', () => {
  assert.deepEqual(Object.keys(sampleResourcePaths), ['bundledReadme']);
  assert.equal(readWorkbenchTestProfile(), undefined);
});

test('stale screenshot query parameters do not select a startup fixture', () => {
  withWindowHref('http://127.0.0.1:4173/?phase35=main', () => {
    assert.equal(readWorkbenchTestProfile(), undefined);
    assert.deepEqual(readWorkbenchBootstrapOptions(), {
      commandIds: [],
      luaConsoleCommand: undefined,
    });
  });
});

test('current test profiles still select explicit fixtures', () => {
  withWindowHref('http://127.0.0.1:4173/?testProfile=markdown-minimal', () => {
    assert.deepEqual(readWorkbenchTestProfile(), {
      openResourcePath: '/.textforge/resources/docs/examples/markdown-minimal.md',
      preferredSurfaceId: '@textforge/markdown/preview',
      openPlacement: 'main',
    });
  });
});

test('legacy default session migration clears stale title and surface state', () => {
  const legacyDescriptor = {
    resourceId: createBundledOverlayId('/.textforge/resources/docs/examples/phase-4-markdown-preview.tf.md'),
    resourcePath: '/.textforge/resources/docs/examples/phase-4-markdown-preview.tf.md',
    contributionId: '@textforge/markdown/preview',
    placement: 'main',
    sessionKey: 'legacy-preview',
    surfaceState: { scrollTop: 120 },
    title: 'phase-4-markdown-preview.tf.md',
  };
  const migrated = migrateStoredWorkbenchUiState({
    sessions: {
      main: [legacyDescriptor],
      popup: [],
    },
    active: {
      main: legacyDescriptor,
    },
  });
  const migratedMain = migrated.sessions.main[0];

  assert.equal(migratedMain.resourcePath, sampleResourcePaths.bundledReadme);
  assert.equal(migratedMain.resourceId, createBundledOverlayId(sampleResourcePaths.bundledReadme));
  assert.equal(migratedMain.title, undefined);
  assert.equal(migratedMain.contributionId, undefined);
  assert.equal(migratedMain.sessionKey, undefined);
  assert.equal(migratedMain.surfaceState, undefined);
  assert.equal(migrated.active.main.title, undefined);
});

test('restored sessions derive titles from live resources instead of stored descriptors', () => {
  assert.deepEqual(createRestoredSurfaceOpenOptions({
    placement: 'main',
    contributionId: '@textforge/markdown/preview',
    sessionKey: 'resource-preview',
    surfaceState: { mode: 'preview' },
    title: 'stale-title.md',
  }), {
    placement: 'main',
    preferredSurfaceId: '@textforge/markdown/preview',
    sessionKey: 'resource-preview',
    surfaceState: { mode: 'preview' },
    expandSelection: false,
  });
});
