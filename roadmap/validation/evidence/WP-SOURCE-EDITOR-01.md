# WP-SOURCE-EDITOR-01 Evidence

## Status

Implementation evidence in progress.

## Automated Checks

| Command | Result | Notes |
|---|---|---|
| `corepack pnpm --filter @textforge/editors test` | Passed | 16 editor tests passed. |
| `corepack pnpm --filter @textforge/editors lint` | Passed | Editors package checks passed. |
| `corepack pnpm --filter @textforge/editors build` | Passed | `node --check src/index.js` passed. |
| `corepack pnpm --filter @textforge/textforge-web lint` | Passed | Web shell checks passed after command bridge wiring. |

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
