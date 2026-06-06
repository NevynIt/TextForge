import { createCommand } from '@textforge/core';

export const assetCommandContributions = [
  createCommand('asset.download-selected', 'Download selected asset', {
    category: 'asset',
    capabilities: ['@textforge/assets/capability/image', '@textforge/assets/capability/svg', '@textforge/assets/capability/pdf', '@textforge/assets/capability/binary'],
    description: 'Download the selected byte-backed resource through the existing asset viewer path.',
    keywords: ['asset', 'download', 'file', 'viewer'],
    menu: { id: 'asset', label: 'Asset', groupOrder: 40, order: 10 },
    toolbar: { order: 90, kind: 'secondary' },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      selectionRepresentations: ['bytes'],
    },
  }),
  createCommand('asset.export-selected-svg', 'Export selected SVG', {
    category: 'asset',
    capabilities: ['@textforge/assets/capability/svg'],
    description: 'Export the selected SVG resource as an SVG file through the asset workflow.',
    keywords: ['asset', 'svg', 'export', 'download'],
    menu: { id: 'asset', label: 'Asset', groupOrder: 40, order: 20 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      availableSurfaceIds: ['@textforge/assets/svg'],
    },
  }),
  createCommand('asset.export-selected-png', 'Export selected SVG as PNG', {
    category: 'asset',
    capabilities: ['@textforge/assets/capability/svg'],
    description: 'Rasterize the selected SVG resource locally and export it as PNG.',
    keywords: ['asset', 'svg', 'png', 'export', 'rasterize'],
    menu: { id: 'asset', label: 'Asset', groupOrder: 40, order: 30 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      availableSurfaceIds: ['@textforge/assets/svg'],
    },
  }),
];
