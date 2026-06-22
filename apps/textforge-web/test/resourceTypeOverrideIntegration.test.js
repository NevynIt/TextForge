import assert from 'node:assert/strict';
import test from 'node:test';

import { applyResourceTypeOverride } from '@textforge/core';
import { standaloneDiagramPreviewSurfaceId } from '@textforge/diagrams';
import { createOpenWithSelection } from '@textforge/surfaces';
import { workspaceEntryToResourceRef } from '@textforge/workspace';
import { createWorkbenchRegistries } from '../src/workbench/controller/registries.js';

function createTextResource(overrides = {}) {
  return {
    id: overrides.id ?? 'resource-plain',
    kind: 'resource',
    representation: 'text',
    path: overrides.path ?? '/docs/new-file.txt',
    text: overrides.text ?? '',
    languageId: overrides.languageId ?? 'plaintext',
    mimeType: overrides.mimeType ?? 'text/plain',
    metadata: {
      providerId: overrides.providerId ?? 'workspace-local',
      capabilityIds: overrides.capabilityIds ?? ['resource.read', 'resource.open', 'resource.view', 'resource.write'],
      updatedAt: '2026-06-08T00:00:00.000Z',
    },
  };
}

function listSurfaceIdsForResource(surfaceRegistry, resource) {
  return createOpenWithSelection(surfaceRegistry, {
    resource: workspaceEntryToResourceRef(resource),
    allowPopup: true,
  }).candidates.map((candidate) => candidate.surfaceId);
}

test('effective resource type metadata changes open-with routing without renaming paths', () => {
  const { surfaceRegistry } = createWorkbenchRegistries();
  const plainResource = createTextResource();
  const markdownResource = applyResourceTypeOverride(plainResource, { languageId: 'markdown' });
  const bpmnResource = applyResourceTypeOverride(plainResource, { languageId: 'bpmn-xml' });
  const csvResource = applyResourceTypeOverride(plainResource, { languageId: 'csv' });

  assert.equal(markdownResource.path, '/docs/new-file.txt');
  assert.equal(markdownResource.mimeType, 'text/markdown');
  assert.equal(markdownResource.fileExtension, 'md');
  assert.equal(bpmnResource.mimeType, 'application/bpmn+xml');
  assert.equal(bpmnResource.fileExtension, 'bpmn');
  assert.equal(csvResource.mimeType, 'text/csv');
  assert.equal(csvResource.fileExtension, 'csv');

  assert.equal(listSurfaceIdsForResource(surfaceRegistry, markdownResource).includes('@textforge/markdown/preview'), true);
  assert.equal(listSurfaceIdsForResource(surfaceRegistry, bpmnResource).includes('@textforge/bpmn/viewer'), true);
  assert.equal(listSurfaceIdsForResource(surfaceRegistry, csvResource).includes('@textforge/tables/csv-grid'), true);
});

test('standalone diagram types route to diagram preview and SVG export command', () => {
  const { commandRegistry, surfaceRegistry } = createWorkbenchRegistries();
  const dotResource = createTextResource({
    id: 'diagram-dot',
    path: '/docs/graph.dot',
    languageId: 'dot',
    mimeType: 'text/vnd.graphviz',
    text: 'digraph G { A -> B; }',
  });
  const mermaidResource = createTextResource({
    id: 'diagram-mermaid',
    path: '/docs/flow.mmd',
    languageId: 'mermaid',
    mimeType: 'text/x-mermaid',
    text: 'flowchart TD\n  A --> B',
  });

  assert.equal(listSurfaceIdsForResource(surfaceRegistry, dotResource).includes(standaloneDiagramPreviewSurfaceId), true);
  assert.equal(listSurfaceIdsForResource(surfaceRegistry, mermaidResource).includes(standaloneDiagramPreviewSurfaceId), true);

  const visibleCommandIds = commandRegistry.resolve({
    runtimeStatus: 'ready',
    workspaceReady: true,
    selection: workspaceEntryToResourceRef(dotResource),
    availableSurfaceIds: [standaloneDiagramPreviewSurfaceId],
  }).filter((command) => command.visible).map((command) => command.id);

  assert.equal(visibleCommandIds.includes('diagram.export-selected-svg'), true);
});

test('read-only effective type override leaves provider resource metadata unchanged', () => {
  const bundledResource = createTextResource({
    id: 'bundled-readonly',
    path: '/.textforge/resources/docs/example.txt',
    providerId: 'bundled-docs',
    capabilityIds: ['resource.read', 'resource.open', 'resource.view', 'resource.export'],
  });
  const effectiveResource = applyResourceTypeOverride(bundledResource, { languageId: 'markdown' });

  assert.equal(bundledResource.languageId, 'plaintext');
  assert.equal(bundledResource.mimeType, 'text/plain');
  assert.equal(effectiveResource.languageId, 'markdown');
  assert.equal(effectiveResource.mimeType, 'text/markdown');
  assert.equal(effectiveResource.metadata.providerId, 'bundled-docs');
  assert.equal(effectiveResource.metadata.capabilityIds.includes('resource.write'), false);
});
