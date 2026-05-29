import type {
  ContributionRegistry,
  ContributionManifest,
  Diagnostic,
  ResourcePredicate,
  SurfaceContribution,
} from '@textforge/core';
import type {
  ImportBpmnXmlOptions,
  ItmDiagnostic,
  ItmDocument,
  ItmLoadDocumentResult,
  LoadItmDocumentOptions,
  ResolvedItmDocument,
  ValidateItmDocumentOptions,
} from '@textforge/itm';

export declare const bpmnRulesCapabilityId: '@textforge/bpmn/capability/rules';
export declare const bpmnXmlCapabilityId: '@textforge/bpmn/capability/xml';
export declare const bpmnViewerCapabilityId: '@textforge/bpmn/capability/viewer';
export declare const bpmnDiCapabilityId: '@textforge/bpmn/capability/di';
export declare const bpmnSemanticCapabilityId: '@textforge/bpmn/capability/semantic';
export declare const bpmnCapabilityIds: ReadonlyArray<string>;

export declare const bpmnXmlDocumentPredicate: ResourcePredicate;
export declare const bpmnItmDocumentPredicate: ResourcePredicate;
export declare const bpmnViewerSurfaceId: '@textforge/bpmn/viewer';
export declare const bpmnViewerSurfaceDocumentPredicate: ResourcePredicate;

export declare const bpmnSemanticProfileText: string;
export declare const bpmnSemanticFixtureTexts: Readonly<{
  readonly profile: string;
  readonly linearProcess: string;
  readonly exclusiveGatewayProcess: string;
}>;
export declare const bundledBpmnReferenceAssets: Readonly<{
  readonly rawXmlPath: 'docs/examples/bpmn/Training By Design.bpmn';
  readonly convertedItmPath: 'docs/examples/bpmn/training-by-design.lua-pipeline-reference.itm';
  readonly broadProfilePath: 'docs/examples/bpmn/bpmn-process-diagram-lite-profile.itm';
  readonly luaConverterPath: 'docs/examples/bpmn/bpmn-xml-to-itm.lua';
}>;

export interface BpmnViewerProcessSummary {
  readonly id?: string;
  readonly name?: string;
  readonly flowElementCount: number;
}

export interface BpmnViewerModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly xml: string;
  readonly definitions?: unknown;
  readonly processes: ReadonlyArray<BpmnViewerProcessSummary>;
  readonly diagramCount: number;
}

export interface BpmnDiBoundsEntry {
  readonly element: string;
  readonly shapeId?: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BpmnDiWaypoint {
  readonly x: number;
  readonly y: number;
}

export interface BpmnDiRouteEntry {
  readonly relationship: string;
  readonly edgeId?: string;
  readonly waypoints: ReadonlyArray<BpmnDiWaypoint>;
}

export interface BpmnDiLabelBoundsEntry {
  readonly element: string;
  readonly sourceDiElement?: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BpmnDiagramInterchangeView {
  readonly viewName: string;
  readonly startLine: number;
  readonly title?: string;
  readonly viewpointRef?: string;
  readonly sourceDiagramId?: string;
  readonly sourcePlaneId?: string;
  readonly planeElement?: string;
  readonly bounds: ReadonlyArray<BpmnDiBoundsEntry>;
  readonly routes: ReadonlyArray<BpmnDiRouteEntry>;
  readonly labelBounds: ReadonlyArray<BpmnDiLabelBoundsEntry>;
}

export declare function collectBpmnMvpScopeDiagnostics(
  document: ItmDocument | ResolvedItmDocument,
): ReadonlyArray<Diagnostic>;

export declare function validateBpmnSemanticDocument(
  document: ItmDocument | ResolvedItmDocument,
  options?: ValidateItmDocumentOptions,
): ReadonlyArray<ItmDiagnostic | Diagnostic>;

export declare function loadBpmnSemanticFixture(
  name: keyof typeof bpmnSemanticFixtureTexts,
  options?: LoadItmDocumentOptions,
): Promise<ItmLoadDocumentResult>;

export declare function loadBpmnSemanticProfile(
  options?: LoadItmDocumentOptions,
): Promise<ItmLoadDocumentResult>;

export declare function importBpmnSemanticXmlResult(
  xml: string,
  options?: ImportBpmnXmlOptions,
): {
  readonly value: ItmDocument;
  readonly diagnostics: ReadonlyArray<ItmDiagnostic | Diagnostic>;
};

export declare function createBpmnViewerModelFromXml(
  xml: string,
  options?: {
    readonly title?: string;
    readonly resource?: unknown;
  },
): Promise<BpmnViewerModel>;

export declare function createBpmnViewerModelFromItmSource(
  sourceText: string,
  options?: {
    readonly title?: string;
    readonly resource?: {
      readonly path?: string;
      readonly mimeType?: string;
      readonly languageId?: string;
    };
    readonly workspaceService?: {
      readonly getEntryByPath?: (path: string) => unknown;
    };
    readonly repositoryResolution?: unknown;
    readonly contributionRegistry?: ContributionRegistry;
    readonly session?: {
      readonly surfaceState?: Readonly<Record<string, unknown>>;
    };
    readonly target?: Readonly<Record<string, unknown>>;
  },
): Promise<BpmnViewerModel>;

export declare function extractBpmnDiagramInterchangeView(
  sourceText: string,
  options?: {
    readonly viewName?: string;
    readonly startLine?: number;
  },
): BpmnDiagramInterchangeView;

export declare function validateBpmnDiagramInterchangeView(
  view: BpmnDiagramInterchangeView,
  document: ItmDocument | ResolvedItmDocument,
  options?: {
    readonly resource?: unknown;
  },
): ReadonlyArray<Diagnostic>;

export declare function applyBpmnDiagramInterchangeToXml(
  xml: string,
  view: BpmnDiagramInterchangeView,
  options?: {
    readonly resource?: unknown;
  },
): Promise<{
  readonly xml: string;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}>;

export declare const bpmnViewerSurfaceContribution: SurfaceContribution;
export declare function createBpmnContributionManifest(overrides?: Partial<ContributionManifest>): ContributionManifest;
export declare const contributions: ContributionManifest;
