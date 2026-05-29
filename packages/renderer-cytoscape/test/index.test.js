import test from 'node:test';
import assert from 'node:assert/strict';

import {
  contributions,
  createCytoscapeElements,
  createRendererCytoscapeContributionManifest,
  findCytoscapeMatches,
} from '../src/index.js';

const visualDocument = {
  format: 'textforge.visual-itm/v1',
  origin: { mode: 'standalone' },
  nodes: [
    {
      id: 'roadmap',
      label: 'Capability roadmap',
      kind: 'capability',
      classes: ['capability'],
      tags: ['planning'],
      provenance: [{ sourceKind: 'model-item', sourcePath: '/docs/roadmap.itm', sourceId: 'roadmap' }],
    },
    {
      id: 'delivery',
      label: 'Delivery',
      kind: 'capability',
      parentId: 'roadmap',
      provenance: [{ sourceKind: 'model-item', sourcePath: '/docs/roadmap.itm', sourceId: 'delivery' }],
    },
  ],
  edges: [
    {
      id: 'depends-on',
      sourceId: 'roadmap',
      targetId: 'delivery',
      label: 'depends-on',
      kind: 'relation',
      provenance: [{ sourceKind: 'model-item', sourcePath: '/docs/roadmap.itm', sourceId: 'depends-on' }],
    },
  ],
};

test('renderer-cytoscape exports a dedicated contribution manifest', () => {
  assert.equal(contributions.id, '@textforge/renderer-cytoscape');
  assert.equal(createRendererCytoscapeContributionManifest().surfaces[0].id, '@textforge/renderer-cytoscape/runtime');
});

test('createCytoscapeElements adapts Visual ITM nodes and edges into Cytoscape data', () => {
  const elements = createCytoscapeElements(visualDocument);

  assert.equal(elements.nodes.length, 2);
  assert.equal(elements.edges.length, 1);
  assert.equal(elements.nodes[1].data.parent, 'roadmap');
  assert.equal(elements.edges[0].data.source, 'roadmap');
});

test('findCytoscapeMatches searches node and edge metadata', () => {
  assert.deepEqual(findCytoscapeMatches(visualDocument, 'plan').map((entry) => entry.id), ['roadmap']);
  assert.deepEqual(findCytoscapeMatches(visualDocument, 'depends').map((entry) => entry.id), ['depends-on']);
  assert.deepEqual(findCytoscapeMatches(visualDocument, 'missing'), []);
});
