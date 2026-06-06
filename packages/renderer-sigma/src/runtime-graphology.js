export function graphologyDegreeMap(graph) {
  const degree = new Map();
  for (const node of graph.nodes()) {
    degree.set(node, graph.degree(node) || 0);
  }
  return degree;
}

export function metricDomain(values) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) {
    return [0, 1];
  }

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  return min === max ? [min, min + 1] : [min, max];
}

export function sigmaNodeSize(nodeId, baseSize, metric, degrees, pageranks, domain) {
  if (metric === 'fixed') {
    return baseSize;
  }

  const value = metric === 'pagerank'
    ? pageranks.get(nodeId) || 0
    : degrees.get(nodeId) || 0;
  const ratio = (value - domain[0]) / (domain[1] - domain[0]);
  return 4 + Math.min(Math.max(ratio, 0), 1) * Math.max(6, baseSize * 1.6);
}

export function uniqueGraphologyEdgeKey(graph, baseKey) {
  const base = baseKey || `edge-${Date.now()}`;
  if (!graph.hasEdge(base)) {
    return base;
  }

  let index = 2;
  while (graph.hasEdge(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

export function safePagerankValues(graph, pagerank) {
  const values = new Map();
  for (const node of graph.nodes()) {
    values.set(node, 0);
  }
  try {
    const ranks = pagerank(graph, { alpha: 0.85, maxIterations: 100, tolerance: 1e-6 });
    for (const [id, value] of Object.entries(ranks)) {
      values.set(id, Number(value) || 0);
    }
  } catch {
    return values;
  }
  return values;
}

export function runSigmaGraphologyLayout(graph, layouts, layoutName, iterations) {
  const count = Math.max(1, Math.min(1000, Math.round(iterations) || 120));
  const scale = Math.max(4, Math.sqrt(Math.max(1, Number(graph.order) || 1)) * 8);
  if (layoutName === 'random') {
    layouts.randomLayout.assign(graph, { scale, center: 0 });
  } else if (layoutName === 'circular') {
    layouts.circularLayout.assign(graph, { scale, center: 0 });
  } else if (layoutName === 'noverlap') {
    layouts.circularLayout.assign(graph, { scale, center: 0 });
    layouts.noverlap.assign(graph, {
      maxIterations: count,
      settings: { margin: 4, ratio: 1.2, expansion: 1.1 },
    });
  } else {
    layouts.circularLayout.assign(graph, { scale, center: 0 });
    layouts.forceAtlas2.assign(graph, {
      iterations: count,
      settings: layouts.forceAtlas2.inferSettings?.(graph) || {},
    });
  }
}
