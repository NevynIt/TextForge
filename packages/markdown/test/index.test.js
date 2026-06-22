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
  scanMdppDirectives,
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
  assert.equal(contributions.commands.some((command) => command.id === 'markdown.export-preview-diagram-svg'), true);
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
  assert.match(result.printHtml, /data-block="tfmd-block-1"/);
  assert.doesNotMatch(result.printHtml, /```mermaid/);
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

function createFakeAnimationFrameScheduler() {
  let nextId = 1;
  const callbacks = new Map();
  return {
    requestAnimationFrame(callback) {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      callbacks.delete(id);
    },
    flush() {
      const pending = [...callbacks.entries()].sort((a, b) => a[0] - b[0]);
      callbacks.clear();
      for (const [, callback] of pending) {
        callback();
      }
    },
    pendingCount() {
      return callbacks.size;
    },
  };
}

function createFakeDocumentContainer() {
  class FakeElement {
    constructor(tagName, ownerDocument) {
      this.tagName = tagName;
      this.ownerDocument = ownerDocument;
      this.innerHTML = '';
      this.childNodes = [];
      this.style = {};
      this.attributes = new Map();
    }

    setAttribute(name, value) {
      this.attributes.set(name, value);
    }

    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }

    replaceChildren(...children) {
      this.childNodes = children;
      this.innerHTML = children.map((child) => child.__html ?? child.innerHTML ?? '').join('');
      for (const child of children) {
        child.parentNode = this;
      }
    }

    remove() {
      if (!this.parentNode) {
        return;
      }
      this.parentNode.childNodes = this.parentNode.childNodes.filter((child) => child !== this);
      this.parentNode = undefined;
    }

    querySelectorAll() {
      return [];
    }
  }

  class FakeTemplate {
    constructor() {
      this.content = {
        __html: '',
        querySelectorAll: () => [],
        cloneNode() {
          return {
            __html: this.__html,
          };
        },
      };
    }

    set innerHTML(value) {
      this.content.__html = value;
    }

    get innerHTML() {
      return this.content.__html;
    }
  }

  const ownerDocument = {
    createElement(tagName) {
      return tagName === 'template'
        ? new FakeTemplate()
        : new FakeElement(tagName, ownerDocument);
    },
    querySelector() {
      return undefined;
    },
  };
  const scrollHost = {
    scrollTop: 140,
    scrollLeft: 18,
    scrollHeight: 1000,
    clientHeight: 300,
    scrollWidth: 900,
    clientWidth: 500,
    scrollTo({ top, left }) {
      this.scrollTop = top;
      this.scrollLeft = left;
    },
  };
  const container = new FakeElement('div', ownerDocument);
  container.closest = () => scrollHost;
  return { container, scrollHost };
}

test('createMarkdownPreviewSurface buffers updates and preserves scroll', async () => {
  const scheduler = createFakeAnimationFrameScheduler();
  const oldRendered = await renderMarkdownDocument('# Old preview');
  const nextRendered = await renderMarkdownDocument('# New preview');
  const oldSurface = createMarkdownPreviewSurface('# Old preview', oldRendered, { scheduler });
  const nextSurface = createMarkdownPreviewSurface('# New preview', nextRendered, { scheduler });
  const { container, scrollHost } = createFakeDocumentContainer();

  const dispose = oldSurface.mount(container);
  assert.match(container.innerHTML, /Old preview/);

  scrollHost.scrollTop = 220;
  oldSurface.update(container, nextSurface, { scrollHost });
  assert.match(container.innerHTML, /Old preview/);
  assert.doesNotMatch(container.innerHTML, /New preview/);

  scrollHost.scrollTop = 0;
  scheduler.flush();
  assert.match(container.innerHTML, /New preview/);
  assert.equal(scrollHost.scrollTop, 220);

  dispose();
});

test('createMarkdownPreviewSurface cancels stale buffered updates', async () => {
  const scheduler = createFakeAnimationFrameScheduler();
  const firstRendered = await renderMarkdownDocument('# First preview');
  const staleRendered = await renderMarkdownDocument('# Stale preview');
  const finalRendered = await renderMarkdownDocument('# Final preview');
  const firstSurface = createMarkdownPreviewSurface('# First preview', firstRendered, { scheduler });
  const staleSurface = createMarkdownPreviewSurface('# Stale preview', staleRendered, { scheduler });
  const finalSurface = createMarkdownPreviewSurface('# Final preview', finalRendered, { scheduler });
  const { container, scrollHost } = createFakeDocumentContainer();

  const dispose = firstSurface.mount(container);
  firstSurface.update(container, staleSurface, { scrollHost });
  firstSurface.update(container, finalSurface, { scrollHost });

  assert.equal(scheduler.pendingCount(), 1);
  scheduler.flush();
  assert.match(container.innerHTML, /Final preview/);
  assert.doesNotMatch(container.innerHTML, /Stale preview/);

  dispose();
});

test('createMarkdownPreviewSurface delegates non-fragment link clicks to the host', async () => {
  const rendered = await renderMarkdownDocument('[Open sibling](./sibling.md)\n\n[Jump](#preview)');
  const updatedRendered = await renderMarkdownDocument('[Open updated sibling](./updated-sibling.md)');
  const activations = [];
  const listeners = new Map();
  const surface = createMarkdownPreviewSurface('', rendered, {
    resource: {
      resourceId: 'markdown-link-preview',
      path: '/docs/preview.md',
      kind: 'resource',
      representation: 'text',
    },
    onLinkActivate(activation) {
      activations.push({
        href: activation.href,
        resourcePath: activation.resource?.path,
      });
      return true;
    },
  });
  const container = {
    innerHTML: '',
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    contains(node) {
      return node?.owner === this;
    },
  };

  const dispose = surface.mount(container);
  const clickListener = listeners.get('click');
  assert.equal(typeof clickListener, 'function');

  const prevented = [];
  clickListener({
    button: 0,
    target: {
      closest() {
        return {
          owner: container,
          getAttribute(name) {
            return name === 'href' ? './sibling.md' : undefined;
          },
        };
      },
    },
    preventDefault() {
      prevented.push(true);
    },
  });

  clickListener({
    button: 0,
    target: {
      closest() {
        return {
          owner: container,
          getAttribute(name) {
            return name === 'href' ? '#preview' : undefined;
          },
        };
      },
    },
    preventDefault() {
      throw new Error('Fragment links should not be intercepted.');
    },
  });
  const updatedSurface = createMarkdownPreviewSurface('', updatedRendered, {
    resource: {
      resourceId: 'markdown-link-preview',
      path: '/docs/preview.md',
      kind: 'resource',
      representation: 'text',
    },
    onLinkActivate: surface.model.onLinkActivate,
  });
  surface.update(container, updatedSurface);
  clickListener({
    button: 0,
    target: {
      closest() {
        return {
          owner: container,
          getAttribute(name) {
            return name === 'href' ? './updated-sibling.md' : undefined;
          },
        };
      },
    },
    preventDefault() {
      prevented.push(true);
    },
  });

  assert.deepEqual(activations, [
    {
      href: './sibling.md',
      resourcePath: '/docs/preview.md',
    },
    {
      href: './updated-sibling.md',
      resourcePath: '/docs/preview.md',
    },
  ]);
  assert.equal(prevented.length, 2);

  dispose();
  assert.equal(listeners.size, 0);
});

test('createMarkdownPreviewSurface delegates generated diagram context menus to the host', async () => {
  const rendered = await renderMarkdownDocument(`\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`
`, {
    fenceHandlers: {
      async mermaid({ blockId }) {
        return {
          html: `<svg data-block="${blockId}"></svg>`,
          svg: `<svg data-block="${blockId}"></svg>`,
        };
      },
    },
  });
  const activations = [];
  const listeners = new Map();
  const surface = createMarkdownPreviewSurface('', rendered, {
    resource: {
      resourceId: 'markdown-diagram-preview',
      path: '/docs/preview.md',
      kind: 'resource',
      representation: 'text',
    },
    onGeneratedDiagramContextMenu(activation) {
      activations.push({
        blockId: activation.blockId,
        blockKind: activation.blockKind,
        svgText: activation.svgText,
      });
      return true;
    },
  });
  const container = {
    innerHTML: '',
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    contains(node) {
      return node?.owner === this;
    },
  };
  const block = {
    owner: container,
    className: 'tfmd-block tfmd-block--mermaid',
    getAttribute(name) {
      return name === 'data-block-id' ? 'tfmd-block-1' : undefined;
    },
    querySelector(selector) {
      return selector === 'svg'
        ? { outerHTML: '<svg data-block="tfmd-block-1"></svg>' }
        : undefined;
    },
  };
  const prevented = [];

  const dispose = surface.mount(container);
  listeners.get('contextmenu')?.({
    target: {
      closest(selector) {
        return selector === '.tfmd-block[data-block-id]' ? block : undefined;
      },
    },
    preventDefault() {
      prevented.push(true);
    },
  });

  assert.deepEqual(activations, [{
    blockId: 'tfmd-block-1',
    blockKind: 'mermaid',
    svgText: '<svg data-block="tfmd-block-1"></svg>',
  }]);
  assert.equal(prevented.length, 1);

  dispose();
  assert.equal(listeners.size, 0);
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

test('renderMarkdownDocument parses md++ directives, metadata, requirements, and semantic HTML', async () => {
  const source = `[md:profile]: md++
[md:profile-version]: 0.14
[md:title]: <mdpp smoke>
[md:status]: draft
[md:require]: diagram.mermaid

# Title {#title .hero data-kind=main}

| A | B |
|---|---|
| 1 | 2 |
`;
  const scanned = scanMdppDirectives(source);
  const result = await renderMarkdownDocument(source);

  assert.equal(scanned.metadata.title, 'mdpp smoke');
  assert.equal(parseMarkdownCapabilityRequirements(source)[0]?.name, 'diagram.mermaid');
  assert.equal(result.profile, 'mdpp');
  assert.equal(result.metadata.title, 'mdpp smoke');
  assert.match(result.html, /class="tfmd-preview mdpp-document"/);
  assert.match(result.html, /class="mdpp-heading hero"/);
  assert.match(result.html, /data-kind="main"/);
  assert.match(result.html, /class="mdpp-table"/);
  assert.doesNotMatch(result.html, /\[md:profile\]/);
});

test('renderMarkdownDocument resolves md++ includes, repository aliases, stylesheets, and themes', async () => {
  const resources = new Map([
    ['/docs/child.md', 'Included paragraph. {.lead}\n'],
    ['/docs/shared/chapter.md', 'Repository chapter.\n'],
    ['/docs/theme.md', '## colors\nprimary: #204080\n\n## class lead\nfont-weight: bold\n'],
    ['/docs/doc.css', '.mdpp-document .custom { color: red; }\n'],
  ]);
  const result = await renderMarkdownDocument(`[md:profile]: md++
[md:repository:shared]: ./shared
[md:theme]: ./theme.md
[md:stylesheet]: ./doc.css
[md:include]: ./child.md
[md:include]: shared:chapter.md

# Root
`, {
    resource: {
      resourceId: 'root',
      path: '/docs/root.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    },
    resolveTextResource({ ref, basePath, repositoryAliases }) {
      const normalizedRef = String(ref);
      const repositoryMatch = normalizedRef.match(/^([A-Za-z][A-Za-z0-9_-]*):(.*)$/u);
      const effectiveRef = repositoryMatch && repositoryAliases?.[repositoryMatch[1]]
        ? `${repositoryAliases[repositoryMatch[1]]}/${repositoryMatch[2]}`
        : normalizedRef;
      const baseDirectory = String(basePath ?? '/docs/root.md').replace(/\/[^/]*$/u, '');
      const path = effectiveRef.startsWith('./')
        ? `${baseDirectory}/${effectiveRef.slice(2)}`.replace('/./', '/')
        : effectiveRef.startsWith('/docs/')
          ? effectiveRef
          : `${baseDirectory}/${effectiveRef}`;
      const normalizedPath = path.replace('/shared/./', '/shared/').replace('/./', '/');
      const text = resources.get(normalizedPath);
      return text ? { text, path: normalizedPath, mimeType: 'text/markdown' } : undefined;
    },
  });

  assert.match(result.html, /Included paragraph/);
  assert.match(result.html, /Repository chapter/);
  assert.match(result.styleSheet, /--mdpp-colors-primary: #204080/);
  assert.match(result.styleSheet, /\.mdpp-document \.lead/);
  assert.match(result.styleSheet, /\.mdpp-document \.custom/);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === 'MDPP0200'), false);
});

test('renderMarkdownDocument detects md++ include failures, cycles, and duplicate anchors', async () => {
  const resources = new Map([
    ['/docs/a.md', '[md:include]: ./b.md\n'],
    ['/docs/b.md', '[md:include]: ./a.md\n'],
  ]);
  const result = await renderMarkdownDocument(`[md:profile]: md++
[md:include]: ./a.md
[md:include]: ./missing.md

# First {#dup}
# Second {#dup}
`, {
    resource: {
      resourceId: 'root',
      path: '/docs/root.md',
      kind: 'resource',
      representation: 'text',
      languageId: 'markdown',
      mimeType: 'text/markdown',
    },
    resolveTextResource({ ref, basePath }) {
      const baseDirectory = String(basePath ?? '/docs/root.md').replace(/\/[^/]*$/u, '');
      const path = String(ref).startsWith('./') ? `${baseDirectory}/${String(ref).slice(2)}` : String(ref);
      const text = resources.get(path);
      return text ? { text, path, mimeType: 'text/markdown' } : undefined;
    },
  });

  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === 'MDPP0200'), true);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === 'MDPP0201'), true);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === 'MDPP0006'), true);
});

test('renderMarkdownDocument absorbs md++ DOT models and renders model references', async () => {
  const renderedContents = [];
  const result = await renderMarkdownDocument(`[md:profile]: md++

\`\`\`dot model=system
digraph G {
  A -> B;
}
\`\`\`

\`\`\`diagram.dot.render source=system
caption: System graph
\`\`\`
`, {
    fenceHandlers: {
      async dot({ content, blockId }) {
        renderedContents.push(content);
        return {
          html: `<svg data-block="${blockId}" data-dot-length="${content.length}"></svg>`,
          generatedResources: [],
        };
      },
    },
  });

  assert.equal(renderedContents.length, 1);
  assert.match(renderedContents[0], /A -> B/);
  assert.match(result.html, /data-dot-length=/);
  assert.doesNotMatch(result.html, /model=system/);
  assert.deepEqual(result.mdpp?.models.map((model) => model.name), ['system']);
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
