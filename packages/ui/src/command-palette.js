import * as React from 'react';
import { element, classNames } from './shared.js';
import { IconGlyph } from './icons.js';

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

