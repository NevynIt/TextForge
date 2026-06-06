import type { DiagramFenceHandler } from './types.js';

export declare function createMermaidFenceHandler(): DiagramFenceHandler;
export declare function createGraphvizFenceHandler(pipelineId?: string): DiagramFenceHandler;
export declare const diagramFenceHandlerContributions: ReadonlyArray<{
  readonly id: string;
  readonly fenceNames?: ReadonlyArray<string>;
  readonly render: DiagramFenceHandler;
}>;
export declare function createDiagramFenceHandlers(): Readonly<Record<'mermaid' | 'dot' | 'graphviz', DiagramFenceHandler>>;
