> [!IMPORTANT]
> Archived governance reset input package. This package is non-authoritative after installation; active roadmap truth lives in oadmap/roadmap-state.yaml, oadmap/decisions/, templates, and generated views.

# TextForge Roadmap

## Purpose

This roadmap explains how TextForge is developed through independent modules, coordinated workpackages, release envelopes, ADRs, and validation evidence.

## Start here

| Need | Go to |
|---|---|
| Current roadmap state | `roadmap-state.yaml` |
| Active workpackages | `workpackages/` |
| Module boundaries | `modules/` |
| Release cuts | `releases/` |
| Durable decisions | `decisions/` |
| Event log | `RAPID.md` |
| Historical material | `archive/` |
| Validation evidence | `validation/evidence/` |

## Authority model

- `roadmap-state.yaml` is authoritative for IDs, status, dependencies, and registry data.
- `modules/` explains stable module boundaries.
- `workpackages/` explains executable scope.
- `decisions/` records durable decisions.
- `RAPID.md` records events only.
- `archive/` is historical only.

## Active structure

```text
roadmap/
  roadmap-state.yaml
  RAPID.md
  modules/
  workpackages/
  releases/
  decisions/
  validation/
  views/
  archive/
```

## Current generated views

- `views/current-next.md`
- `views/dependency-map-full.md`
- `views/dependency-map-next.md`
- `views/status-dashboard.md`
- `views/module-matrix.md`

## Conventions

See `decisions/ADR-0001-roadmap-governance-reset.md` and its attachments.
