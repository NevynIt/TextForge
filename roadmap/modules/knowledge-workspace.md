# Knowledge workspace

## Registry

- Module ID: `MOD-KNOWLEDGE-WORKSPACE`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/knowledge-workspace.md`

## Purpose

Knowledge workspace defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- link/backlink/mention index
- document-neighborhood graph surface
- spatial workspace canvas
- comments sidecars and change proposals

### Does not own

- ITM graph rendering
- sketch annotation resources
- GitLab merge request implementation

## Public Contracts

- link index
- canvas resource model
- sidecar comments
- change proposal model

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-LINK-INDEX` | Document link, backlink, and mention index | Registry-owned | Knowledge workspace foundation |
| `WP-CANVAS` | Spatial workspace canvas | Registry-owned | Knowledge workspace UI |
| `WP-COMMENTS-SIDECAR` | Comments and review sidecars | Registry-owned | Knowledge workspace / review |
| `WP-CHANGE-PROPOSALS` | Reviewable change proposals | Registry-owned | Review / backend bridge |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.
- `ADR-0011` proposes deterministic retrieval plus local AI reranking for semantic search without making embeddings mandatory.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/workspace.md
- archive/registers/package-guides/surfaces.md
- archive/registers/package-guides/ui.md
- archive/registers/package-guides/markdown.md
