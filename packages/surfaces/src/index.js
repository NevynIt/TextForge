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

function matchesOpenRequest(contribution, request) {
  if (request.preferredSurfaceIds?.includes(contribution.id)) {
    return true;
  }

  const requestedPlacement = request.placement ?? 'main';
  if (!matchesPlacement(contribution, requestedPlacement)) {
    return false;
  }

  if (!matchesResourceKind(contribution, request.resource.kind)) {
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
  const preferred = request.preferredSurfaceIds?.map((surfaceId) =>
    contributionsList.find((contribution) => contribution.id === surfaceId),
  );
  const preferredMatch = preferred?.find((contribution) => Boolean(contribution));
  if (preferredMatch) {
    return preferredMatch;
  }

  const matching = contributionsList.filter((contribution) => matchesOpenRequest(contribution, request));
  if (matching.length > 0) {
    return matching.sort((left, right) => (right.openWithPriority ?? 0) - (left.openWithPriority ?? 0))[0];
  }

  return contributionsList[0];
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
      createdAt: timestamp,
      updatedAt: timestamp,
      capabilityIds: contribution.capabilities ?? [],
      sourceSessionId: request.sourceSessionId,
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
