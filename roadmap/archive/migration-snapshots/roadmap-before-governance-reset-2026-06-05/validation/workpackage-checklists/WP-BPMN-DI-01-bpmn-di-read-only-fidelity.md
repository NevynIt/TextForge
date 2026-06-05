> [!IMPORTANT]
> Archived historical roadmap material. This file is non-authoritative after the 2026-06-05 roadmap governance reset. Use oadmap/roadmap-state.yaml and active module/workpackage/release/ADR files for current planning truth.

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

## Validation evidence

- Implemented in `@textforge/bpmn` and recorded in RAPID `P-094`.
- Focused BPMN package test/build commands passed.
- Repo-wide `corepack pnpm verify` passed for the validation run.
- Bundled BPMN reference assets under `docs/examples/bpmn/` remain the preserved read-only fidelity inputs.
