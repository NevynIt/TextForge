# @textforge/lua root modularization

## Package

`@textforge/lua`

## Files created

- `packages/lua/src/automation-discovery.js`
- `packages/lua/src/console.js`
- `packages/lua/src/diagnostics.js`
- `packages/lua/src/execution-service.js`
- `packages/lua/src/manifest.js`
- `packages/lua/src/policy.js`
- `packages/lua/src/runtime.js`
- `packages/lua/src/workspace-modules.js`
- `roadmap/decisions/ADR-0002-attachments/lua.md`

## Files modified

- `packages/lua/src/index.js`

## Files removed

None.

## Public export comparison

Before and after root runtime exports match exactly:

- `contributions`
- `createLuaConsoleSurface`
- `createLuaContributionManifest`
- `createLuaDiagnostic`
- `createLuaExecutionLimits`
- `createLuaExecutionService`
- `defaultLuaExecutionLimits`
- `discoverLuaAutomations`
- `formatLuaConsoleCommandTranscript`
- `isLuaAutomationPath`
- `isLuaConsoleMultilineInput`
- `isLuaResource`
- `listLuaAutomationFiles`
- `luaAutomationRoot`
- `luaBlockedGlobals`
- `luaBlockedModules`
- `luaCapabilities`
- `luaCapabilityIds`
- `luaCommandContributions`
- `luaConsoleResourceMimeType`
- `luaConsoleResourcePath`
- `luaConsoleSurfaceContribution`
- `navigateLuaConsoleHistory`
- `resolveLuaModuleCandidatePaths`
- `runLuaAutomationDefinition`
- `runLuaScript`

`src/index.ts` was already an explicit declaration facade for the same public API and was left unchanged.

## Responsibility split

- `policy.js` owns public policy/constants exports.
- `diagnostics.js` owns diagnostics and execution-limit construction exports.
- `workspace-modules.js` owns Lua resource, automation path, automation file, and module candidate exports.
- `manifest.js` owns command/capability/contribution manifest exports.
- `console.js` owns the public console facade for console resource IDs, transcript helpers, history helpers, surface, and surface contribution exports.
- `automation-discovery.js` owns automation discovery exports.
- `execution-service.js` owns the public execution service facade.
- `runtime.js` is the internal Fengari-backed runtime anchor and preserves the existing execution, console UI, console-session, power-session, bundled-module, and service behavior used by the responsibility modules.

## Import compatibility notes

No package manifest changes were made. The package still exports only `"."` to `./src/index.js`; no export subpaths were added.

Import scan found one external root import and no external deep imports:

- `apps/textforge-web/src/workbench.js` imports from `@textforge/lua`.

Broad deep-path scan found only command/capability/contribution ID strings, not import paths:

- `@textforge/lua/capability/console`
- `@textforge/lua/automation-*`

The repo has no top-level `tests` or `examples` directories to scan; `apps` and `packages` were scanned.

## Commands run

- `Get-ChildItem -Recurse -File -Path packages\lua`
- `git status --short`
- `rg -n "@textforge/lua" apps packages tests examples -S`
- `rg -n "^export (const|function|declare|interface)|^export \{" packages\lua\src\index.js packages\lua\src\index.ts`
- `rg -n "@textforge/lua" apps packages -S`
- `node --check packages\lua\src\index.js`
- `node --check packages\lua\src\runtime.js`
- `node -e "import('./packages/lua/src/index.js').then(m=>console.log(Object.keys(m).sort().join('\n')))"`
- `corepack pnpm --filter @textforge/lua lint`
- `corepack pnpm --filter @textforge/lua typecheck`
- `corepack pnpm --filter @textforge/lua test`
- `corepack pnpm --filter @textforge/lua build`
- `Get-ChildItem packages\lua\src -Filter *.js | ForEach-Object { node --check $_.FullName }`
- `rg -n 'from [''\"]@textforge/lua(/|[''\"])|import\([''\"]@textforge/lua(/|[''\"])|require\([''\"]@textforge/lua(/|[''\"])' apps packages -S`
- `rg -n '@textforge/lua/|packages/lua/src/|packages\\lua\\src\\|\.\./lua/src|\.\./\.\./lua/src' apps packages -g *.js -g *.ts -g *.mjs -g *.md -g package.json -S`
- `node -e "const names=['./packages/lua/src/index.js','./packages/lua/src/runtime.js']; const mods=await Promise.all(names.map(n=>import(n))); for (let i=0;i<names.length;i++) console.log(names[i]+'\n'+Object.keys(mods[i]).sort().join('\n'));"`;

## Test/build results

- Lint: passed.
- Typecheck: passed.
- Test: passed, 17 tests.
- Build: passed.
- Source syntax check: passed for every `packages/lua/src/*.js` file.
- Export comparison: passed, `src/index.js` exposes the same public root export names captured before the refactor.
- Root import scan: passed, one root import in `apps/textforge-web/src/workbench.js`.
- Deep-import scan: passed, no external deep import paths found.

The package commands that import Fengari emit the existing warning: `Accessing non-existent property 'luaopen_string' of module exports inside circular dependency`. Tests pass with this warning.

## Remaining risks or manual checks

- The Fengari runtime, console UI, execution service, and power-session behavior remain anchored in `runtime.js` to avoid changing execution semantics while making the package root an explicit facade. Further internal extraction of those helpers can be done later with a narrower behavior-focused test pass.
- The package `typecheck` and `build` scripts currently run `node --check src/index.js`, so they validate JavaScript syntax rather than TypeScript declarations.
