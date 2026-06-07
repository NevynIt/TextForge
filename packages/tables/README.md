# @textforge/tables

CSV/TSV table surfaces for TextForge.

Current scope:

- `parseDelimitedTable(sourceText, options)` wraps Papa Parse for CSV/TSV import and returns a package-owned `TableModel`;
- `serializeDelimitedTable(model, options)` rewrites the full document while preserving delimiter/newline/header decisions through the package dialect contract;
- `renderReadonlyTableModel(model)` emits a minimal HTML table for read-only consumers;
- `@textforge/tables/csv-grid` provides an AG Grid Community surface for explicit CSV/TSV grid editing and read-only display;
- the workbench opens CSV/TSV resources in the table grid by default while keeping the text editor available through `Open with`.

Surface identifiers:

- capability: `@textforge/tables/capability/csv-grid`
- surface: `@textforge/tables/csv-grid`

Expected shell behavior:

1. `.csv` and `.tsv` resources open in `@textforge/tables/csv-grid` by default.
2. `Open with` still offers `@textforge/editors/code-mirror-text` as a direct source fallback.
3. Single clicks focus/select cells and ranges; editing starts on explicit edit actions such as double-click, `Enter`, or `F2`.
4. Grid edits persist through the standard text-document execution path, rewriting the backing CSV/TSV text on committed operations.
5. Malformed or blocked input opens a package-owned failure panel with diagnostics instead of a blank surface.
