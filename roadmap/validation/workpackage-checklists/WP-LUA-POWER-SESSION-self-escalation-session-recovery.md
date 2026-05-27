# WP-LUA-POWER-SESSION Validation Checklist

## Scope

`WP-LUA-POWER-SESSION` validates the shipped Lua power-session follow-on on top of validated `WP-LUA`. The delivered slice must let the Lua console self-elevate into an approved host-object surface without a second prompt, keep that elevation session-scoped and visible, and provide a one-click recovery path that skips Lua preload exactly once on the next boot.

## Required checks

- Lua console code can call `require("tf.power").elevate()` and receive elevated session metadata immediately.
- Elevated state remains scoped to the current Lua console session key and does not become a workspace-wide default.
- No auto-expire, watchdog, or forced downgrade timer exists for the elevated session.
- Approved power-session host objects are limited to the shipped surface: `workspace`, `automation`, and `surfaces`.
- The Lua console surface displays a clear elevated-state marker while the session is elevated.
- The Lua console surface exposes a one-click `Restart In Safe Mode` recovery action only while elevated.
- Recovery persists the workspace through the normal browser-managed persistence path, restarts the app, skips Lua preload and Lua bootstrap commands once on the next boot, then clears that one-shot skip marker.
- Saved workspace content remains available after recovery restart.
- Lua console transcript state is not restored after restart.

## Validation evidence

- `corepack pnpm --filter @textforge/lua test`
- `corepack pnpm --filter @textforge/lua build`
- `corepack pnpm --filter @textforge/lua typecheck`
- `corepack pnpm --filter @textforge/textforge-web test`
- `corepack pnpm --filter @textforge/textforge-web build`
- `corepack pnpm verify`
- Manual in-app browser validation on 2026-05-27: elevated badge visible, restart button visible, app restart confirmed, `Lua preload skipped once` visible after recovery, and a normal reload cleared the one-shot skip state.

## Notes

- The current validated rollout intentionally exposes only approved `workspace`, `automation`, and `surfaces` helpers. Broader shell/command-dispatch exposure remains a later, separately reviewed contract decision.
- Browser automation in this environment was not the authoritative UI evidence for this workpackage; the acceptance UI behavior was manually confirmed in the in-app browser after the focused package and shell checks passed.
