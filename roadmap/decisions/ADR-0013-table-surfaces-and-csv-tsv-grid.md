# ADR-0013 - Table surfaces and CSV/TSV grid editing

## Status

Accepted. Incorporated into the roadmap as implementation guidance for `MOD-TABLES`, `WP-TABLES`, and follow-up `WP-TABLES-02`.

The editable CSV/TSV grid library choice from this ADR is partially superseded by `ADR-0014`. The package boundary, Papa Parse choice, shared `TableModel`, and `WP-TABLES-02` semantic-table direction remain in force.

## Date

2026-06-07

## Context

TextForge has several table needs that should not be solved independently in each source module:

- CSV and TSV files should remain plain text resources but should also support grid editing.
- ITM and Markdown workflows can generate table-like views, catalogues, matrices, and reports.
- Diagnostics, semantic reviews, catalogues, and matrices should eventually be exportable to CSV/TSV for analysis in tools such as spreadsheets, Power BI, scripts, and external data workflows.
- TextForge prefers stable reusable libraries over hand-crafted simplified implementations where established libraries fit the use case.

The previous `WP-TABLES` entry was dependency-ready but blocked pending grilling around diagnostics ownership, entry points, package boundary, and library choice.

The grilling outcome is captured in `ADR-0013-attachments/wp-tables-grilling-report.md`.

## Decision

Adopt a three-level table strategy:

1. **Static report tables**
   - Render as Markdown/HTML.
   - Do not require a grid library.

2. **Semantic interactive tables**
   - Diagnostics, catalogues, matrices, and semantic generated tables.
   - Defer full implementation to `WP-TABLES-02`.
   - Use TanStack Table later for semantic interactive behavior.

3. **Editable grid tables**
   - CSV/TSV editor surface.
   - Use AG Grid Community behind `@textforge/tables` contracts.

`WP-TABLES` delivers CSV/TSV editor capability first, while also defining the neutral shared table contracts and minimal read-only renderer needed for later semantic table reuse.

## Library decisions

- Use **AG Grid Community** only for the editable CSV/TSV grid surface.
- Use **Papa Parse** for CSV/TSV parsing and serialization.
- Defer **TanStack Table** to `WP-TABLES-02` for semantic interactive tables.
- Do not use Handsontable in this workpackage because the current need does not justify its heavier and more license-sensitive profile.

AG Grid and Papa Parse must remain implementation details of `@textforge/tables`. No AG Grid or Papa Parse APIs should leak to the rest of TextForge.

## Package boundary

Keep one public package:

```text
packages/tables
@textforge/tables
```

Internally layer it into areas such as:

- `contracts`;
- `csv`;
- `grid`;
- `render`;
- `diagnostics`;
- `export`.

Do not split into subpackages in `WP-TABLES`.

## Table model

Use a row-oriented canonical table model because Papa Parse and AG Grid both naturally operate with rows/records.

Recommended shape:

```ts
interface TableModel {
  id?: string;
  columns: TableColumn[];
  rows: TableRow[];
  metadata?: TableMetadata;
}

interface TableColumn {
  id: string;
  field: string;
  header: string;
  type?: TableValueType;
  readOnly?: boolean;
  required?: boolean;
  width?: number;
  metadata?: Record<string, unknown>;
}

interface TableRow {
  id: string;
  index: number;
  values: Record<string, TableCellValue>;
  source?: TableSourceRef;
  diagnostics?: TableDiagnostic[];
  metadata?: Record<string, unknown>;
}
```

Columnar indexes may be derived lazily for filtering, search, statistics, or export optimization, but the canonical model should not be columnar in this workpackage.

## CSV/TSV editor behavior

- CSV/TSV remains plain text.
- Opening a CSV/TSV resource defaults to the normal text editor, like Markdown.
- Grid mode is available through context menu/open-with/surface switching.
- TextForge continues to use one active surface at a time.
- Grid mode is available for saved `.csv`/`.tsv` resources and untitled resources whose language is `csv` or `tsv`.
- Grid edits mark the resource dirty.
- Persistence is handled by the workspace/resource layer, not directly by `@textforge/tables`.
- AG Grid local undo/redo may be used for grid-local cell operations, but unified cross-surface undo/redo is deferred.

## CSV/TSV parsing and save behavior

- Auto-detect header mode with explicit override.
- Auto-detect delimiter/quoting/newline dialect with explicit override.
- Use dialect-preserving whole-file rewrite first.
- Do not promise byte-for-byte preservation of untouched content on the first save.
- After first save, TextForge serialization should be stable and predictable.
- Preserve formula-looking values as strings.
- Do not evaluate, escape, or warn on formula-looking values in this WP.
- Treat CSV/TSV as pure tabular data; do not invent comment or metadata syntax.

## Diagnostics and validation

CSV/TSV validation in `WP-TABLES` covers parser and structural diagnostics:

- Papa Parse parser errors;
- inconsistent row length;
- duplicate headers;
- empty headers;
- invalid or ambiguous header mode;
- unsupported or ambiguous dialect where relevant;
- oversized file/grid-limit diagnostics;
- serious malformed-file grid blocking.

Diagnostics should be emitted as normal TextForge diagnostics and also shown as grid-local cell/row/header feedback where possible.

Schema/value validation is deferred.

## Size policy

Use conservative default constants because TextForge does not yet have a configuration/settings surface:

- warn above approximately 10 MB or 50k rows;
- block grid mode above approximately 50 MB or 250k rows;
- keep text mode available.

When the future settings/configuration workpackage exists, these limits can become configurable.

## Minimal read-only renderer

`WP-TABLES` should include a minimal read-only renderer for `TableModel`.

It should not support sorting/filtering in this workpackage. Sorting/filtering belong to:

- AG Grid for editable CSV/TSV grid mode;
- TanStack Table in `WP-TABLES-02` for semantic interactive tables.

## Follow-up workpackage

`WP-TABLES-02 - Shared semantic table rendering and exports` covers:

- TanStack Table for semantic interactive diagnostics, catalogues, and matrices;
- migration of ITM-generated table views to `@textforge/tables`;
- CSV/TSV export for diagnostics, catalogues, matrices, and semantic views;
- shared table rendering/export facilities for ITM, Markdown, diagnostics, and future EA modules.

## Consequences

### Positive

- CSV/TSV becomes a useful editable resource format without losing text inspectability.
- TextForge avoids building a custom spreadsheet/grid implementation.
- Table rendering/export responsibilities become centralized in `@textforge/tables`.
- AG Grid is used where it is strongest and isolated where it is risky to leak.
- Semantic tables have a clear future path through TanStack Table without delaying CSV/TSV grid editing.
- Diagnostics, catalogues, and matrices get a future CSV/TSV export route.

### Negative / trade-offs

- AG Grid adds a substantial UI dependency for the CSV/TSV grid surface.
- Whole-file rewrite may alter first-save formatting even when dialect is preserved.
- Full semantic tables remain deferred.
- The first implementation has conservative large-file behavior rather than streaming/chunked editing.
- Settings-backed thresholds must wait for a future settings workpackage.

### Roadmap integration

- `WP-TABLES` has been updated with the clarified scope.
- `WP-TABLES-02` has been added as the semantic table follow-up.
- `ADR-0013` and `WP-TABLES-02` are registered in `roadmap-state.yaml`.
- RAPID records the grilling and ADR outcome in `A-042`.
- Implementation validation evidence remains required when `WP-TABLES` moves from planning to implementation.
