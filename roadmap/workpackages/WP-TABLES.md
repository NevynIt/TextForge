# WP-TABLES - CSV/TSV grid editor and shared table contract

## Registry

- Workpackage ID: `WP-TABLES`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-TABLES`
- ADRs: `ADR-0001`, `ADR-0013`
- Grilling report: `roadmap/decisions/ADR-0013-attachments/wp-tables-grilling-report.md`
- Follow-up: `WP-TABLES-02`

## Outcome

TextForge adds CSV/TSV as first-class user-facing resource formats with a reusable table contract.

The first implementation provides an alternate AG Grid Community-backed grid surface for CSV/TSV resources, while preserving the normal text editor as the default open mode. The workpackage also establishes the neutral `TableModel`, import/export, diagnostics, and minimal read-only rendering contracts needed for later semantic tables.

## Scope

- Define `@textforge/tables` as the package-owned table capability.
- Keep a single package with internal layers for contracts, CSV/TSV parsing, grid adapter, rendering, diagnostics, and export.
- Define a neutral row-oriented `TableModel` aligned with Papa Parse and AG Grid.
- Use Papa Parse behind TextForge contracts for CSV/TSV parsing and serialization.
- Use AG Grid Community only for editable CSV/TSV grid surfaces.
- Hide AG Grid and Papa Parse APIs from the rest of TextForge.
- Register the CSV/TSV grid surface through the existing contribution system.
- Keep text editor as the default open surface for `.csv` and `.tsv` resources.
- Expose grid mode through open-with/context-menu/surface switching behavior.
- Support saved CSV/TSV files and untitled resources whose language is `csv` or `tsv`.
- Support editable and read-only grid modes through the same surface contract.
- Support automatic header detection with explicit user override.
- Support delimiter, quote, escape, and newline detection with override.
- Save through dialect-preserving whole-file rewrite; do not promise byte-for-byte preservation of the first save.
- Keep raw strings as canonical CSV/TSV cell values; derived typed values may support display, sorting, or filtering without mutating saved data.
- Provide parser and structural diagnostics as normal TextForge diagnostics and grid-local feedback.
- Provide a minimal read-only table renderer over `TableModel` without sorting/filtering.
- Provide CSV/TSV export helpers for any source module that can produce a `TableModel`.
- Add broad fixture-based tests for CSV/TSV edge cases.
- Add `WP-TABLES-02` as the follow-up for semantic interactive tables and exports.

## Non-goals

- Making AG Grid the default renderer for every table in TextForge.
- Replacing Markdown/HTML static report tables.
- Migrating all ITM tables, diagnostics tables, catalogues, and matrices in this WP.
- Introducing TanStack Table in this WP.
- Building a spreadsheet engine or evaluating formulas.
- Building full minimal-diff byte-preserving CSV editing.
- Supporting linked table/database workflows.
- Persisting table view state such as column visibility and widths beyond the active session.
- Adding settings/configuration UI for grid size thresholds in this WP.
- Adding schema/value validation beyond structural diagnostics.

## Package Impact

- Primary package: `packages/tables` / `@textforge/tables`.
- Runtime dependency candidates:
  - `ag-grid-community` and React integration package for the CSV/TSV grid adapter.
  - `papaparse` for CSV/TSV parsing and serialization.
- Related packages:
  - `@textforge/core` for language IDs, diagnostics, and contribution contracts.
  - `@textforge/surfaces` or equivalent surface registry composition.
  - `@textforge/workspace` / resource layer for persistence and dirty/save behavior.
  - `@textforge/itm`, `@textforge/markdown`, and diagnostics producers as future `TableModel` sources.

## Interfaces / Contracts Changed

`@textforge/tables` should expose TextForge-owned contracts similar to:

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

Canonical CSV/TSV values remain raw strings. Derived typed values are optional and must not silently change saved content.

The table package owns:

- CSV/TSV import to `TableModel`;
- `TableModel` export to CSV/TSV;
- grid surface contribution factories;
- minimal read-only rendering helpers;
- table diagnostics mapping.

Source modules own semantic extraction. They may produce `TableModel`, but `@textforge/tables` owns CSV/TSV serialization and table rendering/export utilities.

## Validation Criteria

Implementation evidence should demonstrate:

- CSV and TSV resources still open in the text editor by default.
- CSV and TSV resources can be opened as a grid from an explicit surface/open-with action.
- Untitled `csv` and `tsv` language resources can use grid mode.
- Grid edits mark the resource dirty and save through the normal resource layer.
- Papa Parse import/export is wrapped and not leaked to callers.
- AG Grid is wrapped and not leaked to callers.
- Header mode detection and override work for first-row-header and headerless files.
- Delimiter detection handles comma, tab, semicolon, pipe, quote/escape/newline settings where supported.
- Dialect-preserving rewrite preserves delimiter/newline/header mode choices.
- Formula-looking values are preserved as strings and not evaluated or escaped.
- Structural diagnostics are emitted as core diagnostics and shown in-grid where possible.
- Serious malformed files block grid mode while remaining editable as text.
- Large files warn/block grid mode according to conservative constants.
- The minimal read-only renderer can render a `TableModel` without sorting/filtering.
- CSV/TSV export helpers can serialize generated table models.

## Evidence Required

- Package tests for parser/export fixtures:
  - normal CSV;
  - TSV;
  - semicolon CSV;
  - quoted delimiters;
  - embedded newlines;
  - escaped quotes;
  - duplicate headers;
  - empty headers;
  - ragged rows;
  - headerless files;
  - formula-looking strings;
  - dialect-preserving save;
  - serious malformed-file grid blocking;
  - large-file warning/block thresholds.
- Surface/contribution tests for CSV/TSV grid availability and text-default behavior.
- Resource integration tests for dirty/save handoff without table-owned persistence.
- Diagnostics tests for parser and structural diagnostics.
- Manual UI evidence for opening, editing, saving, switching surface, and read-only behavior.
- RAPID event entry for material progress or validation.

## Open Decisions

- Exact AG Grid React package/import strategy.
- Exact `TableModel` TypeScript names and module export layout.
- Exact conservative file/row/column limits. Current guidance: warn above approximately 10 MB or 50k rows; block grid mode above approximately 50 MB or 250k rows.
- Whether any AG Grid Community clipboard behavior is enabled beyond default browser/grid copy-paste.
- Which existing ITM/Markdown table-like outputs become the first consumers of the generic `TableModel` after this WP.

## Deferred to WP-TABLES-02

- TanStack Table for semantic interactive diagnostics, catalogues, and matrices.
- Migration of ITM-generated table views to `@textforge/tables`.
- Diagnostics table rendering through semantic table facilities.
- CSV/TSV export for diagnostics, catalogues, matrices, and semantic views.
- Avoiding duplicate table rendering/export logic in ITM, Markdown, diagnostics, and future EA modules.
- Persistent table view state.
- Schema/value validation.
- Settings-backed grid size thresholds after the settings/configuration workpackage.

## Archive Trace

- archive/registers/legacy-workpackages/workpackage-register.md
- archive/registers/legacy-workpackages/implementation-status.md
- archive/migration-snapshots/roadmap-before-governance-reset-2026-06-05/workpackages/
- legacy source: Phase 11
- clarified by `ADR-0013` and `ADR-0013-attachments/wp-tables-grilling-report.md`
