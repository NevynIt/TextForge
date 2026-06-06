# Indented Text Model Format

> Draft updated with comments, identity maps, named contexts, scoped activation, package context exports, and explicit scope/resolution rules.

## 1. Purpose and rationale

The Indented Text Model format, or ITM, is a human-readable text format for describing structured models.

It starts from the simplest possible structure: one line of text represents one thing. From there, it grows incrementally into a format that can describe comments, entities, relationships, hierarchy, local and canonical identifiers, typed semantic models, validation rules, views, visual layouts, reusable packages, named contexts, scoped activation blocks, and repositories.

The design goal is not to replace specialist formats such as BPMN XML, ArchiMate exchange files, Graphviz DOT, Mermaid, GraphML, JSON, YAML, or SVG. Instead, ITM is intended to act as a resilient authoring and interchange layer between them.

ITM is designed around a few principles:

- **Human readability**: a person should be able to open the file in any text editor and understand most of it.
- **Progressive complexity**: a simple list is already a valid model; advanced constructs are added only when needed.
- **Model-first semantics**: the primary content is the model: entities, relationships, metadata, constraints, views, package definitions, and scoped context activations.
- **Plain-text resilience**: the format remains inspectable, diffable, mergeable, searchable, and recoverable even without the original tool.
- **Collaboration readiness**: ITM files fit naturally in Git, CI/CD workflows, code review, automated validation, and documentation pipelines.
- **Tool independence**: renderers such as Mermaid, Graphviz, Cytoscape, jsMind, Sigma, SVG viewers, or BPMN tools are presentation engines, not the canonical source.
- **Composable models**: models can include other files, use namespaces, import packages, activate contexts, and resolve reusable content from repositories.
- **Authoring-friendly identity**: files may use short local ids while processors map them to globally unique canonical ids for large repositories.
- **Explicit activation**: reusable package/profile content is not active merely because it exists; it is activated by `%using` or by scoped `%begin` / `%end` blocks.
- **Extensible automation**: pipelines, rules, transformations, and views can be backed by built-in logic, plugins, or scripting engines.

ITM can therefore be used as:

- an authoring format for lightweight models;
- an intermediate conversion format between modelling tools;
- a storage backbone for model repositories;
- a collaboration format for shared semantic models;
- a diagram generation source;
- a validation and diagnostics source;
- a human-readable fallback representation for richer models;
- a profile-driven authoring format where types and relationships can be inferred from named contexts;
- a large-repository format where local ids can be mapped to canonical identities.

The same file can begin life as a simple list and later evolve into a typed, validated, styled, multi-view model.

---

## 2. Incremental model

ITM is best understood as a stack of progressively richer features.

A conforming implementation may support only the lower levels, or may support the full format.

Recommended conceptual levels:

| Level | Feature | Purpose |
|---|---|---|
| 1 | Simple list | One line equals one entity |
| 2 | Comments and trivia | Authoring notes that do not affect the model |
| 3 | Tags | Lightweight classification |
| 4 | Indentation | Hierarchy and containment |
| 5 | Automatic relationships | Generated containment and ordering links |
| 6 | Node ids | Stable local references to entities |
| 7 | Identity maps | Mapping local ids to canonical/global ids and aliases |
| 8 | Links | Explicit relationships between entities |
| 9 | Typed links | Named relationship semantics |
| 10 | Markdown descriptions | Rich textual explanation attached to entities |
| 11 | Attributes | Structured data attached to nodes and edges |
| 12 | Directives | File-level instructions and declarations |
| 13 | Metadata | Document-level structured metadata |
| 14 | Includes | Composition from multiple files |
| 15 | Namespaces | Qualified names and conflict management |
| 16 | Types | Entity and relationship type definitions |
| 17 | Named contexts | Reusable inference/default rules, always named |
| 18 | Scoped activation | `%begin` / `%end` activation of contexts, packages, or profiles |
| 19 | Selectors | Shared query mechanism for styles, rules, and views |
| 20 | Validation rules | Model constraints and diagnostics |
| 21 | Plugins | External pipeline steps and rule engines |
| 22 | Cascading styles | Presentation guidance independent from semantics |
| 23 | Viewpoints | Reusable pipelines for model projections |
| 24 | Views | Specific viewpoint instances with deltas |
| 25 | Visual editing | Controlled write-back from rendered views |
| 26 | Explicit overlays | Controlled redefinition and patching |
| 27 | Packages | Reusable bundled definitions and named contexts |
| 28 | Repositories | Remote or shared package/document sources |

Named contexts are not a temporary compatibility feature. They are the permanent mechanism for profile-driven defaults, type inference, relationship inference, and scoped package/profile activation.

---

## 3. Simple list

The minimum ITM document is a text file with one item per line.

```itm
Customer
Order
Invoice
Payment
Shipment
```

Each non-empty line defines one entity.

At this level there are no ids, no explicit relationships, no types, and no attributes. The model is a flat collection of entities.

A parser can represent this as:

```yaml
nodes:
  - label: Customer
  - label: Order
  - label: Invoice
  - label: Payment
  - label: Shipment
```

This is the foundation of the format: plain lines of text are already meaningful.

---

## 4. Comments and trivia

Comments are authoring trivia. They are intended for human notes, explanations, temporary reminders, disabled snippets during drafting, and round-tripping in editors.

A whole-line comment starts with `//` after optional indentation.

```itm
// This comment is ignored by the model processor.
Customer
Order
```

A trailing comment starts with `//` after at least one whitespace character.

```itm
&order Order  // local authoring note
```

The `//` marker should not be interpreted as a comment marker inside ordinary text unless it appears either:

- at the start of the line after indentation; or
- after whitespace in a position where the line parser is outside quoted strings, attribute blocks, and Markdown descriptions.

This prevents ordinary values such as URLs from being truncated accidentally.

```itm
&api API endpoint https://example.org/orders
```

Comments are not model content.

They do not create:

- nodes;
- relationships;
- tags;
- attributes;
- descriptions;
- rules;
- diagnostics by themselves.

A parser may preserve comments in a concrete syntax tree so that an editor can save the file without destroying authoring notes.

A semantic model export may ignore comments completely.

### 4.1 Comment interaction with other constructs

Comments are recognized in normal ITM syntax lines before semantic parsing.

They are not recognized inside Markdown description blocks, because text after `|` is Markdown content.

```itm
&order Order
| The string // remains part of the Markdown description.
```

They are not recognized inside YAML-compatible attribute blocks. Attribute blocks may use the comment rules of the YAML parser if supported by the implementation.

```itm
&order Order
{
  status: draft  # YAML-style comment, if supported by the attribute parser
}
```

Comment-only lines are ignored for hierarchy, ordering relationships, and attachment of immediately following description or attribute blocks. A comment-only line may appear between a node and its description or attribute block without changing the owner of that block.

```itm
&order Order
// explanation for the author, not model content
| Description still belongs to Order.
```

The `#` character is not an ITM comment marker because `#tag` is part of the ITM model syntax.

---

## 5. Tags

Tags provide lightweight classification.

A tag is written with `#` followed by a tag name.

```itm
Customer #external
Order #core
Invoice #finance
Payment #finance #critical
Shipment #logistics
```

Tags may appear anywhere in the label text.

```itm
Capture #customer feedback from support channels
Review order exceptions #operations before invoicing
```

A parser extracts the tags while preserving the readable label. Depending on implementation mode, the visible label may either retain or hide the tag markers.

Example parsed form:

```yaml
label: Capture customer feedback from support channels
tags:
  - customer
```

Tags can be used for:

- search;
- filtering;
- styling;
- validation;
- viewpoint selection;
- navigation;
- lightweight classification without defining a formal type system.

Recommended tag syntax:

```text
#[A-Za-z][A-Za-z0-9_-]*
```

---

## 6. Indented list

Indentation creates hierarchy.

```itm
Order handling
  Receive order
  Validate order
  Fulfil order
    Pick items
    Pack shipment
    Dispatch shipment
  Invoice order
```

A child is created by indenting a line one level deeper than the previous relevant parent line.

This creates an implicit containment structure:

```text
Order handling contains Receive order
Order handling contains Validate order
Order handling contains Fulfil order
Fulfil order contains Pick items
Fulfil order contains Pack shipment
Fulfil order contains Dispatch shipment
Order handling contains Invoice order
```

Indentation is part of the formal syntax and must be deterministic.

Canonical ITM uses **two spaces per indentation level**.

Tabs are allowed only as an input convenience. A tab is defined as exactly two spaces. Editors and parsers should normalize tabs to spaces before parsing, and tools should write normalized spaces back to disk.

Strict indentation rules:

- canonical files should use spaces only;
- one indentation level is two spaces;
- indentation must be a multiple of two spaces after tab normalization;
- same indentation means sibling;
- one deeper indentation level means child;
- smaller indentation means return to an earlier parent level;
- a dedent must match a previous indentation level;
- files that mix raw tabs and spaces in indentation should be normalized before parsing;
- if a parser cannot or does not normalize indentation, it must reject mixed tabs and spaces;
- inconsistent indentation is a validation error.

This avoids fragile editor-dependent interpretation while keeping the format compact. Long lines can still remain readable because one tab is equivalent to only two spaces.

The result is a tree or forest of entities.

---

## 7. Automatic relationships

Indentation is not just visual structure. It generates model relationships.

### 7.1 Containment relationship

Every parent-child indentation link creates an implicit `contains` relationship.

```itm
System
  Component A
  Component B
```

Equivalent generated relationships:

```text
System contains Component A
System contains Component B
```

The reverse relationship may be exposed as `contained_by`.

Internally, implementations may represent hierarchy edges as a reserved relationship kind, for example:

```text
=>
```

The hierarchy edge can be selected, styled, filtered, validated, and transformed like other relationships.

### 7.2 Ordering relationship

The order of sibling nodes also has meaning.

```itm
Process
  Step 1
  Step 2
  Step 3
```

The parser may generate sequence relationships:

```text
Step 1 followed_by Step 2
Step 2 followed_by Step 3
```

and the reverse:

```text
Step 2 follows Step 1
Step 3 follows Step 2
```

These relationships are useful for:

- process descriptions;
- ordered checklists;
- generated diagrams;
- validation of ordered structures;
- transformations into flow diagrams.

Ordering relationships should be generated deterministically from document order. An implementation may expose them as virtual relationships rather than writing them back into the file.

---

## 8. Node ids

An entity may have a stable identifier.

The identifier is written at the start of the line with `&id`.

```itm
&customer Customer
&order Order
&invoice Invoice
```

The id is metadata, not part of the label.

Parsed form:

```yaml
id: customer
label: Customer
```

Recommended local id syntax:

```text
[A-Za-z][A-Za-z0-9_-]*
```

A namespace-qualified id uses double colons:

```text
namespace::local_id
```

For example:

```itm
&local::order Order
```

The double-colon namespace delimiter is used consistently for ids, types, relationship types, selectors, and package-qualified names.

Ids are used for:

- explicit links;
- overlays;
- validation;
- styling;
- external references;
- stable generated outputs;
- visual editing write-back.

Ids must be unique within their namespace unless an explicit overlay is declared. Duplicate ids in the same namespace are validation errors by default. Namespace and overlay rules are described later.### Local ids and canonical identity

The `&id` written on a node is the id used for authoring and local link resolution in the current document or namespace.

It may be short, readable, and hand-written.

For large repositories, integrations, or generated enterprise-scale models, a node may also have a canonical identity that is globally unique and less convenient to write manually. Canonical identity is handled by identity maps rather than by forcing every author to write GUID-like ids on every node.

---

## 9. Identity maps and canonical ids

Identity maps connect author-friendly local ids to globally unique canonical ids and to external aliases.

They allow a file to use readable ids while still participating in a large repository where global uniqueness matters.

A file declares identity mappings with `%idmap` followed by a YAML-compatible block.

```itm
%idmap
{
  order: "enterprise::550e8400-e29b-41d4-a716-446655440000"
  customer:
    canonical: "enterprise::a1e21492-0496-43d1-9b94-b5874f42a66e8"
    aliases:
      - "crm::Customer"
      - "shared:domains/sales.itm#Customer"
}
```

A compact form maps a local id directly to a canonical id.

```yaml
order: "enterprise::550e8400-e29b-41d4-a716-446655440000"
```

The expanded form may include:

```yaml
canonical: "enterprise::a1e21492-0496-43d1-9b94-b5874f42a66e8"
aliases:
  - "crm::Customer"
  - "shared:domains/sales.itm#Customer"
```

The canonical id is the preferred global identity of the model element.

Aliases are additional identifiers that are known to refer to the same model element.

Identity equivalence is not a normal model relationship. It does not create a semantic edge such as `same_as`. It is resolved during identity processing before ordinary relationship validation.

### 9.1 Identity map scope

In a normal model file, `%idmap` applies to the current file only.

In a package file, `%idmap` belongs to the package export boundary. It is not active in a consumer merely because the file is included. It becomes available when the package is activated with `%using` or with scoped `%begin` / `%end` activation.

Unqualified keys in an identity map refer to ids as authored in the file after local namespace rules are applied. Qualified keys are recommended when the same file uses multiple namespaces.

```itm
%idmap
{
  local::order: "enterprise::550e8400-e29b-41d4-a716-446655440000"
}
```

### 9.2 Identity map validation

A validator should report diagnostics when:

- an identity map key does not resolve to any node in the relevant scope;
- two different canonical ids are assigned to the same local id;
- the same canonical id is assigned to multiple local ids without an explicit alias/equivalence policy;
- an alias conflicts with another canonical id;
- a required canonical id is missing in strict repository mode;
- an identity map is imported from a package but not activated.

A full repository processor may use canonical ids to detect cross-file equivalence, duplicate model elements, merge conflicts, and stable export identifiers.

---

## 10. Links and relationships

Explicit relationships are written as references beginning with `@`.

The simplest relationship form is:

```itm
&order Order
&invoice Invoice
&payment Payment
Order lifecycle @invoice @payment
```

In this form, `@invoice` and `@payment` create outgoing relationships from the current node to the referenced nodes.

The simplest possible link must remain simple:

```itm
@target
```

This is a core usability rule of ITM.

A link target is an identifier. Since ids use typical programming identifier syntax and contain no spaces, links can be separated by whitespace.

Example:

```itm
&order Order @invoice @payment @shipment
```

Equivalent parsed form:

```yaml
id: order
label: Order
relationships:
  - target: invoice
  - target: payment
  - target: shipment
```

If no relationship type is provided, a default type such as `related_to` may be used.

---

## 11. Typed links

Typed links add relationship semantics while preserving the simple `@target` form.

The recommended syntax is:

```itm
@relationship_type:target
```

Example:

```itm
&order Order @creates:invoice @paid_by:payment @fulfilled_by:shipment
```

Parsed form:

```yaml
id: order
label: Order
relationships:
  - type: creates
    target: invoice
  - type: paid_by
    target: payment
  - type: fulfilled_by
    target: shipment
```

The single colon `:` separates the relationship type from the target.

Namespaces use double colons `::`.

This gives a clean delimiter hierarchy:

```itm
@target
@relationship_type:target
@namespace::relationship_type:namespace::target
```

Example:

```itm
&customer [archimate::BusinessActor] Customer
&journey [archimate::BusinessProcess] Customer Journey @archimate::serves:local::customer
```

Parsed form:

```yaml
relationships:
  - type: archimate::serves
    target: local::customer
```

A tokenizer should treat `::` as part of a qualified name and `:` as the relationship assignment delimiter. This avoids ambiguous parsing of namespace-qualified relationship types and namespace-qualified targets.

Typed links can be used to represent semantic relationships such as:

- `depends_on`;
- `satisfies`;
- `verifies`;
- `mitigates`;
- `serves`;
- `realizes`;
- `triggers`;
- `flows_to`;
- `owned_by`.

---

## 12. Relationship attributes and relationship identity

Relationships can have attributes.

For simple relationships, inline attributes may be used:

```itm
&order Order @creates:invoice {confidence: high, source: workshop}
```

For richer relationships, a relationship may be written as a relationship block below the node.

```itm
&order Order
@creates:invoice
{
  confidence: high
  source: workshop
  status: proposed
}
```

Relationship identity is optional.

The way to assign an id to a relationship is to use the `id` attribute.

```itm
&order Order
@creates:invoice
{
  id: rel_order_invoice
  confidence: high
  source: workshop
}
```

This preserves the simple link forms:

```itm
@target
@connects_to:target
```

while still allowing a relationship to be referenced, styled, validated, or patched later.

If no relationship id is provided, the implementation may derive an internal identity from:

```text
source node id + relationship type + target node id + occurrence index
```

Relationship ids are useful when:

- multiple relationships exist between the same two nodes;
- a relationship needs attributes;
- a relationship needs diagnostics;
- a relationship needs styling;
- a view needs to store visual deltas against that specific edge;
- external tools require stable edge identifiers.

---

## 13. Markdown descriptions

An entity may have a rich description block.

Description lines start with `|`.

```itm
&order Order
| Represents a customer order.
|
| The order moves through validation, fulfilment, invoicing, and payment.
```

The text after the pipe is interpreted as Markdown.

The description is attached to the preceding entity. It is not a child node and does not change the entity label.

Example parsed form:

```yaml
id: order
label: Order
description: |
  Represents a customer order.

  The order moves through validation, fulfilment, invoicing, and payment.
```

Markdown descriptions may include ordinary Markdown:

```itm
&risk Payment failure
| ## Rationale
|
| This risk applies when the payment provider is unavailable.
|
| - customer cannot complete order
| - invoice remains unpaid
| - manual intervention may be required
```

They may also include fenced blocks for engines supported by the environment, such as Mermaid or Graphviz DOT.

``````itm
&process Order process
| This process can also be illustrated locally:
|
| ` ` `mermaid
| flowchart TD
|   A[Order] --> B[Invoice]
|   B --> C[Payment]
| ` ` `
``````

``````itm
&dependency Dependency example
| ` ` `dot
| digraph G {
|   Order -> Invoice;
|   Invoice -> Payment;
| }
| ` ` `
``````

The Markdown description is documentation attached to the model element. It is not the canonical graph structure, though embedded diagrams may be rendered as part of documentation views.

---

## 14. Node and edge attributes

Attributes are structured data attached to nodes or relationships.

Attributes are delimited by curly braces and expressed using YAML-compatible syntax.

### 14.1 Inline node attributes

For short attributes, an inline block may be used.

```itm
&invoice Invoice {status: draft, owner: finance}
```

### 14.2 Block node attributes

For richer attributes, use a block after the entity line and optional description.

```itm
&invoice Invoice
| Represents a billing document issued to the customer.
{
  status: draft
  owner: finance
  priority: high
  lifecycle:
    - created
    - approved
    - sent
    - paid
}
```

### 14.3 Edge attributes

Edge attributes can be written after a relationship.

```itm
&order Order
@creates:invoice
{
  id: rel_order_creates_invoice
  confidence: high
  source: process workshop
}
```

### 14.4 Attribute interpretation

Attributes are semantic data unless interpreted by a renderer, pipeline, rule, or style layer.

For example:

```itm
&component_a Component A {criticality: high, owner: platform}
```

is semantic metadata.

Whereas:

```itm
&component_a Component A {fill: '#e8f1ff', size: 18}
```

may be interpreted as rendering guidance by graph or mind map viewers.

To avoid confusion, the recommended approach is:

- use ordinary attributes for model facts;
- use `%style` for general presentation rules;
- reserve direct visual attributes for local overrides or simple cases.

---

## 15. Directives

Directives are instructions, declarations, or structural controls.

A directive starts with `%`.

Examples:

```itm
%metadata
%include common-types.itm
%namespace bpmn https://www.omg.org/spec/BPMN/20100524/MODEL
%idmap
%entitytype Task
%relationshiptype depends_on
%context bpmn_process
%begin bpmn_process
%end bpmn_process
%style [Task] { fill: '#e8f1ff' }
%viewpoint process_map
%view current_process_map
%package bpmn_profile
%using bpmn_profile
%repository shared https://example.org/models
%require itm.graphviz ^1.0.0
```

Directives do not create normal model entities unless the directive explicitly defines model content such as types, rules, styles, viewpoints, packages, contexts, repositories, or reference entities.

### 15.1 Directive classes

ITM distinguishes between declaration directives, activation directives, and structural activation directives.

| Directive kind | Examples | Scope behavior |
|---|---|---|
| File/package declarations | `%metadata`, `%repository`, `%namespace`, `%require`, `%package`, `%idmap` | Hoisted to the current file or package scope unless the directive defines stricter placement |
| Model/profile declarations | `%entitytype`, `%relationshiptype`, `%rule`, `%style`, `%viewpoint`, `%view`, `%context` | Define named content in the current file or package; generally hoisted within that scope |
| File-wide activations | `%using package_name` | Activate package/profile exports for the current file unless used inside an implementation-defined higher-level container |
| Scoped activations | `%begin NAME` / `%end NAME` | Positional, stack-based activation of a named context, package, profile, or package context |

The default rule is:

```text
Declarations are hoisted.
Activations are explicit.
Only %begin/%end is positional.
Includes do not leak local active state.
Packages export; consumers activate.
```

### 15.2 Placement rules

Non-structural directives may appear anywhere at top level in a file, but processors should treat them as declarations for the whole relevant file/package scope rather than as “from here onwards” effects.

For readability, declarations are recommended near the beginning of a file.

A strict processor may warn when hoisted declarations appear after model content, especially for `%metadata`, `%repository`, `%include`, `%namespace`, `%package`, `%require`, `%using`, and `%idmap`.

The structural directives `%begin` and `%end` are different. They are positional and may appear where model lines may appear. They do not create nodes, but they change the active context stack for the lines between them.

Canonical style places `%begin` and `%end` at the same indentation level as the model lines they scope.

```itm
%begin risk_profile
&r1 Supplier delay
&r2 Approval delay
%end risk_profile
```

Inside an existing hierarchy, scoped activation may be placed at the child indentation level.

```itm
&programme Programme
  %begin risk_profile
  &r1 Supplier delay
  &r2 Approval delay
  %end risk_profile
```

The `%begin` and `%end` lines do not consume an indentation level and do not become semantic parents. Entity hierarchy is resolved over entity lines, while context activation is resolved over document order.

Unknown directives may be:

- rejected by a strict parser;
- preserved by a tolerant parser;
- ignored with a warning;
- passed to a plugin if the relevant `%require` is present.

---

## 16. Metadata

Document metadata is written using the `%metadata` directive followed by a YAML block.

```itm
%metadata
{
  title: Order handling model
  version: 1.0
  author: Architecture Team
  defaultNamespace: example
  defaultRelationshipType: related_to
}
```

Metadata applies to the document as a whole.

It may include:

- title;
- version;
- description;
- author or owner;
- default namespace;
- default language/profile;
- creation/update information;
- intended rendering mode;
- validation mode;
- repository references.

Metadata is not a model node.Metadata defaults are document-level authoring defaults. They should not be used for complex scoped inference. Profile-driven defaults, type inference, relationship inference, and package-specific authoring behavior should be declared in named `%context` definitions and activated explicitly.

---

## 17. Include

The `%include` directive composes a model from another ITM file.

```itm
%include common-types.itm
%include shared/risks.itm
%include shared:profiles/bpmn.itm
```

Includes allow a model to be composed from multiple files.

Possible uses:

- shared type definitions;
- common relationship definitions;
- reusable style libraries;
- validation rules;
- reference data;
- model fragments;
- package manifests;
- named contexts;
- identity maps.

### 17.1 Include is not textual paste

An ITM include is not a C-preprocessor-style textual insertion.

An included file is parsed as a separate module with its own local directive scope, namespace declarations, `%using` declarations, identity maps, contexts, validation rules, and diagnostics.

The included file may contribute semantic model content, package exports, or both, depending on what it contains and on processor policy.

The included file's active local state does not leak into the including file.

This means:

```itm
%include shared:profiles/bpmn.itm
```

does not automatically make every BPMN type, rule, style, context, or namespace active in the including file.

The including file activates package/profile content explicitly:

```itm
%include shared:profiles/bpmn.itm
%using bpmn_profile
```

or in a scoped block:

```itm
%include shared:profiles/bpmn.itm

%begin bpmn_profile.process
&order_process Order handling
  &receive Receive order
%end bpmn_profile.process
```

### 17.2 Package includes and fragment includes

If an included file declares a `%package`, its package exports become available to the including file. They are not active until `%using` or `%begin` activates them.

If an included file is a model fragment without a `%package`, an implementation may merge or reference its model content as part of the current model. Even in this case, the included file is processed in its own local scope and source locations should be preserved for diagnostics.

### 17.3 Include validation

An implementation should protect against:

- circular includes;
- missing files;
- unauthorized paths;
- incompatible namespaces;
- unresolved package references;
- conflicting package names;
- conflicting canonical identities;
- conflicting ids after merge;
- duplicate package imports with incompatible versions;
- attempts by an included file to leak local active state into the including file.

In local-only or security-conscious environments, include paths should be restricted to approved locations.

---

## 18. Namespaces

Namespaces prevent name collisions and allow profiles to coexist.

A namespace is declared with `%namespace`.

```itm
%namespace bpmn https://www.omg.org/spec/BPMN/20100524/MODEL
%namespace archimate https://www.opengroup.org/archimate
%namespace local https://example.org/local-model
```

A namespace declaration binds a prefix to a namespace URI or identifier.

ITM uses a strict delimiter hierarchy:

- `::` qualifies a name with a namespace;
- `:` assigns a relationship type to a target;
- repository references may use their own repository syntax, such as `shared:path/to/file.itm`, because they appear in directive values rather than in model identifiers.

Qualified names can be used for types, ids, relationships, selectors, and package content.

```itm
&local::order [bpmn::Task] Validate order
&local::payment [archimate::BusinessObject] Payment
```

Relationship types may also be namespace-qualified:

```itm
&local::task [bpmn::Task] Validate order @archimate::serves:local::customer
```

This parses cleanly as:

```yaml
type: archimate::serves
target: local::customer
```

The parser should treat `::` as part of a qualified name and the single `:` as the relationship assignment delimiter.

General form:

```text
@relationship-type:target-id
```

where either side may be namespace-qualified:

```text
@namespace::relationship-type:namespace::target-id
```

Namespace rules:

- ids must be unique within a namespace unless an explicit overlay is used;
- unqualified ids belong to the current or default namespace;
- imported packages should not pollute the current namespace unless explicitly used;
- namespace aliases should be stable within a document;
- namespace URIs identify semantic ownership, not necessarily fetchable URLs;
- namespace-qualified names should use `::`, not `:`.### Namespace scope

A `%namespace` declaration binds a prefix within the current file or package module.

Namespace prefixes do not leak through `%include`.

A package may export namespace bindings as part of its default exports. A consumer activates those exported bindings with `%using package_name` or scoped `%begin package_name` / `%end package_name`.

Contexts may define `defaultNamespace` to control how unqualified ids are interpreted inside an active scope. This is different from declaring a prefix. A namespace declaration makes a prefix known; a context default decides which namespace unqualified authored names belong to while the context is active.

Explicit namespace-qualified ids and types always override context defaults.

---

## 19. Node and edge types

Types add formal semantics.

A node type is written in square brackets after the optional id.

```itm
&task1 [Task] Validate order
&event1 [Event] Order received
&gateway1 [Gateway] Payment required?
```

Types may be namespace-qualified.

```itm
&task1 [bpmn::Task] Validate order
&actor1 [archimate::BusinessActor] Customer
```

Relationship types are declared in links:

```itm
&task1 [Task] Validate order @triggers:task2
&task2 [Task] Send invoice
```

Types can also be declared as reusable definitions.

```itm
%entitytype Task
{
  description: A unit of work performed in a process.
  requiredAttributes:
    - owner
    - status
}

%relationshiptype triggers
{
  description: Indicates that completion of one element causes another to start.
  sourceTypes:
    - Task
    - Event
  targetTypes:
    - Task
    - Event
}
```

Type declarations can support:

- documentation;
- validation;
- styling defaults;
- editor completion;
- model navigation;
- transformation to external formats;
- semantic interoperability.### Explicit types and inferred types

A type explicitly written on an entity or relationship always wins over profile/context inference.

```itm
&task1 [bpmn::Task] Validate order
```

If no type is written, an active named context may infer the type from rules such as:

- active package/profile;
- root node position;
- parent type;
- child position;
- relationship source and target types;
- relationship name;
- label pattern;
- configured default type.

Inferred types should be stored in the resolved semantic model and may be reported as information-level diagnostics when the processor is configured to explain inference.

---

## 20. Named contexts and scoped activation

A context is a named set of authoring defaults and inference rules.

Contexts are always named.

A context is declared with `%context NAME` followed by a YAML-compatible block.

```itm
%context bpmn_process
{
  defaultNamespace: local
  rootType: bpmn::Process
  defaultRelationshipType: bpmn::sequenceFlow

  infer:
    childrenOf:
      bpmn::Process: bpmn::Task
}
```

A context definition does not activate itself.

It becomes active only through `%using` when part of a package's default activation, or through a scoped `%begin` / `%end` block.

```itm
%begin bpmn_process
&order_process Order handling
  &receive Receive order
  &validate Validate order
%end bpmn_process
```

Contexts may be declared in ordinary model files or inside packages.

### 20.1 Context content

A context may define:

- `defaultNamespace` for unqualified ids created in the active scope;
- `rootType` for untyped root nodes in the active scope;
- `childType` or `childTypeRules` for untyped children;
- `defaultRelationshipType` for untyped links;
- relationship inference rules based on source type, target type, parent type, or position;
- default attributes;
- default tags;
- default validation mode;
- package/profile-specific editor hints;
- references to rules, styles, viewpoints, or pipelines that should be active in the scope.

Example:

```itm
%context capability_model
{
  defaultNamespace: cap
  rootType: cap::Capability

  infer:
    childrenOf:
      cap::Capability:
        byPosition:
          1: cap::Outcome
          2: cap::Activity
          3: cap::Requirement

    relationships:
      - source: cap::Activity
        target: cap::Outcome
        type: cap::contributes_to
      - source: cap::Requirement
        target: cap::Activity
        type: cap::constrains
}
```

Used as:

```itm
%begin capability_model
&radar_upgrade Radar upgrade
  &outcome Detect small drones
  &activity Improve signal processing @outcome
  &requirement Evidence must be retained @activity
%end capability_model
```

The resolved model may infer:

```yaml
radar_upgrade:
  type: cap::Capability
outcome:
  type: cap::Outcome
activity:
  type: cap::Activity
  relationships:
    - type: cap::contributes_to
      target: outcome
requirement:
  type: cap::Requirement
  relationships:
    - type: cap::constrains
      target: activity
```

### 20.2 Scoped activation blocks

A scoped activation block starts with `%begin NAME` and ends with `%end NAME`.

```itm
%begin NAME
...
%end NAME
```

The name may refer to:

- a local context;
- an active package/profile;
- a context exported by a package/profile;
- a package/profile default context.

Nested scopes are allowed.

```itm
%begin capability_profile
&air_defence Air defence
  &detect Detect threat

  %begin risk_profile
  &r1 Radar outage
  &r2 Supplier delay
  %end risk_profile

  &engage Engage threat
%end capability_profile
```

The active context stack is push/pop based.

When a nested scope is active, the inner scope may override defaults from the outer scope. When the nested scope ends, the previous context is restored.

### 20.3 Context and package name resolution

When resolving `%begin NAME`, processors should use this order:

1. local `%context NAME` in the current file;
2. a context imported into the active name set by `%using`, if the unqualified name is unambiguous;
3. a qualified package context such as `bpmn_profile.process`;
4. a package/profile named `NAME`, using its `defaultContext` if declared;
5. a package/profile named `NAME` with no default context, activating only its default exports;
6. error: unknown scoped activation name.

Qualified names should always be accepted when available.

Unqualified names should produce diagnostics if more than one active package exports the same context name.

### 20.4 Context validation

A validator should report diagnostics when:

- `%begin NAME` cannot be resolved;
- `%end NAME` does not match the active `%begin NAME`;
- a scope is not closed;
- an `%end` appears without a matching `%begin`;
- a context name is declared more than once in the same file/package scope;
- an unqualified context name is ambiguous;
- a context refers to unknown types, relationship types, namespaces, rules, styles, or viewpoints;
- an inference rule conflicts with an explicit type;
- two active contexts define incompatible defaults with the same precedence;
- a package default context refers to a missing context;
- a scoped activation appears in an indentation position that violates the implementation's strict formatting rules.

Explicit authoring wins over inferred context defaults. For example, an explicitly written `[Type]`, namespace-qualified id, typed link, or relationship attribute should override a context default unless a validation rule explicitly forbids that override.

---

## 21. Selectors

Selectors are a shared mechanism for identifying model elements.

They are used by:

- styles;
- validation rules;
- viewpoints;
- views;
- diagnostics;
- transformations;
- visual editing;
- export filters;
- search tools.

Recommended selector forms:

| Selector | Meaning |
|---|---|
| `*` | all nodes |
| `&id` | node with id |
| `&namespace::id` | node with namespace-qualified id |
| `[Type]` | nodes of a type |
| `[namespace::Type]` | nodes of a namespace-qualified type |
| `#tag` | nodes with a tag |
| `{key=value}` | nodes or edges with an attribute value |
| `@target` | relationships targeting an id |
| `@namespace::target` | relationships targeting a namespace-qualified id |
| `@type:*` | relationships of a type |
| `@namespace::type:*` | relationships of a namespace-qualified type |
| `@type:target` | relationships of a type to a target |
| `@namespace::type:namespace::target` | relationships of a namespace-qualified type to a namespace-qualified target |
| `=>` | implicit containment relationships |
| `~>` | implicit ordering relationships |
| `%view:name` | a named view |
| `%viewpoint:name` | a named viewpoint |

Examples:

```itm
[Task]
[bpmn::Task]
#critical
{status=draft}
@depends_on:*
@bpmn::sequenceFlow:*
@archimate::serves:local::customer
=>
~>
```

Selectors should be expressive enough for common model operations while remaining readable.

### 21.1 Boolean selector operators

Selectors can be combined with Boolean operators.

The core Boolean operators are:

| Operator | Meaning |
|---|---|
| `AND` | both selectors must match |
| `OR` | either selector may match |
| `XOR` | exactly one selector must match |
| `NOT` | negates the following selector |

Boolean operators are case-insensitive.

These are equivalent:

```text
[Task] AND #critical
[Task] and #critical
[Task] And #critical
```

Selectors can be grouped with round brackets.

```text
([Task] OR [Event]) AND NOT #draft
([Requirement] AND #critical) OR ([Risk] AND {severity=high})
([Component] XOR [ExternalSystem]) AND {status=active}
```

Recommended operator precedence is:

1. parentheses;
2. `NOT`;
3. `AND`;
4. `XOR`;
5. `OR`.

Authors should use parentheses whenever precedence might be unclear.

### 21.2 Selector functions

The core selector function set is:

| Function | Meaning |
|---|---|
| `ALL(a, b, ...)` | all listed selectors must match |
| `ANY(a, b, ...)` | at least one listed selector must match |
| `NONE(a, b, ...)` | none of the listed selectors may match |
| `ONE(a, b, ...)` | exactly one listed selector must match |

Function names are case-insensitive.

Examples:

```text
ALL([Task], #critical, {status=open})
ANY([Risk], [Issue], #problem)
NONE(#draft, {status=closed})
ONE(#must, #should, #could)
```

The function forms are equivalent to Boolean expressions but are easier to generate from tools and easier to nest in YAML pipeline definitions.

Examples:

```yaml
select: "ALL([bpmn::Task], NOT #draft)"
select: "ANY(@depends_on:*, @bpmn::sequenceFlow:*)"
select: "NONE({status=closed}, #archived)"
```

The core language should not add more selector functions unless they are broadly useful and deterministic. Domain-specific selector functions should be provided by plugins and declared with `%require`.

Advanced implementations may add query clauses such as `WHERE`, but `WHERE` is not part of the mandatory selector core. Attribute selectors such as `{confidence=low}` should be preferred when possible.

The exact extended expression language may be implementation-defined, but the basic selector syntax, Boolean operators, grouping, and core selector functions should remain stable.

---

## 22. Validation rules

Validation rules define constraints over the model.

Rules can be declarative, pipeline-based, or plugin-backed.

A rule is declared with `%rule`.

```itm
%rule tasks_must_have_owner
{
  select: "[Task]"
  pipeline:
    - requireAttribute: owner
  severity: error
  message: "Tasks must define an owner."
}
```

Rules may apply to nodes:

```itm
%rule risks_must_have_severity
{
  select: "[Risk]"
  pipeline:
    - requireAttribute: severity
  severity: warning
  message: "Risks should define a severity."
}
```

Rules may apply to relationships:

```itm
%rule depends_on_connects_components
{
  select: "@depends_on:*"
  pipeline:
    - requireSourceType: Component
    - requireTargetType: Component
  severity: error
  message: "depends_on relationships must connect Components."
}
```

Rules may also check model structure:

```itm
%rule process_steps_are_ordered
{
  select: "[Process]"
  pipeline:
    - requireChildren
    - requireOrdering
  severity: information
  message: "Processes should contain ordered steps."
}
```

A rule pipeline is a sequence of validation steps. Steps may be built into the implementation, supplied by a plugin, or implemented in a scripting engine.

Validation should be able to produce diagnostics without changing the model.### Scope and resolution validation

Validation also covers the language's composition and activation model.

A validator should check:

- directive placement according to directive class;
- unknown directives;
- duplicate package names;
- package version conflicts;
- missing required packages or plugins;
- unresolved `%using` targets;
- unresolved `%begin` targets;
- mismatched or unclosed `%begin` / `%end` blocks;
- ambiguous context or package-context names;
- namespace prefix conflicts within a file/package scope;
- attempts by included files to leak local active state;
- duplicate ids after namespace expansion;
- identity map conflicts after canonical id resolution;
- inferred type and relationship consistency;
- rule activation according to file, package, and scoped context rules.

### 22.1 Inference diagnostics

When contexts infer types, relationship types, namespaces, or defaults, a processor may emit information-level diagnostics explaining the inference.

Example:

```text
inferred type bpmn::Task for &receive from context bpmn_profile.process, rule infer.childrenOf.bpmn::Process
inferred relationship bpmn::sequenceFlow for @validate from context bpmn_profile.process, defaultRelationshipType
```

These diagnostics are useful for authoring and debugging but may be suppressed in normal publishing mode.

---

## 23. Diagnostics

Diagnostics are messages produced by parsers, validators, pipelines, renderers, exporters, or visual editors.

A diagnostic may refer to:

- a line or text range;
- a node;
- a relationship;
- a directive;
- a pipeline step;
- a view or viewpoint;
- an included file;
- a namespace or package reference.

Recommended diagnostic shape:

```yaml
source: itm.validator
severity: warning
message: Risks should define a severity.
file: risks.itm
line: 12
range:
  from: 120
  to: 145
node: risk_payment_failure
relationship: null
rule: risks_must_have_severity
pipelineStep: requireAttribute
```

Recommended severities:

- `error`;
- `warning`;
- `information`;
- `observation`.

Diagnostics should be first-class outputs of ITM processing. They make the format useful in editors, CI/CD pipelines, model governance, and automated conversion workflows.Diagnostics related to context and package resolution should preserve enough information to explain both where the syntax appears and which active scope caused the interpretation.

Recommended additional diagnostic fields:

```yaml
context: bpmn_profile.process
activePackages:
  - bpmn_profile
canonicalId: enterprise::550e8400-e29b-41d4-a716-446655440000
inferenceRule: infer.childrenOf.bpmn::Process
includedFrom: shared:profiles/bpmn.itm
```

For merged or included content, diagnostics should preserve both the original source file and the including file context when applicable.

---

## 24. Plugins and `%require`

The `%require` directive declares a dependency on a plugin, library, profile, or pipeline provider.

```itm
%require itm.core ^1.0.0
%require itm.graphviz ^1.0.0
%require itm.mermaid ^1.0.0
%require local.bpmn-profile ^0.3.0
```

The directive is conceptually similar to an NPM dependency declaration.

It does not define how the plugin is implemented. The back-end or host environment decides whether a required capability is provided by:

- built-in code;
- a JavaScript plugin;
- a Lua script;
- a WebAssembly module;
- a local package;
- a remote package;
- an editor extension;
- a transformation service;
- another controlled execution environment.

A required plugin may provide:

- parser extensions;
- selector functions;
- validation steps;
- transformation steps;
- renderers;
- exporters;
- style interpreters;
- viewpoint engines;
- visual editors;
- write-back handlers.

Example use in a rule:

```itm
%require local.architecture-rules ^1.2.0

%rule no_closed_requirement_without_verification
{
  select: "[Requirement]"
  pipeline:
    - local.architecture-rules.requireVerificationWhenClosed
  severity: error
}
```

Example use in a viewpoint:

```itm
%require itm.graphviz ^1.0.0

%viewpoint dependency_graph
{
  pipeline:
    - select: "[Component]"
    - includeEdges: "@depends_on:*"
    - transform: graphviz.dot
    - render: graphviz.svg
}
```

A processor should report diagnostics when a required plugin is missing, disabled, incompatible, or fails to initialize.

---

## 25. Cascading styles

Styles describe presentation rules separately from the model semantics.

A style is declared with `%style` followed by a selector and a YAML-compatible block.

```itm
%style [Task]
{
  fill: "#e8f1ff"
  stroke: "#3b73d9"
  shape: rectangle
}

%style #critical
{
  stroke-width: 3
  font-weight: bold
}

%style @depends_on:*
{
  stroke: "#888888"
  stroke-dasharray: "4 2"
}

%style =>
{
  stroke: "#aaaaaa"
}
```

Styles are cascading. Multiple style rules may apply to the same node or relationship.

Recommended cascade order, from weakest to strongest:

1. renderer defaults;
2. package styles;
3. namespace/profile styles;
4. document styles;
5. viewpoint styles;
6. view-specific style overrides;
7. direct node or edge visual attributes.

Styles should use CSS-compatible names and values where possible, while allowing diagram-specific properties when needed.

Examples of common style properties:

```yaml
fill: "#e8f1ff"
stroke: "#3b73d9"
stroke-width: 2
font-size: 12
font-weight: bold
shape: rectangle
opacity: 0.8
line-style: dashed
```

Styles are optional rendering hints. They should not be required to understand the semantic model.

---

## 26. Viewpoints

A viewpoint defines a reusable way to derive a presentation or projection from the model.

A viewpoint is a pipeline.

It may:

- select a subset of the model;
- include or exclude relationships;
- transform the model into another format;
- apply a layout engine;
- render an output;
- produce diagnostics;
- expose visual editing capabilities.

Example:

```itm
%viewpoint dependency_graph
{
  description: Shows components and their dependency relationships.
  pipeline:
    - select: "[Component]"
    - includeEdges: "@depends_on:*"
    - transform: graph.model
    - layout: graphviz.dot
    - render: svg
}
```

A Mermaid mind map viewpoint:

```itm
%viewpoint capability_mindmap
{
  description: Shows capabilities as a mind map.
  pipeline:
    - select: "[Capability]"
    - includeEdges: "=>"
    - transform: mermaid.mindmap
    - render: mermaid.svg
}
```

A BPMN-oriented viewpoint:

```itm
%viewpoint bpmn_process
{
  description: Renders BPMN-like process elements.
  pipeline:
    - select: "[bpmn::Event], [bpmn::Task], [bpmn::Gateway]"
    - includeEdges: "@bpmn::sequenceFlow:*"
    - validate: bpmn.basicWellFormedness
    - transform: bpmn.xml
    - render: bpmn.viewer
}
```

The important design principle is that the ITM model remains canonical. Mermaid, DOT, SVG, BPMN XML, and other outputs are generated views, not the source of truth unless explicitly written back.

---

## 27. Views

A view is a specific instance of a viewpoint.

A viewpoint defines the reusable pipeline. A view records how a particular rendering of that viewpoint has been adjusted, customized, or preserved.

Example:

```itm
%view current_dependency_graph
{
  viewpoint: dependency_graph
  title: Current dependency graph
  parameters:
    includeDraft: false
  deltas:
    hidden:
      - node: experimental_component
    moved:
      - node: payment_service
        dx: 120
        dy: -40
      - node: invoice_service
        dx: -80
        dy: 30
    styleOverrides:
      - selector: "&payment_service"
        style:
          fill: "#fff3e0"
          stroke-width: 3
}
```

A view may store:

- selected viewpoint;
- viewpoint parameters;
- hidden nodes;
- hidden relationships;
- expanded/collapsed branches;
- moved nodes;
- pinned coordinates;
- style overrides;
- label overrides;
- renderer-specific options;
- notes about manual adjustments;
- references to generated assets.

The view does not replace the model. It stores deltas over the generated output.

This allows the model to evolve while preserving useful manual layout work. When the model changes, the viewpoint can be regenerated and the view deltas can be reapplied where possible.

---

## 28. Visual editing and write-back

ITM supports the idea that a model can be edited visually, but write-back must be explicit and controlled.

A visual editor may open a view, allow the user to move elements, hide elements, change styles, or create relationships. These changes can be written back in different ways depending on their nature.

### 28.1 View-level write-back

Presentation-only changes should be written to the view.

Examples:

- moving a node in a diagram;
- hiding a relationship in one view;
- overriding a color in one view;
- pinning a layout coordinate;
- expanding or collapsing a branch.

These changes belong in `%view`, because they are specific to a particular visual representation.

### 28.2 Model-level write-back

Semantic changes should be written to the model.

Examples:

- creating a new entity;
- renaming an entity label;
- adding a relationship;
- changing an entity type;
- adding an attribute;
- deleting a semantic relationship;
- changing a validation-relevant property.

These changes alter the ITM source model.

### 28.3 Safe editing mode

A host editor may use a safe visual editing pattern:

1. user opens a view in edit mode;
2. the source document is frozen for other editors;
3. the visual editor records proposed changes;
4. the user reviews the generated write-back patch;
5. the user applies or discards the patch;
6. the document is unfrozen.

This preserves the text source as the canonical artifact while still allowing rich visual editing.

---

## 29. Overlays and redefinition

ITM supports incremental composition through explicit overlays.

By default, ids must be unique within a namespace. If the same id is defined more than once in the same namespace, and no overlay marker is present, this is a validation error.

This default protects against accidental copy-paste duplication and unintended namespace collisions.

### 29.1 Explicit overlay marker

An overlay must be declared explicitly.

The recommended syntax is the `!overlay` node modifier, placed after the id and before the optional type.

```itm
&payment_service !overlay
{
  criticality: high
  status: under_review
}
@depends_on:fraud_service
```

The modifier is not a type. It is an instruction to patch an existing node.

General form:

```text
&id !overlay [[Type]] [optional replacement label]
```

Examples:

```itm
&payment_service !overlay
&payment_service !overlay [Component]
&payment_service !overlay [Component] Payment Service
```

### 29.2 Overlay example

Base definition:

```itm
&payment_service [Component] Payment Service
{
  owner: platform
  criticality: medium
}
```

Explicit overlay:

```itm
&payment_service !overlay
{
  criticality: high
  status: under_review
}
@depends_on:fraud_service
```

Result:

```yaml
id: payment_service
type: Component
label: Payment Service
attributes:
  owner: platform
  criticality: high
  status: under_review
relationships:
  - type: depends_on
    target: fraud_service
```

### 29.3 Overlay rules

Recommended overlay rules:

- duplicate ids without `!overlay` are validation errors;
- an overlay target must already exist, unless the processor explicitly supports forward overlays;
- missing attributes may be added;
- existing attributes may be overwritten;
- relationships may be added;
- descriptions may be appended, replaced, or merged depending on policy;
- label replacement should be explicit and should produce a diagnostic in strict mode;
- type replacement should be explicit and should produce a diagnostic in strict mode;
- overlays should preserve the original source location and the patch source location for diagnostics;
- processors should be able to report the final merged value and the origin of each patched field.

### 29.4 Overlay intent

This is closer to controlled monkey patching than classical inheritance.

It enables:

- model refinement;
- environment-specific overlays;
- package customization;
- separation of base models and local changes;
- incremental migration from simple notes to typed models;
- controlled extension of imported models.

View-specific visual adjustments should normally be stored in `%view`, not in semantic overlays. An overlay changes the model. A view delta changes one rendered instance of the model.

---

## 30. Packages and `%using`

Packages group reusable definitions, profile content, validation logic, rendering defaults, and named contexts.

A package may contain:

- namespace declarations;
- entity types;
- relationship types;
- validation rules;
- styles;
- viewpoints;
- views;
- named contexts;
- identity maps;
- reference entities;
- transformation pipelines;
- plugin requirements;
- documentation.

A package is declared with `%package`.

```itm
%package bpmn_profile
{
  version: 0.1.0
  namespace: bpmn
  defaultContext: process
  description: Basic BPMN semantic profile for ITM.
}
```

A file that declares `%package` defines a package export boundary. Exportable declarations in that file belong to the package unless a future visibility mechanism marks them as private.

A model can include or import package files without automatically bringing all names into the current namespace.

The `%using` directive activates package content.

```itm
%include packages/bpmn-profile.itm
%using bpmn_profile
```

The default meaning of `%using package_name` is:

```text
activate all default exports of the package for the current file
```

Default exports may include visible namespaces, unqualified type names, relationship types, validation rules, styles, viewpoints, named contexts, package-required plugins, identity maps, and other declared package defaults.

Selective usage may exist as an advanced option:

```itm
%using bpmn_profile.types
%using bpmn_profile.rules
%using bpmn_profile.styles
%using bpmn_profile.contexts
%using bpmn_profile.minimal
```

Selective usage is optional. It must not change the meaning of plain `%using bpmn_profile`, which activates the package as a whole according to the package's default export policy.

### 30.1 Named contexts inside packages

Packages may declare named contexts.

```itm
%package bpmn_profile
{
  version: 0.1.0
  namespace: bpmn
  defaultContext: process
}

%context process
{
  defaultNamespace: local
  rootType: bpmn::Process
  defaultRelationshipType: bpmn::sequenceFlow
  infer:
    childrenOf:
      bpmn::Process: bpmn::Task
}

%context collaboration
{
  defaultNamespace: local
  rootType: bpmn::Collaboration
}
```

A consumer may activate a qualified package context:

```itm
%include shared:profiles/bpmn.itm
%using bpmn_profile

%begin bpmn_profile.process
&order_process Order handling
  &receive Receive order
%end bpmn_profile.process
```

If the package declares `defaultContext`, the package name may be used directly as shorthand:

```itm
%begin bpmn_profile
&order_process Order handling
  &receive Receive order
%end bpmn_profile
```

This means:

```text
activate bpmn_profile default exports and its default context
```

If a package has no `defaultContext`, `%begin package_name` activates the package's default exports for the block but performs no package-specific context inference unless other activated defaults define it.

### 30.2 Scoped package usage

A package/profile can be activated for a limited block with `%begin` / `%end`.

```itm
%begin risk_profile
&r1 Supplier delay
&r2 Approval delay
%end risk_profile
```

This is equivalent to using the package/profile only inside that block.

Nested package scopes are allowed. Inner package or context defaults may override outer defaults. On `%end`, the previous active package/context stack is restored.

### 30.3 Package validation

A validator should report diagnostics when:

- a package name is duplicated in the same dependency graph;
- a package version constraint cannot be satisfied;
- a package's `defaultContext` is missing;
- a package context name is duplicated within the package;
- an unqualified context exported by multiple active packages is used ambiguously;
- a package exports a type, rule, style, context, or viewpoint that depends on an unavailable namespace or plugin;
- selective usage refers to an export group that does not exist;
- two activated packages provide conflicting unqualified names without qualification.

Package usage should define:

- which namespaces become visible;
- which types are available unqualified;
- which relationship types are available unqualified;
- which rules are active;
- which styles are active;
- which contexts are available;
- which viewpoints are offered;
- which plugins are required;
- how canonical ids and aliases are resolved;
- whether package content can be overridden locally.

---

## 31. Repositories

Repositories provide named locations for reusable ITM content.

A repository is declared with `%repository`.

```itm
%repository shared https://example.org/itm
%repository company file://models/company
%repository local ./packages
```

A repository name can then be used in include or package references.

```itm
%include shared:profiles/bpmn.itm
%include shared:profiles/archimate.itm
%include company:reference-data/locations.itm
```

The host environment decides how repository references are resolved.

A repository may be backed by:

- a local folder;
- a Git repository;
- a package registry;
- a web endpoint;
- an internal document store;
- an application-managed library;
- a locked-down offline bundle.

Repository support is useful for:

- reusable semantic profiles;
- organization-wide reference data;
- shared style libraries;
- common viewpoints;
- validation packages;
- modelling templates;
- controlled architecture repositories.

Security-conscious environments should restrict repository protocols, domains, credentials, and write access.

---

## 32. Complete syntax reference

This section summarizes the full ITM syntax after all incremental features have been introduced.

### 32.1 Entity line

Recommended entity line structure:

```text
[indentation] [&id] [[Type]] label text with optional #tags [inline attributes] [inline links] [// comment]
```

Examples:

```itm
&order [BusinessObject] Customer Order #core {status: draft} @created_by:customer
&invoice [BusinessObject] Invoice #finance @derived_from:order
&payment Payment  // type may be inferred by context
```

Tags may appear anywhere in the label.

```itm
&feedback Capture #customer feedback from support channels
```

### 32.2 Comments

```itm
// whole-line comment
&order Order  // trailing comment
```

Comments do not create model content.

### 32.3 Entity with description and attributes

```itm
&order [BusinessObject] Customer Order #core
| Represents a customer order.
|
| The description is Markdown and may include lists, tables, links, code blocks,
| Mermaid diagrams, Graphviz diagrams, or other supported fenced blocks.
{
  status: draft
  owner: sales
  priority: high
}
```

### 32.4 Simple relationship

```itm
&order Order @invoice
```

or as a block:

```itm
&order Order
@invoice
```

### 32.5 Typed relationship

```itm
&order Order @creates:invoice
```

or as a block:

```itm
&order Order
@creates:invoice
```

### 32.6 Typed relationship with attributes and id

```itm
&order Order
@creates:invoice
{
  id: rel_order_invoice
  confidence: high
  source: workshop
}
```

### 32.7 Hierarchy

```itm
&process [Process] Order handling
  &receive [Task] Receive order
  &validate [Task] Validate order
  &fulfil [Task] Fulfil order
    &pick [Task] Pick items
    &pack [Task] Pack shipment
    &dispatch [Task] Dispatch shipment
```

Generated relationships:

```text
process contains receive
process contains validate
process contains fulfil
fulfil contains pick
fulfil contains pack
fulfil contains dispatch
receive followed_by validate
validate followed_by fulfil
pick followed_by pack
pack followed_by dispatch
```

### 32.8 Metadata

```itm
%metadata
{
  title: Order handling model
  version: 1.0
  defaultNamespace: example
}
```

### 32.9 Include

```itm
%include common-types.itm
%include shared:profiles/bpmn.itm
```

### 32.10 Namespace

```itm
%namespace bpmn https://www.omg.org/spec/BPMN/20100524/MODEL
%namespace local https://example.org/local-model
```

### 32.11 Identity map

```itm
%idmap
{
  order: "enterprise::550e8400-e29b-41d4-a716-446655440000"
  customer:
    canonical: "enterprise::a1e21492-0496-43d1-9b94-b5874f42a66e8"
    aliases:
      - "crm::Customer"
}
```

### 32.12 Type definitions

```itm
%entitytype Task
{
  description: A unit of work.
  requiredAttributes:
    - owner
    - status
}

%relationshiptype depends_on
{
  description: A dependency between two components.
  sourceTypes:
    - Component
  targetTypes:
    - Component
}
```

### 32.13 Context

```itm
%context bpmn_process
{
  defaultNamespace: local
  rootType: bpmn::Process
  defaultRelationshipType: bpmn::sequenceFlow
  infer:
    childrenOf:
      bpmn::Process: bpmn::Task
}
```

### 32.14 Scoped activation

```itm
%begin bpmn_process
&order_process Order process
  &receive Receive order
  &validate Validate order
%end bpmn_process
```

The scoped activation name may refer to a context, a package/profile, or a package context.

```itm
%begin bpmn_profile.process
&order_process Order process
  &receive Receive order
%end bpmn_profile.process
```

### 32.15 Rule

```itm
%rule components_need_owner
{
  select: "[Component]"
  pipeline:
    - requireAttribute: owner
  severity: error
  message: "Components must have an owner."
}
```

### 32.16 Require

```itm
%require itm.graphviz ^1.0.0
%require itm.mermaid ^1.0.0
%require local.architecture-rules ^1.2.0
```

### 32.17 Style

```itm
%style [Component]
{
  fill: "#e8f1ff"
  stroke: "#3b73d9"
  shape: rectangle
}

%style @depends_on:*
{
  stroke: "#888888"
  stroke-dasharray: "4 2"
}
```

### 32.18 Viewpoint

```itm
%viewpoint dependency_graph
{
  pipeline:
    - select: "[Component]"
    - includeEdges: "@depends_on:*"
    - transform: graph.model
    - layout: graphviz.dot
    - render: svg
}
```

### 32.19 View

```itm
%view current_dependency_graph
{
  viewpoint: dependency_graph
  deltas:
    moved:
      - node: payment_service
        dx: 120
        dy: -40
    hidden:
      - node: experimental_component
}
```

### 32.20 Explicit overlay

```itm
&payment_service [Component] Payment Service
{
  owner: platform
  criticality: medium
}

&payment_service !overlay
{
  criticality: high
  status: under_review
}
@depends_on:fraud_service
```

Duplicate ids without `!overlay` are validation errors.

### 32.21 Package

```itm
%package architecture_profile
{
  version: 0.1.0
  namespace: arch
  defaultContext: capability
}

%context capability
{
  defaultNamespace: arch
  rootType: arch::Capability
}
```

Plain package usage activates all package default exports:

```itm
%using architecture_profile
```

Selective usage is optional and advanced:

```itm
%using architecture_profile.minimal
```

### 32.22 Repository

```itm
%repository shared https://example.org/itm
%include shared:profiles/architecture.itm
```

---

## 33. Example complete ITM file

```itm
%metadata
{
  title: Order handling example
  version: 1.1
  defaultNamespace: example
}

%repository shared https://example.org/itm
%include shared:profiles/bpmn.itm

%namespace example https://example.org/order-model
%namespace bpmn https://www.omg.org/spec/BPMN/20100524/MODEL

%require itm.mermaid ^1.0.0
%require itm.graphviz ^1.0.0

// Local ids are author-friendly; canonical ids are mapped separately.
%idmap
{
  order_process: "enterprise::550e8400-e29b-41d4-a716-446655440000"
  validate_order: "enterprise::65f51b2b-6f32-4c8c-88fb-8d6dd98f0861"
}

%entitytype bpmn::Task
{
  requiredAttributes:
    - owner
}

%relationshiptype bpmn::sequenceFlow
{
  sourceTypes:
    - bpmn::Task
  targetTypes:
    - bpmn::Task
}

%context bpmn_process
{
  defaultNamespace: example
  rootType: bpmn::Process
  defaultRelationshipType: bpmn::sequenceFlow
  infer:
    childrenOf:
      bpmn::Process: bpmn::Task
}

%rule tasks_need_owner
{
  select: "[bpmn::Task]"
  pipeline:
    - requireAttribute: owner
  severity: error
  message: "BPMN tasks must have an owner."
}

%style [bpmn::Task]
{
  fill: "#e8f1ff"
  stroke: "#3b73d9"
  shape: rectangle
}

%viewpoint process_flow
{
  pipeline:
    - select: "[bpmn::Task]"
    - includeEdges: "@bpmn::sequenceFlow:*"
    - transform: mermaid.flowchart
    - render: mermaid.svg
}

%view order_process_view
{
  viewpoint: process_flow
  deltas:
    moved:
      - node: validate_order
        dx: 80
        dy: 0
}

%begin bpmn_process
&order_process Order handling #core
| This model describes the high-level order handling process.
|
| It can be rendered as a process flow, a dependency graph, or a mind map.
{
  owner: operations
  status: draft
}
  &receive_order Receive order #entry
  {
    owner: sales
  }
  @validate_order
  {
    id: flow_receive_validate
  }

  &validate_order Validate order #control
  | Validation checks completeness, payment terms, and customer status.
  {
    owner: operations
  }
  @send_invoice
  {
    id: flow_validate_invoice
  }

  &send_invoice Send invoice #finance
  {
    owner: finance
  }
%end bpmn_process
```

In this example:

- `bpmn_process` infers the root and child types;
- untyped `@validate_order` and `@send_invoice` links inherit the default relationship type `bpmn::sequenceFlow`;
- `%idmap` maps readable ids to canonical repository identities;
- `%begin` / `%end` make inference explicit and scoped;
- comments are ignored by the model processor.

---

## 34. Processing model

A full ITM processor should generally work in stages:

1. read raw text;
2. identify and preserve comments/trivia if round-tripping is required;
3. strip comments for semantic parsing where applicable;
4. parse directives and classify them as declarations, activations, or structural scoped activations;
5. resolve repositories;
6. resolve includes as separate modules, not textual paste;
7. load package exports;
8. resolve package availability and `%using` declarations;
9. resolve `%require` dependencies and plugin availability;
10. resolve namespaces within each file/package module;
11. parse entities, descriptions, attributes, and relationships;
12. apply file-wide activations;
13. process `%begin` / `%end` scopes as a stack of active contexts/packages;
14. expand local ids to namespace-qualified ids;
15. apply identity maps and canonical ids;
16. generate implicit containment relationships;
17. generate implicit ordering relationships;
18. detect duplicate ids, reject unintended collisions, and apply explicit overlays;
19. resolve ids and relationship targets;
20. apply explicit type declarations;
21. infer missing node types and relationship types from active contexts/packages;
22. validate inferred values against explicit declarations and rules;
23. evaluate validation rules;
24. collect diagnostics;
25. evaluate styles;
26. expose viewpoints;
27. generate views;
28. apply view deltas;
29. support controlled write-back if visual editing is enabled.

Implementations may perform these steps in a different internal order, but the externally visible behavior should be deterministic.

### 34.1 Resolution principles

The core resolution principles are:

```text
Declarations are hoisted.
Activations are explicit.
Only %begin/%end is positional.
Includes do not leak local active state.
Packages export; consumers activate.
Explicit authoring wins over inference.
Canonical identity does not create semantic relationships.
```

### 34.2 Scoped activation resolution

For `%begin NAME`, processors should resolve `NAME` in this order:

1. local context in the current file;
2. unqualified context imported by active package usage, if unambiguous;
3. qualified package context, such as `package.context`;
4. package/profile name with `defaultContext`;
5. package/profile name without `defaultContext`, activating package defaults only;
6. unresolved name diagnostic.

Nested scopes are resolved with a stack. Ending a scope restores the previous active scope.

### 34.3 Include resolution

Includes are resolved as modules.

An included file may contribute:

- semantic model content;
- package definitions;
- reference data;
- named contexts;
- rules, styles, viewpoints, and other declarations.

Its local active state stays local. The including file activates exported package/profile content explicitly.

---

## 35. Compatibility and implementation modes

ITM can be implemented at different levels of strictness.

### 35.1 Minimal parser

A minimal parser supports:

- one entity per line;
- indentation hierarchy;
- labels.

### 35.2 Practical parser

A practical parser supports:

- tags;
- ids;
- links;
- typed links;
- descriptions;
- attributes;
- directives;
- includes;
- diagnostics.

### 35.3 Full model processor

A full model processor supports:

- namespaces;
- packages;
- repositories;
- type declarations;
- validation rules;
- plugins;
- selectors;
- styles;
- viewpoints;
- views;
- visual editing write-back;
- overlays;
- multiple export and rendering pipelines.

### 35.4 Strict vs tolerant mode

A strict parser should reject ambiguous or invalid constructs.

A tolerant parser may preserve unknown constructs and produce diagnostics instead of failing immediately.

Tolerant mode is useful for authoring and migration.

Strict mode is useful for CI/CD, publication, and controlled repositories.### Context-aware parser

A context-aware parser supports:

- named `%context` definitions;
- `%begin` / `%end` scoped activation;
- package/profile context activation;
- type and relationship inference;
- validation of scoped activation stacks.

### 35.5 Repository-aware processor

A repository-aware processor supports:

- `%idmap` canonical identity resolution;
- cross-file identity reconciliation;
- package dependency graphs;
- include/module boundaries;
- validation of canonical ids, aliases, package versions, and scoped imports.

---

## 36. Design summary

ITM begins as a plain list and grows into a complete model format.

Its central idea is that text remains the canonical and inspectable source, while richer tools can parse, validate, transform, render, and edit it.

The format supports:

- simple notes;
- authoring comments;
- hierarchical models;
- graph models;
- local ids and canonical/global identity maps;
- semantic relationships;
- Markdown documentation;
- typed profiles;
- named contexts;
- scoped package/profile activation;
- validation rules;
- plugin-backed pipelines;
- reusable packages;
- shared repositories;
- cascading styles;
- generated viewpoints;
- manually refined views;
- controlled visual editing and write-back.

This makes ITM suitable both for lightweight human authoring and for advanced model-driven workflows involving architecture models, BPMN-like process models, ArchiMate-like semantic models, Mermaid and Graphviz diagrams, graph visualizations, documentation systems, and CI/CD-based model governance.

The core remains simple: one line is one thing.

Everything else is optional, layered, explicit, and progressively adoptable.

The most important composition rules are:

```text
Declarations are hoisted.
Activations are explicit.
Only %begin/%end is positional.
Includes do not leak local active state.
Packages export; consumers activate.
Contexts are always named.
```
