import assert from 'node:assert/strict';

import {
  contributions,
  createSigmaGraphDescriptor,
  findSigmaMatches,
} from '../src/index.js';

assert.equal(contributions.id, '@textforge/renderer-sigma');

const visualDocument = {
  format: 'textforge.visual-itm/v1',
  origin: { mode: 'standalone' },
  nodes: [
    { id: 'roadmap', label: 'Roadmap', kind: 'capability' },
    { id: 'delivery', label: 'Delivery', kind: 'capability' },
  ],
  edges: [
    { id: 'depends-on', sourceId: 'roadmap', targetId: 'delivery', label: 'depends-on', kind: 'relation' },
  ],
};

assert.equal(createSigmaGraphDescriptor(visualDocument).nodes.length, 2);
assert.equal(findSigmaMatches(visualDocument, 'depends-on').length, 1);

console.info('renderer-sigma package checks passed');
