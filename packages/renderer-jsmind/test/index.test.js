import test from 'node:test';
import assert from 'node:assert/strict';

import {
  contributions,
  createJsMindNodeArray,
  createRendererJsMindContributionManifest,
  findJsMindMatches,
} from '../src/index.js';

test('renderer-jsmind exports a dedicated contribution manifest', () => {
  assert.equal(contributions.id, '@textforge/renderer-jsmind');
  assert.equal(createRendererJsMindContributionManifest().surfaces[0].id, '@textforge/renderer-jsmind/runtime');
});

test('createJsMindNodeArray preserves hierarchy and synthetic-root fallback', () => {
  const direct = createJsMindNodeArray({
    format: 'textforge.visual-itm/v1',
    origin: { mode: 'standalone' },
    nodes: [
      { id: 'root', label: 'Root' },
      { id: 'child', label: 'Child', parentId: 'root', layout: { 'jsmind.side': 'left' } },
    ],
    edges: [],
  });
  assert.equal(direct.rootId, 'root');
  assert.equal(direct.nodes[1].direction, 'left');

  const synthetic = createJsMindNodeArray({
    format: 'textforge.visual-itm/v1',
    origin: { mode: 'standalone' },
    nodes: [
      { id: 'alpha', label: 'Alpha' },
      { id: 'beta', label: 'Beta' },
    ],
    edges: [],
  });
  assert.equal(synthetic.rootId, '__textforge_jsmind_root__');
  assert.equal(synthetic.nodes.filter((entry) => entry.parentid === synthetic.rootId).length, 2);
});

test('findJsMindMatches searches node identity and metadata', () => {
  const visualDocument = {
    format: 'textforge.visual-itm/v1',
    origin: { mode: 'standalone' },
    nodes: [
      { id: 'roadmap', label: 'Capability roadmap', kind: 'capability', tags: ['planning'] },
      { id: 'delivery', label: 'Delivery', kind: 'capability', parentId: 'roadmap' },
    ],
    edges: [],
  };

  assert.deepEqual(findJsMindMatches(visualDocument, 'planning').map((entry) => entry.id), ['roadmap']);
  assert.deepEqual(findJsMindMatches(visualDocument, 'deliver').map((entry) => entry.id), ['delivery']);
  assert.deepEqual(findJsMindMatches(visualDocument, 'missing'), []);
});
