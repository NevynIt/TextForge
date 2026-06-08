import assert from 'node:assert/strict';
import test from 'node:test';

import { createDelayedTextDocumentCommitter } from '../src/workbench/controller/delayed-text-commits.js';

function createFakeTimers() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();

  function setTimeout(callback, delayMs) {
    const id = nextId;
    nextId += 1;
    timers.set(id, {
      callback,
      dueAt: now + delayMs,
    });
    return id;
  }

  function clearTimeout(id) {
    timers.delete(id);
  }

  function advance(delayMs) {
    const target = now + delayMs;
    while (true) {
      const next = [...timers.entries()]
        .filter(([, timer]) => timer.dueAt <= target)
        .sort((a, b) => a[1].dueAt - b[1].dueAt || a[0] - b[0])[0];
      if (!next) {
        break;
      }

      const [id, timer] = next;
      timers.delete(id);
      now = timer.dueAt;
      timer.callback();
    }
    now = target;
  }

  return {
    setTimeout,
    clearTimeout,
    advance,
    pendingCount: () => timers.size,
  };
}

function createDocument(text, version) {
  return {
    resource: { resourceId: 'resource-1', kind: 'resource', representation: 'text' },
    text,
    version,
  };
}

test('delayed text commits debounce view propagation and workspace saves separately', () => {
  const timers = createFakeTimers();
  const viewCommits = [];
  const saveCommits = [];
  const committer = createDelayedTextDocumentCommitter({
    viewDelayMs: 2000,
    saveDelayMs: 10000,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    commitViewDocument: (resourceId, document) => {
      viewCommits.push({ resourceId, document });
      return document;
    },
    commitSavedDocument: (resourceId, document) => {
      saveCommits.push({ resourceId, document });
      return document;
    },
  });

  committer.schedule('resource-1', createDocument('first', 1));
  timers.advance(1000);
  committer.schedule('resource-1', createDocument('second', 2));

  timers.advance(1999);
  assert.equal(viewCommits.length, 0);
  assert.equal(saveCommits.length, 0);

  timers.advance(1);
  assert.deepEqual(viewCommits.map((commit) => commit.document.text), ['second']);
  assert.equal(saveCommits.length, 0);

  timers.advance(7999);
  assert.equal(saveCommits.length, 0);

  timers.advance(1);
  assert.deepEqual(saveCommits.map((commit) => commit.document.text), ['second']);
  assert.equal(committer.has('resource-1'), false);
});

test('delayed text commits flush immediately for navigation and clear timers', () => {
  const timers = createFakeTimers();
  const saveCommits = [];
  const committer = createDelayedTextDocumentCommitter({
    viewDelayMs: 2000,
    saveDelayMs: 10000,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    commitSavedDocument: (resourceId, document) => {
      saveCommits.push({ resourceId, document });
      return document;
    },
  });

  committer.schedule('resource-1', createDocument('pending', 1));
  const flushed = committer.flush('resource-1');

  assert.equal(flushed.text, 'pending');
  assert.deepEqual(saveCommits.map((commit) => commit.document.text), ['pending']);
  assert.equal(committer.has('resource-1'), false);
  assert.equal(timers.pendingCount(), 0);

  timers.advance(10000);
  assert.equal(saveCommits.length, 1);
});

test('delayed text commits flush all pending documents on disposal', () => {
  const timers = createFakeTimers();
  const saveCommits = [];
  const committer = createDelayedTextDocumentCommitter({
    viewDelayMs: 2000,
    saveDelayMs: 10000,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    commitSavedDocument: (resourceId, document) => {
      saveCommits.push({ resourceId, document });
      return document;
    },
  });

  committer.schedule('resource-1', createDocument('one', 1));
  committer.schedule('resource-2', {
    ...createDocument('two', 1),
    resource: { resourceId: 'resource-2', kind: 'resource', representation: 'text' },
  });

  const flushed = committer.flushAll();

  assert.deepEqual(flushed.map((document) => document.text), ['one', 'two']);
  assert.deepEqual(saveCommits.map((commit) => commit.resourceId), ['resource-1', 'resource-2']);
  assert.equal(committer.size(), 0);
  assert.equal(timers.pendingCount(), 0);
});
