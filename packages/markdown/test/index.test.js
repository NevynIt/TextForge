import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

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
  contributions as bpmnContributions,
} from '../../bpmn/src/index.js';
import {
  contributions as coreContributions,
  createCapability,
  createContributionManifest,
  createContributionRegistry,
  createMarkdownFenceHandlerContribution,
  createResourcePredicate,
} from '@textforge/core';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const itmTestProfilesDirectory = resolve(testDirectory, '..', '..', '..', 'docs', 'examples', 'itm', 'test-profiles');

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

test('renderMarkdownDocument can render itm-pub graph projections through the diagram pipeline and emit generated assets', async () => {
  const contributionRegistry = createContributionRegistry([
    contributions,
    itmContributions,
    createContributionManifest('@textforge/test-diagrams', {
      capabilities: [
        createCapability('@textforge/test-diagrams/capability/graphviz', {
          aliases: ['graphviz'],
          defaultActive: true,
          documentPredicate: createResourcePredicate({ languageIds: ['markdown'] }),
        }),
      ],
      pipelines: [
        {
          id: '@textforge/test-diagrams/graphviz-svg',
          localName: 'graphviz-svg',
          capabilities: ['@textforge/test-diagrams/capability/graphviz'],
          defaultActive: true,
          inputKind: 'text',
          outputKind: 'svg',
          async run({ input }) {
            const text = typeof input === 'string' ? input : String(input?.value ?? '');
            return {
              output: {
                kind: 'svg',
                value: `<svg data-dot="${text.length}"></svg>`,
              },
            };
          },
        },
      ],
    }),
  ]);

  const result = await renderMarkdownDocument(`\`\`\`itm name=roadmap-model
&roadmap [Capability] Capability roadmap
  &phase1 [Capability] Foundation
  &phase2 [Capability] Delivery
\`\`\`

\`\`\`itm-pub
projection: graph
source: roadmap-model
title: "Roadmap graph"
\`\`\`
`, {
    resource: {
      resourceId: 'markdown-4-graph',
      path: '/docs/roadmap-graph.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    },
    contributionRegistry,
    fenceExecutionOptions: {
      generatedAssetBasePath: '/generated/roadmap-graph',
      includePng: false,
    },
  });

  assert.match(result.html, /data-itm-projection="graph"/);
  assert.match(result.html, /<svg/i);
  assert.equal(result.generatedResources.some((resource) => resource.path.endsWith('.svg')), true);
});

test('renderMarkdownDocument can render itm-pub BPMN publications through a host-provided SVG renderer', async () => {
  const contributionRegistry = createContributionRegistry([
    coreContributions,
    contributions,
    itmContributions,
    bpmnContributions,
  ]);

  const result = await renderMarkdownDocument(`\`\`\`itm name=training-bpmn-publication
%metadata
{
  title: "Training By Design inline BPMN publication"
  sourceFile: "Training By Design.bpmn"
}

%require bpmn.viewer ^0.1.0

%viewpoint training_bpmn_preview
{
  pipeline:
    - render: bpmn.viewer
}

%view training_bpmn_diagram
{
  viewpoint: training_bpmn_preview
}
\`\`\`

\`\`\`itm-pub
source: training-bpmn-publication
view: training_bpmn_diagram
projection: graph
title: "Training By Design BPMN Diagram"
\`\`\`
`, {
    resource: {
      resourceId: 'markdown-bpmn-inline',
      path: '/docs/examples/bpmn/itm-bpmn-inline-publication.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    },
    contributionRegistry,
    fenceExecutionOptions: {
      generatedAssetBasePath: '/generated/itm-bpmn-inline-publication',
      hostServices: {
        workspace: {
          getEntryByPath(path) {
            if (String(path ?? '').replaceAll('\\', '/').endsWith('/Training By Design.bpmn')) {
              return {
                kind: 'resource',
                representation: 'text',
                path,
                text: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="https://www.omg.org/spec/BPMN/20100524/MODEL" id="Defs_1" targetNamespace="https://example.org/textforge/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start" />
  </bpmn:process>
</bpmn:definitions>`,
              };
            }
            return undefined;
          },
        },
        bpmn: {
          async renderPublicationSvg(xml) {
            return `<svg data-bpmn-inline="${xml.length}"></svg>`;
          },
        },
      },
    },
  });

  assert.match(result.html, /Training By Design BPMN Diagram/);
  assert.match(result.html, /data-bpmn-inline=/);
  assert.equal(result.generatedResources.some((resource) => resource.path.endsWith('.svg')), true);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.severity === 'error'), false);
});

test('renderMarkdownDocument forwards itm package-rule diagnostics through the fence execution path', async () => {
  const contributionRegistry = createContributionRegistry([
    contributions,
    itmContributions,
  ]);

  const result = await renderMarkdownDocument(`\`\`\`itm
&cap Capability
%package validation_profile
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
\`\`\`
`, {
    resource: {
      resourceId: 'markdown-4b',
      path: '/docs/itm-validation.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    },
    contributionRegistry,
  });

  assert.equal(
    result.diagnostics.some((diagnostic) => diagnostic.code === 'itm.validation.provider-unavailable'),
    true,
  );
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

test('renderMarkdownDocument renders focused ITM markdown smoke profiles incrementally', async () => {
  const contributionRegistry = createContributionRegistry([
    contributions,
    itmContributions,
    createContributionManifest('@textforge/test-diagrams', {
      capabilities: [
        createCapability('@textforge/test-diagrams/capability/graphviz', {
          aliases: ['graphviz'],
          defaultActive: true,
          documentPredicate: createResourcePredicate({ languageIds: ['markdown'] }),
        }),
      ],
      pipelines: [
        {
          id: '@textforge/test-diagrams/graphviz-svg',
          localName: 'graphviz-svg',
          capabilities: ['@textforge/test-diagrams/capability/graphviz'],
          defaultActive: true,
          inputKind: 'text',
          outputKind: 'svg',
          async run({ input }) {
            const text = typeof input === 'string' ? input : String(input?.value ?? '');
            return {
              output: {
                kind: 'svg',
                value: `<svg data-smoke-dot="${text.length}"></svg>`,
              },
            };
          },
        },
      ],
    }),
  ]);

  const expectations = [
    {
      filename: 'itm-markdown-tree.md',
      marker: /Tree smoke publication/,
    },
    {
      filename: 'itm-markdown-graph.md',
      marker: /Graph smoke publication/,
      generatedResourceSuffix: '.svg',
    },
    {
      filename: 'itm-markdown-mindmap.md',
      marker: /Mindmap smoke publication/,
    },
    {
      filename: 'itm-markdown-report.md',
      marker: /Report smoke publication/,
    },
  ];

  for (const expectation of expectations) {
    const source = readFileSync(resolve(itmTestProfilesDirectory, expectation.filename), 'utf8');
    const result = await renderMarkdownDocument(source, {
      resource: {
        resourceId: expectation.filename,
        path: `/docs/examples/itm/test-profiles/${expectation.filename}`,
        kind: 'resource',
        representation: 'text',
        languageId: 'markdown',
        mimeType: 'text/markdown',
      },
      contributionRegistry,
      fenceExecutionOptions: {
        generatedAssetBasePath: `/generated/${expectation.filename.replace(/\.md$/i, '')}`,
        includePng: false,
      },
    });

    assert.match(result.html, expectation.marker);
    if (expectation.generatedResourceSuffix) {
      assert.equal(
        result.generatedResources.some((resource) => resource.path.endsWith(expectation.generatedResourceSuffix)),
        true,
      );
    }
  }
});
