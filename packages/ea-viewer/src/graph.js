export const viewOptions = Object.freeze([
  { id: 'network', label: '1. Network Topology View' },
  { id: 'capability', label: '2. Business Capability Map' },
  { id: 'dependency', label: '3. Service Dependency Graph' },
  { id: 'business', label: '4. Business Architecture Dashboard' },
  { id: 'datacenter', label: '5. Datacenter Detail View' },
  { id: 'projects', label: '6. Project Portfolio View' },
  { id: 'process', label: '7. Business Process Detail View' },
]);

function coerceArray(value) {
  return Array.isArray(value) ? value : [];
}

function readName(value, fallback) {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function securityLevel(entity) {
  return Number(entity?.security_domain?.level ?? entity?.securityDomain?.level ?? entity?.level ?? 1) || 1;
}

export function formatSecurity(entity) {
  const domain = entity?.security_domain;
  if (domain && typeof domain === 'object') {
    return domain.abbreviation ? `${domain.abbreviation} / L${domain.level ?? 1}` : domain.name;
  }
  return 'L1';
}

export function entityTitle(entity) {
  return readName(entity?.name ?? entity?.hostname, `Record ${entity?.id ?? ''}`);
}

function getLifecycle(entity, year) {
  const phases = Array.isArray(entity?.lifecycle) ? entity.lifecycle : [];
  if (phases.length > 0) {
    const current = phases.find((phase) => year >= Number(phase.start) && year < Number(phase.end));
    if (current) {
      return { status: current.status ?? 'Operational', opacity: 1, color: '#10b981' };
    }
  }
  const text = `${entityTitle(entity)} ${entity?.status ?? ''}`.toLowerCase();
  if (year < 2022) {
    return { status: 'Planned (Future)', opacity: 0.35, color: '#a855f7' };
  }
  if (text.includes('legacy') || text.includes('obsolete')) {
    return year >= 2029
      ? { status: 'Operational (Obsolete)', opacity: 1, color: '#ef4444' }
      : { status: 'Operational', opacity: 1, color: '#10b981' };
  }
  if (year >= 2038) {
    return { status: 'Operational (Aging)', opacity: 0.85, color: '#f59e0b' };
  }
  return { status: entity?.status ?? 'Operational', opacity: 1, color: '#10b981' };
}

function readYear(value) {
  const year = Number.parseInt(String(value ?? '').slice(0, 4), 10);
  return Number.isFinite(year) ? year : undefined;
}

function resolveTimelineState(entity, year) {
  const start = readYear(entity?.start_date ?? entity?.planned_start_date);
  const end = readYear(entity?.end_date ?? entity?.planned_end_date);
  const text = `${entityTitle(entity)} ${entity?.status ?? ''}`.toLowerCase();

  if (start && year < start) {
    return { status: 'Planned (Future)', active: false, opacity: 0.25, color: '#a855f7' };
  }
  if (end && year > end + 1) {
    return { status: 'Retired', active: false, opacity: 0.22, color: '#64748b' };
  }
  if (text.includes('legacy') || text.includes('obsolete')) {
    return year >= 2029
      ? { status: 'Operational (Obsolete)', active: true, opacity: 1, color: '#ef4444' }
      : { status: 'Operational', active: true, opacity: 1, color: '#10b981' };
  }
  if (year < 2026 && !start) {
    return { status: 'Planned (Future)', active: false, opacity: 0.35, color: '#a855f7' };
  }
  if (year >= 2038 && !end) {
    return { status: 'Operational (Aging)', active: true, opacity: 0.85, color: '#f59e0b' };
  }
  return { status: entity?.status ?? 'Operational', active: true, opacity: 1, color: '#10b981' };
}

function formatLifecycleMeta(entity, lifecycle, state) {
  const yearSuffix = state.showFutureState ? ` / ${state.timelineYear}` : '';
  return `${formatSecurity(entity)} / ${lifecycle.status}${yearSuffix}`;
}

export function groupForSystem(system) {
  const capabilities = coerceArray(system?.capabilities).map((capability) => entityTitle(capability).toLowerCase());
  const name = entityTitle(system).toLowerCase();
  if (capabilities.some((capability) => capability.includes('isr') || capability.includes('sensor') || capability.includes('target') || capability.includes('air command') || capability.includes('maritime'))) {
    return 'ISR & Sensors';
  }
  if (capabilities.some((capability) => capability.includes('intelligence') || capability.includes('fusion') || capability.includes('command') || capability.includes('control') || capability.includes('messaging')) || name.includes('c2') || name.includes('fas')) {
    return 'C2 & Intelligence';
  }
  if (capabilities.some((capability) => capability.includes('sat') || capability.includes('communication') || capability.includes('voice') || capability.includes('routing') || capability.includes('wide area') || capability.includes('deployable edge')) || name.includes('sat') || name.includes('wan') || name.includes('voice')) {
    return 'Communications & SATCOM';
  }
  if (capabilities.some((capability) => capability.includes('identity') || capability.includes('security') || capability.includes('multi-level')) || name.includes('dir') || name.includes('guard') || name.includes('soc')) {
    return 'Enterprise Security & Identity';
  }
  if (capabilities.some((capability) => capability.includes('tactical hq')) || name.includes('t-hq')) {
    return 'Tactical HQ Services';
  }
  if (capabilities.some((capability) => capability.includes('supply') || capability.includes('asset') || capability.includes('personnel') || capability.includes('roster')) || name.includes('hr') || name.includes('logistics')) {
    return 'Logistics & Supply Chain';
  }
  return 'Other Operations';
}

export function groupColor(groupName) {
  switch (groupName) {
    case 'ISR & Sensors': return '#38bdf8';
    case 'C2 & Intelligence': return '#f43f5e';
    case 'Communications & SATCOM': return '#a855f7';
    case 'Enterprise Security & Identity': return '#10b981';
    case 'Tactical HQ Services': return '#eab308';
    case 'Logistics & Supply Chain': return '#f97316';
    default: return '#64748b';
  }
}

function createNodeLabel(ReactRef, node) {
  return ReactRef.createElement(
    'div',
    { className: 'tf-ea-node-card', 'data-ea-node-card': node.id },
    ReactRef.createElement('div', { className: 'tf-ea-node-card__kind' }, node.kindLabel),
    ReactRef.createElement('div', { className: 'tf-ea-node-card__title' }, node.title),
    ReactRef.createElement('div', { className: 'tf-ea-node-card__meta' }, node.meta),
  );
}

function edgeStyle(color, state, lifecycle) {
  return {
    stroke: color,
    strokeWidth: state.showDataFlow ? 3 : 2.4,
    opacity: lifecycle?.opacity ?? 1,
  };
}

function edgeLabelStyle(color) {
  return { fill: color };
}

function edgeLabelBgStyle() {
  return { fill: 'rgba(8,23,44,.94)' };
}

function edgeMarker(color) {
  return {
    type: 'arrowclosed',
    color,
    width: 16,
    height: 16,
  };
}

function displayLevelForEntity(entity, kind) {
  if (kind === 'project') {
    return 1;
  }
  if (kind === 'database' || kind === 'cloud') {
    return 3;
  }
  const name = entityTitle(entity).toLowerCase();
  if (name.includes('tgt') || name.includes('accs') || name.includes('mccis') || name.includes('m-rad') || securityLevel(entity) >= 4) {
    return 2;
  }
  return 1;
}

function displayLevelForService(service) {
  const protocol = String(service?.protocol ?? '').toLowerCase();
  const bandwidth = String(service?.bandwidth ?? '').toLowerCase();
  if (protocol.includes('sip') || protocol.includes('rtp') || protocol.includes('tcp/ip') || protocol.includes('bgp') || protocol.includes('ospf')) {
    return 3;
  }
  if (protocol.includes('ipsec') || protocol.includes('ldaps') || bandwidth.includes('gbps')) {
    return 2;
  }
  return 1;
}

function isEncryptedService(service) {
  const protocol = String(service?.protocol ?? '').toLowerCase();
  return protocol.includes('https')
    || protocol.includes('tls')
    || protocol.includes('mtls')
    || protocol.includes('ldaps')
    || protocol.includes('ipsec')
    || Number(service?.port) === 443
    || Number(service?.port) === 500
    || Number(service?.port) === 636;
}

function deconflictEdges(edges) {
  const grouped = new Map();
  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}`;
    const group = grouped.get(key) ?? [];
    group.push(edge);
    grouped.set(key, group);
  }

  const offsetForIndex = (index) => {
    if (index === 0) return 0;
    const magnitude = 18 * Math.ceil(index / 2);
    return index % 2 === 1 ? -magnitude : magnitude;
  };

  return edges.map((edge) => {
    const group = grouped.get(`${edge.source}->${edge.target}`) ?? [];
    const index = group.indexOf(edge);
    return {
      ...edge,
      type: 'offset',
      data: {
        ...edge.data,
        offset: edge.data?.offset ?? offsetForIndex(index),
      },
    };
  });
}

function layoutWithDagre(dagre, nodes, edges, direction) {
  if (!dagre?.graphlib?.Graph || typeof dagre.layout !== 'function') {
    throw new Error('Dagre layout engine did not initialize with graphlib.Graph.');
  }

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, nodesep: 110, ranksep: 150 });
  for (const node of nodes) {
    graph.setNode(node.id, { width: 220, height: 96 });
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }
  dagre.layout(graph);
  return nodes.map((node) => {
    const position = graph.node(node.id);
    if (!position) {
      throw new Error(`Dagre layout did not return a position for node ${node.id}.`);
    }
    const sourcePosition = direction === 'TB' ? 'bottom' : 'right';
    const targetPosition = direction === 'TB' ? 'top' : 'left';
    return {
      ...node,
      sourcePosition,
      targetPosition,
      position: {
        x: position.x - 110,
        y: position.y - 48,
      },
    };
  });
}

export function createDagreLayoutEngine(dagreModule, graphlibModule) {
  const layout = dagreModule?.layout;
  const Graph = graphlibModule?.Graph;
  if (typeof layout !== 'function' || typeof Graph !== 'function') {
    return undefined;
  }
  return {
    layout,
    graphlib: {
      Graph,
    },
  };
}

export function verifyDagreLayoutEngine(dagre) {
  if (!dagre?.graphlib?.Graph || typeof dagre.layout !== 'function') {
    throw new Error('Dagre layout engine did not expose graphlib.Graph.');
  }

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'LR' });
  graph.setNode('source', { width: 100, height: 50 });
  graph.setNode('target', { width: 100, height: 50 });
  graph.setEdge('source', 'target');
  dagre.layout(graph);

  for (const id of ['source', 'target']) {
    const node = graph.node(id);
    if (!Number.isFinite(node?.x) || !Number.isFinite(node?.y)) {
      throw new Error(`Dagre layout engine did not produce coordinates for ${id}.`);
    }
  }
}

function createDefaultGraphState(overrides = {}) {
  return {
    view: 'network',
    detailLevel: 2,
    showFutureState: false,
    timelineYear: 2026,
    showDataFlow: false,
    showSecurity: false,
    showLifecycle: false,
    showDeployment: false,
    enabledGroups: {},
    ...overrides,
  };
}

export function buildGlobalGraph(ReactRef, dagre, model, incomingState = {}) {
  const state = createDefaultGraphState(incomingState);
  const year = state.showFutureState ? state.timelineYear : 2026;
  const nodes = [];
  const nodeIds = new Set();
  const nodeTimelines = new Map();

  const addNode = (node) => {
    if (nodeIds.has(node.id)) return;
    nodes.push(node);
    nodeIds.add(node.id);
  };

  const visibleSystems = model.systems.filter((system) => (
    displayLevelForEntity(system, 'system') <= state.detailLevel
    && state.enabledGroups[groupForSystem(system)] !== false
  ));

  for (const system of visibleSystems) {
    const lifecycle = resolveTimelineState(system, year);
    const group = groupForSystem(system);
    const borderColor = state.showFutureState || state.showLifecycle ? lifecycle.color : groupColor(group);
    nodeTimelines.set(`system-${system.id}`, lifecycle);
    addNode({
      id: `system-${system.id}`,
      raw: system,
      kindLabel: group,
      title: entityTitle(system),
      meta: formatLifecycleMeta(system, lifecycle, state),
      style: {
        border: `2px solid ${borderColor}`,
        background: 'transparent',
        opacity: lifecycle.opacity,
      },
    });
  }

  if (state.detailLevel >= 3) {
    for (const database of model.databases) {
      const systemNodeId = database.system?.id ? `system-${database.system.id}` : undefined;
      if (!systemNodeId || !nodeIds.has(systemNodeId)) continue;
      const lifecycle = resolveTimelineState(database, year);
      nodeTimelines.set(`database-${database.id}`, lifecycle);
      addNode({
        id: `database-${database.id}`,
        raw: database,
        kindLabel: 'Database',
        title: entityTitle(database),
        meta: `${formatSecurity(database)} / ${lifecycle.status}${state.showFutureState ? ` / ${year}` : ''}`,
        style: {
          border: `2px solid ${state.showFutureState || state.showLifecycle ? lifecycle.color : '#06b6d4'}`,
          background: 'rgba(22,78,99,.36)',
          opacity: lifecycle.opacity,
        },
      });
    }

    for (const cloud of model.cloudResources) {
      if (!(cloud.systems ?? []).some((system) => nodeIds.has(`system-${system.id}`))) continue;
      const lifecycle = resolveTimelineState(cloud, year);
      nodeTimelines.set(`cloud-${cloud.id}`, lifecycle);
      addNode({
        id: `cloud-${cloud.id}`,
        raw: cloud,
        kindLabel: 'Cloud Resource',
        title: entityTitle(cloud),
        meta: `${cloud.provider ?? 'Cloud'} / ${lifecycle.status}${state.showFutureState ? ` / ${year}` : ''}`,
        style: {
          border: `2px solid ${state.showFutureState || state.showLifecycle ? lifecycle.color : '#60a5fa'}`,
          background: 'rgba(30,64,175,.28)',
          opacity: lifecycle.opacity,
        },
      });
    }
  }

  if (state.detailLevel === 1 || state.detailLevel >= 3) {
    for (const project of model.projects) {
      const linkedSystems = new Set([
        ...(project.systems ?? []).map((system) => system?.id),
        ...model.systems
          .filter((system) => (system.capability_ids ?? []).some((id) => (project.capability_ids ?? []).includes(id)))
          .map((system) => system.id),
      ].filter(Boolean));
      if (![...linkedSystems].some((id) => nodeIds.has(`system-${id}`))) continue;
      const lifecycle = resolveTimelineState(project, year);
      if (state.showFutureState && !lifecycle.active && lifecycle.status === 'Retired') continue;
      nodeTimelines.set(`project-${project.id}`, lifecycle);
      addNode({
        id: `project-${project.id}`,
        raw: project,
        kindLabel: 'Project',
        title: entityTitle(project),
        meta: `${lifecycle.status} / ${project.completion_percentage ?? 0}%${state.showFutureState ? ` / ${year}` : ''}`,
        style: {
          border: `2px solid ${state.showFutureState || state.showLifecycle ? lifecycle.color : '#a855f7'}`,
          background: 'rgba(88,28,135,.36)',
          opacity: lifecycle.opacity,
        },
      });
    }
  }

  const edges = [];
  const pushEdge = (edge, sourceTimeline, targetTimeline) => {
    const sourceActive = sourceTimeline?.active !== false;
    const targetActive = targetTimeline?.active !== false;
    edges.push({
      ...edge,
      style: {
        ...edge.style,
        opacity: sourceActive && targetActive ? (edge.style?.opacity ?? 1) : 0.08,
      },
    });
  };

  for (const service of model.services) {
    const providerNodeId = service.system?.id ? `system-${service.system.id}` : undefined;
    if (!providerNodeId || !nodeIds.has(providerNodeId) || displayLevelForService(service) > state.detailLevel) continue;
    const providerTimeline = nodeTimelines.get(providerNodeId);
    const lifecycle = resolveTimelineState(service.system ?? service, year);
    const baseColor = state.showFutureState || state.showLifecycle ? lifecycle.color : '#475569';
    const serviceLabel = String(service.name ?? service.protocol ?? 'service');

    for (const consumer of service.consumed_by ?? []) {
      const consumerNodeId = consumer?.id ? `system-${consumer.id}` : undefined;
      if (!consumerNodeId || !nodeIds.has(consumerNodeId)) continue;
      const consumerTimeline = nodeTimelines.get(consumerNodeId);

      if (providerNodeId === consumerNodeId) {
        const serviceNodeId = `service-${service.id}`;
        if (!nodeIds.has(serviceNodeId)) {
          nodeTimelines.set(serviceNodeId, lifecycle);
          addNode({
            id: serviceNodeId,
            raw: service,
            kindLabel: 'Service',
            title: entityTitle(service),
            meta: `${String(service.protocol ?? 'Service')}${state.showFutureState ? ` / ${year}` : ''}`,
            style: {
              border: `2px solid ${state.showFutureState || state.showLifecycle ? lifecycle.color : '#38bdf8'}`,
              background: 'rgba(8,47,73,.62)',
              opacity: lifecycle.opacity,
            },
          });
        }
        pushEdge({
          id: `service-${service.id}-provider`,
          source: providerNodeId,
          target: serviceNodeId,
          label: state.detailLevel >= 2 ? `offers${state.showFutureState ? ` @ ${year}` : ''}` : undefined,
          markerEnd: edgeMarker(baseColor),
          style: edgeStyle(baseColor, state, lifecycle),
        }, providerTimeline, lifecycle);
        pushEdge({
          id: `service-${service.id}-${consumer.id}`,
          source: serviceNodeId,
          target: consumerNodeId,
          label: state.detailLevel >= 2 ? `${String(service.protocol ?? service.name ?? 'uses')}${state.showFutureState ? ` @ ${year}` : ''}` : undefined,
          markerEnd: edgeMarker(baseColor),
          style: edgeStyle(baseColor, state, lifecycle),
        }, lifecycle, consumerTimeline);
        continue;
      }

      pushEdge({
        id: `service-${service.id}-${consumer.id}-base`,
        source: providerNodeId,
        target: consumerNodeId,
        label: state.detailLevel >= 3 ? String(service.protocol ?? service.name ?? 'uses') : undefined,
        markerEnd: edgeMarker(baseColor),
        labelStyle: edgeLabelStyle('#cbd5e1'),
        labelBgStyle: edgeLabelBgStyle(),
        style: edgeStyle(baseColor, state, lifecycle),
      }, providerTimeline, consumerTimeline);

      if (state.showDataFlow) {
        pushEdge({
          id: `service-${service.id}-${consumer.id}-dataflow`,
          source: providerNodeId,
          target: consumerNodeId,
          animated: true,
          label: `${serviceLabel}${state.showFutureState ? ` @ ${year}` : ''}`,
          markerEnd: edgeMarker('#3b82f6'),
          labelStyle: edgeLabelStyle('#60a5fa'),
          labelBgStyle: edgeLabelBgStyle(),
          style: edgeStyle('#3b82f6', state, lifecycle),
        }, providerTimeline, consumerTimeline);
      }

      if (state.showSecurity) {
        const encrypted = isEncryptedService(service);
        const securityColor = encrypted ? '#10b981' : '#ef4444';
        pushEdge({
          id: `service-${service.id}-${consumer.id}-security`,
          source: providerNodeId,
          target: consumerNodeId,
          animated: !encrypted,
          label: encrypted ? `[${service.protocol ?? 'encrypted'}] ${serviceLabel}` : `[CLEAR TEXT] ${serviceLabel}`,
          markerEnd: edgeMarker(securityColor),
          labelStyle: edgeLabelStyle(securityColor),
          labelBgStyle: edgeLabelBgStyle(),
          style: {
            ...edgeStyle(securityColor, state, lifecycle),
            strokeDasharray: encrypted ? undefined : '4 4',
          },
        }, providerTimeline, consumerTimeline);
      }
    }
  }

  if (state.detailLevel >= 3) {
    for (const database of model.databases) {
      const systemNodeId = database.system?.id ? `system-${database.system.id}` : undefined;
      const databaseNodeId = `database-${database.id}`;
      if (systemNodeId && nodeIds.has(systemNodeId) && nodeIds.has(databaseNodeId)) {
        pushEdge({
          id: `database-${database.id}-system-${database.system.id}`,
          source: systemNodeId,
          target: databaseNodeId,
          label: 'queries',
          markerEnd: edgeMarker('#06b6d4'),
          labelStyle: edgeLabelStyle('#67e8f9'),
          labelBgStyle: edgeLabelBgStyle(),
          style: edgeStyle('#06b6d4', state, nodeTimelines.get(databaseNodeId)),
        }, nodeTimelines.get(systemNodeId), nodeTimelines.get(databaseNodeId));
      }
    }

    for (const cloud of model.cloudResources) {
      const cloudNodeId = `cloud-${cloud.id}`;
      for (const system of cloud.systems ?? []) {
        const systemNodeId = `system-${system.id}`;
        if (nodeIds.has(systemNodeId) && nodeIds.has(cloudNodeId)) {
          pushEdge({
            id: `cloud-${cloud.id}-system-${system.id}`,
            source: systemNodeId,
            target: cloudNodeId,
            label: cloud.resource_type ?? 'hosts',
            markerEnd: edgeMarker('#60a5fa'),
            labelStyle: edgeLabelStyle('#bfdbfe'),
            labelBgStyle: edgeLabelBgStyle(),
            style: edgeStyle('#60a5fa', state, nodeTimelines.get(cloudNodeId)),
          }, nodeTimelines.get(systemNodeId), nodeTimelines.get(cloudNodeId));
        }
      }
    }
  }

  if (state.detailLevel === 1 || state.detailLevel >= 3) {
    for (const project of model.projects) {
      const projectNodeId = `project-${project.id}`;
      if (!nodeIds.has(projectNodeId)) continue;
      const linkedSystems = new Set([
        ...(project.systems ?? []).map((system) => system?.id),
        ...model.systems
          .filter((system) => (system.capability_ids ?? []).some((id) => (project.capability_ids ?? []).includes(id)))
          .map((system) => system.id),
      ].filter(Boolean));
      for (const systemId of linkedSystems) {
        const systemNodeId = `system-${systemId}`;
        if (!nodeIds.has(systemNodeId)) continue;
        pushEdge({
          id: `project-${project.id}-system-${systemId}`,
          source: projectNodeId,
          target: systemNodeId,
          animated: true,
          label: 'delivers',
          markerEnd: edgeMarker('#a855f7'),
          labelStyle: edgeLabelStyle('#d8b4fe'),
          labelBgStyle: edgeLabelBgStyle(),
          style: {
            ...edgeStyle('#a855f7', state, nodeTimelines.get(projectNodeId)),
            strokeDasharray: '5 5',
            strokeWidth: 2,
          },
        }, nodeTimelines.get(projectNodeId), nodeTimelines.get(systemNodeId));
      }
    }
  }

  const layoutEdges = deconflictEdges(edges);
  const direction = state.view === 'dependency' ? 'TB' : 'LR';
  const layouted = layoutWithDagre(dagre, nodes, layoutEdges, direction).map((node) => ({
    ...node,
    data: { label: createNodeLabel(ReactRef, node), raw: node.raw },
  }));

  return { nodes: layouted, edges: layoutEdges };
}

export function buildCapabilityGraph(ReactRef, dagre, model, incomingState = {}) {
  const state = createDefaultGraphState(incomingState);
  const enabledGroups = state.enabledGroups ?? {};
  const nodes = [];
  const edges = [];
  const capabilityIds = new Set();
  const visibleSystems = model.systems.filter((system) => (
    displayLevelForEntity(system, 'system') <= state.detailLevel
    && enabledGroups[groupForSystem(system)] !== false
  ));

  for (const capability of model.capabilities) {
    capabilityIds.add(capability.id);
    nodes.push({
      id: `capability-${capability.id}`,
      raw: capability,
      kindLabel: 'Business Capability',
      title: entityTitle(capability),
      meta: formatSecurity(capability),
      style: {
        border: `2px solid ${formatSecurity(capability).includes('L4') ? '#f97316' : '#10b981'}`,
        background: 'rgba(6,78,59,.3)',
      },
    });
  }

  for (const system of visibleSystems) {
    const linkedCapabilities = coerceArray(system.capabilities)
      .filter((capability) => capabilityIds.has(capability.id));
    if (linkedCapabilities.length === 0) {
      continue;
    }
    const systemNodeId = `system-${system.id}`;
    nodes.push({
      id: systemNodeId,
      raw: system,
      kindLabel: 'Supporting System',
      title: entityTitle(system),
      meta: `${groupForSystem(system)} / ${formatSecurity(system)}`,
      style: {
        border: `2px solid ${groupColor(groupForSystem(system))}`,
        background: 'rgba(30,64,175,.24)',
      },
    });
    for (const capability of linkedCapabilities) {
      edges.push({
        id: `capability-${capability.id}-system-${system.id}`,
        source: `capability-${capability.id}`,
        target: systemNodeId,
        label: state.detailLevel >= 2 ? 'enabled by' : undefined,
        markerEnd: edgeMarker(groupColor(groupForSystem(system))),
        style: {
          stroke: groupColor(groupForSystem(system)),
          strokeWidth: 1.8,
        },
      });
    }
  }

  const uniqueNodes = [...new Map(nodes.map((node) => [node.id, node])).values()];
  const layoutEdges = deconflictEdges(edges);
  return {
    nodes: layoutWithDagre(dagre, uniqueNodes, layoutEdges, 'LR').map((node) => ({
      ...node,
      data: { label: createNodeLabel(ReactRef, node), raw: node.raw },
    })),
    edges: layoutEdges,
  };
}

export function buildBusinessGraph(ReactRef, dagre, model) {
  const nodes = [];
  const edges = [];
  const addNode = (id, raw, kindLabel, color) => {
    nodes.push({
      id,
      raw,
      kindLabel,
      title: entityTitle(raw),
      meta: formatSecurity(raw),
      style: { border: `2px solid ${color}`, background: 'transparent' },
    });
  };
  for (const goal of model.strategicGoals) addNode(`goal-${goal.id}`, goal, 'Strategic Goal', '#4f46e5');
  for (const stream of model.valueStreams) {
    addNode(`stream-${stream.id}`, stream, 'Value Stream', '#10b981');
    for (const goal of stream.strategic_goals ?? []) {
      edges.push({ id: `goal-${goal.id}-stream-${stream.id}`, source: `goal-${goal.id}`, target: `stream-${stream.id}`, type: 'smoothstep', animated: true, style: { stroke: '#818cf8', strokeWidth: 2 } });
    }
  }
  for (const process of model.businessProcesses) {
    addNode(`process-${process.id}`, process, 'Business Process', '#f59e0b');
    if (process.value_stream?.id) {
      edges.push({ id: `stream-${process.value_stream.id}-process-${process.id}`, source: `stream-${process.value_stream.id}`, target: `process-${process.id}`, type: 'smoothstep', style: { stroke: '#34d399', strokeWidth: 2 } });
    }
    for (const system of process.systems ?? []) {
      addNode(`system-${system.id}`, system, 'IT System', '#3b82f6');
      edges.push({ id: `process-${process.id}-system-${system.id}`, source: `process-${process.id}`, target: `system-${system.id}`, type: 'smoothstep', animated: true, label: 'supports', style: { stroke: '#fbbf24', strokeWidth: 1.5, strokeDasharray: '4 4' } });
    }
  }
  const uniqueNodes = [...new Map(nodes.map((node) => [node.id, node])).values()];
  return {
    nodes: layoutWithDagre(dagre, uniqueNodes, edges, 'TB').map((node) => ({
      ...node,
      data: { label: createNodeLabel(ReactRef, node), raw: node.raw },
    })),
    edges,
  };
}

export function createOffsetEdgeTypes(ReactRef, modules) {
  const getBezierPath = modules.getBezierPath;
  const EdgeLabelRenderer = modules.EdgeLabelRenderer;
  if (typeof getBezierPath !== 'function' || !EdgeLabelRenderer) {
    return undefined;
  }

  const OffsetConnectionEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    labelStyle,
    labelBgStyle,
    data = {},
  }) => {
    const offset = Number(data.offset ?? 0);
    const isHorizontal = sourcePosition === 'left' || sourcePosition === 'right';
    const shiftedSourceX = isHorizontal ? sourceX : sourceX + offset;
    const shiftedSourceY = isHorizontal ? sourceY + offset : sourceY;
    const shiftedTargetX = isHorizontal ? targetX : targetX + offset;
    const shiftedTargetY = isHorizontal ? targetY + offset : targetY;
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX: shiftedSourceX,
      sourceY: shiftedSourceY,
      sourcePosition,
      targetX: shiftedTargetX,
      targetY: shiftedTargetY,
      targetPosition,
    });

    return ReactRef.createElement(
      ReactRef.Fragment,
      null,
      ReactRef.createElement('path', {
        id,
        className: 'react-flow__edge-path',
        d: edgePath,
        markerEnd,
        style,
      }),
      label
        ? ReactRef.createElement(
          EdgeLabelRenderer,
          null,
          ReactRef.createElement(
            'div',
            {
              className: 'tf-ea-edge-label',
              style: {
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                background: labelBgStyle?.fill ?? 'rgba(8,23,44,.94)',
                color: labelStyle?.fill ?? '#e0f2fe',
                borderColor: style.stroke ?? '#38bdf8',
                opacity: style.opacity ?? 1,
              },
            },
            label,
          ),
        )
        : null,
    );
  };

  return { offset: OffsetConnectionEdge };
}
