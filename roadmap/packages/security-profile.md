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

Create. Define profile files, open-source license gate, CSP/manifest/service-worker check skeletons, remote asset check, forbidden privileged browser API check.

### Phase 3 — ZIP workspace import/export

Update. Add generic checks for forbidden privileged filesystem APIs and archive boundary documentation. Do not inspect TextForge internal gateway discipline.

### Phase 3.1 — React workbench shell and UI recovery

Update. Re-run and extend dependency/license and browser-envelope checks for React, React DOM, and any adopted shell layout dependencies. Preserve the no-network, no privileged filesystem API, and source-owned runnable-artifact constraints.

### Phase 3.2 — Dexie workspace persistence recovery

Update. Document and check the browser-managed storage boundary. Confirm the implementation does not use File System Access API, directory handles, background sync, remote sync, or silent local file access.

### Phase 3.3 — Command palette and contribution-driven shell commands

Update only if command registration introduces new dependency or browser-envelope implications. The palette is a local command dispatcher, not an external plugin permission system.

### Phase 16 — ArchiMate visual editing investigation

Update. Add dependency/license review notes for any adopted ArchiMate visual library.

### Phase 19 — Release-envelope verification and accreditation evidence

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
