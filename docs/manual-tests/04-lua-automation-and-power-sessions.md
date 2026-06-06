# 04 Lua Automation And Power Sessions

## Release Smoke: Lua Console Opens

What to test:

- Lua console is discoverable and can run a simple expression.

How:

1. Open `http://127.0.0.1:4173/?luaConsole=1`.
2. If not opened by URL, run `Open Lua console`.
3. Execute:

```lua
return 2 + 2
```

Expected:

- console opens in a bounded workbench surface or popup;
- result reports `4`;
- previous result area updates;
- no host filesystem, network, or browser-unsafe API is exposed by default.

## Run Selected Lua File

What to test:

- workspace `.lua` resources run manually.

How:

1. Create `/lua/manual-test.lua`.
2. Enter:

```lua
return "manual lua ok"
```

3. Select the resource.
4. Run `Run selected Lua file`.

Expected:

- command is enabled only for Lua resources;
- result reports `manual lua ok`;
- a fresh Lua state is used for the run;
- instruction and wall-clock limits prevent runaway scripts from freezing the app.

## Module Resolution

What to test:

- virtual workspace `require(...)` resolves from allowed Lua roots.

How:

1. Create `/lib/manual_module.lua`:

```lua
local M = {}
function M.message()
  return "module loaded"
end
return M
```

2. Create `/lua/use-module.lua`:

```lua
local manual = require("manual_module")
return manual.message()
```

3. Run `/lua/use-module.lua`.

Expected:

- module resolves from the allowed virtual workspace roots;
- result reports `module loaded`;
- requiring blocked modules such as host filesystem or network modules fails with a clear error.

## Automation Discovery

What to test:

- Lua automations in the reserved root are discoverable and reloadable.

How:

1. Create a Lua file under `/.textforge/automation/lua`.
2. Use the established automation shape from bundled examples or package docs.
3. Run `Reload Lua automation pipelines`.
4. Open the Lua console and list actions or pipelines.
5. Run `Open Lua automation area`.

Expected:

- automation root opens or is created if missing;
- reload updates the available Lua automation list;
- invalid automation files produce diagnostics instead of breaking all automation discovery;
- reserved-root content persists across reload.

## Promote Script To Automation Area

What to test:

- a normal Lua script can be copied or promoted into the automation area.

How:

1. Select a writable Lua file under `/lua`.
2. Run `Promote selected Lua file to automation area`.
3. Inspect `/.textforge/automation/lua`.

Expected:

- promoted file appears in the automation area;
- original file remains unless the command explicitly documents a move;
- promoted path is predictable;
- command is not available for non-Lua resources.

## Pipeline Catalog

What to test:

- Lua can inspect the current document pipeline catalog.

How:

1. Open a Markdown or ITM resource.
2. Open Lua console.
3. Run:

```lua
local pipeline = require("tf.pipeline")
return pipeline.list()
```

Expected:

- result lists pipelines available for the active document context;
- Markdown and ITM resources expose different relevant pipeline entries;
- missing active document produces a clear empty or diagnostic result.

## Power Session Elevation

What to test:

- Lua power sessions elevate explicitly and expose only approved host objects.

How:

1. Open Lua console.
2. Run:

```lua
local power = require("tf.power")
return power.status()
```

3. Run:

```lua
local power = require("tf.power")
power.elevate()
return power.status()
```

4. Inspect available workspace, automation, surfaces, and registry helpers.

Expected:

- initial status is not elevated;
- elevation changes the session state explicitly;
- elevated state is visible in the app status or inspector if exposed;
- read-only registry inspection does not allow arbitrary mutation;
- workspace mutation helpers are limited to approved operations.

## Lua Failure And Recovery

What to test:

- failed preload or bad Lua state can be recovered without losing workspace content.

How:

1. Create an invalid Lua automation file.
2. Reload automation or reload the app.
3. Use the recovery action if the app offers it.
4. Open the app with:

```text
/?luaSkipPreload=1
```

5. Remove or fix the invalid automation.
6. Reload normally.

Expected:

- app shows a clear Lua preload or automation diagnostic;
- recovery can restart while skipping Lua preload once;
- `luaSkipPreload=1` is cleared from non-file URLs after use;
- workspace content remains intact;
- normal Lua loading resumes after the bad file is fixed.

