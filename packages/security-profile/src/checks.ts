import type { LicensePolicy, SecurityCheck } from './types.ts';

export declare function createOpenSourceLicenseGate(options?: {
  readonly id?: string;
  readonly label?: string;
  readonly policy?: LicensePolicy;
}): SecurityCheck;

export declare function createCspCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createManifestCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createServiceWorkerCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createRemoteAssetCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createForbiddenBrowserApiCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createForbiddenFilesystemApiCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createArchiveBoundaryDocumentationCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createVisualIdentityBoundaryCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createBrowserStorageBoundaryCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createLocalCommandDispatchCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
export declare function createLocalUiStateBoundaryCheck(options?: { readonly id?: string; readonly label?: string }): SecurityCheck;
