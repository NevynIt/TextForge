import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contributions,
  createMarkdownPreviewSurface,
  createMarkdownSnippet,
  parseMarkdownCapabilityRequirements,
  renderMarkdownDocument,
} from '../src/index.js';
import {
  contributions as itmContributions,
} from '@textforge/itm';
import {
  createCapability,
  createContributionManifest,
  createContributionRegistry,
  createMarkdownFenceHandlerContribution,
  createResourcePredicate,
} from '@textforge/core';

test('markdown package exposes preview contribution and command surface', () => {
  assert.equal(contributions.packageId, '@textforge/markdown');
  assert.equal(contributions.surfaces[0]?.id, '@textforge/markdown/preview');
  assert.equal(contributions.commands.some((command) => command.id === 'markdown.export-generated-diagrams'), true);
  assert.match(createMarkdownSnippet('mermaid'), /```mermaid/);
});

test('renderMarkdownDocument parses TF-MD metadata, styles, and explicit anchors', async () => {
  const result = await renderMarkdownDocument(`# Title {#title .hero}

\`\`\`tf-md
%metadata {
  title: "Example"
}
%style .hero {
  color: "#aa0000"
}
\`\`\`

Body paragraph. {.hero}

See [diagram](#title).
`);

  assert.equal(result.metadata.title, 'Example');
  assert.match(result.html, /id="title"/);
  assert.match(result.html, /class="hero"/);
  assert.match(result.styleSheet, /\.tfmd-preview \.hero/);
  assert.equal(result.diagnostics.length, 0);
});

test('renderMarkdownDocument resolves image references and provisional fenced blocks', async () => {
  const result = await renderMarkdownDocument(`![Architecture](assets/system.svg)

\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`

\`\`\`json
{"ok": true}
\`\`\`
`, {
    resource: {
      resourceId: 'markdown-1',
      path: '/docs/example.md',
      kind: 'resource',
      representation: 'text',
    },
    resolveAssetReference({ href }) {
      return {
        href,
        path: '/docs/assets/system.svg',
        resolvedSrc: 'blob:system-svg',
      };
    },
    fenceHandlers: {
      async mermaid({ blockId }) {
        return {
          html: `<svg data-block="${blockId}"></svg>`,
          svg: '<svg />',
          generatedResources: [{
            kind: 'generated-resource',
            path: '/generated/example-mermaid.svg',
            representation: 'text',
            mimeType: 'image/svg+xml',
            text: '<svg />',
            generatedAt: '2026-05-25T00:00:00.000Z',
          }],
        };
      },
    },
  });

  assert.match(result.html, /blob:system-svg/);
  assert.match(result.html, /data-block="tfmd-block-1"/);
  assert.match(result.html, /language-json/);
  assert.equal(result.referencedAssets[0]?.resolvedSrc, 'blob:system-svg');
  assert.equal(result.generatedResources[0]?.path, '/generated/example-mermaid.svg');
  assert.match(result.printHtml, /<!doctype html>/i);
});

test('renderMarkdownDocument resolves %require through the document capability context', async () => {
  const contributionRegistry = createContributionRegistry([
    createContributionManifest('@textforge/markdown', {
      capabilities: [
        createCapability('@textforge/markdown/capability/preview', {
          localName: 'tf-md',
          defaultActive: true,
          documentPredicate: createResourcePredicate({ languageIds: ['markdown'] }),
        }),
      ],
    }),
    createContributionManifest('@textforge/custom', {
      capabilities: [
        createCapability('@textforge/custom/capability/json', {
          aliases: ['json'],
          defaultActive: false,
          documentPredicate: createResourcePredicate({ languageIds: ['markdown'] }),
        }),
      ],
      markdownFenceHandlers: [
        createMarkdownFenceHandlerContribution('@textforge/custom/json', {
          localName: 'json',
          capabilities: ['@textforge/custom/capability/json'],
          fenceNames: ['json'],
          async render() {
            return {
              html: '<pre data-json="active"></pre>',
              generatedResources: [],
            };
          },
        }),
      ],
    }),
  ]);

  const result = await renderMarkdownDocument(`\`\`\`tf-md
%require json
\`\`\`

\`\`\`json
{"ok": true}
\`\`\`
`, {
    resource: {
      resourceId: 'markdown-3',
      path: '/docs/preview.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    },
    contributionRegistry,
  });

  assert.equal(parseMarkdownCapabilityRequirements('```tf-md\n%require json\n```')[0]?.name, 'json');
  assert.match(result.html, /data-json="active"/);
  assert.equal(result.capabilityContext?.requirements[0]?.status, 'active');
});

test('createMarkdownPreviewSurface mounts preview html', async () => {
  const rendered = await renderMarkdownDocument('# Preview');
  const surface = createMarkdownPreviewSurface('# Preview', rendered, {
    resource: {
      resourceId: 'markdown-2',
      path: '/docs/preview.md',
      kind: 'resource',
      representation: 'text',
    },
  });
  const container = {
    innerHTML: '',
  };

  const dispose = surface.mount(container);
  assert.match(container.innerHTML, /tfmd-preview/);
  dispose();
  assert.equal(container.innerHTML, '');
});

test('renderMarkdownDocument renders itm and itm-pub fences through active contribution handlers', async () => {
  const contributionRegistry = createContributionRegistry([
    contributions,
    itmContributions,
  ]);

  const result = await renderMarkdownDocument(`\`\`\`itm name=roadmap-model
%viewpoint roadmap_viewpoint
{
  pipeline:
    - select: "[Capability]"
}
%view roadmap_view
{
  viewpoint: roadmap_viewpoint
}
&roadmap [Capability] Capability roadmap
  &phase1 [Phase] Foundation
\`\`\`

\`\`\`itm-pub
view: roadmap_view
source: roadmap-model
title: "Roadmap summary"
\`\`\`
`, {
    resource: {
      resourceId: 'markdown-4',
      path: '/docs/roadmap.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    },
    contributionRegistry,
  });

  assert.match(result.html, /Roadmap summary/);
  assert.match(result.html, /Capability roadmap/);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.severity === 'error'), false);
});

test('renderMarkdownDocument surfaces provider-backed repository resolver diagnostics from itm fences', async () => {
  const contributionRegistry = createContributionRegistry([
    contributions,
    itmContributions,
  ]);

  const result = await renderMarkdownDocument(`\`\`\`itm
%repository shared https://example.org/itm
%include shared:profiles/core.itm
&root Root capability
\`\`\`
`, {
    resource: {
      resourceId: 'markdown-5',
      path: '/docs/repository-preview.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    },
    contributionRegistry,
  });

  assert.equal(
    result.diagnostics.some((diagnostic) => diagnostic.code === 'itm.resolve.unsupported'),
    true,
  );
});
