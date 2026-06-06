function readStyleValue(style, key) {
  const value = style?.[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

function chooseNodeColor(node) {
  return readStyleValue(node.style, 'background-color')
    ?? readStyleValue(node.style, 'fill')
    ?? readStyleValue(node.style, 'color')
    ?? '#2563eb';
}

function chooseNodeTextColor(node) {
  return readStyleValue(node.style, 'text-color')
    ?? readStyleValue(node.style, 'label-color')
    ?? '#e2e8f0';
}

function chooseEdgeColor(edge) {
  return readStyleValue(edge.style, 'line-color')
    ?? readStyleValue(edge.style, 'stroke')
    ?? readStyleValue(edge.style, 'color')
    ?? '#64748b';
}

function chooseEdgeLineStyle(edge) {
  const lineStyle = readStyleValue(edge.style, 'line-style')
    ?? readStyleValue(edge.style, 'stroke-dasharray');
  if (!lineStyle) {
    return 'solid';
  }

  if (lineStyle.includes('dash') || lineStyle.includes(',')) {
    return 'dashed';
  }

  if (lineStyle.includes('dot')) {
    return 'dotted';
  }

  return 'solid';
}

function chooseEdgeWidth(edge) {
  const width = Number.parseFloat(readStyleValue(edge.style, 'width') ?? readStyleValue(edge.style, 'stroke-width') ?? '');
  return Number.isFinite(width) && width > 0 ? width : 2;
}

function chooseNodeShape(node) {
  const shape = readStyleValue(node.style, 'shape');
  if (shape && ['diamond', 'ellipse', 'hexagon', 'rectangle', 'round-rectangle', 'triangle'].includes(shape)) {
    return shape;
  }

  return node.parentId ? 'round-rectangle' : 'ellipse';
}

function chooseNodeSize(node) {
  const height = Number.parseFloat(readStyleValue(node.style, 'height') ?? '');
  const width = Number.parseFloat(readStyleValue(node.style, 'width') ?? '');
  const size = Math.max(
    Number.isFinite(height) ? height : 0,
    Number.isFinite(width) ? width : 0,
  );
  return size > 0 ? Math.min(Math.max(size, 34), 88) : 52;
}

export function buildCytoscapeStylesheet() {
  return [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        color: 'data(textColor)',
        'background-color': 'data(color)',
        shape: 'data(shape)',
        width: 'data(size)',
        height: 'data(size)',
        'font-size': 11,
        'font-weight': 600,
        'text-wrap': 'wrap',
        'text-max-width': 120,
        'text-valign': 'center',
        'text-halign': 'center',
        'overlay-opacity': 0,
        'border-color': '#0f172a',
        'border-width': 1.5,
      },
    },
    {
      selector: '$node > node',
      style: {
        'background-opacity': 0.14,
        'text-valign': 'top',
        'text-halign': 'center',
        'padding-top': 18,
        'padding-bottom': 18,
        'padding-left': 18,
        'padding-right': 18,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'data(width)',
        label: 'data(label)',
        color: '#94a3b8',
        'font-size': 10,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'line-style': 'data(lineStyle)',
        'text-background-opacity': 1,
        'text-background-color': '#0f172a',
        'text-background-padding': 2,
        'overlay-opacity': 0,
      },
    },
    {
      selector: '.tf-match',
      style: {
        'border-color': '#f59e0b',
        'border-width': 3,
        'line-color': '#f59e0b',
        'target-arrow-color': '#f59e0b',
      },
    },
    {
      selector: '.tf-dim',
      style: {
        opacity: 0.18,
      },
    },
    {
      selector: '.tf-selected',
      style: {
        'border-color': '#34d399',
        'border-width': 3,
        'line-color': '#34d399',
        'target-arrow-color': '#34d399',
      },
    },
  ];
}

export function createCytoscapeLayoutOptions(name) {
  switch (name) {
    case 'circle':
      return { name: 'circle', spacingFactor: 1.2 };
    case 'concentric':
      return { name: 'concentric', minNodeSpacing: 28, levelWidth: () => 2 };
    case 'grid':
      return { name: 'grid', avoidOverlap: true, spacingFactor: 1.15 };
    case 'random':
      return { name: 'random' };
    case 'cose':
      return { name: 'cose', animate: false, padding: 32, idealEdgeLength: 120, nodeOverlap: 12 };
    case 'breadthfirst':
    default:
      return { name: 'breadthfirst', directed: true, padding: 30, spacingFactor: 1.15 };
  }
}

export function mapElementsForRuntime(elements) {
  return [
    ...elements.nodes.map((entry) => ({
      data: {
        ...entry.data,
        color: chooseNodeColor(entry.data),
        textColor: chooseNodeTextColor(entry.data),
        shape: chooseNodeShape(entry.data),
        size: chooseNodeSize(entry.data),
      },
    })),
    ...elements.edges.map((entry) => ({
      data: {
        ...entry.data,
        color: chooseEdgeColor(entry.data),
        width: chooseEdgeWidth(entry.data),
        lineStyle: chooseEdgeLineStyle(entry.data),
      },
    })),
  ];
}
