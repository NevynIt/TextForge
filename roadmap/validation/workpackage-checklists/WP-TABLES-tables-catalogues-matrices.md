# WP-TABLES â€” Tables, Catalogues, and Matrices Checklist

## Scope

Structured table UX beyond the static `WP-ITM-VISUALS` baseline:

- TanStack-backed catalogue and matrix surfaces over ITM model projections
- explicit CSV/TSV grid editing with apply/discard write-back
- grouped diagnostics / issue tables

## Acceptance checks

- ITM catalogue targets can open in a dedicated richer table surface owned by `@textforge/tables`.
- ITM relationship matrix targets can open in a dedicated richer table surface owned by `@textforge/tables`.
- CSV and TSV resources can open in a structured grid editor that keeps table-native state and requires explicit apply/discard before canonical source changes.
- Diagnostics can open in a grouped issue-table surface without dropping into raw source.
- The package owns reusable parsing/serialization and table-model helpers instead of hard-coding table logic in the app shell.
- Sorting/filtering behavior is covered by focused tests.
- Catalogue/matrix abstractions remain reusable for later domain-specific editors instead of coupling directly to one app-screen implementation.

## Evidence to attach when implemented

- `corepack pnpm --filter @textforge/tables test`
- `corepack pnpm --filter @textforge/tables build`
- `corepack pnpm --filter @textforge/itm test`
- `corepack pnpm --filter @textforge/textforge-web test`
- `corepack pnpm --filter @textforge/textforge-web build`
- `corepack pnpm verify`
- Bundled fixtures: `docs/examples/tables/application-portfolio.csv`, `docs/examples/tables/relationship-grid.tsv`

## Notes

- Browser-level `file://` build checks passed through the existing web-shell validation path.
- A short manual UI spot-check remains useful because local Edge headless DOM probing failed in this environment before the page DOM could be captured.
