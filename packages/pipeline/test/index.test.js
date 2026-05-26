import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDocumentPipelineRunner,
  createGeneratedResourceDescriptor,
  createPipelineContributionManifest,
  createPipelineOutputValue,
  createPipelineRegistry,
  createPipelineRunner,
  createPipelineStep,
} from '../src/index.js';

test('pipeline registry keeps steps addressable by id', () => {
  const registry = createPipelineRegistry([
    createPipelineStep('markdown.parse', { outputKind: 'json' }),
  ]);

  registry.register(createPipelineStep('diagram.render', { inputKind: 'text', outputKind: 'svg' }));

  assert.equal(registry.get('markdown.parse')?.outputKind, 'json');
  assert.equal(registry.list().length, 2);
});

test('pipeline runner collects trace, diagnostics, and generated resources', async () => {
  const registry = createPipelineRegistry([
    createPipelineStep('markdown.preview', {
      inputKind: 'text',
      outputKind: 'html',
      async run({ input }) {
        return {
          output: {
            kind: 'html',
            value: `<article>${input}</article>`,
          },
          generatedResources: [
            createGeneratedResourceDescriptor({
              path: '/generated/preview.html',
              representation: 'text',
              mimeType: 'text/html',
              text: `<article>${input}</article>`,
              format: 'html',
              pipelineId: 'markdown.preview',
            }),
          ],
        };
      },
    }),
  ]);

  const runner = createPipelineRunner({
    registry,
    now: () => '2026-05-25T00:00:00.000Z',
  });
  const result = await runner.run('Hello', {
    steps: ['markdown.preview'],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.kind, 'html');
  assert.equal(result.generatedResources[0]?.path, '/generated/preview.html');
  assert.equal(result.trace[0]?.status, 'done');
  assert.equal(createPipelineContributionManifest(registry.list()).packageId, '@textforge/pipeline');
});

test('pipeline runner emits an error diagnostic when a step throws', async () => {
  const runner = createPipelineRunner({
    registry: createPipelineRegistry([
      createPipelineStep('diagram.fail', {
        async run() {
          throw new Error('diagram renderer unavailable');
        },
      }),
    ]),
    now: () => '2026-05-25T00:00:00.000Z',
  });

  const result = await runner.run({ kind: 'text', value: 'source' }, {
    steps: ['diagram.fail'],
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0]?.severity, 'error');
  assert.equal(result.trace[0]?.status, 'failed');
});

test('document pipeline runner resolves active short names, qualified references, and intermediate values', async () => {
  const runner = createDocumentPipelineRunner({
    contributionContext: {
      activePipelines: [
        createPipelineStep('@textforge/example/render-svg', {
          localName: 'render-svg',
          outputKind: 'svg',
          async run({ input }) {
            return {
              output: createPipelineOutputValue('svg', `<svg>${input.value}</svg>`),
            };
          },
        }),
        createPipelineStep('@textforge/example/svg-png', {
          localName: 'svg-png',
          inputKind: 'svg',
          outputKind: 'png',
          async run({ input }) {
            return {
              output: createPipelineOutputValue('png', new Uint8Array([input.value.length])),
            };
          },
        }),
      ],
    },
    now: () => '2026-05-25T00:00:00.000Z',
  });

  const result = await runner.run(createPipelineOutputValue('text', 'diagram'), {
    steps: ['render-svg', '@textforge/example/svg-png'],
  });

  assert.equal(result.ok, true);
  assert.equal(result.intermediateValues.length, 2);
  assert.equal(result.intermediateValues[0]?.contributionId, '@textforge/example/render-svg');
  assert.equal(result.intermediateValues[0]?.value.kind, 'svg');
  assert.equal(result.intermediateValues[1]?.value.kind, 'png');
});

test('document pipeline runner reports ambiguous short-name resolution', async () => {
  const runner = createDocumentPipelineRunner({
    contributionContext: {
      activePipelines: [
        createPipelineStep('@textforge/example/render-a', {
          localName: 'render',
        }),
        createPipelineStep('@textforge/example/render-b', {
          localName: 'render',
        }),
      ],
    },
    now: () => '2026-05-25T00:00:00.000Z',
  });

  const result = await runner.run(createPipelineOutputValue('text', 'diagram'), {
    steps: ['render'],
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0]?.code, 'pipeline.step.ambiguous');
});
