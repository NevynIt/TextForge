import type {
  Capability,
  ResourceKind,
  ResourceRef,
  SurfaceContribution as CoreSurfaceContribution,
} from '@textforge/core';

export type SurfacePlacement = 'main' | 'popup' | 'auxiliary';
export type SurfaceHostState = 'open' | 'stale' | 'closed';

export interface SurfaceContribution extends CoreSurfaceContribution {
  readonly label?: string;
  readonly description?: string;
  readonly placements?: ReadonlyArray<SurfacePlacement>;
  readonly resourceKinds?: ReadonlyArray<ResourceKind>;
  readonly allowPopup?: boolean;
  readonly openWithPriority?: number;
}

export interface SurfaceOpenRequest {
  readonly resource: ResourceRef;
  readonly title?: string;
  readonly preferredSurfaceIds?: ReadonlyArray<string>;
  readonly placement?: SurfacePlacement;
  readonly allowPopup?: boolean;
  readonly sourceSessionId?: string;
}

export interface SurfaceSession {
  readonly id: string;
  readonly contributionId: string;
  readonly resource: ResourceRef;
  readonly title: string;
  readonly placement: SurfacePlacement;
  readonly state: SurfaceHostState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly capabilityIds: ReadonlyArray<Capability['id']>;
  readonly sourceSessionId?: string;
}

export interface SurfaceHostSnapshot {
  readonly hostId: string;
  readonly placement: SurfacePlacement;
  readonly sessions: ReadonlyArray<SurfaceSession>;
}

export interface SurfaceRegistry {
  readonly contributions: ReadonlyArray<SurfaceContribution>;
  register(contribution: SurfaceContribution): SurfaceRegistry;
  get(surfaceId: string): SurfaceContribution | undefined;
  list(): ReadonlyArray<SurfaceContribution>;
  listByPlacement(placement: SurfacePlacement): ReadonlyArray<SurfaceContribution>;
  chooseForResource(request: SurfaceOpenRequest): SurfaceContribution | undefined;
}

export interface SurfaceHostProps {
  readonly hostId: string;
  readonly placement: SurfacePlacement;
  readonly registry: SurfaceRegistry;
  readonly now?: () => string;
  readonly idFactory?: () => string;
}

export interface SurfaceHost {
  readonly hostId: string;
  readonly placement: SurfacePlacement;
  open(request: SurfaceOpenRequest): SurfaceSession;
  get(sessionId: string): SurfaceSession | undefined;
  list(): ReadonlyArray<SurfaceSession>;
  focus(sessionId: string): SurfaceSession | undefined;
  move(sessionId: string, placement: SurfacePlacement): SurfaceSession | undefined;
  close(sessionId: string): boolean;
  snapshot(): SurfaceHostSnapshot;
}

export type SurfaceSessionManager = SurfaceHost;

export const contributions = {
  id: '@textforge/surfaces',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
} as const;

export function createSequentialSessionIdFactory(prefix = 'surface-session'): () => string {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

function matchesPlacement(contribution: SurfaceContribution, placement: SurfacePlacement): boolean {
  const placements = contribution.placements ?? ['main', 'popup', 'auxiliary'];
  return placements.includes(placement);
}

function matchesResourceKind(contribution: SurfaceContribution, resourceKind: ResourceKind | undefined): boolean {
  if (!resourceKind) {
    return true;
  }

  const resourceKinds = contribution.resourceKinds ?? [];
  return resourceKinds.length === 0 || resourceKinds.includes(resourceKind);
}

function matchesOpenRequest(contribution: SurfaceContribution, request: SurfaceOpenRequest): boolean {
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

function chooseBestContribution(contributionsList: ReadonlyArray<SurfaceContribution>, request: SurfaceOpenRequest): SurfaceContribution | undefined {
  const preferred = request.preferredSurfaceIds?.map((surfaceId) =>
    contributionsList.find((contribution) => contribution.id === surfaceId),
  );
  const preferredMatch = preferred?.find((contribution): contribution is SurfaceContribution => Boolean(contribution));
  if (preferredMatch) {
    return preferredMatch;
  }

  const matching = contributionsList.filter((contribution) => matchesOpenRequest(contribution, request));
  if (matching.length > 0) {
    return matching.sort((left, right) => (right.openWithPriority ?? 0) - (left.openWithPriority ?? 0))[0];
  }

  return contributionsList[0];
}

export function createSurfaceRegistry(initialContributions: ReadonlyArray<SurfaceContribution> = []): SurfaceRegistry {
  const items = [...initialContributions];
  const registry: SurfaceRegistry = {
    get contributions() {
      return [...items];
    },
    register(contribution: SurfaceContribution): SurfaceRegistry {
      const existingIndex = items.findIndex((candidate) => candidate.id === contribution.id);
      if (existingIndex >= 0) {
        items.splice(existingIndex, 1, contribution);
      } else {
        items.push(contribution);
      }
      return registry;
    },
    get(surfaceId: string): SurfaceContribution | undefined {
      return items.find((contribution) => contribution.id === surfaceId);
    },
    list(): ReadonlyArray<SurfaceContribution> {
      return [...items];
    },
    listByPlacement(placement: SurfacePlacement): ReadonlyArray<SurfaceContribution> {
      return items.filter((contribution) => matchesPlacement(contribution, placement));
    },
    chooseForResource(request: SurfaceOpenRequest): SurfaceContribution | undefined {
      return chooseBestContribution(items, request);
    },
  };

  return registry;
}

export function createSurfaceHost(props: SurfaceHostProps): SurfaceHost {
  const now = props.now ?? (() => new Date().toISOString());
  const idFactory = props.idFactory ?? createSequentialSessionIdFactory(props.hostId);
  const sessions: SurfaceSession[] = [];

  function open(request: SurfaceOpenRequest): SurfaceSession {
    const contribution = props.registry.chooseForResource(request);
    if (!contribution) {
      throw new Error(`No surface contribution could open ${request.resource.resourceId}`);
    }

    const timestamp = now();
    const session: SurfaceSession = {
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

  function get(sessionId: string): SurfaceSession | undefined {
    return sessions.find((session) => session.id === sessionId);
  }

  function list(): ReadonlyArray<SurfaceSession> {
    return [...sessions];
  }

  function focus(sessionId: string): SurfaceSession | undefined {
    const current = get(sessionId);
    if (!current) {
      return undefined;
    }

    const nextSession: SurfaceSession = {
      ...current,
      state: 'open',
      updatedAt: now(),
    };
    const index = sessions.findIndex((session) => session.id === sessionId);
    sessions.splice(index, 1, nextSession);
    return nextSession;
  }

  function move(sessionId: string, placement: SurfacePlacement): SurfaceSession | undefined {
    const current = get(sessionId);
    if (!current) {
      return undefined;
    }

    const nextSession: SurfaceSession = {
      ...current,
      placement,
      updatedAt: now(),
    };
    const index = sessions.findIndex((session) => session.id === sessionId);
    sessions.splice(index, 1, nextSession);
    return nextSession;
  }

  function close(sessionId: string): boolean {
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

  function snapshot(): SurfaceHostSnapshot {
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

export function createPopupSurfaceHost(props: Omit<SurfaceHostProps, 'placement'>): SurfaceHost {
  return createSurfaceHost({ ...props, placement: 'popup' });
}

export function createMainSurfaceHost(props: Omit<SurfaceHostProps, 'placement'>): SurfaceHost {
  return createSurfaceHost({ ...props, placement: 'main' });
}

export function createOpenWithSurfaceCommand(surfaceId: string, label: string, placement: SurfacePlacement = 'main') {
  return {
    id: `open-with:${surfaceId}`,
    label,
    placement,
  } as const;
}
