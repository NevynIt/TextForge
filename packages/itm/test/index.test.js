import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  contributions,
  createItmGraphvizDiagramSource,
  createItmMermaidMindmapSource,
  createItmResolverDiagnostic,
  createWorkspaceItmIncludeProvider,
  itmResolverDiagnosticCodes,
  listItmVisualTargets,
  loadItmDocument,
  parseDocument,
  projectItmDocument,
  resolveItmVisualTarget,
  renderItmPublicationHtml,
  serializeDocument,
  validateItmDocument,
} from '../src/index.js';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const examplesDirectory = resolve(testDirectory, '../src/examples');
const docsExamplesDirectory = resolve(testDirectory, '..', '..', '..', 'docs', 'examples', 'itm', 'test-profiles');

test('upstream parser is available through the package wrapper', () => {
  const document = parseDocument(`%metadata
{
  title: Order model
  defaultNamespace: local
}

&order [Task] Order @creates:invoice
  &invoice [Task] Invoice
&payment Payment
`);

  assert.equal(document.metadata?.title, 'Order model');
  assert.equal(document.entities.length, 3);
  assert.equal(document.relationships.some((relationship) => relationship.relationshipKind === 'containment'), true);
  const serialized = serializeDocument(document);
  const reparsed = parseDocument(serialized);
  assert.equal(reparsed.entities.length, 3);
});

test('loadItmDocument composes workspace includes through the TextForge include provider', async () => {
  const workspace = {
    getEntryByPath(path) {
      if (path === '/models/shared.itm') {
        return {
          kind: 'resource',
          representation: 'text',
          path,
          text: '&shared Shared capability',
        };
      }
      if (path === '/docs/shared/shared.itm') {
        return {
          kind: 'resource',
          representation: 'text',
          path,
          text: '&shared Shared capability',
        };
      }
      return undefined;
    },
  };

  const loaded = await loadItmDocument(`%include ./shared/shared.itm
&root Root capability`, {
    uri: '/docs/roadmap.md',
    includeProviders: [createWorkspaceItmIncludeProvider(workspace)],
  });

  assert.equal(loaded.document.entities.some((entity) => entity.label === 'Shared capability'), true);
  assert.equal(loaded.diagnostics.some((diagnostic) => diagnostic.severity === 'error'), false);
});

test('loadItmDocument resolves repository-backed includes through logical aliases without frontend fetch', async () => {
  const workspace = {
    getEntryByPath(path) {
      if (path === '/.textforge/resources/docs/examples/itm/repositories/org-reference-models/main.itm') {
        return {
          kind: 'resource',
          representation: 'text',
          path,
          text: '%include ./nested.itm\n&shared Shared capability',
        };
      }
      if (path === '/.textforge/resources/docs/examples/itm/repositories/org-reference-models/nested.itm') {
        return {
          kind: 'resource',
          representation: 'text',
          path,
          text: '&nested Nested capability',
        };
      }
      return undefined;
    },
  };

  const loaded = await loadItmDocument(`%repository shared org-reference-models
%include shared:main.itm
&root Root capability`, {
    uri: '/docs/roadmap.itm',
    includeProviders: [createWorkspaceItmIncludeProvider(workspace, {
      repositoryAliases: {
        'org-reference-models': 'bundled://docs/examples/itm/repositories/org-reference-models',
      },
    })],
    repositoryResolution: {
      repositoryAliases: {
        'org-reference-models': 'bundled://docs/examples/itm/repositories/org-reference-models',
      },
    },
  });

  assert.equal(loaded.document.entities.some((entity) => entity.label === 'Shared capability'), true);
  assert.equal(loaded.document.entities.some((entity) => entity.label === 'Nested capability'), true);
  assert.equal(loaded.diagnostics.some((diagnostic) => diagnostic.code === itmResolverDiagnosticCodes.unsupported), false);
});

test('renderItmPublicationHtml renders projected view content', () => {
  const document = parseDocument(`%viewpoint capability_view
{
  pipeline:
    - select: "[Capability]"
}
%view roadmap_view
{
  viewpoint: capability_view
}
&roadmap [Capability] Capability roadmap
  &phase1 [Phase] Foundation
`);

  const projection = projectItmDocument(document, {
    view: 'roadmap_view',
  });
  const html = renderItmPublicationHtml(document, {
    view: 'roadmap_view',
    title: 'Capability roadmap summary',
  });

  assert.equal(projection.nodes.length >= 1, true);
  assert.match(html, /Capability roadmap summary/);
  assert.match(html, /Capability roadmap/);
});

test('projectItmDocument exposes tree, graph, mindmap, catalogue, matrix, and report projections', () => {
  const document = parseDocument(`%viewpoint capability_view
{
  pipeline:
    - select: "[Capability]"
}
%view roadmap_view
{
  viewpoint: capability_view
}
&roadmap [Capability] Capability roadmap
  &phase1 [Capability] Foundation
  &phase2 [Capability] Delivery
`);

  const projection = projectItmDocument(document, {
    view: 'roadmap_view',
    title: 'Capability roadmap',
  });

  assert.equal(projection.tree.roots.length, 1);
  assert.equal(projection.graph.nodes.length, projection.nodes.length);
  assert.equal(projection.catalogues.entities.length, projection.nodes.length);
  assert.equal(projection.matrix.rows.length, projection.graph.nodes.length);
  assert.equal(projection.report.sections.length >= 3, true);
  assert.match(projection.graphvizSource, /digraph ItmProjection/);
  assert.match(projection.mermaidMindmapSource, /mindmap/);
  assert.match(createItmGraphvizDiagramSource(projection), /Capability roadmap/);
  assert.match(createItmMermaidMindmapSource(projection), /Capability roadmap/);
});

test('renderItmPublicationHtml supports catalogue and matrix projection output', () => {
  const document = parseDocument(`&roadmap [Capability] Capability roadmap
  &phase1 [Capability] Foundation
  &phase2 [Capability] Delivery
`);

  const catalogueHtml = renderItmPublicationHtml(document, {
    projection: 'catalogue',
    title: 'Capability catalogue',
  });
  const matrixHtml = renderItmPublicationHtml(document, {
    projection: 'matrix',
    title: 'Capability matrix',
  });

  assert.match(catalogueHtml, /data-itm-projection="catalogue"/);
  assert.match(catalogueHtml, /Capability catalogue/);
  assert.match(matrixHtml, /data-itm-projection="matrix"/);
  assert.match(matrixHtml, /Source \\ Target/);
});

test('ITM contribution manifest exposes markdown fence handlers', () => {
  assert.equal(contributions.packageId, '@textforge/itm');
  assert.equal(contributions.markdownFenceHandlers.some((handler) => handler.localName === 'itm'), true);
  assert.equal(contributions.markdownFenceHandlers.some((handler) => handler.localName === 'itm-pub'), true);
});

test('ITM contribution manifest exposes package-owned projection surfaces', () => {
  assert.deepEqual(
    contributions.surfaces.map((surface) => surface.id).sort(),
    [
      '@textforge/itm/catalogue',
      '@textforge/itm/graph',
      '@textforge/itm/matrix',
      '@textforge/itm/mindmap',
      '@textforge/itm/report',
      '@textforge/itm/tree',
    ],
  );
});

test('ITM projection surfaces mount the focused smoke profile one projection at a time', async () => {
  const sourceText = readFileSync(resolve(docsExamplesDirectory, 'itm-surface-smoke.itm'), 'utf8');
  for (const surfaceContribution of contributions.surfaces) {
    const runtime = surfaceContribution.open({
      resource: {
        resourceId: 'itm-surface-smoke',
        path: '/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
        kind: 'resource',
        representation: 'text',
      },
      resourceTitle: 'ITM surface smoke model',
      sourceText,
      updatedAt: '2026-05-27T00:00:00.000Z',
    });
    const container = {
      innerHTML: '',
    };

    const dispose = runtime.surface.mount(container);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.match(container.innerHTML, /data-itm-projection=/);
    assert.match(container.innerHTML, /Capability roadmap/);
    dispose();
    assert.equal(container.innerHTML, '');
  }
});

test('listItmVisualTargets exposes views, viewpoints, and explicit raw-model fallback targets', async () => {
  const loaded = await loadItmDocument(readFileSync(resolve(docsExamplesDirectory, 'itm-surface-smoke.itm'), 'utf8'), {
    uri: '/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
  });

  const targets = listItmVisualTargets(loaded);

  assert.equal(targets.some((target) => target.kind === 'view' && target.id === 'capability_surface' && target.available), true);
  assert.equal(targets.some((target) => target.kind === 'viewpoint' && target.id === 'capability_focus' && target.available), true);
  assert.equal(targets.some((target) => target.kind === 'raw-model' && target.projection === 'graph'), true);
  assert.equal(targets.some((target) => target.kind === 'raw-model' && target.projection === 'mindmap'), true);
});

test('resolveItmVisualTarget derives Visual ITM with renderer precedence, provenance, and itm-pub parity', async () => {
  const loaded = await loadItmDocument(readFileSync(resolve(docsExamplesDirectory, 'itm-surface-smoke.itm'), 'utf8'), {
    uri: '/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
  });

  const resolvedView = resolveItmVisualTarget(loaded, {
    view: 'capability_surface',
    title: 'Capability surface',
  });
  const resolvedRawMindmap = resolveItmVisualTarget(loaded, {
    target: {
      kind: 'raw-model',
      id: 'raw-model/mindmap',
    },
  });

  assert.equal(resolvedView.target.rendererValue, 'graph.viewer');
  assert.equal(resolvedView.target.preferredSurfaceId, '@textforge/itm/graph');
  assert.equal(resolvedView.visualDocument.origin.derivedTarget?.kind, 'view');
  assert.equal(resolvedView.visualDocument.nodes.some((node) => (node.provenance?.length ?? 0) >= 2), true);
  assert.equal(resolvedView.visualDiagnostics.length, 0);
  assert.equal(renderItmPublicationHtml(loaded.effectiveResolvedDocument, { view: 'capability_surface', projection: 'graph' }).includes('data-itm-projection="graph"'), true);
  assert.equal(resolvedRawMindmap.target.rendererSource, 'local');
  assert.equal(resolvedRawMindmap.target.preferredSurfaceId, '@textforge/itm/mindmap');
});

test('resolveItmVisualTarget reports missing declared renderers without silently falling back', async () => {
  const loaded = await loadItmDocument(`%viewpoint broken
{
  pipeline:
    - select: "[Capability]"
}
%view broken_view
{
  viewpoint: broken
}
&roadmap [Capability] Capability roadmap
`, {
    uri: '/docs/broken.itm',
  });

  const resolved = resolveItmVisualTarget(loaded, {
    view: 'broken_view',
  });

  assert.equal(resolved.target.available, false);
  assert.equal(resolved.diagnostics.some((diagnostic) => diagnostic.code === 'itm.visual.resolve.renderer-missing'), true);
  assert.equal(resolved.projectedDocument.nodes.length, 0);
});

test('validateItmDocument surfaces stable include and repository resolver diagnostics', () => {
  const document = parseDocument(`%repository shared ./shared
%repository shared ./duplicate
%repository private ./private
%repository offline ./offline
%include shared:model.itm
%include private:secrets.itm
%include offline:profile.itm
%include missing:ghost.itm
&root Root capability
`, {
    uri: '/docs/root.itm',
  });

  document.repositories.find((repository) => repository.name === 'private').allowed = false;
  document.repositories.find((repository) => repository.name === 'offline').resolved = false;
  document.includes[0].status = 'unresolved';
  document.includes[1].status = 'blocked';
  document.includes[2].status = 'missing';
  document.includes[3].status = 'unresolved';

  const diagnostics = validateItmDocument(document);
  const codes = new Set(diagnostics.map((diagnostic) => diagnostic.code));

  assert.equal(codes.has(itmResolverDiagnosticCodes.conflictingAlias), true);
  assert.equal(codes.has(itmResolverDiagnosticCodes.unresolved), true);
  assert.equal(codes.has(itmResolverDiagnosticCodes.unsupported), true);
  assert.equal(codes.has(itmResolverDiagnosticCodes.unauthorized), true);
  assert.equal(codes.has(itmResolverDiagnosticCodes.unavailable), true);
});

test('validateItmDocument treats unsupported repository locations as explicit resolver diagnostics', () => {
  const document = parseDocument(`%repository shared https://example.org/itm
%include shared:profiles/core.itm
&root Root capability
`);

  const diagnostics = validateItmDocument(document);

  assert.equal(
    diagnostics.some((diagnostic) => diagnostic.code === itmResolverDiagnosticCodes.unsupported),
    true,
  );
});

test('loadItmDocument reports unauthorized and unavailable repository aliases distinctly', async () => {
  const unauthorized = await loadItmDocument(`%repository shared locked-library
%include shared:secret.itm
`, {
    includeProviders: [createWorkspaceItmIncludeProvider({
      getEntryByPath() {
        return undefined;
      },
    }, {
      repositoryAliases: {
        'locked-library': {
          location: 'bundled://docs/examples/itm/repositories/locked-library',
          allowed: false,
        },
      },
    })],
    repositoryResolution: {
      repositoryAliases: {
        'locked-library': {
          location: 'bundled://docs/examples/itm/repositories/locked-library',
          allowed: false,
        },
      },
    },
  });
  const unavailable = await loadItmDocument(`%repository shared offline-library
%include shared:missing.itm
`, {
    includeProviders: [createWorkspaceItmIncludeProvider({
      getEntryByPath() {
        return undefined;
      },
    }, {
      repositoryAliases: {
        'offline-library': {
          location: 'bundled://docs/examples/itm/repositories/offline-library',
          available: false,
        },
      },
    })],
    repositoryResolution: {
      repositoryAliases: {
        'offline-library': {
          location: 'bundled://docs/examples/itm/repositories/offline-library',
          available: false,
        },
      },
    },
  });

  assert.equal(
    unauthorized.diagnostics.some((diagnostic) => diagnostic.code === itmResolverDiagnosticCodes.unauthorized),
    true,
  );
  assert.equal(
    unavailable.diagnostics.some((diagnostic) => diagnostic.code === itmResolverDiagnosticCodes.unavailable),
    true,
  );
});

test('loadItmDocument activates only the requested package scopes from included profile content', async () => {
  const workspace = {
    getEntryByPath(path) {
      if (path === '/profiles/scoped.itm') {
        return {
          kind: 'resource',
          representation: 'text',
          path,
          text: `%package scoped_profile
{
  activation:
    - scoped_profile.types
}
%namespace scoped https://example.org/scoped
%entitytype scoped::Capability
{
  description: Scoped capability type.
}
%style [scoped::Capability]
{
  color: "#ff0000"
}`,
        };
      }
      return undefined;
    },
  };

  const loaded = await loadItmDocument(`%include ../profiles/scoped.itm
%using scoped_profile.types
&cap [scoped::Capability] Capability
`, {
    uri: '/docs/root.itm',
    includeProviders: [createWorkspaceItmIncludeProvider(workspace)],
  });

  assert.equal(loaded.effectiveDocument.entityTypes.some((entityType) => entityType.name === 'scoped::Capability'), true);
  assert.equal((loaded.effectiveDocument.styles?.length ?? 0), 0);
  assert.equal(loaded.diagnostics.some((diagnostic) => diagnostic.code === 'itm.validation.provider-unavailable'), false);
});

test('validateItmDocument surfaces missing provider capabilities for active package rules', () => {
  const document = parseDocument(`%package validation_profile
{
  activation:
    - validation_profile.rules
}
%rule require_name
{
  select: "*"
  pipeline:
    - requireAttribute: name
  severity: error
  message: "Every matching item must expose a name attribute."
}
%using validation_profile.rules
&cap Capability
`, {
    uri: '/docs/validation.itm',
  });

  const diagnostics = validateItmDocument(document);

  assert.equal(
    diagnostics.some((diagnostic) => diagnostic.code === 'itm.validation.provider-unavailable'),
    true,
  );
});

test('validateItmDocument executes built-in package rules when the required capability is active', () => {
  const document = parseDocument(`&cap Capability
%package validation_profile
{
  activation:
    - validation_profile.rules
}
%require itm.validation
%rule require_name
{
  select: "*"
  pipeline:
    - requireAttribute: name
  severity: error
  message: "Every matching item must expose a name attribute."
}
%using validation_profile.rules
`, {
    uri: '/docs/validation-active.itm',
  });

  const diagnostics = validateItmDocument(document);

  assert.equal(
    diagnostics.some((diagnostic) => diagnostic.code === 'itm.validation.rule-failed'),
    true,
  );
});

test('validateItmDocument does not activate built-in package rules from provider-name capability requirements', () => {
  const document = parseDocument(`&cap Capability
%package validation_profile
{
  activation:
    - validation_profile.rules
}
%require requireAttribute
%rule require_name
{
  select: "*"
  pipeline:
    - requireAttribute: name
  severity: error
  message: "Every matching item must expose a name attribute."
}
%using validation_profile.rules
`, {
    uri: '/docs/validation-provider-alias.itm',
  });

  const diagnostics = validateItmDocument(document);

  assert.equal(
    diagnostics.some((diagnostic) => diagnostic.code === 'itm.validation.provider-unavailable'),
    true,
  );
  assert.equal(
    diagnostics.some((diagnostic) => diagnostic.code === 'itm.validation.rule-failed'),
    false,
  );
});

test('createItmResolverDiagnostic exposes stable mismatch categories for downstream resolvers', () => {
  const versionMismatch = createItmResolverDiagnostic(
    'versionMismatch',
    'The requested provider version does not satisfy the active requirement.',
    {
      requirementRef: 'archimate.exchange',
    },
  );
  const capabilityMismatch = createItmResolverDiagnostic(
    'capabilityMismatch',
    'The active provider does not expose the required capability set.',
    {
      requirementRef: 'bpmn.xml',
    },
  );

  assert.equal(versionMismatch.code, itmResolverDiagnosticCodes.versionMismatch);
  assert.equal(capabilityMismatch.code, itmResolverDiagnosticCodes.capabilityMismatch);
  assert.equal(versionMismatch.requirementRef, 'archimate.exchange');
  assert.equal(capabilityMismatch.requirementRef, 'bpmn.xml');
});

test('vendored ArchiMate and BPMN profile fixtures remain loadable through the public package APIs', async () => {
  const archimateProfile = readFileSync(resolve(examplesDirectory, 'archimate/archimate-basic-profile.itm'), 'utf8');
  const bpmnProfile = readFileSync(resolve(examplesDirectory, 'BPMN/bpmn20-basic-profile.itm'), 'utf8');

  const [archimate, bpmn] = await Promise.all([
    loadItmDocument(archimateProfile, {
      uri: '/profiles/archimate-basic-profile.itm',
      includeStdProfiles: false,
    }),
    loadItmDocument(bpmnProfile, {
      uri: '/profiles/bpmn20-basic-profile.itm',
      includeStdProfiles: false,
    }),
  ]);

  assert.equal((archimate.document.packages?.length ?? 0) > 0, true);
  assert.equal((archimate.document.viewpoints?.length ?? 0) > 0, true);
  assert.equal((archimate.document.styles?.length ?? 0) > 0, true);
  assert.equal((bpmn.document.packages?.length ?? 0) > 0, true);
  assert.equal((bpmn.document.relationshipTypes?.length ?? 0) > 0, true);
  assert.equal((bpmn.document.viewpoints?.length ?? 0) > 0, true);
});
