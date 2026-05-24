import assert from 'node:assert/strict';

import {
  createArchiveBoundaryDocumentationCheck,
  createForbiddenFilesystemApiCheck,
  createOpenSourceLicenseGate,
  defaultSecurityProfile,
  runSecurityChecks,
} from '../src/index.js';

assert.equal(defaultSecurityProfile.checks.some((check) => check.kind === 'filesystem-api'), true);
assert.equal(defaultSecurityProfile.checks.some((check) => check.kind === 'archive-boundary'), true);

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
});

assert.equal(results.some((result) => result.kind === 'filesystem-api' && result.passed === false), true);
assert.equal(results.some((result) => result.kind === 'archive-boundary' && result.passed === false), true);

console.info('security-profile package checks passed');