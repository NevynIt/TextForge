import type {
  ResourceRef,
} from '@textforge/core';

import type {
  SourceEditorFallback,
  SurfaceHost,
  SurfaceHostProps,
  SurfacePlacement,
  SurfaceSession,
} from './types';

export declare function createSequentialSessionIdFactory(prefix?: string): () => string;
export declare function createSourceEditorFallback(
  resource: ResourceRef,
  sourceSurfaceId: string,
  reason: SourceEditorFallback['reason'],
): SourceEditorFallback;
export declare function markSurfaceSessionStale(session: SurfaceSession, updatedAt: string): SurfaceSession;
export declare function markSurfaceSessionCurrent(session: SurfaceSession, updatedAt: string): SurfaceSession;
export declare function createSurfaceHost(props: SurfaceHostProps): SurfaceHost;
export declare function createPopupSurfaceHost(props: Omit<SurfaceHostProps, 'placement'>): SurfaceHost;
export declare function createMainSurfaceHost(props: Omit<SurfaceHostProps, 'placement'>): SurfaceHost;
