import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contributions,
  createMarkdownPreviewSurface,
  createMarkdownSnippet,
  renderMarkdownDocument,
} from '../src/index.js';

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
