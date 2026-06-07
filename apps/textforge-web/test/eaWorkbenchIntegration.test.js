import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  loadItmDocument,
  validateItmDocument,
} from '@textforge/itm';
import { createWorkbenchRegistries } from '../src/workbench/controller/registries.js';

const workspaceRoot = resolve(import.meta.dirname, '..', '..', '..');
const eaDirectory = resolve(workspaceRoot, 'docs', 'examples', 'ea');

test('workbench registry activates EA Dashboard ITM provider capabilities', async () => {
  const { contributionRegistry } = createWorkbenchRegistries();
  const profile = readFileSync(resolve(eaDirectory, 'ea-dashboard-profile.itm'), 'utf8');
  const source = readFileSync(resolve(eaDirectory, 'ea-dashboard-retail-architecture.itm'), 'utf8');
  const loaded = await loadItmDocument(source, {
    strict: false,
    uri: '/.textforge/resources/docs/examples/ea/ea-dashboard-retail-architecture.itm',
    contributionRegistry,
    documentResource: {
      path: '/.textforge/resources/docs/examples/ea/ea-dashboard-retail-architecture.itm',
      kind: 'resource',
      representation: 'text',
      languageId: 'itm',
      mimeType: 'text/x-itm',
    },
    includeProviders: [{
      read(uri) {
        return String(uri ?? '').endsWith('ea-dashboard-profile.itm')
          ? { uri: '/.textforge/resources/docs/examples/ea/ea-dashboard-profile.itm', text: profile }
          : undefined;
      },
    }],
  });
  const diagnostics = [
    ...loaded.diagnostics,
    ...validateItmDocument(loaded.effectiveResolvedDocument, {
      capabilityContext: loaded.capabilityContext,
    }),
  ];

  assert.equal(
    diagnostics.some((diagnostic) =>
      String(diagnostic.message).includes('Required capability')
      || String(diagnostic.message).includes('requires capability')),
    false,
  );
});
