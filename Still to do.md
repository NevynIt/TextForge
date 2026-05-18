# Still to do

Yes. Quick recap from the latter half of `textforge_lua_pivot_whitepaper.md`:

**Clearly Still Missing**
- **Exact Shapez badge implementation**: current badges are still approximate, old palette, `32x32` geometry, no reusable `shapezBadges.ts`, no uniqueness repair on restore/batch upload, and no badge identity tests.
- **Generic ITT multiline directives**: parser still has `%style`-specific multiline handling; `%view { ... }` and unknown multiline `%foo { ... }` are not generally consumed.
- **ITT CodeMirror folding**: no `foldService`, no editor fold/unfold-all buttons for ITT source, no folding for directive/detail blocks.
- **Window layout hover delay**: menu still closes immediately on `onMouseLeave`; whitepaper asked for a 300-400 ms delayed close.
- **Markdown diagram source/view bridge**: source/view selection works for tree/mindmap/graph viewers, but not for Markdown embedded diagrams/code blocks.
- **Exhaustive Lua security tests**: some are covered, but not the full list from section 13.1: `WebSocket`, `localStorage`, `indexedDB`, `importScripts`, `Function`, `eval`, `require "io"`, and `os.execute(...)`.
- **Badge identity tests**: missing parser/SVG/uniqueness/restore/batch upload tests.
- **Browser-level no-network manual/automated verification**: build/source checks exist, but no browser network-panel style automated smoke.

**Partially Done**
- **Markdown embedded artifacts**: Mermaid, Graphviz, KaTeX, highlighting, toolbar, export/popout exist, but toolbar polish is still text-heavy and test coverage is thin.
- **SVG infinite-canvas behavior**: implemented enough to work, but it probably deserves a focused browser smoke across standalone SVG and Markdown popout.
- **Lua docs/tutorials**: tutorial exists, but no separate Lua Console tutorial doc yet.
- **Lua storage model**: Lua actions are generated from open `.lua` documents and workspace persistence, but there is not a dedicated saved snippets/actions registry in settings/local storage.
- **Worker isolation**: normal hosted mode uses worker, but `file://` still falls back in-process because module workers are awkward from disk.

**Mostly Done**
- Resource browser/docs/examples.
- Manual test plan and future-features docs.
- Markdown heading fold/unfold.
- Mindmap cross-link geometry/labels.
- Source/view bridge for tree, mindmap, Cytoscape, Sigma.
- Lua diagnostics, timeout/model validation, action composition contracts, recursion limit tests.
- Built-output security verification.