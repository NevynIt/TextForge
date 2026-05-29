import assert from 'node:assert/strict';

import {
  createArchiveBoundaryDocumentationCheck,
  createBrowserStorageBoundaryCheck,
  createForbiddenFilesystemApiCheck,
  createOpenSourceLicenseGate,
  createVisualIdentityBoundaryCheck,
  defaultSecurityProfile,
  runSecurityChecks,
} from '../src/index.js';

assert.equal(defaultSecurityProfile.checks.some((check) => check.kind === 'filesystem-api'), true);
assert.equal(defaultSecurityProfile.checks.some((check) => check.kind === 'archive-boundary'), true);
assert.equal(defaultSecurityProfile.checks.some((check) => check.kind === 'visual-identity'), true);

assert.equal(createOpenSourceLicenseGate().run({
  profile: defaultSecurityProfile,
  dependencies: [{ name: 'fflate', license: 'MIT' }],
}).passed, true);

assert.equal(createForbiddenFilesystemApiCheck().run({
  profile: defaultSecurityProfile,
  filesystemApis: ['showOpenFilePicker'],
}).passed, false);

assert.equal(createArchiveBoundaryDocumentationCheck().run({
  profile: defaultSecurityProfile,
  archiveBoundary: { documented: true, format: 'textforge-workspace-archive', notesUri: 'docs/archive-boundary.md' },
}).passed, true);
assert.equal(createBrowserStorageBoundaryCheck().run({
  profile: defaultSecurityProfile,
  storageBoundary: {
    documented: true,
    browserManaged: true,
    mechanism: 'indexeddb',
    driver: 'dexie',
    notesUri: 'docs/reference/specs/browser-managed-workspace-storage.md',
    usesFilesystemAccess: false,
    usesDirectoryHandles: false,
    usesBackgroundSync: false,
    usesRemoteSync: false,
    usesSilentLocalFileAccess: false,
  },
}).passed, true);
assert.equal(createVisualIdentityBoundaryCheck().run({
  profile: defaultSecurityProfile,
  visualIdentity: {
    documented: true,
    deterministic: true,
    usesLocalIcons: true,
    usesRemoteIcons: false,
    usesRemoteImages: false,
    usesFilesystemDerivedIdentity: false,
    usesUserProvidedImages: false,
    notesUri: 'docs/reference/specs/resource-identity-badges.md',
  },
}).passed, true);

const results = runSecurityChecks(defaultSecurityProfile, {
  manifest: {
    name: 'TextForge',
    startUrl: '/index.html',
    display: 'standalone',
    contentSecurityPolicy: "default-src 'self'",
    serviceWorker: true,
  },
  artifacts: [{ uri: '/assets/textforge.css' }],
  filesystemApis: ['showDirectoryPicker'],
  archiveBoundary: { documented: false },
  visualIdentity: {
    documented: true,
    deterministic: false,
    usesLocalIcons: false,
    usesRemoteIcons: true,
    usesRemoteImages: false,
    usesFilesystemDerivedIdentity: true,
    usesUserProvidedImages: true,
    notesUri: 'docs/reference/specs/resource-identity-badges.md',
  },
  storageBoundary: {
    documented: true,
    browserManaged: true,
    mechanism: 'indexeddb',
    driver: 'dexie',
    usesFilesystemAccess: false,
    usesDirectoryHandles: false,
    usesBackgroundSync: true,
    usesRemoteSync: false,
    usesSilentLocalFileAccess: false,
    notesUri: 'docs/reference/specs/browser-managed-workspace-storage.md',
  },
});

assert.equal(results.some((result) => result.kind === 'filesystem-api' && result.passed === false), true);
assert.equal(results.some((result) => result.kind === 'archive-boundary' && result.passed === false), true);
assert.equal(results.some((result) => result.kind === 'visual-identity' && result.passed === false), true);
assert.equal(results.some((result) => result.kind === 'storage-boundary' && result.passed === false), true);

console.info('security-profile package checks passed');
