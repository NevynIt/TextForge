# @textforge/lua — Package Implementation Guide

## Purpose

Fengari worker, sandbox, tf.* bridge, Lua editor/console surfaces, Lua action discovery, and Lua-backed pipeline steps.

## Ownership rule

`@textforge/lua` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/pipeline`
- `@textforge/editors`

Third-party candidates: Fengari, optional xterm.js. All third-party dependencies must pass the open-source license gate.

## Public surface

Lua worker service, sandbox configuration, tf.* bridge, Lua console/editor surfaces, Lua action contribution API.

## Milestone plan

### Phase 3.1–3.3 — Recovery-phase compatibility

No direct Lua feature work. These phases establish React shell usability, Dexie persistence, and shell-command composition. This package should not be started early, but later work must consume the resulting workspace, surface, and command contracts through public interfaces.

### Phase 8 — Lua automation

Create. Fengari worker, sandbox, tf.* capability bridge, Lua editor/console surfaces, action discovery, pipeline action adapter.

## Tests and definition of done

Sandbox tests, tf.* capability tests, no DOM/network/filesystem tests, action discovery tests.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.
