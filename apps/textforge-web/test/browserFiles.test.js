import assert from 'node:assert/strict';
import test from 'node:test';

import { pickLocalFile } from '../src/workbench/browser-files.js';

function createFakeTimers() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();

  return {
    setTimeout(callback, delayMs) {
      const id = nextId;
      nextId += 1;
      timers.set(id, {
        callback,
        dueAt: now + delayMs,
      });
      return id;
    },
    advance(delayMs) {
      const target = now + delayMs;
      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.dueAt <= target)
          .sort((left, right) => left[1].dueAt - right[1].dueAt || left[0] - right[0])[0];
        if (!next) {
          break;
        }

        const [id, timer] = next;
        timers.delete(id);
        now = timer.dueAt;
        timer.callback();
      }
      now = target;
    },
  };
}

function withFakeFilePickerEnvironment(callback) {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const timers = createFakeTimers();
  const focusListeners = new Set();
  let input;

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement(tagName) {
        assert.equal(tagName, 'input');
        input = {
          files: [],
          style: {},
          listeners: new Map(),
          removed: false,
          addEventListener(eventName, listener) {
            this.listeners.set(eventName, listener);
          },
          click() {},
          remove() {
            this.removed = true;
          },
        };
        return input;
      },
      body: {
        append() {},
      },
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      setTimeout: timers.setTimeout,
      addEventListener(eventName, listener) {
        if (eventName === 'focus') {
          focusListeners.add(listener);
        }
      },
      removeEventListener(eventName, listener) {
        if (eventName === 'focus') {
          focusListeners.delete(listener);
        }
      },
    },
  });

  try {
    return callback({
      get input() {
        return input;
      },
      focus() {
        for (const listener of [...focusListeners]) {
          listener();
        }
      },
      timers,
    });
  } finally {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: previousDocument,
      });
    }

    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      });
    }
  }
}

test('local file picker waits for change after the chooser returns focus', async () => {
  await withFakeFilePickerEnvironment(async (environment) => {
    const selectedFile = { name: 'folder.zip' };
    const picked = pickLocalFile({ accept: '.zip,application/zip' });

    environment.focus();
    environment.timers.advance(0);
    environment.input.files = [selectedFile];
    environment.input.listeners.get('change')();

    assert.equal(await picked, selectedFile);
    assert.equal(environment.input.removed, true);
  });
});

test('local file picker resolves empty when focus returns without a selection', async () => {
  await withFakeFilePickerEnvironment(async ({ focus, timers }) => {
    const picked = pickLocalFile({ accept: '.zip,application/zip' });

    focus();
    timers.advance(500);

    assert.equal(await picked, undefined);
  });
});
