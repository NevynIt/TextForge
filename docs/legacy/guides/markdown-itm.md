# Using ITM in Markdown

Version: 0.1 draft  
Audience: authors of architecture documents, design definitions, model notebooks, and publication templates

---

## 1. What this is

This guide explains how to write Markdown documents that can publish views, diagrams, tables, and text from ITM models.

The basic idea is simple:

- Markdown contains the narrative.
- ITM model blocks contain model content.
- ITM publication blocks render diagrams or inject model text into the document.
- The document remains valid Markdown even when opened in tools that do not understand ITM.

An ITM-aware renderer can turn this:

````markdown
```itm-pub
%render viewpoint system_context
{
  output: svg
}
```
````

into a generated diagram, while a normal Markdown renderer simply displays it as a code block.

---

## 2. The three block roles

### 2.1 Model block

A model block defines ITM model content inside Markdown.

````markdown
```itm model=architecture
&system [System] Payment Platform
  &api [Component] API Gateway
  &ledger [Component] Ledger Service
```
````

The name after `model=` lets other blocks import this model.

### 2.2 Default model block

Most architecture documents publish many views from the same model. Mark that model as `default`:

````markdown
```itm model=architecture default
&system [System] Payment Platform
  &api [Component] API Gateway
```
````

Then publication blocks can use it without repeating the import every time.

### 2.3 Publication block

A publication block renders or injects content from a model.

````markdown
```itm-pub
%render viewpoint system_context
{
  output: svg
}
```
````

If a default model exists, this uses the default model automatically.

---

## 3. Why this remains Markdown-compatible

All ITM integration is written inside normal Markdown fenced code blocks.

That means:

- GitHub, VS Code, Obsidian, and other Markdown tools can still open the file;
- non-ITM-aware tools show the ITM instructions as code blocks;
- ITM-aware tools can interpret the blocks and generate diagrams, tables, and text;
- the document fails gracefully instead of becoming unreadable.

---

## 4. A complete first example

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

# Annex A — Source model

```itm model=architecture default
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
  &api [Component] API Gateway
  &ledger [Component] Ledger Service
```
````

This pattern is useful when you want the main document to read like a report, while the model source lives in an annex.

---

## 5. Block order does not matter

You can put the model before the text, after the text, or in an annex.

This works:

````markdown
# Main report

```itm-pub
%render viewpoint system_context
{
  output: svg
}
```

# Annex — Model

```itm model=architecture default
...
```
````

This also works:

````markdown
```itm model=architecture default
...
```

# Main report

```itm-pub
%render viewpoint system_context
{
  output: svg
}
```
````

The renderer resolves blocks by name, not by their position in the Markdown file.

---

## 6. Importing a specific model explicitly

When a document has several models, import the one you need in the publication block.

````markdown
```itm model=business_model
&customer [Actor] Customer
&service [Service] Online Ordering
```

```itm model=application_model
&frontend [Component] Web Frontend
&api [Component] API Gateway
```

```itm-pub
%import md:application_model as apps

%render viewpoint application_dependencies
{
  source: apps
  output: svg
}
```
````

The `md:` prefix means “a named ITM block in this Markdown document”.

---

## 7. Using local viewpoints in a publication block

Sometimes a view is only useful for one document. In that case, define the viewpoint inside the `itm-pub` block.

````markdown
```itm-pub
%import md:architecture as model

%viewpoint critical_components
{
  pipeline:
    - source: model
    - select: "ALL([Component], #critical)"
    - includeEdges: "@depends_on:*"
    - transform: graph.model
    - layout: graphviz.dot
    - render: svg
}

%render viewpoint critical_components
{
  output: svg
  caption: "Critical component dependencies."
}
```
````

This viewpoint is local to that publication block. It does not modify the imported model.

---

## 8. Using local views with manual deltas

A viewpoint defines how to generate a diagram. A view defines a specific rendering of that viewpoint, possibly with manual adjustments.

````markdown
```itm-pub
%import md:architecture as model

%viewpoint dependency_graph
{
  pipeline:
    - source: model
    - select: "[Component]"
    - includeEdges: "@depends_on:*"
    - transform: graph.model
    - layout: graphviz.dot
    - render: svg
}

%view executive_dependency_graph
{
  viewpoint: dependency_graph
  deltas:
    hidden:
      - node: experimental_component
    styleOverrides:
      - selector: "#critical"
        style:
          stroke-width: 3
}

%render view executive_dependency_graph
{
  output: svg
}
```
````

Use this for publication-specific presentation choices.

If the view should be reusable across documents, define it in the ITM model instead.

---

## 9. Injecting Markdown from model nodes

ITM nodes can have Markdown descriptions using `|` lines.

````markdown
```itm model=architecture default
&risk_api [Risk] API overload #critical
| The API Gateway may become overloaded during peak periods.
|
| Mitigation should include autoscaling, queue limits, and monitoring.
```
````

You can inject that description into the Markdown flow:

````markdown
```itm-pub
%inject markdown
{
  select: "&risk_api"
  field: description
}
```
````

The generated document will contain the risk description as normal Markdown text.

---

## 10. Injecting several descriptions

Use selectors to inject multiple model elements.

````markdown
```itm-pub
%inject markdown
{
  select: "ALL([Risk], #critical)"
  field: description
  orderBy: label
  separator: "\n\n---\n\n"
  empty: "No critical risks are currently recorded."
}
```
````

This selects all critical risks and inserts their descriptions in label order.

---

## 11. Injecting tables

Tables are useful for summaries, catalogues, risks, interfaces, decisions, or traceability.

````markdown
```itm-pub
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
````

Example source:

````markdown
```itm model=architecture default
&risk_api [Risk] API overload #critical {severity: high, owner: operations, status: open}
&risk_ledger [Risk] Ledger inconsistency {severity: medium, owner: finance, status: monitoring}
```
````

---

## 12. Injecting relationship tables

You can also select relationships.

````markdown
```itm-pub
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
````

This is useful for dependency matrices and traceability sections.

---

## 13. Hiding model cells in published output

By default, model cells are ordinary Markdown code blocks, so they remain visible.

If your ITM-aware publisher supports it, hide a model cell like this:

````markdown
```itm model=architecture default publish=hidden
&system [System] Payment Platform
  &api [Component] API Gateway
```
````

A normal Markdown renderer will still show the block. An ITM-aware publisher may hide it from the final published output.

---

## 14. Deriving one model from another

A model block can import another model block and extend it.

````markdown
```itm model=base_model
&payment_service [Component] Payment Service
{
  criticality: medium
}
```

```itm model=review_model default
%import md:base_model as base

&payment_service !overlay
{
  criticality: high
  status: under_review
}
```
````

The publication blocks can now use `review_model` as the default model.

The important rule is that the import is explicit. Moving the blocks around does not change the result.

---

## 15. Combining several overlays or reviews

If several model cells modify the same imported model, combine them in a new model cell.

````markdown
```itm model=reconciled_model default
%import md:base_model
%import md:finance_review
%import md:security_review
```
````

The order is meaningful inside this cell. That is acceptable because the ordering is written explicitly in the cell itself.

Markdown document order still does not matter.

---

## 16. Disabling the default model for one block

If a document has a default model but one publication block should not use it, write:

````markdown
```itm-pub
%noDefaultImport
%import md:other_model as other

%render viewpoint other_view
{
  source: other
  output: svg
}
```
````

Use this rarely. Most documents are clearer when a default model is used consistently.

---

## 17. Recommended authoring patterns

### Pattern A — One model in an annex

Use this for architecture definitions and reports.

````markdown
# Main document

```itm-pub
%render viewpoint context
{
  output: svg
}
```

```itm-pub
%inject table
{
  select: "[Risk]"
  columns: [label, attributes.severity, attributes.status]
}
```

# Annex — ITM model

```itm model=architecture default
...
```
````

### Pattern B — Several named models

Use this when a document compares domains or layers.

````markdown
```itm model=business
...
```

```itm model=applications
...
```

```itm-pub
%import md:business as business
%import md:applications as apps
...
```
````

### Pattern C — Publication-only view

Use this when the view is specific to one document.

````markdown
```itm-pub
%viewpoint document_specific_view
{
  ...
}

%render viewpoint document_specific_view
{
  output: svg
}
```
````

### Pattern D — Reusable model view

Use this when the view should be shared across tools and documents.

````markdown
```itm model=architecture default
%viewpoint reusable_view
{
  ...
}
```

```itm-pub
%render viewpoint reusable_view
{
  output: svg
}
```
````

---

## 18. What not to do

### Do not define canonical model content inside `itm-pub`

Avoid this:

````markdown
```itm-pub
&api [Component] API Gateway
```
````

Use an `itm model=<name>` block instead.

### Do not rely on Markdown block order

Avoid thinking like this:

```text
First model block runs first, second model block modifies it.
```

Instead, import explicitly:

````markdown
```itm model=reviewed_model
%import md:base_model
...
```
````

### Do not duplicate model names

Invalid:

````markdown
```itm model=architecture
...
```

```itm model=architecture
...
```
````

Each named model cell must have a unique name.

---

## 19. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Publication block says no source found | No default model and no explicit import | Mark one model as `default` or add `%import` |
| Viewpoint not found | It is not defined in the selected source | Check `source`, model imports, and viewpoint name |
| Duplicate cell name error | Two `itm model=` blocks use the same name | Rename one of them |
| Circular import error | Two or more model cells import each other | Break the cycle with a base model and derived model |
| Diagram does not render | Missing renderer/plugin | Add `%require`, change output format, or use fallback |
| Injected section is empty | Selector matched nothing | Check selector, source, tags, and types |
| Moving blocks changed human readability but not output | Expected behaviour | Processing uses imports, not document order |

---

## 20. Short reference

### Named model

````markdown
```itm model=architecture
...
```
````

### Default model

````markdown
```itm model=architecture default
...
```
````

### Explicit import

```itm
%import md:architecture as model
```

### Render a viewpoint

```itm
%render viewpoint system_context
{
  source: model
  output: svg
}
```

### Render a view

```itm
%render view current_dependency_graph
{
  source: model
  output: svg
}
```

### Inject Markdown description

```itm
%inject markdown
{
  select: "&risk_api"
  field: description
}
```

### Inject table

```itm
%inject table
{
  select: "[Risk]"
  columns: [label, attributes.severity, attributes.status]
}
```

### Disable default import

```itm
%noDefaultImport
```

---

## 21. Final mental model

Think of the Markdown document as a small architecture notebook:

```text
Markdown narrative
  + named ITM model modules
  + publication blocks
  + generated diagrams
  + injected model text and tables
```

But unlike a programming notebook, execution order does not depend on where blocks appear. The processor resolves dependencies by name and explicit imports.

That makes the document safe to reorganize, suitable for annex-based model definitions, and readable even in ordinary Markdown tools.
