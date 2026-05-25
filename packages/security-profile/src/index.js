export function createSecurityProfile(profile) {
  return profile;
}

function createResult(checkId, kind, diagnostics, summary) {
  return {
    checkId,
    kind,
    passed: diagnostics.length === 0,
    severity: diagnostics.some((diagnostic) => diagnostic.severity === 'error')
      ? 'error'
      : diagnostics.some((diagnostic) => diagnostic.severity === 'warning')
        ? 'warning'
        : 'info',
    diagnostics,
    summary,
  };
}

function createIssue(message, severity, resource) {
  return {
    severity,
    message,
    resource,
  };
}

function normalizeLicense(license) {
  return license.trim().toUpperCase();
}

function isRemoteUri(uri) {
  return /^https?:\/\//i.test(uri);
}

function isAllowedLicense(license, policy) {
  const normalized = normalizeLicense(license);

  if (!policy.allowUnknown && (!normalized || normalized === 'UNKNOWN' || normalized === 'UNLICENSED')) {
    return false;
  }

  if (policy.forbiddenLicenses?.some((entry) => normalizeLicense(entry) === normalized)) {
    return false;
  }

  return policy.allowedLicenses.some((entry) => normalizeLicense(entry) === normalized);
}

export function createOpenSourceLicenseGate(options = {}) {
  const policy = options.policy ?? {
    allowedLicenses: [
      '0BSD',
      'Apache-2.0',
      'BSD-2-Clause',
      'BSD-3-Clause',
      'CC0-1.0',
      'ISC',
      'MIT',
      'MPL-2.0',
      'Unlicense',
      'Zlib',
    ],
    forbiddenLicenses: ['Proprietary', 'Commercial', 'UNLICENSED', 'UNKNOWN'],
    allowUnknown: false,
  };

  return {
    id: options.id ?? 'security.license',
    kind: 'license',
    label: options.label ?? 'Open-source license gate',
    run(context) {
      const diagnostics = (context.dependencies ?? []).flatMap((dependency) =>
        isAllowedLicense(dependency.license, policy)
          ? []
          : [
            createIssue(
              `Dependency ${dependency.name} uses disallowed license ${dependency.license}.`,
              'error',
              context.resource,
            ),
          ],
      );

      return createResult('security.license', 'license', diagnostics, 'License policy checked.');
    },
  };
}

export function createCspCheck(options = {}) {
  return {
    id: options.id ?? 'security.csp',
    kind: 'csp',
    label: options.label ?? 'Content Security Policy',
    run(context) {
      const csp = context.manifest?.contentSecurityPolicy?.trim() ?? '';
      const diagnostics = [];

      if (!csp) {
        diagnostics.push(createIssue('Missing content security policy.', 'warning', context.resource));
      } else {
        if (!/default-src/i.test(csp)) {
          diagnostics.push(createIssue('CSP should declare a default-src directive.', 'warning', context.resource));
        }

        if (/unsafe-inline/i.test(csp)) {
          diagnostics.push(createIssue('CSP must not allow unsafe-inline.', 'error', context.resource));
        }
      }

      return createResult('security.csp', 'csp', diagnostics, 'CSP inspected.');
    },
  };
}

export function createManifestCheck(options = {}) {
  return {
    id: options.id ?? 'security.manifest',
    kind: 'manifest',
    label: options.label ?? 'Web app manifest',
    run(context) {
      const manifest = context.manifest;
      const diagnostics = [];

      if (!manifest) {
        diagnostics.push(createIssue('Missing web app manifest snapshot.', 'warning', context.resource));
      } else {
        if (!manifest.name && !manifest.shortName) {
          diagnostics.push(createIssue('Manifest should provide a name or shortName.', 'warning', context.resource));
        }

        if (!manifest.startUrl) {
          diagnostics.push(createIssue('Manifest should define a startUrl.', 'warning', context.resource));
        }

        if (!manifest.display) {
          diagnostics.push(createIssue('Manifest should define a display mode.', 'warning', context.resource));
        }
      }

      return createResult('security.manifest', 'manifest', diagnostics, 'Manifest inspected.');
    },
  };
}

export function createServiceWorkerCheck(options = {}) {
  return {
    id: options.id ?? 'security.serviceWorker',
    kind: 'service-worker',
    label: options.label ?? 'Service worker presence',
    run(context) {
      const diagnostics = [];
      const hasServiceWorker = context.manifest?.serviceWorker === true;

      if (!hasServiceWorker) {
        diagnostics.push(createIssue('Service worker registration was not declared.', 'warning', context.resource));
      }

      return createResult('security.serviceWorker', 'service-worker', diagnostics, 'Service worker inspected.');
    },
  };
}

export function createRemoteAssetCheck(options = {}) {
  return {
    id: options.id ?? 'security.remoteAsset',
    kind: 'remote-asset',
    label: options.label ?? 'Remote asset origin check',
    run(context) {
      const allowedOrigins = new Set(context.profile.allowRemoteOrigins ?? []);
      const diagnostics = (context.artifacts ?? []).flatMap((artifact) => {
        if (!isRemoteUri(artifact.uri)) {
          return [];
        }

        if (artifact.origin && allowedOrigins.has(artifact.origin)) {
          return [];
        }

        return [createIssue(`Remote asset ${artifact.uri} is not on an allowed origin.`, 'error', context.resource)];
      });

      return createResult('security.remoteAsset', 'remote-asset', diagnostics, 'Remote assets inspected.');
    },
  };
}

export function createForbiddenBrowserApiCheck(options = {}) {
  return {
    id: options.id ?? 'security.privilegedApi',
    kind: 'privileged-api',
    label: options.label ?? 'Forbidden browser API check',
    run(context) {
      const allowedApis = new Set(context.profile.allowedPrivilegedBrowserApis ?? []);
      const diagnostics = (context.privilegedApis ?? []).flatMap((api) =>
        allowedApis.has(api)
          ? []
          : [createIssue(`Privileged browser API ${api} is not allowed by the profile.`, 'error', context.resource)],
      );

      return createResult('security.privilegedApi', 'privileged-api', diagnostics, 'Privileged API use inspected.');
    },
  };
}

export function createForbiddenFilesystemApiCheck(options = {}) {
  return {
    id: options.id ?? 'security.filesystemApi',
    kind: 'filesystem-api',
    label: options.label ?? 'Forbidden filesystem API check',
    run(context) {
      const allowedApis = new Set(context.profile.allowedPrivilegedFilesystemApis ?? []);
      const diagnostics = (context.filesystemApis ?? []).flatMap((api) =>
        allowedApis.has(api)
          ? []
          : [createIssue(`Privileged filesystem API ${api} is not allowed by the profile.`, 'error', context.resource)],
      );

      return createResult('security.filesystemApi', 'filesystem-api', diagnostics, 'Filesystem API use inspected.');
    },
  };
}

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

export function runSecurityChecks(profile, context) {
  return profile.checks.map((check) => check.run({ ...context, profile }));
}

export const defaultSecurityProfile = createSecurityProfile({
  id: 'textforge.browser-envelope',
  name: 'TextForge Browser Envelope',
  target: 'web',
  dependencyPolicy: {
    allowedLicenses: ['0BSD', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'CC0-1.0', 'ISC', 'MIT', 'MPL-2.0', 'Unlicense', 'Zlib'],
    forbiddenLicenses: ['Proprietary', 'Commercial', 'UNLICENSED', 'UNKNOWN'],
    allowUnknown: false,
  },
  allowedPrivilegedFilesystemApis: [],
  checks: [
    createOpenSourceLicenseGate(),
    createCspCheck(),
    createManifestCheck(),
    createServiceWorkerCheck(),
    createRemoteAssetCheck(),
    createForbiddenBrowserApiCheck(),
    createForbiddenFilesystemApiCheck(),
    createArchiveBoundaryDocumentationCheck(),
    createVisualIdentityBoundaryCheck(),
    createBrowserStorageBoundaryCheck(),
    createLocalCommandDispatchCheck(),
    createLocalUiStateBoundaryCheck(),
  ],
});

export const contributions = {
  id: '@textforge/security-profile',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
};
