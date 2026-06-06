import type {
  VisualItmDiagnostic,
  VisualItmDocument,
  VisualItmEdge,
  VisualItmNode,
  VisualItmProvenance,
} from './types.js';

export declare function createVisualItmProvenance(
  overrides: Partial<VisualItmProvenance> & Pick<VisualItmProvenance, 'sourceKind'>,
): VisualItmProvenance;
export declare function createVisualItmDiagnostic(
  overrides: Partial<VisualItmDiagnostic> & Pick<VisualItmDiagnostic, 'code' | 'message'>,
): VisualItmDiagnostic;
export declare function createVisualItmNode(
  overrides: Partial<VisualItmNode> & Pick<VisualItmNode, 'id'>,
): VisualItmNode;
export declare function createVisualItmEdge(
  overrides: Partial<VisualItmEdge> & Pick<VisualItmEdge, 'id' | 'sourceId' | 'targetId'>,
): VisualItmEdge;
export declare function createVisualItmDocument(
  overrides: Partial<VisualItmDocument> & Pick<VisualItmDocument, 'origin'>,
): VisualItmDocument;
