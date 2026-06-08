# WP-RES-TYPE-OVERRIDE - Workspace resource type overrides

## Registry

- Workpackage ID: `WP-RES-TYPE-OVERRIDE`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-WORKSPACE-RESOURCES`
- ADRs: `ADR-0001`

## Outcome

Users can change the effective type of a text-backed workspace resource after creation or import so file associations, editor modes, and open-with routing update without renaming the workspace path.

## Scope

- Add a resource-level file type control for text-backed resources in the inspector controls area.
- Persist metadata-only `languageId` and `mimeType` changes for writable workspace-local resources.
- Support open-session-only type overrides for read-only provider resources without writing provider state.
- Refresh surface routing and editor metadata from the effective type.

## Non-goals

- Renaming files or changing path extensions during type changes.
- Byte-backed MIME retagging.
- Text/bytes content conversion.
- Replacing semantic validation owned by Markdown, BPMN, ITM, tables, or other domain packages.

## Package Impact

- `@textforge/core`: shared language/type option source remains canonical.
- `@textforge/workspace`: persists writable text resource metadata through existing resource records.
- `@textforge/editors`: editor mode control becomes part of the resource-level type flow.
- `@textforge/textforge-web`: inspector control, transient read-only overrides, and routing refresh.

## Interfaces / Contracts Changed

- Text resource type means `languageId` plus canonical `mimeType`.
- Writable type changes use existing workspace save contracts.
- Read-only overrides are runtime/session state only and are excluded from workspace persistence.

## Validation Criteria

- New text files can be retagged to Markdown, BPMN XML, CSV/TSV, Mermaid, SVG, YAML, and other registered text language definitions.
- Retagging does not rename the resource path.
- Open-with candidates, editor language mode, and inspector metadata reflect the effective type after change.
- Read-only provider type overrides affect only the open session and reset on close or reload.
- Automated package tests pass; browser UI validation remains manual.

## Evidence Required

- Focused tests for `@textforge/workspace`, `@textforge/editors`, and `@textforge/textforge-web`.
- Updated validation evidence after automated checks and manual UI confirmation.
- RAPID entries for implementation start and automated validation completion.

## Open Decisions

- Binary MIME retagging is deferred to a later resource-provider slice.

## Notes

- Repository guidance says not to use headless browser UI checks here; manual UI validation is required for final validation.
