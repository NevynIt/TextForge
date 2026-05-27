# TextForge Lua Guide

TextForge runs Lua locally inside a restricted Fengari sandbox. The shipped runtime is intentionally small: it supports ordinary Lua code, a pipeline-style `input` value, a few bundled `tf.*` modules, workspace `require(...)` for user `.lua` files, and an optional elevated power session for approved host objects.

This guide is the bundled user reference for the Lua console and Lua scripts that ship today.

## Choose The Right Workflow

Use the Lua console when you want to:

- try a quick expression;
- inspect the current document input;
- list actions or pipelines available to the focused document;
- probe the power-session host objects before writing a full script.

Use a Lua script when you want to:

- rerun a transform on demand;
- keep logic in versioned workspace files;
- build Lua automations under `/.textforge/automation/lua`;
- split reusable helpers into modules under `/lua` or `/lib`.

## Console Basics

The Lua console accepts normal Lua statements and expressions:

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

### First Console Examples

Inspect the current document input:

```lua
return {
  kind = input.kind,
  hasText = input.text ~= nil,
  path = input.resource and input.resource.path or nil,
}
```

Print and inspect values:

```lua
local console = require("tf.console")

print("Current kind:", input.kind)
console.inspect({
  textPreview = input.text and string.sub(input.text, 1, 80) or nil,
  metadata = input.metadata,
})
```

Check whether the current console is elevated:

```lua
local power = require("tf.power")
return power.status()
```

### Console Session Persistence

Values survive between commands in the same console session:

Command 1:

```lua
title = "Release Notes"
```

Command 2:

```lua
return string.lower(title)
```

That persistence is useful for small experiments, but longer logic belongs in workspace `.lua` files.

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

### Minimal Text Transform

```lua
return function(input)
  return input:emit_text("plaintext", string.upper(input.text))
end
```

### JSON Output Example

```lua
local tf = require("tf")

return function(input)
  local text = input.text or ""
  local lineCount = 0
  for _ in string.gmatch(text, "[^\n]+") do
    lineCount = lineCount + 1
  end

  return tf.emit_json({
    kind = input.kind,
    characters = #text,
    lines = lineCount,
    path = input.resource and input.resource.path or nil,
  })
end
```

### Diagnostic Output Example

```lua
return function(input)
  if not input.text or input.text == "" then
    return input:diagnostic("warning", "The current document is empty.")
  end

  return input:emit_text("plaintext", input.text)
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

Example:

```lua
local tf = require("tf")

return tf.emit_json({
  ok = true,
  kind = input.kind,
})
```

### `require("tf.pipeline")`

Shipped helpers:

- `tf.pipeline.list()`
- `tf.pipeline.run("id", input)`

`tf.pipeline.list()` returns the active current-document pipeline local names that the workbench supplied for the current run.

Example:

```lua
local pipeline = require("tf.pipeline")
return pipeline.list()
```

`tf.pipeline.run("id", input)` is intentionally limited:

- it can run Lua-defined pipeline steps that are already available inside the current Lua runtime;
- it can run deliberately runtime-wired synchronous steps when the host explicitly provides a bridge;
- it does not broadly dispatch arbitrary built-in app pipelines.

That last gap is deliberate. The real built-in pipeline runner is asynchronous, while the current Lua bridge is synchronous. General built-in pipeline execution should not be exposed until that async boundary is designed explicitly.

Example of a deliberately limited pipeline-to-pipeline call:

```lua
local pipeline = require("tf.pipeline")

return function(input)
  local cleaned = pipeline.run("cleanup-title", input)
  return pipeline.run("decorate-title", cleaned)
end
```

Use that pattern only when those named Lua steps are already loaded into the current runtime. Do not assume built-in application pipelines are callable from Lua.

### `require("tf.actions")`

Shipped helpers:

- `tf.actions.list()`
- `tf.actions.run("id", input)`

These operate on discovered Lua automations/actions that are already loaded into the current runtime.

Example:

```lua
local actions = require("tf.actions")
local console = require("tf.console")

console.inspect(actions.list())
return actions.run("slugify-title", input)
```

### `require("tf.console")`

Shipped helpers:

- `tf.console.inspect(value)`

This writes a structured inspection line into the Lua console transcript and returns the same value.

Example:

```lua
local console = require("tf.console")

local value = {
  kind = input.kind,
  path = input.resource and input.resource.path or nil,
}

console.inspect(value)
return value
```

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

## Practical Console Workflows

### List Actions And Pipelines For The Current Document

```lua
local console = require("tf.console")
local actions = require("tf.actions")
local pipeline = require("tf.pipeline")

console.inspect({
  actions = actions.list(),
  pipelines = pipeline.list(),
})
```

### Elevate And Inspect The Registry

```lua
local power = require("tf.power")
power.elevate()

local registry = power.registry()
return {
  summary = registry.summary(),
  commands = registry.listCommands(),
  pipelines = registry.listPipelines(),
}
```

### Elevate And Create A Scratch Note

```lua
local power = require("tf.power")
power.elevate()

local workspace = power.workspace()
workspace.createFolder({
  path = "/notes",
  title = "notes",
})

return workspace.createTextResource({
  path = "/notes/lua-scratch.md",
  title = "lua-scratch.md",
  text = "# Lua Scratch\n\nCreated from the Lua console.",
  languageId = "markdown",
  mimeType = "text/markdown",
})
```

### Inspect And Rerun Lua Automations

```lua
local power = require("tf.power")
power.elevate()

local automation = power.automation()
return {
  available = automation.list(),
  refreshed = automation.discover(),
}
```

## Writing Lua Scripts

The simplest script returns a function that accepts `input` and returns a new value.

### Script Example: Uppercase The Current Text

```lua
return function(input)
  return input:emit_text("plaintext", string.upper(input.text or ""))
end
```

### Script Example: Emit Structured Metadata

```lua
local tf = require("tf")

return function(input)
  local text = input.text or ""
  local words = 0
  for _ in string.gmatch(text, "%S+") do
    words = words + 1
  end

  return tf.emit_json({
    path = input.resource and input.resource.path or nil,
    characters = #text,
    words = words,
    uppercasePreview = string.upper(string.sub(text, 1, 30)),
  })
end
```

### Script Example: Return A Descriptor Table

Lua automations can return a descriptor table with metadata and a `run` function:

```lua
return {
  id = "slugify-title",
  name = "Slugify Title",
  category = "Lua Automation",
  input = "text",
  output = "text",
  description = "Turn the current text into a lowercase slug.",
  run = function(input)
    local text = string.lower(input.text or "")
    text = string.gsub(text, "[^%w]+", "-")
    text = string.gsub(text, "^-+", "")
    text = string.gsub(text, "-+$", "")
    return input:emit_text("plaintext", text)
  end,
}
```

That form is useful for discovered Lua automations because it gives the runtime a stable `id`, display name, category, and description.

### Script Example: Reuse A Local Module

`/lib/text_utils.lua`:

```lua
local module = {}

function module.trim(value)
  local text = value or ""
  text = string.gsub(text, "^%s+", "")
  text = string.gsub(text, "%s+$", "")
  return text
end

function module.slugify(value)
  local text = string.lower(module.trim(value))
  text = string.gsub(text, "[^%w]+", "-")
  text = string.gsub(text, "^-+", "")
  text = string.gsub(text, "-+$", "")
  return text
end

return module
```

`/lua/make-slug.lua`:

```lua
local text_utils = require("text_utils")

return function(input)
  return input:emit_text("plaintext", text_utils.slugify(input.text))
end
```

## Building Lua Automations

Lua automations are discovered from:

- `/.textforge/automation/lua`
- subfolders under `/.textforge/automation/lua`

A practical workflow looks like this:

1. Prototype the logic in the Lua console.
2. Move the logic into a `.lua` file in your workspace.
3. When the script is stable, place it under `/.textforge/automation/lua`.
4. Reload Lua automation discovery.
5. Use `require("tf.actions").list()` or `require("tf.power").automation().list()` to confirm it is available.

### Example Automation Pair

`/.textforge/automation/lua/cleanup-title.lua`:

```lua
return {
  id = "cleanup-title",
  name = "Cleanup Title",
  category = "Lua Automation",
  input = "text",
  output = "text",
  run = function(input)
    local text = input.text or ""
    text = string.gsub(text, "%s+", " ")
    text = string.gsub(text, "^%s+", "")
    text = string.gsub(text, "%s+$", "")
    return input:emit_text("plaintext", text)
  end,
}
```

`/.textforge/automation/lua/decorate-title.lua`:

```lua
return {
  id = "decorate-title",
  name = "Decorate Title",
  category = "Lua Automation",
  input = "text",
  output = "text",
  run = function(input)
    return input:emit_text("plaintext", "*** " .. (input.text or "") .. " ***")
  end,
}
```

Then a third script can compose them with `tf.pipeline.run(...)` only when those steps are already loaded into the current runtime.

## Requiring Workspace Modules

User `.lua` files can be required by module name. Resolution starts from the active script folder, then falls back to:

- `/lua`
- `/lib`
- `/.textforge/automation/lua`

There is no filesystem, package-manager, network, or JavaScript module resolution.

Resolution example:

- `/lua/report/build.lua` can `require("formatters")` and TextForge first looks for `/lua/report/formatters.lua` and `/lua/report/formatters/init.lua`.
- If nothing matches there, it falls back to `/lua`, then `/lib`, then `/.textforge/automation/lua`.

## Common Patterns

### Normalize A Note Before Saving

```lua
return function(input)
  local text = input.text or ""
  text = string.gsub(text, "\r\n", "\n")
  text = string.gsub(text, "\t", "  ")
  return input:emit_text("markdown", text)
end
```

### Build A Quick Document Summary

```lua
local tf = require("tf")

return function(input)
  local text = input.text or ""
  local preview = string.sub(text, 1, 120)
  local lines = 0
  for _ in string.gmatch(text, "[^\n]+") do
    lines = lines + 1
  end

  return tf.emit_json({
    preview = preview,
    lines = lines,
    empty = text == "",
  })
end
```

### Inspect Open Surface Sessions

```lua
local power = require("tf.power")
power.elevate()

local surfaces = power.surfaces()
return surfaces.listOpenSurfaceSessions()
```

## Sandbox Limits

The shipped defaults are:

- 1,000,000 instructions
- 500 ms wall time
- 2 MiB of console output
- 8 nested Lua calls

These limits are host-side guardrails so bad scripts fail predictably instead of hanging the UI.

When a script fails because of limits:

- reduce large loops;
- avoid accidental recursion;
- break experiments into smaller scripts;
- inspect smaller values in the console instead of returning very large payloads.

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

## See Also

- [TextForge User Guide](user-guide.md)
- [TextForge Lua Package Guide](lua-package.md)
- [Plugin Development Guide](plugin-dev.md)
