export const visualItmFormatId = 'textforge.visual-itm/v1';
export const visualItmOriginModes = ['derived-itm', 'standalone', 'translated'];
export const visualItmDerivedTargetKinds = ['raw-model', 'viewpoint', 'view'];
export const visualItmRendererSources = ['derived', 'local'];
export const visualItmProvenanceKinds = ['model-item', 'viewpoint', 'view', 'translated'];
export const visualItmDiagnosticSeverities = ['error', 'warning', 'info'];

function cloneSourceRangePosition(position) {
  if (!position || typeof position !== 'object') {
    return undefined;
  }

  return {
    line: typeof position.line === 'number' ? position.line : undefined,
    column: typeof position.column === 'number' ? position.column : undefined,
    offset: typeof position.offset === 'number' ? position.offset : undefined,
  };
}

function cloneSourceRange(range) {
  if (!range || typeof range !== 'object') {
    return undefined;
  }

  return {
    start: cloneSourceRangePosition(range.start),
    end: cloneSourceRangePosition(range.end),
    startLine: typeof range.startLine === 'number' ? range.startLine : undefined,
    startColumn: typeof range.startColumn === 'number' ? range.startColumn : undefined,
    endLine: typeof range.endLine === 'number' ? range.endLine : undefined,
    endColumn: typeof range.endColumn === 'number' ? range.endColumn : undefined,
  };
}

function cloneStringArray(values) {
  return Array.isArray(values)
    ? values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
    : [];
}

function cloneScalarRecord(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(values).filter(([, value]) =>
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'),
  );
}

function normalizeDiagnosticSeverity(severity) {
  return visualItmDiagnosticSeverities.includes(severity) ? severity : 'warning';
}

function normalizeOriginMode(mode) {
  return visualItmOriginModes.includes(mode) ? mode : 'derived-itm';
}

function normalizeDerivedTargetKind(kind) {
  return visualItmDerivedTargetKinds.includes(kind) ? kind : 'raw-model';
}

function normalizeRendererSource(source) {
  return visualItmRendererSources.includes(source) ? source : 'derived';
}

function normalizeProvenanceKind(kind) {
  return visualItmProvenanceKinds.includes(kind) ? kind : 'translated';
}

export function createVisualItmProvenance(overrides) {
  return {
    sourceKind: normalizeProvenanceKind(overrides?.sourceKind),
    sourceId: typeof overrides?.sourceId === 'string' ? overrides.sourceId : undefined,
    sourcePath: typeof overrides?.sourcePath === 'string' ? overrides.sourcePath : undefined,
    sourceRange: cloneSourceRange(overrides?.sourceRange),
  };
}

export function createVisualItmDiagnostic(overrides) {
  return {
    severity: normalizeDiagnosticSeverity(overrides?.severity),
    code: String(overrides?.code ?? 'visual-itm.unknown').trim() || 'visual-itm.unknown',
    message: String(overrides?.message ?? 'Visual ITM diagnostic.').trim() || 'Visual ITM diagnostic.',
    subjectId: typeof overrides?.subjectId === 'string' ? overrides.subjectId : undefined,
    provenance: Array.isArray(overrides?.provenance)
      ? overrides.provenance.map((entry) => createVisualItmProvenance(entry))
      : undefined,
  };
}

export function createVisualItmNode(overrides) {
  return {
    id: String(overrides?.id ?? '').trim(),
    label: typeof overrides?.label === 'string' ? overrides.label : undefined,
    kind: typeof overrides?.kind === 'string' ? overrides.kind : undefined,
    classes: cloneStringArray(overrides?.classes),
    tags: cloneStringArray(overrides?.tags),
    parentId: typeof overrides?.parentId === 'string' ? overrides.parentId : undefined,
    style: cloneScalarRecord(overrides?.style),
    layout: cloneScalarRecord(overrides?.layout),
    provenance: Array.isArray(overrides?.provenance)
      ? overrides.provenance.map((entry) => createVisualItmProvenance(entry))
      : undefined,
  };
}

export function createVisualItmEdge(overrides) {
  return {
    id: String(overrides?.id ?? '').trim(),
    sourceId: String(overrides?.sourceId ?? '').trim(),
    targetId: String(overrides?.targetId ?? '').trim(),
    label: typeof overrides?.label === 'string' ? overrides.label : undefined,
    kind: typeof overrides?.kind === 'string' ? overrides.kind : undefined,
    classes: cloneStringArray(overrides?.classes),
    tags: cloneStringArray(overrides?.tags),
    style: cloneScalarRecord(overrides?.style),
    layout: cloneScalarRecord(overrides?.layout),
    provenance: Array.isArray(overrides?.provenance)
      ? overrides.provenance.map((entry) => createVisualItmProvenance(entry))
      : undefined,
  };
}

export function createVisualItmDocument(overrides) {
  const origin = overrides?.origin ?? {};
  const renderer = overrides?.renderer;

  return {
    format: visualItmFormatId,
    origin: {
      mode: normalizeOriginMode(origin.mode),
      sourceResource: typeof origin.sourceResource === 'string' ? origin.sourceResource : undefined,
      sourceHash: typeof origin.sourceHash === 'string' ? origin.sourceHash : undefined,
      derivedTarget: origin.derivedTarget
        ? {
          kind: normalizeDerivedTargetKind(origin.derivedTarget.kind),
          id: typeof origin.derivedTarget.id === 'string' ? origin.derivedTarget.id : undefined,
          viewpointId: typeof origin.derivedTarget.viewpointId === 'string' ? origin.derivedTarget.viewpointId : undefined,
        }
        : undefined,
    },
    renderer: renderer
      ? {
        value: typeof renderer.value === 'string' ? renderer.value : undefined,
        source: normalizeRendererSource(renderer.source),
        hints: cloneScalarRecord(renderer.hints),
      }
      : undefined,
    diagnostics: Array.isArray(overrides?.diagnostics)
      ? overrides.diagnostics.map((entry) => createVisualItmDiagnostic(entry))
      : undefined,
    nodes: Array.isArray(overrides?.nodes)
      ? overrides.nodes.map((entry) => createVisualItmNode(entry))
      : [],
    edges: Array.isArray(overrides?.edges)
      ? overrides.edges.map((entry) => createVisualItmEdge(entry))
      : [],
  };
}

export function isVisualItmDocument(input) {
  return Boolean(
    input
    && typeof input === 'object'
    && input.format === visualItmFormatId
    && Array.isArray(input.nodes)
    && Array.isArray(input.edges)
    && input.origin
    && typeof input.origin === 'object',
  );
}

export function validateVisualItmDocument(document) {
  if (!isVisualItmDocument(document)) {
    return [
      createVisualItmDiagnostic({
        severity: 'error',
        code: 'visual-itm.invalid-document',
        message: 'Input is not a Visual ITM v1 document.',
      }),
    ];
  }

  const diagnostics = [];
  const nodeIds = new Set();
  const edgeIds = new Set();

  if (!visualItmOriginModes.includes(document.origin.mode)) {
    diagnostics.push(createVisualItmDiagnostic({
      severity: 'error',
      code: 'visual-itm.origin.invalid-mode',
      message: `Origin mode '${document.origin.mode}' is not supported by Visual ITM v1.`,
    }));
  }

  if (document.origin.derivedTarget && !visualItmDerivedTargetKinds.includes(document.origin.derivedTarget.kind)) {
    diagnostics.push(createVisualItmDiagnostic({
      severity: 'error',
      code: 'visual-itm.origin.invalid-target-kind',
      message: `Derived target kind '${document.origin.derivedTarget.kind}' is not supported by Visual ITM v1.`,
    }));
  }

  if (document.renderer && !visualItmRendererSources.includes(document.renderer.source)) {
    diagnostics.push(createVisualItmDiagnostic({
      severity: 'error',
      code: 'visual-itm.renderer.invalid-source',
      message: `Renderer source '${document.renderer.source}' is not supported by Visual ITM v1.`,
    }));
  }

  for (const node of document.nodes) {
    if (!node.id) {
      diagnostics.push(createVisualItmDiagnostic({
        severity: 'error',
        code: 'visual-itm.node.missing-id',
        message: 'Every Visual ITM node requires a stable id.',
      }));
      continue;
    }

    if (nodeIds.has(node.id)) {
      diagnostics.push(createVisualItmDiagnostic({
        severity: 'error',
        code: 'visual-itm.node.duplicate-id',
        message: `Node '${node.id}' is declared more than once.`,
        subjectId: node.id,
      }));
      continue;
    }

    nodeIds.add(node.id);
    for (const provenance of node.provenance ?? []) {
      if (!visualItmProvenanceKinds.includes(provenance.sourceKind)) {
        diagnostics.push(createVisualItmDiagnostic({
          severity: 'error',
          code: 'visual-itm.provenance.invalid-kind',
          message: `Node '${node.id}' uses unsupported provenance kind '${provenance.sourceKind}'.`,
          subjectId: node.id,
        }));
      }
    }
  }

  for (const edge of document.edges) {
    if (!edge.id) {
      diagnostics.push(createVisualItmDiagnostic({
        severity: 'error',
        code: 'visual-itm.edge.missing-id',
        message: 'Every Visual ITM edge requires a stable id.',
      }));
      continue;
    }

    if (edgeIds.has(edge.id)) {
      diagnostics.push(createVisualItmDiagnostic({
        severity: 'error',
        code: 'visual-itm.edge.duplicate-id',
        message: `Edge '${edge.id}' is declared more than once.`,
        subjectId: edge.id,
      }));
      continue;
    }

    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.sourceId)) {
      diagnostics.push(createVisualItmDiagnostic({
        severity: 'error',
        code: 'visual-itm.edge.unknown-source',
        message: `Edge '${edge.id}' references unknown source node '${edge.sourceId}'.`,
        subjectId: edge.id,
      }));
    }

    if (!nodeIds.has(edge.targetId)) {
      diagnostics.push(createVisualItmDiagnostic({
        severity: 'error',
        code: 'visual-itm.edge.unknown-target',
        message: `Edge '${edge.id}' references unknown target node '${edge.targetId}'.`,
        subjectId: edge.id,
      }));
    }
  }

  return diagnostics;
}

const derivedGraphFixture = createVisualItmDocument({
  origin: {
    mode: 'derived-itm',
    sourceResource: '/docs/examples/itm/party.itm',
    derivedTarget: {
      kind: 'view',
      id: 'party-graph',
      viewpointId: 'graph-default',
    },
  },
  renderer: {
    value: 'cytoscape',
    source: 'derived',
    hints: {
      'cytoscape.layout': 'cose',
    },
  },
  nodes: [
    {
      id: 'guest.alice',
      label: 'Alice',
      kind: 'actor',
      classes: ['guest'],
      provenance: [
        {
          sourceKind: 'model-item',
          sourceId: 'guest.alice',
          sourcePath: '/docs/examples/itm/party.itm',
        },
      ],
    },
    {
      id: 'item.cake',
      label: 'Cake',
      kind: 'thing',
      classes: ['supply'],
      provenance: [
        {
          sourceKind: 'model-item',
          sourceId: 'item.cake',
          sourcePath: '/docs/examples/itm/party.itm',
        },
      ],
    },
  ],
  edges: [
    {
      id: 'brings.alice.cake',
      sourceId: 'guest.alice',
      targetId: 'item.cake',
      label: 'brings',
      kind: 'relation',
      provenance: [
        {
          sourceKind: 'model-item',
          sourceId: 'brings.alice.cake',
          sourcePath: '/docs/examples/itm/party.itm',
        },
      ],
    },
  ],
});

const derivedTreeFixture = createVisualItmDocument({
  origin: {
    mode: 'derived-itm',
    sourceResource: '/docs/examples/itm/capabilities.itm',
    derivedTarget: {
      kind: 'viewpoint',
      id: 'capability-tree',
    },
  },
  renderer: {
    value: 'jsmind',
    source: 'derived',
    hints: {
      'jsmind.layout': 'side',
    },
  },
  nodes: [
    {
      id: 'roadmap',
      label: 'Capability roadmap',
      kind: 'capability',
      provenance: [{ sourceKind: 'model-item', sourceId: 'roadmap' }],
    },
    {
      id: 'foundation',
      label: 'Foundation',
      kind: 'capability',
      parentId: 'roadmap',
      provenance: [{ sourceKind: 'model-item', sourceId: 'foundation' }],
    },
    {
      id: 'delivery',
      label: 'Delivery',
      kind: 'capability',
      parentId: 'roadmap',
      provenance: [{ sourceKind: 'model-item', sourceId: 'delivery' }],
    },
  ],
  edges: [],
});

const standaloneMindmapFixture = createVisualItmDocument({
  origin: {
    mode: 'standalone',
    sourceResource: '/workspace/visuals/party-plan.visual-itm.json',
  },
  renderer: {
    value: 'jsmind',
    source: 'local',
    hints: {
      'jsmind.layout': 'side',
    },
  },
  nodes: [
    { id: 'root', label: 'Party', kind: 'topic' },
    { id: 'food', label: 'Food', kind: 'topic', parentId: 'root' },
    { id: 'games', label: 'Games', kind: 'topic', parentId: 'root' },
  ],
  edges: [],
});

const missingRendererFixture = createVisualItmDocument({
  origin: {
    mode: 'derived-itm',
    sourceResource: '/docs/examples/itm/missing-renderer.itm',
    derivedTarget: {
      kind: 'viewpoint',
      id: 'broken-viewpoint',
    },
  },
  diagnostics: [
    {
      severity: 'error',
      code: 'itm.visual.resolve.renderer-missing',
      message: 'Viewpoint broken-viewpoint does not declare a render step.',
      subjectId: 'broken-viewpoint',
      provenance: [
        {
          sourceKind: 'viewpoint',
          sourceId: 'broken-viewpoint',
          sourcePath: '/docs/examples/itm/missing-renderer.itm',
        },
      ],
    },
  ],
  nodes: [],
  edges: [],
});

const itmPubParityFixture = createVisualItmDocument({
  origin: {
    mode: 'derived-itm',
    sourceResource: '/docs/examples/itm/roadmap.itm',
    derivedTarget: {
      kind: 'view',
      id: 'roadmap-graph',
      viewpointId: 'capability-graph',
    },
  },
  renderer: {
    value: 'graph.viewer',
    source: 'derived',
  },
  nodes: [
    { id: 'roadmap', label: 'Roadmap', kind: 'capability' },
    { id: 'foundation', label: 'Foundation', kind: 'capability', parentId: 'roadmap' },
  ],
  edges: [],
});

export const visualItmV1Fixtures = Object.freeze({
  derivedGraph: derivedGraphFixture,
  derivedTree: derivedTreeFixture,
  standaloneMindmap: standaloneMindmapFixture,
  missingRenderer: missingRendererFixture,
  itmPubParity: itmPubParityFixture,
});
