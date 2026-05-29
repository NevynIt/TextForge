# WP-BPMN-DI-01 - BPMN Diagram Interchange Read-Only Fidelity

## Gate

Implement after `WP-BPMN-VISUAL-A` and against the BPMN routing captured in `roadmap/grilling/bpmn-sem-grilling.md`.

## Scope

- BPMN DI bounds are extracted and represented read-only.
- BPMN DI edge routes/waypoints are extracted and represented read-only.
- BPMN DI label bounds are extracted and represented read-only.
- BPMN DI references are validated against existing BPMN semantic elements or relationships.
- BPMN DI fidelity is available to later BPMN visual-target integration without introducing generic write-back semantics.
- Bundled reference assets under `docs/examples/bpmn/` are linked as preserved inputs.

## Explicit non-goals

- Generic normalized view-delta semantics across renderers.
- BPMN DI editing or write-back.
- BPMN modeler behavior.
- Cross-renderer delta persistence contracts.

## Evidence to attach when implemented

- Updated BPMN/view-model contracts.
- Focused BPMN DI fixtures or fixture assertions.
- Validation tests.
- Build/test commands.
- Manual read-only fidelity notes if a viewer surface is exercised visually.
