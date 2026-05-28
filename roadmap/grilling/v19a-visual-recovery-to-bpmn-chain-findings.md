# V19a Visual Recovery to BPMN Chain — Findings

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
| WP-VITM-01 | Further definition | Needs a concrete Visual ITM v1 profile/spec and examples before coding. |
| WP-ITM-VRESOLVE-01 | Grill before implementation | It is the core contract for view/viewpoint/raw model resolution, renderer selection, diagnostics, and no-silent-fallback behavior. |
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
