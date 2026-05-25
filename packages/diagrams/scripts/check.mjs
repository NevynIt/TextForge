import assert from 'node:assert/strict';

import {
  contributions,
  createDiagramFenceHandlers,
  createDiagramGeneratedResources,
  createGeneratedDiagramPath,
  renderGraphvizToSvg,
} from '../src/index.js';

assert.equal(contributions.packageId, '@textforge/diagrams');
assert.equal(createGeneratedDiagramPath('/generated/check', 'dot', 'block', 'png'), '/generated/check-dot-block.png');
assert.equal(typeof createDiagramFenceHandlers().mermaid, 'function');
assert.equal(
  createDiagramGeneratedResources({
    svg: '<svg />',
    blockId: 'block',
    blockKind: 'mermaid',
    generatedAssetBasePath: '/generated/check',
    pipelineId: '@textforge/diagrams/mermaid-svg',
  })[0]?.mimeType,
  'image/svg+xml',
);
assert.match(await renderGraphvizToSvg('digraph G { A -> B; }'), /<svg/i);

console.info('diagrams package checks passed');
