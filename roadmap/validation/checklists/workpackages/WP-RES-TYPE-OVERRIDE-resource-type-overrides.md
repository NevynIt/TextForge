# WP-RES-TYPE-OVERRIDE Validation Checklist

## Scope

`WP-RES-TYPE-OVERRIDE` validates metadata-only type changes for text-backed resources on top of the provider-aware descriptor baseline. It must use existing workspace resource metadata rather than a parallel file-association store.

## Required checks

- The file type list is derived from the shared registered text language definitions and maps each option to a canonical MIME type.
- Writable text-backed workspace resources persist `languageId` and `mimeType` changes without renaming the path or changing content.
- Active editor documents and resource refs refresh after a persisted type change.
- Open-with routing and surface candidates use the effective type immediately after a change.
- Read-only provider resources can receive an open-session-only type override that does not call workspace save APIs and does not survive close/reload.
- Byte-backed MIME retagging and text/bytes conversion remain out of scope.
- No headless browser UI checks are used; manual UI validation is requested from the user.

## Validation evidence

- `corepack pnpm --filter @textforge/workspace test`
- `corepack pnpm --filter @textforge/editors test`
- `corepack pnpm --filter @textforge/textforge-web test`
- `corepack pnpm roadmap:dependency-map:publish`
- `corepack pnpm roadmap:dependency-map:publish:check`

## Manual UI validation

- Create a new workspace file and confirm it starts as plain text.
- Change the file type to Markdown from the inspector and confirm editor mode/open-with routing update without renaming the file.
- Change the same file to BPMN XML and confirm BPMN-related open-with routing becomes available.
- Change a text-backed resource to CSV or TSV and confirm table surfaces become available.
- Open a bundled read-only text resource, apply a temporary type change, close or reload, and confirm the original provider type returns.

## Notes

- Final validation should stay pending until manual UI results are recorded.
