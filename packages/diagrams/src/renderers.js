import mermaid from 'mermaid';
import { instance as createViz } from '@viz-js/viz';

let mermaidCounter = 0;
let vizInstancePromise;
let mermaidInitialized = false;

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
  host.style.width = '1200px';
  host.style.height = '900px';
  host.style.overflow = 'hidden';
  host.style.visibility = 'hidden';
  targetDocument.body.append(host);
  return host;
}

function createMermaidRenderId(baseId) {
  const prefix = String(baseId ?? 'textforge-mermaid')
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'textforge-mermaid';
  return `${prefix}-render-${++mermaidCounter}`;
}

export function hasRenderedSvgPayload(svgText) {
  const content = String(svgText ?? '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<defs\b[\s\S]*?<\/defs>/gi, '')
    .replace(/<title\b[\s\S]*?<\/title>/gi, '')
    .replace(/<desc\b[\s\S]*?<\/desc>/gi, '');
  return /<(path|rect|circle|ellipse|line|polyline|polygon|text|foreignObject|image)\b/i.test(content);
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
  const diagramId = createMermaidRenderId(options.id);
  try {
    const result = await mermaid.render(diagramId, source, host);
    if (!hasRenderedSvgPayload(result.svg)) {
      throw new Error('Mermaid produced an empty SVG. The render output had no visible SVG payload.');
    }
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

  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const image = new Image();
  image.decoding = 'async';
  try {
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
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
