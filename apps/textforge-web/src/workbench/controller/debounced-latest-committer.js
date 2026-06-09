export function createDebouncedLatestCommitter(options = {}) {
  const delayMs = options.delayMs ?? 10000;
  const setTimer = options.setTimeout ?? globalThis.setTimeout?.bind(globalThis);
  const clearTimer = options.clearTimeout ?? globalThis.clearTimeout?.bind(globalThis);
  const commit = options.commit ?? (() => undefined);
  let timerId;
  let pending = false;
  let latestValue;

  function clearPendingTimer() {
    if (timerId !== undefined && typeof clearTimer === 'function') {
      clearTimer(timerId);
    }
    timerId = undefined;
  }

  function flush() {
    clearPendingTimer();
    if (!pending) {
      return undefined;
    }

    const value = latestValue;
    pending = false;
    latestValue = undefined;
    return commit(value);
  }

  function schedule(value) {
    latestValue = value;
    pending = true;
    clearPendingTimer();

    if (typeof setTimer !== 'function') {
      return flush();
    }

    timerId = setTimer(() => {
      timerId = undefined;
      flush();
    }, delayMs);
    return value;
  }

  function clear() {
    clearPendingTimer();
    pending = false;
    latestValue = undefined;
  }

  return {
    schedule,
    flush,
    clear,
    isPending: () => pending,
  };
}
