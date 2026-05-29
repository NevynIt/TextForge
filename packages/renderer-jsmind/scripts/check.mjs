import assert from 'node:assert/strict';

import {
  contributions,
  createJsMindNodeArray,
  findJsMindMatches,
} from '../src/index.js';

assert.equal(contributions.id, '@textforge/renderer-jsmind');

const visualDocument = {
  format: 'textforge.visual-itm/v1',
  origin: { mode: 'standalone' },
  nodes: [
    { id: 'root', label: 'Roadmap' },
    { id: 'foundation', label: 'Foundation', parentId: 'root' },
    { id: 'delivery', label: 'Delivery', parentId: 'root', layout: { 'jsmind.side': 'right' } },
  ],
  edges: [],
};

const data = createJsMindNodeArray(visualDocument);
assert.equal(data.rootId, 'root');
assert.equal(data.nodes.length, 3);
assert.equal(findJsMindMatches(visualDocument, 'delivery').length, 1);

console.info('renderer-jsmind package checks passed');
