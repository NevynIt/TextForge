import assert from 'node:assert/strict';

import {
  contributions,
  createGeneratedResourceDescriptor,
  createPipelineRegistry,
  createPipelineRunner,
  createPipelineStep,
  generatedResourceFormats,
  pipelineValueKinds,
} from '../src/index.js';

assert.equal(contributions.packageId, '@textforge/pipeline');
assert.equal(pipelineValueKinds.includes('svg'), true);
assert.equal(generatedResourceFormats.includes('png'), true);

const registry = createPipelineRegistry([
  createPipelineStep('example.render', {
    inputKind: 'text',
    outputKind: 'html',
  }),
]);

assert.equal(registry.get('example.render')?.outputKind, 'html');
assert.equal(
  createGeneratedResourceDescriptor({
    path: '/generated/example.svg',
    representation: 'text',
    mimeType: 'image/svg+xml',
    text: '<svg />',
    format: 'svg',
  }).format,
  'svg',
);
assert.equal(typeof createPipelineRunner({ registry }).run, 'function');

console.info('pipeline package checks passed');
