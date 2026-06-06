import { createPipelineOutputValue } from '@textforge/pipeline';

import {
  rasterizeSvgToPngBytes,
  renderGraphvizToSvg,
  renderMermaidToSvg,
} from './renderers.js';

export function readPipelineText(input) {
  if (typeof input === 'string') {
    return input;
  }

  if (typeof input?.value === 'string') {
    return input.value;
  }

  throw new Error('Diagram pipeline steps require string-compatible input.');
}

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
