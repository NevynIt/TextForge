# ADR-0014 - Glide-first CSV/TSV grid with AG Grid fallback

## Status

Accepted. Incorporated into the roadmap as a focused update to `WP-TABLES` implementation guidance.

## Date

2026-06-07

## Context

`ADR-0013` established the package boundary and shared contracts for `@textforge/tables`, and selected AG Grid Community for the first editable CSV/TSV grid surface.

That decision proved too optimistic for the actual CSV/TSV authoring surface because several high-value spreadsheet-style features are gated behind the AG Grid Enterprise license. TextForge needs an open-source-first primary grid that can stay inside the existing package boundary without introducing new workbench architecture.

The current implementation already keeps the grid runtime encapsulated in `packages/tables/src/grid-surface.js`, so the editable grid library choice can be revised without changing other packages or leaking new third-party contracts.

## Decision

Keep `ADR-0013` in force for:

- `@textforge/tables` as the package-owned boundary;
- Papa Parse for CSV/TSV parsing and serialization;
- the neutral row-oriented `TableModel`;
- `WP-TABLES-02` remaining the semantic-table follow-up;
- TanStack Table remaining deferred to semantic interactive tables.

Supersede only the editable CSV/TSV grid library choice:

- Use **Glide Data Grid** as the primary editable CSV/TSV grid surface.
- Keep **AG Grid Community** available temporarily as an `Open with` fallback surface during transition.
- Preserve the existing primary surface ID `@textforge/tables/csv-grid` and move that surface to Glide.
- Keep AG Grid behind a second package-owned fallback surface with lower `openWithPriority`.

## Implementation guidance

- Keep parse, serialize, diagnostics, and `TableModel` logic shared and renderer-agnostic inside `@textforge/tables`.
- Do not introduce a new package or cross-package adapter layer for this substitution.
- Keep both grid implementations hidden behind TextForge-owned surface contributions.
- Create and dispose any Glide portal and required CSS inside the tables package runtime path; do not require workbench-shell changes.
- Keep the text editor as the raw-source fallback surface outside the table package.

## Interaction consequences

- The primary grid is now canvas-based.
- Native browser text selection inside closed rendered cells is no longer a requirement for the primary CSV/TSV grid.
- Range, row, and column selection are expected to come from the primary grid runtime itself.
- AG fallback remains available for contingency use while the Glide path settles.

## Consequences

### Positive

- The primary grid remains open-source-first without enterprise gating.
- The swap stays localized to the existing `@textforge/tables` ownership boundary.
- TextForge keeps a working fallback grid while the new primary path stabilizes.
- No new workpackage, module, or workbench architecture is required.

### Negative / trade-offs

- The primary grid interaction model changes, especially around text selection in closed cells.
- The package carries two grid runtimes temporarily.
- Glide adds portal and CSS runtime requirements that must be contained carefully in-package.

## Roadmap integration

- `WP-TABLES` is updated to describe Glide as the primary CSV/TSV grid and AG Grid as fallback only.
- `WP-TABLES-02` continues to defer semantic interactive tables to TanStack Table and avoids treating AG Grid as permanent CSV/TSV policy.
- `roadmap-state.yaml`, `modules/tables.md`, and `RAPID.md` reference this ADR.
