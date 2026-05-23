import { contributions as coreContributions } from '@textforge/core';
import {
  createWorkspaceService,
  createWorkspaceTreeItems,
  workspaceContribution as workspaceContributionPack,
  workspaceEntryToResourceRef,
} from '@textforge/workspace';
import {
  contributions as surfaceContributionPack,
  createMainSurfaceHost,
  createOpenWithSelection,
  createPopupSurfaceHost,
  createSequentialSessionIdFactory,
  createSurfaceRegistry,
  createSurfaceSessionTab,
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
  createBinaryAssetViewerSurface,
  createAssetViewerSurface,
  createBlobUrlLedger,
  createImageAssetViewerSurface,
  createPdfAssetViewerSurface,
  createSvgAssetViewerSurface,
  createWorkspaceAssetBinding,
  contributions as assetContributionPack,
  markAssetBindingReady,
} from '@textforge/assets';
import {
  contributions as uiContributionPack,
  createStatusBadge,
  createSurfaceFrameModel,
  createToolbarSlot,
  createWorkbenchChromeModel,
  createWorkspaceTreeFrameModel,
} from '@textforge/ui';

const textEncoder = new TextEncoder();

function createTimestampFactory() {
  return () => new Date().toISOString();
}

function createBinarySvgBytes() {
  return textEncoder.encode(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
      <defs>
        <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#48b6a8" />
          <stop offset="100%" stop-color="#f4b860" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="26" fill="#08111f" />
      <rect x="18" y="18" width="284" height="164" rx="22" fill="url(#g)" opacity="0.16" />
      <circle cx="82" cy="100" r="28" fill="none" stroke="#baf3ec" stroke-width="8" />
      <path d="M150 124 L202 72 L246 124" fill="none" stroke="#f8fafc" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M82 132 L105 100 L120 116 L140 88" fill="none" stroke="#f4b860" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
      <text x="24" y="38" fill="#dbeafe" font-family="sans-serif" font-size="18">TextForge system.svg</text>
    </svg>
  `);
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function clearElement(element) {
  element.replaceChildren();
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
    text: '# TextForge\n\nThe shell is wired to package-driven workspace, surface, editor, and asset APIs.',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  const architecture = workspace.createTextResource({
    path: '/docs/architecture.txt',
    title: 'architecture.txt',
    text: 'The first runnable shell composes package contracts instead of hard-coded view state.',
    mimeType: 'text/plain',
  });
  const settings = workspace.createTextResource({
    path: '/docs/settings.yaml',
    title: 'settings.yaml',
    text: 'workspace: textforge\nmode: local-first\n',
    languageId: 'yaml',
    mimeType: 'text/yaml',
  });
  const roadmap = workspace.createTextResource({
    path: '/roadmap/phase-1-gap-audit-2026-05-23.md',
    title: 'phase-1-gap-audit-2026-05-23.md',
    text: 'Phase 1 closure requires package-backed shells, concrete editor surfaces, and concrete asset viewers.',
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

const assetSurfaceFactoryByContributionId = {
  '@textforge/assets/image': createImageAssetViewerSurface,
  '@textforge/assets/svg': createSvgAssetViewerSurface,
  '@textforge/assets/pdf': createPdfAssetViewerSurface,
  '@textforge/assets/binary': createBinaryAssetViewerSurface,
};

export function bootTextForgeShell(rootElement) {
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
  const state = {
    activeTabId: 'welcome',
    selectedWorkspaceItemId: resources.notes.id,
  };

  function getEntry(resourceId) {
    return workspace.getEntry(resourceId);
  }

  function listActiveSessions() {
    return [...mainHost.list(), ...popupHost.list()].filter((session) => session.state !== 'closed');
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

  function getSession(sessionId) {
    return listActiveSessions().find((session) => session.id === sessionId);
  }

  function findSessionForResource(resourceId) {
    return listActiveSessions().find((session) => session.resource.resourceId === resourceId);
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
      state.activeTabId = existingSession.id;
      state.selectedWorkspaceItemId = entry.id;
      render();
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
    }

    state.activeTabId = session.id;
    state.selectedWorkspaceItemId = entry.id;
    render();
    return session;
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
    render();
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
      }
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

  function describeWelcomeSurface() {
    return {
      title: 'Welcome to TextForge',
      summary: 'The package-driven shell is live, with workspace, surface, editor, asset, open-with, and language-mode chrome composing the view.',
      openWith: 'Shell routing',
      state: 'open',
      placement: 'main',
      mount(container) {
        const card = document.createElement('div');
        card.className = 'welcome-card';
        card.innerHTML = `
          <p>This checkpoint proves the shell is not hard-coded anymore. It now renders workspace state and package-driven surfaces from the Phase 1 package APIs.</p>
          <ul>
            <li>Workspace tree from @textforge/workspace</li>
            <li>Surface routing from @textforge/surfaces</li>
            <li>Text editor surface from @textforge/editors</li>
            <li>Asset viewers from @textforge/assets</li>
            <li>Open-with and language selection chrome from package models</li>
          </ul>
        `;
        container.replaceChildren(card);
      },
    };
  }

  function describeWorkspaceSurface() {
    const selected = getEntry(state.selectedWorkspaceItemId) ?? resources.notes;
    const treeItems = createWorkspaceTreeItems(workspace.snapshot());
    const selectedItem = treeItems.find((item) => item.id === selected.id) ?? treeItems[0];
    return {
      title: 'Workspace',
      summary: 'The workspace tree is now derived from the package service snapshot rather than hard-coded rows.',
      openWith: 'Workspace navigator',
      state: 'active',
      placement: 'sidebar',
      mount(container) {
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.innerHTML = `
          <span class="folder-card__title">${escapeHtml(selectedItem?.label ?? selected.metadata.title ?? selected.path)}</span>
          <span class="folder-card__meta">${escapeHtml(selected.path)} - ${escapeHtml(selected.kind)}</span>
          <p class="folder-card__body">Tree items are built from the workspace service snapshot and selected resource state.</p>
        `;
        container.replaceChildren(card);
      },
    };
  }

  function describeSessionSurface(session) {
    const resource = getEntry(session.resource.resourceId);
    if (!resource) {
      return describeWelcomeSurface();
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
        },
      });
      return {
        title: surface.model.title,
        summary: surface.model.summary,
        openWith,
        state: session.state,
        placement: session.placement,
        controls: [...controls, createLanguageControl(resource, surface.model)],
        mount(container) {
          surface.mount(container);
        },
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
      title: surface.model.title,
      summary: surface.model.summary,
      openWith,
      state: session.state,
      placement: session.placement,
      controls,
      mount(container) {
        surface.mount(container);
      },
    };
  }

  const initialNotesSession = openResourceEntry(resources.notes);
  openResourceEntry(resources.svg);
  state.activeTabId = initialNotesSession.id;

  function getActiveView() {
    if (state.activeTabId === 'welcome') {
      return describeWelcomeSurface();
    }

    if (state.activeTabId === 'workspace') {
      return describeWorkspaceSurface();
    }

    const session = getSession(state.activeTabId);
    if (session) {
      return describeSessionSurface(session);
    }

    return describeWelcomeSurface();
  }

  function createToolbarAction(slot) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-button';
    button.textContent = slot.label;

    if (slot.id === 'open-workspace') {
      button.addEventListener('click', () => {
        state.activeTabId = 'workspace';
        render();
      });
    } else if (slot.id === 'insert-item') {
      button.addEventListener('click', () => {
        openResourceEntry(resources.architecture);
      });
    } else {
      button.addEventListener('click', () => {
        state.activeTabId = 'welcome';
        render();
      });
    }

    return button;
  }

  function createTreeRow(item) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `tree-row${item.id === state.selectedWorkspaceItemId ? ' is-active' : ''}`;
    row.style.setProperty('--depth', String(item.depth));
    row.dataset.itemId = item.id;
    row.innerHTML = `
      <span class="tree-label">
        <span class="tree-kind">${escapeHtml(item.kind)}</span>
        <span>${escapeHtml(item.label)}</span>
      </span>
      <span class="tree-badge">${escapeHtml(item.badge ?? '')}</span>
    `;
    row.addEventListener('click', () => {
      state.selectedWorkspaceItemId = item.id;
      const entry = getEntry(item.id);
      if (entry?.kind === 'folder') {
        state.activeTabId = 'workspace';
        render();
      } else if (entry) {
        openResourceEntry(entry);
      }
    });
    return row;
  }

  function createTabButton(tab) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tab${tab.id === state.activeTabId ? ' is-active' : ''}`;
    button.textContent = tab.title;
    button.dataset.tabId = tab.id;
    button.addEventListener('click', () => {
      state.activeTabId = tab.id;
      if (tab.id === 'workspace') {
        state.selectedWorkspaceItemId = state.selectedWorkspaceItemId ?? resources.notes.id;
      }
      render();
    });
    return button;
  }

  function createSelectControl(config) {
    const field = document.createElement('label');
    field.className = 'surface-control';

    const label = document.createElement('span');
    label.className = 'surface-control__label';
    label.textContent = config.label;

    const input = document.createElement('select');
    input.className = 'surface-control__input';
    input.value = config.value;
    input.disabled = Boolean(config.disabled);
    for (const optionConfig of config.options) {
      const option = document.createElement('option');
      option.value = optionConfig.value;
      option.textContent = optionConfig.label;
      if (optionConfig.description) {
        option.title = optionConfig.description;
      }
      input.append(option);
    }

    input.value = config.value;
    input.addEventListener('change', (event) => {
      config.onChange(event.currentTarget.value);
    });

    field.append(label, input);

    if (config.description) {
      const description = document.createElement('span');
      description.className = 'surface-control__description';
      description.textContent = config.description;
      field.append(description);
    }

    return field;
  }

  function syncSurfaceControls(container, activeView) {
    clearElement(container);
    const controls = activeView.controls ?? [];
    container.hidden = controls.length === 0;
    if (controls.length === 0) {
      return;
    }

    container.append(...controls.map((control) => createSelectControl(control)));
  }

  function renderShell() {
    const treeItems = createWorkspaceTreeItems(workspace.snapshot());
    const openSessions = listActiveSessions();
    const tabs = [
      { id: 'welcome', title: 'Welcome', surfaceId: 'welcome', active: state.activeTabId === 'welcome' },
      { id: 'workspace', title: 'Workspace', surfaceId: 'workspace', active: state.activeTabId === 'workspace' },
      ...openSessions.map((session) => ({
        ...createSurfaceSessionTab(session),
        title: `${session.title} - ${session.placement}`,
        active: session.id === state.activeTabId,
      })),
    ];
    const activeView = getActiveView();
    const statusBadges = [
      createStatusBadge({
        id: 'workspace-status',
        label: `${treeItems.length} tree items`,
        tone: 'success',
      }),
      createStatusBadge({
        id: 'surface-status',
        label: `${openSessions.length} routed surfaces`,
        tone: activeView.state === 'open' ? 'success' : 'info',
      }),
      createStatusBadge({
        id: 'package-status',
        label: 'Package APIs wired',
        tone: 'neutral',
      }),
      createStatusBadge({
        id: 'language-status',
        label: `${parserBackedLanguageCount} parser-backed modes`,
        tone: 'info',
      }),
    ];
    const chromeModel = createWorkbenchChromeModel({
      workspaceTree: createWorkspaceTreeFrameModel({
        items: treeItems,
        selectedResourceId: state.selectedWorkspaceItemId,
      }),
      surfaceFrame: createSurfaceFrameModel({
        placement: activeView.placement === 'popup' ? 'popup' : 'main',
        tabs,
        activeTabId: state.activeTabId,
      }),
      toolbarSlots: [
        createToolbarSlot({ id: 'open-workspace', label: 'Open workspace', kind: 'workspace', pinned: true }),
        createToolbarSlot({ id: 'insert-item', label: 'Open architecture note', kind: 'command' }),
        createToolbarSlot({ id: 'focus-surface', label: 'Welcome', kind: 'navigation' }),
      ],
      statusBadges,
    });

    rootElement.innerHTML = '';

    const shell = document.createElement('div');
    shell.className = 'shell';

    shell.append(
      createShellHeader(chromeModel),
      createWorkspacePanel(chromeModel.workspaceTree),
      createSurfacePanel(chromeModel.surfaceFrame, activeView),
      createInspectorPanel(),
      createFooter(),
    );

    rootElement.append(shell);
  }

  function createShellHeader(chromeModel) {
    const header = document.createElement('header');
    header.className = 'shell-header';

    const brand = document.createElement('div');
    brand.className = 'brand';
    const brandMark = document.createElement('div');
    brandMark.className = 'brand-mark';
    brandMark.textContent = 'TF';
    const brandText = document.createElement('div');
    brandText.className = 'brand-text';
    brandText.innerHTML = `
      <strong>${escapeHtml(chromeModel.brandTitle)}</strong>
      <span>${escapeHtml(chromeModel.subtitle ?? 'Package-driven workbench shell')}</span>
    `;
    brand.append(brandMark, brandText);

    const statusRail = document.createElement('div');
    statusRail.className = 'status-rail';
    statusRail.append(...chromeModel.statusBadges.map((badge) => {
      const el = document.createElement('span');
      el.className = `badge badge--${badge.tone}`;
      el.textContent = badge.label;
      return el;
    }));

    const actionRail = document.createElement('div');
    actionRail.className = 'action-rail';
    actionRail.append(...chromeModel.toolbarSlots.map((slot) => createToolbarAction(slot)));

    header.append(brand, statusRail, actionRail);
    return header;
  }

  function createWorkspacePanel(workspaceTree) {
    const panel = document.createElement('section');
    panel.className = 'panel workspace-panel';

    const titleBar = document.createElement('div');
    titleBar.className = 'panel-titlebar';
    titleBar.innerHTML = `
      <h2>${escapeHtml(workspaceTree.title)}</h2>
      <span class="panel-subtitle">${escapeHtml(workspaceTree.rootLabel)}</span>
    `;

    const tree = document.createElement('div');
    tree.className = 'workspace-tree';
    tree.append(...workspaceTree.items.map((item) => createTreeRow(item)));

    const treeFooter = document.createElement('div');
    treeFooter.className = 'panel-footer';
    treeFooter.textContent = 'Open-with routing maps source items to their default surfaces.';

    panel.append(titleBar, tree, treeFooter);
    return panel;
  }

  function createSurfacePanel(surfaceFrame, activeView) {
    const panel = document.createElement('section');
    panel.className = 'panel surface-panel';

    const titleBar = document.createElement('div');
    titleBar.className = 'panel-titlebar';
    titleBar.innerHTML = `
      <h2>${escapeHtml(surfaceFrame.title)}</h2>
      <span class="panel-subtitle">${escapeHtml(activeView.openWith ?? 'Package-driven routing')}</span>
    `;

    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';
    tabBar.append(...surfaceFrame.tabs.map((tab) => createTabButton(tab)));

    const surfaceBody = document.createElement('div');
    surfaceBody.className = 'surface-body';
    surfaceBody.innerHTML = `
      <div class="surface-card">
        <div class="surface-card__eyebrow">Current surface</div>
        <h3 id="surface-title"></h3>
        <p id="surface-summary"></p>
        <div class="surface-stats">
          <div><span>Placement</span><strong id="surface-placement"></strong></div>
          <div><span>Open-with</span><strong id="surface-openwith"></strong></div>
          <div><span>State</span><strong id="surface-state"></strong></div>
        </div>
        <div class="surface-controls" id="surface-controls"></div>
      </div>
      <div class="surface-preview" id="surface-preview"></div>
    `;

    panel.append(titleBar, tabBar, surfaceBody);
    syncSurfaceCard(surfaceBody, activeView);
    return panel;
  }

  function syncSurfaceCard(surfaceBody, activeView) {
    const surfaceTitle = surfaceBody.querySelector('#surface-title');
    const surfaceSummary = surfaceBody.querySelector('#surface-summary');
    const surfacePlacement = surfaceBody.querySelector('#surface-placement');
    const surfaceOpenWith = surfaceBody.querySelector('#surface-openwith');
    const surfaceState = surfaceBody.querySelector('#surface-state');
    const surfaceControls = surfaceBody.querySelector('#surface-controls');
    const surfacePreview = surfaceBody.querySelector('#surface-preview');

    if (!surfaceTitle || !surfaceSummary || !surfacePlacement || !surfaceOpenWith || !surfaceState || !surfaceControls || !surfacePreview) {
      return;
    }

    surfaceTitle.textContent = activeView.title;
    surfaceSummary.textContent = activeView.summary;
    surfacePlacement.textContent = activeView.placement === 'popup' ? 'popup' : 'main';
    surfaceOpenWith.textContent = activeView.openWith;
    surfaceState.textContent = activeView.state;
    syncSurfaceControls(surfaceControls, activeView);
    clearElement(surfacePreview);
    activeView.mount(surfacePreview);
  }

  function createInspectorPanel() {
    const panel = document.createElement('section');
    panel.className = 'panel inspector-panel';

    const titleBar = document.createElement('div');
    titleBar.className = 'panel-titlebar';
    titleBar.innerHTML = `
      <h2>Contribution packs</h2>
      <span class="panel-subtitle">Shell composition registry</span>
    `;

    const grid = document.createElement('div');
    grid.className = 'contribution-grid';

    const packs = [
      coreContributions,
      workspaceContributionPack,
      surfaceContributionPack,
      editorContributionPack,
      assetContributionPack,
      uiContributionPack,
    ];

    for (const pack of packs) {
      const card = document.createElement('article');
      card.className = 'contribution-card';
      card.innerHTML = `
        <div class="contribution-card__top">
          <strong>${escapeHtml(pack.id)}</strong>
          <span class="contribution-status">${escapeHtml(pack.surfaces.length.toString())} surfaces</span>
        </div>
        <code>${escapeHtml(pack.id)}</code>
        <p>Package contribution pack wired into the shell.</p>
      `;
      grid.append(card);
    }

    const notes = document.createElement('div');
    notes.className = 'inspector-notes';
    notes.innerHTML = `
      <p>The shell now composes package exports instead of a static array of mock cards.</p>
      <ul>
        <li>Workspace tree reflects the live workspace snapshot</li>
        <li>Surface tabs come from live host sessions</li>
        <li>Text resources open in a mounted editable surface</li>
        <li>Binary resources open in a mounted viewer surface</li>
        <li>Open-with and language chrome reflect package-owned models</li>
      </ul>
    `;

    panel.append(titleBar, grid, notes);
    return panel;
  }

  function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'shell-footer';
    footer.innerHTML = `
      <span>Phase 2 language-foundation shell</span>
      <span>Local-first bootstrap with package-driven workspace, mounted surface routing, and editor language chrome</span>
    `;
    return footer;
  }

  function render() {
    renderShell();
  }

  render();

  return {
    workspace,
    openResourceEntry,
    render,
    state,
    mainHost,
    popupHost,
  };
}
