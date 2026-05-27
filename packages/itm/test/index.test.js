import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  contributions,
  createItmResolverDiagnostic,
  createWorkspaceItmIncludeProvider,
  itmResolverDiagnosticCodes,
  loadItmDocument,
  parseDocument,
  projectItmDocument,
  renderItmPublicationHtml,
  serializeDocument,
  validateItmDocument,
} from '../src/index.js';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const examplesDirectory = resolve(testDirectory, '../src/examples');

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

test('ITM contribution manifest exposes markdown fence handlers', () => {
  assert.equal(contributions.packageId, '@textforge/itm');
  assert.equal(contributions.markdownFenceHandlers.some((handler) => handler.localName === 'itm'), true);
  assert.equal(contributions.markdownFenceHandlers.some((handler) => handler.localName === 'itm-pub'), true);
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
