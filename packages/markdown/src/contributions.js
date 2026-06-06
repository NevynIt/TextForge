import {
  createCapability,
  createCommand,
  createContributionManifest,
  createMarkdownFenceHandlerContribution,
  createResourcePredicate,
} from '@textforge/core';

import { createMarkdownPreviewSurface } from './preview.js';
import { renderInlineSvgBlock, renderStaticDataBlock } from './html.js';
import { createMarkdownDiagnostic, escapeHtml } from './support.js';

export const markdownDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['markdown'],
  mimeTypes: ['text/markdown', 'text/x-markdown'],
  fileExtensions: ['md', 'markdown', 'tfmd'],
});

export const markdownCapabilities = [
  createCapability('@textforge/markdown/capability/preview', {
    description: 'Render Markdown and TF-MD source through the package preview surface.',
    localName: 'tf-md',
    aliases: ['markdown', 'preview'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
  createCapability('@textforge/markdown/capability/local-assets', {
    description: 'Resolve local workspace asset references inside Markdown content.',
    localName: 'local-assets',
    defaultActive: true,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
  createCapability('@textforge/markdown/capability/math', {
    description: 'Render inline and block KaTeX markup in the Markdown preview.',
    aliases: ['katex'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
  createCapability('@textforge/markdown/capability/fence-svg', {
    description: 'Render inline SVG fenced blocks in the Markdown preview.',
    aliases: ['svg'],
    defaultActive: false,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
  createCapability('@textforge/markdown/capability/fence-json', {
    description: 'Render JSON fenced blocks in the Markdown preview.',
    aliases: ['json'],
    defaultActive: false,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
  createCapability('@textforge/markdown/capability/fence-yaml', {
    description: 'Render YAML fenced blocks in the Markdown preview.',
    aliases: ['yaml'],
    defaultActive: false,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
];

export const markdownPreviewSurfaceContribution = {
  id: '@textforge/markdown/preview',
  label: 'Markdown preview',
  description: 'Render TF-MD and Markdown resources through the package-owned preview surface.',
  kind: 'markdown-preview',
  localName: 'preview',
  capabilities: ['@textforge/markdown/capability/preview'],
  defaultActive: true,
  placements: ['main', 'popup', 'auxiliary'],
  resourceRepresentations: ['text'],
  languageIds: ['markdown'],
  mimeTypes: ['text/markdown', 'text/x-markdown'],
  fileExtensions: ['md', 'markdown', 'tfmd'],
  openWithPriority: 85,
  open(execution = {}) {
    const resource = execution.resource;
    const resourceTitle = execution.resourceTitle ?? resource?.path ?? 'Markdown preview';
    const previewState = execution.requestPreview?.();
    if (previewState?.status === 'ready' && previewState.result) {
      const surface = createMarkdownPreviewSurface(execution.sourceText ?? '', previewState.result, {
        resource,
        onLinkActivate: execution.onLinkActivate,
      });
      return {
        mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
        summary: surface.model.summary,
        detail: `${surface.model.diagnostics.length} diagnostics / ${surface.model.referencedAssets.length} asset references`,
        readOnly: true,
        inspectorSections: [
          {
            eyebrow: 'Preview',
            icon: 'fileText',
            title: 'TF-MD summary',
            rows: [
              { label: 'Metadata title', value: String(surface.model.metadata.title ?? resourceTitle) },
              { label: 'Diagnostics', value: String(surface.model.diagnostics.length) },
              { label: 'Assets', value: String(surface.model.referencedAssets.length) },
              { label: 'Generated diagrams', value: String(surface.model.generatedResources.length) },
            ],
          },
        ],
        surface,
      };
    }

    const placeholderHtml = previewState?.status === 'error'
      ? `<section class="tfmd-preview tfmd-preview--error"><p>Markdown preview failed: ${escapeHtml(previewState.error?.message ?? 'Unknown error')}</p></section>`
      : '<section class="tfmd-preview tfmd-preview--loading"><p>Rendering Markdown preview...</p></section>';
    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${previewState?.status ?? 'rendering'}:${execution.updatedAt ?? 'current'}`,
      summary: previewState?.status === 'error'
        ? 'Markdown preview failed to render.'
        : 'Rendering the package-owned Markdown preview surface.',
      detail: previewState?.status === 'error' ? 'Render error' : 'Preview loading',
      readOnly: true,
      inspectorSections: [
        {
          eyebrow: 'Preview',
          icon: previewState?.status === 'error' ? 'warning' : 'status',
          title: 'TF-MD summary',
          rows: [
            { label: 'State', value: previewState?.status ?? 'rendering' },
            { label: 'Source', value: resource?.path ?? resourceTitle },
          ],
        },
      ],
      surface: {
        model: {
          html: placeholderHtml,
        },
        mount(container) {
          container.innerHTML = placeholderHtml;
          return () => {
            container.innerHTML = '';
          };
        },
      },
    };
  },
};

export const markdownCommandContributions = [
  createCommand('markdown.insert-image-reference', 'Insert image reference', {
    category: 'markdown',
    capabilities: ['@textforge/markdown/capability/preview', '@textforge/markdown/capability/local-assets'],
    description: 'Insert a workspace-relative Markdown image reference into the selected TF-MD source.',
    keywords: ['markdown', 'image', 'tf-md', 'snippet'],
    menu: { id: 'markdown', label: 'Markdown', groupOrder: 35, order: 10 },
    toolbar: { order: 50, kind: 'secondary' },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      availableSurfaceIds: ['@textforge/markdown/preview'],
    },
  }),
  createCommand('markdown.insert-mermaid-block', 'Insert Mermaid block', {
    category: 'markdown',
    capabilities: ['@textforge/markdown/capability/preview'],
    description: 'Insert a Mermaid fenced block template into the selected TF-MD source.',
    keywords: ['markdown', 'mermaid', 'diagram', 'tf-md'],
    menu: { id: 'markdown', label: 'Markdown', groupOrder: 35, order: 20 },
    toolbar: { order: 60, kind: 'secondary' },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      availableSurfaceIds: ['@textforge/markdown/preview'],
    },
  }),
  createCommand('markdown.insert-graphviz-block', 'Insert Graphviz block', {
    category: 'markdown',
    capabilities: ['@textforge/markdown/capability/preview'],
    description: 'Insert a Graphviz DOT fenced block template into the selected TF-MD source.',
    keywords: ['markdown', 'graphviz', 'dot', 'diagram', 'tf-md'],
    menu: { id: 'markdown', label: 'Markdown', groupOrder: 35, order: 30 },
    toolbar: { order: 70, kind: 'secondary' },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      availableSurfaceIds: ['@textforge/markdown/preview'],
    },
  }),
  createCommand('markdown.export-print-html', 'Export print HTML', {
    category: 'markdown',
    capabilities: ['@textforge/markdown/capability/preview'],
    description: 'Render the selected Markdown resource into print-optimized HTML and download it.',
    keywords: ['markdown', 'html', 'print', 'export'],
    menu: { id: 'markdown', label: 'Markdown', groupOrder: 35, order: 40 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      availableSurfaceIds: ['@textforge/markdown/preview'],
    },
  }),
  createCommand('markdown.export-generated-diagrams', 'Export generated diagrams', {
    category: 'markdown',
    capabilities: ['@textforge/markdown/capability/preview'],
    description: 'Render Mermaid and Graphviz blocks from the selected Markdown resource into generated SVG and PNG workspace assets.',
    keywords: ['markdown', 'diagram', 'svg', 'png', 'export'],
    menu: { id: 'markdown', label: 'Markdown', groupOrder: 35, order: 50 },
    toolbar: { order: 80, kind: 'primary' },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      availableSurfaceIds: ['@textforge/markdown/preview'],
    },
  }),
];

export const markdownFenceHandlerContributions = [
  createMarkdownFenceHandlerContribution('@textforge/markdown/fence-handler/svg', {
    label: 'Inline SVG fenced block renderer',
    description: 'Render inline SVG fenced blocks directly inside the Markdown preview.',
    localName: 'svg',
    capabilities: ['@textforge/markdown/capability/fence-svg'],
    defaultActive: true,
    provisional: true,
    localArtifactCompatible: true,
    fenceNames: ['svg'],
    render({ content }) {
      return {
        html: renderInlineSvgBlock(content),
        diagnostics: [],
        generatedResources: [],
      };
    },
  }),
  createMarkdownFenceHandlerContribution('@textforge/markdown/fence-handler/json', {
    label: 'JSON fenced block renderer',
    description: 'Render JSON fenced blocks through the provisional Markdown preview dispatcher.',
    localName: 'json',
    capabilities: ['@textforge/markdown/capability/fence-json'],
    defaultActive: true,
    provisional: true,
    localArtifactCompatible: true,
    fenceNames: ['json'],
    render({ content }) {
      const diagnostics = [];
      try {
        JSON.parse(content);
      } catch (error) {
        diagnostics.push(createMarkdownDiagnostic(
          'tfmd.fence.json-invalid',
          error?.message ?? 'Invalid JSON fenced block.',
          'warning',
          {
            origin: {
              fenceName: 'json',
            },
          },
        ));
      }
      return {
        html: renderStaticDataBlock('json', content),
        diagnostics,
        generatedResources: [],
      };
    },
  }),
  createMarkdownFenceHandlerContribution('@textforge/markdown/fence-handler/yaml', {
    label: 'YAML fenced block renderer',
    description: 'Render YAML fenced blocks through the provisional Markdown preview dispatcher.',
    localName: 'yaml',
    capabilities: ['@textforge/markdown/capability/fence-yaml'],
    defaultActive: true,
    provisional: true,
    localArtifactCompatible: true,
    fenceNames: ['yaml'],
    render({ content }) {
      return {
        html: renderStaticDataBlock('yaml', content),
        diagnostics: [],
        generatedResources: [],
      };
    },
  }),
];

export function createMarkdownContributionManifest() {
  return createContributionManifest('@textforge/markdown', {
    capabilities: markdownCapabilities,
    commands: markdownCommandContributions,
    surfaces: [markdownPreviewSurfaceContribution],
    pipelines: [
      {
        id: '@textforge/markdown/preview-html',
        localName: 'preview-html',
        capabilities: ['@textforge/markdown/capability/preview'],
        defaultActive: true,
        input: 'text',
        output: 'html',
      },
    ],
    markdownFenceHandlers: markdownFenceHandlerContributions,
  });
}

export const contributions = createMarkdownContributionManifest();
