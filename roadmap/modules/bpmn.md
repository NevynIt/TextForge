# BPMN

## Registry

- Module ID: `MOD-BPMN`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/bpmn.md`

## Purpose

BPMN defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- BPMN semantic MVP
- BPMN XML viewer integration
- BPMN Diagram Interchange read-only fidelity
- BPMN modeler/write-back follow-on

### Does not own

- generic Visual ITM renderer parity
- ArchiMate profiles
- tables/catalogue UX

## Public Contracts

- @textforge/bpmn
- BPMN XML importer/viewer contracts
- BPMN DI bridge

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-BPMN-SEM` | BPMN semantic profile and validation | Registry-owned | Domain profile |
| `WP-BPMN-VISUAL-A` | BPMN.io viewer surface | Registry-owned | Feature / domain |
| `WP-BPMN-DI-01` | BPMN Diagram Interchange read-only fidelity | Registry-owned | Feature / domain |
| `WP-BPMN-VISUAL-B` | ITM/BPMN visual target integration | Registry-owned | Feature / domain |
| `WP-BPMN-VISUAL-C` | BPMN modeler/edit/write-back | Registry-owned | Feature / visual editing |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/bpmn.md
- archive/grilling/legacy-grilling/bpmn-sem-grilling.md
- archive/registers/specs/legacy-specs/architecture/v20-itm-recovery-to-bpmn-visual-chain.md
