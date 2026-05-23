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
    description: 'Read-only image surface for workspace binary assets.',
    viewerKind: 'image',
    placements: ['main', 'popup', 'auxiliary'],
    resourceKinds: ['binary'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    openWithPriority: 80,
  }),
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/svg',
    label: 'SVG viewer',
    description: 'Read-only SVG surface with workspace blob binding support.',
    viewerKind: 'svg',
    placements: ['main', 'popup', 'auxiliary'],
    resourceKinds: ['binary'],
    mimeTypes: ['image/svg+xml'],
    openWithPriority: 90,
  }),
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/pdf',
    label: 'PDF viewer',
    description: 'Read-only PDF surface for workspace binary assets.',
    viewerKind: 'pdf',
    placements: ['main', 'popup'],
    resourceKinds: ['binary'],
    mimeTypes: ['application/pdf'],
    openWithPriority: 70,
  }),
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/binary',
    label: 'Binary viewer',
    description: 'Fallback viewer for binary workspace resources.',
    viewerKind: 'binary',
    placements: ['main', 'popup', 'auxiliary'],
    resourceKinds: ['binary'],
    openWithPriority: 10,
  }),
];

export const contributions = {
  id: '@textforge/assets',
  diagnostics: [],
  commands: [],
  surfaces: assetSurfaceContributions,
  pipelines: [],
};

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

export function createAssetViewerSurfaceModel(request, binding, lease) {
  const resolvedBinding = binding ?? createWorkspaceAssetBinding(request);
  const viewerKind = resolvedBinding.viewerKind;
  const title = resolvedBinding.title ?? request.resource.path ?? request.resource.resourceId;
  const state = resolvedBinding.state;
  const blobUrl = resolvedBinding.blobUrl ?? lease?.url;
  const mimeType = resolvedBinding.mimeType ?? request.resource.mimeType ?? request.workspaceResource?.mimeType ?? 'application/octet-stream';
  const resourceText = request.workspaceResource?.kind === 'binary'
    ? bytesToText(request.workspaceResource.bytes)
    : request.workspaceResource?.kind === 'text'
      ? request.workspaceResource.text
      : '';

  let previewHtml = `
    <section class="asset-viewer asset-viewer--${viewerKind}">
      <header class="asset-viewer__header">
        <div>
          <span class="asset-viewer__eyebrow">Asset viewer</span>
          <h4>${escapeHtml(title)}</h4>
        </div>
        <div class="asset-viewer__meta">
          <span>${escapeHtml(viewerKind)}</span>
          <span>${escapeHtml(mimeType)}</span>
        </div>
      </header>
      <div class="asset-viewer__body">
  `;

  if (viewerKind === 'svg' || viewerKind === 'image') {
    previewHtml += blobUrl
      ? `<img class="asset-viewer__media" src="${escapeHtml(blobUrl)}" alt="${escapeHtml(title)}" />`
      : `<pre class="asset-viewer__fallback">${escapeHtml(resourceText || 'No image data available.')}</pre>`;
  } else if (viewerKind === 'pdf') {
    previewHtml += blobUrl
      ? `<iframe class="asset-viewer__media" src="${escapeHtml(blobUrl)}" title="${escapeHtml(title)}"></iframe>`
      : `<pre class="asset-viewer__fallback">PDF preview is available when a blob URL is bound.</pre>`;
  } else {
    previewHtml += `<pre class="asset-viewer__fallback">${escapeHtml(resourceText || 'Binary resource preview')}</pre>`;
  }

  previewHtml += `
      </div>
      <footer class="asset-viewer__footer">
        <span>${escapeHtml(state)}</span>
        <span>${request.provenance ? escapeHtml(request.provenance) : 'workspace-bound'}</span>
      </footer>
    </section>
  `;

  return {
    id: `asset-viewer:${request.resource.resourceId}`,
    title,
    summary: `${viewerKind} asset viewer for ${mimeType}.`,
    viewerKind,
    state,
    mimeType,
    binding: resolvedBinding,
    lease,
    previewHtml,
  };
}

export function createAssetViewerSurface(request, options = {}) {
  const binding = options.binding ?? createWorkspaceAssetBinding(request);
  return {
    id: `asset-viewer:${request.resource.resourceId}`,
    contribution:
      assetSurfaceContributions.find((candidate) => candidate.viewerKind === binding.viewerKind) ??
      assetSurfaceContributions[assetSurfaceContributions.length - 1],
    binding,
    lease: options.lease,
    model: createAssetViewerSurfaceModel(request, binding, options.lease),
    html: createAssetViewerSurfaceModel(request, binding, options.lease).previewHtml,
  };
}
