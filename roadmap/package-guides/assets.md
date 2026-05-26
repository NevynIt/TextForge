# @textforge/assets — Package Implementation Guide

## Purpose

Read-only image/SVG/PDF/generic binary resource surfaces, blob URL lifecycle, asset picker, provenance display, and export helpers.

## Ownership rule

`@textforge/assets` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/ui`

Third-party candidates: PDF.js, browser image/SVG APIs. All third-party dependencies must pass the open-source license gate.

## Public surface

Asset viewer surfaces, blob URL service, asset picker, generated asset metadata/provenance views.

## Milestone plan

### Phase 1 — Workspace and Stage 1 surface skeleton

Implementation anchors:

- Architecture paragraphs: `ARCH-4.1-P01..P02`, `ARCH-4.2-P01..P03`, `ARCH-4.3-P01..P07`, `ARCH-5.2-P01..P06`, `ARCH-5.3-P01..P05`, `ARCH-5.6-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.2-P01..P04`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.15-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.6-P01..P06`, `ARCH-7.7-P01..P04`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 1: `pnpm --filter @textforge/assets add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* pdfjs-dist`


Create. Image/SVG/PDF/generic binary read-only surfaces; blob URL lifecycle; workspace asset binding.

### Phase 3 — ZIP workspace import/export

Implementation anchors:

- Architecture paragraphs: `ARCH-5.9-P01..P05`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.22-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3: No new package install.


Update. Ensure binary files round-trip through workspace ZIP.

### Phase 3.1 — React workbench shell and UI recovery

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.1: `pnpm --filter @textforge/assets add react react-dom`; `pnpm --filter @textforge/assets add -D @types/react @types/react-dom`


Update only as needed to ensure existing image/SVG/PDF/generic binary viewer surfaces mount through the React shell without changing asset semantics.

### Phase 3.2 — Dexie workspace persistence recovery

Implementation anchors:

- Architecture paragraphs: `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3.2: No new package install.


Update. Ensure binary resources persist and rehydrate correctly through the workspace Dexie backend, and that blob URL lifecycle remains package-owned after hydration.

### Phase 3.3 — Command palette and contribution-driven shell commands

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: Phase 3.3: No new package install.


Update only to expose existing asset viewer actions as command descriptors where they already exist. Do not add generated asset workflows early.

### Phase 3.4 — Resource identity badges and workbench readability pass

Implementation anchors:

- Architecture paragraphs: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`.
- pnpm packages: Phase 3.4: No new package install.

Validate/update lightly. Ensure image, SVG, PDF, and binary viewer surfaces fit the cleaned workbench layout, present resource identity/state consistently through the common chrome, and avoid introducing editable-source affordances for read-only binary resources. Do not change binary resource semantics in this phase.

### Phase 3.5 — Popup usability, resizable panels, and chrome deduplication pass

Implementation anchors:

- Architecture paragraphs: `ARCH-4-P04..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.6-P01..P05`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.5: No new package install.

Validate/update lightly. Ensure SVG/image/PDF/binary viewer surfaces remain readable when side panels are resized or collapsed and when a viewer is hosted as a popup overlay. Do not change binary resource semantics.


### Phase 3.6 — Unified workspace resources and representation-based surface routing

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P01..P06`, `ARCH-5.9-P01..P05`, `ARCH-5.11-P01..P09`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.22-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3.6: No new package install.


Update. Stop requiring asset viewers to receive only `kind: binary` resources. Image, SVG, PDF, and generic byte viewers should declare compatibility based on MIME type plus supported content representation.

SVG is the mandatory dual-surface case: SVG is text under the hood and should normally be stored as text with `mimeType: image/svg+xml` and `languageId: svg`, while still being viewable through the SVG visual viewer. The viewer may create a local blob/source binding from text when needed. PNG/JPEG/WebP/GIF/AVIF/PDF remain byte-stored assets and must not be decoded into text by upload/import flows.

### Phase 3.7 — Context menus as thin command projections

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.7: No new package install.


Update only as needed to expose existing asset actions through context menus when valid for the target resource or session. Reuse download/open-with behavior and avoid context-menu-only action implementations.

### Phase 4 — Markdown, local assets, and generated diagram assets

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.8-P01..P06`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 4: No new package install.


Update. Add generated asset provenance, stale-state display, SVG/PNG export actions.

### Phase 4.1 — Foundation stabilization before contribution registries

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`, `ARCH-13.8-P01..P03`.
- Grilling record: `roadmap/grilling/phase-4.1-grilling.md`.
- pnpm packages: Phase 4.1: No new package install.


Update. Audit image, SVG, PDF, generic asset viewers, generated asset provenance actions, and export actions as default contribution candidates. Validate that SVG resources remain eligible for both source editing and visual viewing when their resource facts support both. Use the shared diagnostic shape for unsupported or stale asset states.

### Phase 17 — Sketch and annotation resources

Implementation anchors:

- Architecture paragraphs: `ARCH-5.4-P01..P03`, `ARCH-5.11-P01..P09`, `ARCH-6.5-P01..P07`, `ARCH-6.22-P01..P04`, `ARCH-13.8-P01..P03`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 17: `pnpm --filter @textforge/assets add @excalidraw/excalidraw`


Update. Add Excalidraw sketch/annotation resource surface if still desired; store sketch JSON plus SVG/PNG exports as workspace resources.

### Phase 18 — Late PDF generation and PDF annotation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.11-P05..P09`, `ARCH-6.18-P26..P29`, `ARCH-6.22-P01..P04`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 18: No new package install if implemented over existing `pdfjs-dist`; add annotation helper packages only after a RAPID decision.


Update. Optional PDF annotation layer over PDF.js; store annotations as separate workspace resources/deltas.

## Tests and definition of done

Image/SVG/PDF viewing tests, blob URL lifecycle tests, React-shell mounting smoke tests after Phase 3.1, persisted byte-resource rehydration tests after Phase 3.2, command descriptor tests after Phase 3.3 where applicable, SVG-as-text visual preview tests after Phase 3.6, context-target asset command checks after Phase 3.7, and generated asset provenance tests, and Phase 4.1 default-contribution/SVG-dual-eligibility audit checks.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 1 closure note

The package now exposes concrete image, SVG, PDF, and generic binary viewer surface factories, plus typed surface model and mount contracts. The web shell exercises the SVG viewer through the surface registry with blob URL binding, and CDP validation verifies the mounted viewer path.

## Phase 3 closure note

Binary workspace assets now round-trip through the workspace ZIP helpers with byte preservation and correct restored viewer-kind selection/binding. Focused `lint` and `test` checks pass for the package, and the coverage is included in `corepack pnpm verify`.

## Phase 3.1 closure note

The React shell mounts the existing package-owned asset viewers without changing asset semantics. Popup asset sessions stay out of the main document strip and render through the utility pane, while the asset package still owns blob URL binding, viewer-kind selection, and read-only surface behaviour.

Browser validation of the React shell opened the sample `system.svg` asset into the popup utility pane and confirmed that the mounted asset viewer still renders through the existing surface contribution path.

## Phase 3.2 closure note

Binary resources now survive Dexie-backed workspace hydration as well as ZIP round-trip export/import. The asset package still owns blob URL leasing and viewer-kind selection after the workspace reloads, and focused tests now verify that a persisted SVG resource rehydrates with byte fidelity and still resolves to the SVG viewer binding.

## Phase 3.3 closure note

The package now exposes the existing asset download path as a shell command descriptor while leaving viewer-kind selection and open-with routing inside the package-owned surface model. Phase 3.3 does not add generated-asset workflows or broaden asset semantics beyond the already-delivered viewer surface behavior.

## Phase 3.5 closure note

Popup-ready asset viewers now render through the bounded overlay host instead of the utility pane, while the asset package keeps ownership of read-only viewer semantics, blob URL binding, and download actions. The shared shell chrome also uses a generic asset header label so popup asset titles do not inflate the visible duplicate-name count in the surrounding workbench.

## Phase 4 closure note

The package now surfaces generated-asset provenance and stale-state cues through the read-only asset model and exposes explicit SVG/PNG export commands for selected generated diagram resources. The generated-asset metadata remains compatibility-focused and works with the unified resource model delivered in Phase 3.6 instead of restoring the old text/binary split.

## Phase 4.1 closure note

The package now exposes its viewers and asset commands as default-active contributions with stable capability IDs, while the package checks also validate public-entrypoint consumption instead of cross-package `src/` imports. SVG remains the key dual-eligibility case: the same text-stored resource can still route to source editing and to the registered SVG viewer without reviving a hard storage-based split.

## WP-05C progress note

The asset viewer contributions now also own their package runtime opening path. The shell no longer maps asset contribution IDs to local viewer factories; instead it calls the registered asset contribution runtime, which preserves blob binding, provenance sections, and stale-state display through canonical contribution execution.


## V16 backend-optional responsibilities

`@textforge/assets` must display provenance and persistence state for generated and service-produced artifacts. Derived resources should remain ephemeral unless explicitly selected or produced by an approved workflow as controlled-generated resources.
