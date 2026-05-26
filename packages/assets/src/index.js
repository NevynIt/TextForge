import {
  createCapability,
  createCommand,
  createContributionManifest,
  createResourcePredicate,
} from '@textforge/core';

const imageDocumentPredicate = createResourcePredicate({
  representations: ['bytes'],
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
});
const svgDocumentPredicate = createResourcePredicate({
  representations: ['text', 'bytes'],
  mimeTypes: ['image/svg+xml'],
});
const pdfDocumentPredicate = createResourcePredicate({
  representations: ['bytes'],
  mimeTypes: ['application/pdf'],
});
const binaryDocumentPredicate = createResourcePredicate({
  representations: ['bytes'],
});

export const assetCapabilities = [
  createCapability('@textforge/assets/capability/image', {
    description: 'Open image resources through the image viewer surface.',
    localName: 'image',
    defaultActive: true,
    scope: 'document',
    documentPredicate: imageDocumentPredicate,
  }),
  createCapability('@textforge/assets/capability/svg', {
    description: 'Open SVG resources through the SVG viewer surface.',
    aliases: ['svg'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: svgDocumentPredicate,
  }),
  createCapability('@textforge/assets/capability/pdf', {
    description: 'Open PDF resources through the PDF viewer surface.',
    localName: 'pdf',
    defaultActive: true,
    scope: 'document',
    documentPredicate: pdfDocumentPredicate,
  }),
  createCapability('@textforge/assets/capability/binary', {
    description: 'Open opaque byte resources through the generic file viewer surface.',
    aliases: ['bytes', 'file'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: binaryDocumentPredicate,
  }),
];

export function createAssetViewerSurfaceContribution(overrides) {
  return {
    ...overrides,
    kind: 'asset-viewer',
    readOnly: true,
  };
}

export function selectAssetViewerKind(request) {
  const mimeType = request.mimeType ?? request.resource.mimeType ?? request.workspaceResource?.mimeType;
  if (mimeType === 'image/svg+xml') {
    return 'svg';
  }

  if (mimeType?.startsWith('image/')) {
    return 'image';
  }

  if (mimeType === 'application/pdf') {
    return 'pdf';
  }

  return 'binary';
}

export function createWorkspaceAssetBinding(request) {
  const viewerKind = selectAssetViewerKind(request);
  return {
    resource: request.resource,
    viewerKind,
    mimeType: request.mimeType ?? request.resource.mimeType,
    title: request.title ?? request.resource.path ?? request.resource.resourceId,
    provenance: request.provenance,
    state: 'pending',
  };
}

export function createBlobUrlLedger(driver) {
  const leases = new Map();
  let counter = 0;

  return {
    acquire(resource, source, mimeType) {
      const id = `blob-lease-${++counter}`;
      const url = driver.createObjectURL(source);
      const lease = {
        id,
        resourceId: resource.resourceId,
        url,
        mimeType: mimeType ?? source.type,
        createdAt: new Date().toISOString(),
        state: 'active',
        source,
      };
      leases.set(id, lease);
      return lease;
    },
    release(leaseId) {
      const current = leases.get(leaseId);
      if (!current || current.state === 'released') {
        return false;
      }

      driver.revokeObjectURL(current.url);
      leases.set(leaseId, {
        ...current,
        releasedAt: new Date().toISOString(),
        state: 'released',
      });
      return true;
    },
    get(leaseId) {
      const lease = leases.get(leaseId);
      return lease ? { ...lease } : undefined;
    },
    list() {
      return [...leases.values()].map(({ source: _source, ...lease }) => ({ ...lease }));
    },
  };
}

export function markAssetBindingReady(binding, blobUrl) {
  return {
    ...binding,
    blobUrl,
    state: 'ready',
  };
}

export function markAssetBindingStale(binding) {
  return {
    ...binding,
    state: 'stale',
  };
}

export function markAssetBindingReleased(binding) {
  return {
    ...binding,
    blobUrl: undefined,
    state: 'released',
  };
}

export const assetSurfaceContributions = [
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/image',
    label: 'Image viewer',
    description: 'Read-only image surface for workspace image resources.',
    localName: 'image',
    capabilities: ['@textforge/assets/capability/image'],
    defaultActive: true,
    viewerKind: 'image',
    placements: ['main', 'popup', 'auxiliary'],
    resourceRepresentations: ['bytes'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    openWithPriority: 80,
  }),
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/svg',
    label: 'SVG viewer',
    description: 'Read-only SVG surface with workspace blob binding support for text or byte resources.',
    localName: 'svg',
    capabilities: ['@textforge/assets/capability/svg'],
    defaultActive: true,
    viewerKind: 'svg',
    placements: ['main', 'popup', 'auxiliary'],
    resourceRepresentations: ['text', 'bytes'],
    mimeTypes: ['image/svg+xml'],
    openWithPriority: 90,
  }),
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/pdf',
    label: 'PDF viewer',
    description: 'Read-only PDF surface for workspace PDF resources.',
    localName: 'pdf',
    capabilities: ['@textforge/assets/capability/pdf'],
    defaultActive: true,
    viewerKind: 'pdf',
    placements: ['main', 'popup'],
    resourceRepresentations: ['bytes'],
    mimeTypes: ['application/pdf'],
    openWithPriority: 70,
  }),
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/binary',
    label: 'File viewer',
    description: 'Fallback viewer for opaque byte-backed workspace resources.',
    localName: 'binary',
    capabilities: ['@textforge/assets/capability/binary'],
    defaultActive: true,
    viewerKind: 'binary',
    placements: ['main', 'popup', 'auxiliary'],
    resourceRepresentations: ['bytes'],
    openWithPriority: 10,
  }),
];

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

export function createAssetContributionManifest() {
  return createContributionManifest('@textforge/assets', {
    capabilities: assetCapabilities,
    commands: assetCommandContributions,
    surfaces: assetSurfaceContributions,
  });
}

export const contributions = createAssetContributionManifest();

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function bytesToText(bytes) {
  return new TextDecoder().decode(bytes);
}

export function createAssetProvenanceLabel(provenance) {
  if (!provenance) {
    return 'workspace-bound';
  }

  if (typeof provenance === 'string') {
    return provenance;
  }

  if (provenance.kind === 'generated') {
    return `${provenance.pipelineId} from ${provenance.sourcePath}`;
  }

  return 'workspace-bound';
}

function createMediaNode(ownerDocument, model) {
  const stage = ownerDocument.createElement('div');
  stage.className = 'asset-viewer__stage';

  if (model.viewerKind === 'svg' || model.viewerKind === 'image') {
    if (model.blobUrl) {
      const img = ownerDocument.createElement('img');
      img.className = 'asset-viewer__media';
      img.src = model.blobUrl;
      img.alt = model.title;
      img.loading = 'lazy';
      stage.append(img);
    } else {
      const fallback = ownerDocument.createElement('pre');
      fallback.className = 'asset-viewer__fallback';
      fallback.textContent = model.resourceText || 'No image data available.';
      stage.append(fallback);
    }
  } else if (model.viewerKind === 'pdf') {
    if (model.blobUrl) {
      const frame = ownerDocument.createElement('iframe');
      frame.className = 'asset-viewer__media';
      frame.src = model.blobUrl;
      frame.title = model.title;
      stage.append(frame);
    } else {
      const fallback = ownerDocument.createElement('pre');
      fallback.className = 'asset-viewer__fallback';
      fallback.textContent = 'PDF preview is available when a blob URL is bound.';
      stage.append(fallback);
    }
  } else {
    const fallback = ownerDocument.createElement('pre');
    fallback.className = 'asset-viewer__fallback';
    fallback.textContent = model.resourceText || 'Binary resource preview';
    stage.append(fallback);
  }

  return stage;
}

function createAssetViewerMarkup(model) {
  return `
    <section class="asset-viewer asset-viewer--${model.viewerKind}">
      <div class="asset-viewer__body asset-viewer__body--stage-only">
        <div class="asset-viewer__stage"></div>
      </div>
    </section>
  `;
}

export function createAssetViewerSurfaceModel(request, binding, lease) {
  const resolvedBinding = binding ?? createWorkspaceAssetBinding(request);
  const viewerKind = resolvedBinding.viewerKind;
  const title = resolvedBinding.title ?? request.resource.path ?? request.resource.resourceId;
  const state = resolvedBinding.state;
  const blobUrl = resolvedBinding.blobUrl ?? lease?.url;
  const mimeType = resolvedBinding.mimeType ?? request.resource.mimeType ?? request.workspaceResource?.mimeType ?? 'application/octet-stream';
  const resourceText = request.workspaceResource?.representation === 'bytes'
    ? bytesToText(request.workspaceResource.bytes)
    : request.workspaceResource?.representation === 'text'
      ? request.workspaceResource.text
      : '';

  return {
    id: `asset-viewer:${request.resource.resourceId}`,
    title,
    summary: `${viewerKind} asset viewer for ${mimeType}.`,
    viewerKind,
    state,
    mimeType,
    binding: resolvedBinding,
    lease,
    blobUrl,
    resourceText,
    provenance: request.provenance ?? 'workspace-bound',
    provenanceLabel: createAssetProvenanceLabel(request.provenance),
  };
}

export function createAssetViewerSurface(request, options = {}) {
  const binding = options.binding ?? createWorkspaceAssetBinding(request);
  const model = createAssetViewerSurfaceModel(request, binding, options.lease);
  return {
    id: model.id,
    contribution:
      assetSurfaceContributions.find((candidate) => candidate.viewerKind === binding.viewerKind) ??
      assetSurfaceContributions[assetSurfaceContributions.length - 1],
    binding,
    lease: options.lease,
    model,
    mount(container) {
      container.innerHTML = createAssetViewerMarkup(model);
      const stage = container.querySelector('.asset-viewer__stage');
      if (!stage) {
        return () => {};
      }

      const ownerDocument = container.ownerDocument ?? globalThis.document;
      if (!ownerDocument) {
        return () => {};
      }

      stage.replaceChildren(createMediaNode(ownerDocument, model));
      return () => {};
    },
  };
}

function createAssetViewerSurfaceForKind(viewerKind, request, options = {}) {
  const baseBinding = options.binding ?? createWorkspaceAssetBinding(request);
  return createAssetViewerSurface(request, {
    ...options,
    binding: {
      ...baseBinding,
      viewerKind,
    },
  });
}

export function createImageAssetViewerSurface(request, options = {}) {
  return createAssetViewerSurfaceForKind('image', request, options);
}

export function createSvgAssetViewerSurface(request, options = {}) {
  return createAssetViewerSurfaceForKind('svg', request, options);
}

export function createPdfAssetViewerSurface(request, options = {}) {
  return createAssetViewerSurfaceForKind('pdf', request, options);
}

export function createBinaryAssetViewerSurface(request, options = {}) {
  return createAssetViewerSurfaceForKind('binary', request, options);
}
