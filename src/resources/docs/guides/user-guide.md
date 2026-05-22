# TextForge User Manual

## 1. Start With The Workspace

TextForge is easiest to understand if you begin with the workspace tree, then move into the editor and viewers.

1. Open the app.
2. Select a folder in the workspace tree.
3. Create a file or import one into that folder.
4. Give it the right language.
5. Edit the text directly.

The editor is the source of truth. Every tree, graph, rendered page, SVG, or transformed output is derived from text and can be regenerated from it.

Useful basics:

- keep many files in the workspace without opening them all at once;
- open multiple documents at once;
- rename files in place;
- move or copy bundled resources into normal workspace folders when you want editable starting points;
- drag tabs to reorder them;
- switch languages for the current document;
- import files by picker;
- import ZIP archives into the selected folder;
- export the active file, a selected folder, or the whole workspace;
- distinguish open documents by their deterministic Shapez-style badges.

The workspace is private to TextForge and stored in IndexedDB. It is not a live mirror of a local folder. Files only cross the local filesystem boundary through explicit import and export actions.

## 2. Use The Built-In Resources

Open `/.textforge/resources` in the workspace tree to explore bundled documentation and examples.

It includes:

- quick-start examples;
- format references;
- the Lua tutorial;
- the project README;
- the executive summary;
- test and design notes.

Resources are read-only. View them directly when you only need reference material. Copy them into `/docs`, `/examples`, or another editable folder when you want to modify them. Markdown resources can be sent directly to the HTML viewer from the workspace explorer.

## 3. Render Markdown And Technical Notes

Markdown is one of the fastest ways to see the "text first, visual second" model.

TextForge can render Markdown with:

- headings and folding;
- syntax-highlighted code blocks;
- Mermaid diagrams;
- Graphviz diagrams;
- KaTeX math;
- embedded artifact controls for copy, download, pop-out, and reset.

A good first exercise is to open the bundled Markdown examples and render them. Then pop the result into its own viewer window, search inside it, and use the embedded artifact controls to inspect diagrams without leaving the source document.

## 4. Work With ITM Models

Indented Text Model (ITM) is where TextForge becomes more exploratory.

ITM supports:

- hierarchy through indentation;
- ids, tags, attributes, and links;
- `%style` directives, including multiline blocks;
- current workspace-aware include resolution for shared ITM files;
- tree, mind map, Cytoscape, and Sigma projections.

The tree viewer is a good bridge between text and structure.

Useful interactions:

- click a node to inspect it;
- Ctrl-click a node to jump back to the source text;
- Ctrl-click a cross-link badge to jump to the linked source location instead of only selecting the target node;
- use the fold and unfold controls to manage large trees;
- enable inline details when you want the tree to read more like a structured outline.

## 5. Follow Source Between Text And Visuals

The editor and several viewers keep each other aligned:

- selecting text can update the current visual selection;
- selecting a visual node can highlight the owning source range;
- viewer popups can be set to Follow source;
- source-aware refresh keeps popups current when the underlying document changes.

Viewer popups also support search, zoom, export, detached snapshot windows, and layout shortcuts, so you can keep several synchronized views open without turning the editor into a canvas tool.

## 6. Explore Graphs Interactively

Graph exploration is one of the strongest reasons to use TextForge.

You can open graph-shaped data in:

- Cytoscape for rich graph interaction and layout reruns;
- Sigma/Graphology for large graph navigation and focused filtering;
- SVG when the result is better treated as a diagram artifact.

Useful graph features include search, layout controls, optional labels, Sigma filtering to matches, Sigma neighbor focusing, and pan/zoom support in graph and SVG surfaces.

## 7. Use JSON, XML, CSV, And BPMN

TextForge is not only for Markdown and ITM.

Current built-in actions also cover:

- JSON to tree viewing with JSON diagnostics;
- XML to tree viewing with XML diagnostics;
- delimited text to table viewing for `.csv`, `.tsv`, and `.tab` files;
- BPMN 2.0 XML to either a BPMN diagram viewer or an SVG viewer.

## 8. Run Pipelines And Inspect The Trace

Pipelines connect parsers, transforms, viewers, and serializers by contract.

Use pipelines when you want to:

- turn ITM into a graph or tree;
- render Markdown or diagrams;
- produce SVG, HTML, or text output;
- inspect intermediate values in the trace popup;
- open a trace step as a new editable document when that output is text;
- store generated workspace output under `/generated/...`.

When something looks wrong, the trace is often the quickest way to see whether the issue is in parsing, transformation, or final rendering.

## 9. Automate With Lua

TextForge uses Lua for user extensibility because it is easier to sandbox than arbitrary browser JavaScript.

Typical Lua tasks:

- parse the current ITM or Markdown document;
- parse delimited text into a table model;
- walk trees and graphs;
- filter nodes and edges;
- compose built-in pipeline steps;
- emit new text, JSON, ITM, or CSV documents;
- register saved named actions from `/.textforge/automation/lua/`.

Ordinary `.lua` files are inert by default. A Lua file anywhere in the workspace can still be run manually when open, but auto-loaded actions only come from the dedicated automation root. Lua can also `require()` workspace-local libraries from the active script folder, `/lua`, `/lib`, and the automation root without accessing the real filesystem.

Lua runs with explicit limits on execution time, instructions, output size, recursion depth, and model/table size.

## 10. Use The Lua Console For Fast Experiments

The Lua Console is a lightweight local command surface powered by xterm.js.

It is useful for:

- running quick snippets;
- running the active Lua document;
- running only the selected Lua text;
- listing registered Lua actions;
- executing built-in pipeline bridges;
- opening the previous result as a generated workspace file.

## 11. Manage Internal Plugins And Pipelines

The Plugin Manager is for packaged TextForge plugins, not end-user JavaScript uploads.

Use it to:

- see which internal plugin packs are available;
- enable autoload for the packs you want every session;
- disable individual shipped pipelines when you want a narrower action list;
- review and acknowledge plugin diagnostics.

This manager is about trusted packaged functionality. End-user automation still lives in workspace Lua files rather than uploaded JavaScript plugins.

## 12. Practical Learning Path

If you want a smooth ramp instead of exploring everything at once, use this order:

1. Create or import a Markdown file.
2. Open `/.textforge/resources` and copy a bundled example.
3. Render Markdown with diagrams or math.
4. Open an ITM example in the tree viewer.
5. Try Ctrl-click and Follow source.
6. Open the same ITM in Sigma and use search plus filtering.
7. Inspect the pipeline trace.
8. Run a small Lua snippet in the console.
9. Promote a Lua script into `/.textforge/automation/lua/`.

## 13. What To Keep In Mind

TextForge works best when you treat it as a workbench for exploration rather than a hidden document database.

- keep the text readable, because every other view depends on it;
- use viewers to inspect and navigate, not to replace the source;
- use filtering and search before trying to read a large graph all at once;
- use Lua for repeatable transformations instead of manual copy-paste;
- use the bundled examples as starting points for your own data.
