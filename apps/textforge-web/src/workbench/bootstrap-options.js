export const sampleResourcePaths = {
  bundledReadme: '/.textforge/resources/docs/README.md',
  notes: '/.textforge/resources/docs/examples/phase-4-markdown-preview.tf.md',
};

const phase35ScreenshotPresets = {
  main: {
    panelLayout: undefined,
    openResourcePath: sampleResourcePaths.notes,
    openPlacement: 'main',
    utilityPaneOpen: false,
    utilitySectionId: 'inspector',
    workspaceTreeCollapsed: true,
  },
  'tree-collapsed': {
    panelLayout: undefined,
    openResourcePath: sampleResourcePaths.notes,
    openPlacement: 'main',
    utilityPaneOpen: true,
    utilitySectionId: 'inspector',
    workspaceTreeCollapsed: true,
  },
  utility: {
    panelLayout: undefined,
    openResourcePath: sampleResourcePaths.notes,
    openPlacement: 'main',
    utilityPaneOpen: true,
    utilitySectionId: 'storage',
    workspaceTreeCollapsed: false,
  },
  popup: {
    panelLayout: undefined,
    openResourcePath: sampleResourcePaths.notes,
    openPlacement: 'popup',
    utilityPaneOpen: true,
    utilitySectionId: 'inspector',
    workspaceTreeCollapsed: false,
  },
  'panels-narrow': {
    panelLayout: {
      sidebar: { defaultSize: '14' },
      utility: { defaultSize: '30' },
    },
    openResourcePath: sampleResourcePaths.notes,
    openPlacement: 'main',
    utilityPaneOpen: true,
    utilitySectionId: 'inspector',
    workspaceTreeCollapsed: false,
  },
  'panels-wide': {
    panelLayout: {
      sidebar: { defaultSize: '28' },
      utility: { defaultSize: '18' },
    },
    openResourcePath: sampleResourcePaths.notes,
    openPlacement: 'main',
    utilityPaneOpen: true,
    utilitySectionId: 'inspector',
    workspaceTreeCollapsed: false,
  },
};

const workbenchTestProfiles = {
  'markdown-minimal': {
    openResourcePath: '/.textforge/resources/docs/examples/markdown-minimal.md',
    preferredSurfaceId: '@textforge/markdown/preview',
    openPlacement: 'main',
  },
  'markdown-phase4': {
    openResourcePath: '/.textforge/resources/docs/examples/phase-4-markdown-preview.tf.md',
    preferredSurfaceId: '@textforge/markdown/preview',
    openPlacement: 'main',
  },
  'itm-tree': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
    preferredSurfaceId: '@textforge/itm/tree',
    openPlacement: 'main',
  },
  'itm-graph': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
    preferredSurfaceId: '@textforge/itm/graph',
    openPlacement: 'main',
  },
  'itm-mindmap': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
    preferredSurfaceId: '@textforge/itm/mindmap',
    openPlacement: 'main',
  },
  'itm-catalogue': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
    preferredSurfaceId: '@textforge/itm/catalogue',
    openPlacement: 'main',
  },
  'itm-matrix': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
    preferredSurfaceId: '@textforge/itm/matrix',
    openPlacement: 'main',
  },
  'itm-report': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
    preferredSurfaceId: '@textforge/itm/report',
    openPlacement: 'main',
  },
  'itm-markdown-tree': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-markdown-tree.md',
    preferredSurfaceId: '@textforge/markdown/preview',
    openPlacement: 'main',
  },
  'itm-markdown-graph': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-markdown-graph.md',
    preferredSurfaceId: '@textforge/markdown/preview',
    openPlacement: 'main',
  },
  'itm-markdown-mindmap': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-markdown-mindmap.md',
    preferredSurfaceId: '@textforge/markdown/preview',
    openPlacement: 'main',
  },
  'itm-markdown-report': {
    openResourcePath: '/.textforge/resources/docs/examples/itm/test-profiles/itm-markdown-report.md',
    preferredSurfaceId: '@textforge/markdown/preview',
    openPlacement: 'main',
  },
  'ea-dashboard-sample': {
    openResourcePath: '/.textforge/resources/docs/examples/ea/ea-dashboard-sample.json',
    preferredSurfaceId: '@textforge/ea-viewer/dashboard',
    openPlacement: 'main',
  },
  'ea-dashboard-retail': {
    openResourcePath: '/.textforge/resources/docs/examples/ea/ea-dashboard-retail-architecture.json',
    preferredSurfaceId: '@textforge/ea-viewer/dashboard',
    openPlacement: 'main',
  },
  'ea-dashboard-retail-itm': {
    openResourcePath: '/.textforge/resources/docs/examples/ea/ea-dashboard-retail-architecture.itm',
    preferredSurfaceId: '@textforge/itm/graph',
    openPlacement: 'main',
  },
};

export const luaRecoveryQueryParam = 'luaSkipPreload';
export const workbenchRecoveryQueryParam = 'recovery';

export function readPhase35ScreenshotPreset() {
  if (typeof window === 'undefined') {
    return phase35ScreenshotPresets.main;
  }

  const presetId = new URL(window.location.href).searchParams.get('phase35');
  return phase35ScreenshotPresets[presetId] ?? phase35ScreenshotPresets.main;
}

export function readWorkbenchTestProfile() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const profileId = new URL(window.location.href).searchParams.get('testProfile');
  return workbenchTestProfiles[profileId] ?? undefined;
}

export function readPreviewTraceEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URL(window.location.href).searchParams.get('tracePreview') === '1';
}

export function readLuaBootstrapRecoveryState() {
  if (typeof window === 'undefined') {
    return {
      skipLuaPreloadOnce: false,
    };
  }

  const url = new URL(window.location.href);
  const skipLuaPreloadOnce = url.searchParams.get(luaRecoveryQueryParam) === '1';
  if (skipLuaPreloadOnce) {
    url.searchParams.delete(luaRecoveryQueryParam);
    if (window.location.protocol !== 'file:') {
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }
  return {
    skipLuaPreloadOnce,
  };
}

export function readWorkbenchRecoveryMode() {
  if (typeof window === 'undefined') {
    return {
      active: false,
    };
  }

  return {
    active: new URL(window.location.href).searchParams.has(workbenchRecoveryQueryParam),
  };
}

export function clearWorkbenchRecoveryMode() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (!url.searchParams.has(workbenchRecoveryQueryParam)) {
    return;
  }

  url.searchParams.delete(workbenchRecoveryQueryParam);
  if (window.location.protocol !== 'file:') {
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
}

export function isLuaBootstrapCommandId(commandId) {
  return String(commandId ?? '').startsWith('lua.');
}

export function readWorkbenchBootstrapOptions() {
  if (typeof window === 'undefined') {
    return {
      commandIds: [],
      luaConsoleCommand: undefined,
    };
  }

  const searchParams = new URL(window.location.href).searchParams;
  const commandIds = searchParams
    .getAll('command')
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  if (searchParams.get('luaConsole') === '1') {
    commandIds.unshift('lua.open-console');
  }

  const luaConsoleCommand = String(searchParams.get('luaConsoleCommand') ?? '').trim() || undefined;
  return {
    commandIds: [...new Set(commandIds)],
    luaConsoleCommand,
  };
}
