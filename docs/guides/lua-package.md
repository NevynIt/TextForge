# TextForge Lua Package Guide

## Power Session Host Objects

The current approved host-object surface is `workspace`, `automation`, `surfaces`, and the read-only `registry` inspector view.

## Pipeline Catalog

The console reflects the active pipeline catalog for the current document through `tf.pipeline.list()`.

## Limitations

- No broad built-in pipeline execution through `tf.pipeline.run(...)` (only Lua-defined or selectively runtime-wired steps).
- Many bundled pipeline contributions are asynchronous while the current Lua bridge remains synchronous.

## See Also
- [Lua Guide](lua-guide.md)
- [Plugin Development Guide](plugin-dev.md)
- [User Guide](user-guide.md)
