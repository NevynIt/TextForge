# ITM Visuals Grilling

## Purpose

This document records the grilling session on how to recover and re-implement ITM visual functionality from the old TextForge release while integrating it correctly into the new package-based architecture.

The central concern was that the current visual renderer equivalence assessment correctly identified a gap between static publications and interactive runtime viewers, but still risked treating `.itm` as a monolithic graph-like model. The grilling clarified that an ITM file can contain a canonical model, declared viewpoints, and concrete views. The recovery approach must therefore respect ITM view/viewpoint semantics, not merely reintroduce graph renderers over the whole file.

The goal of this document is not to rewrite the existing assessment paper or roadmap. It records the decisions, implications, risks, validation checks, and later changes that should inform new roadmap workpackages.

---

## Index of grilling topics

1. Visual renderer opening target
2. First-class extracted ITM subset resources
3. Location of view/viewpoint execution
4. Extracted ITM subset versus renderer view model
5. Generic renderer packages versus ITM-specific renderers
6. Visual ITM as constrained intermediate profile
7. Renderer consumption of validated Visual ITM objects
8. Dual provenance and source traceability
9. Write-back classes and Visual ITM edit/export implications
10. Translator loss profiles as user-facing documentation
11. Visual editing normalized against Visual ITM concepts
12. Location of the Visual ITM package/profile
13. Viewer parity before visual editing
14. Read-only interactive visual consumption scope
15. Translation/export utilities as a separate target
16. Renderer unavailable behavior
17. Generic renderers as explicit “open with” options
18. Visual target picker
19. Multi-open behavior
20. `itm-pub` and Visual ITM
21. Shared visual target resolution for surfaces and `itm-pub`
22. Existing ITM `render:` pipeline step as renderer reference
23. Split recovery into multiple workpackages
24. Vertical-slice implementation order
25. Visual ITM profile v1 scope
26. Visual ITM extension discipline
27. Preventing static projection from being mistaken for renderer parity

---

## Repository context inspected

- Repository: `https://github.com/NevynIt/TextForge`
- Branches considered:
  - `rewrite/v2-monorepo`
  - `main`
- Primary report reviewed:
  - `roadmap/specs/architecture/itm-visual-renderer-equivalence-assessment.md`
- Relevant observed implementation context:
  - current rewrite branch has `.itm` projection surfaces and static graph/mindmap publication output;
  - old main branch had actual Cytoscape, Sigma/Graphology, and jsMind runtime viewers;
  - current ITM projection logic already has partial concepts for views/viewpoints, but does not yet implement the full target-resolution and runtime-renderer model required for parity;
  - the ITM spec already defines viewpoints as pipelines and views as concrete instances with parameters and deltas.

---

## Questions, recommendations, user decisions, and implications

### 1. What is the primary unit opened by a visual renderer?

**Why it mattered**

The implementation must not treat an ITM file as one monolithic graph. A single ITM file can contain multiple declared viewpoints and views, in addition to the raw model.

**Recommended answer**

Opening ITM visuals should resolve visual targets in this order:

1. declared `%view` entries;
2. declared `%viewpoint` entries;
3. raw model fallback options.

**User decision**

Accepted with refinement: viewpoints and views already identify a specific engine and filtered subset. The UI should allow:

- opening the predetermined renderer as the default option;
- extracting the filtered subset of a viewpoint or view;
- applying generic renderers to the whole model or to an extracted subset.

**Tangible implication**

The recovery needs a visual target resolution layer, not just renderer registration.

---

### 2. Should “extract subset” create a first-class derived ITM resource?

**Why it mattered**

If extraction is only an internal filter, users cannot inspect, reuse, save, validate, or pass the subset to generic renderers.

**Recommended answer**

Yes. Extracting a viewpoint/view subset should create a first-class derived ITM model resource, read-only by default.

**User decision**

Accepted.

**Tangible implication**

The roadmap should include explicit ITM subset extraction. The extracted subset can feed predetermined or generic renderers.

---

### 3. Where should view/viewpoint execution live?

**Why it mattered**

If each renderer implements ITM semantics, the code will duplicate and drift. If ITM owns extraction and renderers consume clean intermediate models, the architecture stays package-aligned.

**Recommended answer**

`@textforge/itm` should own ITM view/viewpoint resolution and extraction. Renderer packages should own runtime rendering only.

**User decision**

Accepted. The old app’s key value was source-traceable intermediate data closer to renderer needs. ITM should extract data; renderer packages should consume it.

**Tangible implication**

Separate responsibilities:

- ITM package: semantic resolution, subset extraction, source trace;
- renderer packages: runtime rendering;
- shell: opening, routing, search/selection wiring.

---

### 4. Should the intermediate extracted format be valid ITM subset or renderer model?

**Why it mattered**

A valid ITM subset is inspectable and reusable, but renderers also need optimized runtime structures.

**Recommended answer**

Use two layers:

1. extracted ITM subset;
2. renderer-facing visual model derived from that subset.

**User decision**

Accepted.

**Tangible implication**

The target chain is:

```text
source ITM → selected view/viewpoint → extracted ITM subset → Visual ITM / renderer view model → runtime renderer
```

---

### 5. Should renderer packages be generic or ITM-specific?

**Why it mattered**

Cytoscape, Sigma, and jsMind can also serve DOT-derived graphs, future BPMN/ArchiMate projections, and other source formats.

**Recommended answer**

Make renderer packages generic runtime packages, not ITM-specific packages.

**User decision**

Accepted.

**Tangible implication**

Renderer packages should depend on a shared visual model contract, not on native ITM parsing. ITM-specific adapters feed that contract.

---

### 6. Should “visual model” be a dedicated ITM profile?

**Why it mattered**

Using arbitrary ITM as renderer input would make renderers fragile. A profile keeps ITM as the strategic intermediate layer without forcing renderers to understand full ITM semantics.

**Recommended answer**

Yes. Define a constrained Visual ITM profile.

**User decision**

Accepted.

**Tangible implication**

Visual ITM becomes the shared intermediate layer:

```text
source format → Visual ITM profile → renderer adapter → runtime renderer
```

This also supports future translators such as DOT to Visual ITM and Visual ITM to Mermaid/BPMN/etc.

---

### 7. Should renderer packages parse Visual ITM themselves?

**Why it mattered**

If every renderer parses and validates Visual ITM, parser logic will duplicate.

**Recommended answer**

No. Renderer packages should consume already-validated in-memory Visual ITM objects.

**User decision**

Accepted.

**Tangible implication**

Validation and profile interpretation live upstream. Renderers focus on adapting Visual ITM to their runtime engine.

---

### 8. Should Visual ITM preserve original-source traceability separately from Visual ITM source positions?

**Why it mattered**

A derived Visual ITM resource may have its own source ranges, but renderer interactions need to map back to the original source model for navigation, search, selection sync, diagnostics, and possible write-back.

**Recommended answer**

Yes. Visual ITM should carry dual provenance:

- Visual ITM identity/location;
- origin trace back to original source file, node/edge id, range, view, viewpoint, and pipeline step.

**User decision**

Accepted.

**Tangible implication**

Visual ITM must include source trace metadata. This is essential for old-renderer parity.

---

### 9. What is the write-back target?

**Why it mattered**

Visual ITM may be derived from native ITM, DOT, BPMN, or another source. Direct renderer mutation of the original source would be unsafe.

**Recommended answer**

Use explicit write-back classes:

1. view-only changes;
2. semantic model changes;
3. generated/translated sources;
4. standalone Visual ITM resources.

**User decision**

Accepted in principle, with an important addition: if translators exist from Visual ITM back to DOT/BPMN/etc., then edits represented in Visual ITM can be exported back, accepting that translation losses are lost.

**Tangible implication**

Visual ITM can become an editable working layer for translation workflows, provided exports are explicitly loss-aware.

---

### 10. Should translators declare their loss profile?

**Why it mattered**

If Visual ITM becomes an editable or transformable working layer, users must know what will be preserved or lost when exporting.

**Recommended answer**

Yes. Translators/exporters should declare their loss profile.

**User decision**

Accepted, but as user-facing text rather than an automated compatibility engine.

**Tangible implication**

Translator packages should document loss clearly, for example:

- preserved features;
- discarded features;
- approximated features;
- unsupported features.

This should not become a heavy automated schema bureaucracy early.

---

### 11. Should visual editing happen on Visual ITM only?

**Why it mattered**

Cytoscape, Sigma, and jsMind have different native runtime models. A common editing abstraction prevents three separate editing models.

**Recommended answer**

Yes. Renderer interactions should normalize into Visual ITM edit concepts.

**User decision**

Accepted.

**Tangible implication**

Future editing pipeline:

```text
renderer interaction → Visual ITM edit operation → validation → write-back/export handler
```

This is later work, not required for viewer parity.

---

### 12. Where should Visual ITM live?

**Why it mattered**

If Visual ITM lives inside native ITM only, it may become too coupled to native ITM. If it lives inside renderers, it fragments.

**Recommended answer**

Create a separate package/profile layer such as `@textforge/visual-itm`.

**User decision**

Accepted.

**Tangible implication**

Visual ITM becomes the shared interchange layer for:

- ITM extraction;
- DOT/BPMN/Mermaid translators;
- renderer packages;
- publication renderers.

---

### 13. Should old renderer parity be implemented before visual editing?

**Why it mattered**

Visual editing adds complexity. The immediate regression is read-only visual consumption parity.

**Recommended answer**

Yes. Restore viewer parity first; defer visual editing.

**User decision**

Accepted. Visualization and consumption of visuals should be top quality before visual editing is implemented.

**Tangible implication**

Visual editing must not block recovery of Cytoscape, jsMind, or Sigma consumption parity.

---

### 14. What is the parity target for visualization and consumption?

**Why it mattered**

Without a clear scope, work could drift into editing/export too early.

**Recommended answer**

Define parity as read-only interactive visual consumption.

**User decision**

Accepted with one correction: lossy export is not visual editing; it belongs to translator capability.

**Tangible implication**

Viewer parity scope includes:

- target discovery;
- declared renderer opening;
- extraction;
- runtime surfaces;
- search;
- selection;
- inspector;
- source navigation;
- layout/zoom/pan/fold/filter controls.

Translator/export utilities are separate.

---

### 15. Should Visual ITM translators be introduced with viewer parity or as a separate workpackage?

**Why it mattered**

DOT to Visual ITM could validate architecture, but could also distract from ITM renderer parity.

**Recommended answer**

Keep translators as a separate workpackage/target.

**User decision**

Accepted. Translator packages should depend only on the Visual ITM profile so they can be implemented any time after the profile draft.

**Tangible implication**

Translator work becomes optional and dependency-light:

```text
Visual ITM profile → translator package track
```

It is not blocked by Cytoscape/jsMind/Sigma work.

---

### 16. What happens if a view/viewpoint names an unavailable renderer?

**Why it mattered**

A view/viewpoint may declare a renderer that is missing, disabled, or incompatible.

**Recommended answer**

Report a diagnostic/error. Do not silently substitute another renderer.

**User decision**

Accepted with simplification: do not make the UI too smart. Show the error; let the user choose any next action.

**Tangible implication**

Renderer resolution should be plain and predictable:

- available → open;
- unavailable → error.

No automatic fallback.

---

### 17. Should generic renderers appear as peer “open with” options?

**Why it mattered**

A declared viewpoint/view has an intended renderer, but users may explicitly want another perspective.

**Recommended answer**

Yes, but only as explicit user choice.

**User decision**

Accepted, with the later refinement that this should not pollute the context menu.

**Tangible implication**

Generic renderer choice should be available through the visual target picker or explicit open-with flow, not automatic fallback.

---

### 18. Should there be an intermediate visual target picker?

**Why it mattered**

An ITM file can contain multiple views and viewpoints. Flattening all of them into the context menu would make the UI noisy.

**Recommended answer**

Yes. Add a visual target picker.

**User decision**

Accepted. Plain open goes to CodeMirror. “Open visuals…” opens a picker that allows choosing one or more views/viewpoints/raw model options.

**Tangible implication**

The context menu should remain small:

- Open;
- Open visuals…

The picker handles view/viewpoint selection.

---

### 19. Should multi-open create separate surfaces or one combined dashboard?

**Why it mattered**

A combined dashboard would require a new layout/container concept.

**Recommended answer**

Open each selected visual target as a separate surface.

**User decision**

Accepted. Dashboards belong to Markdown `itm-pub`, not the visual picker.

**Tangible implication**

Multi-open flow:

```text
visual picker → selected targets → open N independent surfaces
```

---

### 20. Should `itm-pub` consume the same Visual ITM layer?

**Why it mattered**

Interactive surfaces and Markdown dashboards should not drift.

**Recommended answer**

Yes. `itm-pub` should use the same internal Visual ITM pipeline.

**User decision**

Accepted, with refinement: users should not be constrained to author Visual ITM in Markdown. Each block should internally run the transformation:

```text
ITM model → filtered model → Visual ITM → renderer
```

**Tangible implication**

Visual ITM is an internal contract for `itm-pub`, not a required user-facing Markdown authoring format.

---

### 21. Should `itm-pub` and visual surfaces share the same target-resolution logic?

**Why it mattered**

The same ITM view/viewpoint should resolve consistently whether opened interactively or rendered in a Markdown dashboard.

**Recommended answer**

Yes.

**User decision**

Accepted.

**Tangible implication**

Create one canonical visual target resolver used by both:

- interactive surfaces;
- Markdown `itm-pub` blocks.

---

### 22. Should implementation use the existing `render:` pipeline step as the renderer reference?

**Why it mattered**

The ITM spec already defines viewpoints as pipelines and includes render steps. Inventing another renderer declaration would duplicate the spec.

**Recommended answer**

Yes. Use the existing pipeline interpretation, especially the terminal `render:` step.

**User decision**

Accepted.

**Tangible implication**

No new ITM syntax is needed. The recovery work should implement the spec’s existing model:

```text
%view → viewpoint → pipeline select/filter/transform/layout/render → Visual ITM → renderer capability
```

---

### 23. Should the recovery be split into separate workpackages rather than one “ITM visuals” workpackage?

**Why it mattered**

The recovery includes UI, extraction, Visual ITM, runtime renderers, and publication integration. One giant workpackage would be ambiguous.

**Recommended answer**

Yes. Use multiple workpackages.

**User decision**

Accepted.

**Tangible implication**

The roadmap should introduce a chain of focused workpackages rather than one large “ITM visuals” phase.

---

### 24. Should the implementation use vertical slices to show value early?

**Why it mattered**

A foundation-first plan front-loads too much invisible work before the user sees improvement.

**Recommended answer**

Yes. Use vertical slices while keeping invisible progress minimal.

**User decision**

Accepted, with refinement:

- draft Visual ITM early;
- then deliver visible improvements step by step;
- keep translators as a separate target that depends only on Visual ITM.

**Tangible implication**

Prefer this order:

1. Visual ITM profile draft;
2. Visual target picker MVP;
3. Cytoscape vertical slice;
4. shared resolver integration with `itm-pub`;
5. jsMind vertical slice;
6. Sigma/Graphology vertical slice;
7. optional translator workpackage track.

---

### 25. Should Visual ITM profile v1 be intentionally minimal?

**Why it mattered**

A heavy Visual ITM foundation would become another invisible phase. But it must still be useful to translators.

**Recommended answer**

Yes. Visual ITM v1 should be minimal but complete enough for common graph/tree/mindmap needs.

**User decision**

Accepted. The user wants the profile to remain minimal as long as possible.

**Tangible implication**

Visual ITM v1 should include:

- visual nodes;
- visual edges;
- hierarchy/containment;
- labels;
- types/classes/tags;
- style attributes;
- source provenance;
- view/viewpoint provenance;
- layout hints;
- renderer hints;
- diagnostics.

It should not include advanced editing, BPMN-specific semantics, or complete export-loss machinery.

---

### 26. Should Visual ITM v1 have a strict extension rule?

**Why it mattered**

Visual ITM could become a dumping ground if every renderer adds fields freely.

**Recommended answer**

Yes, but as roadmap/documentation guidance, not as hard code enforcement.

**User decision**

Accepted.

**Tangible implication**

The roadmap should document that extensions should be:

- proven by implementation need;
- generic where possible;
- namespaced when renderer-specific;
- optional;
- documented with examples.

No heavy validator enforcement is needed initially.

---

### 27. Should the roadmap explicitly prevent “static projection = renderer parity” from happening again?

**Why it mattered**

The current assessment shows this failure mode: static graph/mindmap publications were treated too close to renderer replacements.

**Recommended answer**

Yes.

**User decision**

Accepted.

**Tangible implication**

Roadmap validation must distinguish:

- static publication output;
- interactive runtime surface;
- source trace;
- search and selection sync;
- declared view/viewpoint renderer execution.

Static Graphviz/Mermaid/HTML output is valid publication functionality, but not Cytoscape/Sigma/jsMind parity.

---

## Consolidated architectural decisions

### Core model

- ITM remains the canonical semantic source when the original source is ITM.
- A single ITM file can contain:
  - the raw model;
  - viewpoints;
  - views.
- Opening visuals must respect this structure.

### Visual target resolution

- Plain open opens the CodeMirror text editor.
- “Open visuals…” opens a visual target picker.
- The picker lists views, viewpoints, and raw model options.
- The picker allows selecting multiple targets.
- Each selected target opens as an independent surface.
- Dashboards/composed visual pages remain the responsibility of Markdown `itm-pub`.

### Visual ITM

- Visual ITM is a constrained ITM profile used as an intermediate visual model.
- It should be a separate package/profile layer, for example `@textforge/visual-itm`.
- It should remain minimal.
- It should carry source and transformation provenance.
- It should support both interactive renderers and static/publication renderers.
- It is an internal contract for renderers and `itm-pub`, not necessarily a user-facing authoring requirement.

### Renderer packages

- Cytoscape, jsMind, and Sigma/Graphology should live in separate renderer packages.
- Renderers should consume validated in-memory Visual ITM objects.
- Renderers should not parse arbitrary ITM text.
- Renderers should not silently replace missing declared renderers.

### `itm-pub`

- `itm-pub` should use the same visual target resolution and Visual ITM generation pipeline as interactive surfaces.
- Users can continue authoring Markdown blocks against normal ITM sources/views/viewpoints.
- Each block internally runs the same transformation pipeline before rendering.

### Translators

- Translator packages are a separate target.
- They depend on Visual ITM profile v1.
- They can be implemented any time after Visual ITM is drafted.
- Loss profiles should be documented as user-facing text, not enforced by an automated compatibility engine initially.

### Visual editing

- Visual editing is not part of initial viewer parity.
- Future visual edits should normalize into Visual ITM edit concepts.
- Write-back/export handlers decide how changes map back to source ITM, standalone Visual ITM, or lossy target formats.

---

## Recommended workpackage chain

### WP 1 — Visual ITM profile draft

**Purpose**

Create the minimal Visual ITM profile and package/documentation basis.

**Visible value**

Limited, but intentionally small. It unlocks all later slices and translator work.

**Scope**

- visual node/edge/tree/mindmap concepts;
- hierarchy and relationships;
- labels, classes/tags/types;
- style attributes;
- source provenance;
- view/viewpoint provenance;
- layout hints;
- renderer hints;
- diagnostics conventions;
- documentation guidance for extensions.

**Out of scope**

- visual editing operations;
- heavy schema enforcement;
- advanced Sigma metrics;
- BPMN-specific semantics;
- full loss-profile automation.

---

### WP 2 — Visual target picker MVP

**Purpose**

Make ITM’s view/viewpoint structure visible in the UI.

**Visible value**

Immediate improvement: users no longer see `.itm` as one monolithic graph-like type.

**Scope**

- plain open opens CodeMirror;
- “Open visuals…” opens target picker;
- picker lists views, viewpoints, and raw model options;
- picker supports selecting more than one target;
- selected targets open as separate surfaces;
- existing static projections may be used initially.

---

### WP 3 — Cytoscape vertical slice

**Purpose**

Restore the first real interactive graph runtime.

**Visible value**

First major old-renderer parity improvement.

**Scope**

- ITM view/viewpoint → filtered model → Visual ITM graph;
- Cytoscape renderer package;
- interactive graph canvas;
- basic layouts;
- zoom/pan/fit;
- selection;
- inspector;
- search highlighting;
- source navigation;
- source-selection sync where feasible.

---

### WP 4 — Shared visual resolver for surfaces and `itm-pub`

**Purpose**

Ensure interactive visuals and Markdown publication blocks use the same target resolution.

**Visible value**

Dashboards and interactive views become consistent.

**Scope**

- shared resolver;
- shared Visual ITM generation;
- `itm-pub` integration;
- no user-facing requirement to author Visual ITM manually.

---

### WP 5 — jsMind vertical slice

**Purpose**

Restore real mindmap behavior.

**Visible value**

Mindmap output becomes an actual runtime experience again.

**Scope**

- Visual ITM tree/mindmap profile use;
- jsMind renderer package;
- fold/unfold;
- zoom/pan/fit/center;
- initial expansion modes;
- source navigation;
- cross-link overlays if feasible in slice scope.

---

### WP 6 — Sigma/Graphology vertical slice

**Purpose**

Restore advanced/dense graph runtime.

**Visible value**

Large/dense graph consumption becomes viable again.

**Scope**

- Sigma/Graphology renderer package;
- ForceAtlas2/Noverlap/circular/random layouts as appropriate;
- metrics-driven sizing;
- filter-to-matches;
- focus-neighbors;
- performance/readability modes;
- source trace/search/selection parity where feasible.

---

### WP 7 — Translator package track

**Purpose**

Allow non-ITM formats to translate to/from Visual ITM.

**Visible value**

Visual ITM becomes a general-purpose conversion layer, not only an ITM renderer input.

**Dependency**

Only depends on the Visual ITM profile draft.

**Candidate scope**

- DOT → Visual ITM;
- Visual ITM → DOT;
- Visual ITM → Mermaid;
- later BPMN-related translators;
- user-facing loss notes.

**Important**

This track is independent from visual editing and can be implemented whenever useful after Visual ITM v1 exists.

---

## Unresolved questions

1. Exact Visual ITM v1 package name.
   - Candidate: `@textforge/visual-itm`.

2. Exact names of renderer packages.
   - Candidate examples:
     - `@textforge/renderer-cytoscape`
     - `@textforge/renderer-jsmind`
     - `@textforge/renderer-sigma`

3. Exact location of visual target picker implementation in the workbench architecture.

4. Whether Cytoscape should precede the target picker or vice versa in implementation if a very small UI MVP is not possible.

5. Minimum source-selection sync behavior required in each renderer slice.

6. How much of view deltas should be consumed in read-only parity before visual editing exists.

7. Exact syntax/metadata conventions for renderer hints in Visual ITM, given that native ITM viewpoint pipelines already use `render:`.

8. Whether Graphviz/Mermaid static renderers should be treated as publication renderers inside the same renderer registry or as diagram/export utilities.

---

## Risks and mitigations

### Risk 1 — Repeating the static-output parity mistake

**Risk**

Static HTML/SVG output may again be treated as equivalent to runtime viewers.

**Mitigation**

Roadmap validation must explicitly distinguish publication rendering from interactive runtime rendering.

---

### Risk 2 — Visual ITM becomes too broad too early

**Risk**

The Visual ITM profile could become a dumping ground for every renderer/exporter need.

**Mitigation**

Keep v1 minimal. Document extension discipline in the roadmap. Prefer optional and namespaced extensions.

---

### Risk 3 — Too much invisible foundation work

**Risk**

Implementation could front-load profile/resolver abstractions before users see value.

**Mitigation**

Use vertical slices. Draft Visual ITM early, but evolve it through visible renderer recovery.

---

### Risk 4 — Renderer packages become ITM semantic processors

**Risk**

Renderer packages might start parsing arbitrary ITM and duplicating ITM semantics.

**Mitigation**

Renderers consume validated in-memory Visual ITM. ITM extraction remains upstream.

---

### Risk 5 — Viewpoint/view semantics are bypassed

**Risk**

Generic graph renderers could be applied to the whole ITM model by default, ignoring declared views/viewpoints.

**Mitigation**

Use the visual target picker and default declared renderer flow.

---

### Risk 6 — UI context menu pollution

**Risk**

Multiple views, viewpoints, and renderers could make context menus unusable.

**Mitigation**

Keep context menu minimal. Use “Open visuals…” to launch a picker.

---

### Risk 7 — Lossy translators create false expectations

**Risk**

Users may assume DOT/BPMN/Mermaid exports are lossless.

**Mitigation**

Provide user-facing translator loss notes.

---

### Risk 8 — Multi-open becomes dashboard design

**Risk**

Opening multiple visuals might drift into building dashboard layout functionality.

**Mitigation**

Multi-open creates multiple independent surfaces. Dashboards remain `itm-pub`.

---

## Validation checks / Definition of Done

### Visual ITM profile draft

- A Visual ITM profile document exists.
- It covers nodes, edges, hierarchy, labels, styles, provenance, renderer hints, and diagnostics.
- It documents extension discipline.
- It does not include unnecessary editing/export complexity.

### Visual target picker MVP

- Plain open on `.itm` opens the CodeMirror editor.
- “Open visuals…” opens a picker.
- Picker lists declared views.
- Picker lists declared viewpoints.
- Picker offers raw model options.
- Picker supports multi-selection.
- Multi-selection opens multiple independent surfaces.
- Context menu is not polluted with every view/renderer combination.

### View/viewpoint resolution

- `%view` resolves to its referenced `%viewpoint`.
- Viewpoint pipeline steps are interpreted, including select/includeEdges/transform/layout/render where applicable.
- Existing ITM `render:` pipeline step is used as renderer reference.
- Missing declared renderer produces a clear error/diagnostic.
- No automatic renderer substitution occurs.

### Visual ITM extraction

- Selected view/viewpoint produces a filtered model.
- Filtered model produces Visual ITM.
- Visual ITM preserves source trace to original elements.
- Extracted resources are read-only by default.

### Cytoscape runtime parity

- Cytoscape is a real runtime surface, not static HTML/SVG.
- It supports graph layout, zoom/pan/fit, selection, search highlighting, inspector, and source navigation.
- It consumes Visual ITM, not arbitrary ITM text.

### `itm-pub` integration

- `itm-pub` uses the shared resolver and Visual ITM generation.
- Markdown authors are not required to write Visual ITM directly.
- Interactive surfaces and publication blocks resolve the same view/viewpoint consistently.

### jsMind runtime parity

- jsMind is a real runtime surface.
- It supports fold/unfold, zoom/pan/fit/center, initial expansion behavior, search/source navigation where feasible.
- It consumes Visual ITM tree/mindmap data.

### Sigma/Graphology runtime parity

- Sigma is a real runtime surface.
- It supports dense graph layouts and controls where feasible.
- It consumes Visual ITM graph data.

### Translator package track

- Translator packages depend only on Visual ITM profile.
- Translator documentation includes user-facing loss notes.
- Translators are not coupled to visual editing.

---

## Follow-up changes to apply later

1. Add this grilling document to the roadmap documentation area as:
   - `itm-visuals-grilling.md`

2. Update the visual renderer equivalence assessment to reflect:
   - ITM files are not monolithic graph sources;
   - views and viewpoints are first-class visual targets;
   - static publication output is not runtime renderer parity;
   - Visual ITM is the proposed constrained intermediate layer.

3. Introduce new roadmap workpackages or split existing work around:
   - Visual ITM profile draft;
   - visual target picker MVP;
   - Cytoscape vertical slice;
   - shared visual resolver for surfaces and `itm-pub`;
   - jsMind vertical slice;
   - Sigma/Graphology vertical slice;
   - translator package track.

4. Update roadmap dependency maps so translator work depends only on Visual ITM profile draft.

5. Update workpackage validation checks to distinguish:
   - static publication;
   - interactive runtime rendering;
   - source trace;
   - search/selection sync;
   - declared view/viewpoint renderer resolution.

6. Add roadmap guidance that Visual ITM should remain minimal and extended only when implementation proves the need.

7. Add UI roadmap guidance:
   - plain open = CodeMirror;
   - open visuals = target picker;
   - target picker supports multi-open;
   - multi-open creates separate surfaces;
   - dashboards remain `itm-pub`.

8. Add renderer package guidance:
   - Cytoscape, jsMind, Sigma/Graphology should be separate packages;
   - renderers consume validated Visual ITM;
   - renderers do not parse arbitrary ITM text.

9. Add translator guidance:
   - translator loss profiles are user-facing documentation;
   - translator/export functionality is separate from visual editing;
   - DOT/BPMN/Mermaid translation can be implemented independently after Visual ITM v1.

---

## Final grilling outcome

The recovery should not be framed as “add graph and mindmap renderers to ITM.” It should be framed as:

```text
ITM source / other source
  → visual target resolution
  → filtered model
  → constrained Visual ITM profile
  → interactive or publication renderer
```

The first implementation goal is read-only interactive visual consumption parity, not visual editing. The roadmap should recover visible value through vertical slices while introducing Visual ITM early as a minimal shared contract. Static renderers and publication outputs remain valuable, especially for `itm-pub`, but they must not be mistaken for parity with old Cytoscape, jsMind, or Sigma runtime surfaces.
