# ADR-0017 - Mature CodeMirror authoring surface

## Status

Proposed

## Date

2026-06-14

## Context

TextForge is a local-first, text-first workbench. The source editor is the primary authoring surface for ITM, Markdown, Lua, JSON, XML, YAML, and other text resources.

The existing CodeMirror surface provided syntax highlighting, search, line numbers, folding, and basic selection behavior, but it did not yet provide several expected editor affordances: undo/redo history, standard movement/editing keymaps, bracket matching, auto-closing brackets, visible active-line state, predictable two-space indentation, line manipulation commands, and command-palette access to editor actions.

Users expect TextForge source editing to behave closer to mature editors such as VS Code and Notepad++ while preserving TextForge's package-owned surface architecture and local-only browser security posture.

## Decision

TextForge will centralize mature CodeMirror authoring behavior inside `@textforge/editors`.

The CodeMirror surface remains the mounted editor implementation, but common editor behavior is split into focused helper modules:

- baseline editor behavior and visual extensions;
- indentation and go-to-line helpers;
- editor command IDs, keymaps, command execution, and command target creation.

Editor actions must be exposed through TextForge command contributions when they are durable user-facing commands. CodeMirror keymaps may remain local to the editor for text-input handling, but command-palette and menu invocation must route through the existing TextForge command dispatcher.

The editor will use official CodeMirror packages first. Custom behavior is limited to TextForge-specific indentation policy, command bridging, and small testable helpers where official commands need a stable package-owned wrapper.

The editor indentation policy is fixed at two spaces for this workpackage. Settings-backed editor preferences, including a persistent whitespace visibility toggle, remain deferred until the settings workpackages provide a stable settings contract.

## Consequences

### Positive

- Source editing gains expected history, bracket, indentation, line manipulation, and multi-selection commands.
- ITM authoring benefits from two-space indentation, line duplication/movement, and local comment toggling.
- The command palette can invoke editor actions without bypassing the TextForge command abstraction.
- Pure helper modules can be tested without headless browser UI checks.
- The local-only browser posture is preserved because the implementation adds no network, eval, or host access.

### Negative / trade-offs

- The editor package owns more CodeMirror-specific integration code.
- Some commands must be wrapped to keep them testable outside a browser view.
- Editor settings remain fixed defaults until `WP-SET-01` and `WP-SET-UI` provide a durable settings surface.
- Manual UI verification is still required for visual affordances and keyboard capture in the browser.

### Follow-up required

- Revisit whitespace visibility and indentation guide preferences when settings are implemented.
- Keep command coverage aligned with future source editor actions.
- Add browser/manual evidence from user validation because this repository avoids headless browser UI checks.

## Applies to

- Modules: `MOD-SURFACES-UI`
- Workpackages: `WP-SOURCE-EDITOR-01`
- Releases: `R-LOCAL-AUTHORING-MVP`

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
