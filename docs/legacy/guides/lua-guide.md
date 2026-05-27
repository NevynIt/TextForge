# TextForge Lua Scripting Tutorial

Lua scripts run locally in a restricted Fengari sandbox. They do not receive browser globals, DOM access, networking APIs, filesystem APIs, or JavaScript interop.

## Minimal Transform

```lua
return function(input)
  return input:emit_text("text.plain", string.upper(input.text))
end
```

## Named Action

```lua
local tree = require("tf.tree")

return {
  id = "uppercase-itm-labels",
  name = "Uppercase ITM labels",
  category = "Lua Transform",
  input = "text.itm",
  output = "text.itm",
  run = function(input)
    local nodes = input:parse_itm()
    tree.walk(nodes, function(node)
      node.label = string.upper(node.label)
    end)
    return input:emit_itm(nodes)
  end
}
```

## Built-In Bridges

- `input:parse_itm()`
- `input:parse_markdown()`
- `input:parse_csv(delimiter?)`
- `input:emit_text(languageId, text)`
- `input:emit_json(value)`
- `input:emit_itm(nodes)`
- `input:emit_csv(table, delimiter?)`
- `tf.pipeline.run("itm-to-tree", input)`
- `tf.pipeline.run("itm-to-graph", input)`
- `tf.pipeline.run("markdown-heading-tree", input)`
- `tf.actions.run("action-id", input)`
- Console helper: `run("itm-to-graph")`
- Console helper: `run_action("action-id")`
- Console helper: `action("action-id")`
- Console helper: `parse_itm()`
- Console helper: `parse_markdown()`
- Console helper: `parse_csv(delimiter?)`

CSV parsing returns a table model payload with `columns`, `rows`, `delimiter`, and parser diagnostics. `input:emit_csv(...)` accepts either that payload or a `model.table` value and returns editable `text.csv`.

Workspace `.lua` files can also be required as local user modules by name. Resolution starts from the active script folder, then falls back to `/lua`, `/lib`, and `/.textforge/automation/lua`. There is no filesystem, network, or JavaScript module resolution.

## Lua Console Shortcuts

The Lua Console accepts normal Lua snippets and a few convenience commands:

```text
help
:help
.help
print(2 + 2)
=2 + 2
```

`help`, `:help`, and `.help` print the built-in console summary.
`=...` forces expression evaluation when you want a result value back without wrapping the expression in `return`.

The current console is a persistent Lua session. Variables defined in one command remain available to later commands until the console session is closed.

## What Is Available In The Console Today

- Ordinary Lua statements and expressions.
- `input`, which mirrors the focused text resource as a pipeline-style value.
- `print(...)` for plain console output.
- `require("tf")` for emit helpers.
- `require("tf.pipeline").list()` and `require("tf.pipeline").run("id", input)`.
- `require("tf.actions").list()` and `require("tf.actions").run("id", input)`.
- `require("tf.console").inspect(value)` for structured inspection.
- `require("tf.power").status()` for current power-session state.
- `require("tf.power").elevate()` for immediate session-scoped elevation with no second confirmation.
- `require("tf.power").workspace()` for approved workspace inspection and text-resource mutation helpers.
- `require("tf.power").automation()` for discovered Lua automation inspection and reload/run helpers.
- `require("tf.power").surfaces()` for approved surface/session listing, open, focus, and close helpers.

## Power Session

The shipped Lua Console now has two explicit modes:

- sandbox session: the default, constrained `tf.*` bridge only;
- power session: an elevated console session that exposes an approved host-object surface after `require("tf.power").elevate()`.

Power-session elevation is deliberately scoped:

- it applies only to the current Lua console session;
- it does not auto-expire;
- it does not become a workspace-wide default;
- it clears on restart.

When the session is elevated, the console shows a visible `Power session active...` marker and exposes a `Restart In Safe Mode` recovery action. Recovery restarts the app, skips Lua preload exactly once on the next boot, preserves normally saved workspace content, and does not restore the previous console transcript.

## What Is Not Available Yet

The console still does not expose stable helpers for:

- direct contribution-registry mutation or shell-command dispatcher access;
- arbitrary workbench/internal shell object access outside the approved power-session host-object list;
- unrestricted browser, DOM, network, filesystem, or JavaScript interop.

Those capabilities still need a deliberate contract between the shell and the Lua sandbox rather than ad hoc direct access.

## Bundled Modules

- `tf`
- `tf.tree`
- `tf.graph`
- `tf.table`
- `tf.stringx`
- `tf.itm`
- `tf.markdown`
- `tf.pipeline`
- `tf.actions`
- `tf.console`
- `tf.power`

## Runtime Limits

The shipped Lua sandbox applies host-side limits so experiments fail predictably instead of hanging the UI. The current defaults are:

- 1,000,000 instructions;
- 500 ms wall time;
- 2 MiB printed output;
- recursion depth 200;
- 20,000 model nodes;
- 50,000 model edges;
- 500,000 table cells.
