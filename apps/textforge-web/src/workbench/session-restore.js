import { sampleResourcePaths } from './bootstrap-options.js';
import { createBundledOverlayId } from './workspace-seed.js';

const legacyDefaultResourcePath = '/.textforge/resources/docs/examples/phase-4-markdown-preview.tf.md';

export function migrateStoredWorkbenchUiState(state) {
  if (!state || typeof state !== 'object') {
    return state;
  }

  const storedMainSessions = state.sessions?.main ?? [];
  const storedPopupSessions = state.sessions?.popup ?? [];
  const legacyDefaultResourceId = createBundledOverlayId(legacyDefaultResourcePath);
  const bundledReadmeResourceId = createBundledOverlayId(sampleResourcePaths.bundledReadme);

  // Migrate the old single-session seeded default so reloads open the bundled README instead.
  if (
    storedMainSessions.length !== 1
    || storedPopupSessions.length !== 0
    || (
      storedMainSessions[0]?.resourcePath !== legacyDefaultResourcePath
      && storedMainSessions[0]?.resourceId !== legacyDefaultResourceId
    )
  ) {
    return state;
  }

  const rewriteDescriptor = (descriptor) => {
    if (!isLegacyDefaultDescriptor(descriptor, legacyDefaultResourceId)) {
      return descriptor;
    }

    const {
      contributionId,
      sessionKey,
      surfaceState,
      title,
      ...descriptorRest
    } = descriptor;

    return {
      ...descriptorRest,
      resourcePath: sampleResourcePaths.bundledReadme,
      resourceId: bundledReadmeResourceId,
    };
  };

  return {
    ...state,
    sessions: {
      ...state.sessions,
      main: storedMainSessions.map(rewriteDescriptor),
      popup: storedPopupSessions,
    },
    active: {
      ...state.active,
      main: rewriteDescriptor(state.active?.main),
      popup: state.active?.popup,
    },
  };
}

export function createRestoredSurfaceOpenOptions(descriptor) {
  return {
    placement: descriptor.placement,
    preferredSurfaceId: descriptor.contributionId,
    sessionKey: descriptor.sessionKey,
    surfaceState: descriptor.surfaceState,
    expandSelection: false,
  };
}

function isLegacyDefaultDescriptor(descriptor, legacyDefaultResourceId) {
  return Boolean(
    descriptor
    && typeof descriptor === 'object'
    && (
      descriptor.resourcePath === legacyDefaultResourcePath
      || descriptor.resourceId === legacyDefaultResourceId
    ),
  );
}
