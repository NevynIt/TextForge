import test from 'node:test';
import assert from 'node:assert/strict';

import {
  contributions,
  createRendererSigmaContributionManifest,
  createSigmaGraphDescriptor,
  findSigmaMatches,
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

test('renderer-sigma exports a dedicated contribution manifest', () => {
  assert.equal(contributions.id, '@textforge/renderer-sigma');
  assert.equal(createRendererSigmaContributionManifest().surfaces[0].id, '@textforge/renderer-sigma/runtime');
});

test('createSigmaGraphDescriptor adapts Visual ITM nodes and edges into graph attributes', () => {
  const descriptor = createSigmaGraphDescriptor(visualDocument);

  assert.equal(descriptor.nodes.length, 2);
  assert.equal(descriptor.edges.length, 1);
  assert.equal(descriptor.nodes[0].id, 'roadmap');
  assert.equal(descriptor.edges[0].source, 'roadmap');
});

test('findSigmaMatches searches node and edge metadata', () => {
  assert.deepEqual(findSigmaMatches(visualDocument, 'planning').map((entry) => entry.id), ['roadmap']);
  assert.deepEqual(findSigmaMatches(visualDocument, 'depends').map((entry) => entry.id), ['depends-on']);
  assert.deepEqual(findSigmaMatches(visualDocument, 'missing'), []);
});
