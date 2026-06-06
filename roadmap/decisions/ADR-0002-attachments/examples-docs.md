# @textforge/examples-docs

## Selected package

`@textforge/examples-docs`

## Files created

None.

## Files modified

None.

## Files removed

None.

## Before / after public export comparison

The package has no runtime `src/index.js` and no package export map. The TS-only root exports:

- `DocumentationTopic`
- `SampleWorkspaceConvention`
- `PackageDocumentationTemplate`
- `docsIndex`
- `contributions`

No source change was made, so the TS-only public placeholder/documentation surface is unchanged.

## Import compatibility notes

- No public package root export map exists today.
- No runtime JS entrypoint was fabricated.
- No external deep imports into `@textforge/examples-docs/src` or `@textforge/examples-docs/dist` were found.

## Commands run

- `corepack pnpm --filter @textforge/examples-docs lint`
- `corepack pnpm --filter @textforge/examples-docs typecheck`
- `corepack pnpm --filter @textforge/examples-docs test`
- `corepack pnpm --filter @textforge/examples-docs build`
- `rg "@textforge/(archimate|tables|examples-docs)/src/|@textforge/(archimate|tables|examples-docs)/dist/" apps packages --glob '!**/node_modules/**'`

## Test/build results

All package-local commands passed through their existing placeholder scripts.

## Remaining risks or manual checks

This is report-only because the package has no runtime entrypoint. Future documentation runtime exports should be split when an export map is introduced.
