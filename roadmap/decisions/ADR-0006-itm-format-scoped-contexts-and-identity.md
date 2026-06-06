# ADR-0006 - ITM scoped contexts, identity maps, and comments

## Status

Accepted

## Date

2026-06-06

## Context

TextForge is still pre-alpha, so the ITM package can expand its public parser and model contracts when the format needs clearer authoring semantics. The existing validated ITM baseline covers parser/model foundation, package activation, validation rules, and diagnostics, but the format now needs first-class support for authoring comments, local-to-canonical identity mapping, named authoring contexts, scoped context activation, and explicit include/package activation boundaries.

The revised ITM format keeps simple line-oriented authoring while adding deterministic rules for larger model repositories:

- local readable ids can map to canonical repository identities;
- named contexts can infer default namespaces, node types, and relationship types;
- `%begin` / `%end` can activate contexts or package defaults positionally;
- includes are modules, not textual paste;
- package/profile content is available only when explicitly activated;
- comments are authoring trivia, not semantic model content.

These changes are material enough to deserve their own workpackage, but they do not invalidate the historical completion of `WP-ITM-01` and `WP-ITM-02`.

## Decision

TextForge will implement the revised ITM format additions as `WP-ITM-03`.

The ITM parser/model contract will add first-class representation for:

- `//` comments and preserved trivia;
- `%idmap` identity maps;
- `%context` named contexts;
- `%begin NAME` / `%end NAME` scoped activations;
- inferred semantic values derived from active contexts;
- package-exported contexts and identity maps.

The processing model will follow these principles:

```text
Declarations are hoisted.
Activations are explicit.
Only %begin/%end is positional.
Includes do not leak local active state.
Packages export; consumers activate.
Explicit authoring wins over inference.
Canonical identity does not create semantic relationships.
```

Includes will be resolved as module boundaries. An included file may contribute model content and package exports, but its local active context stack and `%using` state do not leak into the including file. Consumers activate package/profile content with `%using` or scoped `%begin` blocks.

## Consequences

### Positive

- Authors can keep readable local ids while repository processors can use stable canonical identities.
- Package/profile authors can define named contexts for type and relationship inference without making inference implicit everywhere.
- Scoped activation makes profile-driven authoring explicit and reviewable in plain text.
- Comments can be round-tripped by editors without becoming model facts.
- Include and package activation semantics become deterministic enough for validation, projections, and later visual editing.

### Negative / trade-offs

- The public ITM model contract expands and existing consumers may need to handle new document collections.
- `%begin` / `%end` introduce positional processing into an otherwise mostly declaration-hoisted format.
- Context inference requires diagnostics that explain where inferred values came from.
- Include composition is stricter than textual paste and may require clearer user-facing diagnostics.

## Scope

This decision applies to:

- Module: `MOD-ITM`
- Workpackage: `WP-ITM-03`
- Package: `@textforge/itm`
- Canonical spec: `docs/reference/specs/itm-format.md`

Existing validated workpackages `WP-ITM-01` and `WP-ITM-02` remain historical baseline entries. Follow-on work may extend BPMN, ArchiMate, Markdown publication, or visual editing behavior to use these semantics, but the core language addition belongs to `WP-ITM-03`.

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
