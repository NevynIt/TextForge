import mermaid from 'mermaid';
import { instance as createViz } from '@viz-js/viz';
import {
  createCapability,
  createContributionManifest,
  createMarkdownFenceHandlerContribution,
  createResourcePredicate,
} from '@textforge/core';
import {
  createDocumentPipelineRunner,
  createGeneratedResourceDescriptor,
  createPipelineOutputValue,
} from '@textforge/pipeline';

let mermaidCounter = 0;
let vizInstancePromise;
let mermaidInitialized = false;
const markdownDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['markdown'],
  mimeTypes: ['text/markdown', 'text/x-markdown'],
  fileExtensions: ['md', 'markdown', 'tfmd'],
});

export const diagramCapabilities = [
  createCapability('@textforge/diagrams/capability/mermaid', {
    description: 'Render Mermaid fenced blocks into SVG or PNG diagram assets.',
    aliases: ['mermaid'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
  createCapability('@textforge/diagrams/capability/graphviz', {
    description: 'Render Graphviz DOT fenced blocks into SVG or PNG diagram assets.',
    aliases: ['dot', 'graphviz.dot'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
];

export const diagramPipelineContributions = [
  {
    id: '@textforge/diagrams/mermaid-svg',
    localName: 'mermaid-svg',
    capabilities: ['@textforge/diagrams/capability/mermaid'],
    defaultActive: true,
    inputKind: 'text',
    outputKind: 'svg',
    description: 'Render Mermaid source to SVG.',
    async run({ input, context }) {
      const svg = await renderMermaidToSvg(readPipelineText(input), {
        document: context?.document,
        id: context?.blockId,
      });
      return {
        output: createPipelineOutputValue('svg', svg, {
          resource: context?.sourceResource,
        }),
      };
    },
  },
  {
    id: '@textforge/diagrams/graphviz-svg',
    localName: 'graphviz-svg',
    capabilities: ['@textforge/diagrams/capability/graphviz'],
    defaultActive: true,
    inputKind: 'text',
    outputKind: 'svg',
    description: 'Render Graphviz DOT source to SVG.',
    async run({ input }) {
      const svg = await renderGraphvizToSvg(readPipelineText(input));
      return {
        output: createPipelineOutputValue('svg', svg),
      };
    },
  },
  {
    id: '@textforge/diagrams/svg-png',
    localName: 'svg-png',
    capabilities: ['@textforge/diagrams/capability/mermaid', '@textforge/diagrams/capability/graphviz'],
    defaultActive: true,
    inputKind: 'svg',
    outputKind: 'png',
    description: 'Rasterize generated SVG into PNG bytes locally.',
    async run({ input, context }) {
      const pngBytes = await rasterizeSvgToPngBytes(readPipelineText(input), {
        document: context?.document,
      });
      return {
        output: createPipelineOutputValue('png', pngBytes),
      };
    },
  },
];

function readPipelineText(input) {
  if (typeof input === 'string') {
    return input;
  }

  if (typeof input?.value === 'string') {
    return input.value;
  }

  throw new Error('Diagram pipeline steps require string-compatible input.');
}

function ensureMermaid() {
  if (mermaidInitialized) {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'dark',
    themeVariables: {
      background: '#0b1020',
      mainBkg: '#182235',
      primaryColor: '#182235',
      primaryTextColor: '#e6edf7',
      primaryBorderColor: '#4fd1c5',
      lineColor: '#7dd3fc',
      textColor: '#e6edf7',
      secondaryColor: '#131b2d',
      secondaryTextColor: '#e6edf7',
      secondaryBorderColor: '#7dd3fc',
      tertiaryColor: '#101728',
      tertiaryTextColor: '#d9e4f2',
      tertiaryBorderColor: '#8fa0b8',
      noteBkgColor: '#1f2937',
      noteTextColor: '#e6edf7',
      clusterBkg: '#101728',
      clusterBorder: '#34425b',
      defaultLinkColor: '#7dd3fc',
      edgeLabelBackground: '#0f1626',
      fontFamily: 'Segoe UI, sans-serif',
      darkMode: true,
    },
  });
  mermaidInitialized = true;
}

async function getVizInstance() {
  vizInstancePromise ??= createViz();
  return vizInstancePromise;
}

function createHiddenHost(targetDocument) {
  const host = targetDocument.createElement('div');
  host.setAttribute('data-textforge-mermaid-host', 'true');
  host.style.position = 'absolute';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.overflow = 'hidden';
  targetDocument.body.append(host);
  return host;
}

function parseSvgDimension(value) {
  const match = String(value ?? '').trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : undefined;
}

function inferSvgSize(svgText) {
  const widthMatch = svgText.match(/\bwidth="([^"]+)"/i);
  const heightMatch = svgText.match(/\bheight="([^"]+)"/i);
  const parsedWidth = parseSvgDimension(widthMatch?.[1]);
  const parsedHeight = parseSvgDimension(heightMatch?.[1]);
  if (parsedWidth && parsedHeight) {
    return { width: parsedWidth, height: parsedHeight };
  }

  const viewBoxMatch = svgText.match(/\bviewBox="([^"]+)"/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/\s+/).map((part) => Number(part));
    if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
      return {
        width: parts[2],
        height: parts[3],
      };
    }
  }

  return { width: 1024, height: 768 };
}

export async function renderMermaidToSvg(source, options = {}) {
  const targetDocument = options.document ?? globalThis.document;
  if (!targetDocument?.body || typeof targetDocument.createElement !== 'function') {
    throw new Error('Mermaid rendering requires a browser document.');
  }

  ensureMermaid();
  const host = createHiddenHost(targetDocument);
  const diagramId = options.id ?? `textforge-mermaid-${++mermaidCounter}`;
  try {
    const result = await mermaid.render(diagramId, source, host);
    return result.svg;
  } finally {
    host.remove();
  }
}

export async function renderGraphvizToSvg(source) {
  const viz = await getVizInstance();
  return viz.renderString(source, {
    format: 'svg',
    engine: 'dot',
  });
}

export async function rasterizeSvgToPngBytes(svgText, options = {}) {
  const targetDocument = options.document ?? globalThis.document;
  if (!targetDocument?.createElement || !globalThis.Image) {
    throw new Error('SVG rasterization requires browser image and canvas support.');
  }

  const { width, height } = inferSvgSize(svgText);
  const canvas = targetDocument.createElement('canvas');
  canvas.width = Math.max(1, Math.round(options.width ?? width));
  canvas.height = Math.max(1, Math.round(options.height ?? height));
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context is unavailable for SVG rasterization.');
  }

  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  const image = new Image();
  image.decoding = 'async';
  await new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load generated SVG into the rasterization pipeline.'));
    image.src = svgUrl;
  });

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    throw new Error('Canvas could not produce a PNG blob.');
  }

  return new Uint8Array(await blob.arrayBuffer());
}

export function createGeneratedDiagramPath(basePath, blockKind, blockId, extension) {
  const normalizedBase = String(basePath ?? '/generated/diagram').replaceAll('\\', '/').replace(/\/+$/, '');
  return `${normalizedBase}-${blockKind}-${blockId}.${extension}`;
}

export function createDiagramGeneratedResources(input) {
  const svgPath = createGeneratedDiagramPath(
    input.generatedAssetBasePath,
    input.blockKind,
    input.blockId,
    'svg',
  );
  const resources = [
    createGeneratedResourceDescriptor({
      path: svgPath,
      title: svgPath.split('/').pop(),
      representation: 'text',
      mimeType: 'image/svg+xml',
      languageId: 'svg',
      text: input.svg,
      format: 'svg',
      pipelineId: input.pipelineId,
      sourceResourceId: input.sourceResource?.resourceId,
      sourcePath: input.sourceResource?.path,
      sourceUpdatedAt: input.sourceUpdatedAt,
      blockId: input.blockId,
      blockKind: input.blockKind,
    }),
  ];

  if (input.pngBytes instanceof Uint8Array) {
    resources.push(
      createGeneratedResourceDescriptor({
        path: createGeneratedDiagramPath(
          input.generatedAssetBasePath,
          input.blockKind,
          input.blockId,
          'png',
        ),
        title: createGeneratedDiagramPath(
          input.generatedAssetBasePath,
          input.blockKind,
          input.blockId,
          'png',
        ).split('/').pop(),
        representation: 'bytes',
        mimeType: 'image/png',
        bytes: input.pngBytes,
        format: 'png',
        pipelineId: input.pipelineId,
        sourceResourceId: input.sourceResource?.resourceId,
        sourcePath: input.sourceResource?.path,
        sourceUpdatedAt: input.sourceUpdatedAt,
        blockId: input.blockId,
        blockKind: input.blockKind,
      }),
    );
  }

  return resources;
}

export function createMermaidFenceHandler() {
  return async function renderMermaidFence(execution) {
    const pipelineRunner = execution.pipelineRunner
      ?? (execution.contributionContext
        ? createDocumentPipelineRunner({
          contributionContext: execution.contributionContext,
        })
        : undefined);
    if (!pipelineRunner) {
      const svg = await renderMermaidToSvg(execution.content, {
        document: execution.document,
        id: execution.blockId,
      });
      const pngBytes = execution.includePng
        ? await rasterizeSvgToPngBytes(svg, { document: execution.document })
        : undefined;
      return {
        html: svg,
        svg,
        generatedResources: execution.generatedAssetBasePath
          ? createDiagramGeneratedResources({
            svg,
            pngBytes,
            blockId: execution.blockId,
            blockKind: 'mermaid',
            generatedAssetBasePath: execution.generatedAssetBasePath,
            pipelineId: '@textforge/diagrams/mermaid-svg',
            sourceResource: execution.sourceResource,
            sourceUpdatedAt: execution.sourceUpdatedAt,
          })
          : [],
      };
    }

    const pipelineResult = await pipelineRunner.run(
      createPipelineOutputValue('text', execution.content, {
        resource: execution.sourceResource,
      }),
      {
        context: {
          blockId: execution.blockId,
          blockKind: execution.blockKind,
          document: execution.document,
          sourceResource: execution.sourceResource,
        },
        steps: execution.includePng
          ? ['mermaid-svg', 'svg-png']
          : ['mermaid-svg'],
      },
    );
    const svg = pipelineResult.intermediateValues.find((value) => value.stepId === '@textforge/diagrams/mermaid-svg')?.value?.value
      ?? pipelineResult.intermediateValues.find((value) => value.contributionId === '@textforge/diagrams/mermaid-svg')?.value?.value
      ?? pipelineResult.value?.value;
    const pngBytes = execution.includePng
      ? pipelineResult.intermediateValues.find((value) => value.contributionId === '@textforge/diagrams/svg-png')?.value?.value
      : undefined;
    if (typeof svg !== 'string') {
      throw new Error('Mermaid pipeline did not produce an SVG intermediate.');
    }
    return {
      html: svg,
      svg,
      diagnostics: pipelineResult.diagnostics,
      generatedResources: execution.generatedAssetBasePath
        ? createDiagramGeneratedResources({
          svg,
          pngBytes,
          blockId: execution.blockId,
          blockKind: 'mermaid',
          generatedAssetBasePath: execution.generatedAssetBasePath,
          pipelineId: '@textforge/diagrams/mermaid-svg',
          sourceResource: execution.sourceResource,
          sourceUpdatedAt: execution.sourceUpdatedAt,
        })
        : [],
    };
  };
}

export function createGraphvizFenceHandler(pipelineId = '@textforge/diagrams/graphviz-svg') {
  return async function renderGraphvizFence(execution) {
    const pipelineRunner = execution.pipelineRunner
      ?? (execution.contributionContext
        ? createDocumentPipelineRunner({
          contributionContext: execution.contributionContext,
        })
        : undefined);
    if (!pipelineRunner) {
      const svg = await renderGraphvizToSvg(execution.content);
      const pngBytes = execution.includePng
        ? await rasterizeSvgToPngBytes(svg, { document: execution.document })
        : undefined;
      return {
        html: svg,
        svg,
        generatedResources: execution.generatedAssetBasePath
          ? createDiagramGeneratedResources({
            svg,
            pngBytes,
            blockId: execution.blockId,
            blockKind: execution.blockKind,
            generatedAssetBasePath: execution.generatedAssetBasePath,
            pipelineId,
            sourceResource: execution.sourceResource,
            sourceUpdatedAt: execution.sourceUpdatedAt,
          })
          : [],
      };
    }

    const pipelineResult = await pipelineRunner.run(
      createPipelineOutputValue('text', execution.content, {
        resource: execution.sourceResource,
      }),
      {
        context: {
          blockId: execution.blockId,
          blockKind: execution.blockKind,
          document: execution.document,
          sourceResource: execution.sourceResource,
        },
        steps: execution.includePng
          ? ['graphviz-svg', 'svg-png']
          : ['graphviz-svg'],
      },
    );
    const svg = pipelineResult.intermediateValues.find((value) => value.contributionId === pipelineId)?.value?.value
      ?? pipelineResult.value?.value;
    const pngBytes = execution.includePng
      ? pipelineResult.intermediateValues.find((value) => value.contributionId === '@textforge/diagrams/svg-png')?.value?.value
      : undefined;
    if (typeof svg !== 'string') {
      throw new Error('Graphviz pipeline did not produce an SVG intermediate.');
    }
    return {
      html: svg,
      svg,
      diagnostics: pipelineResult.diagnostics,
      generatedResources: execution.generatedAssetBasePath
        ? createDiagramGeneratedResources({
          svg,
          pngBytes,
          blockId: execution.blockId,
          blockKind: execution.blockKind,
          generatedAssetBasePath: execution.generatedAssetBasePath,
          pipelineId,
          sourceResource: execution.sourceResource,
          sourceUpdatedAt: execution.sourceUpdatedAt,
        })
        : [],
    };
  };
}

export const diagramFenceHandlerContributions = [
  createMarkdownFenceHandlerContribution('@textforge/diagrams/fence-handler/mermaid', {
    label: 'Mermaid fenced block renderer',
    description: 'Render Mermaid fenced blocks through the diagrams package.',
    localName: 'mermaid',
    capabilities: ['@textforge/diagrams/capability/mermaid'],
    defaultActive: true,
    provisional: true,
    localArtifactCompatible: true,
    fenceNames: ['mermaid'],
    render: createMermaidFenceHandler(),
  }),
  createMarkdownFenceHandlerContribution('@textforge/diagrams/fence-handler/graphviz', {
    label: 'Graphviz fenced block renderer',
    description: 'Render DOT and Graphviz fenced blocks through the diagrams package.',
    localName: 'graphviz',
    capabilities: ['@textforge/diagrams/capability/graphviz'],
    defaultActive: true,
    provisional: true,
    localArtifactCompatible: true,
    fenceNames: ['dot', 'graphviz'],
    render: createGraphvizFenceHandler(),
  }),
];

export function createDiagramFenceHandlers() {
  const handlers = {};
  for (const contribution of diagramFenceHandlerContributions) {
    for (const fenceName of contribution.fenceNames ?? []) {
      handlers[fenceName] = contribution.render;
    }
  }
  return handlers;
}

export function createDiagramContributionManifest() {
  return createContributionManifest('@textforge/diagrams', {
    capabilities: diagramCapabilities,
    pipelines: diagramPipelineContributions,
    markdownFenceHandlers: diagramFenceHandlerContributions,
  });
}

export const contributions = createDiagramContributionManifest();
