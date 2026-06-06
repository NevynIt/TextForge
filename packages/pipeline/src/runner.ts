import type { DocumentContributionContext } from '@textforge/core';
import type { PipelineRegistry, PipelineRunner } from './types.js';

export interface DocumentPipelineRunnerOptions {
  readonly contributionContext?: DocumentContributionContext;
  readonly now?: () => string;
}

export declare function createPipelineRunner(options?: {
  readonly registry?: PipelineRegistry;
  readonly now?: () => string;
}): PipelineRunner;
export declare function createDocumentPipelineRunner(options?: DocumentPipelineRunnerOptions): PipelineRunner;
