# WP-LUA Validation Checklist

## Scope

`WP-LUA` validates the optional local Lua automation layer on top of validated `WP-05C` contribution execution. The shipped slice must keep user scripting sandboxed and local while surfacing Lua actions through the same contribution-driven pipeline and surface model as built-in features.

## Required checks

- Lua snippets, workspace Lua files, and reserved-root automation files execute through the same bounded local runtime with fresh state per run.
- Automatic discovery scans only `/.textforge/automation/lua/**/*.lua`; ordinary workspace `.lua` files remain inert unless run manually.
- The runtime exposes curated `tf`, `tf.pipeline`, `tf.actions`, and `tf.console` modules while rejecting blocked module requests such as `io`, `os`, `socket`, and `js`.
- The runtime rejects blocked browser/host globals such as `fetch`, `window`, `document`, and unrestricted evaluation helpers.
- Lua action discovery materializes contribution records that participate in the normal command/pipeline context rather than an app-local side channel.
- The shell surfaces an interactive xterm.js-backed Lua console and can execute a console command from the built `file://` artifact without requiring a dev server.
- Lua execution limits produce structured diagnostics for blocked APIs, contract mismatches, recursion overflow, and runaway loops.
- The delivered profile remains local-only and static-bundle compatible: no remote fetch, no CDN runtime dependency, no filesystem boundary crossing beyond explicit workspace import/export.

## Validation evidence

- `corepack pnpm --filter @textforge/lua lint`
- `corepack pnpm --filter @textforge/lua test`
- `corepack pnpm --filter @textforge/lua build`
- `corepack pnpm --filter @textforge/lua typecheck`
- `corepack pnpm --filter @textforge/core test`
- `corepack pnpm --filter ./apps/textforge-web lint`
- `corepack pnpm --filter ./apps/textforge-web build`
- `corepack pnpm verify`
- `msedge --headless=new --disable-gpu --virtual-time-budget=5000 --dump-dom "file:///C:/Stuff/TextForge/apps/textforge-web/dist/index.html?luaConsole=1&luaConsoleCommand=return%20%22wp-lua-ok%22"`

## Notes

- The current static `file://` build profile keeps Lua execution in-process while enforcing fresh-state execution, blocked module/global access, and hard instruction plus wall-time limits. That satisfies the current roadmap/package-guide expectation to run in a worker where possible without weakening the local-only security posture.
- The browser validation path uses a supported query bootstrap in the built shell so the Lua console surface can be opened and exercised deterministically without relying on a dev server or manual UI timing.
