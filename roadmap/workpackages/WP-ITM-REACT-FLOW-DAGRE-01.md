# WP-ITM-REACT-FLOW-DAGRE-01 - React Flow Dagre ITM graph surface

## Registry

- Workpackage ID: `WP-ITM-REACT-FLOW-DAGRE-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-VISUAL-ITM-RENDERERS`
- ADRs: `ADR-0012`

## Outcome

TextForge provides a reusable React Flow + Dagre ITM graph surface over resolved Visual ITM graph targets, with declarative viewpoint/view controls for filters, layout options, renderer options, focus, and safe read-only graph exploration.

## Scope

- Create the `@textforge/itm-reactflow-dagre` renderer package contribution.
- Register surface `itm.graph.reactflow.dagre` and renderer `itm.renderer.reactflow-dagre`.
- Consume normalized ITM graph projections rather than raw ITM source text.
- Support deterministic Dagre layout options for `rankdir`, `nodesep`, `ranksep`, `marginx`, and `marginy`.
- Add or consume the `ResolvedControlModel` contract for `%viewpoint` and `%view` controls.
- Support v1 control types for `boolean`, `integer`, `number`, `enum`, `selector`, `id`, and `relationshipTypeRef`.
- Support a limited declarative binding set: `filter`, `filterWhenTrue`, `includeEdgesWhenTrue`, `excludeEdgesWhenFalse`, `rendererOption`, `layoutOption`, and `focus`.
- Render pan/zoom/fit, minimap or equivalent controls, node/edge selection, details inspection, control toggles, sliders/dropdowns, and focused neighborhoods where supported.
- Emit diagnostics for invalid controls, selector failures, unsupported bindings/options/styles, layout failures, and missing delta targets.

## Non-goals

- Replacing ITM as the canonical model.
- Replacing the EA Dashboard exact port, Cytoscape, Sigma, jsMind, Mermaid, or Graphviz renderers.
- Creating, renaming, deleting, retyping, or reconnecting semantic ITM nodes in v1.
- Adding arbitrary code execution to control bindings.
- Persisting renderer-specific React Flow nodes or edges as source model objects.

## Package Impact

- New package: `packages/itm-reactflow-dagre` / `@textforge/itm-reactflow-dagre`.
- Expected runtime dependencies: `@xyflow/react` plus a browser-compatible Dagre layout import strategy.
- Related package contracts: `packages/itm`, `packages/visual-itm`, renderer package registration, and `apps/textforge-web` surface loading.
- Reference package: `packages/ea-viewer` for existing React Flow and Dagre integration constraints.

## Interfaces / Contracts Changed

- Visual ITM renderer registry gains `itm.renderer.reactflow-dagre`.
- ITM graph projection gains or consumes `ResolvedControlModel`.
- `%viewpoint` and `%view` can declare and resolve renderer-bound controls.
- Diagnostics table receives control, binding, style, layout, and delta diagnostics from the renderer.

## Validation Criteria

Use `validation/checklists/workpackages/WP-ITM-REACT-FLOW-DAGRE-01-react-flow-dagre-itm-graph-surface.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused tests for control declaration parsing and control value resolution.
- Focused tests for supported/unsupported binding diagnostics.
- Focused tests for Dagre layout option validation and deterministic projection output.
- Focused tests for style mapping and unsupported style diagnostics.
- Renderer package mount tests for graph projection input.
- Manual UI validation evidence from the user for graph controls and read-only interaction, following repository guidance.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- Stable `ResolvedControlModel` TypeScript shape.
- Whether the implementation uses `dagre-d3-es` internals, `@dagrejs/dagre`, or another browser-compatible Dagre import.
- Whether moved/pinned node capture belongs in this workpackage or waits for `WP-VITM-VDELTA-01`.
- How much React Flow state is exposed to the exploration workbench versus kept renderer-private.

## Archive Trace

- Introduced as proposed by `ADR-0012`.
- Extracts a reusable interaction pattern from `WP-EA-VIEWER-01` without making the EA Dashboard exact port a dependency.
