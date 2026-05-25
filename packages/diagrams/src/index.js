import mermaid from 'mermaid';
import { instance as createViz } from '@viz-js/viz';
import { createContributionManifest } from '@textforge/core';
import { createGeneratedResourceDescriptor } from '@textforge/pipeline';

let mermaidCounter = 0;
let vizInstancePromise;
let mermaidInitialized = false;

export const diagramPipelineContributions = [
  {
    id: '@textforge/diagrams/mermaid-svg',
    inputKind: 'text',
    outputKind: 'svg',
    description: 'Render Mermaid source to SVG.',
  },
  {
    id: '@textforge/diagrams/graphviz-svg',
    inputKind: 'text',
    outputKind: 'svg',
    description: 'Render Graphviz DOT source to SVG.',
  },
  {
    id: '@textforge/diagrams/svg-png',
    inputKind: 'svg',
    outputKind: 'png',
    description: 'Rasterize generated SVG into PNG bytes locally.',
  },
];

function ensureMermaid() {
  if (mermaidInitialized) {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'neutral',
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
  };
}

export function createGraphvizFenceHandler(pipelineId = '@textforge/diagrams/graphviz-svg') {
  return async function renderGraphvizFence(execution) {
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
  };
}

export function createDiagramFenceHandlers() {
  const graphviz = createGraphvizFenceHandler();
  return {
    mermaid: createMermaidFenceHandler(),
    dot: graphviz,
    graphviz,
  };
}

export function createDiagramContributionManifest() {
  return createContributionManifest('@textforge/diagrams', {
    pipelines: diagramPipelineContributions,
  });
}

export const contributions = createDiagramContributionManifest();
