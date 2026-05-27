import assert from 'node:assert/strict';
import test from 'node:test';

import { createMarkdownPreviewRequestManager } from '../src/markdownPreviewState.js';

function createResource(id, updatedAt) {
  return {
    id,
    metadata: {
      updatedAt,
    },
  };
}

test('markdown preview requests defer rendering work until the scheduler runs', async () => {
  const scheduledCallbacks = [];
  const renderedResources = [];
  const manager = createMarkdownPreviewRequestManager({
    scheduleTask(callback) {
      scheduledCallbacks.push(callback);
      return () => {};
    },
    async renderPreview(resource) {
      renderedResources.push(resource.id);
      return { html: `<p>${resource.id}</p>` };
    },
  });

  const state = manager.request(createResource('doc-1', '2026-05-27T20:00:00.000Z'));
  assert.equal(state.status, 'rendering');
  assert.deepEqual(renderedResources, []);
  assert.equal(scheduledCallbacks.length, 1);

  await scheduledCallbacks[0]();
  assert.deepEqual(renderedResources, ['doc-1']);
});

test('markdown preview requests reuse an in-flight render for the same revision', () => {
  let scheduledCount = 0;
  const manager = createMarkdownPreviewRequestManager({
    scheduleTask() {
      scheduledCount += 1;
      return () => {};
    },
  });

  const resource = createResource('doc-1', '2026-05-27T20:00:00.000Z');
  const firstState = manager.request(resource);
  const secondState = manager.request(resource);

  assert.equal(firstState, secondState);
  assert.equal(scheduledCount, 1);
});

test('markdown preview requests ignore stale completions after a newer revision is queued', async () => {
  const scheduledCallbacks = [];
  const emittedStates = [];
  const renderResolvers = [];
  const manager = createMarkdownPreviewRequestManager({
    emit() {
      emittedStates.push('emitted');
    },
    scheduleTask(callback) {
      scheduledCallbacks.push(callback);
      return () => {};
    },
    renderPreview() {
      return new Promise((resolve) => {
        renderResolvers.push(resolve);
      });
    },
  });

  const firstResource = createResource('doc-1', '2026-05-27T20:00:00.000Z');
  const secondResource = createResource('doc-1', '2026-05-27T20:00:01.000Z');

  manager.request(firstResource);
  manager.request(secondResource);

  assert.equal(scheduledCallbacks.length, 2);

  const firstRun = scheduledCallbacks[0]();
  renderResolvers[0]({ html: '<p>stale</p>' });
  await firstRun;
  assert.equal(emittedStates.length, 0);

  const secondRun = scheduledCallbacks[1]();
  renderResolvers[1]({ html: '<p>fresh</p>' });
  await secondRun;
  assert.equal(emittedStates.length, 1);
});
