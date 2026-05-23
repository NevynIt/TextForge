# @textforge/textforge-web

Runnable first shell for the TextForge rebuild.

The built shell is intended to run as a local static artifact. After `build`, `dist/index.html` should open directly from `file://` as well as through a local preview server.

## Commands

- `pnpm --filter @textforge/textforge-web build`
- `pnpm --filter @textforge/textforge-web dev`
- `pnpm --filter @textforge/textforge-web test`

## Verification

- Build the package and open `apps/textforge-web/dist/index.html` directly from `file://`.
- Run `pnpm --filter @textforge/textforge-web test` to catch shell entrypoint regressions.
