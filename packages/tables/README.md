# @textforge/tables

CSV/TSV table surfaces for TextForge.

Current integration scope:

- registers the `@textforge/tables` contribution manifest with the workbench;
- reserves the `@textforge/tables/csv-grid` surface for text `csv` and `tsv` resources;
- keeps the generic text editor as the default open path by using a lower `openWithPriority`.

Surface identifiers:

- capability: `@textforge/tables/capability/csv-grid`
- surface: `@textforge/tables/csv-grid`

Expected shell behavior:

1. `.csv` and `.tsv` resources continue to open in `@textforge/editors/code-mirror-text` by default.
2. `Open with` offers the table grid surface as an explicit alternative.
3. Full parser, diagnostics, persistence, and AG Grid runtime behavior lands with the owning `WP-TABLES` implementation slice.
