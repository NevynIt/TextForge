import * as React from 'react';

export const element = React.createElement;

export function classNames(...tokens) {
  return tokens.filter(Boolean).join(' ');
}

export function normalizePanelConfig(config, defaults) {
  return {
    ...defaults,
    ...(config ?? {}),
  };
}

export function isEffectivelyCollapsed(panelSize, collapsedSize) {
  const collapsedPercentage = Number.parseFloat(`${collapsedSize ?? 0}`);
  if (Number.isFinite(collapsedPercentage) && panelSize.asPercentage <= (collapsedPercentage + 0.1)) {
    return true;
  }

  return panelSize.inPixels <= 1;
}

export function coerceExpandedPanelSize(size, fallbackSize) {
  if (size === undefined || size === null || size === '') {
    return fallbackSize;
  }

  return size;
}

export function isDoubleClickActivation(event) {
  return event?.detail === 2;
}
