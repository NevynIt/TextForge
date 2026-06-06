import {
  createForbiddenBrowserApiCheck,
  createForbiddenFilesystemApiCheck,
  createCspCheck,
  createManifestCheck,
  createRemoteAssetCheck,
  createServiceWorkerCheck,
} from './browser-checks.js';
import {
  createArchiveBoundaryDocumentationCheck,
  createBrowserStorageBoundaryCheck,
  createLocalCommandDispatchCheck,
  createLocalUiStateBoundaryCheck,
  createVisualIdentityBoundaryCheck,
} from './boundary-checks.js';
import { createOpenSourceLicenseGate } from './license.js';

export function createSecurityProfile(profile) {
  return profile;
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
