export {
  contributions,
  createSurfaceCommandContributions,
  createSurfaceContributionManifest,
  createSurfaceOpenWithCommands,
  surfaceCommandContributions,
} from './commands.js';
export {
  canOpenWithSurface,
  getDefaultSurfacePlacement,
} from './matching.js';
export {
  createOpenWithSelection,
  createSurfaceRegistry,
} from './registry.js';
export {
  createPipelineValueOpenWithSelection,
  createPipelineValueResource,
} from './pipeline.js';
export {
  createMainSurfaceHost,
  createPopupSurfaceHost,
  createSequentialSessionIdFactory,
  createSourceEditorFallback,
  createSurfaceHost,
  markSurfaceSessionCurrent,
  markSurfaceSessionStale,
} from './host.js';
export {
  createMainSessionTabStrip,
  createOpenWithSurfaceCommand,
  createSurfaceSessionTab,
  listOpenSurfaceSessions,
} from './tabs.js';
