import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  contributions as coreContributions,
  createCommandDispatcher,
  createCommandRegistry,
  getLanguageDefinition,
  inferLanguageId,
} from '@textforge/core';
import {
  basenameWorkspacePath,
  createPersistedWorkspaceService,
  createSequentialIdFactory,
  createWorkspaceContributionManifest,
  createWorkspaceService,
  listWorkspaceBadgeDiagnostics,
  createWorkspaceTreeItems,
  dirnameWorkspacePath,
  exportWorkspaceFolderToZip,
  exportWorkspaceToZip,
  importWorkspaceFromZip,
  joinWorkspacePath,
  normalizeWorkspacePath,
  resetWorkspaceDexieStorage,
  workspaceEntryToResourceRef,
  workspaceStorageErrorCodes,
} from '@textforge/workspace';
import {
  createMainSessionTabStrip,
  createMainSurfaceHost,
  createOpenWithSelection,
  createPopupSurfaceHost,
  createSequentialSessionIdFactory,
  createSurfaceContributionManifest,
  createSurfaceRegistry,
  createSurfaceSessionTab,
  listOpenSurfaceSessions,
} from '@textforge/surfaces';
import {
  codeMirrorTextEditorSurfaceContribution,
  createCodeMirrorTextEditorSurface,
  createEditorContributionManifest,
  createTextEditorDocument,
  listTextEditorLanguageModes,
} from '@textforge/editors';
import {
  assetSurfaceContributions,
  createAssetContributionManifest,
  createAssetViewerSurface,
  createBinaryAssetViewerSurface,
  createBlobUrlLedger,
  createImageAssetViewerSurface,
  createPdfAssetViewerSurface,
  createSvgAssetViewerSurface,
  createWorkspaceAssetBinding,
  markAssetBindingReady,
} from '@textforge/assets';
import {
  TextForgeAppFrame,
  TextForgeCallout,
  TextForgeCommandPalette,
  TextForgeEmptyState,
  TextForgeInspectorCard,
  TextForgePopupHost,
  TextForgeResourceBadge,
  TextForgeSelectField,
  TextForgeSessionTabStrip,
  TextForgeStatusRail,
  TextForgeToolbarButton,
  TextForgeTopBar,
  TextForgeUtilityPane,
  TextForgeWorkspaceSidebar,
  contributions as uiContributionPack,
  createStatusBadge,
  createToolbarSlot,
  createWorkbenchChromeModel,
  createWorkspaceTreeFrameModel,
} from '@textforge/ui';
import { bundledDocFolders, bundledDocs } from './generated/bundledDocs.js';

const element = React.createElement;
const textEncoder = new TextEncoder();
const workspaceDatabaseName = 'textforge-workspace';
const sampleResourcePaths = {
  notes: '/docs/notes.md',
  architecture: '/docs/architecture.txt',
  settings: '/docs/settings.yaml',
  roadmap: '/roadmap/phase-3-4-readability-pass.md',
  svg: '/docs/system.svg',
};
const utilitySections = [
  { id: 'inspector', label: 'Inspector', icon: 'status' },
  { id: 'popups', label: 'Popup Summary', icon: 'utility' },
  { id: 'storage', label: 'Browser Storage', icon: 'status' },
  { id: 'registry', label: 'Contribution Packs', icon: 'command' },
];

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
    openResourcePath: sampleResourcePaths.svg,
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

function readPhase35ScreenshotPreset() {
  if (typeof window === 'undefined') {
    return phase35ScreenshotPresets.main;
  }

  const presetId = new URL(window.location.href).searchParams.get('phase35');
  return phase35ScreenshotPresets[presetId] ?? phase35ScreenshotPresets.main;
}

const assetSurfaceFactoryByContributionId = {
  '@textforge/assets/image': createImageAssetViewerSurface,
  '@textforge/assets/svg': createSvgAssetViewerSurface,
  '@textforge/assets/pdf': createPdfAssetViewerSurface,
  '@textforge/assets/binary': createBinaryAssetViewerSurface,
};

function createTimestampFactory() {
  return () => new Date().toISOString();
}

function createBinarySvgBytes() {
  return textEncoder.encode(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
      <rect width="320" height="200" rx="20" fill="#0b1020" />
      <rect x="24" y="24" width="272" height="152" rx="14" fill="#1b2740" />
      <circle cx="92" cy="104" r="26" fill="none" stroke="#55c6bb" stroke-width="8" />
      <path d="M150 124 L198 74 L244 124" fill="none" stroke="#f4b860" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M92 134 L116 102 L132 118 L150 92" fill="none" stroke="#e6edf7" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
      <text x="24" y="44" fill="#d7e3f4" font-family="sans-serif" font-size="18">TextForge system.svg</text>
    </svg>
  `);
}

function createSeedWorkspaceState() {
  const now = createTimestampFactory();
  const workspace = createWorkspaceService({
    workspaceId: 'textforge-shell',
    name: 'TextForge Workspace',
    now,
    idFactory: createSequentialIdFactory('workspace'),
  });

  workspace.createFolder({ path: '/docs', title: 'docs' });
  workspace.createFolder({ path: '/roadmap', title: 'roadmap' });
  for (const folderPath of bundledDocFolders) {
    workspace.createFolder({
      path: folderPath,
      title: basenameWorkspacePath(folderPath),
    });
  }
  for (const resource of bundledDocs) {
    workspace.createTextResource(resource);
  }
  workspace.createTextResource({
    path: sampleResourcePaths.notes,
    title: 'notes.md',
    text: '# TextForge\n\nPhase 3.4 keeps the local command shell from Phase 3.3, adds deterministic resource badges, and calms the workbench chrome for daily authoring.',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  workspace.createTextResource({
    path: sampleResourcePaths.architecture,
    title: 'architecture.txt',
    text: 'The Phase 3.4 shell keeps command dispatch local, uses deterministic badge metadata for orientation, and removes overflow-heavy debug chrome.',
    mimeType: 'text/plain',
  });
  workspace.createTextResource({
    path: sampleResourcePaths.settings,
    title: 'settings.yaml',
    text: 'workspace: textforge\nshell: react\nreadability: compact\nbadges: deterministic\n',
    languageId: 'yaml',
    mimeType: 'text/yaml',
  });
  workspace.createTextResource({
    path: sampleResourcePaths.roadmap,
    title: 'phase-3-4-readability-pass.md',
    text: 'Phase 3.4 keeps the command substrate from Phase 3.3, adds stable Shapez-style resource badges, and tightens layout, status, inspector, and utility readability in one integrated pass.',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  workspace.createBinaryResource({
    path: sampleResourcePaths.svg,
    title: 'system.svg',
    bytes: createBinarySvgBytes(),
    mimeType: 'image/svg+xml',
  });

  return workspace.snapshot();
}

function createBlobUrlDriver() {
  return {
    createObjectURL(source) {
      const blob = new Blob([source.data ?? new Uint8Array()], { type: source.type ?? 'application/octet-stream' });
      return URL.createObjectURL(blob);
    },
    revokeObjectURL(url) {
      URL.revokeObjectURL(url);
    },
  };
}

function sanitizeFilenameSegment(value, fallback = 'textforge-workspace') {
  const normalized = String(value ?? '')
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function createZipFilename(label, fallback) {
  return `${sanitizeFilenameSegment(label, fallback)}.zip`;
}

function downloadBytes(filename, bytes, mimeType = 'application/octet-stream') {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function pickLocalFile({ accept } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    let settled = false;
    input.type = 'file';
    if (accept) {
      input.accept = accept;
    }
    input.style.display = 'none';

    function finish(file) {
      if (settled) {
        return;
      }
      settled = true;
      input.remove();
      window.removeEventListener('focus', handleWindowFocus, true);
      resolve(file);
    }

    function handleWindowFocus() {
      window.setTimeout(() => {
        if (!input.files?.length) {
          finish(undefined);
        }
      }, 0);
    }

    input.addEventListener('change', () => finish(input.files?.[0]));
    window.addEventListener('focus', handleWindowFocus, true);
    document.body.append(input);
    input.click();
  });
}

async function readFileBytes(file) {
  return new Uint8Array(await file.arrayBuffer());
}

function createContributionPacks({ languageModes, surfaceContributions }) {
  return [
    coreContributions,
    createWorkspaceContributionManifest(),
    createSurfaceContributionManifest(surfaceContributions),
    createEditorContributionManifest(languageModes),
    createAssetContributionManifest(),
    uiContributionPack,
  ];
}

function resolveCommandIcon(commandId) {
  if (commandId.startsWith('workspace.import')) {
    return 'import';
  }

  if (commandId.startsWith('workspace.export') || commandId === 'asset.download-selected') {
    return 'export';
  }

  if (commandId === 'workspace.new-folder') {
    return 'folder';
  }

  if (commandId === 'workspace.new-resource' || commandId.startsWith('editor.set-language')) {
    return 'fileText';
  }

  if (commandId.startsWith('surface.open-with') || commandId === 'surface.focus-main-session') {
    return 'fileText';
  }

  if (commandId === 'surface.focus-popup-session') {
    return 'utility';
  }

  if (commandId === 'surface.close-active' || commandId === 'workspace.delete-selected') {
    return 'close';
  }

  if (commandId === 'workspace.reset-storage' || commandId === 'workspace.retry-storage') {
    return 'warning';
  }

  return 'command';
}

function resolveEntryIcon(entry) {
  if (!entry) {
    return 'status';
  }

  if (entry.kind === 'folder') {
    return 'folder';
  }

  if (entry.kind === 'text') {
    return 'fileText';
  }

  if (entry.mimeType === 'image/svg+xml' || entry.mimeType?.startsWith('image/') || entry.mimeType === 'application/pdf') {
    return 'fileImage';
  }

  return 'fileBinary';
}

function createWelcomeView() {
  return {
    id: 'welcome',
    kind: 'welcome',
    mountId: 'welcome',
    title: 'Readable command-driven workspace',
    summary: 'The shell keeps the local command system from Phase 3.3, adds deterministic resource badges, and shifts the workbench toward a calmer authoring layout.',
    openWith: 'Shell chrome',
    state: 'open',
    placement: 'main',
    controls: [],
  };
}

function createLoadingView() {
  return {
    id: 'workspace-loading',
    kind: 'loading',
    mountId: 'workspace-loading',
    title: 'Hydrating browser workspace',
    summary: 'TextForge is opening the browser-managed IndexedDB workspace before any contribution-driven surface sessions are mounted.',
    openWith: 'Workspace storage',
    state: 'pending',
    placement: 'main',
    controls: [],
  };
}

function createStorageFailure(error) {
  const code = error?.code ?? workspaceStorageErrorCodes.loadFailed;
  if (
    code === workspaceStorageErrorCodes.corruptedState
    || code === workspaceStorageErrorCodes.incompatibleState
  ) {
    return {
      code,
      title: 'Workspace reset required',
      detail: 'The browser-managed workspace could not be read. Reset browser storage to rebuild a fresh local workspace seed.',
    };
  }

  return {
    code,
    title: 'Workspace storage unavailable',
    detail: 'TextForge could not initialize the browser-managed workspace. Retry the load or reset browser storage to recover.',
  };
}

function createTextForgeWorkbenchController() {
  const screenshotPreset = readPhase35ScreenshotPreset();
  let workspace = createWorkspaceService({
    workspaceId: 'textforge-shell',
    name: 'TextForge Workspace',
    now: createTimestampFactory(),
    idFactory: createSequentialIdFactory('workspace'),
  });
  let persistedWorkspace;
  let unsubscribePersistence;
  let hydrationSource = 'seed';
  let storageFailure;
  const blobLedger = createBlobUrlLedger(createBlobUrlDriver());
  const languageModes = listTextEditorLanguageModes();
  const surfaceRegistry = createSurfaceRegistry([
    codeMirrorTextEditorSurfaceContribution,
    ...assetSurfaceContributions,
  ]);
  const contributionPacks = createContributionPacks({
    languageModes,
    surfaceContributions: surfaceRegistry.list(),
  });
  const commandRegistry = createCommandRegistry(contributionPacks);
  const mainHost = createMainSurfaceHost({
    hostId: 'main',
    registry: surfaceRegistry,
    idFactory: createSequentialSessionIdFactory('main'),
  });
  const popupHost = createPopupSurfaceHost({
    hostId: 'popup',
    registry: surfaceRegistry,
    idFactory: createSequentialSessionIdFactory('popup'),
  });
  const activeTextDocuments = new Map();
  const assetLeaseByResourceId = new Map();
  const listeners = new Set();
  let cachedSnapshot;
  const state = {
    activeMainSessionId: undefined,
    activePopupSessionId: undefined,
    expandedFolderIds: [],
    selectedWorkspaceItemId: undefined,
    utilityPaneOpen: screenshotPreset.utilityPaneOpen,
    utilitySectionId: screenshotPreset.utilitySectionId,
    workspaceTreeCollapsed: screenshotPreset.workspaceTreeCollapsed,
    storageResetPending: false,
    surfaceFocusPlacement: 'main',
  };
  const runtime = {
    status: 'loading',
  };
  const commandDispatcher = createCommandDispatcher({
    registry: commandRegistry,
    getContext: buildCommandContext,
  });

  function emit() {
    cachedSnapshot = undefined;
    for (const listener of listeners) {
      listener();
    }
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getEntry(resourceId) {
    if (!resourceId) {
      return undefined;
    }
    return workspace.getEntry(resourceId);
  }

  function getSampleEntry(path) {
    return workspace.getEntryByPath(path);
  }

  function getDefaultSelection() {
    return getSampleEntry(sampleResourcePaths.notes)
      ?? workspace.snapshot().resources[0]
      ?? workspace.snapshot().folders.find((folder) => folder.id !== 'root');
  }

  function listMainSessions() {
    return listOpenSurfaceSessions(mainHost.list(), 'main');
  }

  function listPopupSessions() {
    return listOpenSurfaceSessions(popupHost.list(), 'popup');
  }

  function getOpenSessions() {
    return [...listMainSessions(), ...listPopupSessions()];
  }

  function findSessionById(sessionId) {
    return getOpenSessions().find((session) => session.id === sessionId && session.state !== 'closed');
  }

  function findSessionForResource(resourceId) {
    return getOpenSessions().find((session) => session.resource.resourceId === resourceId && session.state !== 'closed');
  }

  function getHostForPlacement(placement) {
    return placement === 'popup' ? popupHost : mainHost;
  }

  function createSurfaceOpenRequest(entry, options = {}) {
    const placement = options.placement ?? (entry.kind === 'binary' ? 'popup' : 'main');
    return {
      resource: workspaceEntryToResourceRef(entry),
      workspaceResource: entry,
      title: entry.metadata.title ?? entry.path,
      placement,
      allowPopup: true,
      preferredSurfaceIds: options.preferredSurfaceId ? [options.preferredSurfaceId] : undefined,
    };
  }

  function releaseAssetLeaseIfUnused(resourceId) {
    const stillMounted = getOpenSessions().some((session) => session.resource.resourceId === resourceId && session.state !== 'closed');
    if (stillMounted) {
      return;
    }

    const lease = assetLeaseByResourceId.get(resourceId);
    if (!lease) {
      return;
    }

    blobLedger.release(lease.id);
    assetLeaseByResourceId.delete(resourceId);
  }

  function normalizeActiveSessions() {
    const mainSessions = listMainSessions();
    const popupSessions = listPopupSessions();

    if (!mainSessions.some((session) => session.id === state.activeMainSessionId)) {
      state.activeMainSessionId = mainSessions[0]?.id;
    }

    if (!popupSessions.some((session) => session.id === state.activePopupSessionId)) {
      state.activePopupSessionId = popupSessions[0]?.id;
    }

    if (state.surfaceFocusPlacement === 'popup' && !popupSessions.some((session) => session.id === state.activePopupSessionId)) {
      state.surfaceFocusPlacement = mainSessions.length > 0 ? 'main' : 'popup';
    }

    if (state.surfaceFocusPlacement === 'main' && !mainSessions.some((session) => session.id === state.activeMainSessionId)) {
      state.surfaceFocusPlacement = popupSessions.length > 0 ? 'popup' : 'main';
    }

    if (popupSessions.length === 0 && state.utilitySectionId === 'popups') {
      state.utilitySectionId = 'inspector';
    }
  }

  function rememberSelection(entryId) {
    state.selectedWorkspaceItemId = entryId;
    const entry = getEntry(entryId);
    if (entry?.path) {
      expandFolderAncestors(entry.path);
    }
    if (runtime.status === 'ready' && typeof workspace.setSelectedResourceId === 'function') {
      workspace.setSelectedResourceId(entryId);
    }
  }

  function resetMountedSessions() {
    for (const session of getOpenSessions()) {
      getHostForPlacement(session.placement).close(session.id);
      releaseAssetLeaseIfUnused(session.resource.resourceId);
    }
    for (const lease of assetLeaseByResourceId.values()) {
      blobLedger.release(lease.id);
    }
    assetLeaseByResourceId.clear();
    activeTextDocuments.clear();
    state.activeMainSessionId = undefined;
    state.activePopupSessionId = undefined;
    state.surfaceFocusPlacement = 'main';
  }

  function disposePersistedWorkspace() {
    if (typeof unsubscribePersistence === 'function') {
      unsubscribePersistence();
      unsubscribePersistence = undefined;
    }
    if (persistedWorkspace?.disposePersistence) {
      persistedWorkspace.disposePersistence();
    }
    persistedWorkspace = undefined;
  }

  function openResourceEntry(entry, options = {}) {
    if (runtime.status !== 'ready') {
      return undefined;
    }

    const existingSession = findSessionForResource(entry.id);
    const requestedPlacement = options.placement ?? existingSession?.placement ?? (entry.kind === 'binary' ? 'popup' : 'main');
    const preferredSurfaceId = options.preferredSurfaceId;
    const forceReopen = options.forceReopen === true;
    if (
      existingSession &&
      !forceReopen &&
      existingSession.placement === requestedPlacement &&
      (!preferredSurfaceId || existingSession.contributionId === preferredSurfaceId)
    ) {
      getHostForPlacement(existingSession.placement).focus(existingSession.id);
      if (requestedPlacement === 'popup') {
        state.activePopupSessionId = existingSession.id;
        state.surfaceFocusPlacement = 'popup';
      } else {
        state.activeMainSessionId = existingSession.id;
        state.surfaceFocusPlacement = 'main';
      }
      rememberSelection(entry.id);
      emit();
      return existingSession;
    }

    const request = createSurfaceOpenRequest(entry, {
      placement: requestedPlacement,
      preferredSurfaceId,
    });
    const host = getHostForPlacement(request.placement);
    const session = host.open(request);

    if (existingSession) {
      getHostForPlacement(existingSession.placement).close(existingSession.id);
      releaseAssetLeaseIfUnused(existingSession.resource.resourceId);
    }

    if (request.placement === 'popup') {
      state.activePopupSessionId = session.id;
      state.surfaceFocusPlacement = 'popup';
    } else {
      state.activeMainSessionId = session.id;
      state.surfaceFocusPlacement = 'main';
    }

    rememberSelection(entry.id);
    normalizeActiveSessions();
    emit();
    return session;
  }

  function focusMainSession(sessionId) {
    if (runtime.status !== 'ready') {
      return;
    }

    const session = mainHost.focus(sessionId) ?? findSessionById(sessionId);
    if (!session) {
      return;
    }

    state.activeMainSessionId = session.id;
    state.surfaceFocusPlacement = 'main';
    rememberSelection(session.resource.resourceId);
    emit();
  }

  function focusPopupSession(sessionId) {
    if (runtime.status !== 'ready') {
      return;
    }

    const session = popupHost.focus(sessionId) ?? findSessionById(sessionId);
    if (!session) {
      return;
    }

    state.activePopupSessionId = session.id;
    state.surfaceFocusPlacement = 'popup';
    rememberSelection(session.resource.resourceId);
    emit();
  }

  function closeSession(sessionId) {
    const mainSession = mainHost.get(sessionId);
    if (mainSession && mainSession.state !== 'closed') {
      mainHost.close(sessionId);
      releaseAssetLeaseIfUnused(mainSession.resource.resourceId);
      normalizeActiveSessions();
      emit();
      return;
    }

    const popupSession = popupHost.get(sessionId);
    if (popupSession && popupSession.state !== 'closed') {
      popupHost.close(sessionId);
      releaseAssetLeaseIfUnused(popupSession.resource.resourceId);
      normalizeActiveSessions();
      emit();
    }
  }

  function selectWorkspaceItem(itemId) {
    if (runtime.status !== 'ready') {
      return;
    }

    rememberSelection(itemId);
    const entry = getEntry(itemId);
    if (!entry) {
      emit();
      return;
    }

    if (entry.kind === 'folder') {
      toggleWorkspaceFolder(itemId);
      emit();
      return;
    }

    openResourceEntry(entry);
  }

  function toggleWorkspaceFolder(folderId) {
    if (runtime.status !== 'ready') {
      return;
    }

    const folder = getEntry(folderId);
    if (!folder || folder.kind !== 'folder') {
      return;
    }

    const expandedFolderIds = new Set(state.expandedFolderIds);
    if (expandedFolderIds.has(folderId)) {
      expandedFolderIds.delete(folderId);
    } else {
      expandedFolderIds.add(folderId);
    }
    state.expandedFolderIds = [...expandedFolderIds];
    emit();
  }

  function toggleWorkspaceTree() {
    state.workspaceTreeCollapsed = !state.workspaceTreeCollapsed;
    emit();
  }

  function toggleUtilityPane() {
    state.utilityPaneOpen = !state.utilityPaneOpen;
    emit();
  }

  function setUtilitySection(sectionId) {
    state.utilityPaneOpen = true;
    state.utilitySectionId = sectionId;
    if (sectionId === 'popups' && state.activePopupSessionId) {
      state.surfaceFocusPlacement = 'popup';
    }
    emit();
  }

  function setWorkspaceTreeCollapsed(collapsed) {
    if (state.workspaceTreeCollapsed === collapsed) {
      return;
    }

    state.workspaceTreeCollapsed = collapsed;
    emit();
  }

  function setUtilityPaneCollapsed(collapsed) {
    const nextOpen = !collapsed;
    if (state.utilityPaneOpen === nextOpen) {
      return;
    }

    state.utilityPaneOpen = nextOpen;
    emit();
  }

  function expandFolderAncestors(path) {
    if (!path || path === '/') {
      return;
    }

    const nextExpandedIds = new Set(state.expandedFolderIds);
    let currentPath = dirnameWorkspacePath(path);
    while (currentPath && currentPath !== '/') {
      const folder = workspace.getEntryByPath(currentPath);
      if (folder?.kind === 'folder') {
        nextExpandedIds.add(folder.id);
      }
      currentPath = dirnameWorkspacePath(currentPath);
    }
    state.expandedFolderIds = [...nextExpandedIds];
  }

  function createVisibleTreeItems(allTreeItems) {
    const folderIdByPath = new Map(
      allTreeItems
        .filter((item) => item.kind === 'folder')
        .map((item) => [item.path, item.id]),
    );

    return allTreeItems
      .filter((item) => {
        let parentPath = dirnameWorkspacePath(item.path);
        while (parentPath && parentPath !== '/') {
          const parentId = folderIdByPath.get(parentPath);
          if (parentId && !state.expandedFolderIds.includes(parentId)) {
            return false;
          }
          parentPath = dirnameWorkspacePath(parentPath);
        }
        return true;
      })
      .map((item) => ({
        ...item,
        hasChildren: item.kind === 'folder' ? item.expanded : false,
        expanded: item.kind === 'folder' ? state.expandedFolderIds.includes(item.id) : false,
      }));
  }

  function updateTextResourceLanguage(resourceId, languageId) {
    if (runtime.status !== 'ready') {
      return;
    }

    const currentResource = workspace.getEntry(resourceId);
    if (!currentResource || currentResource.kind !== 'text') {
      return;
    }

    const nextLanguageMode = languageModes.find((mode) => mode.languageId === languageId);
    const currentDocument = activeTextDocuments.get(resourceId) ?? createTextEditorDocument(
      workspaceEntryToResourceRef(currentResource),
      currentResource.text,
      {
        languageId: currentResource.languageId,
        readOnly: false,
      },
    );
    const nextResource = workspace.saveTextResource({
      resourceId,
      text: currentDocument.text,
      languageId,
      mimeType: nextLanguageMode?.mimeTypes[0] ?? currentResource.mimeType,
    });
    activeTextDocuments.set(resourceId, {
      ...currentDocument,
      languageId,
      resource: workspaceEntryToResourceRef(nextResource),
    });
    rememberSelection(resourceId);
    emit();
  }

  async function persistWorkspace(reason) {
    if (runtime.status === 'ready' && typeof workspace.persistNow === 'function') {
      await workspace.persistNow(reason);
    }
  }

  function getSelectedEntry() {
    return getEntry(state.selectedWorkspaceItemId) ?? getDefaultSelection();
  }

  function getSelectedFolderPath() {
    const entry = getSelectedEntry();
    if (!entry) {
      return '/';
    }

    return entry.kind === 'folder' ? entry.path : dirnameWorkspacePath(entry.path);
  }

  function getActiveCommandSession() {
    normalizeActiveSessions();
    const preferred = state.surfaceFocusPlacement === 'popup'
      ? popupHost.get(state.activePopupSessionId)
      : mainHost.get(state.activeMainSessionId);
    if (preferred && preferred.state !== 'closed') {
      return preferred;
    }

    return mainHost.get(state.activeMainSessionId)
      ?? popupHost.get(state.activePopupSessionId);
  }

  function getSelectedResourceEntry() {
    const selectedEntry = getSelectedEntry();
    if (selectedEntry && selectedEntry.kind !== 'folder') {
      return selectedEntry;
    }

    const activeSession = getActiveCommandSession();
    if (!activeSession) {
      return undefined;
    }

    const activeEntry = getEntry(activeSession.resource.resourceId);
    return activeEntry?.kind === 'folder' ? undefined : activeEntry;
  }

  function buildCommandContext() {
    const selectedEntry = runtime.status === 'ready' ? getSelectedEntry() : undefined;
    const activeSession = runtime.status === 'ready' ? getActiveCommandSession() : undefined;
    const activeEntry = activeSession ? getEntry(activeSession.resource.resourceId) : undefined;
    const openWithTarget = selectedEntry?.kind === 'folder'
      ? activeEntry?.kind === 'folder' ? undefined : activeEntry
      : selectedEntry;
    const openWithPlacement = activeSession?.placement ?? (openWithTarget?.kind === 'binary' ? 'popup' : 'main');
    const availableSurfaceIds = openWithTarget
      ? createOpenWithSelection(surfaceRegistry, {
        resource: workspaceEntryToResourceRef(openWithTarget),
        placement: openWithPlacement,
        allowPopup: true,
        preferredSurfaceIds: activeSession ? [activeSession.contributionId] : undefined,
      }).candidates.map((candidate) => candidate.surfaceId)
      : [];

    return {
      runtimeStatus: runtime.status,
      workspaceReady: runtime.status === 'ready',
      selection: selectedEntry
        ? {
          resourceId: selectedEntry.id,
          kind: selectedEntry.kind,
          path: selectedEntry.path,
          mimeType: selectedEntry.kind === 'folder' ? undefined : selectedEntry.mimeType,
          languageId: selectedEntry.kind === 'text' ? selectedEntry.languageId : undefined,
        }
        : undefined,
      activeSurface: activeSession
        ? {
          sessionId: activeSession.id,
          contributionId: activeSession.contributionId,
          placement: activeSession.placement,
          resourceId: activeSession.resource.resourceId,
          resourceKind: activeEntry?.kind ?? activeSession.resource.kind,
          freshness: activeSession.freshness,
        }
        : undefined,
      availableSurfaceIds,
    };
  }

  function getAssetLease(resource) {
    const existing = assetLeaseByResourceId.get(resource.resourceId);
    if (existing) {
      return existing;
    }

    if (resource.kind !== 'binary') {
      return undefined;
    }

    const workspaceResource = workspace.getEntry(resource.resourceId);
    if (!workspaceResource || workspaceResource.kind !== 'binary') {
      return undefined;
    }

    const lease = blobLedger.acquire(resource, {
      type: workspaceResource.mimeType,
      data: workspaceResource.bytes,
    }, workspaceResource.mimeType);
    assetLeaseByResourceId.set(resource.resourceId, lease);
    return lease;
  }

  function createOpenWithControl(session, resource) {
    const selection = createOpenWithSelection(surfaceRegistry, {
      resource: workspaceEntryToResourceRef(resource),
      placement: session.placement,
      allowPopup: session.placement === 'popup',
      preferredSurfaceIds: [session.contributionId],
    });

    return {
      id: 'surface-open-with',
      label: 'Open with',
      description: `${selection.candidates.length} compatible surface${selection.candidates.length === 1 ? '' : 's'} for this resource.`,
      value: selection.selectedSurfaceId ?? '',
      disabled: selection.candidates.length <= 1,
      options: selection.candidates.map((candidate) => ({
        value: candidate.surfaceId,
        label: candidate.label,
        description: candidate.description,
      })),
      onChange(surfaceId) {
        openResourceEntry(resource, {
          preferredSurfaceId: surfaceId,
          placement: session.placement,
          forceReopen: true,
        });
      },
    };
  }

  function createLanguageControl(resource, surfaceModel) {
    return {
      id: 'surface-language-mode',
      label: 'Language mode',
      description: surfaceModel.languageMode.parserBacked
        ? 'Parser-backed CodeMirror mode active.'
        : 'Metadata only; source-editor fallback remains explicit for this format.',
      value: surfaceModel.languageMode.languageId,
      disabled: false,
      options: languageModes.map((mode) => ({
        value: mode.languageId,
        label: `${mode.label}${mode.parserBacked ? ' - parser-backed' : ' - metadata only'}`,
      })),
      onChange(languageId) {
        updateTextResourceLanguage(resource.id, languageId);
      },
    };
  }

  function createSurfaceView(session) {
    const resource = getEntry(session.resource.resourceId);
    if (!resource) {
      return createWelcomeView();
    }

    const openWith = surfaceRegistry.get(session.contributionId)?.label ?? 'Surface';
    const controls = [createOpenWithControl(session, resource)];
    const badge = resource.metadata.badge;
    const icon = resolveEntryIcon(resource);
    const resourceTitle = resource.metadata.title ?? basenameWorkspacePath(resource.path) ?? resource.path;
    if (resource.kind === 'text') {
      const document = activeTextDocuments.get(resource.id) ?? createTextEditorDocument(
        workspaceEntryToResourceRef(resource),
        resource.text,
        {
          languageId: resource.languageId,
          readOnly: false,
        },
      );
      activeTextDocuments.set(resource.id, document);
      const surface = createCodeMirrorTextEditorSurface({
        document,
        diagnostics: [],
        onChange(nextDocument) {
          workspace.saveTextResource({
            resourceId: resource.id,
            text: nextDocument.text,
          });
          activeTextDocuments.set(resource.id, nextDocument);
          getHostForPlacement(session.placement).markCurrent(session.id);
        },
      });
      return {
        id: session.id,
        kind: 'surface',
        mountId: `${session.id}:${surface.model.languageMode.languageId}:${session.contributionId}`,
        title: resourceTitle,
        path: resource.path,
        summary: surface.model.summary,
        badge,
        icon,
        openWith,
        state: session.state,
        placement: session.placement,
        detail: surface.model.languageLabel,
        readOnly: false,
        inspectorSections: [],
        controls: [...controls, createLanguageControl(resource, surface.model)],
        surface,
      };
    }

    const resourceRef = workspaceEntryToResourceRef(resource);
    const lease = getAssetLease(resourceRef);
    const binding = createWorkspaceAssetBinding({
      resource: resourceRef,
      workspaceResource: resource,
      title: resource.metadata.title ?? resource.path,
      provenance: 'workspace-bound',
    });
    const readyBinding = lease ? markAssetBindingReady(binding, lease.url) : binding;
    const createAssetSurface = assetSurfaceFactoryByContributionId[session.contributionId] ?? createAssetViewerSurface;
    const surface = createAssetSurface(
      {
        resource: resourceRef,
        workspaceResource: resource,
        title: resource.metadata.title ?? resource.path,
        provenance: 'workspace-bound',
      },
      {
        binding: readyBinding,
        lease,
      },
    );
    return {
      id: session.id,
      kind: 'surface',
      mountId: `${session.id}:${session.contributionId}`,
      title: resourceTitle,
      path: resource.path,
      summary: surface.model.summary,
      badge,
      icon,
      openWith,
      state: session.state,
      placement: session.placement,
      detail: surface.model.mimeType,
      readOnly: true,
      inspectorSections: [
        {
          eyebrow: 'Resource binding',
          icon: 'fileImage',
          title: 'Asset state',
          rows: [
            { label: 'State', value: surface.model.state },
            { label: 'Source', value: surface.model.provenance },
            { label: 'Blob URL', value: surface.model.blobUrl ? 'bound' : 'unbound' },
            { label: 'Action', value: surface.model.blobUrl ? 'Download asset' : 'No download link' },
          ],
        },
      ],
      controls,
      surface,
    };
  }

  function describeSelectedEntry() {
    if (runtime.status === 'loading') {
      return {
        title: 'Browser-managed workspace',
        path: `IndexedDB / ${workspaceDatabaseName}`,
        kind: 'folder',
        icon: 'status',
        detail: 'Hydrating the Dexie-backed workspace before surfaces and command routes are mounted.',
      };
    }

    if (runtime.status === 'error') {
      return {
        title: storageFailure?.title ?? 'Workspace storage unavailable',
        path: `IndexedDB / ${workspaceDatabaseName}`,
        kind: 'folder',
        icon: 'warning',
        attention: 'warning',
        detail: storageFailure?.detail ?? 'Retry the workspace load or reset browser storage to recover.',
      };
    }

    const entry = getSelectedEntry();
    if (!entry) {
      return {
        title: 'Workspace root',
        path: '/',
        kind: 'folder',
        icon: 'folder',
        detail: 'The browser-managed workspace is ready but no entry is currently selected.',
      };
    }

    return {
      title: entry.metadata.title ?? entry.path,
      path: entry.path,
      kind: entry.kind,
      badge: entry.metadata.badge,
      icon: resolveEntryIcon(entry),
      attention: entry.metadata.badge?.repairedFromKey ? 'warning' : undefined,
      detail: entry.kind === 'folder'
        ? 'Folder selection drives workspace-scoped commands like create, import, export, rename, and delete.'
        : entry.kind === 'text'
          ? 'Text resources open in the main workbench session strip and accept language-mode commands.'
          : 'Binary resources open in popup sessions and expose the existing download action through shell commands.',
    };
  }

  function getActiveMainView() {
    if (runtime.status === 'loading') {
      return createLoadingView();
    }

    const session = state.activeMainSessionId ? mainHost.get(state.activeMainSessionId) : undefined;
    if (!session || session.state === 'closed') {
      return createWelcomeView();
    }

    return createSurfaceView(session);
  }

  function getActivePopupView() {
    if (runtime.status !== 'ready') {
      return undefined;
    }

    const session = state.activePopupSessionId ? popupHost.get(state.activePopupSessionId) : undefined;
    if (!session || session.state === 'closed') {
      return undefined;
    }

    return createSurfaceView(session);
  }

  function describeActiveResource() {
    if (runtime.status !== 'ready') {
      return undefined;
    }

    const activeSession = getActiveCommandSession();
    const entry = activeSession
      ? getEntry(activeSession.resource.resourceId)
      : getSelectedEntry();
    if (!entry || entry.kind === 'folder') {
      return undefined;
    }

    const kindDetail = entry.kind === 'text'
      ? (entry.languageId ? entry.languageId.toUpperCase() : 'TEXT')
      : entry.mimeType === 'image/svg+xml'
        ? 'SVG'
        : entry.mimeType === 'application/pdf'
          ? 'PDF'
          : entry.mimeType?.startsWith('image/')
            ? 'IMAGE'
            : 'BINARY';
    return {
      title: entry.metadata.title ?? basenameWorkspacePath(entry.path) ?? entry.path,
      detail: `${kindDetail} / ${activeSession?.placement === 'popup' ? 'Popup surface' : 'Main surface'}`,
      placement: activeSession?.placement ?? 'main',
      badge: entry.metadata.badge,
      icon: resolveEntryIcon(entry),
      attention: entry.metadata.badge?.repairedFromKey ? 'warning' : undefined,
    };
  }

  function collectAffectedEntryIds(entry) {
    if (!entry) {
      return [];
    }

    if (entry.kind !== 'folder') {
      return [entry.id];
    }

    const snapshot = workspace.snapshot();
    const descendantPrefix = `${normalizeWorkspacePath(entry.path)}/`;
    return [
      entry.id,
      ...snapshot.folders
        .filter((folder) => folder.id !== entry.id && folder.path.startsWith(descendantPrefix))
        .map((folder) => folder.id),
      ...snapshot.resources
        .filter((resource) => resource.path.startsWith(descendantPrefix))
        .map((resource) => resource.id),
    ];
  }

  function assertWorkspacePathAvailable(path, ignoreResourceId) {
    const normalizedPath = normalizeWorkspacePath(path);
    const existingEntry = workspace.getEntryByPath(normalizedPath);
    if (existingEntry && existingEntry.id !== ignoreResourceId) {
      throw new Error(`Workspace path already exists: ${normalizedPath}`);
    }
    return normalizedPath;
  }

  function syncSelectionAfterMutation(preferredResourceId) {
    const preferredEntry = preferredResourceId ? getEntry(preferredResourceId) : undefined;
    state.selectedWorkspaceItemId = preferredEntry?.id ?? getDefaultSelection()?.id;
  }

  function resolveTargetEntryForCommands() {
    return getSelectedEntry();
  }

  function resolveTargetResourceForCommands() {
    return getSelectedResourceEntry();
  }

  async function createFolderCommand() {
    const defaultPath = joinWorkspacePath(getSelectedFolderPath(), 'new-folder');
    const requestedPath = window.prompt('Folder path', defaultPath);
    if (!requestedPath) {
      return;
    }

    const nextPath = assertWorkspacePathAvailable(requestedPath);
    const folder = workspace.createFolder({
      path: nextPath,
      title: basenameWorkspacePath(nextPath),
    });
    await persistWorkspace('workspace.new-folder');
    expandFolderAncestors(folder.path);
    rememberSelection(folder.id);
    emit();
  }

  async function createResourceCommand() {
    const kind = window.prompt('Resource kind (text or binary)', 'text')?.trim().toLowerCase();
    if (!kind) {
      return;
    }

    if (kind !== 'text' && kind !== 'binary') {
      throw new Error(`Unsupported resource kind: ${kind}`);
    }

    if (kind === 'text') {
      const defaultPath = joinWorkspacePath(getSelectedFolderPath(), 'new-resource.md');
      const requestedPath = window.prompt('Text resource path', defaultPath);
      if (!requestedPath) {
        return;
      }

      const nextPath = assertWorkspacePathAvailable(requestedPath);
      const languageId = inferLanguageId({ path: nextPath, fallback: 'plaintext' });
      const languageDefinition = getLanguageDefinition(languageId);
      const resource = workspace.createTextResource({
        path: nextPath,
        title: basenameWorkspacePath(nextPath),
        text: '',
        languageId,
        mimeType: languageDefinition?.mimeTypes[0] ?? 'text/plain',
      });
      await persistWorkspace('workspace.new-resource');
      expandFolderAncestors(resource.path);
      openResourceEntry(resource, { placement: 'main' });
      return;
    }

    const file = await pickLocalFile();
    if (!file) {
      return;
    }

    const defaultPath = joinWorkspacePath(getSelectedFolderPath(), file.name || 'resource.bin');
    const requestedPath = window.prompt('Binary resource path', defaultPath);
    if (!requestedPath) {
      return;
    }

    const nextPath = assertWorkspacePathAvailable(requestedPath);
    const resource = workspace.createBinaryResource({
      path: nextPath,
      title: basenameWorkspacePath(nextPath),
      bytes: await readFileBytes(file),
      mimeType: file.type || 'application/octet-stream',
    });
    await persistWorkspace('workspace.new-resource');
    expandFolderAncestors(resource.path);
    openResourceEntry(resource, { placement: 'popup' });
  }

  async function importWorkspaceCommand() {
    const policy = window.prompt('Import conflict policy (error, skip, replace)', 'replace')?.trim().toLowerCase();
    if (!policy) {
      return;
    }

    if (!['error', 'skip', 'replace'].includes(policy)) {
      throw new Error(`Unsupported import conflict policy: ${policy}`);
    }

    const file = await pickLocalFile({ accept: '.zip,application/zip' });
    if (!file) {
      return;
    }

    const imported = importWorkspaceFromZip(await readFileBytes(file), {
      existingState: workspace.snapshot(),
      conflictPolicy: policy,
    });
    resetMountedSessions();
    workspace.replaceState(imported.state);
    await persistWorkspace('workspace.import-workspace');
    syncSelectionAfterMutation(workspace.getManifest().selectedResourceId);

    const nextEntry = getSelectedEntry();
    if (nextEntry && nextEntry.kind !== 'folder') {
      openResourceEntry(nextEntry, {
        placement: nextEntry.kind === 'binary' ? 'popup' : 'main',
      });
      return;
    }

    emit();
  }

  async function exportWorkspaceCommand() {
    const manifest = workspace.getManifest();
    const bytes = exportWorkspaceToZip(workspace);
    downloadBytes(createZipFilename(manifest.name, 'textforge-workspace'), bytes, 'application/zip');
  }

  async function exportSelectedFolderCommand() {
    const entry = resolveTargetEntryForCommands();
    if (!entry || entry.kind !== 'folder') {
      return;
    }

    const bytes = exportWorkspaceFolderToZip(workspace, entry.path);
    downloadBytes(createZipFilename(entry.metadata.title ?? basenameWorkspacePath(entry.path), 'workspace-folder'), bytes, 'application/zip');
  }

  async function renameSelectedEntryCommand() {
    const entry = resolveTargetEntryForCommands();
    if (!entry) {
      return;
    }

    const nextPathInput = window.prompt('Rename path', entry.path);
    if (!nextPathInput) {
      return;
    }

    const nextPath = assertWorkspacePathAvailable(nextPathInput, entry.id);
    if (nextPath === entry.path) {
      return;
    }

    const affectedIds = collectAffectedEntryIds(entry);
    const renamed = workspace.renameEntry(entry.id, nextPath);
    await persistWorkspace('workspace.rename-selected');
    syncSelectionAfterMutation(renamed?.id ?? entry.id);

    for (const session of getOpenSessions().filter((candidate) => affectedIds.includes(candidate.resource.resourceId))) {
      const resource = getEntry(session.resource.resourceId);
      if (resource && resource.kind !== 'folder') {
        openResourceEntry(resource, {
          placement: session.placement,
          preferredSurfaceId: session.contributionId,
          forceReopen: true,
        });
      }
    }

    emit();
  }

  async function deleteSelectedEntryCommand() {
    const entry = resolveTargetEntryForCommands();
    if (!entry) {
      return;
    }

    const confirmed = window.confirm(`Delete ${entry.metadata.title ?? entry.path}?`);
    if (!confirmed) {
      return;
    }

    const affectedIds = collectAffectedEntryIds(entry);
    workspace.deleteEntry(entry.id);
    for (const session of getOpenSessions().filter((candidate) => affectedIds.includes(candidate.resource.resourceId))) {
      closeSession(session.id);
    }
    await persistWorkspace('workspace.delete-selected');
    syncSelectionAfterMutation();
    emit();
  }

  async function requestWorkspaceResetCommand() {
    requestStorageReset();
  }

  async function retryWorkspaceLoadCommand() {
    await retryStorageInitialization();
  }

  async function closeActiveSurfaceCommand() {
    const session = getActiveCommandSession();
    if (session) {
      closeSession(session.id);
    }
  }

  function closeActivePopupSurface() {
    if (state.activePopupSessionId) {
      closeSession(state.activePopupSessionId);
    }
  }

  async function refreshActiveSurfaceCommand() {
    const session = getActiveCommandSession();
    if (!session) {
      return;
    }

    const resource = getEntry(session.resource.resourceId);
    if (resource && resource.kind !== 'folder') {
      openResourceEntry(resource, {
        placement: session.placement,
        preferredSurfaceId: session.contributionId,
        forceReopen: true,
      });
    }
  }

  async function moveActiveSurfaceCommand(targetPlacement) {
    const session = getActiveCommandSession();
    if (!session || session.placement === targetPlacement) {
      return;
    }

    const resource = getEntry(session.resource.resourceId);
    if (resource && resource.kind !== 'folder') {
      openResourceEntry(resource, {
        placement: targetPlacement,
        preferredSurfaceId: session.contributionId,
        forceReopen: true,
      });
    }
  }

  async function focusMainSurfaceCommand() {
    if (state.activeMainSessionId) {
      focusMainSession(state.activeMainSessionId);
    }
  }

  async function focusPopupSurfaceCommand() {
    if (state.activePopupSessionId) {
      focusPopupSession(state.activePopupSessionId);
    } else {
      state.utilityPaneOpen = true;
      state.utilitySectionId = 'popups';
      emit();
    }
  }

  async function openWithSurfaceCommand(commandId) {
    const surfaceId = commandId.slice('surface.open-with:'.length);
    const resource = resolveTargetResourceForCommands();
    if (!resource) {
      return;
    }

    const activeSession = getActiveCommandSession();
    const placement = activeSession?.resource.resourceId === resource.id
      ? activeSession.placement
      : resource.kind === 'binary' ? 'popup' : 'main';
    openResourceEntry(resource, {
      placement,
      preferredSurfaceId: surfaceId,
      forceReopen: true,
    });
  }

  async function setEditorLanguageCommand(commandId) {
    const languageId = commandId.slice('editor.set-language:'.length);
    const resource = resolveTargetResourceForCommands();
    if (!resource || resource.kind !== 'text') {
      return;
    }

    updateTextResourceLanguage(resource.id, languageId);
  }

  async function downloadSelectedAssetCommand() {
    const resource = resolveTargetResourceForCommands();
    if (!resource || resource.kind !== 'binary') {
      return;
    }

    downloadBytes(
      basenameWorkspacePath(resource.path) || 'asset.bin',
      resource.bytes,
      resource.mimeType ?? 'application/octet-stream',
    );
  }

  function registerCommandHandlers() {
    commandDispatcher
      .register('workspace.new-folder', createFolderCommand)
      .register('workspace.new-resource', createResourceCommand)
      .register('workspace.import-workspace', importWorkspaceCommand)
      .register('workspace.export-workspace', exportWorkspaceCommand)
      .register('workspace.export-selected-folder', exportSelectedFolderCommand)
      .register('workspace.rename-selected', renameSelectedEntryCommand)
      .register('workspace.delete-selected', deleteSelectedEntryCommand)
      .register('workspace.reset-storage', requestWorkspaceResetCommand)
      .register('workspace.retry-storage', retryWorkspaceLoadCommand)
      .register('surface.close-active', closeActiveSurfaceCommand)
      .register('surface.refresh-active', refreshActiveSurfaceCommand)
      .register('surface.move-active-to-main', () => moveActiveSurfaceCommand('main'))
      .register('surface.move-active-to-popup', () => moveActiveSurfaceCommand('popup'))
      .register('surface.focus-main-session', focusMainSurfaceCommand)
      .register('surface.focus-popup-session', focusPopupSurfaceCommand)
      .register('asset.download-selected', downloadSelectedAssetCommand);

    for (const surfaceContribution of surfaceRegistry.list()) {
      commandDispatcher.register(`surface.open-with:${surfaceContribution.id}`, ({ command }) => openWithSurfaceCommand(command.id));
    }

    for (const languageMode of languageModes) {
      commandDispatcher.register(`editor.set-language:${languageMode.languageId}`, ({ command }) => setEditorLanguageCommand(command.id));
    }
  }

  async function executeCommand(commandId) {
    const result = await commandDispatcher.execute(commandId);
    if (!result.handled && !commandRegistry.get(commandId)) {
      throw new Error(`Unknown shell command: ${commandId}`);
    }
    return result;
  }

  async function hydrateWorkspace(options = {}) {
    runtime.status = 'loading';
    storageFailure = undefined;
    state.storageResetPending = false;
    if (options.resetStorage) {
      state.utilityPaneOpen = true;
      state.utilitySectionId = 'storage';
    }
    resetMountedSessions();
    disposePersistedWorkspace();
    emit();

    try {
      if (options.resetStorage) {
        await resetWorkspaceDexieStorage({ databaseName: workspaceDatabaseName });
      }

      const hydrated = await createPersistedWorkspaceService({
        workspaceId: 'textforge-shell',
        name: 'TextForge Workspace',
        now: createTimestampFactory(),
        idFactory: createSequentialIdFactory('workspace'),
        seed: createSeedWorkspaceState(),
        storageOptions: {
          databaseName: workspaceDatabaseName,
        },
      });
      persistedWorkspace = hydrated.workspace;
      workspace = hydrated.workspace;
      hydrationSource = hydrated.hydrationSource;
      unsubscribePersistence = hydrated.workspace.subscribePersistence(() => emit());
      runtime.status = 'ready';

      const selectedEntry = getEntry(workspace.getManifest().selectedResourceId) ?? getDefaultSelection();
      rememberSelection(selectedEntry?.id);
      normalizeActiveSessions();

      const presetEntry = screenshotPreset.openResourcePath
        ? workspace.getEntryByPath(screenshotPreset.openResourcePath)
        : undefined;
      const initialEntry = presetEntry ?? selectedEntry;

      if (initialEntry && initialEntry.kind !== 'folder' && listMainSessions().length === 0 && listPopupSessions().length === 0) {
        openResourceEntry(initialEntry, {
          placement: screenshotPreset.openPlacement ?? (initialEntry.kind === 'binary' ? 'popup' : 'main'),
        });
      } else {
        emit();
      }
    } catch (error) {
      workspace = createWorkspaceService({
        workspaceId: 'textforge-shell',
        name: 'TextForge Workspace',
        now: createTimestampFactory(),
        idFactory: createSequentialIdFactory('workspace'),
      });
      hydrationSource = 'seed';
      runtime.status = 'error';
      storageFailure = createStorageFailure(error);
      state.selectedWorkspaceItemId = undefined;
      state.utilityPaneOpen = true;
      state.utilitySectionId = 'storage';
      emit();
    }
  }

  function requestStorageReset() {
    state.storageResetPending = true;
    state.utilityPaneOpen = true;
    state.utilitySectionId = 'storage';
    emit();
  }

  function cancelStorageReset() {
    state.storageResetPending = false;
    emit();
  }

  async function confirmStorageReset() {
    await hydrateWorkspace({ resetStorage: true });
  }

  async function retryStorageInitialization() {
    await hydrateWorkspace();
  }

  function buildSnapshot() {
    normalizeActiveSessions();
    const treeItems = runtime.status === 'ready'
      ? createVisibleTreeItems(createWorkspaceTreeItems(workspace.snapshot()))
      : [];
    const mainSessions = listMainSessions();
    const popupSessions = listPopupSessions();
    const persistenceStatus = runtime.status === 'ready'
      ? workspace.getPersistenceStatus()
      : {
        state: runtime.status === 'loading' ? 'persisting' : 'error',
        driver: 'dexie',
        databaseName: workspaceDatabaseName,
        schemaVersion: 1,
        browserManaged: true,
        lastSavedAt: undefined,
        pendingReason: runtime.status === 'loading' ? 'hydrate' : 'recovery-required',
        error: storageFailure ? { code: storageFailure.code, message: storageFailure.detail } : undefined,
      };
    const commandContext = buildCommandContext();
    const toolbarCommands = [];
    const commandMenus = commandRegistry.listMenus(commandContext).map((group) => ({
      id: group.id,
      label: group.label,
      icon: resolveCommandIcon(group.commands[0]?.id ?? 'command'),
      items: group.commands.map((command) => ({
        commandId: command.id,
        label: command.label,
        description: command.description,
        icon: resolveCommandIcon(command.id),
        shortcut: command.hotkey,
        disabled: !command.enabled,
      })),
    }));
    const commandPaletteEntries = commandRegistry.resolve(commandContext)
      .filter((command) => command.visible)
      .map((command) => ({
        commandId: command.id,
        label: command.label,
        description: command.description,
        group: command.menu?.label ?? command.category ?? command.packageId,
        icon: resolveCommandIcon(command.id),
        shortcut: command.hotkey,
        disabled: !command.enabled,
        keywords: command.keywords,
      }));
    const mainFrame = createMainSessionTabStrip(mainSessions.map((session) => ({
      ...session,
      title: getEntry(session.resource.resourceId)?.metadata.title ?? getEntry(session.resource.resourceId)?.path ?? session.title,
    })), {
      activeTabId: state.activeMainSessionId,
    });
    const popupFrame = {
      id: 'popup-session-tab-strip',
      title: 'Popup sessions',
      placement: 'popup',
      layout: 'tabs',
      tabs: popupSessions.map((session) => {
        const resource = getEntry(session.resource.resourceId);
        return createSurfaceSessionTab({
          ...session,
          title: resource?.metadata.title ?? resource?.path ?? session.title,
        });
      }),
      activeTabId: state.activePopupSessionId,
    };
    const selectedResourceId = runtime.status === 'ready'
      ? state.selectedWorkspaceItemId
      : undefined;
    const badgeDiagnostics = runtime.status === 'ready'
      ? listWorkspaceBadgeDiagnostics(workspace.snapshot())
      : [];
    const activeResource = describeActiveResource();
    const chromeModel = createWorkbenchChromeModel({
      workspaceTree: createWorkspaceTreeFrameModel({
        items: treeItems,
        rootLabel: runtime.status === 'ready'
          ? workspace.snapshot().manifest.name ?? 'Workspace root'
          : 'Browser-managed workspace',
        selectedResourceId,
      }),
      surfaceFrame: mainFrame,
      toolbarSlots: toolbarCommands.map((command) =>
        createToolbarSlot({
          id: command.id,
          label: command.label,
          kind: 'command',
          description: command.description,
          icon: resolveCommandIcon(command.id),
          pinned: command.toolbar?.kind === 'primary',
          disabled: !command.enabled,
          shortcut: command.hotkey,
        })),
      statusBadges: [
        ...(popupSessions.length > 0
          ? [
            createStatusBadge({
              id: 'popup-status',
              label: `${popupSessions.length} popup${popupSessions.length === 1 ? '' : 's'} open`,
              tone: 'info',
              icon: 'utility',
              detail: 'Popup surfaces stay in a floating overlay outside the main document strip.',
            }),
          ]
          : []),
        ...(badgeDiagnostics.length > 0
          ? [
            createStatusBadge({
              id: 'badge-status',
              label: `${badgeDiagnostics.length} badge repair${badgeDiagnostics.length === 1 ? '' : 's'}`,
              tone: 'warning',
              icon: 'warning',
              detail: 'A resource badge key was repaired to keep identity badges unique and deterministic.',
            }),
          ]
          : []),
        ...(persistenceStatus.state === 'persisting' || persistenceStatus.state === 'error'
          ? [
            createStatusBadge({
              id: 'storage-status',
              label: persistenceStatus.state === 'error' ? 'Storage issue' : 'Saving workspace',
              tone: persistenceStatus.state === 'error' ? 'warning' : 'info',
              icon: persistenceStatus.state === 'error' ? 'warning' : 'status',
              detail: `${persistenceStatus.driver} / IndexedDB / ${persistenceStatus.databaseName}`,
            }),
          ]
          : []),
      ].filter(Boolean),
    });

    return {
      runtime: {
        status: runtime.status,
        hydrationSource,
        storageFailure,
      },
      persistenceStatus,
      chromeModel,
      commandMenus,
      commandPaletteEntries,
      contributionPacks,
      badgeDiagnostics,
      popupFrame,
      selectedEntry: describeSelectedEntry(),
      activeResource,
      activeMainView: getActiveMainView(),
      activePopupView: getActivePopupView(),
      utilitySections,
      state: {
        ...state,
      },
    };
  }

  function snapshot() {
    if (!cachedSnapshot) {
      cachedSnapshot = buildSnapshot();
    }

    return cachedSnapshot;
  }

  function dispose() {
    for (const lease of assetLeaseByResourceId.values()) {
      blobLedger.release(lease.id);
    }
    assetLeaseByResourceId.clear();
    activeTextDocuments.clear();
    listeners.clear();
    disposePersistedWorkspace();
  }

  registerCommandHandlers();
  void hydrateWorkspace();

  return {
    subscribe,
    snapshot,
    dispose,
    actions: {
      cancelStorageReset,
      closeActivePopupSurface,
      closeSession,
      confirmStorageReset,
      executeCommand,
      focusMainSession,
      focusPopupSession,
      requestStorageReset,
      retryStorageInitialization,
      selectWorkspaceItem,
      setUtilityPaneCollapsed,
      setWorkspaceTreeCollapsed,
      setUtilitySection,
      toggleWorkspaceFolder,
      toggleUtilityPane,
      toggleWorkspaceTree,
    },
  };
}

function useWorkbenchSnapshot(controller) {
  return React.useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
}

function SurfaceMount({ view }) {
  const mountRef = React.useRef(null);

  React.useEffect(() => {
    if (!view?.surface || !mountRef.current) {
      return undefined;
    }

    const dispose = view.surface.mount(mountRef.current);
    return () => {
      if (typeof dispose === 'function') {
        dispose();
      }
      if (mountRef.current) {
        mountRef.current.replaceChildren();
      }
    };
  }, [view?.mountId]);

  return element('div', {
    ref: mountRef,
    className: 'tf-surface-mount',
    'data-surface-id': view?.id,
  });
}

function WelcomeState({ hydrationSource }) {
  return element(TextForgeEmptyState, {
    eyebrow: 'Phase 3.5',
    icon: 'status',
    title: 'Popup overlays and calmer shell chrome',
    children: element(
      React.Fragment,
      null,
      element(
        'p',
        null,
        hydrationSource === 'storage'
          ? 'The shell reopened the browser-managed workspace, rebuilt the local command registry, restored the resizable shell rails, and kept popup sessions separate from the main document strip.'
          : 'The shell seeded a fresh browser-managed workspace with resizable side rails, popup overlays, and the existing local command system.',
      ),
      element(
        'ul',
        { className: 'tf-welcome__list' },
        element('li', null, 'Deterministic resource badges stay compact across the tree, tabs, and inspector'),
        element('li', null, 'Main documents stay central while the left tree and right panel resize within bounded widths'),
        element('li', null, 'Binary and popup-ready surfaces open as in-app overlays instead of side-panel content'),
        element('li', null, 'No plugin manager, remote package loading, or advanced tab-management pulled forward'),
      ),
    ),
  });
}

function LoadingState() {
  return element(TextForgeCallout, {
    tone: 'info',
    title: 'Opening browser workspace',
    children: element(
      React.Fragment,
      null,
      element('p', null, 'TextForge is opening the browser-managed Dexie workspace before command routes and surface sessions are rebuilt.'),
      element('p', null, 'Open tabs, popup sessions, and side-panel layout remain ordinary local UI state; the workspace content and badge assignments persist.'),
    ),
  });
}

function RecoveryState({ controller, snapshot }) {
  return element(TextForgeCallout, {
    tone: 'warning',
    title: snapshot.runtime.storageFailure?.title ?? 'Workspace storage unavailable',
    actions: [
      element(TextForgeToolbarButton, {
        key: 'retry-storage',
        kind: 'secondary',
        label: 'Retry',
        onPress: controller.actions.retryStorageInitialization,
      }),
      element(TextForgeToolbarButton, {
        key: 'reset-storage',
        kind: 'primary',
        label: snapshot.state.storageResetPending ? 'Reset Browser Workspace Now' : 'Reset Browser Workspace',
        onPress: snapshot.state.storageResetPending
          ? controller.actions.confirmStorageReset
          : controller.actions.requestStorageReset,
      }),
    ],
    children: element(
      React.Fragment,
      null,
      element('p', null, snapshot.runtime.storageFailure?.detail ?? 'Retry the workspace load or reset browser storage to recover.'),
      snapshot.state.storageResetPending
        ? element('p', null, 'Confirm the reset from the Browser Storage utility section to clear the stored workspace and rebuild the seed content.')
        : null,
    ),
  });
}

function SurfaceDetails({ view }) {
  const folderPath = view.path ? dirnameWorkspacePath(view.path) : '/';
  return element(
    'aside',
    { className: 'tf-surface-details' },
    element(
      TextForgeInspectorCard,
      {
        eyebrow: 'Inspector',
        icon: view.icon,
        title: view.title,
      },
      element(
        'div',
        { className: 'tf-surface-details__identity' },
        element(TextForgeResourceBadge, {
          active: true,
          attention: view.badge?.repairedFromKey ? 'warning' : undefined,
          badge: view.badge,
          label: `${view.title} badge`,
          size: 'regular',
        }),
        element(
          'div',
          { className: 'tf-surface-details__copy' },
          element('p', { className: 'tf-surface-details__summary' }, view.summary),
          view.detail ? element('p', { className: 'tf-surface-details__detail' }, view.detail) : null,
        ),
      ),
      element(
        'dl',
        { className: 'tf-meta-list tf-surface-details__meta' },
        element('div', null, element('dt', null, 'Folder'), element('dd', null, folderPath)),
        element('div', null, element('dt', null, 'Open with'), element('dd', null, view.openWith)),
        element('div', null, element('dt', null, 'Surface'), element('dd', null, view.readOnly ? 'Read-only viewer' : 'Editable source surface')),
      ),
    ),
    element(
      TextForgeInspectorCard,
      {
        eyebrow: 'Session state',
        icon: view.badge?.repairedFromKey ? 'warning' : 'status',
        title: 'Placement and access',
      },
      element(
        'dl',
        { className: 'tf-meta-list' },
        element('div', null, element('dt', null, 'Placement'), element('dd', null, view.placement)),
        element('div', null, element('dt', null, 'State'), element('dd', null, view.state)),
        element('div', null, element('dt', null, 'Mode'), element('dd', null, view.detail ?? 'Surface metadata')),
      ),
    ),
    view.controls.length > 0
      ? element(
        TextForgeInspectorCard,
        {
          eyebrow: 'Controls',
          icon: 'command',
          title: 'Surface controls',
        },
        element(
          'div',
          { className: 'tf-surface-details__controls' },
          ...view.controls.map((control) =>
            element(TextForgeSelectField, { key: control.id, control })),
        ),
      )
      : element(TextForgeInspectorCard, {
        eyebrow: 'Controls',
        icon: 'info',
        title: 'No extra controls',
        children: element('p', { className: 'tf-empty' }, 'This surface is readable without additional switches.'),
      }),
    ...(view.inspectorSections ?? []).map((section) =>
      element(
        TextForgeInspectorCard,
        {
          key: section.title,
          eyebrow: section.eyebrow,
          icon: section.icon,
          title: section.title,
        },
        element(
          'dl',
          { className: 'tf-meta-list' },
          ...section.rows.map((row) =>
            element(
              'div',
              { key: row.label },
              element('dt', null, row.label),
              element('dd', null, row.value),
            )),
        ),
      )),
    view.badge?.repairedFromKey
      ? element(
        TextForgeInspectorCard,
        {
          eyebrow: 'Badge repair',
          icon: 'warning',
          title: 'Collision repair applied',
        },
        element(
          'p',
          { className: 'tf-empty' },
          `This resource kept a deterministic badge by repairing a duplicate key from ${view.badge.repairedFromKey}.`,
        ),
      )
      : null,
  );
}

function WorkbenchDetailsCard() {
  return element(
    TextForgeInspectorCard,
    {
      eyebrow: 'Workbench',
      icon: 'status',
      title: 'Shell context',
    },
    element(
      'p',
      { className: 'tf-surface-details__summary' },
      'Resizable shell rails and the resizable right panel keep popup overlays and local ui state inside the browser-managed Dexie workspace.',
    ),
  );
}

function ContributionRegistryView({ packs }) {
  return element(
    'div',
    { className: 'tf-registry' },
    ...packs.map((pack) =>
      element(
        'article',
        { key: pack.packageId ?? pack.id, className: 'tf-registry__card' },
        element(
          'div',
          { className: 'tf-registry__header' },
          element('strong', null, pack.packageId ?? pack.id),
          element('span', null, `${pack.commands.length} commands / ${pack.surfaces.length} surfaces`),
        ),
        element('p', null, 'Package contribution pack available to the workbench shell.'),
      )),
  );
}

function StoragePaneView({ controller, snapshot }) {
  const { persistenceStatus } = snapshot;
  const statusTone = persistenceStatus.state === 'error'
    ? 'warning'
    : persistenceStatus.state === 'persisting'
      ? 'info'
      : 'success';

  return element(
    'div',
    { className: 'tf-storage' },
    element(TextForgeCallout, {
      tone: statusTone,
      title: 'Browser-managed workspace boundary',
      actions: snapshot.runtime.status === 'loading'
        ? []
        : snapshot.state.storageResetPending
          ? [
            element(TextForgeToolbarButton, {
              key: 'cancel-reset',
              kind: 'secondary',
              label: 'Cancel',
              onPress: controller.actions.cancelStorageReset,
            }),
            element(TextForgeToolbarButton, {
              key: 'confirm-reset',
              kind: 'primary',
              label: 'Reset Browser Workspace Now',
              onPress: controller.actions.confirmStorageReset,
            }),
          ]
          : [
            element(TextForgeToolbarButton, {
              key: 'request-reset',
              kind: 'primary',
              label: 'Reset Browser Workspace',
              onPress: controller.actions.requestStorageReset,
            }),
            element(TextForgeToolbarButton, {
              key: 'retry-hydration',
              kind: 'secondary',
              label: 'Retry Load',
              onPress: controller.actions.retryStorageInitialization,
            }),
          ],
      children: element(
        React.Fragment,
        null,
        element('p', null, 'TextForge stores the workspace in browser-managed IndexedDB through Dexie. Clearing site data may remove it.'),
        element('p', null, 'The app does not use File System Access API, directory handles, background sync, remote sync, or silent local file access.'),
        snapshot.state.storageResetPending
          ? element('p', null, 'Resetting clears the stored workspace content and rebuilds the starter seed. Open tabs and layout are not preserved.')
          : null,
      ),
    }),
    snapshot.runtime.status === 'error'
      ? element(TextForgeCallout, {
        tone: 'warning',
        title: snapshot.runtime.storageFailure?.title ?? 'Storage recovery required',
        children: element('p', null, snapshot.runtime.storageFailure?.detail ?? 'Reset browser storage to recover.'),
      })
      : null,
    element(
      'dl',
      { className: 'tf-meta-list tf-storage__meta' },
      element('div', null, element('dt', null, 'Storage engine'), element('dd', null, `${persistenceStatus.driver} / IndexedDB`)),
      element('div', null, element('dt', null, 'Database'), element('dd', null, persistenceStatus.databaseName)),
      element('div', null, element('dt', null, 'Hydration source'), element('dd', null, snapshot.runtime.hydrationSource)),
      element('div', null, element('dt', null, 'Save state'), element('dd', null, persistenceStatus.state)),
      element('div', null, element('dt', null, 'Last saved'), element('dd', null, persistenceStatus.lastSavedAt ?? 'Not saved yet')),
      element('div', null, element('dt', null, 'Schema version'), element('dd', null, String(persistenceStatus.schemaVersion))),
    ),
  );
}

function PopupSessionsView({ controller, popupFrame }) {
  if (popupFrame.tabs.length === 0) {
    return element(TextForgeEmptyState, {
      eyebrow: 'Popup surfaces',
      icon: 'utility',
      title: 'No popup sessions are open',
      children: element(
        'p',
        null,
        'Open a binary resource from the workspace tree or run an asset command to mount it here.',
      ),
    });
  }

  return element(
    'div',
    { className: 'tf-popup-summary' },
    ...popupFrame.tabs.map((tab) =>
      element(
        TextForgeInspectorCard,
        {
          key: tab.id,
          eyebrow: tab.id === popupFrame.activeTabId ? 'Active popup' : 'Popup session',
          icon: 'utility',
          title: tab.title,
          actions: [
            element(TextForgeToolbarButton, {
              key: `${tab.id}:focus`,
              kind: 'secondary',
              label: tab.id === popupFrame.activeTabId ? 'Focused' : 'Focus',
              onPress: () => controller.actions.focusPopupSession(tab.id),
            }),
            element(TextForgeToolbarButton, {
              key: `${tab.id}:close`,
              kind: 'secondary',
              label: 'Close',
              onPress: () => controller.actions.closeSession(tab.id),
            }),
          ],
        },
      )),
  );
}

function TextForgeWorkbenchApp({ controller }) {
  const snapshot = useWorkbenchSnapshot(controller);
  const screenshotPreset = React.useMemo(() => readPhase35ScreenshotPreset(), []);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const mainView = snapshot.activeMainView;
  const utilityOpen = snapshot.state.utilityPaneOpen;
  const showInspectorPane = snapshot.state.utilitySectionId === 'inspector';
  const showPopupSessions = snapshot.state.utilitySectionId === 'popups';
  const showStoragePane = snapshot.state.utilitySectionId === 'storage';
  const activeUtilitySection = snapshot.utilitySections.find((section) => section.id === snapshot.state.utilitySectionId);
  const inspectorView = snapshot.state.surfaceFocusPlacement === 'popup'
    ? snapshot.activePopupView
    : mainView.kind === 'surface'
      ? mainView
      : undefined;
  const popupOverlay = snapshot.popupFrame.tabs.length > 0 && snapshot.activePopupView
    ? element(
      TextForgePopupHost,
      {
        frameModel: snapshot.popupFrame,
        onClose: controller.actions.closeActivePopupSurface,
        title: snapshot.activePopupView.title,
      },
      element(SurfaceMount, { view: snapshot.activePopupView }),
    )
    : null;

  React.useEffect(() => {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const mainViewportContent = snapshot.runtime.status === 'loading'
    ? element(LoadingState)
    : snapshot.runtime.status === 'error'
      ? element(RecoveryState, { controller, snapshot })
      : mainView.kind === 'welcome'
        ? element(WelcomeState, { hydrationSource: snapshot.runtime.hydrationSource })
        : element(SurfaceMount, { view: mainView });

  async function handleCommandPress(commandId) {
    setCommandPaletteOpen(false);

    try {
      await controller.actions.executeCommand(commandId);
    } catch (error) {
      window.alert(error?.message ?? 'Shell command failed.');
    }
  }

  return element(
    React.Fragment,
    null,
    element(
      TextForgeAppFrame,
      {
        header: element(TextForgeTopBar, {
          brandTitle: snapshot.chromeModel.brandTitle,
          commandPaletteLabel: 'Commands',
          commandPaletteShortcut: 'Ctrl+K',
          menuGroups: snapshot.commandMenus,
          onCommandPress: handleCommandPress,
          onOpenCommandPalette: () => setCommandPaletteOpen(true),
          toolbarSlots: snapshot.chromeModel.toolbarSlots,
        }),
        sidebar: element(TextForgeWorkspaceSidebar, {
          collapsed: snapshot.state.workspaceTreeCollapsed,
          onSelectItem: controller.actions.selectWorkspaceItem,
          onToggleFolder: controller.actions.toggleWorkspaceFolder,
          workspaceTree: snapshot.chromeModel.workspaceTree,
        }),
        onSidebarCollapsedChange: controller.actions.setWorkspaceTreeCollapsed,
        onUtilityCollapsedChange: controller.actions.setUtilityPaneCollapsed,
        panelLayout: screenshotPreset.panelLayout,
        sidebarCollapsed: snapshot.state.workspaceTreeCollapsed,
        utility: element(
          TextForgeUtilityPane,
          {
            activeSectionId: snapshot.state.utilitySectionId,
            onSelectSection: controller.actions.setUtilitySection,
            sections: snapshot.utilitySections,
            title: activeUtilitySection?.label ?? 'Inspector',
          },
          showInspectorPane
            ? element(
              React.Fragment,
              null,
              inspectorView
                ? element(SurfaceDetails, { view: inspectorView })
                : element(TextForgeEmptyState, {
                  eyebrow: 'Inspector',
                  icon: 'info',
                  title: 'No active surface selected',
                }, element('p', null, 'Open or focus a document to inspect it here.')),
              element(WorkbenchDetailsCard),
            )
            : showPopupSessions
            ? element(PopupSessionsView, {
              controller,
              popupFrame: snapshot.popupFrame,
            })
            : showStoragePane
              ? element(StoragePaneView, { controller, snapshot })
              : element(ContributionRegistryView, { packs: snapshot.contributionPacks }),
        ),
        utilityOpen,
      },
      element(
        'section',
        { className: 'tf-surface-frame' },
        element(TextForgeSessionTabStrip, {
          emptyLabel: 'No documents are open',
          frameModel: snapshot.chromeModel.surfaceFrame,
          onCloseTab: controller.actions.closeSession,
          onSelectTab: controller.actions.focusMainSession,
        }),
        element(
          'div',
          { className: 'tf-surface-frame__body' },
          element(
            'div',
            { className: 'tf-surface-frame__viewport', 'data-view-kind': mainView.kind },
            mainViewportContent,
          ),
        ),
        popupOverlay,
      ),
    ),
    element(
      'div',
      {
        className: 'tf-shell-statusbar',
        'aria-live': 'polite',
      },
      element(TextForgeStatusRail, { badges: snapshot.chromeModel.statusBadges }),
    ),
    element(TextForgeCommandPalette, {
      entries: snapshot.commandPaletteEntries,
      onClose: () => setCommandPaletteOpen(false),
      onCommandPress: handleCommandPress,
      open: commandPaletteOpen,
      placeholder: 'Search command labels, groups, and keywords',
      title: 'Command palette',
    }),
  );
}

let mountedShell;

export function bootTextForgeShell(rootElement) {
  if (mountedShell) {
    mountedShell.root.unmount();
    mountedShell.controller.dispose();
  }

  const controller = createTextForgeWorkbenchController();
  const root = createRoot(rootElement);
  root.render(element(TextForgeWorkbenchApp, { controller }));
  mountedShell = { controller, root };
  return mountedShell;
}
