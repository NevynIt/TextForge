import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItKatex from 'markdown-it-katex';
import {
  createCapability,
  createCommand,
  createContributionManifest,
  createDiagnostic,
  createMarkdownFenceHandlerContribution,
  createResourcePredicate,
} from '@textforge/core';
import { createDocumentPipelineRunner } from '@textforge/pipeline';

export const tfmdFenceAliases = ['tf-md', 'tfmd', 'textforge-md', 'textforge-markdown'];
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

function createMarkdownDiagnostic(code, message, severity = 'information', overrides = {}) {
  return createDiagnostic(message, severity, {
    code,
    origin: {
      packageId: '@textforge/markdown',
      subsystem: 'tfmd',
      ...overrides.origin,
    },
    ...overrides,
  });
}

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

function slugifyHeading(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function parseScalar(value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  if (trimmed === 'null') {
    return null;
  }

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
    return trimmed.slice(1, -1);
  }

  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && trimmed !== '') {
    return asNumber;
  }

  return trimmed;
}

function parseStructuredBlock(blockSource) {
  const object = {};
  for (const rawLine of blockSource.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const separator = line.indexOf(':');
    if (separator <= 0) {
      throw new Error(`Invalid structured TF-MD line: ${line}`);
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    object[key] = parseScalar(value);
  }
  return object;
}

function parseControlBlock(blockSource, diagnostics) {
  const metadata = {};
  const styles = {};
  const requirements = [];
  const lines = blockSource.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    index += 1;
    if (!line) {
      continue;
    }

    if (!line.startsWith('%')) {
      diagnostics.push(createMarkdownDiagnostic(
        'tfmd.directive.invalid-line',
        `Invalid TF-MD directive line: ${line}`,
        'error',
      ));
      continue;
    }

    const match = line.match(/^%([A-Za-z][A-Za-z0-9_-]*)(?:\s+([^{]+?))?\s*(\{)?\s*$/);
    if (!match) {
      diagnostics.push(createMarkdownDiagnostic(
        'tfmd.directive.invalid-syntax',
        `Invalid TF-MD directive syntax: ${line}`,
        'error',
      ));
      continue;
    }

    const [, directiveName, directiveValue = '', opensBlock] = match;
    let blockContent = '';
    if (opensBlock) {
      while (index < lines.length) {
        const blockLine = lines[index];
        index += 1;
        if (blockLine.trim() === '}') {
          break;
        }
        blockContent += `${blockLine}\n`;
      }
    }

    try {
      switch (directiveName) {
        case 'metadata':
          Object.assign(metadata, parseStructuredBlock(blockContent));
          break;
        case 'style': {
          const selector = directiveValue.trim();
          if (!selector.startsWith('.')) {
            throw new Error(`Unsupported TF-MD style selector: ${selector || '(empty)'}`);
          }

          const styleName = selector.slice(1);
          styles[styleName] = {
            ...(styles[styleName] ?? {}),
            ...parseStructuredBlock(blockContent),
          };
          break;
        }
        case 'require': {
          const [name, versionRange] = directiveValue.trim().split(/\s+/, 2);
          if (!name) {
            throw new Error('A %require directive must name a capability.');
          }

          requirements.push({
            name,
            versionRange,
            source: 'document',
          });
          break;
        }
        default:
          diagnostics.push(createMarkdownDiagnostic(
            'tfmd.directive.unsupported',
            `Unsupported TF-MD directive: %${directiveName}`,
            'warning',
            {
              origin: {
                directive: directiveName,
              },
            },
          ));
          break;
      }
    } catch (error) {
      diagnostics.push(createMarkdownDiagnostic(
        'tfmd.directive.parse-failed',
        error?.message ?? `Failed to parse %${directiveName}`,
        'error',
        {
          origin: {
            directive: directiveName,
          },
        },
      ));
    }
  }

  return {
    metadata,
    requirements,
    styles,
  };
}

function scanTfmdBlocks(source) {
  const diagnostics = [];
  const metadata = {};
  const requirements = [];
  const styles = {};
  const fencePattern = /```([^\n]+)\r?\n([\s\S]*?)\r?\n```/g;
  let lastIndex = 0;
  let stripped = '';
  for (const match of source.matchAll(fencePattern)) {
    const [rawBlock, infoString, blockBody] = match;
    const normalizedInfo = infoString.trim().toLowerCase();
    const blockIndex = match.index ?? 0;
    stripped += source.slice(lastIndex, blockIndex);
    lastIndex = blockIndex + rawBlock.length;
    if (!tfmdFenceAliases.includes(normalizedInfo)) {
      stripped += rawBlock;
      continue;
    }

    const parsed = parseControlBlock(blockBody, diagnostics);
    Object.assign(metadata, parsed.metadata);
    requirements.push(...parsed.requirements);
    for (const [styleName, styleRules] of Object.entries(parsed.styles)) {
      styles[styleName] = {
        ...(styles[styleName] ?? {}),
        ...styleRules,
      };
    }
    stripped += '\n';
  }

  stripped += source.slice(lastIndex);
  return {
    source: stripped,
    metadata,
    requirements,
    styles,
    diagnostics,
  };
}

export function parseMarkdownCapabilityRequirements(source = '') {
  return scanTfmdBlocks(source).requirements;
}

function replaceInlineStyleSpans(source) {
  return source.replace(/\[([^\]]+)\]\{((?:\s*\.[A-Za-z][A-Za-z0-9_-]*)+)\}/g, (_match, text, classes) => {
    const className = classes
      .trim()
      .split(/\s+/)
      .map((value) => value.replace(/^\./, ''))
      .join(' ');
    return `<span class="${escapeHtml(className)}">${escapeHtml(text)}</span>`;
  });
}

function extractTrailingAttributes(content) {
  const match = content.match(/\s*\{([^}]+)\}\s*$/);
  if (!match) {
    return undefined;
  }

  const attributes = match[1].trim().split(/\s+/);
  const anchor = attributes.find((attribute) => attribute.startsWith('#'))?.slice(1);
  const classes = attributes
    .filter((attribute) => attribute.startsWith('.'))
    .map((attribute) => attribute.slice(1));
  if (!anchor && classes.length === 0) {
    return undefined;
  }

  return {
    marker: match[0],
    content: content.slice(0, content.length - match[0].length).trimEnd(),
    anchor,
    classes,
    rawAttributes: attributes,
  };
}

function stripTrailingMarkerFromChildren(children, marker) {
  if (!Array.isArray(children)) {
    return;
  }

  for (let index = children.length - 1; index >= 0; index -= 1) {
    const child = children[index];
    if (child.type === 'text' && child.content.endsWith(marker)) {
      child.content = child.content.slice(0, child.content.length - marker.length).trimEnd();
      break;
    }
  }
}

function createMarkdownItEnvironment(baseEnvironment) {
  return {
    diagnostics: [...(baseEnvironment.diagnostics ?? [])],
    referencedAssets: [...(baseEnvironment.referencedAssets ?? [])],
    generatedResources: [...(baseEnvironment.generatedResources ?? [])],
    sourceResource: baseEnvironment.sourceResource,
    resolveAssetReference: baseEnvironment.resolveAssetReference,
  };
}

function createMarkdownProcessor(environment) {
  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });
  markdown.use(markdownItFootnote);
  markdown.use(markdownItAnchor, {
    slugify: slugifyHeading,
  });
  markdown.use(markdownItKatex);

  markdown.core.ruler.after('inline', 'tfmd-attributes', (state) => {
    const env = state.env;
    for (let index = 0; index < state.tokens.length; index += 1) {
      const inlineToken = state.tokens[index];
      if (inlineToken.type !== 'inline') {
        continue;
      }

      const openToken = state.tokens[index - 1];
      if (!openToken || (openToken.type !== 'heading_open' && openToken.type !== 'paragraph_open')) {
        continue;
      }

      const extracted = extractTrailingAttributes(inlineToken.content);
      if (!extracted) {
        continue;
      }

      inlineToken.content = extracted.content;
      stripTrailingMarkerFromChildren(inlineToken.children, extracted.marker);
      if (extracted.anchor) {
        if (openToken.type === 'heading_open') {
          openToken.attrSet('id', extracted.anchor);
        } else {
          env.diagnostics.push(createMarkdownDiagnostic(
            'tfmd.anchor.paragraph-unsupported',
            `Paragraph attribute anchors are not supported in the TF-MD baseline: ${extracted.anchor}`,
            'warning',
          ));
        }
      }

      if (extracted.classes.length > 0) {
        openToken.attrJoin('class', extracted.classes.join(' '));
      }
    }
  });

  const defaultImageRenderer = markdown.renderer.rules.image ?? ((tokens, idx, options, env, self) =>
    self.renderToken(tokens, idx, options));
  markdown.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = token.attrGet('src') ?? '';
    const resolved = env.resolveAssetReference?.({
      sourceResource: env.sourceResource,
      href,
    });
    if (resolved?.resolvedSrc) {
      token.attrSet('src', resolved.resolvedSrc);
      env.referencedAssets.push(resolved);
    } else {
      env.diagnostics.push(createMarkdownDiagnostic(
        'tfmd.asset.unresolved',
        `Unable to resolve Markdown asset reference: ${href}`,
        'warning',
        {
          origin: {
            subsystem: 'asset-resolution',
          },
        },
      ));
    }

    return defaultImageRenderer(tokens, idx, options, env, self);
  };

  return markdown;
}

function renderStaticDataBlock(kind, content) {
  return `
<div class="tfmd-block tfmd-block--${kind}">
  <pre><code class="language-${kind}">${escapeHtml(content)}</code></pre>
</div>
`.trim();
}

function renderInlineSvgBlock(content) {
  return `
<figure class="tfmd-block tfmd-block--svg">
  <div class="tfmd-svg-block">${content}</div>
</figure>
`.trim();
}

function renderDiagramBlock(kind, html, blockId) {
  return `
<figure class="tfmd-block tfmd-block--${kind}" data-block-id="${escapeHtml(blockId)}">
  ${html}
</figure>
`.trim();
}

function parseFenceInfo(rawInfo) {
  const trimmed = String(rawInfo ?? '').trim();
  if (!trimmed) {
    return {
      rawInfo: '',
      kind: '',
      parameters: {},
    };
  }

  const [kindToken, ...parameterTokens] = trimmed.split(/\s+/);
  const parameters = {};
  for (const token of parameterTokens) {
    const separatorIndex = token.indexOf('=');
    if (separatorIndex > 0) {
      const key = token.slice(0, separatorIndex).trim();
      const rawValue = token.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');
      if (key) {
        parameters[key] = value;
      }
      continue;
    }

    if (token.trim()) {
      parameters[token.trim()] = true;
    }
  }

  return {
    rawInfo: trimmed,
    kind: kindToken.toLowerCase(),
    parameters,
  };
}

async function resolveKnownFencedBlocks(source, options, environment) {
  const fenceHandlerRegistry = resolveMarkdownFenceHandlerRegistry(options);
  if (fenceHandlerRegistry.diagnostics?.length) {
    environment.diagnostics.push(...fenceHandlerRegistry.diagnostics);
  }
  const fencePattern = /```([^\n]+)\r?\n([\s\S]*?)\r?\n```/g;
  let output = '';
  let blockCounter = 0;
  let lastIndex = 0;
  const sharedState = {};

  for (const match of source.matchAll(fencePattern)) {
    const [rawFence, rawInfo, blockContent] = match;
    const blockIndex = match.index ?? 0;
    const fence = parseFenceInfo(rawInfo);
    const kind = fence.kind;
    output += source.slice(lastIndex, blockIndex);
    lastIndex = blockIndex + rawFence.length;

    if (tfmdFenceAliases.includes(kind)) {
      output += rawFence;
      continue;
    }

    const handlerContribution = fenceHandlerRegistry.handlers[kind];
    if (!handlerContribution?.render) {
      if (fenceHandlerRegistry.knownFenceNames?.has(kind)) {
        environment.diagnostics.push(createMarkdownDiagnostic(
          'tfmd.fence.handler-unavailable',
          `No active renderer is available for the ${kind} fenced block.`,
          'warning',
          {
            origin: {
              fenceName: kind,
            },
          },
        ));
      }
      output += rawFence;
      continue;
    }

    const blockId = `tfmd-block-${++blockCounter}`;
    try {
      const result = await handlerContribution.render({
        content: blockContent,
        blockId,
        blockKind: kind,
        fence,
        contributionContext: options.contributionContext,
        contributionRegistry: options.contributionRegistry,
        sourceResource: options.resource,
        sourceUpdatedAt: options.sourceUpdatedAt,
        generatedAssetBasePath: options.fenceExecutionOptions?.generatedAssetBasePath,
        includePng: options.fenceExecutionOptions?.includePng,
        document: options.fenceExecutionOptions?.document,
        hostServices: options.fenceExecutionOptions?.hostServices,
        sharedState,
        pipelineRunner: options.pipelineRunner,
      });
      if (result.diagnostics?.length) {
        environment.diagnostics.push(...result.diagnostics);
      }
      if (result.generatedResources?.length) {
        environment.generatedResources.push(...result.generatedResources);
      }
      output += renderDiagramBlock(kind, result.html, blockId);
    } catch (error) {
      environment.diagnostics.push(createMarkdownDiagnostic(
        'tfmd.fence.render-failed',
        error?.message ?? `Failed to render ${kind} block.`,
        'warning',
        {
          origin: {
            contributionId: handlerContribution.id,
            fenceName: kind,
          },
        },
      ));
      output += rawFence;
    }
  }

  output += source.slice(lastIndex);
  return output;
}

function resolveMarkdownFenceHandlerRegistry(options = {}) {
  if (options.contributionContext?.activeMarkdownFenceHandlers?.length) {
    const handlers = {};
    const knownFenceNames = new Set();
    for (const contribution of options.contributionContext.activeMarkdownFenceHandlers) {
      for (const fenceName of contribution.fenceNames ?? []) {
        const normalizedFenceName = String(fenceName).trim().toLowerCase();
        knownFenceNames.add(normalizedFenceName);
        handlers[normalizedFenceName] = contribution;
      }
    }
    return {
      diagnostics: options.contributionContext.diagnostics ?? [],
      knownFenceNames,
      handlers,
    };
  }

  if (options.contributionRegistry?.createMarkdownFenceHandlerMap) {
    return options.contributionRegistry.createMarkdownFenceHandlerMap(options.contributionContext);
  }

  const compatibilityHandlers = Object.entries(options.fenceHandlers ?? {}).reduce((accumulator, [fenceName, handler]) => {
    accumulator[String(fenceName).trim().toLowerCase()] = {
      id: `compatibility:${fenceName}`,
      render: handler,
    };
    return accumulator;
  }, {});

  const builtInHandlers = markdownFenceHandlerContributions.reduce((accumulator, contribution) => {
    for (const fenceName of contribution.fenceNames ?? []) {
      accumulator[String(fenceName).trim().toLowerCase()] = contribution;
    }
    return accumulator;
  }, {});

  return {
    diagnostics: [],
    knownFenceNames: new Set(Object.keys({
      ...builtInHandlers,
      ...compatibilityHandlers,
    })),
    handlers: {
      ...builtInHandlers,
      ...compatibilityHandlers,
    },
  };
}

function createTfmdStyleSheet(styles) {
  return Object.entries(styles)
    .map(([styleName, properties]) => {
      const declarations = Object.entries(properties)
        .map(([key, value]) => `${key}: ${String(value)};`)
        .join(' ');
      return `.tfmd-preview .${styleName} { ${declarations} }`;
    })
    .join('\n');
}

export function createPrintOptimizedHtmlDocument(result, options = {}) {
  const title = options.title ?? String(result.metadata.title ?? 'TextForge Markdown');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0 auto;
        max-width: 880px;
        padding: 40px 48px 72px;
        font-family: Georgia, "Times New Roman", serif;
        line-height: 1.6;
        color: #172033;
        background: #ffffff;
      }
      img, svg {
        max-width: 100%;
      }
      pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        background: #f3f4f6;
        padding: 16px;
        border-radius: 12px;
      }
      figure {
        margin: 24px 0;
      }
      ${result.styleSheet}
    </style>
  </head>
  <body>
    ${result.bodyHtml}
  </body>
</html>`;
}

export async function renderMarkdownDocument(source, options = {}) {
  const scanned = scanTfmdBlocks(source);
  const contributionContext = options.contributionContext
    ?? (options.contributionRegistry?.resolveDocumentContext
      ? options.contributionRegistry.resolveDocumentContext({
        document: options.resource,
        explicitRequirements: scanned.requirements,
      })
      : undefined);
  const pipelineRunner = options.pipelineRunner
    ?? (contributionContext
      ? createDocumentPipelineRunner({
        contributionContext,
        now: options.now,
      })
      : undefined);
  const environment = createMarkdownItEnvironment({
    diagnostics: [
      ...scanned.diagnostics,
      ...(contributionContext?.diagnostics ?? []),
    ],
    sourceResource: options.resource,
    resolveAssetReference: options.resolveAssetReference,
  });
  const preprocessedSource = replaceInlineStyleSpans(scanned.source);
  const resolvedSource = await resolveKnownFencedBlocks(preprocessedSource, {
    ...options,
    contributionContext,
    pipelineRunner,
  }, environment);
  const markdown = createMarkdownProcessor(environment);
  const bodyHtml = markdown.render(resolvedSource, environment);
  const styleSheet = createTfmdStyleSheet(scanned.styles);
  const html = `
<article class="tfmd-preview">
  ${styleSheet ? `<style>${styleSheet}</style>` : ''}
  ${bodyHtml}
</article>
`.trim();
  const result = {
    html,
    bodyHtml,
    printHtml: '',
    resolvedSource,
    metadata: scanned.metadata,
    styles: scanned.styles,
    styleSheet,
    diagnostics: environment.diagnostics,
    referencedAssets: environment.referencedAssets,
    generatedResources: environment.generatedResources,
    capabilityContext: contributionContext,
  };
  return {
    ...result,
    printHtml: createPrintOptimizedHtmlDocument(result, {
      title: String(scanned.metadata.title ?? options.resource?.path ?? 'TextForge Markdown'),
    }),
  };
}

export function createMarkdownPreviewModel(source, result, options = {}) {
  const resourceTitle = options.resource?.path ?? 'Markdown preview';
  return {
    id: `markdown-preview:${options.resource?.resourceId ?? 'virtual'}`,
    title: resourceTitle,
    summary: `Markdown preview with ${result.diagnostics.length} diagnostics and ${result.generatedResources.length} generated diagram artifacts.`,
    html: result.html,
    diagnostics: result.diagnostics,
    metadata: result.metadata,
    referencedAssets: result.referencedAssets,
    generatedResources: result.generatedResources,
  };
}

export function createMarkdownPreviewSurface(source, result, options = {}) {
  const model = createMarkdownPreviewModel(source, result, options);
  return {
    id: model.id,
    contribution: markdownPreviewSurfaceContribution,
    model,
    mount(container) {
      container.innerHTML = model.html;
      return () => {
        container.innerHTML = '';
      };
    },
  };
}

export function createMarkdownSnippet(kind, options = {}) {
  switch (kind) {
    case 'image':
      return `\n![${options.alt ?? 'Diagram'}](${options.href ?? 'generated/example.svg'})\n`;
    case 'mermaid':
      return '\n```mermaid\nflowchart TD\n  A[Need] --> B[Capability]\n  B --> C[Roadmap]\n```\n';
    case 'graphviz':
      return '\n```graphviz\ndigraph G {\n  Start -> Review;\n  Review -> Done;\n}\n```\n';
    default:
      return '\n';
  }
}
