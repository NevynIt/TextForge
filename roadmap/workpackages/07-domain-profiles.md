# 07 — Domain Profiles

This cluster covers domain-specific profiles and domain-driven views.

## Workpackages

| WP | Title | Split rationale |
|---|---|---|
| WP-BPMN-SEM | BPMN semantic profile and validation | Grilled/narrowed semantic MVP before visual consumption depends on it. |
| WP-BPMN-VISUAL-A | BPMN.io viewer surface | Read-only BPMN XML visual consumption using `bpmn-js`. |
| WP-BPMN-DI-01 | BPMN Diagram Interchange read-only fidelity | Explicit bridge for BPMN DI bounds/routes/label geometry before ITM target integration and before later generic delta normalization. |
| WP-BPMN-VISUAL-B | ITM/BPMN visual target integration | Connect ITM `%view`/`%viewpoint` resolution to BPMN visual output. |
| WP-BPMN-VISUAL-C | BPMN modeler/edit/write-back | Later controlled editing/write-back; not on the minimal consumption path. |
| WP-ARCHIMATE-SEM | ArchiMate semantic profile | Semantic profile before visual editing investigation. |
| WP-ARCHIMATE-VISUAL | ArchiMate visual editing investigation | Optional investigation, not guaranteed product feature. |
| WP-TABLES | Tables, catalogues, and matrices | Catalogue/matrix UX over model content. |
| WP-LUA | Lua automation | Optional pipeline automation; sandboxed/local/capability-gated. |
| WP-LUA-POWER-SESSION | Lua self-escalation session and one-click recovery | Validated Lua follow-on that exposes approved host objects in a session-scoped elevated mode with explicit recovery. |
| WP-ITM-VISUALS | ITM visual projections | Shared visual projection base for mindmaps/graphs/domain views. |

## General rule

Split domain work into:

```text
semantic model/profile -> validation/catalogue/report value -> visual editing/write-back
```

Do not make mature visual editing a prerequisite for useful semantic validation or reporting.


## V19 runtime renderer and BPMN update

V19 adds runtime renderer packages as domain workpackages:

| WP | Title | Notes |
|---|---|---|
| WP-RENDER-CYTOSCAPE | Cytoscape runtime renderer package | First old-runtime graph parity slice; consumes validated Visual ITM graph data. |
| WP-RENDER-JSMIND | jsMind runtime renderer package | Runtime mindmap parity slice; consumes Visual ITM tree/mindmap data. |
| WP-RENDER-SIGMA | Sigma/Graphology runtime renderer package | Dense graph runtime parity slice; consumes Visual ITM graph data. |

`WP-BPMN-VISUAL-A` should use BPMN.io / `bpmn-js` as the BPMN viewer/runtime basis. `WP-BPMN-VISUAL-B` integrates BPMN visual output with ITM visual target resolution. `WP-BPMN-VISUAL-C` is deferred modeler/edit/write-back work.

Domain visual work should not treat static `WP-ITM-VISUALS` output as runtime renderer parity. BPMN and ArchiMate visual work should depend on Visual ITM/visual-target/runtime-renderer foundations where applicable.

## V19a selected domain sequence

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

Implement `WP-BPMN-SEM` against `grilling/bpmn-sem-grilling.md`. `WP-BPMN-DI-01` is the explicit read-only BPMN DI bridge before `WP-BPMN-VISUAL-B`. `WP-VITM-01` and `WP-ITM-VRESOLVE-01` remain governed by their existing grilling/spec records.
