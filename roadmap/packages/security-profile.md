# @textforge/security-profile — Package Implementation Guide

## Purpose

Reusable browser-envelope accreditation profile, CSP/manifest/service-worker checks, remote asset checks, forbidden privileged browser API checks, and dependency license policy.

## Ownership rule

`@textforge/security-profile` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`

Third-party candidates: license checker / static artifact scan tools. All third-party dependencies must pass the open-source license gate.

## Public surface

Profile schema, check runners, artifact scanners, CSP/manifest/service-worker checks, dependency policy.

## Milestone plan

### Phase 0 — Repository foundation, package skeleton, security envelope, and dependency policy

Implementation anchors:

- Architecture paragraphs: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.1-P01..P05`, `ARCH-6.17-P01..P04`, `ARCH-6.20-P01..P07`, `ARCH-10-P01..P04`, `ARCH-11.4-P01`.
- pnpm packages: Phase 0: `pnpm --filter @textforge/security-profile add @textforge/core@workspace:*`; optional scan tooling: `pnpm --filter @textforge/security-profile add -D license-checker-rseidelsohn`


Create. Define profile files, open-source license gate, CSP/manifest/service-worker check skeletons, remote asset check, forbidden privileged browser API check.

### Phase 3 — ZIP workspace import/export

Implementation anchors:

- Architecture paragraphs: `ARCH-5.9-P01..P05`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.22-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3: No new package install unless scan implementation needs dev-only parser tooling; record any added tool in RAPID.


Update. Add generic checks for forbidden privileged filesystem APIs and archive boundary documentation. Do not inspect TextForge internal gateway discipline.

### Phase 3.1 — React workbench shell and UI recovery

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.1: No new runtime package install.


Update. Re-run and extend dependency/license and browser-envelope checks for React, React DOM, and any adopted shell layout dependencies. Preserve the no-network, no privileged filesystem API, and source-owned runnable-artifact constraints.

### Phase 3.2 — Dexie workspace persistence recovery

Implementation anchors:

- Architecture paragraphs: `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3.2: No new package install.


Update. Document and check the browser-managed storage boundary. Confirm the implementation does not use File System Access API, directory handles, background sync, remote sync, or silent local file access.

### Phase 3.3 — Command palette and contribution-driven shell commands

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update only if command registration introduces new dependency or browser-envelope implications. The palette is a local command dispatcher, not an external plugin permission system.

### Phase 3.4 — Resource identity badges and workbench readability pass

Implementation anchors:

- Architecture paragraphs: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`.
- pnpm packages: Phase 3.4: No new package install.

Update. Extend security-profile guidance/checks only as needed to keep the badge and readability pass local and deterministic: allow bundled `lucide-react` only for generic shell icons, but reject remote badge images, remote icon fetches, File System Access API identity, directory handles, background sync, remote sync, and silent local-file probing. Badges are UI/resource metadata, not proof of external file identity.


### Phase 3.5 — Popup usability, resizable panels, and chrome deduplication pass

Implementation anchors:

- Architecture paragraphs: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-4-P04..P06`, `ARCH-6.14-P01..P06`, `ARCH-11.4-P01`.
- pnpm packages: Phase 3.5: No new package install.

Update. Confirm that popup overlays and side-panel size preferences remain ordinary local UI state. Reject detached browser windows, extra browser permissions, remote popup/content loading, background sync, remote sync, File System Access API usage, directory handles, or silent local-file probing.


### Phase 16 — ArchiMate visual editing investigation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.14-P01..P08`, `ARCH-6.10-P01..P13`, `ARCH-5.4-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 16: No package install by default; record investigation result before adding anything.


Update. Add dependency/license review notes for any adopted ArchiMate visual library.

### Phase 19 — Release-envelope verification and accreditation evidence

Implementation anchors:

- Architecture paragraphs: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.20-P01..P07`, `ARCH-11.4-P01`, `ARCH-14-P01..P03`.
- pnpm packages: Phase 19: No new package install by default; any additional scanner must pass the license gate and be recorded in RAPID.


Update. Finalize reusable browser-envelope checks for static/extension/PWA targets and generate evidence artifacts.

## Tests and definition of done

Browser-envelope checks for CSP, manifests, service workers, remote assets, forbidden privileged APIs, browser-managed storage boundaries, command-palette local execution assumptions, and dependency licenses.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 3 closure note

The package now includes executable runtime/check/test entrypoints in addition to the TypeScript contract mirror, and the default profile covers forbidden privileged filesystem APIs plus archive-boundary documentation. Focused `lint` and `test` checks pass for the package, and the broader workspace verification passes through `corepack pnpm verify`.

## Phase 3.1 closure note

React and React DOM are now part of the delivered shell dependency set, and the Phase 3.1 shell checks re-run the open-source license gate against both packages. The shell-level verification also continues to reject privileged browser and filesystem APIs and preserves the source-owned classic loader path for the local runnable artifact.

## Phase 3.2 closure note

The default profile now includes an explicit browser-managed storage-boundary check in addition to the earlier archive-boundary and forbidden-filesystem checks. Phase 3.2 validation covers the Dexie/IndexedDB workspace boundary, the dedicated storage-boundary notes document, and the continued absence of File System Access API, directory handles, background sync, remote sync, and silent local file access in the shipped shell.

## Phase 3.3 closure note

The default profile now also checks the local command-dispatch boundary introduced by the shell command palette. Phase 3.3 validation confirms that command execution stays bundled and local to the shell, without implying a plugin permission system, external package loading, or remote command execution.
