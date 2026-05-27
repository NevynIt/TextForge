# @textforge/lua

Local Lua runtime, reserved-workspace automation discovery, and Lua contribution wiring for TextForge.

Current scope:

- fresh Fengari state per run with instruction and wall-clock limits;
- blocked browser/network/filesystem globals and blocked module requests;
- virtual workspace `require(...)` resolution for `/lua`, `/lib`, and `/.textforge/automation/lua`;
- explicit manual execution and reserved-root automation discovery;
- current-document pipeline catalog injection for `require("tf.pipeline").list()`;
- synthetic Lua pipeline contributions for the canonical contribution registry;
- a persistent Lua console session with optional self-escalation through `require("tf.power").elevate()`;
- approved power-session host objects for workspace, automation, surfaces, and read-only contribution-registry inspection;
- deliberately limited `require("tf.pipeline").run(...)` support for Lua-defined or explicitly runtime-wired synchronous steps only;
- one-click recovery that restarts the app and skips Lua preload once on the next boot.
