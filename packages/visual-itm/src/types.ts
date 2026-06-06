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
