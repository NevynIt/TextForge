import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCanonicalContributionId,
  createCommand,
  createCommandDispatcher,
  createCommandRegistry,
  createContributionRegistry,
  createContributionManifest,
  deriveContributionLocalName,
  deriveCapabilityLocalName,
  createDiagnostic,
  createMarkdownFenceHandlerContribution,
  createCapability,
  createContributionInspectorModel,
  createResourceFacts,
  createResourcePredicate,
  createResourceRef,
  hasResourceCapability,
  createSurfaceContribution,
  createSourcePosition,
  createSourceRange,
  inferLanguageId,
  matchesResourcePredicate,
  resolveDocumentContributionContext,
} from '../src/index.js';

test('core constructors build stable value objects', () => {
  const ref = createResourceRef('resource-1', {
    path: '/docs/note.md',
    providerId: 'workspace-local',
    capabilityIds: ['resource.read', 'resource.write', 'resource.read'],
  });
  const range = createSourceRange(createSourcePosition(1, 1), createSourcePosition(1, 4, 3));
  const diagnostic = createDiagnostic('Missing heading', 'info', { resource: ref, source: range });
  const manifest = createContributionManifest('@textforge/core');

  assert.equal(ref.resourceId, 'resource-1');
  assert.equal(ref.providerId, 'workspace-local');
  assert.deepEqual(ref.capabilityIds, ['resource.read', 'resource.write']);
  assert.equal(diagnostic.severity, 'information');
  assert.equal(diagnostic.source?.end.offset, 3);
  assert.equal(inferLanguageId({ path: '/docs/notes.md' }), 'markdown');
  assert.equal(manifest.packageId, '@textforge/core');
  assert.equal(createCanonicalContributionId('@textforge/example', 'preview'), '@textforge/example/preview');
  assert.equal(deriveContributionLocalName('@textforge/example', '@textforge/example/preview'), 'preview');
  assert.equal(deriveCapabilityLocalName('@textforge/example/capability/preview'), 'preview');
  assert.equal(hasResourceCapability(ref, 'resource.write'), true);
});

test('command registry filters context-sensitive commands and dispatches local handlers', async () => {
  const registry = createCommandRegistry([
    createContributionManifest('@textforge/workspace', {
      commands: [
        createCommand('workspace.export', 'Export workspace ZIP', {
          menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 10 },
          toolbar: { order: 20, kind: 'primary' },
          when: { workspaceReady: true },
        }),
        createCommand('workspace.export-folder', 'Export selected folder ZIP', {
          menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 20 },
          when: {
            workspaceReady: true,
            selectionRequired: true,
            selectionKinds: ['folder'],
            selectionCapabilityIds: ['resource.export'],
          },
        }),
        createCommand('lua.run-selected-resource', 'Run selected Lua file', {
          menu: { id: 'lua', label: 'Lua', groupOrder: 30, order: 10 },
          when: {
            workspaceReady: true,
            selectionRequired: true,
            selectionKinds: ['resource'],
            selectionLanguageIds: ['lua'],
          },
        }),
      ],
    }),
    createContributionManifest('@textforge/surfaces', {
      commands: [
        createCommand('surface.close', 'Close active surface', {
          menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 10 },
          when: { workspaceReady: true, activeSurfaceRequired: true },
        }),
      ],
    }),
  ]);

  const folderContext = {
    runtimeStatus: 'ready',
    workspaceReady: true,
    selection: {
      resourceId: 'folder-1',
      kind: 'folder',
      providerId: 'workspace-local',
      capabilityIds: ['resource.export', 'resource.create-child'],
    },
    activeSurface: {
      sessionId: 'surface-1',
      contributionId: '@textforge/editors/code-mirror-text',
      placement: 'main',
      resourceKind: 'resource',
      resourceRepresentation: 'text',
    },
  };
  const textContext = {
    runtimeStatus: 'ready',
    workspaceReady: true,
    selection: {
      resourceId: 'resource-1',
      kind: 'resource',
      representation: 'text',
      providerId: 'bundled-docs',
      capabilityIds: ['resource.read', 'resource.copy'],
    },
    activeSurface: {
      sessionId: 'surface-1',
      contributionId: '@textforge/editors/code-mirror-text',
      placement: 'main',
      resourceKind: 'resource',
      resourceRepresentation: 'text',
    },
  };

  assert.deepEqual(
    registry.listToolbar(folderContext).map((command) => command.id),
    ['workspace.export'],
  );
  assert.deepEqual(
    registry.listMenus(folderContext).map((group) => group.id),
    ['workspace', 'surface'],
  );
  assert.deepEqual(
    registry.resolve(textContext).filter((command) => command.visible).map((command) => command.id),
    ['workspace.export', 'surface.close'],
  );
  assert.equal(
    registry.resolve({
      ...textContext,
      selection: { ...textContext.selection, languageId: 'lua' },
    }).some((command) => command.id === 'lua.run-selected-resource' && command.visible),
    true,
  );
  assert.equal(
    registry.resolve(textContext).some((command) => command.id === 'workspace.export-folder' && command.visible),
    false,
  );

  const calls = [];
  const dispatcher = createCommandDispatcher({
    registry,
    getContext: () => folderContext,
    handlers: {
      'workspace.export': ({ command, context }) => {
        calls.push({ id: command.id, kind: context.selection?.kind });
        return 'ok';
      },
    },
  });

  const result = await dispatcher.execute('workspace.export');
  assert.equal(result.handled, true);
  assert.deepEqual(calls, [{ id: 'workspace.export', kind: 'folder' }]);
  assert.equal((await dispatcher.execute('surface.close')).handled, false);
});

test('contribution registry resolves active fence handlers and emits active conflict diagnostics', () => {
  const registry = createContributionRegistry([
    createContributionManifest('@textforge/markdown', {
      capabilities: [
        { id: '@textforge/markdown/capability/json', defaultActive: true },
      ],
      markdownFenceHandlers: [
        createMarkdownFenceHandlerContribution('@textforge/markdown/json', {
          fenceNames: ['json'],
          capabilities: ['@textforge/markdown/capability/json'],
          defaultActive: true,
          render() {
            return { html: '<pre>{}</pre>' };
          },
        }),
      ],
    }),
    createContributionManifest('@textforge/custom', {
      capabilities: [
        { id: '@textforge/custom/capability/json', defaultActive: true },
      ],
      markdownFenceHandlers: [
        createMarkdownFenceHandlerContribution('@textforge/custom/json', {
          fenceNames: ['json'],
          capabilities: ['@textforge/custom/capability/json'],
          defaultActive: true,
          render() {
            return { html: '<pre>[]</pre>' };
          },
        }),
      ],
    }),
  ]);

  const resolved = registry.resolve();
  assert.equal(resolved.markdownFenceHandlers.length, 0);
  assert.equal(resolved.diagnostics[0]?.code, 'registry.active-conflict');

  const predicate = createResourcePredicate({
    representations: ['text'],
    mimeTypes: ['image/svg+xml'],
    fileExtensions: ['svg'],
  });
  const resourceFacts = createResourceFacts({
    resourceId: 'resource-2',
    path: '/docs/diagram.svg',
    kind: 'resource',
    representation: 'text',
    mimeType: 'image/svg+xml',
    languageId: 'svg',
    providerId: 'generated-artifact',
    capabilityIds: ['resource.read', 'resource.view', 'resource.export'],
  });

  assert.equal(matchesResourcePredicate(predicate, resourceFacts), true);
  assert.equal(resourceFacts.providerId, 'generated-artifact');
  assert.deepEqual(resourceFacts.capabilityIds, ['resource.export', 'resource.read', 'resource.view']);
});

test('contribution registry derives canonical local IDs and exposes deterministic package read models', () => {
  const registry = createContributionRegistry([
    createContributionManifest('@textforge/zeta', {
      dependencies: [{ packageId: '@textforge/missing', versionRange: '^1.0.0' }],
      capabilities: [{ id: '@textforge/zeta/capability/preview' }],
      surfaces: [{
        localName: 'preview',
        label: 'Preview',
        capabilities: ['@textforge/zeta/capability/preview'],
      }],
    }),
    createContributionManifest('@textforge/alpha', {
      version: '1.2.0',
      capabilities: [{ id: '@textforge/alpha/capability/source', defaultActive: true }],
      markdownFenceHandlers: [
        createMarkdownFenceHandlerContribution('@textforge/alpha/fence-handler/json', {
          fenceNames: ['json'],
          capabilities: ['@textforge/alpha/capability/source'],
        }),
      ],
    }),
  ]);

  const manifests = registry.listManifests();
  assert.deepEqual(manifests.map((manifest) => manifest.packageId), ['@textforge/alpha', '@textforge/zeta']);
  assert.equal(manifests[1].surfaces[0]?.id, '@textforge/zeta/preview');
  assert.equal(manifests[1].surfaces[0]?.localName, 'preview');

  const resolved = registry.resolve();
  assert.deepEqual(resolved.packages.map((entry) => entry.packageId), ['@textforge/alpha', '@textforge/zeta']);
  assert.equal(resolved.packages[0]?.status, 'available');
  assert.equal(resolved.packages[1]?.status, 'missingDependency');
  assert.equal(resolved.packages[1]?.dependencies[0]?.packageId, '@textforge/missing');
  assert.equal(resolved.packages[1]?.dependencies[0]?.status, 'missingDependency');
  assert.equal(resolved.surfaces[0]?.status, 'failed');
  assert.equal(resolved.diagnostics.some((diagnostic) => diagnostic.code === 'registry.package.missing-dependency'), true);
});

test('document contribution context resolves explicit requirements and document defaults deterministically', () => {
  const registry = createContributionRegistry([
    createContributionManifest('@textforge/editors', {
      capabilities: [
        createCapability('@textforge/editors/capability/source', {
          localName: 'source',
          defaultActive: true,
          documentPredicate: createResourcePredicate({ representations: ['text'] }),
        }),
      ],
      surfaces: [
        createSurfaceContribution('@textforge/editors/source', {
          localName: 'source',
          capabilities: ['@textforge/editors/capability/source'],
          resourcePredicate: createResourcePredicate({ representations: ['text'] }),
        }),
      ],
    }),
    createContributionManifest('@textforge/diagrams', {
      capabilities: [
        createCapability('@textforge/diagrams/capability/mermaid', {
          aliases: ['mermaid'],
          defaultActive: true,
          documentPredicate: createResourcePredicate({ languageIds: ['markdown'] }),
        }),
        createCapability('@textforge/diagrams/capability/json', {
          aliases: ['json'],
          defaultActive: false,
          documentPredicate: createResourcePredicate({ languageIds: ['markdown'] }),
        }),
      ],
      markdownFenceHandlers: [
        createMarkdownFenceHandlerContribution('@textforge/diagrams/mermaid', {
          localName: 'mermaid',
          capabilities: ['@textforge/diagrams/capability/mermaid'],
          fenceNames: ['mermaid'],
        }),
        createMarkdownFenceHandlerContribution('@textforge/diagrams/json', {
          localName: 'json',
          capabilities: ['@textforge/diagrams/capability/json'],
          fenceNames: ['json'],
        }),
      ],
    }),
  ]);

  const resolved = resolveDocumentContributionContext({
    registry,
    document: createResourceRef('resource-markdown', {
      path: '/docs/example.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    }),
    explicitRequirements: ['json', 'missing-capability'],
  });

  assert.deepEqual(
    resolved.activationOrder.map((entry) => `${entry.source}:${entry.capabilityId}`),
    [
      'explicit:@textforge/diagrams/capability/json',
      'document:@textforge/diagrams/capability/mermaid',
      'document:@textforge/editors/capability/source',
    ],
  );
  assert.equal(resolved.requirements[0]?.matchedCapabilityId, '@textforge/diagrams/capability/json');
  assert.equal(resolved.requirements[1]?.status, 'missing');
  assert.equal(resolved.activeMarkdownFenceHandlers.some((handler) => handler.id === '@textforge/diagrams/json'), true);
  assert.equal(resolved.diagnostics.some((diagnostic) => diagnostic.code === 'resolver.requirement.missing'), true);
});

test('contribution inspector model stays deterministic across package and document state', () => {
  const registry = createContributionRegistry([
    createContributionManifest('@textforge/beta', {
      capabilities: [
        createCapability('@textforge/beta/capability/source', {
          localName: 'source',
          aliases: ['text-source'],
          defaultActive: true,
          documentPredicate: createResourcePredicate({ representations: ['text'] }),
        }),
        createCapability('@textforge/beta/capability/json', {
          localName: 'json',
          aliases: ['json'],
          defaultActive: false,
          documentPredicate: createResourcePredicate({ languageIds: ['markdown'] }),
        }),
      ],
      surfaces: [
        createSurfaceContribution('@textforge/beta/source', {
          localName: 'source',
          capabilities: ['@textforge/beta/capability/source'],
          resourcePredicate: createResourcePredicate({ representations: ['text'] }),
        }),
      ],
      markdownFenceHandlers: [
        createMarkdownFenceHandlerContribution('@textforge/beta/json', {
          localName: 'json',
          capabilities: ['@textforge/beta/capability/json'],
          fenceNames: ['json'],
        }),
      ],
    }),
    createContributionManifest('@textforge/alpha', {
      dependencies: [{ packageId: '@textforge/missing', versionRange: '^1.0.0' }],
      capabilities: [
        createCapability('@textforge/alpha/capability/source', {
          localName: 'source',
          defaultActive: false,
          documentPredicate: createResourcePredicate({ representations: ['text'] }),
        }),
      ],
      surfaces: [
        createSurfaceContribution('@textforge/alpha/source', {
          localName: 'source',
          capabilities: ['@textforge/alpha/capability/source'],
          resourcePredicate: createResourcePredicate({ representations: ['text'] }),
        }),
      ],
    }),
  ]);

  const resolution = registry.resolve();
  const documentContext = registry.resolveDocumentContext({
    document: createResourceRef('resource-markdown', {
      path: '/docs/example.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    }),
    explicitRequirements: ['json', 'missing-capability'],
  });
  const inspector = createContributionInspectorModel({
    resolution,
    documentContext,
  });

  assert.deepEqual(inspector.summary, {
    packageCount: 2,
    availablePackageCount: 1,
    blockedPackageCount: 1,
    capabilityCount: 3,
    activeCapabilityCount: 2,
    activeSurfaceCount: 1,
    activePipelineCount: 0,
    activeMarkdownFenceHandlerCount: 1,
    diagnosticCount: documentContext.diagnostics.length,
  });
  assert.equal(inspector.document?.requirements[0]?.matchedCapabilityId, '@textforge/beta/capability/json');
  assert.equal(inspector.document?.requirements[1]?.status, 'missing');
  assert.deepEqual(inspector.packages.map((entry) => entry.packageId), ['@textforge/alpha', '@textforge/beta']);
  assert.equal(inspector.packages[0]?.status, 'missingDependency');
  assert.equal(inspector.packages[0]?.diagnostics[0]?.code, 'registry.package.missing-dependency');
  assert.equal(inspector.packages[1]?.activeCapabilityCount, 2);
  assert.deepEqual(
    inspector.packages[1]?.capabilities.map((capability) => ({
      id: capability.id,
      status: capability.status,
      activationSources: capability.activationSources,
      matchedRequirementNames: capability.matchedRequirementNames,
    })),
    [
      {
        id: '@textforge/beta/capability/json',
        status: 'active',
        activationSources: ['explicit'],
        matchedRequirementNames: ['json'],
      },
      {
        id: '@textforge/beta/capability/source',
        status: 'active',
        activationSources: ['document'],
        matchedRequirementNames: [],
      },
    ],
  );
  assert.deepEqual(
    inspector.packages[1]?.contributions.markdownFenceHandlers.map((entry) => ({
      id: entry.id,
      status: entry.status,
      fenceNames: entry.fenceNames,
    })),
    [
      {
        id: '@textforge/beta/json',
        status: 'active',
        fenceNames: ['json'],
      },
    ],
  );
});
