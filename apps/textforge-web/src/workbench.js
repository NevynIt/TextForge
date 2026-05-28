import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  contributions as coreContributions,
  createCommandDispatcher,
  createCommandRegistry,
  createContributionRegistry,
  createContributionInspectorModel,
  createPipelineValue,
  getLanguageDefinition,
  inferLanguageId,
  inferResourceRepresentation,
} from '@textforge/core';
import {
  basenameWorkspacePath,
  createWorkspaceOverlayService,
  createPersistedWorkspaceService,
  createSequentialIdFactory,
  contributions as workspaceContributionPack,
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
  createSurfaceContributionManifest,
  getDefaultSurfacePlacement,
  createSurfaceRegistry,
  createSurfaceSessionTab,
  listOpenSurfaceSessions,
} from '@textforge/surfaces';
import {
  contributions as editorContributionPack,
  createTextEditorDocument,
  listTextEditorLanguageModes,
} from '@textforge/editors';
import {
  contributions as assetContributionPack,
  createAssetProvenanceLabel,
  createBlobUrlLedger,
} from '@textforge/assets';
import {
  contributions as pipelineContributionPack,
} from '@textforge/pipeline';
import {
  contributions as diagramContributionPack,
  rasterizeSvgToPngBytes,
} from '@textforge/diagrams';
import {
  contributions as markdownContributionPack,
  createMarkdownSnippet,
  parseMarkdownCapabilityRequirements,
  markdownPreviewSurfaceContribution,
  renderMarkdownDocument,
} from '@textforge/markdown';
import {
  contributions as itmContributionPack,
  createWorkspaceItmIncludeProvider,
  listItmVisualTargets,
  loadItmDocument,
} from '@textforge/itm';
import {
  contributions as securityProfileContributionPack,
} from '@textforge/security-profile';
import {
  createLuaExecutionService,
  contributions as luaContributionPack,
  isLuaResource as isLuaPackageResource,
  luaConsoleResourceMimeType,
  luaConsoleResourcePath,
  luaConsoleSurfaceContribution,
} from '@textforge/lua';
// WP-LUA keeps the interactive xterm.js "Lua Console" and "Reload Lua automation pipelines" flows contribution-driven.
import {
  TextForgeAppFrame,
  TextForgeCallout,
  TextForgeCommandPalette,
  TextForgeContextMenu,
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
import { bundledDocFolders, bundledDocs, bundledDocsGeneratedAt } from './generated/bundledDocs.js';
import { createMarkdownPreviewRequestManager } from './markdownPreviewState.js';

const element = React.createElement;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const workspaceDatabaseName = 'textforge-workspace';
const sampleResourcePaths = {
  notes: '/.textforge/resources/docs/examples/phase-4-markdown-preview.tf.md',
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
};

const workspaceFolderContextCommandIds = [
  'workspace.new-folder',
  'workspace.new-resource',
  'workspace.upload-file',
  'workspace.import-folder-zip',
  'workspace.export-selected-folder',
  'workspace.rename-selected',
  'workspace.delete-selected',
];

const workspaceResourceContextCommandIds = [
  'surface.open-visuals',
  'workspace.copy-selected-resource',
  'lua.run-selected-resource',
  'lua.promote-selected-to-automation',
  'workspace.download-selected-file',
  'workspace.rename-selected',
  'workspace.delete-selected',
];

const mainSessionContextCommandIds = [
  'surface.open-visuals',
  'surface.focus-main-session',
  'surface.refresh-active',
  'surface.move-active-to-popup',
  'surface.close-active',
  'workspace.download-selected-file',
];

const popupSessionContextCommandIds = [
  'surface.open-visuals',
  'surface.focus-popup-session',
  'surface.refresh-active',
  'surface.move-active-to-main',
  'surface.close-active',
  'workspace.download-selected-file',
];

const luaRecoveryQueryParam = 'luaSkipPreload';

function readPhase35ScreenshotPreset() {
  if (typeof window === 'undefined') {
    return phase35ScreenshotPresets.main;
  }

  const presetId = new URL(window.location.href).searchParams.get('phase35');
  return phase35ScreenshotPresets[presetId] ?? phase35ScreenshotPresets.main;
}

function readWorkbenchTestProfile() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const profileId = new URL(window.location.href).searchParams.get('testProfile');
  return workbenchTestProfiles[profileId] ?? undefined;
}

function readPreviewTraceEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URL(window.location.href).searchParams.get('tracePreview') === '1';
}

function readLuaBootstrapRecoveryState() {
  if (typeof window === 'undefined') {
    return {
      skipLuaPreloadOnce: false,
    };
  }

  const url = new URL(window.location.href);
  const skipLuaPreloadOnce = url.searchParams.get(luaRecoveryQueryParam) === '1';
  if (skipLuaPreloadOnce) {
    url.searchParams.delete(luaRecoveryQueryParam);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return {
    skipLuaPreloadOnce,
  };
}

function isLuaBootstrapCommandId(commandId) {
  return String(commandId ?? '').startsWith('lua.');
}

function readWorkbenchBootstrapOptions() {
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

function createTimestampFactory() {
  return () => new Date().toISOString();
}

function createTraceLogger(enabled) {
  const startedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  let counter = 0;

  return (label, details = {}) => {
    if (!enabled) {
      return;
    }

    counter += 1;
    const current = typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
    const elapsedMs = Math.round((current - startedAt) * 100) / 100;
    const entry = {
      index: counter,
      elapsedMs,
      label,
      details,
    };
    if (typeof globalThis === 'object' && globalThis) {
      const traceEntries = Array.isArray(globalThis.__textforgePreviewTrace)
        ? globalThis.__textforgePreviewTrace
        : [];
      traceEntries.push(entry);
      globalThis.__textforgePreviewTrace = traceEntries;
    }
    if (typeof document !== 'undefined' && document?.body?.dataset) {
      const tail = String(document.body.dataset.textforgePreviewTraceTail ?? '')
        .split('|')
        .filter(Boolean)
        .slice(-11);
      tail.push(label);
      document.body.dataset.textforgePreviewTraceLast = label;
      document.body.dataset.textforgePreviewTraceCount = String(counter);
      document.body.dataset.textforgePreviewTraceElapsed = String(elapsedMs);
      document.body.dataset.textforgePreviewTraceTail = tail.join('|');
    }
    console.log(`[preview-trace #${counter} +${elapsedMs}ms] ${label}`, details);
  };
}

function createBundledWorkspacePath(path) {
  return normalizeWorkspacePath(`/.textforge/resources${normalizeWorkspacePath(path)}`);
}

function createBundledOverlayId(path) {
  return `bundled:${normalizeWorkspacePath(path)}`;
}

function createUserSeedWorkspaceState() {
  const now = createTimestampFactory();
  const workspace = createWorkspaceService({
    workspaceId: 'textforge-shell',
    name: 'TextForge Workspace',
    now,
    idFactory: createSequentialIdFactory('workspace'),
  });

  workspace.createFolder({ path: '/docs', title: 'docs' });
  workspace.createFolder({ path: '/examples', title: 'examples' });
  workspace.createFolder({ path: '/roadmap', title: 'roadmap' });
  workspace.createFolder({ path: '/.textforge', title: '.textforge' });
  return workspace.snapshot();
}

function sanitizePersistentWorkspaceState(input) {
  const state = typeof input?.snapshot === 'function' ? input.snapshot() : input;
  const bundledEntriesExist = [...state.folders, ...state.resources].some((entry) =>
    entry.path === '/.textforge/resources' || entry.path.startsWith('/.textforge/resources/'));
  const hasTextforgeRoot = state.folders.some((folder) => folder.path === '/.textforge');

  if (!bundledEntriesExist && hasTextforgeRoot) {
    return {
      changed: false,
      state,
    };
  }

  const workspace = createWorkspaceService({
    workspaceId: state.manifest.workspaceId,
    name: state.manifest.name,
    rootPath: state.manifest.rootPath,
    now: createTimestampFactory(),
    idFactory: createSequentialIdFactory('workspace'),
    state: {
      ...state,
      folders: state.folders.filter((folder) =>
        folder.id !== 'root'
          && folder.path !== '/.textforge/resources'
          && !folder.path.startsWith('/.textforge/resources/')),
      resources: state.resources.filter((resource) =>
        resource.path !== '/.textforge/resources'
          && !resource.path.startsWith('/.textforge/resources/')),
    },
  });

  if (!workspace.getEntryByPath('/.textforge')) {
    workspace.createFolder({ path: '/.textforge', title: '.textforge' });
  }

  return {
    changed: true,
    state: workspace.snapshot(),
  };
}

function createBundledWorkspaceOverlayState(baseInput) {
  const baseState = typeof baseInput?.snapshot === 'function' ? baseInput.snapshot() : baseInput;
  const textforgeFolder = baseState.folders.find((folder) => folder.path === '/.textforge');
  const bundledAt = bundledDocsGeneratedAt;
  const bundledRootPath = '/.textforge/resources';
  const folders = [
    {
      kind: 'folder',
      id: createBundledOverlayId(bundledRootPath),
      path: bundledRootPath,
      parentId: textforgeFolder?.id ?? 'root',
      metadata: {
        title: 'resources',
        providerId: workspaceProviderIds.bundled,
        createdAt: bundledAt,
        updatedAt: bundledAt,
      },
      childIds: [],
    },
    ...bundledDocFolders.map((folderPath) => {
      const path = createBundledWorkspacePath(folderPath);
      const parentPath = dirnameWorkspacePath(path);
      return {
        kind: 'folder',
        id: createBundledOverlayId(path),
        path,
        parentId: parentPath === '/.textforge'
          ? textforgeFolder?.id ?? 'root'
          : createBundledOverlayId(parentPath),
        metadata: {
          title: basenameWorkspacePath(folderPath),
          providerId: workspaceProviderIds.bundled,
          createdAt: bundledAt,
          updatedAt: bundledAt,
        },
        childIds: [],
      };
    }),
  ];
  const resources = bundledDocs.map((resource) => {
    const path = createBundledWorkspacePath(resource.path);
    return {
      kind: 'resource',
      id: createBundledOverlayId(path),
      path,
      parentId: createBundledOverlayId(dirnameWorkspacePath(path)),
      representation: 'text',
      text: resource.text,
      languageId: resource.languageId,
      mimeType: resource.mimeType,
      metadata: {
        title: basenameWorkspacePath(resource.path),
        providerId: workspaceProviderIds.bundled,
        provenance: {
          kind: 'bundled',
          bundleId: 'textforge-docs',
          sourcePath: normalizeWorkspacePath(resource.path),
          bundledAt,
        },
        createdAt: bundledAt,
        updatedAt: bundledAt,
      },
    };
  });

  return createWorkspaceService({
    workspaceId: 'textforge-bundled-overlay',
    name: 'Bundled Resources',
    now: createTimestampFactory(),
    idFactory: createSequentialIdFactory('bundled-overlay'),
    state: {
      manifest: {
        workspaceId: 'textforge-bundled-overlay',
        name: 'Bundled Resources',
        rootPath: '/',
        createdAt: bundledAt,
        updatedAt: bundledAt,
        selectedResourceId: undefined,
      },
      folders,
      resources,
    },
  }).snapshot();
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function createZipFilename(label, fallback) {
  return `${sanitizeFilenameSegment(label, fallback)}.zip`;
}

function isWorkspaceResource(entry) {
  return entry?.kind === 'resource';
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

function splitFilename(name) {
  const normalized = String(name ?? '');
  const extensionIndex = normalized.lastIndexOf('.');
  if (extensionIndex <= 0) {
    return {
      stem: normalized || 'upload',
      extension: '',
    };
  }

  return {
    stem: normalized.slice(0, extensionIndex),
    extension: normalized.slice(extensionIndex),
  };
}

function resolveCommandIcon(commandId) {
  if (commandId.startsWith('workspace.import')) {
    return 'import';
  }

  if (commandId.startsWith('workspace.export') || commandId === 'asset.download-selected') {
    return 'export';
  }

  if (commandId.startsWith('asset.export-selected')) {
    return 'fileImage';
  }

  if (commandId === 'workspace.new-folder') {
    return 'folder';
  }

  if (commandId === 'workspace.new-resource' || commandId.startsWith('editor.set-language')) {
    return 'fileText';
  }

  if (commandId.startsWith('markdown.insert-') || commandId.startsWith('markdown.export-')) {
    return 'fileText';
  }

  if (commandId.startsWith('surface.open-with') || commandId === 'surface.focus-main-session') {
    return 'fileText';
  }

  if (commandId === 'surface.open-visuals') {
    return 'utility';
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

  if (entry.representation === 'text') {
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
    title: 'TF-MD preview and generated diagram assets',
    summary: 'Phase 4 adds the Markdown preview surface, TF-MD control-block scanning, local image resolution, and generated Mermaid/Graphviz asset export on top of the recovered shell.',
    openWith: 'Markdown and asset surfaces',
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
  const workbenchTestProfile = readWorkbenchTestProfile();
  const luaBootstrapRecovery = readLuaBootstrapRecoveryState();
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
  const luaExecutionService = createLuaExecutionService();
  const contributionRegistry = createContributionRegistry([
    coreContributions,
    workspaceContributionPack,
    editorContributionPack,
    assetContributionPack,
    pipelineContributionPack,
    diagramContributionPack,
    markdownContributionPack,
    itmContributionPack,
    luaContributionPack,
    uiContributionPack,
    securityProfileContributionPack,
  ]);
  const resolvedDefaultContributions = contributionRegistry.resolve();
  const surfaceRegistry = createSurfaceRegistry(
    resolvedDefaultContributions.surfaces.filter((contribution) =>
      contribution.status !== 'failed' && contribution.status !== 'disabled'),
  );
  contributionRegistry.registerManifest(createSurfaceContributionManifest(surfaceRegistry.list()));
  const commandRegistry = createCommandRegistry(contributionRegistry.listManifests());
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
  const luaConsoleStateByResourceId = new Map();
  const luaConsoleSessionStateByResourceId = new Map();
  const listeners = new Set();
  let cachedSnapshot;
  let bootstrapApplied = false;
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
    contextMenu: undefined,
    visualTargetPicker: undefined,
  };
  const runtime = {
    status: 'loading',
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

  function emit() {
    cachedSnapshot = undefined;
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
    markdownPreviewRequests.clear();
    luaConsoleStateByResourceId.clear();
    luaConsoleSessionStateByResourceId.clear();
    state.activeMainSessionId = undefined;
    state.activePopupSessionId = undefined;
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

    const requestedPlacement = options.placement
      ?? findSessionForResource(entry.id, { sessionKey: options.sessionKey })?.placement
      ?? getDefaultSurfacePlacement(surfaceRegistry, {
        resource: workspaceEntryToResourceRef(entry),
        allowPopup: true,
        preferredSurfaceIds: options.preferredSurfaceId ? [options.preferredSurfaceId] : undefined,
      });
    const preferredSurfaceId = options.preferredSurfaceId;
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
      rememberSelection(entry.id);
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
    if (!isWorkspaceResource(currentResource) || currentResource.representation !== 'text') {
      return;
    }
    if (!isWorkspaceResourceWritable(currentResource)) {
      throw new Error(`Workspace resource ${currentResource.path} is read-only.`);
    }

    const nextLanguageMode = languageModes.find((mode) => mode.languageId === languageId);
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

  function listAvailableSurfaceIdsForEntry(entry, placement, preferredSurfaceIds) {
    if (!entry) {
      return [];
    }

    const documentContext = resolveDocumentContributionContextForEntry(entry);
    return createOpenWithSelection(surfaceRegistry, {
      resource: workspaceEntryToResourceRef(entry),
      placement: placement ?? getDefaultSurfacePlacement(surfaceRegistry, {
        resource: workspaceEntryToResourceRef(entry),
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

    const cachedContext = documentContributionContextByResourceId.get(entry.id);
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
    documentContributionContextByResourceId.set(entry.id, {
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

  function createSurfaceView(session) {
    const resource = getEntry(session.resource.resourceId);
    if (!resource) {
      return createWelcomeView();
    }

    const contribution = surfaceRegistry.get(session.contributionId);
    const openWith = contribution?.label ?? 'Surface';
    const controls = [createOpenWithControl(session, resource)];
    const badge = resource.metadata.badge;
    const icon = resolveEntryIcon(resource);
    const resourceTitle = resource.metadata.title ?? basenameWorkspacePath(resource.path) ?? resource.path;
    const surfaceTitle = session.title ?? resourceTitle;
    const luaConsoleSessionState = isLuaConsoleResource(resource)
      ? getLuaConsoleSessionState(resource.id)
      : undefined;
    const resourceRef = workspaceEntryToResourceRef(resource);
    tracePreview('createSurfaceView:start', {
      sessionId: session.id,
      contributionId: session.contributionId,
      path: resource.path,
    });
    const runtimeView = contribution?.open?.({
      session,
      contribution,
      resource: resourceRef,
      workspaceResource: resource,
      resourceTitle: surfaceTitle,
      sourceText: resource.representation === 'text' ? resource.text : undefined,
      updatedAt: resource.metadata.updatedAt,
      contributionRegistry,
      workspaceService: workspace,
      documentContext: resolveDocumentContributionContextForEntry(resource),
      requestPreview: session.contributionId === markdownPreviewSurfaceContribution.id && isMarkdownResource(resource)
        ? () => requestMarkdownPreview(resource)
        : undefined,
      getAssetLease: () => getAssetLease(resourceRef),
      describeGeneratedResource: () => describeGeneratedResource(resource),
      getTextDocument: () => activeTextDocuments.get(resource.id) ?? createTextEditorDocument(
        resourceRef,
        resource.text,
        {
          languageId: resource.languageId,
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
      createLanguageControl,
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
    return {
      id: session.id,
      kind: 'surface',
      mountId: runtimeView?.mountId ?? `${session.id}:${session.contributionId}:${resource.metadata.updatedAt}`,
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
    const hideOpenWithCommands = model.kind === 'workspace-item' && isItmWorkspaceResource(targetEntry);
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
    const defaultPath = joinWorkspacePath(getSelectedFolderPath(commandContext), 'new-folder');
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

  async function createResourceCommand(commandContext) {
    const mode = window.prompt('Create resource mode (text or upload)', 'text')?.trim().toLowerCase();
    if (!mode) {
      return;
    }

    if (mode !== 'text' && mode !== 'upload') {
      throw new Error(`Unsupported resource mode: ${mode}`);
    }

    if (mode === 'text') {
      const defaultPath = joinWorkspacePath(getSelectedFolderPath(commandContext), 'new-resource.md');
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

    const defaultPath = joinWorkspacePath(getSelectedFolderPath(commandContext), file.name || 'resource.bin');
    const requestedPath = window.prompt('Uploaded resource path', defaultPath);
    if (!requestedPath) {
      return;
    }

    const nextPath = assertWorkspacePathAvailable(requestedPath);
    const resource = createWorkspaceResourceFromBytes(
      nextPath,
      await readFileBytes(file),
      file.type || undefined,
    );
    await persistWorkspace('workspace.new-resource');
    expandFolderAncestors(resource.path);
    openResourceEntry(resource);
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

    updateTextResourceLanguage(resource.id, languageId);
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
        includePng: true,
        document: globalThis.document,
      },
    });

    if (rendered.generatedResources.length === 0) {
      window.alert('No Mermaid or Graphviz blocks were found in the selected Markdown resource.');
      return;
    }

    const savedResources = rendered.generatedResources.map((descriptor) => upsertGeneratedWorkspaceResource(descriptor));
    await persistWorkspace('markdown.export-generated-diagrams');
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
    });
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
        seed: createUserSeedWorkspaceState(),
        storageOptions: {
          databaseName: workspaceDatabaseName,
        },
      });
      persistedWorkspace = hydrated.workspace;
      const sanitizedWorkspace = sanitizePersistentWorkspaceState(hydrated.workspace.snapshot());
      if (sanitizedWorkspace.changed) {
        hydrated.workspace.replaceState(sanitizedWorkspace.state);
        await hydrated.workspace.persistNow('workspace.strip-bundled-overlay');
      }
      workspace = createWorkspaceOverlayService(hydrated.workspace, {
        overlay: () => createBundledWorkspaceOverlayState(hydrated.workspace.snapshot()),
      });
      hydrationSource = hydrated.hydrationSource;
      unsubscribePersistence = hydrated.workspace.subscribePersistence(() => emit());
      if (!runtime.skipLuaPreloadOnce) {
        reloadLuaAutomation();
      }
      runtime.status = 'ready';
      tracePreview('hydrateWorkspace:ready', {
        hydrationSource,
      });

      const selectedEntry = getEntry(workspace.getManifest().selectedResourceId) ?? getDefaultSelection();
      rememberSelection(selectedEntry?.id);
      normalizeActiveSessions();

      const initialOpenProfile = workbenchTestProfile ?? screenshotPreset;
      const presetEntry = initialOpenProfile?.openResourcePath
        ? workspace.getEntryByPath(initialOpenProfile.openResourcePath)
        : undefined;
      const initialEntry = presetEntry ?? selectedEntry;

      if (initialEntry && initialEntry.kind !== 'folder' && listMainSessions().length === 0 && listPopupSessions().length === 0) {
        tracePreview('hydrateWorkspace:initial-open', {
          path: initialEntry.path,
          preferredSurfaceId: initialOpenProfile?.preferredSurfaceId ?? null,
        });
        openResourceEntry(initialEntry, {
          placement: initialOpenProfile?.openPlacement,
          preferredSurfaceId: initialOpenProfile?.preferredSurfaceId,
        });
      } else {
        tracePreview('hydrateWorkspace:initial-open-skipped', {});
        emit();
      }
      await applyWorkbenchBootstrapOptions();
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
  void hydrateWorkspace();

  return {
    subscribe,
    snapshot,
    dispose,
    actions: {
      cancelStorageReset,
      closeActivePopupSurface,
      closeContextMenu,
      closeVisualTargetPicker,
      closeSession,
      confirmStorageReset,
      dropFilesOnTabStrip,
      dropFilesOnWorkspaceFolder,
      executeCommand,
      focusMainSession,
      focusPopupSession,
      openMainTabContextMenu,
      openPopupSessionContextMenu,
      openSelectedVisualTargets,
      openWorkspaceItemContextMenu,
      requestStorageReset,
      retryStorageInitialization,
      selectWorkspaceItem,
      setUtilityPaneCollapsed,
      setWorkspaceTreeCollapsed,
      setUtilitySection,
      toggleVisualTargetPickerSelection,
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

function groupItmVisualTargets(targets = []) {
  return [
    {
      id: 'view',
      title: 'Views',
      items: targets.filter((target) => target.kind === 'view'),
    },
    {
      id: 'viewpoint',
      title: 'Viewpoints',
      items: targets.filter((target) => target.kind === 'viewpoint'),
    },
    {
      id: 'raw-model',
      title: 'Raw model',
      items: targets.filter((target) => target.kind === 'raw-model'),
    },
  ].filter((group) => group.items.length > 0);
}

function ItmVisualTargetPickerOverlay({ picker, controller }) {
  const resourceTitle = picker.resource?.metadata?.title ?? picker.resource?.path ?? 'ITM resource';
  const groups = groupItmVisualTargets(picker.targets);
  const selectedCount = picker.selectedSessionKeys.length;

  return element(
    'div',
    {
      className: 'tf-visual-picker__backdrop',
      onMouseDown: (event) => {
        if (event.target === event.currentTarget) {
          controller.actions.closeVisualTargetPicker();
        }
      },
    },
    element(
      'section',
      {
        className: 'tf-visual-picker',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Open visuals',
      },
      element(
        'div',
        { className: 'tf-visual-picker__header' },
        element(
          'div',
          null,
          element('strong', null, 'Open visuals'),
          element('p', { className: 'tf-visual-picker__subtitle' }, resourceTitle),
        ),
        element(
          'button',
          {
            type: 'button',
            className: 'tf-visual-picker__close',
            onClick: controller.actions.closeVisualTargetPicker,
          },
          'Close',
        ),
      ),
      picker.status === 'loading'
        ? element(TextForgeCallout, {
          tone: 'info',
          title: 'Resolving visual targets',
        }, element('p', null, 'Reading views, viewpoints, raw-model targets, and renderer availability from the ITM document.'))
        : null,
      picker.status === 'error'
        ? element(TextForgeCallout, {
          tone: 'danger',
          title: 'Visual targets unavailable',
        }, element('p', null, picker.error ?? 'Visual target resolution failed.'))
        : null,
      picker.status === 'ready' && groups.length === 0
        ? element(TextForgeCallout, {
          tone: 'warning',
          title: 'No visual targets found',
        }, element('p', null, 'This ITM document does not expose views, viewpoints, or raw-model visual targets.'))
        : null,
      picker.status === 'ready'
        ? element(
          'div',
          { className: 'tf-visual-picker__groups' },
          ...groups.map((group) =>
            element(
              'section',
              {
                key: group.id,
                className: 'tf-visual-picker__group',
              },
              element('h3', { className: 'tf-visual-picker__group-title' }, group.title),
              ...group.items.map((target) => {
                const disabled = target.available !== true;
                const checked = picker.selectedSessionKeys.includes(target.sessionKey);
                const diagnosticMessage = target.diagnostics?.[0]?.message;
                return element(
                  'label',
                  {
                    key: target.sessionKey,
                    className: `tf-visual-picker__target${disabled ? ' is-disabled' : ''}${checked ? ' is-selected' : ''}`,
                  },
                  element('input', {
                    type: 'checkbox',
                    checked,
                    disabled,
                    onChange: () => controller.actions.toggleVisualTargetPickerSelection(target.sessionKey),
                  }),
                  element(
                    'div',
                    { className: 'tf-visual-picker__target-copy' },
                    element('strong', { className: 'tf-visual-picker__target-label' }, target.label),
                    target.description
                      ? element('p', { className: 'tf-visual-picker__target-description' }, target.description)
                      : null,
                    diagnosticMessage
                      ? element('p', { className: 'tf-visual-picker__target-diagnostic' }, diagnosticMessage)
                      : null,
                  ),
                );
              }),
            )),
        )
        : null,
      element(
        'div',
        { className: 'tf-visual-picker__footer' },
        element(
          'button',
          {
            type: 'button',
            className: 'tf-button tf-button--secondary',
            onClick: controller.actions.closeVisualTargetPicker,
          },
          'Cancel',
        ),
        element(
          'button',
          {
            type: 'button',
            className: 'tf-button tf-button--primary',
            disabled: picker.status !== 'ready' || selectedCount === 0,
            onClick: controller.actions.openSelectedVisualTargets,
          },
          selectedCount === 1 ? 'Open 1 target' : `Open ${selectedCount} targets`,
        ),
      ),
    ),
  );
}

function listDroppedFiles(dataTransfer) {
  if (!dataTransfer) {
    return [];
  }

  return [...(dataTransfer.files ?? [])].filter(Boolean);
}

function hasDroppedFiles(dataTransfer) {
  if (!dataTransfer) {
    return false;
  }

  if ((dataTransfer.files?.length ?? 0) > 0) {
    return true;
  }

  return [...(dataTransfer.items ?? [])].some((item) => item.kind === 'file');
}

function WelcomeState({ hydrationSource }) {
  return element(TextForgeEmptyState, {
    eyebrow: 'Phase 4',
    icon: 'status',
    title: 'Markdown preview and generated assets',
    children: element(
      React.Fragment,
      null,
      element(
        'p',
        null,
        hydrationSource === 'storage'
          ? 'The shell reopened the browser-managed workspace, rebuilt the local command and package contribution registry, and restored TF-MD preview, generated-asset export, and popup-ready viewer surfaces.'
          : 'The shell seeded a fresh browser-managed workspace with TF-MD preview, local diagram export, and the existing local command shell layout.',
      ),
      element(
        'ul',
        { className: 'tf-welcome__list' },
        element('li', null, 'Markdown resources can open in both the source editor and the package-owned TF-MD preview surface'),
        element('li', null, 'Workspace-relative images resolve through the browser-managed workspace without host filesystem access'),
        element('li', null, 'Mermaid and Graphviz blocks can render inline and export generated SVG and PNG workspace assets'),
        element('li', null, 'No plugin manager, remote package loading, or rich Markdown editing was pulled forward'),
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
    view.diagnostics?.length
      ? element(
        TextForgeInspectorCard,
        {
          eyebrow: 'Diagnostics',
          icon: 'warning',
          title: `Surface diagnostics (${view.diagnostics.length})`,
        },
        element(
          'ul',
          { className: 'tf-registry__list' },
          ...view.diagnostics.map((diagnostic, index) =>
            element(
              'li',
              { key: `${diagnostic.code ?? diagnostic.message ?? 'diagnostic'}:${index}` },
              formatSurfaceDiagnosticSummary(diagnostic),
            )),
        ),
      )
      : null,
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
      'The shell now layers TF-MD preview, local diagram generation, and generated asset provenance onto the existing browser-managed workspace, local ui state model, popup overlays, and resizable right panel layout.',
    ),
  );
}

function formatRegistryPackageStatus(status) {
  switch (status) {
    case 'missingDependency':
      return 'Missing dependency';
    case 'incompatibleVersion':
      return 'Incompatible version';
    case 'failedToInitialize':
      return 'Failed to initialize';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function formatActivationSource(source) {
  switch (source) {
    case 'explicit':
      return '%require';
    case 'document':
      return 'Document default';
    case 'workspace':
      return 'Workspace default';
    case 'app':
      return 'App default';
    default:
      return 'Core default';
  }
}

function formatRequirementStatus(status) {
  switch (status) {
    case 'active':
      return 'Activated';
    case 'ambiguous':
      return 'Ambiguous';
    case 'missing':
      return 'Missing';
    default:
      return formatRegistryPackageStatus(status);
  }
}

function formatCapabilityLabel(capability) {
  return capability.localName
    ? `${capability.localName} (${capability.id})`
    : capability.id;
}

function formatCapabilityState(status) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'available':
      return 'Inactive';
    case 'failed':
      return 'Blocked';
    default:
      return formatRegistryPackageStatus(status);
  }
}

function formatContributionKindLabel(kind) {
  switch (kind) {
    case 'markdownFenceHandlers':
      return 'Fence handlers';
    case 'pipelines':
      return 'Pipelines';
    case 'surfaces':
      return 'Surfaces';
    default:
      return 'Commands';
  }
}

function formatSurfaceDiagnosticSummary(diagnostic) {
  const severity = String(diagnostic?.severity ?? 'information').toUpperCase();
  const code = String(diagnostic?.code ?? '').trim();
  const message = String(diagnostic?.message ?? 'Diagnostic').trim();
  return code ? `[${severity}] ${code}: ${message}` : `[${severity}] ${message}`;
}

function renderRegistryItems(items, formatter) {
  return element(
    'ul',
    { className: 'tf-registry__list' },
    ...items.map((item, index) =>
      element('li', { key: `${index}:${formatter(item)}` }, formatter(item))),
  );
}

function ContributionRegistryView({ inspectorModel, inspectedDocumentEntry }) {
  const documentContext = inspectorModel.document;
  const packs = inspectorModel.packages;
  const documentHeadline = inspectedDocumentEntry?.path ?? 'No active document';

  return element(
    'div',
    { className: 'tf-registry' },
    element(
      'article',
      { className: 'tf-registry__card' },
      element(
        'div',
        { className: 'tf-registry__header' },
        element(
          'div',
          { className: 'tf-registry__identity' },
          element('strong', null, 'Registry overview'),
          element(
            'span',
            { className: 'tf-registry__status tf-registry__status--available' },
            `${inspectorModel.summary.availablePackageCount}/${inspectorModel.summary.packageCount} ready`,
          ),
        ),
        element('span', null, 'Bundled static only'),
      ),
      element(
        'p',
        null,
        'The inspector reports bundled package state, current-document capability activation, exposed contributions, and diagnostics without introducing plugin installs or remote loading.',
      ),
      element(
        'dl',
        { className: 'tf-registry__meta' },
        element('div', null, element('dt', null, 'Packages'), element('dd', null, String(inspectorModel.summary.packageCount))),
        element('div', null, element('dt', null, 'Blocked packs'), element('dd', null, String(inspectorModel.summary.blockedPackageCount))),
        element('div', null, element('dt', null, 'Capabilities'), element('dd', null, String(inspectorModel.summary.capabilityCount))),
        element('div', null, element('dt', null, 'Active capabilities'), element('dd', null, String(inspectorModel.summary.activeCapabilityCount))),
        element('div', null, element('dt', null, 'Active surfaces'), element('dd', null, String(inspectorModel.summary.activeSurfaceCount))),
        element('div', null, element('dt', null, 'Diagnostics'), element('dd', null, String(inspectorModel.summary.diagnosticCount))),
      ),
    ),
    element(
      'article',
      { className: 'tf-registry__card' },
      element(
        'div',
        { className: 'tf-registry__header' },
        element(
          'div',
          { className: 'tf-registry__identity' },
          element('strong', null, 'Current document capability context'),
          element(
            'span',
            { className: `tf-registry__status tf-registry__status--${documentContext ? 'available' : 'disabled'}` },
            documentContext ? 'Resolved' : 'No document',
          ),
        ),
        element('span', null, documentHeadline),
      ),
      element(
        'p',
        null,
        documentContext
          ? 'The active capability set is resolved per document from bundled defaults plus explicit %require directives. Short-name conflicts stay diagnostic-producing instead of silently winning by registration order.'
          : 'Select or focus a resource to inspect its active capability context.',
      ),
      documentContext
        ? element(
          React.Fragment,
          null,
          element(
            'dl',
            { className: 'tf-registry__meta' },
            element('div', null, element('dt', null, 'Requirements'), element('dd', null, String(documentContext.requirements.length))),
            element('div', null, element('dt', null, 'Conflicts'), element('dd', null, String(documentContext.shortNameConflicts.length))),
            element('div', null, element('dt', null, 'Diagnostics'), element('dd', null, String(documentContext.diagnostics.length))),
          ),
          documentContext.activationOrder.length > 0
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Activation order'),
              renderRegistryItems(documentContext.activationOrder, (activation) =>
                `${formatActivationSource(activation.source)}: ${activation.capabilityId}`),
            )
            : null,
          packs.some((pack) => pack.activeCapabilityCount > 0)
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Active capability routing'),
              element(
                'div',
                { className: 'tf-registry__capability-groups' },
                ...packs
                  .filter((pack) => pack.activeCapabilityCount > 0)
                  .map((pack) =>
                    element(
                      'section',
                      { key: `${pack.packageId}:capabilities`, className: 'tf-registry__group' },
                      element('strong', null, pack.packageId),
                      renderRegistryItems(
                        pack.capabilities.filter((capability) => capability.status === 'active'),
                        (capability) =>
                          `${formatCapabilityLabel(capability)} - ${capability.activationSources.map(formatActivationSource).join(', ')}`,
                      ),
                    )),
              ),
            )
            : null,
          documentContext.requirements.length > 0
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Document requirements'),
              renderRegistryItems(documentContext.requirements, (requirement) =>
                `%require ${requirement.name ?? requirement.capabilityId} - ${formatRequirementStatus(requirement.status)}${requirement.matchedCapabilityId ? ` (${requirement.matchedCapabilityId})` : ''}`),
            )
            : null,
          ['surfaces', 'pipelines', 'markdownFenceHandlers'].some((kind) =>
            packs.some((pack) => pack.activeContributionCounts[kind] > 0))
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Exposed contributions'),
              element(
                'div',
                { className: 'tf-registry__contribution-groups' },
                ...['surfaces', 'pipelines', 'markdownFenceHandlers'].map((kind) => {
                  const activeItems = packs.flatMap((pack) =>
                    pack.contributions[kind].filter((entry) => entry.status === 'active'));
                  if (activeItems.length === 0) {
                    return null;
                  }

                  return element(
                    'section',
                    { key: kind, className: 'tf-registry__group' },
                    element('strong', null, formatContributionKindLabel(kind)),
                    renderRegistryItems(activeItems, (entry) =>
                      entry.kind === 'markdownFenceHandlers'
                        ? `${entry.localName ?? entry.id} (${entry.fenceNames?.join(', ') ?? 'no fence names'})`
                        : `${entry.localName ?? entry.id} (${entry.id})`),
                  );
                }).filter(Boolean),
              ),
            )
            : null,
          documentContext.shortNameConflicts.length > 0
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Active-context conflicts'),
              renderRegistryItems(documentContext.shortNameConflicts, (conflict) =>
                `${conflict.kind} short name "${conflict.localName}" -> ${conflict.contributionIds.join(', ')}`),
            )
            : null,
          documentContext.diagnostics.length > 0
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Inspector diagnostics'),
              renderRegistryItems(documentContext.diagnostics, (diagnostic) =>
                `${diagnostic.code ?? 'diagnostic'}: ${diagnostic.message}`),
            )
            : null,
        )
        : null,
    ),
    ...packs.map((pack) =>
      element(
        'article',
        { key: pack.packageId, className: 'tf-registry__card' },
        element(
          'div',
          { className: 'tf-registry__header' },
          element(
            'div',
            { className: 'tf-registry__identity' },
            element('strong', null, pack.packageId),
            element(
              'span',
              { className: `tf-registry__status tf-registry__status--${pack.status}` },
              formatRegistryPackageStatus(pack.status),
            ),
          ),
          element(
            'span',
            null,
            `${pack.contributions.commands.length} commands / ${pack.contributions.surfaces.length} surfaces / ${pack.contributions.pipelines.length} pipelines`,
          ),
        ),
        element(
          'p',
          null,
          pack.status === 'available'
            ? 'Bundled static contribution pack registered through the canonical core manifest.'
            : `Bundled static contribution pack is present but blocked: ${pack.statusReason ?? pack.status}.`,
        ),
        element(
          'dl',
          { className: 'tf-registry__meta' },
          element('div', null, element('dt', null, 'Version'), element('dd', null, pack.version ?? 'workspace')),
          element('div', null, element('dt', null, 'Capabilities'), element('dd', null, String(pack.capabilities.length))),
          element('div', null, element('dt', null, 'Active capabilities'), element('dd', null, String(pack.activeCapabilityCount))),
          element('div', null, element('dt', null, 'Active surfaces'), element('dd', null, String(pack.activeContributionCounts.surfaces))),
        ),
        pack.dependencies.length > 0
          ? element(
            'div',
            { className: 'tf-registry__section' },
            element('h4', null, 'Dependencies'),
            renderRegistryItems(pack.dependencies, (dependency) =>
              `${dependency.packageId}${dependency.versionRange ? ` ${dependency.versionRange}` : ''} - ${formatRegistryPackageStatus(dependency.status)}`),
          )
          : null,
        pack.conflicts.length > 0
          ? element(
            'div',
            { className: 'tf-registry__section' },
            element('h4', null, 'Conflicts'),
            renderRegistryItems(pack.conflicts, (conflictKey) => `Conflict: ${conflictKey}`),
          )
          : null,
        pack.capabilities.length > 0
          ? element(
            'div',
            { className: 'tf-registry__section' },
            element('h4', null, 'Provided capabilities'),
            renderRegistryItems(pack.capabilities, (capability) => {
              const aliasText = capability.aliases.length > 0 ? ` aliases: ${capability.aliases.join(', ')}` : '';
              const activationText = capability.activationSources.length > 0
                ? ` via ${capability.activationSources.map(formatActivationSource).join(', ')}`
                : '';
              const requirementText = capability.matchedRequirementNames.length > 0
                ? ` required by ${capability.matchedRequirementNames.join(', ')}`
                : '';
              return `${formatCapabilityLabel(capability)} - ${formatCapabilityState(capability.status)}${activationText}${requirementText}${aliasText}`;
            }),
          )
          : null,
        ['surfaces', 'pipelines', 'markdownFenceHandlers'].map((kind) => {
          if (pack.contributions[kind].length === 0) {
            return null;
          }

          return element(
            'div',
            { key: `${pack.packageId}:${kind}`, className: 'tf-registry__section' },
            element('h4', null, formatContributionKindLabel(kind)),
            renderRegistryItems(pack.contributions[kind], (entry) => {
              const fenceText = entry.kind === 'markdownFenceHandlers' && entry.fenceNames?.length
                ? ` fences: ${entry.fenceNames.join(', ')}`
                : '';
              const capabilityText = entry.capabilityIds.length > 0
                ? ` capabilities: ${entry.capabilityIds.join(', ')}`
                : '';
              return `${entry.localName ?? entry.id} - ${formatCapabilityState(entry.status)}${fenceText}${capabilityText}`;
            }),
          );
        }).filter(Boolean),
        pack.diagnostics.length > 0
          ? element(
            'div',
            { className: 'tf-registry__section' },
            element('h4', null, 'Package diagnostics'),
            renderRegistryItems(pack.diagnostics, (diagnostic) =>
              `${diagnostic.code ?? diagnostic.severity}: ${diagnostic.message}`),
          )
          : null,
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
        'Open a viewer-compatible resource from the workspace tree or run an asset command to mount it here.',
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
        onCloseTab: controller.actions.closeSession,
        onClose: controller.actions.closeActivePopupSurface,
        onRequestTabContextMenu: controller.actions.openPopupSessionContextMenu,
        onSelectTab: controller.actions.focusPopupSession,
        title: snapshot.activePopupView.title,
      },
      element(SurfaceMount, { view: snapshot.activePopupView }),
    )
    : null;
  const visualTargetPickerOverlay = snapshot.visualTargetPicker
    ? element(ItmVisualTargetPickerOverlay, {
      picker: snapshot.visualTargetPicker,
      controller,
    })
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

  React.useEffect(() => {
    function handleFileDragOver(event) {
      if (!hasDroppedFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }

    function handleFileDrop(event) {
      if (!hasDroppedFiles(event.dataTransfer)) {
        return;
      }

      const files = listDroppedFiles(event.dataTransfer);
      if (files.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const target = event.target instanceof Element ? event.target : undefined;
      const folderDropTarget = target?.closest('[data-workspace-folder-drop]');
      if (folderDropTarget instanceof HTMLElement) {
        const folderId = folderDropTarget.dataset.workspaceFolderDrop;
        if (folderId) {
          void controller.actions.dropFilesOnWorkspaceFolder(folderId, files);
          return;
        }
      }

      const uploadDropTarget = target?.closest('[data-upload-drop-zone]');
      if (uploadDropTarget) {
        void controller.actions.dropFilesOnTabStrip(files);
      }
    }

    window.addEventListener('dragover', handleFileDragOver, true);
    window.addEventListener('drop', handleFileDrop, true);
    return () => {
      window.removeEventListener('dragover', handleFileDragOver, true);
      window.removeEventListener('drop', handleFileDrop, true);
    };
  }, [controller]);

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
          onClose: () => controller.actions.setWorkspaceTreeCollapsed(true),
          onDropFilesToFolder: controller.actions.dropFilesOnWorkspaceFolder,
          onRequestItemContextMenu: controller.actions.openWorkspaceItemContextMenu,
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
            onClose: () => controller.actions.setUtilityPaneCollapsed(true),
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
              : element(ContributionRegistryView, {
                inspectorModel: snapshot.contributionInspectorModel,
                inspectedDocumentEntry: snapshot.inspectedDocumentEntry,
              }),
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
          onDropFiles: controller.actions.dropFilesOnTabStrip,
          onRequestTabContextMenu: controller.actions.openMainTabContextMenu,
          onSelectTab: controller.actions.focusMainSession,
        }),
        element(
          'div',
          { className: 'tf-surface-frame__body' },
        element(
          'div',
          {
            className: 'tf-surface-frame__viewport',
            'data-view-kind': mainView.kind,
            'data-upload-drop-zone': 'surface-main',
          },
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
    element(TextForgeContextMenu, {
      items: snapshot.contextMenu?.items,
      onClose: controller.actions.closeContextMenu,
      onCommandPress: (commandId) => void controller.actions.executeCommand(commandId, snapshot.contextMenu?.context),
      open: Boolean(snapshot.contextMenu?.items?.length),
      position: snapshot.contextMenu ? { x: snapshot.contextMenu.x, y: snapshot.contextMenu.y } : undefined,
      title: 'Context menu',
    }),
    visualTargetPickerOverlay,
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
