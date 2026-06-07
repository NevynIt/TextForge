# Surfaces and UI

## Registry

- Module ID: `MOD-SURFACES-UI`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/surfaces-ui.md`

## Purpose

Surfaces and UI defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- surface registry/session/open-with behavior
- command/action projections
- settings UI and advanced surface capacity
- interactive ITM exploration workbench and transient surfaces
- local Lua automation UI integration

### Does not own

- feature package semantics
- backend authorization
- resource persistence internals

## Public Contracts

- surface contribution contracts
- command/action spine
- settings contracts

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-05A` | Contribution manifest and registry model | Registry-owned | Core gate |
| `WP-05B` | Capability activation and resolver context | Registry-owned | Core gate |
| `WP-05C` | Pipeline/contribution execution integration | Registry-owned | Core gate |
| `WP-05D` | Minimal package/capability inspector | Registry-owned | Feature / diagnostics |
| `WP-DOC-GRAPH` | Document neighborhood and local graph surface | Registry-owned | Knowledge workspace UI |
| `WP-SET-01` | User settings core and local persistence | Registry-owned | Core UX foundation |
| `WP-SET-UI` | User settings UI | Registry-owned | Feature / UX |
| `WP-LUA` | Lua automation | Registry-owned | Optional automation |
| `WP-LUA-POWER-SESSION` | Lua self-escalation session and one-click recovery | Registry-owned | Optional automation |
| `WP-LUA-VIRTUAL-HOST-01` | TextForge Lua virtual host for Fengari | Registry-owned | Corrective runtime hardening |
| `WP-SET-SYNC` | Roaming user settings | Registry-owned | Backend feature |
| `WP-AI-CHAT` | AI client and chat surface | Registry-owned | Optional feature |
| `WP-SURFACES-ADV` | Advanced tabbed main surfaces | Registry-owned | UX capacity |
| `WP-PIPELINE-EDITOR` | Pipeline/diagram editor surfaces | Registry-owned | Optional editor feature |
| `WP-ITM-EXPLORATION-01` | Interactive ITM exploration workbench | Registry-owned | Feature / model exploration |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.
- `ADR-0004` governs the browser-first Fengari host and TextForge-owned Lua virtual host.
- `ADR-0010` proposes the interactive ITM exploration workbench.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/surfaces.md
- archive/registers/package-guides/ui.md
- archive/registers/package-guides/editors.md
- archive/grilling/legacy-grilling/phase-4.1-grilling.md
- archive/grilling/legacy-grilling/phase-5-grilling.md
