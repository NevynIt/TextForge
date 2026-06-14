# WP-SOURCE-EDITOR-01 - Mature CodeMirror source editor authoring

## Automated Validation

| ID | Criterion | Method | Status | Evidence |
|---|---|---|---|---|
| AC-001 | Tab inserts spaces and never raw tab characters | Test | Passed | `packages/editors/test/index.test.js` |
| AC-002 | Tab and Shift+Tab follow two-space indentation policy | Test | Passed | `packages/editors/test/index.test.js` |
| AC-003 | Enter preserves current line indentation | Test | Passed | `packages/editors/test/index.test.js` |
| AC-004 | Duplicate and delete line commands handle cursor and selected-line cases | Test | Passed | `packages/editors/test/index.test.js` |
| AC-005 | Move line up/down is safe at normal positions and file boundaries | Test | Passed | `packages/editors/test/index.test.js` |
| AC-006 | Select-next-occurrence adds another selection | Test | Passed | `packages/editors/test/index.test.js` |
| AC-007 | Go-to-line helper resolves valid input and safely clamps or rejects invalid input | Test | Passed | `packages/editors/test/index.test.js` |
| AC-008 | Editor commands are contributed and scoped to CodeMirror text editor surfaces | Test | Passed | `packages/editors/test/index.test.js` |

## Manual UI Validation

| ID | Criterion | Method | Status | Evidence |
|---|---|---|---|---|
| UI-001 | `Ctrl+Z` and `Ctrl+Y` work in the browser editor | Manual | Pending | User verification requested |
| UI-002 | Brackets and quotes auto-close, and matching brackets are highlighted | Manual | Pending | User verification requested |
| UI-003 | Current line and current gutter are visibly highlighted | Manual | Pending | User verification requested |
| UI-004 | Tab and Shift+Tab behave correctly in leading whitespace, normal text, and selected blocks | Manual | Pending | User verification requested |
| UI-005 | Line duplicate/delete/move/select shortcuts work in text and ITM documents | Manual | Pending | User verification requested |
| UI-006 | `Ctrl+G`, `Ctrl+D`, and `Ctrl+Shift+L` work without inserting unwanted characters | Manual | Pending | User verification requested |
| UI-007 | `Ctrl+/` comments only where the active language supports comments | Manual | Pending | User verification requested |
| UI-008 | Whitespace marks and indentation guides are visible but not visually heavy | Manual | Pending | User verification requested |
