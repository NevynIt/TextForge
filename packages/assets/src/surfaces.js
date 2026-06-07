import {
  createWorkspaceAssetBinding,
  markAssetBindingReady,
  markAssetBindingStale,
} from './binding.js';

export function createAssetViewerSurfaceContribution(overrides) {
  return {
    ...overrides,
    kind: 'asset-viewer',
    readOnly: true,
    open(execution = {}) {
      const resource = execution.resource;
      const workspaceResource = execution.workspaceResource;
      const lease = execution.getAssetLease?.();
      const generatedResource = execution.describeGeneratedResource?.() ?? { stale: false, rows: [] };
      const binding = createWorkspaceAssetBinding({
        resource,
        workspaceResource,
        title: execution.resourceTitle ?? workspaceResource?.metadata?.title ?? resource?.path,
        provenance: workspaceResource?.metadata?.provenance ?? 'workspace-bound',
      });
      const readyBindingBase = lease ? markAssetBindingReady(binding, lease.url) : binding;
      const readyBinding = generatedResource.stale ? markAssetBindingStale(readyBindingBase) : readyBindingBase;
      const surface = createAssetViewerSurface(
        {
          resource,
          workspaceResource,
          title: execution.resourceTitle ?? workspaceResource?.metadata?.title ?? resource?.path,
          provenance: workspaceResource?.metadata?.provenance ?? 'workspace-bound',
        },
        {
          binding: {
            ...readyBinding,
            viewerKind: this.viewerKind ?? readyBinding.viewerKind,
          },
          lease,
        },
      );
      return {
        mountId: `${execution.session?.id ?? 'surface'}:${this.id}`,
        summary: surface.model.summary,
        detail: surface.model.mimeType,
        readOnly: true,
        inspectorSections: [
          {
            eyebrow: 'Resource binding',
            icon: 'fileImage',
            title: 'Asset state',
            rows: [
              { label: 'State', value: surface.model.state },
              { label: 'Source', value: surface.model.provenanceLabel },
              { label: 'Blob URL', value: surface.model.blobUrl ? 'bound' : 'unbound' },
              { label: 'Action', value: surface.model.blobUrl ? 'Download asset' : 'No download link' },
            ],
          },
          ...(generatedResource.rows?.length > 0
            ? [{
              eyebrow: 'Generated',
              icon: generatedResource.stale ? 'warning' : 'status',
              title: 'Derived asset provenance',
              rows: generatedResource.rows,
            }]
            : []),
        ],
        surface,
      };
    },
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
    if (model.viewerKind === 'svg' && model.previewPaused) {
      const fallback = ownerDocument.createElement('div');
      fallback.className = 'asset-viewer__fallback';
      const message = ownerDocument.createElement('p');
      message.textContent = 'SVG preview is paused for this generated or large asset.';
      const action = ownerDocument.createElement('button');
      action.type = 'button';
      action.textContent = 'Load SVG preview';
      action.disabled = !model.blobUrl;
      action.addEventListener('click', () => {
        stage.replaceChildren(createImageNode(ownerDocument, model));
      }, { once: true });
      fallback.append(message, action);
      stage.append(fallback);
    } else if (model.blobUrl) {
      stage.append(createImageNode(ownerDocument, model));
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

function createImageNode(ownerDocument, model) {
  const img = ownerDocument.createElement('img');
  img.className = 'asset-viewer__media';
  img.src = model.blobUrl;
  img.alt = model.title;
  img.loading = 'lazy';
  return img;
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
  const previewPaused = viewerKind === 'svg'
    && request.workspaceResource?.representation === 'text'
    && (
      resourceText.length > 200000
      || request.workspaceResource?.metadata?.provenance?.kind === 'generated'
    );

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
    previewPaused,
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
