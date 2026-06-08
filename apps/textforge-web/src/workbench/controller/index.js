import {
  applyResourceTypeOverride,
  createCommandDispatcher,
  createContributionInspectorModel,
  createPipelineValue,
  getLanguageDefinition,
  getResourceTypeOption,
  inferLanguageId,
  inferResourceRepresentation,
  listResourceTypeOptions,
} from '@textforge/core';
import {
  basenameWorkspacePath,
  createWorkspaceOverlayService,
  createPersistedWorkspaceService,
  createSequentialIdFactory,
  createWorkspaceService,
  listWorkspaceBadgeDiagnostics,
  createWorkspaceTreeItems,
  dirnameWorkspacePath,
  exportWorkspaceFolderToZip,
  exportWorkspaceToZip,
  importWorkspaceFolderFromZip,
  importWorkspaceFromZip,
  joinWorkspacePath,
  normalizeWorkspacePath,
  resetWorkspaceDexieStorage,
  workspaceDexieSchemaVersion,
  workspaceEntryToResourceRef,
  workspaceProviderIds,
  workspaceStorageErrorCodes,
} from '@textforge/workspace';
import {
  createMainSessionTabStrip,
  createMainSurfaceHost,
  createOpenWithSelection,
  createPopupSurfaceHost,
  createSequentialSessionIdFactory,
  getDefaultSurfacePlacement,
  createSurfaceSessionTab,
  listOpenSurfaceSessions,
} from '@textforge/surfaces';
import {
  createTextEditorDocument,
  listTextEditorLanguageModes,
  sourceRangeToSelection,
} from '@textforge/editors';
import {
  createAssetProvenanceLabel,
  createBlobUrlLedger,
} from '@textforge/assets';
import {
  renderBpmnPublicationSvg,
} from '@textforge/bpmn';
import {
  rasterizeSvgToPngBytes,
} from '@textforge/diagrams';
import {
  createJsMindSurfaceModel,
  mountJsMindEmbeddedRender,
} from '@textforge/renderer-jsmind';
import {
  createMarkdownSnippet,
  parseMarkdownCapabilityRequirements,
  markdownPreviewSurfaceContribution,
  renderMarkdownDocument,
} from '@textforge/markdown';
import {
  createWorkspaceItmIncludeProvider,
  listItmVisualTargets,
  loadItmDocument,
} from '@textforge/itm';
import {
  createLuaExecutionService,
  isLuaResource as isLuaPackageResource,
  luaConsoleResourceMimeType,
  luaConsoleResourcePath,
  luaConsoleSurfaceContribution,
} from '@textforge/lua';
// WP-LUA keeps the interactive Lua Console and "Reload Lua automation pipelines" flows contribution-driven.
import {
  createStatusBadge,
  createToolbarSlot,
  createWorkbenchChromeModel,
  createWorkspaceTreeFrameModel,
} from '@textforge/ui';
import { activateMarkdownPreviewLink } from '../../markdownPreviewLinks.js';
import { createMarkdownPreviewRequestManager } from '../../markdownPreviewState.js';
import {
  luaRecoveryQueryParam,
  readLuaBootstrapRecoveryState,
  readPreviewTraceEnabled,
  readWorkbenchBootstrapOptions,
  readWorkbenchRecoveryMode,
  readWorkbenchTestProfile,
  sampleResourcePaths,
} from '../bootstrap-options.js';
import {
  diagramExportWorkerSource,
} from '../diagram-export-worker-source.js';
import {
  createBlobUrlDriver,
  createZipFilename,
  downloadBytes,
  escapeHtml,
  isWorkspaceResource,
  pickLocalFile,
  readFileBytes,
  sanitizeFilenameSegment,
  splitFilename,
} from '../browser-files.js';
import {
  createLoadingView,
  createStorageFailure,
  createWelcomeView,
  resolveCommandIcon,
  resolveEntryIcon,
} from '../icons.js';
import { clearSurfaceViewportScroll } from '../surface-scroll.js';
import { createTimestampFactory, createTraceLogger } from '../tracing.js';
import {
  parseWorkbenchUiState,
  readStoredWorkbenchUiState,
  workbenchUiStateFolderPath,
  workbenchUiStateResourcePath,
  writeStoredWorkbenchUiState,
} from '../ui-state.js';
import {
  createBundledWorkspaceOverlayState,
  createUserSeedWorkspaceState,
  sanitizePersistentWorkspaceState,
} from '../workspace-seed.js';
import {
  createRestoredSurfaceOpenOptions,
  migrateStoredWorkbenchUiState,
} from '../session-restore.js';
import {
  mainSessionContextCommandIds,
  popupSessionContextCommandIds,
  workspaceFolderContextCommandIds,
  workspaceResourceContextCommandIds,
} from './command-groups.js';
import { createWorkbenchRegistries } from './registries.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const workspaceDatabaseName = 'textforge-workspace';
const transientWorkspaceDriver = 'memory';
const utilitySections = [
  { id: 'inspector', label: 'Inspector', icon: 'status' },
  { id: 'popups', label: 'Popup Summary', icon: 'utility' },
  { id: 'storage', label: 'Browser Storage', icon: 'status' },
  { id: 'registry', label: 'Contribution Packs', icon: 'command' },
];

export function describeMarkdownPrintDiagramIssue(resource, rendered) {
  const sourceHasGeneratedDiagramFence = /```[ \t]*(mermaid|graphviz|dot)\b/i.test(resource?.text ?? '');
  if (!sourceHasGeneratedDiagramFence) {
    return undefined;
  }

  const diagramDiagnostics = (rendered?.diagnostics ?? []).filter((diagnostic) =>
    diagnostic?.code === 'tfmd.fence.render-failed'
    || diagnostic?.code === 'tfmd.fence.handler-unavailable'
    || ['mermaid', 'graphviz', 'dot'].includes(String(diagnostic?.origin?.fenceName ?? '').toLowerCase()));
  if (diagramDiagnostics.length > 0) {
    const firstMessage = diagramDiagnostics[0]?.message ?? 'A generated diagram block did not render.';
    return `${firstMessage} The HTML download was skipped so an incomplete print export is not mistaken for a successful render.`;
  }

  if (!/<svg[\s>]/i.test(rendered?.printHtml ?? '')) {
    return 'The Markdown contains Mermaid or Graphviz blocks, but the print HTML contains no rendered SVG artifact. The HTML download was skipped for diagnosis.';
  }

  return undefined;
}

export function createTextForgeWorkbenchController() {
  const workbenchTestProfile = readWorkbenchTestProfile();
  const luaBootstrapRecovery = readLuaBootstrapRecoveryState();
  const workbenchRecoveryMode = readWorkbenchRecoveryMode();
  const bootstrapOptions = readWorkbenchBootstrapOptions();
  const tracePreview = createTraceLogger(readPreviewTraceEnabled());
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
  const resourceTypeOptions = listResourceTypeOptions();
  const luaExecutionService = createLuaExecutionService();
  const {
    commandRegistry,
    contributionRegistry,
    resolvedDefaultContributions,
    surfaceRegistry,
  } = createWorkbenchRegistries();
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
  const documentContributionContextByResourceId = new Map();
  const transientResourceTypeOverrideBySessionId = new Map();
  const luaConsoleStateByResourceId = new Map();
  const luaConsoleSessionStateByResourceId = new Map();
  const listeners = new Set();
  let cachedSnapshot;
  let bootstrapApplied = false;
  let suspendWorkbenchUiStatePersistence = false;
  let lastPersistedWorkbenchUiStateText;
  let transientFlagTimeoutId;
  const state = {
    activeMainSessionId: undefined,
    activePopupSessionId: undefined,
    expandedFolderIds: [],
    selectedWorkspaceItemId: undefined,
    workspaceTreeEdit: undefined,
    utilityPaneOpen: true,
    utilitySectionId: 'inspector',
    workspaceTreeCollapsed: false,
    storageResetPending: false,
    surfaceFocusPlacement: 'main',
    contextMenu: undefined,
    transientFlag: undefined,
    visualTargetPicker: undefined,
  };
  const runtime = {
    status: workbenchRecoveryMode.active ? 'recovery' : 'loading',
    recoveryPromptActive: workbenchRecoveryMode.active,
    skipLuaPreloadOnce: luaBootstrapRecovery.skipLuaPreloadOnce,
  };
  const commandDispatcher = createCommandDispatcher({
    registry: commandRegistry,
    getContext: buildCommandContext,
  });
  tracePreview('controller:init', {
    testProfile: typeof window === 'undefined'
      ? null
      : new URL(window.location.href).searchParams.get('testProfile'),
  });

  function isWorkspaceStorageError(error) {
    return error?.name === 'WorkspaceStorageError'
      || Object.values(workspaceStorageErrorCodes).includes(error?.code);
  }

  function isWorkspaceStorageResetRequired(error) {
    return error?.code === workspaceStorageErrorCodes.corruptedState
      || error?.code === workspaceStorageErrorCodes.incompatibleState;
  }

  function createTransientWorkspaceService(error) {
    const baseWorkspace = createWorkspaceService({
      workspaceId: 'textforge-shell',
      name: 'TextForge Workspace',
      now: createTimestampFactory(),
      idFactory: createSequentialIdFactory('workspace'),
      state: createUserSeedWorkspaceState(),
    });
    const errorSnapshot = error
      ? {
        code: error.code ?? workspaceStorageErrorCodes.initializationFailed,
        message: error.message ?? 'Workspace browser storage is unavailable.',
      }
      : undefined;

    return {
      ...baseWorkspace,
      getPersistenceStatus() {
        return {
          state: 'error',
          driver: transientWorkspaceDriver,
          databaseName: workspaceDatabaseName,
          schemaVersion: workspaceDexieSchemaVersion,
          browserManaged: false,
          lastSavedAt: undefined,
          pendingReason: 'indexeddb-unavailable',
          error: errorSnapshot,
        };
      },
      subscribePersistence() {
        return () => {};
      },
      whenIdle: async () => baseWorkspace.snapshot(),
      persistNow: async () => baseWorkspace.snapshot(),
      disposePersistence() {},
    };
  }

  function createEmptyWorkspaceService() {
    return createWorkspaceService({
      workspaceId: 'textforge-shell',
      name: 'TextForge Workspace',
      now: createTimestampFactory(),
      idFactory: createSequentialIdFactory('workspace'),
    });
  }

  function applyWorkspaceOverlay(baseWorkspace) {
    workspace = createWorkspaceOverlayService(baseWorkspace, {
      overlay: () => createBundledWorkspaceOverlayState(baseWorkspace.snapshot()),
    });
  }

  function emit() {
    cachedSnapshot = undefined;
    if (runtime.status === 'ready' && !suspendWorkbenchUiStatePersistence) {
      persistWorkbenchUiState();
    }
    for (const listener of listeners) {
      listener();
    }
  }

  const markdownPreviewRequests = createMarkdownPreviewRequestManager({
    emit,
    trace: tracePreview,
    renderPreview(resource) {
      return renderMarkdownResource(resource);
    },
  });

  function closeContextMenu() {
    if (!state.contextMenu) {
      return;
    }

    state.contextMenu = undefined;
    emit();
  }

  function closeVisualTargetPicker() {
    if (!state.visualTargetPicker) {
      return;
    }

    state.visualTargetPicker = undefined;
    emit();
  }

  function clearTransientFlagTimeout() {
    if (typeof window === 'undefined' || transientFlagTimeoutId === undefined) {
      return;
    }

    window.clearTimeout(transientFlagTimeoutId);
    transientFlagTimeoutId = undefined;
  }

  function showTransientFlag(title, body, tone = 'warning') {
    clearTransientFlagTimeout();
    state.transientFlag = {
      id: `${Date.now()}:${title}`,
      tone,
      title,
      body,
    };
    emit();

    if (typeof window !== 'undefined') {
      transientFlagTimeoutId = window.setTimeout(() => {
        transientFlagTimeoutId = undefined;
        state.transientFlag = undefined;
        emit();
      }, 3200);
    }
  }

  function yieldToBrowser() {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => resolve());
        return;
      }
      globalThis.setTimeout(resolve, 0);
    });
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

  function isItmWorkspaceResource(entry) {
    return Boolean(
      entry
      && entry.kind === 'resource'
      && entry.representation === 'text'
      && (
        entry.languageId === 'itm'
        || entry.mimeType === 'text/itm'
        || entry.mimeType === 'text/x-itm'
        || entry.path?.toLowerCase().endsWith('.itm')
      ),
    );
  }

  function getDefaultSelection() {
    return getSampleEntry(sampleResourcePaths.bundledReadme)
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

  function serializeSessionForUiState(session) {
    if (!session) {
      return undefined;
    }

    const entry = getEntry(session.resource.resourceId);
    return {
      resourceId: session.resource.resourceId,
      resourcePath: entry?.path ?? session.resource.path,
      contributionId: session.contributionId,
      placement: session.placement,
      sessionKey: session.sessionKey,
      title: session.title,
      surfaceState: session.surfaceState,
    };
  }

  function buildStoredWorkbenchUiState() {
    const mainSessions = listMainSessions().map((session) => serializeSessionForUiState(session));
    const popupSessions = listPopupSessions().map((session) => serializeSessionForUiState(session));
    return {
      sessions: {
        main: mainSessions,
        popup: popupSessions,
      },
      active: {
        main: state.activeMainSessionId
          ? serializeSessionForUiState(mainHost.get(state.activeMainSessionId))
          : undefined,
        popup: state.activePopupSessionId
          ? serializeSessionForUiState(popupHost.get(state.activePopupSessionId))
          : undefined,
      },
    };
  }

  function ensureWorkspaceFolderIn(service, path) {
    const normalizedPath = normalizeWorkspacePath(path);
    if (normalizedPath === '/') {
      return service.getEntryByPath('/');
    }

    let currentPath = '/';
    let currentFolder = service.getEntryByPath(currentPath);
    for (const segment of normalizedPath.split('/').filter(Boolean)) {
      currentPath = joinWorkspacePath(currentPath, segment);
      const existingFolder = service.getEntryByPath(currentPath);
      if (existingFolder?.kind === 'folder') {
        currentFolder = existingFolder;
        continue;
      }

      currentFolder = service.createFolder({
        path: currentPath,
        title: basenameWorkspacePath(currentPath),
      });
    }

    return currentFolder;
  }

  function readStoredWorkbenchUiStateFromWorkspace() {
    const entry = workspace.getEntryByPath(workbenchUiStateResourcePath);
    if (!entry || entry.kind !== 'resource' || entry.representation !== 'text') {
      return undefined;
    }

    const parsed = parseWorkbenchUiState(entry.text);
    if (parsed) {
      lastPersistedWorkbenchUiStateText = entry.text;
    }
    return parsed;
  }

  function writeWorkbenchUiStateToWorkspace(stateText) {
    const writableWorkspace = persistedWorkspace ?? workspace;
    if (!writableWorkspace || typeof writableWorkspace.getEntryByPath !== 'function') {
      return;
    }

    const existing = writableWorkspace.getEntryByPath(workbenchUiStateResourcePath);
    if (existing?.kind === 'resource' && existing.representation === 'text') {
      if (existing.text === stateText) {
        lastPersistedWorkbenchUiStateText = stateText;
        return;
      }

      writableWorkspace.saveTextResource({
        resourceId: existing.id,
        text: stateText,
        languageId: existing.languageId ?? 'json',
        mimeType: existing.mimeType ?? 'application/json',
      });
      lastPersistedWorkbenchUiStateText = stateText;
      return;
    }

    ensureWorkspaceFolderIn(writableWorkspace, workbenchUiStateFolderPath);
    writableWorkspace.createTextResource({
      path: workbenchUiStateResourcePath,
      title: basenameWorkspacePath(workbenchUiStateResourcePath),
      text: stateText,
      languageId: 'json',
      mimeType: 'application/json',
    });
    lastPersistedWorkbenchUiStateText = stateText;
  }

  function readPersistedWorkbenchUiState() {
    return readStoredWorkbenchUiStateFromWorkspace() ?? readStoredWorkbenchUiState();
  }

  function persistWorkbenchUiState() {
    const nextState = buildStoredWorkbenchUiState();
    writeStoredWorkbenchUiState(nextState);
    const stateText = JSON.stringify(nextState);
    if (
      stateText === lastPersistedWorkbenchUiStateText
      && workspace.getEntryByPath(workbenchUiStateResourcePath)
    ) {
      return;
    }
    writeWorkbenchUiStateToWorkspace(stateText);
  }

  function focusRestoredSession(descriptor) {
    if (!descriptor?.resourceId && !descriptor?.resourcePath) {
      return;
    }

    const matchingSession = getOpenSessions().find((session) =>
      (session.resource.resourceId === descriptor.resourceId
        || session.resource.path === descriptor.resourcePath)
      && session.placement === descriptor.placement
      && session.contributionId === descriptor.contributionId
      && (descriptor.sessionKey === undefined || session.sessionKey === descriptor.sessionKey));
    if (!matchingSession) {
      return;
    }

    if (matchingSession.placement === 'popup') {
      focusPopupSession(matchingSession.id);
      return;
    }

    focusMainSession(matchingSession.id);
  }

  function restoreWorkbenchUiSessions() {
    if (workbenchTestProfile) {
      return false;
    }

    const storedState = migrateStoredWorkbenchUiState(readPersistedWorkbenchUiState());
    const storedMainSessions = storedState?.sessions?.main ?? [];
    const storedPopupSessions = storedState?.sessions?.popup ?? [];
    if (storedMainSessions.length === 0 && storedPopupSessions.length === 0) {
      return false;
    }

    const openStoredSessions = (sessions) => {
      for (const descriptor of sessions) {
        const entry = getEntry(descriptor.resourceId)
          ?? (descriptor.resourcePath ? workspace.getEntryByPath(descriptor.resourcePath) : undefined);
        if (!entry || entry.kind === 'folder') {
          continue;
        }

        openResourceEntry(entry, createRestoredSurfaceOpenOptions(descriptor));
      }
    };

    openStoredSessions(storedMainSessions);
    openStoredSessions(storedPopupSessions);
    focusRestoredSession(storedState?.active?.main);
    focusRestoredSession(storedState?.active?.popup);
    return getOpenSessions().length > 0;
  }

  function findSessionById(sessionId) {
    return getOpenSessions().find((session) => session.id === sessionId && session.state !== 'closed');
  }

  function findSessionForResource(resourceId, options = {}) {
    return getOpenSessions().find((session) =>
      session.resource.resourceId === resourceId
      && session.state !== 'closed'
      && (options.sessionKey === undefined || session.sessionKey === options.sessionKey));
  }

  function getHostForPlacement(placement) {
    return placement === 'popup' ? popupHost : mainHost;
  }

  function createSurfaceOpenRequest(entry, options = {}) {
    const resource = workspaceEntryToResourceRef(entry);
    const documentContext = resolveDocumentContributionContextForEntry(entry);
    const activeCapabilityIds = isLuaConsoleResource(entry)
      ? [...new Set([...(documentContext?.activeCapabilityIds ?? []), '@textforge/lua/capability/console'])]
      : documentContext?.activeCapabilityIds;
    const placement = options.placement ?? getDefaultSurfacePlacement(surfaceRegistry, {
      resource,
      allowPopup: true,
      activeCapabilityIds,
      preferredSurfaceIds: options.preferredSurfaceId ? [options.preferredSurfaceId] : undefined,
    });
    return {
      resource,
      workspaceResource: entry,
      title: options.title ?? entry.metadata.title ?? entry.path,
      sessionKey: options.sessionKey,
      surfaceState: options.surfaceState,
      placement,
      allowPopup: true,
      activeCapabilityIds,
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

  function rememberSelection(entryId, options = {}) {
    state.selectedWorkspaceItemId = entryId;
    const entry = getEntry(entryId);
    if (options.expandAncestors !== false && entry?.path) {
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
    markdownPreviewRequests.clear();
    luaConsoleStateByResourceId.clear();
    luaConsoleSessionStateByResourceId.clear();
    clearSurfaceViewportScroll();
    state.activeMainSessionId = undefined;
    state.activePopupSessionId = undefined;
    state.workspaceTreeEdit = undefined;
    state.surfaceFocusPlacement = 'main';
    state.visualTargetPicker = undefined;
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

    const preferredSurfaceId = options.preferredSurfaceId
      ?? (entry?.mimeType === 'image/svg+xml' ? '@textforge/assets/svg' : undefined)
      ?? (isMarkdownResource(entry) ? markdownPreviewSurfaceContribution.id : undefined);
    const requestedPlacement = options.placement
      ?? findSessionForResource(entry.id, { sessionKey: options.sessionKey })?.placement
      ?? getDefaultSurfacePlacement(surfaceRegistry, {
        resource: workspaceEntryToResourceRef(entry),
        allowPopup: true,
        preferredSurfaceIds: preferredSurfaceId ? [preferredSurfaceId] : undefined,
      });
    const existingSession = getOpenSessions().find((session) =>
      session.resource.resourceId === entry.id
      && session.state !== 'closed'
      && session.placement === requestedPlacement
      && (options.sessionKey === undefined ? session.sessionKey === undefined : session.sessionKey === options.sessionKey)
      && (!preferredSurfaceId || session.contributionId === preferredSurfaceId));
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
      rememberSelection(entry.id, { expandAncestors: options.expandSelection !== false });
      emit();
      return existingSession;
    }

    const request = createSurfaceOpenRequest(entry, {
      placement: requestedPlacement,
      preferredSurfaceId,
      sessionKey: options.sessionKey,
      surfaceState: options.surfaceState,
      title: options.title,
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

    rememberSelection(entry.id, { expandAncestors: options.expandSelection !== false });
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
      transientResourceTypeOverrideBySessionId.delete(sessionId);
      releaseAssetLeaseIfUnused(mainSession.resource.resourceId);
      normalizeActiveSessions();
      emit();
      return;
    }

    const popupSession = popupHost.get(sessionId);
    if (popupSession && popupSession.state !== 'closed') {
      popupHost.close(sessionId);
      transientResourceTypeOverrideBySessionId.delete(sessionId);
      releaseAssetLeaseIfUnused(popupSession.resource.resourceId);
      normalizeActiveSessions();
      emit();
    }
  }

  function selectWorkspaceItem(itemId) {
    if (runtime.status !== 'ready') {
      return;
    }

    rememberSelection(itemId, { expandAncestors: false });
    const entry = getEntry(itemId);
    if (!entry) {
      emit();
      return;
    }

    emit();
  }

  function activateWorkspaceItem(itemId) {
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

  function expandFolderPath(path) {
    if (!path || path === '/') {
      return;
    }

    expandFolderAncestors(path);
    const folder = workspace.getEntryByPath(path);
    if (!folder || folder.kind !== 'folder') {
      return;
    }

    if (state.expandedFolderIds.includes(folder.id)) {
      return;
    }

    state.expandedFolderIds = [...state.expandedFolderIds, folder.id];
  }

  function createVisibleTreeItems(allTreeItems) {
    const folderIdByPath = new Map(
      allTreeItems
        .filter((item) => item.kind === 'folder')
        .map((item) => [item.path, item.id]),
    );

    return allTreeItems
      .filter((item) => {
        if (item.path === luaConsoleResourcePath) {
          return false;
        }
        if (item.path === workbenchUiStateFolderPath || item.path === workbenchUiStateResourcePath) {
          return false;
        }
        if (item.path.startsWith(`${workbenchUiStateFolderPath}/`)) {
          return false;
        }
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
        movable: supportsWorkspaceCapability(getEntry(item.id), 'resource.move'),
        hasChildren: item.kind === 'folder' ? item.expanded : false,
        expanded: item.kind === 'folder' ? state.expandedFolderIds.includes(item.id) : false,
      }));
  }

  function clearTransientResourceTypeOverridesForResource(resourceId) {
    for (const [sessionId, override] of transientResourceTypeOverrideBySessionId.entries()) {
      if (override.resourceId === resourceId) {
        transientResourceTypeOverrideBySessionId.delete(sessionId);
      }
    }
  }

  function createResourceTypeOverride(resourceId, languageId) {
    const option = getResourceTypeOption(languageId);
    if (!option) {
      return undefined;
    }

    return {
      resourceId,
      languageId: option.languageId,
      mimeType: option.mimeType,
    };
  }

  function getEffectiveResourceForSession(resource, session) {
    const override = session?.id
      ? transientResourceTypeOverrideBySessionId.get(session.id)
      : undefined;
    if (!override || override.resourceId !== resource?.id) {
      return resource;
    }

    return applyResourceTypeOverride(resource, override);
  }

  function updateTextResourceType(resourceId, languageId, options = {}) {
    if (runtime.status !== 'ready') {
      return;
    }

    const currentResource = workspace.getEntry(resourceId);
    if (!isWorkspaceResource(currentResource) || currentResource.representation !== 'text') {
      return;
    }

    const override = createResourceTypeOverride(resourceId, languageId);
    if (!override) {
      return;
    }

    if (!isWorkspaceResourceWritable(currentResource)) {
      const session = options.session;
      if (!session?.id) {
        throw new Error(`Workspace resource ${currentResource.path} is read-only.`);
      }

      transientResourceTypeOverrideBySessionId.set(session.id, override);
      const effectiveResource = getEffectiveResourceForSession(currentResource, session);
      const currentDocument = activeTextDocuments.get(resourceId) ?? createTextEditorDocument(
        workspaceEntryToResourceRef(currentResource),
        currentResource.text,
        {
          languageId: currentResource.languageId,
          readOnly: true,
        },
      );
      activeTextDocuments.set(resourceId, {
        ...currentDocument,
        languageId: override.languageId,
        resource: workspaceEntryToResourceRef(effectiveResource),
      });
      rememberSelection(resourceId);
      emit();
      return;
    }

    const currentDocument = activeTextDocuments.get(resourceId) ?? createTextEditorDocument(
      workspaceEntryToResourceRef(currentResource),
      currentResource.text,
      {
        languageId: currentResource.languageId,
        readOnly: !isWorkspaceResourceWritable(currentResource),
      },
    );
    const nextResource = workspace.saveTextResource({
      resourceId,
      text: currentDocument.text,
      languageId: override.languageId,
      mimeType: override.mimeType,
    });
    clearTransientResourceTypeOverridesForResource(resourceId);
    activeTextDocuments.set(resourceId, {
      ...currentDocument,
      languageId: override.languageId,
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

  function getSelectedFolderPath(commandContext) {
    const targetEntry = resolveTargetEntryForCommands(commandContext);
    const entry = targetEntry ?? getSelectedEntry();
    if (!entry) {
      return '/';
    }

    const preferredPath = entry.kind === 'folder' ? entry.path : dirnameWorkspacePath(entry.path);
    const preferredFolder = workspace.getEntryByPath(preferredPath);
    if (preferredFolder?.kind === 'folder' && !supportsWorkspaceCapability(preferredFolder, 'resource.create-child')) {
      return '/docs';
    }

    return preferredPath;
  }

  function createAvailableWorkspacePath(path) {
    const normalizedPath = normalizeWorkspacePath(path);
    if (!workspace.getEntryByPath(normalizedPath)) {
      return normalizedPath;
    }

    const folderPath = dirnameWorkspacePath(normalizedPath);
    const { stem, extension } = splitFilename(basenameWorkspacePath(normalizedPath));
    let candidate = normalizedPath;
    let counter = 2;
    while (workspace.getEntryByPath(candidate)) {
      candidate = joinWorkspacePath(folderPath, `${stem}-${counter}${extension}`);
      counter += 1;
    }
    return candidate;
  }

  function getWorkspaceEntryName(entry) {
    return basenameWorkspacePath(entry?.path ?? '') || entry?.metadata?.title || entry?.id || '';
  }

  function normalizeWorkspaceEntryName(name) {
    const trimmed = String(name ?? '').trim();
    if (!trimmed) {
      throw new Error('Workspace item names cannot be empty.');
    }
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      throw new Error('Workspace item names cannot contain path separators.');
    }
    return trimmed;
  }

  function createWorkspaceEntryNameSelection(name, kind) {
    if (kind === 'folder') {
      return { start: 0, end: name.length };
    }

    const extensionIndex = String(name).lastIndexOf('.');
    if (extensionIndex > 0) {
      return { start: 0, end: extensionIndex };
    }

    return { start: 0, end: String(name).length };
  }

  function beginWorkspaceTreeEdit(itemId, options = {}) {
    if (runtime.status !== 'ready') {
      return;
    }

    const entry = getEntry(itemId);
    if (!entry || !supportsWorkspaceCapability(entry, 'resource.rename')) {
      return;
    }

    const name = options.initialValue ?? getWorkspaceEntryName(entry);
    const selection = options.selection ?? createWorkspaceEntryNameSelection(name, entry.kind);
    state.workspaceTreeCollapsed = false;
    rememberSelection(itemId);
    state.workspaceTreeEdit = {
      itemId,
      value: name,
      selectionStart: selection.start,
      selectionEnd: selection.end,
    };
    emit();
  }

  function updateWorkspaceTreeEditValue(value) {
    if (!state.workspaceTreeEdit) {
      return;
    }

    state.workspaceTreeEdit = {
      ...state.workspaceTreeEdit,
      value,
      selectionStart: undefined,
      selectionEnd: undefined,
    };
    emit();
  }

  function cancelWorkspaceTreeEdit() {
    if (!state.workspaceTreeEdit) {
      return;
    }

    state.workspaceTreeEdit = undefined;
    emit();
  }

  function createTextResourceAtPath(path, options = {}) {
    const nextPath = createAvailableWorkspacePath(path);
    const languageId = inferLanguageId({ path: nextPath, fallback: 'plaintext' });
    const languageDefinition = getLanguageDefinition(languageId);
    const resource = workspace.createTextResource({
      path: nextPath,
      title: basenameWorkspacePath(nextPath),
      text: options.text ?? '',
      languageId,
      mimeType: languageDefinition?.mimeTypes[0] ?? 'text/plain',
    });
    expandFolderAncestors(resource.path);
    return resource;
  }

  function createFolderAtPath(path) {
    const nextPath = createAvailableWorkspacePath(path);
    const folder = workspace.createFolder({
      path: nextPath,
      title: basenameWorkspacePath(nextPath),
    });
    expandFolderAncestors(folder.path);
    return folder;
  }

  function isBundledWorkspaceEntry(entry) {
    return entry?.metadata?.providerId === workspaceProviderIds.bundled;
  }

  function supportsWorkspaceCapability(entry, capabilityId) {
    return Boolean(entry?.metadata?.capabilityIds?.includes(capabilityId));
  }

  function isWorkspaceResourceWritable(entry) {
    return supportsWorkspaceCapability(entry, 'resource.write');
  }

  function createCopiedWorkspaceResource(targetPath, sourceEntry) {
    const normalizedPath = createAvailableWorkspacePath(targetPath);
    ensureWorkspaceFolder(dirnameWorkspacePath(normalizedPath));
    const metadata = {
      provenance: {
        kind: 'copy',
        sourceProviderId: sourceEntry.metadata?.providerId ?? workspaceProviderIds.local,
        sourceResourceId: sourceEntry.id,
        sourcePath: sourceEntry.path,
        copiedAt: new Date().toISOString(),
      },
    };

    if (sourceEntry.representation === 'text') {
      return workspace.createTextResource({
        path: normalizedPath,
        title: basenameWorkspacePath(normalizedPath),
        text: sourceEntry.text,
        languageId: sourceEntry.languageId,
        mimeType: sourceEntry.mimeType,
        metadata,
      });
    }

    return workspace.createBinaryResource({
      path: normalizedPath,
      title: basenameWorkspacePath(normalizedPath),
      bytes: sourceEntry.bytes,
      mimeType: sourceEntry.mimeType,
      metadata,
    });
  }

  function resolveWorkspaceCopyTargetPath(entry) {
    if (isBundledWorkspaceEntry(entry) && entry.path.startsWith('/.textforge/resources/')) {
      return normalizeWorkspacePath(entry.path.slice('/.textforge/resources'.length));
    }

    return joinWorkspacePath('/docs', basenameWorkspacePath(entry.path) || 'resource-copy');
  }

  function inferImportedLanguageId(path, mimeType) {
    const nextLanguageId = inferLanguageId({
      path,
      mimeType,
      fallback: undefined,
    });
    return nextLanguageId && getLanguageDefinition(nextLanguageId) ? nextLanguageId : undefined;
  }

  function shouldCreateTextResource(path, mimeType, bytes) {
    return inferResourceRepresentation({
      path,
      mimeType,
      bytes,
    }) === 'text';
  }

  function ensureWorkspaceFolder(path) {
    const normalizedPath = normalizeWorkspacePath(path);
    if (normalizedPath === '/') {
      return workspace.getEntryByPath('/');
    }

    let currentPath = '/';
    let currentFolder = workspace.getEntryByPath(currentPath);
    for (const segment of normalizedPath.split('/').filter(Boolean)) {
      currentPath = joinWorkspacePath(currentPath, segment);
      const existingFolder = workspace.getEntryByPath(currentPath);
      if (existingFolder?.kind === 'folder') {
        currentFolder = existingFolder;
        continue;
      }

      currentFolder = workspace.createFolder({
        path: currentPath,
        title: basenameWorkspacePath(currentPath),
      });
    }

    return currentFolder;
  }

  function rebaseImportedArchive(archive) {
    const archivePaths = [...archive.folders, ...archive.files.map((file) => file.path)];
    if (archivePaths.length === 0 || !archivePaths.some((path) => path.includes('/'))) {
      return archive;
    }

    const firstSegment = archivePaths[0].split('/')[0];
    if (!firstSegment || !archivePaths.every((path) => path === firstSegment || path.startsWith(`${firstSegment}/`))) {
      return archive;
    }

    return {
      folders: archive.folders
        .map((path) => path === firstSegment ? '' : path.slice(firstSegment.length + 1))
        .filter(Boolean),
      files: archive.files.map((file) => ({
        ...file,
        path: file.path.startsWith(`${firstSegment}/`) ? file.path.slice(firstSegment.length + 1) : file.path,
      })),
    };
  }

  function createWorkspaceResourceFromBytes(path, bytes, mimeType) {
    const nextPath = createAvailableWorkspacePath(path);
    const title = basenameWorkspacePath(nextPath);
    if (shouldCreateTextResource(nextPath, mimeType, bytes)) {
      const languageId = inferImportedLanguageId(nextPath, mimeType) ?? 'plaintext';
      const languageDefinition = getLanguageDefinition(languageId);
      return workspace.createTextResource({
        path: nextPath,
        title,
        text: textDecoder.decode(bytes),
        languageId,
        mimeType: mimeType || languageDefinition?.mimeTypes[0] || 'text/plain',
      });
    }

    return workspace.createBinaryResource({
      path: nextPath,
      title,
      bytes,
      mimeType: mimeType || 'application/octet-stream',
    });
  }

  async function uploadFilesIntoFolder(folderPath, files, options = {}) {
    const normalizedFolderPath = normalizeWorkspacePath(folderPath);
    const targetFolder = ensureWorkspaceFolder(normalizedFolderPath);
    const uploadedResources = [];

    for (const file of files) {
      const targetPath = joinWorkspacePath(normalizedFolderPath, file.name || 'upload.bin');
      uploadedResources.push(createWorkspaceResourceFromBytes(
        targetPath,
        await readFileBytes(file),
        file.type || undefined,
      ));
    }

    if (uploadedResources.length === 0) {
      return [];
    }

    await persistWorkspace(options.reason ?? 'workspace.upload-file');
    expandFolderPath(normalizedFolderPath);

    if (options.openFirst) {
      openResourceEntry(uploadedResources[0], { placement: options.placement ?? 'main' });
      return uploadedResources;
    }

    rememberSelection(targetFolder?.id ?? uploadedResources[uploadedResources.length - 1].id);
    emit();
    return uploadedResources;
  }

  async function importFolderArchiveIntoPath(folderPath, archive) {
    const normalizedFolderPath = normalizeWorkspacePath(folderPath);
    const rebasedArchive = rebaseImportedArchive(archive);
    const targetFolder = ensureWorkspaceFolder(normalizedFolderPath);

    for (const nestedFolder of rebasedArchive.folders) {
      ensureWorkspaceFolder(joinWorkspacePath(normalizedFolderPath, nestedFolder));
    }

    for (const fileEntry of rebasedArchive.files) {
      createWorkspaceResourceFromBytes(
        joinWorkspacePath(normalizedFolderPath, fileEntry.path),
        fileEntry.bytes,
        undefined,
      );
    }

    await persistWorkspace('workspace.import-folder-zip');
    expandFolderAncestors(targetFolder.path);
    rememberSelection(targetFolder.id);
    emit();
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
    if (isWorkspaceResource(selectedEntry)) {
      return selectedEntry;
    }

    const activeSession = getActiveCommandSession();
    if (!activeSession) {
      return undefined;
    }

    const activeEntry = getEntry(activeSession.resource.resourceId);
    return isWorkspaceResource(activeEntry) ? activeEntry : undefined;
  }

  function createCommandSelection(entry) {
    if (!entry) {
      return undefined;
    }

    return {
      resourceId: entry.id,
      kind: entry.kind,
      representation: isWorkspaceResource(entry) ? entry.representation : undefined,
      path: entry.path,
      mimeType: entry.kind === 'folder' ? undefined : entry.mimeType,
      languageId: isWorkspaceResource(entry) && entry.representation === 'text'
        ? entry.languageId
        : undefined,
      providerId: entry.metadata?.providerId,
      capabilityIds: entry.metadata?.capabilityIds,
      revision: entry.metadata?.revision,
      ownerKind: entry.metadata?.ownerKind,
      ownerId: entry.metadata?.ownerId,
    };
  }

  function createCommandSurfaceContext(session, entry) {
    if (!session) {
      return undefined;
    }

    return {
      sessionId: session.id,
      contributionId: session.contributionId,
      placement: session.placement,
      resourceId: session.resource.resourceId,
      resourceKind: isWorkspaceResource(entry) ? 'resource' : session.resource.kind,
      resourceRepresentation: isWorkspaceResource(entry)
        ? entry.representation
        : session.resource.representation,
      freshness: session.freshness,
    };
  }

  function listAvailableSurfaceIdsForEntry(entry, placement, preferredSurfaceIds, session) {
    if (!entry) {
      return [];
    }

    const effectiveEntry = getEffectiveResourceForSession(entry, session);
    if (isItmWorkspaceResource(effectiveEntry)) {
      return [];
    }

    const documentContext = resolveDocumentContributionContextForEntry(effectiveEntry);
    return createOpenWithSelection(surfaceRegistry, {
      resource: workspaceEntryToResourceRef(effectiveEntry),
      placement: placement ?? getDefaultSurfacePlacement(surfaceRegistry, {
        resource: workspaceEntryToResourceRef(effectiveEntry),
        allowPopup: true,
        activeCapabilityIds: documentContext?.activeCapabilityIds,
        preferredSurfaceIds,
      }),
      allowPopup: true,
      activeCapabilityIds: documentContext?.activeCapabilityIds,
      preferredSurfaceIds,
    }).candidates.map((candidate) => candidate.surfaceId);
  }

  function createTargetCommandContext(target) {
    return target ? { target } : {};
  }

  function buildCommandContext() {
    const selectedEntry = runtime.status === 'ready' ? getSelectedEntry() : undefined;
    const activeSession = runtime.status === 'ready' ? getActiveCommandSession() : undefined;
    const activeEntry = activeSession ? getEntry(activeSession.resource.resourceId) : undefined;
    const openWithTarget = selectedEntry?.kind === 'folder'
      ? isWorkspaceResource(activeEntry) ? activeEntry : undefined
      : selectedEntry;
    const availableSurfaceIds = listAvailableSurfaceIdsForEntry(
      openWithTarget,
      activeSession?.placement,
      activeSession ? [activeSession.contributionId] : undefined,
      activeSession,
    );

    return {
      runtimeStatus: runtime.status,
      workspaceReady: runtime.status === 'ready',
      selection: createCommandSelection(selectedEntry),
      activeSurface: createCommandSurfaceContext(activeSession, activeEntry),
      availableSurfaceIds,
    };
  }

  function getAssetLease(resource) {
    const existing = assetLeaseByResourceId.get(resource.resourceId);
    if (existing) {
      return existing;
    }

    const workspaceResource = workspace.getEntry(resource.resourceId);
    if (!isWorkspaceResource(workspaceResource)) {
      return undefined;
    }

    if (workspaceResource.representation === 'text' && workspaceResource.mimeType !== 'image/svg+xml') {
      return undefined;
    }

    const lease = blobLedger.acquire(resource, {
      type: workspaceResource.mimeType,
      data: workspaceResource.representation === 'text'
        ? textEncoder.encode(workspaceResource.text)
        : workspaceResource.bytes,
    }, workspaceResource.mimeType);
    assetLeaseByResourceId.set(resource.resourceId, lease);
    return lease;
  }

  function isMarkdownResource(resource) {
    return Boolean(
      resource
      && resource.kind === 'resource'
      && resource.representation === 'text'
      && (
        resource.languageId === 'markdown'
        || resource.mimeType === 'text/markdown'
        || resource.mimeType === 'text/x-markdown'
        || resource.path?.toLowerCase().endsWith('.md')
        || resource.path?.toLowerCase().endsWith('.markdown')
        || resource.path?.toLowerCase().endsWith('.tfmd')
      ),
    );
  }

  function isLuaConsoleResource(resource) {
    return Boolean(
      resource
      && resource.kind === 'resource'
      && resource.representation === 'text'
      && resource.mimeType === luaConsoleResourceMimeType,
    );
  }

  function isLuaWorkspaceResource(resource) {
    return isLuaPackageResource(resource) && !isLuaConsoleResource(resource);
  }

  function getDocumentCapabilityRequirements(resource) {
    if (!isMarkdownResource(resource)) {
      return [];
    }

    return parseMarkdownCapabilityRequirements(resource.text);
  }

  function ensureWorkspaceFolder(path) {
    const normalizedPath = normalizeWorkspacePath(path);
    if (normalizedPath === '/') {
      return workspace.getEntryByPath('/');
    }

    const existing = workspace.getEntryByPath(normalizedPath);
    if (existing) {
      return existing;
    }

    const parts = normalizedPath.split('/').filter(Boolean);
    let currentPath = '';
    let currentFolder;
    for (const part of parts) {
      currentPath = joinWorkspacePath(currentPath || '/', part);
      currentFolder = workspace.getEntryByPath(currentPath);
      if (!currentFolder) {
        currentFolder = workspace.createFolder({
          path: currentPath,
          title: basenameWorkspacePath(currentPath),
        });
      }
    }
    return currentFolder;
  }

  function createLuaInputValue(excludedResourceId) {
    const focusedSession = state.surfaceFocusPlacement === 'popup'
      ? findSessionById(state.activePopupSessionId)
      : findSessionById(state.activeMainSessionId);
    const focusedEntry = focusedSession ? getEntry(focusedSession.resource.resourceId) : undefined;
    const fallbackEntry = getEntry(state.selectedWorkspaceItemId);
    const candidate = [focusedEntry, fallbackEntry].find((entry) =>
      isWorkspaceResource(entry)
      && entry.representation === 'text'
      && entry.id !== excludedResourceId
      && !isLuaConsoleResource(entry));

    if (!candidate) {
      return createPipelineValue('text', '', {
        metadata: {
          languageId: 'plaintext',
        },
      });
    }

    return createPipelineValue('text', candidate.text, {
      resource: workspaceEntryToResourceRef(candidate),
      metadata: {
        languageId: candidate.languageId ?? 'plaintext',
      },
    });
  }

  function formatLuaDiagnostics(diagnostics = []) {
    return diagnostics.map((diagnostic) => diagnostic.message).join('\n');
  }

  function createDefaultLuaConsoleState() {
    return {
      history: [],
      historyIndex: 0,
      transcript: [
        'TextForge Lua Console',
      ],
      currentInput: '',
    };
  }

  function createLuaConsoleTranscriptState(resourceId, command, result) {
    const currentState = luaConsoleStateByResourceId.get(resourceId) ?? createDefaultLuaConsoleState();
    const transcript = [...currentState.transcript, `lua> ${command}`];
    for (const line of result.consoleLines ?? []) {
      transcript.push(line.kind === 'inspect' ? `inspect: ${line.text}` : line.text);
    }
    for (const diagnostic of result.diagnostics ?? []) {
      transcript.push(`${diagnostic.severity}: ${diagnostic.message}`);
    }
    if (result.ok && result.value?.value !== undefined) {
      transcript.push(typeof result.value.value === 'string'
        ? result.value.value
        : JSON.stringify(result.value.value, null, 2));
    }
    const history = command.trim()
      ? [...currentState.history, command]
      : [...currentState.history];
    return {
      history,
      historyIndex: history.length,
      transcript,
      currentInput: '',
    };
  }

  function createDefaultLuaConsoleSessionState() {
    return {
      elevated: false,
      availableHostObjects: [],
      recoveryAvailable: false,
    };
  }

  function updateLuaConsoleSessionState(resourceId, sessionState) {
    if (!resourceId) {
      return createDefaultLuaConsoleSessionState();
    }

    const nextState = {
      ...createDefaultLuaConsoleSessionState(),
      ...(luaExecutionService.getConsoleSessionState(resourceId) ?? {}),
      ...(sessionState ?? {}),
    };
    luaConsoleSessionStateByResourceId.set(resourceId, nextState);
    return nextState;
  }

  function getLuaConsoleSessionState(resourceId) {
    return luaConsoleSessionStateByResourceId.get(resourceId)
      ?? luaExecutionService.getConsoleSessionState(resourceId)
      ?? createDefaultLuaConsoleSessionState();
  }

  function serializeWorkspaceEntryForLua(entry) {
    if (!entry) {
      return undefined;
    }

    if (entry.kind === 'folder') {
      return {
        id: entry.id,
        kind: entry.kind,
        path: entry.path,
        parentId: entry.parentId,
        title: entry.metadata.title ?? basenameWorkspacePath(entry.path),
        metadata: entry.metadata,
      };
    }

    return {
      id: entry.id,
      kind: entry.kind,
      representation: entry.representation,
      path: entry.path,
      parentId: entry.parentId,
      title: entry.metadata.title ?? basenameWorkspacePath(entry.path),
      languageId: entry.representation === 'text' ? entry.languageId : undefined,
      mimeType: entry.mimeType,
      text: entry.representation === 'text' ? entry.text : undefined,
      bytes: entry.representation === 'bytes' ? [...(entry.bytes ?? [])] : undefined,
      metadata: entry.metadata,
    };
  }

  function serializeSurfaceSessionForLua(session) {
    if (!session) {
      return undefined;
    }

    const entry = getEntry(session.resource.resourceId);
    return {
      id: session.id,
      contributionId: session.contributionId,
      placement: session.placement,
      state: session.state,
      resourceId: session.resource.resourceId,
      path: entry?.path,
      title: entry?.metadata.title ?? entry?.path ?? session.title,
      freshness: session.freshness,
    };
  }

  async function requestLuaPowerSessionRecovery() {
    await persistWorkspace('lua.power-session-recovery');
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set(luaRecoveryQueryParam, '1');
    window.location.assign(url.toString());
  }

  function resolveContributionInspectorModelForEntry(entry) {
    return createContributionInspectorModel({
      resolution: contributionRegistry.resolve(),
      documentContext: isWorkspaceResource(entry)
        ? resolveDocumentContributionContextForEntry(entry)
        : undefined,
    });
  }

  function serializeLuaRegistryContribution(contribution, kind) {
    return {
      id: contribution.id,
      packageId: contribution.packageId,
      kind,
      label: contribution.label,
      description: contribution.description,
      localName: contribution.localName,
      status: contribution.status,
      capabilityIds: [...(contribution.capabilities ?? [])],
      input: contribution.input,
      output: contribution.output,
      fenceNames: [...(contribution.fenceNames ?? [])],
    };
  }

  function listLuaRegistryContributions(resourceId, kind) {
    const entry = getEntry(resourceId);
    const documentContext = isWorkspaceResource(entry)
      ? resolveDocumentContributionContextForEntry(entry)
      : undefined;
    const resolution = contributionRegistry.resolve();
    const contributions = {
      commands: documentContext?.commands ?? resolution.commands,
      surfaces: documentContext?.surfaces ?? resolution.surfaces,
      pipelines: documentContext?.pipelines ?? resolution.pipelines,
      markdownFenceHandlers: documentContext?.markdownFenceHandlers ?? resolution.markdownFenceHandlers,
    };
    return contributions[kind].map((contribution) => serializeLuaRegistryContribution(contribution, kind));
  }

  function createLuaPipelineDefinitions(resourceId) {
    const entry = getEntry(resourceId);
    const documentContext = isWorkspaceResource(entry)
      ? resolveDocumentContributionContextForEntry(entry)
      : undefined;
    return (documentContext?.activePipelines ?? []).map((pipeline) => ({
      id: pipeline.id,
      name: pipeline.localName ?? pipeline.id,
      input: pipeline.input ? [pipeline.input] : ['text'],
      output: pipeline.output ?? 'text',
      category: pipeline.packageId,
      description: pipeline.description,
      localName: pipeline.localName ?? pipeline.id,
      contributionId: pipeline.id,
      sourcePath: `bundled:${pipeline.id}`,
    }));
  }

  function createLuaPowerSessionHostObjects(resourceId) {
    return {
      registry: {
        label: 'Registry',
        description: 'Inspect a read-only contribution registry snapshot and current-document routing.',
        api: {
          snapshot() {
            return resolveContributionInspectorModelForEntry(getEntry(resourceId));
          },
          summary() {
            return resolveContributionInspectorModelForEntry(getEntry(resourceId)).summary;
          },
          document() {
            return resolveContributionInspectorModelForEntry(getEntry(resourceId)).document;
          },
          packages() {
            return resolveContributionInspectorModelForEntry(getEntry(resourceId)).packages;
          },
          diagnostics() {
            return resolveContributionInspectorModelForEntry(getEntry(resourceId)).diagnostics;
          },
          listCommands() {
            return listLuaRegistryContributions(resourceId, 'commands');
          },
          listSurfaces() {
            return listLuaRegistryContributions(resourceId, 'surfaces');
          },
          listPipelines() {
            return listLuaRegistryContributions(resourceId, 'pipelines');
          },
          listMarkdownFenceHandlers() {
            return listLuaRegistryContributions(resourceId, 'markdownFenceHandlers');
          },
        },
      },
      workspace: {
        label: 'Workspace',
        description: 'Inspect and mutate the browser-managed workspace through the public workspace service.',
        api: {
          getManifest() {
            return workspace.getManifest();
          },
          listResources() {
            return workspace.snapshot().resources.map((entry) => serializeWorkspaceEntryForLua(entry));
          },
          listFolders() {
            return workspace.snapshot().folders.map((entry) => serializeWorkspaceEntryForLua(entry));
          },
          getEntryByPath(path) {
            return serializeWorkspaceEntryForLua(workspace.getEntryByPath(path));
          },
          createFolder(input = {}) {
            const nextPath = normalizeWorkspacePath(input.path ?? '/');
            ensureWorkspaceFolder(dirnameWorkspacePath(nextPath));
            return serializeWorkspaceEntryForLua(workspace.createFolder({
              path: nextPath,
              title: input.title ?? basenameWorkspacePath(nextPath),
            }));
          },
          createTextResource(input = {}) {
            const nextPath = normalizeWorkspacePath(input.path ?? '/untitled.txt');
            ensureWorkspaceFolder(dirnameWorkspacePath(nextPath));
            return serializeWorkspaceEntryForLua(workspace.createTextResource({
              path: nextPath,
              title: input.title ?? basenameWorkspacePath(nextPath),
              text: String(input.text ?? ''),
              languageId: input.languageId ?? 'plaintext',
              mimeType: input.mimeType ?? 'text/plain',
              metadata: input.metadata,
            }));
          },
          saveTextResource(input = {}) {
            const resource = input.resourceId
              ? workspace.getEntry(input.resourceId)
              : workspace.getEntryByPath(input.path ?? '');
            if (!isWorkspaceResource(resource) || resource.representation !== 'text') {
              throw new Error('Power-session saveTextResource requires an existing text resource.');
            }

            return serializeWorkspaceEntryForLua(workspace.saveTextResource({
              resourceId: resource.id,
              text: String(input.text ?? resource.text ?? ''),
              languageId: input.languageId ?? resource.languageId,
              mimeType: input.mimeType ?? resource.mimeType,
            }));
          },
          resolveReference(sourcePath, reference) {
            const sourceEntry = workspace.getEntryByPath(sourcePath ?? '');
            if (!isWorkspaceResource(sourceEntry)) {
              throw new Error(`Unknown workspace resource for resolveReference: ${sourcePath}`);
            }

            return workspace.resolveReference(workspaceEntryToResourceRef(sourceEntry), String(reference ?? ''));
          },
        },
      },
      automation: {
        label: 'Automation',
        description: 'Inspect discovered Lua automations and rerun discovery.',
        api: {
          list() {
            return luaExecutionService.getAutomationDefinitions();
          },
          discover() {
            const discovered = reloadLuaAutomation({ throwOnDiagnostics: false });
            return {
              definitions: discovered.definitions,
              diagnostics: discovered.diagnostics,
            };
          },
          run(automationId, input) {
            return luaExecutionService.runAutomation(automationId, {
              input,
              workspace,
            });
          },
        },
      },
      surfaces: {
        label: 'Surfaces',
        description: 'Inspect and control surface sessions through the public workbench helpers.',
        api: {
          listOpenSurfaceSessions() {
            return getOpenSessions().map((session) => serializeSurfaceSessionForLua(session));
          },
          openResourcePath(path, placement = 'main') {
            const entry = workspace.getEntryByPath(path ?? '');
            if (!isWorkspaceResource(entry)) {
              throw new Error(`Unknown workspace resource: ${path}`);
            }

            const session = openResourceEntry(entry, {
              placement: placement === 'popup' ? 'popup' : 'main',
            });
            return serializeSurfaceSessionForLua(session ?? findSessionForResource(entry.id));
          },
          focusSession(sessionId) {
            const session = findSessionById(sessionId);
            if (!session) {
              throw new Error(`Unknown surface session: ${sessionId}`);
            }

            if (session.placement === 'popup') {
              focusPopupSession(session.id);
            } else {
              focusMainSession(session.id);
            }
            return serializeSurfaceSessionForLua(findSessionById(session.id));
          },
          closeSession(sessionId) {
            closeSession(sessionId);
            return {
              closed: true,
              sessionId,
            };
          },
        },
      },
    };
  }

  function executeLuaConsoleCommand(resource, command) {
    const result = luaExecutionService.runConsoleCommand(resource.id, command, {
      scriptPath: resource.path,
      workspace,
      input: createLuaInputValue(resource.id),
      pipelineDefinitions: createLuaPipelineDefinitions(resource.id),
      powerSession: {
        hostObjects: createLuaPowerSessionHostObjects(resource.id),
        requestRecovery: requestLuaPowerSessionRecovery,
        onStateChange(sessionState) {
          updateLuaConsoleSessionState(resource.id, sessionState);
        },
      },
    });
    updateLuaConsoleSessionState(resource.id, result.session);
    documentContributionContextByResourceId.clear();
    emit();
    return result;
  }

  function reloadLuaAutomation(options = {}) {
    const discovered = luaExecutionService.discover(workspace, {
      limits: {
        maxWallTimeMs: 500,
      },
    });
    contributionRegistry.registerManifest(luaExecutionService.createContributionManifest());
    documentContributionContextByResourceId.clear();
    if (discovered.diagnostics.length > 0 && options.throwOnDiagnostics) {
      throw new Error(formatLuaDiagnostics(discovered.diagnostics));
    }
    return discovered;
  }

  async function ensureLuaConsoleResource() {
    ensureWorkspaceFolder('/.textforge');
    ensureWorkspaceFolder('/.textforge/runtime');
    const existing = workspace.getEntryByPath(luaConsoleResourcePath);
    if (existing && isWorkspaceResource(existing)) {
      return existing;
    }

    const resource = workspace.createTextResource({
      path: luaConsoleResourcePath,
      title: 'Lua Console',
      text: '-- TextForge Lua Console\n',
      languageId: 'plaintext',
      mimeType: luaConsoleResourceMimeType,
    });
    await persistWorkspace('lua.open-console');
    return resource;
  }

  async function applyWorkbenchBootstrapOptions() {
    if (bootstrapApplied) {
      return;
    }
    bootstrapApplied = true;

    const bootstrapCommandIds = runtime.skipLuaPreloadOnce
      ? bootstrapOptions.commandIds.filter((commandId) => !isLuaBootstrapCommandId(commandId))
      : bootstrapOptions.commandIds;

    for (const commandId of bootstrapCommandIds) {
      await executeCommand(commandId);
    }

    if (runtime.skipLuaPreloadOnce || !bootstrapOptions.luaConsoleCommand) {
      return;
    }

    const resource = await ensureLuaConsoleResource();
    const result = executeLuaConsoleCommand(resource, bootstrapOptions.luaConsoleCommand);
    luaConsoleStateByResourceId.set(
      resource.id,
      createLuaConsoleTranscriptState(resource.id, bootstrapOptions.luaConsoleCommand, result),
    );
    openResourceEntry(resource, {
      placement: 'popup',
      preferredSurfaceId: luaConsoleSurfaceContribution.id,
      forceReopen: true,
    });
  }

  function resolveDocumentContributionContextForEntry(entry) {
    if (!isWorkspaceResource(entry)) {
      return undefined;
    }

    const cacheKey = [
      entry.id,
      entry.representation,
      entry.representation === 'text' ? entry.languageId ?? '' : '',
      entry.mimeType ?? '',
    ].join(':');
    const cachedContext = documentContributionContextByResourceId.get(cacheKey);
    if (cachedContext?.updatedAt === entry.metadata.updatedAt) {
      if (isMarkdownResource(entry)) {
        tracePreview('document-context:cache-hit', {
          resourceId: entry.id,
          path: entry.path,
        });
      }
      return cachedContext.context;
    }

    const startedAt = performance.now();
    const context = contributionRegistry.resolveDocumentContext({
      document: workspaceEntryToResourceRef(entry),
      explicitRequirements: getDocumentCapabilityRequirements(entry),
    });
    if (isMarkdownResource(entry)) {
      tracePreview('document-context:resolved', {
        resourceId: entry.id,
        path: entry.path,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        activeCapabilities: context.activeCapabilityIds.length,
        activeFenceHandlers: context.activeMarkdownFenceHandlers.length,
      });
    }
    documentContributionContextByResourceId.set(cacheKey, {
      updatedAt: entry.metadata.updatedAt,
      context,
    });
    return context;
  }

  function resolveMarkdownAssetReference({ sourceResource, href }) {
    const resolvedRef = sourceResource
      ? workspace.resolveReference(sourceResource, href)
      : undefined;
    if (!resolvedRef?.resourceId) {
      return {
        href,
      };
    }

    const resolvedEntry = getEntry(resolvedRef.resourceId);
    if (!isWorkspaceResource(resolvedEntry)) {
      return {
        href,
        resourceId: resolvedRef.resourceId,
        path: resolvedRef.path,
      };
    }

    const lease = getAssetLease(workspaceEntryToResourceRef(resolvedEntry));
    return {
      href,
      resourceId: resolvedEntry.id,
      path: resolvedEntry.path,
      resolvedSrc: lease?.url,
    };
  }

  function openMarkdownPreviewLink(input) {
    const sourceResourcePath = input?.resource?.path;
    if (!sourceResourcePath) {
      showTransientFlag('File not found', 'The Markdown link target could not be resolved.');
      return true;
    }

    try {
      const result = activateMarkdownPreviewLink({
        href: input.href,
        onMissingTarget() {
          showTransientFlag('File not found', 'The Markdown link target is not available in this workspace.');
        },
        openResourceEntry,
        placement: input.placement,
        sourceResourcePath,
        workspace,
      });
      return result.handled;
    } catch (_error) {
      showTransientFlag('File not found', 'The Markdown link target could not be opened.');
      return true;
    }
  }

  async function renderMarkdownResource(resource, options = {}) {
    const startedAt = performance.now();
    tracePreview('renderMarkdownResource:start', {
      resourceId: resource.id,
      path: resource.path,
      updatedAt: resource.metadata.updatedAt,
    });
    const contributionContext = resolveDocumentContributionContextForEntry(resource);
    const result = await renderMarkdownDocument(resource.text, {
      resource: workspaceEntryToResourceRef(resource),
      sourceUpdatedAt: resource.metadata.updatedAt,
      resolveAssetReference: resolveMarkdownAssetReference,
      contributionRegistry,
      contributionContext,
      trace: tracePreview,
      fenceExecutionOptions: {
        document: globalThis.document,
        hostServices: {
          bpmn: {
            renderPublicationSvg: renderBpmnPublicationSvg,
          },
          workspace,
        },
        ...options.fenceExecutionOptions,
      },
    });
    tracePreview('renderMarkdownResource:done', {
      resourceId: resource.id,
      path: resource.path,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      diagnostics: result.diagnostics.length,
      generatedResources: result.generatedResources.length,
    });
    return result;
  }

  function requestMarkdownPreview(resource) {
    tracePreview('requestMarkdownPreview', {
      resourceId: resource.id,
      path: resource.path,
      updatedAt: resource.metadata.updatedAt,
    });
    const previewState = markdownPreviewRequests.request(resource);
    tracePreview('requestMarkdownPreview:returned', {
      resourceId: resource.id,
      path: resource.path,
      status: previewState?.status ?? 'unknown',
      hasResult: Boolean(previewState?.result),
    });
    return previewState;
  }

  function createOpenWithControl(session, resource) {
    if (isItmWorkspaceResource(resource)) {
      return undefined;
    }

    const documentContext = resolveDocumentContributionContextForEntry(resource);
    const selection = createOpenWithSelection(surfaceRegistry, {
      resource: workspaceEntryToResourceRef(resource),
      placement: session.placement,
      allowPopup: session.placement === 'popup',
      activeCapabilityIds: documentContext?.activeCapabilityIds,
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
          sessionKey: session.sessionKey,
          surfaceState: session.surfaceState,
          title: session.title,
          forceReopen: true,
        });
      },
    };
  }

  function createResourceTypeControl(session, resource) {
    if (!isWorkspaceResource(resource) || resource.representation !== 'text') {
      return undefined;
    }

    const writable = isWorkspaceResourceWritable(resource);
    return {
      id: 'resource-file-type',
      label: 'File type',
      description: writable
        ? 'Updates workspace metadata and refreshes file associations without renaming the path.'
        : 'Temporary for this open read-only session; provider metadata is not changed.',
      value: getResourceTypeOption(resource.languageId)?.languageId
        ?? inferLanguageId({ path: resource.path, mimeType: resource.mimeType, fallback: 'plaintext' }),
      disabled: false,
      options: resourceTypeOptions.map((option) => ({
        value: option.languageId,
        label: option.label,
        description: `${option.mimeType}${option.extensions.length ? `; .${option.extensions.join(', .')}` : ''}`,
      })),
      onChange(languageId) {
        updateTextResourceType(resource.id, languageId, { session });
      },
    };
  }

  function openSourceRange(resourcePath, sourceRange, options = {}) {
    if (!resourcePath || runtime.status !== 'ready') {
      return false;
    }

    const entry = workspace.getEntryByPath(normalizeWorkspacePath(resourcePath));
    if (!entry || entry.kind !== 'resource' || entry.representation !== 'text') {
      return false;
    }

    const selection = sourceRange ? sourceRangeToSelection(sourceRange) : undefined;
    const currentDocument = activeTextDocuments.get(entry.id) ?? createTextEditorDocument(
      workspaceEntryToResourceRef(entry),
      entry.text,
      {
        languageId: entry.languageId,
        readOnly: !isWorkspaceResourceWritable(entry),
      },
    );
    activeTextDocuments.set(entry.id, {
      ...currentDocument,
      resource: workspaceEntryToResourceRef(entry),
      text: entry.text,
      selection: selection ?? currentDocument.selection,
      sourceRange: sourceRange ?? currentDocument.sourceRange,
    });

    openResourceEntry(entry, {
      placement: options.placement ?? 'main',
      preferredSurfaceId: '@textforge/editors/code-mirror-text',
      forceReopen: true,
    });
    return true;
  }

  function reopenResourceInCurrentSurface(resource, preferredSurfaceId) {
    const currentSession = findSessionForResource(resource.id);
    if (!currentSession) {
      openResourceEntry(resource, {
        preferredSurfaceId,
      });
      return;
    }

    openResourceEntry(resource, {
      placement: currentSession.placement,
      preferredSurfaceId: preferredSurfaceId ?? currentSession.contributionId,
      sessionKey: currentSession.sessionKey,
      surfaceState: currentSession.surfaceState,
      title: currentSession.title,
      forceReopen: true,
    });
  }

  function replaceMarkdownText(resource, snippet) {
    if (!isMarkdownResource(resource)) {
      return;
    }

    const currentDocument = activeTextDocuments.get(resource.id) ?? createTextEditorDocument(
      workspaceEntryToResourceRef(resource),
      resource.text,
      {
        languageId: resource.languageId,
        readOnly: !isWorkspaceResourceWritable(resource),
      },
    );
    const selection = currentDocument.selection ?? { anchor: currentDocument.text.length, head: currentDocument.text.length };
    const start = Math.min(selection.anchor, selection.head);
    const end = Math.max(selection.anchor, selection.head);
    const nextText = `${currentDocument.text.slice(0, start)}${snippet}${currentDocument.text.slice(end)}`;
    const nextOffset = start + snippet.length;
    const nextResource = workspace.saveTextResource({
      resourceId: resource.id,
      text: nextText,
    });
    activeTextDocuments.set(resource.id, {
      ...currentDocument,
      resource: workspaceEntryToResourceRef(nextResource),
      text: nextText,
      version: currentDocument.version + 1,
      selection: {
        anchor: nextOffset,
        head: nextOffset,
      },
      sourceRange: undefined,
    });
    reopenResourceInCurrentSurface(nextResource);
  }

  function buildGeneratedResourceMetadata(descriptor) {
    if (!descriptor.pipelineId || !descriptor.sourcePath || !descriptor.sourceResourceId || !descriptor.sourceUpdatedAt) {
      return undefined;
    }

    return {
      provenance: {
        kind: 'generated',
        pipelineId: descriptor.pipelineId,
        sourceResourceId: descriptor.sourceResourceId,
        sourcePath: descriptor.sourcePath,
        sourceUpdatedAt: descriptor.sourceUpdatedAt,
        generatedAt: descriptor.generatedAt,
        blockId: descriptor.blockId,
        blockKind: descriptor.blockKind,
        format: descriptor.format,
      },
    };
  }

  function upsertGeneratedWorkspaceResource(descriptor) {
    const targetPath = normalizeWorkspacePath(descriptor.path);
    ensureWorkspaceFolder(dirnameWorkspacePath(targetPath));
    const existing = workspace.getEntryByPath(targetPath);
    const metadata = buildGeneratedResourceMetadata(descriptor);
    if (existing && existing.kind === 'resource' && existing.representation === descriptor.representation) {
      if (descriptor.representation === 'text') {
        return workspace.saveTextResource({
          resourceId: existing.id,
          text: descriptor.text,
          languageId: descriptor.languageId ?? existing.languageId,
          mimeType: descriptor.mimeType ?? existing.mimeType,
          metadata,
        });
      }

      return workspace.saveBinaryResource({
        resourceId: existing.id,
        bytes: descriptor.bytes,
        mimeType: descriptor.mimeType ?? existing.mimeType,
        metadata,
      });
    }

    if (existing) {
      workspace.deleteEntry(existing.id);
    }

    if (descriptor.representation === 'text') {
      return workspace.createTextResource({
        path: targetPath,
        title: basenameWorkspacePath(targetPath),
        text: descriptor.text,
        languageId: descriptor.languageId,
        mimeType: descriptor.mimeType,
        metadata,
      });
    }

    return workspace.createBinaryResource({
      path: targetPath,
      title: basenameWorkspacePath(targetPath),
      bytes: descriptor.bytes,
      mimeType: descriptor.mimeType,
      metadata,
    });
  }

  function createPngDescriptorFromGeneratedSvg(svgDescriptor, pngBytes) {
    const pngPath = String(svgDescriptor.path ?? '').replace(/\.svg$/i, '.png');
    return {
      ...svgDescriptor,
      path: pngPath,
      title: basenameWorkspacePath(pngPath),
      representation: 'bytes',
      mimeType: 'image/png',
      languageId: undefined,
      text: undefined,
      bytes: pngBytes,
      format: 'png',
      generatedAt: new Date().toISOString(),
    };
  }

  async function rasterizeGeneratedDiagramSvgsOnMainThread(svgDescriptors) {
    const pngDescriptors = [];
    let failureCount = 0;
    for (const [index, descriptor] of svgDescriptors.entries()) {
      showTransientFlag(
        'Exporting diagrams',
        `Creating PNG ${index + 1} of ${svgDescriptors.length}. The browser remains responsive between diagrams.`,
        'info',
      );
      await yieldToBrowser();
      try {
        const pngBytes = await rasterizeSvgToPngBytes(descriptor.text, {
          document: globalThis.document,
        });
        pngDescriptors.push(createPngDescriptorFromGeneratedSvg(descriptor, pngBytes));
      } catch (_error) {
        failureCount += 1;
      }
    }
    if (failureCount > 0) {
      showTransientFlag(
        'PNG export incomplete',
        `${failureCount} PNG asset${failureCount === 1 ? '' : 's'} could not be rasterized. SVG export completed.`,
        'warning',
      );
    }
    return pngDescriptors;
  }

  async function rasterizeGeneratedDiagramSvgs(svgDescriptors) {
    if (svgDescriptors.length === 0) {
      return [];
    }

    if (typeof Worker !== 'function') {
      return rasterizeGeneratedDiagramSvgsOnMainThread(svgDescriptors);
    }

    showTransientFlag(
      'Exporting diagrams',
      `Creating ${svgDescriptors.length} PNG asset${svgDescriptors.length === 1 ? '' : 's'} in a background worker.`,
      'info',
    );

    try {
      const results = await new Promise((resolve, reject) => {
        const workerUrl = URL.createObjectURL(new Blob([diagramExportWorkerSource], {
          type: 'text/javascript',
        }));
        const worker = new Worker(workerUrl);
        const finish = (callback, value) => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          callback(value);
        };
        worker.addEventListener('message', (event) => {
          if (event.data?.type === 'done') {
            finish(resolve, event.data.results ?? []);
            return;
          }
          if (event.data?.type === 'error') {
            finish(reject, new Error(event.data.message ?? 'Diagram export worker failed.'));
          }
        });
        worker.addEventListener('error', (event) => {
          finish(reject, new Error(event.message || 'Diagram export worker failed.'));
        });
        worker.postMessage({
          jobs: svgDescriptors.map((descriptor, index) => ({
            id: String(index),
            svgText: descriptor.text,
          })),
        });
      });
      const pngDescriptors = results.flatMap((result) => {
        const descriptor = svgDescriptors[Number(result.id)];
        if (!descriptor || !result.bytes) {
          return [];
        }
        return createPngDescriptorFromGeneratedSvg(descriptor, new Uint8Array(result.bytes));
      });
      const failureCount = svgDescriptors.length - pngDescriptors.length;
      if (failureCount > 0) {
        showTransientFlag(
          'PNG export incomplete',
          `${failureCount} PNG asset${failureCount === 1 ? '' : 's'} could not be rasterized. SVG export completed.`,
          'warning',
        );
      }
      return pngDescriptors;
    } catch (error) {
      showTransientFlag(
        'Diagram worker unavailable',
        `${error?.message ?? 'Worker export failed.'} Falling back to chunked PNG export.`,
        'warning',
      );
      return rasterizeGeneratedDiagramSvgsOnMainThread(svgDescriptors);
    }
  }

  function describeGeneratedResource(resource) {
    const provenance = resource.metadata?.provenance;
    if (!provenance || provenance.kind !== 'generated') {
      return {
        stale: false,
        label: 'workspace-bound',
        rows: [],
      };
    }

    const sourceResource = getEntry(provenance.sourceResourceId);
    const stale = !isWorkspaceResource(sourceResource) || sourceResource.metadata.updatedAt !== provenance.sourceUpdatedAt;
    return {
      stale,
      label: createAssetProvenanceLabel(provenance),
      rows: [
        { label: 'Pipeline', value: provenance.pipelineId },
        { label: 'Source path', value: provenance.sourcePath },
        { label: 'Source state', value: stale ? 'stale' : 'current' },
        { label: 'Generated at', value: provenance.generatedAt },
      ],
    };
  }

  function createResourceDescriptorInspectorSection(resource) {
    if (!resource) {
      return undefined;
    }

    return {
      eyebrow: 'Descriptor',
      icon: 'status',
      title: 'Provider descriptor',
      rows: [
        { label: 'Provider', value: resource.metadata?.providerId ?? 'workspace-local' },
        { label: 'Revision', value: resource.metadata?.revision ?? resource.metadata?.updatedAt ?? 'n/a' },
        { label: 'Owner', value: resource.metadata?.ownerId ? `${resource.metadata.ownerKind ?? 'owner'}:${resource.metadata.ownerId}` : (resource.metadata?.ownerKind ?? 'n/a') },
        { label: 'Capabilities', value: resource.metadata?.capabilityIds?.join(', ') ?? 'none' },
        { label: 'Provenance', value: resource.metadata?.provenance?.kind ?? 'none' },
        { label: 'Diagnostics', value: String(resource.metadata?.diagnostics?.length ?? 0) },
      ],
    };
  }

  function hydrateItmJsmindPublications(container, resourceTitle) {
    const disposers = [];
    if (!container?.querySelectorAll) {
      return () => {};
    }

    for (const island of container.querySelectorAll('[data-itm-jsmind-publication]')) {
      if (island.getAttribute('data-itm-jsmind-mounted') === 'true') {
        continue;
      }
      const modelScript = island.querySelector('[data-itm-jsmind-model]');
      try {
        const payload = JSON.parse(modelScript?.textContent ?? '{}');
        if (!payload.visualDocument) {
          continue;
        }
        island.setAttribute('data-itm-jsmind-mounted', 'true');
        const model = createJsMindSurfaceModel(payload.visualDocument, {
          title: payload.title ?? resourceTitle,
          diagnostics: Array.isArray(payload.diagnostics) ? payload.diagnostics : [],
        });
        disposers.push(mountJsMindEmbeddedRender(island, model));
      } catch (error) {
        island.innerHTML = `<section class="tf-visual-runtime tf-visual-runtime--error"><p class="tf-visual-runtime__message">${escapeHtml(error?.message ?? 'jsMind publication failed to initialize.')}</p></section>`;
      }
    }

    return () => {
      for (const dispose of disposers) {
        dispose?.();
      }
    };
  }

  function createHydratedMarkdownPreviewSurface(surface, resourceTitle) {
    return {
      ...surface,
      mount(container) {
        const disposeSurface = surface.mount(container);
        const disposeJsmind = hydrateItmJsmindPublications(container, resourceTitle);
        return () => {
          disposeJsmind();
          disposeSurface?.();
        };
      },
    };
  }

  function createSurfaceView(session) {
    const resource = getEntry(session.resource.resourceId);
    if (!resource) {
      return createWelcomeView();
    }

    const effectiveResource = getEffectiveResourceForSession(resource, session);
    const contribution = surfaceRegistry.get(session.contributionId);
    const openWith = contribution?.label ?? 'Surface';
    const controls = [
      createOpenWithControl(session, effectiveResource),
      createResourceTypeControl(session, effectiveResource),
    ].filter(Boolean);
    const badge = resource.metadata.badge;
    const icon = resolveEntryIcon(resource);
    const resourceTitle = resource.metadata.title ?? basenameWorkspacePath(resource.path) ?? resource.path;
    const surfaceTitle = session.title ?? resourceTitle;
    const luaConsoleSessionState = isLuaConsoleResource(resource)
      ? getLuaConsoleSessionState(resource.id)
      : undefined;
    const resourceRef = workspaceEntryToResourceRef(effectiveResource);
    tracePreview('createSurfaceView:start', {
      sessionId: session.id,
      contributionId: session.contributionId,
      path: resource.path,
    });
    const runtimeView = contribution?.open?.({
      session,
      contribution,
      resource: resourceRef,
      workspaceResource: effectiveResource,
      resourceTitle: surfaceTitle,
      sourceText: effectiveResource.representation === 'text' ? effectiveResource.text : undefined,
      updatedAt: resource.metadata.updatedAt,
      contributionRegistry,
      workspaceService: workspace,
      documentContext: resolveDocumentContributionContextForEntry(effectiveResource),
      requestPreview: session.contributionId === markdownPreviewSurfaceContribution.id && isMarkdownResource(effectiveResource)
        ? () => requestMarkdownPreview(effectiveResource)
        : undefined,
      onLinkActivate: session.contributionId === markdownPreviewSurfaceContribution.id && isMarkdownResource(effectiveResource)
        ? (activation) => openMarkdownPreviewLink({
          ...activation,
          placement: session.placement,
        })
        : undefined,
      getAssetLease: () => getAssetLease(resourceRef),
      describeGeneratedResource: () => describeGeneratedResource(resource),
      getTextDocument: () => activeTextDocuments.get(resource.id) ?? createTextEditorDocument(
        resourceRef,
        resource.text,
        {
          languageId: effectiveResource.languageId,
          readOnly: !isWorkspaceResourceWritable(resource),
        },
      ),
      setTextDocument(nextDocument) {
        activeTextDocuments.set(resource.id, nextDocument);
      },
      persistTextDocument(nextDocument) {
        const nextResource = workspace.saveTextResource({
          resourceId: resource.id,
          text: nextDocument.text,
        });
        return {
          ...nextDocument,
          resource: workspaceEntryToResourceRef(nextResource),
        };
      },
      markSessionCurrent() {
        getHostForPlacement(session.placement).markCurrent(session.id);
      },
      getConsoleState() {
        return luaConsoleStateByResourceId.get(resource.id);
      },
      getConsoleSessionState() {
        return getLuaConsoleSessionState(resource.id);
      },
      setConsoleState(nextState) {
        luaConsoleStateByResourceId.set(resource.id, nextState);
      },
      requestPowerSessionRecovery() {
        return requestLuaPowerSessionRecovery();
      },
      runConsoleCommand(command) {
        return executeLuaConsoleCommand(resource, command);
      },
      openSourceRange,
    });
    tracePreview('createSurfaceView:open-returned', {
      sessionId: session.id,
      contributionId: session.contributionId,
      path: resource.path,
      mountId: runtimeView?.mountId ?? null,
    });

    const surface = runtimeView?.surface ?? {
      model: {
        html: `<section class="tfmd-preview tfmd-preview--error"><p>Surface runtime unavailable for ${escapeHtml(openWith)}.</p></section>`,
      },
      mount(container) {
        container.innerHTML = this.model.html;
        return () => {
          container.innerHTML = '';
        };
      },
    };
    const mountedSurface = session.contributionId === markdownPreviewSurfaceContribution.id
      ? createHydratedMarkdownPreviewSurface(surface, resourceTitle)
      : surface;
    return {
      id: session.id,
      kind: 'surface',
      mountId: runtimeView?.mountId
        ?? `${session.id}:${session.contributionId}:${resource.metadata.updatedAt}:${effectiveResource.languageId ?? ''}:${effectiveResource.mimeType ?? ''}`,
      title: surfaceTitle,
      path: resource.path,
      summary: luaConsoleSessionState?.elevated
        ? 'Elevated Lua power session with approved host-object access and one-click recovery. Trigger it from Lua with require("tf.power").elevate().'
        : runtimeView?.summary ?? 'Surface runtime unavailable.',
      badge,
      icon,
      openWith,
      state: session.state,
      placement: session.placement,
      detail: runtimeView?.detail ?? 'Runtime unavailable',
      diagnostics: Array.isArray(surface.model?.diagnostics)
        ? surface.model.diagnostics
        : [],
      readOnly: runtimeView?.readOnly ?? true,
      inspectorSections: [
        ...((runtimeView?.inspectorSections) ?? []),
        createResourceDescriptorInspectorSection(resource),
      ].filter(Boolean),
      controls: [...controls, ...(runtimeView?.controls ?? [])],
      surface: mountedSurface,
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
        : entry.representation === 'text'
          ? 'Text-backed resources can open as source and, where supported, in additional visual surfaces.'
          : 'Byte-backed resources can open in compatible viewers and still download through existing shell commands.',
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

    tracePreview('getActiveMainView', {
      sessionId: session.id,
      contributionId: session.contributionId,
      path: session.resource.path,
    });
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

    const kindDetail = entry.representation === 'text'
      ? (entry.languageId ? entry.languageId.toUpperCase() : 'TEXT')
      : entry.mimeType === 'image/svg+xml'
        ? 'SVG'
        : entry.mimeType === 'application/pdf'
          ? 'PDF'
          : entry.mimeType?.startsWith('image/')
            ? 'IMAGE'
            : 'FILE';
    const powerSessionActive = isLuaConsoleResource(entry) && getLuaConsoleSessionState(entry.id).elevated;
    return {
      title: activeSession?.title ?? entry.metadata.title ?? basenameWorkspacePath(entry.path) ?? entry.path,
      detail: `${kindDetail} / ${activeSession?.placement === 'popup' ? 'Popup surface' : 'Main surface'}${powerSessionActive ? ' / Power session' : ''}`,
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

  function refreshOpenSessionsForAffectedEntries(affectedIds) {
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
  }

  function resolveWorkspaceMoveTargetFolder(entry) {
    if (!entry) {
      return undefined;
    }

    if (entry.kind === 'folder') {
      return entry;
    }

    const parentPath = dirnameWorkspacePath(entry.path);
    const parent = workspace.getEntryByPath(parentPath);
    return parent?.kind === 'folder' ? parent : undefined;
  }

  function canMoveWorkspaceEntryToFolder(entry, folder) {
    if (!entry || !folder || folder.kind !== 'folder') {
      return false;
    }
    if (entry.id === folder.id) {
      return false;
    }
    if (!supportsWorkspaceCapability(entry, 'resource.move')) {
      return false;
    }
    if (!supportsWorkspaceCapability(folder, 'resource.create-child')) {
      return false;
    }
    if (entry.kind === 'folder') {
      const normalizedPath = normalizeWorkspacePath(entry.path);
      if (folder.path === normalizedPath || folder.path.startsWith(`${normalizedPath}/`)) {
        return false;
      }
    }

    return dirnameWorkspacePath(entry.path) !== folder.path;
  }

  async function commitWorkspaceTreeEdit() {
    const edit = state.workspaceTreeEdit;
    if (!edit) {
      return;
    }

    const entry = getEntry(edit.itemId);
    if (!entry) {
      cancelWorkspaceTreeEdit();
      return;
    }

    try {
      const nextName = normalizeWorkspaceEntryName(edit.value);
      const nextPath = assertWorkspacePathAvailable(joinWorkspacePath(dirnameWorkspacePath(entry.path), nextName), entry.id);
      if (nextPath === entry.path) {
        cancelWorkspaceTreeEdit();
        return;
      }

      const affectedIds = collectAffectedEntryIds(entry);
      const renamed = workspace.renameEntry(entry.id, nextPath);
      await persistWorkspace('workspace.rename-selected');
      state.workspaceTreeEdit = undefined;
      syncSelectionAfterMutation(renamed?.id ?? entry.id);
      if (renamed?.path) {
        expandFolderAncestors(renamed.path);
      }
      refreshOpenSessionsForAffectedEntries(affectedIds);
      emit();
    } catch (error) {
      window.alert(error?.message ?? 'Could not rename workspace item.');
    }
  }

  async function moveWorkspaceItem(sourceItemId, targetItemId) {
    if (runtime.status !== 'ready') {
      return;
    }

    const source = getEntry(sourceItemId);
    const target = getEntry(targetItemId);
    const targetFolder = resolveWorkspaceMoveTargetFolder(target);
    if (!canMoveWorkspaceEntryToFolder(source, targetFolder)) {
      return;
    }

    try {
      const affectedIds = collectAffectedEntryIds(source);
      const moved = workspace.moveEntry({
        resourceId: source.id,
        parentPath: targetFolder.path,
      });
      await persistWorkspace('workspace.move-selected');
      state.workspaceTreeEdit = state.workspaceTreeEdit?.itemId === source.id ? undefined : state.workspaceTreeEdit;
      syncSelectionAfterMutation(moved?.id ?? source.id);
      expandFolderPath(targetFolder.path);
      if (moved?.path) {
        expandFolderAncestors(moved.path);
      }
      refreshOpenSessionsForAffectedEntries(affectedIds);
      emit();
    } catch (error) {
      window.alert(error?.message ?? 'Could not move workspace item.');
    }
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

  function createContextMenuModel(kind, targetId, x, y) {
    return {
      kind,
      targetId,
      x,
      y,
    };
  }

  function createWorkspaceItemTarget(itemId) {
    const entry = getEntry(itemId);
    if (!entry) {
      return undefined;
    }

    return {
      selection: createCommandSelection(entry),
      availableSurfaceIds: isWorkspaceResource(entry)
        ? listAvailableSurfaceIdsForEntry(entry, undefined, undefined)
        : [],
    };
  }

  function createSessionTarget(sessionId) {
    const session = findSessionById(sessionId);
    if (!session) {
      return undefined;
    }

    const entry = getEntry(session.resource.resourceId);
    return {
      selection: createCommandSelection(entry),
      activeSurface: createCommandSurfaceContext(session, entry),
      availableSurfaceIds: isWorkspaceResource(entry)
        ? listAvailableSurfaceIdsForEntry(entry, session.placement, [session.contributionId])
        : [],
    };
  }

  function resolveTargetEntryForCommands(commandContext) {
    const resourceId = commandContext?.target?.selection?.resourceId;
    return resourceId ? getEntry(resourceId) : getSelectedEntry();
  }

  function resolveTargetResourceForCommands(commandContext) {
    const entry = resolveTargetEntryForCommands(commandContext);
    return isWorkspaceResource(entry) ? entry : getSelectedResourceEntry();
  }

  function resolveTargetSessionForCommands(commandContext) {
    const sessionId = commandContext?.target?.activeSurface?.sessionId;
    return sessionId ? findSessionById(sessionId) : getActiveCommandSession();
  }

  function openContextMenu(model) {
    state.contextMenu = model;
    emit();
  }

  function openWorkspaceItemContextMenu(itemId, anchor) {
    openContextMenu(createContextMenuModel('workspace-item', itemId, anchor.x, anchor.y));
  }

  function openMainTabContextMenu(sessionId, anchor) {
    openContextMenu(createContextMenuModel('main-session', sessionId, anchor.x, anchor.y));
  }

  function openPopupSessionContextMenu(sessionId, anchor) {
    openContextMenu(createContextMenuModel('popup-session', sessionId, anchor.x, anchor.y));
  }

  async function openVisualTargetPickerForResource(resource, placement = 'main') {
    if (!isItmWorkspaceResource(resource)) {
      throw new Error('Select an ITM resource to open visual targets.');
    }

    const pickerState = {
      resourceId: resource.id,
      placement,
      status: 'loading',
      error: undefined,
      targets: [],
      selectedSessionKeys: [],
    };
    state.visualTargetPicker = pickerState;
    rememberSelection(resource.id);
    emit();

    try {
      const loaded = await loadItmDocument(resource.text, {
        strict: false,
        uri: resource.path,
        includeProviders: [
          createWorkspaceItmIncludeProvider(workspace, {
            basePath: resource.path,
          }),
        ],
        contributionRegistry,
        documentResource: {
          path: resource.path,
          kind: 'resource',
          representation: 'text',
          languageId: 'itm',
          mimeType: resource.mimeType ?? 'text/x-itm',
        },
      });
      const targets = listItmVisualTargets(loaded);
      const defaultTarget = targets.find((target) => target.available && target.kind === 'view')
        ?? targets.find((target) => target.available && target.kind === 'viewpoint')
        ?? targets.find((target) => target.available && target.kind === 'raw-model' && target.projection === 'graph')
        ?? targets.find((target) => target.available);
      state.visualTargetPicker = {
        resourceId: resource.id,
        placement,
        status: 'ready',
        error: undefined,
        targets,
        selectedSessionKeys: defaultTarget ? [defaultTarget.sessionKey] : [],
      };
    } catch (error) {
      state.visualTargetPicker = {
        resourceId: resource.id,
        placement,
        status: 'error',
        error: error?.message ?? 'Failed to resolve ITM visual targets.',
        targets: [],
        selectedSessionKeys: [],
      };
    }

    emit();
  }

  function toggleVisualTargetPickerSelection(sessionKey) {
    if (!state.visualTargetPicker || state.visualTargetPicker.status !== 'ready') {
      return;
    }

    const selected = new Set(state.visualTargetPicker.selectedSessionKeys);
    if (selected.has(sessionKey)) {
      selected.delete(sessionKey);
    } else {
      selected.add(sessionKey);
    }
    state.visualTargetPicker = {
      ...state.visualTargetPicker,
      selectedSessionKeys: [...selected],
    };
    emit();
  }

  function openSelectedVisualTargets() {
    if (!state.visualTargetPicker || state.visualTargetPicker.status !== 'ready') {
      return;
    }

    const resource = getEntry(state.visualTargetPicker.resourceId);
    if (!isItmWorkspaceResource(resource)) {
      closeVisualTargetPicker();
      return;
    }

    const selectedTargets = state.visualTargetPicker.targets.filter((target) =>
      target.available && state.visualTargetPicker.selectedSessionKeys.includes(target.sessionKey));
    const resourceTitle = resource.metadata.title ?? basenameWorkspacePath(resource.path) ?? resource.path;
    for (const target of selectedTargets) {
      openResourceEntry(resource, {
        placement: state.visualTargetPicker.placement,
        preferredSurfaceId: target.preferredSurfaceId,
        sessionKey: target.sessionKey,
        surfaceState: {
          itmVisualTarget: {
            kind: target.kind,
            id: target.id,
            label: target.label,
            viewpointId: target.viewpointId,
            projection: target.projection,
            preferredSurfaceId: target.preferredSurfaceId,
            rendererValue: target.rendererValue,
            sessionKey: target.sessionKey,
          },
        },
        title: `${resourceTitle} - ${target.label}`,
      });
    }
    closeVisualTargetPicker();
  }

  function isOpenWithCommand(commandId) {
    return commandId.startsWith('surface.open-with:');
  }

  function buildContextMenuCommands(model) {
    if (!model || runtime.status !== 'ready') {
      return undefined;
    }

    const target = model.kind === 'workspace-item'
      ? createWorkspaceItemTarget(model.targetId)
      : createSessionTarget(model.targetId);
    if (!target) {
      return undefined;
    }

    const commandContext = {
      ...buildCommandContext(),
      ...createTargetCommandContext(target),
    };
    const visibleCommands = commandRegistry.resolve(commandContext).filter((command) => command.visible);
    const allowedIds = model.kind === 'workspace-item'
      ? (target.selection?.kind === 'folder' ? workspaceFolderContextCommandIds : workspaceResourceContextCommandIds)
      : (model.kind === 'main-session' ? mainSessionContextCommandIds : popupSessionContextCommandIds);
    const targetEntry = resolveTargetEntryForCommands(commandContext);
    const hideOpenWithCommands = isItmWorkspaceResource(targetEntry);
    const items = visibleCommands.filter((command) => {
      if (!(allowedIds.includes(command.id) || isOpenWithCommand(command.id))) {
        return false;
      }

      if (hideOpenWithCommands && isOpenWithCommand(command.id)) {
        return false;
      }

      if (!targetEntry || model.kind !== 'workspace-item') {
        return true;
      }

      if (command.id === 'workspace.new-folder'
        || command.id === 'workspace.new-resource'
        || command.id === 'workspace.upload-file'
        || command.id === 'workspace.import-folder-zip') {
        return supportsWorkspaceCapability(targetEntry, 'resource.create-child');
      }

      if (command.id === 'workspace.export-selected-folder' || command.id === 'workspace.download-selected-file') {
        return supportsWorkspaceCapability(targetEntry, 'resource.export');
      }

      if (command.id === 'workspace.copy-selected-resource') {
        return supportsWorkspaceCapability(targetEntry, 'resource.copy');
      }

      if (command.id === 'workspace.rename-selected') {
        return supportsWorkspaceCapability(targetEntry, 'resource.rename');
      }

      if (command.id === 'workspace.delete-selected') {
        return supportsWorkspaceCapability(targetEntry, 'resource.delete');
      }

      return true;
    });

    return {
      x: model.x,
      y: model.y,
      context: commandContext,
      items: items.map((command) => ({
        commandId: command.id,
        label: command.label,
        description: command.description,
        icon: resolveCommandIcon(command.id),
        disabled: !command.enabled,
      })),
    };
  }

  async function openLuaConsoleCommand() {
    const resource = await ensureLuaConsoleResource();
    updateLuaConsoleSessionState(resource.id, luaExecutionService.getConsoleSessionState(resource.id));
    openResourceEntry(resource, {
      placement: 'popup',
      preferredSurfaceId: luaConsoleSurfaceContribution.id,
    });
  }

  async function runSelectedLuaResourceCommand(commandContext) {
    const entry = resolveTargetEntryForCommands(commandContext) ?? getSelectedEntry();
    if (!isLuaWorkspaceResource(entry)) {
      throw new Error('Select a Lua resource to run it.');
    }

    const result = luaExecutionService.runSnippet({
      source: entry.text,
      scriptPath: entry.path,
      workspace,
      input: createLuaInputValue(entry.id),
      pipelineDefinitions: createLuaPipelineDefinitions(entry.id),
      powerSession: {
        hostObjects: createLuaPowerSessionHostObjects(entry.id),
      },
    });
    if (!result.ok) {
      throw new Error(formatLuaDiagnostics(result.diagnostics));
    }

    const output = result.value;
    if (!output) {
      return;
    }

    const fileExtension = output.kind === 'json'
      ? 'json'
      : output.kind === 'html'
        ? 'html'
        : 'txt';
    const outputPath = createAvailableWorkspacePath(`/.textforge/generated/${sanitizeFilenameSegment(basenameWorkspacePath(entry.path).replace(/\.lua$/i, ''), 'lua-output')}.${fileExtension}`);
    ensureWorkspaceFolder('/.textforge');
    ensureWorkspaceFolder('/.textforge/generated');
    const renderedText = typeof output.value === 'string'
      ? output.value
      : JSON.stringify(output.value, null, 2);
    const resource = workspace.createTextResource({
      path: outputPath,
      title: basenameWorkspacePath(outputPath),
      text: renderedText,
      languageId: output.kind === 'json' ? 'json' : 'plaintext',
      mimeType: output.kind === 'json' ? 'application/json' : 'text/plain',
      metadata: {
        provenance: {
          kind: 'generated',
          pipelineId: entry.path,
          sourceResourceId: entry.id,
          sourcePath: entry.path,
          sourceUpdatedAt: entry.metadata.updatedAt,
          generatedAt: new Date().toISOString(),
          format: output.kind,
        },
      },
    });
    await persistWorkspace('lua.run-selected-resource');
    openResourceEntry(resource, { placement: 'main' });
  }

  async function promoteSelectedLuaResourceCommand(commandContext) {
    const entry = resolveTargetEntryForCommands(commandContext) ?? getSelectedEntry();
    if (!isLuaWorkspaceResource(entry)) {
      throw new Error('Select a Lua resource to promote it into the automation area.');
    }

    ensureWorkspaceFolder('/.textforge');
    ensureWorkspaceFolder('/.textforge/automation');
    ensureWorkspaceFolder('/.textforge/automation/lua');
    const targetPath = createAvailableWorkspacePath(joinWorkspacePath('/.textforge/automation/lua', basenameWorkspacePath(entry.path)));
    const resource = workspace.createTextResource({
      path: targetPath,
      title: basenameWorkspacePath(targetPath),
      text: entry.text,
      languageId: 'lua',
      mimeType: entry.mimeType ?? 'text/x-lua',
    });
    await persistWorkspace('lua.promote-selected-to-automation');
    reloadLuaAutomation({ throwOnDiagnostics: true });
    openResourceEntry(resource, { placement: 'main' });
  }

  async function reloadLuaAutomationCommand() {
    const discovered = reloadLuaAutomation({ throwOnDiagnostics: false });
    await persistWorkspace('lua.reload-automation');
    if (discovered.diagnostics.length > 0) {
      throw new Error(formatLuaDiagnostics(discovered.diagnostics));
    }
  }

  async function openLuaAutomationRootCommand() {
    ensureWorkspaceFolder('/.textforge');
    ensureWorkspaceFolder('/.textforge/automation');
    const folder = ensureWorkspaceFolder('/.textforge/automation/lua');
    await persistWorkspace('lua.open-automation-root');
    rememberSelection(folder?.id);
    emit();
  }

  async function createFolderCommand(commandContext) {
    const folder = createFolderAtPath(joinWorkspacePath(getSelectedFolderPath(commandContext), 'new-folder'));
    await persistWorkspace('workspace.new-folder');
    beginWorkspaceTreeEdit(folder.id);
  }

  async function createResourceCommand(commandContext) {
    const resource = createTextResourceAtPath(joinWorkspacePath(getSelectedFolderPath(commandContext), 'new-file.txt'));
    await persistWorkspace('workspace.new-resource');
    openResourceEntry(resource, { placement: 'main' });
    beginWorkspaceTreeEdit(resource.id);
  }

  async function createTextResourceInSelectedFolder(commandContext, options = {}) {
    const folderPath = getSelectedFolderPath(commandContext);
    const resource = createTextResourceAtPath(joinWorkspacePath(folderPath, options.filename ?? 'new-file.txt'));
    await persistWorkspace('workspace.new-resource');
    openResourceEntry(resource, { placement: options.placement ?? 'main' });
    beginWorkspaceTreeEdit(resource.id);
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
      openResourceEntry(nextEntry);
      return;
    }

    emit();
  }

  async function exportWorkspaceCommand() {
    const manifest = workspace.getManifest();
    const bytes = exportWorkspaceToZip(workspace);
    downloadBytes(createZipFilename(manifest.name, 'textforge-workspace'), bytes, 'application/zip');
  }

  async function uploadFileCommand(commandContext) {
    const file = await pickLocalFile();
    if (!file) {
      return;
    }

    await uploadFilesIntoFolder(getSelectedFolderPath(commandContext), [file], {
      reason: 'workspace.upload-file',
    });
  }

  async function exportSelectedFolderCommand(commandContext) {
    const entry = resolveTargetEntryForCommands(commandContext);
    if (!entry || entry.kind !== 'folder') {
      return;
    }

    const bytes = exportWorkspaceFolderToZip(workspace, entry.path);
    downloadBytes(createZipFilename(entry.metadata.title ?? basenameWorkspacePath(entry.path), 'workspace-folder'), bytes, 'application/zip');
  }

  async function importFolderZipCommand(commandContext) {
    const file = await pickLocalFile({ accept: '.zip,application/zip' });
    if (!file) {
      return;
    }

    const suggestedFolderName = sanitizeFilenameSegment(
      file.name.replace(/\.zip$/i, ''),
      'imported-folder',
    );
    const defaultPath = joinWorkspacePath(getSelectedFolderPath(commandContext), suggestedFolderName);
    const requestedPath = window.prompt('Folder import path', defaultPath);
    if (!requestedPath) {
      return;
    }

    const targetFolderPath = assertWorkspacePathAvailable(requestedPath);
    const archive = importWorkspaceFolderFromZip(await readFileBytes(file));
    await importFolderArchiveIntoPath(targetFolderPath, archive);
  }

  async function downloadSelectedFileCommand(commandContext) {
    const entry = resolveTargetResourceForCommands(commandContext);
    if (!entry) {
      return;
    }

    const filename = basenameWorkspacePath(entry.path) || entry.metadata.title || 'workspace-file';
    if (entry.representation === 'text') {
      downloadBytes(filename, textEncoder.encode(entry.text), entry.mimeType || 'text/plain');
      return;
    }

    downloadBytes(filename, entry.bytes, entry.mimeType || 'application/octet-stream');
  }

  async function copySelectedResourceCommand(commandContext) {
    const entry = resolveTargetResourceForCommands(commandContext);
    if (!entry) {
      return;
    }

    const copied = createCopiedWorkspaceResource(resolveWorkspaceCopyTargetPath(entry), entry);
    await persistWorkspace('workspace.copy-selected-resource');
    expandFolderAncestors(copied.path);
    openResourceEntry(copied, { placement: 'main' });
  }

  async function renameSelectedEntryCommand(commandContext) {
    const entry = resolveTargetEntryForCommands(commandContext);
    if (!entry) {
      return;
    }

    beginWorkspaceTreeEdit(entry.id);
  }

  async function deleteSelectedEntryCommand(commandContext) {
    const entry = resolveTargetEntryForCommands(commandContext);
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

  async function closeActiveSurfaceCommand(commandContext) {
    const session = resolveTargetSessionForCommands(commandContext);
    if (session) {
      closeSession(session.id);
    }
  }

  async function closeAllSurfaceCommand(commandContext) {
    const session = resolveTargetSessionForCommands(commandContext) ?? getActiveCommandSession();
    const placement = session?.placement ?? commandContext?.target?.activeSurface?.placement ?? 'main';
    const sessions = placement === 'popup' ? listPopupSessions() : listMainSessions();
    if (sessions.length === 0) {
      return;
    }

    const host = getHostForPlacement(placement);
    for (const openSession of sessions) {
      host.close(openSession.id);
      releaseAssetLeaseIfUnused(openSession.resource.resourceId);
    }
    normalizeActiveSessions();
    emit();
  }

  function closeActivePopupSurface() {
    if (state.activePopupSessionId) {
      closeSession(state.activePopupSessionId);
    }
  }

  async function refreshActiveSurfaceCommand(commandContext) {
    const session = resolveTargetSessionForCommands(commandContext);
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

  async function moveActiveSurfaceCommand(targetPlacement, commandContext) {
    const session = resolveTargetSessionForCommands(commandContext);
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

  async function focusMainSurfaceCommand(commandContext) {
    const targetSession = resolveTargetSessionForCommands(commandContext);
    if (targetSession?.placement === 'main') {
      focusMainSession(targetSession.id);
      return;
    }

    if (state.activeMainSessionId) {
      focusMainSession(state.activeMainSessionId);
    }
  }

  async function focusPopupSurfaceCommand(commandContext) {
    const targetSession = resolveTargetSessionForCommands(commandContext);
    if (targetSession?.placement === 'popup') {
      focusPopupSession(targetSession.id);
      return;
    }

    if (state.activePopupSessionId) {
      focusPopupSession(state.activePopupSessionId);
    } else {
      state.utilityPaneOpen = true;
      state.utilitySectionId = 'popups';
      emit();
    }
  }

  async function openVisualsCommand(commandContext) {
    const resource = resolveTargetResourceForCommands(commandContext);
    if (!isItmWorkspaceResource(resource)) {
      throw new Error('Select an ITM resource to open visual targets.');
    }

    const activeSession = resolveTargetSessionForCommands(commandContext);
    await openVisualTargetPickerForResource(resource, activeSession?.placement ?? 'main');
  }

  async function openWithSurfaceCommand(commandId, commandContext) {
    const surfaceId = commandId.slice('surface.open-with:'.length);
    const resource = resolveTargetResourceForCommands(commandContext);
    if (!resource) {
      return;
    }

    const activeSession = resolveTargetSessionForCommands(commandContext);
    const placement = activeSession?.resource.resourceId === resource.id
      ? activeSession.placement
      : getDefaultSurfacePlacement(surfaceRegistry, {
        resource: workspaceEntryToResourceRef(resource),
        allowPopup: true,
        preferredSurfaceIds: [surfaceId],
      });
    openResourceEntry(resource, {
      placement,
      preferredSurfaceId: surfaceId,
      forceReopen: true,
    });
  }

  async function setEditorLanguageCommand(commandId, commandContext) {
    const languageId = commandId.slice('editor.set-language:'.length);
    const resource = resolveTargetResourceForCommands(commandContext);
    if (!resource || resource.representation !== 'text') {
      return;
    }

    updateTextResourceType(resource.id, languageId, { session: getActiveCommandSession() });
  }

  async function downloadSelectedAssetCommand(commandContext) {
    const resource = resolveTargetResourceForCommands(commandContext);
    if (!resource || resource.representation !== 'bytes') {
      return;
    }

    downloadBytes(
      basenameWorkspacePath(resource.path) || 'asset.bin',
      resource.bytes,
      resource.mimeType ?? 'application/octet-stream',
    );
  }

  async function exportSelectedSvgCommand(commandContext) {
    const resource = resolveTargetResourceForCommands(commandContext);
    if (!resource || resource.representation !== 'text' || resource.mimeType !== 'image/svg+xml') {
      return;
    }

    downloadBytes(
      basenameWorkspacePath(resource.path) || 'diagram.svg',
      textEncoder.encode(resource.text),
      'image/svg+xml',
    );
  }

  async function exportSelectedPngCommand(commandContext) {
    const resource = resolveTargetResourceForCommands(commandContext);
    if (!resource || resource.representation !== 'text' || resource.mimeType !== 'image/svg+xml') {
      return;
    }

    const pngBytes = await rasterizeSvgToPngBytes(resource.text, {
      document: globalThis.document,
    });
    const baseName = basenameWorkspacePath(resource.path).replace(/\.svg$/i, '') || 'diagram';
    downloadBytes(`${baseName}.png`, pngBytes, 'image/png');
  }

  async function insertMarkdownSnippetCommand(kind, commandContext) {
    const resource = resolveTargetResourceForCommands(commandContext);
    if (!isMarkdownResource(resource)) {
      return;
    }

    if (kind === 'image') {
      const href = window.prompt('Workspace-relative image path', 'generated/example.svg');
      if (!href) {
        return;
      }
      replaceMarkdownText(resource, createMarkdownSnippet('image', {
        href,
        alt: 'Generated diagram',
      }));
      await persistWorkspace('markdown.insert-image-reference');
      return;
    }

    replaceMarkdownText(resource, createMarkdownSnippet(kind));
    await persistWorkspace(`markdown.insert-${kind}-block`);
  }

  async function exportMarkdownPrintHtmlCommand(commandContext) {
    const resource = resolveTargetResourceForCommands(commandContext);
    if (!isMarkdownResource(resource)) {
      return;
    }

    const rendered = await renderMarkdownResource(resource);
    const diagramIssue = describeMarkdownPrintDiagramIssue(resource, rendered);
    if (diagramIssue) {
      showTransientFlag('Markdown print export incomplete', diagramIssue, 'warning');
      return;
    }
    const fileName = `${basenameWorkspacePath(resource.path).replace(/\.(md|markdown|tfmd)$/i, '') || 'document'}.html`;
    downloadBytes(fileName, textEncoder.encode(rendered.printHtml), 'text/html');
  }

  async function exportMarkdownGeneratedDiagramsCommand(commandContext) {
    const resource = resolveTargetResourceForCommands(commandContext);
    if (!isMarkdownResource(resource)) {
      return;
    }

    const stem = basenameWorkspacePath(resource.path).replace(/\.(md|markdown|tfmd)$/i, '') || 'document';
    const rendered = await renderMarkdownResource(resource, {
      fenceExecutionOptions: {
        generatedAssetBasePath: `/generated/${sanitizeFilenameSegment(stem, 'diagram')}`,
        includePng: false,
        document: globalThis.document,
      },
    });

    if (rendered.generatedResources.length === 0) {
      window.alert('No Mermaid or Graphviz blocks were found in the selected Markdown resource.');
      return;
    }

    const svgResources = rendered.generatedResources.filter((descriptor) =>
      descriptor.representation === 'text' && descriptor.mimeType === 'image/svg+xml' && typeof descriptor.text === 'string');
    const pngResources = await rasterizeGeneratedDiagramSvgs(svgResources);
    const savedResources = [...rendered.generatedResources, ...pngResources]
      .map((descriptor) => upsertGeneratedWorkspaceResource(descriptor));
    await persistWorkspace('markdown.export-generated-diagrams');
    showTransientFlag(
      'Generated diagrams exported',
      `Saved ${svgResources.length} SVG and ${pngResources.length} PNG asset${svgResources.length + pngResources.length === 1 ? '' : 's'}.`,
      'info',
    );
    expandFolderPath('/generated');
    if (savedResources[0]) {
      openResourceEntry(savedResources[0], {
        placement: 'popup',
        preferredSurfaceId: '@textforge/assets/svg',
      });
    } else {
      emit();
    }
  }

  async function dropFilesOnWorkspaceFolder(folderId, files) {
    const folder = getEntry(folderId);
    if (!folder || folder.kind !== 'folder' || files.length === 0) {
      return;
    }

    await uploadFilesIntoFolder(folder.path, files, {
      reason: 'workspace.drop-folder',
    });
  }

  async function dropFilesOnTabStrip(files) {
    if (files.length === 0) {
      return;
    }

    await uploadFilesIntoFolder('/upload', files, {
      openFirst: true,
      placement: 'main',
      reason: 'workspace.drop-tabstrip',
    });
  }

  function registerCommandHandlers() {
    commandDispatcher
      .register('workspace.new-folder', ({ context }) => createFolderCommand(context))
      .register('workspace.new-resource', ({ context }) => createResourceCommand(context))
      .register('workspace.upload-file', ({ context }) => uploadFileCommand(context))
      .register('workspace.import-workspace', importWorkspaceCommand)
      .register('workspace.import-folder-zip', ({ context }) => importFolderZipCommand(context))
      .register('workspace.export-workspace', exportWorkspaceCommand)
      .register('workspace.export-selected-folder', ({ context }) => exportSelectedFolderCommand(context))
      .register('workspace.download-selected-file', ({ context }) => downloadSelectedFileCommand(context))
      .register('workspace.copy-selected-resource', ({ context }) => copySelectedResourceCommand(context))
      .register('workspace.rename-selected', ({ context }) => renameSelectedEntryCommand(context))
      .register('workspace.delete-selected', ({ context }) => deleteSelectedEntryCommand(context))
      .register('workspace.reset-storage', requestWorkspaceResetCommand)
      .register('workspace.retry-storage', retryWorkspaceLoadCommand)
      .register('lua.open-console', openLuaConsoleCommand)
      .register('lua.run-selected-resource', ({ context }) => runSelectedLuaResourceCommand(context))
      .register('lua.promote-selected-to-automation', ({ context }) => promoteSelectedLuaResourceCommand(context))
      .register('lua.reload-automation', reloadLuaAutomationCommand)
      .register('lua.open-automation-root', openLuaAutomationRootCommand)
      .register('surface.open-visuals', ({ context }) => openVisualsCommand(context))
      .register('surface.close-active', ({ context }) => closeActiveSurfaceCommand(context))
      .register('surface.close-all', ({ context }) => closeAllSurfaceCommand(context))
      .register('surface.refresh-active', ({ context }) => refreshActiveSurfaceCommand(context))
      .register('surface.move-active-to-main', ({ context }) => moveActiveSurfaceCommand('main', context))
      .register('surface.move-active-to-popup', ({ context }) => moveActiveSurfaceCommand('popup', context))
      .register('surface.focus-main-session', ({ context }) => focusMainSurfaceCommand(context))
      .register('surface.focus-popup-session', ({ context }) => focusPopupSurfaceCommand(context))
      .register('asset.download-selected', ({ context }) => downloadSelectedAssetCommand(context))
      .register('asset.export-selected-svg', ({ context }) => exportSelectedSvgCommand(context))
      .register('asset.export-selected-png', ({ context }) => exportSelectedPngCommand(context))
      .register('markdown.insert-image-reference', ({ context }) => insertMarkdownSnippetCommand('image', context))
      .register('markdown.insert-mermaid-block', ({ context }) => insertMarkdownSnippetCommand('mermaid', context))
      .register('markdown.insert-graphviz-block', ({ context }) => insertMarkdownSnippetCommand('graphviz', context))
      .register('markdown.export-print-html', ({ context }) => exportMarkdownPrintHtmlCommand(context))
      .register('markdown.export-generated-diagrams', ({ context }) => exportMarkdownGeneratedDiagramsCommand(context));

    for (const surfaceContribution of surfaceRegistry.list()) {
      commandDispatcher.register(`surface.open-with:${surfaceContribution.id}`, ({ command, context }) =>
        openWithSurfaceCommand(command.id, context));
    }

    for (const languageMode of languageModes) {
      commandDispatcher.register(`editor.set-language:${languageMode.languageId}`, ({ command, context }) =>
        setEditorLanguageCommand(command.id, context));
    }
  }

  async function executeCommand(commandId, commandContext) {
    closeContextMenu();
    const result = await commandDispatcher.execute(commandId, commandContext ? { context: commandContext } : undefined);
    if (!result.handled && !commandRegistry.get(commandId)) {
      throw new Error(`Unknown shell command: ${commandId}`);
    }
    return result;
  }

  async function hydrateWorkspace(options = {}) {
    tracePreview('hydrateWorkspace:start', {
      resetStorage: options.resetStorage === true,
      suppressInitialOpen: options.suppressInitialOpen === true,
      suppressSessionRestore: options.suppressSessionRestore === true,
    });
    runtime.recoveryPromptActive = false;
    runtime.status = 'loading';
    storageFailure = undefined;
    suspendWorkbenchUiStatePersistence = true;
    state.storageResetPending = false;
    if (options.resetStorage) {
      state.utilityPaneOpen = true;
      state.utilitySectionId = 'storage';
    }
    resetMountedSessions();
    disposePersistedWorkspace();
    emit();

    let baseWorkspace;

    try {
      if (options.resetStorage) {
        await resetWorkspaceDexieStorage({ databaseName: workspaceDatabaseName });
      }

      const hydrated = await createPersistedWorkspaceService({
        workspaceId: 'textforge-shell',
        name: 'TextForge Workspace',
        now: createTimestampFactory(),
        idFactory: createSequentialIdFactory('workspace'),
        seed: createUserSeedWorkspaceState(),
        storageOptions: {
          databaseName: workspaceDatabaseName,
        },
      });
      persistedWorkspace = hydrated.workspace;
      baseWorkspace = hydrated.workspace;
      const sanitizedWorkspace = sanitizePersistentWorkspaceState(hydrated.workspace.snapshot());
      if (sanitizedWorkspace.changed) {
        hydrated.workspace.replaceState(sanitizedWorkspace.state);
        await hydrated.workspace.persistNow('workspace.strip-bundled-overlay');
      }
      hydrationSource = hydrated.hydrationSource;
    } catch (error) {
      if (!isWorkspaceStorageError(error)) {
        throw error;
      }

      storageFailure = createStorageFailure(error);
      if (isWorkspaceStorageResetRequired(error)) {
        workspace = createEmptyWorkspaceService();
        hydrationSource = 'seed';
        runtime.status = 'error';
        state.selectedWorkspaceItemId = undefined;
        state.utilityPaneOpen = true;
        state.utilitySectionId = 'storage';
        suspendWorkbenchUiStatePersistence = false;
        emit();
        return;
      }

      baseWorkspace = createTransientWorkspaceService(error);
      persistedWorkspace = baseWorkspace;
      hydrationSource = 'transient';
      state.utilityPaneOpen = true;
      state.utilitySectionId = 'storage';
    }

    applyWorkspaceOverlay(baseWorkspace);
    unsubscribePersistence = baseWorkspace.subscribePersistence?.(() => emit());

    try {
      if (!runtime.skipLuaPreloadOnce) {
        try {
          reloadLuaAutomation();
        } catch (error) {
          console.error('TextForge Lua automation preload failed.', error);
          showTransientFlag('Lua automation skipped', error?.message ?? 'Lua automation preload failed.');
        }
      }
      runtime.status = 'ready';
      tracePreview('hydrateWorkspace:ready', {
        hydrationSource,
      });

      const selectedEntry = getEntry(workspace.getManifest().selectedResourceId) ?? getDefaultSelection();
      rememberSelection(selectedEntry?.id, { expandAncestors: false });
      normalizeActiveSessions();
      const restoredSessions = options.suppressSessionRestore
        ? false
        : restoreWorkbenchUiSessions();

      const initialOpenProfile = options.suppressInitialOpen
        ? undefined
        : workbenchTestProfile;
      const presetEntry = initialOpenProfile?.openResourcePath
        ? workspace.getEntryByPath(initialOpenProfile.openResourcePath)
        : undefined;
      const initialEntry = presetEntry ?? selectedEntry;

      if (!restoredSessions && initialEntry && initialEntry.kind !== 'folder' && listMainSessions().length === 0 && listPopupSessions().length === 0) {
        tracePreview('hydrateWorkspace:initial-open', {
          path: initialEntry.path,
          preferredSurfaceId: initialOpenProfile?.preferredSurfaceId ?? null,
        });
        openResourceEntry(initialEntry, {
          placement: initialOpenProfile?.openPlacement,
          preferredSurfaceId: initialOpenProfile?.preferredSurfaceId,
          expandSelection: false,
        });
      } else {
        tracePreview('hydrateWorkspace:initial-open-skipped', { restoredSessions });
        emit();
      }
      try {
        await applyWorkbenchBootstrapOptions();
      } catch (error) {
        console.error('TextForge startup bootstrap failed.', error);
        showTransientFlag('Startup action skipped', error?.message ?? 'A startup command failed.');
      }
      suspendWorkbenchUiStatePersistence = false;
      persistWorkbenchUiState();
    } catch (error) {
      console.error('TextForge workspace startup failed after storage hydration.', error);
      runtime.status = 'ready';
      showTransientFlag('Startup restore skipped', error?.message ?? 'A startup restore step failed.');
      suspendWorkbenchUiStatePersistence = false;
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

  async function openRecoveryWorkspaceWithoutFiles() {
    clearWorkbenchRecoveryMode();
    await hydrateWorkspace({
      suppressInitialOpen: true,
      suppressSessionRestore: true,
    });
  }

  async function resetRecoveryWorkspace() {
    clearWorkbenchRecoveryMode();
    await hydrateWorkspace({
      resetStorage: true,
      suppressInitialOpen: true,
      suppressSessionRestore: true,
    });
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
        state: runtime.status === 'loading'
          ? 'persisting'
          : runtime.status === 'error'
            ? 'error'
            : 'idle',
        driver: 'dexie',
        databaseName: workspaceDatabaseName,
        schemaVersion: workspaceDexieSchemaVersion,
        browserManaged: true,
        lastSavedAt: undefined,
        pendingReason: runtime.status === 'loading'
          ? 'hydrate'
          : runtime.status === 'error'
            ? 'recovery-required'
            : 'recovery-startup',
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
    const contextMenu = buildContextMenuCommands(state.contextMenu);
    const mainFrame = createMainSessionTabStrip(mainSessions.map((session) => ({
      ...session,
      title: session.title ?? getEntry(session.resource.resourceId)?.metadata.title ?? getEntry(session.resource.resourceId)?.path,
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
          title: session.title ?? resource?.metadata.title ?? resource?.path,
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
    const elevatedLuaConsoleCount = runtime.status === 'ready'
      ? [...luaConsoleSessionStateByResourceId.values()].filter((sessionState) => sessionState?.elevated === true).length
      : 0;
    const activeResource = describeActiveResource();
    const activeCommandSession = runtime.status === 'ready' ? getActiveCommandSession() : undefined;
    const inspectedDocumentEntry = runtime.status === 'ready'
      ? getEntry(activeCommandSession?.resource.resourceId)
        ?? getSelectedEntry()
      : undefined;
    const documentContributionContext = isWorkspaceResource(inspectedDocumentEntry)
      ? resolveDocumentContributionContextForEntry(inspectedDocumentEntry)
      : undefined;
    const contributionInspectorModel = resolveContributionInspectorModelForEntry(inspectedDocumentEntry);
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
        ...(elevatedLuaConsoleCount > 0
          ? [
            createStatusBadge({
              id: 'lua-power-status',
              label: `${elevatedLuaConsoleCount} Lua power session${elevatedLuaConsoleCount === 1 ? '' : 's'}`,
              tone: 'warning',
              icon: 'warning',
              detail: 'Power session active: elevated Lua sessions keep approved host-object access until the console session ends or the app restarts.',
            }),
          ]
          : []),
        ...(runtime.skipLuaPreloadOnce
          ? [
            createStatusBadge({
              id: 'lua-skip-preload-status',
              label: 'Lua preload skipped once',
              tone: 'info',
              icon: 'status',
              detail: 'Recovery boot skipped Lua automation discovery and Lua bootstrap commands for this startup only.',
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
        recoveryPromptActive: runtime.recoveryPromptActive,
        skipLuaPreloadOnce: runtime.skipLuaPreloadOnce,
        storageFailure,
      },
      persistenceStatus,
      chromeModel,
      commandMenus,
      commandPaletteEntries,
      contextMenu,
      contributionInspectorModel,
      documentContributionContext,
      inspectedDocumentEntry: isWorkspaceResource(inspectedDocumentEntry) ? inspectedDocumentEntry : undefined,
      badgeDiagnostics,
      popupFrame,
      visualTargetPicker: state.visualTargetPicker
        ? {
          ...state.visualTargetPicker,
          resource: getEntry(state.visualTargetPicker.resourceId),
        }
        : undefined,
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
    clearTransientFlagTimeout();
    for (const lease of assetLeaseByResourceId.values()) {
      blobLedger.release(lease.id);
    }
    assetLeaseByResourceId.clear();
    activeTextDocuments.clear();
    markdownPreviewRequests.clear();
    listeners.clear();
    disposePersistedWorkspace();
  }

  registerCommandHandlers();
  if (!runtime.recoveryPromptActive) {
    void hydrateWorkspace();
  }

  return {
    subscribe,
    snapshot,
    dispose,
    actions: {
      activateWorkspaceItem,
      beginWorkspaceTreeEdit,
      cancelStorageReset,
      closeActivePopupSurface,
      closeContextMenu,
      cancelWorkspaceTreeEdit,
      closeVisualTargetPicker,
      closeSession,
      commitWorkspaceTreeEdit,
      confirmStorageReset,
      createTextResourceInSelectedFolder,
      dropFilesOnTabStrip,
      dropFilesOnWorkspaceFolder,
      executeCommand,
      focusMainSession,
      focusPopupSession,
      openMainTabContextMenu,
      openPopupSessionContextMenu,
      openRecoveryWorkspaceWithoutFiles,
      openSelectedVisualTargets,
      openWorkspaceItemContextMenu,
      moveWorkspaceItem,
      requestStorageReset,
      resetRecoveryWorkspace,
      retryStorageInitialization,
      selectWorkspaceItem,
      setUtilityPaneCollapsed,
      setWorkspaceTreeCollapsed,
      setUtilitySection,
      toggleVisualTargetPickerSelection,
      toggleWorkspaceFolder,
      toggleUtilityPane,
      toggleWorkspaceTree,
      updateWorkspaceTreeEditValue,
    },
  };
}
