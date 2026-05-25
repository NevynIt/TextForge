import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createGeneratedResourceDescriptor,
  createPipelineContributionManifest,
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
