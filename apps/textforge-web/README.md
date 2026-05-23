# @textforge/textforge-web

Runnable first shell for the TextForge rebuild.

The shell is packaged with Vite so package dependencies such as CodeMirror are bundled instead of resolved through browser import-map shims.

## Commands

- `pnpm --filter @textforge/textforge-web build`
- `pnpm --filter @textforge/textforge-web dev --port 4173`
- `pnpm --filter @textforge/textforge-web preview --port 4173`
- `pnpm --filter @textforge/textforge-web test`

## Verification

- Build the package and run the Vite preview server.
- Run `pnpm --filter @textforge/textforge-web test` to catch shell entrypoint regressions.
