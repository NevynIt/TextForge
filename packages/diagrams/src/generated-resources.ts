import type { ResourceRef } from '@textforge/core';
import type { GeneratedResourceDescriptor } from '@textforge/pipeline';

export declare function createGeneratedDiagramPath(basePath: string, blockKind: string, blockId: string, extension: 'svg' | 'png'): string;
export declare function createDiagramGeneratedResources(input: {
  readonly svg: string;
  readonly pngBytes?: Uint8Array;
  readonly blockId: string;
  readonly blockKind: string;
  readonly generatedAssetBasePath: string;
  readonly pipelineId: string;
  readonly sourceResource?: ResourceRef;
  readonly sourceUpdatedAt?: string;
}): ReadonlyArray<GeneratedResourceDescriptor>;
