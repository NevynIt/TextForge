# Visual ITM renderers

## Registry

- Module ID: `MOD-VISUAL-ITM-RENDERERS`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/visual-itm-renderers.md`

## Purpose

Visual ITM renderers defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- Visual ITM document profile
- visual target picker and resolver integration
- runtime renderer package parity
- React Flow and Dagre interactive ITM graph surface
- viewpoint/view control model for renderer-bound graph controls
- visual edit/write-back follow-ons

### Does not own

- source ITM semantics
- BPMN semantic profile
- Markdown report authoring

## Public Contracts

- @textforge/visual-itm
- renderer package inputs
- visual target resolver

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-ITM-VISUALS` | ITM static visual projections and publication baseline | Registry-owned | Feature |
| `WP-VITM-01` | Visual ITM profile v1 | Registry-owned | Contract / domain |
| `WP-ITM-VTARGET-01` | ITM visual target picker MVP | Registry-owned | UI / domain |
| `WP-ITM-VRESOLVE-01` | Shared ITM visual target resolver | Registry-owned | Contract / domain |
| `WP-RENDER-CYTOSCAPE` | Cytoscape runtime renderer package | Registry-owned | Feature / domain |
| `WP-RENDER-JSMIND` | jsMind runtime renderer package | Registry-owned | Feature / domain |
| `WP-RENDER-SIGMA` | Sigma/Graphology runtime renderer package | Registry-owned | Feature / domain |
| `WP-ITM-REACT-FLOW-DAGRE-01` | React Flow Dagre ITM graph surface | Registry-owned | Feature / interactive renderer |
| `WP-VITM-TRANSLATORS` | Visual ITM translator utilities | Registry-owned | Adapter / domain |
| `WP-VITM-VDELTA-01` | Visual ITM view-delta consumption and capture | Registry-owned | Visual consumption follow-on |
| `WP-VITM-LIVE-SYNC-01` | Bidirectional source/visual live sync | Registry-owned | Visual consumption follow-on |
| `WP-GRAPH-EDIT-VITM` | Visual ITM edit/write-back foundation | Registry-owned | Visual editing foundation |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.
- `ADR-0012` proposes a reusable React Flow + Dagre ITM graph surface with declarative viewpoint/view controls.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/specs/legacy-specs/architecture/visual-itm-v1-profile.md
- archive/registers/specs/legacy-specs/architecture/visual-itm-runtime-recovery.md
- archive/grilling/legacy-grilling/v20-visual-recovery-to-bpmn-chain-findings.md
- archive/grilling/legacy-grilling/itm-visuals-grilling.md
