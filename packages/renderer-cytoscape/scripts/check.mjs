import assert from 'node:assert/strict';

import {
  contributions,
  createCytoscapeElements,
  findCytoscapeMatches,
} from '../src/index.js';

assert.equal(contributions.id, '@textforge/renderer-cytoscape');
assert.equal(Array.isArray(contributions.surfaces), true);

const visualDocument = {
  format: 'textforge.visual-itm/v1',
  origin: { mode: 'standalone' },
  nodes: [
    { id: 'roadmap', label: 'Roadmap', kind: 'capability', classes: ['capability'], tags: ['core'] },
    { id: 'delivery', label: 'Delivery', kind: 'capability', parentId: 'roadmap' },
  ],
  edges: [
    { id: 'depends-on', sourceId: 'roadmap', targetId: 'delivery', label: 'depends-on', kind: 'relation' },
  ],
};

assert.equal(createCytoscapeElements(visualDocument).nodes.length, 2);
assert.equal(findCytoscapeMatches(visualDocument, 'depends-on').length, 1);

console.info('renderer-cytoscape package checks passed');
