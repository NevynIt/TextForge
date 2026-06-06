import assert from 'node:assert/strict';
import test from 'node:test';

import {
  readWorkbenchBootstrapOptions,
  readWorkbenchTestProfile,
  sampleResourcePaths,
} from '../src/workbench/bootstrap-options.js';

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
