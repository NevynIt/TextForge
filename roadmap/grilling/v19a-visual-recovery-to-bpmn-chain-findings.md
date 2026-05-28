# V19a Visual Recovery to BPMN Chain — Findings

## Latest status

Round 2 is complete for `WP-VITM-01` and `WP-ITM-VRESOLVE-01`.

The Visual ITM v1 profile boundary and the shared visual target resolver contract are now specific enough for implementation. The remaining unresolved gate in this chain is still `WP-BPMN-SEM`.

## Index of grilling topics

1. Visual ITM package boundary
2. Runtime renderer package naming
3. Visual target picker package owner
4. Minimum selection-sync contract
5. View-delta behavior in read-only parity
6. Renderer precedence for derived and standalone Visual ITM
7. Shared renderer registry and renderer capabilities
8. Resolver contract implications
9. Remaining follow-up work

## Finding summary

The roadmap should proceed with ITM visual runtime recovery first, then a minimal BPMN visual chain. The previous `WP-BPMN-VISUAL` workpackage was too broad and has been split.

## Main chain

```text
WP-VITM-01
  -> WP-ITM-VTARGET-01
  -> WP-ITM-VRESOLVE-01
  -> WP-RENDER-CYTOSCAPE
  -> WP-RENDER-JSMIND
  -> WP-RENDER-SIGMA
  -> WP-BPMN-SEM
  -> WP-BPMN-VISUAL-A
  -> WP-BPMN-VISUAL-B
```

## Workpackages needing grilling or further definition

| WP | Required action | Reason |
|---|---|---|
| WP-VITM-01 | Resolved in Round 2 | Visual ITM v1 profile/spec, examples, and fixture expectations are now defined. |
| WP-ITM-VRESOLVE-01 | Resolved in Round 2 | Resolver contract is now grilled for view/viewpoint/raw model resolution, renderer selection, diagnostics, and no-silent-fallback behavior. |
| WP-BPMN-SEM | Grill / further define before implementation | Needs a constrained BPMN MVP subset before visual work depends on it. |
| WP-BPMN-VISUAL-A/B/C | Split retained | Viewer, ITM target integration, and modeler/write-back must stay separate. |

## BPMN split

| New WP | Meaning |
|---|---|
| WP-BPMN-VISUAL-A | Read-only BPMN.io / `bpmn-js` viewer surface. |
| WP-BPMN-VISUAL-B | ITM/BPMN visual-target integration. |
| WP-BPMN-VISUAL-C | Later BPMN modeler/edit/write-back. |

## Deferred from minimal BPMN visual consumption

`WP-ITM-PUB-VISUAL-01`, `WP-MD-REPORT`, `WP-TABLES`, `WP-VITM-TRANSLATORS`, `WP-GRAPH-EDIT-VITM`, `WP-RES-03`, backend, identity, policy, persistence, AI, and external adapters are not blockers for the minimal BPMN visual consumption chain.

## Round 2 — Profile and resolver closure

### Topic 1 — Visual ITM package boundary

**Question asked**

Should Visual ITM v1 live in a dedicated package named `@textforge/visual-itm`, with renderer packages consuming it and `@textforge/itm` staying source/semantic-only?

**Why it matters**

This decides the ownership boundary for `WP-VITM-01` and prevents renderer runtime concerns or ITM semantics from leaking into the wrong package.

**Recommended answer**

Yes. Create a dedicated `@textforge/visual-itm` package for the profile/types/validation/examples. Keep `@textforge/itm` responsible for parsing, resolving, and semantics.

**User decision**

Accepted.

**Roadmap/spec/package implications**

- `WP-VITM-01` is now grounded in a dedicated package boundary.
- `@textforge/itm` remains authoritative for source semantics and extraction.
- Renderer packages consume validated Visual ITM objects rather than arbitrary ITM source text.

### Topic 2 — Runtime renderer package naming

**Question asked**

Should the runtime renderer packages be named `@textforge/renderer-cytoscape`, `@textforge/renderer-jsmind`, and `@textforge/renderer-sigma`?

**Why it matters**

The resolver contract and roadmap should not leave the first renderer package identities ambiguous.

**Recommended answer**

Yes. Use a consistent `@textforge/renderer-*` convention for runtime renderer packages.

**User decision**

Accepted.

**Roadmap/spec/package implications**

- The first runtime renderer package names are fixed for roadmap/spec use.
- Renderer hints and examples can now use stable canonical package identifiers.

### Topic 3 — Visual target picker package owner

**Question asked**

Should `WP-ITM-VTARGET-01` be owned by `@textforge/surfaces`, rendered with `@textforge/ui` primitives, with plain open staying in editors and renderer packages staying out of target picking?

**Why it matters**

This determines whether the visual-opening flow is a shared surface/open-with concern or something fragmented across editors or individual renderers.

**Recommended answer**

Yes. `@textforge/surfaces` should own the `Open visuals...` flow, while `@textforge/ui` supplies presentation primitives.

**User decision**

Accepted.

**Roadmap/spec/package implications**

- `WP-ITM-VTARGET-01` is now a surfaces-owned slice.
- `@textforge/editors` keeps plain source-open behavior.
- Renderer packages remain focused on already-resolved targets.

### Topic 4 — Minimum selection-sync contract

**Question asked**

Should renderer MVPs require visual-to-source navigation with stable provenance IDs, while live source-to-visual mirroring stays optional for later?

**Why it matters**

This sets the minimum read-only parity bar for Cytoscape, jsMind, Sigma, and later BPMN integration.

**Recommended answer**

Yes. Require stable provenance and visual-to-source navigation now; do not require live bidirectional mirroring in the first slice.

**User decision**

Accepted with refinement: deferring live source-to-visual mirroring is correct, but it must become an explicit later workpackage rather than an indefinite maybe.

**Roadmap/spec/package implications**

- First-slice parity requires stable provenance and visual-to-source navigation.
- Live bidirectional source/visual mirroring must be tracked as later follow-on work rather than being hidden inside the MVP.

### Topic 5 — View-delta behavior in read-only parity

**Question asked**

Should read-only parity consume existing declared view/viewpoint deltas and layout/filter state, but exclude creating or persisting new deltas until a later edit/write-back workpackage?

**Why it matters**

This separates honoring existing source declarations from pulling write-back or editing behavior too early into the first resolver slice.

**Recommended answer**

Consume declared deltas now, but defer creating or persisting new ones.

**User decision**

Rejected in favor of a stricter deferral: honoring those deltas should move to a new later workpackage.

**Roadmap/spec/package implications**

- `WP-VITM-01` and `WP-ITM-VRESOLVE-01` stay narrower.
- Declared view-delta consumption is not part of the first read-only parity slice.
- A later dedicated workpackage should define delta consumption/capture behavior explicitly.

### Topic 6 — Renderer precedence for derived and standalone Visual ITM

**Question asked**

Should Visual ITM carry only derived renderer metadata from the source target's existing `render:` step, instead of introducing a second authoritative renderer declaration?

**Why it matters**

This determines how `render:` precedence works and whether Visual ITM risks creating a second conflicting source of truth.

**Recommended answer**

Keep native ITM `render:` authoritative for derived Visual ITM and keep Visual ITM renderer metadata derived and non-competing.

**User decision**

Accepted with refinement: Visual ITM is derived from basic ITM and uses the same renderer syntax. Nothing extra is authoritative for derived Visual ITM, but once Visual ITM exists on its own or is manually authored, there is no other authoritative source, so its own renderer metadata becomes local truth.

**Roadmap/spec/package implications**

- Derived Visual ITM follows the source target's `render:` syntax and precedence.
- Standalone/manual Visual ITM uses the same syntax family, but its own document metadata becomes authoritative for that resource.
- The spec must document both modes explicitly.

### Topic 7 — Shared renderer registry and renderer capabilities

**Question asked**

Should all renderers share one registry and be usable in both `itm-pub` dashboards and app surfaces, with per-renderer capability flags instead of hard runtime/publication classes?

**Why it matters**

This decides whether Mermaid, Graphviz, Cytoscape, and other renderers are treated as peers that can show up in either context, or as separate renderer families with artificial boundaries.

**Recommended answer**

Yes. Use one shared renderer registry/contribution model and let each renderer declare concrete capabilities.

**User decision**

Accepted, after the explicit clarification that Mermaid and Graphviz must remain peer renderers and may be exploratory too. The key distinction is capability, not a fixed runtime/publication family split.

**Roadmap/spec/package implications**

- Mermaid, Graphviz, Cytoscape, jsMind, Sigma, and later renderers share one registry/contribution model.
- The same renderer may appear in app surfaces, `itm-pub` dashboards, or both.
- Capability flags, not hard renderer families, determine what a renderer can do.

## Consolidated resolver contract implications

The accepted contract for `WP-ITM-VRESOLVE-01` is now:

1. Resolve the source model from workspace/repository context.
2. Resolve explicit `%view` targets through their referenced `%viewpoint`.
3. Resolve explicit `%viewpoint` targets directly.
4. Offer raw model fallback as an explicit deterministic target.
5. Respect the source target's existing `render:` step when the target is derived from ITM.
6. Produce a filtered model before generating Visual ITM.
7. Emit Visual ITM with provenance and diagnostics.
8. Surface a diagnostic when the declared renderer is missing or unavailable; do not silently fall back.
9. Use the same resolver contract for runtime surfaces and `itm-pub`.
10. Require stable provenance plus visual-to-source navigation in the first parity slice.
11. Exclude declared view-delta consumption from the first parity slice; move it to a later dedicated workpackage.

## Risks and mitigations

### Risk 1 — Derived and standalone Visual ITM drift apart

**Risk**

Derived Visual ITM and standalone/manual Visual ITM could accidentally adopt incompatible renderer semantics.

**Mitigation**

Use the same renderer syntax family in both modes and document only one precedence distinction: derived targets follow upstream `render:`; standalone/manual documents use their own local metadata.

### Risk 2 — Capability differences are mistaken for separate renderer families

**Risk**

Static/export/dashboard uses may be misread as proof that runtime parity already exists, or vice versa.

**Mitigation**

Keep one shared renderer registry, but validate concrete capabilities explicitly in each renderer slice rather than letting registry membership imply parity.

### Risk 3 — Later-scope decisions remain implicit

**Risk**

View-delta consumption and bidirectional live sync could quietly slip back into the first recovery slice if they are only described as deferred in prose.

**Mitigation**

Record them as later dedicated workpackage follow-ups in roadmap status and next-step guidance.

## Validation checks / definition of done

`WP-VITM-01` and `WP-ITM-VRESOLVE-01` are sufficiently defined for implementation only if all of the following stay true:

- the `@textforge/visual-itm` package boundary remains explicit;
- renderer package names stay stable;
- `@textforge/surfaces` owns the `Open visuals...` target-picking flow;
- raw model fallback is explicit and deterministic;
- `render:` precedence is documented for derived Visual ITM;
- standalone/manual Visual ITM precedence is documented for self-contained documents;
- missing renderer means diagnostic/error, not fallback;
- the same resolver contract is used by surfaces and `itm-pub`;
- first-slice parity requires provenance plus visual-to-source navigation;
- declared view-delta consumption and live bidirectional sync remain out of the first slice.

## Remaining follow-up work

Still unresolved after this grilling round:

- `WP-BPMN-SEM` MVP boundary.

Named later follow-on workpackages are now established:

- `WP-VITM-VDELTA-01` for declared view-delta consumption and deviation capture;
- `WP-VITM-LIVE-SYNC-01` for bidirectional live source/visual sync.
