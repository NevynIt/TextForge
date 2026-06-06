import { createDiagnostic } from '@textforge/core';
import { parse as parseYaml } from 'yaml';
import {
  bpmnModdle,
  appendUniqueDiagnostics,
  coerceRecord,
  collectModdleElementsById,
  collectSemanticElementIdentifiers,
  countBraceDelta,
  createModdleBounds,
  createModdleWaypoint,
  ensurePlaneElements,
  findPlaneElement,
  normalizeMultilineText,
  readFiniteNumber,
  readRecordString,
  stringifyBpmnWarning,
  toResolvedDocument,
} from './shared.js';

function normalizeBpmnDiBoundsEntry(entry) {
  const record = coerceRecord(entry);
  const element = readRecordString(record, 'element');
  const x = readFiniteNumber(record?.x);
  const y = readFiniteNumber(record?.y);
  const width = readFiniteNumber(record?.width);
  const height = readFiniteNumber(record?.height);
  if (!element || x === undefined || y === undefined || width === undefined || height === undefined) {
    return undefined;
  }

  return {
    element,
    shapeId: readRecordString(record, 'shapeId'),
    x,
    y,
    width,
    height,
  };
}

function normalizeBpmnDiRouteEntry(entry) {
  const record = coerceRecord(entry);
  const relationship = readRecordString(record, 'relationship');
  const waypoints = Array.isArray(record?.waypoints)
    ? record.waypoints
      .map((waypoint) => {
        const item = coerceRecord(waypoint);
        const x = readFiniteNumber(item?.x);
        const y = readFiniteNumber(item?.y);
        return x === undefined || y === undefined ? undefined : { x, y };
      })
      .filter(Boolean)
    : [];
  if (!relationship || waypoints.length === 0) {
    return undefined;
  }

  return {
    relationship,
    edgeId: readRecordString(record, 'edgeId'),
    waypoints,
  };
}

function normalizeBpmnDiLabelBoundsEntry(entry) {
  const record = coerceRecord(entry);
  const element = readRecordString(record, 'element');
  const x = readFiniteNumber(record?.x);
  const y = readFiniteNumber(record?.y);
  const width = readFiniteNumber(record?.width);
  const height = readFiniteNumber(record?.height);
  if (!element || x === undefined || y === undefined || width === undefined || height === undefined) {
    return undefined;
  }

  return {
    element,
    sourceDiElement: readRecordString(record, 'sourceDiElement'),
    x,
    y,
    width,
    height,
  };
}

function createBpmnDiDiagnostic(resource, message, code, severity = 'error') {
  return createDiagnostic(message, severity, {
    code,
    resource,
    origin: {
      packageId: '@textforge/bpmn',
      subsystem: 'bpmn-di',
    },
  });
}

function extractItmViewBlock(sourceText, options = {}) {
  const lines = normalizeMultilineText(sourceText).split('\n');
  const requestedName = String(options.viewName ?? '').trim();
  const requestedStartLine = Number.isInteger(options.startLine) ? options.startLine : undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const match = line.match(/^%view\s+([^\s{]+)/u);
    if (!match) {
      continue;
    }

    const viewName = match[1];
    if (requestedName && viewName !== requestedName) {
      continue;
    }
    if (requestedStartLine && requestedStartLine !== index + 1) {
      continue;
    }

    let openLineIndex = index + 1;
    while (openLineIndex < lines.length && !lines[openLineIndex].includes('{')) {
      openLineIndex += 1;
    }
    if (openLineIndex >= lines.length) {
      throw new Error(`View '${viewName}' does not include a YAML body.`);
    }

    let depth = 0;
    let closeLineIndex = openLineIndex;
    for (; closeLineIndex < lines.length; closeLineIndex += 1) {
      depth += countBraceDelta(lines[closeLineIndex]);
      if (depth === 0) {
        break;
      }
    }
    if (depth !== 0) {
      throw new Error(`View '${viewName}' has an unterminated YAML body.`);
    }

    return {
      viewName,
      startLine: index + 1,
      bodyText: lines.slice(openLineIndex + 1, closeLineIndex).join('\n'),
    };
  }

  throw new Error(requestedName
    ? `View '${requestedName}' was not found in the ITM source.`
    : 'No %view block was found in the ITM source.');
}

export function extractBpmnDiagramInterchangeView(sourceText, options = {}) {
  const extracted = extractItmViewBlock(sourceText, options);
  const parsedBody = coerceRecord(parseYaml(extracted.bodyText)) ?? {};
  const deltas = coerceRecord(parsedBody.deltas) ?? {};

  return {
    viewName: extracted.viewName,
    startLine: extracted.startLine,
    title: readRecordString(parsedBody, 'title'),
    viewpointRef: readRecordString(parsedBody, 'viewpoint'),
    sourceDiagramId: readRecordString(parsedBody, 'sourceDiagramId'),
    sourcePlaneId: readRecordString(parsedBody, 'sourcePlaneId'),
    planeElement: readRecordString(parsedBody, 'planeElement'),
    bounds: Array.isArray(deltas.bounds)
      ? deltas.bounds.map(normalizeBpmnDiBoundsEntry).filter(Boolean)
      : [],
    routes: Array.isArray(deltas.routes)
      ? deltas.routes.map(normalizeBpmnDiRouteEntry).filter(Boolean)
      : [],
    labelBounds: Array.isArray(deltas.labelBounds)
      ? deltas.labelBounds.map(normalizeBpmnDiLabelBoundsEntry).filter(Boolean)
      : [],
  };
}

export function validateBpmnDiagramInterchangeView(view, document, options = {}) {
  const diagnostics = [];
  const { entityIds, relationshipIds } = collectSemanticElementIdentifiers(document);
  const diElementIds = new Set();

  if (view?.planeElement && !entityIds.has(view.planeElement)) {
    diagnostics.push(createBpmnDiDiagnostic(
      options.resource,
      `BPMN DI plane element '${view.planeElement}' does not resolve to a BPMN semantic element.`,
      'bpmn.di.missing-plane-element',
    ));
  }

  for (const entry of view?.bounds ?? []) {
    if (!entityIds.has(entry.element)) {
      diagnostics.push(createBpmnDiDiagnostic(
        options.resource,
        `BPMN DI bounds entry references unknown BPMN element '${entry.element}'.`,
        'bpmn.di.missing-bounds-element',
      ));
    }
    if (entry.shapeId) {
      diElementIds.add(entry.shapeId);
    }
  }

  for (const entry of view?.routes ?? []) {
    if (!relationshipIds.has(entry.relationship)) {
      diagnostics.push(createBpmnDiDiagnostic(
        options.resource,
        `BPMN DI route entry references unknown BPMN relationship '${entry.relationship}'.`,
        'bpmn.di.missing-route-relationship',
      ));
    }
    if (entry.edgeId) {
      diElementIds.add(entry.edgeId);
    }
  }

  for (const entry of view?.labelBounds ?? []) {
    const targetExists = entityIds.has(entry.element) || relationshipIds.has(entry.element);
    if (!targetExists) {
      diagnostics.push(createBpmnDiDiagnostic(
        options.resource,
        `BPMN DI label bounds entry references unknown BPMN element or relationship '${entry.element}'.`,
        'bpmn.di.missing-label-target',
      ));
    }
    if (entry.sourceDiElement && !diElementIds.has(entry.sourceDiElement)) {
      diagnostics.push(createBpmnDiDiagnostic(
        options.resource,
        `BPMN DI label bounds entry references unknown diagram element '${entry.sourceDiElement}'.`,
        'bpmn.di.missing-label-di-element',
        'warning',
      ));
    }
  }

  return diagnostics;
}

export async function applyBpmnDiagramInterchangeToXml(xml, view, options = {}) {
  const diagnostics = [];
  const trimmed = String(xml ?? '').trim();
  if (!trimmed) {
    diagnostics.push(createBpmnDiDiagnostic(
      options.resource,
      'No BPMN XML source is available for BPMN DI application.',
      'bpmn.di.source-missing',
    ));
    return {
      xml: '',
      diagnostics,
    };
  }

  try {
    const parsed = await bpmnModdle.fromXML(trimmed);
    const warnings = (parsed.warnings ?? []).map((warning, index) =>
      createBpmnDiDiagnostic(
        options.resource,
        stringifyBpmnWarning(warning),
        `bpmn.di.parse-warning-${index + 1}`,
        'warning',
      ));
    appendUniqueDiagnostics(diagnostics, warnings);

    const definitions = parsed.rootElement;
    const byId = new Map();
    collectModdleElementsById(definitions, byId);
    const diagrams = Array.isArray(definitions.diagrams) ? definitions.diagrams : [];
    if (!Array.isArray(definitions.diagrams)) {
      definitions.diagrams = diagrams;
    }

    let diagram = diagrams.find((entry) =>
      (view?.sourceDiagramId && entry?.id === view.sourceDiagramId))
      ?? diagrams[0];
    if (!diagram) {
      diagram = bpmnModdle.create('bpmndi:BPMNDiagram', {
        id: view?.sourceDiagramId ?? 'BPMNDiagram_1',
      });
      diagrams.push(diagram);
    }
    if (view?.sourceDiagramId) {
      diagram.id = view.sourceDiagramId;
    }

    let plane = diagram.plane;
    if (!plane) {
      plane = bpmnModdle.create('bpmndi:BPMNPlane', {
        id: view?.sourcePlaneId ?? `${diagram.id ?? 'BPMNDiagram_1'}_plane`,
      });
      diagram.plane = plane;
    }
    if (view?.sourcePlaneId) {
      plane.id = view.sourcePlaneId;
    }
    if (view?.planeElement && byId.has(view.planeElement)) {
      plane.bpmnElement = byId.get(view.planeElement);
    }

    const planeElements = ensurePlaneElements(plane);
    const diElementsById = new Map();
    const diElementsByElementId = new Map();

    for (const entry of view?.bounds ?? []) {
      const bpmnElement = byId.get(entry.element);
      if (!bpmnElement) {
        diagnostics.push(createBpmnDiDiagnostic(
          options.resource,
          `Skipped BPMN DI bounds for missing BPMN element '${entry.element}'.`,
          'bpmn.di.apply-missing-bounds-element',
          'warning',
        ));
        continue;
      }

      let shape = findPlaneElement(planeElements, entry.shapeId, entry.element);
      if (!shape) {
        shape = bpmnModdle.create('bpmndi:BPMNShape', {
          id: entry.shapeId ?? `${entry.element}_di`,
          bpmnElement,
        });
        planeElements.push(shape);
      }

      shape.id = entry.shapeId ?? shape.id ?? `${entry.element}_di`;
      shape.bpmnElement = bpmnElement;
      shape.bounds = createModdleBounds(entry);
      diElementsById.set(shape.id, shape);
      diElementsByElementId.set(entry.element, shape);
    }

    for (const entry of view?.routes ?? []) {
      const bpmnElement = byId.get(entry.relationship);
      if (!bpmnElement) {
        diagnostics.push(createBpmnDiDiagnostic(
          options.resource,
          `Skipped BPMN DI route for missing BPMN relationship '${entry.relationship}'.`,
          'bpmn.di.apply-missing-route-relationship',
          'warning',
        ));
        continue;
      }

      let edge = findPlaneElement(planeElements, entry.edgeId, entry.relationship);
      if (!edge) {
        edge = bpmnModdle.create('bpmndi:BPMNEdge', {
          id: entry.edgeId ?? `${entry.relationship}_di`,
          bpmnElement,
        });
        planeElements.push(edge);
      }

      edge.id = entry.edgeId ?? edge.id ?? `${entry.relationship}_di`;
      edge.bpmnElement = bpmnElement;
      edge.waypoint = entry.waypoints.map(createModdleWaypoint);
      diElementsById.set(edge.id, edge);
      diElementsByElementId.set(entry.relationship, edge);
    }

    for (const entry of view?.labelBounds ?? []) {
      const target = (entry.sourceDiElement && diElementsById.get(entry.sourceDiElement))
        || diElementsByElementId.get(entry.element);
      if (!target) {
        diagnostics.push(createBpmnDiDiagnostic(
          options.resource,
          `Skipped BPMN DI label bounds for missing target '${entry.element}'.`,
          'bpmn.di.apply-missing-label-target',
          'warning',
        ));
        continue;
      }

      if (!target.label) {
        target.label = bpmnModdle.create('bpmndi:BPMNLabel', {});
      }
      target.label.bounds = createModdleBounds(entry);
    }

    const serialized = await bpmnModdle.toXML(definitions, { format: true });
    return {
      xml: serialized.xml,
      diagnostics,
    };
  } catch (error) {
    diagnostics.push(createBpmnDiDiagnostic(
      options.resource,
      error?.message ?? 'BPMN Diagram Interchange could not be applied to the XML source.',
      'bpmn.di.apply-failed',
    ));
    return {
      xml: trimmed,
      diagnostics,
    };
  }
}
