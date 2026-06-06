import { createVisualItmDocument } from './factories.js';

const derivedGraphFixture = createVisualItmDocument({
  origin: {
    mode: 'derived-itm',
    sourceResource: '/docs/examples/itm/party.itm',
    derivedTarget: {
      kind: 'view',
      id: 'party-graph',
      viewpointId: 'graph-default',
    },
  },
  renderer: {
    value: 'cytoscape',
    source: 'derived',
    hints: {
      'cytoscape.layout': 'cose',
    },
  },
  nodes: [
    {
      id: 'guest.alice',
      label: 'Alice',
      kind: 'actor',
      classes: ['guest'],
      provenance: [
        {
          sourceKind: 'model-item',
          sourceId: 'guest.alice',
          sourcePath: '/docs/examples/itm/party.itm',
        },
      ],
    },
    {
      id: 'item.cake',
      label: 'Cake',
      kind: 'thing',
      classes: ['supply'],
      provenance: [
        {
          sourceKind: 'model-item',
          sourceId: 'item.cake',
          sourcePath: '/docs/examples/itm/party.itm',
        },
      ],
    },
  ],
  edges: [
    {
      id: 'brings.alice.cake',
      sourceId: 'guest.alice',
      targetId: 'item.cake',
      label: 'brings',
      kind: 'relation',
      provenance: [
        {
          sourceKind: 'model-item',
          sourceId: 'brings.alice.cake',
          sourcePath: '/docs/examples/itm/party.itm',
        },
      ],
    },
  ],
});

const derivedTreeFixture = createVisualItmDocument({
  origin: {
    mode: 'derived-itm',
    sourceResource: '/docs/examples/itm/capabilities.itm',
    derivedTarget: {
      kind: 'viewpoint',
      id: 'capability-tree',
    },
  },
  renderer: {
    value: 'jsmind',
    source: 'derived',
    hints: {
      'jsmind.layout': 'side',
    },
  },
  nodes: [
    {
      id: 'roadmap',
      label: 'Capability roadmap',
      kind: 'capability',
      provenance: [{ sourceKind: 'model-item', sourceId: 'roadmap' }],
    },
    {
      id: 'foundation',
      label: 'Foundation',
      kind: 'capability',
      parentId: 'roadmap',
      provenance: [{ sourceKind: 'model-item', sourceId: 'foundation' }],
    },
    {
      id: 'delivery',
      label: 'Delivery',
      kind: 'capability',
      parentId: 'roadmap',
      provenance: [{ sourceKind: 'model-item', sourceId: 'delivery' }],
    },
  ],
  edges: [],
});

const standaloneMindmapFixture = createVisualItmDocument({
  origin: {
    mode: 'standalone',
    sourceResource: '/workspace/visuals/party-plan.visual-itm.json',
  },
  renderer: {
    value: 'jsmind',
    source: 'local',
    hints: {
      'jsmind.layout': 'side',
    },
  },
  nodes: [
    { id: 'root', label: 'Party', kind: 'topic' },
    { id: 'food', label: 'Food', kind: 'topic', parentId: 'root' },
    { id: 'games', label: 'Games', kind: 'topic', parentId: 'root' },
  ],
  edges: [],
});

const missingRendererFixture = createVisualItmDocument({
  origin: {
    mode: 'derived-itm',
    sourceResource: '/docs/examples/itm/missing-renderer.itm',
    derivedTarget: {
      kind: 'viewpoint',
      id: 'broken-viewpoint',
    },
  },
  diagnostics: [
    {
      severity: 'error',
      code: 'itm.visual.resolve.renderer-missing',
      message: 'Viewpoint broken-viewpoint does not declare a render step.',
      subjectId: 'broken-viewpoint',
      provenance: [
        {
          sourceKind: 'viewpoint',
          sourceId: 'broken-viewpoint',
          sourcePath: '/docs/examples/itm/missing-renderer.itm',
        },
      ],
    },
  ],
  nodes: [],
  edges: [],
});

const itmPubParityFixture = createVisualItmDocument({
  origin: {
    mode: 'derived-itm',
    sourceResource: '/docs/examples/itm/roadmap.itm',
    derivedTarget: {
      kind: 'view',
      id: 'roadmap-graph',
      viewpointId: 'capability-graph',
    },
  },
  renderer: {
    value: 'graph.viewer',
    source: 'derived',
  },
  nodes: [
    { id: 'roadmap', label: 'Roadmap', kind: 'capability' },
    { id: 'foundation', label: 'Foundation', kind: 'capability', parentId: 'roadmap' },
  ],
  edges: [],
});

export const visualItmV1Fixtures = Object.freeze({
  derivedGraph: derivedGraphFixture,
  derivedTree: derivedTreeFixture,
  standaloneMindmap: standaloneMindmapFixture,
  missingRenderer: missingRendererFixture,
  itmPubParity: itmPubParityFixture,
});
