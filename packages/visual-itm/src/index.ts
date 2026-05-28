export type VisualItmOriginMode = 'derived-itm' | 'standalone' | 'translated';
export type VisualItmDerivedTargetKind = 'raw-model' | 'viewpoint' | 'view';
export type VisualItmRendererSource = 'derived' | 'local';
export type VisualItmProvenanceKind = 'model-item' | 'viewpoint' | 'view' | 'translated';
export type VisualItmDiagnosticSeverity = 'error' | 'warning' | 'info';

export interface VisualItmSourceRangePosition {
  readonly line?: number;
  readonly column?: number;
  readonly offset?: number;
}

export interface VisualItmSourceRange {
  readonly start?: VisualItmSourceRangePosition;
  readonly end?: VisualItmSourceRangePosition;
  readonly startLine?: number;
  readonly startColumn?: number;
  readonly endLine?: number;
  readonly endColumn?: number;
}

export interface VisualItmProvenance {
  readonly sourceKind: VisualItmProvenanceKind;
  readonly sourceId?: string;
  readonly sourcePath?: string;
  readonly sourceRange?: VisualItmSourceRange;
}

export interface VisualItmDiagnostic {
  readonly severity: VisualItmDiagnosticSeverity;
  readonly code: string;
  readonly message: string;
  readonly subjectId?: string;
  readonly provenance?: ReadonlyArray<VisualItmProvenance>;
}

export interface VisualItmNode {
  readonly id: string;
  readonly label?: string;
  readonly kind?: string;
  readonly classes?: ReadonlyArray<string>;
  readonly tags?: ReadonlyArray<string>;
  readonly parentId?: string;
  readonly style?: Readonly<Record<string, string | number | boolean>>;
  readonly layout?: Readonly<Record<string, string | number | boolean>>;
  readonly provenance?: ReadonlyArray<VisualItmProvenance>;
}

export interface VisualItmEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly label?: string;
  readonly kind?: string;
  readonly classes?: ReadonlyArray<string>;
  readonly tags?: ReadonlyArray<string>;
  readonly style?: Readonly<Record<string, string | number | boolean>>;
  readonly layout?: Readonly<Record<string, string | number | boolean>>;
  readonly provenance?: ReadonlyArray<VisualItmProvenance>;
}

export interface VisualItmDocument {
  readonly format: 'textforge.visual-itm/v1';
  readonly origin: {
    readonly mode: VisualItmOriginMode;
    readonly sourceResource?: string;
    readonly sourceHash?: string;
    readonly derivedTarget?: {
      readonly kind: VisualItmDerivedTargetKind;
      readonly id?: string;
      readonly viewpointId?: string;
    };
  };
  readonly renderer?: {
    readonly value?: string;
    readonly source: VisualItmRendererSource;
    readonly hints?: Readonly<Record<string, string | number | boolean>>;
  };
  readonly diagnostics?: ReadonlyArray<VisualItmDiagnostic>;
  readonly nodes: ReadonlyArray<VisualItmNode>;
  readonly edges: ReadonlyArray<VisualItmEdge>;
}

export declare const visualItmFormatId: 'textforge.visual-itm/v1';
export declare const visualItmOriginModes: ReadonlyArray<VisualItmOriginMode>;
export declare const visualItmDerivedTargetKinds: ReadonlyArray<VisualItmDerivedTargetKind>;
export declare const visualItmRendererSources: ReadonlyArray<VisualItmRendererSource>;
export declare const visualItmProvenanceKinds: ReadonlyArray<VisualItmProvenanceKind>;
export declare const visualItmDiagnosticSeverities: ReadonlyArray<VisualItmDiagnosticSeverity>;

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
export declare function isVisualItmDocument(input: unknown): input is VisualItmDocument;
export declare function validateVisualItmDocument(document: unknown): ReadonlyArray<VisualItmDiagnostic>;

export declare const visualItmV1Fixtures: Readonly<{
  readonly derivedGraph: VisualItmDocument;
  readonly derivedTree: VisualItmDocument;
  readonly standaloneMindmap: VisualItmDocument;
  readonly missingRenderer: VisualItmDocument;
  readonly itmPubParity: VisualItmDocument;
}>;
