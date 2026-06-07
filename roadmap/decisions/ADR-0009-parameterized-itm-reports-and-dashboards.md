# ADR-0009 - Parameterized ITM reports and dashboards

## Status

Proposed

## Date

2026-06-07

## Context

TextForge treats ITM as a canonical plain-text model source that can be parsed, resolved, validated, projected, rendered, and published. The active roadmap already includes ITM parser/model foundations, directives/packages/validation, scoped contexts, conformance modules, visual targets, and ITM-in-Markdown publication work.

The current ITM-in-Markdown and `itm-pub` mechanism lets Markdown documents embed ITM model blocks and publication blocks for reports, catalogues, matrices, graphs, and other outputs.

A recurring need is to reuse the same analysis, report, or dashboard against different target ITM models, scopes, styles, rule sets, or projection modes. Without parameters, users duplicate report files or manually edit `%include`, selector, view, or publication settings for each run.

Parameterized ITM execution is useful independently and is also the foundation for the proposed interactive exploration workbench in `ADR-0010`.

## Decision

Introduce parameterized ITM execution as candidate workpackage `WP-ITM-05`.

ITM and ITM-in-Markdown files may declare host-supplied parameters with `%param`. A parameterized `.itm` or `.md` file evaluates as a virtual ITM instance:

```text
parameterized ITM / ITM-Markdown file
+ parameter values
+ resolved includes/imports
+ rules/views/viewpoints/styles
= transient effective model, dashboard, or report
```

The behavior is intentionally similar to stored queries with parameters:

- the file declares what it needs;
- the host provides values;
- the loader validates and substitutes values in supported locations;
- the run produces a transient effective document and diagnostics;
- source files are not modified unless the user explicitly saves a new file or future run profile.

### `%param` directive

Basic form:

```itm
%param targetModel
{
  type: resource
  label: Target ITM model
  accept:
    languageId: itm
    extensions:
      - itm
}
```

Requiredness is inferred:

```text
no default  = required
has default = optional
```

Examples:

```itm
%param scope
{
  type: selector
  label: Scope selector
  default: "*"
}

%param strict
{
  type: boolean
  label: Strict validation
  default: false
}

%param projectionKind
{
  type: enum
  label: Projection kind
  default: report
  values:
    - report
    - matrix
    - catalogue
    - graph
}
```

Do not add a separate `required` field in v1.

### Parameter references

Parameter references use `${name}`.

```itm
%include ${targetModel}

%rule selected_items_need_id
{
  select: "${scope}"
  pipeline:
    - step: requireId
  severity: warning
  message: "Selected items should have stable ids."
}
```

`ADR-0008` states that core ITM does not add syntax for disabling individual active rules. Parameterized execution must not reintroduce rule disabling through `enabled: "${strict}"`; strictness is controlled through validation modes and host run options.

### Parameter type contract

The v1 parameter type contract is:

| Type | Meaning | UI control | Validation |
|---|---|---|---|
| `string` | Single-line text | text input | scalar string |
| `text` | Multi-line text | textarea | scalar string |
| `boolean` | true/false | checkbox | explicit boolean-like value |
| `integer` | Whole number | numeric input | integer |
| `number` | Decimal number | numeric input | finite number |
| `enum` | One value from a declared list | dropdown | value must be in `values` |
| `selector` | ITM selector expression | selector editor | parse as ITM selector |
| `resource` | Workspace resource | resource picker | resolvable by host provider |
| `path` | Path-like string | path picker or text input | host path policy |
| `id` | ITM id or namespace-qualified id | id picker/autocomplete | valid ITM id syntax |
| `typeRef` | ITM type or namespace-qualified type | type picker/autocomplete | valid type reference |
| `relationshipTypeRef` | ITM relationship type | relationship-type picker/autocomplete | valid relationship type reference |

Additional types may be added later, but v1 stays small and deterministic.

### Substitution scope

Parameter substitution is intentionally limited in v1.

Allowed:

```text
directive arguments
YAML scalar values inside directive bodies
itm-pub YAML request fields
```

Examples:

```itm
%include ${targetModel}

%view dashboard_structure
{
  title: Structure
  viewpoint: itm::structure_lens
  parameters:
    scope: "${scope}"
}
```

```yaml
source: target
viewpoint: itm::structure_lens
projection: ${projectionKind}
title: ${reportTitle}
```

Not allowed in v1:

```text
arbitrary entity labels
relationship lines
Markdown prose
raw fenced content
partial token substitution inside identifiers
```

This keeps ITM from becoming an unrestricted template language.

### Loader evaluation model

The loader evaluates parameterized files in this order:

```text
1. read raw text
2. parse directives enough to collect %param declarations
3. receive parameter values from the host environment
4. validate supplied values against the parameter contract
5. substitute parameters in allowed locations
6. resolve includes/imports/repositories according to existing policy
7. resolve packages, %using, namespaces, contexts, id maps, and overlays
8. evaluate rules, styles, viewpoints, views, projections, and publications
9. produce transient effective model plus diagnostics
```

Suggested API shape:

```ts
loadItmDocument(source, {
  parameters: {
    targetModel: "/models/order-model.itm",
    scope: "[Component]",
    strict: true,
  },
});
```

Parameter values are runtime execution inputs, not source edits.

### Diagnostics

Parameterized execution adds diagnostics for:

- missing required parameter;
- unknown parameter reference;
- invalid parameter type;
- invalid enum value;
- invalid selector parameter;
- resource parameter not resolvable;
- resource parameter rejected by accept policy;
- parameter reference used outside supported substitution scope;
- parameter cycle or recursive substitution;
- unused supplied parameter;
- duplicate `%param` declaration.

Diagnostics include parameter name, source file, line/range where available, expected type, received value kind, severity, and message.

### Generic analytical lenses

TextForge should provide a generic built-in lens package available like other ITM package content:

```itm
%using itm_lenses.viewpoints
```

This proposal adds `analyse` as a first-class pipeline operation.

Example generic lens viewpoints:

```itm
%viewpoint itm::structure_lens
{
  title: Structure lens
  pipeline:
    - select: "${scope}"
    - analyse: itm.structure
    - render: report
}

%viewpoint itm::identity_lens
{
  title: Identity lens
  pipeline:
    - select: "${scope}"
    - analyse: itm.identity
    - render: catalogue
}

%viewpoint itm::relationship_lens
{
  title: Relationship lens
  pipeline:
    - select: "${nodes}"
    - includeEdges: "${edges}"
    - analyse: itm.relationships
    - render: matrix
}
```

Lenses remain generic. A domain-specific report is a configuration of selectors, relationship selectors, rules, viewpoints, and matrices.

### Standard transient dashboard file

A reusable dashboard can be an ordinary parameterized ITM file:

```itm
%param targetModel
{
  type: resource
  label: Target ITM model
  accept:
    languageId: itm
}

%param scope
{
  type: selector
  label: Scope selector
  default: "*"
}

%include ${targetModel}
%using itm_lenses.viewpoints

%view dashboard_structure
{
  title: Structure
  viewpoint: itm::structure_lens
  parameters:
    scope: "${scope}"
}
```

The user opens the file, supplies `targetModel`, optionally changes `scope`, and TextForge opens the declared transient dashboard views.

### ITM-in-Markdown report support

Parameterized Markdown reports are part of this proposal. Embedded `itm` blocks may declare parameters, and `itm-pub` YAML fields may reference the same effective parameter set.

This turns Markdown reports into reusable model-analysis templates rather than one-off documents.

### Parameter UI and run history

When opening a parameterized `.itm` or `.md` file, TextForge should show a generated parameter form. The same form model should support ITM file opening, ITM Markdown report opening, ITM visual target opening, future command-palette commands, and future CI/build task configuration.

Recent virtual runs are stored as session/workspace state, not written into the ITM file by default:

```yaml
file: dashboards/model-review.md
parameters:
  targetModel: /models/order-model.itm
  scope: "*"
  strict: false
lastRun: 2026-06-07T10:30:00Z
```

Run-history actions include rerun, duplicate with edits, pin, rename, export, and clear.

## Consequences

### Positive

- Reusable dashboards and reports become first-class.
- The feature has value before the full exploration workbench is built.
- No new test language is needed.
- ITM files remain ordinary ITM files.
- Markdown reports become reusable templates.
- UI can generate parameter forms from declared contracts.
- The same mechanism supports testing, exploration, review, publication, and CI/reporting.

### Negative / trade-offs

- Parameter substitution adds another processing phase.
- Poorly scoped substitution could turn ITM into an unsafe template language.
- Resource parameters must respect TextForge's local-only and provider policies.
- Parameterized documents need clearer diagnostics than ordinary static documents.
- Generic lens output contracts must stabilize before downstream dashboards depend on them.

### Follow-up required

- Update `docs/reference/specs/itm-format.md` with `%param`, parameter substitution scope, loader order, diagnostics, and lens package conventions if accepted.
- Add parser/model support for `%param` declarations and duplicate declaration diagnostics.
- Add loader options for parameter values and allowed-location substitution.
- Extend ITM-in-Markdown / `itm-pub` evaluation to use the same effective parameter set.
- Define and implement `itm_lenses.viewpoints` plus the `analyse` pipeline operation.
- Add generated parameter forms and local run history in the web workbench.
- Add focused tests for missing/invalid parameters, substitution boundaries, resource policy, selector validation, and Markdown report execution.

## Scope

This decision applies to:

- Module: `MOD-ITM`
- Related module: `MOD-MARKDOWN-ITM`
- Workpackage: `WP-ITM-05`
- Release candidate: `R-LOCAL-AUTHORING-MVP`
- Packages: `@textforge/itm`, Markdown/ITM publication surfaces
- Canonical spec: `docs/reference/specs/itm-format.md`

This ADR introduces a candidate workpackage. It does not claim implementation or validation status.

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
