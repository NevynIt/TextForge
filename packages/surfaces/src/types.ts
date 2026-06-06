import type {
  Capability,
  PipelineValue,
  ResourceRepresentation,
  ResourceRef,
  SurfaceContribution as CoreSurfaceContribution,
} from '@textforge/core';

export type SurfacePlacement = 'main' | 'popup' | 'auxiliary';
export type SurfaceHostState = 'open' | 'stale' | 'closed';
export type SurfaceFreshness = 'current' | 'stale';

export interface SurfaceContribution extends CoreSurfaceContribution {
  readonly label?: string;
  readonly description?: string;
  readonly placements?: ReadonlyArray<SurfacePlacement>;
  readonly resourceRepresentations?: ReadonlyArray<ResourceRepresentation>;
  readonly mimeTypes?: ReadonlyArray<string>;
  readonly languageIds?: ReadonlyArray<string>;
  readonly fileExtensions?: ReadonlyArray<string>;
  readonly allowPopup?: boolean;
  readonly openWithPriority?: number;
}

export interface SurfaceOpenRequest {
  readonly resource: ResourceRef;
  readonly title?: string;
  readonly sessionKey?: string;
  readonly surfaceState?: Readonly<Record<string, unknown>>;
  readonly preferredSurfaceIds?: ReadonlyArray<string>;
  readonly activeContributionIds?: ReadonlyArray<string>;
  readonly activeCapabilityIds?: ReadonlyArray<string>;
  readonly placement?: SurfacePlacement;
  readonly allowPopup?: boolean;
  readonly sourceSessionId?: string;
  readonly fallbackSurfaceId?: string;
}

export interface SurfaceSession {
  readonly id: string;
  readonly contributionId: string;
  readonly resource: ResourceRef;
  readonly title: string;
  readonly sessionKey?: string;
  readonly surfaceState?: Readonly<Record<string, unknown>>;
  readonly placement: SurfacePlacement;
  readonly state: SurfaceHostState;
  readonly freshness: SurfaceFreshness;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly capabilityIds: ReadonlyArray<Capability['id']>;
  readonly sourceSessionId?: string;
  readonly fallbackSurfaceId?: string;
}

export interface OpenWithCandidate {
  readonly surfaceId: string;
  readonly label: string;
  readonly description?: string;
  readonly placement: SurfacePlacement;
  readonly priority: number;
  readonly selected: boolean;
}

export interface OpenWithSelection {
  readonly resource: ResourceRef;
  readonly placement: SurfacePlacement;
  readonly candidates: ReadonlyArray<OpenWithCandidate>;
  readonly selectedSurfaceId?: string;
}

export interface PipelineValueSurfaceSelectionRequest {
  readonly value: PipelineValue;
  readonly placement?: SurfacePlacement;
  readonly allowPopup?: boolean;
  readonly activeCapabilityIds?: ReadonlyArray<string>;
  readonly activeContributionIds?: ReadonlyArray<string>;
  readonly preferredSurfaceIds?: ReadonlyArray<string>;
  readonly resourceId?: string;
  readonly path?: string;
}

export interface SourceEditorFallback {
  readonly resource: ResourceRef;
  readonly sourceSurfaceId: string;
  readonly reason: 'unsupported-visual-edit' | 'unsupported-language' | 'stale-generated-view' | 'explicit-source-open';
}

export interface SurfaceHostSnapshot {
  readonly hostId: string;
  readonly placement: SurfacePlacement;
  readonly sessions: ReadonlyArray<SurfaceSession>;
}

export interface SurfaceRegistry {
  readonly contributions: ReadonlyArray<SurfaceContribution>;
  register(contribution: SurfaceContribution): SurfaceRegistry;
  get(surfaceId: string): SurfaceContribution | undefined;
  list(): ReadonlyArray<SurfaceContribution>;
  listByPlacement(placement: SurfacePlacement): ReadonlyArray<SurfaceContribution>;
  chooseForResource(request: SurfaceOpenRequest): SurfaceContribution | undefined;
}

export interface SurfaceHostProps {
  readonly hostId: string;
  readonly placement: SurfacePlacement;
  readonly registry: SurfaceRegistry;
  readonly now?: () => string;
  readonly idFactory?: () => string;
}

export interface SurfaceHost {
  readonly hostId: string;
  readonly placement: SurfacePlacement;
  open(request: SurfaceOpenRequest): SurfaceSession;
  get(sessionId: string): SurfaceSession | undefined;
  list(): ReadonlyArray<SurfaceSession>;
  focus(sessionId: string): SurfaceSession | undefined;
  move(sessionId: string, placement: SurfacePlacement): SurfaceSession | undefined;
  close(sessionId: string): boolean;
  markStale(sessionId: string): SurfaceSession | undefined;
  markCurrent(sessionId: string): SurfaceSession | undefined;
  snapshot(): SurfaceHostSnapshot;
}

export interface SurfaceSessionTabStrip {
  readonly id: string;
  readonly title: string;
  readonly placement: 'main';
  readonly layout: 'tabs';
  readonly tabs: ReadonlyArray<import('@textforge/ui').SurfaceTab>;
  readonly activeTabId?: string;
}

export type SurfaceSessionManager = SurfaceHost;
