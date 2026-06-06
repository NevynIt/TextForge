import type { Diagnostic, ResourceRef } from '@textforge/core';
import type { GeneratedResourceDescriptor } from '@textforge/pipeline';

export interface DiagramFenceExecution {
  readonly content: string;
  readonly blockId: string;
  readonly blockKind: 'mermaid' | 'dot' | 'graphviz';
  readonly sourceResource?: ResourceRef;
  readonly sourceUpdatedAt?: string;
  readonly generatedAssetBasePath?: string;
  readonly document?: Document;
  readonly includePng?: boolean;
}

export interface DiagramFenceResult {
  readonly html: string;
  readonly svg: string;
  readonly diagnostics?: ReadonlyArray<Diagnostic>;
  readonly generatedResources?: ReadonlyArray<GeneratedResourceDescriptor>;
}

export type DiagramFenceHandler = (execution: DiagramFenceExecution) => Promise<DiagramFenceResult>;
