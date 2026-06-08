export function createDelayedTextDocumentCommitter(options = {}) {
  const viewDelayMs = options.viewDelayMs ?? 2000;
  const saveDelayMs = options.saveDelayMs ?? 10000;
  const setTimer = options.setTimeout ?? globalThis.setTimeout?.bind(globalThis);
  const clearTimer = options.clearTimeout ?? globalThis.clearTimeout?.bind(globalThis);
  const commitViewDocument = options.commitViewDocument ?? (() => undefined);
  const commitSavedDocument = options.commitSavedDocument ?? (() => undefined);
  const pendingByResourceId = new Map();

  function clearEntryTimer(entry, key) {
    const timerId = entry?.[key];
    if (timerId !== undefined && typeof clearTimer === 'function') {
      clearTimer(timerId);
    }
    if (entry) {
      entry[key] = undefined;
    }
  }

  function scheduleEntryTimer(entry, key, delayMs, callback) {
    clearEntryTimer(entry, key);
    if (typeof setTimer !== 'function') {
      return;
    }
    entry[key] = setTimer(callback, delayMs);
  }

  function getOrCreateEntry(resourceId) {
    const existing = pendingByResourceId.get(resourceId);
    if (existing) {
      return existing;
    }

    const entry = {
      document: undefined,
      viewCommitted: false,
      viewTimerId: undefined,
      saveTimerId: undefined,
    };
    pendingByResourceId.set(resourceId, entry);
    return entry;
  }

  function commitView(resourceId) {
    const entry = pendingByResourceId.get(resourceId);
    if (!entry?.document) {
      return undefined;
    }

    clearEntryTimer(entry, 'viewTimerId');
    entry.viewCommitted = true;
    return commitViewDocument(resourceId, entry.document);
  }

  function commitSave(resourceId) {
    const entry = pendingByResourceId.get(resourceId);
    if (!entry?.document) {
      return undefined;
    }

    clearEntryTimer(entry, 'viewTimerId');
    clearEntryTimer(entry, 'saveTimerId');
    const savedDocument = commitSavedDocument(resourceId, entry.document);
    pendingByResourceId.delete(resourceId);
    return savedDocument;
  }

  function schedule(resourceId, document) {
    if (!resourceId || !document) {
      return document;
    }

    const entry = getOrCreateEntry(resourceId);
    entry.document = document;
    entry.viewCommitted = false;
    scheduleEntryTimer(entry, 'viewTimerId', viewDelayMs, () => {
      commitView(resourceId);
    });
    scheduleEntryTimer(entry, 'saveTimerId', saveDelayMs, () => {
      commitSave(resourceId);
    });
    return document;
  }

  function flush(resourceId) {
    return commitSave(resourceId);
  }

  function flushAll(options = {}) {
    const exceptResourceId = options.exceptResourceId;
    const flushed = [];
    for (const resourceId of [...pendingByResourceId.keys()]) {
      if (resourceId === exceptResourceId) {
        continue;
      }
      const document = commitSave(resourceId);
      if (document) {
        flushed.push(document);
      }
    }
    return flushed;
  }

  function clear(resourceId) {
    const entry = pendingByResourceId.get(resourceId);
    if (!entry) {
      return;
    }
    clearEntryTimer(entry, 'viewTimerId');
    clearEntryTimer(entry, 'saveTimerId');
    pendingByResourceId.delete(resourceId);
  }

  function clearAll() {
    for (const resourceId of [...pendingByResourceId.keys()]) {
      clear(resourceId);
    }
  }

  function has(resourceId) {
    return pendingByResourceId.has(resourceId);
  }

  function size() {
    return pendingByResourceId.size;
  }

  return {
    schedule,
    commitView,
    flush,
    flushAll,
    clear,
    clearAll,
    has,
    size,
  };
}
