> [!IMPORTANT]
> Archived historical roadmap material. This file is non-authoritative after the 2026-06-05 roadmap governance reset. Use oadmap/roadmap-state.yaml and active module/workpackage/release/ADR files for current planning truth.

# WP-BPMN-SEM — BPMN Semantic Profile MVP Checklist

## Gate

Definition and grilling are now closed. Implement against `roadmap/grilling/bpmn-sem-grilling.md`.

## MVP scope

- Process, StartEvent, EndEvent, Task, SubProcess, and ExclusiveGateway are represented in the BPMN ITM profile.
- Sequence Flows are represented as typed relationships.
- Associations are represented as basic typed relationships with structural validation only.
- DataObjectReference and DataStoreReference are represented in the BPMN ITM profile.
- Basic required attributes are documented and validated.
- Basic validation diagnostics are surfaced through the ITM validation path.
- Example fixtures cover at least one minimal linear process and one minimal exclusive-gateway process.
- The profile/package is activated through the existing package/capability mechanism.
- Bundled extended reference assets exist under `docs/examples/bpmn/` for the broader supplied BPMN XML, converted ITM, candidate broad profile, and Lua converter.

## Explicit non-goals

- Full BPMN semantic completeness.
- Gateway families beyond `ExclusiveGateway`.
- LaneSet, Lane, or laneContains support.
- Group, Category, CategoryValue, or TextAnnotation support.
- BPMN Diagram Interchange bounds/routes/label geometry.
- Lua importer/converter shipping requirements for this workpackage.
- Mature BPMN XML import/export loss handling.
- BPMN modeler/edit/write-back.
- Backend or persistence changes.

## Validation evidence

- Implemented in `@textforge/bpmn` and recorded in RAPID `P-092`.
- Focused BPMN package test/build commands passed.
- Repo-wide `corepack pnpm verify` passed for the validation run.
- Bundled BPMN reference assets remain under `docs/examples/bpmn/` for later gates.
