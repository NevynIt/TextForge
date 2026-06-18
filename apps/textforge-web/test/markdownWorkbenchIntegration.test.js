import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  parseMarkdownCapabilityRequirements,
  renderMarkdownDocument,
} from '@textforge/markdown';
import { workspaceEntryToResourceRef } from '@textforge/workspace';
import { describeMarkdownPrintDiagramIssue } from '../src/workbench/controller/index.js';
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
      markers: [/Mindmap smoke publication/, /data-itm-jsmind-publication/, /tf-visual-runtime--jsmind/],
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

test('workbench registry renders md++ documents with workspace-backed includes and requirements', async () => {
  const { contributionRegistry } = createWorkbenchRegistries();
  const source = `[md:profile]: md++
[md:require]: diagram.mermaid
[md:theme]: ./theme.md
[md:include]: ./chapter.md

# Root
`;
  const resource = {
    ...createMarkdownResource('root.md', source),
    path: '/docs/mdpp/root.md',
  };
  const resourceRef = workspaceEntryToResourceRef(resource);
  const resourceMap = new Map([
    ['/docs/mdpp/chapter.md', 'Included md++ content. {.lead}\n'],
    ['/docs/mdpp/theme.md', '## class lead\nfont-weight: bold\n'],
  ]);
  const contributionContext = contributionRegistry.resolveDocumentContext({
    document: resourceRef,
    explicitRequirements: parseMarkdownCapabilityRequirements(source),
  });
  const rendered = await renderMarkdownDocument(source, {
    resource: resourceRef,
    sourceUpdatedAt: resource.metadata.updatedAt,
    contributionRegistry,
    contributionContext,
    resolveTextResource({ ref, basePath }) {
      const baseDirectory = String(basePath ?? '/docs/mdpp/root.md').replace(/\/[^/]*$/u, '');
      const path = String(ref).startsWith('./') ? `${baseDirectory}/${String(ref).slice(2)}` : String(ref);
      const text = resourceMap.get(path);
      return text ? { text, path, mimeType: 'text/markdown' } : undefined;
    },
  });

  assert.equal(rendered.profile, 'mdpp');
  assert.match(rendered.html, /Included md\+\+ content/);
  assert.match(rendered.styleSheet, /\.mdpp-document \.lead/);
  assert.equal(
    contributionContext.activeCapabilityIds.some((capabilityId) => capabilityId === '@textforge/diagrams/capability/mermaid'),
    true,
  );
});

test('markdown print export guard blocks incomplete diagram HTML', () => {
  const resource = createMarkdownResource('diagram.md', `# Diagram

\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`
`);

  assert.match(
    describeMarkdownPrintDiagramIssue(resource, {
      printHtml: '<!doctype html><html><body><figure></figure></body></html>',
      diagnostics: [],
    }),
    /contains no rendered SVG artifact/,
  );

  assert.match(
    describeMarkdownPrintDiagramIssue(resource, {
      printHtml: '<!doctype html><html><body></body></html>',
      diagnostics: [{
        code: 'tfmd.fence.render-failed',
        message: 'Mermaid failed to render.',
        origin: { fenceName: 'mermaid' },
      }],
    }),
    /Mermaid failed to render/,
  );

  assert.equal(
    describeMarkdownPrintDiagramIssue(resource, {
      printHtml: '<!doctype html><html><body><svg data-block="tfmd-block-1"></svg></body></html>',
      diagnostics: [],
    }),
    undefined,
  );
});

test('markdown preview keeps a stable buffered surface while rendering updates', async () => {
  const { surfaceRegistry } = createWorkbenchRegistries();
  const previewContribution = surfaceRegistry.get('@textforge/markdown/preview');
  const resource = createMarkdownResource('buffered-preview.md', '# Previous preview');
  const previousResult = await renderMarkdownDocument('# Previous preview');
  const nextResult = await renderMarkdownDocument('# Next preview');
  const session = {
    id: 'main-buffered-preview',
    placement: 'main',
  };

  const previousView = previewContribution.open({
    session,
    resource: workspaceEntryToResourceRef(resource),
    sourceText: resource.text,
    updatedAt: '2026-06-08T00:00:00.000Z',
    requestPreview: () => ({
      status: 'ready',
      result: previousResult,
    }),
  });
  const renderingView = previewContribution.open({
    session,
    resource: workspaceEntryToResourceRef(resource),
    sourceText: '# Next preview',
    updatedAt: '2026-06-08T00:00:01.000Z',
    requestPreview: () => ({
      status: 'rendering',
      result: previousResult,
    }),
  });
  const nextView = previewContribution.open({
    session,
    resource: workspaceEntryToResourceRef(resource),
    sourceText: '# Next preview',
    updatedAt: '2026-06-08T00:00:01.000Z',
    requestPreview: () => ({
      status: 'ready',
      result: nextResult,
    }),
  });

  assert.equal(previousView.mountId, renderingView.mountId);
  assert.equal(renderingView.mountId, nextView.mountId);
  assert.match(renderingView.surface.model.html, /Previous preview/);
  assert.doesNotMatch(renderingView.surface.model.html, /Rendering Markdown preview/);
  assert.equal(typeof previousView.surface.update, 'function');
});
