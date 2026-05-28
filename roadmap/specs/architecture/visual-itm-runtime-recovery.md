# Visual ITM Runtime Recovery Architecture — V19

## Purpose

This document records the V19 architecture direction for recovering old TextForge runtime visual behavior while preserving the new package-based architecture.

It supersedes any interpretation that treats `WP-ITM-VISUALS` as full renderer parity. `WP-ITM-VISUALS` remains a validated static projection/publication baseline.

## Core pipeline

```text
source ITM or other source format
  -> visual target resolution
  -> filtered model
  -> constrained Visual ITM profile
  -> interactive or publication renderer
```

## ITM visual target resolution

A `.itm` file may expose:

- raw model content;
- `%viewpoint` pipelines;
- `%view` instances.

The visual opening flow must therefore resolve a target before rendering.

Default behavior:

```text
Open -> CodeMirror
Open visuals… -> visual target picker -> selected target(s) -> declared renderer
```

Generic renderers are explicit user choices. They are not silent fallback when a declared renderer is missing.

## Visual ITM

Visual ITM is a constrained ITM profile used as the renderer-facing intermediate layer.

Version 1 should remain minimal:

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

Visual ITM should remain small as long as practical. Extensions should be documented, optional, and namespaced when renderer-specific.

## Runtime renderer packages

Runtime renderers should be separate packages:

- `@textforge/renderer-cytoscape`;
- `@textforge/renderer-jsmind`;
- `@textforge/renderer-sigma`.

They consume validated in-memory Visual ITM. They do not parse arbitrary ITM text and do not own ITM view/viewpoint semantics.

## Publication rendering

`itm-pub` should use the same target resolver and Visual ITM generation pipeline as interactive surfaces.

Users should author against ordinary ITM sources, views, and viewpoints. Visual ITM is an internal contract unless a user explicitly chooses to inspect or save an extracted Visual ITM resource.

## BPMN

When BPMN visual work is implemented, use BPMN.io / `bpmn-js` as the BPMN viewer/runtime basis.

BPMN visual consumption should not require mature visual editing/write-back. Editing is a later workpackage.

## Translators

Visual ITM translators are separate from visual editing.

Candidate translators:

- DOT -> Visual ITM;
- Visual ITM -> DOT;
- Visual ITM -> Mermaid;
- later BPMN-related translators.

Loss profiles should be human-facing documentation, not a heavy automated compatibility engine in v1.

## Visual editing

Visual editing and write-back are later work.

Future renderer interactions should normalize to Visual ITM edit operations. Upstream handlers then decide whether changes become:

- `%view` deltas;
- source ITM patches;
- standalone Visual ITM resources;
- lossy exports through translators;
- diagnostics when not safely writable/exportable.

## Validation boundary

Static publication output is not runtime renderer parity.

Runtime parity requires:

- actual interactive surface mount;
- view/viewpoint-aware target resolution;
- source trace;
- search/selection sync where in scope;
- renderer-specific runtime behavior such as zoom, pan, fit, fold, filtering, or graph layout controls.
