import assert from 'node:assert/strict';

import {
  eaViewerSurfaceContribution,
  normalizeEaDashboardFixture,
} from '../src/index.js';

assert.equal(eaViewerSurfaceContribution.id, '@textforge/ea-viewer/dashboard');
assert.equal(typeof normalizeEaDashboardFixture, 'function');

console.info('ea-viewer package checks passed');
