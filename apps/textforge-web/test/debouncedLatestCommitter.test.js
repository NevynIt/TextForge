import assert from 'node:assert/strict';
import test from 'node:test';

import { createDebouncedLatestCommitter } from '../src/workbench/controller/debounced-latest-committer.js';

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

test('debounced latest committer commits only the last value after idle', () => {
  const timers = createFakeTimers();
  const commits = [];
  const committer = createDebouncedLatestCommitter({
    delayMs: 10000,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    commit: (value) => commits.push(value),
  });

  committer.schedule('main-1');
  timers.advance(9000);
  committer.schedule('main-2');

  timers.advance(9999);
  assert.deepEqual(commits, []);
  assert.equal(committer.isPending(), true);

  timers.advance(1);
  assert.deepEqual(commits, ['main-2']);
  assert.equal(committer.isPending(), false);
  assert.equal(timers.pendingCount(), 0);
});

test('debounced latest committer flushes and clears pending timers', () => {
  const timers = createFakeTimers();
  const commits = [];
  const committer = createDebouncedLatestCommitter({
    delayMs: 10000,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    commit: (value) => commits.push(value),
  });

  committer.schedule('popup-1');
  committer.schedule('popup-2');
  committer.flush();

  assert.deepEqual(commits, ['popup-2']);
  assert.equal(committer.isPending(), false);
  assert.equal(timers.pendingCount(), 0);

  timers.advance(10000);
  assert.deepEqual(commits, ['popup-2']);
});
