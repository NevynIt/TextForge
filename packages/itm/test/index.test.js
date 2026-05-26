import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contributions,
  createWorkspaceItmIncludeProvider,
  loadItmDocument,
  parseDocument,
  projectItmDocument,
  renderItmPublicationHtml,
  serializeDocument,
} from '../src/index.js';

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

test('ITM contribution manifest exposes markdown fence handlers', () => {
  assert.equal(contributions.packageId, '@textforge/itm');
  assert.equal(contributions.markdownFenceHandlers.some((handler) => handler.localName === 'itm'), true);
  assert.equal(contributions.markdownFenceHandlers.some((handler) => handler.localName === 'itm-pub'), true);
});
