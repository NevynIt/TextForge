import * as React from 'react';
import { element, classNames } from './shared.js';
import { IconGlyph, resolveWorkspaceItemIcon } from './icons.js';
import { TextForgeResourceBadge, TextForgeStatusRail, TextForgeToolbarButton } from './primitive-components.js';

const workspaceTreeDragMime = 'application/x-textforge-workspace-item';

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

function handleWorkspaceTreeItemKeyDown(event, item, onSelect, onToggleFolder) {
  if (item.kind === 'folder' && item.hasChildren) {
    if (event.key === 'ArrowRight' && !item.expanded) {
      event.preventDefault();
      onToggleFolder?.(item.id);
      return;
    }

    if (event.key === 'ArrowLeft' && item.expanded) {
      event.preventDefault();
      onToggleFolder?.(item.id);
      return;
    }
  }

  handleTreeKeyDown(event, onSelect);
}

function readDraggedWorkspaceItemId(dataTransfer) {
  if (!dataTransfer?.types?.includes?.(workspaceTreeDragMime)) {
    return undefined;
  }

  return dataTransfer.getData(workspaceTreeDragMime) || undefined;
}

function WorkspaceTreeInlineEditor({
  selectionEnd,
  selectionStart,
  value,
  onCancel,
  onChange,
  onCommit,
}) {
  const inputRef = React.useRef(null);
  const actionRef = React.useRef(undefined);
  const initializedSelectionRef = React.useRef(false);

  React.useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.focus();
    if (initializedSelectionRef.current) {
      return;
    }
    initializedSelectionRef.current = true;
    if (typeof selectionStart === 'number' || typeof selectionEnd === 'number') {
      const nextSelectionStart = typeof selectionStart === 'number' ? selectionStart : 0;
      const nextSelectionEnd = typeof selectionEnd === 'number' ? selectionEnd : value.length;
      input.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    }
  }, [selectionEnd, selectionStart, value]);

  function commit() {
    if (actionRef.current) {
      return;
    }

    actionRef.current = 'commit';
    onCommit?.();
  }

  function cancel() {
    if (actionRef.current) {
      return;
    }

    actionRef.current = 'cancel';
    onCancel?.();
  }

  return element('input', {
    ref: inputRef,
    className: 'tf-tree__editor',
    onBlur: () => {
      if (actionRef.current === 'cancel') {
        return;
      }
      commit();
    },
    onChange: (event) => onChange?.(event.currentTarget.value),
    onClick: (event) => event.stopPropagation(),
    onContextMenu: (event) => event.stopPropagation(),
    onKeyDown: (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
    },
    spellCheck: false,
    type: 'text',
    value,
  });
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
  brandTitle,
  commandPaletteLabel = 'Commands',
  commandPaletteShortcut = 'Ctrl+K',
  menuGroups = [],
  onCommandPress,
  onOpenCommandPalette,
  statusBadges = [],
  subtitle,
  toolbarSlots = [],
}) {
  const actions = [
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
  editingItemId,
  editingSelectionEnd,
  editingSelectionStart,
  editingValue = '',
  footer,
  onActivateItem,
  onCancelEdit,
  onClose,
  onCommitEdit,
  onDropFilesToFolder,
  onMoveItem,
  onRequestItemContextMenu,
  onSelectItem,
  onToggleFolder,
  onUpdateEditValue,
  workspaceTree,
}) {
  const selectedIndex = workspaceTree.items.findIndex((item) => item.id === workspaceTree.selectedResourceId);
  const fallbackIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const [draggingItemId, setDraggingItemId] = React.useState(undefined);
  const [dropTargetId, setDropTargetId] = React.useState(undefined);
  const header = element(
    'div',
    { className: 'tf-pane__header' },
    element('h2', { className: 'tf-pane__title' }, workspaceTree.title),
    onClose
      ? element(
        'button',
        {
          type: 'button',
          className: 'tf-pane__close',
          'aria-label': `Collapse ${workspaceTree.title}`,
          title: `Collapse ${workspaceTree.title}`,
          onClick: () => onClose(),
        },
        element(IconGlyph, { className: 'tf-pane__close-icon', name: 'close', size: 13 }),
      )
      : null,
  );

  const items = collapsed
    ? []
    : workspaceTree.items.map((item, index) =>
      (() => {
        const isEditing = editingItemId === item.id;
        const rowTag = isEditing ? 'div' : 'button';
        const rowProps = {
          className: classNames(
            'tf-tree__row',
            item.id === workspaceTree.selectedResourceId && 'is-active',
            isEditing && 'is-editing',
            dropTargetId === item.id && 'is-drop-target',
          ),
          role: 'treeitem',
          'aria-level': item.depth + 1,
          'aria-selected': item.id === workspaceTree.selectedResourceId,
          tabIndex: index === fallbackIndex ? 0 : -1,
          'data-item-id': item.id,
          'data-workspace-folder-drop': item.kind === 'folder' ? item.id : undefined,
          draggable: Boolean(onMoveItem && item.movable !== false && !isEditing),
          onClick: isEditing ? undefined : () => onSelectItem?.(item.id),
          onDoubleClick: isEditing ? undefined : () => onActivateItem?.(item.id),
          onContextMenu: (event) => {
            event.preventDefault();
            onRequestItemContextMenu?.(item.id, {
              x: event.clientX,
              y: event.clientY,
            });
          },
          onDragEnd: onMoveItem
            ? () => {
              setDraggingItemId(undefined);
              setDropTargetId(undefined);
            }
            : undefined,
          onDragLeave: onMoveItem
            ? (event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDropTargetId((current) => (current === item.id ? undefined : current));
              }
            }
            : undefined,
          onDragOver: onMoveItem
            ? (event) => {
              const sourceItemId = draggingItemId ?? readDraggedWorkspaceItemId(event.dataTransfer);
              if (!sourceItemId || sourceItemId === item.id) {
                return;
              }

              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDropTargetId(item.id);
            }
            : undefined,
          onDragStart: onMoveItem
            ? (event) => {
              setDraggingItemId(item.id);
              event.dataTransfer.setData(workspaceTreeDragMime, item.id);
              event.dataTransfer.setData('text/plain', item.id);
              event.dataTransfer.effectAllowed = 'move';
            }
            : undefined,
          onDrop: onMoveItem
            ? (event) => {
              const sourceItemId = draggingItemId ?? readDraggedWorkspaceItemId(event.dataTransfer);
              if (!sourceItemId || sourceItemId === item.id) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              setDraggingItemId(undefined);
              setDropTargetId(undefined);
              onMoveItem?.(sourceItemId, item.id);
            }
            : undefined,
          onKeyDown: (event) => {
            if (!isEditing && event.key === 'Enter') {
              event.preventDefault();
              onActivateItem?.(item.id);
              return;
            }

            if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              onRequestItemContextMenu?.(item.id, {
                x: rect.left + (rect.width / 2),
                y: rect.top + 12,
              });
              return;
            }

            if (!isEditing) {
              handleWorkspaceTreeItemKeyDown(event, item, onSelectItem, onToggleFolder);
            }
          },
          title: item.path,
          style: { '--depth': item.depth },
          ...(rowTag === 'button' ? { type: 'button' } : {}),
        };

        return element(
          'li',
          { key: item.id, className: 'tf-tree__item' },
          element(
            rowTag,
            rowProps,
            item.kind === 'folder' && item.hasChildren
              ? element(
                'span',
                {
                  className: 'tf-tree__toggle',
                  'aria-hidden': 'true',
                  onClick: (event) => {
                    event.stopPropagation();
                    onToggleFolder?.(item.id);
                  },
                },
                element(IconGlyph, {
                  className: 'tf-tree__toggle-icon',
                  name: item.expanded ? 'disclosureOpen' : 'disclosureClosed',
                  size: 14,
                }),
              )
              : element('span', { className: 'tf-tree__toggle tf-tree__toggle--placeholder', 'aria-hidden': 'true' }),
            element(IconGlyph, {
              className: 'tf-tree__icon',
              name: resolveWorkspaceItemIcon(item),
              size: 15,
            }),
            element(
              'span',
              { className: 'tf-tree__copy' },
              isEditing
                ? element(WorkspaceTreeInlineEditor, {
                  selectionEnd: editingSelectionEnd,
                  selectionStart: editingSelectionStart,
                  value: editingValue,
                  onCancel: onCancelEdit,
                  onChange: onUpdateEditValue,
                  onCommit: onCommitEdit,
                })
                : element('span', { className: 'tf-tree__label' }, item.label),
              !isEditing && item.detail ? element('span', { className: 'tf-tree__detail' }, item.detail) : null,
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
        );
      })());

  return element(
    'aside',
    {
      className: classNames('tf-sidebar', collapsed && 'is-collapsed'),
      'data-pane': 'workspace',
    },
    header,
    collapsed
      ? null
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
  onCreateTab,
  onCloseTab,
  onDropFiles,
  onRequestTabContextMenu,
  onSelectTab,
}) {
  const tabs = frameModel.tabs ?? [];

  return element(
    'div',
    {
      className: 'tf-tabstrip',
      role: 'tablist',
      'aria-label': frameModel.title,
      'data-roving-root': 'session-tabs',
      'data-upload-drop-zone': 'session-tabs',
      onDoubleClick: (event) => {
        if (event.target instanceof Element && event.target.closest('.tf-tab')) {
          return;
        }
        onCreateTab?.();
      },
    },
    tabs.length === 0
      ? element('div', { className: 'tf-tabstrip__empty' }, emptyLabel)
      : null,
    ...tabs.map((tab) =>
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
            onContextMenu: (event) => {
              event.preventDefault();
              onRequestTabContextMenu?.(tab.id, {
                x: event.clientX,
                y: event.clientY,
              });
            },
            onKeyDown: (event) => {
              if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                onRequestTabContextMenu?.(tab.id, {
                  x: rect.left + (rect.width / 2),
                  y: rect.bottom,
                });
                return;
              }

              handleHorizontalTabsKeyDown(event, onSelectTab);
            },
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

export function TextForgeContextMenu({
  items = [],
  onClose,
  onCommandPress,
  open = false,
  position,
  title = 'Context menu',
}) {
  const rootRef = React.useRef(null);
  const previousFocusRef = React.useRef(null);
  const itemRefs = React.useRef([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [resolvedPosition, setResolvedPosition] = React.useState(() => ({
    x: position?.x ?? 24,
    y: position?.y ?? 24,
  }));

  React.useEffect(() => {
    if (!open) {
      if (previousFocusRef.current?.focus) {
        previousFocusRef.current.focus();
      }
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    setActiveIndex(0);
    const handle = window.setTimeout(() => {
      itemRefs.current[0]?.focus?.();
    }, 0);

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        onClose?.();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(handle);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  React.useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const menu = rootRef.current;
    if (!menu || typeof window === 'undefined') {
      return;
    }

    const margin = 8;
    const anchorX = position?.x ?? 24;
    const anchorY = position?.y ?? 24;
    const rect = menu.getBoundingClientRect();
    const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
    const nextX = Math.min(Math.max(margin, anchorX), maxX);
    const nextY = anchorY + rect.height + margin <= window.innerHeight
      ? anchorY
      : Math.max(margin, anchorY - rect.height);
    setResolvedPosition((current) =>
      current.x === nextX && current.y === nextY
        ? current
        : { x: nextX, y: nextY });
  }, [open, position?.x, position?.y, items.length]);

  if (!open || items.length === 0) {
    return null;
  }

  function commit(item) {
    if (!item || item.disabled) {
      return;
    }

    onCommandPress?.(item.commandId);
    onClose?.();
  }

  function focusItem(index) {
    const boundedIndex = ((index % items.length) + items.length) % items.length;
    setActiveIndex(boundedIndex);
    itemRefs.current[boundedIndex]?.focus?.();
  }

  return element(
    'div',
    {
      ref: rootRef,
      className: 'tf-context-menu',
      role: 'menu',
      'aria-label': title,
      style: {
        left: `${resolvedPosition.x}px`,
        top: `${resolvedPosition.y}px`,
      },
    },
    ...items.map((item, index) =>
      element(
        'button',
        {
          key: item.commandId,
          ref: (node) => {
            itemRefs.current[index] = node;
          },
          type: 'button',
          role: 'menuitem',
          className: classNames('tf-context-menu__item', activeIndex === index && 'is-active'),
          disabled: item.disabled,
          onMouseEnter: () => setActiveIndex(index),
          onClick: () => commit(item),
          onKeyDown: (event) => {
            switch (event.key) {
              case 'ArrowDown':
                event.preventDefault();
                focusItem(index + 1);
                break;
              case 'ArrowUp':
                event.preventDefault();
                focusItem(index - 1);
                break;
              case 'Home':
                event.preventDefault();
                focusItem(0);
                break;
              case 'End':
                event.preventDefault();
                focusItem(items.length - 1);
                break;
              case 'Enter':
              case ' ':
                event.preventDefault();
                commit(item);
                break;
              default:
                break;
            }
          },
          title: item.description ?? item.label,
        },
        item.icon
          ? element(IconGlyph, { className: 'tf-context-menu__icon', name: item.icon, size: 14.5 })
          : null,
        element('span', { className: 'tf-context-menu__label' }, item.label),
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
      element('h2', { className: 'tf-pane__title' }, title),
      onClose
        ? element(
          'button',
          {
            type: 'button',
            className: 'tf-pane__close',
            'aria-label': `Collapse ${title}`,
            title: `Collapse ${title}`,
            onClick: () => onClose(),
          },
          element(IconGlyph, { className: 'tf-pane__close-icon', name: 'close', size: 13 }),
        )
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
  onRequestTabContextMenu,
  onClose,
  title = 'Popup surface',
}) {
  const tabs = frameModel?.tabs ?? [];
  if (tabs.length === 0) {
    return null;
  }

  const activeTab = tabs.find((tab) => tab.id === frameModel.activeTabId) ?? tabs[0];
  const popupTitle = activeTab?.title ?? title;

  const hostRef = React.useRef(null);
  const scrimRef = React.useRef(null);
  const dragStateRef = React.useRef(null);
  const resizeStateRef = React.useRef(null);
  function getInitialPopupSize() {
    if (typeof window === 'undefined') {
      return { width: 760, height: 420 };
    }

    return {
      width: Math.min(760, Math.max(320, window.innerWidth - 48)),
      height: Math.min(Math.max(240, Math.round(window.innerHeight * 0.7)), Math.max(240, window.innerHeight - 24)),
    };
  }

  const [size, setSize] = React.useState(() => getInitialPopupSize());
  const [position, setPosition] = React.useState(() => {
    if (typeof window === 'undefined') {
      return { left: 24, top: 24 };
    }

    const { width } = getInitialPopupSize();
    return {
      left: Math.max(12, window.innerWidth - width - 24),
      top: 24,
    };
  });

  function getPopupBounds() {
    const rect = scrimRef.current?.getBoundingClientRect();
    if (rect) {
      return rect;
    }

    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  React.useEffect(() => {
    function stopPointerInteraction() {
      if (!dragStateRef.current && !resizeStateRef.current) {
        return;
      }

      dragStateRef.current = null;
      resizeStateRef.current = null;
      document.body.style.removeProperty('user-select');
    }

    function handlePointerMove(event) {
      if (resizeStateRef.current) {
        const bounds = getPopupBounds();
        const maxWidth = Math.max(320, bounds.width - resizeStateRef.current.left - 12);
        const maxHeight = Math.max(240, bounds.height - resizeStateRef.current.top - 12);
        const nextWidth = Math.min(
          Math.max(320, resizeStateRef.current.startWidth + (event.clientX - resizeStateRef.current.startX)),
          maxWidth,
        );
        const nextHeight = Math.min(
          Math.max(240, resizeStateRef.current.startHeight + (event.clientY - resizeStateRef.current.startY)),
          maxHeight,
        );
        setSize({ width: nextWidth, height: nextHeight });
        return;
      }

      if (!dragStateRef.current || !hostRef.current) {
        return;
      }

      const rect = hostRef.current.getBoundingClientRect();
      const bounds = getPopupBounds();
      const maxLeft = Math.max(12, bounds.width - rect.width - 12);
      const maxTop = Math.max(12, bounds.height - rect.height - 12);
      const nextLeft = Math.min(Math.max(12, event.clientX - bounds.left - dragStateRef.current.offsetX), maxLeft);
      const nextTop = Math.min(Math.max(12, event.clientY - bounds.top - dragStateRef.current.offsetY), maxTop);
      setPosition({ left: nextLeft, top: nextTop });
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopPointerInteraction);
    window.addEventListener('pointercancel', stopPointerInteraction);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopPointerInteraction);
      window.removeEventListener('pointercancel', stopPointerInteraction);
      document.body.style.removeProperty('user-select');
    };
  }, []);

  React.useEffect(() => {
    function clampPopupBounds() {
      if (typeof window === 'undefined') {
        return;
      }

      const bounds = getPopupBounds();
      const maxWidth = Math.max(320, bounds.width - 24);
      const maxHeight = Math.max(240, bounds.height - 24);
      setSize((current) => {
        const nextWidth = Math.min(current.width, maxWidth);
        const nextHeight = Math.min(current.height, maxHeight);
        if (nextWidth === current.width && nextHeight === current.height) {
          return current;
        }

        return { width: nextWidth, height: nextHeight };
      });
      setPosition((current) => {
        const width = Math.min(size.width, maxWidth);
        const height = Math.min(size.height, maxHeight);
        const maxLeft = Math.max(12, bounds.width - width - 12);
        const maxTop = Math.max(12, bounds.height - height - 12);
        const nextLeft = Math.min(Math.max(12, current.left), maxLeft);
        const nextTop = Math.min(Math.max(12, current.top), maxTop);
        if (nextLeft === current.left && nextTop === current.top) {
          return current;
        }

        return { left: nextLeft, top: nextTop };
      });
    }

    clampPopupBounds();
    window.addEventListener('resize', clampPopupBounds);
    return () => window.removeEventListener('resize', clampPopupBounds);
  }, [size.height, size.width]);

  function handleHeaderPointerDown(event) {
    if (event.button !== 0 || event.target.closest('button, a, input, select, textarea')) {
      return;
    }

    const rect = hostRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragStateRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.style.setProperty('user-select', 'none');
  }

  function handleResizePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    const rect = hostRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const bounds = getPopupBounds();

    event.stopPropagation();
    resizeStateRef.current = {
      left: rect.left - bounds.left,
      top: rect.top - bounds.top,
      startWidth: rect.width,
      startHeight: rect.height,
      startX: event.clientX,
      startY: event.clientY,
    };
    document.body.style.setProperty('user-select', 'none');
  }

  function openActivePopupContextMenu(anchor) {
    if (!activeTab?.id) {
      return;
    }

    onRequestTabContextMenu?.(activeTab.id, anchor);
  }

  return element(
    'div',
    { ref: scrimRef, className: 'tf-popup-host__scrim' },
    element(
      'section',
      {
        ref: hostRef,
        className: 'tf-popup-host',
        role: 'dialog',
        'aria-modal': 'false',
        'aria-label': popupTitle,
        'data-pane': 'popup',
        style: {
          height: `${size.height}px`,
          left: `${position.left}px`,
          top: `${position.top}px`,
          width: `${size.width}px`,
        },
      },
      element(
        'div',
        {
          className: 'tf-popup-host__header',
          onPointerDown: handleHeaderPointerDown,
          onContextMenu: (event) => {
            event.preventDefault();
            openActivePopupContextMenu({
              x: event.clientX,
              y: event.clientY,
            });
          },
          onKeyDown: (event) => {
            if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              openActivePopupContextMenu({
                x: rect.left + (rect.width / 2),
                y: rect.bottom,
              });
            }
          },
          tabIndex: 0,
        },
        element(
          'div',
          { className: 'tf-popup-host__copy' },
          element('h2', { className: 'tf-popup-host__title' }, popupTitle),
        ),
        onClose
          ? element(
            'button',
            {
              type: 'button',
              className: 'tf-popup-host__close',
              'aria-label': `Close ${popupTitle}`,
              onClick: onClose,
            },
            element(IconGlyph, { className: 'tf-popup-host__close-icon', name: 'close', size: 14 }),
            element('span', { className: 'tf-visually-hidden' }, 'Close'),
          )
          : null,
      ),
      element(
        'div',
        { className: 'tf-popup-host__body' },
        children,
      ),
      element('div', {
        className: 'tf-popup-host__resize-handle',
        onPointerDown: handleResizePointerDown,
      }),
    ),
  );
}

