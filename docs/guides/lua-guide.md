# TextForge Lua Guide

## Overview

This guide describes the Lua scripting surface in TextForge, including the registry host object, pipeline catalog, and current limitations.

## Lua Console Features

- Run quick snippets, the active Lua document, or selected Lua text.
- List registered Lua actions.
- Inspect the active pipeline catalog for the current document via `tf.pipeline.list()`.
- Inspect a read-only registry snapshot via `require("tf.power").registry()`.
- Store the previous result as a generated workspace file.

## Available Helpers

- `input`, which mirrors the focused text resource as a pipeline-style value.
- `print(...)` for plain console output.
- `require("tf")` for emit helpers.
- `require("tf.pipeline").list()` for the active pipeline catalog.
- `require("tf.pipeline").run("id", input)` for Lua-defined or selectively runtime-wired steps.
- `require("tf.actions").list()` and `require("tf.actions").run("id", input)`.
- `require("tf.console").inspect(value)` for structured inspection.
- `require("tf.power").status()` for current power-session state.
- `require("tf.power").elevate()` for session-scoped elevation.
- `require("tf.power").workspace()` for workspace helpers.
- `require("tf.power").automation()` for Lua automation helpers.
- `require("tf.power").surfaces()` for surface/session helpers.
- `require("tf.power").registry()` for a read-only inspector-style registry snapshot.

## Limitations

- No shell-command dispatcher access or command execution through the registry surface.
- No broad built-in bundled pipeline execution through `tf.pipeline.run(...)` beyond selectively wired steps.
- No unrestricted browser, DOM, network, filesystem, or JavaScript interop.

## See Also
- [User Guide](user-guide.md)
- [Plugin Development Guide](plugin-dev.md)
