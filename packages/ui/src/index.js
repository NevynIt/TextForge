import * as React from 'react';

const element = React.createElement;

function classNames(...tokens) {
  return tokens.filter(Boolean).join(' ');
}

function listFocusableItems(currentTarget, selector) {
  const root = currentTarget.closest('[data-roving-root]');
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll(selector)).filter((candidate) => !candidate.disabled);
}

function moveFocus(currentTarget, selector, strategy) {
  const items = listFocusableItems(currentTarget, selector);
  const currentIndex = items.indexOf(currentTarget);
  if (items.length === 0 || currentIndex < 0) {
    return undefined;
  }

  const nextIndex = strategy(currentIndex, items.length);
  const nextItem = items[nextIndex];
  if (!nextItem) {
    return undefined;
  }

  nextItem.focus();
  return nextItem.dataset.itemId;
}

function handleHorizontalTabsKeyDown(event, onSelect) {
  let nextId;
  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault();
      nextId = moveFocus(event.currentTarget, '[role="tab"]', (index, length) => (index + 1) % length);
      break;
    case 'ArrowLeft':
      event.preventDefault();
      nextId = moveFocus(event.currentTarget, '[role="tab"]', (index, length) => (index - 1 + length) % length);
      break;
    case 'Home':
      event.preventDefault();
      nextId = moveFocus(event.currentTarget, '[role="tab"]', () => 0);
      break;
    case 'End':
      event.preventDefault();
      nextId = moveFocus(event.currentTarget, '[role="tab"]', (_index, length) => length - 1);
      break;
    default:
      return;
  }

  if (nextId) {
    onSelect?.(nextId);
  }
}

function handleTreeKeyDown(event, onSelect) {
  let nextId;
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      nextId = moveFocus(event.currentTarget, '[role="treeitem"]', (index, length) => (index + 1) % length);
      break;
    case 'ArrowUp':
      event.preventDefault();
      nextId = moveFocus(event.currentTarget, '[role="treeitem"]', (index, length) => (index - 1 + length) % length);
      break;
    case 'Home':
      event.preventDefault();
      nextId = moveFocus(event.currentTarget, '[role="treeitem"]', () => 0);
      break;
    case 'End':
      event.preventDefault();
      nextId = moveFocus(event.currentTarget, '[role="treeitem"]', (_index, length) => length - 1);
      break;
    default:
      return;
  }

  if (nextId) {
    onSelect?.(nextId);
  }
}

export function createWorkbenchTheme(overrides = {}) {
  const defaultTheme = {
    id: 'textforge-default',
    name: 'TextForge Default',
    mode: 'system',
    colors: {
      brand: '#152033',
      accent: '#2f8f88',
      background: '#0b1020',
      surface: '#101728',
      surfaceRaised: '#161f33',
      border: '#2a3347',
      text: '#e6edf7',
      mutedText: '#8fa0b8',
      danger: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
    },
    typography: {
      family: '"Inter", "Segoe UI", sans-serif',
      size: '14px',
      lineHeight: '1.5',
      weightRegular: 400,
      weightStrong: 600,
    },
    radius: '10px',
    shadow: '0 10px 24px rgb(2 6 23 / 0.18)',
  };

  return {
    ...defaultTheme,
    ...overrides,
    colors: {
      ...defaultTheme.colors,
      ...(overrides.colors ?? {}),
    },
    typography: {
      ...defaultTheme.typography,
      ...(overrides.typography ?? {}),
    },
  };
}

export const defaultTheme = createWorkbenchTheme();

export function createWorkspaceTreeFrameModel(overrides = {}) {
  return {
    id: 'workspace-tree-frame',
    title: 'Workspace',
    rootLabel: 'Workspace root',
    items: [],
    selectedResourceId: undefined,
    ...overrides,
    items: overrides.items ?? [],
  };
}

export function createSurfaceFrameModel(overrides = {}) {
  return {
    id: 'surface-frame',
    title: 'Documents',
    placement: 'main',
    layout: 'tabs',
    tabs: [],
    activeTabId: undefined,
    ...overrides,
    tabs: overrides.tabs ?? [],
  };
}

export function createToolbarSlot(overrides) {
  return {
    ...overrides,
  };
}

export function createStatusBadge(overrides) {
  return {
    ...overrides,
  };
}

export function createAppFrameModel(overrides = {}) {
  return {
    id: 'textforge-app-frame',
    brandTitle: 'TextForge',
    subtitle: 'Local-first workbench shell',
    density: 'comfortable',
    theme: defaultTheme,
    slots: [
      { id: 'workspace-tree', label: 'Workspace tree', pinned: true },
      { id: 'surface-chrome', label: 'Surface chrome', pinned: true },
      { id: 'utility-pane', label: 'Utility pane', pinned: false },
    ],
    regions: [
      { id: 'toolbar', title: 'Toolbar', kind: 'toolbar', slotIds: ['workspace-tree', 'utility-pane'] },
      { id: 'sidebar', title: 'Sidebar', kind: 'sidebar', slotIds: ['workspace-tree'] },
      { id: 'main', title: 'Main surface', kind: 'main', slotIds: ['surface-chrome'] },
      { id: 'utility', title: 'Utility pane', kind: 'overlay', slotIds: ['utility-pane'] },
    ],
    workspaceTree: createWorkspaceTreeFrameModel(),
    surfaceFrame: createSurfaceFrameModel(),
    toolbarSlots: [
      createToolbarSlot({ id: 'open-notes', label: 'Open notes', kind: 'workspace', pinned: true }),
      createToolbarSlot({ id: 'open-architecture', label: 'Architecture note', kind: 'workspace' }),
    ],
    statusBadges: [
      createStatusBadge({ id: 'workspace-status', label: 'Workspace ready', tone: 'success' }),
      createStatusBadge({ id: 'surface-status', label: 'No active documents', tone: 'neutral' }),
    ],
    ...overrides,
    theme: overrides.theme ?? defaultTheme,
    slots: overrides.slots ?? [
      { id: 'workspace-tree', label: 'Workspace tree', pinned: true },
      { id: 'surface-chrome', label: 'Surface chrome', pinned: true },
      { id: 'utility-pane', label: 'Utility pane', pinned: false },
    ],
    regions: overrides.regions ?? [
      { id: 'toolbar', title: 'Toolbar', kind: 'toolbar', slotIds: ['workspace-tree', 'utility-pane'] },
      { id: 'sidebar', title: 'Sidebar', kind: 'sidebar', slotIds: ['workspace-tree'] },
      { id: 'main', title: 'Main surface', kind: 'main', slotIds: ['surface-chrome'] },
      { id: 'utility', title: 'Utility pane', kind: 'overlay', slotIds: ['utility-pane'] },
    ],
    workspaceTree: overrides.workspaceTree ?? createWorkspaceTreeFrameModel(),
    surfaceFrame: overrides.surfaceFrame ?? createSurfaceFrameModel(),
    toolbarSlots: overrides.toolbarSlots ?? [
      createToolbarSlot({ id: 'open-notes', label: 'Open notes', kind: 'workspace', pinned: true }),
      createToolbarSlot({ id: 'open-architecture', label: 'Architecture note', kind: 'workspace' }),
    ],
    statusBadges: overrides.statusBadges ?? [
      createStatusBadge({ id: 'workspace-status', label: 'Workspace ready', tone: 'success' }),
      createStatusBadge({ id: 'surface-status', label: 'No active documents', tone: 'neutral' }),
    ],
  };
}

export function createWorkbenchChromeModel(overrides = {}) {
  const frame = createAppFrameModel(overrides);
  return {
    ...frame,
    workspaceTree: frame.workspaceTree ?? createWorkspaceTreeFrameModel(),
    surfaceFrame: frame.surfaceFrame ?? createSurfaceFrameModel(),
    toolbarSlots: frame.toolbarSlots ?? [],
    statusBadges: frame.statusBadges ?? [],
  };
}

export function TextForgeToolbarButton({
  active = false,
  ariaLabel,
  disabled = false,
  kind = 'secondary',
  label,
  onPress,
  title,
}) {
  return element(
    'button',
    {
      type: 'button',
      className: classNames('tf-button', `tf-button--${kind}`, active && 'is-active'),
      'aria-label': ariaLabel ?? label,
      'aria-pressed': kind === 'toggle' ? active : undefined,
      disabled,
      onClick: onPress,
      title: title ?? ariaLabel ?? label,
    },
    label,
  );
}

export function TextForgeStatusRail({ badges = [] }) {
  return element(
    'div',
    { className: 'tf-status-rail', 'aria-label': 'Workbench status' },
    ...badges.map((badge) =>
      element(
        'span',
        {
          key: badge.id,
          className: classNames('tf-badge', `tf-badge--${badge.tone}`),
          title: badge.detail ?? badge.label,
        },
        badge.label,
      )),
  );
}

export function TextForgeTopBar({
  brandTitle,
  onToggleSidebar,
  onToggleUtility,
  sidebarCollapsed = false,
  statusBadges = [],
  subtitle,
  toolbarSlots = [],
  utilityOpen = false,
  onToolbarAction,
}) {
  const actions = [
    element(TextForgeToolbarButton, {
      key: 'toggle-sidebar',
      active: !sidebarCollapsed,
      ariaLabel: sidebarCollapsed ? 'Show workspace tree' : 'Hide workspace tree',
      kind: 'toggle',
      label: sidebarCollapsed ? 'Show Tree' : 'Hide Tree',
      onPress: onToggleSidebar,
    }),
    ...toolbarSlots.map((slot) =>
      element(TextForgeToolbarButton, {
        key: slot.id,
        ariaLabel: slot.description ?? slot.label,
        disabled: slot.disabled,
        kind: slot.pinned ? 'primary' : 'secondary',
        label: slot.label,
        onPress: () => onToolbarAction?.(slot.id),
        title: slot.description,
      })),
    element(TextForgeToolbarButton, {
      key: 'toggle-utility',
      active: utilityOpen,
      ariaLabel: utilityOpen ? 'Hide utility pane' : 'Show utility pane',
      kind: 'toggle',
      label: utilityOpen ? 'Hide Utility' : 'Show Utility',
      onPress: onToggleUtility,
    }),
  ];

  return element(
    'header',
    { className: 'tf-topbar' },
    element(
      'div',
      { className: 'tf-brand' },
      element('div', { className: 'tf-brand__mark', 'aria-hidden': 'true' }, 'TF'),
      element(
        'div',
        { className: 'tf-brand__text' },
        element('strong', null, brandTitle),
        subtitle ? element('span', null, subtitle) : null,
      ),
    ),
    element(TextForgeStatusRail, { badges: statusBadges }),
    element('div', { className: 'tf-topbar__actions' }, ...actions),
  );
}

export function TextForgeWorkspaceSidebar({
  collapsed = false,
  footer,
  onSelectItem,
  onToggleCollapsed,
  workspaceTree,
}) {
  const selectedIndex = workspaceTree.items.findIndex((item) => item.id === workspaceTree.selectedResourceId);
  const fallbackIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const header = element(
    'div',
    { className: 'tf-pane__header' },
    element(
      'div',
      null,
      element('h2', { className: 'tf-pane__title' }, workspaceTree.title),
      element('p', { className: 'tf-pane__subtitle' }, workspaceTree.rootLabel),
    ),
    onToggleCollapsed
      ? element(TextForgeToolbarButton, {
          active: !collapsed,
          ariaLabel: collapsed ? 'Expand workspace tree' : 'Collapse workspace tree',
          kind: 'toggle',
          label: collapsed ? 'Expand' : 'Collapse',
          onPress: onToggleCollapsed,
        })
      : null,
  );

  const items = collapsed
    ? []
    : workspaceTree.items.map((item, index) =>
        element(
          'li',
          { key: item.id, className: 'tf-tree__item' },
          element(
            'button',
            {
              type: 'button',
              className: classNames('tf-tree__row', item.id === workspaceTree.selectedResourceId && 'is-active'),
              role: 'treeitem',
              'aria-level': item.depth + 1,
              'aria-selected': item.id === workspaceTree.selectedResourceId,
              tabIndex: index === fallbackIndex ? 0 : -1,
              'data-item-id': item.id,
              onClick: () => onSelectItem?.(item.id),
              onKeyDown: (event) => handleTreeKeyDown(event, onSelectItem),
              title: item.path,
              style: { '--depth': item.depth },
            },
            element('span', { className: 'tf-tree__kind', 'aria-hidden': 'true' }, item.kind),
            element('span', { className: 'tf-tree__label' }, item.label),
            item.badge ? element('span', { className: 'tf-tree__badge' }, item.badge) : null,
          ),
        ));

  return element(
    'aside',
    {
      className: classNames('tf-sidebar', collapsed && 'is-collapsed'),
      'data-pane': 'workspace',
    },
    header,
    collapsed
      ? element(
          'div',
          { className: 'tf-sidebar__collapsed-note' },
          `${workspaceTree.items.length} items`,
        )
      : element(
          'ul',
          {
            className: 'tf-tree',
            role: 'tree',
            'aria-label': workspaceTree.title,
            'data-roving-root': 'workspace-tree',
          },
          ...items,
        ),
    footer ? element('div', { className: 'tf-sidebar__footer' }, footer) : null,
  );
}

export function TextForgeSessionTabStrip({
  emptyLabel = 'No open documents',
  frameModel,
  onCloseTab,
  onSelectTab,
}) {
  if ((frameModel.tabs ?? []).length === 0) {
    return element('div', { className: 'tf-tabstrip__empty' }, emptyLabel);
  }

  return element(
    'div',
    {
      className: 'tf-tabstrip',
      role: 'tablist',
      'aria-label': frameModel.title,
      'data-roving-root': 'session-tabs',
    },
    ...frameModel.tabs.map((tab) =>
      element(
        'div',
        {
          key: tab.id,
          className: classNames('tf-tab', tab.id === frameModel.activeTabId && 'is-active'),
        },
        element(
          'button',
          {
            type: 'button',
            role: 'tab',
            'aria-selected': tab.id === frameModel.activeTabId,
            tabIndex: tab.id === frameModel.activeTabId ? 0 : -1,
            className: 'tf-tab__button',
            'data-item-id': tab.id,
            onClick: () => onSelectTab?.(tab.id),
            onKeyDown: (event) => handleHorizontalTabsKeyDown(event, onSelectTab),
            title: tab.title,
          },
          element('span', { className: 'tf-tab__title' }, tab.title),
          tab.stale ? element('span', { className: 'tf-tab__state', 'aria-hidden': 'true' }, 'Stale') : null,
        ),
        onCloseTab && tab.surfaceId
          ? element(
              'button',
              {
                type: 'button',
                className: 'tf-tab__close',
                'aria-label': `Close ${tab.title}`,
                onClick: (event) => {
                  event.stopPropagation();
                  onCloseTab(tab.id);
                },
              },
              'Close',
            )
          : null,
      )),
  );
}

export function TextForgeSelectField({ control }) {
  return element(
    'label',
    { className: 'tf-field' },
    element('span', { className: 'tf-field__label' }, control.label),
    element(
      'select',
      {
        className: 'tf-field__input',
        value: control.value,
        disabled: Boolean(control.disabled),
        onChange: (event) => control.onChange?.(event.currentTarget.value),
      },
      ...control.options.map((option) =>
        element(
          'option',
          {
            key: option.value,
            title: option.description,
            value: option.value,
          },
          option.label,
        )),
    ),
    control.description ? element('span', { className: 'tf-field__description' }, control.description) : null,
  );
}

export function TextForgeUtilityPane({
  activeSectionId,
  children,
  onClose,
  onSelectSection,
  sections = [],
  subtitle,
  title = 'Utility',
}) {
  return element(
    'aside',
    {
      className: 'tf-utility',
      'data-pane': 'utility',
    },
    element(
      'div',
      { className: 'tf-pane__header' },
      element(
        'div',
        null,
        element('h2', { className: 'tf-pane__title' }, title),
        subtitle ? element('p', { className: 'tf-pane__subtitle' }, subtitle) : null,
      ),
      onClose
        ? element(TextForgeToolbarButton, {
            ariaLabel: 'Hide utility pane',
            kind: 'toggle',
            label: 'Hide',
            onPress: onClose,
          })
        : null,
    ),
    sections.length > 0
      ? element(
          'div',
          {
            className: 'tf-segments',
            role: 'tablist',
            'aria-label': 'Utility sections',
            'data-roving-root': 'utility-sections',
          },
          ...sections.map((section) =>
            element(
              'button',
              {
                key: section.id,
                type: 'button',
                role: 'tab',
                'aria-selected': section.id === activeSectionId,
                tabIndex: section.id === activeSectionId ? 0 : -1,
                className: classNames('tf-segments__button', section.id === activeSectionId && 'is-active'),
                'data-item-id': section.id,
                onClick: () => onSelectSection?.(section.id),
                onKeyDown: (event) => handleHorizontalTabsKeyDown(event, onSelectSection),
              },
              section.label,
            )),
        )
      : null,
    element('div', { className: 'tf-utility__body' }, children),
  );
}

export function TextForgeAppFrame({
  children,
  footer,
  header,
  sidebar,
  sidebarCollapsed = false,
  utility,
  utilityOpen = false,
}) {
  return element(
    'div',
    {
      className: classNames(
        'tf-app',
        sidebarCollapsed && 'is-sidebar-collapsed',
        utilityOpen && 'is-utility-open',
      ),
    },
    header,
    element(
      'div',
      { className: 'tf-app__body' },
      sidebar,
      element('main', { className: 'tf-app__main', 'data-pane': 'main' }, children),
      utilityOpen ? utility : null,
    ),
    footer ? element('footer', { className: 'tf-footer' }, footer) : null,
  );
}

export const defaultAppFrameModel = createAppFrameModel();

export const defaultIcons = [
  { name: 'search', glyph: 'S', viewBox: '0 0 24 24' },
  { name: 'check', glyph: 'C', viewBox: '0 0 24 24' },
  { name: 'warning', glyph: '!', viewBox: '0 0 24 24' },
  { name: 'close', glyph: 'X', viewBox: '0 0 24 24' },
];

export const contributions = {
  id: '@textforge/ui',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
};
