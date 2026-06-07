# R-VISUAL-MODELING-MVP - Visual modeling MVP

## Outcome

Runtime Visual ITM and read-only BPMN consumption baseline with clearly deferred edit/write-back gates.

## Included Workpackages

The included workpackage list is generated from `roadmap-state.yaml`.

| WP | Title | Status source | Required |
|---|---|---|---|
| `WP-ITM-VISUALS` | ITM static visual projections and publication baseline | Registry-owned | no |
| `WP-VITM-01` | Visual ITM profile v1 | Registry-owned | no |
| `WP-ITM-VTARGET-01` | ITM visual target picker MVP | Registry-owned | no |
| `WP-ITM-VRESOLVE-01` | Shared ITM visual target resolver | Registry-owned | no |
| `WP-RENDER-CYTOSCAPE` | Cytoscape runtime renderer package | Registry-owned | no |
| `WP-RENDER-JSMIND` | jsMind runtime renderer package | Registry-owned | no |
| `WP-RENDER-SIGMA` | Sigma/Graphology runtime renderer package | Registry-owned | no |
| `WP-ITM-REACT-FLOW-DAGRE-01` | React Flow Dagre ITM graph surface | Registry-owned | no |
| `WP-VITM-TRANSLATORS` | Visual ITM translator utilities | Registry-owned | no |
| `WP-VITM-VDELTA-01` | Visual ITM view-delta consumption and capture | Registry-owned | no |
| `WP-VITM-LIVE-SYNC-01` | Bidirectional source/visual live sync | Registry-owned | no |
| `WP-GRAPH-EDIT-VITM` | Visual ITM edit/write-back foundation | Registry-owned | no |
| `WP-BPMN-SEM` | BPMN semantic profile and validation | Registry-owned | no |
| `WP-BPMN-VISUAL-A` | BPMN.io viewer surface | Registry-owned | no |
| `WP-BPMN-DI-01` | BPMN Diagram Interchange read-only fidelity | Registry-owned | no |
| `WP-BPMN-VISUAL-B` | ITM/BPMN visual target integration | Registry-owned | no |
| `WP-ITM-EXPLORATION-01` | Interactive ITM exploration workbench | Registry-owned | no |
| `WP-BPMN-VISUAL-C` | BPMN modeler/edit/write-back | Registry-owned | no |
| `WP-TABLES` | Tables, catalogues, and matrices | Registry-owned | no |
| `WP-ARCHIMATE-SEM` | ArchiMate semantic profile | Registry-owned | no |
| `WP-ARCHIMATE-VISUAL` | ArchiMate visual editing investigation | Registry-owned | no |

## Excluded / Deferred

Anything not listed in the registry under this release is excluded until `roadmap-state.yaml` is updated.

## Dependency Gates

Dependency gates are resolved from `roadmap-state.yaml` and visualized in `views/dependency-map-full.md`.

## Acceptance Criteria

- All included workpackages have resolved dependencies or explicit waivers.
- Required validation evidence exists under `validation/evidence/`.
- Release-specific risks are recorded in `RAPID.md`.

## Validation Evidence Required

- Workpackage checklist evidence for included workpackages.
- Release cut evidence file if the release moves beyond candidate/defined state.

## Risks

| Risk | Mitigation |
|---|---|
| Registry drift | Regenerate views from `roadmap-state.yaml` and validate references before release. |

## Release Notes Draft

Runtime Visual ITM and read-only BPMN consumption baseline with clearly deferred edit/write-back gates.

## Open Decisions

- See `decisions/` and `RAPID.md`.
