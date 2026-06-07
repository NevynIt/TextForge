# @textforge/tables

CSV/TSV table surfaces for TextForge.

Current scope:

- `parseDelimitedTable(sourceText, options)` wraps Papa Parse for CSV/TSV import and returns a package-owned `TableModel`;
- `serializeDelimitedTable(model, options)` rewrites the full document while preserving delimiter/newline/header decisions through the package dialect contract;
- `renderReadonlyTableModel(model)` emits a minimal HTML table for read-only consumers;
- `@textforge/tables/csv-grid` provides the primary Glide Data Grid surface for CSV/TSV editing and read-only display;
- `@textforge/tables/csv-grid-ag-fallback` keeps the previous AG Grid Community runtime available as an `Open with` fallback;
- the workbench opens CSV/TSV resources in the primary table grid by default while keeping the AG fallback and text editor available through `Open with`.

Surface identifiers:

- capability: `@textforge/tables/capability/csv-grid`
- primary surface: `@textforge/tables/csv-grid`
- fallback surface: `@textforge/tables/csv-grid-ag-fallback`

Expected shell behavior:

1. `.csv` and `.tsv` resources open in `@textforge/tables/csv-grid` by default.
2. `Open with` offers the AG fallback surface and `@textforge/editors/code-mirror-text` as source fallbacks.
3. The primary Glide surface supports row, column, and range selection through its owned interaction model.
4. Native browser text selection inside closed cells is not guaranteed in the primary surface; use the grid selection model or the text editor when raw source interaction matters.
5. Grid edits persist through the standard text-document execution path, rewriting the backing CSV/TSV text on committed operations.
6. Malformed or blocked input opens a package-owned failure panel with diagnostics instead of a blank surface.
