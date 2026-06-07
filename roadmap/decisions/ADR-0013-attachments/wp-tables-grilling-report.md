# ADR-0013 Attachment - WP-TABLES grilling report

## Status

Completed grilling report for `WP-TABLES` on 2026-06-07.

## Purpose

This attachment records the ambiguity-removal interview that unblocked the `WP-TABLES` workpackage. It is attached to `ADR-0013` because the grilling produced durable architecture and library decisions.

## Executive decision summary

`WP-TABLES` should deliver a usable CSV/TSV grid editor plus a shared table contract.

Key decisions:

- CSV/TSV editor is the first use case.
- CSV/TSV remains plain text and opens in the normal text editor by default.
- Grid mode is an alternate surface selected from open-with/context-menu/surface switching.
- AG Grid Community is used only for editable CSV/TSV grid surfaces.
- Papa Parse is used for CSV/TSV parsing and serialization.
- TanStack Table is deferred to `WP-TABLES-02` for semantic interactive tables.
- `@textforge/tables` hides AG Grid and Papa Parse behind TextForge contracts.
- The canonical `TableModel` is row-oriented with explicit column definitions.
- Raw strings are canonical; derived typed values are optional and non-destructive.
- Save uses dialect-preserving whole-file rewrite.
- Structural diagnostics are emitted as core TextForge diagnostics and shown in-grid where possible.
- Minimal read-only table rendering is included in `WP-TABLES`.
- Semantic diagnostics/catalogues/matrices move to a follow-up `WP-TABLES-02`.

## Scope boundary for WP-TABLES

Included:

- neutral `TableModel`;
- CSV/TSV import/export;
- AG Grid Community grid adapter;
- editable and read-only CSV/TSV grid modes;
- explicit grid open action while preserving text editor default;
- workspace/resource dirty-save integration;
- parser and structural diagnostics;
- minimal read-only renderer;
- contribution registration;
- broad CSV/TSV fixture tests.

Excluded:

- full semantic tables;
- TanStack Table;
- formula execution;
- spreadsheet engine behavior;
- byte-for-byte minimal-diff preservation;
- settings-backed thresholds;
- schema/value validation;
- persistent table view state;
- custom advanced spreadsheet clipboard compatibility.

## Follow-up WP-TABLES-02 scope

`WP-TABLES-02` should cover:

- shared semantic table rendering;
- TanStack Table for diagnostics, catalogues, and matrices;
- migration of ITM table views to `@textforge/tables`;
- CSV/TSV export for diagnostics, catalogues, matrices, and semantic views;
- avoiding duplicate table rendering/export logic in ITM, Markdown, diagnostics, and future EA modules.

## Full Q&A trace

### Question 1 - Primary first-use case

Options considered:

- A: diagnostic tables first;
- B: CSV/TSV editor first;
- C: semantic catalogues/matrices first.

Selected: **B - CSV/TSV editor first**.

Rationale: diagnostics and semantic matrices should eventually be exportable to CSV/TSV rather than hidden as internal formats. CSV/TSV enables analysis in external tools.

Consequence: `WP-TABLES` is editor-first while keeping export and semantic table pathways open.

### Question 2 - Editable from day one or preview/export first

Selected: **editor-capable surface with read-only mode**.

Rationale: read-only should be a mode of the same editor-capable surface, like CodeMirror text surfaces.

Consequence: generated diagnostics/catalogues/matrices can later use read-only table surfaces without becoming editable canonical data.

### Question 3 - Default grid library

Selected: **AG Grid Community only for editable CSV/TSV grid surfaces**.

Rationale: AG Grid Community is the best established fit for editable CSV/TSV grid behavior. It should not become the default table renderer for all tables.

Consequence: TextForge uses three table levels:

1. static report tables via Markdown/HTML;
2. semantic interactive tables later via TanStack Table;
3. editable grid tables via AG Grid Community.

### Question 4 - Canonical data model

Selected: **structured table model**, revised to row-oriented storage.

Rationale: initial columnar storage looked attractive for search/filtering, but Papa Parse and AG Grid operate naturally with rows/records. Canonical row orientation avoids constant conversion.

Consequence: columnar indexes may be derived lazily, but the canonical `TableModel` is row-oriented with explicit column definitions.

### Question 5 - Preserve raw text exactly or normalize on save

Selected: **preserve by default with explicit normalize/export action**, later refined by Question 9.

Rationale: TextForge should be safe as an editor and should not unexpectedly normalize files unless requested.

Consequence: dialect and semantics are preserved first; exact byte-for-byte preservation is not promised.

### Question 6 - CSV/TSV parser/writer

Selected: **Papa Parse**.

Rationale: CSV edge cases are easy to get wrong. Papa Parse is mature and browser-friendly.

Consequence: Papa Parse is wrapped behind `@textforge/tables` contracts and not exposed to callers.

### Question 7 - Header handling

Selected: **auto-detect with explicit override**.

Rationale: CSV/TSV files vary; some have headers and some are headerless.

Consequence: table metadata records header mode, and generated headers remain distinguishable from real source headers.

### Question 8 - Delimiters and quoting

Selected: **auto-detect with override**.

Rationale: comma, tab, semicolon, and other delimiters are common. Semicolon CSV is especially relevant in European workflows.

Consequence: metadata stores delimiter, quote, escape, newline, and detection state.

### Question 9 - Save behavior

Selected: **dialect-preserving whole-file rewrite first**.

Rationale: full minimal-diff preservation is too complex for v1. After the first save, TextForge serialization becomes stable and predictable.

Consequence: first save may rewrite untouched formatting, but delimiter/newline/header mode and table semantics are preserved.

### Question 10 - Cell typing

Selected: **raw strings canonical, typed values derived**.

Rationale: CSV/TSV is text. TextForge must not corrupt IDs, leading zeros, dates, booleans, or large numbers.

Consequence: derived typed values may support sorting/filtering/display, but save uses raw strings.

### Question 11 - Validation

Selected: **structural validation first, schema-ready**.

Rationale: structural validation is essential for trustworthy editing; schema validation should be possible later.

Consequence: first implementation validates structure and parse issues, while table contracts can later carry schema metadata.

### Question 12 - Workspace write-back

Selected: **table surface emits serialized content; workspace/resource layer persists it**.

Rationale: `@textforge/tables` should not own filesystem or workspace persistence.

Consequence: tables own parse/edit/serialize; workspace/resources own save/write.

### Question 13 - Table capabilities exposed in WP-TABLES

Selected: **CSV/TSV editor plus generic table rendering contract**.

Rationale: CSV/TSV is only one surface. ITM, Markdown, diagnostics, catalogues, and matrices should later use shared table facilities.

Consequence: `WP-TABLES` creates real contracts now, while full semantic table migration is deferred to `WP-TABLES-02`.

### Question 14 - User-visible entry points

Selected: **CSV/TSV opens as text by default, like Markdown; grid is explicit**.

Rationale: CSV/TSV remains plain text and should remain inspectable/editable as text.

Consequence: grid mode is available through context menu/open-with/surface switching, not automatic default replacement.

### Question 15 - Export action ownership

Selected: **source modules produce `TableModel`; `@textforge/tables` owns CSV/TSV export**.

Rationale: source modules own semantics; table package should prevent repeated export logic.

Consequence: ITM/Markdown/diagnostics can generate table models and delegate serialization/export.

### Question 16 - Undo/redo

Selected: **TextForge dirty/save integration plus AG Grid-local cell undo where available**.

Rationale: unified cross-surface undo is too complex for this WP.

Consequence: grid edits mark the resource dirty and save normally; local grid undo may remain inside the grid surface.

### Question 17 - Same file as text and grid

Selected: **one active surface at a time**, matching existing TextForge behavior.

Rationale: TextForge already uses one active surface at a time.

Consequence: switching to grid parses current text; switching back serializes current grid content.

### Question 18 - Unsaved/new resources

Selected: **saved files plus untitled resources whose language is `csv` or `tsv`**.

Rationale: TextForge language identity is not only file extension.

Consequence: arbitrary text does not show grid mode unless classified as CSV/TSV.

### Question 19 - Large files

Selected: **size limits with clear diagnostics**.

Rationale: AG Grid can virtualize rendering, but full parse/model memory still matters. Streaming editing is a separate feature.

Consequence: text mode remains available when grid mode warns or blocks.

### Question 20 - Initial size policy

Selected: **conservative default constants**.

Rationale: TextForge has no settings/configuration surface yet.

Consequence: use fixed thresholds now; move to configurable limits after the future settings WP.

### Question 21 - Formulas

Selected: **preserve formula-looking text but do not evaluate**.

Rationale: TextForge should not become a spreadsheet engine.

Consequence: formula-looking cells remain strings.

### Question 22 - Dangerous CSV formulas on export

Selected: **export exactly as stored**.

Rationale: TextForge preserves data and does not silently mutate or warn in this WP.

Consequence: importing spreadsheet tools remain responsible for formula behavior.

### Question 23 - Copy/paste

Selected: **basic browser/grid copy-paste only, with opportunistic AG Grid support if easy**.

Rationale: do not build custom spreadsheet clipboard normalization in this WP.

Consequence: advanced Excel/LibreOffice/Google Sheets clipboard compatibility is deferred.

### Question 24 - Row/column structure edits

Selected: **basic row/column operations**.

Rationale: CSV/TSV editing is incomplete without basic structure editing.

Consequence: support add/delete rows, add/delete columns, and rename headers; no full spreadsheet feature set.

### Question 25 - Sorting/filtering persistence

Selected: **UI-only by default; persistent row reordering requires explicit later action**.

Rationale: accidental row reordering is dangerous.

Consequence: sorting/filtering does not change saved file order.

### Question 26 - Column resizing/visibility persistence

Selected: **session-only persistence**.

Rationale: persistent view state needs a broader TextForge decision.

Consequence: layout resets when reopening the resource.

### Question 27 - Table diagnostics surface

Selected: **both core diagnostics and grid-local feedback**.

Rationale: TextForge diagnostics are needed for integration, but grid users need feedback in context.

Consequence: no hidden separate diagnostics system inside `@textforge/tables`.

### Question 28 - Initial diagnostic coverage

Selected: **parser plus structural diagnostics**.

Rationale: schema diagnostics are future work; generic CSV/TSV reliability comes first.

Consequence: cover parser errors, ragged rows, duplicate/empty headers, dialect/header issues, and size limits.

### Question 29 - Comments or metadata outside the table

Selected: **no**.

Rationale: generic CSV/TSV has no universal comment syntax.

Consequence: CSV/TSV is treated as pure tabular data.

### Question 30 - Malformed files in grid mode

Selected: **block grid mode on serious parse errors**.

Rationale: editable grid mode should not silently corrupt malformed files.

Consequence: text mode remains the recovery surface.

### Question 31 - Live validation

Selected: **live structural validation while editing**.

Rationale: row/column/header edits can immediately create structural problems.

Consequence: validate on open, during affected edits, and before save.

### Question 32 - Tests

Selected: **broad fixture-based parser/export tests**.

Rationale: CSV/TSV edge cases are where assumptions fail.

Consequence: include delimiter, quoting, embedded newline, duplicate/empty header, ragged row, formula-looking, dialect-preserving, and limit fixtures.

### Question 33 - Create WP-TABLES-02 now

Selected: **add explicit follow-up WP stub**.

Rationale: identified semantic table scope should not be lost.

Consequence: `WP-TABLES-02` captures shared semantic table rendering and export scope.

### Question 34 - AG Grid licensing posture

Selected: **accept AG Grid Community directly and isolate it behind contracts**.

Rationale: use Community features only; keep implementation swappable.

Consequence: document Community-only boundary and avoid Enterprise features.

### Question 35 - AG Grid theming/styling

Selected: **wrap AG Grid with TextForge UI styling tokens only**.

Rationale: keep visual consistency without exposing AG Grid styling APIs.

Consequence: callers do not configure AG Grid themes directly.

### Question 36 - Reusable read-only table component

Selected: **minimal read-only renderer using the same `TableModel`**.

Rationale: the generic table contract should be real, not theoretical.

Consequence: full TanStack semantic tables wait for `WP-TABLES-02`.

### Question 37 - Sorting/filtering in minimal renderer

Selected: **no sorting/filtering**.

Rationale: avoid creating a second table framework.

Consequence: sorting/filtering belongs to AG Grid for CSV/TSV and TanStack in `WP-TABLES-02`.

### Question 38 - Package organization

Selected: **one package, internally layered**.

Rationale: repository already has `packages/tables`; splitting now adds overhead.

Consequence: public exports stay clean while internals isolate contracts/csv/grid/render/diagnostics/export.

### Question 39 - Contribution system

Selected: **register table surfaces as normal TextForge contributions**.

Rationale: matches modular architecture and open-with behavior.

Consequence: no hardwiring except normal package registration/composition.

### Question 40 - Done boundary

Selected: **usable CSV/TSV grid editor plus shared table contract**.

Rationale: gives complete user value while deferring semantic table migration.

Consequence: work is done when CSV/TSV grid editing and shared table contract are usable.

### Question 41 - Capture artifacts

Selected: **workpackage update, ADR, and grilling report**.

Rationale: implementation scope belongs in the WP; durable library/architecture choices belong in ADR; the grilling trail must be preserved.

Consequence: create/update WP, ADR, attachment report, follow-up WP, RAPID, and registry references where safe.

### Question 42 - Grilling report placement

Selected: **ADR attachment**.

Rationale: the grilling produced durable architecture decisions and should live beside the ADR rather than as a workpackage-only sidecar.

Consequence: store as `roadmap/decisions/ADR-0013-attachments/wp-tables-grilling-report.md`.

### Question 43 - Report content

Selected: **hybrid: decision summary plus full Q&A trace**.

Rationale: implementers need a compact summary; future reviewers need the detailed ambiguity-removal trail.

Consequence: this attachment contains both.

### Question 44 - Stop grilling

Selected: **stop and prepare implementation artifacts**.

Rationale: enough decisions were made to unblock the workpackage.

Consequence: remaining details are implementer-level design to be captured in WP/ADR/evidence rather than more interview questions.

## Deferred and open items

- Exact AG Grid React package/import strategy.
- Exact `TableModel` export layout.
- Exact conservative size constants.
- Advanced spreadsheet clipboard compatibility.
- Persistent table view state.
- Schema/value validation.
- Settings-backed grid thresholds after the settings/configuration WP.
- First semantic table migration target for `WP-TABLES-02`.
