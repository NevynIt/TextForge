# WP-TABLES-02 - Shared semantic table rendering and exports

## Registry

- Workpackage ID: `WP-TABLES-02`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-TABLES`
- ADRs: `ADR-0013`
- Predecessor: `WP-TABLES`

## Outcome

TextForge migrates semantic table-like outputs to shared table facilities instead of each source module implementing separate table rendering or CSV/TSV export logic.

This follow-up extends the `@textforge/tables` contract established by `WP-TABLES` from CSV/TSV editing and minimal rendering into interactive semantic table rendering and export workflows.

## Scope

- Introduce TanStack Table for semantic interactive tables.
- Render diagnostics, catalogues, matrices, and semantic review outputs through `@textforge/tables` where appropriate.
- Migrate ITM-generated table views to `@textforge/tables` facilities.
- Allow Markdown/ITM report flows to request semantic table rendering without reinventing table UI.
- Provide CSV/TSV export for diagnostics, catalogues, matrices, and generated semantic views.
- Keep source modules responsible for semantic extraction and `TableModel` production.
- Keep `@textforge/tables` responsible for table rendering/export behavior.
- Preserve AG Grid Community as the editable CSV/TSV grid implementation only.

## Non-goals

- Replacing static Markdown/HTML report tables where static rendering is sufficient.
- Making TanStack Table responsible for editable CSV/TSV grid behavior.
- Building a spreadsheet engine.
- Adding schema-driven table editing unless separately scoped.
- Replacing source-domain ownership of semantic extraction.

## Package Impact

- Primary package: `packages/tables` / `@textforge/tables`.
- Expected dependency: `@tanstack/react-table` for semantic interactive tables.
- Consumers likely include:
  - `@textforge/itm`;
  - `@textforge/markdown`;
  - diagnostics producers;
  - future EA/ArchiMate/BPMN catalogue or matrix outputs.

## Interfaces / Contracts Changed

This workpackage should reuse the `TableModel` and CSV/TSV export contracts from `WP-TABLES`.

It may add semantic table view contracts for:

- sortable/filterable table state;
- column visibility and ordering;
- diagnostic row/cell mapping;
- export action registration;
- generated table provenance;
- read-only semantic interaction.

## Validation Criteria

- At least one ITM-generated table view renders through `@textforge/tables`.
- Diagnostics can be represented as a `TableModel` and exported to CSV/TSV.
- A catalogue or matrix-style generated table can render through the semantic table path.
- TanStack Table use is isolated behind TextForge table contracts.
- AG Grid remains isolated to editable CSV/TSV grid mode.
- Source modules do not duplicate CSV/TSV serialization logic.

## Evidence Required

- Unit tests for semantic table model generation from at least one source module.
- Rendering tests for TanStack-backed semantic table behavior.
- Export tests for diagnostics/catalogue/matrix `TableModel` instances.
- Integration evidence showing ITM or diagnostics output using `@textforge/tables` rather than bespoke table rendering.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- Which semantic source is migrated first: diagnostics, ITM catalogues, ITM matrices, or Markdown-generated tables.
- Whether persistent view state is handled in this WP or waits for a broader view-state/settings workpackage.
- Exact feature boundary for semantic sorting, filtering, grouping, search, and column management.
- Whether schema validation belongs in this WP or a later table/schema workpackage.

## Archive Trace

- Created as a follow-up from `WP-TABLES` grilling.
- See `ADR-0013` and `ADR-0013-attachments/wp-tables-grilling-report.md`.
