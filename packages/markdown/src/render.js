import { createDocumentPipelineRunner } from '@textforge/pipeline';

import { resolveKnownFencedBlocks } from './fences.js';
import { createPrintOptimizedHtmlDocument } from './html.js';
import {
  createMarkdownItEnvironment,
  createMarkdownProcessor,
  replaceInlineStyleSpans,
} from './processor.js';
import { emitMarkdownTrace } from './support.js';
import { createTfmdStyleSheet, scanTfmdBlocks } from './tfmd.js';

export async function renderMarkdownDocument(source, options = {}) {
  emitMarkdownTrace(options, 'renderMarkdownDocument:start', {
    sourceLength: source.length,
    resourcePath: options.resource?.path,
  });
  const scanned = scanTfmdBlocks(source);
  emitMarkdownTrace(options, 'renderMarkdownDocument:scanned', {
    strippedLength: scanned.source.length,
    diagnostics: scanned.diagnostics.length,
    requirements: scanned.requirements.length,
    styles: Object.keys(scanned.styles).length,
  });
  const contributionContext = options.contributionContext
    ?? (options.contributionRegistry?.resolveDocumentContext
      ? options.contributionRegistry.resolveDocumentContext({
        document: options.resource,
        explicitRequirements: scanned.requirements,
      })
      : undefined);
  emitMarkdownTrace(options, 'renderMarkdownDocument:context', {
    activeCapabilities: contributionContext?.activeCapabilityIds?.length ?? 0,
    activeFenceHandlers: contributionContext?.activeMarkdownFenceHandlers?.length ?? 0,
    diagnostics: contributionContext?.diagnostics?.length ?? 0,
  });
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
  emitMarkdownTrace(options, 'renderMarkdownDocument:fences-resolved', {
    resolvedSourceLength: resolvedSource.length,
    diagnostics: environment.diagnostics.length,
    generatedResources: environment.generatedResources.length,
  });
  const markdown = createMarkdownProcessor(environment);
  emitMarkdownTrace(options, 'renderMarkdownDocument:markdown-render:start', {
    resolvedSourceLength: resolvedSource.length,
  });
  const bodyHtml = markdown.render(resolvedSource, environment);
  emitMarkdownTrace(options, 'renderMarkdownDocument:markdown-render:done', {
    bodyHtmlLength: bodyHtml.length,
    diagnostics: environment.diagnostics.length,
    referencedAssets: environment.referencedAssets.length,
  });
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
