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
    badge: session.resource.badge,
    active: session.state === 'open',
    dirty: false,
    stale: session.state === 'stale',
    attention: session.resource.badge?.repairedFromKey ? 'warning' : undefined,
  };
}

export function listOpenSurfaceSessions(sessions, placement) {
  return sessions.filter((session) =>
    session.state !== 'closed' && (placement ? session.placement === placement : true));
}

export function createMainSessionTabStrip(sessions, options = {}) {
  const openMainSessions = listOpenSurfaceSessions(sessions, 'main');
  return {
    id: options.id ?? 'main-session-tab-strip',
    title: options.title ?? 'Documents',
    placement: 'main',
    layout: 'tabs',
    tabs: openMainSessions.map((session) => createSurfaceSessionTab(session)),
    activeTabId: options.activeTabId ?? openMainSessions[0]?.id,
  };
}
