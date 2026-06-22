import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contributions,
  createDiagramFenceHandlers,
  createDiagramGeneratedResources,
  createGeneratedDiagramPath,
  createGraphvizFenceHandler,
  getStandaloneDiagramKind,
  hasRenderedSvgPayload,
  isStandaloneDiagramResource,
  renderGraphvizToSvg,
  renderMermaidToSvg,
  renderStandaloneDiagramToSvg,
  standaloneDiagramPreviewSurfaceContribution,
  standaloneDiagramPreviewSurfaceId,
} from '../src/index.js';

test('graphviz rendering produces svg output', async () => {
  const svg = await renderGraphvizToSvg('digraph G { A -> B; }');

  assert.match(svg, /<svg/i);
  assert.equal(createGeneratedDiagramPath('/generated/diagram', 'dot', 'block-1', 'svg'), '/generated/diagram-dot-block-1.svg');
});

test('diagram handlers expose mermaid, dot, and graphviz entrypoints', async () => {
  const handlers = createDiagramFenceHandlers();
  const graphvizResult = await handlers.graphviz({
    content: 'digraph G { A -> B; }',
    blockId: 'block-2',
    blockKind: 'graphviz',
    generatedAssetBasePath: '/generated/example',
    sourceUpdatedAt: '2026-05-25T00:00:00.000Z',
    sourceResource: {
      resourceId: 'resource-1',
      path: '/docs/example.md',
      kind: 'resource',
      representation: 'text',
    },
  });

  assert.match(graphvizResult.svg, /<svg/i);
  assert.equal(graphvizResult.generatedResources?.[0]?.path, '/generated/example-graphviz-block-2.svg');
  assert.equal(contributions.packageId, '@textforge/diagrams');
});

test('diagram package can describe generated svg and png resources', () => {
  const resources = createDiagramGeneratedResources({
    svg: '<svg />',
    pngBytes: new Uint8Array([137, 80, 78, 71]),
    blockId: 'block-3',
    blockKind: 'mermaid',
    generatedAssetBasePath: '/generated/sample',
    pipelineId: '@textforge/diagrams/mermaid-svg',
    sourceUpdatedAt: '2026-05-25T00:00:00.000Z',
  });

  assert.equal(resources[0]?.representation, 'text');
  assert.equal(resources[1]?.representation, 'bytes');
});

test('standalone diagram contributions expose preview and SVG export support', async () => {
  const dotResource = {
    representation: 'text',
    languageId: 'dot',
    mimeType: 'text/vnd.graphviz',
    path: '/docs/example.dot',
  };

  assert.equal(getStandaloneDiagramKind(dotResource), 'dot');
  assert.equal(isStandaloneDiagramResource(dotResource), true);
  assert.equal(standaloneDiagramPreviewSurfaceContribution.id, standaloneDiagramPreviewSurfaceId);
  assert.equal(contributions.surfaces.some((surface) => surface.id === standaloneDiagramPreviewSurfaceId), true);
  assert.equal(contributions.commands.some((command) => command.id === 'diagram.export-selected-svg'), true);
  assert.match(await renderStandaloneDiagramToSvg('digraph G { A -> B; }', { kind: 'dot' }), /<svg/i);
});

test('standalone diagram detection supports Mermaid extensions', () => {
  assert.equal(getStandaloneDiagramKind({
    representation: 'text',
    languageId: 'plaintext',
    mimeType: 'text/plain',
    path: '/docs/flow.mmd',
  }), 'mermaid');
  assert.equal(isStandaloneDiagramResource({
    representation: 'bytes',
    languageId: 'mermaid',
    path: '/docs/flow.mmd',
  }), false);
});

test('mermaid output guard rejects stylesheet-only empty svg artifacts', () => {
  assert.equal(
    hasRenderedSvgPayload('<svg><style>.node{fill:red}</style><g></g></svg>'),
    false,
  );
  assert.equal(
    hasRenderedSvgPayload('<svg><style>.node{fill:red}</style><g><path d="M0,0L10,10"/></g></svg>'),
    true,
  );
  assert.equal(
    hasRenderedSvgPayload('<svg><defs><marker id="arrow"/></defs><g><text>Rendered</text></g></svg>'),
    true,
  );
});

test('mermaid rendering requires a browser document in node-based checks', async () => {
  await assert.rejects(
    () => renderMermaidToSvg('flowchart TD\n  A --> B'),
    /browser document/i,
  );
  assert.equal(typeof createGraphvizFenceHandler(), 'function');
});
