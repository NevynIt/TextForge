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
  TextForgeSelectField,
  TextForgeSessionTabStrip,
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

const element = React.createElement;
const textEncoder = new TextEncoder();
const workspaceDatabaseName = 'textforge-workspace';
const sampleResourcePaths = {
  notes: '/docs/notes.md',
  architecture: '/docs/architecture.txt',
  settings: '/docs/settings.yaml',
  roadmap: '/roadmap/phase-3-3-command-palette.md',
  svg: '/docs/system.svg',
};
const utilitySections = [
  { id: 'popups', label: 'Popup Sessions' },
  { id: 'storage', label: 'Browser Storage' },
  { id: 'registry', label: 'Contribution Packs' },
];

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
  workspace.createTextResource({
    path: sampleResourcePaths.notes,
    title: 'notes.md',
    text: '# TextForge\n\nPhase 3.3 replaces hard-coded shell actions with a local command palette, contribution-driven menus, and package-owned shell commands.',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  workspace.createTextResource({
    path: sampleResourcePaths.architecture,
    title: 'architecture.txt',
    text: 'The Phase 3.3 shell now dispatches package-owned commands locally without pulling plugin loading or external package execution forward.',
    mimeType: 'text/plain',
  });
  workspace.createTextResource({
    path: sampleResourcePaths.settings,
    title: 'settings.yaml',
    text: 'workspace: textforge\nshell: react\ncommands: palette-and-registry\n',
    languageId: 'yaml',
    mimeType: 'text/yaml',
  });
  workspace.createTextResource({
    path: sampleResourcePaths.roadmap,
    title: 'phase-3-3-command-palette.md',
    text: 'Contribution-driven shell commands now cover workspace import/export, surface routing, source language changes, and asset download without pulling Phase 5 package composition forward.',
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

function createWelcomeView() {
  return {
    id: 'welcome',
    kind: 'welcome',
    mountId: 'welcome',
    title: 'Command-driven browser workspace',
    summary: 'The React shell now resolves local command contributions from existing packages, renders registry-driven menus and toolbar buttons, and opens a local command palette without pulling plugin management or external package loading forward.',
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
    summary: 'TextForge is opening the browser-managed IndexedDB workspace before any command-driven surface sessions are mounted.',
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
  const parserBackedLanguageCount = languageModes.filter((mode) => mode.parserBacked).length;
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
    selectedWorkspaceItemId: undefined,
    utilityPaneOpen: false,
    utilitySectionId: 'storage',
    workspaceTreeCollapsed: false,
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
      state.utilitySectionId = 'storage';
    }
  }

  function rememberSelection(entryId) {
    state.selectedWorkspaceItemId = entryId;
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
        state.utilityPaneOpen = true;
        state.utilitySectionId = 'popups';
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
      state.utilityPaneOpen = true;
      state.utilitySectionId = 'popups';
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
    state.utilityPaneOpen = true;
    state.utilitySectionId = 'popups';
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
      emit();
      return;
    }

    openResourceEntry(entry);
  }

  function toggleWorkspaceTree() {
    state.workspaceTreeCollapsed = !state.workspaceTreeCollapsed;
    emit();
  }

  function toggleUtilityPane() {
    state.utilityPaneOpen = !state.utilityPaneOpen;
    if (state.utilityPaneOpen && listPopupSessions().length > 0) {
      state.utilitySectionId = 'popups';
    }
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
        title: surface.model.title,
        summary: surface.model.summary,
        openWith,
        state: session.state,
        placement: session.placement,
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
      title: surface.model.title,
      summary: surface.model.summary,
      openWith,
      state: session.state,
      placement: session.placement,
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
        detail: 'Hydrating the Dexie-backed workspace before surfaces and command routes are mounted.',
      };
    }

    if (runtime.status === 'error') {
      return {
        title: storageFailure?.title ?? 'Workspace storage unavailable',
        path: `IndexedDB / ${workspaceDatabaseName}`,
        kind: 'folder',
        detail: storageFailure?.detail ?? 'Retry the workspace load or reset browser storage to recover.',
      };
    }

    const entry = getSelectedEntry();
    if (!entry) {
      return {
        title: 'Workspace root',
        path: '/',
        kind: 'folder',
        detail: 'The browser-managed workspace is ready but no entry is currently selected.',
      };
    }

    return {
      title: entry.metadata.title ?? entry.path,
      path: entry.path,
      kind: entry.kind,
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
      state.selectedWorkspaceItemId = selectedEntry?.id;
      normalizeActiveSessions();

      if (hydrationSource === 'seed' && selectedEntry && selectedEntry.kind !== 'folder') {
        openResourceEntry(selectedEntry, {
          placement: selectedEntry.kind === 'binary' ? 'popup' : 'main',
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
    const treeItems = runtime.status === 'ready' ? createWorkspaceTreeItems(workspace.snapshot()) : [];
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
    const toolbarCommands = commandRegistry.listToolbar(commandContext);
    const commandMenus = commandRegistry.listMenus(commandContext).map((group) => ({
      id: group.id,
      label: group.label,
      items: group.commands.map((command) => ({
        commandId: command.id,
        label: command.label,
        description: command.description,
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
    const workspaceStatusLabel = runtime.status === 'loading'
      ? 'Hydrating workspace'
      : runtime.status === 'error'
        ? 'Workspace recovery required'
        : `${treeItems.length} items`;
    const workspaceStatusTone = runtime.status === 'error'
      ? 'warning'
      : runtime.status === 'loading'
        ? 'info'
        : 'success';
    const storageStatusLabel = persistenceStatus.state === 'error'
      ? 'Storage error'
      : persistenceStatus.state === 'persisting'
        ? 'Saving workspace'
        : 'Browser storage ready';
    const hydrationLabel = runtime.status === 'ready'
      ? (hydrationSource === 'storage' ? 'Restored from browser storage' : 'Seeded browser workspace')
      : runtime.status === 'loading'
        ? 'Opening browser storage'
        : 'Reset may be required';
    const chromeModel = createWorkbenchChromeModel({
      subtitle: runtime.status === 'ready'
        ? 'Contribution-driven shell commands over a Dexie-backed browser workspace'
        : 'Browser-managed workspace recovery',
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
          pinned: command.toolbar?.kind === 'primary',
          disabled: !command.enabled,
          shortcut: command.hotkey,
        })),
      statusBadges: [
        createStatusBadge({
          id: 'workspace-status',
          label: workspaceStatusLabel,
          tone: workspaceStatusTone,
          detail: 'The workspace is private browser storage, not a live local folder.',
        }),
        createStatusBadge({
          id: 'document-status',
          label: `${mainSessions.length} documents`,
          tone: mainSessions.length > 0 ? 'info' : 'neutral',
        }),
        createStatusBadge({
          id: 'popup-status',
          label: `${popupSessions.length} popups`,
          tone: popupSessions.length > 0 ? 'warning' : 'neutral',
        }),
        createStatusBadge({
          id: 'storage-status',
          label: storageStatusLabel,
          tone: persistenceStatus.state === 'error'
            ? 'warning'
            : persistenceStatus.state === 'persisting'
              ? 'info'
              : 'success',
          detail: `${persistenceStatus.driver} / IndexedDB / ${persistenceStatus.databaseName}`,
        }),
        createStatusBadge({
          id: 'hydration-status',
          label: hydrationLabel,
          tone: runtime.status === 'error' ? 'warning' : 'info',
          detail: `${parserBackedLanguageCount} parser-backed language modes remain available after hydration.`,
        }),
      ],
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
      popupFrame,
      selectedEntry: describeSelectedEntry(),
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
      closeSession,
      confirmStorageReset,
      executeCommand,
      focusMainSession,
      focusPopupSession,
      requestStorageReset,
      retryStorageInitialization,
      selectWorkspaceItem,
      setUtilitySection,
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
  return element(
    'section',
    { className: 'tf-welcome', 'data-view-kind': 'welcome' },
    element('span', { className: 'tf-welcome__eyebrow' }, 'Phase 3.3'),
    element('h3', null, 'Contribution-driven shell commands'),
    element(
      'p',
      null,
      hydrationSource === 'storage'
        ? 'The shell reopened a browser-managed Dexie workspace, restored the workspace contents, and rebuilt the local command registry without restoring document tabs or layout state.'
        : 'The shell seeded a fresh browser-managed Dexie workspace and registered the package-owned shell commands over the starter documents.',
    ),
    element(
      'ul',
      { className: 'tf-welcome__list' },
      element('li', null, 'Local command palette with search, filter, and execute flow'),
      element('li', null, 'Contribution-driven workspace, surface, editor, and asset commands'),
      element('li', null, 'Open-with and language controls remain package-owned and still appear in the surface details pane'),
      element('li', null, 'No plugin manager, remote package loading, or diagnostics dashboard pulled forward from Phase 5'),
    ),
  );
}

function LoadingState() {
  return element(TextForgeCallout, {
    tone: 'info',
    title: 'Hydrating browser workspace',
    children: element(
      React.Fragment,
      null,
      element('p', null, 'TextForge is opening the browser-managed Dexie workspace before any contribution-driven shell commands are executed.'),
      element('p', null, 'Open tabs and shell layout are intentionally not rehydrated in Phase 3.3.'),
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
  return element(
    'aside',
    { className: 'tf-surface-details' },
    element(
      'div',
      { className: 'tf-surface-details__section' },
      element('span', { className: 'tf-surface-details__label' }, 'Current surface'),
      element('h3', { className: 'tf-surface-details__title' }, view.title),
      element('p', { className: 'tf-surface-details__summary' }, view.summary),
    ),
    element(
      'dl',
      { className: 'tf-meta-list' },
      element('div', null, element('dt', null, 'Placement'), element('dd', null, view.placement)),
      element('div', null, element('dt', null, 'Open with'), element('dd', null, view.openWith)),
      element('div', null, element('dt', null, 'State'), element('dd', null, view.state)),
    ),
    view.controls.length > 0
      ? element(
        'div',
        { className: 'tf-surface-details__controls' },
        ...view.controls.map((control) =>
          element(TextForgeSelectField, { key: control.id, control })),
      )
      : null,
  );
}

function WorkspaceSelectionFooter({ selectedEntry }) {
  return element(
    'div',
    { className: 'tf-selection' },
    element('span', { className: 'tf-selection__title' }, selectedEntry.title),
    element('span', { className: 'tf-selection__path' }, selectedEntry.path),
    element('p', { className: 'tf-selection__detail' }, selectedEntry.detail),
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

function PopupSessionsView({ controller, popupFrame, popupView }) {
  if (popupFrame.tabs.length === 0) {
    return element(
      'div',
      { className: 'tf-empty' },
      'No popup sessions are open. Open a binary resource from the workspace tree or run an asset command to mount it here.',
    );
  }

  return element(
    React.Fragment,
    null,
    element(TextForgeSessionTabStrip, {
      emptyLabel: 'No popup sessions',
      frameModel: popupFrame,
      onCloseTab: controller.actions.closeSession,
      onSelectTab: controller.actions.focusPopupSession,
    }),
    popupView
      ? element(
        'div',
        { className: 'tf-popup-surface' },
        element('div', { className: 'tf-popup-surface__viewport' }, element(SurfaceMount, { view: popupView })),
        element('div', { className: 'tf-popup-surface__details' }, element(SurfaceDetails, { view: popupView })),
      )
      : null,
  );
}

function TextForgeWorkbenchApp({ controller }) {
  const snapshot = useWorkbenchSnapshot(controller);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const mainView = snapshot.activeMainView;
  const utilityOpen = snapshot.state.utilityPaneOpen;
  const showPopupSessions = snapshot.state.utilitySectionId === 'popups';
  const showStoragePane = snapshot.state.utilitySectionId === 'storage';

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
        footer: [
          element('span', { key: 'phase' }, 'Phase 3.3 Command palette and contribution-driven shell commands'),
          element('span', { key: 'detail' }, 'Local command registry and palette over a browser-managed IndexedDB workspace'),
        ],
        header: element(TextForgeTopBar, {
          brandTitle: snapshot.chromeModel.brandTitle,
          commandPaletteLabel: 'Commands',
          commandPaletteShortcut: 'Ctrl+K',
          menuGroups: snapshot.commandMenus,
          onCommandPress: handleCommandPress,
          onOpenCommandPalette: () => setCommandPaletteOpen(true),
          onToggleSidebar: controller.actions.toggleWorkspaceTree,
          onToggleUtility: controller.actions.toggleUtilityPane,
          sidebarCollapsed: snapshot.state.workspaceTreeCollapsed,
          statusBadges: snapshot.chromeModel.statusBadges,
          subtitle: snapshot.chromeModel.subtitle,
          toolbarSlots: snapshot.chromeModel.toolbarSlots,
          utilityOpen,
        }),
        sidebar: element(TextForgeWorkspaceSidebar, {
          collapsed: snapshot.state.workspaceTreeCollapsed,
          footer: element(WorkspaceSelectionFooter, { selectedEntry: snapshot.selectedEntry }),
          onSelectItem: controller.actions.selectWorkspaceItem,
          onToggleCollapsed: controller.actions.toggleWorkspaceTree,
          workspaceTree: snapshot.chromeModel.workspaceTree,
        }),
        sidebarCollapsed: snapshot.state.workspaceTreeCollapsed,
        utility: element(
          TextForgeUtilityPane,
          {
            activeSectionId: snapshot.state.utilitySectionId,
            onClose: controller.actions.toggleUtilityPane,
            onSelectSection: controller.actions.setUtilitySection,
            sections: snapshot.utilitySections,
            subtitle: 'Popup surfaces, browser storage state, and contribution-pack visibility stay out of the main document strip.',
            title: 'Utility',
          },
          showPopupSessions
            ? element(PopupSessionsView, {
              controller,
              popupFrame: snapshot.popupFrame,
              popupView: snapshot.activePopupView,
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
        element(
          'div',
          { className: 'tf-pane__header' },
          element(
            'div',
            null,
            element('h2', { className: 'tf-pane__title' }, snapshot.chromeModel.surfaceFrame.title),
            element('p', { className: 'tf-pane__subtitle' }, 'Narrow main-session tab strip for document surfaces'),
          ),
        ),
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
          element(SurfaceDetails, { view: mainView }),
        ),
      ),
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
