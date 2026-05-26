# @textforge/lua

Local Lua runtime, reserved-workspace automation discovery, and Lua contribution wiring for TextForge.

Current scope:

- fresh Fengari state per run with instruction and wall-clock limits;
- blocked browser/network/filesystem globals and blocked module requests;
- virtual workspace `require(...)` resolution for `/lua`, `/lib`, and `/.textforge/automation/lua`;
- explicit manual execution and reserved-root automation discovery;
- synthetic Lua pipeline contributions for the canonical contribution registry.
