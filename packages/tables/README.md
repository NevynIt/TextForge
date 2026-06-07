# @textforge/tables

CSV/TSV table surfaces for TextForge.

Current scope:

- `parseDelimitedTable(sourceText, options)` wraps Papa Parse for CSV/TSV import and returns a package-owned `TableModel`;
- `serializeDelimitedTable(model, options)` rewrites the full document while preserving delimiter/newline/header decisions through the package dialect contract;
- `renderReadonlyTableModel(model)` emits a minimal HTML table for read-only consumers;
- `@textforge/tables/csv-grid` provides an AG Grid Community surface for explicit CSV/TSV grid editing and read-only display;
- the workbench keeps `@textforge/editors/code-mirror-text` as the default open path by giving the table grid a lower `openWithPriority`.

Surface identifiers:

- capability: `@textforge/tables/capability/csv-grid`
- surface: `@textforge/tables/csv-grid`

Expected shell behavior:

1. `.csv` and `.tsv` resources continue to open in `@textforge/editors/code-mirror-text` by default.
2. `Open with` offers the table grid surface as an explicit alternative.
3. Grid edits persist through the standard text-document execution path, rewriting the backing CSV/TSV text on committed operations.
4. Malformed or blocked input opens a package-owned failure panel with diagnostics instead of a blank surface.
