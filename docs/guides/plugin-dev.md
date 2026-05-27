# TextForge Plugin Development Guide

## Lua Pipeline and Action Helpers

- `input:parse_markdown()`
- `input:parse_csv(delimiter?)`
- `input:emit_text(languageId, text)`
- `input:emit_json(value)`
- `input:emit_itm(nodes)`
- `input:emit_csv(table, delimiter?)`
- `tf.pipeline.list()`
- `tf.pipeline.run("id", input)` for Lua-defined or selectively runtime-wired steps
- `tf.actions.run("action-id", input)`

## Registry and Power Session

- `require("tf.power").registry()` for a read-only inspector-style registry snapshot, package summaries, commands, surfaces, pipelines, and Markdown fence handlers.

## Limitations

- No shell-command dispatcher access or command execution through the registry surface.
- No broad built-in bundled pipeline execution through `tf.pipeline.run(...)` beyond selectively wired steps.

## See Also
- [Lua Guide](lua-guide.md)
- [User Guide](user-guide.md)
