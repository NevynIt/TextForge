# @textforge/itm

TextForge workspace package for ITM parsing, composition, serialization, profiles,
and Markdown publication integration. This package vendors the current upstream
`@textforge/itm` runtime and adds TextForge-specific workspace include resolution plus
provider-backed `%repository` / `%include` resolution plus Markdown fence-handler
contributions for `itm` and `itm-pub`.

The current Phase 7 visual slice also exposes public tree, graph, mindmap,
catalogue, matrix, and report projections, plus Graphviz and Mermaid-mindmap
source adapters that downstream packages can consume through the package API.
