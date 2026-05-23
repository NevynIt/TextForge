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
actions
run selection
run itm-to-graph
action uppercase-itm-labels
open run selection
open run itm-to-graph
open last
```

`open <command>` runs the command and opens the returned text/model as a new editor document.
`run selection` executes the currently selected Lua text from the active editor and maps runtime diagnostics back to the selected source lines.

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

## Runtime Limits

The shipped Lua sandbox applies host-side limits so experiments fail predictably instead of hanging the UI. The current defaults are:

- 1,000,000 instructions;
- 500 ms wall time;
- 2 MiB printed output;
- recursion depth 200;
- 20,000 model nodes;
- 50,000 model edges;
- 500,000 table cells.
