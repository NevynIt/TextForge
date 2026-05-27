function scheduleDeferredTask(callback, scheduler = globalThis) {
  if (typeof scheduler.requestIdleCallback === 'function') {
    const handle = scheduler.requestIdleCallback(() => {
      void callback();
    }, { timeout: 120 });
    return () => {
      if (typeof scheduler.cancelIdleCallback === 'function') {
        scheduler.cancelIdleCallback(handle);
      }
    };
  }

  const timeoutHandle = scheduler.setTimeout(() => {
    void callback();
  }, 0);
  return () => {
    if (typeof scheduler.clearTimeout === 'function') {
      scheduler.clearTimeout(timeoutHandle);
    }
  };
}

export function createMarkdownPreviewRequestManager(options = {}) {
  const stateByResourceId = new Map();
  const requestVersionByResourceId = new Map();
  const cancelPendingByResourceId = new Map();
  const renderPreview = options.renderPreview ?? (async () => undefined);
  const emit = options.emit ?? (() => {});
  const scheduleTask = options.scheduleTask ?? scheduleDeferredTask;

  function cancelPending(resourceId) {
    const cancel = cancelPendingByResourceId.get(resourceId);
    if (typeof cancel === 'function') {
      cancel();
    }
    cancelPendingByResourceId.delete(resourceId);
  }

  function request(resource) {
    const currentState = stateByResourceId.get(resource.id);
    const updatedAt = resource.metadata.updatedAt;
    if (currentState?.status === 'ready' && currentState.updatedAt === updatedAt) {
      return currentState;
    }

    if (currentState?.status === 'rendering' && currentState.updatedAt === updatedAt) {
      return currentState;
    }

    const requestVersion = (requestVersionByResourceId.get(resource.id) ?? 0) + 1;
    requestVersionByResourceId.set(resource.id, requestVersion);
    cancelPending(resource.id);

    const nextState = {
      status: 'rendering',
      updatedAt,
      result: currentState?.result,
      error: undefined,
    };
    stateByResourceId.set(resource.id, nextState);

    cancelPendingByResourceId.set(resource.id, scheduleTask(async () => {
      cancelPendingByResourceId.delete(resource.id);

      try {
        const result = await renderPreview(resource);
        if (requestVersionByResourceId.get(resource.id) !== requestVersion) {
          return;
        }

        stateByResourceId.set(resource.id, {
          status: 'ready',
          updatedAt,
          result,
          error: undefined,
        });
      } catch (error) {
        if (requestVersionByResourceId.get(resource.id) !== requestVersion) {
          return;
        }

        stateByResourceId.set(resource.id, {
          status: 'error',
          updatedAt,
          result: undefined,
          error,
        });
      }

      emit();
    }));

    return nextState;
  }

  function clear() {
    for (const resourceId of cancelPendingByResourceId.keys()) {
      cancelPending(resourceId);
    }
    stateByResourceId.clear();
    requestVersionByResourceId.clear();
  }

  return {
    request,
    clear,
  };
}
