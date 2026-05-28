import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createVisualItmDiagnostic,
  createVisualItmDocument,
  createVisualItmEdge,
  createVisualItmNode,
  createVisualItmProvenance,
  isVisualItmDocument,
  validateVisualItmDocument,
  visualItmFormatId,
  visualItmV1Fixtures,
} from '../src/index.js';

test('Visual ITM document helpers create a valid v1 graph document', () => {
  const document = createVisualItmDocument({
    origin: {
      mode: 'derived-itm',
      sourceResource: '/docs/example.itm',
      derivedTarget: {
        kind: 'view',
        id: 'roadmap',
        viewpointId: 'capability-graph',
      },
    },
    renderer: {
      value: 'cytoscape',
      source: 'derived',
    },
    nodes: [
      createVisualItmNode({
        id: 'roadmap',
        label: 'Roadmap',
        provenance: [createVisualItmProvenance({ sourceKind: 'model-item', sourceId: 'roadmap' })],
      }),
      createVisualItmNode({
        id: 'delivery',
        label: 'Delivery',
        parentId: 'roadmap',
      }),
    ],
    edges: [
      createVisualItmEdge({
        id: 'roadmap-delivery',
        sourceId: 'roadmap',
        targetId: 'delivery',
        label: 'contains',
      }),
    ],
    diagnostics: [
      createVisualItmDiagnostic({
        severity: 'info',
        code: 'visual-itm.example',
        message: 'Example diagnostic',
      }),
    ],
  });

  assert.equal(document.format, visualItmFormatId);
  assert.equal(isVisualItmDocument(document), true);
  assert.deepEqual(validateVisualItmDocument(document), []);
});

test('Visual ITM validation reports duplicate ids and missing node references', () => {
  const diagnostics = validateVisualItmDocument(createVisualItmDocument({
    origin: {
      mode: 'derived-itm',
    },
    nodes: [
      { id: 'dup', label: 'First' },
      { id: 'dup', label: 'Second' },
    ],
    edges: [
      { id: 'broken', sourceId: 'dup', targetId: 'missing' },
    ],
  }));

  assert.equal(diagnostics.some((diagnostic) => diagnostic.code === 'visual-itm.node.duplicate-id'), true);
  assert.equal(diagnostics.some((diagnostic) => diagnostic.code === 'visual-itm.edge.unknown-target'), true);
});

test('Visual ITM fixtures cover derived, standalone, missing-renderer, and itm-pub parity cases', () => {
  assert.equal(visualItmV1Fixtures.derivedGraph.origin.mode, 'derived-itm');
  assert.equal(visualItmV1Fixtures.derivedTree.nodes.some((node) => node.parentId === 'roadmap'), true);
  assert.equal(visualItmV1Fixtures.standaloneMindmap.renderer?.source, 'local');
  assert.equal(visualItmV1Fixtures.missingRenderer.diagnostics?.[0]?.code, 'itm.visual.resolve.renderer-missing');
  assert.equal(visualItmV1Fixtures.itmPubParity.renderer?.value, 'graph.viewer');
});
