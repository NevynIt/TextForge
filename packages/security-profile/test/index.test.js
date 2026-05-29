import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createArchiveBoundaryDocumentationCheck,
  createBrowserStorageBoundaryCheck,
  createForbiddenFilesystemApiCheck,
  createLocalCommandDispatchCheck,
  createLocalUiStateBoundaryCheck,
  createOpenSourceLicenseGate,
  createVisualIdentityBoundaryCheck,
  defaultSecurityProfile,
  runSecurityChecks,
} from '../src/index.js';

test('security profile checks license, filesystem APIs, and archive boundary documentation', () => {
  const licenseGate = createOpenSourceLicenseGate();
  const filesystemCheck = createForbiddenFilesystemApiCheck();
  const archiveBoundaryCheck = createArchiveBoundaryDocumentationCheck();
  const storageBoundaryCheck = createBrowserStorageBoundaryCheck();
  const commandDispatchCheck = createLocalCommandDispatchCheck();
  const localUiStateCheck = createLocalUiStateBoundaryCheck();
  const visualIdentityCheck = createVisualIdentityBoundaryCheck();

  assert.equal(licenseGate.run({
    profile: defaultSecurityProfile,
    dependencies: [{ name: 'fflate', license: 'MIT' }],
  }).passed, true);
  assert.equal(filesystemCheck.run({
    profile: defaultSecurityProfile,
    filesystemApis: ['showOpenFilePicker'],
  }).passed, false);
  assert.equal(archiveBoundaryCheck.run({
    profile: defaultSecurityProfile,
    archiveBoundary: { documented: true, format: 'textforge-workspace-archive', notesUri: 'docs/archive-boundary.md' },
  }).passed, true);
  assert.equal(storageBoundaryCheck.run({
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
  assert.equal(commandDispatchCheck.run({
    profile: defaultSecurityProfile,
    commandDispatch: {
      documented: true,
      localOnly: true,
      usesPluginExecution: false,
      usesRemoteExecution: false,
      notesUri: 'docs/reference/specs/local-command-dispatch.md',
    },
  }).passed, true);
  assert.equal(localUiStateCheck.run({
    profile: defaultSecurityProfile,
    localUiState: {
      documented: true,
      localOnly: true,
      coversPopupOverlays: true,
      coversPanelSizing: true,
      usesDetachedWindows: false,
      usesRemoteContent: false,
      usesBackgroundSync: false,
      usesRemoteSync: false,
      usesFilesystemAccess: false,
      notesUri: 'docs/reference/specs/local-shell-ui-state.md',
    },
  }).passed, true);
  assert.equal(visualIdentityCheck.run({
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
    commandDispatch: {
      documented: true,
      localOnly: false,
      usesPluginExecution: true,
      usesRemoteExecution: false,
      notesUri: 'docs/reference/specs/local-command-dispatch.md',
    },
    localUiState: {
      documented: true,
      localOnly: false,
      coversPopupOverlays: false,
      coversPanelSizing: false,
      usesDetachedWindows: true,
      usesRemoteContent: false,
      usesBackgroundSync: false,
      usesRemoteSync: true,
      usesFilesystemAccess: false,
      notesUri: 'docs/reference/specs/local-shell-ui-state.md',
    },
  });

  assert.equal(results.some((result) => result.kind === 'filesystem-api' && result.passed === false), true);
  assert.equal(results.some((result) => result.kind === 'archive-boundary' && result.passed === false), true);
  assert.equal(results.some((result) => result.kind === 'visual-identity' && result.passed === false), true);
  assert.equal(results.some((result) => result.kind === 'storage-boundary' && result.passed === false), true);
  assert.equal(results.some((result) => result.kind === 'command-dispatch' && result.passed === false), true);
  assert.equal(results.some((result) => result.kind === 'local-ui-state' && result.passed === false), true);
});
