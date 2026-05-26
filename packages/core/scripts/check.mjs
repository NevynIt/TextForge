import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  contributionKinds,
  contributions,
  contributionRegistryPackageStatuses,
  createCanonicalContributionId,
  createCapability,
  createCanonicalPatch,
  createCommand,
  createContributionManifest,
  createContributionRegistry,
  createDiagnostic,
  deriveCapabilityLocalName,
  deriveContributionLocalName,
  createMarkdownFenceHandlerContribution,
  createPipelineValue,
  createResourceFacts,
  createResourcePredicate,
  createResourceRef,
  createSourcePosition,
  createSourceRange,
  createSurfaceContribution,
  editorCapabilityIds,
  getLanguageDefinition,
  inferLanguageId,
  inferResourceRepresentation,
  languageDefinitions,
  matchesResourcePredicate,
  resourceKinds,
  resourceRepresentations,
  resolveDocumentContributionContext,
  severityLevels,
} from '../src/index.js';

assert.deepEqual(severityLevels, ['observation', 'information', 'warning', 'error']);
assert.deepEqual(resourceKinds, ['resource', 'generated', 'virtual']);
assert.deepEqual(resourceRepresentations, ['text', 'bytes']);
assert.equal(languageDefinitions.length, 14);
assert.equal(getLanguageDefinition('markdown')?.label, 'Markdown');
assert.equal(inferLanguageId({ path: '/docs/process.bpmn', mimeType: 'application/bpmn+xml' }), 'bpmn-xml');
assert.equal(inferLanguageId({ path: '/docs/model.yaml' }), 'yaml');
assert.equal(editorCapabilityIds.languageMode, 'editor.language-mode');
assert.equal(contributionKinds.surfaces, 'surfaces');
assert.equal(contributionKinds.markdownFenceHandlers, 'markdown-fence-handlers');
assert.deepEqual(contributionRegistryPackageStatuses, ['available', 'disabled', 'missingDependency', 'incompatibleVersion', 'conflict', 'failedToInitialize']);
assert.equal(contributions.id, '@textforge/core');
assert.equal(createCanonicalContributionId('@textforge/example', 'preview'), '@textforge/example/preview');
assert.equal(deriveContributionLocalName('@textforge/example', '@textforge/example/preview'), 'preview');
assert.equal(deriveCapabilityLocalName('@textforge/example/capability/preview'), 'preview');

const ref = createResourceRef('resource-1', { path: '/docs/note.md', kind: 'resource', representation: 'text' });
assert.equal(ref.resourceId, 'resource-1');
assert.equal(ref.path, '/docs/note.md');
assert.equal(inferResourceRepresentation({ path: '/docs/system.svg', mimeType: 'image/svg+xml' }), 'text');

const range = createSourceRange(createSourcePosition(1, 1), createSourcePosition(1, 5, 4));
const diagnostic = createDiagnostic('Example', 'info', { source: range, resource: ref });
assert.equal(diagnostic.severity, 'information');
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

const predicate = createResourcePredicate({
  representations: ['text'],
  mimeTypes: ['image/svg+xml'],
  fileExtensions: ['svg'],
});
assert.equal(matchesResourcePredicate(predicate, createResourceFacts({
  resourceId: 'resource-2',
  path: '/docs/diagram.svg',
  kind: 'resource',
  representation: 'text',
  mimeType: 'image/svg+xml',
})), true);

const contributionRegistry = createContributionRegistry([
  createContributionManifest('@textforge/markdown', {
    capabilities: [createCapability('@textforge/markdown/capability/json', { defaultActive: true })],
    markdownFenceHandlers: [
      createMarkdownFenceHandlerContribution('@textforge/markdown/json', {
        fenceNames: ['json'],
        capabilities: ['@textforge/markdown/capability/json'],
        defaultActive: true,
      }),
    ],
  }),
]);
assert.equal(contributionRegistry.createMarkdownFenceHandlerMap().handlers.json.id, '@textforge/markdown/json');
assert.equal(contributionRegistry.resolve().packages[0]?.packageId, '@textforge/markdown');
assert.equal(resolveDocumentContributionContext({
  registry: contributionRegistry,
  document: createResourceRef('resource-3', {
    path: '/docs/example.md',
    kind: 'resource',
    representation: 'text',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  }),
}).activeMarkdownFenceHandlers[0]?.id, '@textforge/markdown/json');

const workspaceRoot = fileURLToPath(new URL('..\\..\\..', import.meta.url));
const auditedFiles = [
  'packages/workspace/src/index.js',
  'packages/assets/scripts/check.mjs',
  'packages/assets/test/index.test.js',
];

for (const filePath of auditedFiles) {
  const contents = await readFile(resolve(workspaceRoot, filePath), 'utf8');
  if (/@textforge\/.*\/src\//.test(contents) || /\.\.\/\.\.\/(?:[^"'`]+)src\/index\.js/.test(contents)) {
    throw new Error(`Phase 4.1 public API audit failed: ${filePath} still uses a cross-package src import.`);
  }
}

console.info('core package checks passed');
