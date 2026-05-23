# ITM Markdown Integration — Implementation Guidance

Version: 0.1 draft  
Audience: implementers of ITM-aware Markdown renderers, editors, validators, and publication pipelines

---

## 1. Purpose

This document defines an implementation-ready approach for embedding and publishing ITM content from Markdown while preserving full Markdown compatibility.

The goal is to allow a Markdown document to act as a publication template, notebook, or architecture design definition over one or more ITM models. An ITM-aware processor can resolve embedded model cells, imported ITM files, viewpoints, views, render commands, and Markdown injection commands. A non-ITM-aware Markdown renderer should still render the document safely as ordinary Markdown with fenced code blocks.

This profile is intentionally a Markdown integration layer. It does not replace the ITM format. It adds a Markdown-scoped way to:

- define named local ITM model cells;
- import those cells from other cells or publication blocks;
- render ITM viewpoints and views into the Markdown flow;
- define local publication-only viewpoints and views;
- inject selected Markdown descriptions, labels, attributes, lists, or tables from ITM model elements;
- keep block order independent from processing semantics.

---

## 2. Core design principles

### 2.1 Markdown remains Markdown

All ITM integration uses standard fenced code blocks.

Example:

````markdown
```itm model=architecture default
&system [System] Payment Platform
  &api [Component] API Gateway
```

```itm-pub
%render viewpoint system_context
{
  output: svg
}
```
````

A non-ITM-aware Markdown renderer will simply display these as code blocks. An ITM-aware renderer may interpret them and replace or augment selected blocks during publication.

### 2.2 Markdown block order has no semantic meaning

The physical position of `itm` and `itm-pub` blocks in the Markdown document must not change model semantics.

The processor must:

1. parse the whole Markdown document;
2. index all named ITM cells;
3. reject duplicate cell names;
4. build dependency graphs from explicit imports;
5. evaluate cells by dependency order, not document order;
6. render publication blocks in document order for output placement only.

This allows the model to live in an annex while publication blocks appear in the main body.

### 2.3 Dependencies are explicit

Named cells and publication blocks should import the models they need.

A document may declare one default model cell, which is automatically available to `itm-pub` blocks as source alias `default`. This is an ergonomic shortcut, not a hidden global model merge.

### 2.4 Publication logic does not define canonical model content

`itm-pub` blocks are for publication logic: imports, requirements, local viewpoints, local views, render commands, injection commands, and block-local style or validation overrides.

They must not define normal ITM model entities or relationships as canonical content.

In strict mode, entity or relationship declarations inside `itm-pub` are errors. In tolerant mode, processors may preserve the block and emit diagnostics, but should not silently add those elements to the model.

### 2.5 ITM cells are named modules, not execution cells

Named `itm` cells behave like addressable modules inside Markdown, not like execution-order-dependent Python notebook cells.

Import order inside a single ITM cell may still be meaningful when resolving overlays or conflicts, because that order is explicit within the cell and travels with it.

---

## 3. Fenced block types

### 3.1 `itm model=<name>`

Defines a named ITM model cell.

````markdown
```itm model=architecture
%namespace local https://example.org/local

&system [System] Payment Platform
  &api [Component] API Gateway
```
````

Rules:

- `model=<name>` is required for importable local model cells.
- Names must be unique within the Markdown document.
- A named model cell may import other model cells or external ITM files.
- A model cell may contain normal ITM model content, including overlays if the ITM processor supports them.
- A model cell may live anywhere in the Markdown document.

### 3.2 `itm model=<name> default`

Marks a named model cell as the document-default publication model.

````markdown
```itm model=architecture default
&system [System] Payment Platform
  &api [Component] API Gateway
```
````

Rules:

- At most one model cell may be marked `default`.
- `itm-pub` blocks automatically import it as alias `default` unless disabled.
- If a render or injection command omits `source`, it uses `default`.
- A cell named `default` is allowed, but default behaviour should be controlled by the `default` flag, not by the name alone.

### 3.3 `itm package=<name>`

Optionally defines a named local package/profile cell.

````markdown
```itm package=archimate_profile
%package archimate_profile
{
  version: 0.1.0
  namespace: archimate
}
```
````

Rules:

- Package cell names share the same uniqueness namespace as model cells unless the implementation explicitly separates them.
- Package cells may be referenced by `%using` or imported by a model cell, depending on implementation policy.
- If unsupported, package cells should be preserved as code blocks and produce an informational diagnostic.

### 3.4 `itm-pub`

Defines a self-contained publication block.

````markdown
```itm-pub
%import md:architecture as model

%render viewpoint system_context
{
  source: model
  output: svg
}
```
````

Rules:

- `itm-pub` blocks are interpreted by the Markdown integration processor, not by the core ITM parser alone.
- They may contain publication directives such as `%import`, `%require`, `%using`, `%viewpoint`, `%view`, `%render`, and `%inject`.
- They may define block-local viewpoints, views, styles, and validation rules.
- They may not define canonical model nodes or relationships.
- They are rendered or injected at their physical position in the Markdown output.

---

## 4. Fence info string grammar

The integration profile should avoid relying on non-standard Markdown attribute syntax. Use the standard fence info string.

Recommended grammar:

```ebnf
fence_info       ::= language (space attribute)*
language         ::= "itm" | "itm-pub"
attribute        ::= flag | key_value
flag             ::= name
key_value        ::= name "=" value
name             ::= [A-Za-z_][A-Za-z0-9_-]*
value            ::= bare_value | quoted_value
bare_value       ::= [^ \t]+ 
quoted_value     ::= '"' chars '"' | "'" chars "'"
```

Examples:

````markdown
```itm model=architecture default
```

```itm model="enterprise architecture" default publish=hidden
```

```itm-pub
```
````

Recommended attributes:

| Attribute | Applies to | Meaning |
|---|---|---|
| `model=<name>` | `itm` | Defines an importable local model cell |
| `package=<name>` | `itm` | Defines an importable local package/profile cell |
| `default` | `itm model` | Makes this the default publication model |
| `publish=source` | `itm` | Keep the source code block in published output |
| `publish=hidden` | `itm` | Hide the model cell in ITM-aware published output |
| `publish=diagnostic` | `itm` | Replace the cell with diagnostics/status in ITM-aware output |

Default behaviour:

- `itm model=<name>` defaults to `publish=source` unless the host chooses a different publication profile.
- `itm-pub` defaults to being replaced by its generated output in ITM-aware publication.
- Non-ITM-aware Markdown renderers ignore these semantics and display fenced blocks normally.

---

## 5. Local source URIs

Use `md:<name>` as the virtual URI scheme for named Markdown ITM cells.

Examples:

```itm
%import md:architecture as architecture
%import md:reviewed_architecture as reviewed
%import ./models/application.itm as applications
%import shared:profiles/archimate.itm as archimate_profile
```

Resolution order:

1. `md:<name>` resolves to a named Markdown `itm` cell.
2. Relative paths resolve relative to the Markdown document location.
3. Repository references resolve according to declared repositories and host policy.
4. Package/profile references resolve according to package and `%using` policy.

The `md:` scheme is local to the Markdown document. It should not fetch remote content.

---

## 6. `%import` directive

### 6.1 In model cells

Inside `itm model=<name>` cells, `%import` composes one or more sources into the current cell's resolved model.

Example:

````markdown
```itm model=base_model
&payment_service [Component] Payment Service
{
  criticality: medium
}
```

```itm model=review_model
%import md:base_model as base

&payment_service !overlay
{
  criticality: high
  status: under_review
}
```
````

Rules:

- The current model cell output is the resolved result of its imports plus its own declarations.
- Import order inside the cell is preserved and may be meaningful for overlays and conflict resolution.
- The imported model content retains its own namespaces and ids.
- The import alias is a source handle, not automatically an ITM namespace, unless a host explicitly provides that extension.
- Conflicts should be diagnosed with source-origin information.

### 6.2 In publication blocks

Inside `itm-pub`, `%import` binds a source alias for rendering and injection.

Example:

```itm
%import md:architecture as model

%render viewpoint system_context
{
  source: model
  output: svg
}
```

Rules:

- Publication imports do not modify the imported model.
- They bind source aliases for commands in the block.
- Explicit imports are block-local.
- If a default model exists, it is also imported as `default` unless disabled.

### 6.3 Default import

If one model cell is marked `default`, every `itm-pub` block implicitly receives:

```itm
%import md:<default-model-name> as default
```

A publication block can disable this:

```itm
%noDefaultImport
```

If a command omits `source`, it uses `default`.

Strict-mode diagnostics:

- no default model and omitted `source`: error;
- multiple default model cells: error;
- explicit alias `default` plus implicit default import: warning or error, depending on policy;
- `%noDefaultImport` with omitted `source`: error unless another source is explicitly named `default`.

---

## 7. Cell uniqueness and dependency rules

### 7.1 Unique names

All named cells must have unique names.

Invalid:

````markdown
```itm model=architecture
...
```

```itm model=architecture
...
```
````

Diagnostic:

```text
Duplicate Markdown ITM cell name: architecture
```

Do not support "last one wins" or Markdown-order-based merging.

### 7.2 Dependency graph

The processor must build a dependency graph from `%import md:<name>` statements.

Example:

```text
base_model
  -> finance_review_model
  -> security_review_model
  -> reconciled_model
```

Rules:

- Missing dependencies are errors in strict mode.
- Circular dependencies are errors.
- Imported sources should be cached by content hash and dependency graph hash.
- Document order must not affect the dependency graph.

### 7.3 Ordered resolution within a cell

Import order inside one cell is meaningful and deterministic.

Example:

````markdown
```itm model=reconciled_model
%import md:base_model
%import md:finance_overlay
%import md:security_overlay
```
````

If both overlays modify the same node, the implementation may apply ordered resolution based on the order written in that cell. This is acceptable because the ordering is explicit and local to the cell.

---

## 8. Local viewpoints and views in `itm-pub`

An `itm-pub` block may define block-local `%viewpoint` and `%view` declarations.

Example:

```itm
%import md:architecture as model

%viewpoint critical_dependencies
{
  pipeline:
    - source: model
    - select: "ALL([Component], #critical)"
    - includeEdges: "@depends_on:*"
    - transform: graph.model
    - layout: graphviz.dot
    - render: svg
}

%view executive_dependencies
{
  viewpoint: critical_dependencies
  parameters:
    includeDraft: false
  deltas:
    hidden:
      - node: experimental_component
}

%render view executive_dependencies
{
  output: svg
}
```

Scoping rules:

1. local `%view` and `%viewpoint` declarations are visible only inside the current `itm-pub` block;
2. local declarations may reference block-local imports;
3. local declarations do not modify imported ITM files;
4. local declarations may shadow imported declarations, but this should produce an informational diagnostic;
5. strict mode may require explicit shadowing markers if desired by the host.

Name resolution order for render commands:

1. block-local `%view` or `%viewpoint`;
2. declarations from explicitly imported sources;
3. declarations from the implicit default source;
4. package-provided declarations activated by `%using`.

---

## 9. Render directive

### 9.1 Render a viewpoint

```itm
%render viewpoint system_context
{
  source: default
  output: svg
  caption: "System context generated from the default model."
}
```

If `source` is omitted, it defaults to `default`.

### 9.2 Render a view

```itm
%render view current_dependency_graph
{
  source: model
  output: svg
  caption: "Dependency graph with stored view deltas applied."
}
```

### 9.3 Recommended render body fields

| Field | Required | Meaning |
|---|---:|---|
| `source` | No, if default exists | Source alias to render from |
| `output` | No | Desired output format, e.g. `svg`, `png`, `html`, `mermaid`, `dot` |
| `caption` | No | Caption inserted below generated output |
| `parameters` | No | Parameters passed into the viewpoint/view pipeline |
| `fallback` | No | Fallback behaviour when rendering fails or renderer is unavailable |
| `cache` | No | Cache policy hint |

Recommended fallback modes:

```yaml
fallback:
  mode: keep-code-block    # keep original code block
```

Other possible modes:

- `placeholder`;
- `static-cache`;
- `link`;
- `error`.

---

## 10. Markdown injection directive

The integration profile should support injecting model-derived Markdown into the surrounding Markdown flow.

Generic syntax:

```itm
%inject <format>
{
  source: default
  select: "<selector>"
  ...format-specific fields...
}
```

If `source` is omitted, it defaults to `default`.

### 10.1 Inject node descriptions

```itm
%inject markdown
{
  select: "&risk_api"
  field: description
}
```

Given this node:

```itm
&risk_api [Risk] API overload
| The API Gateway may become overloaded during peak periods.
|
| Mitigation should include autoscaling, queue limits, and monitoring.
```

The processor injects the node's Markdown description into the document flow.

### 10.2 Inject multiple descriptions

```itm
%inject markdown
{
  select: "ALL([Risk], #critical)"
  field: description
  orderBy: label
  separator: "\n\n---\n\n"
  empty: "No critical risks found."
}
```

Recommended behaviour:

- evaluate selector against the source model;
- sort by `orderBy` if provided;
- extract the requested field from each element;
- concatenate using `separator`;
- insert `empty` if the result set is empty.

### 10.3 Inject a table

```itm
%inject table
{
  select: "[Risk]"
  columns:
    - label
    - attributes.severity
    - attributes.owner
    - attributes.status
  headers:
    - Risk
    - Severity
    - Owner
    - Status
  orderBy: attributes.severity
}
```

### 10.4 Inject relationship tables

```itm
%inject table
{
  select: "@depends_on:*"
  columns:
    - source.label
    - type
    - target.label
    - attributes.confidence
  headers:
    - Source
    - Relationship
    - Target
    - Confidence
}
```

### 10.5 Inject a list

```itm
%inject list
{
  select: "[Capability]"
  field: label
  orderBy: label
  bullet: "-"
}
```

### 10.6 Recommended injectable fields

For nodes:

| Field | Meaning |
|---|---|
| `id` | Node id |
| `type` | Node type |
| `label` | Node label |
| `description` | Markdown description attached with `|` lines |
| `attributes.<name>` | Attribute value |
| `tags` | Tags |
| `summary` | Generated summary from label, type, and selected attributes |

For relationships:

| Field | Meaning |
|---|---|
| `id` | Relationship id, if present |
| `type` | Relationship type |
| `source.id` | Source node id |
| `source.label` | Source node label |
| `target.id` | Target node id |
| `target.label` | Target node label |
| `attributes.<name>` | Relationship attribute value |
| `description` | Relationship description, if supported by the implementation |

---

## 11. Processing pipeline

Recommended processor pipeline:

```text
1. Parse Markdown using a standard Markdown parser.
2. Collect fenced code blocks with language `itm` or `itm-pub`.
3. Parse fence info strings into language and attributes.
4. Register named model/package cells.
5. Reject duplicate cell names and multiple default model cells.
6. Parse `itm-pub` blocks enough to discover imports and local declarations.
7. Build dependency graph for `md:` imports.
8. Resolve external file/repository/package imports according to host policy.
9. Evaluate model cells by dependency order.
10. Apply ITM parsing, include/import resolution, overlays, validation, styles, viewpoints, and views.
11. Evaluate each `itm-pub` block at its Markdown position.
12. Execute render and inject commands.
13. Replace or augment `itm-pub` blocks in the output document.
14. Optionally hide, show, or annotate `itm` model cells according to `publish` policy.
15. Emit diagnostics mapped to Markdown source locations.
```

---

## 12. Caching

Renderers should cache parsed and resolved sources, but caching must not change authoring semantics.

Recommended cache key components:

```text
source canonical URI
+ source content hash
+ dependency graph hash
+ resolved include/import graph hash
+ active package/profile set
+ processor/plugin versions
+ relevant render parameters
+ output format
```

For default imports, the cache should still resolve the actual default model cell by name and content hash.

---

## 13. Diagnostics

Diagnostics should be first-class outputs and should map back to Markdown source locations.

Recommended diagnostic fields:

```yaml
source: itm-markdown.processor
severity: error | warning | information | observation
message: Human-readable message
markdownFile: architecture.md
blockIndex: 7
blockType: itm-pub
cellName: architecture
line: 123
column: 1
range:
  from: 2480
  to: 2510
itmSource: md:architecture
itmNode: risk_api
itmRelationship: null
pipelineStep: render viewpoint system_context
```

Common diagnostics:

| Condition | Strict mode | Tolerant mode |
|---|---|---|
| Duplicate model cell name | Error | Error |
| Multiple default model cells | Error | Error |
| Missing `md:` import target | Error | Warning, preserve block |
| Circular cell import | Error | Error |
| Entity content inside `itm-pub` | Error | Warning, ignore for model composition |
| Missing renderer/plugin | Error or warning by policy | Warning and fallback |
| Omitted `source` with no default | Error | Warning and preserve block |
| Local viewpoint shadows imported viewpoint | Information or warning | Information |
| Injection selector matches nothing | Controlled by `empty` field | Controlled by `empty` field |

---

## 14. Security considerations

The Markdown integration layer should follow the host's security model.

Recommended rules:

- `md:` imports are local to the current Markdown document.
- Relative file imports should be restricted to approved roots.
- Repository references should be resolved only by approved repository handlers.
- Remote fetches should be disabled unless explicitly enabled by the host.
- Renderers and plugins should run in constrained environments.
- Generated HTML should be sanitized before insertion into Markdown-derived HTML output.
- SVG output should be sanitized if embedded inline.
- Diagnostics should not leak credentials or absolute private paths unless the host allows it.

---

## 15. Strict and tolerant modes

### Strict mode

Use for CI/CD, publication, controlled repositories, and release builds.

Strict mode should fail on:

- duplicate cell names;
- multiple defaults;
- missing imports;
- circular imports;
- invalid ITM syntax;
- invalid publication directives;
- missing required renderers when no fallback is allowed;
- omitted source without a default.

### Tolerant mode

Use for editing, authoring, previews, and migration.

Tolerant mode should:

- preserve unknown blocks;
- keep original fenced code blocks when rendering fails;
- emit diagnostics rather than stopping immediately where safe;
- still reject duplicate names and circular imports because they make the graph ambiguous.

---

## 16. Minimal implementation profile

A minimal useful implementation should support:

- detecting `itm model=<name>` blocks;
- detecting one `default` model;
- detecting `itm-pub` blocks;
- resolving `%import md:<name> as <alias>`;
- implicit import of the default model as `default`;
- `%render viewpoint <name>`;
- `%render view <name>`;
- `%inject markdown` with `field: description`;
- diagnostics for duplicate names, missing imports, and missing defaults.

## 17. Full implementation profile

A full implementation should additionally support:

- local package/profile cells;
- external file and repository imports;
- local `%viewpoint` and `%view` declarations inside `itm-pub`;
- block-local `%style` and `%rule`;
- render caching;
- multiple output formats;
- `%inject table` and `%inject list`;
- relationship selectors and relationship tables;
- source-location mapping from generated output back to Markdown and ITM cells;
- secure plugin/render execution;
- strict/tolerant mode configuration.

---

## 18. Reference example

````markdown
# Architecture Definition

## System context

```itm-pub
%render viewpoint system_context
{
  output: svg
  caption: "System context generated from the default model."
}
```

## Critical risks

```itm-pub
%inject markdown
{
  select: "ALL([Risk], #critical)"
  field: description
  orderBy: label
  empty: "No critical risks are currently recorded."
}
```

# Annex A — Source model

```itm model=architecture default
%namespace local https://example.org/architecture

%viewpoint system_context
{
  pipeline:
    - select: "[System], [Component]"
    - includeEdges: "=>, @depends_on:*"
    - transform: graph.model
    - layout: graphviz.dot
    - render: svg
}

&system [System] Payment Platform
  &api [Component] API Gateway #critical
  &ledger [Component] Ledger Service

&risk_api [Risk] API overload #critical @affects:api
| The API Gateway may become overloaded during peak periods.
|
| Mitigation should include autoscaling, queue limits, and operational monitoring.
```
````

In this example:

- the source model lives in the annex;
- the model is marked as the default source;
- publication blocks in the main body do not need repeated imports;
- moving the annex does not change semantics;
- a non-aware Markdown renderer still shows a readable document with fenced blocks.
