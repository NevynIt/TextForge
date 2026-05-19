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
- `input:emit_text(languageId, text)`
- `input:emit_json(value)`
- `input:emit_itm(nodes)`
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

Unknown modules fail with a TextForge module-not-found error. There is no filesystem, network, native library, or JavaScript module searcher.
