# ADR-0015 - Glide table interaction activation and contract boundaries

## Status

Proposed. Follow-on implementation guidance for `WP-TABLES` after `ADR-0014` moved the primary CSV/TSV grid surface to Glide Data Grid.

## Date

2026-06-08

## Context

`ADR-0013` established the `@textforge/tables` boundary, the neutral `TableModel`, CSV/TSV import/export ownership, diagnostics ownership, and the follow-up path for semantic tables.

`ADR-0014` changed the primary editable CSV/TSV grid implementation from AG Grid Community to Glide Data Grid while preserving the existing package boundary and keeping AG Grid only as a temporary `Open with` fallback.

The current Glide implementation is intentionally conservative. It mounts Glide inside `packages/tables/src/grid-surface.js`, creates a package-owned portal and CSS injection path, maps `TableModel` cells to Glide text cells, and wires basic callbacks for cell edits, batch edits, paste, delete, and controlled selection. However, several useful Glide capabilities are not yet activated or are only partially activated:

- column resizing is structurally possible because columns have widths, but resize callbacks are not yet handled;
- in-place editing has the core Glide cell shape and edit callbacks, but needs stabilization around overlay/focus/CSS behavior;
- trailing-row append is not enabled;
- copy/paste uses Glide's simple mode, but could be made more explicit and efficient;
- row/column/range selection is controlled, but the TextForge-facing helper shape still looks too close to Glide internals;
- row and column reordering are not enabled;
- search, diagnostic highlighting, and row/column visual affordances are not yet exposed;
- some features are view-state only, while others modify canonical CSV/TSV data and must persist through serialization.

Glide's API exposes feature callbacks for cell editing, batch editing, paste, delete, column resize, row append, column move, row move, search, row markers, controlled selection, and highlight regions. It also requires the host application to update its own data when callbacks fire. This matches TextForge's package-owned adapter pattern, as long as Glide types and event objects do not leak outside the tables package.

Reference material:

- Glide Data Grid `DataEditor` API: https://docs.grid.glideapps.com/api/dataeditor
- Glide Data Grid editing guide: https://docs.grid.glideapps.com/extended-quickstart-guide/editing-data
- Glide Data Grid selection guide: https://docs.grid.glideapps.com/extended-quickstart-guide/working-with-selections
- Glide Data Grid copy/paste guide: https://docs.grid.glideapps.com/extended-quickstart-guide/copy-and-paste-support
- Glide Data Grid grid columns guide: https://docs.grid.glideapps.com/extended-quickstart-guide/grid-columns
- Glide examples/storybook, including add-columns examples: https://glideapps.github.io/glide-data-grid/

## Decision

Activate Glide features in tiers, based on whether they are local adapter behavior, canonical table mutations, or shared TextForge table contracts.

Do not expose Glide Data Grid concepts as public TextForge contracts. Glide `Item`, `Rectangle`, `CompactSelection`, `GridSelection`, `GridCell`, and event callback shapes must remain adapter-private. Public or reusable code must use TextForge-owned table terms such as `TableModel`, `TableColumn`, `TableRow`, `TableCellEdit`, `TableSelection`, `TableRange`, `TableMutation`, and `TableViewState`.

### Tier 1 - Adapter-only feature enablement

These features may be enabled inside `grid-surface.js` without changing public contracts.

| Feature | Expected behavior | Persistence | Encapsulation impact | Difficulty |
|---|---|---|---|---|
| In-place editing stabilization | Text cells open Glide overlay editors and commit through existing edit callbacks. | persisted as cell data | none | low / debug |
| Column resize | Users can resize columns during the active grid session. | session-only | none | low |
| Row marker improvement | Show useful row identity, preferably `both` or `clickable-number` rather than checkbox-only if usability improves. | session-only | none | low |
| Controlled selection polish | Keep range, row, and column selection controlled in the Glide runtime. | session-only | none | low |
| Copy/paste stabilization | Keep copy/paste enabled and prefer batch edit handling where possible. | persisted when pasted values change cells | none | low |
| Efficient copy source | Replace `getCellsForSelection: true` with a TextForge-owned callback if large selections make the generic path too expensive. | no direct persistence | none | low-medium |
| Search UI | Use Glide search state and results inside the adapter. | session-only | none | medium-low |
| Visible-region tracking | Optionally use visible-region callbacks for diagnostics, lazy rendering, or status text. | session-only | none | low |
| Header/menu affordances | Header clicks or menu clicks may open package-owned controls. | depends on action | none if translated | medium |

Rules for Tier 1:

- No new public exports are required.
- No source serialization is allowed unless the user changed actual cell data.
- Column widths, search strings, and selection state are not written into CSV/TSV files.
- Persistent view state remains deferred until TextForge has a general view/session/settings mechanism.

### Tier 2 - Canonical table mutation helpers

These features change the saved CSV/TSV data model and therefore require renderer-neutral table helpers before being wired to Glide callbacks.

| Feature | Glide signal | TextForge helper | Saved effect | Difficulty |
|---|---|---|---|---|
| Trailing row append | `trailingRowOptions`, `onRowAppended` | existing `appendTableRow(model)` | adds data row | low |
| Column append from grid affordance | header/menu/custom action | existing `appendTableColumn(model)` | adds column and empty cells | low |
| Row delete / selection delete | `onDelete` or toolbar | existing `removeTableRow`, `clearTableSelection` | removes/clears data | low |
| Column delete | header/menu/toolbar | existing `removeTableColumn` | removes column and values | low |
| Column rename | toolbar/header action | existing `renameTableColumn` | changes header when header mode supports it | low |
| Column reorder | `onColumnMoved` | new `moveTableColumn(model, fromIndex, toIndex)` | reorders serialized columns | medium-low |
| Row reorder | `onRowMoved` | new `moveTableRow(model, fromIndex, toIndex)` | reorders serialized rows | medium-low |
| Fill handle | `fillHandle`, `onFillPattern` | new batch edit/fill helper | fills cell range | medium |

Rules for Tier 2:

- Helpers must be expressed in TextForge terms and remain usable from Node tests.
- Glide callback arguments must be normalized at the adapter boundary.
- Structural mutations must call the same serialize/persist/reparse path as existing cell edits.
- Reordering is semantic for CSV/TSV because file order is canonical.
- Fill behavior must preserve raw strings and must not introduce formula evaluation.

Recommended helper additions:

```ts
interface TableCellEdit {
  rowIndex: number;
  columnField: string;
  value: string;
}

interface TableMoveEdit {
  fromIndex: number;
  toIndex: number;
}

function moveTableColumn(model: TableModel, fromIndex: number, toIndex: number): TableModel;
function moveTableRow(model: TableModel, fromIndex: number, toIndex: number): TableModel;
function applyTableCellEdits(model: TableModel, edits: TableCellEdit[]): TableModel;
```

The concrete implementation may stay in JavaScript until TypeScript contracts are finalized, but the conceptual API must not mention Glide.

### Tier 3 - Shared contract extensions

These features require an explicit TextForge contract because they are useful beyond the raw CSV/TSV grid or need stable interoperability with diagnostics and future semantic tables.

#### Diagnostic targeting

Structural diagnostics currently exist, but rich grid highlighting needs stable table targets.

Add TextForge-owned diagnostic target metadata when needed:

```ts
interface TableCellRef {
  rowIndex?: number;
  rowId?: string;
  columnIndex?: number;
  columnField?: string;
}

interface TableRangeRef {
  rowStart: number;
  rowEndExclusive: number;
  columnStart: number;
  columnEndExclusive: number;
}

interface TableDiagnosticTarget {
  cell?: TableCellRef;
  range?: TableRangeRef;
  rowIndex?: number;
  rowId?: string;
  columnIndex?: number;
  columnField?: string;
}
```

The Glide adapter may translate these targets to `highlightRegions`, row theme overrides, header indicators, or tooltips. The diagnostic producer must not know about Glide highlight shapes.

#### Table selection normalization

If selection needs to be shared outside the Glide runtime, define a TextForge-owned selection shape:

```ts
interface TableSelection {
  currentCell?: TableCellRef;
  ranges?: TableRangeRef[];
  rows?: number[];
  columns?: number[];
}
```

This contract is only needed if selection drives package-level commands, diagnostics, exports, or cross-surface behavior. Otherwise, selection can remain adapter-local.

#### Table view state

Column widths, column visibility, frozen columns, sort state, search text, and selected ranges are view state. They should not be serialized into CSV/TSV. Persistent table view state is deferred until TextForge has a general place to store surface/view/session settings.

A future contract may look like:

```ts
interface TableViewState {
  columnWidths?: Record<string, number>;
  hiddenColumns?: string[];
  frozenColumnCount?: number;
  searchText?: string;
  selected?: TableSelection;
}
```

This is not part of the first activation slice unless a storage location already exists.

### Tier 4 - Deferred or avoided features

Do not enable these in the CSV/TSV editor slice:

- formula evaluation;
- spreadsheet dependency graphs;
- schema/value validation beyond existing structural diagnostics;
- rich custom Markdown/image cells for raw CSV/TSV content;
- external drag/drop into cells;
- arbitrary HTML rendering in cells;
- persistent column width/visibility state without a general view-state mechanism;
- group headers unless a future schema/profile defines column groups;
- semantic diagnostics/catalogues/matrices migration, which remains `WP-TABLES-02` scope.

## Implementation guidance

### Glide adapter boundary

`packages/tables/src/grid-surface.js` may import and use Glide. Other packages and public table exports must not import Glide.

The adapter owns:

- converting `TableModel.columns` to Glide `GridColumn[]`;
- converting `TableModel.rows` and cell values to Glide `GridCell` values;
- converting Glide edit events to `TableCellEdit`;
- converting Glide selection objects to adapter-local state or TextForge `TableSelection` if needed;
- converting TextForge diagnostic targets to Glide highlighting;
- owning any Glide CSS, portal, and overlay/focus fixes.

The shared table layer owns:

- cell edits;
- row/column append;
- row/column delete;
- row/column move;
- column rename;
- selection clearing when represented in TextForge terms;
- parse/serialize/reparse persistence path;
- diagnostic target contracts.

### First implementation slice

The first slice should focus on the highest-value, lowest-risk features:

1. stabilize in-place editing and overlay behavior;
2. enable column resize as session-only state;
3. improve row markers to show row numbers and/or selection affordances clearly;
4. keep copy/paste enabled and verify batch paste through `onCellsEdited`;
5. enable trailing-row append through `onRowAppended`;
6. keep the AG fallback available for comparison until Glide behavior is validated.

This slice should not add persistent view state.

### Second implementation slice

The second slice should add renderer-neutral structural helpers and wire them to Glide:

1. `moveTableColumn`;
2. `moveTableRow`;
3. optional fill-handle support if raw-string propagation is deterministic;
4. optional header menu actions if they use existing table commands.

### Third implementation slice

The third slice should add diagnostics-oriented contracts:

1. cell/range diagnostic targets;
2. adapter translation to Glide highlights and/or row/header indicators;
3. tests proving diagnostics remain TextForge-owned and renderer-neutral.

## Validation criteria

Automated validation should cover as much as possible without browser-only checks:

- Node tests for `applyTableCellEdits`, append/remove/rename helpers, `clearTableSelection`, and any new move/fill helpers.
- Tests that table mutation helpers do not depend on Glide imports or Glide-shaped objects.
- Tests that serialized CSV/TSV column and row order follows `moveTableColumn` and `moveTableRow`.
- Tests that formula-looking strings remain raw strings through edit, paste, fill, move, serialize, and reparse flows.
- Tests that diagnostic target normalization uses TextForge-owned row/column/range shapes.
- Source checks preventing `@glideapps/glide-data-grid` imports outside the table grid adapter and style/runtime boundary.
- Existing package and workbench integration tests for surface registration and fallback ordering.

Manual UI evidence remains required for browser-only behavior:

- open CSV/TSV in the Glide primary grid;
- edit a cell in place and save;
- paste a multi-cell range;
- copy a selected range;
- delete a selected range;
- resize a column;
- append using the trailing row;
- select rows, columns, and multi-ranges;
- reopen through AG fallback;
- confirm read-only resources do not mutate;
- confirm column resize/search/selection state does not alter saved CSV/TSV unless actual table data changed.

## Consequences

### Positive

- High-value Glide behavior can be activated without reopening the grid-library decision.
- Most interaction improvements stay localized to the existing tables package.
- The public TextForge table contract remains library-neutral.
- CSV/TSV editing gains spreadsheet-like usability without adopting spreadsheet semantics.
- Future semantic tables get cleaner table selection, mutation, and diagnostic target concepts.

### Negative / trade-offs

- Glide's canvas/overlay interaction model still requires manual UI validation.
- Column resize and search are initially session-only, which may surprise users expecting persistence.
- Row and column move require new helper functions because they change canonical CSV/TSV order.
- Diagnostic highlighting needs contract refinement before it can be cleanly shared with semantic tables.
- Keeping AG fallback during stabilization means the package temporarily carries two grid runtimes.

### Follow-up required

- Implement the Tier 1 adapter-only features first.
- Add renderer-neutral row/column move helpers before enabling drag reorder.
- Add diagnostic target contracts before implementing rich grid diagnostic highlighting.
- Decide later whether table view state belongs in workspace session state, surface state, resource sidecar metadata, or a future settings/view-state package.
- Revisit removal of AG fallback after Glide editing, selection, resize, paste, and read-only behavior are validated.

## Applies to

- Modules: `MOD-TABLES`, `MOD-SURFACES-UI`
- Workpackages: `WP-TABLES`, `WP-TABLES-02`
- Releases: `R-VISUAL-MODELING-MVP`

## Supersedes / superseded by

- Supersedes: none
- Refines: `ADR-0013`, `ADR-0014`
- Superseded by: none
