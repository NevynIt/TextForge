export type {
  OpenWithCandidate,
  OpenWithSelection,
  PipelineValueSurfaceSelectionRequest,
  SourceEditorFallback,
  SurfaceContribution,
  SurfaceFreshness,
  SurfaceHost,
  SurfaceHostProps,
  SurfaceHostSnapshot,
  SurfaceHostState,
  SurfaceOpenRequest,
  SurfacePlacement,
  SurfaceRegistry,
  SurfaceSession,
  SurfaceSessionManager,
  SurfaceSessionTabStrip,
} from './types';
export {
  contributions,
  createSurfaceCommandContributions,
  createSurfaceContributionManifest,
  createSurfaceOpenWithCommands,
  surfaceCommandContributions,
} from './commands';
export {
  canOpenWithSurface,
  getDefaultSurfacePlacement,
} from './matching';
export {
  createOpenWithSelection,
  createSurfaceRegistry,
} from './registry';
export {
  createPipelineValueOpenWithSelection,
  createPipelineValueResource,
} from './pipeline';
export {
  createMainSurfaceHost,
  createPopupSurfaceHost,
  createSequentialSessionIdFactory,
  createSourceEditorFallback,
  createSurfaceHost,
  markSurfaceSessionCurrent,
  markSurfaceSessionStale,
} from './host';
export {
  createMainSessionTabStrip,
  createOpenWithSurfaceCommand,
  createSurfaceSessionTab,
  listOpenSurfaceSessions,
} from './tabs';
