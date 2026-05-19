# TextForge User Manual

## 1. Start With Plain Text

TextForge is easiest to understand if you begin with the editor, not the viewers.

1. Open the app.
2. Create a new document or open a local file.
3. Give it the right language.
4. Edit the text directly.

The editor is the source of truth. Every tree, graph, rendered page, SVG, or transformed output is derived from text and can be regenerated from it.

Useful basics:

- open multiple documents at once;
- rename documents in place;
- drag tabs to reorder them;
- switch languages for the current document;
- download the active document back to disk;
- distinguish documents by their deterministic Shapez-style badges.

## 2. Use The Built-In Resources

Open the Resource Browser to explore bundled documentation and examples.

It includes:

- quick-start examples;
- format references;
- the Lua tutorial;
- the project README;
- the executive summary;
- test and design notes.

The resource list is grouped by category. Start by expanding only one group at a time. Open a resource as an editable copy when you want to experiment without changing the original bundled text.

## 3. Render Markdown And Technical Notes

Markdown is one of the fastest ways to see the "text first, visual second" model.

TextForge can render Markdown with:

- headings and folding;
- syntax-highlighted code blocks;
- Mermaid diagrams;
- Graphviz diagrams;
- KaTeX math;
- embedded diagram controls for copy, download, pop-out, and reset.

A good first exercise is to open the bundled Markdown examples and render them. Then pop the result into its own viewer window and search inside it.

## 4. Work With ITM Models

Indented Text Model (ITM) is where TextForge becomes more exploratory.

ITM supports:

- hierarchy through indentation;
- ids, tags, attributes, and links;
- `%style` directives, including multiline blocks;
- `%include` across currently open documents;
- tree, mind map, Cytoscape, and Sigma projections.

The tree viewer is a good bridge between text and structure.

Useful interactions:

- click a node to inspect it;
- Ctrl-click a node to jump back to the source text;
- Ctrl-click a cross-link badge to jump to the linked source location instead of only selecting the target node;
- use the fold and unfold controls to manage large trees;
- enable inline details when you want the tree to read more like a structured outline.

## 5. Follow Source Between Text And Visuals

One of the most useful TextForge features is the source-selection bridge.

The editor and several viewers keep each other aligned:

- selecting text can update the current visual selection;
- selecting a visual node can highlight the owning source range;
- viewer popups can be set to Follow source;
- source-aware refresh keeps popups current when the underlying document changes.

This makes exploration faster because you can move from text to structure and back without losing context.

If you are learning a new document format, keep the editor and a viewer side by side and watch how the visual selection tracks the source.

## 6. Explore Graphs Interactively

Graph exploration is one of the strongest reasons to use TextForge.

You can open graph-shaped data in:

- Cytoscape for rich graph interaction and layout reruns;
- Sigma/Graphology for large graph navigation and focused filtering;
- SVG when the result is better treated as a diagram artifact.

Particularly useful graph features include:

- viewer search;
- layout controls;
- optional labels and edge labels;
- background and presentation controls;
- Sigma filtering to matches;
- Sigma neighbor focusing to reduce visual noise;
- panning and zooming in graph and SVG surfaces.

A good workflow is to search for a concept, filter the Sigma graph to matches, then inspect only the local neighborhood before jumping back to the source text.

## 7. Use Mind Maps And Trees For Reading

Mind maps are useful when you want a presentation-friendly overview of the same ITM source.

TextForge supports:

- fold and unfold for branches;
- fit and center commands;
- cross-links between branches;
- draggable cross-link labels during the current session;
- source-aware selection so the map can still lead you back to the text.

Use the mind map when the shape of the idea matters more than the exact text layout, then return to the tree or source editor for precise edits.

## 8. Run Pipelines And Inspect The Trace

Pipelines connect parsers, transforms, viewers, and serializers by contract.

That matters because a transformation in TextForge is not just a button that changes text. It is a named flow with inspectable steps.

Use pipelines when you want to:

- turn ITM into a graph or tree;
- render Markdown or diagrams;
- produce SVG, HTML, or text output;
- inspect intermediate values in the trace popup;
- open a trace step as a new editable document.

When something looks wrong, the trace is often the quickest way to see whether the issue is in parsing, transformation, or final rendering.

## 9. Automate With Lua

Once the built-in actions are familiar, move to Lua.

TextForge uses Lua for user extensibility because it is easier to sandbox than arbitrary browser JavaScript. Lua runs locally in a restricted Fengari worker with curated TextForge helpers.

Typical Lua tasks:

- parse the current ITM or Markdown document;
- walk trees and graphs;
- filter nodes and edges;
- compose built-in pipeline steps;
- emit new text, JSON, ITM, or CSV documents;
- register saved named actions from open `.lua` files.

The bundled Lua tutorial is the best next stop after this manual.

## 10. Use The Lua Console For Fast Experiments

The Lua Console is a lightweight local command surface powered by xterm.js.

It is useful for:

- running quick snippets;
- running the active Lua document;
- running only the selected Lua text;
- listing registered Lua actions;
- executing built-in pipeline bridges;
- opening the previous result as a new document.

Common shortcuts:

```text
help
actions
run selection
run itm-to-graph
action your-action-id
open run itm-to-graph
open last
```

This is often the fastest way to probe a document, test a transformation idea, or build a custom workflow incrementally.

## 11. Practical Learning Path

If you want a smooth ramp instead of exploring everything at once, use this order:

1. Edit a plain text or Markdown document.
2. Open the Resource Browser and load a bundled example.
3. Render Markdown with diagrams or math.
4. Open an ITM example in the tree viewer.
5. Try Ctrl-click and Follow source.
6. Open the same ITM in Sigma and use search plus filtering.
7. Inspect the pipeline trace.
8. Run a small Lua snippet in the console.
9. Turn that snippet into a saved Lua action.

## 12. What To Keep In Mind

TextForge works best when you treat it as a workbench for exploration rather than a hidden document database.

A few habits make the most of it:

- keep the text readable, because every other view depends on it;
- use viewers to inspect and navigate, not to replace the source;
- use filtering and search before trying to read a large graph all at once;
- use Lua for repeatable transformations instead of manual copy-paste;
- use the bundled examples as starting points for your own data.

When used that way, TextForge becomes a compact local environment for understanding structured text, not just editing it.