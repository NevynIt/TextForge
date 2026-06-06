export function createSequentialSessionIdFactory(prefix = 'surface-session') {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

export function createSourceEditorFallback(resource, sourceSurfaceId, reason) {
  return {
    resource,
    sourceSurfaceId,
    reason,
  };
}

export function markSurfaceSessionStale(session, updatedAt) {
  return {
    ...session,
    state: 'stale',
    freshness: 'stale',
    updatedAt,
  };
}

export function markSurfaceSessionCurrent(session, updatedAt) {
  return {
    ...session,
    state: session.state === 'closed' ? 'closed' : 'open',
    freshness: 'current',
    updatedAt,
  };
}

export function createSurfaceHost(props) {
  const now = props.now ?? (() => new Date().toISOString());
  const idFactory = props.idFactory ?? createSequentialSessionIdFactory(props.hostId);
  const sessions = [];

  function open(request) {
    const contribution = props.registry.chooseForResource(request);
    if (!contribution) {
      throw new Error(`No surface contribution could open ${request.resource.resourceId}`);
    }

    const timestamp = now();
    const session = {
      id: idFactory(),
      contributionId: contribution.id,
      resource: request.resource,
      title: request.title ?? request.resource.path ?? request.resource.resourceId,
      sessionKey: request.sessionKey,
      surfaceState: request.surfaceState ? { ...request.surfaceState } : undefined,
      placement: request.placement ?? props.placement,
      state: 'open',
      freshness: 'current',
      createdAt: timestamp,
      updatedAt: timestamp,
      capabilityIds: contribution.capabilities ?? [],
      sourceSessionId: request.sourceSessionId,
      fallbackSurfaceId: request.fallbackSurfaceId,
    };

    sessions.push(session);
    return session;
  }

  function get(sessionId) {
    return sessions.find((session) => session.id === sessionId);
  }

  function list() {
    return [...sessions];
  }

  function focus(sessionId) {
    const current = get(sessionId);
    if (!current) {
      return undefined;
    }

    const nextSession = {
      ...current,
      state: 'open',
      updatedAt: now(),
    };
    const index = sessions.findIndex((session) => session.id === sessionId);
    sessions.splice(index, 1, nextSession);
    return nextSession;
  }

  function move(sessionId, placement) {
    const current = get(sessionId);
    if (!current) {
      return undefined;
    }

    const nextSession = {
      ...current,
      placement,
      updatedAt: now(),
    };
    const index = sessions.findIndex((session) => session.id === sessionId);
    sessions.splice(index, 1, nextSession);
    return nextSession;
  }

  function close(sessionId) {
    const index = sessions.findIndex((session) => session.id === sessionId);
    if (index < 0) {
      return false;
    }

    const current = sessions[index];
    sessions.splice(index, 1, {
      ...current,
      state: 'closed',
      updatedAt: now(),
    });
    return true;
  }

  function replaceSession(sessionId, nextSessionFactory) {
    const current = get(sessionId);
    if (!current) {
      return undefined;
    }

    const nextSession = nextSessionFactory(current);
    const index = sessions.findIndex((session) => session.id === sessionId);
    sessions.splice(index, 1, nextSession);
    return nextSession;
  }

  function markStale(sessionId) {
    return replaceSession(sessionId, (current) => markSurfaceSessionStale(current, now()));
  }

  function markCurrent(sessionId) {
    return replaceSession(sessionId, (current) => markSurfaceSessionCurrent(current, now()));
  }

  function snapshot() {
    return {
      hostId: props.hostId,
      placement: props.placement,
      sessions: sessions.map((session) => ({ ...session })),
    };
  }

  return {
    hostId: props.hostId,
    placement: props.placement,
    open,
    get,
    list,
    focus,
    move,
    close,
    markStale,
    markCurrent,
    snapshot,
  };
}

export function createPopupSurfaceHost(props) {
  return createSurfaceHost({ ...props, placement: 'popup' });
}

export function createMainSurfaceHost(props) {
  return createSurfaceHost({ ...props, placement: 'main' });
}
