import * as React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { element, classNames, coerceExpandedPanelSize, isDoubleClickActivation, isEffectivelyCollapsed, normalizePanelConfig } from './shared.js';

export function TextForgeAppFrame({
  children,
  footer,
  header,
  onSidebarCollapsedChange,
  onUtilityCollapsedChange,
  panelLayout,
  sidebar,
  sidebarCollapsed = false,
  utility,
  utilityOpen = false,
}) {
  const sidebarPanelRef = React.useRef(null);
  const utilityPanelRef = React.useRef(null);
  const sidebarExpandedSizeRef = React.useRef(undefined);
  const utilityExpandedSizeRef = React.useRef(undefined);
  const sidebarConfig = normalizePanelConfig(panelLayout?.sidebar, {
    defaultSize: '22',
    minSize: '0',
    maxSize: '30',
    collapsedSize: '0',
  });
  const utilityConfig = normalizePanelConfig(panelLayout?.utility, {
    defaultSize: '24',
    minSize: '0',
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

  function handleSidebarResize(panelSize) {
    if (!isEffectivelyCollapsed(panelSize, sidebarConfig.collapsedSize)) {
      sidebarExpandedSizeRef.current = `${panelSize.asPercentage}`;
    }

    onSidebarCollapsedChange?.(isEffectivelyCollapsed(panelSize, sidebarConfig.collapsedSize));
  }

  function handleUtilityResize(panelSize) {
    if (!isEffectivelyCollapsed(panelSize, utilityConfig.collapsedSize)) {
      utilityExpandedSizeRef.current = `${panelSize.asPercentage}`;
    }

    onUtilityCollapsedChange?.(isEffectivelyCollapsed(panelSize, utilityConfig.collapsedSize));
  }

  function handleSidebarHandleDoubleClick() {
    const panel = sidebarPanelRef.current;
    if (panel?.isCollapsed?.()) {
      panel.expand?.();
      if (isEffectivelyCollapsed(panel.getSize?.() ?? { asPercentage: 0, inPixels: 0 }, sidebarConfig.collapsedSize)) {
        panel.resize?.(coerceExpandedPanelSize(sidebarExpandedSizeRef.current, sidebarConfig.defaultSize));
      }
      onSidebarCollapsedChange?.(false);
      return;
    }

    const size = panel?.getSize?.();
    if (size && !isEffectivelyCollapsed(size, sidebarConfig.collapsedSize)) {
      sidebarExpandedSizeRef.current = `${size.asPercentage}`;
    }

    onSidebarCollapsedChange?.(!sidebarCollapsed);
  }

  function handleUtilityHandleDoubleClick() {
    const panel = utilityPanelRef.current;
    if (panel?.isCollapsed?.()) {
      panel.expand?.();
      if (isEffectivelyCollapsed(panel.getSize?.() ?? { asPercentage: 0, inPixels: 0 }, utilityConfig.collapsedSize)) {
        panel.resize?.(coerceExpandedPanelSize(utilityExpandedSizeRef.current, utilityConfig.defaultSize));
      }
      onUtilityCollapsedChange?.(false);
      return;
    }

    const size = panel?.getSize?.();
    if (size && !isEffectivelyCollapsed(size, utilityConfig.collapsedSize)) {
      utilityExpandedSizeRef.current = `${size.asPercentage}`;
    }

    onUtilityCollapsedChange?.(utilityOpen);
  }

  function handleSidebarHandleClick(event) {
    if (!isDoubleClickActivation(event)) {
      return;
    }

    handleSidebarHandleDoubleClick();
  }

  function handleUtilityHandleClick(event) {
    if (!isDoubleClickActivation(event)) {
      return;
    }

    handleUtilityHandleDoubleClick();
  }

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
                panelRef: sidebarPanelRef,
                className: classNames('tf-panel', 'tf-panel--sidebar', sidebarCollapsed && 'is-collapsed'),
                collapsible: true,
                collapsedSize: sidebarConfig.collapsedSize,
                defaultSize: sidebarCollapsed ? sidebarConfig.collapsedSize : sidebarConfig.defaultSize,
                minSize: sidebarConfig.minSize,
                maxSize: sidebarConfig.maxSize,
                onCollapse: () => onSidebarCollapsedChange?.(true),
                onExpand: () => onSidebarCollapsedChange?.(false),
                onResize: handleSidebarResize,
                order: 1,
              },
              sidebar,
            ),
            element(
              Separator,
              {
                key: 'sidebar-resize',
                className: 'tf-panel-resize-handle',
                disableDoubleClick: true,
                onClick: handleSidebarHandleClick,
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
            minSize: sidebar || utility ? '34' : '100',
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
                disableDoubleClick: true,
                onClick: handleUtilityHandleClick,
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
                panelRef: utilityPanelRef,
                className: classNames('tf-panel', 'tf-panel--utility', !utilityOpen && 'is-collapsed'),
                collapsible: true,
                collapsedSize: utilityConfig.collapsedSize,
                defaultSize: utilityOpen ? utilityConfig.defaultSize : utilityConfig.collapsedSize,
                minSize: utilityConfig.minSize,
                maxSize: utilityConfig.maxSize,
                onCollapse: () => onUtilityCollapsedChange?.(true),
                onExpand: () => onUtilityCollapsedChange?.(false),
                onResize: handleUtilityResize,
                order: 3,
              },
              utility,
            ),
          ]
          : null,
      ),
    ),
    footer ? element('footer', { className: 'tf-footer' }, footer) : null,
  );
}

