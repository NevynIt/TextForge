import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createArchiveBoundaryDocumentationCheck,
  createBrowserStorageBoundaryCheck,
  createForbiddenFilesystemApiCheck,
  createOpenSourceLicenseGate,
  defaultSecurityProfile,
  runSecurityChecks,
} from '../src/index.js';

test('security profile checks license, filesystem APIs, and archive boundary documentation', () => {
  const licenseGate = createOpenSourceLicenseGate();
  const filesystemCheck = createForbiddenFilesystemApiCheck();
  const archiveBoundaryCheck = createArchiveBoundaryDocumentationCheck();
  const storageBoundaryCheck = createBrowserStorageBoundaryCheck();

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
      notesUri: 'docs/specs/browser-managed-workspace-storage.md',
      usesFilesystemAccess: false,
      usesDirectoryHandles: false,
      usesBackgroundSync: false,
      usesRemoteSync: false,
      usesSilentLocalFileAccess: false,
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
      notesUri: 'docs/specs/browser-managed-workspace-storage.md',
    },
  });

  assert.equal(results.some((result) => result.kind === 'filesystem-api' && result.passed === false), true);
  assert.equal(results.some((result) => result.kind === 'archive-boundary' && result.passed === false), true);
  assert.equal(results.some((result) => result.kind === 'storage-boundary' && result.passed === false), true);
});
