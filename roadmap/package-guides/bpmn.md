# @textforge/bpmn — Package Implementation Guide

## Purpose

BPMN XML support, bpmn-js viewer/modeler surfaces, controlled XML write-back, diagnostics, and later ITM/BPMN mapping.

## Ownership rule

`@textforge/bpmn` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/pipeline`
- `@textforge/editors`
- `@textforge/itm`

Third-party candidates: bpmn-js, bpmn-moddle. All third-party dependencies must pass the open-source license gate.

## Public surface

BPMN XML surfaces, modeler write-back contract, BPMN diagnostics, BPMN import/export extension points.

## Milestone plan

### Phase 3.1–3.3 — Recovery-phase compatibility

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`, `ARCH-6.7-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


No direct BPMN feature work. These phases establish React shell usability, Dexie persistence, and shell-command composition. This package should not be started early, but later work must consume the resulting workspace, surface, and command contracts through public interfaces.

### Phase 10 — BPMN support and first mature visual editor

Implementation anchors:

- Architecture paragraphs: `ARCH-5.13-P01..P05`, `ARCH-5.3-P01..P08`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 10: `pnpm --filter @textforge/bpmn add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/editors@workspace:* @textforge/itm@workspace:* bpmn-js bpmn-moddle`


Create. BPMN XML language integration, bpmn-js viewer/modeler surfaces, controlled edit mode, XML patch preview/apply/discard, diagnostics refresh.

### Phase 11 — Tables, catalogues, and matrices

Implementation anchors:

- Architecture paragraphs: `ARCH-5.4-P01..P03`, `ARCH-6.15-P01..P04`, `ARCH-6.21-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-11.5-P01..P03`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 11: No new package install.


Update. Add BPMN task/event/gateway catalogue surfaces if useful.

## Tests and definition of done

BPMN XML load/render/edit/write-back tests, attribution/license acceptance evidence, diagnostics tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.


## V19 BPMN.io decision

When `WP-BPMN-VISUAL-A/B/C` is implemented, use BPMN.io / `bpmn-js` as the BPMN viewer/runtime basis.

The initial BPMN visual work should distinguish:

- BPMN semantic profile and validation (`WP-BPMN-SEM`);
- BPMN visual consumption through BPMN.io / `bpmn-js` (`WP-BPMN-VISUAL-A/B/C`);
- later controlled visual editing/write-back (`WP-GRAPH-EDIT-VITM`).

Do not require mature visual editing before delivering BPMN visual consumption. Do not treat static `WP-ITM-VISUALS` projections as BPMN runtime parity.


## V19a BPMN visual split

The former monolithic BPMN visual work is split into three workpackages:

| WP | Purpose | Minimal-chain status |
|---|---|---|
| WP-BPMN-VISUAL-A | Read-only BPMN.io / `bpmn-js` viewer surface for BPMN XML. | Required. |
| WP-BPMN-DI-01 | Read-only BPMN Diagram Interchange extraction/fidelity bridge. | Required. |
| WP-BPMN-VISUAL-B | ITM `%view` / `%viewpoint` visual-target integration for BPMN output. | Required. |
| WP-BPMN-VISUAL-C | BPMN modeler/edit/write-back, including patch review and apply/discard. | Deferred. |

`WP-BPMN-SEM` is now defined by `roadmap/grilling/bpmn-sem-grilling.md`. Its MVP includes `Process`, `StartEvent`, `EndEvent`, `Task`, collapsed `SubProcess`, `ExclusiveGateway`, `SequenceFlow`, basic `association`, `DataObjectReference`, `DataStoreReference`, basic attributes, basic validation, focused fixtures, and a BPMN-oriented ITM package/profile. Full BPMN completeness, broader gateway families, lanes, groups, annotations, BPMN Diagram Interchange, mature import/export loss handling, and editing behavior remain out of scope for the MVP.

Bundled BPMN reference assets now live under `docs/examples/bpmn/`:

- `Training By Design.bpmn`
- `training-by-design.lua-pipeline-reference.itm`
- `bpmn-process-diagram-lite-profile.itm`
- `bpmn-xml-to-itm.lua`

Those sources are broader than the accepted MVP and are intentionally routed to future gates such as `WP-BPMN-DI-01`, `WP-BPMN-VISUAL-B`, and `WP-VITM-TRANSLATORS`.

Selected minimal path after ITM visual recovery:

```text
WP-BPMN-SEM -> WP-BPMN-VISUAL-A -> WP-BPMN-DI-01 -> WP-BPMN-VISUAL-B
```
