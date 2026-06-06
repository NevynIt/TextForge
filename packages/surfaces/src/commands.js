import {
  createCommand,
  createContributionManifest,
} from '@textforge/core';

export const surfaceCommandContributions = [
  createCommand('surface.open-visuals', 'Open visuals...', {
    category: 'surface',
    description: 'Open an ITM resource through the visual target picker instead of the plain source editor.',
    keywords: ['surface', 'visual', 'itm', 'view', 'viewpoint', 'picker'],
    menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 5 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      selectionRepresentations: ['text'],
      selectionLanguageIds: ['itm'],
    },
  }),
  createCommand('surface.close-active', 'Close active surface', {
    category: 'surface',
    description: 'Close the focused main or popup surface.',
    keywords: ['surface', 'close', 'document', 'tab'],
    menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 10 },
    toolbar: { order: 80, kind: 'secondary' },
    when: { workspaceReady: true, activeSurfaceRequired: true },
  }),
  createCommand('surface.close-all', 'Close all open editors', {
    category: 'surface',
    description: 'Close every open surface in the current main or popup tab strip.',
    keywords: ['surface', 'close', 'all', 'documents', 'tabs', 'editors'],
    menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 15 },
    when: { workspaceReady: true, activeSurfaceRequired: true },
  }),
  createCommand('surface.refresh-active', 'Refresh active surface', {
    category: 'surface',
    description: 'Reopen the focused surface against the current workspace state.',
    keywords: ['surface', 'refresh', 'reopen'],
    menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 20 },
    when: { workspaceReady: true, activeSurfaceRequired: true },
  }),
  createCommand('surface.move-active-to-main', 'Move active surface to main', {
    category: 'surface',
    description: 'Move the focused popup surface back into the main document area.',
    keywords: ['surface', 'move', 'main'],
    menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 30 },
    when: { workspaceReady: true, activeSurfaceRequired: true, activeSurfacePlacements: ['popup'] },
  }),
  createCommand('surface.move-active-to-popup', 'Move active surface to popup', {
    category: 'surface',
    description: 'Move the focused main surface into the popup utility pane.',
    keywords: ['surface', 'move', 'popup'],
    menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 40 },
    when: { workspaceReady: true, activeSurfaceRequired: true, activeSurfacePlacements: ['main'] },
  }),
  createCommand('surface.focus-main-session', 'Focus main surface', {
    category: 'surface',
    description: 'Focus the active main document surface.',
    keywords: ['surface', 'focus', 'main'],
    menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 50 },
    when: { workspaceReady: true },
  }),
  createCommand('surface.focus-popup-session', 'Focus popup surface', {
    category: 'surface',
    description: 'Focus the active popup utility surface.',
    keywords: ['surface', 'focus', 'popup'],
    menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 60 },
    when: { workspaceReady: true },
  }),
];

export function createSurfaceOpenWithCommands(surfaceContributions = []) {
  return surfaceContributions.map((contribution) =>
    createCommand(`surface.open-with:${contribution.id}`, `Open with ${contribution.label ?? contribution.id}`, {
      category: 'surface',
      description: contribution.description ?? `Open the selected resource with ${contribution.label ?? contribution.id}.`,
      keywords: ['surface', 'open with', contribution.label ?? contribution.id],
      menu: { id: 'surface', label: 'Surface', groupOrder: 20, order: 70 },
      when: {
        workspaceReady: true,
        selectionRequired: true,
        selectionKinds: ['resource'],
        availableSurfaceIds: [contribution.id],
      },
    }),
  );
}

export function createSurfaceCommandContributions(surfaceContributions = []) {
  return [
    ...surfaceCommandContributions,
    ...createSurfaceOpenWithCommands(surfaceContributions),
  ];
}

export function createSurfaceContributionManifest(surfaceContributions = []) {
  return createContributionManifest('@textforge/surfaces', {
    commands: createSurfaceCommandContributions(surfaceContributions),
  });
}

export const contributions = createSurfaceContributionManifest();
