# @textforge/archimate

## Selected package

`@textforge/archimate`

## Files created

None.

## Files modified

None.

## Files removed

None.

## Before / after public export comparison

The package has no runtime `src/index.js` and no package export map. The TS placeholder root exports only:

- `contributions`

No source change was made, so the public placeholder export is unchanged.

## Import compatibility notes

- No public package root export map exists today.
- No runtime JS entrypoint was fabricated.
- No external deep imports into `@textforge/archimate/src` or `@textforge/archimate/dist` were found.

## Commands run

- `corepack pnpm --filter @textforge/archimate lint`
- `corepack pnpm --filter @textforge/archimate typecheck`
- `corepack pnpm --filter @textforge/archimate test`
- `corepack pnpm --filter @textforge/archimate build`
- `rg "@textforge/(archimate|tables|examples-docs)/src/|@textforge/(archimate|tables|examples-docs)/dist/" apps packages --glob '!**/node_modules/**'`

## Test/build results

All package-local commands passed through their existing placeholder scripts.

## Remaining risks or manual checks

This is report-only because the package is a skeleton. Future ArchiMate implementation should split real runtime modules when a runtime entrypoint is introduced.
