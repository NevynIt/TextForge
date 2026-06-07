import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  parseMarkdownCapabilityRequirements,
  renderMarkdownDocument,
} from '@textforge/markdown';
import { workspaceEntryToResourceRef } from '@textforge/workspace';
import { createWorkbenchRegistries } from '../src/workbench/controller/registries.js';

const workspaceRoot = resolve(import.meta.dirname, '..', '..', '..');
const profileDirectory = resolve(workspaceRoot, 'docs', 'examples', 'itm', 'test-profiles');

function createMarkdownResource(filename, text) {
  return {
    id: filename,
    kind: 'resource',
    path: `/.textforge/resources/docs/examples/itm/test-profiles/${filename}`,
    representation: 'text',
    languageId: 'markdown',
    mimeType: 'text/markdown',
    text,
    metadata: {
      updatedAt: '2026-06-07T00:00:00.000Z',
    },
  };
}

test('workbench registry renders ITM Markdown mindmap and report test profiles', async () => {
  const { contributionRegistry } = createWorkbenchRegistries();
  const expectations = [
    {
      filename: 'itm-markdown-mindmap.md',
      markers: [/Mindmap smoke publication/, /tf-itm-mindmap/],
    },
    {
      filename: 'itm-markdown-report.md',
      markers: [/Catalogue smoke publication/, /Matrix smoke publication/, /Report smoke publication/, /tf-itm-report/],
    },
  ];

  for (const expectation of expectations) {
    const source = readFileSync(resolve(profileDirectory, expectation.filename), 'utf8');
    const resource = createMarkdownResource(expectation.filename, source);
    const resourceRef = workspaceEntryToResourceRef(resource);
    const contributionContext = contributionRegistry.resolveDocumentContext({
      document: resourceRef,
      explicitRequirements: parseMarkdownCapabilityRequirements(source),
    });
    const rendered = await renderMarkdownDocument(source, {
      resource: resourceRef,
      sourceUpdatedAt: resource.metadata.updatedAt,
      contributionRegistry,
      contributionContext,
    });

    assert.equal(
      contributionContext.activeMarkdownFenceHandlers.some((handler) => handler.fenceNames.includes('itm-pub')),
      true,
    );
    assert.doesNotMatch(rendered.html, /```itm-pub/);
    for (const marker of expectation.markers) {
      assert.match(rendered.html, marker);
    }
  }
});
