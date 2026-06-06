import { createIssue, createResult } from './result.js';

export function createArchiveBoundaryDocumentationCheck(options = {}) {
  return {
    id: options.id ?? 'security.archiveBoundary',
    kind: 'archive-boundary',
    label: options.label ?? 'Archive boundary documentation',
    run(context) {
      const diagnostics = [];
      const archiveBoundary = context.archiveBoundary;

      if (!archiveBoundary?.documented) {
        diagnostics.push(createIssue('Archive boundary behavior must be documented.', 'warning', context.resource));
      } else {
        if (!archiveBoundary.format) {
          diagnostics.push(createIssue('Archive boundary documentation should name the archive format.', 'warning', context.resource));
        }

        if (!archiveBoundary.notesUri) {
          diagnostics.push(createIssue('Archive boundary documentation should link to a notes or policy document.', 'warning', context.resource));
        }
      }

      return createResult('security.archiveBoundary', 'archive-boundary', diagnostics, 'Archive boundary documentation inspected.');
    },
  };
}

export function createVisualIdentityBoundaryCheck(options = {}) {
  return {
    id: options.id ?? 'security.visualIdentity',
    kind: 'visual-identity',
    label: options.label ?? 'Visual identity boundary',
    run(context) {
      const diagnostics = [];
      const visualIdentity = context.visualIdentity;

      if (!visualIdentity?.documented) {
        diagnostics.push(createIssue('Resource identity badge and icon behavior must be documented.', 'warning', context.resource));
      } else {
        if (!visualIdentity.deterministic) {
          diagnostics.push(createIssue('Resource identity badges must remain deterministic.', 'error', context.resource));
        }

        if (!visualIdentity.usesLocalIcons) {
          diagnostics.push(createIssue('React UI icons must remain local and bundled.', 'error', context.resource));
        }

        if (!visualIdentity.notesUri) {
          diagnostics.push(createIssue('Visual identity documentation should link to a badge/icon policy note.', 'warning', context.resource));
        }
      }

      if (visualIdentity?.usesRemoteIcons) {
        diagnostics.push(createIssue('Resource identity chrome must not fetch remote icons.', 'error', context.resource));
      }

      if (visualIdentity?.usesRemoteImages) {
        diagnostics.push(createIssue('Resource identity badges must not fetch remote images.', 'error', context.resource));
      }

      if (visualIdentity?.usesFilesystemDerivedIdentity) {
        diagnostics.push(createIssue('Resource identity badges must not depend on filesystem-derived identity.', 'error', context.resource));
      }

      if (visualIdentity?.usesUserProvidedImages) {
        diagnostics.push(createIssue('Resource identity chrome must not use user-provided images as icon identity.', 'error', context.resource));
      }

      return createResult('security.visualIdentity', 'visual-identity', diagnostics, 'Visual identity boundary inspected.');
    },
  };
}

export function createBrowserStorageBoundaryCheck(options = {}) {
  return {
    id: options.id ?? 'security.storageBoundary',
    kind: 'storage-boundary',
    label: options.label ?? 'Browser-managed storage boundary',
    run(context) {
      const diagnostics = [];
      const storageBoundary = context.storageBoundary;

      if (!storageBoundary?.documented) {
        diagnostics.push(createIssue('Browser-managed storage behavior must be documented.', 'warning', context.resource));
      } else {
        if (!storageBoundary.browserManaged) {
          diagnostics.push(createIssue('Workspace storage must remain browser-managed.', 'error', context.resource));
        }

        if (!storageBoundary.mechanism) {
          diagnostics.push(createIssue('Workspace storage should declare its browser storage mechanism.', 'warning', context.resource));
        }

        if (!storageBoundary.driver) {
          diagnostics.push(createIssue('Workspace storage should declare its persistence driver.', 'warning', context.resource));
        }

        if (!storageBoundary.notesUri) {
          diagnostics.push(createIssue('Workspace storage documentation should link to a storage-boundary note.', 'warning', context.resource));
        }
      }

      if (storageBoundary?.usesFilesystemAccess) {
        diagnostics.push(createIssue('Workspace storage must not use File System Access API.', 'error', context.resource));
      }

      if (storageBoundary?.usesDirectoryHandles) {
        diagnostics.push(createIssue('Workspace storage must not use directory handles.', 'error', context.resource));
      }

      if (storageBoundary?.usesBackgroundSync) {
        diagnostics.push(createIssue('Workspace storage must not use background sync.', 'error', context.resource));
      }

      if (storageBoundary?.usesRemoteSync) {
        diagnostics.push(createIssue('Workspace storage must not use remote sync.', 'error', context.resource));
      }

      if (storageBoundary?.usesSilentLocalFileAccess) {
        diagnostics.push(createIssue('Workspace storage must not use silent local file access.', 'error', context.resource));
      }

      return createResult('security.storageBoundary', 'storage-boundary', diagnostics, 'Browser-managed storage boundary inspected.');
    },
  };
}

export function createLocalCommandDispatchCheck(options = {}) {
  return {
    id: options.id ?? 'security.commandDispatch',
    kind: 'command-dispatch',
    label: options.label ?? 'Local command dispatch boundary',
    run(context) {
      const diagnostics = [];
      const commandDispatch = context.commandDispatch;

      if (!commandDispatch?.documented) {
        diagnostics.push(createIssue('Local command-dispatch behavior must be documented.', 'warning', context.resource));
      } else {
        if (!commandDispatch.localOnly) {
          diagnostics.push(createIssue('Phase 3.3 command dispatch must remain local-only.', 'error', context.resource));
        }

        if (!commandDispatch.notesUri) {
          diagnostics.push(createIssue('Local command-dispatch documentation should link to a boundary note.', 'warning', context.resource));
        }
      }

      if (commandDispatch?.usesPluginExecution) {
        diagnostics.push(createIssue('Phase 3.3 command dispatch must not execute plugins or external packages.', 'error', context.resource));
      }

      if (commandDispatch?.usesRemoteExecution) {
        diagnostics.push(createIssue('Phase 3.3 command dispatch must not execute remote commands.', 'error', context.resource));
      }

      return createResult('security.commandDispatch', 'command-dispatch', diagnostics, 'Local command dispatch inspected.');
    },
  };
}

export function createLocalUiStateBoundaryCheck(options = {}) {
  return {
    id: options.id ?? 'security.localUiState',
    kind: 'local-ui-state',
    label: options.label ?? 'Local shell UI state boundary',
    run(context) {
      const diagnostics = [];
      const localUiState = context.localUiState;

      if (!localUiState?.documented) {
        diagnostics.push(createIssue('Local popup and panel state behavior must be documented.', 'warning', context.resource));
      } else {
        if (!localUiState.localOnly) {
          diagnostics.push(createIssue('Popup overlays and panel sizing must remain local-only UI state.', 'error', context.resource));
        }

        if (!localUiState.coversPopupOverlays) {
          diagnostics.push(createIssue('Local UI state documentation should explicitly cover popup overlays.', 'warning', context.resource));
        }

        if (!localUiState.coversPanelSizing) {
          diagnostics.push(createIssue('Local UI state documentation should explicitly cover panel sizing.', 'warning', context.resource));
        }

        if (!localUiState.notesUri) {
          diagnostics.push(createIssue('Local UI state documentation should link to a boundary note.', 'warning', context.resource));
        }
      }

      if (localUiState?.usesDetachedWindows) {
        diagnostics.push(createIssue('Popup behavior must not use detached browser windows.', 'error', context.resource));
      }

      if (localUiState?.usesRemoteContent) {
        diagnostics.push(createIssue('Popup or panel state must not depend on remote content loading.', 'error', context.resource));
      }

      if (localUiState?.usesBackgroundSync) {
        diagnostics.push(createIssue('Popup or panel state must not use background sync.', 'error', context.resource));
      }

      if (localUiState?.usesRemoteSync) {
        diagnostics.push(createIssue('Popup or panel state must not use remote sync.', 'error', context.resource));
      }

      if (localUiState?.usesFilesystemAccess) {
        diagnostics.push(createIssue('Popup or panel state must not use File System Access API.', 'error', context.resource));
      }

      return createResult('security.localUiState', 'local-ui-state', diagnostics, 'Local shell UI state boundary inspected.');
    },
  };
}
