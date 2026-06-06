# ADR-0007 - ITM type inheritance and context inference

## Status

Accepted

## Date

2026-06-06

## Context

`WP-ITM-03` added comments/trivia, identity maps, named contexts, scoped activation, package-exported contexts, and context-driven inference. Follow-up usage showed two areas still needed regulation before downstream profiles depend on them:

- entity and relationship type inheritance used both scalar and list `extends` forms and needed deterministic semantics;
- context bodies still tolerated shortcut fields and `%idmap`-backed type aliases, which made canonical identity and type inference overlap.

TextForge remains pre-alpha, so conflicting format behavior can be corrected directly rather than preserved for compatibility.

## Decision

ITM will regulate type inheritance and context inference as a patch to `WP-ITM-03`.

The semantic precedence is:

```text
explicit authoring > ordered context inference rules > context defaults > validation error or untyped value
```

The processing model remains:

```text
declarations are hoisted
activations are explicit
only %begin/%end is positional
includes do not leak local state
packages export; consumers activate
```

Entity and relationship types use `extends` for inheritance. The canonical form is a YAML list; scalar shorthand may be parsed but must be normalized internally and serialized as a list. Multiple inheritance is allowed, inheritance graphs must be acyclic, and type selectors/relationship constraints match polymorphically through the inheritance graph.

Entity and relationship types may declare `abstract: true`. Abstract types may be used in selectors, inheritance, relationship constraints, and inference conditions, but they must not be directly instantiated or produced by inference.

Contexts use this canonical schema:

```yaml
%context NAME
{
  extends: optional context name or list of names
  defaultNamespace: optional namespace prefix
  defaults:
    rootType: optional qualified entity type
    childType: optional qualified entity type
    relationshipType: optional qualified relationship type
  infer:
    nodes: optional ordered list of node inference rules
    relationships: optional ordered list of relationship inference rules
  activate:
    rules: optional list
    styles: optional list
    viewpoints: optional list
}
```

Context inheritance is acyclic. Local defaults override inherited defaults. Local inference rules are evaluated before inherited rules, and a local rule with the same `id` replaces an inherited rule.

Node inference applies only when a node has no explicit type. Relationship inference applies only when a relationship has no explicit authored type and is evaluated after node type resolution. Ordered inference uses first-match-wins semantics and must preserve authored rule order.

`%idmap` is reserved for canonical/global identity mapping. It must not be used as a type alias table. Context defaults and inference rules are the supported mechanism for type inference.

Packages may define and export contexts. `%using package` activates package default exports, including `defaultContext`. `%begin packageName` activates package defaults plus the package `defaultContext`; `%begin packageName.contextName` activates the named package context.

## Consequences

### Positive

- ITM profiles become deterministic and easier to validate.
- BPMN, ArchiMate, and custom profile families can share polymorphic type constraints.
- Context inference is explainable because ordered rules and defaults have explicit precedence.
- `%idmap` keeps one purpose: canonical identity mapping.

### Negative / trade-offs

- Existing examples that used `%idmap` as a type alias table must migrate to `%context defaults`.
- Legacy context shortcut fields such as `root`, `child`, and `relationship` are no longer accepted as inference semantics.
- The evaluator needs explicit inheritance graphs and provenance for inferred values.
- Validation becomes stricter and can surface more diagnostics in draft profiles.

## Scope

This decision applies to:

- Module: `MOD-ITM`
- Workpackage: `WP-ITM-03`
- Package: `@textforge/itm`
- Canonical spec: `docs/reference/specs/itm-format.md`

This ADR refines and constrains `ADR-0006`; it does not create a new workpackage.

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
