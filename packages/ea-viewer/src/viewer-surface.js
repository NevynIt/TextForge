import * as React from 'react';
import { createRoot } from 'react-dom/client';

import {
  eaDashboardJsonDocumentPredicate,
  eaViewerCapabilityId,
  eaViewerSurfaceId,
} from './ids.js';
import { createEaViewerModel } from './fixture.js';
import { createFailureHtml, ensurePackageStyle } from './dom-rendering.js';
import {
  buildCapabilityGraph,
  buildBusinessGraph,
  buildGlobalGraph,
  createDagreLayoutEngine,
  createOffsetEdgeTypes,
  entityTitle,
  formatSecurity,
  groupColor,
  groupForSystem,
  verifyDagreLayoutEngine,
  viewOptions,
} from './graph.js';
function DetailPanel({ selected }) {
  if (!selected) {
    return null;
  }
  const raw = selected.data?.raw ?? selected.raw;
  return React.createElement(
    'aside',
    { className: 'tf-ea-detail', 'data-ea-selected-panel': true },
    React.createElement('p', { className: 'tf-ea-eyebrow' }, raw?.sourceModel ?? selected.id),
    React.createElement('h3', null, entityTitle(raw)),
    React.createElement(
      'dl',
      null,
      React.createElement('dt', null, 'Security'),
      React.createElement('dd', null, formatSecurity(raw)),
      React.createElement('dt', null, 'Identifier'),
      React.createElement('dd', null, String(raw?.id ?? selected.id)),
      React.createElement('dt', null, 'Description'),
      React.createElement('dd', null, String(raw?.description ?? raw?.status ?? raw?.role ?? 'No description')),
    ),
  );
}

function DatacenterView({ model, selected, setSelected }) {
  const datacenter = selected?.sourceModel === 'architecture.datacenter'
    ? selected
    : model.datacenters[0];
  const racks = datacenter?.racks ?? model.racks;
  return React.createElement(
    'div',
    { className: 'tf-ea-svg-view', 'data-ea-custom-detail-view': 'datacenter' },
    React.createElement(
      'div',
      { className: 'tf-ea-svg-frame' },
      React.createElement('p', { className: 'tf-ea-eyebrow' }, 'Datacenter Schema'),
      React.createElement('h2', null, entityTitle(datacenter ?? { name: 'Deployment unavailable' })),
      React.createElement(
        'svg',
        { viewBox: '0 0 920 520', width: '100%', height: '430', role: 'img', 'aria-label': 'Datacenter rack layout' },
        React.createElement('rect', { x: 20, y: 30, width: 880, height: 450, rx: 10, fill: '#071426', stroke: '#3b82f6', strokeWidth: 2 }),
        racks.slice(0, 30).map((rackItem, index) => {
          const col = index % 10;
          const row = Math.floor(index / 10);
          const x = 55 + col * 82;
          const y = 80 + row * 125;
          const serverCount = rackItem.servers?.length ?? 0;
          return React.createElement(
            'g',
            { key: rackItem.id, onClick: () => setSelected(rackItem), style: { cursor: 'pointer' } },
            React.createElement('rect', { x, y, width: 58, height: 92, rx: 5, fill: selected?.id === rackItem.id ? '#1d4ed8' : '#0f172a', stroke: '#60a5fa', strokeWidth: 1.5 }),
            React.createElement('text', { x: x + 29, y: y + 28, fill: '#fff', fontSize: 12, textAnchor: 'middle' }, rackItem.name),
            React.createElement('text', { x: x + 29, y: y + 52, fill: '#94a3b8', fontSize: 10, textAnchor: 'middle' }, `${serverCount} servers`),
            React.createElement('rect', { x: x + 12, y: y + 66, width: Math.min(34, 4 + serverCount * 6), height: 8, rx: 4, fill: serverCount > 8 ? '#ef4444' : '#10b981' }),
          );
        }),
      ),
    ),
  );
}

function ListDetailView({ title, eyebrow, items, onSelect }) {
  return React.createElement(
    'div',
    { className: 'tf-ea-list', 'data-ea-list-detail-view': eyebrow },
    items.length === 0
      ? React.createElement('div', { className: 'tf-ea-list-card' }, React.createElement('p', { className: 'tf-ea-eyebrow' }, eyebrow), React.createElement('h3', null, 'No local records available'))
      : items.map((item) => React.createElement(
        'article',
        { key: item.id, className: 'tf-ea-list-card', onClick: () => onSelect(item) },
        React.createElement('p', { className: 'tf-ea-eyebrow' }, eyebrow),
        React.createElement('h3', null, entityTitle(item)),
        React.createElement('p', null, String(item.description ?? item.status ?? item.protocol ?? title)),
      )),
  );
}

function ViewerApp({ title, model, diagnostics, modules }) {
  const ReactFlow = modules.ReactFlow;
  const Background = modules.Background;
  const Controls = modules.Controls;
  const applyNodeChanges = modules.applyNodeChanges;
  const applyEdgeChanges = modules.applyEdgeChanges;
  const dagre = modules.dagre;
  const edgeTypes = React.useMemo(() => createOffsetEdgeTypes(React, modules), [modules]);

  const groupNames = React.useMemo(() => {
    const groups = new Set(model.systems.map(groupForSystem));
    if (groups.size === 0) groups.add('Other Operations');
    return [...groups].sort();
  }, [model]);
  const [view, setView] = React.useState('network');
  const [detailLevel, setDetailLevel] = React.useState(2);
  const [showFutureState, setShowFutureState] = React.useState(false);
  const [timelineYear, setTimelineYear] = React.useState(2026);
  const [showDataFlow, setShowDataFlow] = React.useState(false);
  const [showSecurity, setShowSecurity] = React.useState(false);
  const [showLifecycle, setShowLifecycle] = React.useState(false);
  const [showDeployment, setShowDeployment] = React.useState(false);
  const [enabledGroups, setEnabledGroups] = React.useState(() => Object.fromEntries(groupNames.map((name) => [name, true])));
  const [selected, setSelected] = React.useState(undefined);

  const graphState = React.useMemo(() => ({
    view,
    detailLevel,
    showFutureState,
    timelineYear,
    showDataFlow,
    showSecurity,
    showLifecycle,
    showDeployment,
    enabledGroups,
  }), [view, detailLevel, showFutureState, timelineYear, showDataFlow, showSecurity, showLifecycle, showDeployment, enabledGroups]);

  const graph = React.useMemo(() => {
    if (view === 'business') {
      return buildBusinessGraph(React, dagre, model);
    }
    if (view === 'capability') {
      return buildCapabilityGraph(React, dagre, model, graphState);
    }
    return buildGlobalGraph(React, dagre, model, graphState);
  }, [view, model, dagre, graphState]);
  const nodePositionsRef = React.useRef(new Map());
  const mergeSavedNodePositions = React.useCallback((nextNodes) => nextNodes.map((node) => {
    const savedPosition = nodePositionsRef.current.get(`${view}:${node.id}`);
    return savedPosition
      ? { ...node, position: savedPosition }
      : node;
  }), [view]);
  const [nodes, setNodes] = React.useState(graph.nodes);
  const [edges, setEdges] = React.useState(graph.edges);

  React.useEffect(() => {
    setNodes(mergeSavedNodePositions(graph.nodes));
    setEdges(graph.edges);
  }, [graph, mergeSavedNodePositions]);

  const onNodesChange = React.useCallback((changes) => setNodes((current) => {
    const nextNodes = applyNodeChanges(changes, current);
    for (const node of nextNodes) {
      if (node.position && Number.isFinite(node.position.x) && Number.isFinite(node.position.y)) {
        nodePositionsRef.current.set(`${view}:${node.id}`, {
          x: node.position.x,
          y: node.position.y,
        });
      }
    }
    return nextNodes;
  }), [applyNodeChanges, view]);
  const onEdgesChange = React.useCallback((changes) => setEdges((current) => applyEdgeChanges(changes, current)), [applyEdgeChanges]);

  const selectedView = viewOptions.find((candidate) => candidate.id === view) ?? viewOptions[0];
  const selectedRaw = selected?.data?.raw ?? selected;
  const graphView = view === 'network' || view === 'capability' || view === 'dependency' || view === 'business';

  return React.createElement(
    'section',
    { className: 'tf-ea-viewer', 'data-ea-viewer': 'ready', 'data-ea-view': view },
    React.createElement(
      'div',
      { className: 'tf-ea-shell' },
      React.createElement(
        'aside',
        { className: 'tf-ea-sidebar' },
        React.createElement(
          'div',
          { className: 'tf-ea-brand' },
          React.createElement('div', { className: 'tf-ea-compass' }, 'EA'),
          React.createElement('div', null, React.createElement('div', { className: 'tf-ea-brand-title' }, 'NCIA EA Portal'), React.createElement('p', { className: 'tf-ea-eyebrow' }, 'Local fixture')),
        ),
        React.createElement(
          'nav',
          { className: 'tf-ea-nav', 'aria-label': 'EA viewer views' },
          viewOptions.map((option) => React.createElement(
            'button',
            {
              key: option.id,
              type: 'button',
              'aria-pressed': view === option.id,
              onClick: () => {
                setView(option.id);
                setSelected(undefined);
              },
            },
            option.label,
          )),
        ),
        React.createElement(
          'div',
          { className: 'tf-ea-panel' },
          React.createElement('h3', null, 'Fixture'),
          React.createElement('div', { className: 'tf-ea-row-label' }, `${model.recordCount} records`),
          React.createElement('div', { className: 'tf-ea-row-label' }, `${model.systems.length} systems / ${model.services.length} services`),
          React.createElement('div', { className: 'tf-ea-row-label' }, `${diagnostics.length} diagnostics`),
        ),
      ),
      React.createElement(
        'main',
        { className: 'tf-ea-stage' },
        React.createElement(
          'div',
          { className: 'tf-ea-header' },
          React.createElement('h2', null, view === 'business' ? 'Business Architecture Dashboard' : title),
          React.createElement('p', null, selectedView.label),
        ),
        graphView && React.createElement(
          'div',
          { className: 'tf-ea-flow', 'data-ea-graph-stage': true },
          React.createElement(
            ReactFlow,
            {
              nodes,
              edges,
              onNodesChange,
              onEdgesChange,
              onNodeClick: (event, node) => setSelected(node),
              fitView: true,
              minZoom: 0.2,
              maxZoom: 1.6,
              edgeTypes,
            },
            React.createElement(Background, { color: '#1e293b', gap: 20, size: 1 }),
            React.createElement(Controls, { style: { background: 'rgba(15,23,42,.85)', border: '1px solid rgba(59,130,246,.35)', color: '#fff' } }),
          ),
        ),
        view === 'datacenter' && React.createElement(DatacenterView, { model, selected: selectedRaw, setSelected }),
        view === 'projects' && React.createElement(ListDetailView, { title: 'Project Portfolio', eyebrow: 'Project', items: model.projects, onSelect: setSelected }),
        view === 'process' && React.createElement(ListDetailView, { title: 'Business Processes', eyebrow: 'Process', items: model.businessProcesses, onSelect: setSelected }),
        React.createElement(DetailPanel, { selected }),
        showFutureState && React.createElement(
          'div',
          { className: 'tf-ea-timeline', 'data-ea-timeline': true },
          React.createElement(
            'div',
            { className: 'tf-ea-range-value' },
            React.createElement('span', null, '2012 (Past)'),
            React.createElement('strong', { 'data-ea-timeline-year': true }, timelineYear),
            React.createElement('span', null, '2042 (Future)'),
          ),
          React.createElement('input', { className: 'tf-ea-range', 'aria-label': 'Timeline year', type: 'range', min: 2012, max: 2042, value: timelineYear, onChange: (event) => setTimelineYear(Number(event.target.value)) }),
        ),
      ),
      React.createElement(
        'aside',
        { className: 'tf-ea-controls', 'data-ea-controls': true },
        React.createElement(
          'div',
          { className: 'tf-ea-panel' },
          React.createElement('h3', null, 'Control Dashboard'),
          React.createElement(
            'div',
            { className: 'tf-ea-field' },
            React.createElement('label', { htmlFor: 'tf-ea-view-select' }, 'Active Base Map'),
            React.createElement(
              'select',
              { id: 'tf-ea-view-select', value: view, onChange: (event) => setView(event.target.value), 'data-ea-view-select': true },
              viewOptions.map((option) => React.createElement('option', { key: option.id, value: option.id }, option.label)),
            ),
          ),
          React.createElement(
            'div',
            { className: 'tf-ea-field' },
            React.createElement(
              'div',
              { className: 'tf-ea-range-value' },
              React.createElement('label', { htmlFor: 'tf-ea-detail-level' }, 'Level of Detail'),
              React.createElement('strong', { 'data-ea-detail-level-label': true }, detailLevel === 1 ? 'Manager' : detailLevel === 2 ? 'Architect' : 'Tech Nerd'),
            ),
            React.createElement('input', { id: 'tf-ea-detail-level', className: 'tf-ea-range', 'aria-label': 'Level of detail', type: 'range', min: 1, max: 3, step: 1, value: detailLevel, onChange: (event) => setDetailLevel(Number(event.target.value)), 'data-ea-detail-level': true }),
          ),
        ),
        React.createElement(
          'div',
          { className: 'tf-ea-panel' },
          React.createElement('h3', null, 'Toggle Overlays'),
          [
            ['Future State (Timeline)', showFutureState, setShowFutureState],
            ['Data Flow (Exchange)', showDataFlow, setShowDataFlow],
            ['Security Architecture', showSecurity, setShowSecurity],
            ['Lifecycle / Tech Radar', showLifecycle, setShowLifecycle],
            ['Hosting Locations', showDeployment, setShowDeployment],
          ].map(([label, value, setter]) => React.createElement(
            'label',
            { key: label, className: 'tf-ea-check' },
            React.createElement('input', { type: 'checkbox', checked: value, onChange: (event) => setter(event.target.checked) }),
            label,
          )),
        ),
        React.createElement(
          'div',
          { className: 'tf-ea-panel' },
          React.createElement('h3', null, 'Filter Capabilities'),
          groupNames.map((groupName) => React.createElement(
            'label',
            { key: groupName, className: 'tf-ea-check' },
            React.createElement('input', {
              type: 'checkbox',
              checked: enabledGroups[groupName] !== false,
              onChange: (event) => setEnabledGroups((current) => ({ ...current, [groupName]: event.target.checked })),
              style: { accentColor: groupColor(groupName) },
            }),
            React.createElement('span', { style: { color: groupColor(groupName) } }, groupName),
          )),
        ),
      ),
    ),
  );
}

async function mountEaViewerRuntime(container, model) {
  ensurePackageStyle(container);
  const previous = {
    display: container.style.display,
    flex: container.style.flex,
    width: container.style.width,
    height: container.style.height,
    minHeight: container.style.minHeight,
    overflow: container.style.overflow,
  };
  container.style.display = 'flex';
  container.style.flex = '1 1 auto';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.minHeight = '0';
  container.style.overflow = 'hidden';

  const root = createRoot(container);
  try {
    const [reactFlowModule, dagreModule, graphlibModule] = await Promise.all([
      import('@xyflow/react'),
      import('dagre-d3-es/src/dagre/index.js'),
      import('dagre-d3-es/src/graphlib/index.js'),
    ]);
    const dagre = createDagreLayoutEngine(dagreModule, graphlibModule);
    if (!dagre) {
      throw new Error('Dagre ESM layout module did not expose graphlib.Graph.');
    }
    verifyDagreLayoutEngine(dagre);
    root.render(React.createElement(ViewerApp, {
      title: model.title,
      model: model.model,
      diagnostics: model.diagnostics,
      modules: {
        ReactFlow: reactFlowModule.ReactFlow,
        Background: reactFlowModule.Background,
        Controls: reactFlowModule.Controls,
        applyNodeChanges: reactFlowModule.applyNodeChanges,
        applyEdgeChanges: reactFlowModule.applyEdgeChanges,
        getBezierPath: reactFlowModule.getBezierPath,
        EdgeLabelRenderer: reactFlowModule.EdgeLabelRenderer,
        dagre,
      },
    }));
  } catch (error) {
    root.render(React.createElement(
      'section',
      { className: 'tf-ea-viewer tf-ea-viewer--fallback' },
      React.createElement(
        'div',
        { className: 'tf-ea-fallback' },
        React.createElement('p', { className: 'tf-ea-eyebrow' }, 'Enterprise Architecture Viewer'),
        React.createElement('h3', null, 'Viewer runtime failed to load'),
        React.createElement('ul', null, React.createElement('li', null, error?.message ?? 'Unknown runtime error')),
      ),
    ));
  }

  return () => {
    root.unmount();
    container.style.display = previous.display;
    container.style.flex = previous.flex;
    container.style.width = previous.width;
    container.style.height = previous.height;
    container.style.minHeight = previous.minHeight;
    container.style.overflow = previous.overflow;
    container.innerHTML = '';
  };
}

export const eaViewerSurfaceContribution = {
  id: eaViewerSurfaceId,
  label: 'EA Dashboard viewer',
  description: 'Open EA Dashboard Django fixture JSON in a local enterprise architecture viewer.',
  kind: 'enterprise-architecture-viewer',
  localName: 'ea-dashboard',
  capabilities: [eaViewerCapabilityId],
  readOnly: true,
  defaultActive: true,
  resourcePredicate: eaDashboardJsonDocumentPredicate,
  documentPredicate: eaDashboardJsonDocumentPredicate,
  resourceRepresentations: ['text'],
  languageIds: ['json'],
  mimeTypes: ['application/json', 'text/json'],
  fileExtensions: ['json'],
  placements: ['main', 'popup'],
  openWithPriority: 90,
  open(execution = {}) {
    const title = execution.resourceTitle ?? execution.resource?.path ?? 'EA Dashboard viewer';
    const viewerModel = createEaViewerModel(execution.sourceText ?? '', {
      title,
      resource: execution.resource,
    });
    const html = viewerModel.recognized
      ? '<section class="tf-ea-viewer tf-ea-viewer--fallback"><div class="tf-ea-fallback"><p class="tf-ea-eyebrow">Enterprise Architecture Viewer</p><h3>Loading local EA Dashboard viewer...</h3></div></section>'
      : createFailureHtml(title, viewerModel.diagnostics);

    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}:${viewerModel.recognized ? 'recognized' : 'fallback'}`,
      summary: viewerModel.recognized
        ? 'Local EA Dashboard fixture viewer.'
        : 'EA Dashboard fixture was not recognized.',
      detail: viewerModel.recognized
        ? `${viewerModel.model.recordCount} records / ${viewerModel.diagnostics.length} diagnostics`
        : 'JSON fallback',
      readOnly: true,
      diagnostics: viewerModel.diagnostics,
      inspectorSections: [
        {
          eyebrow: 'Runtime',
          icon: 'status',
          title: 'EA Dashboard viewer',
          rows: [
            { label: 'Renderer', value: 'React Flow / Dagre' },
            { label: 'Source', value: 'Local JSON fixture' },
            { label: 'Network', value: 'No default calls' },
          ],
        },
      ],
      surface: {
        model: {
          html,
          diagnostics: viewerModel.diagnostics,
        },
        mount(container) {
          if (!viewerModel.recognized || !viewerModel.model) {
            ensurePackageStyle(container);
            container.innerHTML = html;
            return () => {
              container.innerHTML = '';
            };
          }

          let disposed = false;
          let disposeRuntime = () => {};
          container.innerHTML = html;
          void (async () => {
            disposeRuntime = await mountEaViewerRuntime(container, viewerModel);
            if (disposed) {
              disposeRuntime();
            }
          })();
          return () => {
            disposed = true;
            disposeRuntime();
          };
        },
      },
    };
  },
};
