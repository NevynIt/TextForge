> Historical note, 2026-05-22: this file is retained as an early design artifact.
> It predates the current private workspace model, bundled `/.textforge/resources` tree, generated workspace outputs, and Lua-first user extensibility surface.
> Use `README.md`, `Still to do.md`, and the bundled docs under `src/resources/docs/` for the current product description.

This project is based on the ideas developed in https://github.com/NevynIt/LocalEdit, but restarting to be simpler and more focused.
When developing, one should look at that repository for inspiration and to understand some of the user iteraction patterns, especially the whitepapers in https://github.com/NevynIt/LocalEdit/tree/master/plans%20and%20features

# LocalEdit Rewrite Concept

A **local-first, extension-compatible, text-centric editor workbench** built around:

```text
text documents
languages
plugins
pipelines
popup viewers/editors/tools
strict no-network security
lazy-loaded capabilities
```

The app edits plain text as the source of truth, but lets plugins provide richer ways to view, explore, transform, and eventually edit that text.

The key simplification:

```text
Core manages documents, plugins, pipelines, popups, and security.
Plugins provide languages, transformations, viewers, editors, and diagnostics.
Plugins do not call each other directly.
Pipelines connect plugin contributions by ID.
```

# Locked-in stack

```text
Preact
  Main UI shell.

CodeMirror 6
  Main text editor.

Plain JavaScript plugin API
  No complex framework-specific plugin model.

Cytoscape
  Primary graph viewer/editor foundation.

Graphology + Sigma
  “Gephi lite” graph exploration.

jsMind or similar
  Tree/mind-map viewer and later editor.

markdown-it
  Markdown rendering.

Mermaid
  Diagram generation from simple text.

Graphviz / Viz.js
  DOT diagram generation from simple text.

SVG
  Common display format for generated diagrams.

IndexedDB / local storage wrapper
  Workspace persistence.

Strict CSP
  No network, no external connections.
```

# Dual hosting model

Same application code should run in two modes:

```text
Local mode
  Open index.html from disk.
  Can load packaged local plugins.
  May allow user-loaded plugins later, with warning.
  Still no network.

Extension mode
  Runs as browser extension page.
  Only packaged/approved plugins.
  No uploaded plugin execution.
  No network.
```

The host adapter should stay small:

```text
resolve local paths
validate plugin paths
validate runtime paths
handle persistence
expose extension-safe capabilities
```

# Popup-first UI model

The main window remains the text editing workbench.

Separate popup windows are used for:

```text
viewers
visual editors
diagnostics
plugin manager
pipeline runner / pipeline trace
```

Each popup must clearly show:

```text
source document name
source document ID
source version
language
pipeline/viewer/editor used
last refreshed time
stale/current status
```

Example popup header:

```text
Viewing: architecture.itm · v12 · Tree Viewer · stale
[Refresh] [Follow source] [Detach] [Close]
```

Staleness rule:

```text
If source document version > popup source version, popup is stale.
```

This keeps popups independent but still traceable.

# Minimal core

## 1. App shell

Preact application with:

```text
toolbar
document tabs
language selector
main CodeMirror editor
status bar
actions menu
popup manager
```

## 2. Document manager

Simple document model:

```js
{
  id,
  fileName,
  languageId,
  text,
  version,
  dirty
}
```

## 3. Language registry

Only broad languages first:

```text
text
text.plain
text.markdown
text.indented-tree
text.json
text.xml
text.csv
text.tsv
text.mermaid
text.graphviz-dot
```

Avoid early dialect proliferation.

Do **not** add things like:

```text
json.openapi
json.table.action-list
json.model-graph.architecture
xml.bpmn
xml.archimate
```

Those can be profiles inside plugin data, not first-class languages yet.

## 4. Plugin registry

One simple API:

```js
registerPlugin({
  id,
  name,
  version,

  languages: [],
  linters: [],
  transformers: [],
  viewers: [],
  editors: [],
  pipelines: []
});
```

## 5. Pipeline runner

Pipeline steps connect contributions by ID:

```js
{
  id: "view-itt-as-tree",
  input: "text.indented-tree",
  steps: [
    "itt-to-tree-model",
    "tree-viewer"
  ]
}
```

Rules:

```text
transformer steps produce text or structured model text
final step is viewer, editor, exporter, or document transform
pipeline runner lazy-loads plugins as needed
```

## 6. Popup manager

Responsible for:

```text
open viewer/editor/tool window
bind popup to document ID/version
send refresh messages
mark stale popups
close popups when source document closes
```

## 7. Viewer host

Provides standard viewer chrome:

```text
zoom in/out
reset zoom
fit to view
pan where relevant
search
refresh
stale indicator
source document label
```

The individual viewer should not reimplement these basics unless necessary.

## 8. Diagnostics service

Diagnostics can come from:

```text
linters
parsers
transformers
viewers
editors
pipeline steps
```

Diagnostics popup should also be source-bound and stale-aware.

## 9. Runtime loader

Lazy-loads heavy libraries only when needed:

```text
Cytoscape only when graph viewer opens
Mermaid only when Mermaid rendering runs
Graphviz only when DOT rendering runs
jsMind only when tree/mind-map viewer opens
Sigma only when Gephi-lite view opens
```

## 10. Security service

One central place for:

```text
path validation
runtime validation
plugin validation
no-network assumptions
CSP-compatible loading
extension/local differences
```

# Standard viewer capabilities

Every viewer should declare its capabilities:

```js
{
  zoom: true,
  pan: true,
  search: true,
  filter: false,
  fold: false,
  inspect: true
}
```

The viewer host renders common controls based on this.

Minimum standard functions:

```text
all viewers
  refresh
  stale/current indicator
  search
  zoom in/out
  reset zoom
  source document identity

visual viewers
  pan
  fit to view

tree viewers
  fold all
  unfold all
  filter by text/tag/type
  select node
  inspect node

graph viewers
  zoom
  pan
  search nodes/edges
  filter by type/tag/link kind
  focus neighborhood
  inspect selected node/edge

table viewers
  search
  filter rows
  sort columns
  freeze header
  column visibility

rich text viewers
  text zoom
  link navigation
  generated diagram zoom/pan
```

# Content families

Instead of many dialects, organize around a few core content families.

## 1. Plain text

Source:

```text
text.plain
```

Viewer/editor:

```text
plain text editor
plain text viewer
```

## 2. Rich text documents

Main source:

```text
text.markdown
```

Concept:

```text
formatted text
links
images/data URIs if allowed
embedded generated diagrams
headings
tables
code blocks
```

Viewer:

```text
Markdown HTML viewer
standard text zoom
search
heading outline
links
diagram zoom/pan for generated SVG blocks
```

Editor:

```text
CodeMirror Markdown editor
later optional rich-ish split editor
```

## 3. Plain text tables

Sources:

```text
text.csv
text.tsv
markdown tables
```

Internal simple table model, but not necessarily a public language:

```js
{
  kind: "table",
  columns: [],
  rows: []
}
```

Viewer:

```text
table viewer
search
sort
filter
column hide/show
sticky header
text zoom
```

Editor:

```text
CSV/TSV text editor
later lightweight grid editor that writes back CSV/TSV
```

## 4. Trees with cross-links

Primary source:

```text
text.indented-tree
```

Concept:

```text
tree first
cross-links layered on top
node labels
node IDs
types
tags
attributes
details/rich text
colors/styles
views
```

Viewer options:

```text
outline tree viewer
mind-map viewer
tree-as-graph viewer
```

Editor options from the start:

```text
text editor remains source of truth
tree/mind-map visual editor can edit tree operations later
```

Important principle:

```text
ITT is not primarily a graph format.
It is a tree format with optional graph overlay.
```

## 5. Graphs

Sources:

```text
ITT cross-link projection
Graphviz DOT
Mermaid flowchart
JSON graph-like data
CSV edge list
```

Viewers:

```text
Cytoscape viewer
Graphology/Sigma “Gephi lite” viewer
```

Standard functions:

```text
zoom
pan
search
filter
layout selector
focus neighborhood
hide/show edge types
inspect node/edge
```

Editor:

```text
simple graph text formats first:
  DOT
  Mermaid
  ITT links

visual editing later:
  drag nodes
  add edge
  change label/type
  write back to simple text representation where safe
```

## 6. Diagrams

Sources:

```text
text.mermaid
text.graphviz-dot
later simple LocalEdit diagram DSL
```

Display:

```text
always as SVG
```

Viewer:

```text
SVG viewer
zoom
pan
search if text nodes available
fit to view
copy/export SVG
```

Editor direction:

```text
text representation remains source of truth
visual diagram editor uses palettes
simplified yEd/BPMN.io-inspired UX
avoid verbose XML-based editing formats
```

So instead of editing BPMN XML, define or use a simple text DSL and generate SVG.

# Minimal first plugin set

## Core built-in

```text
text-core
  plain text language
  basic text editor support

markdown-core
  Markdown language
  Markdown preview
  heading extraction

json-core
  JSON language
  JSON parser/linter
  JSON pretty/compact

xml-core
  XML language
  XML parser/linter
  XML tree projection

csv-core
  CSV/TSV languages
  table parser

itt-core
  Indented Tree Text language
  parser
  linter
  ITT -> tree model
  ITT -> graph model

mermaid-core
  Mermaid language
  Mermaid -> SVG

graphviz-core
  DOT language
  DOT -> SVG
```

## Viewer plugins

```text
html-viewer
  Markdown/rich text HTML display

svg-viewer
  SVG display with zoom/pan/search

table-viewer
  table exploration

tree-viewer
  outline/tree exploration

mindmap-viewer
  jsMind-based ITT/tree exploration

cytoscape-viewer
  graph exploration

sigma-viewer
  Gephi-lite graph exploration
```

## Editor plugins

```text
text-editor
  CodeMirror base editor

markdown-editor
  CodeMirror Markdown support

itt-editor
  CodeMirror ITT support

csv-editor
  CodeMirror CSV/TSV support
  later grid editor

diagram-text-editor
  Mermaid/DOT CodeMirror support

tree-visual-editor
  early simple tree/mind-map editor
  still backed by ITT text

graph-visual-editor
  early simple graph editor
  backed by DOT/Mermaid/ITT where possible

diagram-palette-editor
  later SVG/diagram palette editor
  backed by simple text DSL
```

# First-version pipelines

Keep the first set small.

```text
Markdown -> HTML viewer

Markdown -> heading tree -> tree viewer

CSV/TSV -> table model -> table viewer

JSON -> tree model -> tree viewer

XML -> tree model -> tree viewer

ITT -> tree model -> tree viewer

ITT -> tree model -> mind-map viewer

ITT -> graph model -> Cytoscape viewer

ITT -> graph model -> Sigma viewer

Mermaid -> SVG -> SVG viewer

Graphviz DOT -> SVG -> SVG viewer

Graphviz DOT -> graph model -> Cytoscape/Sigma viewer
```

# Plugin loading principle

Dynamic plugin loading is important, especially for pipelines.

Keep it simple:

```text
Plugins are local JS files.
A manifest lists known packaged plugins.
Plugin metadata declares contributions.
Pipeline execution can request missing plugins.
Heavy runtime libraries are lazy-loaded by the plugin that owns them.
```

No plugin should hard-code another plugin’s runtime path.

Pipeline availability should show:

```text
available
missing plugin
missing contribution
disabled plugin
runtime failed
```

# Security posture

Security remains a design constraint, not an afterthought.

```text
no network
no connect-src
no remote plugin URLs
no remote scripts
no remote images except data/blob/self
no plugin access to arbitrary browser APIs
extension mode only loads packaged plugins
local mode may optionally load user plugins later
plugins cannot exfiltrate unless the core grants a channel, which it should not
```

Default CSP direction:

```text
default-src 'self' blob: data:
script-src 'self' blob: 'wasm-unsafe-eval'
style-src 'self' 'unsafe-inline'
img-src 'self' blob: data:
font-src 'self' data:
connect-src 'none'
object-src 'none'
base-uri 'none'
form-action 'none'
```

# Version 1 target

Build only this first:

```text
Preact app shell
CodeMirror editor
multi-document tabs
language selector
plugin manifest
plugin registry
pipeline runner
lazy runtime loader
popup manager
viewer host with standard controls
diagnostics popup
plugin manager popup
```

With these initial languages:

```text
plain text
Markdown
ITT
JSON
XML
CSV/TSV
Mermaid
Graphviz DOT
```

With these initial viewers:

```text
HTML/rich text viewer
SVG viewer
table viewer
tree viewer
mind-map viewer
Cytoscape graph viewer
Sigma/Graphology graph viewer
```

With these initial editors:

```text
CodeMirror text editor for all languages
Markdown syntax support
ITT syntax support
CSV/TSV syntax support
Mermaid syntax support
DOT syntax support
basic visual tree/mind-map editor skeleton
basic graph editor skeleton
```

The short version of the architecture is:

```text
Preact shell.
CodeMirror text source.
Popup-based viewers/editors/tools.
Small plugin API.
Lazy-loaded local plugins.
Pipelines connect everything.
No network.
No plugin globals.
No early dialect explosion.
```

That is a much cleaner reset without becoming too abstract too soon.
