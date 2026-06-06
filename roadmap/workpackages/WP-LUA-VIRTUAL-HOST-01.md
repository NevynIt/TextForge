# WP-LUA-VIRTUAL-HOST-01 - TextForge Lua virtual host for Fengari

## Registry

- Workpackage ID: `WP-LUA-VIRTUAL-HOST-01`
- Authoritative state: `roadmap-state.yaml`
- Status: `implemented`
- Module: `MOD-SURFACES-UI`
- ADRs: `ADR-0004`

## Outcome

Correct the Fengari browser startup model and ship a TextForge-owned Lua virtual host so Lua automation uses `tf.*` services instead of accidental Node or raw browser APIs.

## Scope

- Keep the web runtime browser-first by avoiding a runtime `globalThis.process` shim.
- Keep only compile-time `process.env.FENGARICONF` replacement for Fengari configuration.
- Add dist checks for runtime process shims and reachable Fengari Node startup paths.
- Provide `tf.env`, `tf.fs`, and `tf.time` through TextForge-owned `require` and `package`.
- Gate workspace mutations through host capabilities and `@textforge/workspace`.
- Deny Node/default host modules such as `io`, `os`, `fs`, `path`, `process`, `tmp`, and `child_process`.

## Non-goals

- Emulating Node APIs in the browser.
- Exposing Fengari default `io`, `os`, `package`, `debug`, or `js` libraries.
- Adding broad `io` or `os` compatibility before a concrete Lua workflow requires it.
- Changing the existing power-session host-object model.

## Package Impact

- `@textforge/textforge-web`: browser-first Fengari startup and dist validation.
- `@textforge/lua`: virtual host modules, host capabilities, blocked-module policy, and tests.
- Roadmap: ADR-0004 registration and corrective workpackage traceability.

## Interfaces / Contracts Changed

Lua scripts may use:

- `require("tf")`
- `require("tf.env")`
- `require("tf.fs")`
- `require("tf.time")`

Workspace writes require `hostCapabilities.workspaceWrite === true`. Workspace folder creation requires `hostCapabilities.workspaceCreateFolder === true`.

## Validation Criteria

- Web build passes without a runtime `process` shim.
- Dist checks reject loader-installed `globalThis.process`.
- Dist checks reject Fengari Node startup signatures for `child_process`, `tmpNameSync`, and Node `path.resolve(process.cwd())` startup code.
- Lua tests cover virtual host module loading, workspace reads/writes, denied default host modules, and denied dangerous operations by default.

## Evidence Required

- `corepack pnpm --filter @textforge/lua test`
- `corepack pnpm --filter @textforge/lua build`
- `corepack pnpm --filter @textforge/textforge-web build`
- RAPID decision/progress entries for ADR acceptance and implementation.

## Open Decisions

- Whether to add TextForge-owned `io` or `os` compatibility modules remains deferred until a real workflow requires those symbols.

## Archive Trace

- Recent Fengari startup shim commits that attempted `os`, `fs`, and `process` browser compatibility.
