import assert from 'node:assert/strict';

import {
  validateVisualItmDocument,
  visualItmFormatId,
  visualItmV1Fixtures,
} from '../src/index.js';

assert.equal(visualItmFormatId, 'textforge.visual-itm/v1');
assert.deepEqual(validateVisualItmDocument(visualItmV1Fixtures.derivedGraph), []);
assert.deepEqual(validateVisualItmDocument(visualItmV1Fixtures.derivedTree), []);
assert.deepEqual(validateVisualItmDocument(visualItmV1Fixtures.standaloneMindmap), []);
assert.equal(visualItmV1Fixtures.missingRenderer.diagnostics?.[0]?.severity, 'error');
assert.equal(visualItmV1Fixtures.itmPubParity.origin.derivedTarget?.kind, 'view');

console.info('visual-itm package checks passed');
