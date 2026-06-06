# WP-LUA-VIRTUAL-HOST-01 Validation Checklist

## Scope

`WP-LUA-VIRTUAL-HOST-01` validates the corrective browser-first Fengari host and the TextForge-owned Lua virtual host modules required by ADR-0004.

## Required Checks

- The web loader does not import or install a runtime `process` shim.
- Vite keeps only the compile-time `process.env.FENGARICONF` replacement required by Fengari configuration.
- The web build artifact does not contain loader-installed `globalThis.process` or `window.process`.
- The web build artifact does not expose reachable Fengari Node startup signatures for `child_process`, `tmpNameSync`, or Node `path.resolve(process.cwd())`.
- Lua `require` and `package` remain TextForge-owned.
- `require("tf")`, `require("tf.env")`, `require("tf.fs")`, and `require("tf.time")` succeed.
- `io`, `os`, `fs`, `path`, `process`, `tmp`, and `child_process` module requests are denied with TextForge diagnostics.
- Workspace reads through `tf.fs` use workspace services.
- Workspace writes through `tf.fs` are denied by default.
- Workspace writes through `tf.fs` succeed only when the host grants `workspaceWrite`.
- Folder creation through `tf.fs` is denied unless the host grants `workspaceCreateFolder`.

## Validation Evidence

- `corepack pnpm --filter @textforge/lua test`
- `corepack pnpm --filter @textforge/lua build`
- `corepack pnpm --filter @textforge/textforge-web build`
- `msedge --headless=new --disable-gpu --virtual-time-budget=5000 --dump-dom "file:///C:/Stuff/TextForge/apps/textforge-web/dist/index.html?luaConsole=1&luaConsoleCommand=<tf.env smoke command>"`

## Notes

- `io` and `os` compatibility modules remain deferred. If added, they must be TextForge-owned compatibility modules, not Fengari defaults.
