# ADR-0008 - ITM validation and conformance modules

## Status

Proposed

## Date

2026-06-07

## Context

The Indented Text Model (ITM) format has grown from a small hierarchy-first text format into a layered modeling format. The current specification now covers namespaces, packages, repositories, type declarations, validation rules, viewpoints, views, visual editing, overlays, named contexts, scoped activation, comments, and identity maps.

Recent BPMN, ArchiMate, EA dashboard, and scoped-context examples show that validation is becoming a central ITM capability. Profiles already use `%rule`, `%entitytype`, `%relationshiptype`, `%require`, `%package`, `%using`, plugin-like validation steps, and relationship constraints to express model correctness, export readiness, round-trip preservation, relationship matrices, required attributes, relationship cardinality, and visual/export consistency.

The validation layer is not yet regulated enough for stable parser, validator, CI, exporter, and profile-authoring behavior:

- `%rule` has an outer shape, but pipeline step syntax is not canonical across examples.
- Built-in validation step names are implied by examples rather than specified as a minimum vocabulary.
- Type and relationship declarations contain validation metadata, but the spec does not state which constraints are enforced automatically.
- Pattern validation semantics and regex dialect expectations are not defined.
- `%begin` / `%end` can become ambiguous if declaration directives are allowed inside activation scopes.
- Diagnostics need a minimal mandatory shape without forcing every implementation to emit full editor/CI provenance.
- Implementations need a precise conformance-module graph instead of vague full/partial support claims.

This decision builds on `ADR-0006` and `ADR-0007`. It does not reopen their accepted scoped-activation, identity-map, context-inference, or inheritance decisions.

## Decision

ITM will define validation as a first-class, deterministic, modular capability in candidate workpackage `WP-ITM-04`.

The core decisions are:

- `%rule` keeps the established outer structure and gains a canonical pipeline step schema.
- Implementations that support validation built-ins expose a mandatory built-in validation step vocabulary.
- Type and relationship declarations automatically generate declaration-derived validation constraints.
- Pattern validation becomes a first-class built-in family using regular expressions.
- `%begin` / `%end` activates existing packages, contexts, rules, styles, and exported capabilities; it does not define new declarations inside the block.
- Diagnostics are layered into minimal, standard, and extended provenance shapes.
- The specification defines conformance modules with dependencies so parsers, backends, editors, and plugin hosts can report support precisely.
- Core ITM does not add syntax for disabling individual active rules; rule activation is controlled through package/context activation and validation modes.

### Rule declaration syntax

A validation rule is declared with `%rule`.

Canonical form:

```itm
%rule task_owner_required
{
  select: "[Task]"
  severity: error
  message: "Tasks must define an owner."

  pipeline:
    - step: requireAttribute
      attribute: owner
}
```

Required fields:

```yaml
select: selector expression
severity: error | warning | information | observation
message: human-readable diagnostic message
pipeline: ordered list of validation steps
```

Optional fields:

```yaml
description: longer documentation
code: stable diagnostic code
modes:
  - authoring
  - strict
  - publishing
  - export
appliesTo: nodes | relationships | document | views | any
```

There is no `enabled: false` field in the core specification. If a rule is declared and active in the current validation scope, it runs.

### Pipeline step syntax

The canonical pipeline step shape is:

```yaml
- step: stepName
  parameterName: value
```

Examples:

```yaml
- step: requireId

- step: requireAttribute
  attribute: owner

- step: requireSourceType
  type: bpmn::FlowNode

- step: requireOneOfAttributes
  attributes:
    - timeDate
    - timeDuration
    - timeCycle
```

For authoring convenience, a tolerant parser may accept shorthand forms:

```yaml
- requireId
- requireAttribute: owner
- requireSourceType: bpmn::FlowNode
```

A conforming processor normalizes every accepted shorthand to the canonical step object form before validation execution.

String pseudo-steps containing key-value syntax are invalid in strict mode because they are ambiguous and cannot be safely transformed without guessing author intent:

```yaml
- "requireAttribute: owner"
```

### Built-in validation vocabulary

The `itm.validation.builtins` module defines the built-in validation vocabulary.

Node validation steps:

```yaml
requireId
requireIdPattern
requireLabel
requireNonEmptyLabel
requireLabelPattern
requireType
requireExactType
rejectAbstractType
requireAttribute
requireOneOfAttributes
requireAllAttributes
requireAttributeEnum
optionalAttributeEnum
requireAttributePattern
optionalAttributePattern
requireAttributeType
requireUniqueAttributeValue
requireChildren
requireChildCount
requireAllowedChildrenOnly
requireRequiredChildren
```

Relationship validation steps:

```yaml
requireSourceId
requireKnownSource
requireResolvedTarget
requireTargetResolved
requireTargetResolvedOrRoundTripId
requireSourceType
requireTargetType
requireRelationshipType
requireExactRelationshipType
requireRelationshipId
requireRelationshipIdPattern
requireRelationshipIdOrDeriveStableId
requireRelationshipCount
rejectIncomingRelationship
rejectOutgoingRelationship
```

Document, type-system, and view validation steps:

```yaml
requireUniqueIds
requireUniqueIdWithinNamespace
requireNoDuplicateCanonicalIds
requireNoUnresolvedLinks
requireNoUnknownTypes
requireNoAbstractInstances
requireNoCircularTypeInheritance
requireNoCircularContextInheritance
requireViewReferencesResolve
```

### Pattern validation

Pattern validation uses regular expressions. The default regex dialect is the host implementation's safe ECMAScript-compatible regular-expression subset unless the host explicitly declares another supported dialect. Validators must avoid unsafe regex execution and may reject patterns that exceed configured complexity limits.

Canonical pattern steps:

```yaml
- step: requireIdPattern
  pattern: "[A-Za-z_][A-Za-z0-9_.-]*"

- step: requireLabelPattern
  pattern: "^[A-Z].*"

- step: requireAttributePattern
  attribute: sourcePk
  pattern: "^[0-9]+$"

- step: optionalAttributePattern
  attribute: externalId
  pattern: "^[A-Z]{3}-[0-9]+$"

- step: requireRelationshipIdPattern
  pattern: "rel_[A-Za-z0-9_]+"
```

`requireXPattern` means the value must exist and match the pattern. `optionalXPattern` means the value is checked only when it exists.

### Declaration-derived constraints

Type declarations are not merely documentation. A processor supporting `itm.types` and `itm.validation.declarations` automatically derives validation constraints from type metadata.

For an entity type, declaration-derived constraints include:

- `rejectAbstractType` if `abstract: true`;
- `requireAttribute` for each `requiredAttributes` entry;
- warning-level `requireAttribute` for each `recommendedAttributes` entry;
- `requireAllowedChildrenOnly` for `allowedChildren`.

For a relationship type, declaration-derived constraints include:

- `requireSourceType` for `sourceTypes`;
- `requireTargetType` for `targetTypes`;
- `requireResolvedTarget` when `requiresResolvedTarget: true`;
- warning-level relationship identity or recommended attribute checks for `recommendedAttributes`.

Declaration-derived constraints run before explicit `%rule` blocks. Explicit rules remain the correct place for domain-specific checks such as BPMN same-flow-scope validation or ArchiMate relationship-matrix validation.

### Cardinality

Relationship type declarations may define `cardinality`.

Allowed compact values:

```yaml
cardinality: optional-one
cardinality: required-one
cardinality: optional-many
cardinality: required-many
cardinality: many
```

Canonical meanings:

| Value | Min | Max |
|---|---:|---:|
| `optional-one` | 0 | 1 |
| `required-one` | 1 | 1 |
| `optional-many` | 0 | * |
| `required-many` | 1 | * |
| `many` | 0 | * |

Expanded form:

```yaml
cardinality:
  min: 1
  max: 1
```

If a relationship type declares cardinality, validators check the number of outgoing relationships of that type from each matching source node unless the relationship type explicitly declares another counting direction.

### Type matching

Validation type checks are polymorphic by default, matching the inheritance semantics from `ADR-0007`.

For example, if `bpmn::Task` extends `bpmn::FlowNode`, then a validation step requiring `bpmn::FlowNode` accepts a `bpmn::Task`.

Exact type checks use explicit exact forms:

```yaml
- step: requireExactType
  type: bpmn::FlowNode
```

Selectors use the same convention:

```itm
[=bpmn::FlowNode]
```

The existing ad hoc `includeSubtypes` pipeline step pattern is deprecated because subtype inclusion is the default behavior.

### Plugin and domain validation steps

Unqualified pipeline steps are ITM built-ins. Qualified steps are plugin or domain steps:

```yaml
- step: bpmn.rules.requireSameFlowScope
- step: archimate.rules.validateRelationshipAllowed
- step: archimate.exchange.validateExportReadiness
```

Qualified steps require a matching `%require`. Missing, incompatible, or disabled plugin steps produce diagnostics. Plugin steps declare supported input kinds, may emit multiple diagnostics, must not mutate the model, and run against a resolved normalized model after parsing, include resolution, namespace resolution, type inference, identity-map application, and declaration-derived constraints.

### Rule activation

Rules become active through declaration and package/context activation.

- A `%rule` declared in a normal model file is active for the whole file.
- A `%rule` declared inside a package is exported as part of the package and remains inactive until the package is activated.
- `%using packageName` activates the package's default exports, including rules.
- Named contexts may reference rule sets, styles, defaults, inference rules, or package exports.
- `%begin contextName` activates that context for enclosed model content.

### `%begin` / `%end` scope boundary

`%begin` / `%end` is an activation mechanism, not a declaration mechanism.

Allowed inside `%begin` / `%end` in the core scoped-activation model:

```text
nodes
relationships
relationship blocks
comments
description blocks
attribute blocks
nested %begin / %end
```

Not allowed inside `%begin` / `%end` in the core scoped-activation model:

```text
%rule
%style
%entitytype
%relationshiptype
%package
%namespace
%require
%repository
```

Declarations remain hoisted. Activations are explicit. Only `%begin` / `%end` is positional.

### Rule execution order

Validation execution is deterministic:

```text
1. parse raw syntax and comments
2. parse directives
3. resolve repositories
4. resolve includes and packages
5. resolve namespaces
6. apply file-wide %using activations
7. enter and exit %begin / %end activation scopes
8. apply identity maps
9. infer node and relationship types from active contexts
10. build type and relationship inheritance graphs
11. generate automatic declaration-derived constraints
12. execute declaration-derived constraints
13. execute active explicit %rule blocks
14. execute plugin/domain validation steps
15. emit diagnostics
```

Rules do not mutate the model. They only emit diagnostics.

### Diagnostics levels

Diagnostics are layered.

Minimal diagnostic, mandatory for any implementation that emits diagnostics:

```yaml
severity: error
message: "Task must define owner."
```

Standard diagnostic, recommended for editors and validators:

```yaml
source: itm.validator
code: itm.validation.required-attribute
severity: error
message: "Task must define owner."
file: process.itm
line: 42
node: receive_order
relationship: null
rule: tasks_need_owner
pipelineStep: requireAttribute
```

Extended provenance, optional for profile debugging, CI, package governance, and advanced editors:

```yaml
selector: "[Task]"
context: bpmn20_profile.process
package: bpmn20_profile
activationScope: bpmn20_profile.process
matchedElementKind: node
attribute: owner
```

### Validation modes

ITM defines standard validation modes:

| Mode | Meaning |
|---|---|
| `authoring` | tolerant authoring mode, optimized for helpful diagnostics |
| `strict` | rejects malformed or ambiguous constructs |
| `publishing` | validates model readiness for documentation/view publication |
| `export` | validates readiness for external-format export |

If a rule omits `modes`, it applies in all modes. Validation modes are not rule-disabling syntax; they are a standard way to run different validation profiles for different processing purposes.

### Conformance modules

ITM will define conformance modules with dependencies. An implementation may support a subset of modules if it declares support accurately.

Core module graph:

```text
itm.text
  -> itm.model
      -> itm.links
          -> itm.relationships
      -> itm.directives
          -> itm.metadata
          -> itm.includes
          -> itm.namespaces
              -> itm.types
                  -> itm.selectors
                      -> itm.validation.core
                          -> itm.validation.builtins
                          -> itm.validation.declarations
                          -> itm.validation.plugins
                  -> itm.contexts
          -> itm.packages
              -> itm.contexts
              -> itm.validation.core
          -> itm.repositories
      -> itm.styles
      -> itm.views
          -> itm.viewpoints
          -> itm.visual-editing
```

Initial module definitions:

| Module | Capability |
|---|---|
| `itm.text` | lines, indentation, comments/trivia |
| `itm.model` | ids, tags, attributes, descriptions |
| `itm.links` | `@target`, typed links, relationship attributes |
| `itm.relationships` | relationship identity, implicit containment/order relationships |
| `itm.directives` | directive parsing and preservation |
| `itm.metadata` | `%metadata` |
| `itm.includes` | `%include` |
| `itm.namespaces` | `%namespace`, qualified names |
| `itm.types` | `%entitytype`, `%relationshiptype`, inheritance |
| `itm.selectors` | selector syntax and Boolean selector logic |
| `itm.validation.core` | `%rule`, severity, minimal diagnostics |
| `itm.validation.builtins` | built-in validation step vocabulary |
| `itm.validation.declarations` | automatic validation derived from type and relationship declarations |
| `itm.validation.plugins` | qualified plugin validation steps via `%require` |
| `itm.contexts` | `%context`, `%begin`, `%end`, inference and scoped activation |
| `itm.packages` | `%package`, `%using`, package exports |
| `itm.repositories` | `%repository` |
| `itm.styles` | `%style`, cascading style rules |
| `itm.viewpoints` | `%viewpoint`, projection/rendering pipelines |
| `itm.views` | `%view`, view deltas |
| `itm.visual-editing` | controlled write-back from visual editing |

Compliance declarations use a structured support list:

```yaml
itmCompliance:
  supports:
    - itm.text
    - itm.model
    - itm.links
    - itm.directives
    - itm.namespaces
    - itm.types
    - itm.selectors
    - itm.validation.core
    - itm.validation.builtins
```

## Consequences

### Positive

- Validation becomes predictable, portable, and implementable.
- Simple parsers can remain small while profile-grade processors gain a stable path for BPMN, ArchiMate, EA dashboard, and future semantic profiles.
- Declaration-derived validation reduces duplication between profile metadata and explicit rules.
- `%begin` / `%end` remains understandable because it activates existing capabilities instead of hiding declarations inside scoped blocks.
- Diagnostics support both tiny parsers and richer editor/CI provenance.
- TextForge and external tools can report exact ITM support through conformance modules.

### Negative / trade-offs

- The validation specification becomes larger.
- Implementers must normalize rule steps before execution.
- Some current examples must migrate to canonical step syntax.
- Ad hoc patterns such as `includeSubtypes` pipeline steps and string pseudo-steps become deprecated.
- Plugin validation providers need a manifest for supported rule steps and input kinds.

### Follow-up required

- Update `docs/reference/specs/itm-format.md` with the canonical validation model and conformance modules if this proposal is accepted.
- Audit ITM, BPMN, ArchiMate, EA dashboard, and scoped-context examples for string pseudo-steps, shorthand steps, `includeSubtypes`, cardinality vocabulary, and pattern validator opportunities.
- Add parser/model support for normalized rule steps, active rule sets, declaration-derived constraints, diagnostic lists, compliance declarations, and missing capability diagnostics.
- Add validation tests for built-in steps, declaration-derived rules, rule activation, mode filtering, polymorphic type matching, strict-mode invalid forms, and compliance declarations.
- Define plugin validation provider manifests through the existing `%require` / capability registry model.

## Scope

This decision applies to:

- Module: `MOD-ITM`
- Workpackage: `WP-ITM-04`
- Release candidate: `R-LOCAL-AUTHORING-MVP`
- Package: `@textforge/itm`
- Canonical spec: `docs/reference/specs/itm-format.md`
- Related profile consumers: BPMN, ArchiMate, EA dashboard, tables/catalogues, and ITM publication flows

This ADR introduces a candidate workpackage. It does not claim implementation or validation status.

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
