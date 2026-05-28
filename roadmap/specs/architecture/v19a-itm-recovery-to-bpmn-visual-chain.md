# V19a — ITM Visual Recovery to Minimal BPMN Visual Chain

## Purpose

This note records the V19a roadmap reassessment so the reasoning is not lost in chat history.

The selected delivery strategy is:

1. recover ITM visual runtime consumption first;
2. then move through the shortest well-gated path to BPMN visual consumption;
3. defer BPMN editing/write-back, report/dashboard publication, tables, translators, backend, identity, policy, and persistence until they are actually needed.

## Selected main chain

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

## Rationale

`WP-ITM-VISUALS` is already validated, but it is a static projection/publication baseline. It does not recover old runtime renderer behavior.

The runtime recovery chain must therefore make `%viewpoint` and `%view` first-class visual targets before domain visual work such as BPMN relies on it. A `.itm` file may contain multiple declared visual targets, not just one monolithic model graph.

After that, BPMN visual consumption should be reached with the minimum extra scope:

- first define the BPMN semantic subset;
- then mount a read-only BPMN.io / `bpmn-js` viewer;
- then connect ITM visual target resolution to BPMN visual output.

Editing/write-back is valuable but not required for visual consumption and would pull in `WP-GRAPH-EDIT-VITM`, `WP-RES-03`, patch review, conflict handling, and persistence/write policy concerns too early.

## Split decisions

### Former `WP-BPMN-VISUAL`

The old `WP-BPMN-VISUAL` scope was too broad because it combined viewing, ITM integration, editing, and write-back.

It is replaced by:

| WP | Scope | Minimal chain? |
|---|---|---|
| WP-BPMN-VISUAL-A | Read-only BPMN.io / `bpmn-js` viewer surface for BPMN XML. | Yes |
| WP-BPMN-VISUAL-B | ITM `%view` / `%viewpoint` visual-target integration for BPMN output. | Yes |
| WP-BPMN-VISUAL-C | BPMN modeler/edit/write-back, including patch review and apply/discard. | No, later |

### `WP-BPMN-SEM`

`WP-BPMN-SEM` is not split in V19a, but it must be narrowed before implementation.

Its MVP should include only:

- Events;
- Tasks;
- Gateways;
- Sequence Flows;
- basic attributes;
- basic validation;
- example fixtures;
- a BPMN-oriented ITM package/profile.

Out of scope for the MVP:

- full BPMN completeness;
- advanced gateway semantics;
- import/export loss handling beyond basic fixtures;
- visual editing;
- write-back behavior.

## Definition and grilling gates

| WP | Gate | Required before implementation |
|---|---|---|
| WP-VITM-01 | Definition drafted | Use `specs/architecture/visual-itm-v1-profile.md` as the concrete Visual ITM v1 profile/spec, examples, and acceptance baseline. |
| WP-ITM-VRESOLVE-01 | Grilled | Use `grilling/v19a-visual-recovery-to-bpmn-chain-findings.md` as the resolver contract for `%view`, `%viewpoint`, raw model fallback, `render:` precedence, diagnostics, runtime/publication consistency, and no silent fallback. |
| WP-BPMN-SEM | Grilling / further definition | Minimal BPMN MVP subset, validation rules, fixtures, and explicit exclusions. |
| WP-BPMN-VISUAL-A/B/C | Split already decided | Keep viewer, ITM integration, and modeler/write-back separate. |

## Explicitly not on the minimal chain

The following remain useful but must not block BPMN visual consumption:

- `WP-ITM-PUB-VISUAL-01`;
- `WP-MD-REPORT`;
- `WP-TABLES`;
- `WP-VITM-TRANSLATORS`;
- `WP-GRAPH-EDIT-VITM`;
- `WP-RES-03`;
- backend, identity, policy, persistence, AI, and external adapters.

## Implementation caution

Do not make BPMN semantics leak into Visual ITM. Visual ITM remains a generic runtime visual interchange/profile. BPMN is a domain profile and renderer/integration consumer on top of that foundation.

## Accepted clarification points

- Visual ITM v1 lives in a dedicated `@textforge/visual-itm` package.
- `@textforge/itm` remains authoritative for source ITM semantics and extraction.
- Derived Visual ITM uses the same renderer syntax as the source target's existing `render:` step and treats it as the source of truth.
- Standalone or manually authored Visual ITM uses the same renderer syntax, but its own renderer metadata becomes the local truth because there is no upstream source target.
- Renderers share one registry/contribution model and are differentiated by declared capabilities rather than hard runtime/publication family splits.
- Declared view-delta consumption and live bidirectional source-to-visual sync are deferred to later workpackages rather than pulled into the first read-only recovery slice.
