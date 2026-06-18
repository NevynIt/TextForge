import { createDocumentPipelineRunner } from '@textforge/pipeline';

import { resolveKnownFencedBlocks } from './fences.js';
import { createPrintOptimizedHtmlDocument } from './html.js';
import {
  createMarkdownItEnvironment,
  createMarkdownProcessor,
  replaceInlineStyleSpans,
} from './processor.js';
import { emitMarkdownTrace } from './support.js';
import { preprocessMdppDocument } from './mdpp.js';
import { createTfmdStyleSheet, scanTfmdBlocks } from './tfmd.js';

export async function renderMarkdownDocument(source, options = {}) {
  emitMarkdownTrace(options, 'renderMarkdownDocument:start', {
    sourceLength: source.length,
    resourcePath: options.resource?.path,
  });
  const mdpp = await preprocessMdppDocument(source, options);
  emitMarkdownTrace(options, 'renderMarkdownDocument:mdpp-preprocessed', {
    profile: mdpp.profile,
    sourceLength: mdpp.source.length,
    diagnostics: mdpp.diagnostics.length,
    requirements: mdpp.requirements.length,
  });
  const scanned = scanTfmdBlocks(mdpp.source);
  const metadata = {
    ...scanned.metadata,
    ...mdpp.metadata,
  };
  const requirements = [
    ...scanned.requirements,
    ...mdpp.requirements,
  ];
  const profile = mdpp.profile === 'mdpp'
    ? 'mdpp'
    : scanned.requirements.length > 0 || Object.keys(scanned.metadata).length > 0 || Object.keys(scanned.styles).length > 0
      ? 'tfmd'
      : 'markdown';
  emitMarkdownTrace(options, 'renderMarkdownDocument:scanned', {
    strippedLength: scanned.source.length,
    diagnostics: scanned.diagnostics.length,
    requirements: requirements.length,
    styles: Object.keys(scanned.styles).length,
  });
  const contributionContext = options.contributionContext
    ?? (options.contributionRegistry?.resolveDocumentContext
      ? options.contributionRegistry.resolveDocumentContext({
        document: options.resource,
        explicitRequirements: requirements,
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
      ...mdpp.diagnostics,
      ...scanned.diagnostics,
      ...(contributionContext?.diagnostics ?? []),
    ],
    profile,
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
  const styleSheet = [
    mdpp.styleSheet,
    createTfmdStyleSheet(scanned.styles),
  ].filter(Boolean).join('\n');
  const articleClass = profile === 'mdpp'
    ? 'tfmd-preview mdpp-document'
    : 'tfmd-preview';
  const html = `
<article class="${articleClass}">
  ${styleSheet ? `<style>${styleSheet}</style>` : ''}
  ${bodyHtml}
</article>
`.trim();
  const result = {
    html,
    bodyHtml,
    printHtml: '',
    resolvedSource,
    profile,
    metadata,
    styles: scanned.styles,
    styleSheet,
    diagnostics: environment.diagnostics,
    referencedAssets: environment.referencedAssets,
    generatedResources: environment.generatedResources,
    capabilityContext: contributionContext,
    mdpp: mdpp.mdpp
      ? {
        ...mdpp.mdpp,
        models: environment.mdppModels ?? mdpp.mdpp.models,
      }
      : undefined,
  };
  return {
    ...result,
    printHtml: createPrintOptimizedHtmlDocument(result, {
      title: String(metadata.title ?? options.resource?.path ?? 'TextForge Markdown'),
    }),
  };
}
