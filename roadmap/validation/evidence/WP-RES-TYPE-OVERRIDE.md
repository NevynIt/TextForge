# WP-RES-TYPE-OVERRIDE Evidence

## Automated validation

- `corepack pnpm --filter @textforge/core test` - passed.
- `corepack pnpm --filter @textforge/workspace test` - passed.
- `corepack pnpm --filter @textforge/editors test` - passed.
- `corepack pnpm --filter @textforge/textforge-web test` - passed.
- `corepack pnpm --filter @textforge/core build` - passed.
- `corepack pnpm --filter @textforge/workspace build` - passed.
- `corepack pnpm --filter @textforge/editors build` - passed.
- `corepack pnpm --filter @textforge/textforge-web build:dist` - passed with existing Vite browser-externalization/import-meta warnings; dist checks passed.

## Manual UI validation

Pending user validation per repository guidance. Do not use headless browser UI checks in this repository.

Requested manual checks:

- Create `new-file.txt`, change it to Markdown from the inspector, and confirm the file path remains unchanged while editor/open-with associations update.
- Change the same file to BPMN XML and confirm BPMN viewer routing becomes available.
- Change a text-backed file to CSV or TSV and confirm table surfaces become available.
- Open a bundled read-only text resource, apply a temporary type change, close or reload, and confirm the original provider type returns.

## Notes

- `corepack pnpm roadmap:dependency-map:publish:check` was not included as completed evidence in this implementation commit because `docs/architecture/dependency-map.md` had a pre-existing unstaged generated dependency-map difference outside this workpackage scope.
