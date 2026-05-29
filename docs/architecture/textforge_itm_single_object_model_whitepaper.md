# TextForge ITM-Centric Object Model Refactoring Whitepaper

## 1. Executive summary

TextForge is currently in pre-alpha and therefore does not need to preserve the historical internal tree and graph DTOs that were introduced before `@textforge/itm` existed. The recommended refactoring is to make the `@textforge/itm` in-memory object model the single canonical structural model inside TextForge.

The central change is:

```text
Current direction:
text.itm -> @textforge/itm parser -> TextForge TreeNode / GraphModel -> viewers

Recommended direction:
text.* -> parser/transformer -> @textforge/itm object model -> viewers/editors/exporters
```

This means removing TextForge's internal `TreeNode`, `GraphNode`, `GraphEdge`, and `GraphModel` as pipeline/domain-level DTOs and replacing them with `ItmDocument` / `ResolvedItmDocument` from `@textforge/itm`.

Viewer-specific structures such as Cytoscape elements, Graphology graphs, jsMind data, HTML DOM structures, or table grids may still exist, but only as last-mile rendering projections. They should not be TextForge's reusable internal model.

This refactor is larger than patching the current ITM adapter, but it is architecturally cleaner and better aligned with the purpose of ITM as the shared model format.

---

## 2. Problem statement

TextForge currently contains two overlapping structural model systems:

1. The complete ITM object model from `@textforge/itm`.
2. TextForge's older internal DTOs:
   - `TreeNode`
   - `GraphNode`
   - `GraphEdge`
   - `GraphModel`
   - `model.tree`
   - `model.graph`

The current ITM parser path already calls the ITM library parser and resolver, but then projects the result into `TreeNode[]` and `GraphModel`. That projection loses or flattens important ITM concepts, including:

- metadata
- includes
- namespaces
- typed relationships
- relationship attributes
- relationship selectors
- style directives
- views
- viewpoints
- rules
- source ranges on non-entity constructs
- future ITM features not anticipated by the old DTOs

The observed symptom is that multiline attributes and directives may parse correctly in the library but still appear missing, ignored, or visually wrong in TextForge viewers because the downstream TextForge DTOs do not represent the full ITM model.

This is not only a parser bug. It is an architectural impedance mismatch.

---

## 3. Design principle

TextForge should not invent a second object model for information that ITM already represents.

The guiding rule should be:

> If a structure is semantically part of a model, it belongs in the ITM object model. If a structure is only needed by a rendering engine, it belongs inside that viewer adapter.

Therefore:

```text
Canonical model:      @textforge/itm object model
Viewer projection:   Cytoscape elements, Graphology graph, jsMind node tree, HTML table, SVG, etc.
Pipeline contract:   model.itm
```

TextForge's internal responsibility becomes orchestration:

- parse text into ITM
- run transformations between text formats and ITM
- render ITM through different viewers
- expose diagnostics
- connect source ranges to visual selections
- eventually support write-back through ITM-aware edit operations

TextForge should not maintain an independent semantic tree/graph model.

---

## 4. Target architecture

### 4.1 Core pipeline model

Introduce a single structural model pipeline type:

```ts
import type {
  ItmDocument,
  ResolvedItmDocument,
  ItmDiagnostic
} from "@textforge/itm";

export type PipelineValue =
  | TextPipelineValue
  | ItmPipelineValue
  | TablePipelineValue
  | HtmlPipelineValue
  | SvgPipelineValue
  | BpmnPipelineValue;

export interface ItmPipelineValue {
  kind: "model";
  modelType: "model.itm";
  document: ItmDocument;
  resolved: ResolvedItmDocument;
  diagnostics?: Diagnostic[];
  source?: {
    languageId: string;
    fileName?: string;
    documentId?: string;
    text?: string;
  };
}
```

The `source.text` field is optional but useful during early implementation for source-selection mapping and debugging. It should not be used as a substitute for the parsed object model.

### 4.2 Text-to-ITM transformations

Every structured text format that currently emits `TreeNode[]` or `GraphModel` should instead emit `model.itm`.

Examples:

```text
text.itm          -> model.itm
text.markdown     -> model.itm
text.json         -> model.itm
text.xml          -> model.itm
text.graphviz-dot -> model.itm
text.csv          -> model.itm or model.table, depending on intent
text.bpmn         -> model.itm or bpmn viewer directly, depending on maturity
```

For the first implementation pass, keep `model.table`, `html`, `svg`, and `bpmn` pipeline values because they are not general structural model competitors in the same way. They are either presentation values or specialised runtime values.

### 4.3 Viewer architecture

Viewer contributions should consume `model.itm` directly:

```text
model.itm -> ITM Tree Viewer
model.itm -> ITM Mindmap Viewer
model.itm -> ITM Cytoscape Viewer
model.itm -> ITM Sigma Viewer
model.itm -> ITM Inspector Viewer
```

Each viewer can build temporary runtime structures:

```text
ResolvedItmDocument -> DOM tree rows
ResolvedItmDocument -> jsMind node_tree data
ResolvedItmDocument -> Cytoscape element list
ResolvedItmDocument -> Graphology graph
```

Those runtime structures should be private to the viewer implementation.

---

## 5. Current code areas affected

### 5.1 Domain model

Current location:

```text
src/domain/types.ts
```

Current DTOs to remove as domain-level concepts:

```ts
TreeNode
GraphNode
GraphEdge
GraphModel
```

Current pipeline values to remove:

```ts
{ kind: "model"; modelType: "model.tree"; data: TreeNode[] }
{ kind: "model"; modelType: "model.graph"; data: GraphModel }
```

Replacement:

```ts
{ kind: "model"; modelType: "model.itm"; document: ItmDocument; resolved: ResolvedItmDocument }
```

### 5.2 ITM parser wrapper

Current location:

```text
src/parsers/itm.ts
```

This file should stop returning `TreeNode[]` and stop containing old local parsing helpers. It should become a thin bridge around `@textforge/itm`.

Recommended replacement responsibilities:

- parse ITM text with `parseDocumentResult`
- resolve the document with `resolveDocument`
- convert ITM diagnostics into TextForge diagnostics
- preserve source metadata
- pass include documents through the library-supported mechanism, once wired
- return `ItmPipelineValue`

Recommended shape:

```ts
import {
  parseDocumentResult,
  resolveDocument,
  type ItmDiagnostic,
  type ItmSourceRange
} from "@textforge/itm";

export function parseItmValue(
  text: string,
  languageId = "text.itm",
  options: ParseItmOptions = {}
): ItmPipelineValue {
  const parsed = parseDocumentResult(text, {
    uri: options.currentFileName,
    strict: false
  });

  const resolved = resolveDocument(parsed.value /* plus include/profile context when available */);

  return {
    kind: "model",
    modelType: "model.itm",
    document: parsed.value,
    resolved,
    diagnostics: parsed.diagnostics.map((d) => toTextForgeDiagnostic(d, text, languageId, options.currentDocumentId)),
    source: {
      languageId,
      fileName: options.currentFileName,
      documentId: options.currentDocumentId,
      text
    }
  };
}
```

Delete or move out of ITM:

```ts
parseIndentedTree
indentedTreeToGraph
parseNodeContent
parseLinks
parseAttributes
parseStyleDirective
parseStyleDeclarations
selectorTarget
edgeSelectorMatches
```

The library owns parsing. Viewers own rendering projections. TextForge should not parse ITM syntax locally.

### 5.3 ITM plugin

Current location:

```text
src/plugins/itmCore.ts
```

Replace current transformers:

```text
itm-to-tree
itm-to-graph
```

with:

```text
itm-parse
```

Recommended transformer:

```ts
{
  kind: "transformer",
  id: "itm-parse",
  name: "ITM Parse",
  input: "text.itm",
  output: "model.itm",
  transform(value, context) {
    if (value.kind !== "text") {
      throw new Error("ITM parser requires text input.");
    }
    return parseItmValue(value.text, value.languageId, {
      currentDocumentId: value.documentId,
      currentFileName: value.fileName,
      includeDocuments: context.documents || []
    });
  }
}
```

The linter should also call the same parser function and return the same diagnostics.

### 5.4 Viewer plugin

Current location:

```text
src/plugins/viewerCore.ts
```

Add ITM-specific viewers with `input: "model.itm"`:

```text
itm-tree-viewer
itm-mindmap-viewer
itm-cytoscape-viewer
itm-sigma-viewer
itm-inspector-viewer
```

Remove or de-prioritise generic `tree-viewer` and `graph-viewer` unless another non-ITM pipeline still needs them temporarily during migration.

### 5.5 Viewer component

Current location:

```text
src/components/viewers.tsx
```

This file is currently heavily tied to `TreeNode[]` and `GraphModel`.

Recommended change:

- Add viewer result kinds that carry ITM values:

```ts
export type ViewerResult =
  | { kind: "itm-tree"; model: ItmPipelineValue; ... }
  | { kind: "itm-mindmap"; model: ItmPipelineValue; ... }
  | { kind: "itm-graph"; model: ItmPipelineValue; engine: "cytoscape" | "sigma"; ... }
  | ...
```

- Alternatively, keep a single `kind: "itm"` and use `viewMode`, but separate result kinds are simpler during pre-alpha.

- Replace helper functions that walk `TreeNode[]` with helpers that walk `ResolvedItmEntity[]`.

Examples:

```ts
function rootEntities(model: ItmPipelineValue): ResolvedItmEntity[] {
  return model.resolved.entities
    .filter((entity) => !entity.parent)
    .sort(byRank);
}

function walkEntities(entities: ResolvedItmEntity[], callback: (entity: ResolvedItmEntity) => void): void {
  for (const entity of entities) {
    callback(entity);
    walkEntities([...entity.children].sort(byRank), callback);
  }
}
```

---

## 6. New pipeline catalogue

### 6.1 ITM native

```text
Pipeline: view-itm-tree
Input: text.itm
Steps:
  - itm-parse
  - itm-tree-viewer

Pipeline: view-itm-mindmap
Input: text.itm
Steps:
  - itm-parse
  - itm-mindmap-viewer

Pipeline: view-itm-cytoscape
Input: text.itm
Steps:
  - itm-parse
  - itm-cytoscape-viewer

Pipeline: view-itm-sigma
Input: text.itm
Steps:
  - itm-parse
  - itm-sigma-viewer
```

### 6.2 Markdown

Replace:

```text
markdown-heading-tree -> tree-viewer
```

with:

```text
markdown-to-itm -> itm-tree-viewer
markdown-to-itm -> itm-mindmap-viewer
```

A Markdown heading becomes an ITM entity:

```ts
{
  kind: "entity",
  id: "heading-12",
  localId: "heading-12",
  label: "Architecture",
  typeRef: "markdown::heading",
  tags: ["h2"],
  attributes: {
    values: {
      level: 2,
      source: "markdown"
    }
  },
  parentId: parentHeadingUid,
  sourceRange
}
```

### 6.3 JSON

Replace:

```text
json-to-tree -> tree-viewer
```

with:

```text
json-to-itm -> itm-tree-viewer
```

Suggested mapping:

```text
JSON object   -> entity type json::object
JSON array    -> entity type json::array
JSON property -> entity type json::property
JSON scalar   -> entity type json::value
```

Example attributes:

```ts
attributes: {
  values: {
    key: "owner",
    valueType: "string",
    value: "Anna",
    jsonPointer: "/owner"
  }
}
```

### 6.4 XML

Replace:

```text
xml-to-tree -> tree-viewer
```

with:

```text
xml-to-itm -> itm-tree-viewer
```

Suggested mapping:

```text
XML element -> entity type xml::element
XML text    -> entity type xml::text
XML comment -> entity type xml::comment
CDATA       -> entity type xml::cdata
```

XML attributes should become ITM attributes, with namespace-safe keys if needed:

```ts
attributes: {
  values: {
    "xml:name": "bpmn:process",
    "attr:id": "Process_1"
  }
}
```

### 6.5 DOT / Graphviz

Replace:

```text
graphviz-dot-to-graph -> cytoscape-graph-viewer
```

with:

```text
dot-to-itm -> itm-cytoscape-viewer
```

DOT nodes become ITM entities. DOT edges become ITM relationships.

```ts
entities: [
  { typeRef: "dot::node", label: "A", localId: "A" },
  { typeRef: "dot::node", label: "B", localId: "B" }
]

relationships: [
  {
    relationshipKind: "explicit",
    sourceRef: "local::A",
    targetRef: "local::B",
    typeRef: "dot::directed_edge"
  }
]
```

---

## 7. ITM viewer adapter design

### 7.1 Shared ITM viewer utility module

Create:

```text
src/viewers/itm/itmViewModel.ts
```

This should not define a new canonical model. It should contain utility functions over ITM library objects:

```ts
export function getRootEntities(model: ItmPipelineValue): ResolvedItmEntity[];
export function getEntityId(entity: ResolvedItmEntity): string;
export function getEntityLabel(entity: ResolvedItmEntity): string;
export function getEntityType(entity: ResolvedItmEntity): string | undefined;
export function getEntityTags(entity: ResolvedItmEntity): string[];
export function getEntityAttributes(entity: ResolvedItmEntity): Record<string, unknown>;
export function getEntityDescription(entity: ResolvedItmEntity): string | undefined;
export function getOutgoingRelationships(entity: ResolvedItmEntity): ResolvedItmRelationship[];
export function getSourceRange(range: ItmSourceRange | undefined, sourceText?: string): SourceRange | undefined;
```

This module should contain small convenience functions only. It should not create `TreeNode` or `GraphModel`.

### 7.2 Tree viewer projection

The tree viewer should render `ResolvedItmEntity.children` directly.

Pseudo-code:

```tsx
function ItmTreeView({ model }: { model: ItmPipelineValue }) {
  const roots = getRootEntities(model);
  return <ol>{roots.map((entity) => <ItmTreeItem entity={entity} />)}</ol>;
}

function ItmTreeItem({ entity }: { entity: ResolvedItmEntity }) {
  return (
    <li>
      <EntityRow entity={entity} />
      {entity.children.length ? (
        <ol>{sortByRank(entity.children).map((child) => <ItmTreeItem entity={child} />)}</ol>
      ) : null}
    </li>
  );
}
```

### 7.3 Mindmap projection

jsMind requires a `node_tree` data structure. That structure should be created inside the mindmap viewer only:

```ts
function entityToJsMind(entity: ResolvedItmEntity): JsMindNode {
  return {
    id: getEntityId(entity),
    topic: getEntityTopic(entity),
    expanded: true,
    children: sortByRank(entity.children).map(entityToJsMind),
    ...jsMindStyleFromItm(entity)
  };
}
```

Cross-links should be taken from ITM relationships, not from a `links` property on a custom node.

### 7.4 Cytoscape projection

Cytoscape elements should be created directly from `ResolvedItmDocument`:

```ts
function itmToCytoscapeElements(model: ItmPipelineValue): cytoscape.ElementDefinition[] {
  return [
    ...model.resolved.entities.map(entityToCyNode),
    ...model.resolved.relationships.map(relationshipToCyEdge),
    ...containmentEdges(model).map(containmentToCyEdge)
  ];
}
```

Containment can be represented in one of two ways:

1. Cytoscape compound nodes, using `parent`.
2. Explicit `contains` edges.

For early implementation, explicit containment edges are easier and consistent with the current visual behaviour.

Recommended edge types:

```text
itm::contains       hierarchy / parent-child relationship
<relationship type> explicit ITM relationship
```

### 7.5 Sigma / Graphology projection

Sigma should similarly build a Graphology graph from ITM:

```ts
const g = new Graphology({ type: "mixed", multi: true, allowSelfLoops: true });

for (const entity of model.resolved.entities) {
  g.addNode(getEntityId(entity), entityToGraphologyAttributes(entity));
}

for (const relationship of model.resolved.relationships) {
  g.addDirectedEdgeWithKey(getRelationshipId(relationship), sourceId, targetId, relationshipToGraphologyAttributes(relationship));
}
```

No `GraphModel` should be introduced between ITM and Graphology.

---

## 8. Styles and selectors

### 8.1 Do not parse selectors locally

The old code contains local matching logic for selectors such as:

```text
*
&type
[type]
#tag
{key=value}
->
->[type]
=>
```

This should be removed for ITM.

If the ITM library exposes selector parsing/matching, TextForge should call it. If not, selector matching should be introduced in the library, not reinvented in TextForge.

TextForge should not own ITM selector semantics.

### 8.2 Viewer style computation

A viewer may compute effective visual style as a last-mile operation:

```text
entity attributes
+ matching %style rules
+ inherited text style where applicable
+ viewer defaults
```

But matching and interpretation should use library-provided selector semantics.

Recommended library-facing abstraction:

```ts
const style = computeEffectiveStyle(model.document, model.resolved, {
  target: entityOrRelationship,
  targetKind: "entity" | "relationship" | "containment"
});
```

If `@textforge/itm` does not currently provide this, add it there.

### 8.3 Supported viewer style properties

Viewer adapters may map ITM style properties to their rendering engines:

```text
ITM style              Cytoscape                 jsMind/Sigma
fill/bg/background     background-color/node     node background/color
fg/text-color/color    label color               label color
stroke/border-color    border/edge color         border/edge color
stroke-width           edge width/border width   edge width/border width
shape                  node shape                approximate if supported
size                   node size                 node size
x/y                    initial position          initial position
opacity                opacity                   opacity where supported
```

This mapping belongs in viewer adapters, not in the model layer.

---

## 9. Source ranges and visual selection

TextForge already has visual-to-source selection concepts. These should survive the refactor.

### 9.1 Source range conversion

Keep TextForge's UI `SourceRange` type if useful:

```ts
export interface SourceRange {
  from: number;
  to: number;
  line: number;
  column: number;
}
```

But convert from `ItmSourceRange` at the UI boundary.

```ts
function toTextForgeSourceRange(range: ItmSourceRange | undefined, sourceText: string): SourceRange | undefined;
```

### 9.2 Selection IDs

Use stable ITM IDs:

```text
entity.uid
relationship.uid
qualifiedId
localId
```

Recommended visual IDs:

```text
entity:<entity.uid>
relationship:<relationship.uid>
containment:<parent.uid>:<child.uid>
```

Do not invent IDs from labels or array positions unless no ITM ID exists.

### 9.3 Source selection lookup

Instead of searching custom DTOs, search ITM entities and relationships:

```ts
function findItmObjectForSourceRange(model: ItmPipelineValue, range: SourceRange): ItmSelection | undefined {
  const candidates = [
    ...model.resolved.entities,
    ...model.resolved.relationships,
    ...model.document.styles,
    ...model.document.views,
    ...model.document.viewpoints
  ];
  return bestSourceRangeMatch(candidates, range);
}
```

This allows source highlighting to work not only for entities, but also for relationships, styles, views, and directives.

---

## 10. Includes and multi-document resolution

TextForge already passes open documents through contribution context. That should become the basis for ITM include resolution.

Recommended approach:

```ts
interface ParseItmOptions {
  currentDocumentId?: string;
  currentFileName?: string;
  includeDocuments?: TextDocument[];
}
```

Create an include resolver adapter:

```ts
function createTextForgeIncludeResolver(documents: TextDocument[]) {
  return {
    resolve(target: string, fromUri?: string) {
      return findOpenDocumentByIncludeTarget(target, documents);
    }
  };
}
```

The resolver should understand:

```text
exact file name
relative path
basename fallback
document id
case-insensitive file systems where appropriate
```

But the parsing and include semantics should remain in `@textforge/itm`.

Do not expand includes manually with line-based preprocessing.

---

## 11. Diagnostics

The ITM parser diagnostics should be preserved directly.

TextForge diagnostics should wrap ITM diagnostics without changing their meaning:

```ts
function toTextForgeDiagnostic(diagnostic: ItmDiagnostic, context: DiagnosticContext): Diagnostic {
  return {
    source: diagnostic.source || "@textforge/itm",
    severity: diagnostic.severity,
    message: diagnostic.message,
    languageId: context.languageId,
    documentId: context.documentId,
    range: toTextForgeSourceRange(diagnostic.range, context.text),
    target: diagnostic.target
  };
}
```

Diagnostics from viewers should be separate and should reference ITM object IDs when possible:

```ts
{
  source: "itm-cytoscape-viewer",
  severity: "warning",
  message: "Relationship target is unresolved and cannot be drawn.",
  target: {
    relationshipUid: relationship.uid,
    targetRef: relationship.targetRef
  }
}
```

---

## 12. Lua runtime implications

The Lua runtime currently exposes parsing helpers that return `TreeNode[]` and built-in pipeline steps such as `itm-to-tree` and `itm-to-graph`.

These should change to ITM-first functions:

```lua
local model = input:parse_itm()
```

Where `model` represents the ITM object model in Lua-friendly table form.

Recommended Lua pipeline bridge:

```text
input:parse_itm()       -> model.itm table
run("itm-parse")        -> model.itm pipeline value
run("json-to-itm")      -> model.itm pipeline value
run("itm-to-json")      -> text.json, optional later
```

Remove or replace:

```text
parse_itt
emit_itt
itm-to-tree
itm-to-graph
itt-to-tree
itt-to-graph
```

Given pre-alpha, avoid maintaining aliases unless they are genuinely needed for current experiments.

For emitting ITM, use the library serializer:

```ts
serializeDocument(itmDocument)
```

Lua should not emit TextForge `TreeNode[]` and then convert that back to ITM.

---

## 13. Migration plan

### Phase 1 — Introduce `model.itm`

Goal: add the new model without immediately deleting everything.

Tasks:

1. Add `ItmPipelineValue` to `PipelineValue`.
2. Add `parseItmValue()` wrapper around `@textforge/itm`.
3. Add `itm-parse` transformer.
4. Add an `itm-inspector-viewer` that simply displays metadata, entity count, relationship count, styles, views, and diagnostics.
5. Add tests proving multiline attributes/directives do not become entities.

Definition of done:

```text
Opening an ITM file and running ITM Parse produces model.itm.
No TreeNode or GraphModel is involved in this pipeline.
The inspector shows entities, relationships, styles, views, and viewpoints from the library model.
```

### Phase 2 — ITM tree viewer

Goal: replace the current tree viewer for ITM.

Tasks:

1. Create `itm-tree-viewer` consuming `model.itm`.
2. Render `ResolvedItmEntity.children` directly.
3. Add search over entity id, label, type, tags, attributes.
4. Add inspector panel for selected entity.
5. Add source-range selection for entities and relationships.
6. Remove `view-itm-tree` use of `itm-to-tree`.

Definition of done:

```text
ITM tree viewing works without TreeNode[].
Multiline metadata/style/view blocks are not displayed as entities.
Entity attributes and descriptions come from @textforge/itm objects.
```

### Phase 3 — ITM graph viewers

Goal: remove `itm-to-graph` and render from ITM relationships.

Tasks:

1. Create `itm-cytoscape-viewer` consuming `model.itm`.
2. Create `itm-sigma-viewer` consuming `model.itm`.
3. Build Cytoscape/Graphology structures inside each viewer.
4. Render explicit relationships from `resolved.relationships`.
5. Add containment edges or compound hierarchy rendering.
6. Apply ITM style rules using library selector support.
7. Preserve source selection for entities and relationships.

Definition of done:

```text
Graph viewers display ITM entities and relationships directly.
No GraphModel is produced for ITM.
Relationship selectors such as @depends_on:* apply correctly.
```

### Phase 4 — ITM mindmap viewer

Goal: remove jsMind dependency on `TreeNode[]`.

Tasks:

1. Create `itm-mindmap-viewer` consuming `model.itm`.
2. Convert entity containment to jsMind `node_tree` locally.
3. Draw cross-links from ITM relationships.
4. Apply entity styles and relationship styles.
5. Preserve search and source selection.

Definition of done:

```text
Mindmap viewer works directly from model.itm.
Cross-links come from ITM relationships, not custom node.links arrays.
```

### Phase 5 — Convert non-ITM parsers to ITM

Goal: remove the need for generic `model.tree` / `model.graph` pipeline values.

Order:

1. Markdown headings -> ITM
2. JSON -> ITM
3. XML -> ITM
4. DOT -> ITM
5. Optional: CSV -> ITM for structural view, keep table for table view
6. Optional: BPMN XML -> ITM architectural/semantic view, keep BPMN viewer for native diagram view

Definition of done:

```text
No plugin emits model.tree or model.graph.
All structural viewers consume model.itm.
```

### Phase 6 — Delete old DTOs and pipelines

Goal: remove accidental architecture.

Delete:

```text
TreeNode
GraphNode
GraphEdge
GraphModel
model.tree
model.graph
itm-to-tree
itm-to-graph
ittCore.ts
parsers/itt.ts
old ITM syntax helper functions
```

Rename or remove old docs referring to generic tree/graph DTOs.

Definition of done:

```text
A repository-wide search for TreeNode and GraphModel returns no domain-level or pipeline-level usage.
Remaining tree/graph structures are private viewer adapter types only.
```

---

## 14. Testing strategy

### 14.1 Parser integration tests

Add tests for native ITM:

```itm
%metadata
{
  title: Example
  owner: Platform
}

%style @depends_on:*
{
  stroke: "#777"
  stroke-width: 3
}

%viewpoint dependency_view
{
  pipeline:
    - select: "[Component]"
    - includeEdges: "@depends_on:*"
}

%view dependencies
{
  viewpoint: dependency_view
}

&root [Component] Root
{
  owner: platform
  lifecycle:
    - draft
    - active
}
  &child [Component] Child @depends_on:root
```

Expected:

```text
- one root entity named Root
- one child entity named Child
- one explicit relationship depends_on child -> root
- one metadata block
- one style directive
- one viewpoint
- one view
- no entity labelled "{" or "pipeline:" or "owner:" or "lifecycle:"
```

### 14.2 Viewer regression tests

For each ITM viewer:

```text
- renders correct entity count
- renders containment hierarchy
- renders explicit relationship count
- applies entity style
- applies relationship style
- search finds entity by label/type/tag/attribute
- source selection maps entity to source
- source selection maps relationship to source
```

### 14.3 Conversion tests

For each non-ITM parser:

```text
Markdown sample -> model.itm entity tree
JSON sample     -> model.itm entity tree
XML sample      -> model.itm entity tree
DOT sample      -> model.itm entities + relationships
```

Test that all generated ITM documents can be serialized by `@textforge/itm` and parsed again.

### 14.4 No-regression architectural tests

Add a simple static test or lint rule:

```text
No import of TreeNode or GraphModel from domain/types.
No PipelineValue branch for model.tree or model.graph.
No ITM syntax regex parser outside @textforge/itm.
```

This protects the architecture from drifting back.

---

## 15. Recommended file/module layout

```text
src/domain/types.ts
  PipelineValue
  Diagnostic
  SourceRange
  TextDocument
  viewer/plugin contracts

src/parsers/itm.ts
  parseItmValue()
  diagnostic conversion only

src/parsers/markdownToItm.ts
  markdownToItmValue()

src/parsers/jsonToItm.ts
  jsonToItmValue()

src/parsers/xmlToItm.ts
  xmlToItmValue()

src/parsers/dotToItm.ts
  dotToItmValue()

src/viewers/itm/itmCommon.ts
  small helpers over ResolvedItmDocument / ResolvedItmEntity

src/viewers/itm/ItmTreeView.tsx
  tree renderer from ITM

src/viewers/itm/ItmMindMapView.tsx
  jsMind projection from ITM

src/viewers/itm/ItmCytoscapeView.tsx
  Cytoscape projection from ITM

src/viewers/itm/ItmSigmaView.tsx
  Graphology/Sigma projection from ITM

src/viewers/itm/ItmInspectorView.tsx
  debugging/model inspection view

src/plugins/itmCore.ts
  itm-parse transformer
  itm linter

src/plugins/viewerCore.ts
  registers ITM viewers

src/plugins/markdownCore.ts
  markdown-to-html
  markdown-to-itm

src/plugins/jsonCore.ts
  json-linter
  json-to-itm

src/plugins/xmlCore.ts
  xml-linter
  xml-to-itm

src/plugins/diagramCore.ts
  mermaid/svg support
  dot-to-itm
```

---

## 16. Implementation details for generated ITM from other formats

### 16.1 Namespaces

Generated model content should use stable namespaces:

```text
markdown::heading
json::object
json::array
json::property
xml::element
dot::node
dot::edge
bpmn::process
```

If the library requires namespace declarations, generated documents should include them.

### 16.2 IDs

Generated local IDs should be stable and safe:

```text
markdown-heading-12
json-root-owner
xml-17
bpmn-Process_1
dot-A
```

Avoid labels as IDs unless sanitized and collision-managed.

Recommended helper:

```ts
function uniqueLocalId(base: string, used: Set<string>): string {
  const safe = sanitizeLocalId(base);
  if (!used.has(safe)) {
    used.add(safe);
    return safe;
  }
  let index = 2;
  while (used.has(`${safe}-${index}`)) {
    index += 1;
  }
  const id = `${safe}-${index}`;
  used.add(id);
  return id;
}
```

### 16.3 Source provenance

Generated entities should preserve source provenance:

```ts
attributes: {
  values: {
    sourceLanguage: "text.json",
    sourcePath: "/items/0/name",
    generated: true
  }
}
```

Use source ranges wherever the parser can provide them.

### 16.4 Round-trip expectations

Not every source format will round-trip through ITM losslessly at first.

Recommended classification:

```text
Native ITM          full fidelity
Markdown headings   structural extraction, not full Markdown round-trip
JSON                structural extraction with values preserved as attributes
XML                 structural extraction, some lexical formatting lost
DOT                 graph structure, some DOT-specific layout/style may be lossy
BPMN                later phase; direct BPMN viewer remains authoritative initially
```

---

## 17. Risks and mitigations

### Risk: Big-bang refactor breaks all viewers

Mitigation:

- First add `model.itm` and one ITM inspector viewer.
- Then migrate viewers one by one.
- Delete old DTOs only after all structural pipelines are converted.

### Risk: ITM library lacks helper functions needed by viewers

Mitigation:

- Add missing selector/style/view utilities to `@textforge/itm`, not TextForge.
- Keep TextForge viewer adapters thin.

### Risk: ITM becomes overloaded as a rendering format

Mitigation:

- Keep rendering concerns in viewer adapters.
- ITM stores semantic model and style directives, not Cytoscape/jsMind/Graphology internals.

### Risk: Non-ITM formats feel awkward when forced into ITM

Mitigation:

- Treat generated ITM as structural extraction, not necessarily full-fidelity source representation.
- Keep native viewers where appropriate, such as HTML, SVG, BPMN XML.

### Risk: Lua scripts depend on old tree/graph values

Mitigation:

- Since pre-alpha, break them intentionally.
- Provide clear new Lua helpers around `model.itm`.
- Add examples of traversing entities and relationships in Lua.

---

## 18. Definition of done for the full refactor

The refactor is complete when:

```text
1. ITM text parses to model.itm using @textforge/itm.
2. Markdown, JSON, XML, and DOT structural transforms emit model.itm.
3. Tree, mindmap, Cytoscape, and Sigma viewers consume model.itm directly.
4. TreeNode, GraphNode, GraphEdge, GraphModel are removed from domain pipeline contracts.
5. No ITM syntax parsing regexes exist in TextForge outside test fixtures.
6. Multiline ITM attributes/directives never appear as fake entities.
7. ITM styles and relationship selectors are applied through library semantics.
8. Source-to-visual and visual-to-source selection works for entities and relationships.
9. Includes are resolved through the ITM library using TextForge open-document context.
10. Tests cover native ITM, generated ITM, viewers, diagnostics, and architecture guards.
```

---

## 19. Recommended first pull request

The first PR should be intentionally small but architectural.

Title:

```text
Introduce model.itm pipeline value and parse ITM through @textforge/itm
```

Scope:

```text
- Add ItmPipelineValue to PipelineValue.
- Add parseItmValue().
- Add itm-parse transformer.
- Add itm-inspector-viewer.
- Add pipeline: ITM -> ITM Inspector.
- Add regression test for multiline metadata/style/viewpoint/view blocks.
- Do not yet delete model.tree/model.graph.
```

This creates the new spine without trying to migrate every viewer at once.

The second PR can migrate the ITM tree viewer. The third can migrate graph viewers. The fourth can migrate non-ITM parsers. The final cleanup PR can delete old DTOs.

---

## 20. Final recommendation

Because TextForge is pre-alpha, the best decision is to remove the accidental tree/graph domain model and make ITM the single structural object model.

This turns TextForge into a coherent ITM-centered workbench:

```text
text sources -> ITM model -> viewers/editors/exporters
```

rather than a workbench with multiple competing intermediate models.

The cost is a significant refactor of viewers and plugins. The benefit is much larger: fewer parsing bugs, less duplicated semantics, better future compatibility with ITM, cleaner write-back design, and a much simpler conceptual architecture.
