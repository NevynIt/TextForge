# Roadmap governance

## Registry

- Module ID: `MOD-ROADMAP-GOVERNANCE`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/roadmap-governance.md`

## Purpose

Roadmap governance defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- roadmap authority model
- module/workpackage/release registry conventions
- ADR and RAPID placement
- generated view governance

### Does not own

- implementation package contracts
- release-specific validation evidence beyond roadmap governance

## Public Contracts

- roadmap-state.yaml
- ADR process
- RAPID event log
- generated view markers

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-ROADMAP-CLEANUP` | Roadmap cleanup and governance reset | Registry-owned | governance |
| `WP-RELEASE-GATE` | Release envelope and accreditation evidence | Registry-owned | Recurring gate |
| `WP-REPO-SHAREPOINT` | SharePoint-like repository adapter | Registry-owned | Optional adapter |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/AGENTS_START_HERE.md
- archive/phases/ROADMAP_V20.md
- archive/registers/package-guides/README.md
- archive/registers/specs/legacy-specs/architecture/package-strategy.md
- decisions/ADR-0001-roadmap-governance-reset.md
