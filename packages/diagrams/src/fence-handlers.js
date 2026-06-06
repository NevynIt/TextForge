import { createMarkdownFenceHandlerContribution } from '@textforge/core';
import {
  createDocumentPipelineRunner,
  createPipelineOutputValue,
} from '@textforge/pipeline';

import { createDiagramGeneratedResources } from './generated-resources.js';
import {
  rasterizeSvgToPngBytes,
  renderGraphvizToSvg,
  renderMermaidToSvg,
} from './renderers.js';

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
