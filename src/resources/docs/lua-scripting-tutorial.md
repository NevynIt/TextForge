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
