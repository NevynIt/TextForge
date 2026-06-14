# WP-SOURCE-EDITOR-01 - Mature CodeMirror source editor authoring

## Metadata

- Status: implemented
- Module: `MOD-SURFACES-UI`
- Type: Feature / authoring UX
- Depends on: `WP-05A`, `WP-05B`, `WP-05C`
- Enables: `WP-ITM-01`, `WP-ITM-02`, `WP-LUA`
- Release candidates: `R-LOCAL-AUTHORING-MVP`
- Production required: true
- Deferrable: false
- Owner packages: `@textforge/editors`, `@textforge/textforge-web`
- Archive trace: `roadmap/decisions/ADR-0017-mature-codemirror-authoring-surface.md`

## Outcome

TextForge source editing behaves more like a mature editor for local text authoring, with particular emphasis on ITM authoring.

## Scope

- Add standard CodeMirror history, keymap, bracket, active-line, whitespace, and indentation-guide behavior.
- Enforce two-space indentation and prevent Tab from inserting raw tab characters.
- Add VS Code-style editor commands for line manipulation, selection expansion, indentation, comments, and go-to-line.
- Expose editor commands through TextForge command contributions and route them through active mounted editor sessions.

## Non-goals

- Persistent editor settings or user preferences.
- Headless browser UI tests.
- External editor service integration.
- New network, backend, or host filesystem capabilities.

## Package impact

- `@textforge/editors` owns CodeMirror behavior modules, command contributions, tests, and the direct CodeMirror autocomplete dependency.
- `@textforge/textforge-web` routes TextForge command execution to mounted editor command targets.

## Interfaces / contracts changed

- Adds TextForge command IDs under `editor.*` for undo, redo, delete/move/duplicate line, go-to-line, occurrence selection, line selection, indentation, and comment toggling.
- Adds a mounted editor command-target bridge from the workbench to active CodeMirror sessions.

## Validation criteria

- Editor package tests cover indentation helpers, line commands, selection occurrence behavior, go-to-line resolution, and command contribution scoping.
- Editor package lint/build checks pass.
- Repository lint, typecheck, test, and build commands pass or any limitation is recorded in evidence.
- Manual UI validation is requested for visual and keyboard behavior.

## Evidence required

- `roadmap/validation/evidence/WP-SOURCE-EDITOR-01.md`
- Package and repository command output summaries.
- Manual UI checklist results from the user.

## Open decisions

- Settings-backed whitespace visualization and editor preferences are deferred to settings workpackages.

## Notes

- Governed by `ADR-0017`.
