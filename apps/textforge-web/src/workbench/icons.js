import { workspaceStorageErrorCodes } from '@textforge/workspace';

export function resolveCommandIcon(commandId) {
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

  if (commandId === 'surface.close-all') {
    return 'close';
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

export function resolveEntryIcon(entry) {
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

export function createWelcomeView() {
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

export function createLoadingView() {
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

export function createStorageFailure(error) {
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
