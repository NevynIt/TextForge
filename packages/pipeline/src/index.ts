import type { ContributionManifest, Diagnostic } from '@textforge/core';

export type PipelineValueKind =
  | 'text'
  | 'html'
  | 'svg'
  | 'png'
  | 'json'
  | 'yaml'
  | 'workspace-resource'
  | 'diagnostics';

export type GeneratedResourceFormat = 'svg' | 'png' | 'html';

export interface GeneratedResourceDescriptor {
  readonly kind: 'generated-resource';
  readonly path: string;
  readonly title?: string;
  readonly representation: 'text' | 'bytes';
  readonly mimeType?: string;
  readonly languageId?: string;
  readonly text?: string;
  readonly bytes?: Uint8Array;
  readonly format?: GeneratedResourceFormat | string;
  readonly pipelineId?: string;
  readonly sourceResourceId?: string;
  readonly sourcePath?: string;
  readonly sourceUpdatedAt?: string;
  readonly blockId?: string;
  readonly blockKind?: string;
  readonly generatedAt: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface PipelineStepResult<TOutput = unknown> {
  readonly output?: TOutput;
  readonly diagnostics?: ReadonlyArray<Diagnostic>;
  readonly generatedResources?: ReadonlyArray<GeneratedResourceDescriptor>;
}

export interface PipelineStepExecution<TInput = unknown> {
  readonly input: TInput;
  readonly context?: unknown;
  readonly now: () => string;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly trace: ReadonlyArray<PipelineTraceStep>;
}

export interface PipelineStep<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly contributionId: string;
  readonly inputKind: PipelineValueKind | string;
  readonly outputKind: PipelineValueKind | string;
  readonly description?: string;
  run(execution: PipelineStepExecution<TInput>): PipelineStepResult<TOutput> | Promise<PipelineStepResult<TOutput>>;
}

export interface PipelineTraceStep {
  readonly stepId: string;
  readonly contributionId: string;
  readonly inputKind: PipelineValueKind | string;
  readonly outputKind: PipelineValueKind | string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly status: 'done' | 'failed';
  readonly diagnosticsCount: number;
  readonly generatedResourceCount: number;
}

export interface PipelineRunResult<TValue = unknown> {
  readonly ok: boolean;
  readonly value: TValue;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly generatedResources: ReadonlyArray<GeneratedResourceDescriptor>;
  readonly trace: ReadonlyArray<PipelineTraceStep>;
}

export interface PipelineRegistry {
  register(step: PipelineStep): PipelineRegistry;
  get(stepId: string): PipelineStep | undefined;
  list(): ReadonlyArray<PipelineStep>;
}

export interface PipelineRunner {
  readonly registry: PipelineRegistry;
  run<TValue = unknown>(
    input: TValue,
    options?: {
      readonly context?: unknown;
      readonly stopOnError?: boolean;
      readonly steps?: ReadonlyArray<string | PipelineStep>;
    },
  ): Promise<PipelineRunResult<TValue>>;
}

export declare const pipelineValueKinds: ReadonlyArray<PipelineValueKind>;
export declare const generatedResourceFormats: ReadonlyArray<GeneratedResourceFormat>;
export declare function createGeneratedResourceDescriptor(input: Partial<GeneratedResourceDescriptor> & { readonly path: string }): GeneratedResourceDescriptor;
export declare function createPipelineStep<TInput = unknown, TOutput = unknown>(
  id: string,
  overrides?: Partial<PipelineStep<TInput, TOutput>>,
): PipelineStep<TInput, TOutput>;
export declare function createPipelineRegistry(initialSteps?: ReadonlyArray<PipelineStep>): PipelineRegistry;
export declare function createPipelineRunner(options?: {
  readonly registry?: PipelineRegistry;
  readonly now?: () => string;
}): PipelineRunner;
export declare function createPipelineContributionManifest(pipelines?: ReadonlyArray<PipelineStep>): ContributionManifest;
export declare const contributions: ContributionManifest;
