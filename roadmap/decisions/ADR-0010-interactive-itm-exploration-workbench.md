# ADR-0010 - Interactive ITM exploration workbench

## Status

Proposed

## Date

2026-06-07

## Context

TextForge already supports ITM parsing, resolution, validation, projections, visual targets, and ITM-in-Markdown publication. It also has generic projection kinds such as tree, graph, mindmap, catalogue, matrix, and report.

What is missing is a coherent interactive exploration interface that lets users query, validate, analyse, transform, visualize, compare, and temporarily modify the effective model without editing canonical source.

The workbench should not replace ITM files, `itm-pub`, or existing visual targets. It should orchestrate them around a shared effective model and selector engine.

The intended workflow is:

```text
open model
select parameterized dashboard/report/template
set parameters
run selectors
run rules
inspect lenses
compose visual targets
compare outputs
promote useful snippets
discard the rest
```

This proposal depends on `ADR-0009` because parameterized ITM files and reports are the fastest reusable entry point for the workbench.

## Decision

Create an Interactive ITM Exploration Workbench as candidate workpackage `WP-ITM-EXPLORATION-01`.

The workbench is an interactive UI over the ITM processing model. It uses:

```text
parameterized ITM files and Markdown reports
%include / %using / %rule / %style / %viewpoint / %view
selector engine
validation engine
generic lens viewpoints
projection pipeline
visual target resolver
transient surfaces
promotion/write-back workflow
```

It does not introduce new `%test` or `%assert` directives. Testing and exploration files are ordinary ITM files, usually parameterized, containing `%rule`, `%view`, `%viewpoint`, `%style`, `%context`, `%idmap`, includes, and package usage.

### Conceptual model

The workbench evaluates an exploration session as a layered transient model:

```text
base model
+ resolved includes/imports
+ package/profile content
+ parameterized dashboard/report file
+ parameter values
+ live snippets
+ live selectors/rules/styles/views
= transient effective exploration model
```

Nothing above the base source modifies source until the user explicitly promotes it.

### Parameter runner

Open a parameterized `.itm` or `.md` file and show a generated parameter form:

```text
Target model:     [choose file]
Scope selector:   [*                         ]
Strict mode:      [ ]
Projection kind:  [report v]

[Run] [Pin] [Open dashboard] [Add to history]
```

This is the first implementation slice because it reuses `ADR-0009` and existing ITM capabilities before the more advanced panels are complete.

### Selector Lab

The Selector Lab is a live selector console for ITM selectors.

Expected features:

- autocomplete for ids, types, tags, attributes, relationship types, views, and viewpoints;
- live parse diagnostics;
- result counts before rendering;
- node, relationship, path/neighborhood, and subtree result modes;
- "why matched?" explanations;
- saved scratch selectors;
- conversion to `%view`, `%rule`, or `%style`;
- open results as catalogue, graph, matrix, or report.

Example explanation:

```text
Why did &payment_service match?

[Component]        yes: type is Component
AND NOT #draft     yes: tags do not include draft
```

### Rule / Validation Lab

Rules remain normal `%rule` declarations. The lab runs rules from:

```text
base file
included files
packages
parameterized dashboard/report files
live snippets
```

The UI groups candidates, failures, severity, rule source, provider, and file. Live rules may be promoted as `%rule` through an explicit action.

Useful generic checks align with `ADR-0008`, including required ids, id patterns, required attributes, source/target type checks, known source, resolved target, unique ids, relationship identity, zero-candidate rule warning, zero-match view warning, dangling viewpoint reference, selected relationship cycle detection, max depth, and orphan detection.

### Generic lens dashboard

Model mining stays generic. Domain-specific analyses are configurations of lenses, selectors, relationship selectors, rules, and matrices rather than hardcoded ITM core behavior.

Workbench dashboard tabs should include:

```text
Structure
Identity
Relationships
Profile usage
Attributes
Diagnostics
Rules
Views/Viewpoints
Graph metrics
Selector results
```

Each tab is backed by a built-in viewpoint/lens and can also be rendered inside `itm-pub`.

### View and Viewpoint Lab

The workbench lets users combine:

```text
%viewpoint from file
%view from file
package styles
exploration-file styles/views
live selector overrides
live style overrides
projection choice
renderer choice
```

It can render as tree, graph, mind map, matrix, catalogue, report, Mermaid, Graphviz, BPMN preview, or JSON export when the corresponding packages and renderers are available.

### Visual Target Composer

Users can compose transient visual outputs by selecting base source, node selector, edge selector, projection, renderer, ancestor inclusion, and implicit relationship settings.

Equivalent live choices may be represented as transient `%view` data and later promoted to source when appropriate.

### Transformation Playground

The workbench provides a safe place to run transformations without changing the model.

Examples:

```text
selector result -> table
selector result -> graph model
selector result -> Mermaid
selector result -> DOT
ITM subset -> BPMN XML
ITM subset -> ArchiMate exchange
validation result -> Markdown report
diagnostics -> issue list
relationship selection -> matrix
graph -> metrics table
```

Each transform shows input model, selector/view/viewpoint, pipeline steps, output artifact, diagnostics, and provenance/source mapping.

### Transient surfaces

Every operation opens a surface:

```text
selector result surface
diagnostics surface
graph surface
table surface
matrix surface
catalogue surface
report surface
transform output surface
rule authoring surface
style preview surface
view preview surface
generated Mermaid/DOT/BPMN/JSON surface
```

Surfaces can be pinned, renamed, compared, exported, refreshed, promoted to source, or discarded.

### Promotion and write-back

Everything starts transient.

Promotion options include:

```text
live selector       -> save as %view
live rule           -> save as %rule
live style          -> save as %style
live viewpoint      -> save as %viewpoint
parameter run       -> save to run history
dashboard template  -> save as .itm or .md
semantic edits      -> source patch preview
visual deltas       -> %view deltas
```

Semantic edits must go through source patch preview. Presentation-only changes should be written to `%view` deltas.

## Consequences

### Positive

- Makes ITM practically explorable without leaving TextForge.
- Reuses existing ITM parser, loader, selector, rule, projection, publication, and visual-target infrastructure.
- Keeps ITM generic and domain-neutral.
- Supports both interactive work and reusable reports.
- Gives immediate value through parameterized dashboard files.
- Builds toward model governance, impact analysis, model mining, and repeatable review flows.

### Negative / trade-offs

- The workbench can become too broad if implemented as one monolithic feature.
- Generic lenses need careful names and stable output contracts.
- Selector explanations require additional evaluator metadata.
- Large models may need incremental/cached evaluation later.
- Tables/matrices and transient surface UX need clear ownership boundaries before implementation.

### Follow-up required

- Build the parameter runner first on top of `ADR-0009`.
- Define an exploration session model that composes base model, includes, packages, parameterized files, parameter values, and live snippets.
- Add selector result surfaces and match explanations.
- Add rule/validation lab views over `ADR-0008` diagnostics.
- Add generic lens dashboard tabs backed by built-in viewpoints.
- Add visual target composer and transformation playground slices.
- Add promotion workflow for selectors, rules, styles, views, viewpoints, run history, semantic patches, and visual deltas.
- Keep UI verification manual if needed, according to repository guidance.

## Scope

This decision applies to:

- Module: `MOD-SURFACES-UI`
- Related modules: `MOD-ITM`, `MOD-MARKDOWN-ITM`, `MOD-VISUAL-ITM-RENDERERS`, `MOD-TABLES`
- Workpackage: `WP-ITM-EXPLORATION-01`
- Release candidate: `R-VISUAL-MODELING-MVP`
- Packages/surfaces: TextForge web workbench, ITM package APIs, visual target resolver, table/catalogue/matrix surfaces, ITM publication surfaces

This ADR introduces a candidate workpackage. It does not claim implementation or validation status.

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
