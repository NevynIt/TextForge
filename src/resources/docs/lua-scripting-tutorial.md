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
  id = "uppercase-itt-labels",
  name = "Uppercase ITT labels",
  category = "Lua Transform",
  input = "text.indented-tree",
  output = "text.indented-tree",
  run = function(input)
    local nodes = input:parse_itt()
    tree.walk(nodes, function(node)
      node.label = string.upper(node.label)
    end)
    return input:emit_itt(nodes)
  end
}
```

## Built-In Bridges

- `input:parse_itt()`
- `input:parse_markdown()`
- `input:emit_text(languageId, text)`
- `input:emit_json(value)`
- `input:emit_itt(nodes)`
- `tf.pipeline.run("itt-to-tree", input)`
- `tf.pipeline.run("itt-to-graph", input)`
- `tf.pipeline.run("markdown-heading-tree", input)`
- `tf.actions.run("action-id", input)`
- Console helper: `run("itt-to-graph")`
- Console helper: `run_action("action-id")`
- Console helper: `action("action-id")`
- Console helper: `parse_itt()`
- Console helper: `parse_markdown()`

## Lua Console Shortcuts

The Lua Console accepts normal Lua snippets and a few convenience commands:

```text
help
actions
run selection
run itt-to-graph
action uppercase-itt-labels
open run selection
open run itt-to-graph
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
- `tf.itt`
- `tf.markdown`
- `tf.pipeline`
- `tf.actions`
- `tf.console`
