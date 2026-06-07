# ITM

## Registry

- Module ID: `MOD-ITM`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/itm.md`

## Purpose

ITM defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- ITM parsing and serialization
- ITM directives and package activation
- ITM profile validation
- ITM comments/trivia, identity maps, and scoped context semantics
- ITM validation, diagnostics, and conformance-module semantics
- ITM parameter declarations and virtual execution
- semantic target extraction

### Does not own

- runtime renderer UI
- BPMN completeness
- ArchiMate profile content

## Public Contracts

- @textforge/itm public wrapper
- ITM diagnostics
- profile and view/viewpoint contracts
- scoped activation, identity map, and context inference contracts

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-ITM-01` | ITM parser/model foundation | Registry-owned | Domain foundation |
| `WP-ITM-02` | ITM directives, packages, validation, diagnostics | Registry-owned | Domain foundation |
| `WP-ITM-03` | ITM scoped contexts, identity maps, and comments | Registry-owned | Domain foundation |
| `WP-ITM-04` | ITM validation and conformance modules | Registry-owned | Domain foundation |
| `WP-ITM-05` | Parameterized ITM reports and dashboards | Registry-owned | Domain/reporting foundation |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.
- `ADR-0006` governs ITM scoped contexts, identity maps, comments/trivia, and include/package activation semantics.
- `ADR-0007` governs ITM type inheritance and context inference.
- `ADR-0008` proposes ITM validation and conformance-module semantics.
- `ADR-0009` proposes parameterized ITM reports and dashboards.
- `ADR-0011` proposes AI-labelled semantic ITM review after deterministic validation.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/itm.md
- archive/registers/specs/legacy-specs/architecture/textforge-rebuild-whitepaper.md
- archive/grilling/legacy-grilling/itm-visuals-grilling.md
