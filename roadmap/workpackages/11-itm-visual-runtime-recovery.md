# 11 — ITM Visual Runtime Recovery and Minimal BPMN Visual Chain

This cluster contains the V19a follow-on work needed to recover old interactive visual functionality without reopening the validated `WP-ITM-VISUALS` static projection baseline, then proceed to the shortest viable BPMN visual consumption chain.

## Core decision

`WP-ITM-VISUALS` is frozen as validated static projection/publication work. It provides tree/graph/mindmap/catalogue/matrix/report projection data, Graphviz/Mermaid source adapters, package-owned `.itm` projection surfaces, and `itm-pub` publication output.

It does **not** satisfy runtime renderer parity for Cytoscape, jsMind, Sigma/Graphology, or BPMN.io.

## Workpackages

| WP | Title | Depends on | Notes |
|---|---|---|---|
| WP-VITM-01 | Visual ITM profile v1 | WP-ITM-01, WP-ITM-02 | Minimal constrained ITM profile for visual graph/tree/mindmap interchange, owned by the dedicated `@textforge/visual-itm` package. |
| WP-ITM-VTARGET-01 | ITM visual target picker MVP | WP-ITM-VISUALS, WP-VITM-01, WP-05C | Plain open goes to CodeMirror; Open visuals opens view/viewpoint/raw model picker. |
| WP-ITM-VRESOLVE-01 | Shared ITM visual target resolver | WP-VITM-01, WP-ITM-02, WP-ITM-VISUALS, WP-REPO-01 | Resolver contract is now grilled. Resolves `%view`, `%viewpoint`, raw model fallback, filtered model, `render:` step, Visual ITM, provenance, and diagnostics. |
| WP-RENDER-CYTOSCAPE | Cytoscape runtime renderer package | WP-VITM-01, WP-ITM-VRESOLVE-01 | First old-runtime graph parity slice. |
| WP-ITM-PUB-VISUAL-01 | Shared visual pipeline for `itm-pub` | WP-ITM-VRESOLVE-01, WP-MD-REPORT if needed | Deferred from the minimal BPMN visual chain. Keeps Markdown dashboards and runtime surfaces aligned internally. |
| WP-RENDER-JSMIND | jsMind runtime renderer package | WP-VITM-01, WP-ITM-VRESOLVE-01 | Runtime mindmap parity slice. |
| WP-RENDER-SIGMA | Sigma/Graphology runtime renderer package | WP-VITM-01, WP-ITM-VRESOLVE-01 | Dense graph runtime parity slice. |
| WP-VITM-TRANSLATORS | Visual ITM translator utilities | WP-VITM-01 | DOT/Mermaid/BPMN translator track; can start any time after Visual ITM v1. |
| WP-VITM-VDELTA-01 | Visual ITM view-delta consumption and capture | WP-ITM-VRESOLVE-01, runtime renderer, WP-GRAPH-EDIT-VITM recommended | Later slice that honors declared `%view`/`%viewpoint` delta behavior and defines how renderer-visible deviations normalize back to view-delta structures. |
| WP-VITM-LIVE-SYNC-01 | Bidirectional source/visual live sync | WP-ITM-VRESOLVE-01, runtime renderer; WP-VITM-VDELTA-01 recommended | Later slice for live source-to-visual and visual-to-source selection mirroring beyond the first provenance-plus-navigation parity floor. |
| WP-GRAPH-EDIT-VITM | Visual ITM edit/write-back foundation | WP-VITM-01, runtime renderer, WP-RES-03 recommended | Later visual editing/write-back foundation; not needed for visual consumption parity. |

## Recommended sequence

```text
WP-VITM-01
  -> WP-ITM-VTARGET-01
  -> WP-ITM-VRESOLVE-01
  -> WP-RENDER-CYTOSCAPE
  -> WP-RENDER-JSMIND
  -> WP-RENDER-SIGMA
```

Standalone track:

```text
WP-VITM-01 -> WP-VITM-TRANSLATORS
```

Later follow-on track:

```text
WP-ITM-VRESOLVE-01 + runtime renderer
  -> WP-VITM-VDELTA-01
  -> WP-VITM-LIVE-SYNC-01
```

Later editing track:

```text
WP-VITM-01 + runtime renderer + WP-RES-03 recommended -> WP-GRAPH-EDIT-VITM
```


## Minimal BPMN visual consumption chain

After ITM visual recovery, proceed with:

```text
WP-BPMN-SEM
  -> WP-BPMN-VISUAL-A
  -> WP-BPMN-DI-01
  -> WP-BPMN-VISUAL-B
```

Together with the preceding recovery chain, the selected V19a main path is:

```text
WP-VITM-01
  -> WP-ITM-VTARGET-01
  -> WP-ITM-VRESOLVE-01
  -> WP-RENDER-CYTOSCAPE
  -> WP-RENDER-JSMIND
  -> WP-RENDER-SIGMA
  -> WP-BPMN-SEM
  -> WP-BPMN-VISUAL-A
  -> WP-BPMN-DI-01
  -> WP-BPMN-VISUAL-B
```

`WP-BPMN-VISUAL-C` is later and covers BPMN modeler/edit/write-back. It must not block read-only BPMN visual consumption.

## Definition and grilling gates

| WP | Gate | Required before implementation |
|---|---|---|
| WP-VITM-01 | Definition drafted | Use `specs/architecture/visual-itm-v1-profile.md` as the Visual ITM v1 contract, examples, and acceptance baseline. |
| WP-ITM-VRESOLVE-01 | Grilled | Use `grilling/v19a-visual-recovery-to-bpmn-chain-findings.md` as the resolver contract for views, viewpoints, raw model fallback, `render:` precedence, renderer diagnostics, and no silent fallback. |
| WP-BPMN-SEM | Grilled | Use `grilling/bpmn-sem-grilling.md` as the narrowed BPMN semantic MVP contract, deferred-scope routing record, and bundled BPMN reference-asset map. |
| WP-BPMN-DI-01 | New explicit follow-on | BPMN Diagram Interchange read-only fidelity is a separate gate between BPMN XML viewing and ITM/BPMN target integration. |
| WP-BPMN-VISUAL-A/B/C | Split already decided | Keep BPMN.io viewer, ITM visual target integration, and modeler/write-back separate. |

Not on this minimal chain: `WP-ITM-PUB-VISUAL-01`, `WP-MD-REPORT`, `WP-TABLES`, `WP-VITM-TRANSLATORS`, `WP-VITM-VDELTA-01`, `WP-VITM-LIVE-SYNC-01`, `WP-GRAPH-EDIT-VITM`, `WP-RES-03`, backend, identity, policy, and persistence work.

## Visual ITM v1 scope

Visual ITM v1 should include only:

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
- diagnostics conventions.

It should not include full visual editing operations, advanced Sigma metrics, BPMN-specific semantics, or complete export-loss automation.

It also should not pull declared view-delta consumption or live bidirectional source-to-visual selection mirroring into the first recovery slice. Those belong to later dedicated workpackages: `WP-VITM-VDELTA-01` and `WP-VITM-LIVE-SYNC-01`.

## Extension discipline

Visual ITM should remain minimal as long as possible.

Extensions should be:

- proven by implemented renderer or translator need;
- generic when possible;
- namespaced when renderer-specific;
- optional;
- documented with examples.

This is roadmap/documentation guidance, not an early hard-coded schema bureaucracy.

## UI behavior

- Plain `.itm` open opens CodeMirror.
- `Open visuals…` opens a visual target picker.
- Picker lists declared `%view` entries.
- Picker lists declared `%viewpoint` entries.
- Picker lists raw model fallback options.
- Picker supports selecting multiple targets.
- Multi-open creates multiple independent surfaces.
- Dashboards belong to Markdown `itm-pub`, not to the picker.
- Missing declared renderer produces a diagnostic/error; no silent fallback.

## Runtime renderer rule

Cytoscape, jsMind, and Sigma/Graphology are separate renderer packages. They consume validated in-memory Visual ITM objects. They do not parse arbitrary ITM text and do not own ITM semantics.

## Publication rule

`itm-pub` should internally use the same target resolver and Visual ITM generation pipeline as runtime surfaces. Users should still author Markdown blocks against normal ITM sources, views, or viewpoints.

Renderers remain peers in one shared registry/contribution model. A renderer may be usable in interactive surfaces, `itm-pub` dashboards, exports, or any combination of those depending on its declared capabilities.

## Translator rule

Visual ITM translators are independent from visual editing.

A user may load DOT, translate to Visual ITM, and export to Mermaid or BPMN without invoking a visual editor. Translator loss profiles should be user-facing text, not a heavy automated compatibility engine at first.

## BPMN rule

When BPMN visual work is implemented, use BPMN.io / `bpmn-js` as the BPMN viewer/runtime basis. BPMN visual work should not depend on `WP-ITM-VISUALS` alone for visual parity; it should depend on the V19a visual target/Visual ITM/runtime renderer chain where applicable. The former monolithic `WP-BPMN-VISUAL` is split into `WP-BPMN-VISUAL-A` for read-only BPMN.io viewing, `WP-BPMN-DI-01` for read-only Diagram Interchange fidelity, `WP-BPMN-VISUAL-B` for ITM/BPMN visual-target integration, and later `WP-BPMN-VISUAL-C` for modeler/edit/write-back.

## Validation checks

A V19 visual workpackage is not complete unless its relevant checks are satisfied:

| Check | Meaning |
|---|---|
| Static publication exists | Graphviz/Mermaid/HTML output exists. Useful, but not renderer parity. |
| Runtime renderer exists | Cytoscape/jsMind/Sigma/BPMN.io mounts as actual interactive surface when in scope. |
| View/viewpoint resolved | Declared ITM visual target is used, not ignored. |
| `render:` respected | Existing ITM pipeline render step determines the default renderer for derived Visual ITM; standalone Visual ITM uses its own renderer metadata as local truth. |
| No silent fallback | Missing declared renderer produces diagnostic/error. |
| Source trace preserved | Visual elements map back to source ITM elements/ranges. |
| Search/selection sync works | Minimum first-slice parity requires stable provenance and visual-to-source navigation; live bidirectional mirroring is later work. |
| Multi-open works | Multiple selected targets open as separate surfaces. |
| `itm-pub` consistency | Dashboard/publication blocks use same resolver internally. |

## Binding records

- `grilling/itm-visuals-grilling.md`
- `grilling/v19a-visual-recovery-to-bpmn-chain-findings.md`
- `specs/architecture/visual-itm-runtime-recovery.md`
- `specs/architecture/visual-itm-v1-profile.md`
- `specs/architecture/itm-visual-renderer-equivalence-assessment.md`
