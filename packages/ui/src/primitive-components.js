import { element, classNames } from './shared.js';
import { IconGlyph } from './icons.js';

function describeBadgeTitle(badge, label) {
  return label ?? badge?.description ?? badge?.label;
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
  if (badges.length === 0) {
    return null;
  }

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

