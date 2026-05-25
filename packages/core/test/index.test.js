import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCommand,
  createCommandDispatcher,
  createCommandRegistry,
  createContributionRegistry,
  createContributionManifest,
  createDiagnostic,
  createMarkdownFenceHandlerContribution,
  createResourceFacts,
  createResourcePredicate,
  createResourceRef,
  createSourcePosition,
  createSourceRange,
  inferLanguageId,
  matchesResourcePredicate,
} from '../src/index.js';

test('core constructors build stable value objects', () => {
  const ref = createResourceRef('resource-1', { path: '/docs/note.md' });
  const range = createSourceRange(createSourcePosition(1, 1), createSourcePosition(1, 4, 3));
  const diagnostic = createDiagnostic('Missing heading', 'info', { resource: ref, source: range });
  const manifest = createContributionManifest('@textforge/core');

  assert.equal(ref.resourceId, 'resource-1');
  assert.equal(diagnostic.severity, 'information');
  assert.equal(diagnostic.source?.end.offset, 3);
  assert.equal(inferLanguageId({ path: '/docs/notes.md' }), 'markdown');
  assert.equal(manifest.packageId, '@textforge/core');
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
          when: { workspaceReady: true, selectionRequired: true, selectionKinds: ['folder'] },
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
    selection: { resourceId: 'folder-1', kind: 'folder' },
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
    selection: { resourceId: 'resource-1', kind: 'resource', representation: 'text' },
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
  });

  assert.equal(matchesResourcePredicate(predicate, resourceFacts), true);
});
