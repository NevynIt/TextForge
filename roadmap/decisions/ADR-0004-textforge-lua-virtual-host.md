# ADR-0004 - TextForge Lua Virtual Host for Fengari

Status: Accepted
Date: 2026-06-06
Decision owner: TextForge maintainer
Scope: Lua automation, browser Fengari host identity, workspace integration, package/module loading
Related roadmap packages: `WP-LUA`, `WP-LUA-POWER-SESSION`, `WP-LUA-VIRTUAL-HOST-01`
Related RAPID entries: `D-082`, `P-112`, `P-113`

## Context

TextForge runs Fengari-backed Lua automation in the web shell. Recent crash fixes tried to add browser-side `os`, `fs`, and `process` shims. The startup `process` shim was the wrong direction: once `globalThis.process` exists, Fengari can select Node-oriented branches and look for Node modules such as `io`, `fs`, `path`, `tmp`, `child_process`, and Buffer-dependent code.

TextForge is a browser-first local workbench. Lua automation must not run in a fake Node envelope and must not receive raw browser APIs. It needs a TextForge-owned virtual host with explicit capabilities.

## Decision

TextForge will make the web shell identify as a browser to Fengari and will provide a first-class TextForge Lua Virtual Host.

The web shell must keep `globalThis.process` undefined at runtime. `process.env.FENGARICONF` may remain only as a Vite compile-time replacement so `fengari/src/luaconf.js` can resolve configuration without a runtime `process` object. `process.versions.node` must not be defined unless a focused regression test proves it is required.

Lua code talks to TextForge host services, not Node, raw browser APIs, or Fengari's default file/module loading behavior.

## Accepted Environment

TextForge opens only the safe standard library subset required by the current runtime:

- `_G`
- `table`
- `string`
- `math`
- `utf8`

TextForge does not expose Fengari's default `io`, `os`, `package`, `debug`, or `js` libraries.

TextForge owns `require` and `package`.

Supported module sources:

- TextForge bundled Lua modules.
- Workspace Lua modules from approved roots.
- Future explicit package-contributed Lua modules.

Unsupported module sources:

- Node `require`.
- Raw filesystem search paths.
- Synchronous browser XHR module loading.
- Remote URLs.
- Dynamic native libraries.
- `package.loadlib`.
- Arbitrary browser import/fetch.

## Host Modules

The accepted initial host modules are:

- `tf`
- `tf.env`
- `tf.fs`
- `tf.time`
- Existing TextForge bridge modules such as `tf.pipeline`, `tf.actions`, `tf.console`, and `tf.power`.

`tf.env` exposes stable browser-host facts such as runtime, platform, workspace root, and host capabilities.

`tf.time` exposes minimal time helpers.

`tf.fs` exposes workspace-backed operations only. Reads are enabled by default. Mutations require explicit host capabilities and still go through `@textforge/workspace` services.

## Compatibility Position

Do not emulate Node `fs`, `path`, `process`, `tmp`, `child_process`, or Buffer facilities for Lua.

Lua-facing `io` and `os` compatibility may be added only as TextForge-owned compatibility modules when a real workflow requires them. Dangerous calls such as `os.execute`, `os.exit`, process pipes, temporary host files, and filesystem access outside the workspace must fail with clear TextForge diagnostics.

Defensive browser aliases may exist only to turn accidental Node-path execution into controlled diagnostics. They are not a runtime model and are not part of the Lua API.

## Consequences

- Fengari startup should follow browser branches in the web shell.
- Lua module loading is deterministic and TextForge-owned.
- Workspace access is capability-gated and mediated by `@textforge/workspace`.
- Future host expansion must be recorded in RAPID and, if security-impacting, in a follow-up ADR.

## Validation

- Web build must pass without installing a runtime `process` shim.
- Dist checks must fail if the loader installs `globalThis.process`.
- Dist checks must fail if the Fengari Node-only startup path is reachable through `child_process`, `tmpNameSync`, or Node `path.resolve(process.cwd())` startup code.
- Lua tests must cover `require("tf")`, `require("tf.env")`, `require("tf.fs")`, denied Node/default host modules, denied writes by default, and workspace operations through the virtual host.
