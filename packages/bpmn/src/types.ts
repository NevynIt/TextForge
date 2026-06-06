import type { Diagnostic } from '@textforge/core';

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
