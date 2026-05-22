# TextForge Lua Extension Development

TextForge no longer exposes user-uploaded JavaScript plugins. User extensibility is Lua; trusted TypeScript/JavaScript plugins remain an internal application mechanism for packaged parsers, viewers, serializers, and pipelines.

Lua scripts run locally in a restricted Fengari sandbox. They do not receive browser globals, DOM access, network APIs, filesystem APIs, or JavaScript interop.

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

## Host API

- `input.text`
- `input.languageId`
- `input.fileName`
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

Workspace `.lua` files can also be required as local user modules by name. Resolution starts from the active script folder, then falls back to `/lua`, `/lib`, and `/.textforge/automation/lua`. Unknown modules fail with a TextForge module-not-found error. There is no filesystem, network, native library, or JavaScript module searcher.

## Runtime Limits

The current sandbox enforces execution and payload limits. By default, a run is capped at 1,000,000 instructions, 500 ms wall time, 2 MiB of printed output, recursion depth 200, 20,000 model nodes, 50,000 model edges, and 500,000 table cells.
