import { markdownFenceHandlerContributions } from './contributions.js';
import {
  createMarkdownDiagnostic,
  emitMarkdownTrace,
  escapeHtml,
  tfmdFenceAliases,
} from './support.js';

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

export async function resolveKnownFencedBlocks(source, options, environment) {
  emitMarkdownTrace(options, 'resolveKnownFencedBlocks:start', {
    sourceLength: source.length,
  });
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
      emitMarkdownTrace(options, 'resolveKnownFencedBlocks:fence-start', {
        blockId,
        kind,
        contentLength: blockContent.length,
      });
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
      emitMarkdownTrace(options, 'resolveKnownFencedBlocks:fence-done', {
        blockId,
        kind,
        generatedResources: result.generatedResources?.length ?? 0,
        diagnostics: result.diagnostics?.length ?? 0,
      });
      output += renderDiagramBlock(kind, result.html, blockId);
    } catch (error) {
      emitMarkdownTrace(options, 'resolveKnownFencedBlocks:fence-error', {
        blockId,
        kind,
        message: error?.message ?? String(error),
      });
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
  emitMarkdownTrace(options, 'resolveKnownFencedBlocks:done', {
    outputLength: output.length,
    fenceCount: blockCounter,
  });
  return output;
}
