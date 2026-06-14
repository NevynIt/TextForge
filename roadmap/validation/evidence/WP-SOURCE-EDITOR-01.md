# WP-SOURCE-EDITOR-01 Evidence

## Status

Implemented and automated validation passed. Browser UI validation is intentionally manual per repository guidance.

## Automated Checks

| Command | Result | Notes |
|---|---|---|
| `corepack pnpm --filter @textforge/editors test` | Passed | 16 editor tests passed. |
| `corepack pnpm --filter @textforge/editors lint` | Passed | Editors package checks passed. |
| `corepack pnpm --filter @textforge/editors build` | Passed | `node --check src/index.js` passed. |
| `corepack pnpm --filter @textforge/textforge-web lint` | Passed | Web shell checks passed after command bridge wiring. |
| `corepack pnpm lint` | Passed | Workspace lint passed across 22 projects. |
| `corepack pnpm typecheck` | Passed | Workspace typecheck passed across 22 projects. |
| `corepack pnpm test` | Passed | Workspace tests passed; editor package reported 16 passing tests. |
| `corepack pnpm build` | Passed | Workspace build completed, including web dist, single-file, small single-file, and zip artifacts. Vite reported existing upstream browser externalization/import.meta warnings. |
| `node roadmap/scripts/generate-views.mjs` | Passed | Regenerated roadmap status views after adding the workpackage and ADR. |
| `corepack pnpm roadmap:dependency-map:check` | Passed | Dependency-map validation passed. |
| `corepack pnpm roadmap:dependency-map:publish:check` | Passed | Published dependency-map documentation matched generated output after regeneration. |

## Manual UI Checks Requested

The repository guidance says not to use headless browser UI checks here. Manual validation should open a text or ITM document and verify:

- `Ctrl+Z` and `Ctrl+Y`.
- bracket and quote auto-close plus matching bracket highlight.
- active line and active gutter highlight.
- Tab and Shift+Tab behavior in leading whitespace, normal text, and selected blocks.
- line duplicate, delete, move, and select shortcuts.
- `Ctrl+G`, `Ctrl+D`, and `Ctrl+Shift+L`.
- `Ctrl+/` only where the active language supports comments.
- whitespace marks and indentation guides are visible but not visually heavy.
