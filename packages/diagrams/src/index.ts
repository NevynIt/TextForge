import type { ContributionManifest, Diagnostic, ResourceRef } from '@textforge/core';
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

export declare const diagramPipelineContributions: ReadonlyArray<{
  readonly id: string;
  readonly inputKind: string;
  readonly outputKind: string;
  readonly description: string;
}>;
export declare function renderGraphvizToSvg(source: string): Promise<string>;
export declare function renderMermaidToSvg(source: string, options?: { readonly document?: Document; readonly id?: string }): Promise<string>;
export declare function rasterizeSvgToPngBytes(
  svgText: string,
  options?: { readonly document?: Document; readonly width?: number; readonly height?: number },
): Promise<Uint8Array>;
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
export declare function createMermaidFenceHandler(): DiagramFenceHandler;
export declare function createGraphvizFenceHandler(pipelineId?: string): DiagramFenceHandler;
export declare function createDiagramFenceHandlers(): Readonly<Record<'mermaid' | 'dot' | 'graphviz', DiagramFenceHandler>>;
export declare function createDiagramContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
