import assert from 'node:assert/strict';

import {
  contributions,
  createWorkspaceItmIncludeProvider,
  listStdAssets,
} from '../src/index.js';

assert.equal(contributions.packageId, '@textforge/itm');
assert.equal(contributions.markdownFenceHandlers.length >= 2, true);
assert.equal(typeof createWorkspaceItmIncludeProvider({ getEntryByPath() {} }).load, 'function');
assert.equal(listStdAssets().length >= 2, true);

console.info('itm package checks passed');
