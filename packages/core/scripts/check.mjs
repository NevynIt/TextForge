import assert from 'node:assert/strict';

import {
  contributionKinds,
  contributions,
  createCapability,
  createCanonicalPatch,
  createCommand,
  createContributionManifest,
  createDiagnostic,
  editorCapabilityIds,
  getLanguageDefinition,
  inferLanguageId,
  languageDefinitions,
  createPipelineValue,
  createResourceRef,
  createSourcePosition,
  createSourceRange,
  createSurfaceContribution,
  severityLevels,
  resourceKinds,
} from '../src/index.js';

assert.deepEqual(severityLevels, ['hint', 'info', 'warning', 'error']);
assert.deepEqual(resourceKinds, ['text', 'binary', 'generated', 'virtual']);
assert.equal(languageDefinitions.length, 14);
assert.equal(getLanguageDefinition('markdown')?.label, 'Markdown');
assert.equal(inferLanguageId({ path: '/docs/process.bpmn', mimeType: 'application/bpmn+xml' }), 'bpmn-xml');
assert.equal(inferLanguageId({ path: '/docs/model.yaml' }), 'yaml');
assert.equal(editorCapabilityIds.languageMode, 'editor.language-mode');
assert.equal(contributionKinds.surfaces, 'surfaces');
assert.equal(contributions.id, '@textforge/core');

const ref = createResourceRef('resource-1', { path: '/docs/note.md', kind: 'text' });
assert.equal(ref.resourceId, 'resource-1');
assert.equal(ref.path, '/docs/note.md');

const range = createSourceRange(createSourcePosition(1, 1), createSourcePosition(1, 5, 4));
const diagnostic = createDiagnostic('Example', 'warning', { source: range, resource: ref });
assert.equal(diagnostic.severity, 'warning');
assert.equal(diagnostic.source?.end.offset, 4);

const manifest = createContributionManifest('@textforge/example', { commands: [createCommand('noop', 'No-op')] });
assert.equal(manifest.packageId, '@textforge/example');
assert.equal(manifest.commands?.[0]?.label, 'No-op');

const capability = createCapability('capability.read');
const surface = createSurfaceContribution('surface.example', { capabilities: [capability.id] });
assert.equal(surface.capabilities?.[0], 'capability.read');

const pipelineValue = createPipelineValue('workspace', { title: 'Workspace' });
assert.equal(pipelineValue.kind, 'workspace');

const patch = createCanonicalPatch(ref, [{ op: 'replace', path: '/title', value: 'Updated' }]);
assert.equal(patch.operations[0].op, 'replace');

console.info('core package checks passed');
