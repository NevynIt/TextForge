import * as React from 'react';
import {
  Group,
  Panel,
  Separator,
} from 'react-resizable-panels';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Command,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  HardDriveDownload,
  HardDriveUpload,
  Info,
  Lock,
  Search,
  Sparkles,
  SquareTerminal,
  X,
} from 'lucide-react';

const element = React.createElement;

const iconRegistry = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  search: Search,
  command: Command,
  folder: Folder,
  folderOpen: FolderOpen,
  fileText: FileText,
  fileImage: FileImage,
  fileBinary: File,
  import: HardDriveUpload,
  export: HardDriveDownload,
  collapse: ChevronLeft,
  expand: ChevronRight,
  close: X,
  utility: SquareTerminal,
  status: Sparkles,
  lock: Lock,
};

function classNames(...tokens) {
  return tokens.filter(Boolean).join(' ');
}

function normalizePanelConfig(config, defaults) {
  return {
    ...defaults,
    ...(config ?? {}),
  };
}

function IconGlyph({ className, name, size = 16, strokeWidth = 1.9 }) {
  const Icon = iconRegistry[name];
  if (!Icon) {
    return null;
  }

  return element(Icon, {
    className,
    size,
    strokeWidth,
    'aria-hidden': 'true',
    focusable: 'false',
  });
}

function resolveWorkspaceItemIcon(item) {
  if (item.kind === 'folder') {
    return item.active ? 'folderOpen' : 'folder';
  }

  if (item.detail === 'SVG' || item.detail === 'IMAGE' || item.detail === 'PDF') {
    return 'fileImage';
  }

  return item.kind === 'text' ? 'fileText' : 'fileBinary';
}

function describeBadgeTitle(badge, label) {
  return label ?? badge?.description ?? badge?.label;
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

function matchesCommandPaletteEntry(entry, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const searchable = [
    entry.label,
    entry.description,
    entry.group,
    entry.shortcut,
    ...(entry.keywords ?? []),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return searchable.some((value) => value.includes(normalizedQuery));
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
    toolbarSlots: [],
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
    toolbarSlots: overrides.toolbarSlots ?? [],
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
  icon,
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
    icon ? element(IconGlyph, { className: 'tf-button__icon', name: icon, size: 15 }) : null,
    element('span', { className: 'tf-button__label' }, label),
  );
}

export function TextForgeCallout({
  actions,
  children,
  tone = 'info',
  title,
}) {
  return element(
    'section',
    {
      className: classNames('tf-callout', `tf-callout--${tone}`),
      role: tone === 'warning' || tone === 'danger' ? 'alert' : 'status',
    },
    title ? element('h3', { className: 'tf-callout__title' }, title) : null,
    children ? element('div', { className: 'tf-callout__body' }, children) : null,
    actions?.length
      ? element('div', { className: 'tf-callout__actions' }, ...actions)
      : null,
  );
}

export function TextForgeResourceBadge({
  active = false,
  attention,
  badge,
  label,
  size = 'compact',
}) {
  if (!badge) {
    return null;
  }

  return element(
    'span',
    {
      className: classNames(
        'tf-resource-badge',
        `is-shape-${badge.shape}`,
        `is-accent-${badge.accent}`,
        `is-mark-${badge.mark}`,
        `is-placement-${badge.placement}`,
        `is-size-${size}`,
        active && 'is-active',
        attention && `is-${attention}`,
      ),
      role: 'img',
      'aria-label': describeBadgeTitle(badge, label),
      title: describeBadgeTitle(badge, label),
    },
    element('span', { className: 'tf-resource-badge__shape', 'aria-hidden': 'true' }),
    element('span', { className: 'tf-resource-badge__mark', 'aria-hidden': 'true' }),
    attention === 'warning'
      ? element(IconGlyph, {
        className: 'tf-resource-badge__alert',
        name: 'warning',
        size: 11,
        strokeWidth: 2.15,
      })
      : null,
  );
}

export function TextForgeInspectorCard({
  actions,
  children,
  eyebrow,
  icon,
  title,
}) {
  return element(
    'section',
    { className: 'tf-inspector-card' },
    element(
      'header',
      { className: 'tf-inspector-card__header' },
      element(
        'div',
        { className: 'tf-inspector-card__title' },
        eyebrow
          ? element('span', { className: 'tf-inspector-card__eyebrow' }, eyebrow)
          : null,
        element(
          'div',
          { className: 'tf-inspector-card__heading' },
          icon ? element(IconGlyph, { className: 'tf-inspector-card__icon', name: icon, size: 15 }) : null,
          element('strong', null, title),
        ),
      ),
      actions?.length ? element('div', { className: 'tf-inspector-card__actions' }, ...actions) : null,
    ),
    children ? element('div', { className: 'tf-inspector-card__body' }, children) : null,
  );
}

export function TextForgeEmptyState({
  actions,
  children,
  eyebrow,
  icon = 'info',
  title,
}) {
  return element(
    'section',
    { className: 'tf-empty-state' },
    element(IconGlyph, { className: 'tf-empty-state__icon', name: icon, size: 20, strokeWidth: 2.1 }),
    eyebrow ? element('span', { className: 'tf-empty-state__eyebrow' }, eyebrow) : null,
    element('h3', { className: 'tf-empty-state__title' }, title),
    children ? element('div', { className: 'tf-empty-state__body' }, children) : null,
    actions?.length ? element('div', { className: 'tf-empty-state__actions' }, ...actions) : null,
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
        badge.icon ? element(IconGlyph, { className: 'tf-badge__icon', name: badge.icon, size: 14 }) : null,
        badge.label,
      )),
  );
}

function TextForgeCommandMenuBar({ groups = [], onCommandPress }) {
  const [openMenuId, setOpenMenuId] = React.useState();

  React.useEffect(() => {
    if (!openMenuId) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!event.target.closest('[data-command-menu-bar]')) {
        setOpenMenuId(undefined);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpenMenuId(undefined);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  if (groups.length === 0) {
    return null;
  }

  return element(
    'div',
    { className: 'tf-command-menus', 'data-command-menu-bar': 'true' },
    ...groups.map((group) =>
      element(
        'div',
        {
          key: group.id,
          className: classNames('tf-command-menu', openMenuId === group.id && 'is-open'),
        },
        element(TextForgeToolbarButton, {
          active: openMenuId === group.id,
          icon: group.icon ?? 'command',
          kind: 'secondary',
          label: group.label,
          onPress: () => setOpenMenuId((current) => (current === group.id ? undefined : group.id)),
          title: `Open ${group.label} commands`,
        }),
        openMenuId === group.id
          ? element(
              'div',
              {
                className: 'tf-command-menu__panel',
                role: 'menu',
                'aria-label': group.label,
              },
              ...group.items.map((item) =>
                element(
                  'button',
                  {
                    key: item.commandId,
                    type: 'button',
                    role: 'menuitem',
                    className: 'tf-command-menu__item',
                    disabled: item.disabled,
                    onClick: () => {
                      setOpenMenuId(undefined);
                      onCommandPress?.(item.commandId);
                    },
                    title: item.description ?? item.label,
                  },
                  item.icon
                    ? element(IconGlyph, { className: 'tf-command-menu__icon', name: item.icon, size: 14.5 })
                    : null,
                  element('span', { className: 'tf-command-menu__label' }, item.label),
                  item.shortcut
                    ? element('span', { className: 'tf-command-menu__meta' }, item.shortcut)
                    : null,
                )),
            )
          : null,
      )),
  );
}

export function TextForgeTopBar({
  activeResource,
  brandTitle,
  commandPaletteLabel = 'Commands',
  commandPaletteShortcut = 'Ctrl+K',
  menuGroups = [],
  onCommandPress,
  onOpenCommandPalette,
  onToggleSidebar,
  onToggleUtility,
  sidebarCollapsed = false,
  statusBadges = [],
  subtitle,
  toolbarSlots = [],
  utilityToggleLabel = 'Panel',
  utilityOpen = false,
}) {
  const actions = [
    element(TextForgeToolbarButton, {
      key: 'toggle-sidebar',
      active: !sidebarCollapsed,
      ariaLabel: sidebarCollapsed ? 'Show workspace tree' : 'Hide workspace tree',
      icon: sidebarCollapsed ? 'expand' : 'collapse',
      kind: 'toggle',
      label: sidebarCollapsed ? 'Show Tree' : 'Hide Tree',
      onPress: onToggleSidebar,
    }),
    element(TextForgeCommandMenuBar, {
      key: 'command-menus',
      groups: menuGroups,
      onCommandPress,
    }),
    ...toolbarSlots.map((slot) =>
      element(TextForgeToolbarButton, {
        key: slot.id,
        ariaLabel: slot.description ?? slot.label,
        disabled: slot.disabled,
        icon: slot.icon,
        kind: slot.pinned ? 'primary' : 'secondary',
        label: slot.label,
        onPress: () => onCommandPress?.(slot.id),
        title: slot.description,
      })),
    onOpenCommandPalette
      ? element(TextForgeToolbarButton, {
        key: 'command-palette',
        ariaLabel: 'Open command palette',
        icon: 'search',
        kind: 'secondary',
        label: commandPaletteLabel,
        onPress: onOpenCommandPalette,
        title: commandPaletteShortcut ? `Open command palette (${commandPaletteShortcut})` : 'Open command palette',
      })
      : null,
    element(TextForgeToolbarButton, {
      key: 'toggle-utility',
      active: utilityOpen,
      ariaLabel: utilityOpen ? `Hide ${utilityToggleLabel}` : `Show ${utilityToggleLabel}`,
      icon: utilityOpen ? 'close' : 'utility',
      kind: 'toggle',
      label: utilityOpen ? `Hide ${utilityToggleLabel}` : `Show ${utilityToggleLabel}`,
      onPress: onToggleUtility,
    }),
  ].filter(Boolean);

  return element(
    'header',
    { className: 'tf-topbar' },
    element(
      'div',
      { className: 'tf-topbar__lead' },
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
      activeResource
        ? element(
          'div',
          {
            className: classNames(
              'tf-topbar__resource',
              activeResource.attention && `is-${activeResource.attention}`,
            ),
          },
          element(TextForgeResourceBadge, {
            active: true,
            attention: activeResource.attention,
            badge: activeResource.badge,
            label: activeResource.title,
            size: 'regular',
          }),
          element(
            'div',
            { className: 'tf-topbar__resource-copy' },
            element(
              'div',
              { className: 'tf-topbar__resource-line' },
              activeResource.icon
                ? element(IconGlyph, { className: 'tf-topbar__resource-icon', name: activeResource.icon, size: 15 })
                : null,
              element('strong', null, activeResource.title),
            ),
            activeResource.detail
              ? element('span', { className: 'tf-topbar__resource-detail' }, activeResource.detail)
              : null,
          ),
        )
        : null,
      element(TextForgeStatusRail, { badges: statusBadges }),
    ),
    element(
      'div',
      { className: 'tf-topbar__actions' },
      ...actions,
    ),
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
        icon: collapsed ? 'expand' : 'collapse',
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
          element(IconGlyph, {
            className: 'tf-tree__icon',
            name: resolveWorkspaceItemIcon(item),
            size: 15,
          }),
          element(
            'span',
            { className: 'tf-tree__copy' },
            element('span', { className: 'tf-tree__label' }, item.label),
            item.detail ? element('span', { className: 'tf-tree__detail' }, item.detail) : null,
          ),
          element(
            'span',
            { className: 'tf-tree__meta' },
            item.badge
              ? element(TextForgeResourceBadge, {
                active: item.id === workspaceTree.selectedResourceId,
                attention: item.attention,
                badge: item.badge,
                label: `${item.label} badge`,
              })
              : null,
            item.attention === 'warning'
              ? element(IconGlyph, { className: 'tf-tree__attention', name: 'warning', size: 12.5 })
              : null,
          ),
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
          tab.badge
            ? element(TextForgeResourceBadge, {
              active: tab.id === frameModel.activeTabId,
              attention: tab.attention,
              badge: tab.badge,
              label: `${tab.title} badge`,
            })
            : null,
          element('span', { className: 'tf-tab__title' }, tab.title),
          tab.stale ? element('span', { className: 'tf-tab__state', 'aria-hidden': 'true' }, 'Stale') : null,
          tab.attention === 'warning'
            ? element(IconGlyph, { className: 'tf-tab__attention', name: 'warning', size: 12.5 })
            : null,
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
            element(IconGlyph, { className: 'tf-tab__close-icon', name: 'close', size: 13 }),
            element('span', { className: 'tf-visually-hidden' }, 'Close'),
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
          icon: 'close',
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
            section.icon ? element(IconGlyph, { className: 'tf-segments__icon', name: section.icon, size: 14 }) : null,
            section.label,
          )),
      )
      : null,
    element('div', { className: 'tf-utility__body' }, children),
  );
}

export function TextForgePopupHost({
  children,
  frameModel,
  onClose,
  onCloseTab,
  onSelectTab,
  subtitle,
  title = 'Popup surfaces',
}) {
  if ((frameModel?.tabs ?? []).length === 0) {
    return null;
  }

  return element(
    'div',
    { className: 'tf-popup-host__scrim' },
    element(
      'section',
      {
        className: 'tf-popup-host',
        role: 'dialog',
        'aria-modal': 'false',
        'aria-label': title,
        'data-pane': 'popup',
      },
      element(
        'div',
        { className: 'tf-popup-host__header' },
        element(
          'div',
          { className: 'tf-popup-host__copy' },
          element('span', { className: 'tf-popup-host__eyebrow' }, 'Popup surfaces'),
          element('h2', { className: 'tf-popup-host__title' }, title),
          subtitle ? element('p', { className: 'tf-popup-host__subtitle' }, subtitle) : null,
        ),
        onClose
          ? element(TextForgeToolbarButton, {
            ariaLabel: 'Close active popup surface',
            icon: 'close',
            kind: 'secondary',
            label: 'Close popup',
            onPress: onClose,
          })
          : null,
      ),
      element(TextForgeSessionTabStrip, {
        emptyLabel: 'No popup sessions',
        frameModel,
        onCloseTab,
        onSelectTab,
      }),
      element('div', { className: 'tf-popup-host__body' }, children),
    ),
  );
}

export function TextForgeCommandPalette({
  emptyLabel = 'No commands match the current query.',
  entries = [],
  onClose,
  onCommandPress,
  open = false,
  placeholder = 'Search shell commands',
  title = 'Command palette',
}) {
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    setQuery('');
    setActiveIndex(0);
    const handle = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(handle);
  }, [open]);

  if (!open) {
    return null;
  }

  const filteredEntries = entries.filter((entry) => matchesCommandPaletteEntry(entry, query));
  const boundedIndex = filteredEntries.length === 0
    ? -1
    : Math.min(activeIndex, filteredEntries.length - 1);

  function commit(entry) {
    if (!entry || entry.disabled) {
      return;
    }

    onCommandPress?.(entry.commandId);
    onClose?.();
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filteredEntries.length > 0) {
        setActiveIndex((current) => (current + 1) % filteredEntries.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filteredEntries.length > 0) {
        setActiveIndex((current) => (current - 1 + filteredEntries.length) % filteredEntries.length);
      }
      return;
    }

    if (event.key === 'Enter' && boundedIndex >= 0) {
      event.preventDefault();
      commit(filteredEntries[boundedIndex]);
    }
  }

  return element(
    'div',
    {
      className: 'tf-command-palette__backdrop',
      onMouseDown: (event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      },
    },
    element(
      'section',
      {
        className: 'tf-command-palette',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': title,
      },
      element(
        'div',
        { className: 'tf-command-palette__header' },
        element('strong', null, title),
        element(
          'button',
          {
            type: 'button',
            className: 'tf-command-palette__close',
            'aria-label': 'Close command palette',
            onClick: onClose,
          },
          element(IconGlyph, { className: 'tf-command-palette__close-icon', name: 'close', size: 14 }),
          element('span', { className: 'tf-visually-hidden' }, 'Close'),
        ),
      ),
      element(
        'label',
        { className: 'tf-command-palette__search' },
        element(IconGlyph, { className: 'tf-command-palette__search-icon', name: 'search', size: 15 }),
        element('span', { className: 'tf-visually-hidden' }, placeholder),
        element('input', {
          ref: inputRef,
          className: 'tf-command-palette__input',
          type: 'text',
          value: query,
          placeholder,
          onChange: (event) => {
            setQuery(event.currentTarget.value);
            setActiveIndex(0);
          },
          onKeyDown: handleKeyDown,
        }),
      ),
      filteredEntries.length === 0
        ? element('div', { className: 'tf-command-palette__empty' }, emptyLabel)
        : element(
          'div',
          {
            className: 'tf-command-palette__list',
            role: 'listbox',
            'aria-label': 'Available commands',
          },
          ...filteredEntries.map((entry, index) =>
            element(
              'button',
              {
                key: entry.commandId,
                type: 'button',
                role: 'option',
                'aria-selected': boundedIndex === index,
                className: classNames('tf-command-palette__item', boundedIndex === index && 'is-active'),
                disabled: entry.disabled,
                onMouseEnter: () => setActiveIndex(index),
                onClick: () => commit(entry),
                title: entry.description ?? entry.label,
              },
              element(
                'div',
                { className: 'tf-command-palette__content' },
                element(
                  'div',
                  { className: 'tf-command-palette__line' },
                  entry.icon
                    ? element(IconGlyph, { className: 'tf-command-palette__item-icon', name: entry.icon, size: 14.5 })
                    : null,
                  element('span', { className: 'tf-command-palette__label' }, entry.label),
                  entry.shortcut
                    ? element('span', { className: 'tf-command-palette__shortcut' }, entry.shortcut)
                    : null,
                ),
                entry.description
                  ? element('p', { className: 'tf-command-palette__detail' }, entry.description)
                  : null,
                entry.group
                  ? element('span', { className: 'tf-command-palette__group' }, entry.group)
                  : null,
              ),
            )),
        ),
    ),
  );
}

export function TextForgeAppFrame({
  children,
  footer,
  header,
  panelLayout,
  sidebar,
  sidebarCollapsed = false,
  utility,
  utilityOpen = false,
}) {
  const sidebarPanelRef = React.useRef(null);
  const utilityPanelRef = React.useRef(null);
  const sidebarConfig = normalizePanelConfig(panelLayout?.sidebar, {
    defaultSize: '22',
    minSize: '16',
    maxSize: '30',
    collapsedSize: '6',
  });
  const utilityConfig = normalizePanelConfig(panelLayout?.utility, {
    defaultSize: '24',
    minSize: '18',
    maxSize: '34',
    collapsedSize: '0',
  });

  React.useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel?.collapse || !panel?.expand || !panel?.isCollapsed) {
      return;
    }

    if (sidebarCollapsed && !panel.isCollapsed()) {
      panel.collapse();
      return;
    }

    if (!sidebarCollapsed && panel.isCollapsed()) {
      panel.expand();
    }
  }, [sidebarCollapsed, sidebar]);

  React.useEffect(() => {
    const panel = utilityPanelRef.current;
    if (!panel?.collapse || !panel?.expand || !panel?.isCollapsed) {
      return;
    }

    if (!utilityOpen && !panel.isCollapsed()) {
      panel.collapse();
      return;
    }

    if (utilityOpen && panel.isCollapsed()) {
      panel.expand();
    }
  }, [utilityOpen, utility]);

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
      element(
        Group,
        {
          className: 'tf-panel-group',
          direction: 'horizontal',
        },
        sidebar
          ? [
            element(
              Panel,
              {
                key: 'sidebar-panel',
                ref: sidebarPanelRef,
                className: classNames('tf-panel', 'tf-panel--sidebar', sidebarCollapsed && 'is-collapsed'),
                collapsible: true,
                collapsedSize: sidebarConfig.collapsedSize,
                defaultSize: sidebarCollapsed ? sidebarConfig.collapsedSize : sidebarConfig.defaultSize,
                minSize: sidebarConfig.minSize,
                maxSize: sidebarConfig.maxSize,
                order: 1,
              },
              sidebar,
            ),
            element(
              Separator,
              {
                key: 'sidebar-resize',
                className: 'tf-panel-resize-handle',
              },
              element('span', {
                className: 'tf-panel-resize-handle__grip',
                'aria-hidden': 'true',
              }),
            ),
          ]
          : null,
        element(
          Panel,
          {
            key: 'main-panel',
            className: 'tf-panel tf-panel--main',
            minSize: sidebar || utility ? '42' : '100',
            order: 2,
          },
          element('main', { className: 'tf-app__main', 'data-pane': 'main' }, children),
        ),
        utility
          ? [
            element(
              Separator,
              {
                key: 'utility-resize',
                className: classNames('tf-panel-resize-handle', !utilityOpen && 'is-collapsed'),
              },
              element('span', {
                className: 'tf-panel-resize-handle__grip',
                'aria-hidden': 'true',
              }),
            ),
            element(
              Panel,
              {
                key: 'utility-panel',
                ref: utilityPanelRef,
                className: classNames('tf-panel', 'tf-panel--utility', !utilityOpen && 'is-collapsed'),
                collapsible: true,
                collapsedSize: utilityConfig.collapsedSize,
                defaultSize: utilityOpen ? utilityConfig.defaultSize : utilityConfig.collapsedSize,
                minSize: utilityConfig.minSize,
                maxSize: utilityConfig.maxSize,
                order: 3,
              },
              utilityOpen ? utility : null,
            ),
          ]
          : null,
      ),
    ),
    footer ? element('footer', { className: 'tf-footer' }, footer) : null,
  );
}

export const defaultAppFrameModel = createAppFrameModel();

export const defaultIcons = [
  { name: 'success', glyph: 'C', viewBox: '0 0 24 24' },
  { name: 'warning', glyph: '!', viewBox: '0 0 24 24' },
  { name: 'info', glyph: 'i', viewBox: '0 0 24 24' },
  { name: 'search', glyph: 'S', viewBox: '0 0 24 24' },
  { name: 'command', glyph: 'K', viewBox: '0 0 24 24' },
  { name: 'folder', glyph: 'F', viewBox: '0 0 24 24' },
  { name: 'folderOpen', glyph: 'O', viewBox: '0 0 24 24' },
  { name: 'fileText', glyph: 'T', viewBox: '0 0 24 24' },
  { name: 'fileImage', glyph: 'I', viewBox: '0 0 24 24' },
  { name: 'fileBinary', glyph: 'B', viewBox: '0 0 24 24' },
  { name: 'import', glyph: 'U', viewBox: '0 0 24 24' },
  { name: 'export', glyph: 'D', viewBox: '0 0 24 24' },
  { name: 'collapse', glyph: '<', viewBox: '0 0 24 24' },
  { name: 'expand', glyph: '>', viewBox: '0 0 24 24' },
  { name: 'close', glyph: 'X', viewBox: '0 0 24 24' },
  { name: 'utility', glyph: 'U', viewBox: '0 0 24 24' },
  { name: 'status', glyph: '*', viewBox: '0 0 24 24' },
  { name: 'lock', glyph: 'L', viewBox: '0 0 24 24' },
];

export const contributions = {
  id: '@textforge/ui',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
};
