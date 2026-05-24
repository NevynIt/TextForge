import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { contributions as coreContributions } from '@textforge/core';
import {
  createWorkspaceService,
  createWorkspaceTreeItems,
  workspaceContribution as workspaceContributionPack,
  workspaceEntryToResourceRef,
} from '@textforge/workspace';
import {
  contributions as surfaceContributionPack,
  createMainSessionTabStrip,
  createMainSurfaceHost,
  createOpenWithSelection,
  createPopupSurfaceHost,
  createSequentialSessionIdFactory,
  createSurfaceRegistry,
  createSurfaceSessionTab,
  listOpenSurfaceSessions,
} from '@textforge/surfaces';
import {
  codeMirrorTextEditorSurfaceContribution,
  createCodeMirrorTextEditorSurface,
  createTextEditorDocument,
  contributions as editorContributionPack,
  listTextEditorLanguageModes,
} from '@textforge/editors';
import {
  assetSurfaceContributions,
  createAssetViewerSurface,
  createBinaryAssetViewerSurface,
  createBlobUrlLedger,
  createImageAssetViewerSurface,
  createPdfAssetViewerSurface,
  createSvgAssetViewerSurface,
  createWorkspaceAssetBinding,
  contributions as assetContributionPack,
  markAssetBindingReady,
} from '@textforge/assets';
import {
  TextForgeAppFrame,
  TextForgeSelectField,
  TextForgeSessionTabStrip,
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
const utilitySections = [
  { id: 'popups', label: 'Popup Sessions' },
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

function createInitialWorkspace() {
  const now = createTimestampFactory();
  const workspace = createWorkspaceService({
    workspaceId: 'textforge-shell',
    name: 'TextForge Workspace',
    now,
    idFactory: createSequentialSessionIdFactory('workspace'),
  });

  workspace.createFolder({ path: '/docs', title: 'docs' });
  workspace.createFolder({ path: '/roadmap', title: 'roadmap' });
  const notes = workspace.createTextResource({
    path: '/docs/notes.md',
    title: 'notes.md',
    text: '# TextForge\n\nPhase 3.1 moves the workbench shell into React while keeping the package-owned editor and asset surfaces intact.',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  const architecture = workspace.createTextResource({
    path: '/docs/architecture.txt',
    title: 'architecture.txt',
    text: 'The React shell consumes workspace, surface, editor, asset, and UI package contracts without moving feature logic into the app.',
    mimeType: 'text/plain',
  });
  const settings = workspace.createTextResource({
    path: '/docs/settings.yaml',
    title: 'settings.yaml',
    text: 'workspace: textforge\nshell: react\nstorage: local-first\n',
    languageId: 'yaml',
    mimeType: 'text/yaml',
  });
  const roadmap = workspace.createTextResource({
    path: '/roadmap/phase-3-1-react-shell.md',
    title: 'phase-3-1-react-shell.md',
    text: 'React shell recovery keeps the current surface registry and mounts the existing editor and asset surfaces inside a real workbench frame.',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  const svg = workspace.createBinaryResource({
    path: '/docs/system.svg',
    title: 'system.svg',
    bytes: createBinarySvgBytes(),
    mimeType: 'image/svg+xml',
  });

  return {
    workspace,
    resources: {
      notes,
      architecture,
      settings,
      roadmap,
      svg,
    },
  };
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

function createContributionPacks() {
  return [
    coreContributions,
    workspaceContributionPack,
    surfaceContributionPack,
    editorContributionPack,
    assetContributionPack,
    uiContributionPack,
  ];
}

function createWelcomeView() {
  return {
    id: 'welcome',
    kind: 'welcome',
    mountId: 'welcome',
    title: 'React workbench shell',
    summary: 'The shell frame, workspace tree, main tab strip, and utility pane are now rendered through @textforge/ui React primitives.',
    openWith: 'Shell chrome',
    state: 'open',
    placement: 'main',
    controls: [],
  };
}

function createTextForgeWorkbenchController() {
  const { workspace, resources } = createInitialWorkspace();
  const blobLedger = createBlobUrlLedger(createBlobUrlDriver());
  const languageModes = listTextEditorLanguageModes();
  const parserBackedLanguageCount = languageModes.filter((mode) => mode.parserBacked).length;
  const surfaceRegistry = createSurfaceRegistry([
    codeMirrorTextEditorSurfaceContribution,
    ...assetSurfaceContributions,
  ]);
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
    selectedWorkspaceItemId: resources.notes.id,
    utilityPaneOpen: false,
    utilitySectionId: 'registry',
    workspaceTreeCollapsed: false,
  };

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
    return workspace.getEntry(resourceId);
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
    return getOpenSessions().find((session) => session.id === sessionId);
  }

  function findSessionForResource(resourceId) {
    return getOpenSessions().find((session) => session.resource.resourceId === resourceId);
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
    const stillMounted = getOpenSessions().some((session) => session.resource.resourceId === resourceId);
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

    if (popupSessions.length === 0 && state.utilitySectionId === 'popups') {
      state.utilitySectionId = 'registry';
    }
  }

  function openResourceEntry(entry, options = {}) {
    const existingSession = findSessionForResource(entry.id);
    const requestedPlacement = options.placement ?? existingSession?.placement ?? (entry.kind === 'binary' ? 'popup' : 'main');
    const preferredSurfaceId = options.preferredSurfaceId;
    if (
      existingSession &&
      existingSession.placement === requestedPlacement &&
      (!preferredSurfaceId || existingSession.contributionId === preferredSurfaceId)
    ) {
      getHostForPlacement(existingSession.placement).focus(existingSession.id);
      if (requestedPlacement === 'popup') {
        state.activePopupSessionId = existingSession.id;
        state.utilityPaneOpen = true;
        state.utilitySectionId = 'popups';
      } else {
        state.activeMainSessionId = existingSession.id;
      }
      state.selectedWorkspaceItemId = entry.id;
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
    } else {
      state.activeMainSessionId = session.id;
    }

    state.selectedWorkspaceItemId = entry.id;
    normalizeActiveSessions();
    emit();
    return session;
  }

  function focusMainSession(sessionId) {
    const session = mainHost.focus(sessionId) ?? findSessionById(sessionId);
    if (!session) {
      return;
    }

    state.activeMainSessionId = session.id;
    state.selectedWorkspaceItemId = session.resource.resourceId;
    emit();
  }

  function focusPopupSession(sessionId) {
    const session = popupHost.focus(sessionId) ?? findSessionById(sessionId);
    if (!session) {
      return;
    }

    state.activePopupSessionId = session.id;
    state.selectedWorkspaceItemId = session.resource.resourceId;
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
    state.selectedWorkspaceItemId = itemId;
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
    emit();
  }

  function updateTextResourceLanguage(resourceId, languageId) {
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
    state.selectedWorkspaceItemId = resourceId;
    emit();
  }

  function handleToolbarAction(slotId) {
    const entryBySlotId = {
      'open-notes': resources.notes,
      'open-architecture': resources.architecture,
      'open-roadmap': resources.roadmap,
    };
    const entry = entryBySlotId[slotId];
    if (entry) {
      openResourceEntry(entry);
      return;
    }

    if (slotId === 'open-registry') {
      state.utilityPaneOpen = true;
      state.utilitySectionId = 'registry';
      emit();
    }
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
    const entry = getEntry(state.selectedWorkspaceItemId) ?? resources.notes;
    return {
      title: entry.metadata.title ?? entry.path,
      path: entry.path,
      kind: entry.kind,
      detail: entry.kind === 'folder'
        ? 'Folder selection drives the workspace context without opening a surface.'
        : entry.kind === 'text'
          ? 'Text resources open in the main workbench session strip.'
          : 'Binary resources open in popup sessions that live in the utility pane.',
    };
  }

  function getActiveMainView() {
    const session = state.activeMainSessionId ? mainHost.get(state.activeMainSessionId) : undefined;
    if (!session || session.state === 'closed') {
      return createWelcomeView();
    }

    return createSurfaceView(session);
  }

  function getActivePopupView() {
    const session = state.activePopupSessionId ? popupHost.get(state.activePopupSessionId) : undefined;
    if (!session || session.state === 'closed') {
      return undefined;
    }

    return createSurfaceView(session);
  }

  function buildSnapshot() {
    normalizeActiveSessions();
    const treeItems = createWorkspaceTreeItems(workspace.snapshot());
    const mainSessions = listMainSessions();
    const popupSessions = listPopupSessions();
    const mainFrame = createMainSessionTabStrip(mainHost.list(), {
      activeTabId: state.activeMainSessionId,
    });
    const popupFrame = {
      id: 'popup-session-tab-strip',
      title: 'Popup sessions',
      placement: 'popup',
      layout: 'tabs',
      tabs: popupSessions.map((session) => createSurfaceSessionTab(session)),
      activeTabId: state.activePopupSessionId,
    };
    const chromeModel = createWorkbenchChromeModel({
      subtitle: 'React workbench recovery with package-owned surfaces',
      workspaceTree: createWorkspaceTreeFrameModel({
        items: treeItems,
        rootLabel: workspace.snapshot().manifest.name ?? 'Workspace root',
        selectedResourceId: state.selectedWorkspaceItemId,
      }),
      surfaceFrame: mainFrame,
      toolbarSlots: [
        createToolbarSlot({ id: 'open-notes', label: 'Open notes', kind: 'workspace', pinned: true }),
        createToolbarSlot({ id: 'open-architecture', label: 'Architecture note', kind: 'workspace' }),
        createToolbarSlot({ id: 'open-roadmap', label: 'Roadmap note', kind: 'workspace' }),
        createToolbarSlot({ id: 'open-registry', label: 'Registry', kind: 'navigation' }),
      ],
      statusBadges: [
        createStatusBadge({
          id: 'workspace-status',
          label: `${treeItems.length} items`,
          tone: 'success',
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
          id: 'language-status',
          label: `${parserBackedLanguageCount} parser-backed modes`,
          tone: 'info',
        }),
      ],
    });

    return {
      chromeModel,
      contributionPacks: createContributionPacks(),
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
  }

  openResourceEntry(resources.notes, { placement: 'main' });

  return {
    subscribe,
    snapshot,
    dispose,
    actions: {
      closeSession,
      focusMainSession,
      focusPopupSession,
      handleToolbarAction,
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

function WelcomeState() {
  return element(
    'section',
    { className: 'tf-welcome', 'data-view-kind': 'welcome' },
    element('span', { className: 'tf-welcome__eyebrow' }, 'Phase 3.1'),
    element('h3', null, 'React workbench shell'),
    element(
      'p',
      null,
      'This shell is now rendered through React while the text editor and asset viewers still come from their package-owned surface factories.',
    ),
    element(
      'ul',
      { className: 'tf-welcome__list' },
      element('li', null, 'Collapsible workspace tree region'),
      element('li', null, 'Main-session tab strip for document surfaces'),
      element('li', null, 'Utility/debug pane for popup sessions and registry visibility'),
      element('li', null, 'Open-with and language controls preserved from package models'),
    ),
  );
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
        { key: pack.id, className: 'tf-registry__card' },
        element(
          'div',
          { className: 'tf-registry__header' },
          element('strong', null, pack.id),
          element('span', null, `${pack.surfaces.length} surfaces`),
        ),
        element('p', null, 'Package contribution pack available to the workbench shell.'),
      )),
  );
}

function PopupSessionsView({ controller, popupFrame, popupView }) {
  if (popupFrame.tabs.length === 0) {
    return element(
      'div',
      { className: 'tf-empty' },
      'No popup sessions are open. Open a binary resource from the workspace tree to mount it here.',
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
  const mainView = snapshot.activeMainView;
  const utilityOpen = snapshot.state.utilityPaneOpen;
  const showPopupSessions = snapshot.state.utilitySectionId === 'popups';

  return element(
    TextForgeAppFrame,
    {
      footer: [
        element('span', { key: 'phase' }, 'Phase 3.1 React workbench shell'),
        element('span', { key: 'detail' }, 'Local runnable artifact preserved through the classic Vite loader bundle'),
      ],
      header: element(TextForgeTopBar, {
        brandTitle: snapshot.chromeModel.brandTitle,
        onToggleSidebar: controller.actions.toggleWorkspaceTree,
        onToggleUtility: controller.actions.toggleUtilityPane,
        onToolbarAction: controller.actions.handleToolbarAction,
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
          subtitle: 'Popup surfaces and registry visibility stay out of the main document strip.',
          title: 'Utility',
        },
        showPopupSessions
          ? element(PopupSessionsView, {
              controller,
              popupFrame: snapshot.popupFrame,
              popupView: snapshot.activePopupView,
            })
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
          mainView.kind === 'welcome' ? element(WelcomeState) : element(SurfaceMount, { view: mainView }),
        ),
        element(SurfaceDetails, { view: mainView }),
      ),
    ),
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
