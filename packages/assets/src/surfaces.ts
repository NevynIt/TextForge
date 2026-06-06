import type {
  AssetSurfaceContribution,
  AssetViewerRequest,
  AssetViewerSurface,
  AssetViewerSurfaceModel,
  AssetViewerSurfaceOptions,
  BlobUrlLease,
  WorkspaceAssetBinding,
} from './types.ts';

export declare function createAssetViewerSurfaceContribution(
  overrides: Omit<AssetSurfaceContribution, 'kind' | 'readOnly'>,
): AssetSurfaceContribution;

export const assetSurfaceContributions: ReadonlyArray<AssetSurfaceContribution> = [
  {
    id: '@textforge/assets/image',
    label: 'Image viewer',
    description: 'Read-only image surface for workspace image resources.',
    kind: 'asset-viewer',
    viewerKind: 'image',
    readOnly: true,
    placements: ['main', 'popup', 'auxiliary'],
    resourceRepresentations: ['bytes'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    openWithPriority: 80,
  },
  {
    id: '@textforge/assets/svg',
    label: 'SVG viewer',
    description: 'Read-only SVG surface with workspace blob binding support for text or byte resources.',
    kind: 'asset-viewer',
    viewerKind: 'svg',
    readOnly: true,
    placements: ['main', 'popup', 'auxiliary'],
    resourceRepresentations: ['text', 'bytes'],
    mimeTypes: ['image/svg+xml'],
    openWithPriority: 90,
  },
  {
    id: '@textforge/assets/pdf',
    label: 'PDF viewer',
    description: 'Read-only PDF surface for workspace PDF resources.',
    kind: 'asset-viewer',
    viewerKind: 'pdf',
    readOnly: true,
    placements: ['main', 'popup'],
    resourceRepresentations: ['bytes'],
    mimeTypes: ['application/pdf'],
    openWithPriority: 70,
  },
  {
    id: '@textforge/assets/binary',
    label: 'File viewer',
    description: 'Fallback viewer for opaque byte-backed workspace resources.',
    kind: 'asset-viewer',
    viewerKind: 'binary',
    readOnly: true,
    placements: ['main', 'popup', 'auxiliary'],
    resourceRepresentations: ['bytes'],
    openWithPriority: 10,
  },
];

export declare function createAssetProvenanceLabel(provenance: AssetViewerRequest['provenance']): string;

export declare function createAssetViewerSurfaceModel(
  request: AssetViewerRequest,
  binding?: WorkspaceAssetBinding,
  lease?: BlobUrlLease,
): AssetViewerSurfaceModel;

export declare function createAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;

export declare function createImageAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;

export declare function createSvgAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;

export declare function createPdfAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;

export declare function createBinaryAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;
