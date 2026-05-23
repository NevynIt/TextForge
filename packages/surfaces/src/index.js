export const contributions = {
  id: '@textforge/surfaces',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
};

export function createSequentialSessionIdFactory(prefix = 'surface-session') {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

function matchesPlacement(contribution, placement) {
  const placements = contribution.placements ?? ['main', 'popup', 'auxiliary'];
  return placements.includes(placement);
}

function matchesResourceKind(contribution, resourceKind) {
  if (!resourceKind) {
    return true;
  }

  const resourceKinds = contribution.resourceKinds ?? [];
  return resourceKinds.length === 0 || resourceKinds.includes(resourceKind);
}

function matchesMimeType(contribution, mimeType) {
  const contributionMimeTypes = contribution.mimeTypes ?? [];
  if (contributionMimeTypes.length === 0) {
    return true;
  }

  if (!mimeType) {
    return false;
  }

  const normalizedMimeType = mimeType.toLowerCase();
  return contributionMimeTypes.some((candidate) => candidate.toLowerCase() === normalizedMimeType);
}

function matchesOpenRequest(contribution, request) {
  const requestedPlacement = request.placement ?? 'main';
  if (!matchesPlacement(contribution, requestedPlacement)) {
    return false;
  }

  if (!matchesResourceKind(contribution, request.resource.kind)) {
    return false;
  }

  if (!matchesMimeType(contribution, request.resource.mimeType)) {
    return false;
  }

  if (requestedPlacement === 'popup' && request.allowPopup === false) {
    return false;
  }

  if (requestedPlacement === 'popup' && contribution.allowPopup === false) {
    return false;
  }

  return true;
}

function chooseBestContribution(contributionsList, request) {
  const matching = contributionsList.filter((contribution) => matchesOpenRequest(contribution, request));
  const preferred = request.preferredSurfaceIds?.map((surfaceId) =>
    matching.find((contribution) => contribution.id === surfaceId),
  );
  const preferredMatch = preferred?.find((contribution) => Boolean(contribution));
  if (preferredMatch) {
    return preferredMatch;
  }

  if (matching.length > 0) {
    return matching.sort((left, right) => (right.openWithPriority ?? 0) - (left.openWithPriority ?? 0))[0];
  }

  return contributionsList[0];
}

export function createOpenWithSelection(registry, request) {
  const placement = request.placement ?? 'main';
  const candidates = registry.list()
    .filter((contribution) => matchesOpenRequest(contribution, request))
    .sort((left, right) => (right.openWithPriority ?? 0) - (left.openWithPriority ?? 0));
  const selectedSurfaceId = request.preferredSurfaceIds?.find((surfaceId) =>
    candidates.some((candidate) => candidate.id === surfaceId),
  ) ?? candidates[0]?.id;

  return {
    resource: request.resource,
    placement,
    candidates: candidates.map((contribution) => ({
      surfaceId: contribution.id,
      label: contribution.label ?? contribution.id,
      description: contribution.description,
      placement,
      priority: contribution.openWithPriority ?? 0,
      selected: contribution.id === selectedSurfaceId,
    })),
    selectedSurfaceId,
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

export function createSurfaceRegistry(initialContributions = []) {
  const items = [...initialContributions];
  const registry = {
    get contributions() {
      return [...items];
    },
    register(contribution) {
      const existingIndex = items.findIndex((candidate) => candidate.id === contribution.id);
      if (existingIndex >= 0) {
        items.splice(existingIndex, 1, contribution);
      } else {
        items.push(contribution);
      }
      return registry;
    },
    get(surfaceId) {
      return items.find((contribution) => contribution.id === surfaceId);
    },
    list() {
      return [...items];
    },
    listByPlacement(placement) {
      return items.filter((contribution) => matchesPlacement(contribution, placement));
    },
    chooseForResource(request) {
      return chooseBestContribution(items, request);
    },
  };

  return registry;
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

export function createOpenWithSurfaceCommand(surfaceId, label, placement = 'main') {
  return {
    id: `open-with:${surfaceId}`,
    label,
    placement,
  };
}

export function createSurfaceSessionTab(session) {
  return {
    id: session.id,
    surfaceId: session.contributionId,
    resourceId: session.resource.resourceId,
    title: session.title,
    active: session.state === 'open',
    dirty: false,
    stale: session.state === 'stale',
  };
}
