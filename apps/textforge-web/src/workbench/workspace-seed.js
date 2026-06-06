import {
  basenameWorkspacePath,
  createSequentialIdFactory,
  createWorkspaceService,
  dirnameWorkspacePath,
  normalizeWorkspacePath,
  workspaceProviderIds,
} from '@textforge/workspace';

import { bundledDocFolders, bundledDocs, bundledDocsGeneratedAt } from '../generated/bundledDocs.js';
import { createTimestampFactory } from './tracing.js';

export function createBundledWorkspacePath(path) {
  return normalizeWorkspacePath(`/.textforge/resources${normalizeWorkspacePath(path)}`);
}

export function createBundledOverlayId(path) {
  return `bundled:${normalizeWorkspacePath(path)}`;
}

export function createUserSeedWorkspaceState() {
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

export function sanitizePersistentWorkspaceState(input) {
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

export function createBundledWorkspaceOverlayState(baseInput) {
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
