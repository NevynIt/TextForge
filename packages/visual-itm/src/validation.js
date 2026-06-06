import {
  visualItmDerivedTargetKinds,
  visualItmFormatId,
  visualItmOriginModes,
  visualItmProvenanceKinds,
  visualItmRendererSources,
} from './constants.js';
import { createVisualItmDiagnostic } from './factories.js';

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
