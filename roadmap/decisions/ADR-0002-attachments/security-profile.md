# @textforge/security-profile

## Selected package

`@textforge/security-profile`

## Files created

- `packages/security-profile/src/result.js`
- `packages/security-profile/src/license.js`
- `packages/security-profile/src/browser-checks.js`
- `packages/security-profile/src/boundary-checks.js`
- `packages/security-profile/src/profile.js`
- `packages/security-profile/src/manifest.js`
- `packages/security-profile/src/types.ts`
- `packages/security-profile/src/checks.ts`
- `packages/security-profile/src/profile.ts`
- `packages/security-profile/src/manifest.ts`

## Files modified

- `packages/security-profile/src/index.js`
- `packages/security-profile/src/index.ts`

## Files removed

None.

## Before / after public export comparison

Before and after runtime exports are identical:

- `contributions`
- `createArchiveBoundaryDocumentationCheck`
- `createBrowserStorageBoundaryCheck`
- `createCspCheck`
- `createForbiddenBrowserApiCheck`
- `createForbiddenFilesystemApiCheck`
- `createLocalCommandDispatchCheck`
- `createLocalUiStateBoundaryCheck`
- `createManifestCheck`
- `createOpenSourceLicenseGate`
- `createRemoteAssetCheck`
- `createSecurityProfile`
- `createServiceWorkerCheck`
- `createVisualIdentityBoundaryCheck`
- `defaultSecurityProfile`
- `runSecurityChecks`

Type exports remain available from `src/index.ts` through the declaration barrel.

## Import compatibility notes

- Package root `@textforge/security-profile` remains the public import path.
- No package manifest or export map changes were made.
- No external deep imports into `@textforge/security-profile/src` or `@textforge/security-profile/dist` were introduced.

## Commands run

- `corepack pnpm --filter @textforge/security-profile lint`
- `corepack pnpm --filter @textforge/security-profile typecheck`
- `corepack pnpm --filter @textforge/security-profile test`
- `corepack pnpm --filter @textforge/security-profile build`
- `node -e "import('./packages/security-profile/src/index.js').then(m => console.log(Object.keys(m).sort().join('\\n')))"`
- `rg "@textforge/security-profile/src/|@textforge/security-profile/dist/" apps packages --glob '!**/node_modules/**'`

## Test/build results

All package-local lint, typecheck, test, and build commands passed.

## Remaining risks or manual checks

The configured package typecheck validates JavaScript syntax only. TypeScript declaration modules were split by inspection and should be covered by any future repository-level TypeScript compiler wiring.
