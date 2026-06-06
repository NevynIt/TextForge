# @textforge/core Modularization Report

## Selected Package

`@textforge/core`

## Current Responsibilities And Split

The package root owns shared constants, resource references and diagnostics, language inference, command registry/dispatch, contribution manifests, contribution registry resolution, document capability activation, inspector projection, and generic pipeline/canonical patch values. The refactor keeps `src/index.js` and `src/index.ts` as explicit public facades and moves implementation into internal modules with a simple dependency direction.

## Files Created

- `packages/core/src/commands.js`
- `packages/core/src/commands.ts`
- `packages/core/src/constants.js`
- `packages/core/src/constants.ts`
- `packages/core/src/contributions.js`
- `packages/core/src/contributions.ts`
- `packages/core/src/identity.js`
- `packages/core/src/identity.ts`
- `packages/core/src/resources.js`
- `packages/core/src/resources.ts`
- `packages/core/src/types.ts`

## Files Modified

- `packages/core/src/index.js`
- `packages/core/src/index.ts`

## Files Removed

None.

## Before Public Runtime Exports

Runtime export count before refactor: 46.

## After Public Runtime Exports

Runtime export count after refactor: 46.

Runtime export comparison result:

- Missing: none.
- Added: none.

## Public Type Facade Exports

Type/declaration export count before refactor: 109.

Type/declaration export count after refactor: 109.

Type facade export comparison result:

- Missing: none.
- Added: none.

## Import Compatibility Notes

The package manifest remains unchanged and still exposes only the package root through `"." : "./src/index.js"` with `"types": "./src/index.ts"`. No new public subpaths were introduced. Existing consumers continue importing from `@textforge/core`. Deep-import scans for `@textforge/core/src/` and `@textforge/core/dist/` found no matches.

## Commands Run

- `Get-ChildItem packages\core\src -Filter *.js | ForEach-Object { node --check $_.FullName }`
- `corepack pnpm --filter @textforge/core lint`
- `corepack pnpm --filter @textforge/core typecheck`
- `corepack pnpm --filter @textforge/core test`
- `corepack pnpm --filter @textforge/core build`
- `node -e "import('./packages/core/src/index.js').then(m => console.log(Object.keys(m).sort().join('\\n')))"`
- Runtime export comparison against `git show HEAD:packages/core/src/index.js`
- Type facade export comparison against `git show HEAD:packages/core/src/index.ts`
- `rg "@textforge/core/src/|@textforge/core/dist/" apps packages --glob '!**/node_modules/**'`
- `rg "from '@textforge/core'|from \"@textforge/core\"" apps packages --glob '!**/node_modules/**'`

## Test And Build Results

All package lint, typecheck, test, and build commands passed. The package test suite passed 6 tests. An additional syntax pass over every split JavaScript module passed.

## Remaining Risks Or Manual Checks

The package `typecheck` and `build` scripts currently perform JavaScript syntax checks rather than TypeScript semantic validation. Full repository validation remains required after roadmap closeout.
