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
  | 'visual-identity'
  | 'storage-boundary'
  | 'command-dispatch'
  | 'local-ui-state'
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

export interface VisualIdentityBoundarySnapshot {
  readonly documented: boolean;
  readonly deterministic: boolean;
  readonly usesLocalIcons: boolean;
  readonly usesRemoteIcons?: boolean;
  readonly usesRemoteImages?: boolean;
  readonly usesFilesystemDerivedIdentity?: boolean;
  readonly usesUserProvidedImages?: boolean;
  readonly notesUri?: string;
}

export interface LocalCommandDispatchSnapshot {
  readonly documented: boolean;
  readonly localOnly: boolean;
  readonly usesPluginExecution?: boolean;
  readonly usesRemoteExecution?: boolean;
  readonly notesUri?: string;
}

export interface LocalUiStateBoundarySnapshot {
  readonly documented: boolean;
  readonly localOnly: boolean;
  readonly coversPopupOverlays?: boolean;
  readonly coversPanelSizing?: boolean;
  readonly usesDetachedWindows?: boolean;
  readonly usesRemoteContent?: boolean;
  readonly usesBackgroundSync?: boolean;
  readonly usesRemoteSync?: boolean;
  readonly usesFilesystemAccess?: boolean;
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
  readonly visualIdentity?: VisualIdentityBoundarySnapshot;
  readonly storageBoundary?: BrowserStorageBoundarySnapshot;
  readonly commandDispatch?: LocalCommandDispatchSnapshot;
  readonly localUiState?: LocalUiStateBoundarySnapshot;
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
