import type {
  SurfacePlacement,
  SurfaceSession,
  SurfaceSessionTabStrip,
} from './types';

export declare function createOpenWithSurfaceCommand(
  surfaceId: string,
  label: string,
  placement?: SurfacePlacement,
): {
  readonly id: `open-with:${string}`;
  readonly label: string;
  readonly placement: SurfacePlacement;
};
export declare function createSurfaceSessionTab(session: SurfaceSession): import('@textforge/ui').SurfaceTab;
export declare function listOpenSurfaceSessions(
  sessions: ReadonlyArray<SurfaceSession>,
  placement?: SurfacePlacement,
): ReadonlyArray<SurfaceSession>;
export declare function createMainSessionTabStrip(
  sessions: ReadonlyArray<SurfaceSession>,
  options?: { readonly id?: string; readonly title?: string; readonly activeTabId?: string },
): SurfaceSessionTabStrip;
