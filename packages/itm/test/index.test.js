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
  parseDocumentResult,
  projectItmDocument,
  resolveItmVisualTarget,
  renderItmPublicationHtml,
  serializeDocument,
  validateItmDocument,
} from '../src/index.js';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const examplesDirectory = resolve(testDirectory, '../src/examples');
const docsExamplesDirectory = resolve(testDirectory, '..', '..', '..', 'docs', 'examples', 'itm', 'test-profiles');
const docsEaDirectory = resolve(testDirectory, '..', '..', '..', 'docs', 'examples', 'ea');

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

test('loadItmDocument resolves bare sibling include filenames through the workspace include provider', async () => {
  const workspace = {
    getEntryByPath(path) {
      if (path === '/docs/bpmn-process-diagram-lite-profile.itm') {
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

  const loaded = await loadItmDocument(`%include bpmn-process-diagram-lite-profile.itm
&root Root capability`, {
    uri: '/docs/training-by-design.itm',
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
  assert.equal(targets.some((target) =>
    target.kind === 'raw-model'
    && target.id === 'raw-model/network'
    && target.projection === 'graph'
    && target.preferredSurfaceId === '@textforge/renderer-sigma/runtime'), true);
  assert.equal(targets.some((target) => target.kind === 'raw-model' && target.projection === 'mindmap'), true);
});

test('ITM graph projection surface defers large profile rendering behind an explicit guard', () => {
  const graphSurface = contributions.surfaces.find((surface) => surface.id === '@textforge/itm/graph');
  const largeSource = [
    '%metadata { title: "Large graph" }',
    ...Array.from({ length: 1100 }, (_, index) => `&node_${index} [Capability] Node ${index}`),
  ].join('\n');
  const opened = graphSurface.open({
    sourceText: largeSource,
    resource: {
      resourceId: 'large-itm',
      kind: 'resource',
      representation: 'text',
      path: '/docs/large.itm',
      languageId: 'itm',
      mimeType: 'text/x-itm',
    },
  });

  assert.match(opened.surface.model.html, /data-itm-large-profile="true"/);
  assert.match(opened.surface.model.html, /Continue rendering/);
  assert.doesNotMatch(opened.surface.model.html, /Resolving graph target/);
});

test('resolveItmVisualTarget derives Visual ITM with renderer precedence, provenance, and itm-pub parity', async () => {
  const loaded = await loadItmDocument(readFileSync(resolve(docsExamplesDirectory, 'itm-surface-smoke.itm'), 'utf8'), {
    uri: '/docs/examples/itm/test-profiles/itm-surface-smoke.itm',
  });

  const resolvedView = resolveItmVisualTarget(loaded, {
    view: 'capability_surface',
    title: 'Capability surface',
  });
  const resolvedRawNetwork = resolveItmVisualTarget(loaded, {
    target: {
      kind: 'raw-model',
      id: 'raw-model/network',
    },
  });
  const resolvedRawMindmap = resolveItmVisualTarget(loaded, {
    target: {
      kind: 'raw-model',
      id: 'raw-model/mindmap',
    },
  });

  assert.equal(resolvedView.target.rendererValue, 'graph.viewer');
  assert.equal(resolvedView.target.preferredSurfaceId, '@textforge/renderer-cytoscape/runtime');
  assert.equal(resolvedView.visualDocument.origin.derivedTarget?.kind, 'view');
  assert.equal(resolvedView.visualDocument.nodes.some((node) => (node.provenance?.length ?? 0) >= 2), true);
  assert.equal(resolvedView.visualDiagnostics.length, 0);
  assert.equal(renderItmPublicationHtml(loaded.effectiveResolvedDocument, { view: 'capability_surface', projection: 'graph' }).includes('data-itm-projection="graph"'), true);
  assert.equal(resolvedRawNetwork.target.rendererValue, 'sigma');
  assert.equal(resolvedRawNetwork.target.preferredSurfaceId, '@textforge/renderer-sigma/runtime');
  assert.equal(resolvedRawMindmap.target.rendererSource, 'local');
  assert.equal(resolvedRawMindmap.target.preferredSurfaceId, '@textforge/renderer-jsmind/runtime');
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

test('resolveItmVisualTarget routes sigma render declarations to the Sigma runtime surface', async () => {
  const loaded = await loadItmDocument(`%viewpoint dense_graph
{
  pipeline:
    - select: "[Capability]"
    - render: sigma
}
%view dense_surface
{
  viewpoint: dense_graph
}
&roadmap [Capability] Capability roadmap
&delivery [Capability] Delivery
roadmap => delivery
`, {
    uri: '/docs/sigma.itm',
  });

  const resolved = resolveItmVisualTarget(loaded, {
    view: 'dense_surface',
  });

  assert.equal(resolved.target.rendererValue, 'sigma');
  assert.equal(resolved.target.preferredSurfaceId, '@textforge/renderer-sigma/runtime');
});

test('resolveItmVisualTarget routes BPMN viewer render declarations to the BPMN surface', async () => {
  const loaded = await loadItmDocument(`%viewpoint bpmn_focus
{
  pipeline:
    - select: "[bpmn::Task]"
    - render: bpmn.viewer
}
%view bpmn_surface
{
  viewpoint: bpmn_focus
}
&task [bpmn::Task] Review requirement
{
  id: "Task_1"
}
`, {
    uri: '/docs/bpmn.itm',
  });

  const resolved = resolveItmVisualTarget(loaded, {
    view: 'bpmn_surface',
  });

  assert.equal(resolved.target.rendererValue, 'bpmn.viewer');
  assert.equal(resolved.target.preferredSurfaceId, '@textforge/bpmn/viewer');
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

test('WP-ITM-03 parses comments and trivia without creating model entities', () => {
  const document = parseDocument(`// root-level model note

&order Order
  // comment attached to the next sibling
  &receive Receive order

// trailing note
`, {
    uri: '/docs/examples/itm/wp-itm-03-comments.itm',
  });

  assert.deepEqual(
    document.entities.map((entity) => entity.label),
    ['Order', 'Receive order'],
  );
  assert.deepEqual(
    (document.comments ?? []).map((comment) => comment.text),
    [
      'root-level model note',
      'comment attached to the next sibling',
      'trailing note',
    ],
  );
  assert.equal((document.trivia ?? []).some((entry) => entry.kind === 'blank-line'), true);
  assert.equal((document.comments ?? []).every((comment) => comment.source?.file === '/docs/examples/itm/wp-itm-03-comments.itm'), true);
});

test('WP-ITM-03 applies scoped context inference from canonical %context defaults', async () => {
  const loaded = await loadItmDocument(`%namespace bpmn https://www.omg.org/spec/BPMN/20100524/MODEL
%entitytype bpmn::FlowNode
{
  abstract: true
}
%entitytype bpmn::Process
{
  extends:
    - bpmn::FlowNode
}
%entitytype bpmn::Task
{
  extends: bpmn::FlowNode
}
%entitytype bpmn::Gateway
{
  extends:
    - bpmn::FlowNode
}
%relationshiptype bpmn::sequenceFlow
{
  sourceTypes:
    - bpmn::FlowNode
  targetTypes:
    - bpmn::FlowNode
}
%context process_flow
{
  defaults:
    rootType: bpmn::Process
    childType: bpmn::Task
    relationshipType: bpmn::sequenceFlow

  infer:
    nodes:
      - id: gateway_by_question
        when:
          untyped: true
          parentType: bpmn::Process
          labelMatches: "\\\\?$"
        type: bpmn::Gateway
}

%begin process_flow
&order_process Order process
  &receive Receive order @validate
  &validate Validate order?
%end process_flow

&orphan Untyped after scope
`, {
    uri: '/docs/examples/itm/wp-itm-03-context-scope.itm',
    includeStdProfiles: false,
  });

  const orderProcess = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'order_process');
  const receive = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'receive');
  const validate = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'validate');
  const orphan = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'orphan');
  const sequenceFlow = loaded.effectiveResolvedDocument.relationships.find((relationship) => relationship.sourceId === receive?.uid && relationship.targetId === validate?.uid);

  assert.deepEqual(
    loaded.document.contexts?.map((context) => ({
      name: context.name,
      defaults: context.defaults,
      nodeRules: context.infer?.nodes?.map((rule) => rule.id),
    })),
    [{
      name: 'process_flow',
      defaults: {
        rootType: 'bpmn::Process',
        childType: 'bpmn::Task',
        relationshipType: 'bpmn::sequenceFlow',
      },
      nodeRules: ['gateway_by_question'],
    }],
  );
  assert.equal(loaded.document.scopedActivations?.[0]?.name, 'process_flow');
  assert.equal(loaded.document.scopedActivations?.[0]?.endName, 'process_flow');
  assert.equal(typeof loaded.document.scopedActivations?.[0]?.endSource?.startLine, 'number');
  assert.equal(orderProcess?.typeRef, 'bpmn::Process');
  assert.equal(receive?.typeRef, 'bpmn::Task');
  assert.equal(validate?.typeRef, 'bpmn::Gateway');
  assert.equal(sequenceFlow?.typeRef, 'bpmn::sequenceFlow');
  assert.equal(validate?.attributes?.values?.typeProvenance?.rule, 'gateway_by_question');
  assert.equal(orphan?.typeRef, undefined);
  assert.equal(loaded.diagnostics.some((diagnostic) => diagnostic.severity === 'error'), false);
});

test('WP-ITM-03 package contexts activate explicitly and do not leak across includes', async () => {
  const workspace = {
    getEntryByPath(path) {
      if (path === '/profiles/bpmn-package.itm') {
        return {
          kind: 'resource',
          representation: 'text',
          path,
          text: `%package bpmn_context_profile
{
  defaultContext: package_process
  activation:
    - bpmn_context_profile.contexts
}
%namespace bpmn https://www.omg.org/spec/BPMN/20100524/MODEL
%entitytype bpmn::Process
%entitytype bpmn::Task
{
  extends: bpmn::Process
}
%relationshiptype bpmn::sequenceFlow
{
  sourceTypes:
    - bpmn::Process
  targetTypes:
    - bpmn::Process
}
%context package_process
{
  defaults:
    rootType: bpmn::Process
    childType: bpmn::Task
    relationshipType: bpmn::sequenceFlow
}
%begin bpmn_context_profile
&included_process Included process
  &included_task Included task
%end bpmn_context_profile`,
        };
      }
      return undefined;
    },
  };

  const loaded = await loadItmDocument(`%include ../profiles/bpmn-package.itm
&before_using Before using
%using bpmn_context_profile.contexts
%begin package_process
&local_process Local process
  &local_task Local task
%end package_process
&after_scope After explicit scope
`, {
    uri: '/docs/root.itm',
    includeProviders: [createWorkspaceItmIncludeProvider(workspace)],
    includeStdProfiles: false,
  });

  const beforeUsing = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'before_using');
  const includedProcess = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'included_process');
  const includedTask = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'included_task');
  const localProcess = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'local_process');
  const localTask = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'local_task');
  const afterScope = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'after_scope');

  assert.equal(beforeUsing?.typeRef, undefined);
  assert.equal(includedProcess?.typeRef, 'bpmn::Process');
  assert.equal(includedTask?.typeRef, 'bpmn::Task');
  assert.equal(localProcess?.typeRef, 'bpmn::Process');
  assert.equal(localTask?.typeRef, 'bpmn::Task');
  assert.equal(afterScope?.typeRef, undefined);
  assert.equal(
    loaded.capabilityContext.activePackageScopes.get('package:bpmn_context_profile')?.has('contexts'),
    true,
  );
  assert.equal(loaded.diagnostics.some((diagnostic) => diagnostic.code === 'itm.context.leaked-from-include'), false);
});

test('ADR-0007 resolves context inheritance, ordered inference, and polymorphic constraints', async () => {
  const loaded = await loadItmDocument(`%namespace bpmn https://www.omg.org/spec/BPMN/20100524/MODEL
%entitytype bpmn::FlowNode
{
  abstract: true
}
%entitytype bpmn::Process
{
  extends:
    - bpmn::FlowNode
}
%entitytype bpmn::Task
{
  extends: bpmn::FlowNode
}
%entitytype bpmn::StartEvent
{
  extends:
    - bpmn::FlowNode
}
%entitytype bpmn::Gateway
{
  extends:
    - bpmn::FlowNode
}
%relationshiptype bpmn::sequenceFlow
{
  sourceTypes:
    - bpmn::FlowNode
  targetTypes:
    - bpmn::FlowNode
}
%context bpmn_base
{
  defaults:
    relationshipType: bpmn::sequenceFlow

  infer:
    nodes:
      - id: default_start
        when:
          untyped: true
          parentType: bpmn::Process
          labelMatches: "^Begin"
        type: bpmn::StartEvent
}
%context bpmn_process
{
  extends:
    - bpmn_base

  defaults:
    rootType: bpmn::Process
    childType: bpmn::Task

  infer:
    nodes:
      - id: gateway_by_question
        when:
          untyped: true
          parentType: bpmn::Process
          labelMatches: "\\\\?$"
        type: bpmn::Gateway
}

%begin bpmn_process
&order Order process
  &start Begin order @task
  &task Validate order?
  &manual [bpmn::Task] Manual question?
%end bpmn_process
`, {
    uri: '/docs/examples/itm/adr-0007-context-inference.itm',
    includeStdProfiles: false,
  });

  const start = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'start');
  const task = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'task');
  const manual = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'manual');
  const sequenceFlow = loaded.effectiveResolvedDocument.relationships.find((relationship) => relationship.sourceId === start?.uid && relationship.targetId === task?.uid);

  assert.equal(start?.typeRef, 'bpmn::StartEvent');
  assert.equal(start?.attributes?.values?.typeProvenance?.rule, 'default_start');
  assert.equal(task?.typeRef, 'bpmn::Gateway');
  assert.equal(task?.attributes?.values?.typeProvenance?.rule, 'gateway_by_question');
  assert.equal(manual?.typeRef, 'bpmn::Task');
  assert.equal(manual?.attributes?.values?.typeProvenance?.source, 'authored');
  assert.equal(sequenceFlow?.typeRef, 'bpmn::sequenceFlow');
  assert.equal(loaded.diagnostics.some((diagnostic) => diagnostic.code === 'itm.relationship.constraint-violation'), false);
});

test('ADR-0007 activates package default contexts with %using package', async () => {
  const workspace = {
    getEntryByPath(path) {
      if (path === '/profiles/default-context.itm') {
        return {
          kind: 'resource',
          representation: 'text',
          path,
          text: `%package bpmn_profile
{
  defaultContext: process
}
%entitytype bpmn::Process
%entitytype bpmn::Task
%relationshiptype bpmn::sequenceFlow
%context process
{
  defaults:
    rootType: bpmn::Process
    childType: bpmn::Task
    relationshipType: bpmn::sequenceFlow
}`,
        };
      }
      return undefined;
    },
  };

  const loaded = await loadItmDocument(`%include ../profiles/default-context.itm
&before Before profile
%using bpmn_profile
&order Order process
  &receive Receive order @validate
  &validate Validate order
`, {
    uri: '/docs/default-context-root.itm',
    includeProviders: [createWorkspaceItmIncludeProvider(workspace)],
    includeStdProfiles: false,
  });

  const before = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'before');
  const order = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'order');
  const receive = loaded.effectiveResolvedDocument.entities.find((entity) => entity.id === 'receive');
  const flow = loaded.effectiveResolvedDocument.relationships.find((relationship) => relationship.sourceId === receive?.uid);

  assert.equal(before?.typeRef, undefined);
  assert.equal(order?.typeRef, 'bpmn::Process');
  assert.equal(receive?.typeRef, 'bpmn::Task');
  assert.equal(flow?.typeRef, 'bpmn::sequenceFlow');
});

test('ADR-0007 reports abstract type and polymorphic relationship diagnostics', async () => {
  const loaded = await loadItmDocument(`%entitytype model::FlowNode
{
  abstract: true
}
%entitytype model::Task
{
  extends:
    - model::FlowNode
}
%entitytype model::Document
%relationshiptype model::flow
{
  sourceTypes:
    - model::FlowNode
  targetTypes:
    - model::FlowNode
}
%context invalid_process
{
  defaults:
    rootType: model::FlowNode
    childType: model::Task
    relationshipType: model::flow
}

%begin invalid_process
&root Root
  &doc [model::Document] Document
  &task Task @doc
%end invalid_process
`, {
    uri: '/docs/examples/itm/adr-0007-invalid.itm',
    includeStdProfiles: false,
  });

  const codes = new Set(loaded.diagnostics.map((diagnostic) => diagnostic.code));

  assert.equal(codes.has('itm.type.abstract-inferred'), true);
  assert.equal(codes.has('itm.relationship.constraint-violation'), true);
});

test('WP-ITM-03 reports stable diagnostics for invalid identity maps and scoped contexts', () => {
  const parsed = parseDocumentResult(`%idmap duplicate_alias
{
  task: bpmn::Task
  task: archimate::BusinessProcess
}
%idmap alias_table
{
  root: bpmn::Process
}
%context broken_context
{
  defaults:
    rootType: missing::Root
  infer:
    nodes:
      - id: bad_rule
        when:
          targetType: bpmn::Task
          labelMatches: "["
        type: missing::Task
}
%begin missing_context
&task Task
%end missing_context
%end stray_context
`, {
    uri: '/docs/examples/itm/wp-itm-03-invalid.itm',
  });

  const diagnostics = [
    ...parsed.diagnostics,
    ...validateItmDocument(parsed.value),
  ];
  const codes = new Set(diagnostics.map((diagnostic) => diagnostic.code));

  assert.equal(codes.has('itm.idmap.duplicate-entry'), true);
  assert.equal(codes.has('itm.idmap.type-alias'), true);
  assert.equal(codes.has('itm.context.rule-invalid-when'), true);
  assert.equal(codes.has('itm.context.rule-invalid-regex'), true);
  assert.equal(codes.has('itm.context.type-unknown'), true);
  assert.equal(codes.has('itm.context.unresolved'), true);
  assert.equal(codes.has('itm.context.unmatched-end'), true);
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

test('bundled EA Dashboard profile fixture remains loadable through the public package APIs', async () => {
  const eaProfile = readFileSync(resolve(docsEaDirectory, 'ea-dashboard-profile.itm'), 'utf8');

  const loaded = await loadItmDocument(eaProfile, {
    uri: '/docs/examples/ea/ea-dashboard-profile.itm',
    includeStdProfiles: false,
  });

  assert.equal((loaded.document.packages?.length ?? 0) > 0, true);
  assert.equal(loaded.document.entityTypes.some((entityType) => entityType.name === 'ead::System'), true);
  assert.equal(loaded.document.entityTypes.some((entityType) => entityType.name === 'ead::BusinessProcess'), true);
  assert.equal(loaded.document.relationshipTypes.some((relationshipType) => relationshipType.name === 'ead::systems'), true);
  assert.equal(loaded.document.relationshipTypes.some((relationshipType) => relationshipType.name === 'ead::security_domain'), true);
  assert.equal(loaded.document.viewpoints.some((viewpoint) => viewpoint.name === 'ead_global_dashboard'), true);
  assert.equal(loaded.document.views.some((view) => view.name === 'ea_dashboard_global'), true);
});

test('bundled retail EA ITM example loads with the shared profile and exposes retail viewpoints and views', async () => {
  const eaProfile = readFileSync(resolve(docsEaDirectory, 'ea-dashboard-profile.itm'), 'utf8');
  const retailItm = readFileSync(resolve(docsEaDirectory, 'ea-dashboard-retail-architecture.itm'), 'utf8');
  const workspace = {
    getEntryByPath(path) {
      if (path === '/docs/examples/ea/ea-dashboard-profile.itm') {
        return {
          kind: 'resource',
          representation: 'text',
          path,
          text: eaProfile,
        };
      }
      return undefined;
    },
  };

  const loaded = await loadItmDocument(retailItm, {
    uri: '/docs/examples/ea/ea-dashboard-retail-architecture.itm',
    includeProviders: [createWorkspaceItmIncludeProvider(workspace)],
    includeStdProfiles: false,
  });

  assert.equal(loaded.diagnostics.some((diagnostic) => diagnostic.code === itmResolverDiagnosticCodes.unresolved), false);
  assert.equal(loaded.effectiveDocument.entities.length, 2815);
  assert.equal(loaded.document.viewpoints.some((viewpoint) => viewpoint.name === 'retail_portfolio_delivery'), true);
  assert.equal(loaded.document.viewpoints.some((viewpoint) => viewpoint.name === 'retail_data_trust_landscape'), true);
  assert.equal(loaded.document.viewpoints.some((viewpoint) => viewpoint.name === 'retail_execution_dashboard'), true);
  assert.equal(loaded.document.views.some((view) => view.name === 'retail_global_network_2026'), true);
  assert.equal(loaded.document.views.some((view) => view.name === 'retail_portfolio_delivery_map'), true);
  assert.equal(loaded.document.views.some((view) => view.name === 'retail_execution_map'), true);
});
