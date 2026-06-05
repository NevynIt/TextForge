# Enterprise Architecture Viewer

## Registry

- Module ID: `MOD-EA-VIEWER`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/enterprise-architecture-viewer.md`

## Purpose

Enterprise Architecture Viewer owns the TextForge module boundary for an exact local port of the EA Dashboard React viewer.

## Boundaries

### Owns

- exact EA Dashboard viewer surface behavior
- Django fixture JSON normalization for enterprise architecture datasets
- React Flow and Dagre graph runtime integration
- timeline, detail-level, viewpoint, and filter controls
- in-surface navigation across global, business, system, datacenter, project, capability, and process views

### Does not own

- generic surface registry/session behavior
- Visual ITM renderer packages or ArchiMate semantic translation
- Django backend API, authentication, import/restore, or Gemini chat integration
- workspace resource persistence internals

## Public Contracts

- `@textforge/ea-viewer` package contribution
- `packages/ea-viewer` module implementation boundary
- EA dashboard fixture JSON profile detection for workspace `.json` resources
- bundled EA Dashboard ITM profile and Lua JSON/ITM round-trip translator examples
- surface contribution ID for the embedded architecture dashboard viewer
- local-only rendering profile compatible with the TextForge CSP

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-EA-VIEWER-01` | Exact EA dashboard viewer surface | Registry-owned | Feature / exact port |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when TextForge can open EA dashboard JSON fixture exports in an embedded surface that preserves the original dashboard's graph layouts, custom detail views, timeline slider, and level-of-detail slider without requiring the Django service.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.
- The first slice is an exact port, not a rewrite into Visual ITM, ArchiMate, or a generic graph package.

## Validation Approach

Module-level validation is assembled from the workpackage checklist and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- external reference: C:/Stuff/ea-dashboard/frontend/src/App.jsx
- external reference: C:/Stuff/ea-dashboard/frontend/src/pages/GlobalDashboard.jsx
- external reference: C:/Stuff/ea-dashboard/frontend/src/pages/SystemView.jsx
- external reference: C:/Stuff/ea-dashboard/frontend/src/pages/SettingsView.jsx
- external reference: C:/Stuff/ea-dashboard/data_export/ea_architecture_backup_2026-06-05.json
