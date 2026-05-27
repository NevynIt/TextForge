# TextForge Lua Guide

TextForge runs Lua locally inside a restricted Fengari sandbox. The shipped runtime is intentionally small: it supports ordinary Lua code, a pipeline-style `input` value, a few bundled `tf.*` modules, workspace `require(...)` for user `.lua` files, and an optional elevated power session for approved host objects.

## Console Basics

The Lua Console accepts normal Lua statements and expressions:

```lua
print(2 + 2)
a = 5
return a
```

Useful console shortcuts:

```text
help
:help
.help
=2 + 2
```

- `help`, `:help`, and `.help` print the built-in console summary.
- `=...` forces expression evaluation without writing `return`.
- Console sessions are persistent. Globals set in one command remain available in later commands until that console session is closed.

## Input Value

The global `input` value mirrors the focused text resource or the pipeline input passed to the current Lua run.

Common fields:

- `input.kind`
- `input.value`
- `input.text` for `text*` inputs
- `input.resource`
- `input.metadata`

Shipped helper methods on `input`:

- `input:emit_text(languageId, text)`
- `input:emit_json(value)`
- `input:diagnostic(severity, message)`

Minimal example:

```lua
return function(input)
  return input:emit_text("plaintext", string.upper(input.text))
end
```

## Bundled Modules

These bundled modules are available today:

- `require("tf")`
- `require("tf.pipeline")`
- `require("tf.actions")`
- `require("tf.console")`
- `require("tf.power")`

The global `tf` table is also preloaded.

### `require("tf")`

Shipped helpers:

- `tf.emit_json(value)`

### `require("tf.pipeline")`

Shipped helpers:

- `tf.pipeline.list()`
- `tf.pipeline.run("id", input)`

`tf.pipeline.list()` returns the active current-document pipeline local names that the workbench supplied for the current run.

`tf.pipeline.run("id", input)` is intentionally limited:

- it can run Lua-defined pipeline steps that are already available inside the current Lua runtime;
- it can run deliberately runtime-wired synchronous steps when the host explicitly provides a bridge;
- it does not broadly dispatch arbitrary built-in app pipelines.

That last gap is deliberate. The real built-in pipeline runner is asynchronous, while the current Lua bridge is synchronous. General built-in pipeline execution should not be exposed until that async boundary is designed explicitly.

### `require("tf.actions")`

Shipped helpers:

- `tf.actions.list()`
- `tf.actions.run("id", input)`

These operate on discovered Lua automations/actions that are already loaded into the current runtime.

### `require("tf.console")`

Shipped helpers:

- `tf.console.inspect(value)`

This writes a structured inspection line into the Lua console transcript and returns the same value.

### `require("tf.power")`

Shipped helpers:

- `tf.power.status()`
- `tf.power.elevate()`
- `tf.power.workspace()`
- `tf.power.automation()`
- `tf.power.surfaces()`
- `tf.power.registry()`

The power session starts disabled. `tf.power.elevate()` enables the approved host-object surface for the current console session only.

Power-session scope:

- elevation is per console session;
- it does not become a workspace-wide default;
- it persists until that session is closed or the app is restarted;
- `Restart In Safe Mode` clears the elevated session and skips Lua preload once on the next boot.

Current host objects:

- `tf.power.workspace()`
  Exposes approved workspace inspection and text-resource mutation helpers such as `getManifest()`, `listResources()`, `listFolders()`, `getEntryByPath(...)`, `createFolder(...)`, `createTextResource(...)`, `saveTextResource(...)`, and `resolveReference(...)`.
- `tf.power.automation()`
  Exposes Lua automation inspection and control through `list()`, `discover()`, and `run(id, input)`.
- `tf.power.surfaces()`
  Exposes surface-session helpers through `listOpenSurfaceSessions()`, `openResourcePath(...)`, `focusSession(...)`, and `closeSession(...)`.
- `tf.power.registry()`
  Exposes a read-only inspector-style registry surface through `snapshot()`, `summary()`, `document()`, `packages()`, `diagnostics()`, `listCommands()`, `listSurfaces()`, `listPipelines()`, and `listMarkdownFenceHandlers()`.

Registry and other power-session host objects are bridged into Lua as cloned values and approved functions. They are for inspection and explicit helper calls, not direct access to live internal shell objects.

## Requiring Workspace Modules

User `.lua` files can be required by module name. Resolution starts from the active script folder, then falls back to:

- `/lua`
- `/lib`
- `/.textforge/automation/lua`

There is no filesystem, package-manager, network, or JavaScript module resolution.

## Sandbox Limits

The shipped defaults are:

- 1,000,000 instructions
- 500 ms wall time
- 2 MiB of console output
- 8 nested Lua calls

These limits are host-side guardrails so bad scripts fail predictably instead of hanging the UI.

## Blocked Globals And Modules

Blocked browser-like globals:

- `window`
- `document`
- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `localStorage`
- `indexedDB`
- `importScripts`
- `Function`
- `eval`

Disabled/removed Lua globals:

- `dofile`
- `loadfile`
- `load`
- `collectgarbage`

Blocked module requests:

- `io`
- `os`
- `socket`
- `js`

## Not Shipped

The current runtime does not ship broader browser, DOM, network, filesystem, or JavaScript interop, and it does not ship the older experimental helper surface that appeared in some early notes. Treat this guide as the source of truth for what is available today.
