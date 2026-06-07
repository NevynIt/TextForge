# Markdown and ITM publication

## Registry

- Module ID: `MOD-MARKDOWN-ITM`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/markdown-itm.md`

## Purpose

Markdown and ITM publication defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- TextForge Markdown compatibility profile
- Markdown preview/report flows
- ITM publication blocks
- parameterized ITM Markdown reports
- PDF export flow

### Does not own

- raw ITM parser semantics
- runtime visual renderer implementation
- backend persistence

## Public Contracts

- TF-MD profile
- markdown fence contribution contracts
- itm-pub publication contract

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-ITM-PUB-VISUAL-01` | Shared visual pipeline for itm-pub | Registry-owned | Domain / feature |
| `WP-MD-REPORT` | Markdown + ITM report generation | Registry-owned | Feature |
| `WP-MD-RICH` | Rich Markdown editing | Registry-owned | Optional editor feature |
| `WP-PDF-EXPORT` | PDF generation/export | Registry-owned | Optional export |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.
- `ADR-0009` proposes parameterized ITM reports and dashboards.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/markdown.md
- archive/registers/specs/legacy-specs/architecture/textforge-markdown-profile.md
- archive/registers/package-guides/pipeline.md
