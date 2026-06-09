import * as React from 'react';
import { dirnameWorkspacePath } from '@textforge/workspace';
import {
  TextForgeAppFrame,
  TextForgeCallout,
  TextForgeCommandPalette,
  TextForgeContextMenu,
  TextForgeEmptyState,
  TextForgeInspectorCard,
  TextForgePopupHost,
  TextForgeResourceBadge,
  TextForgeSelectField,
  TextForgeSessionTabStrip,
  TextForgeStatusRail,
  TextForgeToolbarButton,
  TextForgeTopBar,
  TextForgeUtilityPane,
  TextForgeWorkspaceSidebar,
} from '@textforge/ui';

import { surfaceViewportScrollByViewId } from '../surface-scroll.js';

const element = React.createElement;
const surfaceScrollHostSelector = '.tf-surface-frame__viewport, .tf-popup-host__body';

function useWorkbenchSnapshot(controller) {
  return React.useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
}

function clampScrollValue(value, maxValue) {
  const normalizedValue = Math.max(0, value ?? 0);
  return Number.isFinite(maxValue)
    ? Math.min(normalizedValue, Math.max(0, maxValue))
    : normalizedValue;
}

function readSurfaceScroll(scrollHost) {
  if (!scrollHost) {
    return { top: 0, left: 0 };
  }
  return {
    top: scrollHost.scrollTop ?? 0,
    left: scrollHost.scrollLeft ?? 0,
  };
}

function writeSurfaceScroll(scrollHost, scroll) {
  if (!scrollHost || !scroll) {
    return;
  }
  const maxTop = typeof scrollHost.scrollHeight === 'number' && typeof scrollHost.clientHeight === 'number'
    ? scrollHost.scrollHeight - scrollHost.clientHeight
    : Number.POSITIVE_INFINITY;
  const maxLeft = typeof scrollHost.scrollWidth === 'number' && typeof scrollHost.clientWidth === 'number'
    ? scrollHost.scrollWidth - scrollHost.clientWidth
    : Number.POSITIVE_INFINITY;
  const top = clampScrollValue(scroll.top, maxTop);
  const left = clampScrollValue(scroll.left, maxLeft);
  if (typeof scrollHost.scrollTo === 'function') {
    scrollHost.scrollTo({ top, left });
    return;
  }
  scrollHost.scrollTop = top;
  scrollHost.scrollLeft = left;
}

function findSurfaceScrollHost(mountElement) {
  if (!mountElement) {
    return undefined;
  }

  const explicitHost = mountElement.closest(surfaceScrollHostSelector);
  if (explicitHost) {
    return explicitHost;
  }

  let candidate = mountElement.parentElement;
  while (candidate) {
    if (
      candidate.scrollHeight > candidate.clientHeight
      || candidate.scrollWidth > candidate.clientWidth
    ) {
      return candidate;
    }
    candidate = candidate.parentElement;
  }

  return undefined;
}

function findMountedSurfaceElement(viewId) {
  if (!viewId || typeof document === 'undefined') {
    return undefined;
  }

  for (const elementNode of document.querySelectorAll('.tf-surface-mount[data-surface-id]')) {
    if (elementNode.getAttribute('data-surface-id') === viewId) {
      return elementNode;
    }
  }

  return undefined;
}

function rememberMountedSurfaceScroll(view) {
  const mountElement = findMountedSurfaceElement(view?.id);
  const scrollHost = findSurfaceScrollHost(mountElement);
  if (view?.id && scrollHost) {
    surfaceViewportScrollByViewId.set(view.id, readSurfaceScroll(scrollHost));
  }
}

function SurfaceMount({ view }) {
  const mountRef = React.useRef(null);
  const mountedSurfaceRef = React.useRef();
  const restoreFrameIdsRef = React.useRef([]);

  const cancelScheduledRestores = React.useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      for (const frameId of restoreFrameIdsRef.current) {
        window.cancelAnimationFrame(frameId);
      }
    }
    restoreFrameIdsRef.current = [];
  }, []);

  const scheduleScrollRestore = React.useCallback((scrollHost, scroll, attempts = 3) => {
    cancelScheduledRestores();
    const applyScroll = () => writeSurfaceScroll(scrollHost, scroll);
    const scheduleNext = (remainingAttempts) => {
      if (remainingAttempts <= 0 || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
        applyScroll();
        return;
      }

      const frameId = window.requestAnimationFrame(() => {
        applyScroll();
        scheduleNext(remainingAttempts - 1);
      });
      restoreFrameIdsRef.current.push(frameId);
    };

    applyScroll();
    scheduleNext(attempts);
  }, [cancelScheduledRestores]);

  React.useEffect(() => {
    if (!view?.surface || !mountRef.current) {
      return undefined;
    }

    const scrollHost = findSurfaceScrollHost(mountRef.current);
    const dispose = view.surface.mount(mountRef.current);
    mountedSurfaceRef.current = view.surface;
    const restoreScroll = surfaceViewportScrollByViewId.get(view.id) ?? { top: 0, left: 0 };
    let resizeObserver;
    let removeScrollTracking;
    if (scrollHost) {
      const rememberScroll = () => {
        surfaceViewportScrollByViewId.set(view.id, readSurfaceScroll(scrollHost));
      };

      scrollHost.addEventListener('scroll', rememberScroll, { passive: true });
      scheduleScrollRestore(scrollHost, restoreScroll);

      if (typeof ResizeObserver === 'function') {
        resizeObserver = new ResizeObserver(() => {
          writeSurfaceScroll(scrollHost, surfaceViewportScrollByViewId.get(view.id) ?? restoreScroll);
        });
        resizeObserver.observe(scrollHost);
        resizeObserver.observe(mountRef.current);
      }
      removeScrollTracking = () => {
        rememberScroll();
        scrollHost.removeEventListener('scroll', rememberScroll);
      };
    }

    return () => {
      cancelScheduledRestores();
      resizeObserver?.disconnect();
      removeScrollTracking?.();
      if (typeof dispose === 'function') {
        dispose();
      }
      mountedSurfaceRef.current = undefined;
      if (mountRef.current) {
        mountRef.current.replaceChildren();
      }
    };
  }, [cancelScheduledRestores, scheduleScrollRestore, view?.mountId]);

  React.useEffect(() => {
    const currentSurface = mountedSurfaceRef.current;
    if (!view?.surface || !mountRef.current || !currentSurface || currentSurface === view.surface) {
      return;
    }
    if (typeof currentSurface.update !== 'function') {
      mountedSurfaceRef.current = view.surface;
      return;
    }

    const scrollHost = findSurfaceScrollHost(mountRef.current);
    const capturedScroll = readSurfaceScroll(scrollHost);
    surfaceViewportScrollByViewId.set(view.id, capturedScroll);
    const updated = currentSurface.update(mountRef.current, view.surface, {
      scrollHost,
      onAfterSwap() {
        surfaceViewportScrollByViewId.set(view.id, capturedScroll);
        scheduleScrollRestore(scrollHost, capturedScroll);
      },
    });
    if (updated !== false) {
      mountedSurfaceRef.current = view.surface;
    }
  }, [scheduleScrollRestore, view?.id, view?.surface]);

  return element('div', {
    ref: mountRef,
    className: 'tf-surface-mount',
    'data-surface-id': view?.id,
  });
}

function groupItmVisualTargets(targets = []) {
  return [
    {
      id: 'view',
      title: 'Views',
      items: targets.filter((target) => target.kind === 'view'),
    },
    {
      id: 'viewpoint',
      title: 'Viewpoints',
      items: targets.filter((target) => target.kind === 'viewpoint'),
    },
    {
      id: 'raw-model',
      title: 'Raw model',
      items: targets.filter((target) => target.kind === 'raw-model'),
    },
  ].filter((group) => group.items.length > 0);
}

function ItmVisualTargetPickerOverlay({ picker, controller }) {
  const resourceTitle = picker.resource?.metadata?.title ?? picker.resource?.path ?? 'ITM resource';
  const groups = groupItmVisualTargets(picker.targets);
  const selectedCount = picker.selectedSessionKeys.length;

  return element(
    'div',
    {
      className: 'tf-visual-picker__backdrop',
      onMouseDown: (event) => {
        if (event.target === event.currentTarget) {
          controller.actions.closeVisualTargetPicker();
        }
      },
    },
    element(
      'section',
      {
        className: 'tf-visual-picker',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Open visuals',
      },
      element(
        'div',
        { className: 'tf-visual-picker__header' },
        element(
          'div',
          null,
          element('strong', null, 'Open visuals'),
          element('p', { className: 'tf-visual-picker__subtitle' }, resourceTitle),
        ),
        element(
          'button',
          {
            type: 'button',
            className: 'tf-visual-picker__close',
            onClick: controller.actions.closeVisualTargetPicker,
          },
          'Close',
        ),
      ),
      picker.status === 'loading'
        ? element(TextForgeCallout, {
          tone: 'info',
          title: 'Resolving visual targets',
        }, element('p', null, 'Reading views, viewpoints, raw-model targets, and renderer availability from the ITM document.'))
        : null,
      picker.status === 'error'
        ? element(TextForgeCallout, {
          tone: 'danger',
          title: 'Visual targets unavailable',
        }, element('p', null, picker.error ?? 'Visual target resolution failed.'))
        : null,
      picker.status === 'ready' && groups.length === 0
        ? element(TextForgeCallout, {
          tone: 'warning',
          title: 'No visual targets found',
        }, element('p', null, 'This ITM document does not expose views, viewpoints, or raw-model visual targets.'))
        : null,
      picker.status === 'ready'
        ? element(
          'div',
          { className: 'tf-visual-picker__groups' },
          ...groups.map((group) =>
            element(
              'section',
              {
                key: group.id,
                className: 'tf-visual-picker__group',
              },
              element('h3', { className: 'tf-visual-picker__group-title' }, group.title),
              ...group.items.map((target) => {
                const disabled = target.available !== true;
                const checked = picker.selectedSessionKeys.includes(target.sessionKey);
                const diagnosticMessage = target.diagnostics?.[0]?.message;
                return element(
                  'label',
                  {
                    key: target.sessionKey,
                    className: `tf-visual-picker__target${disabled ? ' is-disabled' : ''}${checked ? ' is-selected' : ''}`,
                  },
                  element('input', {
                    type: 'checkbox',
                    checked,
                    disabled,
                    onChange: () => controller.actions.toggleVisualTargetPickerSelection(target.sessionKey),
                  }),
                  element(
                    'div',
                    { className: 'tf-visual-picker__target-copy' },
                    element('strong', { className: 'tf-visual-picker__target-label' }, target.label),
                    target.description
                      ? element('p', { className: 'tf-visual-picker__target-description' }, target.description)
                      : null,
                    diagnosticMessage
                      ? element('p', { className: 'tf-visual-picker__target-diagnostic' }, diagnosticMessage)
                      : null,
                  ),
                );
              }),
            )),
        )
        : null,
      element(
        'div',
        { className: 'tf-visual-picker__footer' },
        element(
          'button',
          {
            type: 'button',
            className: 'tf-button tf-button--secondary',
            onClick: controller.actions.closeVisualTargetPicker,
          },
          'Cancel',
        ),
        element(
          'button',
          {
            type: 'button',
            className: 'tf-button tf-button--primary',
            disabled: picker.status !== 'ready' || selectedCount === 0,
            onClick: controller.actions.openSelectedVisualTargets,
          },
          selectedCount === 1 ? 'Open 1 target' : `Open ${selectedCount} targets`,
        ),
      ),
    ),
  );
}

function listDroppedFiles(dataTransfer) {
  if (!dataTransfer) {
    return [];
  }

  return [...(dataTransfer.files ?? [])].filter(Boolean);
}

function hasDroppedFiles(dataTransfer) {
  if (!dataTransfer) {
    return false;
  }

  if ((dataTransfer.files?.length ?? 0) > 0) {
    return true;
  }

  return [...(dataTransfer.items ?? [])].some((item) => item.kind === 'file');
}

function WelcomeState({ hydrationSource }) {
  return element(TextForgeEmptyState, {
    eyebrow: 'Workbench',
    icon: 'status',
    title: 'Editor workspace ready',
    children: element(
      React.Fragment,
      null,
      element(
        'p',
        null,
        hydrationSource === 'storage'
          ? 'The shell reopened the browser-managed workspace, rebuilt local command routes, and restored package-owned editor and viewer surfaces.'
          : 'The shell seeded a fresh browser-managed workspace with bundled resources, editor surfaces, and local viewer workflows.',
      ),
      element(
        'ul',
        { className: 'tf-welcome__list' },
        element('li', null, 'Text resources open in the source editor and compatible package-owned preview surfaces'),
        element('li', null, 'Bundled resources stay read-only while user workspace resources remain editable'),
        element('li', null, 'Generated outputs are stored as ordinary workspace resources under local browser storage'),
        element('li', null, 'No remote package loading, remote sync, or silent host filesystem access is used'),
      ),
    ),
  });
}

function LoadingState() {
  return element(TextForgeCallout, {
    tone: 'info',
    title: 'Opening browser workspace',
    children: element(
      React.Fragment,
      null,
      element('p', null, 'TextForge is opening the browser-managed Dexie workspace before command routes and surface sessions are rebuilt.'),
      element('p', null, 'Open tabs, popup sessions, and side-panel layout remain ordinary local UI state; the workspace content and badge assignments persist.'),
    ),
  });
}

function StartupRecoveryState({ controller }) {
  return element(TextForgeCallout, {
    tone: 'warning',
    title: 'Recovery mode',
    actions: [
      element(TextForgeToolbarButton, {
        key: 'recovery-open-without-files',
        kind: 'secondary',
        label: 'Open Without Files',
        onPress: controller.actions.openRecoveryWorkspaceWithoutFiles,
      }),
      element(TextForgeToolbarButton, {
        key: 'recovery-reset-workspace',
        kind: 'primary',
        label: 'Reset Workspace',
        onPress: controller.actions.resetRecoveryWorkspace,
      }),
    ],
    children: element(
      React.Fragment,
      null,
      element('p', null, 'Recovery mode bypasses restored tabs and the startup surface so the app can reopen into a clean shell.'),
      element('p', null, 'Open without files keeps the current workspace data. Reset workspace clears the persisted browser workspace and rebuilds the starter seed.'),
    ),
  });
}

function RecoveryState({ controller, snapshot }) {
  return element(TextForgeCallout, {
    tone: 'warning',
    title: snapshot.runtime.storageFailure?.title ?? 'Workspace storage unavailable',
    actions: [
      element(TextForgeToolbarButton, {
        key: 'retry-storage',
        kind: 'secondary',
        label: 'Retry',
        onPress: controller.actions.retryStorageInitialization,
      }),
      element(TextForgeToolbarButton, {
        key: 'reset-storage',
        kind: 'primary',
        label: snapshot.state.storageResetPending ? 'Reset Browser Workspace Now' : 'Reset Browser Workspace',
        onPress: snapshot.state.storageResetPending
          ? controller.actions.confirmStorageReset
          : controller.actions.requestStorageReset,
      }),
    ],
    children: element(
      React.Fragment,
      null,
      element('p', null, snapshot.runtime.storageFailure?.detail ?? 'Retry the workspace load or reset browser storage to recover.'),
      snapshot.state.storageResetPending
        ? element('p', null, 'Confirm the reset from the Browser Storage utility section to clear the stored workspace and rebuild the seed content.')
        : null,
    ),
  });
}

function SurfaceDetails({ view }) {
  const folderPath = view.path ? dirnameWorkspacePath(view.path) : '/';
  return element(
    'aside',
    { className: 'tf-surface-details' },
    element(
      TextForgeInspectorCard,
      {
        eyebrow: 'Inspector',
        icon: view.icon,
        title: view.title,
      },
      element(
        'div',
        { className: 'tf-surface-details__identity' },
        element(TextForgeResourceBadge, {
          active: true,
          attention: view.badge?.repairedFromKey ? 'warning' : undefined,
          badge: view.badge,
          label: `${view.title} badge`,
          size: 'regular',
        }),
        element(
          'div',
          { className: 'tf-surface-details__copy' },
          element('p', { className: 'tf-surface-details__summary' }, view.summary),
          view.detail ? element('p', { className: 'tf-surface-details__detail' }, view.detail) : null,
        ),
      ),
      element(
        'dl',
        { className: 'tf-meta-list tf-surface-details__meta' },
        element('div', null, element('dt', null, 'Folder'), element('dd', null, folderPath)),
        element('div', null, element('dt', null, 'Open with'), element('dd', null, view.openWith)),
        element('div', null, element('dt', null, 'Surface'), element('dd', null, view.readOnly ? 'Read-only viewer' : 'Editable source surface')),
      ),
    ),
    element(
      TextForgeInspectorCard,
      {
        eyebrow: 'Session state',
        icon: view.badge?.repairedFromKey ? 'warning' : 'status',
        title: 'Placement and access',
      },
      element(
        'dl',
        { className: 'tf-meta-list' },
        element('div', null, element('dt', null, 'Placement'), element('dd', null, view.placement)),
        element('div', null, element('dt', null, 'State'), element('dd', null, view.state)),
        element('div', null, element('dt', null, 'Mode'), element('dd', null, view.detail ?? 'Surface metadata')),
      ),
    ),
    view.controls.length > 0
      ? element(
        TextForgeInspectorCard,
        {
          eyebrow: 'Controls',
          icon: 'command',
          title: 'Surface controls',
        },
        element(
          'div',
          { className: 'tf-surface-details__controls' },
          ...view.controls.map((control) =>
            element(TextForgeSelectField, { key: control.id, control })),
        ),
      )
      : element(TextForgeInspectorCard, {
        eyebrow: 'Controls',
        icon: 'info',
        title: 'No extra controls',
        children: element('p', { className: 'tf-empty' }, 'This surface is readable without additional switches.'),
      }),
    view.diagnostics?.length
      ? element(
        TextForgeInspectorCard,
        {
          eyebrow: 'Diagnostics',
          icon: 'warning',
          title: `Surface diagnostics (${view.diagnostics.length})`,
        },
        element(
          'ul',
          { className: 'tf-registry__list' },
          ...view.diagnostics.map((diagnostic, index) =>
            element(
              'li',
              { key: `${diagnostic.code ?? diagnostic.message ?? 'diagnostic'}:${index}` },
              formatSurfaceDiagnosticSummary(diagnostic),
            )),
        ),
      )
      : null,
    ...(view.inspectorSections ?? []).map((section) =>
      element(
        TextForgeInspectorCard,
        {
          key: section.title,
          eyebrow: section.eyebrow,
          icon: section.icon,
          title: section.title,
        },
        element(
          'dl',
          { className: 'tf-meta-list' },
          ...section.rows.map((row) =>
            element(
              'div',
              { key: row.label },
              element('dt', null, row.label),
              element('dd', null, row.value),
            )),
        ),
      )),
    view.badge?.repairedFromKey
      ? element(
        TextForgeInspectorCard,
        {
          eyebrow: 'Badge repair',
          icon: 'warning',
          title: 'Collision repair applied',
        },
        element(
          'p',
          { className: 'tf-empty' },
          `This resource kept a deterministic badge by repairing a duplicate key from ${view.badge.repairedFromKey}.`,
        ),
      )
      : null,
  );
}

function WorkbenchDetailsCard() {
  return element(
    TextForgeInspectorCard,
    {
      eyebrow: 'Workbench',
      icon: 'status',
      title: 'Shell context',
    },
    element(
      'p',
      { className: 'tf-surface-details__summary' },
      'The shell layers package-owned editor and viewer surfaces onto the browser-managed workspace, local ui state model, popup overlays, and resizable right panel layout.',
    ),
  );
}

function formatRegistryPackageStatus(status) {
  switch (status) {
    case 'missingDependency':
      return 'Missing dependency';
    case 'incompatibleVersion':
      return 'Incompatible version';
    case 'failedToInitialize':
      return 'Failed to initialize';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function formatActivationSource(source) {
  switch (source) {
    case 'explicit':
      return '%require';
    case 'document':
      return 'Document default';
    case 'workspace':
      return 'Workspace default';
    case 'app':
      return 'App default';
    default:
      return 'Core default';
  }
}

function formatRequirementStatus(status) {
  switch (status) {
    case 'active':
      return 'Activated';
    case 'ambiguous':
      return 'Ambiguous';
    case 'missing':
      return 'Missing';
    default:
      return formatRegistryPackageStatus(status);
  }
}

function formatCapabilityLabel(capability) {
  return capability.localName
    ? `${capability.localName} (${capability.id})`
    : capability.id;
}

function formatCapabilityState(status) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'available':
      return 'Inactive';
    case 'failed':
      return 'Blocked';
    default:
      return formatRegistryPackageStatus(status);
  }
}

function formatContributionKindLabel(kind) {
  switch (kind) {
    case 'markdownFenceHandlers':
      return 'Fence handlers';
    case 'pipelines':
      return 'Pipelines';
    case 'surfaces':
      return 'Surfaces';
    default:
      return 'Commands';
  }
}

function formatSurfaceDiagnosticSummary(diagnostic) {
  const severity = String(diagnostic?.severity ?? 'information').toUpperCase();
  const code = String(diagnostic?.code ?? '').trim();
  const message = String(diagnostic?.message ?? 'Diagnostic').trim();
  return code ? `[${severity}] ${code}: ${message}` : `[${severity}] ${message}`;
}

function renderRegistryItems(items, formatter) {
  return element(
    'ul',
    { className: 'tf-registry__list' },
    ...items.map((item, index) =>
      element('li', { key: `${index}:${formatter(item)}` }, formatter(item))),
  );
}

function ContributionRegistryView({ inspectorModel, inspectedDocumentEntry }) {
  const documentContext = inspectorModel.document;
  const packs = inspectorModel.packages;
  const documentHeadline = inspectedDocumentEntry?.path ?? 'No active document';

  return element(
    'div',
    { className: 'tf-registry' },
    element(
      'article',
      { className: 'tf-registry__card' },
      element(
        'div',
        { className: 'tf-registry__header' },
        element(
          'div',
          { className: 'tf-registry__identity' },
          element('strong', null, 'Registry overview'),
          element(
            'span',
            { className: 'tf-registry__status tf-registry__status--available' },
            `${inspectorModel.summary.availablePackageCount}/${inspectorModel.summary.packageCount} ready`,
          ),
        ),
        element('span', null, 'Bundled static only'),
      ),
      element(
        'p',
        null,
        'The inspector reports bundled package state, current-document capability activation, exposed contributions, and diagnostics without introducing plugin installs or remote loading.',
      ),
      element(
        'dl',
        { className: 'tf-registry__meta' },
        element('div', null, element('dt', null, 'Packages'), element('dd', null, String(inspectorModel.summary.packageCount))),
        element('div', null, element('dt', null, 'Blocked packs'), element('dd', null, String(inspectorModel.summary.blockedPackageCount))),
        element('div', null, element('dt', null, 'Capabilities'), element('dd', null, String(inspectorModel.summary.capabilityCount))),
        element('div', null, element('dt', null, 'Active capabilities'), element('dd', null, String(inspectorModel.summary.activeCapabilityCount))),
        element('div', null, element('dt', null, 'Active surfaces'), element('dd', null, String(inspectorModel.summary.activeSurfaceCount))),
        element('div', null, element('dt', null, 'Diagnostics'), element('dd', null, String(inspectorModel.summary.diagnosticCount))),
      ),
    ),
    element(
      'article',
      { className: 'tf-registry__card' },
      element(
        'div',
        { className: 'tf-registry__header' },
        element(
          'div',
          { className: 'tf-registry__identity' },
          element('strong', null, 'Current document capability context'),
          element(
            'span',
            { className: `tf-registry__status tf-registry__status--${documentContext ? 'available' : 'disabled'}` },
            documentContext ? 'Resolved' : 'No document',
          ),
        ),
        element('span', null, documentHeadline),
      ),
      element(
        'p',
        null,
        documentContext
          ? 'The active capability set is resolved per document from bundled defaults plus explicit %require directives. Short-name conflicts stay diagnostic-producing instead of silently winning by registration order.'
          : 'Select or focus a resource to inspect its active capability context.',
      ),
      documentContext
        ? element(
          React.Fragment,
          null,
          element(
            'dl',
            { className: 'tf-registry__meta' },
            element('div', null, element('dt', null, 'Requirements'), element('dd', null, String(documentContext.requirements.length))),
            element('div', null, element('dt', null, 'Conflicts'), element('dd', null, String(documentContext.shortNameConflicts.length))),
            element('div', null, element('dt', null, 'Diagnostics'), element('dd', null, String(documentContext.diagnostics.length))),
          ),
          documentContext.activationOrder.length > 0
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Activation order'),
              renderRegistryItems(documentContext.activationOrder, (activation) =>
                `${formatActivationSource(activation.source)}: ${activation.capabilityId}`),
            )
            : null,
          packs.some((pack) => pack.activeCapabilityCount > 0)
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Active capability routing'),
              element(
                'div',
                { className: 'tf-registry__capability-groups' },
                ...packs
                  .filter((pack) => pack.activeCapabilityCount > 0)
                  .map((pack) =>
                    element(
                      'section',
                      { key: `${pack.packageId}:capabilities`, className: 'tf-registry__group' },
                      element('strong', null, pack.packageId),
                      renderRegistryItems(
                        pack.capabilities.filter((capability) => capability.status === 'active'),
                        (capability) =>
                          `${formatCapabilityLabel(capability)} - ${capability.activationSources.map(formatActivationSource).join(', ')}`,
                      ),
                    )),
              ),
            )
            : null,
          documentContext.requirements.length > 0
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Document requirements'),
              renderRegistryItems(documentContext.requirements, (requirement) =>
                `%require ${requirement.name ?? requirement.capabilityId} - ${formatRequirementStatus(requirement.status)}${requirement.matchedCapabilityId ? ` (${requirement.matchedCapabilityId})` : ''}`),
            )
            : null,
          ['surfaces', 'pipelines', 'markdownFenceHandlers'].some((kind) =>
            packs.some((pack) => pack.activeContributionCounts[kind] > 0))
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Exposed contributions'),
              element(
                'div',
                { className: 'tf-registry__contribution-groups' },
                ...['surfaces', 'pipelines', 'markdownFenceHandlers'].map((kind) => {
                  const activeItems = packs.flatMap((pack) =>
                    pack.contributions[kind].filter((entry) => entry.status === 'active'));
                  if (activeItems.length === 0) {
                    return null;
                  }

                  return element(
                    'section',
                    { key: kind, className: 'tf-registry__group' },
                    element('strong', null, formatContributionKindLabel(kind)),
                    renderRegistryItems(activeItems, (entry) =>
                      entry.kind === 'markdownFenceHandlers'
                        ? `${entry.localName ?? entry.id} (${entry.fenceNames?.join(', ') ?? 'no fence names'})`
                        : `${entry.localName ?? entry.id} (${entry.id})`),
                  );
                }).filter(Boolean),
              ),
            )
            : null,
          documentContext.shortNameConflicts.length > 0
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Active-context conflicts'),
              renderRegistryItems(documentContext.shortNameConflicts, (conflict) =>
                `${conflict.kind} short name "${conflict.localName}" -> ${conflict.contributionIds.join(', ')}`),
            )
            : null,
          documentContext.diagnostics.length > 0
            ? element(
              'div',
              { className: 'tf-registry__section' },
              element('h4', null, 'Inspector diagnostics'),
              renderRegistryItems(documentContext.diagnostics, (diagnostic) =>
                `${diagnostic.code ?? 'diagnostic'}: ${diagnostic.message}`),
            )
            : null,
        )
        : null,
    ),
    ...packs.map((pack) =>
      element(
        'article',
        { key: pack.packageId, className: 'tf-registry__card' },
        element(
          'div',
          { className: 'tf-registry__header' },
          element(
            'div',
            { className: 'tf-registry__identity' },
            element('strong', null, pack.packageId),
            element(
              'span',
              { className: `tf-registry__status tf-registry__status--${pack.status}` },
              formatRegistryPackageStatus(pack.status),
            ),
          ),
          element(
            'span',
            null,
            `${pack.contributions.commands.length} commands / ${pack.contributions.surfaces.length} surfaces / ${pack.contributions.pipelines.length} pipelines`,
          ),
        ),
        element(
          'p',
          null,
          pack.status === 'available'
            ? 'Bundled static contribution pack registered through the canonical core manifest.'
            : `Bundled static contribution pack is present but blocked: ${pack.statusReason ?? pack.status}.`,
        ),
        element(
          'dl',
          { className: 'tf-registry__meta' },
          element('div', null, element('dt', null, 'Version'), element('dd', null, pack.version ?? 'workspace')),
          element('div', null, element('dt', null, 'Capabilities'), element('dd', null, String(pack.capabilities.length))),
          element('div', null, element('dt', null, 'Active capabilities'), element('dd', null, String(pack.activeCapabilityCount))),
          element('div', null, element('dt', null, 'Active surfaces'), element('dd', null, String(pack.activeContributionCounts.surfaces))),
        ),
        pack.dependencies.length > 0
          ? element(
            'div',
            { className: 'tf-registry__section' },
            element('h4', null, 'Dependencies'),
            renderRegistryItems(pack.dependencies, (dependency) =>
              `${dependency.packageId}${dependency.versionRange ? ` ${dependency.versionRange}` : ''} - ${formatRegistryPackageStatus(dependency.status)}`),
          )
          : null,
        pack.conflicts.length > 0
          ? element(
            'div',
            { className: 'tf-registry__section' },
            element('h4', null, 'Conflicts'),
            renderRegistryItems(pack.conflicts, (conflictKey) => `Conflict: ${conflictKey}`),
          )
          : null,
        pack.capabilities.length > 0
          ? element(
            'div',
            { className: 'tf-registry__section' },
            element('h4', null, 'Provided capabilities'),
            renderRegistryItems(pack.capabilities, (capability) => {
              const aliasText = capability.aliases.length > 0 ? ` aliases: ${capability.aliases.join(', ')}` : '';
              const activationText = capability.activationSources.length > 0
                ? ` via ${capability.activationSources.map(formatActivationSource).join(', ')}`
                : '';
              const requirementText = capability.matchedRequirementNames.length > 0
                ? ` required by ${capability.matchedRequirementNames.join(', ')}`
                : '';
              return `${formatCapabilityLabel(capability)} - ${formatCapabilityState(capability.status)}${activationText}${requirementText}${aliasText}`;
            }),
          )
          : null,
        ['surfaces', 'pipelines', 'markdownFenceHandlers'].map((kind) => {
          if (pack.contributions[kind].length === 0) {
            return null;
          }

          return element(
            'div',
            { key: `${pack.packageId}:${kind}`, className: 'tf-registry__section' },
            element('h4', null, formatContributionKindLabel(kind)),
            renderRegistryItems(pack.contributions[kind], (entry) => {
              const fenceText = entry.kind === 'markdownFenceHandlers' && entry.fenceNames?.length
                ? ` fences: ${entry.fenceNames.join(', ')}`
                : '';
              const capabilityText = entry.capabilityIds.length > 0
                ? ` capabilities: ${entry.capabilityIds.join(', ')}`
                : '';
              return `${entry.localName ?? entry.id} - ${formatCapabilityState(entry.status)}${fenceText}${capabilityText}`;
            }),
          );
        }).filter(Boolean),
        pack.diagnostics.length > 0
          ? element(
            'div',
            { className: 'tf-registry__section' },
            element('h4', null, 'Package diagnostics'),
            renderRegistryItems(pack.diagnostics, (diagnostic) =>
              `${diagnostic.code ?? diagnostic.severity}: ${diagnostic.message}`),
          )
          : null,
      )),
  );
}

function StoragePaneView({ controller, snapshot }) {
  const { persistenceStatus } = snapshot;
  const statusTone = persistenceStatus.state === 'error'
    ? 'warning'
    : persistenceStatus.state === 'persisting'
      ? 'info'
      : 'success';
  const storageEngine = persistenceStatus.browserManaged === false
    ? `${persistenceStatus.driver} / transient`
    : `${persistenceStatus.driver} / IndexedDB`;

  return element(
    'div',
    { className: 'tf-storage' },
    element(TextForgeCallout, {
      tone: statusTone,
      title: 'Browser-managed workspace boundary',
      actions: snapshot.runtime.status === 'loading'
        ? []
        : snapshot.state.storageResetPending
          ? [
            element(TextForgeToolbarButton, {
              key: 'cancel-reset',
              kind: 'secondary',
              label: 'Cancel',
              onPress: controller.actions.cancelStorageReset,
            }),
            element(TextForgeToolbarButton, {
              key: 'confirm-reset',
              kind: 'primary',
              label: 'Reset Browser Workspace Now',
              onPress: controller.actions.confirmStorageReset,
            }),
          ]
          : [
            element(TextForgeToolbarButton, {
              key: 'request-reset',
              kind: 'primary',
              label: 'Reset Browser Workspace',
              onPress: controller.actions.requestStorageReset,
            }),
            element(TextForgeToolbarButton, {
              key: 'retry-hydration',
              kind: 'secondary',
              label: 'Retry Load',
              onPress: controller.actions.retryStorageInitialization,
            }),
          ],
      children: element(
        React.Fragment,
        null,
        element('p', null, 'TextForge stores the workspace in browser-managed IndexedDB through Dexie. Clearing site data may remove it.'),
        element('p', null, 'The app does not use File System Access API, directory handles, background sync, remote sync, or silent local file access.'),
        snapshot.state.storageResetPending
          ? element('p', null, 'Resetting clears the stored workspace content and rebuilds the starter seed. Open tabs and layout are not preserved.')
          : null,
      ),
    }),
    snapshot.runtime.status === 'error'
      ? element(TextForgeCallout, {
        tone: 'warning',
        title: snapshot.runtime.storageFailure?.title ?? 'Storage recovery required',
        children: element('p', null, snapshot.runtime.storageFailure?.detail ?? 'Reset browser storage to recover.'),
      })
      : null,
    snapshot.runtime.status === 'ready' && persistenceStatus.state === 'error'
      ? element(TextForgeCallout, {
        tone: 'warning',
        title: snapshot.runtime.storageFailure?.title ?? 'Workspace storage unavailable',
        children: element('p', null, snapshot.runtime.storageFailure?.detail ?? 'Changes are available for this session but are not being saved to IndexedDB.'),
      })
      : null,
    element(
      'dl',
      { className: 'tf-meta-list tf-storage__meta' },
      element('div', null, element('dt', null, 'Storage engine'), element('dd', null, storageEngine)),
      element('div', null, element('dt', null, 'Database'), element('dd', null, persistenceStatus.databaseName)),
      element('div', null, element('dt', null, 'Hydration source'), element('dd', null, snapshot.runtime.hydrationSource)),
      element('div', null, element('dt', null, 'Save state'), element('dd', null, persistenceStatus.state)),
      element('div', null, element('dt', null, 'Last saved'), element('dd', null, persistenceStatus.lastSavedAt ?? 'Not saved yet')),
      element('div', null, element('dt', null, 'Schema version'), element('dd', null, String(persistenceStatus.schemaVersion))),
    ),
  );
}

function PopupSessionsView({ controller, popupFrame }) {
  if (popupFrame.tabs.length === 0) {
    return element(TextForgeEmptyState, {
      eyebrow: 'Popup surfaces',
      icon: 'utility',
      title: 'No popup sessions are open',
      children: element(
        'p',
        null,
        'Open a viewer-compatible resource from the workspace tree or run an asset command to mount it here.',
      ),
    });
  }

  return element(
    'div',
    { className: 'tf-popup-summary' },
    ...popupFrame.tabs.map((tab) =>
      element(
        TextForgeInspectorCard,
        {
          key: tab.id,
          eyebrow: tab.id === popupFrame.activeTabId ? 'Active popup' : 'Popup session',
          icon: 'utility',
          title: tab.title,
          actions: [
            element(TextForgeToolbarButton, {
              key: `${tab.id}:focus`,
              kind: 'secondary',
              label: tab.id === popupFrame.activeTabId ? 'Focused' : 'Focus',
              onPress: () => controller.actions.focusPopupSession(tab.id),
            }),
            element(TextForgeToolbarButton, {
              key: `${tab.id}:close`,
              kind: 'secondary',
              label: 'Close',
              onPress: () => controller.actions.closeSession(tab.id),
            }),
          ],
        },
      )),
  );
}

function TransientFlag({ flag }) {
  if (!flag) {
    return null;
  }

  const shellWidth = typeof window === 'undefined'
    ? 320
    : Math.min(320, Math.max(220, window.innerWidth - 28));
  return element(
    'div',
    {
      'aria-live': 'polite',
      style: {
        position: 'fixed',
        right: '14px',
        bottom: '72px',
        width: `${shellWidth}px`,
        zIndex: 45,
        pointerEvents: 'none',
      },
    },
    element(
      'div',
      {
        style: {
          boxShadow: '0 18px 36px rgba(2, 6, 23, 0.36)',
          backdropFilter: 'blur(12px)',
        },
      },
      element(TextForgeCallout, {
        tone: flag.tone ?? 'warning',
        title: flag.title,
        children: flag.body ? element('p', null, flag.body) : null,
      }),
    ),
  );
}

export function TextForgeWorkbenchApp({ controller }) {
  const snapshot = useWorkbenchSnapshot(controller);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const mainView = snapshot.activeMainView;
  const utilityOpen = snapshot.state.utilityPaneOpen;
  const showInspectorPane = snapshot.state.utilitySectionId === 'inspector';
  const showPopupSessions = snapshot.state.utilitySectionId === 'popups';
  const showStoragePane = snapshot.state.utilitySectionId === 'storage';
  const activeUtilitySection = snapshot.utilitySections.find((section) => section.id === snapshot.state.utilitySectionId);
  const inspectorView = snapshot.state.surfaceFocusPlacement === 'popup'
    ? snapshot.activePopupView
    : mainView.kind === 'surface'
      ? mainView
      : undefined;
  const popupOverlay = snapshot.popupFrame.tabs.length > 0 && snapshot.activePopupView
    ? element(
      TextForgePopupHost,
      {
        frameModel: snapshot.popupFrame,
        onCloseTab: controller.actions.closeSession,
        onClose: controller.actions.closeActivePopupSurface,
        onRequestTabContextMenu: controller.actions.openPopupSessionContextMenu,
        onSelectTab: (tabId) => {
          rememberMountedSurfaceScroll(snapshot.activePopupView);
          controller.actions.focusPopupSession(tabId);
        },
        title: snapshot.activePopupView.title,
      },
      element(SurfaceMount, {
        key: snapshot.activePopupView.id,
        view: snapshot.activePopupView,
      }),
    )
    : null;
  const visualTargetPickerOverlay = snapshot.visualTargetPicker
    ? element(ItmVisualTargetPickerOverlay, {
      picker: snapshot.visualTargetPicker,
      controller,
    })
    : null;

  React.useEffect(() => {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    function handleFileDragOver(event) {
      if (!hasDroppedFiles(event.dataTransfer)) {
        return;
      }

      const target = event.target instanceof Element ? event.target : undefined;
      const folderDropTarget = target?.closest('[data-workspace-folder-drop]');
      const uploadDropTarget = target?.closest('[data-upload-drop-zone]');
      if (!folderDropTarget && !uploadDropTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }

    function handleFileDrop(event) {
      if (!hasDroppedFiles(event.dataTransfer)) {
        return;
      }

      const files = listDroppedFiles(event.dataTransfer);
      if (files.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const target = event.target instanceof Element ? event.target : undefined;
      const folderDropTarget = target?.closest('[data-workspace-folder-drop]');
      if (folderDropTarget instanceof HTMLElement) {
        const folderId = folderDropTarget.dataset.workspaceFolderDrop;
        if (folderId) {
          void controller.actions.dropFilesOnWorkspaceFolder(folderId, files);
          return;
        }
      }

      const uploadDropTarget = target?.closest('[data-upload-drop-zone]');
      if (uploadDropTarget) {
        void controller.actions.dropFilesOnTabStrip(files);
      }
    }

    window.addEventListener('dragover', handleFileDragOver, true);
    window.addEventListener('drop', handleFileDrop, true);
    return () => {
      window.removeEventListener('dragover', handleFileDragOver, true);
      window.removeEventListener('drop', handleFileDrop, true);
    };
  }, [controller]);

  const mainViewportContent = snapshot.runtime.recoveryPromptActive
    ? element(StartupRecoveryState, { controller })
    : snapshot.runtime.status === 'loading'
    ? element(LoadingState)
    : snapshot.runtime.status === 'error'
      ? element(RecoveryState, { controller, snapshot })
      : mainView.kind === 'welcome'
        ? element(WelcomeState, { hydrationSource: snapshot.runtime.hydrationSource })
        : element(SurfaceMount, {
          key: mainView.id,
          view: mainView,
        });

  async function handleCommandPress(commandId) {
    setCommandPaletteOpen(false);

    try {
      await controller.actions.executeCommand(commandId);
    } catch (error) {
      window.alert(error?.message ?? 'Shell command failed.');
    }
  }

  return element(
    React.Fragment,
    null,
    element(
      TextForgeAppFrame,
      {
        header: element(TextForgeTopBar, {
          brandTitle: snapshot.chromeModel.brandTitle,
          commandPaletteLabel: 'Commands',
          commandPaletteShortcut: 'Ctrl+K',
          menuGroups: snapshot.commandMenus,
          onCommandPress: handleCommandPress,
          onOpenCommandPalette: () => setCommandPaletteOpen(true),
          toolbarSlots: snapshot.chromeModel.toolbarSlots,
        }),
        sidebar: element(TextForgeWorkspaceSidebar, {
          collapsed: snapshot.state.workspaceTreeCollapsed,
          editingItemId: snapshot.state.workspaceTreeEdit?.itemId,
          editingSelectionEnd: snapshot.state.workspaceTreeEdit?.selectionEnd,
          editingSelectionStart: snapshot.state.workspaceTreeEdit?.selectionStart,
          editingValue: snapshot.state.workspaceTreeEdit?.value ?? '',
          onCancelEdit: controller.actions.cancelWorkspaceTreeEdit,
          onClose: () => controller.actions.setWorkspaceTreeCollapsed(true),
          onCommitEdit: () => void controller.actions.commitWorkspaceTreeEdit(),
          onDropFilesToFolder: controller.actions.dropFilesOnWorkspaceFolder,
          onMoveItem: (sourceItemId, targetItemId) => void controller.actions.moveWorkspaceItem(sourceItemId, targetItemId),
          onActivateItem: controller.actions.activateWorkspaceItem,
          onRequestItemContextMenu: controller.actions.openWorkspaceItemContextMenu,
          onSelectItem: controller.actions.selectWorkspaceItem,
          onToggleFolder: controller.actions.toggleWorkspaceFolder,
          onUpdateEditValue: controller.actions.updateWorkspaceTreeEditValue,
          workspaceTree: snapshot.chromeModel.workspaceTree,
        }),
        onSidebarCollapsedChange: controller.actions.setWorkspaceTreeCollapsed,
        onUtilityCollapsedChange: controller.actions.setUtilityPaneCollapsed,
        sidebarCollapsed: snapshot.state.workspaceTreeCollapsed,
        utility: element(
          TextForgeUtilityPane,
          {
            activeSectionId: snapshot.state.utilitySectionId,
            onClose: () => controller.actions.setUtilityPaneCollapsed(true),
            onSelectSection: controller.actions.setUtilitySection,
            sections: snapshot.utilitySections,
            title: activeUtilitySection?.label ?? 'Inspector',
          },
          showInspectorPane
            ? element(
              React.Fragment,
              null,
              inspectorView
                ? element(SurfaceDetails, { view: inspectorView })
                : element(TextForgeEmptyState, {
                  eyebrow: 'Inspector',
                  icon: 'info',
                  title: 'No active surface selected',
                }, element('p', null, 'Open or focus a document to inspect it here.')),
              element(WorkbenchDetailsCard),
            )
            : showPopupSessions
            ? element(PopupSessionsView, {
              controller,
              popupFrame: snapshot.popupFrame,
            })
            : showStoragePane
              ? element(StoragePaneView, { controller, snapshot })
              : element(ContributionRegistryView, {
                inspectorModel: snapshot.contributionInspectorModel,
                inspectedDocumentEntry: snapshot.inspectedDocumentEntry,
              }),
        ),
        utilityOpen,
      },
      element(
        'section',
        { className: 'tf-surface-frame' },
        element(TextForgeSessionTabStrip, {
          emptyLabel: 'No documents are open',
          frameModel: snapshot.chromeModel.surfaceFrame,
          onCreateTab: controller.actions.createTextResourceInSelectedFolder,
          onCloseTab: controller.actions.closeSession,
          onDropFiles: controller.actions.dropFilesOnTabStrip,
          onRequestTabContextMenu: controller.actions.openMainTabContextMenu,
          onSelectTab: (tabId) => {
            rememberMountedSurfaceScroll(mainView);
            controller.actions.focusMainSession(tabId);
          },
        }),
        element(
          'div',
          { className: 'tf-surface-frame__body' },
        element(
          'div',
          {
            className: 'tf-surface-frame__viewport',
            'data-view-kind': mainView.kind,
          },
          mainViewportContent,
        ),
        ),
        popupOverlay,
      ),
    ),
    element(
      'div',
      {
        className: 'tf-shell-statusbar',
        'aria-live': 'polite',
      },
      element(TextForgeStatusRail, { badges: snapshot.chromeModel.statusBadges }),
    ),
    element(TextForgeCommandPalette, {
      entries: snapshot.commandPaletteEntries,
      onClose: () => setCommandPaletteOpen(false),
      onCommandPress: handleCommandPress,
      open: commandPaletteOpen,
      placeholder: 'Search command labels, groups, and keywords',
      title: 'Command palette',
    }),
    element(TextForgeContextMenu, {
      items: snapshot.contextMenu?.items,
      onClose: controller.actions.closeContextMenu,
      onCommandPress: (commandId) => void controller.actions.executeCommand(commandId, snapshot.contextMenu?.context),
      open: Boolean(snapshot.contextMenu?.items?.length),
      position: snapshot.contextMenu ? { x: snapshot.contextMenu.x, y: snapshot.contextMenu.y } : undefined,
      title: 'Context menu',
    }),
    element(TransientFlag, {
      flag: snapshot.state.transientFlag,
    }),
    visualTargetPickerOverlay,
  );
}

let mountedShell;
