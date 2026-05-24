import type { Diagnostic, ResourceRef, Severity } from '@textforge/core';

export type BrowserEnvelopeTarget = 'web' | 'extension' | 'pwa';

export type SecurityCheckKind =
  | 'csp'
  | 'manifest'
  | 'service-worker'
  | 'remote-asset'
  | 'privileged-api'
  | 'filesystem-api'
  | 'archive-boundary'
  | 'storage-boundary'
  | 'license';

export interface SecurityDependency {
  readonly name: string;
  readonly version?: string;
  readonly license: string;
}

export interface SecurityArtifact {
  readonly uri: string;
  readonly mimeType?: string;
  readonly origin?: string;
}

export interface SecurityManifestSnapshot {
  readonly name?: string;
  readonly shortName?: string;
  readonly startUrl?: string;
  readonly scope?: string;
  readonly display?: string;
  readonly contentSecurityPolicy?: string;
  readonly serviceWorker?: boolean;
}

export interface ArchiveBoundarySnapshot {
  readonly documented: boolean;
  readonly format?: string;
  readonly version?: string | number;
  readonly notesUri?: string;
}

export interface BrowserStorageBoundarySnapshot {
  readonly documented: boolean;
  readonly browserManaged: boolean;
  readonly mechanism?: string;
  readonly driver?: string;
  readonly databaseName?: string;
  readonly usesRemoteSync?: boolean;
  readonly usesBackgroundSync?: boolean;
  readonly usesFilesystemAccess?: boolean;
  readonly usesDirectoryHandles?: boolean;
  readonly usesSilentLocalFileAccess?: boolean;
  readonly notesUri?: string;
}

export interface SecurityProfile {
  readonly id: string;
  readonly name: string;
  readonly target: BrowserEnvelopeTarget;
  readonly description?: string;
  readonly allowRemoteOrigins?: ReadonlyArray<string>;
  readonly allowedPrivilegedBrowserApis?: ReadonlyArray<string>;
  readonly allowedPrivilegedFilesystemApis?: ReadonlyArray<string>;
  readonly dependencyPolicy: LicensePolicy;
  readonly checks: ReadonlyArray<SecurityCheck>;
}

export interface LicensePolicy {
  readonly allowedLicenses: ReadonlyArray<string>;
  readonly forbiddenLicenses?: ReadonlyArray<string>;
  readonly allowUnknown?: boolean;
}

export interface SecurityCheckContext {
  readonly profile: SecurityProfile;
  readonly resource?: ResourceRef;
  readonly manifest?: SecurityManifestSnapshot;
  readonly artifacts?: ReadonlyArray<SecurityArtifact>;
  readonly dependencies?: ReadonlyArray<SecurityDependency>;
  readonly privilegedApis?: ReadonlyArray<string>;
  readonly filesystemApis?: ReadonlyArray<string>;
  readonly archiveBoundary?: ArchiveBoundarySnapshot;
  readonly storageBoundary?: BrowserStorageBoundarySnapshot;
}

export interface SecurityCheckResult {
  readonly checkId: string;
  readonly kind: SecurityCheckKind;
  readonly passed: boolean;
  readonly severity: Severity;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly summary?: string;
}

export interface SecurityCheck {
  readonly id: string;
  readonly kind: SecurityCheckKind;
  readonly label: string;
  readonly run: (context: SecurityCheckContext) => SecurityCheckResult;
}

export interface SecurityIssue {
  readonly message: string;
  readonly severity: Severity;
  readonly resource?: ResourceRef;
}

function createResult(
  checkId: string,
  kind: SecurityCheckKind,
  diagnostics: ReadonlyArray<Diagnostic>,
  summary?: string,
): SecurityCheckResult {
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

function createIssue(message: string, severity: Severity, resource?: ResourceRef): Diagnostic {
  return {
    severity,
    message,
    resource,
  };
}

function normalizeLicense(license: string): string {
  return license.trim().toUpperCase();
}

function isRemoteUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

function isAllowedLicense(license: string, policy: LicensePolicy): boolean {
  const normalized = normalizeLicense(license);

  if (!policy.allowUnknown && (!normalized || normalized === 'UNKNOWN' || normalized === 'UNLICENSED')) {
    return false;
  }

  if (policy.forbiddenLicenses?.some((entry) => normalizeLicense(entry) === normalized)) {
    return false;
  }

  return policy.allowedLicenses.some((entry) => normalizeLicense(entry) === normalized);
}

export function createSecurityProfile(profile: SecurityProfile): SecurityProfile {
  return profile;
}

export function createOpenSourceLicenseGate(options: {
  readonly id?: string;
  readonly label?: string;
  readonly policy?: LicensePolicy;
} = {}): SecurityCheck {
  const policy: LicensePolicy = options.policy ?? {
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

export function createCspCheck(options: { readonly id?: string; readonly label?: string } = {}): SecurityCheck {
  return {
    id: options.id ?? 'security.csp',
    kind: 'csp',
    label: options.label ?? 'Content Security Policy',
    run(context) {
      const csp = context.manifest?.contentSecurityPolicy?.trim() ?? '';
      const diagnostics: Diagnostic[] = [];

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

export function createManifestCheck(options: {
  readonly id?: string;
  readonly label?: string;
} = {}): SecurityCheck {
  return {
    id: options.id ?? 'security.manifest',
    kind: 'manifest',
    label: options.label ?? 'Web app manifest',
    run(context) {
      const manifest = context.manifest;
      const diagnostics: Diagnostic[] = [];

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

export function createServiceWorkerCheck(options: {
  readonly id?: string;
  readonly label?: string;
} = {}): SecurityCheck {
  return {
    id: options.id ?? 'security.serviceWorker',
    kind: 'service-worker',
    label: options.label ?? 'Service worker presence',
    run(context) {
      const diagnostics: Diagnostic[] = [];
      const hasServiceWorker = context.manifest?.serviceWorker === true;

      if (!hasServiceWorker) {
        diagnostics.push(createIssue('Service worker registration was not declared.', 'warning', context.resource));
      }

      return createResult('security.serviceWorker', 'service-worker', diagnostics, 'Service worker inspected.');
    },
  };
}

export function createRemoteAssetCheck(options: {
  readonly id?: string;
  readonly label?: string;
} = {}): SecurityCheck {
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

        return [
          createIssue(`Remote asset ${artifact.uri} is not on an allowed origin.`, 'error', context.resource),
        ];
      });

      return createResult('security.remoteAsset', 'remote-asset', diagnostics, 'Remote assets inspected.');
    },
  };
}

export function createForbiddenBrowserApiCheck(options: {
  readonly id?: string;
  readonly label?: string;
} = {}): SecurityCheck {
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

export function createForbiddenFilesystemApiCheck(options: {
  readonly id?: string;
  readonly label?: string;
} = {}): SecurityCheck {
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

export function createArchiveBoundaryDocumentationCheck(options: {
  readonly id?: string;
  readonly label?: string;
} = {}): SecurityCheck {
  return {
    id: options.id ?? 'security.archiveBoundary',
    kind: 'archive-boundary',
    label: options.label ?? 'Archive boundary documentation',
    run(context) {
      const diagnostics: Diagnostic[] = [];
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

export function createBrowserStorageBoundaryCheck(options: {
  readonly id?: string;
  readonly label?: string;
} = {}): SecurityCheck {
  return {
    id: options.id ?? 'security.storageBoundary',
    kind: 'storage-boundary',
    label: options.label ?? 'Browser-managed storage boundary',
    run(context) {
      const diagnostics: Diagnostic[] = [];
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

export function runSecurityChecks(profile: SecurityProfile, context: Omit<SecurityCheckContext, 'profile'>): ReadonlyArray<SecurityCheckResult> {
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
    createBrowserStorageBoundaryCheck(),
  ],
});

export const contributions = {
  id: '@textforge/security-profile',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
} as const;
